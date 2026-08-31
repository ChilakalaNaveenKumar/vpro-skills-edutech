"""Pydantic schemas for the users module."""

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.enums import UserRole


class UserPublic(BaseModel):
    """The safe, public shape of a User row - never includes password_hash.

    Reused by the auth module for GET /api/auth/me since it's a
    representation of the User model, which users owns.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool


class UserCreate(BaseModel):
    """Admin-only account creation (Phase 8) - the HTTP equivalent of
    scripts/create_user.py's bootstrap CLI, which stays in place as an
    operational tool for the very first admin account. `password` gets the
    same minimum-length rule the CLI already enforces.
    """

    full_name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8)
    role: UserRole = UserRole.STUDENT


class UserUpdate(BaseModel):
    """All fields optional - the router applies only what's set
    (`exclude_unset`), same pattern as every other module's update schema.
    No email/password/role change in this phase - deactivation
    (`is_active=false`) is this app's substitute for hard delete, matching
    courses/batches, and is the only status-like field here.
    """

    full_name: str | None = Field(default=None, min_length=1, max_length=150)
    is_active: bool | None = None


class BatchAssignment(BaseModel):
    """Body for POST /api/users/{user_id}/batches - assigns a student to a
    batch (creates a StudentBatch row, this module's own table)."""

    batch_id: int
