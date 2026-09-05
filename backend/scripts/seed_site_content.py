"""Idempotent loader for the site's own copy.

Reads scripts/site_content.json - the content that used to live in
web/src/content/{homeSections,testimonials,mentor,platform}.ts - into the
four ordered list tables and the site_content key/value table.

Lists are replaced wholesale: the file is the source of truth for the initial
load, and a partial update would leave a removed testimonial on the page.

That makes a second run destructive - it would throw away everything the admin
has written since the first one - so by default this refuses to run against
tables that already hold rows. Pass --force to deliberately re-baseline.

Usage (from backend/, venv active):

    python -m scripts.seed_site_content            # first load, after migrating
    python -m scripts.seed_site_content --force    # discard edits, reload file
"""

import argparse
import json
import sys
from pathlib import Path

from app.assessments import models as _assessments_models  # noqa: F401
from app.batches import models as _batches_models  # noqa: F401
from app.content.models import BatchLoopStep, Faq, SiteContent, Tenet, Testimonial
from app.courses import models as _courses_models  # noqa: F401
from app.database.session import SessionLocal
from app.questions import models as _questions_models  # noqa: F401
from app.topics import models as _topics_models  # noqa: F401
from app.users import models as _users_models  # noqa: F401

DATA = Path(__file__).with_name("site_content.json")

# The contact block is not in the JSON export - contact.ts pulls in a helper
# module that cannot be imported standalone - so its values are written here,
# matching web/src/content/contact.ts exactly.
CONTACT = {
    "whatsappNumber": "919010001847",
    "phoneDial": "+919010001847",
    "phoneDisplay": "+91 90100 01847",
    "location": "Ameerpet, Hyderabad",
    "addressLines": ["VPro Skills EduTech", "Ameerpet, Hyderabad", "Telangana 500016, India"],
    "timezone": "Asia/Kolkata",
    "openHour": 9,
    "closeHour": 21,
}


def _occupied(db) -> dict[str, int]:
    """Row counts for everything this script would overwrite."""
    tables = {
        "testimonials": Testimonial,
        "faqs": Faq,
        "tenets": Tenet,
        "batch_loop_steps": BatchLoopStep,
        "site_content": SiteContent,
    }
    return {name: db.query(model).count() for name, model in tables.items()}


def seed(force: bool = False) -> None:
    data = json.loads(DATA.read_text(encoding="utf-8"))
    db = SessionLocal()
    try:
        if not force:
            occupied = {name: n for name, n in _occupied(db).items() if n}
            if occupied:
                listing = ", ".join(f"{name}={n}" for name, n in sorted(occupied.items()))
                sys.exit(
                    f"seed_site_content: refusing to overwrite existing content ({listing}).\n"
                    "This script replaces these tables wholesale, so running it now would "
                    "discard whatever the admin has written.\n"
                    "Pass --force if you really do mean to reload the file over the top."
                )

        db.query(Testimonial).delete()
        for order, item in enumerate(data["TESTIMONIALS"], start=1):
            db.add(
                Testimonial(
                    quote=item["quote"], name=item["name"], role=item.get("role"),
                    display_order=order,
                )
            )

        db.query(Faq).delete()
        for order, item in enumerate(data["FAQS"], start=1):
            db.add(Faq(question=item["q"], answer=item["a"], display_order=order))

        db.query(Tenet).delete()
        for order, item in enumerate(data["TENETS"], start=1):
            db.add(Tenet(number=item["n"], title=item["k"], body=item["v"], display_order=order))

        db.query(BatchLoopStep).delete()
        for order, item in enumerate(data["BATCH_LOOP"], start=1):
            db.add(
                BatchLoopStep(
                    number=item["n"], title=item["title"], body=item["body"], display_order=order
                )
            )

        blobs = {
            "hero": {**data["PLATFORM"], "facts": data["HERO_FACTS"]},
            # Built field by field, not spread: TRAINER.photo is a path string
            # and MENTOR.photo is an object, so a spread silently replaced one
            # with the other and broke the component reading it.
            "trainer": {
                "eyebrow": data["TRAINER"]["eyebrow"],
                "quote": data["TRAINER"]["quote"],
                "body": list(data["TRAINER"]["body"]),
                "photo": data["TRAINER"]["photo"],
                "photoFallback": data["TRAINER"]["photoFallback"],
                "photoAlt": data["MENTOR"]["photo"]["alt"],
                "name": data["MENTOR"]["name"],
                "roles": list(data["MENTOR"]["roles"]),
                "bio": data["MENTOR"]["bio"],
                "stats": list(data["MENTOR"]["stats"]),
            },
            "contact": CONTACT,
        }
        for key, value in blobs.items():
            row = db.query(SiteContent).filter(SiteContent.key == key).one_or_none()
            if row is None:
                db.add(SiteContent(key=key, value=value))
            else:
                row.value = value

        db.commit()
        print(
            f"testimonials={len(data['TESTIMONIALS'])} faqs={len(data['FAQS'])} "
            f"tenets={len(data['TENETS'])} batch_loop={len(data['BATCH_LOOP'])} "
            f"site_content={len(blobs)}"
        )
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--force",
        action="store_true",
        help="reload the file over content that already exists, discarding edits",
    )
    seed(force=parser.parse_args().force)
