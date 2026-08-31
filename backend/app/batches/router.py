"""API router for the batches module.

Same public/admin-reuses-public-GET split as courses (see
app/courses/router.py's module docstring).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.auth.dependencies import get_current_user_optional, require_admin
from app.batches.models import Batch
from app.batches.schemas import BatchCreate, BatchPublic, BatchUpdate
from app.core.enums import EntityStatus, UserRole
from app.courses.models import Course
from app.database.session import get_db
from app.users.models import User

router = APIRouter(prefix="/api/batches", tags=["Batches"])
admin_router = APIRouter(
    prefix="/api/admin/batches", dependencies=[Depends(require_admin)], tags=["Batches"]
)


def _is_admin(user: User | None) -> bool:
    return user is not None and user.role == UserRole.ADMIN


@router.get("/", response_model=list[BatchPublic])
def list_batches(
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> list[BatchPublic]:
    stmt = select(Batch).options(selectinload(Batch.course))
    if not _is_admin(current_user):
        stmt = stmt.where(Batch.status == EntityStatus.ACTIVE)
    stmt = stmt.order_by(Batch.start_date)
    batches = db.scalars(stmt).all()
    return [BatchPublic.from_model(b) for b in batches]


@router.get("/{batch_id}", response_model=BatchPublic)
def get_batch(
    batch_id: int,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> BatchPublic:
    batch = db.scalar(select(Batch).options(selectinload(Batch.course)).where(Batch.id == batch_id))
    if batch is None or (not _is_admin(current_user) and batch.status != EntityStatus.ACTIVE):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")
    return BatchPublic.from_model(batch)


@admin_router.post("/", response_model=BatchPublic, status_code=status.HTTP_201_CREATED)
def create_batch(payload: BatchCreate, db: Session = Depends(get_db)) -> BatchPublic:
    if db.get(Course, payload.course_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    batch = Batch(**payload.model_dump())
    db.add(batch)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This course already has a batch with that batch number",
        )
    db.refresh(batch)
    return BatchPublic.from_model(batch)


@admin_router.put("/{batch_id}", response_model=BatchPublic)
def update_batch(batch_id: int, payload: BatchUpdate, db: Session = Depends(get_db)) -> BatchPublic:
    batch = db.get(Batch, batch_id)
    if batch is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(batch, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This course already has a batch with that batch number",
        )
    db.refresh(batch)
    return BatchPublic.from_model(batch)
