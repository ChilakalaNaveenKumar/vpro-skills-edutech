"""Fields the design uses that had no column behind them.

- courses.video_url  : the comp's #cp-video explainer slot on a course page.
- batches.seats_note : the comp carries a per-batch line ("Few seats left" /
  "Registration open"), not one blanket label. Editorial and admin-set, so it
  is the admin's deliberate claim about a specific batch rather than something
  the site asserts about every batch on its own.
- batches.days_of_week : the comp reads "weekdays, 7:30 PM". There was no day
  field at all, so the hour had to be rendered without saying which days it
  falls on.

Revision ID: h7b8c9d0e1f2
Revises: g6a7b8c9d0e1
"""

import sqlalchemy as sa
from alembic import op

revision = "h7b8c9d0e1f2"
down_revision = "g6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("courses") as batch:
        batch.add_column(sa.Column("video_url", sa.String(500), nullable=True))
    with op.batch_alter_table("batches") as batch:
        batch.add_column(sa.Column("seats_note", sa.String(80), nullable=True))
        batch.add_column(sa.Column("days_of_week", sa.String(120), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("batches") as batch:
        batch.drop_column("days_of_week")
        batch.drop_column("seats_note")
    with op.batch_alter_table("courses") as batch:
        batch.drop_column("video_url")
