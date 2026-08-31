"""Enrollment queries shared across modules.

`StudentBatch` is owned by `users` (see models.py's docstring), but more
than one module needs to answer "is this student enrolled in this course?" -
`topics` needs it now to gate a course's topic list, and Phase 5's "My
Courses" dashboard needs the same join again. Written once here rather than
inlined per-caller.
"""

from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from app.batches.models import Batch
from app.users.models import StudentBatch


def is_student_enrolled_in_course(db: Session, student_id: int, course_id: int) -> bool:
    stmt = select(
        exists().where(
            StudentBatch.student_id == student_id,
            StudentBatch.batch_id == Batch.id,
            Batch.course_id == course_id,
        )
    )
    return bool(db.scalar(stmt))
