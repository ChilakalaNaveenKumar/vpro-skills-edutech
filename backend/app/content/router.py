"""Public reads and admin writes for the site's own copy.

Every list is returned in display order, and non-admins only ever see ACTIVE
rows - the same visibility rule the courses module uses.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import require_admin
from app.content import models as m
from app.content import schemas as s
from app.core.enums import EntityStatus
from app.database.session import get_db

router = APIRouter(prefix="/api/content", tags=["Content"])
admin_router = APIRouter(
    prefix="/api/admin/content", dependencies=[Depends(require_admin)], tags=["Content"]
)

# One row of config per collection keeps the eight endpoints below from being
# eight near-identical copies of each other.
COLLECTIONS: dict[str, tuple[type, type, type, type]] = {
    "testimonials": (m.Testimonial, s.TestimonialPublic, s.TestimonialWrite, s.TestimonialPatch),
    "faqs": (m.Faq, s.FaqPublic, s.FaqWrite, s.FaqPatch),
    "tenets": (m.Tenet, s.TenetPublic, s.BlockWrite, s.BlockPatch),
    "batch-loop": (m.BatchLoopStep, s.BatchLoopStepPublic, s.BlockWrite, s.BlockPatch),
}


def _collection(name: str) -> tuple[type, type, type, type]:
    if name not in COLLECTIONS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown collection")
    return COLLECTIONS[name]


@router.get("/{collection}")
def list_items(collection: str, db: Session = Depends(get_db)) -> list[Any]:
    model, public, _write, _patch = _collection(collection)
    stmt = (
        select(model)
        .where(model.status == EntityStatus.ACTIVE)
        .order_by(model.display_order, model.id)
    )
    return [public.model_validate(row) for row in db.scalars(stmt).all()]


@router.get("/site/{key}", response_model=s.SiteContentPublic)
def get_site_content(key: str, db: Session = Depends(get_db)) -> m.SiteContent:
    row = db.scalar(select(m.SiteContent).where(m.SiteContent.key == key))
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown key")
    return row


# Declared before the generic "/{collection}/{item_id}" routes below.
# FastAPI matches in declaration order and both are two segments, so with
# these the other way round "site/hero" was read as collection="site",
# item_id="hero" and rejected as a non-integer id.

@admin_router.put("/site/{key}", response_model=s.SiteContentPublic)
def admin_set_site_content(
    key: str, payload: s.SiteContentWrite, db: Session = Depends(get_db)
) -> m.SiteContent:
    row = db.scalar(select(m.SiteContent).where(m.SiteContent.key == key))
    if row is None:
        row = m.SiteContent(key=key, value=payload.value)
        db.add(row)
    else:
        row.value = payload.value
    db.commit()
    db.refresh(row)
    return row

@admin_router.get("/{collection}")
def admin_list(collection: str, db: Session = Depends(get_db)) -> list[Any]:
    model, public, _write, _patch = _collection(collection)
    stmt = select(model).order_by(model.display_order, model.id)
    return [public.model_validate(row) for row in db.scalars(stmt).all()]


@admin_router.post("/{collection}", status_code=status.HTTP_201_CREATED)
def admin_create(collection: str, payload: dict, db: Session = Depends(get_db)) -> Any:
    model, public, write, _patch = _collection(collection)
    data = write.model_validate(payload)
    row = model(**data.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return public.model_validate(row)


@admin_router.put("/{collection}/{item_id}")
def admin_update(
    collection: str, item_id: int, payload: dict, db: Session = Depends(get_db)
) -> Any:
    model, public, _write, patch = _collection(collection)
    row = db.get(model, item_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    # Partial by design, same as BatchUpdate: a reorder sends display_order alone.
    for field, value in patch.model_validate(payload).model_dump(exclude_unset=True).items():
        setattr(row, field, value)
    db.commit()
    db.refresh(row)
    return public.model_validate(row)


@admin_router.delete("/{collection}/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete(collection: str, item_id: int, db: Session = Depends(get_db)) -> None:
    model, _public, _write, _patch = _collection(collection)
    row = db.get(model, item_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    db.delete(row)
    db.commit()

