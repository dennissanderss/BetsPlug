"""Models endpoint — lightweight list of active ModelVersion rows for
transparency (v6.2).

The Trackrecord page needs to show users which models are currently
powering predictions on the platform. This endpoint exposes the
human-readable metadata (name, version, description, training metrics)
WITHOUT the raw hyperparameters / training_metrics dictionaries to keep
the payload small and avoid leaking implementation details.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.model_version import ModelVersion

logger = logging.getLogger(__name__)

router = APIRouter()


class ModelOverview(BaseModel):
    """Public summary of a ModelVersion row for the transparency panel."""

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: uuid.UUID
    name: str
    version: str
    model_type: str
    sport_scope: str
    description: Optional[str] = None
    trained_at: datetime
    is_active: bool
    accuracy: Optional[float] = Field(
        default=None,
        description="Reported training accuracy (0..1). Not a promise of future performance.",
    )
    brier_score: Optional[float] = None
    sample_size: Optional[int] = Field(
        default=None,
        description="Number of training samples used for this model version.",
    )
    hyperparameter_keys: List[str] = Field(
        default_factory=list,
        description=(
            "Names of hyperparameters this model was trained with. "
            "Values are intentionally not exposed — only the keys, for transparency."
        ),
    )


@router.get(
    "/",
    response_model=List[ModelOverview],
    summary="List prediction models used by the platform (v6.2)",
)
async def list_models(
    active_only: bool = Query(
        default=True,
        description="When true (default), only return models with is_active=True.",
    ),
    db: AsyncSession = Depends(get_db),
) -> List[ModelOverview]:
    """Return all prediction models visible to end users for transparency.

    Cached for 5 minutes — the list changes at most a few times per week
    when new model versions are trained.
    """
    from app.core.cache import cache_get, cache_set

    cache_key = f"models:list:active={active_only}"
    cached = await cache_get(cache_key)
    if cached is not None:
        try:
            return [ModelOverview.model_validate(row) for row in cached]
        except Exception:
            # Cache poisoned with an older shape → fall through to DB read.
            logger.warning("models cache miss (shape mismatch), refetching")

    q = select(ModelVersion).order_by(desc(ModelVersion.trained_at))
    if active_only:
        q = q.where(ModelVersion.is_active.is_(True))

    rows = (await db.execute(q)).scalars().all()

    items: List[ModelOverview] = []
    for mv in rows:
        hp_keys: List[str] = []
        if isinstance(mv.hyperparameters, dict):
            hp_keys = sorted(mv.hyperparameters.keys())

        items.append(
            ModelOverview(
                id=mv.id,
                name=mv.name,
                version=mv.version,
                model_type=mv.model_type,
                sport_scope=mv.sport_scope,
                description=mv.description,
                trained_at=mv.trained_at,
                is_active=mv.is_active,
                accuracy=mv.accuracy,
                brier_score=mv.brier_score,
                sample_size=mv.sample_size,
                hyperparameter_keys=hp_keys,
            )
        )

    # Serialise for cache
    try:
        await cache_set(cache_key, [i.model_dump(mode="json") for i in items], ttl=300)
    except Exception as exc:
        logger.debug("models cache_set failed (non-fatal): %s", exc)

    return items
