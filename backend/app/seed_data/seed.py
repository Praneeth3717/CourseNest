from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Role, User

from app.core.config import settings
from app.core.security import hash_password

from app.core.enums import RoleEnum


async def seed_roles(db: AsyncSession) -> None:
    for role in RoleEnum:
        stmt = select(Role).where(Role.name == role.value)

        result = await db.execute(stmt)

        existing_role = result.scalar_one_or_none()

        if not existing_role:
            db.add(Role(name=role.value))

    await db.commit()


async def seed_admin(db: AsyncSession) -> None:
    stmt = select(User).where(User.email == settings.ADMIN_EMAIL.lower())

    result = await db.execute(stmt)

    existing_user = result.scalar_one_or_none()

    if existing_user:
        return

    stmt = select(Role).where(Role.name == RoleEnum.ADMIN.value)

    result = await db.execute(stmt)

    admin_role = result.scalar_one_or_none()

    if not admin_role:
        raise Exception("Admin role not found. Run seed_roles() first.")

    admin_user = User(
        email=settings.ADMIN_EMAIL.lower(),
        password_hash=hash_password(settings.ADMIN_PASSWORD),
        role_id=admin_role.id,
        is_active=True,
    )

    db.add(admin_user)

    await db.commit()


async def run_seed(db: AsyncSession) -> None:
    await seed_roles(db)
    await seed_admin(db)
