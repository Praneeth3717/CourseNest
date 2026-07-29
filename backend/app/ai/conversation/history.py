# app/ai/history.py
from uuid import UUID

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.chat_message import ChatMessage, ChatRole
from app.models.conversation import Conversation

MAX_HISTORY_MESSAGES = 20


async def get_or_create_conversation(
    db: AsyncSession,
    student_id: UUID,
    conversation_id: UUID | None,
) -> tuple[Conversation, bool]:
    """Returns (conversation, is_new)."""
    if conversation_id is not None:
        result = await db.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.student_id == student_id,
            )
        )
        existing = result.scalar_one_or_none()
        if existing is not None:
            return existing, False

    conversation = Conversation(student_id=student_id)
    db.add(conversation)
    await db.flush()  # get conversation.id without committing yet
    return conversation, True


async def load_history(
    db: AsyncSession,
    conversation_id: UUID,
    limit: int = MAX_HISTORY_MESSAGES,
) -> list[BaseMessage]:

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
    )
    rows = list(result.scalars().all())
    rows.reverse()  # back to chronological order

    history: list[BaseMessage] = []
    for row in rows:
        if row.role == ChatRole.USER:
            history.append(HumanMessage(content=row.content))
        else:
            history.append(AIMessage(content=row.content))
    return history


async def save_turn(
    db: AsyncSession,
    conversation_id: UUID,
    user_text: str,
    assistant_text: str,
) -> None:
    db.add_all(
        [
            ChatMessage(
                conversation_id=conversation_id, role=ChatRole.USER, content=user_text
            ),
            ChatMessage(
                conversation_id=conversation_id,
                role=ChatRole.ASSISTANT,
                content=assistant_text,
            ),
        ]
    )
    await db.commit()


async def list_conversations(db: AsyncSession, student_id: UUID) -> list[Conversation]:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.student_id == student_id)
        .order_by(Conversation.updated_at.desc())
    )
    return list(result.scalars().all())


async def get_conversation_detail(
    db: AsyncSession,
    student_id: UUID,
    conversation_id: UUID,
) -> Conversation | None:
    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.id == conversation_id,
            Conversation.student_id == student_id,
        )
        .options(selectinload(Conversation.messages))
    )
    return result.scalar_one_or_none()
