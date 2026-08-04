from uuid import UUID
from datetime import date, datetime, timezone
from math import ceil

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
from app.models.teacher import Teacher
from app.models.student import GenderEnum
from app.models.course import Course, CourseStatus
from app.models.classSession import ClassSession, SessionStatusEnum
from app.models.enrollment import Enrollment
from app.models.attendance import Attendance, AttendanceStatus

from app.schemas.classSession import SessionData
from app.api.routes.classSession import serialize_classSession

from app.schemas.teacher import (
    MessageResponse,
    CreateTeacherRequest,
    TeacherData,
    TeacherListResponse,
    TeacherCourseData,
    CourseListResponse,
    TeacherDashboardCardsResponse,
    TeacherDashboardResponse,
    TeacherUpcomingSessionResponse,
    PendingApprovalResponse,
    CourseSummaryResponse,
    NextSessionResponse,
)
from app.schemas.course import CourseData, CourseStatus

from app.api.routes.course import serialize_course
from app.core.dependencies import require_role

from app.core.security import (
    generate_password_token,
    get_password_token_expiry,
)

from app.services.email_service import send_password_setup_email

from app.core.config import settings

from app.core.enums import RoleEnum
from app.utils.files import build_file_url

router = APIRouter(prefix="/teachers", tags=["Teachers"])


class MockTeacher:
    def __init__(self, id):
        self.id = id


def serialize_teacher(teacher: Teacher) -> TeacherData:
    return TeacherData(
        id=teacher.id,
        user_id=teacher.user_id,
        email=teacher.user.email,
        full_name=teacher.full_name,
        phone=teacher.phone,
        dob=teacher.dob,
        gender=teacher.gender,
        specialization=teacher.specialization,
        qualification=teacher.qualification,
        experience_years=teacher.experience_years,
        address=teacher.address,
        profile_image=(
            build_file_url(teacher.profile_image) if teacher.profile_image else None
        ),
        created_at=teacher.created_at,
    )


@router.get("/dashboard", response_model=TeacherDashboardResponse)
async def get_dashboard_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.TEACHER)),
):
    now = datetime.now(timezone.utc)

    teacher = current_user.teacher

    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    active_courses = await db.scalar(
        select(func.count(Course.id)).where(
            Course.teacher_id == teacher.id,
            Course.status == CourseStatus.ACTIVE,
        )
    )
    upcoming_sessions = await db.scalar(
        select(func.count(ClassSession.id)).where(
            ClassSession.teacher_id == teacher.id,
            ClassSession.status == SessionStatusEnum.ACCEPTED,
            ClassSession.scheduled_start >= now,
        )
    )
    completed_sessions = await db.scalar(
        select(func.count(ClassSession.id)).where(
            ClassSession.teacher_id == teacher.id,
            ClassSession.status == SessionStatusEnum.COMPLETED,
        )
    )
    teaching_hours = await db.scalar(
        select(func.coalesce(func.sum(ClassSession.duration_hours), 0)).where(
            ClassSession.teacher_id == teacher.id,
            ClassSession.status == SessionStatusEnum.COMPLETED,
        )
    )
    upcoming_sessions_list = await db.execute(
        select(
            ClassSession.id.label("session_id"),
            Course.id.label("course_id"),
            Course.name.label("course_name"),
            ClassSession.title.label("session_title"),
            ClassSession.scheduled_start,
            ClassSession.duration_hours,
        )
        .join(Course, Course.id == ClassSession.course_id)
        .where(
            ClassSession.teacher_id == teacher.id,
            ClassSession.status == SessionStatusEnum.ACCEPTED,
            ClassSession.scheduled_start >= now,
        )
        .order_by(ClassSession.scheduled_start.asc())
        .limit(5)
    )

    pending_approvals_list = await db.execute(
        select(
            ClassSession.id.label("session_id"),
            Course.id.label("course_id"),
            Course.name.label("course_name"),
            ClassSession.title.label("session_title"),
            ClassSession.scheduled_start,
            ClassSession.duration_hours,
        )
        .join(Course, Course.id == ClassSession.course_id)
        .where(
            ClassSession.teacher_id == teacher.id,
            ClassSession.status == SessionStatusEnum.PENDING,
            ClassSession.scheduled_start >= now,
        )
        .order_by(ClassSession.scheduled_start.asc())
        .limit(5)
    )

    return TeacherDashboardResponse(
        cards=TeacherDashboardCardsResponse(
            active_courses=active_courses,
            upcoming_sessions=upcoming_sessions,
            completed_sessions=completed_sessions,
            teaching_hours=teaching_hours,
        ),
        upcoming_sessions=[
            TeacherUpcomingSessionResponse(
                session_id=row.session_id,
                course_id=row.course_id,
                course_name=row.course_name,
                session_title=row.session_title,
                scheduled_start=row.scheduled_start,
                duration_hours=row.duration_hours,
            )
            for row in upcoming_sessions_list.all()
        ],
        pending_approvals=[
            PendingApprovalResponse(
                session_id=row.session_id,
                course_id=row.course_id,
                course_name=row.course_name,
                session_title=row.session_title,
                scheduled_start=row.scheduled_start,
                duration_hours=row.duration_hours,
            )
            for row in pending_approvals_list.all()
        ],
    )


@router.get("/dashboard/course/{course_id}", response_model=CourseSummaryResponse)
async def get_course_summary(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.TEACHER)),
):
    now = datetime.now(timezone.utc)

    course = await db.scalar(
        select(Course).where(
            Course.id == course_id,
            Course.teacher_id == current_user.teacher.id,
        )
    )

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found",
        )

    total_students = await db.scalar(
        select(func.count(Enrollment.id)).where(Enrollment.course_id == course_id)
    )

    total_hours = course.duration_hours

    completed_session_data = (
        await db.execute(
            select(
                func.count(ClassSession.id).label("completed_sessions"),
                func.coalesce(func.sum(ClassSession.duration_hours), 0).label(
                    "completed_hours"
                ),
            ).where(
                ClassSession.course_id == course_id,
                ClassSession.status == SessionStatusEnum.COMPLETED,
            )
        )
    ).first()

    completed_sessions = completed_session_data.completed_sessions
    completed_hours = completed_session_data.completed_hours

    remaining_hours = max(total_hours - completed_hours, 0)
    progress_percentage = (
        min(int((completed_hours / total_hours) * 100), 100) if total_hours else 0
    )

    upcoming_sessions = await db.scalar(
        select(func.count(ClassSession.id)).where(
            ClassSession.course_id == course_id,
            ClassSession.status == SessionStatusEnum.ACCEPTED,
            ClassSession.scheduled_start >= now,
        )
    )

    pending_sessions = await db.scalar(
        select(func.count(ClassSession.id)).where(
            ClassSession.course_id == course_id,
            ClassSession.status == SessionStatusEnum.PENDING,
        )
    )

    low_attendance_students = await db.scalar(
        select(func.count(Enrollment.id)).where(
            Enrollment.course_id == course_id,
            Enrollment.progress_percentage < 70,
        )
    )

    next_session_result = await db.execute(
        select(
            ClassSession.id.label("session_id"),
            ClassSession.title,
            ClassSession.scheduled_start,
            ClassSession.duration_hours,
        )
        .where(
            ClassSession.course_id == course_id,
            ClassSession.status == SessionStatusEnum.ACCEPTED,
            ClassSession.scheduled_start >= now,
        )
        .order_by(ClassSession.scheduled_start.asc())
        .limit(1)
    )

    next_session = next_session_result.first()

    return CourseSummaryResponse(
        course_id=course.id,
        course_name=course.name,
        course_code=course.code,
        status=course.status,
        total_students=total_students or 0,
        total_hours=total_hours or 0,
        completed_hours=completed_hours or 0,
        remaining_hours=remaining_hours or 0,
        progress_percentage=progress_percentage,
        completed_sessions=completed_sessions or 0,
        upcoming_sessions=upcoming_sessions or 0,
        pending_sessions=pending_sessions or 0,
        low_attendance_students=low_attendance_students,
        next_session=(
            NextSessionResponse(
                session_id=next_session.session_id,
                title=next_session.title,
                scheduled_start=next_session.scheduled_start,
                duration_hours=next_session.duration_hours,
            )
            if next_session
            else None
        ),
    )


@router.post("/", response_model=TeacherData, status_code=status.HTTP_201_CREATED)
async def create_teacher(
    data: CreateTeacherRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
):
    existing_user = await db.scalar(select(User).where(User.email == data.email))

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists",
        )

    teacher_role = await db.scalar(
        select(Role).where(Role.name == RoleEnum.TEACHER.value)
    )

    if not teacher_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher role not found",
        )

    token = generate_password_token()

    expiry = get_password_token_expiry()

    user = User(
        email=data.email,
        role_id=teacher_role.id,
        is_active=False,
        password_token=token,
        password_token_expires_at=expiry,
    )

    db.add(user)

    await db.flush()

    teacher = Teacher(
        user_id=user.id,
        full_name=data.full_name,
    )

    db.add(teacher)

    await db.commit()

    teacher = await db.scalar(
        select(Teacher)
        .options(selectinload(Teacher.user))
        .where(Teacher.id == teacher.id)
    )

    setup_link = f"{settings.FRONTEND_URL}/setup-password?token={token}"

    await send_password_setup_email(
        email=user.email,
        setup_link=setup_link,
    )

    return serialize_teacher(teacher)


@router.get("/", response_model=TeacherListResponse)
async def get_teachers(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
):
    query = select(Teacher).options(selectinload(Teacher.user))

    count_query = select(func.count()).select_from(Teacher)

    if search:
        search_filter = or_(
            Teacher.full_name.ilike(f"%{search}%"), User.email.ilike(f"%{search}%")
        )

        query = query.join(Teacher.user).where(search_filter)

        count_query = count_query.join(User).where(search_filter)

    total = await db.scalar(count_query)

    offset = (page - 1) * limit

    query = query.order_by(Teacher.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)

    teachers = result.scalars().all()

    return TeacherListResponse(
        items=[serialize_teacher(teacher) for teacher in teachers],
        total=total,
        page=page,
        limit=limit,
        total_pages=ceil(total / limit) if total else 0,
    )


@router.get("/{teacher_id}", response_model=TeacherCourseData)
async def get_teacher_by_id(
    teacher_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
):
    result = await db.execute(
        select(Teacher)
        .options(
            selectinload(Teacher.user),
            selectinload(Teacher.courses),
        )
        .where(Teacher.id == teacher_id)
    )

    teacher = result.scalar_one_or_none()

    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found",
        )

    teacher_data = serialize_teacher(teacher)

    return TeacherCourseData(
        **teacher_data.model_dump(),
        courses=[
            CourseData(
                id=course.id,
                teacher_id=course.teacher_id,
                name=course.name,
                code=course.code,
                description=course.description,
                thumbnail=(
                    build_file_url(course.thumbnail) if course.thumbnail else None
                ),
                duration_hours=course.duration_hours,
                price=course.price,
                status=course.status,
                created_at=course.created_at,
                updated_at=course.updated_at,
            )
            for course in teacher.courses
        ],
    )


@router.patch("/{teacher_id}", response_model=TeacherData)
async def update_teacher(
    teacher_id: UUID,
    full_name: str | None = Form(None),
    phone: str | None = Form(None),
    dob: str | None = Form(None),
    gender: GenderEnum | None = Form(None),
    specialization: str | None = Form(None),
    qualification: str | None = Form(None),
    experience_years: int | None = Form(None),
    address: str | None = Form(None),
    profile_image: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.TEACHER)),
):
    result = await db.execute(
        select(Teacher)
        .options(selectinload(Teacher.user))
        .where(Teacher.id == teacher_id)
    )

    teacher = result.scalar_one_or_none()

    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found",
        )

    if (
        current_user.role.name == RoleEnum.TEACHER.value
        and teacher.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile",
        )

    if full_name is not None:
        teacher.full_name = full_name

    if phone is not None:
        teacher.phone = phone

    if dob is not None:
        teacher.dob = date.fromisoformat(dob)

    if gender is not None:
        teacher.gender = gender

    if specialization is not None:
        teacher.specialization = specialization

    if qualification is not None:
        teacher.qualification = qualification

    if experience_years is not None:
        teacher.experience_years = experience_years

    if address is not None:
        teacher.address = address

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

        os.makedirs("uploads/teachers", exist_ok=True)

        file_extension = profile_image.filename.split(".")[-1]

        unique_filename = f"{uuid.uuid4()}.{file_extension}"

        file_location = f"uploads/teachers/{unique_filename}"

        with open(file_location, "wb") as file:
            file.write(await profile_image.read())

        teacher.profile_image = file_location

    await db.commit()

    await db.refresh(teacher)

    return serialize_teacher(teacher)


@router.delete(
    "/{teacher_id}",
    response_model=MessageResponse,
)
async def delete_teacher(
    teacher_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
):
    result = await db.execute(
        select(Teacher)
        .options(selectinload(Teacher.user))
        .where(Teacher.id == teacher_id)
    )

    teacher = result.scalar_one_or_none()

    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found",
        )

    await db.delete(teacher.user)

    await db.commit()

    return {"message": "Teacher deleted successfully"}


@router.get(
    "/{teacher_id}/courses",
    response_model=CourseListResponse,
)
async def get_teacher_courses(
    teacher_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = None,
    status_filter: CourseStatus | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(
            RoleEnum.ADMIN,
            RoleEnum.TEACHER,
        )
    ),
):
    teacher = await db.scalar(select(Teacher).where(Teacher.id == teacher_id))

    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found",
        )

    query = select(Course).where(Course.teacher_id == teacher_id)

    count_query = (
        select(func.count()).select_from(Course).where(Course.teacher_id == teacher_id)
    )

    if status_filter:
        course_status = CourseStatus(status_filter)

        query = query.where(Course.status == course_status)
        count_query = count_query.where(Course.status == course_status)

    if search:
        search_filter = or_(
            Course.name.ilike(f"%{search}%"),
            Course.code.ilike(f"%{search}%"),
        )

        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total = await db.scalar(count_query)

    offset = (page - 1) * limit

    query = query.order_by(Course.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    courses = result.scalars().all()

    return CourseListResponse(
        items=[serialize_course(course) for course in courses],
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
    current_user: User = Depends(require_role(RoleEnum.TEACHER)),
):

    teacher = await db.scalar(select(Teacher).where(Teacher.user_id == current_user.id))

    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher profile not found",
        )

    sessions = (
        await db.scalars(
            select(ClassSession)
            .where(ClassSession.teacher_id == teacher.id)
            .order_by(ClassSession.scheduled_start.asc())
        )
    ).all()

    return [serialize_classSession(session) for session in sessions]


@router.get(
    "/me/session-requests",
    response_model=list[SessionData],
    status_code=status.HTTP_200_OK,
)
async def get_my_session_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.TEACHER)),
):

    teacher = await db.scalar(select(Teacher).where(Teacher.user_id == current_user.id))

    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher profile not found",
        )

    session_requests = await db.scalars(
        select(ClassSession)
        .where(
            ClassSession.teacher_id == teacher.id,
            ClassSession.status == SessionStatusEnum.PENDING,
        )
        .order_by(ClassSession.created_at.desc())
    ).all()

    return [serialize_classSession(session) for session in session_requests]
