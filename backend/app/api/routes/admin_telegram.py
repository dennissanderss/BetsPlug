"""Admin endpoints for the @BetsPluggs Telegram auto-poster.

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
from app.core.tier_system import PickTier
from app.db.session import get_db
from app.models.match import Match
from app.models.prediction import Prediction
from app.models.telegram_post import TelegramPost
from app.services.telegram_posting import (
    _channel_for_tier,
    publish_daily_summary,
    publish_pick,
    publish_promo,
    publish_scheduled_slot,
    publish_welcome,
    select_next_tier_pick,
    update_all_pending_results,
    wipe_channel,
)
from app.services.telegram_service import health_probe as telegram_health


# ---------------------------------------------------------------------------
# Tier query-param parsing
# ---------------------------------------------------------------------------


def _parse_tier(value: Optional[str]) -> PickTier:
    """Parse the ``?tier=`` query param to a PickTier enum.

    Defaults to FREE when not provided so existing single-channel admin
    URLs keep working unchanged.
    """
    if not value:
        return PickTier.FREE
    try:
        return PickTier[value.strip().upper()]
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unknown tier — expected one of: "
                "free, silver, gold, platinum."
            ),
        )

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
    # Optional match context — only populated for pick / result-update posts
    # so the admin table can show "Stoke City vs Millwall" instead of just
    # a bare msg_id. null for summaries / promos that aren't tied to a match.
    match_home: Optional[str] = None
    match_away: Optional[str] = None
    match_league: Optional[str] = None
    match_kickoff: Optional[datetime] = None


class ScheduledSlot(BaseModel):
    """One upcoming scheduled Telegram post slot.

    The scheduler fires pick slots at 11/15/19 CET and a daily summary
    at 23:00 CET. This shape describes "what is going to happen next",
    so the admin can see at a glance when the next post goes out.
    """
    slot_cet: str = Field(..., description="Wall-clock slot in CET, e.g. '15:00'.")
    scheduled_at_utc: datetime = Field(
        ..., description="When the slot fires in UTC (always > now)."
    )
    minutes_until: int = Field(
        ..., description="Minutes from now until the slot fires."
    )
    post_type: str = Field(
        ..., description="'pick' for 11/15/19 slots, 'daily_summary' for 23:00."
    )
    day_label: str = Field(
        ...,
        description="Relative label: 'today' or 'tomorrow' or ISO date further out.",
    )


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
    channel: str = Field(
        ..., description="Free-tier channel handle (back-compat field)."
    )
    channels: dict[str, str] = Field(
        default_factory=dict,
        description=(
            "Per-tier configured channel handles "
            "(missing keys = tier not configured)."
        ),
    )
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
    summary="Force-post a specific prediction to a tier channel",
)
async def force_post_pick(
    prediction_id: UUID,
    channel: Optional[str] = Query(
        default=None,
        description="Override channel (defaults to the configured tier channel).",
    ),
    tier: Optional[str] = Query(
        default=None,
        description="Tier scope: free | silver | gold | platinum (default free).",
    ),
    db: AsyncSession = Depends(get_db),
) -> PostSummary:
    tier_enum = _parse_tier(tier)
    try:
        post = await publish_pick(
            prediction_id, db, channel=channel, tier=tier_enum
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return _post_to_summary(post)


@router.post(
    "/post-next",
    response_model=Optional[PostSummary],
    summary="Run the next scheduled-slot selection + post for a tier",
)
async def force_post_next(
    channel: Optional[str] = Query(default=None),
    tier: Optional[str] = Query(
        default=None,
        description="Tier scope: free | silver | gold | platinum (default free).",
    ),
    db: AsyncSession = Depends(get_db),
) -> Optional[PostSummary]:
    """Equivalent to the cron that runs at 11/15/19 CET. Posts the best
    available pick for the requested tier, or returns null if nothing qualifies."""
    tier_enum = _parse_tier(tier)
    post = await publish_scheduled_slot(db, channel=channel, tier=tier_enum)
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
    tier: Optional[str] = Query(default=None),
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
    tier_enum = _parse_tier(tier)
    post = await publish_daily_summary(
        db, target_date=target_date, channel=channel, tier=tier_enum,
    )
    return _post_to_summary(post) if post is not None else None


@router.post(
    "/post-promo",
    response_model=Optional[PostSummary],
    summary="Force-post the bilingual tier-comparison promo",
)
async def force_post_promo(
    channel: Optional[str] = Query(default=None),
    tier: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> Optional[PostSummary]:
    tier_enum = _parse_tier(tier)
    post = await publish_promo(db, channel=channel, tier=tier_enum)
    return _post_to_summary(post) if post is not None else None


@router.post(
    "/post-welcome",
    response_model=Optional[PostSummary],
    summary="Force-post the channel welcome / intro message",
)
async def force_post_welcome(
    channel: Optional[str] = Query(default=None),
    tier: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> Optional[PostSummary]:
    """Use after a wipe or when the pinned welcome was accidentally
    deleted. Pin the resulting message manually in the Telegram client —
    the bot doesn't assume pin-rights to keep the happy-path minimal.
    """
    tier_enum = _parse_tier(tier)
    post = await publish_welcome(db, channel=channel, tier=tier_enum)
    return _post_to_summary(post) if post is not None else None


@router.post(
    "/update-results",
    summary="Run a result-update sweep across unresolved pick posts",
)
async def force_update_results(
    channel: Optional[str] = Query(default=None),
    tier: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    tier_enum = _parse_tier(tier)
    count = await update_all_pending_results(
        db, channel=channel, tier=tier_enum
    )
    return {"updated": count}


@router.post(
    "/wipe",
    summary="Delete every auto-posted message on the channel and clear the audit",
)
async def force_wipe_channel(
    channel: Optional[str] = Query(default=None),
    tier: Optional[str] = Query(default=None),
    repost_next: bool = Query(
        default=False,
        description=(
            "When true, immediately run publish_scheduled_slot after the "
            "wipe so the channel isn't empty."
        ),
    ),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Destructive — use only when redesigning the feed from scratch.

    Iterates every row in ``telegram_posts`` for the target channel,
    calls the Bot API's ``deleteMessage``, and drops the audit row so
    the idempotency guard won't block a future repost of the same
    prediction. Set ``repost_next=true`` to chain a fresh scheduled-slot
    post right after the wipe.
    """
    tier_enum = _parse_tier(tier)
    result = await wipe_channel(db, channel=channel, tier=tier_enum)
    next_post: Optional[PostSummary] = None
    if repost_next:
        post = await publish_scheduled_slot(
            db, channel=channel, tier=tier_enum,
        )
        next_post = _post_to_summary(post) if post is not None else None
    return {
        "wipe": result,
        "next_post": next_post.model_dump(mode="json") if next_post else None,
    }


# ---------------------------------------------------------------------------
# Observational endpoints
# ---------------------------------------------------------------------------


@router.get(
    "/queue",
    response_model=list[QueueItem],
    summary="Preview the next pick the scheduler would post for a tier",
)
async def get_queue(
    channel: Optional[str] = Query(default=None),
    tier: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> list[QueueItem]:
    """Returns 0 or 1 items — the prediction the scheduler would pick
    for the requested tier right now. Useful for verifying that a new
    pick is available before the next cron runs.
    """
    settings = get_settings()
    tier_enum = _parse_tier(tier)
    target = (
        channel
        or settings.telegram_channel_test
        or _channel_for_tier(tier_enum)
    )
    if not target:
        return []
    pred = await select_next_tier_pick(db, target, tier_enum)
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
    tier: Optional[str] = Query(
        default=None,
        description=(
            "When set, scopes the listing to that tier's configured "
            "channel. Ignored when ``channel`` is provided explicitly."
        ),
    ),
    db: AsyncSession = Depends(get_db),
) -> list[PostSummary]:
    if not channel and tier:
        tier_enum = _parse_tier(tier)
        configured = _channel_for_tier(tier_enum)
        if configured:
            channel = configured
        else:
            # Tier requested but its channel isn't configured yet — return
            # an empty history rather than dumping everything.
            return []
    # Eager-load prediction → match → teams & league so the admin table
    # can show "Stoke City vs Millwall · Championship" instead of a bare
    # msg_id. Keeps the query count flat regardless of row count.
    stmt = (
        select(TelegramPost)
        .options(
            selectinload(TelegramPost.prediction)
            .selectinload(Prediction.match)
            .selectinload(Match.home_team),
            selectinload(TelegramPost.prediction)
            .selectinload(Prediction.match)
            .selectinload(Match.away_team),
            selectinload(TelegramPost.prediction)
            .selectinload(Prediction.match)
            .selectinload(Match.league),
        )
        .order_by(TelegramPost.posted_at.desc())
    )
    if post_type:
        stmt = stmt.where(TelegramPost.post_type == post_type)
    if channel:
        stmt = stmt.where(TelegramPost.channel == channel)
    stmt = stmt.limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return [_post_to_summary(r) for r in rows]


@router.get(
    "/schedule",
    response_model=list[ScheduledSlot],
    summary="Upcoming scheduled Telegram slots (today + tomorrow)",
)
async def get_schedule(
    count: int = Query(default=8, ge=1, le=20),
    tier: Optional[str] = Query(
        default=None,
        description=(
            "Tier scope — when its channel isn't configured, returns []."
        ),
    ),
) -> list[ScheduledSlot]:
    # Tiers without a configured channel have no scheduled cron jobs
    # registered, so the upcoming-slots preview must return an empty list
    # for them — otherwise the admin panel would show phantom 11:00/15:00
    # slots that will never fire.
    tier_enum = _parse_tier(tier)
    if not _channel_for_tier(tier_enum):
        return []
    """Return the next N scheduled auto-poster slots with wall-clock times.

    Pick slots fire at 11:00 / 15:00 / 19:00 CET, daily summary at 23:00
    CET. We enumerate today's remaining slots and extend into tomorrow
    until we have ``count`` entries. The admin uses this to know exactly
    when the next post is going out without grepping scheduler logs.
    """
    # CET is either UTC+1 (winter) or UTC+2 (summer, DST). We approximate
    # by asking Python what CET maps to right now via zoneinfo so the
    # answer stays correct across the year.
    try:
        from zoneinfo import ZoneInfo

        cet = ZoneInfo("Europe/Amsterdam")
    except Exception:  # noqa: BLE001
        # Fallback: fixed UTC+1. Acceptable for non-zoneinfo hosts,
        # will drift an hour during DST but never breaks the endpoint.
        from datetime import timedelta, timezone as tz

        cet = tz(timedelta(hours=1))

    now_utc = datetime.now(timezone.utc)
    now_cet = now_utc.astimezone(cet)

    pick_hours = [11, 15, 19]
    summary_hour = 23

    slots: list[tuple[int, str]] = [
        *[(h, "pick") for h in pick_hours],
        (summary_hour, "daily_summary"),
    ]

    out: list[ScheduledSlot] = []
    day_offset = 0
    while len(out) < count and day_offset < 7:
        base_day = now_cet.date()
        from datetime import timedelta

        target_day = base_day + timedelta(days=day_offset)
        day_label = (
            "today"
            if day_offset == 0
            else "tomorrow"
            if day_offset == 1
            else target_day.isoformat()
        )
        for hour, post_type in slots:
            slot_cet_dt = datetime(
                target_day.year,
                target_day.month,
                target_day.day,
                hour,
                0,
                tzinfo=cet,
            )
            if slot_cet_dt <= now_cet:
                continue
            slot_utc = slot_cet_dt.astimezone(timezone.utc)
            minutes_until = int((slot_utc - now_utc).total_seconds() // 60)
            out.append(
                ScheduledSlot(
                    slot_cet=f"{hour:02d}:00",
                    scheduled_at_utc=slot_utc,
                    minutes_until=minutes_until,
                    post_type=post_type,
                    day_label=day_label,
                )
            )
            if len(out) >= count:
                break
        day_offset += 1

    return out


@router.get(
    "/debug-env",
    summary="Diagnostic: raw env vs Pydantic Settings for tier channels",
)
async def debug_env() -> dict[str, Any]:
    """Return the live process env vs what Pydantic Settings loaded.

    Diagnostic-only — admin-gated. Use to confirm whether a Railway
    env var has actually propagated to the running container after a
    redeploy. If the ``env_*`` value is set but the ``settings_*``
    value is empty, you've hit a Pydantic validation_alias edge case
    and the defensive fallback in ``_channel_for_tier`` should still
    use the env value.
    """
    import os

    settings = get_settings()
    # Enumerate every TELEGRAM-prefixed key actually present in
    # os.environ so we can spot whitespace-corrupted variants the
    # operator can't see in the Railway UI (e.g. " TELEGRAM_CHANNEL_GOLD"
    # with a leading space, or non-breaking-space copy-paste residue).
    telegram_env_keys = sorted(
        k for k in os.environ.keys() if k.upper().startswith("TELEGRAM")
    )
    return {
        "settings_silver": settings.telegram_channel_silver,
        "settings_gold": settings.telegram_channel_gold,
        "settings_platinum": settings.telegram_channel_platinum,
        "env_silver": os.getenv("TELEGRAM_CHANNEL_SILVER", ""),
        "env_gold": os.getenv("TELEGRAM_CHANNEL_GOLD", ""),
        "env_platinum": os.getenv("TELEGRAM_CHANNEL_PLATINUM", ""),
        "all_telegram_env_keys": telegram_env_keys,
        # Resolved values that channel-resolution will actually use —
        # this is the source of truth the scheduler / publisher follow.
        "resolved_silver": _channel_for_tier(PickTier.SILVER),
        "resolved_gold": _channel_for_tier(PickTier.GOLD),
        "resolved_platinum": _channel_for_tier(PickTier.PLATINUM),
    }


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
    tier_channels: dict[str, str] = {}
    for slug, handle in (
        ("free", settings.telegram_channel_free),
        ("silver", settings.telegram_channel_silver),
        ("gold", settings.telegram_channel_gold),
        ("platinum", settings.telegram_channel_platinum),
    ):
        if handle:
            tier_channels[slug] = handle
    return HealthResponse(
        configured=bool(settings.telegram_bot_token),
        channel=settings.telegram_channel_free,
        channels=tier_channels,
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

    # Each entry is (handle, tier_slug, is_primary, is_test). One primary
    # row per configured tier-channel + one optional test override.
    configured: list[tuple[str, str, bool, bool]] = []
    tier_channel_pairs = [
        ("free", settings.telegram_channel_free),
        ("silver", settings.telegram_channel_silver),
        ("gold", settings.telegram_channel_gold),
        ("platinum", settings.telegram_channel_platinum),
    ]
    for tier_slug, handle in tier_channel_pairs:
        if handle:
            configured.append((handle, tier_slug, True, False))
    if settings.telegram_channel_test:
        configured.append(
            (settings.telegram_channel_test, "test", False, True)
        )

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
    match_home: Optional[str] = None
    match_away: Optional[str] = None
    match_league: Optional[str] = None
    match_kickoff: Optional[datetime] = None

    match = getattr(getattr(post, "prediction", None), "match", None)
    if match is not None:
        if match.home_team is not None:
            match_home = match.home_team.name
        if match.away_team is not None:
            match_away = match.away_team.name
        if match.league is not None:
            match_league = match.league.name
        match_kickoff = match.scheduled_at

    return PostSummary(
        id=str(post.id),
        prediction_id=str(post.prediction_id) if post.prediction_id else None,
        channel=post.channel,
        telegram_message_id=post.telegram_message_id,
        post_type=post.post_type,
        posted_at=post.posted_at,
        result_posted_at=post.result_posted_at,
        match_home=match_home,
        match_away=match_away,
        match_league=match_league,
        match_kickoff=match_kickoff,
    )
