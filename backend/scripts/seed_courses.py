"""Idempotent bootstrap CLI to create the organization's standard course
list, so the admin panel's "New Batch" course dropdown has real options
without needing to create each course by hand first.

Safe to run more than once - an existing course (matched by name,
case-insensitively) is left untouched and simply reported as already
present, nothing is duplicated or overwritten.

Usage (run from backend/, with the venv active and .env configured - or
inside the Docker container, same as scripts.create_user):

    python -m scripts.seed_courses
"""

from app.core.enums import EntityStatus
from app.courses.models import Course
from app.database.session import SessionLocal

# Course.batches is a relationship() referring to "Batch" by name (a forward
# reference - see app/courses/models.py). SQLAlchemy only resolves that name
# against classes that have actually been imported somewhere, so a
# Course-only import here makes any query touching Course blow up with
# "expression 'Batch' failed to locate a name". alembic/env.py hits the same
# requirement and solves it the same way: import every model module up
# front, even ones this script never uses directly, purely to register them.
from app.assessments import models as _assessments_models  # noqa: F401
from app.batches import models as _batches_models  # noqa: F401
from app.questions import models as _questions_models  # noqa: F401
from app.topics import models as _topics_models  # noqa: F401
from app.users import models as _users_models  # noqa: F401

# The organization's standard course names (2026-08-31, per the admin's
# request to pick from a fixed list when creating a batch instead of
# typing/managing courses separately). Add a new name here and re-run this
# script to add more later - existing courses are never touched.
COURSE_NAMES = [
    "Agentic AI",
    "Java Full Stack",
    ".NET Full Stack",
    "Forward Deployment Engineer",
    "Quantum Computing",
    "Python Full Stack",
]


def seed_courses() -> None:
    db = SessionLocal()
    try:
        existing_names = {
            name.strip().lower() for (name,) in db.query(Course.name).all()
        }
        created = []
        skipped = []
        for name in COURSE_NAMES:
            if name.strip().lower() in existing_names:
                skipped.append(name)
                continue
            course = Course(name=name, status=EntityStatus.ACTIVE)
            db.add(course)
            created.append(name)
        db.commit()

        for name in created:
            print(f"Created course: {name}")
        for name in skipped:
            print(f"Already exists, skipped: {name}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_courses()
