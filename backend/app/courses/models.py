"""SQLAlchemy models for the courses module."""

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Index, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import EntityStatus
from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.batches.models import Batch
    from app.topics.models import Topic


class Course(Base, TimestampMixin):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[EntityStatus] = mapped_column(default=EntityStatus.ACTIVE, nullable=False)

    # Everything below was web/src/content/courses.ts until 2026-09-05. The
    # marketing pages read it from here now, so a wording change is an admin
    # edit rather than a code deploy.
    slug: Mapped[str | None] = mapped_column(String(120), unique=True, index=True, nullable=True)
    tagline: Mapped[str | None] = mapped_column(String(300), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    level: Mapped[str | None] = mapped_column(String(150), nullable=True)
    prerequisites: Mapped[str | None] = mapped_column(String(300), nullable=True)
    for_whom: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    outcomes: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    # Icon keys resolved by the frontend's techMarks registry. An unknown key is
    # skipped rather than rendered, so bad data cannot break a page.
    techs: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    hue: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # The comp's course-page explainer slot. Empty renders the marked
    # placeholder rather than an embed.
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    flagship: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # The shelf's order is editorial, not alphabetical.
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Used by the batches module to eager-load a batch's course name
    # (selectinload) instead of one query per batch. Course.topics is
    # deliberately not added - nothing queries it that way (Phase 4 plan).
    batches: Mapped[list["Batch"]] = relationship(back_populates="course")
    topics: Mapped[list["Topic"]] = relationship(
        back_populates="course", order_by="Topic.topic_order", cascade="all, delete-orphan"
    )
    projects: Mapped[list["CourseProject"]] = relationship(
        order_by="CourseProject.project_order", cascade="all, delete-orphan"
    )


class CourseProject(Base, TimestampMixin):
    """One 'you will build this' item, ordered within its course."""

    __tablename__ = "course_projects"
    __table_args__ = (Index("ix_course_projects_course_order", "course_id", "project_order"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    project_order: Mapped[int] = mapped_column(nullable=False)
