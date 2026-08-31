"""Enums shared across model modules.

Defined once here (rather than per-module) so every table uses the same
underlying values and there is one place to add a value in a future phase.
"""

from enum import Enum


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    STUDENT = "STUDENT"


class EntityStatus(str, Enum):
    """Shared status for courses, batches, topics, questions, and assessments."""

    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class BatchProgressStatus(str, Enum):
    """A batch's training progress - separate from EntityStatus, which
    controls whether a batch is shown at all (an admin "deactivate" a
    batch entirely). Marking a batch COMPLETED does not hide it - enrolled
    students should still be able to see a finished batch and review their
    past results for it, just like an IN_PROGRESS one.
    """

    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
