"""Owned write-path for auto-provisioning a topic's Assessment row.

`Assessment` has no admin CRUD of its own (see docs/ARCHITECTURE.md's
"MCQ assessment flow" section) - a topic's assessment silently comes into
existence the moment its first question does. `questions`' admin router
calls this function rather than inserting into `assessments`' table
itself, so the actual write still lives in and is owned by this module -
the same "read across" shape `topics` already uses for
`users.enrollment.is_student_enrolled_in_course`, just for a write.
"""

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.assessments.models import Assessment
from app.core.enums import EntityStatus


def ensure_assessment_for_topic(db: Session, topic_id: int) -> Assessment:
    assessment = db.scalar(select(Assessment).where(Assessment.topic_id == topic_id))
    if assessment is not None:
        return assessment

    # A SAVEPOINT (begin_nested), not a plain flush/rollback: the caller
    # (questions' create_question) has its own pending, uncommitted Question
    # insert on this same session. A plain db.rollback() on IntegrityError
    # would discard that too - the nested transaction confines the rollback
    # to just this Assessment insert if it loses a race.
    try:
        with db.begin_nested():
            assessment = Assessment(topic_id=topic_id, status=EntityStatus.ACTIVE)
            db.add(assessment)
            db.flush()
    except IntegrityError:
        assessment = db.scalar(select(Assessment).where(Assessment.topic_id == topic_id))
        assert assessment is not None
    return assessment
