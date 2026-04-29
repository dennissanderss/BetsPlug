"""High-level @BetsPluggs publishing orchestration.

Sits between the dumb `telegram_service` (HTTP wrapper) and the
scheduler tasks / admin endpoints. Decides *which* prediction to post
next, renders the bilingual body via `telegram_templates`, writes to
the `telegram_posts` audit table, and updates already-posted picks in
place when the fixture resolves.

Why its own file (not inside `telegram_service.py`):
    - Keeps the HTTP wrapper free of ORM + SQLAlchemy dependencies so
      it stays trivially mockable.
    - Lets us unit-test the selection logic (cutoff windows, tier
      filtering, skip-if-already-posted) without hitting Telegram.

Selection semantics for Free-tier picks:
    - Prediction's latest-prediction classification lands in FREE band
      (league in LEAGUES_FREE, confidence in ``[0.55, 0.65)``).
    - Match is SCHEDULED, kicks off within the next 48 hours.
    - No existing row in `telegram_posts` with (prediction_id,
      post_type='pick', channel=<target>).
    - Sort: highest max-outcome-probability first so the best Free pick
      of the batch goes out at 11:00 CET and weaker ones at 15/19:00.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, time, timedelta, timezone
from typing import Any, Optional
from zoneinfo import ZoneInfo

from sqlalchemy import and_, func, not_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.tier_leagues import (
    LEAGUES_FREE,
    LEAGUES_GOLD,
    LEAGUES_PLATINUM,
    LEAGUES_SILVER,
)
from app.core.tier_system import (
    CONF_THRESHOLD,
    PickTier,
    TIER_SYSTEM_ENABLED,
    access_filter,
)
from app.models.match import Match, MatchStatus
from app.models.odds import OddsHistory
from app.models.prediction import Prediction, PredictionEvaluation
from app.models.telegram_post import TelegramPost
from app.services.telegram_service import (
    TelegramError,
    delete_message,
    post_to_channel,
    update_message,
)
from app.services.telegram_templates import (
    render_daily_summary,
    render_pick_message,
    render_pick_with_graded_banner,
    render_promo_message,
    render_result_update,
    render_welcome_message,
)


logger = logging.getLogger(__name__)

CET = ZoneInfo("Europe/Amsterdam")


# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------


def _channel_for_tier(tier: PickTier) -> str:
    """Return the configured Telegram channel handle for a given tier.

    Empty string when the tier's channel env var isn't set yet — callers
    should treat that as "not configured, skip silently" rather than
    posting somewhere wrong.

    Reads via Pydantic Settings first, then falls back to a raw
    ``os.getenv()`` lookup. The fallback exists because we hit a case
    on Railway where Settings had loaded ``TELEGRAM_CHANNEL_SILVER`` at
    boot but not ``_GOLD`` / ``_PLATINUM`` even though Railway's
    Variables UI showed all three set — likely an env propagation or
    invisible-whitespace edge case in the host's Variables editor. The
    raw ``os.getenv()`` reads from the live process env and bypasses
    whatever Pydantic missed, so a fresh redeploy or a Variables edit
    is reflected immediately without code changes.
    """
    import os

    settings = get_settings()
    pyd_by_tier: dict[PickTier, str] = {
        PickTier.FREE: settings.telegram_channel_free,
        PickTier.SILVER: settings.telegram_channel_silver,
        PickTier.GOLD: settings.telegram_channel_gold,
        PickTier.PLATINUM: settings.telegram_channel_platinum,
    }
    env_by_tier: dict[PickTier, str] = {
        PickTier.FREE: "TELEGRAM_CHANNEL_FREE",
        PickTier.SILVER: "TELEGRAM_CHANNEL_SILVER",
        PickTier.GOLD: "TELEGRAM_CHANNEL_GOLD",
        PickTier.PLATINUM: "TELEGRAM_CHANNEL_PLATINUM",
    }
    primary = pyd_by_tier.get(tier, "") or ""
    if primary:
        return primary.strip()
    env_name = env_by_tier.get(tier, "")
    if not env_name:
        return ""
    return (os.getenv(env_name, "") or "").strip()


def _resolve_channel(
    channel: Optional[str],
    tier: PickTier = PickTier.FREE,
) -> str:
    """Resolve the target channel: explicit arg > test override > tier default.

    The ``TELEGRAM_CHANNEL_TEST`` env var is a safety hatch for staging
    so a misconfigured job never posts to a public channel by accident.
    When set, scheduled tasks route there instead of the production
    handle for *every* tier — that way one env flip on Railway gives a
    clean dry-run path across all tiers without touching code.
    """
    if channel:
        return channel
    settings = get_settings()
    if settings.telegram_channel_test:
        return settings.telegram_channel_test
    return _channel_for_tier(tier)


async def _load_prediction(
    prediction_id: Any, db: AsyncSession
) -> Optional[Prediction]:
    """Eager-load Prediction + Match + teams + league + result.

    The template renderers need all of these — pulling them in one
    selectinload batch keeps the hot path down to a single DB round trip.
    """
    stmt = (
        select(Prediction)
        .options(
            selectinload(Prediction.match).selectinload(Match.home_team),
            selectinload(Prediction.match).selectinload(Match.away_team),
            selectinload(Prediction.match).selectinload(Match.league),
            selectinload(Prediction.match).selectinload(Match.result),
        )
        .where(Prediction.id == prediction_id)
    )
    return (await db.execute(stmt)).scalar_one_or_none()


async def _latest_odds_for_match(
    match_id: Any, db: AsyncSession
) -> tuple[Optional[float], Optional[float], Optional[float]]:
    """Return (home, draw, away) decimal odds for the latest snapshot, or Nones.

    Uses the most-recent OddsHistory row for the match so the Telegram
    post carries the same pre-match odds the website shows. Odds are
    optional — a missing row just renders em-dashes, no crash.
    """
    stmt = (
        select(OddsHistory)
        .where(
            OddsHistory.match_id == match_id,
            # Only the 1X2 market has home/draw/away odds columns.
            OddsHistory.market == "1x2",
        )
        .order_by(OddsHistory.recorded_at.desc())
        .limit(1)
    )
    row = (await db.execute(stmt)).scalar_one_or_none()
    if row is None:
        return (None, None, None)
    return (row.home_odds, row.draw_odds, row.away_odds)


async def _weekly_accuracy_pct(db: AsyncSession) -> Optional[float]:
    """Return running 7-day Free-tier accuracy as 0-100, or None when empty."""
    from sqlalchemy import Integer, case
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    stmt = select(
        func.count(PredictionEvaluation.id),
        func.sum(
            case(
                (PredictionEvaluation.is_correct.is_(True), 1),
                else_=0,
            )
        ),
    ).where(PredictionEvaluation.evaluated_at >= seven_days_ago)
    row = (await db.execute(stmt)).first()
    if not row or not row[0]:
        return None
    total, correct = int(row[0] or 0), int(row[1] or 0)
    if total == 0:
        return None
    return round(100 * correct / total, 1)


async def _already_posted(
    prediction_id: Any,
    channel: str,
    post_type: str,
    db: AsyncSession,
) -> Optional[TelegramPost]:
    """Return the existing TelegramPost row (or None) for this key."""
    stmt = select(TelegramPost).where(
        TelegramPost.prediction_id == prediction_id,
        TelegramPost.post_type == post_type,
        TelegramPost.channel == channel,
    )
    return (await db.execute(stmt)).scalar_one_or_none()


# ---------------------------------------------------------------------------
# Selection — next pick eligible for the scheduled slot, per tier
# ---------------------------------------------------------------------------


def _exact_tier_filter(tier: PickTier):
    """SQLAlchemy WHERE expression: prediction is classified EXACTLY as ``tier``.

    Mirrors the logic of ``pick_tier_expression()`` from ``tier_system``,
    but as a boolean instead of a CASE — qualifies for the requested tier
    AND does not qualify for any higher tier. Used by the per-tier
    Telegram channels so each tier's feed only carries its own
    classified picks (a Silver-classified pick goes to the Silver
    channel only, never echoed on Free).
    """
    qual_pl = and_(
        Match.league_id.in_(LEAGUES_PLATINUM),
        Prediction.confidence >= CONF_THRESHOLD[PickTier.PLATINUM],
    )
    qual_gd = and_(
        Match.league_id.in_(LEAGUES_GOLD),
        Prediction.confidence >= CONF_THRESHOLD[PickTier.GOLD],
    )
    qual_sl = and_(
        Match.league_id.in_(LEAGUES_SILVER),
        Prediction.confidence >= CONF_THRESHOLD[PickTier.SILVER],
    )
    qual_fr = and_(
        Match.league_id.in_(LEAGUES_FREE),
        Prediction.confidence >= CONF_THRESHOLD[PickTier.FREE],
    )

    if tier == PickTier.PLATINUM:
        return qual_pl
    if tier == PickTier.GOLD:
        return and_(qual_gd, not_(qual_pl))
    if tier == PickTier.SILVER:
        return and_(qual_sl, not_(qual_pl), not_(qual_gd))
    # FREE
    return and_(qual_fr, not_(qual_pl), not_(qual_gd), not_(qual_sl))


async def select_next_tier_pick(
    db: AsyncSession,
    channel: str,
    tier: PickTier = PickTier.FREE,
) -> Optional[Prediction]:
    """Return the next prediction classified as ``tier`` and eligible to post.

    Filters:
        - Pick is classified exactly as ``tier`` (not bumped to a higher
          tier; not below the tier's confidence floor).
        - Match scheduled in the next 48h.
        - Not already posted to ``channel`` with post_type='pick'.

    Sort: greatest(home, draw, away) probability DESC, so the first
    slot of the day gets the best available pick for that tier.
    """
    from sqlalchemy import func as sfunc

    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(hours=48)

    max_prob_expr = sfunc.greatest(
        Prediction.home_win_prob,
        sfunc.coalesce(Prediction.draw_prob, 0.0),
        Prediction.away_win_prob,
    )

    # Subquery of prediction_ids already posted to this channel as picks.
    posted_subq = (
        select(TelegramPost.prediction_id)
        .where(
            TelegramPost.channel == channel,
            TelegramPost.post_type == "pick",
            TelegramPost.prediction_id.is_not(None),
        )
        .scalar_subquery()
    )

    stmt = (
        select(Prediction)
        .join(Match, Match.id == Prediction.match_id)
        .options(
            selectinload(Prediction.match).selectinload(Match.home_team),
            selectinload(Prediction.match).selectinload(Match.away_team),
            selectinload(Prediction.match).selectinload(Match.league),
        )
        .where(
            and_(
                Match.status == MatchStatus.SCHEDULED,
                Match.scheduled_at >= now,
                Match.scheduled_at <= cutoff,
                Prediction.confidence >= CONF_THRESHOLD[tier],
                ~Prediction.id.in_(posted_subq),
            )
        )
        .order_by(max_prob_expr.desc())
        .limit(1)
    )
    if TIER_SYSTEM_ENABLED:
        # Pre-tier-system rollback path: skip the strict classifier so a
        # rollback environment still posts something sensible. With the
        # flag on (default), every tier's channel sees only its own
        # classified picks.
        stmt = stmt.where(_exact_tier_filter(tier))
    return (await db.execute(stmt)).scalar_one_or_none()


async def select_next_free_pick(
    db: AsyncSession, channel: str
) -> Optional[Prediction]:
    """Backward-compatible alias — Free-tier slot selector.

    Existing callers (admin queue endpoint, scheduler job) keep working
    while new tier-aware code calls ``select_next_tier_pick`` directly.
    """
    return await select_next_tier_pick(db, channel, PickTier.FREE)


# ---------------------------------------------------------------------------
# Public orchestration API
# ---------------------------------------------------------------------------


async def publish_pick(
    prediction_id: Any,
    db: AsyncSession,
    channel: Optional[str] = None,
    tier: PickTier = PickTier.FREE,
) -> TelegramPost:
    """Post a specific prediction to Telegram + record in `telegram_posts`.

    Idempotent: if we've already posted this (prediction_id, 'pick',
    channel) tuple we return the existing row untouched. Used by both
    the scheduled slot tasks and the admin "force post" endpoint.

    ``tier`` only affects channel resolution when ``channel`` is None —
    once a channel is chosen, the same prediction body is rendered for
    every tier (the tier signal is in *which channel* it lands on, not
    in the message itself).
    """
    target = _resolve_channel(channel, tier)
    existing = await _already_posted(prediction_id, target, "pick", db)
    if existing:
        logger.info(
            "telegram: pick already posted prediction=%s msg=%s",
            prediction_id,
            existing.telegram_message_id,
        )
        return existing

    prediction = await _load_prediction(prediction_id, db)
    if prediction is None:
        raise ValueError(f"Prediction {prediction_id} not found.")

    odds_home, odds_draw, odds_away = await _latest_odds_for_match(
        prediction.match_id, db
    )
    body = render_pick_message(
        prediction,
        odds_home=odds_home,
        odds_draw=odds_draw,
        odds_away=odds_away,
    )
    message_id = await post_to_channel(target, body)

    post = TelegramPost(
        prediction_id=prediction.id,
        channel=target,
        telegram_message_id=message_id,
        post_type="pick",
        posted_at=datetime.now(timezone.utc),
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post


async def publish_scheduled_slot(
    db: AsyncSession,
    channel: Optional[str] = None,
    tier: PickTier = PickTier.FREE,
) -> Optional[TelegramPost]:
    """Pick the best eligible prediction for ``tier`` and post it.

    Returns the created TelegramPost, or None when there's nothing
    eligible (e.g. all picks of the day already posted, or the tier's
    channel isn't configured yet).
    """
    target = _resolve_channel(channel, tier)
    if not target:
        logger.info(
            "telegram: tier=%s channel not configured, skipping slot",
            tier.name,
        )
        return None
    candidate = await select_next_tier_pick(db, target, tier)
    if candidate is None:
        logger.info(
            "telegram: no eligible %s pick to post right now", tier.name
        )
        return None
    return await publish_pick(candidate.id, db, channel=target, tier=tier)


async def publish_result_update(
    post: TelegramPost, db: AsyncSession
) -> bool:
    """Publish the result of a resolved pick in TWO places:

    1. A NEW reply message under the original pick — fires a fresh
       Telegram push notification and surfaces the verdict in the live
       channel scroll, so users who joined after the pick was published
       (or who missed the pick post) still see "we called X vs Y, it
       was ✅ / ❌". Telegram auto-renders a quote-preview of the
       parent pick above the reply, which is exactly the context the
       reader needs.
    2. An in-place EDIT of the original pick post that prepends a
       GRADED banner — so anyone scrolling back days later still sees
       the verdict on the pick itself, not just in a reply thread
       buried below the fold.

    Returns True when both steps succeeded (or were no-ops because the
    message had already been edited earlier), False when the fixture
    isn't finished yet or the evaluator hasn't scored the prediction.
    Idempotent: `result_posted_at` guards against double-publishing.
    """
    if post.result_posted_at is not None:
        return False

    prediction = await _load_prediction(post.prediction_id, db)
    if prediction is None:
        logger.warning(
            "telegram: cannot update post %s — prediction gone", post.id
        )
        return False
    match = prediction.match
    if match.status != MatchStatus.FINISHED or not match.result:
        return False

    # Pull the evaluation row so we know if the pick was correct. When
    # it's missing (evaluator hasn't run yet) we skip the update rather
    # than guessing a verdict.
    ev_stmt = select(PredictionEvaluation).where(
        PredictionEvaluation.prediction_id == prediction.id
    )
    evaluation = (await db.execute(ev_stmt)).scalar_one_or_none()
    if evaluation is None:
        return False

    home_score = match.result.home_score
    away_score = match.result.away_score
    was_correct = bool(evaluation.is_correct)
    weekly = await _weekly_accuracy_pct(db)

    # ─── Step 1: reply-post with the full verdict. This is the one
    #     users actually see as a notification, so it takes priority —
    #     we short-circuit with a False return if it fails, leaving
    #     result_posted_at=null so the sweep retries on the next run.
    reply_body = render_result_update(
        prediction,
        home_score=home_score,
        away_score=away_score,
        was_correct=was_correct,
        weekly_accuracy_pct=weekly,
    )
    try:
        reply_message_id = await post_to_channel(
            post.channel,
            reply_body,
            reply_to_message_id=post.telegram_message_id,
        )
    except TelegramError as e:
        logger.error("telegram: result-reply send failed: %s", e)
        return False

    # Audit the reply as a separate row — lets the admin dashboard
    # count "posts with result" vs "picks pending" correctly and makes
    # the history table show both the pick and its verdict reply.
    reply_row = TelegramPost(
        prediction_id=prediction.id,
        channel=post.channel,
        telegram_message_id=reply_message_id,
        post_type="result_update",
        posted_at=datetime.now(timezone.utc),
    )
    db.add(reply_row)

    # ─── Step 2: best-effort edit of the original pick post. The
    #     current Bot API doesn't return the original post body, so
    #     we re-render it from the prediction + odds and prepend the
    #     GRADED banner. A failure here is NOT fatal — the reply has
    #     already delivered the verdict, and we still mark the row
    #     resolved so the sweep doesn't keep retrying forever.
    try:
        odds_home, odds_draw, odds_away = await _latest_odds_for_match(
            prediction.match_id, db
        )
        original_body = render_pick_message(
            prediction,
            odds_home=odds_home,
            odds_draw=odds_draw,
            odds_away=odds_away,
        )
        edit_body = render_pick_with_graded_banner(
            original_body,
            home_score=home_score,
            away_score=away_score,
            was_correct=was_correct,
        )
        await update_message(
            post.channel, post.telegram_message_id, edit_body
        )
    except TelegramError as e:
        logger.warning(
            "telegram: graded-banner edit failed (reply was posted): %s", e
        )
    except Exception as e:  # pragma: no cover — defensive
        logger.warning(
            "telegram: graded-banner render failed (reply was posted): %s", e
        )

    post.result_posted_at = datetime.now(timezone.utc)
    await db.commit()
    return True


async def publish_daily_summary(
    db: AsyncSession,
    target_date: Optional[date] = None,
    channel: Optional[str] = None,
    tier: PickTier = PickTier.FREE,
) -> Optional[TelegramPost]:
    """Post the bilingual daily summary for ``target_date`` (CET).

    Returns None when no pick-type posts exist for that date — we don't
    publish an empty summary.
    """
    target_ch = _resolve_channel(channel, tier)
    if not target_ch:
        logger.info(
            "telegram: tier=%s channel not configured, skipping summary",
            tier.name,
        )
        return None
    if target_date is None:
        target_date = datetime.now(CET).date()

    # Build [start, end) window in UTC for the CET calendar day.
    start_cet = datetime.combine(target_date, time.min, CET)
    end_cet = start_cet + timedelta(days=1)
    start_utc = start_cet.astimezone(timezone.utc)
    end_utc = end_cet.astimezone(timezone.utc)

    posts_stmt = (
        select(TelegramPost)
        .where(
            TelegramPost.channel == target_ch,
            TelegramPost.post_type == "pick",
            TelegramPost.posted_at >= start_utc,
            TelegramPost.posted_at < end_utc,
        )
        .order_by(TelegramPost.posted_at)
    )
    posts = (await db.execute(posts_stmt)).scalars().all()
    if not posts:
        logger.info(
            "telegram: no picks posted on %s, skipping summary", target_date
        )
        return None

    rows: list[dict] = []
    for p in posts:
        pred = await _load_prediction(p.prediction_id, db)
        if pred is None:
            continue
        match = pred.match
        home = match.home_team.name if match.home_team else "Home"
        away = match.away_team.name if match.away_team else "Away"
        league = match.league.name if match.league else "—"

        home_score = match.result.home_score if match.result else None
        away_score = match.result.away_score if match.result else None

        was_correct: Optional[bool] = None
        if match.status == MatchStatus.FINISHED:
            ev_stmt = select(PredictionEvaluation).where(
                PredictionEvaluation.prediction_id == pred.id
            )
            ev = (await db.execute(ev_stmt)).scalar_one_or_none()
            if ev is not None:
                was_correct = bool(ev.is_correct)

        # Infer pick using the same helper the templates use.
        from app.services.telegram_templates import _infer_pick
        rows.append(
            {
                "league": league,
                "home": home,
                "away": away,
                "pick": _infer_pick(pred),
                "home_score": home_score,
                "away_score": away_score,
                "was_correct": was_correct,
            }
        )

    weekly = await _weekly_accuracy_pct(db)
    body = render_daily_summary(
        datetime.combine(target_date, time(12, 0), CET),
        rows,
        weekly_accuracy_pct=weekly,
    )
    message_id = await post_to_channel(target_ch, body)

    summary_post = TelegramPost(
        prediction_id=None,
        channel=target_ch,
        telegram_message_id=message_id,
        post_type="daily_summary",
        posted_at=datetime.now(timezone.utc),
    )
    db.add(summary_post)
    await db.commit()
    await db.refresh(summary_post)
    return summary_post


async def publish_promo(
    db: AsyncSession,
    channel: Optional[str] = None,
    tier: PickTier = PickTier.FREE,
) -> Optional[TelegramPost]:
    """Post the bilingual tier-explanation promo to the channel.

    Fires weekly from the scheduler (Sunday 18:00 CET) and can be
    triggered on-demand from the admin UI. Includes the last-7-day
    accuracy as a credibility anchor so the reader sees a real number
    next to the upgrade pitch.
    """
    target = _resolve_channel(channel, tier)
    if not target:
        logger.info(
            "telegram: tier=%s channel not configured, skipping promo",
            tier.name,
        )
        return None
    weekly = await _weekly_accuracy_pct(db)
    body = render_promo_message(weekly_accuracy_pct=weekly, tier=tier)
    message_id = await post_to_channel(target, body)

    promo = TelegramPost(
        prediction_id=None,
        channel=target,
        telegram_message_id=message_id,
        post_type="promo",
        posted_at=datetime.now(timezone.utc),
    )
    db.add(promo)
    await db.commit()
    await db.refresh(promo)
    return promo


async def update_all_pending_results(
    db: AsyncSession,
    channel: Optional[str] = None,
    tier: PickTier = PickTier.FREE,
) -> int:
    """Iterate over every unresolved pick post and update any that are done.

    Returns the number of posts we actually edited. Callers can use the
    count for dashboards / logs; the scheduler ignores it.
    """
    target = _resolve_channel(channel, tier)
    if not target:
        return 0
    stmt = (
        select(TelegramPost)
        .where(
            TelegramPost.channel == target,
            TelegramPost.post_type == "pick",
            TelegramPost.result_posted_at.is_(None),
            TelegramPost.prediction_id.is_not(None),
        )
        .order_by(TelegramPost.posted_at)
    )
    posts = (await db.execute(stmt)).scalars().all()

    updated = 0
    for post in posts:
        try:
            did = await publish_result_update(post, db)
        except Exception as e:
            logger.error(
                "telegram: result update crashed for post %s: %s", post.id, e
            )
            continue
        if did:
            updated += 1
    return updated


async def publish_welcome(
    db: AsyncSession,
    channel: Optional[str] = None,
    tier: PickTier = PickTier.FREE,
) -> Optional[TelegramPost]:
    """Post the channel's welcome/intro message.

    Meant to be pinned manually in the Telegram client after posting —
    the Bot API's ``pinChatMessage`` requires the bot to have pin
    rights, which we don't assume here. Using ``post_type='welcome'``
    so the admin post-history table can distinguish it from picks,
    summaries and promos.
    """
    target = _resolve_channel(channel, tier)
    if not target:
        logger.info(
            "telegram: tier=%s channel not configured, skipping welcome",
            tier.name,
        )
        return None
    body = render_welcome_message(tier=tier)
    message_id = await post_to_channel(target, body)

    welcome = TelegramPost(
        prediction_id=None,
        channel=target,
        telegram_message_id=message_id,
        post_type="welcome",
        posted_at=datetime.now(timezone.utc),
    )
    db.add(welcome)
    await db.commit()
    await db.refresh(welcome)
    return welcome


async def wipe_channel(
    db: AsyncSession,
    channel: Optional[str] = None,
    tier: PickTier = PickTier.FREE,
) -> dict[str, int]:
    """Delete every auto-posted message from the channel + clear the audit.

    Destructive — used by the admin "reset channel" button when the feed
    needs a clean slate (e.g. during template redesign). Walks every
    TelegramPost row for ``channel``, calls ``deleteMessage`` against
    the Bot API, then hard-deletes the DB row so the idempotency guard
    in ``publish_pick`` won't block a future repost of the same
    prediction.

    Pinned **welcome** posts are PRESERVED — ``post_type='welcome'``
    rows are skipped entirely so the channel's intro message (which the
    operator manually pinned in Telegram) survives a wipe. The audit
    row stays in the DB so the history table still shows it.

    Returns a counter dict::
        {"deleted": N, "missing": M, "db_removed": K, "preserved": P}

    ``missing`` counts messages that were already gone from the channel
    (bot responded "message to delete not found") — we still drop the
    DB row because the channel state is the source of truth.
    ``preserved`` counts welcome rows that were intentionally skipped.
    """
    target = _resolve_channel(channel, tier)
    if not target:
        return {"deleted": 0, "missing": 0, "db_removed": 0, "preserved": 0}
    stmt = (
        select(TelegramPost)
        .where(
            TelegramPost.channel == target,
            # Skip the pinned welcome so a wipe doesn't nuke the channel's
            # intro post. Operator re-running wipe twice still won't lose
            # the welcome — idempotent on that dimension.
            TelegramPost.post_type != "welcome",
        )
        .order_by(TelegramPost.posted_at.desc())
    )
    rows = (await db.execute(stmt)).scalars().all()

    preserved_stmt = select(func.count(TelegramPost.id)).where(
        TelegramPost.channel == target,
        TelegramPost.post_type == "welcome",
    )
    preserved = int((await db.execute(preserved_stmt)).scalar_one() or 0)

    deleted = 0
    missing = 0
    for post in rows:
        try:
            ok = await delete_message(target, post.telegram_message_id)
        except TelegramError as e:
            logger.error(
                "telegram: wipe delete failed for msg=%s: %s",
                post.telegram_message_id,
                e,
            )
            # Keep the DB row so the operator can retry — only remove
            # rows where we know the Telegram side converged.
            continue
        if ok:
            deleted += 1
        else:
            missing += 1
        await db.delete(post)

    await db.commit()
    return {
        "deleted": deleted,
        "missing": missing,
        "db_removed": deleted + missing,
        "preserved": preserved,
    }


__all__ = [
    "publish_pick",
    "publish_scheduled_slot",
    "publish_result_update",
    "publish_daily_summary",
    "publish_promo",
    "publish_welcome",
    "update_all_pending_results",
    "select_next_free_pick",
    "select_next_tier_pick",
    "wipe_channel",
    "_channel_for_tier",
]
