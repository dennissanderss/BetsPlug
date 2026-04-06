import sys
import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# ---------------------------------------------------------------------------
# Make sure the backend/ package root is on sys.path so that `app.*` imports
# resolve correctly regardless of how alembic is invoked.
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ---------------------------------------------------------------------------
# Import all models so that SQLAlchemy's mapper registry is fully populated
# before autogenerate inspects the metadata.  The models __init__ re-exports
# every mapped class; importing it is sufficient.
# ---------------------------------------------------------------------------
import app.models  # noqa: F401 – side-effect import registers all mappers

# Pull the shared Base (and therefore its metadata) from the session module.
from app.db.session import Base

# Resolve the synchronous database URL from the application config so there
# is a single source of truth for connection parameters.
from app.core.config import get_settings

# ---------------------------------------------------------------------------
# Alembic Config object – gives access to values in alembic.ini
# ---------------------------------------------------------------------------
config = context.config

# Override sqlalchemy.url with the value from app settings so that the
# alembic.ini placeholder is never used directly (and credentials never live
# in the .ini file).
settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.database_url_sync)

# Interpret the config file for Python logging.  This line sets up loggers.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# The metadata object that autogenerate will diff against the live database.
target_metadata = Base.metadata


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    In this mode Alembic configures the context with just a URL and not an
    actual database connection.  Calls to context.execute() emit the SQL to
    the output stream rather than executing against the DB.

    This is useful for generating a SQL script to be reviewed / applied
    manually.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this mode a real database connection is created via SQLAlchemy's
    synchronous engine (Alembic does not support async natively).
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
