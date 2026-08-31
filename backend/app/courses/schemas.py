"""Pydantic schemas for the courses module."""

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import EntityStatus


class CourseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    status: EntityStatus = EntityStatus.ACTIVE


class CourseUpdate(BaseModel):
    """All fields optional - the router applies only what's set
    (`exclude_unset`), so a PUT can flip just `status` (Activate/Deactivate)
    without resending the rest of the course.
    """

    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: EntityStatus | None = None


class CoursePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    status: EntityStatus
