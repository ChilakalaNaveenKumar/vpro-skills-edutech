"""Idempotent loader for the course curriculum.

Reads scripts/curriculum.json - the content that used to live in
web/src/content/courses.ts - and writes it into courses, topics and
course_projects. Matching is by course name (the same key seed_courses.py
uses), so it lines up with rows that migration d4e5f6a7b8c9 already created
rather than duplicating them.

Re-running is consistent but not harmless: course fields are overwritten from
the file, and topics and projects are replaced wholesale for the courses named
in it, so any curriculum edit made in the admin since the last run is lost.
(Topics are matched by name and reused, so assessments hanging off them do
survive.) Courses not mentioned in the file are left completely alone.

Because of that, this refuses by default once a curriculum is already loaded.
Pass --force to deliberately re-baseline.

Usage (from backend/, venv active):

    python -m scripts.seed_curriculum            # first load, after migrating
    python -m scripts.seed_curriculum --force    # discard edits, reload file
"""

import argparse
import json
import sys
from pathlib import Path

# relationship() forward references are resolved by class name against the
# registry, so every model module has to be imported before the first query -
# same requirement, and same fix, as seed_courses.py.
from app.assessments import models as _assessments_models  # noqa: F401
from app.batches import models as _batches_models  # noqa: F401
from app.questions import models as _questions_models  # noqa: F401
from app.topics import models as _topics_models  # noqa: F401
from app.users import models as _users_models  # noqa: F401
from app.assessments.models import AssessmentAttempt
from app.core.enums import EntityStatus
from app.courses.models import Course, CourseProject
from app.database.session import SessionLocal
from app.topics.models import Topic

DATA = Path(__file__).with_name("curriculum.json")


def seed(force: bool = False) -> None:
    payload = json.loads(DATA.read_text(encoding="utf-8"))
    db = SessionLocal()
    try:
        if not force:
            # A loaded curriculum is the signal. `slug` is null on the rows
            # migration d4e5f6a7b8c9 seeds and only ever set from this file, so
            # its presence means a previous run (or an admin) has been here.
            loaded = db.query(Course).filter(Course.slug.isnot(None)).count()
            projects = db.query(CourseProject).count()
            if loaded or projects:
                sys.exit(
                    f"seed_curriculum: refusing to overwrite an existing curriculum "
                    f"(courses with a slug={loaded}, projects={projects}).\n"
                    "This script replaces modules and projects wholesale, so running it "
                    "now would discard curriculum edits made in the admin.\n"
                    "Pass --force if you really do mean to reload the file over the top."
                )

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
                # A topic students have sat an assessment on cannot be deleted -
                # AssessmentAttempt.topic_id is ON DELETE RESTRICT precisely so
                # their results can't be destroyed, and the admin API returns 409
                # rather than try. A blind delete here hit that constraint at
                # commit, which rolled back the entire reseed: every course
                # printed as loaded and nothing was actually written. Retiring it
                # honours the same rule - the results survive, and the public
                # course payload already drops non-ACTIVE topics.
                has_results = (
                    db.query(AssessmentAttempt)
                    .filter(AssessmentAttempt.topic_id == leftover.id)
                    .first()
                    is not None
                )
                if has_results:
                    leftover.status = EntityStatus.INACTIVE
                else:
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
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--force",
        action="store_true",
        help="reload the file over a curriculum that already exists, discarding edits",
    )
    seed(force=parser.parse_args().force)
