from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.core.enums import ChatRole


class ChatRequest(BaseModel):
    message: str
    conversation_id: UUID | None = None


class ChatResponse(BaseModel):
    conversation_id: UUID
    response: str


class ConversationSummary(BaseModel):
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConversationListResponse(BaseModel):
    conversations: list[ConversationSummary]


class ChatMessageOut(BaseModel):
    id: UUID
    role: ChatRole
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationDetailResponse(BaseModel):
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[ChatMessageOut]

    model_config = {"from_attributes": True}
