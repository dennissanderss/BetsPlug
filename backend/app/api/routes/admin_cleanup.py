"""Admin cleanup: remove strategies without real data."""

import logging

from fastapi import APIRouter, Depends
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.strategy import Strategy

router = APIRouter()
log = logging.getLogger(__name__)

# Original 4 strategies that had the skip-bug (all 300 picks matched every strategy)
BUGGY_ORIGINALS = {"Value Home", "High Confidence Favorites", "Underdog Edge", "Form Mismatch"}

# Strategies that had 0 picks in research
ZERO_PICKS = {"High Confidence Any", "Draw Specialist"}


@router.post("/cleanup-strategies", summary="Remove buggy and empty strategies")
async def cleanup_strategies(db: AsyncSession = Depends(get_db)):
    """Remove strategies that are broken or have no useful data."""
    removed = []

    for name in BUGGY_ORIGINALS | ZERO_PICKS:
        result = await db.execute(select(Strategy).where(Strategy.name == name))
        strat = result.scalar_one_or_none()
        if strat:
            await db.delete(strat)
            removed.append(name)
            log.info("Removed strategy: %s", name)

    await db.commit()
    return {"removed": removed, "count": len(removed)}
