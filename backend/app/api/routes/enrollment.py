from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import Student, Course, Enrollment, User

from app.schemas.enrollment import (
    MessageResponse,
    StudentEnrollmentRequest,
)

from app.core.dependencies import require_role
from app.core.enums import RoleEnum
from app.utils.files import build_file_url

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])


@router.post("/", response_model=MessageResponse)
async def enroll_student(
    payload: StudentEnrollmentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.STUDENT)),
):
    student = await db.scalar(select(Student).where(Student.user_id == current_user.id))

    if not student:
        raise HTTPException(404, "Student not found")

    course = await db.scalar(select(Course).where(Course.id == payload.course_id))

    if not course:
        raise HTTPException(404, "Course not found")

    existing = await db.scalar(
        select(Enrollment).where(
            Enrollment.student_id == student.id,
            Enrollment.course_id == payload.course_id,
        )
    )

    if existing:
        raise HTTPException(400, "Already enrolled")

    enrollment = Enrollment(
        student_id=student.id,
        course_id=payload.course_id,
    )

    db.add(enrollment)
    await db.commit()

    return {"message": "Student enrolled successfully"}


@router.delete("/{enrollment_id}", response_model=MessageResponse)
async def remove_enrollment(
    enrollment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
):
    enrollment = await db.scalar(
        select(Enrollment).where(Enrollment.id == enrollment_id)
    )

    if not enrollment:
        raise HTTPException(404, "Enrollment not found")

    await db.delete(enrollment)
    await db.commit()

    return {"message": "Enrollment removed successfully"}
