"""SQLAlchemy models for the courses module."""

from typing import TYPE_CHECKING

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import EntityStatus
from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.batches.models import Batch


class Course(Base, TimestampMixin):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[EntityStatus] = mapped_column(default=EntityStatus.ACTIVE, nullable=False)

    # Used by the batches module to eager-load a batch's course name
    # (selectinload) instead of one query per batch. Course.topics is
    # deliberately not added - nothing queries it that way (Phase 4 plan).
    batches: Mapped[list["Batch"]] = relationship(back_populates="course")
