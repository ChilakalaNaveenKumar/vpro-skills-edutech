"""No models of its own.

The `User` model (with its `role` field distinguishing ADMIN from STUDENT)
lives in app/users/models.py. This module owns login/token endpoints and
schemas only (added in Phase 3), not the account data itself.
"""
