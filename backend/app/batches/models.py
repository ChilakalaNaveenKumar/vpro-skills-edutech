"""SQLAlchemy models for the batches module."""

from datetime import date, time
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, String, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import EntityStatus
from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.courses.models import Course


class Batch(Base, TimestampMixin):
    __tablename__ = "batches"
    __table_args__ = (
        UniqueConstraint("course_id", "batch_number", name="uq_batches_course_number"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), index=True, nullable=False
    )
    batch_number: Mapped[str] = mapped_column(String(20), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    # Stored in IST (the org's single operating timezone per the product
    # spec) rather than adding a timezone column - not needed for Phase 1.
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    trainer_name: Mapped[str] = mapped_column(String(150), nullable=False)
    status: Mapped[EntityStatus] = mapped_column(default=EntityStatus.ACTIVE, nullable=False)

    course: Mapped["Course"] = relationship(back_populates="batches")
