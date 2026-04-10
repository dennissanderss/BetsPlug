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

    # ── Bootstrap admins from env var (idempotent) ──────────────────────────
    # ``BOOTSTRAP_ADMIN_EMAILS`` is a comma-separated list of email
    # addresses that should be promoted to ``Role.ADMIN`` on every boot.
    # This is the only way to get an initial admin without DB access —
    # register normally via the UI, set the env var in Railway, redeploy,
    # and the listed users are promoted + their email is auto-verified.
    # Safe to leave the var set: the loop is a no-op when nothing needs
    # to change, and never downgrades existing admins.
    try:
        settings = get_settings()
        raw = (settings.bootstrap_admin_emails or "").strip()
        if raw:
            from sqlalchemy import func, select
            from app.db.session import async_session_factory
            from app.models.user import User, Role

            emails = [
                e.strip().lower()
                for e in raw.split(",")
                if e.strip()
            ]
            if emails:
                async with async_session_factory() as session:
                    # Case-insensitive lookup — Pydantic EmailStr only
                    # normalises the domain, so the local part may have
                    # been stored with any casing. ``func.lower`` sidesteps
                    # that entirely.
                    result = await session.execute(
                        select(User).where(func.lower(User.email).in_(emails))
                    )
                    users = result.scalars().all()
                    found_emails = {u.email.lower() for u in users}
                    missing = [e for e in emails if e not in found_emails]
                    if missing:
                        logger.warning(
                            "[BOOTSTRAP ADMIN] Skipping %d email(s) with no "
                            "matching user — register them via the UI first: %s",
                            len(missing), ", ".join(missing),
                        )
                    promoted = 0
                    for user in users:
                        changed = False
                        if user.role != Role.ADMIN:
                            user.role = Role.ADMIN
                            changed = True
                        if not user.email_verified:
                            user.email_verified = True
                            user.email_verification_token = None
                            user.email_verification_sent_at = None
                            changed = True
                        if changed:
                            promoted += 1
                            logger.warning(
                                "[BOOTSTRAP ADMIN] Promoted %s to admin "
                                "(email_verified=True)", user.email,
                            )
                    if promoted:
                        await session.commit()
                        logger.warning(
                            "[BOOTSTRAP ADMIN] Committed %d user change(s).",
                            promoted,
                        )
                    else:
                        logger.info(
                            "[BOOTSTRAP ADMIN] No changes — %d user(s) "
                            "already at desired state.", len(users),
                        )
    except Exception as exc:
        logger.warning("Bootstrap admin step failed: %s", exc)

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
