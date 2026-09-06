"""SQLAlchemy models for the batches module."""

from datetime import date, time
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, String, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import BatchProgressStatus, EntityStatus, Origin
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
    # Editorial, per batch - the comp shows "Few seats left" on one and
    # "Registration open" on the next. Nothing is counted; this is what the
    # admin chooses to say about this batch.
    seats_note: Mapped[str | None] = mapped_column(String(80), nullable=True)
    # Real capacity, when it is tracked. Null means it is not, and the note
    # above is the only thing said about seats.
    seats_total: Mapped[int | None] = mapped_column(nullable=True)
    # e.g. "Weekdays", "Sat & Sun". The hour was being shown without saying
    # which days it falls on, because there was no field for it.
    days_of_week: Mapped[str | None] = mapped_column(String(120), nullable=True)
    # Nullable (unlike trainer_name) purely for backward compatibility with
    # batches created before this field existed (2026-08-31) - the API
    # schema (BatchCreate) requires it for every *new* batch; only batches
    # created before this migration can have a null value here.
    trainer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Which storefront this batch belongs to. Defaults to VPRO so every batch
    # that existed before this column stays on VPro's own site, unchanged.
    origin: Mapped[Origin] = mapped_column(default=Origin.VPRO, nullable=False, index=True)
    status: Mapped[EntityStatus] = mapped_column(default=EntityStatus.ACTIVE, nullable=False)
    # Training progress, separate from `status` above (see
    # BatchProgressStatus's own docstring) - defaults to IN_PROGRESS for
    # every newly created batch.
    progress_status: Mapped[BatchProgressStatus] = mapped_column(
        default=BatchProgressStatus.IN_PROGRESS, nullable=False
    )

    course: Mapped["Course"] = relationship(back_populates="batches")
