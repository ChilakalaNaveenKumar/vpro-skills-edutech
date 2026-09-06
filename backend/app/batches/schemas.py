"""Pydantic schemas for the batches module."""

from datetime import date, time
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.core.enums import BatchProgressStatus, EntityStatus, Origin

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
    trainer_email: EmailStr
    seats_note: str | None = Field(default=None, max_length=80)
    days_of_week: str | None = Field(default=None, max_length=120)
    # Which storefront the batch belongs to. Defaulted rather than required so
    # an existing caller that never heard of storefronts keeps creating VPro's
    # own batches, which is what it meant. Without this field on the schema
    # there was no way to create a partner batch at all: the router builds the
    # row straight from this payload, so every batch the admin panel made took
    # the model default and the partner API had nothing to return.
    origin: Origin = Origin.VPRO
    status: EntityStatus = EntityStatus.ACTIVE
    progress_status: BatchProgressStatus = BatchProgressStatus.IN_PROGRESS

    @model_validator(mode="after")
    def _check_ordering(self) -> "BatchCreate":
        if self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class BatchUpdate(BaseModel):
    batch_number: str | None = Field(default=None, min_length=1, max_length=20)
    start_date: date | None = None
    end_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None
    trainer_name: str | None = Field(default=None, min_length=1, max_length=150)
    trainer_email: EmailStr | None = None
    seats_note: str | None = Field(default=None, max_length=80)
    days_of_week: str | None = Field(default=None, max_length=120)
    # Moving a batch between storefronts is a correction an admin has to be
    # able to make - a batch created against the wrong one is otherwise stuck
    # on a site it does not belong to, visible to the wrong customers.
    origin: Origin | None = None
    status: EntityStatus | None = None
    progress_status: BatchProgressStatus | None = None

    # Only catches the case where the *request itself* supplies both ends
    # out of order. A partial update (e.g. only end_date, leaving the
    # existing start_date on the row untouched) can't be checked here -
    # this schema has no access to the row being updated - so
    # app/batches/router.py's update_batch also re-checks the *merged*
    # result before committing. Both checks are needed; neither is
    # redundant with the other.
    @model_validator(mode="after")
    def _check_ordering(self) -> "BatchUpdate":
        if self.start_date is not None and self.end_date is not None and self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        if self.start_time is not None and self.end_time is not None and self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


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
    trainer_email: EmailStr | None
    seats_note: str | None
    days_of_week: str | None
    # Read by the admin list, which is the one view showing both storefronts
    # at once and so the one place a row is ambiguous without it. The public
    # route filters to VPRO before serialising, so this only ever says "VPRO"
    # to a visitor - it tells them a field exists, not what is behind it.
    origin: Origin
    status: EntityStatus
    progress_status: BatchProgressStatus

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
            trainer_email=batch.trainer_email,
            seats_note=batch.seats_note,
            days_of_week=batch.days_of_week,
            origin=batch.origin,
            status=batch.status,
            progress_status=batch.progress_status,
        )
