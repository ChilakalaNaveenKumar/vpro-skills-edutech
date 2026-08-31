"""add batch progress_status

Revision ID: a1b2c3d4e5f6
Revises: f5cea33fb190
Create Date: 2026-08-31 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f5cea33fb190'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    batch_progress_status_enum = postgresql.ENUM(
        'IN_PROGRESS', 'COMPLETED', name='batchprogressstatus'
    )
    batch_progress_status_enum.create(op.get_bind(), checkfirst=True)

    # server_default backfills every existing batch as IN_PROGRESS (the
    # only sensible default for data that predates this column); new rows
    # going forward get their value from the ORM model's Python-side
    # default instead, same pattern as every other status column here.
    op.add_column(
        'batches',
        sa.Column(
            'progress_status',
            postgresql.ENUM('IN_PROGRESS', 'COMPLETED', name='batchprogressstatus', create_type=False),
            server_default='IN_PROGRESS',
            nullable=False,
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('batches', 'progress_status')
    postgresql.ENUM(name='batchprogressstatus').drop(op.get_bind(), checkfirst=True)
