"""Admin endpoints for the @BetsPlug Telegram auto-poster.

Mounted at `/api/admin/telegram`, gated behind ``require_admin`` at the
router registration level in ``app/api/routes/__init__.py``.

Two flavours of endpoint:

* **Operational** — force-post, force-summary, result-sweep. Lets you
  trigger the scheduler jobs on demand while you verify the channel
  setup, without waiting for 11:00 CET.
* **Observational** — queue (what the next scheduled slot would pick),
  posts history, bot health probe. Lets you answer "did yesterday's
  19:00 run actually fire?" without SSH-ing into Railway.
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.db.session import get_db
from app.models.match import Match
from app.models.prediction import Prediction
from app.models.telegram_post import TelegramPost
from app.services.telegram_posting import (
    publish_daily_summary,
    publish_pick,
    publish_scheduled_slot,
    select_next_free_pick,
    update_all_pending_results,
)
from app.services.telegram_service import health_probe as telegram_health

router = APIRouter()


# ---------------------------------------------------------------------------
# Response schemas — kept simple, no ORM leakage
# ---------------------------------------------------------------------------


class PostSummary(BaseModel):
    id: str
    prediction_id: Optional[str] = None
    channel: str
    telegram_message_id: int
    post_type: str
    posted_at: datetime
    result_posted_at: Optional[datetime] = None


class QueueItem(BaseModel):
    prediction_id: str
    match_id: str
    league: Optional[str]
    home: Optional[str]
    away: Optional[str]
    kickoff: datetime
    pick: Optional[str]
    home_win_prob: float
    draw_prob: Optional[float]
    away_win_prob: float
    confidence: float


class HealthResponse(BaseModel):
    configured: bool = Field(
        ..., description="True when TELEGRAM_BOT_TOKEN is set."
    )
    channel: str
    bot: Optional[dict] = Field(
        None, description="Raw `getMe` response when the token is valid."
    )


class ChannelOverview(BaseModel):
    """Aggregate stats for one Telegram channel we post to.

    Single source of truth for the admin dashboard's per-channel card —
    the UI shouldn't have to compute these from the /posts history.
    """
    channel: str
    tier: str = Field(
        ...,
        description=(
            "Logical tier this channel covers (currently always 'free'; "
            "Silver/Gold/Platinum channels will surface here when added)."
        ),
    )
    is_primary: bool = Field(
        ..., description="True for the channel configured as FREE primary."
    )
    is_test: bool = Field(
        ..., description="True when this is the optional TELEGRAM_CHANNEL_TEST."
    )
    total_posts: int
    picks_posted: int
    picks_with_result: int
    picks_pending_result: int
    summaries_posted: int
    last_post_at: Optional[datetime] = None
    last_post_type: Optional[str] = None
    scheduled_slots_cet: list[str] = Field(
        default_factory=lambda: ["11:00", "15:00", "19:00"],
        description="APScheduler cron times for pick posting (CET).",
    )
    summary_slot_cet: str = "23:00"


# ---------------------------------------------------------------------------
# Operational endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/post-pick/{prediction_id}",
    response_model=PostSummary,
    summary="Force-post a specific prediction to the @BetsPlug channel",
)
async def force_post_pick(
    prediction_id: UUID,
    channel: Optional[str] = Query(
        default=None,
        description="Override channel (defaults to TELEGRAM_CHANNEL_FREE).",
    ),
    db: AsyncSession = Depends(get_db),
) -> PostSummary:
    try:
        post = await publish_pick(prediction_id, db, channel=channel)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return _post_to_summary(post)


@router.post(
    "/post-next",
    response_model=Optional[PostSummary],
    summary="Run the next scheduled-slot selection + post",
)
async def force_post_next(
    channel: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> Optional[PostSummary]:
    """Equivalent to the cron that runs at 11/15/19 CET. Posts the best
    available Free pick right now, or returns null if nothing qualifies."""
    post = await publish_scheduled_slot(db, channel=channel)
    return _post_to_summary(post) if post is not None else None


class PostSummaryBody(BaseModel):
    date: Optional[str] = Field(
        default=None,
        description=(
            "Date in YYYY-MM-DD (Europe/Amsterdam). Defaults to today."
        ),
    )


@router.post(
    "/post-summary",
    response_model=Optional[PostSummary],
    summary="Force-post the bilingual daily summary",
)
async def force_post_summary(
    body: PostSummaryBody,
    channel: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> Optional[PostSummary]:
    target_date: Optional[date] = None
    if body.date:
        try:
            target_date = date.fromisoformat(body.date)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="date must be YYYY-MM-DD",
            )
    post = await publish_daily_summary(
        db, target_date=target_date, channel=channel
    )
    return _post_to_summary(post) if post is not None else None


@router.post(
    "/update-results",
    summary="Run a result-update sweep across unresolved pick posts",
)
async def force_update_results(
    channel: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    count = await update_all_pending_results(db, channel=channel)
    return {"updated": count}


# ---------------------------------------------------------------------------
# Observational endpoints
# ---------------------------------------------------------------------------


@router.get(
    "/queue",
    response_model=list[QueueItem],
    summary="Preview the next Free pick the scheduler would post",
)
async def get_queue(
    channel: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> list[QueueItem]:
    """Returns 0 or 1 items — the prediction `publish_scheduled_slot`
    would pick if called right now. Useful for verifying that a new
    Free pick is available before the next cron runs.
    """
    settings = get_settings()
    target = channel or settings.telegram_channel_test or settings.telegram_channel_free
    pred = await select_next_free_pick(db, target)
    if pred is None:
        return []
    match = pred.match
    from app.services.telegram_templates import _infer_pick
    return [
        QueueItem(
            prediction_id=str(pred.id),
            match_id=str(match.id),
            league=match.league.name if match.league else None,
            home=match.home_team.name if match.home_team else None,
            away=match.away_team.name if match.away_team else None,
            kickoff=match.scheduled_at,
            pick=_infer_pick(pred),
            home_win_prob=pred.home_win_prob,
            draw_prob=pred.draw_prob,
            away_win_prob=pred.away_win_prob,
            confidence=pred.confidence,
        )
    ]


@router.get(
    "/posts",
    response_model=list[PostSummary],
    summary="History of Telegram posts (most recent first)",
)
async def list_posts(
    limit: int = Query(default=50, ge=1, le=500),
    post_type: Optional[str] = Query(default=None),
    channel: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> list[PostSummary]:
    stmt = select(TelegramPost).order_by(TelegramPost.posted_at.desc())
    if post_type:
        stmt = stmt.where(TelegramPost.post_type == post_type)
    if channel:
        stmt = stmt.where(TelegramPost.channel == channel)
    stmt = stmt.limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return [_post_to_summary(r) for r in rows]


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Verify bot token + channel configuration",
)
async def get_health() -> HealthResponse:
    settings = get_settings()
    bot = None
    if settings.telegram_bot_token:
        bot = await telegram_health()
    return HealthResponse(
        configured=bool(settings.telegram_bot_token),
        channel=settings.telegram_channel_free,
        bot=bot,
    )


@router.get(
    "/channels",
    response_model=list[ChannelOverview],
    summary="Per-channel activity overview",
)
async def get_channels_overview(
    db: AsyncSession = Depends(get_db),
) -> list[ChannelOverview]:
    """Aggregate stats for every channel this instance is configured to
    post to, plus any *other* channel we have historical posts for.

    The union means rotating the production channel handle (or adding a
    Silver/Gold/Platinum channel later) never hides old post history —
    any channel that ever received a post stays visible here.
    """
    settings = get_settings()

    configured = []
    if settings.telegram_channel_free:
        configured.append((settings.telegram_channel_free, "free", True, False))
    if settings.telegram_channel_test:
        configured.append((settings.telegram_channel_test, "free", False, True))

    # Pull every channel we've ever posted to from the audit table so
    # stale handles don't disappear from the dashboard.
    historical_stmt = select(TelegramPost.channel).distinct()
    historical = {
        c for (c,) in (await db.execute(historical_stmt)).all() if c
    }

    configured_channels = {c[0] for c in configured}
    for extra in historical - configured_channels:
        # Historical-only channel — mark neither primary nor test so
        # the UI can render it as "archived" / not currently active.
        configured.append((extra, "unknown", False, False))

    overviews: list[ChannelOverview] = []
    for handle, tier, is_primary, is_test in configured:
        stmt = select(TelegramPost).where(TelegramPost.channel == handle)
        rows = (await db.execute(stmt)).scalars().all()

        total = len(rows)
        picks = [r for r in rows if r.post_type == "pick"]
        picks_done = [r for r in picks if r.result_posted_at is not None]
        picks_pending = [r for r in picks if r.result_posted_at is None]
        summaries = [r for r in rows if r.post_type == "daily_summary"]

        last = max(rows, key=lambda r: r.posted_at) if rows else None

        overviews.append(
            ChannelOverview(
                channel=handle,
                tier=tier,
                is_primary=is_primary,
                is_test=is_test,
                total_posts=total,
                picks_posted=len(picks),
                picks_with_result=len(picks_done),
                picks_pending_result=len(picks_pending),
                summaries_posted=len(summaries),
                last_post_at=last.posted_at if last else None,
                last_post_type=last.post_type if last else None,
            )
        )

    # Sort: primary first, then test, then archived, alphabetical
    # within each group.
    def _sort_key(o: ChannelOverview) -> tuple[int, str]:
        if o.is_primary:
            return (0, o.channel)
        if o.is_test:
            return (1, o.channel)
        return (2, o.channel)

    overviews.sort(key=_sort_key)
    return overviews


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _post_to_summary(post: TelegramPost) -> PostSummary:
    return PostSummary(
        id=str(post.id),
        prediction_id=str(post.prediction_id) if post.prediction_id else None,
        channel=post.channel,
        telegram_message_id=post.telegram_message_id,
        post_type=post.post_type,
        posted_at=post.posted_at,
        result_posted_at=post.result_posted_at,
    )
