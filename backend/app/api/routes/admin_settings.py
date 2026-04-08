"""Admin site-settings routes."""

from typing import Dict, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.site_settings import SiteSetting

router = APIRouter()


# ---------------------------------------------------------------------------
# Response / request models
# ---------------------------------------------------------------------------


class SettingsResponse(BaseModel):
    settings: Dict[str, Optional[str]]


class SettingsUpdateRequest(BaseModel):
    settings: Dict[str, Optional[str]]


class SettingsUpdateResponse(BaseModel):
    updated: int
    settings: Dict[str, Optional[str]]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/", response_model=SettingsResponse)
async def get_settings(db: AsyncSession = Depends(get_db)):
    """Return all site settings as a {key: value} dict."""
    result = await db.execute(select(SiteSetting))
    rows = result.scalars().all()
    return SettingsResponse(settings={row.key: row.value for row in rows})


@router.put("/", response_model=SettingsUpdateResponse)
async def update_settings(
    body: SettingsUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Accept a partial update of site settings (upsert)."""
    updated_count = 0

    for key, value in body.settings.items():
        result = await db.execute(select(SiteSetting).where(SiteSetting.key == key))
        existing = result.scalar_one_or_none()

        if existing:
            existing.value = value
        else:
            db.add(SiteSetting(key=key, value=value))
        updated_count += 1

    await db.flush()

    # Return current state of all settings
    result = await db.execute(select(SiteSetting))
    rows = result.scalars().all()
    return SettingsUpdateResponse(
        updated=updated_count,
        settings={row.key: row.value for row in rows},
    )
