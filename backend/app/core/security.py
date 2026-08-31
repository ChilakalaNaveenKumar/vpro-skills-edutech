"""Password hashing and JWT helpers.

Pure infrastructure utilities - the real /auth/login and /auth/me endpoints
that consume these are implemented in Phase 3 (Backend Authentication) once
the User model exists (Phase 2).
"""

from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import jwt

from app.core.config import get_settings

# Uses the bcrypt library directly rather than passlib's CryptContext:
# passlib 1.7.x (its last release) probes bcrypt's internals in a way that
# is broken by bcrypt 4.x, raising at import/first-use. bcrypt's own API is
# a two-function, well-maintained equivalent for our single-scheme case.


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password. Passwords must never be stored as plain text.

    bcrypt only uses the first 72 bytes of the input - more than enough for
    any real password, but worth knowing if a caller ever validates length.
    """
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(subject: str, extra_claims: dict[str, Any] | None = None) -> str:
    """Create a signed JWT for the given subject (typically the user id)."""
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    to_encode: dict[str, Any] = {"sub": subject, "exp": expire}
    if extra_claims:
        to_encode.update(extra_claims)
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
