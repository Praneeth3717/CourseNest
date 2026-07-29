from dataclasses import dataclass
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession


@dataclass(frozen=True)
class RuntimeContext:
    student_id: UUID
    student_name: str
    db: AsyncSession
