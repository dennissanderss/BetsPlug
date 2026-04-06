"""Sports routes."""

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.sport import Sport
from app.schemas.sport import SportResponse

router = APIRouter()


@router.get(
    "/",
    response_model=List[SportResponse],
    summary="List all active sports",
)
async def list_sports(
    db: AsyncSession = Depends(get_db),
) -> List[SportResponse]:
    """Return all sports where ``is_active = true``, ordered alphabetically."""
    result = await db.execute(
        select(Sport)
        .where(Sport.is_active.is_(True))
        .order_by(Sport.name)
    )
    sports = result.scalars().all()
    return [SportResponse.model_validate(s) for s in sports]
