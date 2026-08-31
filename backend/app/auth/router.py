"""API router for authentication: login and the current-user endpoint."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.schemas import LoginRequest, TokenResponse
from app.core.security import create_access_token, verify_password
from app.database.session import get_db
from app.users.models import User
from app.users.schemas import UserPublic

router = APIRouter(prefix="/api/auth", tags=["Auth"])

_INVALID_CREDENTIALS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Incorrect email or password",
)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Email + password login. Returns a JWT the client sends as
    `Authorization: Bearer <token>` on every subsequent request.
    """
    user = db.scalar(select(User).where(User.email == payload.email.lower()))

    # Same generic message whether the email doesn't exist or the password
    # is wrong - never reveal which one it was.
    if user is None or not verify_password(payload.password, user.password_hash):
        raise _INVALID_CREDENTIALS

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")

    access_token = create_access_token(subject=str(user.id), extra_claims={"role": user.role.value})
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserPublic)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user
