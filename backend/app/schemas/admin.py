from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from app.core.enums import SessionStatusEnum


class DashboardCardsResponse(BaseModel):
    teachers: int
    students: int
    total_courses: int
    active_courses: int
    draft_courses: int
    completed_courses: int
    archived_courses: int


class DashoardRevenueResponse(BaseModel):
    total_revenue: float
    this_month_revenue: float
    monthly_avg_revenue: float


class UpcomingSessionResponse(BaseModel):
    session_id: UUID
    course_id: UUID
    course_name: str

    session_title: str

    teacher_id: UUID | None
    teacher_name: str | None

    scheduled_start: datetime
    duration_hours: float

    status: SessionStatusEnum


class DashboardResponse(BaseModel):
    cards: DashboardCardsResponse
    revenue: DashoardRevenueResponse
    upcoming_sessions: list[UpcomingSessionResponse]


class MonthlyRevenueItem(BaseModel):
    month: str
    year: int
    revenue: float


class CourseRevenueItem(BaseModel):
    course_name: str
    revenue: float


class DashboardAnalyticsResponse(BaseModel):
    monthly_revenue: list[MonthlyRevenueItem]
    course_revenue: list[CourseRevenueItem]
