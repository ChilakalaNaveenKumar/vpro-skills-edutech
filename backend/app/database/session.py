from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

# pool_pre_ping avoids stale-connection errors; pool_size/max_overflow are
# sized for the ~1,000-concurrent-student target described in the product spec
# and can be tuned per-environment via future settings without touching callers.
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

if engine.dialect.name == "sqlite":
    # Production always runs on Postgres, which enforces foreign keys (and
    # therefore ON DELETE RESTRICT/CASCADE) by default. SQLite does not,
    # unless told to per-connection - without this, a SQLite-backed dev/test
    # run of this app would silently allow deleting a Question that already
    # has AssessmentAnswer rows pointing at it, instead of the 409 the real
    # database would produce. This has no effect at all on Postgres.
    @event.listens_for(engine, "connect")
    def _enable_sqlite_foreign_keys(dbapi_connection, connection_record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a request-scoped DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
