"""Pydantic schemas for the questions module.

Admin-only: students never see these shapes directly (only through the
assessments module's take/submit endpoints, which strip is_correct
entirely) - see app/assessments/schemas.py for the student-facing shapes.
"""

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.core.enums import EntityStatus


class QuestionOptionIn(BaseModel):
    option_label: str = Field(min_length=1, max_length=1)
    option_text: str = Field(min_length=1)
    is_correct: bool = False


def _validate_four_options(options: list[QuestionOptionIn]) -> list[QuestionOptionIn]:
    if len(options) != 4:
        raise ValueError("A question must have exactly 4 options")
    labels = {o.option_label.upper() for o in options}
    if labels != {"A", "B", "C", "D"}:
        raise ValueError("Options must be labeled A, B, C, and D (one each)")
    if sum(1 for o in options if o.is_correct) != 1:
        raise ValueError("Exactly one option must be marked correct")
    return options


class QuestionCreate(BaseModel):
    topic_id: int
    question_text: str = Field(min_length=1)
    status: EntityStatus = EntityStatus.ACTIVE
    options: list[QuestionOptionIn]

    @model_validator(mode="after")
    def _check_options(self) -> "QuestionCreate":
        _validate_four_options(self.options)
        return self


class QuestionUpdate(BaseModel):
    """All fields optional - the router applies only what's set. When
    `options` is provided it must still be the question's existing 4
    labels (re-validated the same way as create); the router additionally
    checks the labels match what the question already has, since this is
    an edit of existing options, not a relabel.
    """

    question_text: str | None = Field(default=None, min_length=1)
    status: EntityStatus | None = None
    options: list[QuestionOptionIn] | None = None

    @model_validator(mode="after")
    def _check_options(self) -> "QuestionUpdate":
        if self.options is not None:
            _validate_four_options(self.options)
        return self


class QuestionOptionAdminPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    option_label: str
    option_text: str
    is_correct: bool


class QuestionAdminPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    topic_id: int
    question_text: str
    status: EntityStatus
    options: list[QuestionOptionAdminPublic]


class BulkUploadRowError(BaseModel):
    row: int  # 1-based Excel row number, matching what the admin sees in the spreadsheet
    message: str


class BulkUploadResult(BaseModel):
    created: int
    skipped: int
    errors: list[BulkUploadRowError]
