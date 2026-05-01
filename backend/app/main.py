from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.logging import setup_logging
from app.core.rate_limit import RateLimitMiddleware
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
        import app.models.abandoned_checkout  # noqa: F401

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Ensured all DB tables exist.")
    except Exception as exc:
        logger.warning("Table creation check failed: %s", exc)

    # ── Bootstrap admins from env var (idempotent + self-healing) ───────────
    # ``BOOTSTRAP_ADMIN_EMAILS`` is a comma-separated list of email
    # addresses that should exist as ADMIN on every boot. Behaviour:
    #   • Existing users → promoted to Role.ADMIN, email_verified=True,
    #     and (if ``BOOTSTRAP_ADMIN_PASSWORD`` is set) their password is
    #     reset to that value.
    #   • Missing users → auto-created with Role.ADMIN, email_verified=True
    #     and the given ``BOOTSTRAP_ADMIN_PASSWORD`` (required for creation).
    # The feature never downgrades existing admins and logs every decision
    # at WARNING so operators can see exactly what happened in Railway logs.
    try:
        settings = get_settings()
        raw = (settings.bootstrap_admin_emails or "").strip()

        if not raw:
            logger.info(
                "[BOOTSTRAP ADMIN] BOOTSTRAP_ADMIN_EMAILS not set — skipping."
            )
        else:
            logger.warning("[BOOTSTRAP ADMIN] ===== Starting bootstrap =====")

            import re
            import secrets as _secrets
            from sqlalchemy import func, select
            from app.db.session import async_session_factory
            from app.models.user import User, Role
            from app.core.security import hash_password

            emails = [
                e.strip().lower()
                for e in raw.split(",")
                if e.strip()
            ]
            logger.warning(
                "[BOOTSTRAP ADMIN] Configured emails: %s",
                ", ".join(emails) or "(empty)",
            )

            pw_set = bool(settings.bootstrap_admin_password)
            logger.warning(
                "[BOOTSTRAP ADMIN] Password reset: %s",
                "ENABLED (will reset existing + create missing users)"
                if pw_set
                else "DISABLED (existing users promoted only; missing users "
                "cannot be created without a password)",
            )

            if not emails:
                logger.warning("[BOOTSTRAP ADMIN] Email list empty — skipping.")
            else:
                async with async_session_factory() as session:
                    # Case-insensitive lookup of existing users.
                    result = await session.execute(
                        select(User).where(func.lower(User.email).in_(emails))
                    )
                    existing_users = list(result.scalars().all())
                    found_emails = {u.email.lower() for u in existing_users}
                    missing_emails = [e for e in emails if e not in found_emails]

                    logger.warning(
                        "[BOOTSTRAP ADMIN] Lookup: %d existing, %d missing. "
                        "Existing=%s Missing=%s",
                        len(existing_users),
                        len(missing_emails),
                        [u.email for u in existing_users] or "[]",
                        missing_emails or "[]",
                    )

                    # Hash the bootstrap password once (used for both existing
                    # user resets and new user creation).
                    new_password_hash: str | None = None
                    if pw_set:
                        new_password_hash = hash_password(
                            settings.bootstrap_admin_password
                        )

                    any_change = False

                    # ── Auto-create missing admins ─────────────────────────
                    if missing_emails:
                        if new_password_hash is None:
                            logger.warning(
                                "[BOOTSTRAP ADMIN] Cannot auto-create %d missing "
                                "user(s) — BOOTSTRAP_ADMIN_PASSWORD is not set. "
                                "Missing: %s",
                                len(missing_emails),
                                ", ".join(missing_emails),
                            )
                        else:
                            for email in missing_emails:
                                # Derive a safe username from the email local
                                # part. Strip anything the USERNAME_RE on the
                                # register endpoint wouldn't accept and fall
                                # back to "admin" if nothing is left.
                                local = email.split("@")[0] or "admin"
                                username = re.sub(
                                    r"[^a-zA-Z0-9_.-]", "", local
                                ) or "admin"
                                username = username[:24]  # leave room for suffix
                                # Unique-username guard — if the derived name is
                                # already taken by an unrelated user, append a
                                # short random suffix so INSERT doesn't fail.
                                existing_username = await session.execute(
                                    select(User).where(User.username == username)
                                )
                                if existing_username.scalar_one_or_none() is not None:
                                    username = f"{username}-{_secrets.token_hex(3)}"
                                new_user = User(
                                    email=email,
                                    username=username,
                                    hashed_password=new_password_hash,
                                    role=Role.ADMIN,
                                    email_verified=True,
                                    is_active=True,
                                    full_name="BetsPlug Admin",
                                )
                                session.add(new_user)
                                any_change = True
                                logger.warning(
                                    "[BOOTSTRAP ADMIN] CREATED new admin user "
                                    "email=%s username=%s (from "
                                    "BOOTSTRAP_ADMIN_PASSWORD)",
                                    email, username,
                                )

                    # ── Promote / update existing users ────────────────────
                    for user in existing_users:
                        changed_this = False
                        if user.role != Role.ADMIN:
                            user.role = Role.ADMIN
                            changed_this = True
                        if not user.email_verified:
                            user.email_verified = True
                            user.email_verification_token = None
                            user.email_verification_sent_at = None
                            changed_this = True
                        if new_password_hash is not None:
                            user.hashed_password = new_password_hash
                            changed_this = True
                        if changed_this:
                            any_change = True
                            logger.warning(
                                "[BOOTSTRAP ADMIN] PROMOTED existing user "
                                "email=%s role=admin email_verified=True%s",
                                user.email,
                                " password=reset" if new_password_hash else "",
                            )
                        else:
                            logger.info(
                                "[BOOTSTRAP ADMIN] %s already at desired state.",
                                user.email,
                            )

                    if any_change:
                        await session.commit()
                        logger.warning(
                            "[BOOTSTRAP ADMIN] ===== COMMIT OK — bootstrap "
                            "complete. Log in at /login with the email(s) "
                            "above and BOOTSTRAP_ADMIN_PASSWORD. Remove the "
                            "env var after first login. ====="
                        )
                    else:
                        logger.warning(
                            "[BOOTSTRAP ADMIN] No changes needed — all %d "
                            "user(s) already at desired state.",
                            len(existing_users),
                        )
    except Exception as exc:
        logger.exception("[BOOTSTRAP ADMIN] Bootstrap step failed: %s", exc)

    # ── Load production v8 models from disk (non-blocking) ─────────────────
    # Models are trained offline via `backend/scripts/train_and_save.py` and
    # shipped in `backend/models/`. Loading takes <1s and is cached at class
    # level, so every forecast request reuses the same in-memory instance.
    # Failure is logged but does NOT block boot — the ensemble falls back
    # to the legacy in-memory Logistic cache if the disk models are missing.
    try:
        from app.forecasting.models.production_v8_model import ProductionV8Model
        if ProductionV8Model.load_models():
            meta = ProductionV8Model._metadata or {}
            logger.info(
                "[MODEL LOAD] ProductionV8Model loaded — %d features, "
                "trained on %d samples, version %s",
                len(ProductionV8Model._feature_names or []),
                meta.get("trained_on_samples", 0),
                meta.get("version", "?"),
            )
        else:
            logger.warning(
                "[MODEL LOAD] ProductionV8Model NOT loaded — files missing in "
                "backend/models/. Falling back to legacy in-memory models."
            )
    except Exception as exc:
        logger.exception("[MODEL LOAD] Failed to load production models: %s", exc)

    # ── Flush stale aggregate caches from pre-v8.1-filter deploys ───────────
    # dashboard:metrics, strategy:metrics:*, strategy:today:* were computed
    # against the un-filtered prediction set and now hold wrong totals.
    # Flush once on boot so the next request recomputes against v8.1 data.
    try:
        from app.core.cache import cache_delete
        from app.core.prediction_filters import V81_FILTER_CACHE_PATTERNS
        total_flushed = 0
        for pattern in V81_FILTER_CACHE_PATTERNS:
            n = await cache_delete(pattern)
            total_flushed += n
        if total_flushed:
            logger.info(
                "[CACHE FLUSH] v8.1 filter — invalidated %d stale key(s) matching %s",
                total_flushed, V81_FILTER_CACHE_PATTERNS,
            )
    except Exception as exc:
        logger.warning("Failed to flush v8.1 aggregate caches: %s", exc)

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

    # Always allow known frontend origins. Includes the marketing/app
    # split: marketing.betsplug.com is the test alias for the Astro
    # site, app.betsplug.com is where the authenticated dashboard
    # lives once we cut over from the apex.
    _known = [
        "https://bets-plug.vercel.app",
        "https://betsplug-marketing.vercel.app",
        "https://betsplug.com",
        "https://www.betsplug.com",
        "https://app.betsplug.com",
        "https://marketing.betsplug.com",
        "http://localhost:3000",
        "http://localhost:4321",
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

    # ── Rate limiting (Redis-backed, fail-open) ────────────────────────────
    application.add_middleware(RateLimitMiddleware)

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
