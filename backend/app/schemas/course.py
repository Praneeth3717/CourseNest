from typing import Optional
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.enrollment import CourseStudentResponse
from app.core.enums import CourseStatus


class MessageResponse(BaseModel):
    message: str


class CourseData(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    teacher_id: UUID | None

    name: str
    code: str

    description: str | None
    thumbnail: str | None

    duration_hours: float | None
    price: float | None

    status: CourseStatus

    created_at: datetime
    updated_at: datetime


class CourseTeacherSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    phone: str | None
    profile_image: str | None
    specialization: str | None
    qualification: str | None


class CourseResponse(CourseData):
    completed_hours: float = 0
    progress_percentage: float = 0

    teacher: CourseTeacherSummary | None = None

    is_enrolled: bool | None = None


class CourseListResponse(BaseModel):
    items: list[CourseResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class CourseDropdownResponse(BaseModel):
    id: UUID
    name: str
    code: str


class CourseStudentListResponse(BaseModel):
    items: list[CourseStudentResponse]
    total: int
    page: int
    limit: int
    total_pages: int
