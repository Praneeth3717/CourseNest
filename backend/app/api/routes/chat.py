from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Response

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.conversation.history import get_conversation_detail, list_conversations
from app.ai.service import AIService
from app.core.dependencies import get_current_user
from app.db.session import get_db

from app.models.user import User
from app.models.conversation import Conversation

from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationDetailResponse,
    ConversationListResponse,
    ConversationSummary,
)

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def chat(
    data: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ai_service = AIService()

    conversation_id, response = await ai_service.chat(
        message=data.message,
        current_user=current_user,
        db=db,
        conversation_id=data.conversation_id,
    )

    return ChatResponse(
        conversation_id=conversation_id,
        response=response,
    )


@router.get("/conversations", response_model=ConversationListResponse)
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conversations = await list_conversations(db, student_id=current_user.student.id)
    return ConversationListResponse(
        conversations=[ConversationSummary.model_validate(c) for c in conversations]
    )


@router.get(
    "/conversations/{conversation_id}", response_model=ConversationDetailResponse
)
async def get_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conversation = await get_conversation_detail(
        db, student_id=current_user.student.id, conversation_id=conversation_id
    )
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        )

    return ConversationDetailResponse.model_validate(conversation)


from fastapi import Response
from sqlalchemy import delete


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        delete(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.student_id == current_user.student.id,
        )
    )

    if result.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    await db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
