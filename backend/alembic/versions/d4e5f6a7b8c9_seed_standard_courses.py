"""seed standard courses

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-08-31

Seeds the organization's fixed course list as part of the schema
migration chain itself, so `alembic upgrade head` - already run
automatically on every container start (see backend/docker-entrypoint.sh)
- is the only step needed. Replaces the earlier manual
`python -m scripts.seed_courses` step (backend/scripts/seed_courses.py
still exists and still works the same way, just no longer required in
any deployed environment): a fresh production database used to need
that extra command run by hand over SSM before the admin panel's
"New Batch" course dropdown had anything in it - now it's just there
the moment the app deploys.

Idempotent like the script it replaces: only inserts a name that isn't
already present (case-insensitive, whitespace-trimmed), so this is safe
to run against a database that already has these courses (e.g. one that
already had the script run against it by hand), and re-running
`alembic upgrade head` is always a no-op after the first time.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Keep this in sync with backend/scripts/seed_courses.py's COURSE_NAMES -
# add a new name to both places if the standard course list ever changes.
COURSE_NAMES = [
    "Agentic AI",
    "Java Full Stack",
    ".NET Full Stack",
    "Forward Deployment Engineer",
    "Quantum Computing",
    "Python Full Stack",
]


def upgrade() -> None:
    conn = op.get_bind()
    for name in COURSE_NAMES:
        conn.execute(
            sa.text(
                """
                INSERT INTO courses (name, status, created_at, updated_at)
                SELECT :name, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                WHERE NOT EXISTS (
                    SELECT 1 FROM courses WHERE lower(trim(name)) = lower(trim(:name))
                )
                """
            ),
            {"name": name},
        )


def downgrade() -> None:
    conn = op.get_bind()
    for name in COURSE_NAMES:
        conn.execute(
            sa.text("DELETE FROM courses WHERE lower(trim(name)) = lower(trim(:name))"),
            {"name": name},
        )
