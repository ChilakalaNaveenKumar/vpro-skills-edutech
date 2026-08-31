"""SQLAlchemy models for the topics module."""

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import EntityStatus
from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.courses.models import Course


class Topic(Base, TimestampMixin):
    __tablename__ = "topics"
    __table_args__ = (Index("ix_topics_course_order", "course_id", "topic_order"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    topic_order: Mapped[int] = mapped_column(nullable=False)
    status: Mapped[EntityStatus] = mapped_column(default=EntityStatus.ACTIVE, nullable=False)

    # Read-only convenience for the results module's reporting joins
    # (Phase 7) - lets an attempt's course name be reached in one
    # eager-loaded chain (attempt -> assessment -> topic -> course).
    course: Mapped["Course"] = relationship()
