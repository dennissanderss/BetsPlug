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


def run_migrations() -> None:
    """Run ``alembic upgrade head``; log + continue on failure."""
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
