"""Pydantic schemas for the site-content module."""

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, create_model

from app.core.enums import EntityStatus


def partial_of(model: type[BaseModel]) -> type[BaseModel]:
    """An all-optional twin of a write schema.

    A PUT here is a partial update - hiding a row sends only `status`, a
    reorder sends only `display_order`. Validating those against the full
    schema rejected them for missing required fields they were never meant to
    carry, so the Hide and Move buttons could not work.
    """
    fields = {
        name: (Optional[info.annotation], None) for name, info in model.model_fields.items()
    }
    return create_model(f"{model.__name__}Partial", **fields)  # type: ignore[call-overload]


class _OrderedBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    display_order: int
    status: EntityStatus


class TestimonialPublic(_OrderedBase):
    quote: str
    name: str
    role: str | None = None


class FaqPublic(_OrderedBase):
    question: str
    answer: str


class TenetPublic(_OrderedBase):
    number: str
    title: str
    body: str


class BatchLoopStepPublic(_OrderedBase):
    number: str
    title: str
    body: str


class TestimonialWrite(BaseModel):
    quote: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=150)
    role: str | None = Field(default=None, max_length=200)
    display_order: int = 0
    status: EntityStatus = EntityStatus.ACTIVE


class FaqWrite(BaseModel):
    question: str = Field(min_length=1, max_length=400)
    answer: str = Field(min_length=1)
    display_order: int = 0
    status: EntityStatus = EntityStatus.ACTIVE


class BlockWrite(BaseModel):
    """Shared by tenets and batch-loop steps - same three fields."""

    number: str = Field(min_length=1, max_length=8)
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1)
    display_order: int = 0
    status: EntityStatus = EntityStatus.ACTIVE


TestimonialPatch = partial_of(TestimonialWrite)
FaqPatch = partial_of(FaqWrite)
BlockPatch = partial_of(BlockWrite)


class SiteContentPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    key: str
    value: dict


class SiteContentWrite(BaseModel):
    value: dict
