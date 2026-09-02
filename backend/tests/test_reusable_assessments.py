"""Tests for reusable assessments (2026-08-31): an Assessment is now a
standalone entity that can be attached to more than one Topic - see
app/assessments/models.py's docstring. These tests cover exactly the bug
this decoupling fixes: attaching an assessment to a second topic must
never detach it from the first, and a student enrolled in both courses
must be able to complete it independently under each.
"""

from app.assessments.models import Assessment


def _option_id(question_json, label):
    return next(o["id"] for o in question_json["options"] if o["option_label"] == label)


def _submit(client, topic_id, headers, correct_label="A"):
    fetched = client.get(f"/api/topics/{topic_id}/assessment", headers=headers)
    assert fetched.status_code == 200, fetched.text
    question = fetched.json()["questions"][0]
    response = client.post(
        f"/api/topics/{topic_id}/assessment/submit",
        json={
            "started_at": "2026-01-01T09:00:00Z",
            "answers": [
                {"question_id": question["id"], "selected_option_id": _option_id(question, correct_label)}
            ],
        },
        headers=headers,
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_attaching_to_a_second_topic_does_not_detach_the_first(
    client, make_admin, make_course, make_topic, make_assessment, make_question, login_as
):
    """The exact bug reported: attaching an assessment to Topic 1 of
    Course 1, then reusing it under Topic 2 of Course 2, must leave
    Topic 1's attachment untouched.
    """
    admin = make_admin(email="reuse-admin@example.com")
    headers = login_as(admin.email)

    course_a = make_course(name="Course A")
    course_b = make_course(name="Course B")
    topic_a = make_topic(course=course_a, name="Topic A1")
    topic_b = make_topic(course=course_b, name="Topic B1")

    assessment = make_assessment(name="Shared Quiz")
    make_question(assessment=assessment, correct_label="A")

    attach_a = client.put(
        f"/api/admin/topics/{topic_a.id}", json={"assessment_id": assessment.id}, headers=headers
    )
    assert attach_a.status_code == 200, attach_a.text
    assert attach_a.json()["assessment_id"] == assessment.id

    attach_b = client.put(
        f"/api/admin/topics/{topic_b.id}", json={"assessment_id": assessment.id}, headers=headers
    )
    assert attach_b.status_code == 200, attach_b.text
    assert attach_b.json()["assessment_id"] == assessment.id

    # Topic A must still show the assessment attached - this is the
    # regression the old unique-topic_id design would have caused.
    refetched_a = client.get(f"/api/admin/topics/{topic_a.id}", headers=headers)
    assert refetched_a.status_code == 200
    assert refetched_a.json()["assessment_id"] == assessment.id


def test_student_enrolled_in_both_courses_completes_the_shared_assessment_independently(
    client,
    make_admin,
    make_student,
    make_course,
    make_batch,
    make_topic,
    make_assessment,
    make_question,
    enroll,
    login_as,
):
    admin = make_admin(email="reuse-admin2@example.com")
    admin_headers = login_as(admin.email)

    course_a = make_course(name="Course A2")
    course_b = make_course(name="Course B2")
    batch_a = make_batch(course=course_a)
    batch_b = make_batch(course=course_b)
    topic_a = make_topic(course=course_a)
    topic_b = make_topic(course=course_b)

    assessment = make_assessment(name="Shared Quiz 2")
    make_question(assessment=assessment, correct_label="B")

    for topic in (topic_a, topic_b):
        resp = client.put(
            f"/api/admin/topics/{topic.id}",
            json={"assessment_id": assessment.id},
            headers=admin_headers,
        )
        assert resp.status_code == 200, resp.text

    student = make_student(email="reuse-student@example.com")
    enroll(student=student, batch=batch_a)
    enroll(student=student, batch=batch_b)
    student_headers = login_as(student.email)

    result_a = _submit(client, topic_a.id, student_headers, correct_label="B")
    result_b = _submit(client, topic_b.id, student_headers, correct_label="B")

    # Two independent attempts/results, not a single shared one blocked
    # after the first submission.
    assert result_a["attempt_id"] != result_b["attempt_id"]
    assert result_a["score"] == 1
    assert result_b["score"] == 1

    # But retaking the *same* topic a second time is still blocked, same
    # as ever - only cross-topic reuse is allowed to be attempted twice.
    retry = client.get(f"/api/topics/{topic_a.id}/assessment", headers=student_headers)
    assert retry.status_code == 409


def test_detaching_from_one_topic_leaves_the_other_topics_attachment_alone(
    client, make_admin, make_course, make_topic, make_assessment, login_as
):
    admin = make_admin(email="reuse-admin3@example.com")
    headers = login_as(admin.email)

    course = make_course()
    topic_1 = make_topic(course=course, name="T1")
    topic_2 = make_topic(course=course, name="T2")
    assessment = make_assessment(name="Detach Test Quiz")

    for topic in (topic_1, topic_2):
        resp = client.put(
            f"/api/admin/topics/{topic.id}", json={"assessment_id": assessment.id}, headers=headers
        )
        assert resp.status_code == 200, resp.text

    detach = client.put(
        f"/api/admin/topics/{topic_1.id}", json={"assessment_id": None}, headers=headers
    )
    assert detach.status_code == 200, detach.text
    assert detach.json()["assessment_id"] is None

    still_attached = client.get(f"/api/admin/topics/{topic_2.id}", headers=headers)
    assert still_attached.json()["assessment_id"] == assessment.id


def test_deleting_an_assessment_attached_to_a_topic_is_blocked(
    client, make_admin, make_course, make_topic, make_assessment, login_as
):
    admin = make_admin(email="reuse-admin4@example.com")
    headers = login_as(admin.email)

    course = make_course()
    topic = make_topic(course=course)
    assessment = make_assessment(name="Undeleteable Quiz")

    attach = client.put(
        f"/api/admin/topics/{topic.id}", json={"assessment_id": assessment.id}, headers=headers
    )
    assert attach.status_code == 200, attach.text

    delete_resp = client.delete(f"/api/admin/assessments/{assessment.id}", headers=headers)
    assert delete_resp.status_code == 409

    detach = client.put(
        f"/api/admin/topics/{topic.id}", json={"assessment_id": None}, headers=headers
    )
    assert detach.status_code == 200, detach.text

    delete_after_detach = client.delete(f"/api/admin/assessments/{assessment.id}", headers=headers)
    assert delete_after_detach.status_code == 204


def test_deleting_an_assessment_with_questions_but_no_topics_cascades_cleanly(
    client, make_admin, make_assessment, make_question, login_as, db_session
):
    """Regression test (2026-08-31): an assessment's own Questions belong
    exclusively to it (unlike topics/attempts, which are the actual
    delete-safety checks in delete_assessment), so deleting an assessment
    that has questions but is not attached to any topic and has no
    attempts must succeed and take its questions with it - not 500. This
    exercises a path the sibling test above never did (that assessment
    was never given any questions), which is exactly how the bug -
    SQLAlchemy trying to null out Question.assessment_id, a NOT NULL
    column, instead of leaving the DB's own ON DELETE CASCADE to do it -
    went unnoticed.
    """
    from sqlalchemy import text

    admin = make_admin(email="reuse-admin7@example.com")
    headers = login_as(admin.email)

    assessment = make_assessment(name="Has Questions, No Topic")
    question = make_question(assessment=assessment, correct_label="A")
    # Read while still fresh - client.delete() below reuses this same
    # db_session under the hood, and its commit() expires every object
    # this session is tracking (default expire_on_commit=True), including
    # `question`. Touching `question.id` after that point - even just to
    # read it - would try to refresh the now-cascade-deleted row and raise
    # ObjectDeletedError, same as any ORM read of it would.
    question_id = question.id

    delete_resp = client.delete(f"/api/admin/assessments/{assessment.id}", headers=headers)
    assert delete_resp.status_code == 204, delete_resp.text

    # Raw SQL, not the ORM, for this check too: even with a plain int id
    # in hand, an ORM Query for a Question with this id would hydrate an
    # instance sharing identity with the expired one above and hit the
    # same refresh problem. A raw COUNT sidesteps that entirely.
    remaining = db_session.execute(
        text("SELECT COUNT(*) FROM questions WHERE id = :qid"), {"qid": question_id}
    ).scalar()
    assert remaining == 0


def test_attaching_a_nonexistent_assessment_404s(client, make_admin, make_course, make_topic, login_as):
    admin = make_admin(email="reuse-admin5@example.com")
    headers = login_as(admin.email)
    course = make_course()
    topic = make_topic(course=course)

    resp = client.put(
        f"/api/admin/topics/{topic.id}", json={"assessment_id": 999999}, headers=headers
    )
    assert resp.status_code == 404


def test_assessment_admin_crud_and_reuse_counts(client, make_admin, make_course, make_topic, login_as, db_session):
    admin = make_admin(email="reuse-admin6@example.com")
    headers = login_as(admin.email)

    create = client.post(
        "/api/admin/assessments/",
        json={"name": "CRUD Quiz", "description": "for testing"},
        headers=headers,
    )
    assert create.status_code == 201, create.text
    body = create.json()
    assert body["name"] == "CRUD Quiz"
    assert body["question_count"] == 0
    assert body["topic_count"] == 0

    assessment_id = body["id"]
    course = make_course()
    topic_1 = make_topic(course=course)
    topic_2 = make_topic(course=course)
    for topic in (topic_1, topic_2):
        resp = client.put(
            f"/api/admin/topics/{topic.id}", json={"assessment_id": assessment_id}, headers=headers
        )
        assert resp.status_code == 200

    fetched = client.get(f"/api/admin/assessments/{assessment_id}", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json()["topic_count"] == 2

    update = client.put(
        f"/api/admin/assessments/{assessment_id}", json={"name": "Renamed Quiz"}, headers=headers
    )
    assert update.status_code == 200
    assert update.json()["name"] == "Renamed Quiz"

    listing = client.get("/api/admin/assessments/", headers=headers)
    assert listing.status_code == 200
    assert any(a["id"] == assessment_id for a in listing.json())

    # Sanity check against the raw model too, not just the API shape.
    assert db_session.query(Assessment).filter_by(id=assessment_id).one().name == "Renamed Quiz"
