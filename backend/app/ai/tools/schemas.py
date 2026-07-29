from datetime import datetime, date
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel


class ToolResult(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None


class StudentProfile(BaseModel):
    full_name: str
    email: str
    phone: Optional[str]
    dob: Optional[date]
    gender: Optional[str]
    address: Optional[str]


class CourseSummary(BaseModel):
    id: UUID
    name: str
    code: str
    duration_hours: Optional[float]
    price: Optional[float]


class CourseDetail(CourseSummary):
    teacher_name: Optional[str]
    description: Optional[str]
    thumbnail: Optional[str]


class EnrollmentBrief(BaseModel):
    course_id: UUID
    course_name: str
    course_code: str
    enrolled_at: datetime


class EnrollmentSummary(BaseModel):
    enrollment_id: UUID
    course_id: UUID
    course_name: str
    course_code: str
    progress_percentage: float
    is_completed: bool
    enrolled_at: datetime
    teacher_name: Optional[str] = None


class SessionSummary(BaseModel):
    session_id: UUID
    course_id: UUID
    course_name: str
    title: str
    scheduled_start: datetime
    duration_hours: float
    status: str


class SessionDetail(SessionSummary):
    teacher_name: str
    description: Optional[str]


class AttendanceRecord(BaseModel):
    session_id: UUID
    session_title: str
    course_name: str
    course_code: str
    status: str
    marked_at: datetime
    session_scheduled_start: datetime


class AttendanceSummary(BaseModel):
    course_id: Optional[UUID]
    course_name: str
    course_code: str
    total_classes_occurred: int
    present_count: int
    absent_count: int
    attendance_rate: float
    classes_left: int
    duration_left_hours: Optional[float]
    course_progress_percentage: float


# class CertificateSummary(BaseModel):
#     certificate_id: UUID
#     course_id: UUID
#     course_name: str
#     certificate_number: str
#     issued_at: datetime
#     storage_key: str
