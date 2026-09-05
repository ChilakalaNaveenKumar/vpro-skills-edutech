"""Pydantic schemas for the leads module."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LeadCapture(BaseModel):
    """What the web app sends on the way out to WhatsApp. Deliberately narrow:
    no name, phone or message - the conversation itself happens on WhatsApp."""

    cta: str = Field(min_length=1, max_length=60)
    chapter: str = Field(min_length=1, max_length=60)
    segment: str | None = Field(default=None, max_length=120)
    course: str | None = Field(default=None, max_length=200)
    utm_source: str | None = Field(default=None, max_length=120)
    utm_medium: str | None = Field(default=None, max_length=120)
    utm_campaign: str | None = Field(default=None, max_length=120)


class LeadPublic(LeadCapture):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
