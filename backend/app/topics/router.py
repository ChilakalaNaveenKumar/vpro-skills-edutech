"""API router for the topics module.

`admin_router` is full CRUD (Topics is the one of these three modules the
spec explicitly grants a hard Delete). `router` is the student/admin-facing
read, mounted under /api/courses for a REST-friendly URL
(GET /api/courses/{course_id}/topics) even though the model and query logic
live here in topics - see docs/ARCHITECTURE.md's "Courses / Batches /
Topics" section.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_admin
from app.core.enums import EntityStatus, UserRole
from app.courses.models import Course
from app.database.session import get_db
from app.topics.models import Topic
from app.topics.schemas import TopicCreate, TopicPublic, TopicUpdate
from app.users.enrollment import is_student_enrolled_in_course
from app.users.models import User

admin_router = APIRouter(
    prefix="/api/admin/topics", dependencies=[Depends(require_admin)], tags=["Topics"]
)
router = APIRouter(prefix="/api/courses", dependencies=[Depends(get_current_user)], tags=["Topics"])


@router.get("/{course_id}/topics", response_model=list[TopicPublic])
def list_course_topics(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Topic]:
    if db.get(Course, course_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    stmt = select(Topic).where(Topic.course_id == course_id)

    if current_user.role != UserRole.ADMIN:
        if not is_student_enrolled_in_course(db, current_user.id, course_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not enrolled in this course",
            )
        stmt = stmt.where(Topic.status == EntityStatus.ACTIVE)

    stmt = stmt.order_by(Topic.topic_order)
    return list(db.scalars(stmt).all())


@admin_router.get("/{topic_id}", response_model=TopicPublic)
def get_topic(topic_id: int, db: Session = Depends(get_db)) -> Topic:
    topic = db.get(Topic, topic_id)
    if topic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    return topic


@admin_router.post("/", response_model=TopicPublic, status_code=status.HTTP_201_CREATED)
def create_topic(payload: TopicCreate, db: Session = Depends(get_db)) -> Topic:
    if db.get(Course, payload.course_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    topic = Topic(**payload.model_dump())
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


@admin_router.put("/{topic_id}", response_model=TopicPublic)
def update_topic(topic_id: int, payload: TopicUpdate, db: Session = Depends(get_db)) -> Topic:
    topic = db.get(Topic, topic_id)
    if topic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(topic, field, value)
    db.commit()
    db.refresh(topic)
    return topic


@admin_router.delete("/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_topic(topic_id: int, db: Session = Depends(get_db)) -> None:
    topic = db.get(Topic, topic_id)
    if topic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    db.delete(topic)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This topic has questions with existing assessment answers and cannot be deleted",
        )
