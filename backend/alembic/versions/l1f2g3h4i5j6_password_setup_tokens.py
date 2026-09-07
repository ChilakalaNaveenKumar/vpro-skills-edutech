"""One-time password-setup tokens.

A student who paid on a partner's site never chose a VPro password, so there is
nothing to log in with. This table carries a short-lived, single-use token that
lets them set one, instead of VPro generating a password and emailing it - a
password in an inbox stays there forever.

Revision ID: l1f2g3h4i5j6
Revises: k0e1f2g3h4i5
"""

import sqlalchemy as sa
from alembic import op

revision = "l1f2g3h4i5j6"
down_revision = "k0e1f2g3h4i5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "password_setup_tokens",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        # Hashed, never the token: a leaked table must not yield working links.
        sa.Column("token_hash", sa.String(length=255), nullable=False),
        sa.Column("external_ref", sa.String(length=100), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_password_setup_tokens_user_id", "password_setup_tokens", ["user_id"])
    # Redemption scans unused, unexpired rows only, so that is what is indexed.
    op.create_index(
        "ix_password_setup_tokens_live",
        "password_setup_tokens",
        ["expires_at"],
        postgresql_where=sa.text("used_at IS NULL"),
    )


def downgrade() -> None:
    op.drop_index("ix_password_setup_tokens_live", table_name="password_setup_tokens")
    op.drop_index("ix_password_setup_tokens_user_id", table_name="password_setup_tokens")
    op.drop_table("password_setup_tokens")
