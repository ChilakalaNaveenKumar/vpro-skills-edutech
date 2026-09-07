"""One-time tokens for students who never chose a password.

A student provisioned through a partner paid on the partner's site and never
saw a VPro signup form, so there is no password to log in with. This table
carries a short-lived, single-use token that lets them set one.

It lives in `partner` because that is the only thing that creates them today. A
future self-service password reset would share the table rather than adding a
second one - the shape is already right for it.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class PasswordSetupToken(Base):
    __tablename__ = "password_setup_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    # Hashed, never the token itself: a leaked database must not yield working
    # links, for the same reason password_hash exists on users.
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    # The partner's own reference, so a support question about one student can
    # be traced without VPro holding anything about their payment.
    external_ref: Mapped[str | None] = mapped_column(String(100), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    # Set on redemption. Single use: a forwarded link stops working the moment
    # the student has used it.
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
