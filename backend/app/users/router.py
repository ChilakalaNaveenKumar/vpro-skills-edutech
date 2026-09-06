"""API router for the User accounts (students/admins) module.

`router` is the admin-only account management surface (`/api/users`,
blanket-gated by `require_admin` - there is no public-facing version of
this router, unlike courses/batches, so there's no separate
`/api/admin/users` split). `me_router` is a separate, non-admin router:
any authenticated user can read their own data at `/api/users/me/...`,
which is a different trust boundary than `router`'s admin-only routes and
so cannot reuse the same APIRouter's blanket dependency.

Batch assignment (`/{user_id}/batches`) lives here rather than in
`batches` because `StudentBatch` is this module's own table (see
models.py's docstring) - the same "write only your own table" boundary
every other module follows.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.assessments.models import AssessmentAnswer, AssessmentAttempt
from app.auth.dependencies import get_current_user, require_admin
from app.batches.models import Batch
from app.batches.schemas import BatchPublic
from app.core.enums import UserRole
from app.core.security import hash_password
from app.database.session import get_db
from app.users.models import StudentBatch, User
from app.users.schemas import BatchAssignment, UserCreate, UserErasure, UserPublic, UserUpdate

router = APIRouter(prefix="/api/users", dependencies=[Depends(require_admin)], tags=["Users"])
me_router = APIRouter(
    prefix="/api/users/me", dependencies=[Depends(get_current_user)], tags=["Users"]
)


@router.get("/", response_model=list[UserPublic])
def list_users(
    role: UserRole | None = Query(default=None), db: Session = Depends(get_db)
) -> list[User]:
    stmt = select(User)
    if role is not None:
        stmt = stmt.where(User.role == role)
    stmt = stmt.order_by(User.full_name)
    return list(db.scalars(stmt).all())


@router.post("/", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def create_user_account(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    user = User(
        full_name=payload.full_name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        origin=payload.origin,
        is_active=True,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with that email already exists",
        )
    db.refresh(user)
    return user


@router.put("/{user_id:int}", response_model=UserPublic)
def update_user_account(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id:int}", response_model=UserErasure)
def erase_user_account(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> UserErasure:
    """Permanently erase an account and everything hanging off it.

    This exists so the /data-deletion page describes something real. Setting
    `is_active=false` keeps the row, the email and the password hash, which
    answers "this student left" but does not answer "delete my data" - the
    right the DPDP Act and PIPEDA both give people.

    The deletion itself is one statement. `assessment_attempts.student_id` and
    `student_batches.student_id` are both ON DELETE CASCADE, and answers
    cascade from attempts, so the database removes the whole tree. Counts are
    read first because after the commit there is nothing left to count.

    One guard: you cannot erase yourself. That would revoke the very token
    authorising the request halfway through it, and it is also what keeps the
    site administrable - the caller is necessarily an active admin, so
    refusing self-erasure means an active admin always survives. A separate
    "last admin" check would be unreachable for that reason.
    """
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot erase your own account. Ask another admin to do it.",
        )

    attempt_ids = list(
        db.scalars(select(AssessmentAttempt.id).where(AssessmentAttempt.student_id == user.id)).all()
    )
    answers = 0
    if attempt_ids:
        answers = db.scalar(
            select(func.count())
            .select_from(AssessmentAnswer)
            .where(AssessmentAnswer.attempt_id.in_(attempt_ids))
        )
    enrollments = db.scalar(
        select(func.count()).select_from(StudentBatch).where(StudentBatch.student_id == user.id)
    )
    receipt = UserErasure(
        deleted_user_id=user.id,
        email=user.email,
        enrollments_deleted=enrollments or 0,
        attempts_deleted=len(attempt_ids),
        answers_deleted=answers or 0,
    )

    db.delete(user)
    db.commit()
    return receipt


@router.get("/{user_id:int}/batches", response_model=list[BatchPublic])
def list_user_batches(user_id: int, db: Session = Depends(get_db)) -> list[BatchPublic]:
    if db.get(User, user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    stmt = (
        select(Batch)
        .join(StudentBatch, StudentBatch.batch_id == Batch.id)
        .where(StudentBatch.student_id == user_id)
        .options(selectinload(Batch.course))
        .order_by(Batch.start_date)
    )
    batches = db.scalars(stmt).all()
    return [BatchPublic.from_model(b) for b in batches]


@router.post(
    "/{user_id:int}/batches", response_model=BatchPublic, status_code=status.HTTP_201_CREATED
)
def assign_user_to_batch(
    user_id: int, payload: BatchAssignment, db: Session = Depends(get_db)
) -> BatchPublic:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only students can be enrolled in batches",
        )

    batch = db.scalar(
        select(Batch).options(selectinload(Batch.course)).where(Batch.id == payload.batch_id)
    )
    if batch is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")

    db.add(StudentBatch(student_id=user_id, batch_id=payload.batch_id))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This student is already enrolled in that batch",
        )
    return BatchPublic.from_model(batch)


@router.delete("/{user_id:int}/batches/{batch_id:int}", status_code=status.HTTP_204_NO_CONTENT)
def unassign_user_from_batch(user_id: int, batch_id: int, db: Session = Depends(get_db)) -> None:
    enrollment = db.scalar(
        select(StudentBatch).where(
            StudentBatch.student_id == user_id, StudentBatch.batch_id == batch_id
        )
    )
    if enrollment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
    db.delete(enrollment)
    db.commit()


@me_router.get("/batches", response_model=list[BatchPublic])
def list_my_batches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[BatchPublic]:
    """The batches (and, via course_name, courses) the caller is enrolled
    in - the data source for the student dashboard's "My Courses" list.

    `StudentBatch` is owned by this module, but the response reuses
    `batches.schemas.BatchPublic` (the same "read across" the topics
    module already does for `is_student_enrolled_in_course`) rather than
    inventing a parallel schema for the same shape. Any authenticated
    user can call this - an admin simply has no student_batches rows and
    gets an empty list back, same as a student enrolled in nothing.
    """
    stmt = (
        select(Batch)
        .join(StudentBatch, StudentBatch.batch_id == Batch.id)
        .where(StudentBatch.student_id == current_user.id)
        .options(selectinload(Batch.course))
        .order_by(Batch.start_date)
    )
    batches = db.scalars(stmt).all()
    return [BatchPublic.from_model(b) for b in batches]
