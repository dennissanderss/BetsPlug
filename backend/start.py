"""Railway start script.

Runs Alembic migrations BEFORE starting uvicorn so that:
  1. The database schema is up-to-date before any request is served.
  2. Migration failures show up immediately in Railway logs (instead of
     being silently swallowed by the FastAPI lifespan hook).
  3. The lifespan hook stays fast, which matters because Railway's
     healthcheck starts polling /api/health the moment the container
     binds to $PORT — a slow startup causes healthcheck failures.

If migrations fail we still start the server (logged as a warning) so a
single bad migration cannot take the whole platform offline. The app's
lifespan hook also calls ``Base.metadata.create_all`` as a last-resort
safety net for tables that don't have a migration yet.
"""
import os
import subprocess
import sys
import time

import uvicorn


def bootstrap_alembic_if_needed() -> None:
    """If the DB already has tables but no ``alembic_version``, stamp head.

    Handles the edge case where a previous deploy populated the schema via
    ``Base.metadata.create_all`` (before alembic was wired up), and now we
    want to run migrations for the first time. Without this step
    ``alembic upgrade head`` would try to re-run the initial migration and
    crash with ``DuplicateTable: relation "data_sources" already exists``.

    Strategy:
      - If ``alembic_version`` already exists → do nothing (normal flow).
      - If the DB is empty → do nothing (normal flow; all migrations run).
      - Otherwise → ``alembic stamp head`` so alembic assumes the schema is
        already current. Any tables added later (e.g. ``subscriptions``) are
        created by the ``Base.metadata.create_all`` safety net in
        ``app/main.py`` lifespan.
    """
    try:
        from sqlalchemy import create_engine, inspect
    except Exception as exc:  # pragma: no cover
        print(f"[start.py] Cannot import SQLAlchemy for bootstrap: {exc}", flush=True)
        return

    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url:
        print("[start.py] No DATABASE_URL — skipping alembic bootstrap check", flush=True)
        return

    # Normalise the URL to a sync psycopg2 URL
    sync_url = db_url.replace("+asyncpg", "")
    if sync_url.startswith("postgres://"):
        sync_url = sync_url.replace("postgres://", "postgresql://", 1)

    try:
        engine = create_engine(sync_url)
        try:
            with engine.connect() as conn:
                inspector = inspect(conn)
                tables = set(inspector.get_table_names())
        finally:
            engine.dispose()
    except Exception as exc:
        print(
            f"[start.py] WARNING: alembic bootstrap DB probe failed: {exc}",
            file=sys.stderr,
            flush=True,
        )
        return

    if "alembic_version" in tables:
        print("[start.py] alembic_version exists — normal migration flow", flush=True)
        return

    if not tables:
        print("[start.py] Empty database — normal migration flow", flush=True)
        return

    print(
        f"[start.py] Found {len(tables)} pre-existing tables but no "
        f"alembic_version — stamping head to reconcile",
        flush=True,
    )

    try:
        result = subprocess.run(
            ["alembic", "stamp", "head"],
            capture_output=True,
            text=True,
            timeout=30,
        )
    except Exception as exc:
        print(
            f"[start.py] WARNING: alembic stamp subprocess failed: {exc}",
            file=sys.stderr,
            flush=True,
        )
        return

    if result.stdout:
        print(result.stdout, flush=True)
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr, flush=True)
        print(
            "[start.py] WARNING: alembic stamp head failed — upgrade will likely "
            "also fail, but we'll try anyway",
            flush=True,
        )
    else:
        print(
            "[start.py] alembic stamp head OK — existing schema marked current",
            flush=True,
        )


def reconcile_user_auth_columns() -> None:
    """Add the b2c3d4e5f6a7 auth columns to ``users`` if they're missing.

    Why this exists:
      ``bootstrap_alembic_if_needed`` may have stamped alembic to ``head``
      because the DB already had the original tables (created via
      ``Base.metadata.create_all`` long before alembic was wired up). That
      means migration ``b2c3d4e5f6a7`` was *marked* applied without ever
      actually running, so the new auth columns
      (``email_verified``, ``email_verification_token``, …) are still
      missing from the production ``users`` table.

      The lifespan ``create_all`` safety net cannot help here — it only
      creates missing *tables*, not missing *columns* on existing tables.

      So we do an idempotent column-add pass at boot time. All statements
      use ``IF NOT EXISTS`` so it's safe to re-run on every deploy.

    Existing rows are flipped to ``email_verified = TRUE`` so the admin
    account isn't locked out — same grandfather logic as the migration.
    """
    try:
        from sqlalchemy import create_engine, inspect, text
    except Exception as exc:  # pragma: no cover
        print(f"[start.py] Cannot import SQLAlchemy for reconcile: {exc}", flush=True)
        return

    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url:
        return

    sync_url = db_url.replace("+asyncpg", "")
    if sync_url.startswith("postgres://"):
        sync_url = sync_url.replace("postgres://", "postgresql://", 1)

    try:
        engine = create_engine(sync_url)
    except Exception as exc:
        print(f"[start.py] reconcile: cannot create engine: {exc}", flush=True)
        return

    try:
        with engine.connect() as conn:
            inspector = inspect(conn)
            tables = set(inspector.get_table_names())
            if "users" not in tables:
                print("[start.py] reconcile: no users table — skipping", flush=True)
                return
            user_columns = {c["name"] for c in inspector.get_columns("users")}

        if "email_verified" in user_columns:
            print("[start.py] reconcile: auth columns already present", flush=True)
            return

        print(
            "[start.py] reconcile: users table is missing auth columns — adding",
            flush=True,
        )

        with engine.begin() as conn:
            conn.execute(text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified "
                "BOOLEAN NOT NULL DEFAULT FALSE"
            ))
            conn.execute(text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS "
                "email_verification_token VARCHAR(128)"
            ))
            conn.execute(text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS "
                "email_verification_sent_at TIMESTAMP WITH TIME ZONE"
            ))
            conn.execute(text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS "
                "reset_password_token VARCHAR(128)"
            ))
            conn.execute(text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS "
                "reset_password_expires_at TIMESTAMP WITH TIME ZONE"
            ))
            conn.execute(text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS "
                "last_login_at TIMESTAMP WITH TIME ZONE"
            ))
            # Grandfather every existing user — they registered before email
            # verification was a thing, so we don't lock them out.
            conn.execute(text("UPDATE users SET email_verified = TRUE"))
            conn.execute(text(
                "CREATE INDEX IF NOT EXISTS ix_users_email_verification_token "
                "ON users (email_verification_token)"
            ))
            conn.execute(text(
                "CREATE INDEX IF NOT EXISTS ix_users_reset_password_token "
                "ON users (reset_password_token)"
            ))

        print("[start.py] reconcile: auth columns added + users grandfathered", flush=True)
    except Exception as exc:
        print(
            f"[start.py] WARNING: auth column reconcile failed: {exc}",
            file=sys.stderr,
            flush=True,
        )
    finally:
        try:
            engine.dispose()
        except Exception:
            pass


def run_migrations() -> None:
    """Run ``alembic upgrade head``; log + continue on failure."""
    bootstrap_alembic_if_needed()
    reconcile_user_auth_columns()

    t0 = time.time()
    print("[start.py] Running alembic upgrade head...", flush=True)
    try:
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            timeout=90,
        )
    except subprocess.TimeoutExpired:
        print("[start.py] WARNING: alembic upgrade timed out after 90s", flush=True)
        return
    except FileNotFoundError:
        print("[start.py] WARNING: alembic binary not found on PATH", flush=True)
        return

    elapsed = time.time() - t0
    if result.stdout:
        print(result.stdout, flush=True)
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr, flush=True)
        print(
            f"[start.py] WARNING: alembic upgrade failed in {elapsed:.1f}s "
            "— continuing anyway so the service can still boot",
            flush=True,
        )
    else:
        print(f"[start.py] alembic upgrade OK in {elapsed:.1f}s", flush=True)


if __name__ == "__main__":
    run_migrations()
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        workers=1,
        # Surface startup errors immediately instead of silently exiting.
        log_level="info",
    )
