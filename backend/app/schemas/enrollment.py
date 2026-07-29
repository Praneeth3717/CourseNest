from uuid import UUID
from datetime import datetime
from math import ceil

from pydantic import BaseModel, ConfigDict, Field


class MessageResponse(BaseModel):
    message: str


class StudentEnrollmentRequest(BaseModel):
    course_id: UUID


class EnrollmentData(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID

    student_id: UUID
    course_id: UUID

    student_name: str
    course_name: str

    progress_percentage: float
    is_completed: bool
    certificate_url: str | None

    enrolled_at: datetime


class EnrollmentResponse(BaseModel):
    message: str
    data: EnrollmentData


class EnrollmentListData(BaseModel):
    items: list[EnrollmentData]
    total: int
    page: int
    limit: int
    total_pages: int


class EnrollmentListResponse(BaseModel):
    message: str
    data: EnrollmentListData


class CourseStudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    enrollment_id: UUID
    student_id: UUID
    full_name: str
    phone: str | None
    profile_image: str | None
    progress_percentage: float
    is_completed: bool
    enrolled_at: datetime
