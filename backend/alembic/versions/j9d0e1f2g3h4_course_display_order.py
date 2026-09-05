"""Give the course shelf an explicit order.

The static file listed courses in a curated order - the flagship first, then
the rest - and the API replaced it with ORDER BY name, so the shelf opened on
".NET Full Stack" purely because of the leading dot. Order is an editorial
decision, so it gets a column the admin can set.

Revision ID: j9d0e1f2g3h4
Revises: i8c9d0e1f2g3
"""

import sqlalchemy as sa
from alembic import op

revision = "j9d0e1f2g3h4"
down_revision = "i8c9d0e1f2g3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("courses") as batch:
        batch.add_column(
            sa.Column("display_order", sa.Integer(), nullable=False, server_default="0")
        )


def downgrade() -> None:
    with op.batch_alter_table("courses") as batch:
        batch.drop_column("display_order")
