"""Pydantic schemas for the results module.

Built entirely from app/assessments/models.py's AssessmentAttempt/
AssessmentAnswer (this module has no models of its own - see
results/models.py's docstring). Unlike assessments/schemas.py's
student-facing take-endpoint shapes, these are allowed to reveal correct
answers: a result only exists for an attempt that's already been
submitted, so there's nothing left to protect by hiding them here.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel

if TYPE_CHECKING:
    from app.assessments.models import AssessmentAttempt


class ResultAnswerDetail(BaseModel):
    question_id: int
    question_text: str
    selected_option_label: str | None
    selected_option_text: str | None
    correct_option_label: str
    correct_option_text: str
    is_correct: bool


class ResultPublic(BaseModel):
    attempt_id: int
    topic_id: int
    topic_name: str
    course_id: int
    course_name: str
    total_questions: int
    score: int
    wrong_count: int
    percentage: float
    started_at: datetime
    submitted_at: datetime

    @classmethod
    def from_attempt(cls, attempt: "AssessmentAttempt") -> "ResultPublic":
        # `attempt.topic` (2026-08-31), not `attempt.assessment.topic` -
        # an assessment can now be attached to more than one topic (see
        # app/assessments/models.py's docstring), so the topic/course an
        # attempt belongs to is read directly off the attempt itself,
        # captured at submission time.
        topic = attempt.topic
        return cls(
            attempt_id=attempt.id,
            topic_id=topic.id,
            topic_name=topic.name,
            course_id=topic.course_id,
            course_name=topic.course.name,
            total_questions=attempt.total_questions,
            score=attempt.correct_count,
            wrong_count=attempt.wrong_count,
            percentage=float(attempt.percentage),
            started_at=attempt.started_at,
            submitted_at=attempt.submitted_at,
        )


class ResultDetailPublic(ResultPublic):
    answers: list[ResultAnswerDetail]

    @classmethod
    def from_attempt(cls, attempt: "AssessmentAttempt") -> "ResultDetailPublic":
        base = ResultPublic.from_attempt(attempt)
        answers = []
        for answer in attempt.answers:
            question = answer.question
            correct_option = next(o for o in question.options if o.is_correct)
            selected = answer.selected_option
            answers.append(
                ResultAnswerDetail(
                    question_id=question.id,
                    question_text=question.question_text,
                    selected_option_label=selected.option_label if selected else None,
                    selected_option_text=selected.option_text if selected else None,
                    correct_option_label=correct_option.option_label,
                    correct_option_text=correct_option.option_text,
                    is_correct=answer.is_correct,
                )
            )
        return cls(**base.model_dump(), answers=answers)


class AdminResultPublic(ResultPublic):
    student_id: int
    student_name: str
    student_email: str

    @classmethod
    def from_attempt(cls, attempt: "AssessmentAttempt") -> "AdminResultPublic":
        base = ResultPublic.from_attempt(attempt)
        return cls(
            **base.model_dump(),
            student_id=attempt.student_id,
            student_name=attempt.student.full_name,
            student_email=attempt.student.email,
        )
