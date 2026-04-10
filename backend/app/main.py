from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.logging import setup_logging
from app.api.routes import router as api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan.

    IMPORTANT: Every step in here must be fast + non-blocking. Railway starts
    healthchecking /api/health the moment the container binds its port, so we
    cannot afford to block inside the lifespan hook.

    Migrations live in ``start.py`` now (they run BEFORE uvicorn boots), so we
    only do a best-effort ``create_all`` here as a safety net for tables that
    don't have a migration yet (e.g. newer models added during development).
    Every branch below is wrapped in try/except so a single failure cannot
    prevent the app from serving requests.
    """
    setup_logging()
    import logging
    logger = logging.getLogger(__name__)

    # ── Safety net: create any tables that don't exist yet ──────────────────
    # Runs inside a tight try/except so schema issues can never take the
    # service offline. Migrations are the source of truth; this is only here
    # to paper over models that were added without an Alembic revision.
    try:
        from app.db.session import engine, Base
        # Import all models so Base.metadata knows about them
        import app.models.strategy  # noqa: F401
        import app.models.prediction  # noqa: F401
        import app.models.match  # noqa: F401
        import app.models.league  # noqa: F401
        import app.models.team  # noqa: F401
        import app.models.model_version  # noqa: F401
        import app.models.backtest  # noqa: F401
        import app.models.report  # noqa: F401
        import app.models.ingestion  # noqa: F401
        import app.models.blog  # noqa: F401
        import app.models.site_settings  # noqa: F401
        import app.models.admin_note  # noqa: F401
        import app.models.subscription  # noqa: F401
        import app.models.manual_expense  # noqa: F401

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Ensured all DB tables exist.")
    except Exception as exc:
        logger.warning("Table creation check failed: %s", exc)

    # ── Start background scheduler (never blocks boot) ──────────────────────
    try:
        from app.services.scheduler import start_scheduler
        start_scheduler()
        logger.info("Background scheduler started.")
    except Exception as exc:
        logger.warning("Failed to start scheduler: %s", exc)

    yield

    # ── Shutdown ────────────────────────────────────────────────────────────
    try:
        from app.services.scheduler import stop_scheduler
        stop_scheduler()
    except Exception:
        pass


def create_app() -> FastAPI:
    settings = get_settings()

    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "Sports Intelligence Platform - A sport analytics, forecasting, "
            "and reporting platform for educational and research purposes. "
            "All outputs are simulated/hypothetical and do not constitute financial or betting advice."
        ),
        lifespan=lifespan,
    )

    origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
    if settings.frontend_url and settings.frontend_url not in origins:
        origins.append(settings.frontend_url)

    # Always allow known frontend origins
    _known = [
        "https://bets-plug.vercel.app",
        "https://betsplug.com",
        "https://www.betsplug.com",
        "http://localhost:3000",
    ]
    for o in _known:
        if o not in origins:
            origins.append(o)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Ultra-light liveness probe ──────────────────────────────────────────
    # /api/ping is a zero-dependency endpoint used as a fallback healthcheck
    # so Railway has a fast "is this process alive?" signal even if the DB
    # is temporarily unreachable. /api/health still does the full dependency
    # dance for the admin dashboard.
    @application.get("/api/ping", include_in_schema=False)
    async def ping() -> dict:
        return {"status": "ok"}

    application.include_router(api_router, prefix="/api")

    return application


app = create_app()
