"""Scoring tests (Phase 11): GET/POST .../assessment[/submit].

Covers app/assessments/router.py. The core guarantee under test throughout
this file: the backend always calculates and stores the score itself from
what's actually in the database - it never trusts anything the client
sends about correctness, counts, or the score itself.
"""

from datetime import datetime, timezone


def _option_id(question_json, label):
    return next(o["id"] for o in question_json["options"] if o["option_label"] == label)


def test_get_assessment_never_exposes_is_correct(
    client, make_admin, make_course, make_batch, make_topic, make_question, make_student, enroll, login_as
):
    course = make_course()
    batch = make_batch(course=course)
    topic = make_topic(course=course)
    make_question(topic=topic, correct_label="A")
    student = make_student(email="no-leak-student@example.com")
    enroll(student, batch)
    make_admin(email="no-leak-admin@example.com")

    as_student = client.get(
        f"/api/topics/{topic.id}/assessment", headers=login_as("no-leak-student@example.com")
    )
    as_admin = client.get(
        f"/api/topics/{topic.id}/assessment", headers=login_as("no-leak-admin@example.com")
    )

    assert as_student.status_code == 200
    assert as_admin.status_code == 200
    # is_correct must never reach the frontend before submission, for
    # anyone, admin included - check the raw JSON text, not just the
    # response_model shape, since a raw-text check catches an accidental
    # dict/extra-field leak that a strict schema might otherwise mask.
    assert "is_correct" not in as_student.text
    assert "is_correct" not in as_admin.text


def test_submit_computes_score_correctly_for_a_right_wrong_unanswered_mix(
    client, make_course, make_batch, make_topic, make_question, make_student, enroll, login_as
):
    course = make_course()
    batch = make_batch(course=course)
    topic = make_topic(course=course)
    make_question(topic=topic, correct_label="A")  # answered correctly
    make_question(topic=topic, correct_label="B")  # answered incorrectly
    make_question(topic=topic, correct_label="C")  # left unanswered
    student = make_student(email="mix-student@example.com")
    enroll(student, batch)
    headers = login_as("mix-student@example.com")

    fetched = client.get(f"/api/topics/{topic.id}/assessment", headers=headers).json()
    questions = fetched["questions"]
    q1, q2, q3 = questions[0], questions[1], questions[2]

    answers = [
        {"question_id": q1["id"], "selected_option_id": _option_id(q1, "A")},  # correct
        {"question_id": q2["id"], "selected_option_id": _option_id(q2, "A")},  # wrong (correct is B)
        {"question_id": q3["id"], "selected_option_id": None},  # unanswered
    ]

    response = client.post(
        f"/api/topics/{topic.id}/assessment/submit",
        json={"started_at": "2026-01-01T09:00:00Z", "answers": answers},
        headers=headers,
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["total_questions"] == 3
    assert body["score"] == 1
    assert body["wrong_count"] == 2
    assert body["percentage"] == round(1 / 3 * 100, 2)


def test_submit_ignores_a_selected_option_id_belonging_to_a_different_question(
    client, make_course, make_batch, make_topic, make_question, make_student, enroll, login_as
):
    course = make_course()
    batch = make_batch(course=course)
    topic = make_topic(course=course)
    make_question(topic=topic, correct_label="A")
    make_question(topic=topic, correct_label="B")
    student = make_student(email="foreign-option@example.com")
    enroll(student, batch)
    headers = login_as("foreign-option@example.com")

    fetched = client.get(f"/api/topics/{topic.id}/assessment", headers=headers).json()
    q1, q2 = fetched["questions"]
    q2_option_a_id = _option_id(q2, "A")  # belongs to q2, not q1

    # Answer q1 using an option id that actually belongs to q2. This must
    # not crash, and must not be treated as a correct/matching answer for
    # q1 just because *some* option with that id exists in the DB.
    response = client.post(
        f"/api/topics/{topic.id}/assessment/submit",
        json={
            "started_at": "2026-01-01T09:00:00Z",
            "answers": [
                {"question_id": q1["id"], "selected_option_id": q2_option_a_id},
                {"question_id": q2["id"], "selected_option_id": None},
            ],
        },
        headers=headers,
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["score"] == 0
    assert body["wrong_count"] == 2

    # Verify what was actually persisted, through the real read endpoint -
    # the mismatched answer is stored as unanswered (None), not silently
    # linked to the wrong question's option.
    detail = client.get(f"/api/results/{body['attempt_id']}", headers=headers).json()
    q1_answer = next(a for a in detail["answers"] if a["question_id"] == q1["id"])
    assert q1_answer["selected_option_label"] is None
    assert q1_answer["is_correct"] is False


def test_submit_ignores_client_supplied_score_like_fields(
    client, make_course, make_batch, make_topic, make_question, make_student, enroll, login_as
):
    course = make_course()
    batch = make_batch(course=course)
    topic = make_topic(course=course)
    make_question(topic=topic, correct_label="A")
    student = make_student(email="spoof-student@example.com")
    enroll(student, batch)
    headers = login_as("spoof-student@example.com")

    fetched = client.get(f"/api/topics/{topic.id}/assessment", headers=headers).json()
    q1 = fetched["questions"][0]

    response = client.post(
        f"/api/topics/{topic.id}/assessment/submit",
        json={
            "started_at": "2026-01-01T09:00:00Z",
            # Leave the real question unanswered, then try to lie about
            # the score via extra fields the schema doesn't declare.
            "answers": [{"question_id": q1["id"], "selected_option_id": None}],
            "score": 999,
            "percentage": 100,
            "wrong_count": 0,
        },
        headers=headers,
    )

    assert response.status_code == 200, response.text
    body = response.json()
    # The server-computed truth (0/1, unanswered) wins - the spoofed
    # fields are silently ignored, never trusted.
    assert body["score"] == 0
    assert body["wrong_count"] == 1
    assert body["percentage"] == 0.0


def test_only_students_can_submit(
    client, make_admin, make_course, make_batch, make_topic, make_question, login_as
):
    course = make_course()
    topic = make_topic(course=course)
    make_question(topic=topic)
    make_admin(email="submit-admin@example.com")

    response = client.post(
        f"/api/topics/{topic.id}/assessment/submit",
        json={"started_at": "2026-01-01T09:00:00Z", "answers": []},
        headers=login_as("submit-admin@example.com"),
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Only students can submit assessment attempts"


def test_non_enrolled_student_is_blocked_from_get_and_submit(
    client, make_course, make_topic, make_question, make_student, login_as
):
    course = make_course()
    topic = make_topic(course=course)
    make_question(topic=topic)
    make_student(email="not-enrolled@example.com")
    headers = login_as("not-enrolled@example.com")

    get_response = client.get(f"/api/topics/{topic.id}/assessment", headers=headers)
    assert get_response.status_code == 403

    submit_response = client.post(
        f"/api/topics/{topic.id}/assessment/submit",
        json={"started_at": "2026-01-01T09:00:00Z", "answers": []},
        headers=headers,
    )
    assert submit_response.status_code == 403


def test_topic_with_no_active_questions_is_404_on_get_and_submit(
    client, make_course, make_batch, make_topic, make_student, enroll, login_as
):
    course = make_course()
    batch = make_batch(course=course)
    topic = make_topic(course=course)  # no questions created at all
    student = make_student(email="no-questions@example.com")
    enroll(student, batch)
    headers = login_as("no-questions@example.com")

    get_response = client.get(f"/api/topics/{topic.id}/assessment", headers=headers)
    assert get_response.status_code == 404

    submit_response = client.post(
        f"/api/topics/{topic.id}/assessment/submit",
        json={"started_at": "2026-01-01T09:00:00Z", "answers": []},
        headers=headers,
    )
    assert submit_response.status_code == 404
