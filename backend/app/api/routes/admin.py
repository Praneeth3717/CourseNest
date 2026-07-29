from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db

from app.models.user import User
from app.models.teacher import Teacher
from app.models.course import Course, CourseStatus
from app.models.classSession import ClassSession, SessionStatusEnum
from app.models.student import Student
from app.models.enrollment import Enrollment

from app.core.dependencies import require_role

from app.constants.roles import RoleEnum

from app.schemas.admin import (
    DashboardResponse,
    DashboardCardsResponse,
    DashoardRevenueResponse,
    UpcomingSessionResponse,
    DashboardAnalyticsResponse,
    MonthlyRevenueItem,
    CourseRevenueItem,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard_data(
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    techers_count = await db.scalar(select(func.count(Teacher.id)))
    students_count = await db.scalar(select(func.count(Student.id)))
    courses_result = await db.execute(
        select(Course.status, func.count(Course.id)).group_by(Course.status)
    )
    courses_rows = courses_result.all()
    status_counts = {status: count for status, count in courses_rows}

    total_courses = sum(status_counts.values())

    total_revenue = await db.scalar(
        select(func.coalesce(func.sum(Course.price), 0))
        .select_from(Enrollment)
        .join(Course, Enrollment.course_id == Course.id)
    )

    this_month_revenue = await db.scalar(
        select(func.coalesce(func.sum(Course.price), 0))
        .select_from(Enrollment)
        .join(Course, Enrollment.course_id == Course.id)
        .where(Enrollment.enrolled_at >= start_of_month)
    )

    first_payment_date = await db.scalar(select(func.min(Enrollment.enrolled_at)))

    if first_payment_date:
        total_months = (
            (now.year - first_payment_date.year) * 12
            + (now.month - first_payment_date.month)
            + 1
        )
        avg_revenue = total_revenue / total_months
    else:
        avg_revenue = 0

    upcoming_sessions_result = await db.execute(
        select(
            ClassSession.id.label("session_id"),
            Course.id.label("course_id"),
            Course.name.label("course_name"),
            ClassSession.title.label("session_title"),
            Teacher.id.label("teacher_id"),
            Teacher.full_name.label("teacher_name"),
            ClassSession.scheduled_start,
            ClassSession.duration_hours,
            ClassSession.status,
        )
        .join(Course, ClassSession.course_id == Course.id)
        .join(Teacher, ClassSession.teacher_id == Teacher.id)
        .where(
            ClassSession.scheduled_start >= now,
            ClassSession.status.in_(
                [SessionStatusEnum.PENDING, SessionStatusEnum.ACCEPTED]
            ),
        )
        .order_by(ClassSession.scheduled_start.asc())
        .limit(5)
    )
    session_rows = upcoming_sessions_result.all()

    return DashboardResponse(
        cards=DashboardCardsResponse(
            teachers=techers_count,
            students=students_count,
            total_courses=total_courses,
            active_courses=status_counts.get(CourseStatus.ACTIVE, 0),
            draft_courses=status_counts.get(CourseStatus.DRAFT, 0),
            completed_courses=status_counts.get(CourseStatus.COMPLETED, 0),
            archived_courses=status_counts.get(CourseStatus.ARCHIVED, 0),
        ),
        revenue=DashoardRevenueResponse(
            total_revenue=total_revenue,
            this_month_revenue=this_month_revenue,
            monthly_avg_revenue=avg_revenue,
        ),
        upcoming_sessions=[
            UpcomingSessionResponse(
                session_id=row.session_id,
                course_id=row.course_id,
                course_name=row.course_name,
                session_title=row.session_title,
                teacher_id=row.teacher_id,
                teacher_name=row.teacher_name,
                scheduled_start=row.scheduled_start,
                duration_hours=row.duration_hours,
                status=row.status,
            )
            for row in session_rows
        ],
    )


@router.get("/dashboard/charts", response_model=DashboardAnalyticsResponse)
async def get_charts_data(
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    start_of_year = datetime(now.year, 1, 1, tzinfo=timezone.utc)
    start_of_next_year = datetime(now.year + 1, 1, 1, tzinfo=timezone.utc)

    month_bucket = func.date_trunc("month", Enrollment.enrolled_at)

    revenue_stmt = (
        select(
            month_bucket.label("month"),
            func.coalesce(func.sum(Course.price), 0).label("revenue"),
        )
        .select_from(Enrollment)
        .join(Course, Enrollment.course_id == Course.id)
        .where(
            Enrollment.enrolled_at >= start_of_year,
            Enrollment.enrolled_at < start_of_next_year,
        )
        .group_by(month_bucket)
        .order_by(month_bucket)
    )

    revenue_result = await db.execute(revenue_stmt)
    revenue_rows = revenue_result.all()

    month_map = {row.month.month: row.revenue for row in revenue_rows}

    monthly_revenue = []

    for month_num in range(1, 13):
        month_dt = datetime(now.year, month_num, 1)

        monthly_revenue.append(
            MonthlyRevenueItem(
                month=month_dt.strftime("%b"),  # Jan
                year=month_dt.year,  # 2026
                revenue=month_map.get(month_num, 0),
            )
        )

    course_stmt = (
        select(
            Course.name.label("course_name"),
            func.coalesce(func.sum(Course.price), 0).label("revenue"),
        )
        .select_from(Enrollment)
        .join(Course, Enrollment.course_id == Course.id)
        .group_by(Course.id, Course.name)
        .order_by(func.sum(Course.price).desc())
    )

    course_result = await db.execute(course_stmt)
    course_rows = course_result.all()

    return DashboardAnalyticsResponse(
        monthly_revenue=monthly_revenue,
        course_revenue=[
            CourseRevenueItem(
                course_name=row.course_name,
                revenue=row.revenue,
            )
            for row in course_rows
        ],
    )
