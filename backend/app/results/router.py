"""API router for the Assessment results module.

Read-only views over app/assessments/models.py's AssessmentAttempt - see
results/models.py's docstring. No admin CRUD: there is nothing to
create/update/delete here, only list and view what Phase 6's submit
endpoint already wrote.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.assessments.models import Assessment, AssessmentAnswer, AssessmentAttempt
from app.auth.dependencies import get_current_user, require_admin
from app.core.enums import UserRole
from app.database.session import get_db
from app.questions.models import Question
from app.results.schemas import AdminResultPublic, ResultDetailPublic, ResultPublic
from app.topics.models import Topic
from app.users.models import User

router = APIRouter(
    prefix="/api/results", dependencies=[Depends(get_current_user)], tags=["Results"]
)
admin_router = APIRouter(
    prefix="/api/admin/results", dependencies=[Depends(require_admin)], tags=["Results"]
)

_SUMMARY_LOAD_OPTIONS = (
    selectinload(AssessmentAttempt.assessment)
    .selectinload(Assessment.topic)
    .selectinload(Topic.course),
)


@router.get("/", response_model=list[ResultPublic])
def list_my_results(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[ResultPublic]:
    stmt = (
        select(AssessmentAttempt)
        .where(AssessmentAttempt.student_id == current_user.id)
        .options(*_SUMMARY_LOAD_OPTIONS)
        .order_by(AssessmentAttempt.submitted_at.desc())
    )
    attempts = db.scalars(stmt).all()
    return [ResultPublic.from_attempt(a) for a in attempts]


@router.get("/{attempt_id}", response_model=ResultDetailPublic)
def get_result_detail(
    attempt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ResultDetailPublic:
    stmt = (
        select(AssessmentAttempt)
        .where(AssessmentAttempt.id == attempt_id)
        .options(
            *_SUMMARY_LOAD_OPTIONS,
            selectinload(AssessmentAttempt.answers)
            .selectinload(AssessmentAnswer.question)
            .selectinload(Question.options),
            selectinload(AssessmentAttempt.answers).selectinload(AssessmentAnswer.selected_option),
        )
    )
    attempt = db.scalar(stmt)
    if attempt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Result not found")

    if current_user.role != UserRole.ADMIN and attempt.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your result")

    return ResultDetailPublic.from_attempt(attempt)


@admin_router.get("/", response_model=list[AdminResultPublic])
def list_all_results(
    student_id: int | None = Query(default=None),
    topic_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[AdminResultPublic]:
    stmt = (
        select(AssessmentAttempt)
        .options(*_SUMMARY_LOAD_OPTIONS, selectinload(AssessmentAttempt.student))
        .order_by(AssessmentAttempt.submitted_at.desc())
    )
    if student_id is not None:
        stmt = stmt.where(AssessmentAttempt.student_id == student_id)
    if topic_id is not None:
        stmt = stmt.join(Assessment, Assessment.id == AssessmentAttempt.assessment_id).where(
            Assessment.topic_id == topic_id
        )

    attempts = db.scalars(stmt).all()
    return [AdminResultPublic.from_attempt(a) for a in attempts]
