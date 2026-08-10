from typing import Optional
from datetime import date
from uuid import UUID

from langchain_core.tools import tool
from langgraph.runtime import get_runtime
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload

from app.ai.graph.context import RuntimeContext
from app.ai.tools.schemas import AttendanceRecord, ToolResult, AttendanceSummary
from app.models import Attendance, ClassSession, Course, Enrollment

from app.core.enums import AttendanceStatus, SessionStatusEnum

from app.utils.progress import calculate_course_progress, calculate_student_progress


@tool
async def list_my_attendance(
    course: Optional[str] = None,
    session_title: Optional[str] = None,
    session_date: Optional[date] = None,
    limit: int = 20,
) -> str:
    """
    List the student's individual attendance records (one row per session),
    most recent first. For a percentage/summary, use get_attendance_summary
    instead.

    Args:
        course: optional course code (e.g. "YB-01") or name to filter by.
        session_title: optional session title (or part of it) to filter by.
        session_date: optional session date to filter by.
        limit: max rows to return (default 20).
    """
    runtime = get_runtime(RuntimeContext)

    try:
        student_id = runtime.context.student_id
    except ValueError as e:
        return ToolResult(success=False, error=str(e)).model_dump_json()

    stmt = (
        select(Attendance)
        .join(Enrollment, Enrollment.id == Attendance.enrollment_id)
        .join(ClassSession, ClassSession.id == Attendance.session_id)
        .join(Course, Course.id == ClassSession.course_id)
        .where(Enrollment.student_id == student_id)
        .options(
            selectinload(Attendance.session).selectinload(ClassSession.course),
        )
        .order_by(Attendance.marked_at.desc())
        .limit(limit)
    )

    if course:
        stmt = stmt.where(
            or_(
                func.lower(Course.code) == course.strip().lower(),
                Course.name.ilike(f"%{course.strip()}%"),
            )
        )

    if session_title:
        stmt = stmt.where(ClassSession.title.ilike(f"%{session_title.strip()}%"))

    if session_date:
        stmt = stmt.where(func.date(ClassSession.scheduled_start) == session_date)

    result = await runtime.context.db.execute(stmt)
    records = result.scalars().all()

    data = [
        AttendanceRecord(
            session_id=a.session_id,
            session_title=a.session.title,
            course_name=a.session.course.name,
            course_code=a.session.course.code,
            status=a.status.value,
            marked_at=a.marked_at,
            session_scheduled_start=a.session.scheduled_start,
        )
        for a in records
    ]
    return ToolResult(
        success=True, data=[d.model_dump(mode="json") for d in data]
    ).model_dump_json()


@tool
async def get_attendance_summary(course: str) -> str:
    """
    Get the student's attendance/progress summary for one course: classes
    held, present/absent counts, attendance rate, classes remaining, hours
    remaining, and overall course completion.

    Args:
        course: course code (e.g. "YB-01") or name. Required — all figures
            are scoped to one course.
    """
    runtime = get_runtime(RuntimeContext)

    try:
        student_id = runtime.context.student_id
    except ValueError as e:
        return ToolResult(success=False, error=str(e)).model_dump_json()

    stmt = (
        select(Enrollment)
        .join(Course, Course.id == Enrollment.course_id)
        .where(
            Enrollment.student_id == student_id,
            or_(
                func.lower(Course.code) == course.strip().lower(),
                Course.name.ilike(f"%{course.strip()}%"),
            ),
        )
        .options(
            selectinload(Enrollment.course),
            selectinload(Enrollment.attendance_records).selectinload(
                Attendance.session
            ),
        )
    )
    # Course.sessions is needed for progress calc but isn't loaded via
    # Enrollment.course above with a plain selectinload — nest it:
    stmt = stmt.options(selectinload(Enrollment.course).selectinload(Course.sessions))

    result = await runtime.context.db.execute(stmt)
    enrollments = result.scalars().all()

    if not enrollments:
        return ToolResult(
            success=False,
            error=f"You're not enrolled in a course matching '{course}'.",
        ).model_dump_json()

    if len(enrollments) > 1:
        options = ", ".join(f"{e.course.name} ({e.course.code})" for e in enrollments)
        return ToolResult(
            success=False,
            error=f"Multiple enrolled courses match '{course}': {options}. Please specify more precisely.",
        ).model_dump_json()

    enrollment = enrollments[0]
    course_obj = enrollment.course

    course_progress_percentage, completed_hours = calculate_course_progress(course_obj)
    _student_progress_percentage, _attended_hours = calculate_student_progress(
        enrollment, completed_hours
    )

    completed_sessions = [
        s for s in course_obj.sessions if s.status == SessionStatusEnum.COMPLETED
    ]
    upcoming_sessions = [
        s for s in course_obj.sessions if s.status == SessionStatusEnum.ACCEPTED
    ]

    present_count = sum(
        1
        for a in enrollment.attendance_records
        if a.status == AttendanceStatus.PRESENT
        and a.session.status == SessionStatusEnum.COMPLETED
    )
    absent_count = sum(
        1
        for a in enrollment.attendance_records
        if a.status == AttendanceStatus.ABSENT
        and a.session.status == SessionStatusEnum.COMPLETED
    )
    total_marked = present_count + absent_count
    attendance_rate = (
        round((present_count / total_marked) * 100, 2) if total_marked else 0.0
    )

    duration_left_hours = None
    if course_obj.duration_hours is not None:
        duration_left_hours = max(
            round(course_obj.duration_hours - completed_hours, 2), 0.0
        )

    data = AttendanceSummary(
        course_id=course_obj.id,
        course_name=course_obj.name,
        course_code=course_obj.code,
        total_classes_occurred=len(completed_sessions),
        present_count=present_count,
        absent_count=absent_count,
        attendance_rate=attendance_rate,
        classes_left=len(upcoming_sessions),
        duration_left_hours=duration_left_hours,
        course_progress_percentage=course_progress_percentage,
    )
    return ToolResult(success=True, data=data.model_dump(mode="json")).model_dump_json()
