"""Erasure tests: DELETE /api/users/{id}.

This endpoint is what makes the public /data-deletion page truthful, so these
tests are less about the happy path than about the two ways a deletion promise
gets broken in practice: leaving records behind that still point at the person,
and taking someone else's records with them.

The cascade being exercised is a database one, not an ORM one - only
`student_batches` has a configured relationship. `assessment_attempts` and
`assessment_answers` disappear because of ON DELETE CASCADE, which SQLite only
honours with `PRAGMA foreign_keys=ON`. app/database/session.py sets that for
exactly this reason, so these tests are also the guard on that pragma: remove
it and they fail here rather than silently in production.
"""

from app.assessments.models import AssessmentAnswer, AssessmentAttempt
from app.core.enums import UserRole
from app.users.models import StudentBatch, User


def _option_id(question_json, label):
    return next(o["id"] for o in question_json["options"] if o["option_label"] == label)


def _sit_assessment(client, topic, headers):
    """Puts one attempt and one answer row on the books for this student."""
    fetched = client.get(f"/api/topics/{topic.id}/assessment", headers=headers).json()
    question = fetched["questions"][0]
    response = client.post(
        f"/api/topics/{topic.id}/assessment/submit",
        json={
            "started_at": "2026-01-01T09:00:00Z",
            "answers": [
                {"question_id": question["id"], "selected_option_id": _option_id(question, "A")}
            ],
        },
        headers=headers,
    )
    assert response.status_code == 200, response.text


def test_erasing_a_student_removes_the_account_and_everything_hanging_off_it(
    client,
    db_session,
    make_admin,
    make_course,
    make_batch,
    make_topic,
    make_question,
    make_student,
    enroll,
    login_as,
):
    course = make_course()
    batch = make_batch(course=course)
    topic = make_topic(course=course)
    make_question(topic=topic, correct_label="A")
    student = make_student(email="erase-me@example.com")
    enroll(student, batch)
    _sit_assessment(client, topic, login_as("erase-me@example.com"))

    make_admin(email="eraser@example.com")
    student_id = student.id

    response = client.delete(
        f"/api/users/{student_id}", headers=login_as("eraser@example.com")
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["deleted_user_id"] == student_id
    assert body["email"] == "erase-me@example.com"
    assert body["enrollments_deleted"] == 1
    assert body["attempts_deleted"] == 1
    assert body["answers_deleted"] == 1

    # Nothing anywhere still points at this person.
    db_session.expire_all()
    assert db_session.get(User, student_id) is None
    assert (
        db_session.query(StudentBatch).filter(StudentBatch.student_id == student_id).count() == 0
    )
    assert (
        db_session.query(AssessmentAttempt)
        .filter(AssessmentAttempt.student_id == student_id)
        .count()
        == 0
    )
    # Answers have no student_id of their own; they are reachable only through
    # the attempt, so the check that matters is that none are left orphaned.
    assert db_session.query(AssessmentAnswer).count() == 0


def test_erasing_one_student_leaves_another_students_records_untouched(
    client,
    db_session,
    make_admin,
    make_course,
    make_batch,
    make_topic,
    make_question,
    make_student,
    enroll,
    login_as,
):
    """The failure this guards against is a cascade that is too wide. Both
    students sat the same assessment on the same topic, so their rows are
    interleaved in the same tables."""
    course = make_course()
    batch = make_batch(course=course)
    topic = make_topic(course=course)
    make_question(topic=topic, correct_label="A")

    doomed = make_student(email="doomed@example.com")
    keeper = make_student(email="keeper@example.com")
    enroll(doomed, batch)
    enroll(keeper, batch)
    _sit_assessment(client, topic, login_as("doomed@example.com"))
    _sit_assessment(client, topic, login_as("keeper@example.com"))

    make_admin(email="eraser2@example.com")
    keeper_id = keeper.id

    response = client.delete(
        f"/api/users/{doomed.id}", headers=login_as("eraser2@example.com")
    )
    assert response.status_code == 200, response.text

    db_session.expire_all()
    assert db_session.get(User, keeper_id) is not None
    assert (
        db_session.query(AssessmentAttempt).filter(AssessmentAttempt.student_id == keeper_id).count()
        == 1
    )
    assert db_session.query(AssessmentAnswer).count() == 1
    assert db_session.query(StudentBatch).filter(StudentBatch.student_id == keeper_id).count() == 1


def test_erasing_a_student_who_never_did_anything_still_works(
    client, db_session, make_admin, make_student, login_as
):
    student = make_student(email="quiet@example.com")
    make_admin(email="eraser3@example.com")
    student_id = student.id

    response = client.delete(
        f"/api/users/{student_id}", headers=login_as("eraser3@example.com")
    )

    assert response.status_code == 200, response.text
    assert response.json()["attempts_deleted"] == 0
    assert response.json()["enrollments_deleted"] == 0
    db_session.expire_all()
    assert db_session.get(User, student_id) is None


def test_an_admin_cannot_erase_their_own_account(client, db_session, make_admin, login_as):
    """Erasing yourself would invalidate the token authorising the request
    partway through it. Another admin has to do it."""
    admin = make_admin(email="self-eraser@example.com")
    make_admin(email="other-admin@example.com")  # so the last-admin guard is not what fires

    response = client.delete(
        f"/api/users/{admin.id}", headers=login_as("self-eraser@example.com")
    )

    assert response.status_code == 400
    assert "your own account" in response.json()["detail"]
    db_session.expire_all()
    assert db_session.get(User, admin.id) is not None


def test_the_site_can_never_be_left_without_an_active_admin(
    client, db_session, make_admin, login_as
):
    """There is no explicit last-admin check, and there does not need to be.
    The caller is necessarily an active admin and cannot erase themselves, so
    an active admin always survives any call. This pins that reasoning down:
    the sole admin, acting alone, cannot empty the site of admins."""
    sole_admin = make_admin(email="sole-admin@example.com")

    response = client.delete(
        f"/api/users/{sole_admin.id}", headers=login_as("sole-admin@example.com")
    )

    assert response.status_code == 400
    db_session.expire_all()
    assert db_session.get(User, sole_admin.id) is not None
    assert (
        db_session.query(User)
        .filter(User.role == UserRole.ADMIN, User.is_active.is_(True))
        .count()
        >= 1
    )


def test_erasing_an_admin_is_allowed_when_another_active_admin_remains(
    client, db_session, make_admin, login_as
):
    doomed_admin = make_admin(email="spare-admin@example.com")
    make_admin(email="surviving-admin@example.com")
    doomed_id = doomed_admin.id

    response = client.delete(
        f"/api/users/{doomed_id}", headers=login_as("surviving-admin@example.com")
    )

    assert response.status_code == 200, response.text
    db_session.expire_all()
    assert db_session.get(User, doomed_id) is None


def test_erasing_an_unknown_user_is_a_404(client, make_admin, login_as):
    make_admin(email="eraser4@example.com")
    response = client.delete("/api/users/999999", headers=login_as("eraser4@example.com"))
    assert response.status_code == 404


def test_a_student_cannot_erase_anyone(client, db_session, make_student, login_as):
    """The whole router is admin-gated, but erasure is the one route where a
    hole would be unrecoverable, so it gets its own check."""
    caller = make_student(email="nosy@example.com")
    victim = make_student(email="victim@example.com")

    response = client.delete(f"/api/users/{victim.id}", headers=login_as("nosy@example.com"))

    assert response.status_code == 403
    db_session.expire_all()
    assert db_session.get(User, victim.id) is not None
    assert db_session.get(User, caller.id) is not None


def test_erasure_requires_authentication(client, make_student):
    student = make_student(email="anon-target@example.com")
    response = client.delete(f"/api/users/{student.id}")
    assert response.status_code == 401


def test_deactivating_is_not_erasing(client, db_session, make_admin, make_student, login_as):
    """The distinction the /data-deletion page rests on: deactivation keeps
    the row, the email and the password hash. Only DELETE removes them."""
    student = make_student(email="still-here@example.com")
    make_admin(email="eraser5@example.com")
    headers = login_as("eraser5@example.com")

    client.put(f"/api/users/{student.id}", json={"is_active": False}, headers=headers)

    db_session.expire_all()
    still_there = db_session.get(User, student.id)
    assert still_there is not None
    assert still_there.email == "still-here@example.com"
    assert still_there.password_hash

    client.delete(f"/api/users/{student.id}", headers=headers)

    db_session.expire_all()
    assert db_session.get(User, student.id) is None
