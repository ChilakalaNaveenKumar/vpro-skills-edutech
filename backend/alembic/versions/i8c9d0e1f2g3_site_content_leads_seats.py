"""Close the remaining content gaps: site copy, leads capture, real seats.

Four ordered list tables (testimonials, faqs, tenets, batch_loop_steps) because
the admin needs to add, remove and reorder those. One key/value table for the
singletons - hero copy, the trainer profile, contact details - because there is
exactly one of each and a table per blob would be five tables holding one row.

`leads` gives POST /api/leads somewhere to write. The frontend has been firing
at that endpoint since launch and it has never existed, so every enquiry was
dropped on the floor.

Batch times become nullable so a batch can open for registration before its
hour is fixed - the comp shows "hour to be confirmed" and the schema could not
represent it.

Revision ID: i8c9d0e1f2g3
Revises: h7b8c9d0e1f2
"""

import sqlalchemy as sa
from alembic import op

revision = "i8c9d0e1f2g3"
down_revision = "h7b8c9d0e1f2"
branch_labels = None
depends_on = None

_TIMESTAMPS = (
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
)


def _ordered(name: str, *columns: sa.Column) -> None:
    op.create_table(
        name,
        sa.Column("id", sa.Integer(), primary_key=True),
        *columns,
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(20), nullable=False, server_default="ACTIVE"),
        *(c.copy() for c in _TIMESTAMPS),
    )
    op.create_index(f"ix_{name}_order", name, ["display_order"])


def upgrade() -> None:
    _ordered(
        "testimonials",
        sa.Column("quote", sa.Text(), nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("role", sa.String(200), nullable=True),
    )
    _ordered(
        "faqs",
        sa.Column("question", sa.String(400), nullable=False),
        sa.Column("answer", sa.Text(), nullable=False),
    )
    _ordered(
        "tenets",
        sa.Column("number", sa.String(8), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
    )
    _ordered(
        "batch_loop_steps",
        sa.Column("number", sa.String(8), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
    )

    op.create_table(
        "site_content",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("key", sa.String(60), nullable=False, unique=True, index=True),
        sa.Column("value", sa.JSON(), nullable=False),
        *(c.copy() for c in _TIMESTAMPS),
    )

    op.create_table(
        "leads",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("cta", sa.String(60), nullable=False),
        sa.Column("chapter", sa.String(60), nullable=False),
        sa.Column("segment", sa.String(120), nullable=True),
        sa.Column("course", sa.String(200), nullable=True),
        sa.Column("utm_source", sa.String(120), nullable=True),
        sa.Column("utm_medium", sa.String(120), nullable=True),
        sa.Column("utm_campaign", sa.String(120), nullable=True),
        *(c.copy() for c in _TIMESTAMPS),
    )
    op.create_index("ix_leads_created_at", "leads", ["created_at"])

    with op.batch_alter_table("batches") as batch:
        # A real capacity, so "Few seats left" can one day be counted rather
        # than asserted. Null means capacity is not tracked for this batch.
        batch.add_column(sa.Column("seats_total", sa.Integer(), nullable=True))
        batch.alter_column("start_time", existing_type=sa.Time(), nullable=True)
        batch.alter_column("end_time", existing_type=sa.Time(), nullable=True)


def downgrade() -> None:
    with op.batch_alter_table("batches") as batch:
        batch.alter_column("end_time", existing_type=sa.Time(), nullable=False)
        batch.alter_column("start_time", existing_type=sa.Time(), nullable=False)
        batch.drop_column("seats_total")
    op.drop_index("ix_leads_created_at", table_name="leads")
    op.drop_table("leads")
    op.drop_table("site_content")
    for name in ("batch_loop_steps", "tenets", "faqs", "testimonials"):
        op.drop_index(f"ix_{name}_order", table_name=name)
        op.drop_table(name)
