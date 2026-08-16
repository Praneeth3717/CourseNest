from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import User
from app.core.security import decode_access_token
from app.core.enums import RoleEnum

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)

    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")

    if user_id is None:
        raise credentials_exception

    try:
        user_uuid = UUID(user_id)
    except (ValueError, AttributeError):
        raise credentials_exception

    user = await db.scalar(
        select(User)
        .options(
            selectinload(User.role),
            selectinload(User.teacher),
            selectinload(User.student),
        )
        .where(User.id == user_uuid)
    )

    if user is None:
        raise credentials_exception

    return user


def require_role(*allowed_roles: RoleEnum):
    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        allowed_role_names = {role.value for role in allowed_roles}

        if current_user.role.name not in allowed_role_names:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

        return current_user

    return role_checker
