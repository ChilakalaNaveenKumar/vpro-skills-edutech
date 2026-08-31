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
