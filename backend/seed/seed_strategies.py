"""
seed_strategies.py
==================
Seed the four default betting strategies.

Usage (CLI)
-----------
    python -m seed.seed_strategies

The script is idempotent: it checks for existing strategies by name before
inserting and skips anything already present.

Can also be called from an admin endpoint via the async helper
``seed_strategies_async(db)``.
"""
from __future__ import annotations

import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Make sure the backend root is on sys.path
# ---------------------------------------------------------------------------
_BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.db.session import Base
from app.models.strategy import Strategy

# ---------------------------------------------------------------------------
# Default strategy definitions
# ---------------------------------------------------------------------------

DEFAULT_STRATEGIES = [
    {
        "name": "Value Home",
        "description": (
            "Backs home teams where our model sees at least 5% edge over the "
            "market-implied probability, with reasonable confidence and odds "
            "in the 1.50-2.50 range."
        ),
        "rules": [
            {"feature": "edge_home", "operator": ">", "value": 0.05},
            {"feature": "confidence", "operator": ">=", "value": 0.55},
            {"feature": "odds_home", "operator": "between", "value": [1.50, 2.50]},
        ],
        "staking": {"type": "flat", "amount": 1},
        "is_active": True,
    },
    {
        "name": "High Confidence Favorites",
        "description": (
            "Selects only predictions where the model is very confident "
            "(>= 70%) and the pick has short odds (< 1.80), targeting "
            "reliable favorites."
        ),
        "rules": [
            {"feature": "confidence", "operator": ">=", "value": 0.70},
            {"feature": "odds_pick", "operator": "<", "value": 1.80},
        ],
        "staking": {"type": "flat", "amount": 1},
        "is_active": True,
    },
    {
        "name": "Underdog Edge",
        "description": (
            "Hunts for underdogs where the model identifies a significant "
            "edge (> 8%) at odds of 2.50 or higher — high risk, high reward."
        ),
        "rules": [
            {"feature": "edge_pick", "operator": ">", "value": 0.08},
            {"feature": "odds_pick", "operator": ">=", "value": 2.50},
        ],
        "staking": {"type": "flat", "amount": 1},
        "is_active": True,
    },
    {
        "name": "Form Mismatch",
        "description": (
            "Targets matches where team form diverges sharply (form_diff > 2.0) "
            "and the model still sees a small edge (> 3%) on the pick."
        ),
        "rules": [
            {"feature": "form_diff", "operator": ">", "value": 2.0},
            {"feature": "edge_pick", "operator": ">", "value": 0.03},
        ],
        "staking": {"type": "flat", "amount": 1},
        "is_active": True,
    },
]


# ---------------------------------------------------------------------------
# Sync seeder (for CLI usage)
# ---------------------------------------------------------------------------

def seed_strategies_sync(db: Session) -> list[Strategy]:
    """Insert default strategies if they don't already exist. Returns created/found rows."""
    results = []
    for s_data in DEFAULT_STRATEGIES:
        existing = db.execute(
            select(Strategy).where(Strategy.name == s_data["name"])
        ).scalar_one_or_none()

        if existing:
            print(f"  [skip] Strategy '{s_data['name']}' already exists.")
            results.append(existing)
            continue

        strategy = Strategy(
            name=s_data["name"],
            description=s_data["description"],
            rules=s_data["rules"],
            staking=s_data["staking"],
            is_active=s_data["is_active"],
        )
        db.add(strategy)
        print(f"  [+] Created strategy: {s_data['name']}")
        results.append(strategy)

    db.commit()
    return results


# ---------------------------------------------------------------------------
# Async seeder (for admin endpoint usage)
# ---------------------------------------------------------------------------

async def seed_strategies_async(db) -> list[dict]:
    """
    Insert default strategies if they don't already exist (async version).

    Parameters
    ----------
    db : AsyncSession
        An active SQLAlchemy async session.

    Returns
    -------
    list[dict]
        Summary of each strategy: name, status ("created" | "exists"), id.
    """
    from sqlalchemy import select as sa_select

    results = []
    for s_data in DEFAULT_STRATEGIES:
        result = await db.execute(
            sa_select(Strategy).where(Strategy.name == s_data["name"])
        )
        existing = result.scalar_one_or_none()

        if existing:
            results.append({
                "name": s_data["name"],
                "status": "exists",
                "id": str(existing.id),
            })
            continue

        strategy = Strategy(
            name=s_data["name"],
            description=s_data["description"],
            rules=s_data["rules"],
            staking=s_data["staking"],
            is_active=s_data["is_active"],
        )
        db.add(strategy)
        await db.flush()  # Populate strategy.id
        results.append({
            "name": s_data["name"],
            "status": "created",
            "id": str(strategy.id),
        })

    return results


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def _make_session() -> tuple:
    """Return (engine, Session class) using the sync database URL."""
    settings = get_settings()
    engine = create_engine(settings.database_url_sync, echo=False)
    SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
    return engine, SessionLocal


def run() -> None:
    print("=" * 60)
    print("BetsPlug - Seed Default Strategies")
    print("=" * 60)

    settings = get_settings()
    print(f"Connecting to: {settings.postgres_host}:{settings.postgres_port}/{settings.postgres_db}")

    engine, SessionLocal = _make_session()

    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("Database connection OK.\n")

    # Ensure the strategies table exists
    Base.metadata.create_all(engine, tables=[Strategy.__table__], checkfirst=True)

    with SessionLocal() as db:
        print("Seeding strategies ...")
        seed_strategies_sync(db)

    print("\nDone.")
    print("=" * 60)


if __name__ == "__main__":
    run()
