"""Schemas for the partner API.

Deliberately narrow. The provisioning payload is the whole contract between
Digi-Setu and VPro: four fields, none of them about money. Digi-Setu bills the
student and holds the payment record; VPro teaches them. A wider payload here
would leak the retail price, and with it Digi-Setu's margin on a course VPro
sells them at wholesale.
"""

from pydantic import BaseModel, EmailStr, Field


class PartnerStudentCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    batch_id: int
    # An opaque handle from the partner's own records. Meaningless here, which
    # is the point: it lets a support question be traced back without VPro
    # learning anything about the payment behind it.
    external_ref: str = Field(min_length=1, max_length=100)


class PartnerStudentResponse(BaseModel):
    user_id: int
    email: EmailStr
    batch_id: int
    # True when this call created the account, false when it already existed.
    # A webhook retry is not an error and must not read like one.
    created: bool
    # Absolute URL the student uses to choose their own password. Present only
    # when a fresh token was issued.
    set_password_url: str | None = None


class SetPasswordRequest(BaseModel):
    token: str = Field(min_length=10, max_length=200)
    # Same floor the admin-creation path enforces, so there is one rule.
    password: str = Field(min_length=8, max_length=200)
