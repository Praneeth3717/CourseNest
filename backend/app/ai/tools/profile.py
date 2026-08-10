from langchain_core.tools import tool
from langgraph.runtime import get_runtime
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.ai.graph.context import RuntimeContext
from app.ai.tools.schemas import StudentProfile, ToolResult
from app.models import Student


@tool
async def get_student_profile() -> str:
    """
    Get the student's profile: email, phone, DOB, gender, address.
    Don't call this just for their name — that's already in the system prompt.
    """
    runtime = get_runtime(RuntimeContext)

    try:
        student_id = runtime.context.student_id
    except ValueError as e:
        return ToolResult(success=False, error=str(e)).model_dump_json()

    stmt = (
        select(Student)
        .where(Student.id == student_id)
        .options(selectinload(Student.user))
    )
    result = await runtime.context.db.execute(stmt)
    student = result.scalar_one_or_none()

    if student is None:
        return ToolResult(success=False, error="Student not found").model_dump_json()

    profile = StudentProfile(
        full_name=student.full_name,
        email=student.user.email,
        phone=student.phone,
        dob=student.dob,
        gender=student.gender.value if student.gender else None,
        address=student.address,
    )
    return ToolResult(
        success=True, data=profile.model_dump(mode="json")
    ).model_dump_json()
