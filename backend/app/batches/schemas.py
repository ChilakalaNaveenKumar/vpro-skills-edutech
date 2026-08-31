"""Pydantic schemas for the batches module."""

from datetime import date, time
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.core.enums import EntityStatus

if TYPE_CHECKING:
    from app.batches.models import Batch


class BatchCreate(BaseModel):
    course_id: int
    batch_number: str = Field(min_length=1, max_length=20)
    start_date: date
    end_date: date
    start_time: time
    end_time: time
    trainer_name: str = Field(min_length=1, max_length=150)
    status: EntityStatus = EntityStatus.ACTIVE

    @model_validator(mode="after")
    def _check_date_order(self) -> "BatchCreate":
        if self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        return self


class BatchUpdate(BaseModel):
    batch_number: str | None = Field(default=None, min_length=1, max_length=20)
    start_date: date | None = None
    end_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None
    trainer_name: str | None = Field(default=None, min_length=1, max_length=150)
    status: EntityStatus | None = None


class BatchPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    course_name: str
    batch_number: str
    start_date: date
    end_date: date
    start_time: time
    end_time: time
    trainer_name: str
    status: EntityStatus

    @classmethod
    def from_model(cls, batch: "Batch") -> "BatchPublic":
        # course_name isn't a column on Batch, so it's assembled here from
        # the eager-loaded relationship rather than relying on
        # from_attributes to find a field that doesn't exist on the model.
        # Shared by batches/router.py and users/router.py's "my batches"
        # endpoint - both eager-load Batch.course before calling this.
        return cls(
            id=batch.id,
            course_id=batch.course_id,
            course_name=batch.course.name,
            batch_number=batch.batch_number,
            start_date=batch.start_date,
            end_date=batch.end_date,
            start_time=batch.start_time,
            end_time=batch.end_time,
            trainer_name=batch.trainer_name,
            status=batch.status,
        )
