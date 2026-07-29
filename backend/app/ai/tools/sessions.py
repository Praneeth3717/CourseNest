from datetime import date, datetime, timezone
from typing import Literal, Optional
from uuid import UUID

from langchain_core.tools import tool
from langgraph.runtime import get_runtime
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload

from app.ai.context import RuntimeContext
from app.ai.tools.schemas import SessionDetail, SessionSummary, ToolResult
from app.models.classSession import ClassSession, SessionStatusEnum
from app.models.course import Course
from app.models.enrollment import Enrollment

STATUS_BY_FILTER = {
    "upcoming": (SessionStatusEnum.ACCEPTED,),
    "completed": (SessionStatusEnum.COMPLETED,),
    "all": (SessionStatusEnum.ACCEPTED, SessionStatusEnum.COMPLETED),
}


@tool
async def list_my_sessions(
    time_frame: Literal["upcoming", "completed", "all"] = "upcoming",
    course: Optional[str] = None,
) -> str:
    """
    List the student's class sessions (summary only). Only accepted/completed
    sessions — never pending, rejected, or cancelled. Use get_session_details
    for full detail on one session.

    Args:
        time_frame: "upcoming" (default), "completed", or "all".
        course: optional course code (e.g. "YB-01") or name to filter by.
    """
    runtime = get_runtime(RuntimeContext)

    try:
        student_id = runtime.context.student_id
    except ValueError as e:
        return ToolResult(success=False, error=str(e)).model_dump_json()

    stmt = (
        select(ClassSession)
        .join(Enrollment, Enrollment.course_id == ClassSession.course_id)
        .where(
            Enrollment.student_id == student_id,
            ClassSession.status.in_(STATUS_BY_FILTER[time_frame]),
        )
        .options(
            selectinload(ClassSession.teacher),
            selectinload(ClassSession.course),
        )
        .order_by(ClassSession.scheduled_start.asc())
    )

    if course:
        stmt = stmt.join(Course, Course.id == ClassSession.course_id).where(
            or_(
                func.lower(Course.code) == course.strip().lower(),
                Course.name.ilike(f"%{course.strip()}%"),
            )
        )

    result = await runtime.context.db.execute(stmt)
    sessions = result.scalars().all()

    data = [
        SessionSummary(
            session_id=s.id,
            course_id=s.course_id,
            course_name=s.course.name,
            title=s.title,
            scheduled_start=s.scheduled_start,
            duration_hours=s.duration_hours,
            status=s.status.value,
        )
        for s in sessions
    ]
    return ToolResult(
        success=True, data=[d.model_dump(mode="json") for d in data]
    ).model_dump_json()


@tool
async def get_session_details(
    session_title: str,
    course: Optional[str] = None,
    session_date: Optional[date] = None,
) -> str:
    """
    Get full details (description, schedule, duration, teacher) for one session.

    Args:
        session_title: session title or a distinctive part of it.
        course: course code/name, if mentioned — disambiguates same-titled
            sessions across courses.
        session_date: session date, if mentioned — disambiguates recurring
            sessions with the same title.
    """
    runtime = get_runtime(RuntimeContext)

    try:
        student_id = runtime.context.student_id
    except ValueError as e:
        return ToolResult(success=False, error=str(e)).model_dump_json()

    stmt = (
        select(ClassSession)
        .join(Enrollment, Enrollment.course_id == ClassSession.course_id)
        .join(Course, Course.id == ClassSession.course_id)
        .where(
            Enrollment.student_id == student_id,
            ClassSession.status.in_(
                (SessionStatusEnum.ACCEPTED, SessionStatusEnum.COMPLETED)
            ),
            ClassSession.title.ilike(f"%{session_title.strip()}%"),
        )
        .options(
            selectinload(ClassSession.teacher),
            selectinload(ClassSession.course),
        )
    )

    if course:
        stmt = stmt.where(
            or_(
                func.lower(Course.code) == course.strip().lower(),
                Course.name.ilike(f"%{course.strip()}%"),
            )
        )
    if session_date:
        stmt = stmt.where(func.date(ClassSession.scheduled_start) == session_date)

    result = await runtime.context.db.execute(stmt)
    matches = result.scalars().all()

    if not matches:
        return ToolResult(
            success=False,
            error=f"No matching session found for '{session_title}'",
        ).model_dump_json()

    if len(matches) > 1:
        options = ", ".join(
            f"{m.title} ({m.course.name}, {m.scheduled_start:%Y-%m-%d %H:%M})"
            for m in matches
        )
        return ToolResult(
            success=False,
            error=f"Multiple sessions match '{session_title}': {options}. Please specify the course and/or date.",
        ).model_dump_json()

    session_obj = matches[0]
    data = SessionDetail(
        session_id=session_obj.id,
        course_id=session_obj.course_id,
        course_name=session_obj.course.name,
        title=session_obj.title,
        scheduled_start=session_obj.scheduled_start,
        duration_hours=session_obj.duration_hours,
        status=session_obj.status.value,
        teacher_name=session_obj.teacher.full_name,
        description=session_obj.description,
    )
    return ToolResult(success=True, data=data.model_dump(mode="json")).model_dump_json()
