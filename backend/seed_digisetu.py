"""Seed the Digi-Setu batch for local development.

Idempotent by default: it inserts what is missing and leaves everything else
alone, so it is safe to re-run.

SAFETY. An earlier version of this file called Base.metadata.drop_all() and
read DATABASE_URL with os.environ.setdefault, which meant that with the normal
.env loaded it targeted Postgres rather than sqlite and destroyed every table
in it. Two rules now prevent that:

  1. The database URL must be local - a sqlite file, or a host of localhost /
     127.0.0.1. Anything else is refused outright.
  2. Dropping tables happens only with an explicit --reset flag, and only after
     rule 1 has passed.

Usage:
    python seed_digisetu.py                     # insert what is missing
    python seed_digisetu.py --reset             # drop and rebuild (local only)
    DATABASE_URL=sqlite:///./dev.db python seed_digisetu.py
"""

import argparse
import datetime as dt
import os
import sys
from urllib.parse import urlparse

DEFAULT_URL = "sqlite:///./dev.db"


def _resolve_url(explicit: str | None) -> str:
    """Pick the database URL, defaulting to the local sqlite file.

    Deliberately NOT os.environ.setdefault: an inherited DATABASE_URL from the
    project's .env points at Postgres, and silently seeding - or worse,
    resetting - that is how a development script destroys real data. The
    environment is used only when it is explicitly a local database.
    """
    return explicit or os.environ.get("SEED_DATABASE_URL") or DEFAULT_URL


def _assert_local(url: str) -> None:
    if url.startswith("sqlite"):
        return
    host = (urlparse(url).hostname or "").lower()
    if host in {"localhost", "127.0.0.1", "::1"}:
        return
    sys.exit(
        f"REFUSING TO RUN.\n"
        f"  This is a development seed script and the target is not local:\n"
        f"    {url.split('@')[-1]}\n"
        f"  Point it at a sqlite file or a localhost database."
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database-url", help=f"defaults to {DEFAULT_URL}")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="drop and rebuild every table first (local databases only)",
    )
    args = parser.parse_args()

    url = _resolve_url(args.database_url)
    _assert_local(url)
    # Set before importing anything that builds an engine.
    os.environ["DATABASE_URL"] = url

    from app.database.base import Base
    from app.database.session import SessionLocal, engine
    import app.users.models, app.courses.models, app.batches.models  # noqa: F401
    import app.topics.models, app.questions.models, app.assessments.models  # noqa: F401
    import app.results.models, app.content.models, app.leads.models  # noqa: F401
    import app.admin.models, app.partner.models  # noqa: F401

    from app.batches.models import Batch
    from app.core.enums import BatchProgressStatus, EntityStatus, Origin
    from app.courses.models import Course

    if args.reset:
        print(f"  --reset: dropping and rebuilding {url.split('@')[-1]}")
        Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    db = SessionLocal()

    # hue is each course's panel accent on the shelf, as an oklch hue. These are
    # VPro's own values from web/src/content/courses.ts - six distinct hues in
    # one lightness family.
    COURSES = [
        ("Agentic AI", "agentic-ai", "Build agents that plan, call tools and recover.", True, 1, 52),
        ("Python Full Stack", "python-full-stack", "Python, FastAPI and React, from first principles.", False, 2, 232),
        ("Java Full Stack", "java-full-stack", "Java, Spring Boot and React, from first principles.", False, 3, 18),
        (".NET Full Stack", "dotnet-full-stack", "C#, ASP.NET Core and React, from first principles.", False, 4, 292),
        ("Forward Deployment Engineer", "forward-deployment-engineer", "Ship AI systems inside a customer's stack.", False, 5, 168),
        ("Quantum Computing", "quantum-computing", "Qubits, circuits and algorithms, hands on.", False, 6, 268),
    ]

    by_slug: dict[str, Course] = {}
    for name, slug, tagline, flagship, order, hue in COURSES:
        course = db.query(Course).filter(Course.slug == slug).one_or_none()
        if course is None:
            course = Course(
                name=name, slug=slug, tagline=tagline, description=tagline,
                summary=tagline, level="Beginner friendly", flagship=flagship,
                display_order=order, status=EntityStatus.ACTIVE, hue=hue,
                outcomes=["Ship a working project", "Read and debug real code",
                          "Explain your design choices in an interview"],
                for_whom=["Career switchers", "Working engineers adding AI"],
                techs=["python"],
            )
            db.add(course)
            db.flush()
        by_slug[slug] = course

    def ensure_batch(course, number, start, weeks, origin, days, note):
        existing = (
            db.query(Batch)
            .filter(Batch.course_id == course.id, Batch.batch_number == number)
            .one_or_none()
        )
        if existing is not None:
            return existing
        batch = Batch(
            course_id=course.id, batch_number=number,
            start_date=start, end_date=start + dt.timedelta(weeks=weeks),
            # 04:00-05:00 IST is 6:30-7:30 PM Eastern the PREVIOUS day, which is
            # why the trainer's Tue-Sat is the buyer's Mon-Fri. days_of_week
            # carries the BUYER's days: it is read on the storefront.
            start_time=dt.time(4, 0), end_time=dt.time(5, 0),
            trainer_name="Sambasiva Rao", trainer_email="trainer@vproskills.com",
            days_of_week=days, seats_note=note, seats_total=30,
            status=EntityStatus.ACTIVE, origin=origin,
            progress_status=BatchProgressStatus.IN_PROGRESS,
        )
        db.add(batch)
        return batch

    today = dt.date.today()
    # Tuesday 22 Sep IST == Monday 21 Sep, 6:30 PM, for the buyer.
    ensure_batch(by_slug["agentic-ai"], "DS-01", dt.date(2026, 9, 22), 8,
                 Origin.DIGI_SETU, "Mon-Fri", "Registration open")
    # VPro's own, seeded so the origin filter has something to exclude.
    ensure_batch(by_slug["agentic-ai"], "A-04", today - dt.timedelta(days=30), 8,
                 Origin.VPRO, "Weekdays", None)
    ensure_batch(by_slug["java-full-stack"], "J-11", today + dt.timedelta(days=21), 8,
                 Origin.VPRO, "Weekdays", "Few seats left")

    db.commit()

    print(f"  courses    {db.query(Course).count()}")
    print(f"  DIGI_SETU  {db.query(Batch).filter(Batch.origin == Origin.DIGI_SETU).count()}")
    print(f"  VPRO       {db.query(Batch).filter(Batch.origin == Origin.VPRO).count()}")


if __name__ == "__main__":
    main()
