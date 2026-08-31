"""API routers for the assessments module.

`router` (mounted under /api/topics, REST-friendly URL - the same
"owning-module-keeps-the-logic, REST-friendly-prefix" split Phase 4 used
for topics' own course-scoped listing under /api/courses) is the
student-facing take/submit flow: a student always approaches an assessment
through the topic it's attached to, never by the assessment's own id
directly - that's what "which course/topic was this attempt for" means.

`admin_router` (2026-08-31, mounted under /api/admin/assessments) is the
CRUD for the standalone, reusable Assessment entity itself - creating one,
naming it, deleting it once it's no longer in use anywhere. See
app/assessments/models.py's docstring for why Assessment became a
first-class entity instead of an auto-provisioned implementation detail of
Topic.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.assessments.models import Assessment, AssessmentAnswer, AssessmentAttempt
from app.assessments.schemas import (
    AssessmentAdminPublic,
    AssessmentCreate,
    AssessmentPublic,
    AssessmentResultPublic,
    AssessmentSubmitRequest,
    AssessmentUpdate,
)
from app.auth.dependencies import get_current_user, require_admin
from app.core.enums import EntityStatus, UserRole
from app.database.session import get_db
from app.questions.models import Question
from app.topics.models import Topic
from app.users.enrollment import is_student_enrolled_in_course
from app.users.models import User

router = APIRouter(
    prefix="/api/topics", dependencies=[Depends(get_current_user)], tags=["Assessments"]
)
admin_router = APIRouter(
    prefix="/api/admin/assessments", dependencies=[Depends(require_admin)], tags=["Assessments"]
)

_NOT_AVAILABLE = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not available for this topic"
)


def _load_active_questions(db: Session, assessment_id: int) -> list[Question]:
    stmt = (
        select(Question)
        .options(selectinload(Question.options))
        .where(Question.assessment_id == assessment_id, Question.status == EntityStatus.ACTIVE)
        .order_by(Question.id)
    )
    return list(db.scalars(stmt).all())


@router.get("/{topic_id}/assessment", response_model=AssessmentPublic)
def get_assessment(
    topic_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AssessmentPublic:
    topic = db.get(Topic, topic_id)
    if topic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

    is_admin = current_user.role == UserRole.ADMIN
    if not is_admin:
        if not is_student_enrolled_in_course(db, current_user.id, topic.course_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not enrolled in this course",
            )
        if topic.status != EntityStatus.ACTIVE:
            raise _NOT_AVAILABLE

    assessment = db.get(Assessment, topic.assessment_id) if topic.assessment_id else None
    if assessment is None or (not is_admin and assessment.status != EntityStatus.ACTIVE):
        raise _NOT_AVAILABLE

    # One attempt per student per (assessment, topic) (2026-08-31, scoped
    # by topic since the same assessment can now be attached to more than
    # one topic - see app/assessments/models.py's AssessmentAttempt
    # docstring) - a student who already submitted this topic's assessment
    # gets blocked from re-fetching the question set at all, rather than
    # being allowed to retake it. 409 (not 403/404) since the topic/
    # assessment itself is perfectly valid - it's this specific request
    # that conflicts with an existing attempt. `attempt_id` in the detail
    # lets the frontend send the student straight to their existing result
    # instead of just showing an error. Admins never have attempts of
    # their own (they never submit - see submit_assessment's role check
    # below), so this only ever applies to students.
    if not is_admin:
        existing_attempt = db.scalar(
            select(AssessmentAttempt).where(
                AssessmentAttempt.assessment_id == assessment.id,
                AssessmentAttempt.topic_id == topic.id,
                AssessmentAttempt.student_id == current_user.id,
            )
        )
        if existing_attempt is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "You have already completed this assessment.",
                    "attempt_id": existing_attempt.id,
                },
            )

    questions = _load_active_questions(db, assessment.id)
    if not questions:
        raise _NOT_AVAILABLE

    return AssessmentPublic(
        topic_id=topic.id,
        topic_name=topic.name,
        total_questions=len(questions),
        questions=list(questions),
    )


@router.post("/{topic_id}/assessment/submit", response_model=AssessmentResultPublic)
def submit_assessment(
    topic_id: int,
    payload: AssessmentSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AssessmentResultPublic:
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can submit assessment attempts",
        )

    topic = db.get(Topic, topic_id)
    if topic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

    if not is_student_enrolled_in_course(db, current_user.id, topic.course_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this course"
        )

    assessment = db.get(Assessment, topic.assessment_id) if topic.assessment_id else None
    if assessment is None or assessment.status != EntityStatus.ACTIVE:
        raise _NOT_AVAILABLE

    # Never trust the client's question list, count, or any submitted
    # score - re-derive the entire scoring set from the database.
    questions = _load_active_questions(db, assessment.id)
    if not questions:
        raise _NOT_AVAILABLE

    submitted_option_by_question = {
        answer.question_id: answer.selected_option_id for answer in payload.answers
    }

    correct_count = 0
    answer_rows: list[AssessmentAnswer] = []
    for question in questions:
        selected_option_id = submitted_option_by_question.get(question.id)
        # Only accept an option id that actually belongs to *this*
        # question - a mismatched id (by accident or by design) counts as
        # unanswered/wrong rather than being looked up against the wrong
        # question's answer key.
        selected_option = next((o for o in question.options if o.id == selected_option_id), None)
        is_correct = selected_option is not None and selected_option.is_correct
        if is_correct:
            correct_count += 1
        answer_rows.append(
            AssessmentAnswer(
                question_id=question.id,
                selected_option_id=selected_option.id if selected_option else None,
                is_correct=is_correct,
            )
        )

    total_questions = len(questions)
    wrong_count = total_questions - correct_count
    percentage = round((correct_count / total_questions) * 100, 2)

    attempt = AssessmentAttempt(
        assessment_id=assessment.id,
        topic_id=topic.id,
        student_id=current_user.id,
        total_questions=total_questions,
        correct_count=correct_count,
        wrong_count=wrong_count,
        percentage=percentage,
        started_at=payload.started_at,
        submitted_at=datetime.now(timezone.utc),
        answers=answer_rows,
    )
    db.add(attempt)
    try:
        db.commit()
    except IntegrityError:
        # Backstop for a second submission slipping past get_assessment's
        # own check above (a replayed request, two tabs racing each
        # other) - the DB's UniqueConstraint(assessment_id, topic_id,
        # student_id) is the actual source of truth. Same shape as
        # get_assessment's 409 so the frontend can handle both with one
        # code path.
        db.rollback()
        existing_attempt = db.scalar(
            select(AssessmentAttempt).where(
                AssessmentAttempt.assessment_id == assessment.id,
                AssessmentAttempt.topic_id == topic.id,
                AssessmentAttempt.student_id == current_user.id,
            )
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "You have already completed this assessment.",
                "attempt_id": existing_attempt.id if existing_attempt else None,
            },
        )
    db.refresh(attempt)
    return AssessmentResultPublic.from_attempt(attempt)


# --- Admin CRUD for the reusable Assessment entity (2026-08-31) -------


@admin_router.get("/", response_model=list[AssessmentAdminPublic])
def list_assessments(db: Session = Depends(get_db)) -> list[AssessmentAdminPublic]:
    stmt = (
        select(Assessment)
        .options(selectinload(Assessment.questions), selectinload(Assessment.topics))
        .order_by(Assessment.name)
    )
    assessments = db.scalars(stmt).all()
    return [AssessmentAdminPublic.from_model(a) for a in assessments]


@admin_router.get("/{assessment_id}", response_model=AssessmentAdminPublic)
def get_assessment_admin(assessment_id: int, db: Session = Depends(get_db)) -> AssessmentAdminPublic:
    stmt = (
        select(Assessment)
        .where(Assessment.id == assessment_id)
        .options(selectinload(Assessment.questions), selectinload(Assessment.topics))
    )
    assessment = db.scalar(stmt)
    if assessment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    return AssessmentAdminPublic.from_model(assessment)


@admin_router.post("/", response_model=AssessmentAdminPublic, status_code=status.HTTP_201_CREATED)
def create_assessment(payload: AssessmentCreate, db: Session = Depends(get_db)) -> AssessmentAdminPublic:
    assessment = Assessment(name=payload.name, description=payload.description, status=payload.status)
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return AssessmentAdminPublic.from_model(assessment)


@admin_router.put("/{assessment_id}", response_model=AssessmentAdminPublic)
def update_assessment(
    assessment_id: int, payload: AssessmentUpdate, db: Session = Depends(get_db)
) -> AssessmentAdminPublic:
    assessment = db.get(Assessment, assessment_id)
    if assessment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(assessment, field, value)
    db.commit()
    db.refresh(assessment)
    return AssessmentAdminPublic.from_model(assessment)


@admin_router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assessment(assessment_id: int, db: Session = Depends(get_db)) -> None:
    assessment = db.get(Assessment, assessment_id)
    if assessment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    # Refuse to delete an assessment that's still attached to any topic -
    # same "can't delete what's in use" pattern as topics'/questions' own
    # delete endpoints. An admin has to detach it from every topic first
    # (PUT the topic with assessment_id: null), which makes the "this
    # will stop being reused anywhere" consequence explicit rather than
    # silent. The IntegrityError catch below is the belt-and-suspenders
    # backstop for existing attempts (ON DELETE CASCADE would otherwise
    # silently take attempt history down with the assessment, which
    # app/assessments/models.py's AssessmentAttempt FK does allow at the
    # DB level - this check is what actually prevents that in practice).
    if assessment.topics:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This assessment is attached to one or more topics - detach it first",
        )
    if assessment.attempts:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This assessment has existing student attempts and cannot be deleted",
        )

    db.delete(assessment)
    db.commit()
