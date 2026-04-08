from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.logging import setup_logging
from app.api.routes import router as api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    # Auto-run database migrations on startup
    try:
        from alembic.config import Config as AlembicConfig
        from alembic import command
        import os

        alembic_cfg = AlembicConfig(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
        alembic_cfg.set_main_option("script_location", os.path.join(os.path.dirname(__file__), "..", "alembic"))
        command.upgrade(alembic_cfg, "head")
    except Exception as exc:
        import logging
        logging.getLogger(__name__).warning("Auto-migration skipped: %s", exc)
    yield


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

    application.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(api_router, prefix="/api")

    return application


app = create_app()
