from uuid import UUID
from datetime import date, datetime, timezone, timedelta
from math import ceil
from typing import Literal

import os
import uuid

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    File,
    Form,
    UploadFile,
    Query,
)

from sqlalchemy import select, func, or_, case
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db

from app.models.user import User
from app.models.role import Role
from app.models.student import Student, GenderEnum
from app.models.enrollment import Enrollment
from app.models.classSession import ClassSession, SessionStatusEnum
from app.models.course import Course, CourseStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.models.certificate import Certificate
from app.models.student_token_quota import StudentTokenQuota

from app.schemas.student import (
    CreateStudentRequest,
    MessageResponse,
    StudentData,
    StudentListResponse,
    StudentCourseData,
    StudentCourseListResponse,
    StudentWithCoursesData,
    StudentDashboardResponse,
    StudentDashboardCardsResponse,
    StudentUpcomingSessionResponse,
    StudentCourseSummaryResponse,
    StudentNextSessionResponse,
)
from app.schemas.classSession import SessionData
from app.api.routes.classSession import serialize_classSession

from app.core.dependencies import require_role

from app.core.security import generate_password_token, get_password_token_expiry

from app.services.email_service import send_password_setup_email

from app.core.config import settings

from app.core.enums import RoleEnum
from app.utils.files import build_file_url
from app.utils.progress import calculate_course_progress, calculate_student_progress

router = APIRouter(prefix="/students", tags=["Students"])


def serialize_student(student: Student) -> StudentData:
    return StudentData(
        id=student.id,
        user_id=student.user_id,
        email=student.user.email,
        full_name=student.full_name,
        phone=student.phone,
        dob=student.dob,
        gender=student.gender,
        address=student.address,
        profile_image=(
            build_file_url(student.profile_image) if student.profile_image else None
        ),
        created_at=student.created_at,
    )


@router.get("/dashboard", response_model=StudentDashboardResponse)
async def get_dashboard_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.STUDENT)),
):
    student = current_user.student

    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    now = datetime.now(timezone.utc)

    cards_stmt = (
        select(
            func.count(Enrollment.id).label("enrolled_courses"),
            func.count(case((Course.status == CourseStatus.ACTIVE, 1))).label(
                "active_courses"
            ),
            func.count(case((Enrollment.is_completed.is_(True), 1))).label(
                "completed_courses"
            ),
        )
        .select_from(Enrollment)
        .join(Course, Course.id == Enrollment.course_id)
        .where(Enrollment.student_id == student.id)
    )

    cards_result = (await db.execute(cards_stmt)).one()

    enrolled_courses = cards_result.enrolled_courses or 0
    active_courses = cards_result.active_courses or 0
    completed_courses = cards_result.completed_courses or 0

    hours_stmt = (
        select(func.coalesce(func.sum(ClassSession.duration_hours), 0.0))
        .select_from(Attendance)
        .join(Enrollment, Enrollment.id == Attendance.enrollment_id)
        .join(ClassSession, ClassSession.id == Attendance.session_id)
        .where(
            Enrollment.student_id == student.id,
            Attendance.status == AttendanceStatus.PRESENT,
            ClassSession.status == SessionStatusEnum.COMPLETED,
        )
    )

    hours_learned = float((await db.scalar(hours_stmt)) or 0.0)

    upcoming_stmt = (
        select(
            ClassSession.id,
            Course.id,
            Course.name,
            ClassSession.title,
            ClassSession.scheduled_start,
            ClassSession.duration_hours,
        )
        .select_from(ClassSession)
        .join(Course, Course.id == ClassSession.course_id)
        .join(Enrollment, Enrollment.course_id == Course.id)
        .where(
            Enrollment.student_id == student.id,
            ClassSession.scheduled_start > now,
            ClassSession.status == SessionStatusEnum.ACCEPTED,
        )
        .order_by(ClassSession.scheduled_start.asc())
        .limit(5)
    )

    upcoming_sessions = await db.execute(upcoming_stmt)

    return StudentDashboardResponse(
        cards=StudentDashboardCardsResponse(
            enrolled_courses=enrolled_courses,
            active_courses=active_courses,
            completed_courses=completed_courses,
            hours_learned=hours_learned,
        ),
        upcoming_sessions=[
            StudentUpcomingSessionResponse(
                session_id=session[0],
                course_id=session[1],
                course_name=session[2],
                session_title=session[3],
                scheduled_start=session[4],
                duration_hours=session[5],
            )
            for session in upcoming_sessions.all()
        ],
    )


@router.get(
    "/dashboard/course/{course_id}",
    response_model=StudentCourseSummaryResponse,
)
async def get_course_summary(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.STUDENT)),
):
    now = datetime.now(timezone.utc)

    student = current_user.student
    if not student:
        raise HTTPException(404, "Student profile not found")

    course = await db.scalar(select(Course).where(Course.id == course_id))

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    enrollment = await db.scalar(
        select(Enrollment)
        .where(
            Enrollment.student_id == student.id,
            Enrollment.course_id == course_id,
        )
        .options(selectinload(Enrollment.certificate))
    )

    if not enrollment:
        raise HTTPException(
            status_code=403,
            detail="Student is not enrolled in this course",
        )

    total_sessions = (
        await db.scalar(
            select(func.count(ClassSession.id)).where(
                ClassSession.course_id == course_id
            )
        )
        or 0
    )

    completed_sessions_result = await db.execute(
        select(
            func.count(ClassSession.id).label("session_count"),
            func.coalesce(func.sum(ClassSession.duration_hours), 0).label(
                "total_hours"
            ),
        ).where(
            ClassSession.course_id == course_id,
            ClassSession.status == SessionStatusEnum.COMPLETED,
        )
    )

    completed_sessions, completed_hours = completed_sessions_result.one()

    upcoming_sessions = (
        await db.scalar(
            select(func.count(ClassSession.id)).where(
                ClassSession.course_id == course_id,
                ClassSession.status == SessionStatusEnum.ACCEPTED,
                ClassSession.scheduled_start > now,
            )
        )
        or 0
    )

    attended_hours = float(
        await db.scalar(
            select(
                func.coalesce(
                    func.sum(ClassSession.duration_hours),
                    0.0,
                )
            )
            .select_from(Attendance)
            .join(
                ClassSession,
                ClassSession.id == Attendance.session_id,
            )
            .where(
                Attendance.enrollment_id == enrollment.id,
                Attendance.status == AttendanceStatus.PRESENT,
            )
        )
        or 0.0
    )

    remaining_hours = max(course.duration_hours - completed_hours, 0)

    attended_sessions = (
        await db.scalar(
            select(func.count(Attendance.id)).where(
                Attendance.enrollment_id == enrollment.id,
                Attendance.status == AttendanceStatus.PRESENT,
            )
        )
        or 0
    )

    absent_sessions = (
        await db.scalar(
            select(func.count(Attendance.id)).where(
                Attendance.enrollment_id == enrollment.id,
                Attendance.status == AttendanceStatus.ABSENT,
            )
        )
        or 0
    )

    missed_sessions = absent_sessions

    progress_percentage = (
        round((attended_hours / course.duration_hours) * 100)
        if course.duration_hours > 0
        else 0
    )

    next_session_obj = await db.scalar(
        select(ClassSession)
        .where(
            ClassSession.course_id == course_id,
            ClassSession.status == SessionStatusEnum.ACCEPTED,
            ClassSession.scheduled_start > now,
        )
        .order_by(ClassSession.scheduled_start.asc())
        .limit(1)
    )

    next_session = None

    if next_session_obj:
        next_session = StudentNextSessionResponse(
            session_id=next_session_obj.id,
            title=next_session_obj.title,
            scheduled_start=next_session_obj.scheduled_start,
            duration_hours=next_session_obj.duration_hours,
        )

    return StudentCourseSummaryResponse(
        course_id=course.id,
        course_name=course.name,
        course_code=course.code,
        status=course.status,
        enrollment_id=enrollment.id,
        is_completed=enrollment.is_completed,
        certificate_url=(
            build_file_url(enrollment.certificate.storage_key)
            if enrollment.certificate
            else None
        ),
        total_hours=course.duration_hours,
        attended_hours=attended_hours,
        remaining_hours=remaining_hours,
        progress_percentage=progress_percentage,
        total_sessions=total_sessions,
        completed_sessions=completed_sessions,
        upcoming_sessions=upcoming_sessions,
        missed_sessions=missed_sessions,
        attended_sessions=attended_sessions,
        absent_sessions=absent_sessions,
        attendance_percentage=enrollment.progress_percentage,
        next_session=next_session,
    )


@router.post("/", response_model=StudentData, status_code=status.HTTP_201_CREATED)
async def create_student(
    data: CreateStudentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
):
    existing_user = await db.scalar(select(User).where(User.email == data.email))

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists",
        )

    student_role = await db.scalar(
        select(Role).where(Role.name == RoleEnum.STUDENT.value)
    )

    if not student_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student role not found",
        )

    token = generate_password_token()

    expiry = get_password_token_expiry()

    user = User(
        email=data.email,
        role_id=student_role.id,
        is_active=False,
        password_token=token,
        password_token_expires_at=expiry,
    )

    db.add(user)

    await db.flush()

    student = Student(
        user_id=user.id,
        full_name=data.full_name,
    )

    db.add(student)

    await db.flush()

    quota = StudentTokenQuota(
        student_id=student.id,
        daily_quota=settings.STUDENT_DAILY_TOKEN_QUOTA,
        used_today=0,
        reset_at=date.today() + timedelta(days=1),
    )

    db.add(quota)

    await db.commit()

    student = await db.scalar(
        select(Student)
        .options(selectinload(Student.user))
        .where(Student.id == student.id)
    )

    setup_link = f"{settings.FRONTEND_URL}/setup-password?token={token}"

    await send_password_setup_email(
        email=user.email,
        setup_link=setup_link,
    )

    return serialize_student(student)


@router.get("/", response_model=StudentListResponse)
async def get_students(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
):
    query = select(Student).options(selectinload(Student.user))

    count_query = select(func.count()).select_from(Student)

    if search:
        search_filter = or_(
            Student.full_name.ilike(f"%{search}%"), User.email.ilike(f"%{search}%")
        )

        query = query.join(Student.user).where(search_filter)

        count_query = count_query.join(User).where(search_filter)

    total = await db.scalar(count_query)

    offset = (page - 1) * limit

    query = query.order_by(Student.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)

    students = result.scalars().all()

    return StudentListResponse(
        items=[serialize_student(student) for student in students],
        total=total,
        page=page,
        limit=limit,
        total_pages=ceil(total / limit) if total else 0,
    )


@router.get("/{student_id}", response_model=StudentWithCoursesData)
async def get_student_by_id(
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
):
    result = await db.execute(
        select(Student)
        .options(
            selectinload(Student.user),
            selectinload(Student.enrollments).selectinload(Enrollment.course),
        )
        .where(Student.id == student_id)
    )

    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    student_data = serialize_student(student)

    courses = []

    for enrollment in student.enrollments:
        course_progress_percentage, _ = calculate_course_progress(enrollment.course)

        courses.append(
            StudentCourseData(
                enrollment_id=enrollment.id,
                course_id=enrollment.course.id,
                name=enrollment.course.name,
                code=enrollment.course.code,
                thumbnail=(
                    build_file_url(enrollment.course.thumbnail)
                    if enrollment.course.thumbnail
                    else None
                ),
                course_progress_percentage=course_progress_percentage,
                student_progress_percentage=enrollment.progress_percentage,
                is_completed=enrollment.is_completed,
                enrolled_at=enrollment.enrolled_at,
            )
        )

    return StudentWithCoursesData(
        **student_data.model_dump(),
        courses=courses,
    )


@router.patch("/{student_id}", response_model=StudentData)
async def update_student(
    student_id: UUID,
    full_name: str | None = Form(None),
    phone: str | None = Form(None),
    dob: str | None = Form(None),
    gender: GenderEnum | None = Form(None),
    address: str | None = Form(None),
    profile_image: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.STUDENT)),
):
    result = await db.execute(
        select(Student)
        .options(selectinload(Student.user))
        .where(Student.id == student_id)
    )

    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
        )

    if (
        current_user.role.name == RoleEnum.STUDENT.value
        and student.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile",
        )

    if full_name is not None:
        student.full_name = full_name

    if phone is not None:
        student.phone = phone

    if dob is not None:
        student.dob = date.fromisoformat(dob)

    if gender is not None:
        student.gender = gender

    if address is not None:
        student.address = address

    if profile_image:
        allowed_types = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ]

        if profile_image.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image type",
            )

        os.makedirs("uploads/students", exist_ok=True)

        file_extension = profile_image.filename.split(".")[-1]

        unique_filename = f"{uuid.uuid4()}.{file_extension}"

        file_location = f"uploads/students/{unique_filename}"

        with open(file_location, "wb") as file:
            file.write(await profile_image.read())

        student.profile_image = file_location

    await db.commit()

    await db.refresh(student)

    return serialize_student(student)


@router.delete("/{student_id}", response_model=MessageResponse)
async def delete_student(
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
):
    result = await db.execute(
        select(Student)
        .options(selectinload(Student.user))
        .where(Student.id == student_id)
    )

    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    await db.delete(student.user)

    await db.commit()

    return {"message": "Student deleted successfully"}


@router.get("/{student_id}/courses", response_model=StudentCourseListResponse)
async def get_student_courses(
    student_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = None,
    status_filter: Literal["ACTIVE", "COMPLETED"] | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(
            RoleEnum.ADMIN,
            RoleEnum.STUDENT,
        )
    ),
):
    student = await db.scalar(select(Student).where(Student.id == student_id))

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    query = (
        select(Enrollment)
        .join(Enrollment.course)
        .options(selectinload(Enrollment.course).selectinload(Course.sessions))
        .where(Enrollment.student_id == student_id)
    )

    count_query = (
        select(func.count())
        .select_from(Enrollment)
        .join(Enrollment.course)
        .where(Enrollment.student_id == student_id)
    )

    # Status filter (same style as teacher API)
    if status_filter:
        course_status = CourseStatus(status_filter)

        query = query.where(Course.status == course_status)
        count_query = count_query.where(Course.status == course_status)

    # Search filter
    if search:
        search_filter = or_(
            Course.name.ilike(f"%{search}%"),
            Course.code.ilike(f"%{search}%"),
        )

        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total = await db.scalar(count_query)

    offset = (page - 1) * limit

    query = query.order_by(Enrollment.enrolled_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    enrollments = result.scalars().all()

    items = []

    for enrollment in enrollments:
        course_progress_percentage, completed_hours = calculate_course_progress(
            enrollment.course
        )

        items.append(
            StudentCourseData(
                enrollment_id=enrollment.id,
                course_id=enrollment.course.id,
                name=enrollment.course.name,
                code=enrollment.course.code,
                thumbnail=(
                    build_file_url(enrollment.course.thumbnail)
                    if enrollment.course.thumbnail
                    else None
                ),
                course_progress_percentage=course_progress_percentage,
                student_progress_percentage=enrollment.progress_percentage,
                is_completed=enrollment.is_completed,
                enrolled_at=enrollment.enrolled_at,
            )
        )

    return StudentCourseListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=ceil(total / limit) if total else 0,
    )


@router.get(
    "/me/sessions",
    response_model=list[SessionData],
    status_code=status.HTTP_200_OK,
)
async def get_my_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.STUDENT)),
):

    student = await db.scalar(select(Student).where(Student.user_id == current_user.id))

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )

    enrolled_course_ids_query = select(Enrollment.course_id).where(
        Enrollment.student_id == student.id
    )

    sessions = await db.scalars(
        select(ClassSession)
        .where(
            ClassSession.course_id.in_(enrolled_course_ids_query),
            ClassSession.status == SessionStatusEnum.ACCEPTED,
        )
        .order_by(ClassSession.scheduled_start.asc())
    ).all()

    return [serialize_classSession(session) for session in sessions]
