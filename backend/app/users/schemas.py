"""Pydantic schemas for the users module."""

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.enums import Origin, UserRole


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
    # Which storefront enrolled this student. Both are taught in the same
    # room, so the admin list needs to say whose customer each one is.
    origin: Origin


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
    # Defaulted for the same reason BatchCreate.origin is: a caller that
    # predates storefronts is enrolling a VPro student, which is what the
    # column already assumed. Without it the row took the model default and
    # nothing could record that a student came in through the partner.
    origin: Origin = Origin.VPRO


class UserUpdate(BaseModel):
    """All fields optional - the router applies only what's set
    (`exclude_unset`), same pattern as every other module's update schema.
    No email/password/role change here.

    `is_active=false` deactivates: the account can no longer log in, but the
    row, the email and the password hash all remain. That is the right tool
    for "this student has left". It is *not* erasure, and it does not answer
    a data deletion request - DELETE /api/users/{id} does. See docs/RUNBOOK.md.
    """

    full_name: str | None = Field(default=None, min_length=1, max_length=150)
    is_active: bool | None = None


class UserErasure(BaseModel):
    """Receipt for an irreversible deletion.

    Every other DELETE in this app answers 204. This one returns a body on
    purpose: it is the only endpoint that destroys a person's records with no
    way back, and whoever ran it needs to be able to say what went, both to
    the person who asked and to anyone auditing the request later.
    """

    deleted_user_id: int
    email: str
    enrollments_deleted: int
    attempts_deleted: int
    answers_deleted: int


class BatchAssignment(BaseModel):
    """Body for POST /api/users/{user_id}/batches - assigns a student to a
    batch (creates a StudentBatch row, this module's own table)."""

    batch_id: int
