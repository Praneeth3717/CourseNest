from math import ceil
from uuid import UUID
import os
import uuid

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Form,
    Query,
)

from sqlalchemy import select, func, or_, case, literal
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db

from app.models import Course, User, Teacher, Enrollment, Student, Attendance

from app.core.dependencies import require_role

from app.core.enums import RoleEnum, CourseStatus, SessionStatusEnum
from app.utils.files import build_file_url, delete_file

from app.schemas.course import (
    MessageResponse,
    CourseData,
    CourseResponse,
    CourseListResponse,
    CourseDropdownResponse,
    CourseStudentListResponse,
)

from app.schemas.enrollment import CourseStudentResponse

from app.utils.progress import calculate_course_progress, calculate_student_progress

router = APIRouter(
    prefix="/courses",
    tags=["Courses"],
)


def serialize_course(course: Course) -> CourseData:
    return CourseData(
        id=course.id,
        teacher_id=course.teacher_id,
        name=course.name,
        code=course.code,
        description=course.description,
        thumbnail=build_file_url(course.thumbnail) if course.thumbnail else None,
        duration_hours=course.duration_hours,
        price=course.price,
        status=course.status,
        created_at=course.created_at,
        updated_at=course.updated_at,
    )


@router.post("/", status_code=201, response_model=CourseData)
async def create_course(
    name: str = Form(...),
    code: str = Form(...),
    description: str | None = Form(None),
    duration_hours: float | None = Form(None),
    price: float | None = Form(None),
    thumbnail: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
):
    existing_course = await db.scalar(select(Course).where(Course.code == code))

    if existing_course:
        raise HTTPException(400, "Course code already exists")

    thumbnail_path = None

    if thumbnail and thumbnail.filename:
        allowed_types = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
        }

        if thumbnail.content_type not in allowed_types:
            raise HTTPException(400, "Invalid image type")

        os.makedirs("uploads/courses", exist_ok=True)

        ext = allowed_types[thumbnail.content_type]
        filename = f"{uuid.uuid4()}{ext}"
        file_location = f"uploads/courses/{filename}"

        content = await thumbnail.read()

        with open(file_location, "wb") as f:
            f.write(content)

        thumbnail_path = file_location

    course = Course(
        name=name,
        code=code,
        description=description,
        thumbnail=thumbnail_path,
        duration_hours=duration_hours,
        price=price,
    )

    try:
        db.add(course)
        await db.commit()
        await db.refresh(course)
    except:
        await db.rollback()
        raise

    return serialize_course(course)


@router.get(
    "/",
    response_model=CourseListResponse,
    response_model_exclude_none=True,
)
async def get_courses(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = Query(None),
    status: CourseStatus | None = Query(None),
    teacher_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(
            RoleEnum.ADMIN,
            RoleEnum.STUDENT,
        )
    ),
):
    student = None

    if current_user.role.name == RoleEnum.STUDENT.value:
        student = await db.scalar(
            select(Student).where(Student.user_id == current_user.id)
        )

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found",
            )

    if student:
        query = (
            select(
                Course,
                case(
                    (Enrollment.id.isnot(None), literal(True)),
                    else_=literal(False),
                ).label("is_enrolled"),
            )
            .outerjoin(
                Enrollment,
                (Enrollment.course_id == Course.id)
                & (Enrollment.student_id == student.id),
            )
            .options(
                selectinload(Course.teacher),
                selectinload(Course.sessions),
            )
        )
    else:
        query = select(Course).options(
            selectinload(Course.teacher),
            selectinload(Course.sessions),
        )

    count_query = select(func.count()).select_from(Course)

    if search:
        search_filter = Course.name.ilike(f"%{search}%") | Course.code.ilike(
            f"%{search}%"
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if status is not None:
        query = query.where(Course.status == status)
        count_query = count_query.where(Course.status == status)

    if teacher_id:
        query = query.where(Course.teacher_id == teacher_id)
        count_query = count_query.where(Course.teacher_id == teacher_id)

    total = await db.scalar(count_query)
    offset = (page - 1) * limit
    query = query.order_by(Course.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)

    items = []

    if student:
        rows = result.all()
        for course, is_enrolled in rows:
            progress_percentage, completed_hours = calculate_course_progress(course)
            base = serialize_course(course).model_dump()
            items.append(
                CourseResponse(
                    **base,
                    completed_hours=completed_hours,
                    progress_percentage=progress_percentage,
                    teacher=course.teacher,
                    is_enrolled=is_enrolled,
                )
            )
    else:
        courses = result.scalars().all()
        for course in courses:
            progress_percentage, completed_hours = calculate_course_progress(course)
            base = serialize_course(course).model_dump()
            items.append(
                CourseResponse(
                    **base,
                    completed_hours=completed_hours,
                    progress_percentage=progress_percentage,
                    teacher=course.teacher,
                )
            )

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": ceil(total / limit) if total else 0,
    }


@router.get("/options", response_model=list[CourseDropdownResponse])
async def get_course_dropdown(
    search: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(
            RoleEnum.ADMIN,
        )
    ),
):
    query = select(Course)

    if search:
        query = query.where(
            or_(
                Course.name.ilike(f"%{search}%"),
                Course.code.ilike(f"%{search}%"),
            )
        )

    query = (
        query.where(Course.status == CourseStatus.ACTIVE)
        .order_by(Course.name.asc())
        .limit(limit)
    )
    result = await db.execute(query)

    courses = result.scalars().all()

    return [
        CourseDropdownResponse(
            id=course.id,
            name=course.name,
            code=course.code,
        )
        for course in courses
    ]


@router.patch("/{course_id}", response_model=CourseData)
async def update_course(
    course_id: UUID,
    name: str | None = Form(None),
    code: str | None = Form(None),
    description: str | None = Form(None),
    duration_hours: float | None = Form(None),
    price: float | None = Form(None),
    status: CourseStatus | None = Form(None),
    teacher_id: UUID | None = Form(None),
    thumbnail: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
):
    course = await db.scalar(select(Course).where(Course.id == course_id))

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    # Validate code uniqueness
    if code and code != course.code:
        existing_course = await db.scalar(select(Course).where(Course.code == code))

        if existing_course:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Course code already exists",
            )

        course.code = code

    # Update teacher if provided
    if teacher_id is not None:
        teacher = await db.scalar(select(Teacher).where(Teacher.id == teacher_id))

        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found",
            )

        course.teacher_id = teacher_id

    # Update simple fields
    if name is not None:
        course.name = name

    if description is not None:
        course.description = description

    if duration_hours is not None:
        course.duration_hours = duration_hours

    if price is not None:
        course.price = price

    if status is not None:
        course.status = status

    old_thumbnail = course.thumbnail

    # Update thumbnail
    if thumbnail and thumbnail.filename:
        ext_map = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
        }

        if thumbnail.content_type not in ext_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image type",
            )

        os.makedirs("uploads/courses", exist_ok=True)

        file_extension = ext_map[thumbnail.content_type]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_location = f"uploads/courses/{unique_filename}"

        content = await thumbnail.read()

        with open(file_location, "wb") as file:
            file.write(content)

        course.thumbnail = file_location

    try:
        await db.commit()
        await db.refresh(course)

    except Exception:
        await db.rollback()
        raise

    if (
        thumbnail
        and old_thumbnail
        and old_thumbnail != course.thumbnail
        and os.path.exists(old_thumbnail)
    ):
        os.remove(old_thumbnail)

    return serialize_course(course)


@router.get(
    "/{course_id}", response_model=CourseResponse, response_model_exclude_none=True
)
async def get_course_by_id(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(
            RoleEnum.ADMIN,
            RoleEnum.TEACHER,
            RoleEnum.STUDENT,
        )
    ),
):
    student = None
    if current_user.role.name == RoleEnum.STUDENT.value:
        student = await db.scalar(
            select(Student).where(Student.user_id == current_user.id)
        )
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found",
            )

    is_enrolled = None
    if student:
        enrollemnt = await db.scalar(
            select(Enrollment).where(
                Enrollment.course_id == course_id,
                Enrollment.student_id == student.id,
            )
        )
        is_enrolled = enrollemnt is not None

    result = await db.execute(
        select(Course)
        .options(
            selectinload(Course.teacher),
            selectinload(Course.sessions),
        )
        .where(Course.id == course_id)
    )

    course = result.scalar_one_or_none()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    progress_percentage, completed_hours = calculate_course_progress(course)

    base = serialize_course(course).model_dump()

    return CourseResponse(
        **base,
        completed_hours=completed_hours,
        progress_percentage=progress_percentage,
        teacher=course.teacher,
        is_enrolled=is_enrolled,
    )


@router.delete("/{course_id}", response_model=MessageResponse)
async def delete_course(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
):
    course = await db.scalar(select(Course).where(Course.id == course_id))

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    course_img = course.thumbnail

    try:
        await db.delete(course)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    delete_file(course_img)

    return {"message": "Course deleted successfully"}


@router.patch("/{course_id}/assign-teacher", response_model=MessageResponse)
async def assign_teacher_to_course(
    course_id: UUID,
    teacher_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
):
    course = await db.scalar(select(Course).where(Course.id == course_id))

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
        )

    if course.status == CourseStatus.ARCHIVED:
        raise HTTPException(
            status_code=400,
            detail="Cannot assign teacher to archived course",
        )

    teacher = await db.scalar(select(Teacher).where(Teacher.id == teacher_id))

    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher not found",
        )

    course.teacher_id = teacher_id

    await db.commit()

    return {"message": "Teacher assigned successfully"}


@router.patch("/{course_id}/remove-teacher", response_model=MessageResponse)
async def remove_teacher_from_course(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
):
    course = await db.scalar(select(Course).where(Course.id == course_id))

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    if not course.teacher_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course has no assigned teacher",
        )

    course.teacher_id = None

    await db.commit()

    return {"message": "Teacher removed successfully"}


@router.get(
    "/{course_id}/students",
    response_model=CourseStudentListResponse,
)
async def get_course_students(
    course_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(
            RoleEnum.ADMIN,
            RoleEnum.TEACHER,
        )
    ),
):
    course = await db.scalar(
        select(Course)
        .options(
            selectinload(Course.sessions),
        )
        .where(Course.id == course_id)
    )

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    _, completed_teaching_hours = calculate_course_progress(course)

    query = (
        select(Enrollment)
        .join(Student)
        .options(
            selectinload(Enrollment.student),
            selectinload(Enrollment.attendance_records).selectinload(
                Attendance.session
            ),
        )
        .where(Enrollment.course_id == course_id)
    )

    count_query = (
        select(func.count())
        .select_from(Enrollment)
        .join(Student)
        .where(Enrollment.course_id == course_id)
    )

    if search:
        search_filter = Student.full_name.ilike(f"%{search}%")

        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total = await db.scalar(count_query)

    offset = (page - 1) * limit

    query = query.order_by(Enrollment.enrolled_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)

    enrollments = result.scalars().all()

    items = []

    for enrollment in enrollments:

        progress_percentage, attended_hours = calculate_student_progress(
            enrollment,
            completed_teaching_hours,
        )

        is_completed = (
            course.status == CourseStatus.COMPLETED and progress_percentage >= 80
        )

        items.append(
            CourseStudentResponse(
                enrollment_id=enrollment.id,
                student_id=enrollment.student.id,
                full_name=enrollment.student.full_name,
                phone=enrollment.student.phone,
                profile_image=build_file_url(enrollment.student.profile_image),
                progress_percentage=round(
                    progress_percentage,
                    2,
                ),
                is_completed=is_completed,
                enrolled_at=enrollment.enrolled_at,
            )
        )

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (ceil(total / limit) if total else 0),
    }
