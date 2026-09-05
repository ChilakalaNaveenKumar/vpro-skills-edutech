"""Capture for outbound CTA clicks.

POST is deliberately open and always answers 202: it is fired with
navigator.sendBeacon as the visitor leaves for WhatsApp, so it must never
block, never redirect and never fail loudly. Reading them back is admin-only.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.auth.dependencies import require_admin
from app.database.session import get_db
from app.leads.models import Lead
from app.leads.schemas import LeadCapture, LeadPublic

router = APIRouter(prefix="/api/leads", tags=["Leads"])
admin_router = APIRouter(
    prefix="/api/admin/leads", dependencies=[Depends(require_admin)], tags=["Leads"]
)


@router.post("", status_code=status.HTTP_202_ACCEPTED)
@router.post("/", status_code=status.HTTP_202_ACCEPTED, include_in_schema=False)
def capture(payload: LeadCapture, db: Session = Depends(get_db)) -> dict:
    # Both paths are registered because sendBeacon posts to the exact URL the
    # client built; a 307 to add a slash would drop the body on a beacon.
    db.add(Lead(**payload.model_dump()))
    db.commit()
    return {"status": "accepted"}


@admin_router.get("/", response_model=list[LeadPublic])
def list_leads(limit: int = 200, db: Session = Depends(get_db)) -> list[Lead]:
    stmt = select(Lead).order_by(desc(Lead.created_at)).limit(min(limit, 1000))
    return list(db.scalars(stmt).all())
