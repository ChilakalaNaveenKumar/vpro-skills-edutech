"""Auth dependencies used to protect routes across every module.

`auth` is treated as a foundational module (like `core`) that any other
module may depend on - this is the one deliberate exception to "domain
modules don't import each other" documented in docs/ARCHITECTURE.md,
because authorization is inherently a cross-cutting concern.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.enums import UserRole
from app.core.security import decode_access_token
from app.database.session import get_db
from app.users.models import User

# auto_error=False: HTTPBearer's own default raises 403 when no
# Authorization header is present at all, which would make "no token" and
# "bad token" return different status codes (403 vs our 401 below). We
# handle the missing-header case ourselves so both return 401, per the
# spec's "401 Unauthorized" convention for authentication failures.
_bearer_scheme = HTTPBearer(auto_error=False)

_CREDENTIALS_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the current user from the bearer token.

    Always re-checks the database (existence + is_active) rather than
    trusting the token's claims alone, so a deactivated account loses
    access immediately instead of waiting for its token to expire.
    """
    if credentials is None:
        raise _CREDENTIALS_ERROR

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise _CREDENTIALS_ERROR

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise _CREDENTIALS_ERROR
    return user


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    """Like get_current_user, but returns None instead of raising when
    there's no token, a bad token, or an inactive user - for endpoints
    that serve both anonymous/student and admin callers from one route
    (e.g. course/batch listings), where the caller's identity changes
    *what* they see rather than whether they're allowed in at all.
    """
    if credentials is None:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        return None

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        return None
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Gate admin-only endpoints. Students get a 403, not a 404 - the
    endpoint exists, they're just not allowed to use it.
    """
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
