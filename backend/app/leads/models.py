"""Outbound-CTA capture.

The web app has been firing at POST /api/leads since launch and the endpoint
never existed, so every click was silently dropped. This is where they land.
No personal data is collected here - it records which CTA was pressed, from
which section, and the campaign it arrived on.
"""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base, TimestampMixin


class Lead(Base, TimestampMixin):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True)
    cta: Mapped[str] = mapped_column(String(60), nullable=False)
    chapter: Mapped[str] = mapped_column(String(60), nullable=False)
    segment: Mapped[str | None] = mapped_column(String(120), nullable=True)
    course: Mapped[str | None] = mapped_column(String(200), nullable=True)
    utm_source: Mapped[str | None] = mapped_column(String(120), nullable=True)
    utm_medium: Mapped[str | None] = mapped_column(String(120), nullable=True)
    utm_campaign: Mapped[str | None] = mapped_column(String(120), nullable=True)
