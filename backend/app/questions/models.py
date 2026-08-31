"""SQLAlchemy models for the questions module: MCQ questions and their options."""

from sqlalchemy import Boolean, ForeignKey, Index, String, Text, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import EntityStatus
from app.database.base import Base, TimestampMixin


class Question(Base, TimestampMixin):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    topic_id: Mapped[int] = mapped_column(
        ForeignKey("topics.id", ondelete="CASCADE"), index=True, nullable=False
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[EntityStatus] = mapped_column(default=EntityStatus.ACTIVE, nullable=False)

    options: Mapped[list["QuestionOption"]] = relationship(
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="QuestionOption.option_label",
    )


class QuestionOption(Base):
    """One row per A/B/C/D option. Correct answers never leave the backend
    pre-submission - it is the API layer's job (added with the real
    endpoints) to strip `is_correct` from any response served to a student
    before they submit.
    """

    __tablename__ = "question_options"
    __table_args__ = (
        UniqueConstraint("question_id", "option_label", name="uq_question_options_question_label"),
        # Enforced at the database level, not just in application code: a
        # question can have at most one option marked correct.
        Index(
            "uq_question_options_one_correct",
            "question_id",
            unique=True,
            # Portable partial-index condition (both dialects treat a
            # boolean column reference as a truthy filter) so this
            # constraint is real not just in production Postgres but also
            # in the SQLite-based model smoke tests.
            postgresql_where=text("is_correct"),
            sqlite_where=text("is_correct"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"), index=True, nullable=False
    )
    option_label: Mapped[str] = mapped_column(String(1), nullable=False)
    option_text: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    question: Mapped["Question"] = relationship(back_populates="options")
