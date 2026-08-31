"""Pydantic schemas for the assessments module.

The take/submit shapes here are deliberately separate from
app/questions/schemas.py's admin shapes: AssessmentOptionPublic/
AssessmentQuestionPublic never carry `is_correct` - correct answers must
never reach the frontend before submission, for anyone, admin included.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict

if TYPE_CHECKING:
    from app.assessments.models import AssessmentAttempt


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
