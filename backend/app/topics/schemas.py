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
    # Attach (an id) or detach (explicit null) a reusable Assessment
    # (2026-08-31) - see app/topics/router.py's update_topic and
    # app/assessments/models.py's docstring. Omitting this field entirely
    # leaves the topic's current attachment untouched (the router applies
    # only what `exclude_unset` reports as actually sent); sending
    # `"assessment_id": null` explicitly detaches.
    assessment_id: int | None = None


class TopicPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    name: str
    topic_order: int
    status: EntityStatus
    assessment_id: int | None = None
