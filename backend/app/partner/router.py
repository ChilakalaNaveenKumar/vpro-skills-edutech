"""The partner API: one storefront reading its own slice of this database.

Digi-Setu is a separate deployment with no access to this database and no
shared session. It reads what it needs over HTTPS, authenticated by a shared
key, and every route here is scoped to a single Origin - a partner can never
read another storefront's batches or students.

This exists so there is exactly one copy of the schedule. The alternative was
a second database on Digi-Setu's side plus a sync job, which drifts silently
the first time a class is rescheduled.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.batches.models import Batch
from app.batches.schemas import BatchPublic
from app.content import models as content_models
from app.content import schemas as content_schemas
from app.content.router import COLLECTIONS
from app.core.enums import EntityStatus, Origin
from app.courses.models import Course
from app.courses.schemas import CoursePublic
from app.database.session import get_db
from app.leads.models import Lead
from app.leads.schemas import LeadCapture
from app.partner.dependencies import require_partner_key
from app.partner.schemas import PartnerStudentCreate, PartnerStudentResponse, SetPasswordRequest
from app.partner.service import provision_student, redeem_password_token

router = APIRouter(prefix="/api/partner", tags=["Partner"])

# Redeeming a set-password token is done BY THE STUDENT, who has no partner key
# and no session yet. The token is the credential, so this router is
# deliberately unauthenticated and deliberately separate - nothing else here
# should ever be reachable without a key.
public_router = APIRouter(prefix="/api/set-password", tags=["Partner"])


@router.get("/batches", response_model=list[BatchPublic])
def list_partner_batches(
    origin: Origin = Depends(require_partner_key),
    db: Session = Depends(get_db),
) -> list[BatchPublic]:
    """Active batches for one storefront, in start-date order.

    Same shape as the public /api/batches so the caller has one type to model,
    but scoped to the calling partner's own storefront. The origin comes from
    the key, so no query parameter can widen it.
    """
    stmt = (
        select(Batch)
        .options(selectinload(Batch.course))
        .where(Batch.status == EntityStatus.ACTIVE, Batch.origin == origin)
        .order_by(Batch.start_date)
    )
    return [BatchPublic.from_model(batch) for batch in db.scalars(stmt).all()]


@router.get("/courses", response_model=list[CoursePublic])
def list_partner_courses(_origin: Origin = Depends(require_partner_key),
    db: Session = Depends(get_db)) -> list[CoursePublic]:
    """The course catalogue.

    Not scoped by origin: courses are the curriculum, and both storefronts sell
    the same one. Only the batches - the dates, hours and prices - differ.
    """
    # Eager-loaded for the same reason the public route does it: without this
    # the curriculum turns one query into 1 + 2N as every course lazy-loads its
    # topics and projects.
    stmt = (
        select(Course)
        .options(selectinload(Course.topics), selectinload(Course.projects))
        .where(Course.status == EntityStatus.ACTIVE)
        .order_by(Course.display_order, Course.name)
    )
    return [CoursePublic.from_model(course) for course in db.scalars(stmt).all()]


@router.get("/courses/{course_id}", response_model=CoursePublic)
def get_partner_course(course_id: int, _origin: Origin = Depends(require_partner_key),
    db: Session = Depends(get_db)) -> CoursePublic:
    """One course with its full curriculum - what a course detail page needs."""
    course = db.scalar(
        select(Course)
        .options(selectinload(Course.topics), selectinload(Course.projects))
        .where(Course.id == course_id)
    )
    if course is None or course.status != EntityStatus.ACTIVE:
        # Same 404 either way: never reveal that an inactive course exists.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return CoursePublic.from_model(course)


@router.get("/content/{collection}")
def list_partner_content(collection: str, _origin: Origin = Depends(require_partner_key),
    db: Session = Depends(get_db)) -> list[Any]:
    """Editable site copy - testimonials, faqs, tenets, batch-loop.

    Reuses the public module's COLLECTIONS registry rather than a second copy,
    so a collection added there is reachable here without touching this file.
    """
    if collection not in COLLECTIONS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown collection")
    model, public, _write, _patch = COLLECTIONS[collection]
    stmt = (
        select(model)
        .where(model.status == EntityStatus.ACTIVE)
        .order_by(model.display_order, model.id)
    )
    return [public.model_validate(row) for row in db.scalars(stmt).all()]


@router.get("/content/site/{key}", response_model=content_schemas.SiteContentPublic)
def get_partner_site_content(key: str, _origin: Origin = Depends(require_partner_key),
    db: Session = Depends(get_db)) -> content_models.SiteContent:
    """One keyed block of site copy - the hero, the trainer panel, and so on."""
    row = db.scalar(
        select(content_models.SiteContent).where(content_models.SiteContent.key == key)
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown key")
    return row


@router.post("/leads", status_code=status.HTTP_202_ACCEPTED)
def capture_partner_lead(payload: LeadCapture, _origin: Origin = Depends(require_partner_key),
    db: Session = Depends(get_db)) -> dict:
    """An enquiry raised on the partner's storefront.

    Written to the same leads table VPro's own site uses, so the trainer sees
    one inbox. `chapter` carries the storefront, which is how the two are told
    apart in the admin list.
    """
    db.add(Lead(**payload.model_dump()))
    db.commit()
    return {"status": "accepted"}


@router.post(
    "/students",
    response_model=PartnerStudentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_partner_student(
    payload: PartnerStudentCreate,
    origin: Origin = Depends(require_partner_key),
    db: Session = Depends(get_db),
) -> PartnerStudentResponse:
    """Create a student for the calling partner and enrol them in one batch.

    The narrowest thing that makes a paid seat usable. It cannot touch VPro's
    own students, cannot read anybody, and cannot reach a batch that is not the
    partner's - so a leaked partner key exposes far less than the admin token
    this replaces.
    """
    return provision_student(
        db,
        origin=origin,
        full_name=payload.full_name,
        email=payload.email,
        batch_id=payload.batch_id,
        external_ref=payload.external_ref,
    )


@public_router.post("", status_code=status.HTTP_204_NO_CONTENT)
@public_router.post("/", status_code=status.HTTP_204_NO_CONTENT, include_in_schema=False)
def set_password(payload: SetPasswordRequest, db: Session = Depends(get_db)) -> None:
    """Redeem a one-time token and set the student's own password.

    Returns 204 on success and a single generic error otherwise: distinguishing
    "no such token" from "expired" from "already used" would let someone probe
    for valid ones.
    """
    redeem_password_token(db, token=payload.token, new_password=payload.password)
