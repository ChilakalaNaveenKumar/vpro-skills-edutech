"""Stops a seed script writing to a database nobody meant to write to.

Both seeds take their target from DATABASE_URL, like everything else in the
app. That means the only thing separating "reload my laptop's content" from
"reload the live site's content" is which .env happens to be on the machine -
and docs/RUNBOOK.md tells operators to run these very scripts inside the
production container. A --force there replaces the trainer's curriculum edits
wholesale, with no undo and no prompt.

Two guards, deliberately cheap:

- Always print the database about to be written. Someone who has been handed a
  connection string, or forgotten which shell they are in, can see it before
  anything happens rather than afterwards.
- Refuse outright when the deployment declares itself production, unless the
  command says so as well. Production is not somewhere you arrive at by
  accident, so saying it twice is not a burden.

The environment comes from ENVIRONMENT, which docker-compose.prod.yml and
docker-compose.aws.yml both set. A local shell has no such value and defaults
to "development", so nothing here gets in a developer's way.
"""

import sys

from sqlalchemy.engine import make_url

from app.core.config import get_settings

PRODUCTION = "production"


def describe_target() -> tuple[str, str]:
    """Returns (environment, a human description of the target database)."""
    settings = get_settings()
    url = make_url(settings.database_url)
    if url.host:
        port = f":{url.port}" if url.port else ""
        where = f"{url.database} on {url.host}{port}"
    else:
        # SQLite and friends - the "host" is a path on this machine.
        where = url.database or "an unnamed local database"
    return settings.environment.strip().lower(), where


def confirm_target(script: str, *, allow_production: bool) -> None:
    environment, where = describe_target()
    # Flushed because the refusal below goes to stderr, which is unbuffered:
    # without this the two arrive out of order and the last thing on screen is
    # "writing to <production>", which reads as though it went ahead.
    print(f"{script}: writing to {where} (environment={environment})", flush=True)

    if environment != PRODUCTION:
        return

    if allow_production:
        print(
            f"{script}: --allow-production given; continuing against production",
            flush=True,
        )
        return

    sys.exit(
        f"{script}: refusing to run against production.\n"
        f"  target: {where}\n"
        "This script replaces content wholesale. If that is genuinely what you "
        "want, take a backup first (docker/backup.sh) and re-run with "
        "--allow-production.\n"
        "If you did not expect to see production here, check DATABASE_URL - you "
        "are probably in the wrong shell or the wrong container."
    )


def add_arguments(parser) -> None:
    """The flags every seed needs, kept in one place so they cannot drift."""
    parser.add_argument(
        "--force",
        action="store_true",
        help="reload the file over content that already exists, discarding edits",
    )
    parser.add_argument(
        "--allow-production",
        action="store_true",
        help="permit this run when ENVIRONMENT=production; take a backup first",
    )
