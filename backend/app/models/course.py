import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean, Float, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base

from app.core.enums import CourseStatus

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models import ClassSession, Enrollment


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    teacher_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("teachers.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    thumbnail: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    duration_hours: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    price: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    status: Mapped[CourseStatus] = mapped_column(
        Enum(CourseStatus),
        default=CourseStatus.DRAFT,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    teacher = relationship("Teacher", back_populates="courses")

    enrollments: Mapped[list["Enrollment"]] = relationship(
        "Enrollment",
        back_populates="course",
        cascade="all, delete-orphan",
    )

    sessions: Mapped[list["ClassSession"]] = relationship(
        "ClassSession",
        back_populates="course",
        cascade="all, delete-orphan",
    )
