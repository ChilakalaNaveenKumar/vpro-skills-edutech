"""API router for the courses module.

`router` serves public/student/admin reads from the same endpoints (see
get_current_user_optional's docstring); `admin_router` is writes only -
there is no admin-only GET because admin reuses `router` with elevated
visibility, matching the product spec's own API list.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.auth.dependencies import get_current_user_optional, require_admin
from app.core.enums import EntityStatus, UserRole
from app.batches.models import Batch
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
) -> list[CoursePublic]:
    # Eager-loaded: without this the curriculum turns one query into
    # 1 + 2N as every course lazy-loads its modules and projects.
    stmt = select(Course).options(
        selectinload(Course.topics), selectinload(Course.projects)
    )
    if not _is_admin(current_user):
        stmt = stmt.where(Course.status == EntityStatus.ACTIVE)
    stmt = stmt.order_by(Course.display_order, Course.name)
    return [CoursePublic.from_model(course) for course in db.scalars(stmt).all()]


@router.get("/{course_id}", response_model=CoursePublic)
def get_course(
    course_id: int,
    current_user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
) -> CoursePublic:
    course = db.get(Course, course_id)
    if course is None or (not _is_admin(current_user) and course.status != EntityStatus.ACTIVE):
        # Same 404 whether it doesn't exist or is inactive-and-hidden -
        # don't reveal to a non-admin that an inactive course exists.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return CoursePublic.from_model(course)


@admin_router.post("/", response_model=CoursePublic, status_code=status.HTTP_201_CREATED)
def create_course(payload: CourseCreate, db: Session = Depends(get_db)) -> CoursePublic:
    # exclude_unset so the model's own defaults apply to anything the caller
    # did not send - `flagship` and `display_order` are NOT NULL columns, and
    # passing an explicit None for them fails at insert.
    course = Course(**payload.model_dump(exclude_unset=True))
    db.add(course)
    db.commit()
    db.refresh(course)
    # Built through from_model like the read routes: a new course has NULL for
    # the JSON list columns, and CoursePublic declares them as plain lists.
    # Returning the ORM object raw made every create fail response validation.
    return CoursePublic.from_model(course)


@admin_router.put("/{course_id}", response_model=CoursePublic)
def update_course(course_id: int, payload: CourseUpdate, db: Session = Depends(get_db)) -> CoursePublic:
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    # `flagship` and `display_order` are NOT NULL, so a null for either is
    # treated as "leave it alone" rather than written through.
    non_nullable = {"flagship", "display_order"}
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is None and field in non_nullable:
            continue
        setattr(course, field, value)
    db.commit()
    db.refresh(course)
    return CoursePublic.from_model(course)


@admin_router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int, db: Session = Depends(get_db)) -> None:
    """Hard-delete a course, and with it its topics and projects.

    Refused while any batch still points at the course: those batches carry
    student enrolments and results, and cascading the delete would take real
    history with it. Deactivate instead - that hides the course from the site
    and keeps everything that happened in it.
    """
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    batches = db.scalar(select(func.count()).select_from(Batch).where(Batch.course_id == course_id))
    if batches:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"{course.name} has {batches} batch(es). Delete or move those first, "
                "or deactivate the course instead."
            ),
        )

    db.delete(course)
    db.commit()
