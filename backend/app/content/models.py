"""Site copy that used to live in the frontend's content/*.ts files.

Four ordered lists the admin can add to and reorder, plus one key/value table
for the singletons (hero copy, trainer profile, contact details) - there is
exactly one of each, so a table apiece would be three tables holding one row.
"""

from sqlalchemy import JSON, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import EntityStatus
from app.database.base import Base, TimestampMixin


class _Ordered(Base, TimestampMixin):
    """Shared shape: an explicit display order and an active/inactive flag."""

    __abstract__ = True

    id: Mapped[int] = mapped_column(primary_key=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[EntityStatus] = mapped_column(default=EntityStatus.ACTIVE, nullable=False)


class Testimonial(_Ordered):
    __tablename__ = "testimonials"

    quote: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    role: Mapped[str | None] = mapped_column(String(200), nullable=True)


class Faq(_Ordered):
    __tablename__ = "faqs"

    question: Mapped[str] = mapped_column(String(400), nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)


class Tenet(_Ordered):
    """One of the "three things we will not move"."""

    __tablename__ = "tenets"

    number: Mapped[str] = mapped_column(String(8), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)


class BatchLoopStep(_Ordered):
    """One of the four steps a batch repeats per topic."""

    __tablename__ = "batch_loop_steps"

    number: Mapped[str] = mapped_column(String(8), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)


class SiteContent(Base, TimestampMixin):
    """A named blob: "hero", "trainer", "contact"."""

    __tablename__ = "site_content"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(60), unique=True, index=True, nullable=False)
    value: Mapped[dict] = mapped_column(JSON, nullable=False)
