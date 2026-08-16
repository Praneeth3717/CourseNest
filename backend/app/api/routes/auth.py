import logging

from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.core.enums import RoleEnum
from app.core.dependencies import require_role


from app.models import User, Teacher, Student
from app.services.email_service import (
    send_password_reset_email,
    send_password_setup_email,
)

from app.schemas.auth import (
    MessageResponse,
    LoginResponse,
    AccessTokenRequest,
    AccessTokenResponse,
    ForgotPasswordRequest,
    PasswordTokenRequest,
    ChangePasswordRequest,
    StudentProfileResponse,
    TeacherProfileResponse,
    CurrentUserResponse,
)

from app.core.security import (
    verify_password,
    hash_password,
    create_access_token,
    create_refresh_token,
    get_refresh_token_expiry,
    generate_password_token,
    get_password_token_expiry,
)

from app.core.dependencies import get_current_user
from app.utils.files import build_file_url

router = APIRouter(prefix="/auth", tags=["Auth"])

logger = logging.getLogger(__name__)


@router.post("/login", response_model=LoginResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    user = await db.scalar(
        select(User)
        .options(joinedload(User.role))
        .where(User.email == form_data.username)
    )

    if user is None or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role.name,
        }
    )

    refresh_token = create_refresh_token()

    user.refresh_token = refresh_token
    user.refresh_token_expires_at = get_refresh_token_expiry()

    await db.commit()

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh_access_token(
    data: AccessTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await db.scalar(
        select(User)
        .options(joinedload(User.role))
        .where(User.refresh_token == data.refresh_token)
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    if (
        user.refresh_token_expires_at is None
        or user.refresh_token_expires_at <= datetime.now(timezone.utc)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired",
        )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role.name,
        }
    )

    return AccessTokenResponse(
        access_token=access_token,
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    current_user.refresh_token = None
    current_user.refresh_token_expires_at = None

    await db.commit()

    return MessageResponse(message="Logged out successfully")


@router.post(
    "/setup-password",
    response_model=MessageResponse,
)
async def setup_password(
    data: PasswordTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    user = await db.scalar(select(User).where(User.password_token == data.token))

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid setup token",
        )

    if (
        user.password_token_expires_at is None
        or user.password_token_expires_at <= datetime.now(timezone.utc)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Setup link has expired",
        )

    if user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account already active",
        )

    user.password_hash = hash_password(data.password)
    user.is_active = True
    user.password_token = None
    user.password_token_expires_at = None

    await db.commit()

    return MessageResponse(message="Password set successfully")


@router.post(
    "/request-password-reset",
    response_model=MessageResponse,
)
async def request_password_reset(
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:

    user = await db.scalar(select(User).where(User.email == data.email))

    if user is None or not user.is_active:
        return MessageResponse(
            message=(
                "If an account exists with this email, "
                "a password reset link has been sent."
            )
        )

    token = generate_password_token()
    expires_at = get_password_token_expiry()

    user.password_token = token
    user.password_token_expires_at = expires_at

    await db.commit()

    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    try:
        await send_password_reset_email(
            email=user.email,
            reset_link=reset_link,
        )
    except Exception:
        logger.exception(
            "Failed to send password reset email to %s",
            user.email,
        )

    return MessageResponse(
        message=(
            "If an account exists with this email, "
            "a password reset link has been sent."
        )
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
)
async def reset_password(
    data: PasswordTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:

    user = await db.scalar(select(User).where(User.password_token == data.token))

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token",
        )

    if (
        user.password_token_expires_at is None
        or user.password_token_expires_at <= datetime.now(timezone.utc)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset link has expired",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive",
        )

    user.password_hash = hash_password(data.password)

    user.password_token = None
    user.password_token_expires_at = None

    user.refresh_token = None
    user.refresh_token_expires_at = None

    await db.commit()

    return MessageResponse(message="Password reset successfully")


@router.post(
    "/change-password",
    response_model=MessageResponse,
)
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:

    if current_user.password_hash is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is not set for this account",
        )

    if not verify_password(
        data.current_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    if data.current_password == data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password",
        )

    current_user.password_hash = hash_password(data.new_password)

    current_user.refresh_token = None
    current_user.refresh_token_expires_at = None

    await db.commit()

    return MessageResponse(message="Password changed successfully")


@router.post(
    "/{user_id}/resend-setup-email",
    response_model=MessageResponse,
)
async def resend_setup_email(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(RoleEnum.ADMIN)),
) -> MessageResponse:

    user = await db.scalar(select(User).where(User.id == user_id))

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is already active",
        )

    token = generate_password_token()
    expiry = get_password_token_expiry()

    user.password_token = token
    user.password_token_expires_at = expiry

    await db.commit()

    setup_link = f"{settings.FRONTEND_URL}/setup-password?token={token}"

    await send_password_setup_email(
        email=user.email,
        setup_link=setup_link,
    )

    return MessageResponse(message="Setup email resent successfully")


@router.get(
    "/me",
    response_model=CurrentUserResponse,
)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CurrentUserResponse:

    profile = None

    if current_user.role.name == RoleEnum.TEACHER.value:
        teacher = await db.scalar(
            select(Teacher).where(Teacher.user_id == current_user.id)
        )

        if teacher:
            profile = TeacherProfileResponse.model_validate(teacher)

            profile.profile_image = build_file_url(teacher.profile_image)

    elif current_user.role.name == RoleEnum.STUDENT.value:
        student = await db.scalar(
            select(Student).where(Student.user_id == current_user.id)
        )

        if student:
            profile = StudentProfileResponse.model_validate(student)

            profile.profile_image = build_file_url(student.profile_image)

    return CurrentUserResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role.name,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        profile=profile,
    )
