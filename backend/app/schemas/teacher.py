from uuid import UUID
from datetime import datetime, date

from pydantic import BaseModel, EmailStr

from app.core.enums import GenderEnum, CourseStatus
from app.schemas.course import CourseData


class MessageResponse(BaseModel):
    message: str


class CreateTeacherRequest(BaseModel):
    email: EmailStr
    full_name: str


class TeacherData(BaseModel):
    id: UUID
    user_id: UUID
    email: EmailStr
    full_name: str
    phone: str | None
    dob: date | None
    gender: GenderEnum | None
    specialization: str | None
    qualification: str | None
    experience_years: int | None
    address: str | None
    profile_image: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TeacherListResponse(BaseModel):
    items: list[TeacherData]
    total: int
    page: int
    limit: int
    total_pages: int


class TeacherCourseData(TeacherData):
    courses: list[CourseData] = []


class CourseListResponse(BaseModel):
    items: list[CourseData]
    total: int
    page: int
    limit: int
    total_pages: int


class TeacherDashboardCardsResponse(BaseModel):
    active_courses: int
    upcoming_sessions: int
    completed_sessions: int
    teaching_hours: float


class TeacherUpcomingSessionResponse(BaseModel):
    session_id: UUID
    course_id: UUID
    course_name: str
    session_title: str
    scheduled_start: datetime
    duration_hours: float


class PendingApprovalResponse(BaseModel):
    session_id: UUID
    course_id: UUID
    course_name: str
    session_title: str
    scheduled_start: datetime
    duration_hours: float


class TeacherDashboardResponse(BaseModel):
    cards: TeacherDashboardCardsResponse
    upcoming_sessions: list[TeacherUpcomingSessionResponse]
    pending_approvals: list[PendingApprovalResponse]


class NextSessionResponse(BaseModel):
    session_id: UUID
    title: str
    scheduled_start: datetime
    duration_hours: float


class CourseSummaryResponse(BaseModel):
    course_id: UUID
    course_name: str
    course_code: str
    status: CourseStatus

    total_students: int

    total_hours: float
    completed_hours: float
    remaining_hours: float
    progress_percentage: int

    completed_sessions: int
    upcoming_sessions: int
    pending_sessions: int

    low_attendance_students: int

    next_session: NextSessionResponse | None = None
