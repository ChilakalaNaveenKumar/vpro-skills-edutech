"""Move the curriculum out of the frontend's static file and into the database.

The marketing site read every course name, tagline, summary, module and project
from web/src/content/courses.ts, so changing a word meant a code deploy. These
columns give that content a home the admin panel can edit.

Modules are `topics` - that table already existed, per-course and ordered, and
was only missing the descriptive fields. Projects get their own table because
they are an ordered list per course with two fields of their own.

JSON is used for the plain string lists (for_whom, outcomes, techs, subtopics).
They are only ever read and written whole, never queried into, so a child table
would buy nothing and cost five joins on every page render.

Revision ID: g6a7b8c9d0e1
Revises: e5f6a7b8c9d0
"""

import sqlalchemy as sa
from alembic import op

revision = "g6a7b8c9d0e1"
down_revision = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("courses") as batch:
        batch.add_column(sa.Column("slug", sa.String(120), nullable=True))
        batch.add_column(sa.Column("tagline", sa.String(300), nullable=True))
        batch.add_column(sa.Column("summary", sa.Text(), nullable=True))
        batch.add_column(sa.Column("level", sa.String(150), nullable=True))
        batch.add_column(sa.Column("prerequisites", sa.String(300), nullable=True))
        batch.add_column(sa.Column("for_whom", sa.JSON(), nullable=True))
        batch.add_column(sa.Column("outcomes", sa.JSON(), nullable=True))
        batch.add_column(sa.Column("techs", sa.JSON(), nullable=True))
        batch.add_column(sa.Column("hue", sa.Integer(), nullable=True))
        batch.add_column(sa.Column("flagship", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_index("ix_courses_slug", "courses", ["slug"], unique=True)

    with op.batch_alter_table("topics") as batch:
        batch.add_column(sa.Column("summary", sa.Text(), nullable=True))
        batch.add_column(sa.Column("builds", sa.String(300), nullable=True))
        batch.add_column(sa.Column("visual", sa.String(60), nullable=True))
        batch.add_column(sa.Column("subtopics", sa.JSON(), nullable=True))

    op.create_table(
        "course_projects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "course_id",
            sa.Integer(),
            sa.ForeignKey("courses.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("project_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_course_projects_course_order", "course_projects", ["course_id", "project_order"])


def downgrade() -> None:
    op.drop_index("ix_course_projects_course_order", table_name="course_projects")
    op.drop_table("course_projects")
    with op.batch_alter_table("topics") as batch:
        for column in ("subtopics", "visual", "builds", "summary"):
            batch.drop_column(column)
    op.drop_index("ix_courses_slug", table_name="courses")
    with op.batch_alter_table("courses") as batch:
        for column in (
            "flagship", "hue", "techs", "outcomes", "for_whom",
            "prerequisites", "level", "summary", "tagline", "slug",
        ):
            batch.drop_column(column)
