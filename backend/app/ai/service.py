from uuid import UUID

from langchain_core.messages import AIMessage, HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.conversation.filler import is_filler_message, filler_reply
from app.ai.conversation.history import (
    get_or_create_conversation,
    load_history,
    save_turn,
)
from app.ai.conversation.titles import generate_conversation_title
from app.ai.graph.context import RuntimeContext
from app.ai.graph.runtime import run_graph, GraphInvocationError
from app.models import User
from app.services.student_token_quota import enforce_token_quota, consume_tokens

NEW_CONVERSATION_TITLE = "New Chat"


class AIService:
    async def chat(
        self,
        message: str,
        current_user: User,
        db: AsyncSession,
        conversation_id: UUID | None = None,
    ) -> tuple[UUID, str]:
        conversation, is_new = await get_or_create_conversation(
            db,
            student_id=current_user.student.id,
            conversation_id=conversation_id,
        )

        needs_title = is_new or conversation.title == NEW_CONVERSATION_TITLE
        if needs_title:
            conversation.title = await generate_conversation_title(message)

        if is_filler_message(message):
            answer = filler_reply()
            await save_turn(
                db, conversation.id, user_text=message, assistant_text=answer
            )
            return conversation.id, answer

        history = await load_history(db, conversation.id)
        state = {"messages": [*history, HumanMessage(content=message)]}

        await enforce_token_quota(db=db, student_id=current_user.student.id)

        context = RuntimeContext(
            student_id=current_user.student.id,
            student_name=current_user.student.full_name,
            db=db,
        )

        try:
            result = await run_graph(state, context)
        except GraphInvocationError as exc:
            return conversation.id, exc.user_message

        last_message = result["messages"][-1]
        usage = last_message.usage_metadata or {}
        total_tokens = usage.get("total_tokens", 0)
        if total_tokens > 0:
            await consume_tokens(
                db=db, student_id=current_user.student.id, tokens_used=total_tokens
            )

        answer = (
            last_message.content
            if isinstance(last_message, AIMessage)
            else str(last_message.content)
        )

        await save_turn(db, conversation.id, user_text=message, assistant_text=answer)
        return conversation.id, answer
