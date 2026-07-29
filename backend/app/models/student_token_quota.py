from sqlalchemy import ForeignKey, Integer, Date
from sqlalchemy.orm import mapped_column, relationship

from app.db.base import Base


class StudentTokenQuota(Base):
    __tablename__ = "student_token_quotas"

    student_id = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"),
        primary_key=True,
    )

    daily_quota = mapped_column(Integer, nullable=False, default=100000)

    used_today = mapped_column(Integer, nullable=False, default=0)

    reset_at = mapped_column(Date, nullable=False)

    student = relationship(
        "Student",
        back_populates="token_quota",
    )
