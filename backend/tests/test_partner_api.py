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
