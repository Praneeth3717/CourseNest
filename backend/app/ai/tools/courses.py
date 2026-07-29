from typing import Optional

from langchain_core.tools import tool
from langgraph.runtime import get_runtime
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.ai.context import RuntimeContext
from app.ai.tools.schemas import CourseDetail, CourseSummary, ToolResult
from app.models.course import Course, CourseStatus


@tool
async def search_courses(
    search: Optional[str] = None,
    limit: int = 10,
    offset: int = 0,
) -> str:
    """Browse/search active courses by name or code. Not for a specific course's details — use get_course_details instead."""

    runtime = get_runtime(RuntimeContext)

    stmt = select(Course).where(Course.status == CourseStatus.ACTIVE)

    if search:
        search = search.strip()
        if search:
            pattern = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Course.name.ilike(pattern),
                    Course.code.ilike(pattern),
                )
            )

    stmt = stmt.order_by(Course.name).limit(limit).offset(offset)

    result = await runtime.context.db.execute(stmt)
    courses = result.scalars().all()

    data = [
        CourseSummary(
            id=course.id,
            name=course.name,
            code=course.code,
            duration_hours=course.duration_hours,
            price=course.price,
        ).model_dump(mode="json")
        for course in courses
    ]

    return ToolResult(
        success=True,
        data=data,
    ).model_dump_json()


@tool
async def get_course_details(course_identifier: str) -> str:
    """Get full details (description, teacher, duration, price) for one specific active course."""

    runtime = get_runtime(RuntimeContext)

    course_identifier = course_identifier.strip()
    identifier = course_identifier.lower()

    base_stmt = (
        select(Course)
        .where(Course.status == CourseStatus.ACTIVE)
        .options(selectinload(Course.teacher))
    )

    # Try an exact match first
    exact_stmt = base_stmt.where(
        or_(
            func.lower(Course.name) == identifier,
            func.lower(Course.code) == identifier,
        )
    )

    result = await runtime.context.db.execute(exact_stmt)
    courses = result.scalars().all()

    # Fall back to partial matching
    if not courses:
        pattern = f"%{course_identifier}%"

        partial_stmt = base_stmt.where(
            or_(
                Course.name.ilike(pattern),
                Course.code.ilike(pattern),
            )
        )

        result = await runtime.context.db.execute(partial_stmt)
        courses = result.scalars().all()

    if not courses:
        return ToolResult(
            success=False,
            error=f"No active course matching '{course_identifier}' was found.",
        ).model_dump_json()

    if len(courses) > 1:
        matches = ", ".join(f"{course.name} ({course.code})" for course in courses)

        return ToolResult(
            success=False,
            error=(
                f"Multiple active courses match '{course_identifier}': "
                f"{matches}. Ask the student to be more specific."
            ),
        ).model_dump_json()

    course = courses[0]

    detail = CourseDetail(
        id=course.id,
        name=course.name,
        code=course.code,
        duration_hours=course.duration_hours,
        price=course.price,
        teacher_name=course.teacher.full_name if course.teacher else None,
        description=course.description,
        thumbnail=course.thumbnail,
    )

    return ToolResult(
        success=True,
        data=detail.model_dump(mode="json"),
    ).model_dump_json()
