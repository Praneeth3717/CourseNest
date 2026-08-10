from datetime import datetime
from uuid import UUID
from pydantic import BaseModel

from app.core.enums import AttendanceStatus


class MessageResponse(BaseModel):
    message: str


class AttendanceData(BaseModel):
    id: UUID
    session_id: UUID
    enrollment_id: UUID
    status: AttendanceStatus
    remarks: str | None
    marked_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AttendanceEntry(BaseModel):
    enrollment_id: UUID
    status: AttendanceStatus
    remarks: str | None = None


class BulkAttendanceCreate(BaseModel):
    attendance: list[AttendanceEntry]


class AttendanceListResponse(BaseModel):
    items: list[AttendanceData]
    total: int
    page: int
    limit: int
    total_pages: int


class AttendanceUpdate(BaseModel):
    status: AttendanceStatus
    remarks: str | None = None


class SessionAttendanceStudentData(BaseModel):
    attendance_id: UUID
    enrollment_id: UUID
    student_id: UUID

    full_name: str
    phone: str | None = None
    profile_image: str | None = None

    status: AttendanceStatus
    remarks: str | None = None
    marked_at: datetime

    model_config = {"from_attributes": True}


class SessionAttendanceStudentsListResponse(BaseModel):
    items: list[SessionAttendanceStudentData]
    total: int
    page: int
    limit: int
    total_pages: int
