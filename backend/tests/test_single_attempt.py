"""Tests for the "one attempt per student per assessment" policy
(2026-08-31, per direct admin request: a student who has already
completed a topic's assessment must never be able to attempt it again -
they should be routed to their existing result instead).

Covers both enforcement layers in app/assessments/router.py:
get_assessment (blocks re-fetching the question set once an attempt
exists) and submit_assessment's IntegrityError backstop against the new
UniqueConstraint(assessment_id, student_id) on AssessmentAttempt.
"""


def _option_id(question_json, label):
    return next(o["id"] for o in question_json["options"] if o["option_label"] == label)


def _submit_once(client, topic_id, headers):
    fetched = client.get(f"/api/topics/{topic_id}/assessment", headers=headers)
    assert fetched.status_code == 200, fetched.text
    question = fetched.json()["questions"][0]
    response = client.post(
        f"/api/topics/{topic_id}/assessment/submit",
        json={
            "started_at": "2026-01-01T09:00:00Z",
            "answers": [{"question_id": question["id"], "selected_option_id": _option_id(question, "A")}],
        },
        headers=headers,
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_get_assessment_after_submit_is_blocked_with_the_existing_attempt_id(
    client, make_course, make_batch, make_topic, make_question, make_student, enroll, login_as
):
    course = make_course()
    batch = make_batch(course=course)
    topic = make_topic(course=course)
    make_question(topic=topic, correct_label="A")
    student = make_student(email="single-attempt-get@example.com")
    enroll(student, batch)
    headers = login_as("single-attempt-get@example.com")

    first_result = _submit_once(client, topic.id, headers)

    second_get = client.get(f"/api/topics/{topic.id}/assessment", headers=headers)
    assert second_get.status_code == 409
    detail = second_get.json()["detail"]
    assert detail["attempt_id"] == first_result["attempt_id"]
    assert "already completed" in detail["message"].lower()


def test_submit_after_an_existing_attempt_is_blocked_even_without_a_prior_get(
    client, make_course, make_batch, make_topic, make_question, make_student, enroll, login_as
):
    """Simulates a replayed/raced second submit that skips the normal
    GET-first flow - the DB-level UniqueConstraint is what actually stops
    this, not the GET-side check (which a client could simply not call).
    """
    course = make_course()
    batch = make_batch(course=course)
    topic = make_topic(course=course)
    make_question(topic=topic, correct_label="A")
    student = make_student(email="single-attempt-submit@example.com")
    enroll(student, batch)
    headers = login_as("single-attempt-submit@example.com")

    first_result = _submit_once(client, topic.id, headers)

    # Deliberately does NOT call GET .../assessment again first (that call
    # is itself now blocked - see the other test above - and would
    # short-circuit before ever reaching submit). An empty answers list is
    # enough here: this test is only about the submit-side backstop
    # (the DB UniqueConstraint), not about scoring.
    second_submit = client.post(
        f"/api/topics/{topic.id}/assessment/submit",
        json={"started_at": "2026-01-01T09:05:00Z", "answers": []},
        headers=headers,
    )
    assert second_submit.status_code == 409
    detail = second_submit.json()["detail"]
    assert detail["attempt_id"] == first_result["attempt_id"]


def test_two_different_students_each_get_their_own_single_attempt(
    client, make_course, make_batch, make_topic, make_question, make_student, enroll, login_as
):
    course = make_course()
    batch = make_batch(course=course)
    topic = make_topic(course=course)
    make_question(topic=topic, correct_label="A")
    student_a = make_student(email="single-attempt-a@example.com")
    student_b = make_student(email="single-attempt-b@example.com")
    enroll(student_a, batch)
    enroll(student_b, batch)

    result_a = _submit_once(client, topic.id, login_as("single-attempt-a@example.com"))
    result_b = _submit_once(client, topic.id, login_as("single-attempt-b@example.com"))

    assert result_a["attempt_id"] != result_b["attempt_id"]

    # And each is now blocked from a second attempt of their own.
    blocked_a = client.get(f"/api/topics/{topic.id}/assessment", headers=login_as("single-attempt-a@example.com"))
    assert blocked_a.status_code == 409


def test_admin_can_still_view_the_assessment_repeatedly(
    client, make_admin, make_course, make_topic, make_question, login_as
):
    course = make_course()
    topic = make_topic(course=course)
    make_question(topic=topic, correct_label="A")
    make_admin(email="single-attempt-admin@example.com")
    headers = login_as("single-attempt-admin@example.com")

    first = client.get(f"/api/topics/{topic.id}/assessment", headers=headers)
    second = client.get(f"/api/topics/{topic.id}/assessment", headers=headers)
    assert first.status_code == 200
    assert second.status_code == 200
