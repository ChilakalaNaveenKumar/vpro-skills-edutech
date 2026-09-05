"""Idempotent loader for the course curriculum.

Reads scripts/curriculum.json - the content that used to live in
web/src/content/courses.ts - and writes it into courses, topics and
course_projects. Matching is by course name (the same key seed_courses.py
uses), so it lines up with rows that migration d4e5f6a7b8c9 already created
rather than duplicating them.

Safe to re-run: course fields are overwritten from the file, and topics and
projects are replaced wholesale for the courses named in it. Courses not
mentioned in the file are left completely alone.

Usage (from backend/, venv active):

    python -m scripts.seed_curriculum
"""

import json
from pathlib import Path

# relationship() forward references are resolved by class name against the
# registry, so every model module has to be imported before the first query -
# same requirement, and same fix, as seed_courses.py.
from app.assessments import models as _assessments_models  # noqa: F401
from app.batches import models as _batches_models  # noqa: F401
from app.questions import models as _questions_models  # noqa: F401
from app.topics import models as _topics_models  # noqa: F401
from app.users import models as _users_models  # noqa: F401
from app.courses.models import Course, CourseProject
from app.database.session import SessionLocal
from app.topics.models import Topic

DATA = Path(__file__).with_name("curriculum.json")


def seed() -> None:
    payload = json.loads(DATA.read_text(encoding="utf-8"))
    db = SessionLocal()
    try:
        for position, entry in enumerate(payload, start=1):
            course = (
                db.query(Course)
                .filter(Course.name.ilike(entry["name"].strip()))
                .one_or_none()
            )
            if course is None:
                course = Course(name=entry["name"].strip())
                db.add(course)
                db.flush()
                print(f"{entry['name']}: created")

            course.slug = entry["slug"]
            course.tagline = entry["tagline"]
            course.summary = entry["summary"]
            course.level = entry["level"]
            course.prerequisites = entry["prerequisites"]
            course.for_whom = list(entry["forWhom"])
            course.outcomes = list(entry["outcomes"])
            course.techs = list(entry["techs"])
            course.hue = entry["hue"]
            course.flagship = bool(entry.get("flagship", False))
            # The JSON preserves the curated order the static file shipped with.
            course.display_order = position
            # `description` predates this file and is what the admin course list
            # shows; keep it in step with the public summary.
            course.description = entry["summary"]

            # Replaced wholesale rather than diffed: the file is the source of
            # truth for these, and a partial update would leave a removed module
            # sitting on the page.
            db.query(CourseProject).filter(CourseProject.course_id == course.id).delete()
            existing_topics = db.query(Topic).filter(Topic.course_id == course.id).all()
            by_name = {t.name.strip().lower(): t for t in existing_topics}

            for module in entry["modules"]:
                # Reuse a topic of the same name so any assessment already
                # attached to it survives the reseed.
                topic = by_name.pop(module["name"].strip().lower(), None)
                if topic is None:
                    topic = Topic(course_id=course.id, name=module["name"])
                    db.add(topic)
                topic.topic_order = module["order"]
                topic.summary = module.get("summary")
                topic.builds = module.get("builds")
                topic.visual = module.get("visual")
                topic.subtopics = list(module.get("topics", []))

            for leftover in by_name.values():
                db.delete(leftover)

            for index, project in enumerate(entry["projects"], start=1):
                db.add(
                    CourseProject(
                        course_id=course.id,
                        name=project["name"],
                        description=project["description"],
                        project_order=index,
                    )
                )

            print(
                f"{entry['name']}: {len(entry['modules'])} modules, "
                f"{len(entry['projects'])} projects"
            )

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
