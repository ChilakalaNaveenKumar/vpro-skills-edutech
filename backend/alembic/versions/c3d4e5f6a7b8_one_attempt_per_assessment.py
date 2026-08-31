"""one attempt per student per assessment

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-08-31

Adds a UniqueConstraint(assessment_id, student_id) on assessment_attempts,
per the admin's explicit request that a student can never re-attempt an
assessment once submitted - they should see their existing result instead
(app/assessments/router.py's get_assessment/submit_assessment both enforce
this at the application level too; this is the DB-level backstop, same
belt-and-suspenders pattern as every other uniqueness rule in this app).

Multiple attempts per student per assessment were explicitly allowed
before this migration (see AssessmentAttempt's prior docstring), so
upgrade() first deduplicates any pre-existing extra attempts - keeping
only the most recently submitted attempt per (assessment_id, student_id)
pair and deleting the rest (ON DELETE CASCADE on assessment_answers.
attempt_id takes their per-question answer rows with them) - before adding
the constraint. Without this, the constraint would fail to apply on any
database that already has more than one attempt for the same student/
assessment pair.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            DELETE FROM assessment_attempts
            WHERE id NOT IN (
                SELECT DISTINCT ON (assessment_id, student_id) id
                FROM assessment_attempts
                ORDER BY assessment_id, student_id, submitted_at DESC, id DESC
            )
            """
        )
    )
    op.create_unique_constraint(
        "uq_assessment_attempts_assessment_student",
        "assessment_attempts",
        ["assessment_id", "student_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_assessment_attempts_assessment_student", "assessment_attempts", type_="unique"
    )
