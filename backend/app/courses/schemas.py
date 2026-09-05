"""Pydantic schemas for the courses module."""

from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import EntityStatus

if TYPE_CHECKING:
    from app.courses.models import Course


class CourseModulePublic(BaseModel):
    """A topic, as the marketing site presents it: a curriculum module."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    order: int
    summary: str | None = None
    builds: str | None = None
    visual: str | None = None
    topics: list[str] = []


class CourseProjectPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    description: str


class CourseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    status: EntityStatus = EntityStatus.ACTIVE
    slug: str | None = Field(default=None, max_length=120)
    tagline: str | None = Field(default=None, max_length=300)
    summary: str | None = None
    level: str | None = Field(default=None, max_length=150)
    prerequisites: str | None = Field(default=None, max_length=300)
    for_whom: list[str] | None = None
    outcomes: list[str] | None = None
    techs: list[str] | None = None
    hue: int | None = Field(default=None, ge=0, le=360)
    flagship: bool | None = None
    display_order: int | None = None
    video_url: str | None = Field(default=None, max_length=500)



class CourseUpdate(BaseModel):
    """All fields optional - the router applies only what's set
    (`exclude_unset`), so a PUT can flip just `status` (Activate/Deactivate)
    without resending the rest of the course.
    """

    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: EntityStatus | None = None
    slug: str | None = Field(default=None, max_length=120)
    tagline: str | None = Field(default=None, max_length=300)
    summary: str | None = None
    level: str | None = Field(default=None, max_length=150)
    prerequisites: str | None = Field(default=None, max_length=300)
    for_whom: list[str] | None = None
    outcomes: list[str] | None = None
    techs: list[str] | None = None
    hue: int | None = Field(default=None, ge=0, le=360)
    flagship: bool | None = None
    display_order: int | None = None
    video_url: str | None = Field(default=None, max_length=500)



class CoursePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    status: EntityStatus

    # The curriculum, which lived in web/src/content/courses.ts until 2026-09-05.
    slug: str | None = None
    tagline: str | None = None
    summary: str | None = None
    level: str | None = None
    prerequisites: str | None = None
    for_whom: list[str] = []
    outcomes: list[str] = []
    techs: list[str] = []
    hue: int | None = None
    flagship: bool = False
    display_order: int = 0
    video_url: str | None = None
    modules: list[CourseModulePublic] = []
    projects: list[CourseProjectPublic] = []

    @classmethod
    def from_model(cls, course: "Course") -> "CoursePublic":
        # `modules` is the topics relationship under the name the marketing
        # site uses, and `topics` inside a module is its sub-topic list - the
        # two names are swapped relative to the tables on purpose, because the
        # public vocabulary and the schema's vocabulary disagree.
        return cls(
            id=course.id,
            name=course.name,
            description=course.description,
            status=course.status,
            slug=course.slug,
            tagline=course.tagline,
            summary=course.summary,
            level=course.level,
            prerequisites=course.prerequisites,
            for_whom=course.for_whom or [],
            outcomes=course.outcomes or [],
            techs=course.techs or [],
            hue=course.hue,
            flagship=course.flagship,
            display_order=course.display_order,
            video_url=course.video_url,
            modules=[
                CourseModulePublic(
                    id=topic.id,
                    name=topic.name,
                    order=topic.topic_order,
                    summary=topic.summary,
                    builds=topic.builds,
                    visual=topic.visual,
                    topics=topic.subtopics or [],
                )
                for topic in course.topics
                if topic.status == EntityStatus.ACTIVE
            ],
            projects=[
                CourseProjectPublic(name=project.name, description=project.description)
                for project in course.projects
            ],
        )
