"""Cross-student isolation tests (Phase 11): one student must never be able
to see or affect another student's data, no matter which endpoint is used.

Covers app/results/router.py, app/users/router.py's me_router, and
app/assessments/router.py, all exercised from two independent students'
points of view at once.
"""


def _option_id(question_json, label):
    return next(o["id"] for o in question_json["options"] if o["option_label"] == label)


def test_results_list_never_includes_another_students_attempts(
    client, make_course, make_batch, make_topic, make_question, make_student, enroll, login_as
):
    course = make_course()
    batch = make_batch(course=course)
    topic = make_topic(course=course)
    make_question(topic=topic, correct_label="A")

    student_a = make_student(email="isolation-a@example.com")
    student_b = make_student(email="isolation-b@example.com")
    enroll(student_a, batch)
    enroll(student_b, batch)

    headers_a = login_as("isolation-a@example.com")
    headers_b = login_as("isolation-b@example.com")

    client.post(
        f"/api/topics/{topic.id}/assessment/submit",
        json={"started_at": "2026-01-01T09:00:00Z", "answers": []},
        headers=headers_a,
    )
    client.post(
        f"/api/topics/{topic.id}/assessment/submit",
        json={"started_at": "2026-01-01T09:00:00Z", "answers": []},
        headers=headers_b,
    )

    results_a = client.get("/api/results/", headers=headers_a).json()
    results_b = client.get("/api/results/", headers=headers_b).json()

    assert len(results_a) == 1
    assert len(results_b) == 1
    assert results_a[0]["attempt_id"] != results_b[0]["attempt_id"]


def test_student_cannot_fetch_another_students_result_detail(
    client, make_course, make_batch, make_topic, make_question, make_student, enroll, login_as
):
    course = make_course()
    batch = make_batch(course=course)
    topic = make_topic(course=course)
    make_question(topic=topic, correct_label="A")

    student_a = make_student(email="detail-a@example.com")
    student_b = make_student(email="detail-b@example.com")
    enroll(student_a, batch)
    enroll(student_b, batch)

    submit = client.post(
        f"/api/topics/{topic.id}/assessment/submit",
        json={"started_at": "2026-01-01T09:00:00Z", "answers": []},
        headers=login_as("detail-a@example.com"),
    )
    attempt_id = submit.json()["attempt_id"]

    response = client.get(f"/api/results/{attempt_id}", headers=login_as("detail-b@example.com"))
    assert response.status_code == 403


def test_my_batches_never_leaks_another_students_batches(
    client, make_course, make_batch, make_student, enroll, login_as
):
    course = make_course()
    batch_a = make_batch(course=course, batch_number="A1")
    batch_b = make_batch(course=course, batch_number="B1")

    student_a = make_student(email="batches-a@example.com")
    student_b = make_student(email="batches-b@example.com")
    enroll(student_a, batch_a)
    enroll(student_b, batch_b)

    my_batches_a = client.get("/api/users/me/batches", headers=login_as("batches-a@example.com")).json()
    my_batches_b = client.get("/api/users/me/batches", headers=login_as("batches-b@example.com")).json()

    assert [b["batch_number"] for b in my_batches_a] == ["A1"]
    assert [b["batch_number"] for b in my_batches_b] == ["B1"]


def test_student_cannot_access_a_topic_only_another_student_is_enrolled_for(
    client, make_course, make_batch, make_topic, make_question, make_student, enroll, login_as
):
    course = make_course()
    batch = make_batch(course=course)
    topic = make_topic(course=course)
    make_question(topic=topic)

    enrolled_student = make_student(email="topic-access-enrolled@example.com")
    outsider_student = make_student(email="topic-access-outsider@example.com")
    enroll(enrolled_student, batch)  # outsider_student is deliberately left unenrolled

    response = client.get(
        f"/api/topics/{topic.id}/assessment", headers=login_as("topic-access-outsider@example.com")
    )
    assert response.status_code == 403


def test_two_students_attempting_the_same_topic_score_independently(
    client, make_course, make_batch, make_topic, make_question, make_student, enroll, login_as
):
    course = make_course()
    batch = make_batch(course=course)
    topic = make_topic(course=course)
    make_question(topic=topic, correct_label="A")
    make_question(topic=topic, correct_label="B")

    student_a = make_student(email="independent-a@example.com")
    student_b = make_student(email="independent-b@example.com")
    enroll(student_a, batch)
    enroll(student_b, batch)

    headers_a = login_as("independent-a@example.com")
    headers_b = login_as("independent-b@example.com")

    fetched = client.get(f"/api/topics/{topic.id}/assessment", headers=headers_a).json()
    q1, q2 = fetched["questions"]

    # A answers both correctly; B answers both incorrectly. Each attempt
    # must reflect only that student's own choices.
    result_a = client.post(
        f"/api/topics/{topic.id}/assessment/submit",
        json={
            "started_at": "2026-01-01T09:00:00Z",
            "answers": [
                {"question_id": q1["id"], "selected_option_id": _option_id(q1, "A")},
                {"question_id": q2["id"], "selected_option_id": _option_id(q2, "B")},
            ],
        },
        headers=headers_a,
    ).json()
    result_b = client.post(
        f"/api/topics/{topic.id}/assessment/submit",
        json={
            "started_at": "2026-01-01T09:00:00Z",
            "answers": [
                {"question_id": q1["id"], "selected_option_id": _option_id(q1, "C")},
                {"question_id": q2["id"], "selected_option_id": _option_id(q2, "D")},
            ],
        },
        headers=headers_b,
    ).json()

    assert result_a["score"] == 2
    assert result_b["score"] == 0


def test_admin_results_student_filter_correctly_isolates_each_student(
    client, make_admin, make_course, make_batch, make_topic, make_question, make_student, enroll, login_as
):
    course = make_course()
    batch = make_batch(course=course)
    topic = make_topic(course=course)
    make_question(topic=topic, correct_label="A")

    student_a = make_student(email="filter-a@example.com")
    student_b = make_student(email="filter-b@example.com")
    enroll(student_a, batch)
    enroll(student_b, batch)
    make_admin(email="filter-admin@example.com")

    client.post(
        f"/api/topics/{topic.id}/assessment/submit",
        json={"started_at": "2026-01-01T09:00:00Z", "answers": []},
        headers=login_as("filter-a@example.com"),
    )
    client.post(
        f"/api/topics/{topic.id}/assessment/submit",
        json={"started_at": "2026-01-01T09:00:00Z", "answers": []},
        headers=login_as("filter-b@example.com"),
    )

    admin_headers = login_as("filter-admin@example.com")
    filtered_for_a = client.get(
        "/api/admin/results/", params={"student_id": student_a.id}, headers=admin_headers
    ).json()
    filtered_for_b = client.get(
        "/api/admin/results/", params={"student_id": student_b.id}, headers=admin_headers
    ).json()

    assert len(filtered_for_a) == 1
    assert filtered_for_a[0]["student_id"] == student_a.id
    assert len(filtered_for_b) == 1
    assert filtered_for_b[0]["student_id"] == student_b.id
