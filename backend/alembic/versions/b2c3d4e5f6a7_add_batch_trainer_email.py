"""add batch trainer_email

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-31

Adds Batch.trainer_email (nullable) alongside the existing trainer_name -
part of the same "batch creation simplification" request that added
progress_status (see a1b2c3d4e5f6), this time asking for a faculty/trainer
email field with proper validation. Nullable at the DB level (unlike
trainer_name) purely so existing rows created before this migration don't
need a fabricated placeholder value - the API layer (BatchCreate) requires
it for every batch created from here on; see app/batches/schemas.py and
app/batches/models.py for the full explanation.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "batches",
        sa.Column("trainer_email", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("batches", "trainer_email")
