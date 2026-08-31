"""SQLAlchemy models for the assessments module: assessments, attempts, and
per-question answers.

`Assessment` is a first-class, reusable question bank (2026-08-31): it has
its own `name`/`description`, is created explicitly by an admin (the new
`admin_router` in `app/assessments/router.py`), and is *attached* to zero
or more
`Topic`s via `Topic.assessment_id` (a plain nullable FK on Topic, no
uniqueness constraint - see topics/models.py). That's what makes an
assessment reusable across topics/courses/batches: attaching the same
assessment to a second topic never touches its attachment to the first
one, unlike the old design where `Assessment.topic_id` was unique and
"reusing" an assessment silently stole it away from wherever it was
already attached.

`AssessmentAttempt` is written once, at submission time, with the
already-computed outcome (see `correct_count`/`percentage` below) - the
product spec requires the backend to calculate and save the final result on
submit, not on every question navigation. There is no separate `results`
table: an attempt row *is* a result the moment it exists. See
docs/ARCHITECTURE.md's "Database schema" section for the full rationale.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Numeric, String, Text, UniqueConstraint
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
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[EntityStatus] = mapped_column(default=EntityStatus.ACTIVE, nullable=False)

    questions: Mapped[list["Question"]] = relationship(
        back_populates="assessment", order_by="Question.id"
    )
    attempts: Mapped[list["AssessmentAttempt"]] = relationship(back_populates="assessment")
    # Read-only convenience for the admin assessments list (attached-topic
    # count) and for delete-safety checks - every topic currently pointing
    # at this assessment. Not unique, unlike the old `Assessment.topic`
    # singular relationship it replaces - that's the whole point.
    topics: Mapped[list["Topic"]] = relationship(back_populates="assessment")


class AssessmentAttempt(Base, TimestampMixin):
    """A student's completed attempt at an assessment - this is the row the
    student's "Score / Result" screen and the admin "Results" screen both
    read from. `score` is not a stored column: under the spec's "one
    question = one correct answer, no negative marking" rule it always
    equals `correct_count`, so the API exposes `correct_count` as `score`
    rather than storing the same number twice.

    `topic_id` (2026-08-31) is the topic/course context the attempt was
    taken in, captured directly at submission time. This became necessary
    once the same Assessment could be attached to more than one Topic:
    `attempt.assessment.topic` is no longer a valid single-value path (an
    assessment can have many topics), so anything that needs "which course
    was this attempt for" - the per-course Results screen above all -
    reads `attempt.topic` instead.

    One attempt per student per (assessment, topic) - reversing an earlier
    decision (multiple attempts were previously allowed, with no
    uniqueness constraint at all - see migration `c3d4e5f6a7b8`) and then
    refining it again once assessments became reusable (migration
    `e5f6a7b8c9d0`): a student who has already completed a given
    assessment under one topic/course can still take the *same* assessment
    again if it's reused under a different topic/course, but can never
    retake it twice within the same topic. Enforced here at the DB level
    (the real backstop) via `__table_args__` below, and also checked at
    the application level in app/assessments/router.py (`get_assessment`
    blocks re-fetching the quiz once an attempt exists for this topic;
    `submit_assessment` catches the IntegrityError from a concurrent/
    replayed second submission) - the same belt-and-suspenders pattern
    this app already uses for every other uniqueness rule (e.g.
    Batch.batch_number, QuestionOption's one-correct-answer-per-question
    index).
    """

    __tablename__ = "assessment_attempts"
    __table_args__ = (
        UniqueConstraint(
            "assessment_id",
            "topic_id",
            "student_id",
            name="uq_assessment_attempts_assessment_topic_student",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    assessment_id: Mapped[int] = mapped_column(
        ForeignKey("assessments.id", ondelete="CASCADE"), index=True, nullable=False
    )
    # RESTRICT, not CASCADE (2026-08-31): a Topic no longer exclusively
    # "owns" its Assessment/Questions - they may be reused by other topics
    # too (see this module's docstring) - so deleting a Topic must never
    # silently cascade away recorded student history for it. Blocking the
    # delete here (topics/router.py's delete_topic catches the
    # IntegrityError and returns 409) is what actually protects "a
    # student already has a result for this topic" now, replacing the old
    # protection that used to come indirectly via assessment_answers'
    # RESTRICT on questions (which no longer applies once a Topic isn't
    # what a Question cascades from).
    topic_id: Mapped[int] = mapped_column(
        ForeignKey("topics.id", ondelete="RESTRICT"), index=True, nullable=False
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
    # Read-only convenience for the results module's reporting joins
    # (Phase 7, repointed 2026-08-31 to read directly off the attempt
    # instead of via assessment.topic - see this model's docstring).
    topic: Mapped["Topic"] = relationship()
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
