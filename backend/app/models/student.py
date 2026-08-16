import uuid
from datetime import date, datetime

from sqlalchemy import String, Date, DateTime, ForeignKey, Enum as SqlEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base
from app.core.enums import GenderEnum

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models import Enrollment


class Student(Base):
    __tablename__ = "students"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    dob: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[GenderEnum | None] = mapped_column(
        SqlEnum(GenderEnum), nullable=True
    )
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    profile_image: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships

    user = relationship("User", back_populates="student")

    enrollments: Mapped[list["Enrollment"]] = relationship(
        "Enrollment", back_populates="student", cascade="all, delete-orphan"
    )
    token_quota = relationship(
        "StudentTokenQuota",
        back_populates="student",
        uselist=False,
        cascade="all, delete-orphan",
    )
