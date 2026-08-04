from datetime import date
from uuid import UUID, uuid4
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import session
from app.db.session import get_db
from app.core.dependencies import require_role
from app.core.enums import RoleEnum
from app.utils.files import build_file_url

from app.models.attendance import Attendance
from app.models.classSession import (
    ClassSession,
    SessionStatusEnum,
)
from app.models.enrollment import Enrollment
from app.models.teacher import Teacher
from app.models.student import Student
from app.models.user import User
from app.models.course import Course, CourseStatus
from app.models.certificate import Certificate

from app.schemas.attendance import (
    BulkAttendanceCreate,
    AttendanceUpdate,
    AttendanceData,
    AttendanceListResponse,
    SessionAttendanceStudentData,
    SessionAttendanceStudentsListResponse,
)

from app.utils.progress import calculate_course_progress, calculate_student_progress
from app.services.certificate_generator import CertificateGenerator

router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"],
)


def serialize_attendance(attendance: Attendance) -> AttendanceData:
    return AttendanceData(
        id=attendance.id,
        session_id=attendance.session_id,
        enrollment_id=attendance.enrollment_id,
        status=attendance.status,
        remarks=attendance.remarks,
        marked_at=attendance.marked_at,
        created_at=attendance.created_at,
        updated_at=attendance.updated_at,
    )


@router.post(
    "/{session_id}",
    response_model=AttendanceListResponse,
    status_code=status.HTTP_201_CREATED,
)
async def mark_session_attendance(
    session_id: UUID,
    payload: BulkAttendanceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.TEACHER)),
):
    teacher = await db.scalar(select(Teacher).where(Teacher.user_id == current_user.id))

    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher profile not found",
        )

    session = await db.scalar(select(ClassSession).where(ClassSession.id == session_id))

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    if session.teacher_id != teacher.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this session",
        )

    if session.status != SessionStatusEnum.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance can only be marked for completed sessions",
        )

    if session.attendance_marked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance has already been marked for this session",
        )

    enrollment_ids = [entry.enrollment_id for entry in payload.attendance]

    enrollments = (
        (
            await db.execute(
                select(Enrollment)
                .where(Enrollment.id.in_(enrollment_ids))
                .options(
                    selectinload(Enrollment.attendance_records).selectinload(
                        Attendance.session
                    ),
                    selectinload(Enrollment.course).selectinload(Course.sessions),
                    selectinload(Enrollment.certificate),
                    selectinload(Enrollment.student),
                )
            )
        )
        .scalars()
        .all()
    )

    enrollment_map = {enrollment.id: enrollment for enrollment in enrollments}

    attendance_records = []

    for entry in payload.attendance:
        enrollment = enrollment_map.get(entry.enrollment_id)

        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Enrollment {entry.enrollment_id} not found",
            )

        if enrollment.course_id != session.course_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Enrollment {entry.enrollment_id} "
                    f"does not belong to this course"
                ),
            )

        attendance = Attendance(
            session_id=session.id,
            enrollment_id=entry.enrollment_id,
            status=entry.status,
            remarks=entry.remarks,
        )

        db.add(attendance)

        enrollment.attendance_records.append(attendance)

        attendance_records.append(attendance)

    session.attendance_marked = True
    db.add(session)

    await db.flush()

    course_progress, completed_teaching_hours = calculate_course_progress(
        session.course
    )

    if course_progress >= 100:
        session.course.status = CourseStatus.COMPLETED
        db.add(session.course)

    for enrollment in enrollments:
        student_progress, attended_hours = calculate_student_progress(
            enrollment,
            completed_teaching_hours,
        )

        enrollment.progress_percentage = round(student_progress, 2)

        completed = course_progress >= 100 and student_progress >= 70

        if completed and enrollment.certificate is None:
            certificate_number = f"CERT-{date.today().year}-{enrollment.course.code}-{uuid4().hex[:6].upper()}"

            certificate_path = CertificateGenerator.generate(
                student_name=enrollment.student.full_name,
                course_name=enrollment.course.name,
                completion_date=date.today(),
                certificate_number=certificate_number,
            )

            certificate = Certificate(
                enrollment_id=enrollment.id,
                certificate_number=certificate_number,
                storage_key=certificate_path,
            )

            db.add(certificate)

        enrollment.is_completed = completed

        db.add(enrollment)

    await db.commit()

    for attendance in attendance_records:
        await db.refresh(attendance)

    return AttendanceListResponse(
        items=[serialize_attendance(attendance) for attendance in attendance_records],
        total=len(attendance_records),
        page=1,
        limit=len(attendance_records),
        total_pages=1,
    )


@router.get(
    "/{session_id}",
    response_model=SessionAttendanceStudentsListResponse,
    status_code=status.HTTP_200_OK,
)
async def get_session_attendance(
    session_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.TEACHER)),
):
    session_exists = await db.scalar(
        select(ClassSession).where(ClassSession.id == session_id)
    )

    if not session_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    query = (
        select(Attendance)
        .join(Attendance.enrollment)
        .join(Enrollment.student)
        .options(selectinload(Attendance.enrollment).selectinload(Enrollment.student))
        .where(Attendance.session_id == session_id)
    )

    count_query = (
        select(func.count(Attendance.id))
        .join(Attendance.enrollment)
        .join(Enrollment.student)
        .where(Attendance.session_id == session_id)
    )

    if search:
        search_filter = or_(
            Student.full_name.ilike(f"%{search}%"),
            Student.phone.ilike(f"%{search}%"),
        )

        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total = await db.scalar(count_query)

    offset = (page - 1) * limit

    query = query.order_by(Attendance.marked_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    attendance_records = result.scalars().all()

    return SessionAttendanceStudentsListResponse(
        items=[
            SessionAttendanceStudentData(
                attendance_id=attendance.id,
                enrollment_id=attendance.enrollment.id,
                student_id=attendance.enrollment.student.id,
                full_name=attendance.enrollment.student.full_name,
                phone=attendance.enrollment.student.phone,
                profile_image=build_file_url(
                    attendance.enrollment.student.profile_image
                ),
                status=attendance.status,
                remarks=attendance.remarks,
                marked_at=attendance.marked_at,
            )
            for attendance in attendance_records
        ],
        total=total,
        page=page,
        limit=limit,
        total_pages=ceil(total / limit) if total else 0,
    )


@router.patch(
    "/{attendance_id}",
    response_model=AttendanceData,
    status_code=status.HTTP_200_OK,
)
async def update_attendance(
    attendance_id: UUID,
    payload: AttendanceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.TEACHER)),
):
    teacher = await db.scalar(select(Teacher).where(Teacher.user_id == current_user.id))

    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher profile not found",
        )

    attendance = await db.scalar(
        select(Attendance).where(Attendance.id == attendance_id)
    )

    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found",
        )

    session = await db.scalar(
        select(ClassSession).where(ClassSession.id == attendance.session_id)
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    if session.teacher_id != teacher.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this session",
        )

    if session.status != SessionStatusEnum.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance can only be updated for completed sessions",
        )

    attendance.status = payload.status
    attendance.remarks = payload.remarks

    await db.commit()
    await db.refresh(attendance)

    return serialize_attendance(attendance)
