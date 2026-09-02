"""API router for the courses module.

`router` serves public/student/admin reads from the same endpoints (see
get_current_user_optional's docstring); `admin_router` is writes only -
there is no admin-only GET because admin reuses `router` with elevated
visibility, matching the product spec's own API list.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user_optional, require_admin
from app.core.enums import EntityStatus, UserRole
from app.courses.models import Course
from app.courses.schemas import CourseCreate, CoursePublic, CourseUpdate
from app.database.session import get_db
from app.users.models import User

router = APIRouter(prefix="/api/courses", tags=["Courses"])
admin_router = APIRouter(
    prefix="/api/admin/courses", dependencies=[Depends(require_admin)], tags=["Courses"]
)


def _is_admin(user: User | None) -> bool:
    return user is not None and user.role == UserRole.ADMIN


@router.get("/", response_model=list[CoursePublic])
def list_courses(
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> list[Course]:
    stmt = select(Course)
    if not _is_admin(current_user):
        stmt = stmt.where(Course.status == EntityStatus.ACTIVE)
    stmt = stmt.order_by(Course.name)
    return list(db.scalars(stmt).all())


@router.get("/{course_id}", response_model=CoursePublic)
def get_course(
    course_id: int,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> Course:
    course = db.get(Course, course_id)
    if course is None or (not _is_admin(current_user) and course.status != EntityStatus.ACTIVE):
        # Same 404 whether it doesn't exist or is inactive-and-hidden -
        # don't reveal to a non-admin that an inactive course exists.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


@admin_router.post("/", response_model=CoursePublic, status_code=status.HTTP_201_CREATED)
def create_course(payload: CourseCreate, db: Session = Depends(get_db)) -> Course:
    course = Course(**payload.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@admin_router.put("/{course_id}", response_model=CoursePublic)
def update_course(course_id: int, payload: CourseUpdate, db: Session = Depends(get_db)) -> Course:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(course, field, value)
    db.commit()
    db.refresh(course)
    return course
