from typing import Optional

from langchain_core.tools import tool
from langgraph.runtime import get_runtime
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.ai.graph.context import RuntimeContext
from app.ai.tools.schemas import (
    EnrollmentBrief,
    EnrollmentSummary,
    ToolResult,
)
from app.models.course import Course
from app.models.enrollment import Enrollment


@tool
async def list_my_enrollments(
    is_completed: Optional[bool] = None,
) -> str:
    """List the student's enrolled courses. Optionally filter by is_completed (True/False)."""

    runtime = get_runtime(RuntimeContext)

    try:
        student_id = runtime.context.student_id
    except ValueError as e:
        return ToolResult(success=False, error=str(e)).model_dump_json()

    stmt = (
        select(Enrollment)
        .where(Enrollment.student_id == student_id)
        .options(selectinload(Enrollment.course))
        .order_by(Enrollment.enrolled_at.desc())
    )

    if is_completed is not None:
        stmt = stmt.where(Enrollment.is_completed == is_completed)

    result = await runtime.context.db.execute(stmt)
    enrollments = result.scalars().all()

    data = [
        EnrollmentBrief(
            course_id=enrollment.course_id,
            course_name=enrollment.course.name,
            course_code=enrollment.course.code,
            enrolled_at=enrollment.enrolled_at,
        ).model_dump(mode="json")
        for enrollment in enrollments
    ]

    return ToolResult(
        success=True,
        data=data,
    ).model_dump_json()


@tool
async def get_enrollment_progress(course_identifier: str) -> str:
    """Get the student's progress/completion status for one enrolled course."""

    runtime = get_runtime(RuntimeContext)

    try:
        student_id = runtime.context.student_id
    except ValueError as e:
        return ToolResult(success=False, error=str(e)).model_dump_json()

    course_identifier = course_identifier.strip()
    identifier = course_identifier.lower()

    base_stmt = (
        select(Enrollment)
        .join(Enrollment.course)
        .where(Enrollment.student_id == student_id)
        .options(selectinload(Enrollment.course).selectinload(Course.teacher))
    )

    # Try exact match first
    exact_stmt = base_stmt.where(
        or_(
            func.lower(Course.code) == identifier,
            func.lower(Course.name) == identifier,
        )
    )

    result = await runtime.context.db.execute(exact_stmt)
    enrollments = result.scalars().all()

    # Fall back to partial match
    if not enrollments:
        pattern = f"%{course_identifier}%"

        partial_stmt = base_stmt.where(
            or_(
                Course.code.ilike(pattern),
                Course.name.ilike(pattern),
            )
        )

        result = await runtime.context.db.execute(partial_stmt)
        enrollments = result.scalars().all()

    if not enrollments:
        return ToolResult(
            success=False,
            error=(
                f"You are not enrolled in a course matching " f"'{course_identifier}'."
            ),
        ).model_dump_json()

    if len(enrollments) > 1:
        matches = ", ".join(
            f"{enrollment.course.name} ({enrollment.course.code})"
            for enrollment in enrollments
        )

        return ToolResult(
            success=False,
            error=(
                f"Multiple enrolled courses match '{course_identifier}': "
                f"{matches}. Ask the student to be more specific."
            ),
        ).model_dump_json()

    enrollment = enrollments[0]

    data = EnrollmentSummary(
        enrollment_id=enrollment.id,
        course_id=enrollment.course_id,
        course_name=enrollment.course.name,
        course_code=enrollment.course.code,
        progress_percentage=enrollment.progress_percentage,
        is_completed=enrollment.is_completed,
        enrolled_at=enrollment.enrolled_at,
        teacher_name=(
            enrollment.course.teacher.full_name if enrollment.course.teacher else None
        ),
    )

    return ToolResult(
        success=True,
        data=data.model_dump(mode="json"),
    ).model_dump_json()
