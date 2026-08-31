"""SQLAlchemy models for the assessments module: assessments, attempts, and
per-question answers.

`AssessmentAttempt` is written once, at submission time, with the
already-computed outcome (see `correct_count`/`percentage` below) - the
product spec requires the backend to calculate and save the final result on
submit, not on every question navigation. There is no separate `results`
table: an attempt row *is* a result the moment it exists. See
docs/ARCHITECTURE.md's "Database schema" section for the full rationale.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import EntityStatus
from app.database.base import Base, CreatedAtMixin, TimestampMixin

if TYPE_CHECKING:
    from app.questions.models import Question, QuestionOption
    from app.topics.models import Topic
    from app.users.models import User


class Assessment(Base, TimestampMixin):
    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(primary_key=True)
    # One assessment per topic in Phase 1. Kept as its own table (rather
    # than folding assessment fields into `topics`) so a topic could have
    # more than one assessment in a future phase without a schema change -
    # just drop this uniqueness constraint.
    topic_id: Mapped[int] = mapped_column(
        ForeignKey("topics.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    status: Mapped[EntityStatus] = mapped_column(default=EntityStatus.ACTIVE, nullable=False)

    attempts: Mapped[list["AssessmentAttempt"]] = relationship(back_populates="assessment")
    # Read-only convenience for the results module's reporting joins
    # (Phase 7) - no write path anywhere uses this.
    topic: Mapped["Topic"] = relationship()


class AssessmentAttempt(Base, TimestampMixin):
    """A student's completed attempt at an assessment - this is the row the
    student's "Score / Result" screen and the admin "Results" screen both
    read from. `score` is not a stored column: under the spec's "one
    question = one correct answer, no negative marking" rule it always
    equals `correct_count`, so the API exposes `correct_count` as `score`
    rather than storing the same number twice.
    """

    __tablename__ = "assessment_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    assessment_id: Mapped[int] = mapped_column(
        ForeignKey("assessments.id", ondelete="CASCADE"), index=True, nullable=False
    )
    student_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    total_questions: Mapped[int] = mapped_column(nullable=False)
    correct_count: Mapped[int] = mapped_column(nullable=False)
    wrong_count: Mapped[int] = mapped_column(nullable=False)
    percentage: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    started_at: Mapped[datetime] = mapped_column(nullable=False)
    # This is the "Attempt Date" shown in the admin Results screen.
    submitted_at: Mapped[datetime] = mapped_column(index=True, nullable=False)

    assessment: Mapped["Assessment"] = relationship(back_populates="attempts")
    answers: Mapped[list["AssessmentAnswer"]] = relationship(
        back_populates="attempt", cascade="all, delete-orphan"
    )
    # Read-only convenience for the results module's admin listing (Phase 7),
    # which needs the student's name/email alongside each attempt.
    student: Mapped["User"] = relationship()


class AssessmentAnswer(Base, CreatedAtMixin):
    """One row per question in an attempt - an audit trail of what the
    student selected, written once at submission alongside the attempt
    (never on every question navigation).
    """

    __tablename__ = "assessment_answers"
    __table_args__ = (
        UniqueConstraint(
            "attempt_id", "question_id", name="uq_assessment_answers_attempt_question"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    attempt_id: Mapped[int] = mapped_column(
        ForeignKey("assessment_attempts.id", ondelete="CASCADE"), index=True, nullable=False
    )
    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    # Nullable: the student left the question unanswered.
    selected_option_id: Mapped[int | None] = mapped_column(
        ForeignKey("question_options.id", ondelete="RESTRICT"), nullable=True
    )
    is_correct: Mapped[bool] = mapped_column(nullable=False)

    attempt: Mapped["AssessmentAttempt"] = relationship(back_populates="answers")
    # Read-only convenience for the results module's per-question review
    # (Phase 7) - lets it show the question text, the student's selection,
    # and (by looking at question.options) the correct answer, all from one
    # eager-loaded chain.
    question: Mapped["Question"] = relationship()
    selected_option: Mapped["QuestionOption | None"] = relationship()
