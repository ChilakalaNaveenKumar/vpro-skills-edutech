"""No models of its own.

A "result" is a submitted `AssessmentAttempt` (see app/assessments/models.py)
- storing it again here would duplicate data the spec explicitly warns
against. This module's future endpoints read `AssessmentAttempt` joined
with `User`/`Course`/`Topic` to serve the student and admin results views.
See docs/ARCHITECTURE.md's "Database schema" section for the full rationale.
"""
