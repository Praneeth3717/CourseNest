from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.constants.roles import RoleEnum
from app.core.dependencies import require_role


from app.models.user import User
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
)

from app.core.tokens import (
    create_access_token,
    create_refresh_token,
    get_refresh_token_expiry,
    generate_password_token,
    get_password_token_expiry,
)

from app.core.dependencies import get_current_user
from app.utils.files import build_file_url

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=LoginResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User)
        .options(selectinload(User.role))
        .where(User.email == form_data.username)
    )

    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    if not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
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
    refresh_expiry = get_refresh_token_expiry()

    user.refresh_token = refresh_token
    user.refresh_token_expires_at = refresh_expiry

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
    result = await db.execute(
        select(User)
        .options(selectinload(User.role))
        .where(User.refresh_token == data.refresh_token)
    )

    user = result.scalar_one_or_none()

    if not user:
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
        not user.refresh_token_expires_at
        or user.refresh_token_expires_at < datetime.now(timezone.utc)
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

    return AccessTokenResponse(access_token=access_token)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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
):
    result = await db.execute(select(User).where(User.password_token == data.token))

    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid setup token",
        )

    if (
        not user.password_token_expires_at
        or user.password_token_expires_at < datetime.now(timezone.utc)
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
):
    result = await db.execute(select(User).where(User.email == data.email))

    user = result.scalar_one_or_none()

    if not user:
        return MessageResponse(
            message=(
                "If an account with this email exists,a password reset link has been sent."
            )
        )

    token = generate_password_token()

    user.password_token = token
    user.password_token_expires_at = get_password_token_expiry()

    await db.commit()

    reset_link = f"{settings.FRONTEND_URL}" f"/reset-password?token={token}"

    await send_password_reset_email(
        user.email,
        reset_link,
    )

    return MessageResponse(
        message=(
            "If an account with this email exists,a password reset link has been sent."
        )
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
)
async def reset_password(
    data: PasswordTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.password_token == data.token))

    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token",
        )

    if (
        not user.password_token_expires_at
        or user.password_token_expires_at < datetime.now(timezone.utc)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset link has expired",
        )

    user.password_hash = hash_password(data.password)

    user.password_token = None
    user.password_token_expires_at = None

    await db.commit()

    return MessageResponse(message="Password reset successfully")


@router.post(
    "/change-password",
    response_model=MessageResponse,
)
async def change_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is not set",
        )

    if not verify_password(
        data.current_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    if verify_password(
        data.new_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different",
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
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
):
    result = await db.execute(select(User).where(User.id == user_id))

    user = result.scalar_one_or_none()

    if not user:
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

    setup_link = f"{settings.FRONTEND_URL}" f"/setup-password?token={token}"

    await send_password_setup_email(
        email=user.email,
        setup_link=setup_link,
    )

    return MessageResponse(message="Setup email resent successfully")


@router.get("/me", response_model=CurrentUserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    profile = None

    if current_user.role.name == RoleEnum.TEACHER and current_user.teacher:
        profile = TeacherProfileResponse(
            id=current_user.teacher.id,
            user_id=current_user.teacher.user_id,
            full_name=current_user.teacher.full_name,
            phone=current_user.teacher.phone,
            dob=current_user.teacher.dob,
            gender=current_user.teacher.gender,
            specialization=current_user.teacher.specialization,
            qualification=current_user.teacher.qualification,
            experience_years=current_user.teacher.experience_years,
            address=current_user.teacher.address,
            profile_image=build_file_url(current_user.teacher.profile_image),
            created_at=current_user.teacher.created_at,
        )

    elif current_user.role.name == RoleEnum.STUDENT and current_user.student:
        profile = StudentProfileResponse(
            id=current_user.student.id,
            user_id=current_user.student.user_id,
            full_name=current_user.student.full_name,
            phone=current_user.student.phone,
            dob=current_user.student.dob,
            gender=current_user.student.gender,
            address=current_user.student.address,
            profile_image=build_file_url(current_user.student.profile_image),
            created_at=current_user.student.created_at,
        )

    return CurrentUserResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role.name,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        profile=profile,
    )
