import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)
from sqlalchemy.sql import func

from app.db.base import Base


class Certificate(Base):
    __tablename__ = "certificates"

    __table_args__ = (
        UniqueConstraint("enrollment_id", name="uq_certificate_enrollment"),
        UniqueConstraint("certificate_number", name="uq_certificate_number"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    enrollment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("enrollments.id", ondelete="CASCADE"),
        nullable=False,
    )

    certificate_number: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    storage_key: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    enrollment = relationship(
        "Enrollment",
        back_populates="certificate",
    )
