"""Batch validation tests (2026-08-31): batch-name uniqueness (case- and
whitespace-insensitive, scoped per course), start/end date and time
ordering (on both create and partial update), and the new trainer_email
field (required on create, must be a valid email address).

Covers app/batches/router.py's _reject_duplicate_batch_number and the
post-merge date/time re-check in update_batch, plus
app/batches/schemas.py's BatchCreate/BatchUpdate validators.
"""


def _payload(course_id: int, **overrides) -> dict:
    payload = {
        "course_id": course_id,
        "batch_number": "Batch 1",
        "start_date": "2026-01-01",
        "end_date": "2026-06-01",
        "start_time": "09:00:00",
        "end_time": "11:00:00",
        "trainer_name": "Trainer",
        "trainer_email": "trainer@example.com",
    }
    payload.update(overrides)
    return payload


def test_create_batch_requires_trainer_email(client, make_admin, make_course, login_as):
    make_admin(email="admin-email-required@example.com")
    headers = login_as("admin-email-required@example.com")
    course = make_course()

    payload = _payload(course.id)
    del payload["trainer_email"]
    response = client.post("/api/admin/batches/", json=payload, headers=headers)
    assert response.status_code == 422


def test_create_batch_rejects_malformed_trainer_email(client, make_admin, make_course, login_as):
    make_admin(email="admin-email-format@example.com")
    headers = login_as("admin-email-format@example.com")
    course = make_course()

    payload = _payload(course.id, trainer_email="not-an-email")
    response = client.post("/api/admin/batches/", json=payload, headers=headers)
    assert response.status_code == 422


def test_create_batch_rejects_end_date_before_start_date(client, make_admin, make_course, login_as):
    make_admin(email="admin-date-order@example.com")
    headers = login_as("admin-date-order@example.com")
    course = make_course()

    payload = _payload(course.id, start_date="2026-06-01", end_date="2026-01-01")
    response = client.post("/api/admin/batches/", json=payload, headers=headers)
    assert response.status_code == 422


def test_create_batch_rejects_end_time_not_after_start_time(client, make_admin, make_course, login_as):
    make_admin(email="admin-time-order@example.com")
    headers = login_as("admin-time-order@example.com")
    course = make_course()

    # equal start/end time is rejected too, not just reversed
    payload = _payload(course.id, start_time="09:00:00", end_time="09:00:00")
    response = client.post("/api/admin/batches/", json=payload, headers=headers)
    assert response.status_code == 422


def test_create_batch_rejects_duplicate_name_case_and_whitespace_insensitive(
    client, make_admin, make_course, login_as
):
    make_admin(email="admin-dup-name@example.com")
    headers = login_as("admin-dup-name@example.com")
    course = make_course()

    first = client.post(
        "/api/admin/batches/", json=_payload(course.id, batch_number="Batch 1"), headers=headers
    )
    assert first.status_code == 201

    dup = client.post(
        "/api/admin/batches/",
        json=_payload(course.id, batch_number="  batch 1  "),
        headers=headers,
    )
    assert dup.status_code == 409
    assert "already has a batch" in dup.json()["detail"]


def test_create_batch_allows_same_name_in_a_different_course(client, make_admin, make_course, login_as):
    make_admin(email="admin-dup-diff-course@example.com")
    headers = login_as("admin-dup-diff-course@example.com")
    course_a = make_course()
    course_b = make_course()

    first = client.post(
        "/api/admin/batches/", json=_payload(course_a.id, batch_number="Batch 1"), headers=headers
    )
    assert first.status_code == 201

    second = client.post(
        "/api/admin/batches/", json=_payload(course_b.id, batch_number="Batch 1"), headers=headers
    )
    assert second.status_code == 201


def test_update_batch_rejects_merged_end_date_before_start_date(
    client, make_admin, make_course, make_batch, login_as
):
    make_admin(email="admin-update-date-order@example.com")
    headers = login_as("admin-update-date-order@example.com")
    course = make_course()
    batch = make_batch(course=course)  # start_date=2026-01-01, end_date=2026-06-01

    # Only end_date is sent - BatchUpdate's own validator can't see the
    # existing start_date, so this only fails if the router re-checks the
    # merged, final row.
    response = client.put(
        f"/api/admin/batches/{batch.id}", json={"end_date": "2025-12-01"}, headers=headers
    )
    assert response.status_code == 422


def test_update_batch_rejects_duplicate_name(client, make_admin, make_course, make_batch, login_as):
    make_admin(email="admin-update-dup@example.com")
    headers = login_as("admin-update-dup@example.com")
    course = make_course()
    make_batch(course=course, batch_number="Batch 1")
    other = make_batch(course=course, batch_number="Batch 2")

    response = client.put(
        f"/api/admin/batches/{other.id}", json={"batch_number": "batch 1"}, headers=headers
    )
    assert response.status_code == 409


def test_update_batch_can_set_trainer_email(client, make_admin, make_course, make_batch, login_as):
    make_admin(email="admin-update-email@example.com")
    headers = login_as("admin-update-email@example.com")
    course = make_course()
    batch = make_batch(course=course, trainer_email=None)

    response = client.put(
        f"/api/admin/batches/{batch.id}",
        json={"trainer_email": "new-trainer@example.com"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["trainer_email"] == "new-trainer@example.com"


def test_get_batch_returns_trainer_email(client, make_course, make_batch):
    course = make_course()
    batch = make_batch(course=course, trainer_email="visible@example.com")

    response = client.get(f"/api/batches/{batch.id}")
    assert response.status_code == 200
    assert response.json()["trainer_email"] == "visible@example.com"


def test_get_batch_trainer_email_can_be_null_for_legacy_rows(client, make_course, make_batch):
    course = make_course()
    batch = make_batch(course=course, trainer_email=None)

    response = client.get(f"/api/batches/{batch.id}")
    assert response.status_code == 200
    assert response.json()["trainer_email"] is None
