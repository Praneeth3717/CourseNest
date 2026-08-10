from uuid import UUID
from datetime import datetime, date

from pydantic import BaseModel, EmailStr

from app.core.enums import GenderEnum, CourseStatus


class MessageResponse(BaseModel):
    message: str


class CreateStudentRequest(BaseModel):
    email: EmailStr
    full_name: str


class StudentData(BaseModel):
    id: UUID
    user_id: UUID
    email: EmailStr
    full_name: str
    phone: str | None
    dob: date | None
    gender: GenderEnum | None
    address: str | None
    profile_image: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class StudentListResponse(BaseModel):
    items: list[StudentData]
    total: int
    page: int
    limit: int
    total_pages: int


class StudentCourseData(BaseModel):
    enrollment_id: UUID
    course_id: UUID
    name: str
    code: str
    thumbnail: str | None = None

    course_progress_percentage: float
    student_progress_percentage: float

    is_completed: bool
    enrolled_at: datetime


class StudentCourseListResponse(BaseModel):
    items: list[StudentCourseData]
    total: int
    page: int
    limit: int
    total_pages: int


class StudentWithCoursesData(StudentData):

    courses: list[StudentCourseData] = []


class StudentDashboardCardsResponse(BaseModel):
    enrolled_courses: int
    active_courses: int
    completed_courses: int
    hours_learned: float


class StudentUpcomingSessionResponse(BaseModel):
    session_id: UUID
    course_id: UUID
    course_name: str
    session_title: str
    scheduled_start: datetime
    duration_hours: float


class StudentDashboardResponse(BaseModel):
    cards: StudentDashboardCardsResponse
    upcoming_sessions: list[StudentUpcomingSessionResponse]


class StudentNextSessionResponse(BaseModel):
    session_id: UUID
    title: str
    scheduled_start: datetime
    duration_hours: float


class StudentCourseSummaryResponse(BaseModel):
    course_id: UUID
    course_name: str
    course_code: str
    status: CourseStatus

    # Enrollment / completion
    enrollment_id: UUID
    is_completed: bool
    certificate_url: str | None = None

    # Hours
    total_hours: float
    attended_hours: float
    remaining_hours: float
    progress_percentage: int

    # Session metrics
    total_sessions: int
    completed_sessions: int
    upcoming_sessions: int
    missed_sessions: int

    # Personal attendance
    attended_sessions: int
    absent_sessions: int
    attendance_percentage: float

    # Next class
    next_session: StudentNextSessionResponse | None = None
