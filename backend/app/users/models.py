"""SQLAlchemy models for the users module: accounts and batch enrollment.

`StudentBatch` lives here (rather than in `batches`) because assigning a
student to a batch is a student-management action - see
docs/ARCHITECTURE.md's "Database schema" section for the full rationale.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import UserRole
from app.database.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    student_batches: Mapped[list["StudentBatch"]] = relationship(
        back_populates="student", cascade="all, delete-orphan"
    )


class StudentBatch(Base):
    """Which batches a student is enrolled in (admin-assigned)."""

    __tablename__ = "student_batches"
    __table_args__ = (
        UniqueConstraint("student_id", "batch_id", name="uq_student_batches_student_batch"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    batch_id: Mapped[int] = mapped_column(
        ForeignKey("batches.id", ondelete="CASCADE"), index=True, nullable=False
    )
    enrolled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    student: Mapped["User"] = relationship(back_populates="student_batches")
