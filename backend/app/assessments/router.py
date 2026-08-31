"""API router for taking and submitting a topic's assessment.

Mounted under /api/topics for a REST-friendly URL - the same
"owning-module-keeps-the-logic, REST-friendly-prefix" split Phase 4 used
for topics' own course-scoped listing under /api/courses.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.assessments.models import Assessment, AssessmentAnswer, AssessmentAttempt
from app.assessments.schemas import (
    AssessmentPublic,
    AssessmentResultPublic,
    AssessmentSubmitRequest,
)
from app.auth.dependencies import get_current_user
from app.core.enums import EntityStatus, UserRole
from app.database.session import get_db
from app.questions.models import Question
from app.topics.models import Topic
from app.users.enrollment import is_student_enrolled_in_course
from app.users.models import User

router = APIRouter(
    prefix="/api/topics", dependencies=[Depends(get_current_user)], tags=["Assessments"]
)

_NOT_AVAILABLE = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not available for this topic"
)


def _load_active_questions(db: Session, topic_id: int) -> list[Question]:
    stmt = (
        select(Question)
        .options(selectinload(Question.options))
        .where(Question.topic_id == topic_id, Question.status == EntityStatus.ACTIVE)
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

    assessment = db.scalar(select(Assessment).where(Assessment.topic_id == topic_id))
    if assessment is None or (not is_admin and assessment.status != EntityStatus.ACTIVE):
        raise _NOT_AVAILABLE

    questions = _load_active_questions(db, topic_id)
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

    assessment = db.scalar(select(Assessment).where(Assessment.topic_id == topic_id))
    if assessment is None or assessment.status != EntityStatus.ACTIVE:
        raise _NOT_AVAILABLE

    # Never trust the client's question list, count, or any submitted
    # score - re-derive the entire scoring set from the database.
    questions = _load_active_questions(db, topic_id)
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
    db.commit()
    db.refresh(attempt)
    return AssessmentResultPublic.from_attempt(attempt)
