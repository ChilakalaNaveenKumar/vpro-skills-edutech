"""reusable assessments - decouple Assessment from Topic

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-08-31

Makes `Assessment` a first-class, reusable question bank instead of a
1:1-with-Topic implementation detail:

- `assessments` gains `name`/`description` and loses `topic_id` (and its
  unique constraint) - an assessment is no longer owned by exactly one
  topic.
- `questions.topic_id` -> `questions.assessment_id` - questions belong to
  the reusable assessment, not a topic directly.
- `topics` gains a nullable, NON-unique `assessment_id` - the "attach"
  pointer. Many topics can point at the same assessment; that's the reuse
  mechanism. This is the actual bug fix: previously the only way to
  "reuse" an assessment was to repoint its unique `topic_id`, which stole
  it away from wherever it was already attached.
- `assessment_attempts` gains a required `topic_id` (the course/topic
  context an attempt was taken in, captured directly instead of inferred
  via the now one-to-many `assessment.topic`), and the uniqueness rule
  moves from (assessment_id, student_id) to
  (assessment_id, topic_id, student_id) - a student can complete a given
  assessment once per topic/course it's attached to.

Every relationship is still strictly 1:1 at the moment this migration
runs (an assessment has never yet been attached to more than one topic),
so every backfill below is unambiguous - same backfill-then-constrain
shape as migration `c3d4e5f6a7b8`.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # --- 1. Add the new columns, all nullable for now so the backfill
    # below has somewhere to write into before anything is required. ---
    op.add_column('assessments', sa.Column('name', sa.String(length=200), nullable=True))
    op.add_column('assessments', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('topics', sa.Column('assessment_id', sa.Integer(), nullable=True))
    op.add_column('questions', sa.Column('assessment_id', sa.Integer(), nullable=True))
    op.add_column('assessment_attempts', sa.Column('topic_id', sa.Integer(), nullable=True))

    # --- 2. Backfill while the old 1:1 columns still exist. ---

    # assessments.name <- the name of the topic that currently owns it, so
    # nothing lands in the new admin "Assessments" list nameless.
    conn.execute(sa.text(
        """
        UPDATE assessments
        SET name = topics.name
        FROM topics
        WHERE topics.id = assessments.topic_id
        """
    ))

    # topics.assessment_id <- the assessment that currently points at it
    # (the reverse of the old assessments.topic_id link).
    conn.execute(sa.text(
        """
        UPDATE topics
        SET assessment_id = assessments.id
        FROM assessments
        WHERE assessments.topic_id = topics.id
        """
    ))

    # questions.assessment_id <- the assessment now attached to this
    # question's current topic (unambiguous: today every topic with
    # questions has exactly one assessment).
    conn.execute(sa.text(
        """
        UPDATE questions
        SET assessment_id = topics.assessment_id
        FROM topics
        WHERE topics.id = questions.topic_id
        """
    ))

    # assessment_attempts.topic_id <- the topic the attempt's assessment
    # currently belongs to.
    conn.execute(sa.text(
        """
        UPDATE assessment_attempts
        SET topic_id = assessments.topic_id
        FROM assessments
        WHERE assessments.id = assessment_attempts.assessment_id
        """
    ))

    # --- 3. Make the now-backfilled columns required where the model
    # requires them. (topics.assessment_id and assessments.description
    # stay nullable - a topic may have no assessment attached, and an
    # assessment may have no description.) ---
    op.alter_column('assessments', 'name', nullable=False)
    op.alter_column('questions', 'assessment_id', nullable=False)
    op.alter_column('assessment_attempts', 'topic_id', nullable=False)

    # --- 4. Drop the old exclusive-ownership columns. Dropping
    # assessments.topic_id also drops its UNIQUE constraint and FK -
    # Postgres removes single-column constraints/indexes automatically
    # when the column backing them is dropped. ---
    op.drop_column('questions', 'topic_id')
    op.drop_column('assessments', 'topic_id')

    # --- 5. New FKs/indexes for the columns added in step 1. ---
    op.create_foreign_key(
        'topics_assessment_id_fkey', 'topics', 'assessments',
        ['assessment_id'], ['id'], ondelete='SET NULL',
    )
    op.create_index('ix_topics_assessment_id', 'topics', ['assessment_id'])

    op.create_foreign_key(
        'questions_assessment_id_fkey', 'questions', 'assessments',
        ['assessment_id'], ['id'], ondelete='CASCADE',
    )
    op.create_index('ix_questions_assessment_id', 'questions', ['assessment_id'])

    op.create_foreign_key(
        'assessment_attempts_topic_id_fkey', 'assessment_attempts', 'topics',
        ['topic_id'], ['id'], ondelete='RESTRICT',
    )
    op.create_index('ix_assessment_attempts_topic_id', 'assessment_attempts', ['topic_id'])

    # --- 6. Re-scope the one-attempt-per-assessment uniqueness rule to
    # include topic_id (see migration docstring above). ---
    op.drop_constraint(
        'uq_assessment_attempts_assessment_student', 'assessment_attempts', type_='unique'
    )
    op.create_unique_constraint(
        'uq_assessment_attempts_assessment_topic_student',
        'assessment_attempts',
        ['assessment_id', 'topic_id', 'student_id'],
    )


def downgrade() -> None:
    conn = op.get_bind()

    op.drop_constraint(
        'uq_assessment_attempts_assessment_topic_student', 'assessment_attempts', type_='unique'
    )
    op.create_unique_constraint(
        'uq_assessment_attempts_assessment_student',
        'assessment_attempts',
        ['assessment_id', 'student_id'],
    )

    op.drop_index('ix_assessment_attempts_topic_id', table_name='assessment_attempts')
    op.drop_constraint('assessment_attempts_topic_id_fkey', 'assessment_attempts', type_='foreignkey')
    op.drop_index('ix_questions_assessment_id', table_name='questions')
    op.drop_constraint('questions_assessment_id_fkey', 'questions', type_='foreignkey')
    op.drop_index('ix_topics_assessment_id', table_name='topics')
    op.drop_constraint('topics_assessment_id_fkey', 'topics', type_='foreignkey')

    op.add_column('assessments', sa.Column('topic_id', sa.Integer(), nullable=True))
    op.add_column('questions', sa.Column('topic_id', sa.Integer(), nullable=True))

    # Reverse the backfill: this only recovers a clean 1:1 shape if no
    # assessment was actually reused across multiple topics since
    # upgrading (the whole point of this migration is to allow that) -
    # if it was, downgrading picks one topic arbitrarily per assessment
    # and drops the FK/data for the others. That's an inherent, accepted
    # limitation of downgrading past a reuse-enabling migration once reuse
    # has actually happened, not a bug in this script.
    conn.execute(sa.text(
        """
        UPDATE assessments
        SET topic_id = sub.topic_id
        FROM (
            SELECT DISTINCT ON (assessment_id) assessment_id, id AS topic_id
            FROM topics
            WHERE assessment_id IS NOT NULL
            ORDER BY assessment_id, id
        ) AS sub
        WHERE sub.assessment_id = assessments.id
        """
    ))
    conn.execute(sa.text(
        """
        UPDATE questions
        SET topic_id = assessments.topic_id
        FROM assessments
        WHERE assessments.id = questions.assessment_id
        """
    ))
    # Any assessment that ended up with no topic_id (never attached to
    # any topic) can't satisfy the old NOT NULL/unique - remove it along
    # with its now-orphaned questions/attempts rather than leave the
    # downgrade half-finished.
    conn.execute(sa.text("DELETE FROM assessments WHERE topic_id IS NULL"))

    op.alter_column('assessments', 'topic_id', nullable=False)
    op.alter_column('questions', 'topic_id', nullable=False)

    op.drop_column('assessment_attempts', 'topic_id')
    op.drop_column('topics', 'assessment_id')
    op.drop_column('questions', 'assessment_id')
    op.drop_column('assessments', 'description')
    op.drop_column('assessments', 'name')

    op.create_foreign_key(
        'questions_topic_id_fkey', 'questions', 'topics', ['topic_id'], ['id'], ondelete='CASCADE'
    )
    op.create_index(op.f('ix_questions_topic_id'), 'questions', ['topic_id'], unique=False)
    op.create_foreign_key(
        'assessments_topic_id_fkey', 'assessments', 'topics', ['topic_id'], ['id'], ondelete='CASCADE'
    )
    op.create_unique_constraint('assessments_topic_id_key', 'assessments', ['topic_id'])
