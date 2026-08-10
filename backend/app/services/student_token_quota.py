from uuid import UUID

from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import StudentTokenQuota


async def _reset_if_due(
    db: AsyncSession,
    student_id: UUID,
) -> StudentTokenQuota:
    await db.execute(
        update(StudentTokenQuota)
        .where(
            StudentTokenQuota.student_id == student_id,
            StudentTokenQuota.reset_at <= date.today(),
        )
        .values(
            used_today=0,
            reset_at=date.today() + timedelta(days=1),
        )
    )

    await db.commit()

    quota = await db.scalar(
        select(StudentTokenQuota).where(StudentTokenQuota.student_id == student_id)
    )

    return quota


async def enforce_token_quota(db: AsyncSession, student_id: UUID) -> StudentTokenQuota:

    quota = await _reset_if_due(db, student_id)

    if quota.used_today >= quota.daily_quota:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="You've reached your daily usage limit. It resets tomorrow — try again then.",
        )

    return quota


async def consume_tokens(db: AsyncSession, student_id: UUID, tokens_used: int) -> None:
    stmt = (
        update(StudentTokenQuota)
        .where(StudentTokenQuota.student_id == student_id)
        .values(
            used_today=func.least(
                StudentTokenQuota.used_today + tokens_used,
                StudentTokenQuota.daily_quota,
            )
        )
    )

    await db.execute(stmt)
    await db.commit()
