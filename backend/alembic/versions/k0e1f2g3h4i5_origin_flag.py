"""Add the origin flag to batches and users.

One database, two storefronts. VPro Skills and Digi-Setu sell the same
teaching; this column is what lets each site show only its own batches while
the admin panel - and the trainer - still sees everything.

Every existing row becomes VPRO, so VPro's own site is unchanged by this
migration and Digi-Setu starts with an empty schedule until batches are
created for it.

Revision ID: k0e1f2g3h4i5
Revises: j9d0e1f2g3h4
"""

import sqlalchemy as sa
from alembic import op

revision = "k0e1f2g3h4i5"
down_revision = "j9d0e1f2g3h4"
branch_labels = None
depends_on = None

ORIGIN = sa.Enum("VPRO", "DIGI_SETU", name="origin")


def upgrade() -> None:
    bind = op.get_bind()
    ORIGIN.create(bind, checkfirst=True)

    for table in ("batches", "users"):
        # server_default fills every existing row in one statement; it is then
        # dropped so the application default (Origin.VPRO) is the only source
        # of truth for new rows and the column cannot silently accept a null.
        op.add_column(
            table,
            sa.Column("origin", ORIGIN, nullable=False, server_default="VPRO"),
        )
        op.create_index(f"ix_{table}_origin", table, ["origin"])
        op.alter_column(table, "origin", server_default=None)


def downgrade() -> None:
    for table in ("batches", "users"):
        op.drop_index(f"ix_{table}_origin", table_name=table)
        op.drop_column(table, "origin")
    ORIGIN.drop(op.get_bind(), checkfirst=True)
