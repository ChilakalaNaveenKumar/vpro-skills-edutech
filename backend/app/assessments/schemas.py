"""Pydantic schemas for the assessments module.

The take/submit shapes here are deliberately separate from
app/questions/schemas.py's admin shapes: AssessmentOptionPublic/
AssessmentQuestionPublic never carry `is_correct` - correct answers must
never reach the frontend before submission, for anyone, admin included.

AssessmentCreate/AssessmentUpdate/AssessmentAdminPublic (2026-08-31) are
the admin CRUD shapes for the standalone, reusable Assessment entity - see
this module's admin_router and app/assessments/models.py's docstring.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import EntityStatus

if TYPE_CHECKING:
    from app.assessments.models import Assessment, AssessmentAttempt


class AnswerSubmission(BaseModel):
    question_id: int
    selected_option_id: int | None = None


class AssessmentSubmitRequest(BaseModel):
    # Informational only (e.g. "time taken" display) - never used for
    # scoring or authorization, so a client lying about it has no
    # security consequence, unlike the answers themselves.
    started_at: datetime
    answers: list[AnswerSubmission]


class AssessmentOptionPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    option_label: str
    option_text: str


class AssessmentQuestionPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    question_text: str
    options: list[AssessmentOptionPublic]


class AssessmentPublic(BaseModel):
    topic_id: int
    topic_name: str
    total_questions: int
    questions: list[AssessmentQuestionPublic]


class AssessmentResultPublic(BaseModel):
    attempt_id: int
    total_questions: int
    score: int
    wrong_count: int
    percentage: float
    submitted_at: datetime

    @classmethod
    def from_attempt(cls, attempt: "AssessmentAttempt") -> "AssessmentResultPublic":
        # `score` isn't a stored column on AssessmentAttempt - it's always
        # equal to correct_count (see that model's own docstring).
        return cls(
            attempt_id=attempt.id,
            total_questions=attempt.total_questions,
            score=attempt.correct_count,
            wrong_count=attempt.wrong_count,
            percentage=float(attempt.percentage),
            submitted_at=attempt.submitted_at,
        )


class AssessmentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    status: EntityStatus = EntityStatus.ACTIVE


class AssessmentUpdate(BaseModel):
    """All fields optional - the admin_router applies only what's set."""

    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: EntityStatus | None = None


class AssessmentAdminPublic(BaseModel):
    id: int
    name: str
    description: str | None
    status: EntityStatus
    question_count: int
    # How many topics currently have this assessment attached - the
    # reuse count, and what delete-safety checks in the admin_router key
    # off of.
    topic_count: int

    @classmethod
    def from_model(cls, assessment: "Assessment") -> "AssessmentAdminPublic":
        return cls(
            id=assessment.id,
            name=assessment.name,
            description=assessment.description,
            status=assessment.status,
            question_count=len(assessment.questions),
            topic_count=len(assessment.topics),
        )
