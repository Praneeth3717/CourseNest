from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import Role
from app.schemas.role import RoleResponse

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get("/", response_model=list[RoleResponse])
async def get_roles(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Role).order_by(Role.name))

    return result.scalars().all()
