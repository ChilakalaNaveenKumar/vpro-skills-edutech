"""API router for the Admin-only management endpoints module."""

from fastapi import APIRouter, Depends

from app.auth.dependencies import require_admin

router = APIRouter(prefix="/api/admin", dependencies=[Depends(require_admin)], tags=["Admin"])


@router.get("/")
async def list_admin() -> dict:
    """Placeholder proving the admin module is wired into the app.

    Real business logic for this module is implemented in a later
    development phase per the project roadmap in README.md.
    """
    return {"module": "admin", "status": "not_implemented_yet"}
