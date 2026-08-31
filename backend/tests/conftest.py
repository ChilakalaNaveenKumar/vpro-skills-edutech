"""Pytest fixtures for the backend test suite (Phase 11).

DATABASE_URL/JWT_SECRET must exist *before* app.main (and therefore
app.database.session, which builds its own engine at import time) is ever
imported - app/core/config.py's Settings() has no defaults for either and
is @lru_cache'd, so setting them here, before any `from app...` import,
makes the whole suite independent of whether a real backend/.env exists or
is filled in. Their values are never actually used for a live connection:
every test overrides the get_db dependency with its own isolated in-memory
SQLite session (see the client fixture below), so the real app.database
.session.engine this unlocks just sits there unused.
"""

import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./unused-placeholder.db")
os.environ.setdefault("JWT_SECRET", "test-only-secret-not-for-production")

from datetime import date, time

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.enums import EntityStatus, UserRole
from app.core.security import hash_password
from app.database.base import Base
from app.database.session import get_db
from app.main import app
from app.batches.models import Batch
from app.courses.models import Course
from app.assessments.models import Assessment
from app.questions.models import Question, QuestionOption
from app.topics.models import Topic
from app.users.models import StudentBatch, User

DEFAULT_PASSWORD = "TestPass123!"


@pytest.fixture()
def db_engine():
    """A fresh in-memory SQLite database per test function - full
    isolation, no cross-test state. Registers the same
    PRAGMA foreign_keys=ON "connect" hook app/database/session.py already
    registers on its own (real) engine (added Phase 6, so ON DELETE
    RESTRICT/CASCADE are actually enforced under SQLite, matching Postgres'
    default behavior) - duplicated rather than imported, since it's tied to
    a specific engine object via event.listens_for(engine, ...) and this is
    a separate engine.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _enable_sqlite_foreign_keys(dbapi_connection, connection_record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def db_session(db_engine):
    testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = testing_session_local()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session):
    """A TestClient wired to this test's isolated db_session via FastAPI's
    dependency-override mechanism - the real app, the real routers, a fake
    database.
    """

    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# --- Factory fixtures ------------------------------------------------
# Build fixtures via direct ORM inserts rather than through admin API
# calls - faster, and keeps each test focused on the one thing it's
# actually verifying rather than re-deriving setup state through several
# endpoints.


@pytest.fixture()
def make_user(db_session):
    def _make(*, full_name: str, email: str, role: UserRole, password: str = DEFAULT_PASSWORD, is_active: bool = True) -> User:
        user = User(
            full_name=full_name,
            email=email,
            password_hash=hash_password(password),
            role=role,
            is_active=is_active,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    return _make


@pytest.fixture()
def make_admin(make_user):
    counter = {"n": 0}

    def _make(**overrides) -> User:
        counter["n"] += 1
        defaults = {
            "full_name": f"Admin {counter['n']}",
            "email": f"admin{counter['n']}@example.com",
            "role": UserRole.ADMIN,
        }
        defaults.update(overrides)
        return make_user(**defaults)

    return _make


@pytest.fixture()
def make_student(make_user):
    counter = {"n": 0}

    def _make(**overrides) -> User:
        counter["n"] += 1
        defaults = {
            "full_name": f"Student {counter['n']}",
            "email": f"student{counter['n']}@example.com",
            "role": UserRole.STUDENT,
        }
        defaults.update(overrides)
        return make_user(**defaults)

    return _make


@pytest.fixture()
def make_course(db_session):
    counter = {"n": 0}

    def _make(**overrides) -> Course:
        counter["n"] += 1
        defaults = {"name": f"Course {counter['n']}", "status": EntityStatus.ACTIVE}
        defaults.update(overrides)
        course = Course(**defaults)
        db_session.add(course)
        db_session.commit()
        db_session.refresh(course)
        return course

    return _make


@pytest.fixture()
def make_batch(db_session):
    counter = {"n": 0}

    def _make(*, course: Course, **overrides) -> Batch:
        counter["n"] += 1
        defaults = {
            "course_id": course.id,
            "batch_number": f"B{counter['n']}",
            "start_date": date(2026, 1, 1),
            "end_date": date(2026, 6, 1),
            "start_time": time(9, 0),
            "end_time": time(11, 0),
            "trainer_name": "Trainer",
            "status": EntityStatus.ACTIVE,
        }
        defaults.update(overrides)
        batch = Batch(**defaults)
        db_session.add(batch)
        db_session.commit()
        db_session.refresh(batch)
        return batch

    return _make


@pytest.fixture()
def make_topic(db_session):
    counter = {"n": 0}

    def _make(*, course: Course, **overrides) -> Topic:
        counter["n"] += 1
        defaults = {
            "course_id": course.id,
            "name": f"Topic {counter['n']}",
            "topic_order": counter["n"],
            "status": EntityStatus.ACTIVE,
        }
        defaults.update(overrides)
        topic = Topic(**defaults)
        db_session.add(topic)
        db_session.commit()
        db_session.refresh(topic)
        return topic

    return _make


@pytest.fixture()
def make_question(db_session):
    """Creates a question with exactly 4 options (A-D); `correct_label`
    picks which one is marked correct (default "A"), matching the real
    admin-creation validation rule (exactly one correct option) even
    though this factory bypasses that schema and inserts directly.

    Also ensures the topic's Assessment row exists (creating it ACTIVE on
    first call for a topic, reusing it on subsequent calls) - this mirrors
    what app/assessments/provisioning.py's ensure_assessment_for_topic()
    does as a side effect of the real admin "create question" endpoint.
    Since this factory bypasses that endpoint and inserts the Question
    directly, it has to do the same provisioning itself, or
    GET/POST .../assessment would 404 with "Assessment not available for
    this topic" even though questions exist - caught by this suite's own
    first smoke test against these fixtures.
    """
    counter = {"n": 0}

    def _make(*, topic: Topic, correct_label: str = "A", texts: dict[str, str] | None = None, status: EntityStatus = EntityStatus.ACTIVE) -> Question:
        counter["n"] += 1
        texts = texts or {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}
        question = Question(topic_id=topic.id, question_text=f"Question {counter['n']}?", status=status)
        question.options = [
            QuestionOption(option_label=label, option_text=text, is_correct=(label == correct_label))
            for label, text in texts.items()
        ]
        db_session.add(question)

        assessment = db_session.query(Assessment).filter_by(topic_id=topic.id).one_or_none()
        if assessment is None:
            db_session.add(Assessment(topic_id=topic.id, status=EntityStatus.ACTIVE))

        db_session.commit()
        db_session.refresh(question)
        return question

    return _make


@pytest.fixture()
def enroll(db_session):
    def _enroll(student: User, batch: Batch) -> StudentBatch:
        link = StudentBatch(student_id=student.id, batch_id=batch.id)
        db_session.add(link)
        db_session.commit()
        return link

    return _enroll


@pytest.fixture()
def login_as(client):
    """Logs in via the real POST /api/auth/login endpoint (not a
    hand-crafted JWT) and returns Authorization headers - more faithful to
    how every real caller gets a token, and this doubles as coverage of
    the login path itself wherever it's used as setup for another test.
    """

    def _login(email: str, password: str = DEFAULT_PASSWORD) -> dict[str, str]:
        response = client.post("/api/auth/login", json={"email": email, "password": password})
        assert response.status_code == 200, response.text
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    return _login
