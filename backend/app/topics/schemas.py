"""Pydantic schemas for the topics module."""

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import EntityStatus


class TopicCreate(BaseModel):
    course_id: int
    name: str = Field(min_length=1, max_length=200)
    topic_order: int = Field(ge=1)
    status: EntityStatus = EntityStatus.ACTIVE


class TopicUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    topic_order: int | None = Field(default=None, ge=1)
    status: EntityStatus | None = None


class TopicPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    name: str
    topic_order: int
    status: EntityStatus
