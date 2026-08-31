"""Authorization tests (Phase 11): role gating, enrollment gating, and
ownership gating across modules.

Covers app/auth/dependencies.py's require_admin, the enrollment checks in
app/topics/router.py and app/assessments/router.py (via
app/users/enrollment.py), and the ownership check in
app/results/router.py's get_result_detail.
"""


# --- Role gating: admin-only endpoints, one representative per module ---


def test_create_course_requires_admin(client, make_admin, make_student, login_as):
    payload = {"name": "New Course"}

    unauthenticated = client.post("/api/admin/courses/", json=payload)
    assert unauthenticated.status_code == 401

    make_student(email="student-role@example.com")
    student_headers = login_as("student-role@example.com")
    as_student = client.post("/api/admin/courses/", json=payload, headers=student_headers)
    assert as_student.status_code == 403

    make_admin(email="admin-role@example.com")
    admin_headers = login_as("admin-role@example.com")
    as_admin = client.post("/api/admin/courses/", json=payload, headers=admin_headers)
    assert as_admin.status_code == 201


def test_create_batch_requires_admin(client, make_admin, make_student, make_course, login_as):
    course = make_course()
    payload = {
        "course_id": course.id,
        "batch_number": "B1",
        "start_date": "2026-01-01",
        "end_date": "2026-06-01",
        "start_time": "09:00:00",
        "end_time": "11:00:00",
        "trainer_name": "Trainer",
    }

    make_student(email="student-batch@example.com")
    as_student = client.post(
        "/api/admin/batches/", json=payload, headers=login_as("student-batch@example.com")
    )
    assert as_student.status_code == 403

    make_admin(email="admin-batch@example.com")
    as_admin = client.post(
        "/api/admin/batches/", json=payload, headers=login_as("admin-batch@example.com")
    )
    assert as_admin.status_code == 201


def test_create_topic_requires_admin(client, make_admin, make_student, make_course, login_as):
    course = make_course()
    payload = {"course_id": course.id, "name": "New Topic", "topic_order": 1}

    make_student(email="student-topic@example.com")
    as_student = client.post(
        "/api/admin/topics/", json=payload, headers=login_as("student-topic@example.com")
    )
    assert as_student.status_code == 403

    make_admin(email="admin-topic@example.com")
    as_admin = client.post(
        "/api/admin/topics/", json=payload, headers=login_as("admin-topic@example.com")
    )
    assert as_admin.status_code == 201


def test_list_users_requires_admin(client, make_admin, make_student, login_as):
    unauthenticated = client.get("/api/users/")
    assert unauthenticated.status_code == 401

    make_student(email="student-users@example.com")
    as_student = client.get("/api/users/", headers=login_as("student-users@example.com"))
    assert as_student.status_code == 403

    make_admin(email="admin-users@example.com")
    as_admin = client.get("/api/users/", headers=login_as("admin-users@example.com"))
    assert as_admin.status_code == 200


# --- Enrollment gating on GET /api/courses/{id}/topics ---


def test_topics_listing_requires_enrollment_for_students(
    client, make_admin, make_student, make_course, make_batch, make_topic, enroll, login_as
):
    course = make_course()
    batch = make_batch(course=course)
    make_topic(course=course, name="Active Topic", status="ACTIVE")
    make_topic(course=course, name="Inactive Topic", status="INACTIVE")

    outsider = make_student(email="outsider@example.com")
    enrolled_student = make_student(email="enrolled@example.com")
    enroll(enrolled_student, batch)
    make_admin(email="topics-admin@example.com")

    not_enrolled = client.get(
        f"/api/courses/{course.id}/topics", headers=login_as("outsider@example.com")
    )
    assert not_enrolled.status_code == 403

    as_enrolled = client.get(
        f"/api/courses/{course.id}/topics", headers=login_as("enrolled@example.com")
    )
    assert as_enrolled.status_code == 200
    enrolled_names = {t["name"] for t in as_enrolled.json()}
    # An enrolled student only sees ACTIVE topics.
    assert enrolled_names == {"Active Topic"}

    as_admin = client.get(
        f"/api/courses/{course.id}/topics", headers=login_as("topics-admin@example.com")
    )
    assert as_admin.status_code == 200
    admin_names = {t["name"] for t in as_admin.json()}
    # Admin sees everything regardless of status.
    assert admin_names == {"Active Topic", "Inactive Topic"}


def test_topics_listing_404s_for_unknown_course(client, make_student, login_as):
    make_student(email="unknown-course@example.com")
    response = client.get(
        "/api/courses/999999/topics", headers=login_as("unknown-course@example.com")
    )
    assert response.status_code == 404


# --- Ownership gating on GET /api/results/{attempt_id} ---


def test_result_detail_requires_ownership_or_admin(
    client, make_admin, make_student, make_course, make_batch, make_topic, make_question, enroll, login_as
):
    course = make_course()
    batch = make_batch(course=course)
    topic = make_topic(course=course)
    make_question(topic=topic, correct_label="A")

    owner = make_student(email="owner@example.com")
    other_student = make_student(email="other-student@example.com")
    enroll(owner, batch)
    make_admin(email="results-admin@example.com")

    owner_headers = login_as("owner@example.com")
    submit = client.post(
        f"/api/topics/{topic.id}/assessment/submit",
        json={"started_at": "2026-01-01T09:00:00Z", "answers": []},
        headers=owner_headers,
    )
    assert submit.status_code == 200
    attempt_id = submit.json()["attempt_id"]

    as_owner = client.get(f"/api/results/{attempt_id}", headers=owner_headers)
    assert as_owner.status_code == 200

    as_other_student = client.get(
        f"/api/results/{attempt_id}", headers=login_as("other-student@example.com")
    )
    assert as_other_student.status_code == 403
    assert as_other_student.json()["detail"] == "Not your result"

    as_admin = client.get(
        f"/api/results/{attempt_id}", headers=login_as("results-admin@example.com")
    )
    assert as_admin.status_code == 200


def test_result_detail_404s_for_unknown_attempt(client, make_student, login_as):
    make_student(email="unknown-attempt@example.com")
    response = client.get(
        "/api/results/999999", headers=login_as("unknown-attempt@example.com")
    )
    assert response.status_code == 404
