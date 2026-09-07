"""The partner API and the storefront boundary it exists to enforce.

Two storefronts read one database. The rule that makes that safe is narrow
and easy to break by accident: a batch belonging to one storefront must never
be served by the other's site. It is enforced in two separate places - a
`where` clause on the public list, and a scoped query in app/partner - so a
change to either one can quietly reopen it while the other still looks right.
That rule is what most of this file is about.

The rest covers the shared-key authentication, which is the only thing
standing between the partner surface and the open internet.
"""

from types import SimpleNamespace

import pytest

from app.core.enums import Origin, UserRole
from app.partner import dependencies as partner_dependencies

KEY = "partner-key-for-tests"


@pytest.fixture()
def partner_key(monkeypatch):
    """Point the partner dependency at a known key, or at no key at all.

    `get_settings` is `@lru_cache`'d and reads backend/.env, so on a machine
    that has a real PARTNER_API_KEY on disk these tests would be deciding
    their own outcome from whatever happens to be there. Patching the name
    the dependency actually calls keeps them hermetic.
    """

    def _set(key: str = KEY) -> None:
        settings = SimpleNamespace(partner_api_key=key)
        monkeypatch.setattr(partner_dependencies, "get_settings", lambda: settings)

    return _set


@pytest.fixture()
def headers() -> dict[str, str]:
    return {"X-Partner-Key": KEY}


# --- The shared key ---------------------------------------------------


def test_partner_route_rejects_a_request_with_no_key(client, partner_key):
    partner_key()
    assert client.get("/api/partner/batches").status_code == 401


def test_partner_route_rejects_a_wrong_key(client, partner_key):
    partner_key()
    response = client.get("/api/partner/batches", headers={"X-Partner-Key": "not-the-key"})
    assert response.status_code == 401


def test_partner_route_accepts_the_configured_key(client, partner_key, headers):
    partner_key()
    assert client.get("/api/partner/batches", headers=headers).status_code == 200


def test_partner_surface_is_closed_when_no_key_is_configured(client, partner_key, headers):
    """An unconfigured deployment must refuse outright rather than fall open.

    Without this, a blank setting would be compared against a blank header and
    anyone who guessed the URL would be let in.
    """
    partner_key("")
    for path in ("/api/partner/batches", "/api/partner/courses", "/api/partner/content/faqs"):
        assert client.get(path, headers=headers).status_code == 503, path
    assert client.get("/api/partner/batches").status_code == 503


# --- The storefront boundary ------------------------------------------


def test_public_list_hides_another_storefronts_batch(client, make_course, make_batch):
    course = make_course()
    make_batch(course=course, batch_number="VPRO-1", origin=Origin.VPRO)
    make_batch(course=course, batch_number="DS-1", origin=Origin.DIGI_SETU)

    body = client.get("/api/batches/").json()

    assert [row["batch_number"] for row in body] == ["VPRO-1"]


def test_public_detail_of_another_storefronts_batch_is_a_404(client, make_course, make_batch):
    """404 rather than 403: a visitor should not learn the batch exists."""
    course = make_course()
    partner_batch = make_batch(course=course, origin=Origin.DIGI_SETU)

    assert client.get(f"/api/batches/{partner_batch.id}").status_code == 404


def test_admin_sees_both_storefronts(client, make_course, make_batch, make_admin, login_as):
    """The same trainer teaches both, so the admin panel is the one view that
    is not scoped - and the one place the two need telling apart, which is
    what `origin` on the response is for."""
    course = make_course()
    make_batch(course=course, batch_number="VPRO-1", origin=Origin.VPRO)
    make_batch(course=course, batch_number="DS-1", origin=Origin.DIGI_SETU)
    admin = make_admin()

    body = client.get("/api/batches/", headers=login_as(admin.email)).json()

    assert {row["batch_number"]: row["origin"] for row in body} == {
        "VPRO-1": "VPRO",
        "DS-1": "DIGI_SETU",
    }


def test_partner_list_hides_vpros_own_batches(
    client, partner_key, headers, make_course, make_batch
):
    partner_key()
    course = make_course()
    make_batch(course=course, batch_number="VPRO-1", origin=Origin.VPRO)
    make_batch(course=course, batch_number="DS-1", origin=Origin.DIGI_SETU)

    body = client.get("/api/partner/batches", headers=headers).json()

    assert [row["batch_number"] for row in body] == ["DS-1"]


def test_partner_list_skips_a_deactivated_batch(
    client, partner_key, headers, make_course, make_batch
):
    from app.core.enums import EntityStatus

    partner_key()
    course = make_course()
    make_batch(
        course=course,
        batch_number="DS-OFF",
        origin=Origin.DIGI_SETU,
        status=EntityStatus.INACTIVE,
    )

    assert client.get("/api/partner/batches", headers=headers).json() == []


# --- Creating a partner batch -----------------------------------------


def test_admin_can_create_a_batch_for_the_partner(
    client, partner_key, headers, make_course, make_admin, login_as
):
    """End to end, because this is the path that did not exist.

    `origin` was missing from BatchCreate, and the router builds the row
    straight from that payload, so every batch the admin panel created took
    the model default of VPRO and the partner API could only ever return an
    empty list. This asserts the batch lands on the partner's site and stays
    off VPro's.
    """
    partner_key()
    course = make_course()
    admin = make_admin()

    created = client.post(
        "/api/admin/batches/",
        headers=login_as(admin.email),
        json={
            "course_id": course.id,
            "batch_number": "DS-NEW",
            "start_date": "2026-03-01",
            "end_date": "2026-06-01",
            "start_time": "09:00:00",
            "end_time": "11:00:00",
            "trainer_name": "Trainer",
            "trainer_email": "trainer@example.com",
            "origin": "DIGI_SETU",
        },
    )
    assert created.status_code == 201, created.text
    assert created.json()["origin"] == "DIGI_SETU"

    partner_view = client.get("/api/partner/batches", headers=headers).json()
    assert [row["batch_number"] for row in partner_view] == ["DS-NEW"]
    assert client.get("/api/batches/").json() == []


def test_a_batch_created_without_an_origin_belongs_to_vpro(
    client, make_course, make_admin, login_as
):
    """The field is optional so that a caller predating storefronts keeps
    working, which only stays safe while the default is VPro's own."""
    course = make_course()
    admin = make_admin()

    created = client.post(
        "/api/admin/batches/",
        headers=login_as(admin.email),
        json={
            "course_id": course.id,
            "batch_number": "NO-ORIGIN",
            "start_date": "2026-03-01",
            "end_date": "2026-06-01",
            "start_time": "09:00:00",
            "end_time": "11:00:00",
            "trainer_name": "Trainer",
            "trainer_email": "trainer@example.com",
        },
    )

    assert created.status_code == 201, created.text
    assert created.json()["origin"] == "VPRO"


def test_admin_can_move_a_batch_between_storefronts(
    client, make_course, make_batch, make_admin, login_as
):
    """A batch created against the wrong storefront is otherwise stuck on a
    site it does not belong to, in front of the wrong customers."""
    course = make_course()
    batch = make_batch(course=course, origin=Origin.DIGI_SETU)
    admin = make_admin()

    response = client.put(
        f"/api/admin/batches/{batch.id}",
        headers=login_as(admin.email),
        json={"origin": "VPRO"},
    )

    assert response.status_code == 200, response.text
    assert response.json()["origin"] == "VPRO"
    assert [row["id"] for row in client.get("/api/batches/").json()] == [batch.id]


def test_a_student_can_be_enrolled_against_the_partner(
    client, make_admin, login_as
):
    course_free_payload = {
        "full_name": "Partner Student",
        "email": "partner.student@example.com",
        "password": "TestPass123!",
        "role": UserRole.STUDENT.value,
        "origin": "DIGI_SETU",
    }
    admin = make_admin()

    response = client.post(
        "/api/users/", headers=login_as(admin.email), json=course_free_payload
    )

    assert response.status_code == 201, response.text
    assert response.json()["origin"] == "DIGI_SETU"


# --- The rest of the partner surface ----------------------------------


def test_partner_courses_exclude_an_inactive_course(
    client, partner_key, headers, make_course
):
    from app.core.enums import EntityStatus

    partner_key()
    make_course(name="Live course")
    make_course(name="Retired course", status=EntityStatus.INACTIVE)

    body = client.get("/api/partner/courses", headers=headers).json()

    assert [row["name"] for row in body] == ["Live course"]


def test_partner_course_detail_hides_an_inactive_course(
    client, partner_key, headers, make_course
):
    from app.core.enums import EntityStatus

    partner_key()
    retired = make_course(status=EntityStatus.INACTIVE)

    assert client.get(f"/api/partner/courses/{retired.id}", headers=headers).status_code == 404


def test_partner_content_rejects_an_unknown_collection(client, partner_key, headers):
    partner_key()
    assert client.get("/api/partner/content/nonsense", headers=headers).status_code == 404


def test_partner_lead_lands_in_the_same_inbox(client, partner_key, headers, db_session):
    """One leads table for both storefronts, so the trainer has one inbox;
    `chapter` is what tells them apart in the admin list."""
    from app.leads.models import Lead

    partner_key()

    response = client.post(
        "/api/partner/leads",
        headers=headers,
        json={"cta": "reserve_seat", "chapter": "digi_setu_hero", "course": "Agentic AI"},
    )

    assert response.status_code == 202, response.text
    leads = db_session.query(Lead).all()
    assert [(lead.cta, lead.chapter) for lead in leads] == [("reserve_seat", "digi_setu_hero")]


# --- Provisioning a student ------------------------------------------
#
# This is the only partner route that WRITES, and the only one that creates a
# login. Two things it must never do: reach a batch that is not the calling
# partner's, and enrol the same person twice when a payment webhook retries.


def test_provisioning_creates_a_student_scoped_to_the_partner(
    client, partner_key, headers, make_course, make_batch
):
    partner_key()
    course = make_course()
    batch = make_batch(course=course, origin=Origin.DIGI_SETU)

    response = client.post(
        "/api/partner/students",
        headers=headers,
        json={
            "full_name": "Paid Student",
            "email": "Paid.Student@Example.com",
            "batch_id": batch.id,
            "external_ref": "order-1",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["created"] is True
    assert body["batch_id"] == batch.id
    # Normalised, so a second purchase from "Paid.Student@..." is the same person.
    assert body["email"] == "paid.student@example.com"
    # A student who never chose a password gets a link, not a password.
    assert body["set_password_url"] and "token=" in body["set_password_url"]


def test_provisioning_refuses_a_batch_belonging_to_vpro(
    client, partner_key, headers, make_course, make_batch
):
    """The boundary. A partner key must not put a student into VPro's cohort.

    404 rather than 403 on purpose: a partner should not be able to tell the
    difference between "not yours" and "does not exist", or batch ids become
    enumerable.
    """
    partner_key()
    batch = make_batch(course=make_course(), origin=Origin.VPRO)

    response = client.post(
        "/api/partner/students",
        headers=headers,
        json={
            "full_name": "Intruder",
            "email": "intruder@example.com",
            "batch_id": batch.id,
            "external_ref": "order-2",
        },
    )
    assert response.status_code == 404


def test_provisioning_refuses_a_batch_that_does_not_exist(client, partner_key, headers):
    partner_key()
    response = client.post(
        "/api/partner/students",
        headers=headers,
        json={
            "full_name": "Nobody",
            "email": "nobody@example.com",
            "batch_id": 999_999,
            "external_ref": "order-3",
        },
    )
    assert response.status_code == 404


def test_provisioning_needs_a_key(client, partner_key, make_course, make_batch):
    partner_key()
    batch = make_batch(course=make_course(), origin=Origin.DIGI_SETU)
    response = client.post(
        "/api/partner/students",
        json={
            "full_name": "No Key",
            "email": "nokey@example.com",
            "batch_id": batch.id,
            "external_ref": "order-4",
        },
    )
    assert response.status_code == 401


def test_provisioning_is_idempotent_for_a_webhook_retry(
    client, partner_key, headers, make_course, make_batch, db_session
):
    """A payment webhook retries. That must not create a second account, a
    second enrolment, or a second set-password token."""
    from app.users.models import StudentBatch, User

    partner_key()
    batch = make_batch(course=make_course(), origin=Origin.DIGI_SETU)
    payload = {
        "full_name": "Retry Student",
        "email": "retry@example.com",
        "batch_id": batch.id,
        "external_ref": "order-5",
    }

    first = client.post("/api/partner/students", headers=headers, json=payload)
    second = client.post("/api/partner/students", headers=headers, json=payload)

    assert first.json()["created"] is True
    assert second.json()["created"] is False
    # No second link: the first one is still the live one.
    assert second.json()["set_password_url"] is None
    assert first.json()["user_id"] == second.json()["user_id"]

    user_id = first.json()["user_id"]
    assert db_session.query(User).filter(User.email == "retry@example.com").count() == 1
    assert (
        db_session.query(StudentBatch)
        .filter(StudentBatch.student_id == user_id, StudentBatch.batch_id == batch.id)
        .count()
        == 1
    )


def test_provisioning_refuses_an_email_already_used_by_a_vpro_student(
    client, partner_key, headers, make_course, make_batch, make_user
):
    """The same person may already be a VPro student. Silently moving their
    account between storefronts would be worse than refusing."""
    partner_key()
    make_user(
        full_name="Shared Person",
        email="shared@example.com",
        role=UserRole.STUDENT,
        origin=Origin.VPRO,
    )
    batch = make_batch(course=make_course(), origin=Origin.DIGI_SETU)

    response = client.post(
        "/api/partner/students",
        headers=headers,
        json={
            "full_name": "Shared",
            "email": "shared@example.com",
            "batch_id": batch.id,
            "external_ref": "order-6",
        },
    )
    assert response.status_code == 409


# --- Redeeming a set-password token ----------------------------------
#
# This route is PUBLIC by design: the student has no partner key and no session
# yet, and the token is the credential. That makes it the one place a partner
# student's account can be taken over, so the tests below are about what must
# NOT work as much as what must.


def _provision(client, headers, batch_id: int, email: str, ref: str = "order-t") -> str:
    """Provision a student and return the raw token from their link."""
    response = client.post(
        "/api/partner/students",
        headers=headers,
        json={
            "full_name": "Token Student",
            "email": email,
            "batch_id": batch_id,
            "external_ref": ref,
        },
    )
    assert response.status_code == 201
    return response.json()["set_password_url"].split("token=")[1]


def test_a_provisioned_student_cannot_log_in_until_they_set_a_password(
    client, partner_key, headers, make_course, make_batch
):
    """The account is created with a hash of a random secret nobody holds, so
    there is no password that works until the token is redeemed."""
    partner_key()
    batch = make_batch(course=make_course(), origin=Origin.DIGI_SETU)
    _provision(client, headers, batch.id, "nologin@example.com")

    response = client.post(
        "/api/auth/login",
        json={"email": "nologin@example.com", "password": "anything-at-all"},
    )
    assert response.status_code == 401


def test_redeeming_a_token_sets_the_password_and_allows_login(
    client, partner_key, headers, make_course, make_batch
):
    partner_key()
    batch = make_batch(course=make_course(), origin=Origin.DIGI_SETU)
    token = _provision(client, headers, batch.id, "redeem@example.com")

    assert (
        client.post("/api/set-password", json={"token": token, "password": "ChosenPass1"}).status_code
        == 204
    )
    login = client.post(
        "/api/auth/login", json={"email": "redeem@example.com", "password": "ChosenPass1"}
    )
    assert login.status_code == 200
    assert login.json()["access_token"]


def test_a_token_works_only_once(client, partner_key, headers, make_course, make_batch):
    """A welcome email can be forwarded, or sit in a shared inbox. Once the
    student has used the link it must stop working for anyone else."""
    partner_key()
    batch = make_batch(course=make_course(), origin=Origin.DIGI_SETU)
    token = _provision(client, headers, batch.id, "once@example.com")

    assert client.post("/api/set-password", json={"token": token, "password": "FirstPass1"}).status_code == 204
    assert client.post("/api/set-password", json={"token": token, "password": "SecondPass1"}).status_code == 400
    # The first password still works, so the second attempt changed nothing.
    assert (
        client.post("/api/auth/login", json={"email": "once@example.com", "password": "FirstPass1"}).status_code
        == 200
    )


def test_a_wrong_token_is_refused(client, partner_key, headers, make_course, make_batch):
    partner_key()
    make_batch(course=make_course(), origin=Origin.DIGI_SETU)
    response = client.post(
        "/api/set-password", json={"token": "not-a-real-token-value", "password": "Whatever1"}
    )
    assert response.status_code == 400
    # One generic message, so a caller cannot tell a wrong token from an
    # expired or already-used one and probe for live ones.
    assert "no longer valid" in response.json()["detail"]


def test_an_expired_token_is_refused(
    client, partner_key, headers, make_course, make_batch, db_session
):
    from datetime import datetime, timedelta, timezone

    from app.partner.models import PasswordSetupToken

    partner_key()
    batch = make_batch(course=make_course(), origin=Origin.DIGI_SETU)
    token = _provision(client, headers, batch.id, "expired@example.com")

    row = db_session.query(PasswordSetupToken).one()
    row.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db_session.commit()

    assert client.post("/api/set-password", json={"token": token, "password": "TooLate1"}).status_code == 400


def test_the_raw_token_is_never_stored(
    client, partner_key, headers, make_course, make_batch, db_session
):
    """Only a hash is kept, so a leaked table yields no working links - the
    same reason users.password_hash exists."""
    from app.partner.models import PasswordSetupToken

    partner_key()
    batch = make_batch(course=make_course(), origin=Origin.DIGI_SETU)
    token = _provision(client, headers, batch.id, "hashed@example.com")

    stored = db_session.query(PasswordSetupToken).one().token_hash
    assert token not in stored
    assert stored.startswith("$2")  # bcrypt


def test_a_short_password_is_refused(client, partner_key, headers, make_course, make_batch):
    """Same 8-character floor the admin creation path enforces, so there is one
    rule rather than one per entry point."""
    partner_key()
    batch = make_batch(course=make_course(), origin=Origin.DIGI_SETU)
    token = _provision(client, headers, batch.id, "short@example.com")

    assert client.post("/api/set-password", json={"token": token, "password": "short"}).status_code == 422
