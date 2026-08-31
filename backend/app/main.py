from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings

from app.admin.router import router as admin_router
from app.assessments.router import router as assessments_router
from app.auth.router import router as auth_router
from app.batches.router import admin_router as batches_admin_router, router as batches_router
from app.courses.router import admin_router as courses_admin_router, router as courses_router
from app.questions.router import admin_router as questions_admin_router
from app.results.router import admin_router as results_admin_router, router as results_router
from app.topics.router import admin_router as topics_admin_router, router as topics_router
from app.users.router import me_router as users_me_router, router as users_router

settings = get_settings()

# Interactive API docs (Swagger UI / ReDoc) and the raw OpenAPI schema are
# an avoidable disclosure on a real deployment, so they are disabled when
# ENVIRONMENT=production (see app/core/config.py) - unchanged everywhere
# else, including every existing test (conftest.py never sets ENVIRONMENT,
# so it defaults to "development" and docs stay enabled there).
_docs_enabled = settings.environment != "production"
app = FastAPI(
    title=settings.app_name,
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Every domain module owns its own router; main.py only wires them together.
# Adding a future module means adding one more include_router call here -
# existing modules are never touched.
for module_router in (
    auth_router,
    users_router,
    users_me_router,
    courses_router,
    courses_admin_router,
    batches_router,
    batches_admin_router,
    topics_router,
    topics_admin_router,
    questions_admin_router,
    assessments_router,
    results_router,
    results_admin_router,
    admin_router,
):
    app.include_router(module_router)


@app.get("/health", tags=["Health"])
async def health() -> dict:
    """Liveness check - does not touch the database."""
    return {"status": "ok", "app": settings.app_name, "environment": settings.environment}
