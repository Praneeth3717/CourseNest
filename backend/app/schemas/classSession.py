from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.classSession import SessionStatusEnum


class MessageResponse(BaseModel):
    message: str


class SessionData(BaseModel):
    id: UUID
    course_id: UUID
    teacher_id: UUID

    title: str
    description: str | None

    scheduled_start: datetime
    duration_hours: float

    attendance_marked: bool
    status: SessionStatusEnum

    teacher_response_message: str | None
    responded_at: datetime | None

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SessionCreate(BaseModel):
    title: str = Field(..., max_length=255)
    description: str | None = None
    scheduled_start: datetime
    duration_hours: float = Field(..., gt=0)


class SessionListResponse(BaseModel):
    items: list[SessionData]
    total: int
    page: int
    limit: int
    total_pages: int


class SessionUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    description: str | None = None
    scheduled_start: datetime | None = None
    duration_hours: float | None = Field(None, gt=0)


class SessionResponseAction(BaseModel):
    status: SessionStatusEnum
    message: str | None = None
