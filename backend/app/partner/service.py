"""Provisioning a partner's student, and nothing else.

Kept out of router.py because the rules here are the interesting part and are
worth reading on their own:

  * the batch must belong to the calling partner - a partner cannot put a
    student into VPro's own cohort, or into another partner's
  * the student is created with the partner's origin, so VPro's own site and
    roster filters continue to exclude them
  * it is idempotent on email - payment webhooks retry, and a retry must not
    create a second account or a second enrolment
  * no password is set. The student never chose one, so a one-time token is
    issued instead and they set their own. Generating a password here would
    mean transmitting it, and a password in an email is a password in an inbox
    forever.
"""

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.batches.models import Batch
from app.core.config import get_settings
from app.core.enums import EntityStatus, Origin, UserRole
from app.core.security import hash_password, verify_password
from app.partner.models import PasswordSetupToken
from app.partner.schemas import PartnerStudentResponse
from app.users.models import StudentBatch, User

# Long enough that the student is not rushed, short enough that a forwarded
# email does not stay usable indefinitely.
TOKEN_TTL = timedelta(days=14)


def provision_student(
    db: Session,
    *,
    origin: Origin,
    full_name: str,
    email: str,
    batch_id: int,
    external_ref: str,
) -> PartnerStudentResponse:
    email = email.lower()

    batch = db.get(Batch, batch_id)
    # Same 404 whether the batch does not exist or belongs to someone else:
    # a partner must not be able to probe for other storefronts' batch ids.
    if batch is None or batch.origin != origin or batch.status != EntityStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found for this partner",
        )

    user = db.scalar(select(User).where(User.email == email))
    created = False

    if user is None:
        user = User(
            full_name=full_name,
            email=email,
            # Unusable by design: this hash is of a random secret nobody holds,
            # so the only way in is the set-password token below. A nullable
            # password column would have been a bigger change and a worse one.
            password_hash=hash_password(secrets.token_urlsafe(32)),
            role=UserRole.STUDENT,
            origin=origin,
        )
        db.add(user)
        db.flush()
        created = True
    elif user.origin != origin:
        # The same person may legitimately be a VPro student already. Refusing
        # is safer than silently moving their account between storefronts.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with that email already exists under another origin",
        )

    already_enrolled = db.scalar(
        select(StudentBatch).where(
            StudentBatch.student_id == user.id, StudentBatch.batch_id == batch_id
        )
    )
    if already_enrolled is None:
        db.add(StudentBatch(student_id=user.id, batch_id=batch_id))

    set_password_url = None
    if created:
        set_password_url = _issue_token(db, user, external_ref)

    db.commit()
    return PartnerStudentResponse(
        user_id=user.id,
        email=user.email,
        batch_id=batch_id,
        created=created,
        set_password_url=set_password_url,
    )


def _issue_token(db: Session, user: User, external_ref: str) -> str:
    raw = secrets.token_urlsafe(32)
    db.add(
        PasswordSetupToken(
            user_id=user.id,
            # Only the hash is stored. A leaked database must not hand out
            # working links, exactly as with passwords.
            token_hash=hash_password(raw),
            external_ref=external_ref,
            expires_at=datetime.now(timezone.utc) + TOKEN_TTL,
        )
    )
    base = (get_settings().public_web_url or "").rstrip("/")
    return f"{base}/set-password?token={raw}"


_INVALID_TOKEN = HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="That link is no longer valid. Ask us for a new one.",
)


def redeem_password_token(db: Session, *, token: str, new_password: str) -> None:
    """Set a password from a one-time token, then burn the token.

    Only the hash is stored, so the token cannot be looked up directly - every
    unexpired, unused row is checked instead. That is a handful of rows in
    practice, and it keeps the table free of anything usable if it leaks.
    """
    now = datetime.now(timezone.utc)
    candidates = db.scalars(
        select(PasswordSetupToken).where(
            PasswordSetupToken.used_at.is_(None),
            PasswordSetupToken.expires_at > now,
        )
    ).all()

    match = next((row for row in candidates if verify_password(token, row.token_hash)), None)
    if match is None:
        raise _INVALID_TOKEN

    user = db.get(User, match.user_id)
    if user is None or not user.is_active:
        raise _INVALID_TOKEN

    user.password_hash = hash_password(new_password)
    match.used_at = now
    # Any other outstanding token for this user is void: they have set a
    # password, so an older link in another inbox must stop working.
    for row in candidates:
        if row.user_id == user.id and row.used_at is None:
            row.used_at = now
    db.commit()
