from datetime import datetime, timezone, timedelta
from math import ceil
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import RoleEnum, SessionStatusEnum
from app.core.dependencies import require_role
from app.db.session import get_db

from app.models import ClassSession, Course, Teacher, User

from app.schemas.classSession import (
    MessageResponse,
    SessionData,
    SessionCreate,
    SessionListResponse,
    SessionResponseAction,
    SessionUpdate,
)

router = APIRouter(prefix="/courses", tags=["Sessions"])


def normalize_datetime(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def serialize_classSession(session: ClassSession) -> SessionData:
    return SessionData(
        id=session.id,
        course_id=session.course_id,
        teacher_id=session.teacher_id,
        title=session.title,
        description=session.description,
        scheduled_start=session.scheduled_start,
        duration_hours=session.duration_hours,
        attendance_marked=session.attendance_marked,
        status=session.status,
        teacher_response_message=session.teacher_response_message,
        responded_at=session.responded_at,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


async def validate_teacher_schedule(
    db: AsyncSession,
    teacher_id: UUID,
    new_start: datetime,
    duration_hours: float,
    exclude_session_id: UUID | None = None,
):
    new_start = normalize_datetime(new_start)
    new_end = new_start + timedelta(hours=duration_hours)

    existing_sessions = await db.scalars(
        select(ClassSession).where(
            ClassSession.teacher_id == teacher_id,
            ClassSession.status.in_(
                [
                    SessionStatusEnum.PENDING,
                    SessionStatusEnum.ACCEPTED,
                ]
            ),
        )
    )

    for session in existing_sessions.all():
        if exclude_session_id and session.id == exclude_session_id:
            continue
        existing_start = session.scheduled_start
        existing_end = existing_start + timedelta(hours=session.duration_hours)

        overlaps = existing_start < new_end and existing_end > new_start

        if overlaps:
            raise HTTPException(
                status_code=400,
                detail="Teacher already has another session during this time slot",
            )


@router.post(
    "/{course_id}/sessions",
    response_model=SessionData,
    status_code=status.HTTP_201_CREATED,
)
async def create_class_session(
    course_id: UUID,
    payload: SessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
):
    course = await db.scalar(select(Course).where(Course.id == course_id))

    if not course:
        raise HTTPException(404, "Course not found")

    if not course.teacher_id:
        raise HTTPException(400, "No teacher assigned to this course")

    await validate_teacher_schedule(
        db,
        course.teacher_id,
        payload.scheduled_start,
        payload.duration_hours,
    )

    session = ClassSession(
        course_id=course.id,
        teacher_id=course.teacher_id,
        title=payload.title,
        description=payload.description,
        scheduled_start=payload.scheduled_start,
        duration_hours=payload.duration_hours,
        status=SessionStatusEnum.PENDING,
    )

    db.add(session)
    await db.commit()
    await db.refresh(session)

    return serialize_classSession(session)


@router.get("/sessions", response_model=SessionListResponse)
async def get_all_sessions(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status_filter: SessionStatusEnum | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
):
    query = select(ClassSession)
    count_query = select(func.count()).select_from(ClassSession)

    if status_filter:
        query = query.where(ClassSession.status == status_filter)
        count_query = count_query.where(ClassSession.status == status_filter)

    total = await db.scalar(count_query)
    offset = (page - 1) * limit

    result = await db.execute(
        query.order_by(ClassSession.scheduled_start.desc()).offset(offset).limit(limit)
    )

    sessions = result.scalars().all()

    return SessionListResponse(
        items=[serialize_classSession(session) for session in sessions],
        total=total,
        page=page,
        limit=limit,
        total_pages=ceil(total / limit) if total else 0,
    )


@router.get("/sessions/{session_id}", response_model=SessionData)
async def get_session_by_id(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.TEACHER)),
):
    session = await db.scalar(select(ClassSession).where(ClassSession.id == session_id))

    if not session:
        raise HTTPException(404, "Session not found")

    return serialize_classSession(session)


@router.patch("/sessions/{session_id}", response_model=SessionData)
async def update_session(
    session_id: UUID,
    payload: SessionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
):
    session = await db.scalar(select(ClassSession).where(ClassSession.id == session_id))

    if not session:
        raise HTTPException(404, "Session not found")

    if session.status in [
        SessionStatusEnum.COMPLETED,
        SessionStatusEnum.CANCELLED,
    ]:
        raise HTTPException(
            status_code=400,
            detail="Completed or cancelled sessions cannot be updated",
        )

    new_start = payload.scheduled_start or session.scheduled_start
    new_duration = payload.duration_hours or session.duration_hours

    await validate_teacher_schedule(
        db,
        session.teacher_id,
        new_start,
        new_duration,
        exclude_session_id=session.id,
    )

    if payload.title is not None:
        session.title = payload.title

    if payload.description is not None:
        session.description = payload.description

    if payload.scheduled_start is not None:
        session.scheduled_start = payload.scheduled_start

    if payload.duration_hours is not None:
        session.duration_hours = payload.duration_hours

    await db.commit()
    await db.refresh(session)

    return serialize_classSession(session)


@router.delete(
    "/sessions/{session_id}",
    response_model=MessageResponse,
)
async def delete_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
):
    session = await db.scalar(select(ClassSession).where(ClassSession.id == session_id))

    if not session:
        raise HTTPException(404, "Session not found")

    await db.delete(session)
    await db.commit()

    return {"message": "Session deleted successfully"}


@router.get(
    "/{course_id}/sessions",
    response_model=SessionListResponse,
    status_code=status.HTTP_200_OK,
)
async def get_course_sessions(
    course_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = Query(None),
    status_filter: SessionStatusEnum | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.TEACHER)),
):

    course = await db.scalar(select(Course).where(Course.id == course_id))

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    query = select(ClassSession).where(ClassSession.course_id == course_id)

    count_query = (
        select(func.count())
        .select_from(ClassSession)
        .where(ClassSession.course_id == course_id)
    )

    if search:
        search_filter = ClassSession.title.ilike(f"%{search}%")

        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if status_filter:
        query = query.where(ClassSession.status == status_filter)

        count_query = count_query.where(ClassSession.status == status_filter)

    total = await db.scalar(count_query)

    offset = (page - 1) * limit

    query = (
        query.order_by(ClassSession.scheduled_start.desc()).offset(offset).limit(limit)
    )

    result = await db.execute(query)

    sessions = result.scalars().all()

    return SessionListResponse(
        items=[serialize_classSession(session) for session in sessions],
        total=total,
        page=page,
        limit=limit,
        total_pages=ceil(total / limit) if total else 0,
    )


@router.patch(
    "/sessions/{session_id}/respond",
    response_model=SessionData,
)
async def respond_to_session_request(
    session_id: UUID,
    payload: SessionResponseAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.TEACHER)),
):
    teacher = await db.scalar(select(Teacher).where(Teacher.user_id == current_user.id))

    if not teacher:
        raise HTTPException(404, "Teacher profile not found")

    session = await db.scalar(select(ClassSession).where(ClassSession.id == session_id))

    if not session:
        raise HTTPException(404, "Session not found")

    if session.teacher_id != teacher.id:
        raise HTTPException(403, "Unauthorized")

    if session.status != SessionStatusEnum.PENDING:
        raise HTTPException(
            status_code=400,
            detail="Session already responded",
        )

    if payload.status not in [
        SessionStatusEnum.ACCEPTED,
        SessionStatusEnum.REJECTED,
    ]:
        raise HTTPException(
            400,
            "Status must be ACCEPTED or REJECTED",
        )

    session.status = payload.status
    session.teacher_response_message = payload.message
    session.responded_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(session)

    return serialize_classSession(session)


@router.patch(
    "/sessions/{session_id}/complete",
    response_model=SessionData,
    status_code=status.HTTP_200_OK,
)
async def complete_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(
            RoleEnum.ADMIN,
            RoleEnum.TEACHER,
        )
    ),
):

    session = await db.scalar(select(ClassSession).where(ClassSession.id == session_id))

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    if current_user.role.name == RoleEnum.TEACHER.value:

        teacher = await db.scalar(
            select(Teacher).where(Teacher.user_id == current_user.id)
        )

        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher profile not found",
            )

        if session.teacher_id != teacher.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=("You cannot complete " "this session"),
            )

    if session.status != SessionStatusEnum.ACCEPTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=("Only accepted sessions " "can be completed"),
        )

    session.status = SessionStatusEnum.COMPLETED

    await db.commit()

    await db.refresh(session)

    return serialize_classSession(session)
