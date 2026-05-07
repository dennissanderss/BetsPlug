"""Internal ops endpoints — long-running maintenance tasks protected by an
API key from environment, NOT by JWT. Use cases:
  - Mass regenerate historical predictions (avoids JWT-expiry mid-run)
  - Mass backfill operations
  - Anything that runs for >10 min and shouldn't depend on a user session

Security model: the endpoint requires an ``X-Internal-Ops-Key`` header
that must match the ``INTERNAL_OPS_KEY`` env var on Railway. If the env
var isn't set, the endpoint returns 503 (refuses to run unprotected).
"""
from __future__ import annotations

import os
import time
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Body, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import and_, exists as _exists, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.prediction_filters import V81_DEPLOYMENT_CUTOFF
from app.db.session import get_db
from app.forecasting.forecast_service import ForecastService
from app.models.match import Match, MatchResult, MatchStatus
from app.models.model_version import ModelVersion
from app.models.prediction import Prediction, PredictionEvaluation


router = APIRouter()


def require_internal_ops_key(
    x_internal_ops_key: str | None = Header(default=None, alias="X-Internal-Ops-Key"),
):
    """Dependency that gates an endpoint behind a server-side env-var key."""
    expected = os.getenv("INTERNAL_OPS_KEY")
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="INTERNAL_OPS_KEY env var not configured on this deploy",
        )
    if not x_internal_ops_key or x_internal_ops_key != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid X-Internal-Ops-Key header",
        )


class RegenRequest(BaseModel):
    start: str  # YYYY-MM-DD
    end: str    # YYYY-MM-DD
    limit: int = 500


class RegenResponse(BaseModel):
    matches_found: int
    generated: int
    failed: int
    evaluated: int
    elapsed_seconds: float
    finished: bool


class ComboBackfillRequest(BaseModel):
    start: str  # YYYY-MM-DD
    end: str    # YYYY-MM-DD
    mode: str = "backtest"  # "backtest" or "live"
    force: bool = True
    limit_days: int = 200


class ComboBackfillResponse(BaseModel):
    days_replayed: int
    deleted: int
    inserted: int
    graded: int
    elapsed_seconds: float
    finished: bool


@router.post(
    "/combo-backfill",
    response_model=ComboBackfillResponse,
    summary="Backfill combo_bets in chunks (env-var key auth)",
    dependencies=[Depends(require_internal_ops_key)],
)
async def combo_backfill(
    body: ComboBackfillRequest,
    db: AsyncSession = Depends(get_db),
):
    """Backfill combo_bets over a date range — chunked to fit Railway's
    proxy timeout. Same selector + persistence as
    backfill_live_combos.py but inside Railway = ~20× faster."""
    from sqlalchemy import and_, delete, select as _select
    from app.models.combo_bet import ComboBet
    from app.services.combo_bet_service import (
        persist_daily_combo,
        evaluate_pending_combos,
    )

    t0 = time.monotonic()
    try:
        start_d = datetime.strptime(body.start, "%Y-%m-%d").date()
        end_d = datetime.strptime(body.end, "%Y-%m-%d").date()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Bad date format: {exc}")

    is_live_mode = body.mode == "live"

    deleted = 0
    if body.force:
        del_stmt = delete(ComboBet).where(
            and_(
                ComboBet.is_live.is_(is_live_mode),
                ComboBet.bet_date >= start_d,
                ComboBet.bet_date <= end_d,
            )
        )
        res = await db.execute(del_stmt)
        await db.commit()
        deleted = res.rowcount or 0

    existing_dates_q = _select(ComboBet.bet_date).where(
        and_(
            ComboBet.is_live.is_(is_live_mode),
            ComboBet.bet_date >= start_d,
            ComboBet.bet_date <= end_d,
        )
    )
    existing_dates = set(
        (await db.execute(existing_dates_q)).scalars().all()
    )

    cursor = start_d
    inserted = 0
    days_replayed = 0
    while cursor <= end_d and days_replayed < body.limit_days:
        if cursor in existing_dates:
            cursor += timedelta(days=1)
            continue
        result = await persist_daily_combo(db, cursor, is_live=is_live_mode)
        if result is not None and result.created_at and (
            datetime.now(timezone.utc) - result.created_at
        ).total_seconds() < 60:
            inserted += 1
        days_replayed += 1
        cursor += timedelta(days=1)

    graded = await evaluate_pending_combos(db)

    finished = cursor > end_d
    elapsed = round(time.monotonic() - t0, 2)
    return ComboBackfillResponse(
        days_replayed=days_replayed,
        deleted=deleted,
        inserted=inserted,
        graded=graded,
        elapsed_seconds=elapsed,
        finished=finished,
    )


@router.post(
    "/regenerate-v81",
    response_model=RegenResponse,
    summary="Regenerate v8.1 predictions (env-var key auth, no JWT)",
    dependencies=[Depends(require_internal_ops_key)],
)
async def regenerate_v81(
    body: RegenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Same logic as /admin/regenerate-v81-historical but auth via
    X-Internal-Ops-Key header instead of JWT bearer. Lets long-running
    multi-hour batch loops keep working without token expiry."""
    t0 = time.monotonic()
    try:
        start_d = datetime.strptime(body.start, "%Y-%m-%d").date()
        end_d = datetime.strptime(body.end, "%Y-%m-%d").date()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Bad date format: {exc}")

    start_dt = datetime.combine(start_d, datetime.min.time(), tzinfo=timezone.utc)
    end_dt = datetime.combine(end_d + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc)

    mv = (await db.execute(
        select(ModelVersion).where(ModelVersion.is_active.is_(True)).limit(1)
    )).scalar_one_or_none()
    if mv is None:
        raise HTTPException(status_code=500, detail="No active ModelVersion in DB")

    v81_pred_exists = _exists().where(
        and_(
            Prediction.match_id == Match.id,
            Prediction.created_at >= V81_DEPLOYMENT_CUTOFF,
            Prediction.predicted_at <= Match.scheduled_at,
        )
    )
    match_q = (
        select(Match.id, Match.scheduled_at)
        .where(
            Match.status == MatchStatus.FINISHED,
            Match.scheduled_at >= start_dt,
            Match.scheduled_at <= end_dt,
            ~v81_pred_exists,
        )
        .order_by(Match.scheduled_at)
        .limit(body.limit)
    )
    targets = (await db.execute(match_q)).all()

    svc = ForecastService()
    generated = 0
    failed = 0
    for match_id, scheduled_at in targets:
        try:
            pred = await svc.generate_forecast(match_id, db, source="backtest")
            pred.predicted_at = scheduled_at
            pred.match_scheduled_at = scheduled_at
            pred.lead_time_hours = 0.0
            pred.locked_at = None
            generated += 1
            if generated % 50 == 0:
                await db.commit()
        except Exception:
            failed += 1
    await db.commit()

    eval_stmt = (
        select(Prediction, MatchResult)
        .join(Match, Match.id == Prediction.match_id)
        .join(MatchResult, MatchResult.match_id == Match.id)
        .outerjoin(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
        .where(
            Prediction.created_at >= V81_DEPLOYMENT_CUTOFF,
            Prediction.predicted_at <= Match.scheduled_at,
            PredictionEvaluation.id.is_(None),
            Match.scheduled_at >= start_dt,
            Match.scheduled_at <= end_dt,
        )
    )
    eval_rows = (await db.execute(eval_stmt)).all()
    evaluated = 0
    for pred, result in eval_rows:
        try:
            hs, as_ = result.home_score, result.away_score
            actual = "home" if hs > as_ else ("away" if as_ > hs else "draw")
            probs = {
                "home": pred.home_win_prob or 0.0,
                "draw": pred.draw_prob or 0.0,
                "away": pred.away_win_prob or 0.0,
            }
            pick = max(probs, key=probs.get)
            is_correct = pick == actual
            actual_vec = {"home": 0, "draw": 0, "away": 0, actual: 1}
            brier = sum(
                (probs[k] - actual_vec[k]) ** 2 for k in ("home", "draw", "away")
            ) / 3
            db.add(PredictionEvaluation(
                prediction_id=pred.id,
                actual_outcome=actual,
                is_correct=is_correct,
                brier_score=brier,
                evaluated_at=datetime.now(timezone.utc),
            ))
            evaluated += 1
        except Exception:
            pass
    await db.commit()

    elapsed = round(time.monotonic() - t0, 2)
    return RegenResponse(
        matches_found=len(targets),
        generated=generated,
        failed=failed,
        evaluated=evaluated,
        elapsed_seconds=elapsed,
        finished=len(targets) < body.limit,
    )


# ---------------------------------------------------------------------------
# Sync teams from API-Football into Postgres for the marketing-site endpoints.
# Triggered manually after deploys when the launch-league teams DB has gaps.
# ---------------------------------------------------------------------------


class SyncTeamsRequest(BaseModel):
    league_slugs: list[str]


class SyncTeamsLeagueResult(BaseModel):
    league_slug: str
    fetched: int
    inserted: int
    updated: int
    error: str | None = None


class SyncTeamsResponse(BaseModel):
    leagues: list[SyncTeamsLeagueResult]
    total_fetched: int
    total_inserted: int
    total_updated: int
    elapsed_seconds: float


@router.post(
    "/sync-teams",
    response_model=SyncTeamsResponse,
    summary="Sync team rosters from API-Football for the given league slugs",
    dependencies=[Depends(require_internal_ops_key)],
)
async def sync_teams(
    body: SyncTeamsRequest,
    db: AsyncSession = Depends(get_db),
):
    """Refresh the ``teams`` table for one or more leagues by re-running
    ``APIFootballAdapter.fetch_teams`` and upserting by slug. Used to fill
    gaps that block /api/public/teams/{slug} from returning 200.
    """
    import httpx

    from app.core.config import get_settings
    from app.ingestion.adapters.api_football import APIFootballAdapter
    from app.models.league import League
    from app.models.team import Team
    from sqlalchemy import select

    t0 = time.monotonic()
    settings = get_settings()
    if not settings.api_football_key:
        raise HTTPException(status_code=500, detail="API_FOOTBALL_KEY not set on this deploy")

    results: list[SyncTeamsLeagueResult] = []
    total_fetched = total_inserted = total_updated = 0

    async with httpx.AsyncClient(timeout=30.0) as http_client:
        adapter = APIFootballAdapter(
            config={"api_key": settings.api_football_key},
            http_client=http_client,
        )

        for league_slug in body.league_slugs:
            league = (await db.execute(
                select(League).where(League.slug == league_slug)
            )).scalar_one_or_none()
            if league is None:
                results.append(SyncTeamsLeagueResult(
                    league_slug=league_slug, fetched=0, inserted=0, updated=0,
                    error="league_not_in_db",
                ))
                continue

            try:
                raw_teams = await adapter.fetch_teams(league_slug)
            except Exception as exc:
                results.append(SyncTeamsLeagueResult(
                    league_slug=league_slug, fetched=0, inserted=0, updated=0,
                    error=f"fetch_failed: {exc}",
                ))
                continue

            inserted = updated = 0
            for raw in raw_teams:
                slug = raw.get("slug")
                if not slug:
                    continue
                existing = (await db.execute(
                    select(Team).where(Team.slug == slug)
                )).scalar_one_or_none()
                if existing is None:
                    db.add(Team(
                        league_id=league.id,
                        name=raw.get("name", slug),
                        slug=slug,
                        short_name=raw.get("short_name"),
                        country=raw.get("country"),
                        venue=raw.get("venue"),
                        logo_url=raw.get("logo_url"),
                        is_active=True,
                    ))
                    inserted += 1
                else:
                    # Update mutable fields that may have shifted on API-Football's side.
                    existing.name = raw.get("name", existing.name)
                    existing.short_name = raw.get("short_name") or existing.short_name
                    existing.country = raw.get("country") or existing.country
                    existing.venue = raw.get("venue") or existing.venue
                    existing.logo_url = raw.get("logo_url") or existing.logo_url
                    existing.league_id = league.id
                    updated += 1

            await db.commit()
            results.append(SyncTeamsLeagueResult(
                league_slug=league_slug,
                fetched=len(raw_teams),
                inserted=inserted,
                updated=updated,
            ))
            total_fetched += len(raw_teams)
            total_inserted += inserted
            total_updated += updated

    # Drop the in-memory cache used by /api/public/* so the next request
    # sees fresh DB rows instead of pre-sync responses.
    try:
        from app.api.routes.public_teams import cache_clear as _public_cache_clear
        _public_cache_clear()
    except Exception:
        pass

    return SyncTeamsResponse(
        leagues=results,
        total_fetched=total_fetched,
        total_inserted=total_inserted,
        total_updated=total_updated,
        elapsed_seconds=round(time.monotonic() - t0, 2),
    )


# ---------------------------------------------------------------------------
# AUDIT — Phase 1 data inventory (read-only diagnostic queries)
# ---------------------------------------------------------------------------


@router.get(
    "/audit/phase1-odds-inventory",
    summary="Phase 1 audit — odds + predictions inventory (read-only)",
    dependencies=[Depends(require_internal_ops_key)],
)
async def audit_phase1(db: AsyncSession = Depends(get_db)) -> dict:
    """Return all Phase 1 inventory query results in one JSON response.

    Pure SELECT queries — no writes. Used to diagnose post-odds-import
    integrity (Engine v1 ROI, Engine v2 combo, coverage gaps).
    """
    from sqlalchemy import text

    out: dict = {}

    # Query A — Total odds volume
    qa = await db.execute(text("""
        SELECT
            COUNT(*) AS total_odds_rows,
            COUNT(DISTINCT match_id) AS matches_with_odds,
            COUNT(DISTINCT source) AS bookmakers,
            MIN(recorded_at) AS oldest_odds,
            MAX(recorded_at) AS newest_odds
        FROM odds_history
    """))
    row_a = qa.first()
    out["A_total_odds"] = {
        "total_odds_rows": row_a[0],
        "matches_with_odds": row_a[1],
        "bookmakers": row_a[2],
        "oldest_odds": row_a[3].isoformat() if row_a[3] else None,
        "newest_odds": row_a[4].isoformat() if row_a[4] else None,
    }

    # Query B — Per bookmaker
    qb = await db.execute(text("""
        SELECT
            source AS bookmaker,
            COUNT(*) AS rows,
            COUNT(DISTINCT match_id) AS unique_matches,
            AVG(home_odds + draw_odds + away_odds) AS avg_overround_sum,
            MIN(recorded_at) AS first_seen,
            MAX(recorded_at) AS last_seen
        FROM odds_history
        WHERE market IN ('1x2', '1X2')
        GROUP BY source
        ORDER BY rows DESC
    """))
    out["B_per_bookmaker"] = [
        {
            "bookmaker": r[0],
            "rows": r[1],
            "unique_matches": r[2],
            "avg_sum_odds": float(r[3]) if r[3] else None,
            "first_seen": r[4].isoformat() if r[4] else None,
            "last_seen": r[5].isoformat() if r[5] else None,
        }
        for r in qb.all()
    ]

    # Query C — Per market
    qc = await db.execute(text("""
        SELECT market, COUNT(*) AS rows, COUNT(DISTINCT match_id) AS unique_matches
        FROM odds_history
        GROUP BY market
        ORDER BY rows DESC
    """))
    out["C_per_market"] = [
        {"market": r[0], "rows": r[1], "unique_matches": r[2]}
        for r in qc.all()
    ]

    # Query D — Pre-match vs post-kickoff
    qd = await db.execute(text("""
        SELECT
            CASE WHEN oh.recorded_at < m.scheduled_at THEN 'pre_match' ELSE 'post_kickoff' END AS timing,
            COUNT(*) AS rows
        FROM odds_history oh
        JOIN matches m ON m.id = oh.match_id
        GROUP BY timing
    """))
    out["D_timing"] = {r[0]: r[1] for r in qd.all()}

    # Query E — Distribution by window pre-kickoff
    qe = await db.execute(text("""
        SELECT
            COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM (m.scheduled_at - oh.recorded_at)) BETWEEN 3600*4 AND 3600*72) AS ideal_window,
            COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM (m.scheduled_at - oh.recorded_at)) > 3600*72) AS too_old,
            COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM (m.scheduled_at - oh.recorded_at)) < 3600*4 AND oh.recorded_at < m.scheduled_at) AS last_minute,
            COUNT(*) FILTER (WHERE oh.recorded_at >= m.scheduled_at) AS post_ko,
            COUNT(*) AS total
        FROM odds_history oh
        JOIN matches m ON m.id = oh.match_id
    """))
    row_e = qe.first()
    out["E_window_distribution"] = {
        "ideal_window_4h_to_72h": row_e[0],
        "too_old_gt_72h": row_e[1],
        "last_minute_lt_4h": row_e[2],
        "post_kickoff": row_e[3],
        "total": row_e[4],
    }

    # Query F — Predictions coverage with odds
    qf = await db.execute(text("""
        SELECT
            COUNT(*) AS total_predictions,
            COUNT(*) FILTER (WHERE EXISTS (
                SELECT 1 FROM odds_history oh, matches m
                WHERE oh.match_id = p.match_id AND m.id = p.match_id
                AND oh.market IN ('1x2', '1X2')
                AND oh.recorded_at < m.scheduled_at
            )) AS with_pre_match_odds,
            COUNT(*) FILTER (WHERE p.closing_odds_snapshot IS NOT NULL) AS with_snapshot,
            COUNT(*) FILTER (WHERE EXISTS (
                SELECT 1 FROM prediction_evaluations pe WHERE pe.prediction_id = p.id
            )) AS evaluated
        FROM predictions p
    """))
    row_f = qf.first()
    out["F_predictions_coverage"] = {
        "total_predictions": row_f[0],
        "with_pre_match_odds": row_f[1],
        "with_snapshot": row_f[2],
        "evaluated": row_f[3],
    }

    # Query G — Coverage per tier (uses pick_tier_expression similar to live measurement)
    # We replicate the league-tier classification inline to avoid coupling to tier_system.py
    # Tier breakdown: count predictions in each tier, with odds, evaluated, both
    qg = await db.execute(text("""
        WITH classified AS (
            SELECT
                p.id AS pid,
                p.match_id,
                p.closing_odds_snapshot,
                CASE
                    WHEN p.confidence >= 0.85 THEN 'platinum'
                    WHEN p.confidence >= 0.70 THEN 'gold'
                    WHEN p.confidence >= 0.60 THEN 'silver'
                    WHEN p.confidence >= 0.45 THEN 'free'
                    ELSE 'below_floor'
                END AS tier
            FROM predictions p
            WHERE p.created_at >= '2026-04-16'
        )
        SELECT
            c.tier,
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE EXISTS (
                SELECT 1 FROM odds_history oh, matches m
                WHERE oh.match_id = c.match_id AND m.id = c.match_id
                AND oh.market IN ('1x2','1X2') AND oh.recorded_at < m.scheduled_at
            )) AS with_odds,
            COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM prediction_evaluations pe WHERE pe.prediction_id = c.pid)) AS evaluated,
            COUNT(*) FILTER (WHERE EXISTS (
                SELECT 1 FROM odds_history oh, matches m
                WHERE oh.match_id = c.match_id AND m.id = c.match_id
                AND oh.market IN ('1x2','1X2') AND oh.recorded_at < m.scheduled_at
            ) AND EXISTS (SELECT 1 FROM prediction_evaluations pe WHERE pe.prediction_id = c.pid)) AS odds_and_eval
        FROM classified c
        GROUP BY c.tier
        ORDER BY
            CASE c.tier WHEN 'platinum' THEN 1 WHEN 'gold' THEN 2 WHEN 'silver' THEN 3 WHEN 'free' THEN 4 ELSE 5 END
    """))
    out["G_coverage_per_tier"] = [
        {
            "tier": r[0],
            "total": r[1],
            "with_odds": r[2],
            "evaluated": r[3],
            "odds_and_eval_usable_for_roi": r[4],
            "coverage_pct": round(100.0 * r[2] / r[1], 1) if r[1] else 0.0,
        }
        for r in qg.all()
    ]

    # Query H — Coverage over time (per month)
    qh = await db.execute(text("""
        SELECT
            DATE_TRUNC('month', m.scheduled_at) AS month,
            COUNT(p.id) AS predictions,
            COUNT(p.id) FILTER (WHERE EXISTS (
                SELECT 1 FROM odds_history oh
                WHERE oh.match_id = p.match_id
                AND oh.recorded_at < m.scheduled_at
                AND oh.market IN ('1x2','1X2')
            )) AS with_odds
        FROM predictions p
        JOIN matches m ON m.id = p.match_id
        WHERE p.created_at >= '2026-04-16'
        GROUP BY month
        ORDER BY month DESC
    """))
    out["H_coverage_per_month"] = [
        {
            "month": r[0].date().isoformat() if r[0] else None,
            "predictions": r[1],
            "with_odds": r[2],
            "coverage_pct": round(100.0 * r[2] / r[1], 1) if r[1] else 0.0,
        }
        for r in qh.all()
    ]

    # Query I — Unrealistic odds
    qi = await db.execute(text("""
        SELECT COUNT(*) FROM odds_history
        WHERE home_odds < 1.01 OR home_odds > 100
           OR draw_odds < 1.01 OR draw_odds > 100
           OR away_odds < 1.01 OR away_odds > 100
    """))
    out["I_unrealistic_odds_count"] = qi.scalar() or 0

    # Query J — Overround stats
    qj = await db.execute(text("""
        SELECT
            COUNT(*) FILTER (WHERE (1.0/home_odds + 1.0/draw_odds + 1.0/away_odds) < 1.0) AS below_fair,
            COUNT(*) FILTER (WHERE (1.0/home_odds + 1.0/draw_odds + 1.0/away_odds) > 1.20) AS huge_margin,
            AVG(1.0/home_odds + 1.0/draw_odds + 1.0/away_odds) AS avg_overround,
            MIN(1.0/home_odds + 1.0/draw_odds + 1.0/away_odds) AS min_overround,
            MAX(1.0/home_odds + 1.0/draw_odds + 1.0/away_odds) AS max_overround
        FROM odds_history
        WHERE market IN ('1x2','1X2')
        AND home_odds > 1.01 AND draw_odds > 1.01 AND away_odds > 1.01
    """))
    row_j = qj.first()
    out["J_overround"] = {
        "below_fair_lt_1_0": row_j[0],
        "huge_margin_gt_1_20": row_j[1],
        "avg_overround": float(row_j[2]) if row_j[2] else None,
        "min_overround": float(row_j[3]) if row_j[3] else None,
        "max_overround": float(row_j[4]) if row_j[4] else None,
    }

    # Query K — Duplicate odds rows
    qk = await db.execute(text("""
        SELECT COUNT(*) FROM (
            SELECT match_id, source, recorded_at, COUNT(*) AS dup
            FROM odds_history
            GROUP BY match_id, source, recorded_at
            HAVING COUNT(*) > 1
        ) t
    """))
    out["K_duplicate_odds_groups"] = qk.scalar() or 0

    return out


@router.get(
    "/audit/phase2-engine1-roi",
    summary="Phase 2 audit — Engine v1 ROI integrity (read-only)",
    dependencies=[Depends(require_internal_ops_key)],
)
async def audit_phase2(db: AsyncSession = Depends(get_db)) -> dict:
    """Phase 2 — verify Engine v1 ROI calculation against raw data.

    Returns:
      - Per-tier accuracy + sample size from multiple endpoints (cross-check)
      - 10 random Gold/Platinum picks with their pre-match odds + manual P/L calc
      - Implied-fallback usage stats
    """
    from sqlalchemy import text

    out: dict = {}

    # 1. Cross-endpoint per-tier accuracy from a single source-of-truth query.
    # We compute it inline here, then the audit caller can compare against
    # /trackrecord/summary?source=backtest, dashboard/metrics, etc.
    qt = await db.execute(text("""
        WITH classified AS (
            SELECT
                p.id AS pid,
                p.match_id,
                pe.is_correct,
                CASE
                    WHEN p.confidence >= 0.85 THEN 'platinum'
                    WHEN p.confidence >= 0.70 THEN 'gold'
                    WHEN p.confidence >= 0.60 THEN 'silver'
                    WHEN p.confidence >= 0.45 THEN 'free'
                    ELSE 'below_floor'
                END AS tier
            FROM predictions p
            JOIN prediction_evaluations pe ON pe.prediction_id = p.id
            WHERE p.created_at >= '2026-04-16'
              AND p.predicted_at <= (SELECT scheduled_at FROM matches WHERE id = p.match_id)
        )
        SELECT tier,
               COUNT(*) AS evaluated,
               SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct,
               ROUND(100.0 * SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) / COUNT(*), 2) AS accuracy_pct
        FROM classified
        GROUP BY tier
        ORDER BY CASE tier WHEN 'platinum' THEN 1 WHEN 'gold' THEN 2 WHEN 'silver' THEN 3 WHEN 'free' THEN 4 ELSE 5 END
    """))
    out["accuracy_per_tier_source_of_truth"] = [
        {"tier": r[0], "evaluated": r[1], "correct": r[2], "accuracy_pct": float(r[3])}
        for r in qt.all()
    ]

    # 2. Sample 10 random Gold/Platinum picks with full audit trail.
    qs = await db.execute(text("""
        WITH eligible AS (
            SELECT
                p.id AS pid,
                p.match_id,
                p.confidence,
                p.home_win_prob, p.draw_prob, p.away_win_prob,
                m.scheduled_at,
                ht.name AS home_team,
                at.name AS away_team,
                l.name AS league,
                mr.home_score, mr.away_score,
                pe.is_correct, pe.actual_outcome,
                CASE
                    WHEN p.confidence >= 0.85 THEN 'platinum'
                    WHEN p.confidence >= 0.70 THEN 'gold'
                    ELSE 'other'
                END AS tier
            FROM predictions p
            JOIN matches m ON m.id = p.match_id
            JOIN teams ht ON ht.id = m.home_team_id
            JOIN teams at ON at.id = m.away_team_id
            JOIN leagues l ON l.id = m.league_id
            JOIN match_results mr ON mr.match_id = m.id
            JOIN prediction_evaluations pe ON pe.prediction_id = p.id
            WHERE p.created_at >= '2026-04-16'
              AND p.confidence >= 0.70
              AND p.predicted_at <= m.scheduled_at
              AND m.scheduled_at >= NOW() - INTERVAL '60 days'
              AND EXISTS (
                  SELECT 1 FROM odds_history oh
                  WHERE oh.match_id = p.match_id
                    AND oh.market IN ('1x2','1X2')
                    AND oh.recorded_at < m.scheduled_at
              )
        )
        SELECT * FROM eligible ORDER BY RANDOM() LIMIT 10
    """))
    samples = qs.all()

    # For each sample, fetch the odds and compute manual P/L
    sample_audits = []
    for s in samples:
        # Determine our pick (argmax)
        probs = {
            "home": float(s.home_win_prob or 0.0),
            "draw": float(s.draw_prob or 0.0),
            "away": float(s.away_win_prob or 0.0),
        }
        pick = max(probs, key=lambda k: probs[k])

        # Fetch latest pre-match 1x2 odds
        qo = await db.execute(
            text("""
                SELECT home_odds, draw_odds, away_odds, source, recorded_at
                FROM odds_history
                WHERE match_id = :mid AND market IN ('1x2','1X2')
                  AND recorded_at < :sa
                ORDER BY recorded_at DESC LIMIT 1
            """),
            {"mid": s.match_id, "sa": s.scheduled_at},
        )
        orow = qo.first()
        odds_used = None
        odds_source = None
        if orow:
            odds_used = float(orow.home_odds if pick == "home" else orow.draw_odds if pick == "draw" else orow.away_odds)
            odds_source = orow.source

        # Manual P/L at 1u flat
        manual_pnl = None
        if odds_used and odds_used > 1.0:
            manual_pnl = round((odds_used - 1.0) if s.is_correct else -1.0, 4)

        sample_audits.append({
            "match": f"{s.home_team} vs {s.away_team}",
            "league": s.league,
            "scheduled_at": s.scheduled_at.isoformat(),
            "tier": s.tier,
            "confidence": float(s.confidence),
            "pick": pick,
            "actual_outcome": s.actual_outcome,
            "is_correct": s.is_correct,
            "score": f"{s.home_score}-{s.away_score}",
            "odds_used": odds_used,
            "odds_source": odds_source,
            "manual_pnl_units": manual_pnl,
        })
    out["sample_picks_audit"] = sample_audits

    # 3. Implied-fallback usage check
    # How many evaluated v8.1 picks LACK odds and would fall back?
    qif = await db.execute(text("""
        SELECT
            COUNT(*) AS total_v81_evaluated,
            COUNT(*) FILTER (WHERE NOT EXISTS (
                SELECT 1 FROM odds_history oh, matches m
                WHERE oh.match_id = p.match_id AND m.id = p.match_id
                  AND oh.market IN ('1x2','1X2')
                  AND oh.recorded_at < m.scheduled_at
            )) AS no_odds_skipped,
            COUNT(*) FILTER (WHERE EXISTS (
                SELECT 1 FROM odds_history oh, matches m
                WHERE oh.match_id = p.match_id AND m.id = p.match_id
                  AND oh.market IN ('1x2','1X2')
                  AND oh.recorded_at < m.scheduled_at
            )) AS with_real_odds
        FROM predictions p
        JOIN prediction_evaluations pe ON pe.prediction_id = p.id
        WHERE p.created_at >= '2026-04-16'
          AND p.predicted_at <= (SELECT scheduled_at FROM matches WHERE id = p.match_id)
    """))
    row_if = qif.first()
    out["implied_fallback_stats"] = {
        "total_v81_evaluated": row_if[0],
        "no_odds_skipped_in_roi": row_if[1],
        "with_real_odds_in_roi": row_if[2],
        "real_odds_pct": round(100.0 * row_if[2] / row_if[0], 1) if row_if[0] else 0.0,
    }

    # 4. Net P/L on real-odds-only universe (replicate roi_calculator math)
    qpnl = await db.execute(text("""
        WITH picks AS (
            SELECT
                p.id,
                p.home_win_prob, p.draw_prob, p.away_win_prob,
                pe.is_correct,
                (
                    SELECT
                        CASE
                            WHEN p.home_win_prob >= p.draw_prob AND p.home_win_prob >= p.away_win_prob THEN oh.home_odds
                            WHEN p.away_win_prob >= p.home_win_prob AND p.away_win_prob >= p.draw_prob THEN oh.away_odds
                            ELSE oh.draw_odds
                        END
                    FROM odds_history oh
                    WHERE oh.match_id = p.match_id
                      AND oh.market IN ('1x2','1X2')
                      AND oh.recorded_at < (SELECT scheduled_at FROM matches WHERE id = p.match_id)
                    ORDER BY oh.recorded_at DESC LIMIT 1
                ) AS odds_used,
                CASE
                    WHEN p.confidence >= 0.85 THEN 'platinum'
                    WHEN p.confidence >= 0.70 THEN 'gold'
                    WHEN p.confidence >= 0.60 THEN 'silver'
                    WHEN p.confidence >= 0.45 THEN 'free'
                    ELSE 'below_floor'
                END AS tier
            FROM predictions p
            JOIN prediction_evaluations pe ON pe.prediction_id = p.id
            WHERE p.created_at >= '2026-04-16'
              AND p.predicted_at <= (SELECT scheduled_at FROM matches WHERE id = p.match_id)
        )
        SELECT
            tier,
            COUNT(*) FILTER (WHERE odds_used IS NOT NULL AND odds_used > 1.0) AS picks_with_odds,
            SUM(CASE WHEN is_correct AND odds_used > 1.0 THEN odds_used - 1.0 WHEN NOT is_correct AND odds_used > 1.0 THEN -1.0 ELSE 0 END) AS net_pnl_units,
            SUM(CASE WHEN is_correct AND odds_used > 1.0 THEN 1 ELSE 0 END) AS wins,
            SUM(CASE WHEN NOT is_correct AND odds_used > 1.0 THEN 1 ELSE 0 END) AS losses,
            AVG(CASE WHEN odds_used > 1.0 THEN odds_used END) AS avg_odds
        FROM picks
        GROUP BY tier
        ORDER BY CASE tier WHEN 'platinum' THEN 1 WHEN 'gold' THEN 2 WHEN 'silver' THEN 3 WHEN 'free' THEN 4 ELSE 5 END
    """))
    out["roi_per_tier_real_odds_only"] = [
        {
            "tier": r[0],
            "picks_with_odds": r[1],
            "wins": int(r[3]) if r[3] else 0,
            "losses": int(r[4]) if r[4] else 0,
            "net_pnl_units": float(r[2]) if r[2] else 0.0,
            "roi_pct": round(100.0 * float(r[2]) / r[1], 2) if (r[1] and r[2]) else 0.0,
            "avg_odds": float(r[5]) if r[5] else None,
        }
        for r in qpnl.all()
    ]

    # 5. SPLIT BY PERIOD: backtest (match before 16 Apr 2026) vs live (after)
    # Same ROI calc as #4 but with two buckets per tier.
    qsplit = await db.execute(text("""
        WITH picks AS (
            SELECT
                p.id,
                p.prediction_source,
                m.scheduled_at,
                pe.is_correct,
                (
                    SELECT
                        CASE
                            WHEN p.home_win_prob >= p.draw_prob AND p.home_win_prob >= p.away_win_prob THEN oh.home_odds
                            WHEN p.away_win_prob >= p.home_win_prob AND p.away_win_prob >= p.draw_prob THEN oh.away_odds
                            ELSE oh.draw_odds
                        END
                    FROM odds_history oh
                    WHERE oh.match_id = p.match_id
                      AND oh.market IN ('1x2','1X2')
                      AND oh.recorded_at < m.scheduled_at
                    ORDER BY oh.recorded_at DESC LIMIT 1
                ) AS odds_used,
                CASE
                    WHEN p.confidence >= 0.85 THEN 'platinum'
                    WHEN p.confidence >= 0.70 THEN 'gold'
                    WHEN p.confidence >= 0.60 THEN 'silver'
                    WHEN p.confidence >= 0.45 THEN 'free'
                    ELSE 'below_floor'
                END AS tier,
                CASE
                    WHEN m.scheduled_at >= '2026-04-16' THEN 'live_period'
                    ELSE 'backtest_period'
                END AS period
            FROM predictions p
            JOIN matches m ON m.id = p.match_id
            JOIN prediction_evaluations pe ON pe.prediction_id = p.id
            WHERE p.created_at >= '2026-04-16'
              AND p.predicted_at <= m.scheduled_at
        )
        SELECT
            tier,
            period,
            COUNT(*) FILTER (WHERE odds_used IS NOT NULL AND odds_used > 1.0) AS picks_with_odds,
            SUM(CASE WHEN is_correct AND odds_used > 1.0 THEN odds_used - 1.0 WHEN NOT is_correct AND odds_used > 1.0 THEN -1.0 ELSE 0 END) AS net_pnl_units,
            SUM(CASE WHEN is_correct AND odds_used > 1.0 THEN 1 ELSE 0 END) AS wins,
            SUM(CASE WHEN NOT is_correct AND odds_used > 1.0 THEN 1 ELSE 0 END) AS losses,
            AVG(CASE WHEN odds_used > 1.0 THEN odds_used END) AS avg_odds
        FROM picks
        GROUP BY tier, period
        ORDER BY
            CASE tier WHEN 'platinum' THEN 1 WHEN 'gold' THEN 2 WHEN 'silver' THEN 3 WHEN 'free' THEN 4 ELSE 5 END,
            period
    """))
    out["roi_per_tier_split_backtest_vs_live"] = [
        {
            "tier": r[0],
            "period": r[1],
            "picks_with_odds": r[2],
            "wins": int(r[4]) if r[4] else 0,
            "losses": int(r[5]) if r[5] else 0,
            "net_pnl_units": float(r[3]) if r[3] else 0.0,
            "roi_pct": round(100.0 * float(r[3]) / r[2], 2) if (r[2] and r[3]) else 0.0,
            "avg_odds": float(r[6]) if r[6] else None,
        }
        for r in qsplit.all()
    ]

    # 6. SPLIT BY prediction_source (live cron vs batch vs regenerated backtest)
    qsrc = await db.execute(text("""
        WITH picks AS (
            SELECT
                p.id, p.prediction_source, m.scheduled_at, pe.is_correct,
                (
                    SELECT
                        CASE
                            WHEN p.home_win_prob >= p.draw_prob AND p.home_win_prob >= p.away_win_prob THEN oh.home_odds
                            WHEN p.away_win_prob >= p.home_win_prob AND p.away_win_prob >= p.draw_prob THEN oh.away_odds
                            ELSE oh.draw_odds
                        END
                    FROM odds_history oh
                    WHERE oh.match_id = p.match_id
                      AND oh.market IN ('1x2','1X2')
                      AND oh.recorded_at < m.scheduled_at
                    ORDER BY oh.recorded_at DESC LIMIT 1
                ) AS odds_used,
                CASE
                    WHEN p.confidence >= 0.70 THEN 'gold_or_platinum'
                    ELSE 'lower'
                END AS tier_group
            FROM predictions p
            JOIN matches m ON m.id = p.match_id
            JOIN prediction_evaluations pe ON pe.prediction_id = p.id
            WHERE p.created_at >= '2026-04-16'
              AND p.predicted_at <= m.scheduled_at
        )
        SELECT
            prediction_source,
            tier_group,
            COUNT(*) FILTER (WHERE odds_used IS NOT NULL AND odds_used > 1.0) AS picks_with_odds,
            SUM(CASE WHEN is_correct AND odds_used > 1.0 THEN odds_used - 1.0 WHEN NOT is_correct AND odds_used > 1.0 THEN -1.0 ELSE 0 END) AS net_pnl_units,
            SUM(CASE WHEN is_correct AND odds_used > 1.0 THEN 1 ELSE 0 END) AS wins,
            SUM(CASE WHEN NOT is_correct AND odds_used > 1.0 THEN 1 ELSE 0 END) AS losses
        FROM picks
        WHERE tier_group = 'gold_or_platinum'
        GROUP BY prediction_source, tier_group
        ORDER BY prediction_source
    """))
    out["roi_by_prediction_source_gold_plus"] = [
        {
            "prediction_source": r[0],
            "picks_with_odds": r[2],
            "wins": int(r[4]) if r[4] else 0,
            "losses": int(r[5]) if r[5] else 0,
            "net_pnl_units": float(r[3]) if r[3] else 0.0,
            "roi_pct": round(100.0 * float(r[3]) / r[2], 2) if (r[2] and r[3]) else 0.0,
        }
        for r in qsrc.all()
    ]

    return out


@router.get(
    "/audit/phase3-engine2-combo",
    summary="Phase 3 audit — Engine v2 (combo) integrity (read-only)",
    dependencies=[Depends(require_internal_ops_key)],
)
async def audit_phase3(db: AsyncSession = Depends(get_db)) -> dict:
    """Phase 3 — verify Engine v2 (combo) integrity.

    Returns:
      - combo_bets totals + per is_live + per tier of legs
      - 10 random evaluated combos with full leg breakdown + manual P/L
      - Edge distribution + odds source split
      - Backtest vs live ROI comparison (mirror Phase 2 pattern)
    """
    from sqlalchemy import text

    out: dict = {}

    # 1. Totals
    qt = await db.execute(text("""
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE is_live = TRUE) AS live_total,
            COUNT(*) FILTER (WHERE is_live = FALSE) AS backtest_total,
            COUNT(*) FILTER (WHERE is_evaluated = TRUE) AS evaluated,
            COUNT(*) FILTER (WHERE is_evaluated = TRUE AND is_correct = TRUE) AS won,
            COUNT(*) FILTER (WHERE is_evaluated = TRUE AND is_correct = FALSE) AS lost,
            SUM(CASE WHEN is_evaluated AND is_correct THEN combined_odds - 1.0
                     WHEN is_evaluated AND NOT is_correct THEN -1.0 ELSE 0 END) AS total_pnl,
            AVG(combined_odds) AS avg_combined_odds,
            AVG(combined_edge) AS avg_combined_edge,
            MIN(bet_date) AS oldest,
            MAX(bet_date) AS newest
        FROM combo_bets
    """))
    row_t = qt.first()
    counted = (row_t[4] or 0) + (row_t[5] or 0)
    out["totals"] = {
        "total_combos": row_t[0],
        "live_total": row_t[1],
        "backtest_total": row_t[2],
        "evaluated": row_t[3],
        "won": row_t[4],
        "lost": row_t[5],
        "hit_rate_pct": round(100.0 * (row_t[4] or 0) / counted, 2) if counted else 0.0,
        "total_pnl_units": float(row_t[6]) if row_t[6] else 0.0,
        "roi_pct": round(100.0 * float(row_t[6] or 0) / counted, 2) if counted else 0.0,
        "avg_combined_odds": float(row_t[7]) if row_t[7] else None,
        "avg_combined_edge": float(row_t[8]) if row_t[8] else None,
        "oldest_bet_date": row_t[9].isoformat() if row_t[9] else None,
        "newest_bet_date": row_t[10].isoformat() if row_t[10] else None,
    }

    # 2. Backtest vs Live split
    qbl = await db.execute(text("""
        SELECT
            is_live,
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE is_evaluated AND is_correct) AS won,
            COUNT(*) FILTER (WHERE is_evaluated AND NOT is_correct) AS lost,
            SUM(CASE WHEN is_evaluated AND is_correct THEN combined_odds - 1.0
                     WHEN is_evaluated AND NOT is_correct THEN -1.0 ELSE 0 END) AS pnl,
            AVG(combined_odds) AS avg_odds,
            AVG(combined_edge) AS avg_edge,
            MIN(bet_date) AS oldest,
            MAX(bet_date) AS newest
        FROM combo_bets
        GROUP BY is_live
        ORDER BY is_live
    """))
    out["per_is_live"] = [
        {
            "is_live": r[0],
            "label": "live" if r[0] else "backtest",
            "total": r[1],
            "won": r[2],
            "lost": r[3],
            "hit_rate_pct": round(100.0 * (r[2] or 0) / max(1, (r[2] or 0) + (r[3] or 0)), 2),
            "net_pnl_units": float(r[4]) if r[4] else 0.0,
            "roi_pct": round(100.0 * float(r[4] or 0) / max(1, (r[2] or 0) + (r[3] or 0)), 2),
            "avg_combined_odds": float(r[5]) if r[5] else None,
            "avg_combined_edge": float(r[6]) if r[6] else None,
            "oldest_bet_date": r[7].isoformat() if r[7] else None,
            "newest_bet_date": r[8].isoformat() if r[8] else None,
        }
        for r in qbl.all()
    ]

    # 3. Per leg-tier composition (analyse: which tier picks dominate combos?)
    qlt = await db.execute(text("""
        SELECT prediction_tier, COUNT(*) AS legs
        FROM combo_bet_legs
        GROUP BY prediction_tier
        ORDER BY legs DESC
    """))
    out["leg_tier_composition"] = [
        {"tier": r[0], "legs": r[1]} for r in qlt.all()
    ]

    # 4. 10 random evaluated combos with full leg detail
    qsr = await db.execute(text("""
        SELECT id, bet_date, is_live, leg_count, combined_odds,
               combined_edge, is_correct, profit_loss_units
        FROM combo_bets
        WHERE is_evaluated = TRUE
        ORDER BY RANDOM() LIMIT 10
    """))
    samples = qsr.all()
    sample_audits = []
    for s in samples:
        # Fetch legs
        ql = await db.execute(text("""
            SELECT cl.leg_index, cl.our_pick, cl.our_probability, cl.confidence,
                   cl.prediction_tier, cl.leg_odds, cl.leg_edge,
                   cl.is_correct AS leg_correct, cl.actual_outcome,
                   ht.name AS home, at.name AS away, l.name AS league,
                   m.scheduled_at, mr.home_score, mr.away_score
            FROM combo_bet_legs cl
            JOIN matches m ON m.id = cl.match_id
            JOIN teams ht ON ht.id = m.home_team_id
            JOIN teams at ON at.id = m.away_team_id
            JOIN leagues l ON l.id = m.league_id
            LEFT JOIN match_results mr ON mr.match_id = m.id
            WHERE cl.combo_bet_id = :cid
            ORDER BY cl.leg_index
        """), {"cid": s[0]})
        legs = []
        all_legs_correct = True
        for L in ql.all():
            legs.append({
                "idx": L[0], "pick": L[1], "model_prob": float(L[2]),
                "tier": L[4], "leg_odds": float(L[5]),
                "edge_pct": round(100.0 * float(L[6]), 2),
                "leg_correct": L[7], "actual": L[8],
                "match": f"{L[9]} vs {L[10]}",
                "league": L[11],
                "score": f"{L[13]}-{L[14]}" if L[13] is not None else None,
            })
            if L[7] is False:
                all_legs_correct = False
            if L[7] is None:
                all_legs_correct = None
        # Manual P/L: combined_odds - 1 if all correct, -1 if any wrong, None if pending
        manual_pnl = (
            (float(s[4]) - 1.0) if all_legs_correct is True
            else (-1.0) if all_legs_correct is False
            else None
        )
        sample_audits.append({
            "combo_id": str(s[0]),
            "bet_date": s[1].isoformat(),
            "is_live": s[2],
            "leg_count": s[3],
            "combined_odds": float(s[4]),
            "combined_edge_pct": round(100.0 * float(s[5]), 2),
            "is_correct": s[6],
            "stored_pnl": float(s[7]) if s[7] is not None else None,
            "manual_pnl": manual_pnl,
            "pnl_match": (
                round(float(s[7]), 4) == round(manual_pnl, 4)
                if (s[7] is not None and manual_pnl is not None)
                else None
            ),
            "legs": legs,
        })
    out["sample_combos_audit"] = sample_audits

    # 5. Edge distribution
    qed = await db.execute(text("""
        SELECT
            COUNT(*) AS legs_total,
            COUNT(*) FILTER (WHERE leg_edge < 0) AS legs_negative_edge,
            COUNT(*) FILTER (WHERE leg_edge >= 0 AND leg_edge < 0.02) AS legs_low_edge,
            COUNT(*) FILTER (WHERE leg_edge >= 0.02 AND leg_edge < 0.05) AS legs_med_edge,
            COUNT(*) FILTER (WHERE leg_edge >= 0.05) AS legs_high_edge,
            AVG(leg_edge) AS avg_leg_edge,
            MIN(leg_edge) AS min_leg_edge,
            MAX(leg_edge) AS max_leg_edge
        FROM combo_bet_legs
    """))
    row_e = qed.first()
    out["leg_edge_distribution"] = {
        "total_legs": row_e[0],
        "negative_edge": row_e[1],
        "low_edge_0_to_2pct": row_e[2],
        "med_edge_2_to_5pct": row_e[3],
        "high_edge_5pct_plus": row_e[4],
        "avg_leg_edge_pct": round(100.0 * float(row_e[5] or 0), 2),
        "min_leg_edge_pct": round(100.0 * float(row_e[6] or 0), 2),
        "max_leg_edge_pct": round(100.0 * float(row_e[7] or 0), 2),
    }

    return out


@router.get(
    "/audit/phase4-dataflow",
    summary="Phase 4 audit — data flow integrity (read-only)",
    dependencies=[Depends(require_internal_ops_key)],
)
async def audit_phase4(db: AsyncSession = Depends(get_db)) -> dict:
    """Phase 4 — verify ingestion → storage → display chain.

    Returns:
      - 5 random recent matches with full data trail (odds_history vs
        prediction.closing_odds_snapshot consistency)
      - Stale-data check (predictions made >24h after odds recorded)
      - Per-league bookmaker margin (overround) analysis
      - Pending evaluations (matches finished without grading)
    """
    from sqlalchemy import text
    import traceback as _tb

    out: dict = {"errors": {}}

    # 1. Chain integrity — 5 random recent matches with prediction + odds + snapshot
    try:
        qchain = await db.execute(text("""
            SELECT
                m.id AS match_id,
                ht.name AS home, at.name AS away, l.name AS league,
                m.scheduled_at,
                mr.home_score, mr.away_score,
                p.id AS pid,
                p.confidence,
                p.home_win_prob, p.draw_prob, p.away_win_prob,
                p.predicted_at,
                CAST(p.closing_odds_snapshot AS TEXT) AS snapshot_text,
                (
                    SELECT COUNT(*) FROM odds_history oh
                    WHERE oh.match_id = m.id AND oh.market IN ('1x2','1X2')
                ) AS odds_history_rows,
                (SELECT pe.is_correct FROM prediction_evaluations pe WHERE pe.prediction_id = p.id) AS is_correct
            FROM matches m
            JOIN predictions p ON p.match_id = m.id
            JOIN teams ht ON ht.id = m.home_team_id
            JOIN teams at ON at.id = m.away_team_id
            JOIN leagues l ON l.id = m.league_id
            LEFT JOIN match_results mr ON mr.match_id = m.id
            WHERE m.scheduled_at >= NOW() - INTERVAL '30 days'
              AND p.created_at >= '2026-04-16'
              AND p.predicted_at <= m.scheduled_at
              AND EXISTS (SELECT 1 FROM odds_history oh WHERE oh.match_id = m.id AND oh.market IN ('1x2','1X2'))
            ORDER BY RANDOM() LIMIT 5
        """))
        rows = qchain.all()

        chain_audits = []
        import json as _json
        for r in rows:
            bm_in_snap = None
            try:
                snap = _json.loads(r.snapshot_text) if r.snapshot_text else {}
                bm_in_snap = snap.get("bookmaker_odds") if isinstance(snap, dict) else None
            except Exception:
                bm_in_snap = None

            ql = await db.execute(
                text("""
                    SELECT home_odds, draw_odds, away_odds, source, recorded_at
                    FROM odds_history
                    WHERE match_id = :mid AND market IN ('1x2','1X2')
                    ORDER BY recorded_at DESC LIMIT 1
                """),
                {"mid": r.match_id},
            )
            latest = ql.first()
            latest_dict = None
            if latest:
                latest_dict = {
                    "home": float(latest[0]),
                    "draw": float(latest[1]),
                    "away": float(latest[2]),
                    "source": latest[3],
                    "recorded_at": latest[4].isoformat() if latest[4] else None,
                }

            snap_home = (bm_in_snap or {}).get("home") if isinstance(bm_in_snap, dict) else None
            snapshot_match = bool(
                snap_home is not None and latest_dict is not None and
                abs(float(snap_home) - latest_dict["home"]) < 0.01
            )

            chain_audits.append({
                "match": f"{r.home} vs {r.away}",
                "league": r.league,
                "scheduled_at": r.scheduled_at.isoformat() if r.scheduled_at else None,
                "score": f"{r.home_score}-{r.away_score}" if r.home_score is not None else None,
                "is_correct": r.is_correct,
                "model_probs": {
                    "home": float(r.home_win_prob) if r.home_win_prob is not None else None,
                    "draw": float(r.draw_prob) if r.draw_prob is not None else None,
                    "away": float(r.away_win_prob) if r.away_win_prob is not None else None,
                    "confidence": float(r.confidence) if r.confidence is not None else None,
                },
                "odds_history_count": r.odds_history_rows,
                "latest_odds_history": latest_dict,
                "snapshot_bookmaker_odds": bm_in_snap,
                "snapshot_match_history": snapshot_match,
            })
        out["chain_integrity_5_random_matches"] = chain_audits
    except Exception as e:
        out["errors"]["chain_integrity"] = f"{type(e).__name__}: {str(e)[:500]}"

    # 2. Stale data: predictions whose odds were recorded >24h before predicted_at
    try:
        qstale = await db.execute(text("""
            WITH stale AS (
                SELECT
                    p.id, p.predicted_at, p.created_at,
                    (
                        SELECT MIN(oh.recorded_at)
                        FROM odds_history oh
                        WHERE oh.match_id = p.match_id AND oh.market IN ('1x2','1X2')
                    ) AS earliest_odds_recorded,
                    (
                        SELECT MAX(oh.recorded_at)
                        FROM odds_history oh
                        WHERE oh.match_id = p.match_id AND oh.market IN ('1x2','1X2')
                    ) AS latest_odds_recorded
                FROM predictions p
                WHERE p.created_at >= '2026-04-16'
                  AND EXISTS (SELECT 1 FROM odds_history oh WHERE oh.match_id = p.match_id AND oh.market IN ('1x2','1X2'))
            )
            SELECT
                COUNT(*) AS total_with_odds,
                COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM (predicted_at - latest_odds_recorded)) > 86400) AS stale_gt_24h,
                COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM (predicted_at - latest_odds_recorded)) > 7*86400) AS stale_gt_7d,
                AVG(EXTRACT(EPOCH FROM (predicted_at - latest_odds_recorded))/3600.0) AS avg_lag_hours
            FROM stale
        """))
        row_s = qstale.first()
        out["stale_data_check"] = {
            "total_predictions_with_odds": int(row_s[0] or 0),
            "predicted_more_than_24h_after_latest_odds": int(row_s[1] or 0),
            "predicted_more_than_7d_after_latest_odds": int(row_s[2] or 0),
            "avg_lag_hours": round(float(row_s[3] or 0), 2),
        }
    except Exception as e:
        out["errors"]["stale_data_check"] = f"{type(e).__name__}: {str(e)[:500]}"

    # 3. Per-league overround (bookmaker margin)
    try:
        qol = await db.execute(text("""
            SELECT
                l.name AS league,
                COUNT(oh.id) AS rows_count,
                ROUND(AVG(1.0/oh.home_odds + 1.0/oh.draw_odds + 1.0/oh.away_odds)::numeric, 4) AS avg_overround,
                ROUND(MIN(1.0/oh.home_odds + 1.0/oh.draw_odds + 1.0/oh.away_odds)::numeric, 4) AS min_overround,
                ROUND(MAX(1.0/oh.home_odds + 1.0/oh.draw_odds + 1.0/oh.away_odds)::numeric, 4) AS max_overround
            FROM odds_history oh
            JOIN matches m ON m.id = oh.match_id
            JOIN leagues l ON l.id = m.league_id
            WHERE oh.market IN ('1x2','1X2')
              AND oh.home_odds > 1.01 AND oh.draw_odds > 1.01 AND oh.away_odds > 1.01
            GROUP BY l.name
            HAVING COUNT(oh.id) >= 50
            ORDER BY avg_overround ASC
        """))
        out["overround_per_league"] = [
            {
                "league": r[0],
                "rows": int(r[1]),
                "avg_overround": float(r[2]),
                "avg_margin_pct": round(100.0 * (float(r[2]) - 1), 2),
                "min": float(r[3]),
                "max": float(r[4]),
            }
            for r in qol.all()
        ]
    except Exception as e:
        out["errors"]["overround_per_league"] = f"{type(e).__name__}: {str(e)[:500]}"

    # 4. Evaluator completeness
    try:
        qev = await db.execute(text("""
            SELECT COUNT(*) AS pending_eval_finished_matches
            FROM predictions p
            JOIN matches m ON m.id = p.match_id
            LEFT JOIN prediction_evaluations pe ON pe.prediction_id = p.id
            WHERE m.status::text = 'finished'
              AND pe.id IS NULL
              AND m.scheduled_at < NOW() - INTERVAL '24 hours'
        """))
        out["evaluator_lag"] = {
            "pending_evaluations_finished_matches_gt_24h": int(qev.scalar() or 0),
        }
    except Exception as e:
        out["errors"]["evaluator_lag"] = f"{type(e).__name__}: {str(e)[:500]}"

    if not out["errors"]:
        del out["errors"]
    return out


@router.get(
    "/audit/phase5-ui-consistency",
    summary="Phase 5 audit — UI numerical consistency (read-only)",
    dependencies=[Depends(require_internal_ops_key)],
)
async def audit_phase5(db: AsyncSession = Depends(get_db)) -> dict:
    """Phase 5 — verify the numbers the UI displays reconcile to raw DB.

    Returns parallel counts from:
      - raw counts straight from predictions/evaluations tables
      - the trackrecord_filter() pipeline that public summary uses
      - the access_filter for each tier
      - the combo_bets table for /combi-of-the-day
      - the live-measurement filter for /trackrecord/live-tracking
    """
    from sqlalchemy import text

    out: dict = {"errors": {}}

    # 1. RAW counts (no filter)
    try:
        q = await db.execute(text("""
            SELECT
                (SELECT COUNT(*) FROM predictions) AS pred_total,
                (SELECT COUNT(*) FROM prediction_evaluations) AS eval_total,
                (SELECT COUNT(*) FROM matches) AS match_total,
                (SELECT COUNT(*) FROM combo_bets) AS combo_total
        """))
        r = q.first()
        out["raw_table_counts"] = {
            "predictions": int(r[0]),
            "prediction_evaluations": int(r[1]),
            "matches": int(r[2]),
            "combo_bets": int(r[3]),
        }
    except Exception as e:
        out["errors"]["raw_counts"] = f"{type(e).__name__}: {str(e)[:300]}"

    # 2. v8.1-filtered counts (the population trackrecord summary computes on)
    try:
        q = await db.execute(text("""
            SELECT COUNT(*) FROM predictions p
            JOIN prediction_evaluations pe ON pe.prediction_id = p.id
            JOIN matches m ON m.id = p.match_id
            WHERE p.prediction_source IN ('batch_local_fill','backtest','live')
              AND p.created_at >= '2026-04-16 11:00:00+00'
              AND p.predicted_at <= m.scheduled_at
        """))
        v81_evaluated = int(q.scalar() or 0)

        q = await db.execute(text("""
            SELECT COUNT(*) FROM predictions p
            JOIN prediction_evaluations pe ON pe.prediction_id = p.id
            JOIN matches m ON m.id = p.match_id
            WHERE p.prediction_source IN ('batch_local_fill','backtest','live')
              AND p.created_at >= '2026-04-16 11:00:00+00'
              AND p.predicted_at <= m.scheduled_at
              AND pe.is_correct = TRUE
        """))
        v81_correct = int(q.scalar() or 0)

        out["v81_filtered_population"] = {
            "evaluated": v81_evaluated,
            "correct": v81_correct,
            "accuracy": round(v81_correct / v81_evaluated, 4) if v81_evaluated else None,
        }
    except Exception as e:
        out["errors"]["v81_filtered"] = f"{type(e).__name__}: {str(e)[:300]}"

    # 3. Per-tier accuracy via the same pick_tier_expression frontend uses
    try:
        # tier expression: platinum if confidence>=0.78 AND edge>0.05, gold if >=0.70, silver if >=0.62, free otherwise
        q = await db.execute(text("""
            WITH tiered AS (
                SELECT
                    pe.is_correct,
                    CASE
                      WHEN p.confidence >= 0.78 THEN 'platinum'
                      WHEN p.confidence >= 0.70 THEN 'gold'
                      WHEN p.confidence >= 0.62 THEN 'silver'
                      ELSE 'free'
                    END AS tier
                FROM predictions p
                JOIN prediction_evaluations pe ON pe.prediction_id = p.id
                JOIN matches m ON m.id = p.match_id
                WHERE p.prediction_source IN ('batch_local_fill','backtest','live')
                  AND p.created_at >= '2026-04-16 11:00:00+00'
                  AND p.predicted_at <= m.scheduled_at
            )
            SELECT tier, COUNT(*) AS n, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct
            FROM tiered
            GROUP BY tier
            ORDER BY tier
        """))
        per_tier_strict = {}
        for row in q.all():
            n = int(row[1] or 0)
            c = int(row[2] or 0)
            per_tier_strict[row[0]] = {
                "n": n,
                "correct": c,
                "accuracy": round(c / n, 4) if n else None,
            }
        out["per_tier_strict_partition"] = per_tier_strict
        # Note: the trackrecord summary uses *ladder* semantics where a platinum pick is also counted as gold/silver/free
        # so the partitioned numbers below should be aggregated to compare.
    except Exception as e:
        out["errors"]["per_tier"] = f"{type(e).__name__}: {str(e)[:300]}"

    # 4. Per-tier ladder semantics (frontend summary view — cumulative)
    try:
        thresholds = {"free": 0.0, "silver": 0.62, "gold": 0.70, "platinum": 0.78}
        per_tier_ladder = {}
        for tier, thr in thresholds.items():
            q = await db.execute(text(f"""
                SELECT COUNT(*) AS n,
                       SUM(CASE WHEN pe.is_correct THEN 1 ELSE 0 END) AS correct
                FROM predictions p
                JOIN prediction_evaluations pe ON pe.prediction_id = p.id
                JOIN matches m ON m.id = p.match_id
                WHERE p.prediction_source IN ('batch_local_fill','backtest','live')
                  AND p.created_at >= '2026-04-16 11:00:00+00'
                  AND p.predicted_at <= m.scheduled_at
                  AND p.confidence >= {thr}
            """))
            row = q.first()
            n = int(row[0] or 0)
            c = int(row[1] or 0)
            per_tier_ladder[tier] = {
                "n": n,
                "correct": c,
                "accuracy": round(c / n, 4) if n else None,
                "threshold": thr,
            }
        out["per_tier_ladder"] = per_tier_ladder
    except Exception as e:
        out["errors"]["per_tier_ladder"] = f"{type(e).__name__}: {str(e)[:300]}"

    # 5. Live-measurement counts (prediction_source='live' only, post-deploy)
    try:
        q = await db.execute(text("""
            SELECT COUNT(*) AS n,
                   SUM(CASE WHEN pe.is_correct THEN 1 ELSE 0 END) AS correct,
                   AVG(p.confidence) AS avg_conf
            FROM predictions p
            JOIN prediction_evaluations pe ON pe.prediction_id = p.id
            JOIN matches m ON m.id = p.match_id
            WHERE p.prediction_source = 'live'
              AND p.created_at >= '2026-04-16 11:00:00+00'
              AND p.predicted_at <= m.scheduled_at
        """))
        r = q.first()
        n = int(r[0] or 0)
        c = int(r[1] or 0)
        out["live_measurement"] = {
            "n": n,
            "correct": c,
            "accuracy": round(c / n, 4) if n else None,
            "avg_confidence": round(float(r[2] or 0), 4),
        }
    except Exception as e:
        out["errors"]["live_measurement"] = f"{type(e).__name__}: {str(e)[:300]}"

    # 6. Combo numbers (used by /combi-of-the-day)
    try:
        q = await db.execute(text("""
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE is_live) AS live_n,
                COUNT(*) FILTER (WHERE NOT is_live) AS bt_n,
                COUNT(*) FILTER (WHERE is_evaluated) AS evaluated,
                COUNT(*) FILTER (WHERE is_correct = TRUE) AS won,
                COUNT(*) FILTER (WHERE is_correct = FALSE) AS lost,
                SUM(profit_loss_units) AS pnl,
                AVG(combined_odds) AS avg_odds,
                AVG(combined_edge) AS avg_edge
            FROM combo_bets
        """))
        r = q.first()
        won = int(r[4] or 0)
        lost = int(r[5] or 0)
        evaluated = int(r[3] or 0)
        out["combo_stats_aggregate"] = {
            "total": int(r[0] or 0),
            "live": int(r[1] or 0),
            "backtest": int(r[2] or 0),
            "evaluated": evaluated,
            "won": won,
            "lost": lost,
            "hit_rate_pct": round(100.0 * won / evaluated, 2) if evaluated else None,
            "net_pnl_units": round(float(r[6] or 0), 2),
            "roi_pct": round(100.0 * float(r[6] or 0) / evaluated, 2) if evaluated else None,
            "avg_combined_odds": round(float(r[7] or 0), 3),
            "avg_combined_edge": round(float(r[8] or 0), 3),
        }
    except Exception as e:
        out["errors"]["combo_stats"] = f"{type(e).__name__}: {str(e)[:300]}"
        await db.rollback()

    # 7. Predictions list endpoint count (what /predictions shows)
    # Default predictions list filters by current user tier; for free-tier (anon) this means confidence < 0.62
    try:
        q = await db.execute(text("""
            SELECT
                COUNT(*) FILTER (WHERE p.confidence < 0.62) AS free_visible,
                COUNT(*) FILTER (WHERE p.confidence >= 0.62 AND p.confidence < 0.70) AS silver_only,
                COUNT(*) FILTER (WHERE p.confidence >= 0.70 AND p.confidence < 0.78) AS gold_only,
                COUNT(*) FILTER (WHERE p.confidence >= 0.78) AS platinum_only
            FROM predictions p
            JOIN matches m ON m.id = p.match_id
            WHERE p.prediction_source IN ('batch_local_fill','backtest','live')
              AND p.created_at >= '2026-04-16 11:00:00+00'
              AND p.predicted_at <= m.scheduled_at
        """))
        r = q.first()
        out["predictions_list_partition"] = {
            "free_visible": int(r[0] or 0),
            "silver_only": int(r[1] or 0),
            "gold_only": int(r[2] or 0),
            "platinum_only": int(r[3] or 0),
        }
    except Exception as e:
        out["errors"]["predictions_list"] = f"{type(e).__name__}: {str(e)[:300]}"

    # 8. Discrepancy detection — compare a known cross-source value
    # /trackrecord/summary is a public endpoint. Self-call to that and store.
    # We emulate it via raw SQL above and the actual summary endpoint will be
    # spot-checked manually by the auditor.

    if not out["errors"]:
        del out["errors"]
    return out


@router.get(
    "/audit/phase6-reproducibility",
    summary="Phase 6 audit — deterministic ROI + evaluator completeness",
    dependencies=[Depends(require_internal_ops_key)],
)
async def audit_phase6(db: AsyncSession = Depends(get_db)) -> dict:
    """Phase 6 — verify the engine is reproducible.

    Sub-checks:
      1. Same query repeated 3× must return identical aggregate values
      2. Evaluator completeness per league / per source / per month
      3. Manual ROI replication on 5 random graded picks (1X2 with bookmaker odds)
    """
    from sqlalchemy import text

    out: dict = {"errors": {}}

    # 1. Determinism — call the same aggregate query 3× sequentially, compare
    try:
        runs = []
        for _ in range(3):
            q = await db.execute(text("""
                SELECT
                    COUNT(*) AS n,
                    SUM(CASE WHEN pe.is_correct THEN 1 ELSE 0 END) AS correct,
                    AVG(p.confidence) AS avg_conf,
                    AVG(pe.brier_score) AS avg_brier
                FROM predictions p
                JOIN prediction_evaluations pe ON pe.prediction_id = p.id
                JOIN matches m ON m.id = p.match_id
                WHERE p.prediction_source IN ('batch_local_fill','backtest','live')
                  AND p.created_at >= '2026-04-16 11:00:00+00'
                  AND p.predicted_at <= m.scheduled_at
            """))
            r = q.first()
            runs.append({
                "n": int(r[0] or 0),
                "correct": int(r[1] or 0),
                "avg_conf": round(float(r[2] or 0), 6),
                "avg_brier": round(float(r[3] or 0), 6),
            })
        all_match = all(r == runs[0] for r in runs)
        out["determinism_3_runs"] = {
            "all_three_identical": all_match,
            "run_1": runs[0],
            "run_2": runs[1],
            "run_3": runs[2],
        }
    except Exception as e:
        out["errors"]["determinism"] = f"{type(e).__name__}: {str(e)[:300]}"
        await db.rollback()

    # 2a. Evaluator completeness per source (use match_results presence
    # since match.status is not always 'finished' for historical matches)
    try:
        q = await db.execute(text("""
            SELECT
                p.prediction_source AS src,
                COUNT(*) AS total,
                COUNT(pe.id) AS evaluated,
                COUNT(*) - COUNT(pe.id) AS pending
            FROM predictions p
            JOIN matches m ON m.id = p.match_id
            JOIN match_results mr ON mr.match_id = m.id
            LEFT JOIN prediction_evaluations pe ON pe.prediction_id = p.id
            WHERE m.scheduled_at < NOW() - INTERVAL '24 hours'
              AND p.created_at >= '2026-04-16 11:00:00+00'
            GROUP BY p.prediction_source
            ORDER BY p.prediction_source
        """))
        out["evaluator_per_source"] = [
            {
                "source": r[0],
                "total": int(r[1]),
                "evaluated": int(r[2]),
                "pending": int(r[3]),
                "coverage_pct": round(100.0 * int(r[2]) / int(r[1]), 2) if r[1] else None,
            }
            for r in q.all()
        ]
    except Exception as e:
        out["errors"]["evaluator_per_source"] = f"{type(e).__name__}: {str(e)[:300]}"
        await db.rollback()

    # 2b. Evaluator completeness per league (top 15 by volume)
    try:
        q = await db.execute(text("""
            SELECT
                l.name AS league,
                COUNT(*) AS total,
                COUNT(pe.id) AS evaluated,
                COUNT(*) - COUNT(pe.id) AS pending
            FROM predictions p
            JOIN matches m ON m.id = p.match_id
            JOIN leagues l ON l.id = m.league_id
            JOIN match_results mr ON mr.match_id = m.id
            LEFT JOIN prediction_evaluations pe ON pe.prediction_id = p.id
            WHERE m.scheduled_at < NOW() - INTERVAL '24 hours'
              AND p.created_at >= '2026-04-16 11:00:00+00'
            GROUP BY l.name
            ORDER BY pending DESC, total DESC
            LIMIT 15
        """))
        out["evaluator_per_league_top15"] = [
            {
                "league": r[0],
                "total": int(r[1]),
                "evaluated": int(r[2]),
                "pending": int(r[3]),
            }
            for r in q.all()
        ]
    except Exception as e:
        out["errors"]["evaluator_per_league"] = f"{type(e).__name__}: {str(e)[:300]}"
        await db.rollback()

    # 2c. Evaluator completeness per month
    try:
        q = await db.execute(text("""
            SELECT
                TO_CHAR(m.scheduled_at, 'YYYY-MM') AS yyyymm,
                COUNT(*) AS total,
                COUNT(pe.id) AS evaluated,
                COUNT(*) - COUNT(pe.id) AS pending
            FROM predictions p
            JOIN matches m ON m.id = p.match_id
            JOIN match_results mr ON mr.match_id = m.id
            LEFT JOIN prediction_evaluations pe ON pe.prediction_id = p.id
            WHERE m.scheduled_at < NOW() - INTERVAL '24 hours'
              AND p.created_at >= '2026-04-16 11:00:00+00'
            GROUP BY yyyymm
            ORDER BY yyyymm
        """))
        rows = q.all()
        # Show only months with pending > 0 OR last 6 months
        all_months = [
            {
                "month": r[0],
                "total": int(r[1]),
                "evaluated": int(r[2]),
                "pending": int(r[3]),
            }
            for r in rows
        ]
        problematic = [m for m in all_months if m["pending"] > 0]
        recent = all_months[-6:] if all_months else []
        out["evaluator_per_month"] = {
            "total_months": len(all_months),
            "months_with_pending": len(problematic),
            "problematic_months": problematic,
            "last_6_months": recent,
        }
    except Exception as e:
        out["errors"]["evaluator_per_month"] = f"{type(e).__name__}: {str(e)[:300]}"
        await db.rollback()

    # 3. Manual ROI replication on 5 random graded picks
    try:
        q = await db.execute(text("""
            SELECT
                p.id AS pid,
                p.confidence,
                p.home_win_prob, p.draw_prob, p.away_win_prob,
                CAST(p.closing_odds_snapshot AS TEXT) AS snap_text,
                pe.is_correct,
                ht.name AS home, at.name AS away,
                mr.home_score, mr.away_score
            FROM predictions p
            JOIN prediction_evaluations pe ON pe.prediction_id = p.id
            JOIN matches m ON m.id = p.match_id
            JOIN teams ht ON ht.id = m.home_team_id
            JOIN teams at ON at.id = m.away_team_id
            LEFT JOIN match_results mr ON mr.match_id = m.id
            WHERE p.created_at >= '2026-04-16 11:00:00+00'
              AND p.predicted_at <= m.scheduled_at
              AND p.closing_odds_snapshot IS NOT NULL
              AND mr.home_score IS NOT NULL
            ORDER BY RANDOM() LIMIT 5
        """))
        import json as _json
        manual_checks = []
        for r in q.all():
            home_p = float(r.home_win_prob or 0)
            draw_p = float(r.draw_prob or 0)
            away_p = float(r.away_win_prob or 0)
            picks = sorted(
                [("home", home_p), ("draw", draw_p), ("away", away_p)],
                key=lambda x: x[1], reverse=True,
            )
            our_pick = picks[0][0]

            hs, as_ = int(r.home_score), int(r.away_score)
            actual = "home" if hs > as_ else ("away" if as_ > hs else "draw")
            manual_correct = (our_pick == actual)

            # Try to find odds in snapshot
            snap_odds = None
            try:
                snap = _json.loads(r.snap_text) if r.snap_text else {}
                bm = snap.get("bookmaker_odds") if isinstance(snap, dict) else None
                if isinstance(bm, dict):
                    snap_odds = {
                        "home": bm.get("home"),
                        "draw": bm.get("draw"),
                        "away": bm.get("away"),
                    }
            except Exception:
                snap_odds = None

            # Compute manual P/L if odds available (1u stake)
            pnl = None
            if snap_odds and snap_odds.get(our_pick) is not None:
                pnl = (float(snap_odds[our_pick]) - 1.0) if manual_correct else -1.0

            manual_checks.append({
                "match": f"{r.home} vs {r.away}",
                "score": f"{hs}-{as_}",
                "our_pick": our_pick,
                "actual_outcome": actual,
                "manual_correct": manual_correct,
                "stored_correct": r.is_correct,
                "labels_match": (manual_correct == r.is_correct),
                "snapshot_odds": snap_odds,
                "manual_pnl_1u": round(pnl, 3) if pnl is not None else None,
            })
        out["manual_roi_replication"] = {
            "checks": manual_checks,
            "all_labels_match": all(c["labels_match"] for c in manual_checks),
        }
    except Exception as e:
        out["errors"]["manual_roi"] = f"{type(e).__name__}: {str(e)[:300]}"
        await db.rollback()

    # 4. Brier score sanity (random sample)
    try:
        q = await db.execute(text("""
            SELECT
                p.home_win_prob, p.draw_prob, p.away_win_prob,
                pe.brier_score, pe.is_correct,
                mr.home_score, mr.away_score
            FROM predictions p
            JOIN prediction_evaluations pe ON pe.prediction_id = p.id
            JOIN matches m ON m.id = p.match_id
            JOIN match_results mr ON mr.match_id = m.id
            WHERE p.created_at >= '2026-04-16 11:00:00+00'
              AND p.predicted_at <= m.scheduled_at
              AND mr.home_score IS NOT NULL
            ORDER BY RANDOM() LIMIT 5
        """))
        brier_checks = []
        for r in q.all():
            hs, as_ = int(r.home_score), int(r.away_score)
            actual = (1, 0, 0) if hs > as_ else ((0, 0, 1) if as_ > hs else (0, 1, 0))
            probs = (float(r.home_win_prob or 0), float(r.draw_prob or 0), float(r.away_win_prob or 0))
            # Standard 1X2 Brier = mean over 3 classes (sum / 3)
            manual_brier_sum = sum((p - a) ** 2 for p, a in zip(probs, actual))
            manual_brier_mean = manual_brier_sum / 3
            stored = float(r.brier_score)
            brier_checks.append({
                "manual_brier_sum_form": round(manual_brier_sum, 6),
                "manual_brier_mean_form": round(manual_brier_mean, 6),
                "stored_brier": round(stored, 6),
                "matches_mean_form": abs(manual_brier_mean - stored) < 0.001,
                "matches_sum_form": abs(manual_brier_sum - stored) < 0.001,
            })
        out["brier_replication"] = {
            "checks": brier_checks,
            "stored_uses_mean_form": all(c["matches_mean_form"] for c in brier_checks),
            "stored_uses_sum_form": all(c["matches_sum_form"] for c in brier_checks),
        }
    except Exception as e:
        out["errors"]["brier_replication"] = f"{type(e).__name__}: {str(e)[:300]}"
        await db.rollback()

    if not out["errors"]:
        del out["errors"]
    return out


@router.get(
    "/team-search",
    summary="Diagnostic — search teams by name substring with logo URLs",
    dependencies=[Depends(require_internal_ops_key)],
)
async def team_search(
    q: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Find teams by name substring. Returns id, name, slug, logo_url, league."""
    from sqlalchemy import text
    rows = (await db.execute(
        text("""
            SELECT t.id::text, t.name, t.slug, t.logo_url, l.name AS league
            FROM teams t
            LEFT JOIN leagues l ON l.id = t.league_id
            WHERE LOWER(t.name) LIKE LOWER(:pat)
            ORDER BY t.name
            LIMIT 20
        """),
        {"pat": f"%{q}%"},
    )).all()
    return {
        "matches": [
            {"id": r[0], "name": r[1], "slug": r[2], "logo_url": r[3], "league": r[4]}
            for r in rows
        ]
    }


@router.get(
    "/audit/snapshot-coverage-per-month",
    summary="Diagnostic — snapshot + v8.1 prediction coverage per month",
    dependencies=[Depends(require_internal_ops_key)],
)
async def audit_snapshot_coverage(db: AsyncSession = Depends(get_db)) -> dict:
    """Per-month: count of v8.1 predictions, of those with snapshot, and
    those that pass the combo selector floor (snapshot + conf >= 0.62).

    Used to diagnose why combo-backfill returns 0 inserted on a date range.
    """
    from sqlalchemy import text
    q = await db.execute(text("""
        SELECT
            TO_CHAR(m.scheduled_at, 'YYYY-MM') AS yyyymm,
            COUNT(*) AS v81_preds,
            COUNT(*) FILTER (WHERE p.closing_odds_snapshot IS NOT NULL) AS with_snapshot,
            COUNT(*) FILTER (
                WHERE p.closing_odds_snapshot IS NOT NULL
                  AND p.confidence >= 0.62
            ) AS combo_eligible
        FROM predictions p
        JOIN matches m ON m.id = p.match_id
        WHERE p.created_at >= '2026-04-16 11:00:00+00'
          AND p.predicted_at <= m.scheduled_at
        GROUP BY yyyymm
        ORDER BY yyyymm
    """))
    rows = q.all()
    return {
        "per_month": [
            {
                "month": r[0],
                "v81_preds": int(r[1]),
                "with_snapshot": int(r[2]),
                "combo_eligible": int(r[3]),
            }
            for r in rows
        ],
        "total_months": len(rows),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Predictions ROI scenario sweep
# Goal: enumerate every parameter combination and find a stack that yields
# structurally +EV ROI on the v8.1 evaluated population.
# ─────────────────────────────────────────────────────────────────────────────


@router.get(
    "/audit/predictions-roi-scenarios",
    summary="Predictions ROI sweep — find stacks with positive ROI",
    dependencies=[Depends(require_internal_ops_key)],
)
async def audit_predictions_roi_scenarios(
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Sweep over confidence x edge x odds-range x pick-side combinations and
    return ROI on real bookmaker odds for each. Computed on the v8.1
    evaluated population that has a closing_odds_snapshot.
    """
    from sqlalchemy import text
    import json as _json

    out: dict = {"errors": {}}

    try:
        q = await db.execute(text("""
            SELECT
                p.confidence,
                p.home_win_prob, p.draw_prob, p.away_win_prob,
                p.prediction_source,
                pe.is_correct,
                CAST(p.closing_odds_snapshot AS TEXT) AS snap_text,
                l.name AS league
            FROM predictions p
            JOIN prediction_evaluations pe ON pe.prediction_id = p.id
            JOIN matches m ON m.id = p.match_id
            JOIN leagues l ON l.id = m.league_id
            WHERE p.created_at >= '2026-04-16 11:00:00+00'
              AND p.predicted_at <= m.scheduled_at
              AND p.closing_odds_snapshot IS NOT NULL
        """))
        rows = q.all()
    except Exception as e:
        out["errors"]["pull_population"] = f"{type(e).__name__}: {str(e)[:300]}"
        return out

    records = []
    for r in rows:
        try:
            snap = _json.loads(r.snap_text) if r.snap_text else None
        except Exception:
            snap = None
        if not isinstance(snap, dict):
            continue
        bm = snap.get("bookmaker_odds")
        if not isinstance(bm, dict):
            continue

        home_p = float(r.home_win_prob or 0)
        draw_p = float(r.draw_prob or 0)
        away_p = float(r.away_win_prob or 0)
        sides = [("home", home_p), ("draw", draw_p), ("away", away_p)]
        sides.sort(key=lambda x: x[1], reverse=True)
        pick_side, our_prob = sides[0]
        leg_odds_raw = bm.get(pick_side)
        if leg_odds_raw is None:
            continue
        try:
            leg_odds = float(leg_odds_raw)
        except (TypeError, ValueError):
            continue
        if leg_odds <= 1.0 or leg_odds > 100:
            continue

        try:
            ovh = 1.0 / float(bm.get("home", 0) or 0)
        except (ZeroDivisionError, TypeError, ValueError):
            ovh = 0.0
        try:
            ovd = 1.0 / float(bm.get("draw", 0) or 0)
        except (ZeroDivisionError, TypeError, ValueError):
            ovd = 0.0
        try:
            ova = 1.0 / float(bm.get("away", 0) or 0)
        except (ZeroDivisionError, TypeError, ValueError):
            ova = 0.0
        ov = ovh + ovd + ova
        if ov <= 0:
            continue
        raw_implied = 1.0 / leg_odds
        fair_implied = raw_implied / ov
        edge = our_prob - fair_implied

        pnl = (leg_odds - 1.0) if r.is_correct else -1.0

        records.append({
            "conf": float(r.confidence or 0),
            "pick": pick_side,
            "leg_odds": leg_odds,
            "edge": edge,
            "is_correct": bool(r.is_correct),
            "source": r.prediction_source,
            "league": r.league,
            "pnl": pnl,
        })

    out["population_size"] = len(rows)
    out["analysed_after_snapshot_parse"] = len(records)

    if not records:
        out["errors"]["no_records"] = "No records survived snapshot parsing"
        if not out["errors"]:
            del out["errors"]
        return out

    def stats(filtered):
        n = len(filtered)
        if n == 0:
            return {"n": 0, "hit_rate_pct": None, "roi_pct": None, "pnl": 0.0}
        won = sum(1 for r in filtered if r["is_correct"])
        pnl = sum(r["pnl"] for r in filtered)
        return {
            "n": n,
            "hit_rate_pct": round(100.0 * won / n, 2),
            "roi_pct": round(100.0 * pnl / n, 2),
            "pnl": round(pnl, 2),
            "avg_odds": round(sum(r["leg_odds"] for r in filtered) / n, 3),
            "avg_edge_pct": round(100.0 * sum(r["edge"] for r in filtered) / n, 2),
        }

    out["baseline"] = stats(records)

    out["by_confidence"] = {
        f"conf_ge_{thr:.2f}": stats([r for r in records if r["conf"] >= thr])
        for thr in (0.50, 0.55, 0.60, 0.62, 0.65, 0.70, 0.75, 0.78, 0.80, 0.85)
    }

    out["by_edge"] = {
        f"edge_ge_{int(thr*100):+d}pct": stats([r for r in records if r["edge"] >= thr])
        for thr in (-0.05, 0.0, 0.02, 0.04, 0.06, 0.08, 0.10, 0.15, 0.20)
    }

    odds_ranges = [
        ("1.10-1.50", 1.10, 1.50),
        ("1.30-1.80", 1.30, 1.80),
        ("1.50-2.20", 1.50, 2.20),
        ("1.80-2.60", 1.80, 2.60),
        ("2.20-3.50", 2.20, 3.50),
        ("3.00-5.00", 3.00, 5.00),
        ("5.00-10.0", 5.00, 10.00),
    ]
    out["by_odds_range"] = {
        label: stats([r for r in records if lo <= r["leg_odds"] <= hi])
        for label, lo, hi in odds_ranges
    }

    out["by_pick_side"] = {
        side: stats([r for r in records if r["pick"] == side])
        for side in ("home", "draw", "away")
    }

    out["by_source"] = {
        src: stats([r for r in records if r["source"] == src])
        for src in ("live", "backtest", "batch_local_fill")
    }

    league_groups = {}
    for r in records:
        league_groups.setdefault(r["league"] or "unknown", []).append(r)
    league_ranked = sorted(league_groups.items(), key=lambda kv: len(kv[1]), reverse=True)[:25]
    out["by_league_top25"] = {l: stats(rs) for l, rs in league_ranked}

    stacks = []
    for c_thr in (0.55, 0.60, 0.62, 0.65, 0.70, 0.75, 0.78, 0.80):
        for e_thr in (0.0, 0.02, 0.04, 0.06, 0.08, 0.10, 0.15):
            f = [r for r in records if r["conf"] >= c_thr and r["edge"] >= e_thr]
            s = stats(f)
            if s["n"] < 30:
                continue
            stacks.append({
                "conf_ge": c_thr,
                "edge_ge_pct": round(e_thr * 100, 1),
                **s,
            })
    stacks.sort(key=lambda x: x["roi_pct"] if x["roi_pct"] is not None else -999, reverse=True)
    out["top_stacks_conf_x_edge"] = stacks[:20]

    live_records = [r for r in records if r["source"] == "live"]
    if live_records:
        out["live_only_by_edge"] = {
            f"edge_ge_{int(thr*100)}pct": stats([r for r in live_records if r["edge"] >= thr])
            for thr in (0.0, 0.02, 0.04, 0.06, 0.08, 0.10)
        }

    out["pick_side_by_edge"] = {
        f"{side}_edge_ge_{int(thr*100)}pct": stats([
            r for r in records if r["pick"] == side and r["edge"] >= thr
        ])
        for side in ("home", "draw", "away")
        for thr in (0.0, 0.02, 0.05, 0.10)
    }

    # ── Live-only stack sweep (the prospective signal) ──
    live_records = [r for r in records if r["source"] == "live"]
    live_stacks = []
    for c_thr in (0.55, 0.60, 0.62, 0.65, 0.70, 0.75, 0.78):
        for e_thr in (0.0, 0.02, 0.04, 0.06, 0.08, 0.10):
            f = [r for r in live_records if r["conf"] >= c_thr and r["edge"] >= e_thr]
            s = stats(f)
            if s["n"] < 10:
                continue
            live_stacks.append({
                "conf_ge": c_thr,
                "edge_ge_pct": round(e_thr * 100, 1),
                **s,
            })
    live_stacks.sort(key=lambda x: x["roi_pct"] if x["roi_pct"] is not None else -999, reverse=True)
    out["top_live_only_stacks"] = live_stacks[:15]
    out["live_population"] = len(live_records)

    if not out["errors"]:
        del out["errors"]
    return out


@router.get(
    "/audit/per-tier-windowed",
    summary="Per-tier ROI on last N days (live source) — verify simulator claim",
    dependencies=[Depends(require_internal_ops_key)],
)
async def audit_per_tier_windowed(
    days: int = 14,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Per-tier ROI on the last N days, live forward-feed only.
    Replicates the /results simulator math so we can verify whether
    Platinum>Gold>Silver>Free really holds in recent days.
    """
    from sqlalchemy import text as _text
    import json as _json

    rows = (await db.execute(_text(f"""
        SELECT
            p.confidence,
            p.home_win_prob, p.draw_prob, p.away_win_prob,
            pe.is_correct,
            CAST(p.closing_odds_snapshot AS TEXT) AS snap_text,
            l.name AS league,
            l.id::text AS league_id,
            m.scheduled_at,
            p.prediction_source
        FROM predictions p
        JOIN prediction_evaluations pe ON pe.prediction_id = p.id
        JOIN matches m ON m.id = p.match_id
        JOIN leagues l ON l.id = m.league_id
        WHERE p.created_at >= '2026-04-16 11:00:00+00'
          AND p.predicted_at <= m.scheduled_at
          AND m.scheduled_at >= NOW() - INTERVAL '{int(days)} days'
          AND m.scheduled_at < NOW()
          AND p.closing_odds_snapshot IS NOT NULL
    """))).all()

    def stats(filt):
        n = len(filt)
        if n == 0:
            return {"n": 0, "hit_pct": None, "roi_pct": None, "pnl": 0.0, "avg_odds": None}
        won = sum(1 for x in filt if x["is_correct"])
        pnl = sum(x["pnl"] for x in filt)
        return {
            "n": n,
            "hit_pct": round(100.0 * won / n, 2),
            "roi_pct": round(100.0 * pnl / n, 2),
            "pnl": round(pnl, 2),
            "avg_odds": round(sum(x["odds"] for x in filt) / n, 3),
        }

    records = []
    for r in rows:
        try:
            snap = _json.loads(r.snap_text) if r.snap_text else None
        except Exception:
            snap = None
        if not isinstance(snap, dict):
            continue
        bm = snap.get("bookmaker_odds")
        if not isinstance(bm, dict):
            continue
        h = float(r.home_win_prob or 0)
        d = float(r.draw_prob or 0)
        a = float(r.away_win_prob or 0)
        sides = sorted([("home", h), ("draw", d), ("away", a)], key=lambda x: x[1], reverse=True)
        pick, our_p = sides[0]
        try:
            o = float(bm.get(pick) or 0)
        except (TypeError, ValueError):
            continue
        if o <= 1.0:
            continue
        pnl = (o - 1.0) if r.is_correct else -1.0
        # Tier classification by confidence (simple ladder, not league-gated)
        c = float(r.confidence or 0)
        tier = (
            "platinum" if c >= 0.78
            else "gold" if c >= 0.70
            else "silver" if c >= 0.62
            else "free"
        )
        records.append({
            "tier": tier,
            "is_correct": bool(r.is_correct),
            "pnl": pnl,
            "odds": o,
            "source": r.prediction_source,
        })

    out = {
        "days_window": days,
        "total_records": len(records),
        "by_tier_all_sources": {
            t: stats([r for r in records if r["tier"] == t])
            for t in ("platinum", "gold", "silver", "free")
        },
        "by_tier_live_only": {
            t: stats([r for r in records if r["tier"] == t and r["source"] == "live"])
            for t in ("platinum", "gold", "silver", "free")
        },
        # Same per-tier but with odds floor 1.50 (avoid heavy favorites that don't pay)
        "by_tier_odds_ge_1_50": {
            t: stats([r for r in records if r["tier"] == t and r["odds"] >= 1.5])
            for t in ("platinum", "gold", "silver", "free")
        },
        "by_tier_odds_ge_1_80": {
            t: stats([r for r in records if r["tier"] == t and r["odds"] >= 1.8])
            for t in ("platinum", "gold", "silver", "free")
        },
        # Odds distribution per tier (so we can see if Platinum is buried in
        # heavy-favorite low-odds plays)
        "odds_buckets_per_tier": {
            t: {
                "lt_1.30": sum(1 for r in records if r["tier"] == t and r["odds"] < 1.30),
                "1.30-1.60": sum(1 for r in records if r["tier"] == t and 1.30 <= r["odds"] < 1.60),
                "1.60-2.00": sum(1 for r in records if r["tier"] == t and 1.60 <= r["odds"] < 2.00),
                "2.00-2.60": sum(1 for r in records if r["tier"] == t and 2.00 <= r["odds"] < 2.60),
                "ge_2.60": sum(1 for r in records if r["tier"] == t and r["odds"] >= 2.60),
            }
            for t in ("platinum", "gold", "silver", "free")
        },
    }
    return out


@router.get(
    "/audit/saudi-spot-check",
    summary="Saudi Pro League — verify the 100% hit rate spike",
    dependencies=[Depends(require_internal_ops_key)],
)
async def saudi_spot_check(db: AsyncSession = Depends(get_db)) -> dict:
    """Pull every Saudi Pro League prediction in the v8.1 evaluated set with
    snapshot odds. Show predicted side, model probs, actual score, and
    is_correct grade so we can verify whether 100% hit rate is real or a
    data anomaly (mis-graded results, single-side dominance, etc.).
    """
    from sqlalchemy import text
    import json as _json

    q = await db.execute(text("""
        SELECT
            p.id::text AS pid,
            p.confidence,
            p.home_win_prob, p.draw_prob, p.away_win_prob,
            pe.is_correct,
            pe.actual_outcome,
            CAST(p.closing_odds_snapshot AS TEXT) AS snap_text,
            ht.name AS home, at.name AS away,
            mr.home_score, mr.away_score,
            m.scheduled_at
        FROM predictions p
        JOIN prediction_evaluations pe ON pe.prediction_id = p.id
        JOIN matches m ON m.id = p.match_id
        JOIN leagues l ON l.id = m.league_id
        JOIN teams ht ON ht.id = m.home_team_id
        JOIN teams at ON at.id = m.away_team_id
        LEFT JOIN match_results mr ON mr.match_id = m.id
        WHERE l.name = 'Saudi Pro League'
          AND p.created_at >= '2026-04-16 11:00:00+00'
          AND p.predicted_at <= m.scheduled_at
          AND p.closing_odds_snapshot IS NOT NULL
        ORDER BY m.scheduled_at DESC
        LIMIT 50
    """))
    rows = q.all()

    out_rows = []
    pick_counts = {"home": 0, "draw": 0, "away": 0}
    correct_count = 0
    for r in rows:
        try:
            snap = _json.loads(r.snap_text) if r.snap_text else None
        except Exception:
            snap = None
        bm = snap.get("bookmaker_odds") if isinstance(snap, dict) else {}

        home_p = float(r.home_win_prob or 0)
        draw_p = float(r.draw_prob or 0)
        away_p = float(r.away_win_prob or 0)
        sides = [("home", home_p), ("draw", draw_p), ("away", away_p)]
        sides.sort(key=lambda x: x[1], reverse=True)
        pick_side = sides[0][0]
        pick_counts[pick_side] += 1

        hs = int(r.home_score) if r.home_score is not None else None
        as_ = int(r.away_score) if r.away_score is not None else None
        actual_from_score = None
        if hs is not None and as_ is not None:
            actual_from_score = (
                "home" if hs > as_ else "away" if as_ > hs else "draw"
            )

        if r.is_correct:
            correct_count += 1

        out_rows.append({
            "pid": r.pid,
            "scheduled_at": r.scheduled_at.isoformat() if r.scheduled_at else None,
            "match": f"{r.home} vs {r.away}",
            "score": f"{hs}-{as_}" if hs is not None else None,
            "model_pick": pick_side,
            "model_probs": {"home": round(home_p, 3), "draw": round(draw_p, 3), "away": round(away_p, 3)},
            "actual_from_score": actual_from_score,
            "actual_outcome_stored": r.actual_outcome,
            "is_correct_stored": r.is_correct,
            "manual_correct": (
                pick_side == actual_from_score
                if actual_from_score is not None else None
            ),
            "labels_match": (
                (pick_side == actual_from_score) == bool(r.is_correct)
                if actual_from_score is not None else None
            ),
            "snapshot_odds": (bm if isinstance(bm, dict) else None),
        })

    return {
        "total_pulled": len(rows),
        "pick_distribution": pick_counts,
        "stored_correct_count": correct_count,
        "stored_hit_rate_pct": round(100.0 * correct_count / len(rows), 2) if rows else None,
        "rows": out_rows,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Predictions Rebuild — Phase 3: Parameter optimisation on rolling 14d windows
# ─────────────────────────────────────────────────────────────────────────────


@router.get(
    "/audit/rebuild-phase3-parameter-opt",
    summary="Rebuild Phase 3 — rolling 14d window optimisation per parameter combo",
    dependencies=[Depends(require_internal_ops_key)],
)
async def audit_rebuild_phase3_param_opt(
    sources: str = "live,backtest,batch_local_fill",
    db: AsyncSession = Depends(get_db),
) -> dict:
    """For every (confidence, edge, min_odds, max_odds) combination,
    compute rolling 14-day windows and report:
      - Total picks
      - Lifetime ROI
      - % of windows positive
      - Avg picks per window
      - Best / worst window ROI

    Tier-fit per the rebuild brief:
      - Platinum: 80%+ windows positive, n>=5 per 14d
      - Gold:    70%+, n>=12 per 14d
      - Silver:  60%+, n>=25 per 14d
      - Free:    break-even, max 28 per 14d (~2/dag)
    """
    from sqlalchemy import text as _text
    import json as _json
    from datetime import timedelta

    out: dict = {"errors": {}}

    src_list = [s.strip() for s in sources.split(",") if s.strip()]
    src_filter = ",".join(f"'{s}'" for s in src_list)

    rows = (await db.execute(_text(f"""
        SELECT
            p.confidence,
            p.home_win_prob, p.draw_prob, p.away_win_prob,
            pe.is_correct,
            CAST(p.closing_odds_snapshot AS TEXT) AS snap_text,
            l.name AS league,
            m.scheduled_at,
            p.prediction_source
        FROM predictions p
        JOIN prediction_evaluations pe ON pe.prediction_id = p.id
        JOIN matches m ON m.id = p.match_id
        JOIN leagues l ON l.id = m.league_id
        WHERE p.created_at >= '2026-04-16 11:00:00+00'
          AND p.predicted_at <= m.scheduled_at
          AND p.closing_odds_snapshot IS NOT NULL
          AND p.prediction_source IN ({src_filter})
    """))).all()

    records = []
    for r in rows:
        try:
            snap = _json.loads(r.snap_text) if r.snap_text else None
        except Exception:
            snap = None
        if not isinstance(snap, dict):
            continue
        bm = snap.get("bookmaker_odds")
        if not isinstance(bm, dict):
            continue
        h = float(r.home_win_prob or 0)
        d = float(r.draw_prob or 0)
        a = float(r.away_win_prob or 0)
        sides = sorted(
            [("home", h), ("draw", d), ("away", a)],
            key=lambda x: x[1], reverse=True,
        )
        pick, our_p = sides[0]
        try:
            o = float(bm.get(pick) or 0)
            h_o = float(bm.get("home", 0) or 0)
            d_o = float(bm.get("draw", 0) or 0)
            a_o = float(bm.get("away", 0) or 0)
        except (TypeError, ValueError):
            continue
        if o <= 1.0 or h_o <= 1.0 or a_o <= 1.0:
            continue
        ovr = 1.0 / h_o + 1.0 / a_o + (1.0 / d_o if d_o > 1.0 else 0.0)
        if ovr <= 0:
            continue
        edge = our_p - (1.0 / o) / ovr
        pnl = (o - 1.0) if r.is_correct else -1.0
        records.append({
            "conf": float(r.confidence or 0),
            "odds": o,
            "edge": edge,
            "is_correct": bool(r.is_correct),
            "scheduled_at": r.scheduled_at,
            "pnl": pnl,
            "source": r.prediction_source,
            "league": r.league,
        })

    out["population"] = len(records)
    out["sources_used"] = src_list

    if not records:
        out["errors"]["no_records"] = "no records"
        return out

    records.sort(key=lambda x: x["scheduled_at"])
    first_dt = records[0]["scheduled_at"]
    last_dt = records[-1]["scheduled_at"]
    span_days = (last_dt - first_dt).days
    out["span"] = {
        "first_scheduled": first_dt.isoformat(),
        "last_scheduled": last_dt.isoformat(),
        "days": span_days,
    }

    # Build window starts every 7 days (rolling) of length 14d
    window_starts = []
    cur = first_dt
    while cur + timedelta(days=14) <= last_dt + timedelta(days=1):
        window_starts.append(cur)
        cur += timedelta(days=7)

    # Tier requirements
    tier_floor = {"platinum": 5, "gold": 12, "silver": 25, "free": 1}

    confs = (0.55, 0.60, 0.62, 0.65, 0.70, 0.75, 0.78, 0.82)
    edges = (-0.05, 0.0, 0.02, 0.04, 0.06, 0.08, 0.10, 0.12)
    min_odds_opts = (1.30, 1.50, 1.70, 1.90)
    max_odds_opts = (3.00, 4.00, 100.00)  # 100 = no ceiling

    results = []
    for c in confs:
        for e in edges:
            for lo in min_odds_opts:
                for hi in max_odds_opts:
                    full = [
                        x for x in records
                        if x["conf"] >= c and x["edge"] >= e
                        and lo <= x["odds"] <= hi
                    ]
                    if len(full) < 50:
                        # Skip degenerate combos with <50 total picks across full body
                        continue
                    won = sum(1 for x in full if x["is_correct"])
                    pnl = sum(x["pnl"] for x in full)
                    n = len(full)
                    lifetime_roi = 100.0 * pnl / n
                    lifetime_hit = 100.0 * won / n

                    # Rolling windows
                    window_results = []
                    for start in window_starts:
                        end = start + timedelta(days=14)
                        w = [
                            x for x in full
                            if start <= x["scheduled_at"] < end
                        ]
                        if not w:
                            continue
                        wn = len(w)
                        wpnl = sum(x["pnl"] for x in w)
                        window_results.append({
                            "n": wn,
                            "roi": 100.0 * wpnl / wn,
                        })
                    if not window_results:
                        continue
                    n_pos = sum(1 for w in window_results if w["roi"] > 0)
                    pct_pos = 100.0 * n_pos / len(window_results)
                    avg_n = sum(w["n"] for w in window_results) / len(window_results)
                    rois = [w["roi"] for w in window_results]
                    worst = min(rois)
                    best = max(rois)

                    results.append({
                        "conf_ge": c,
                        "edge_ge_pct": round(e * 100, 1),
                        "min_odds": lo,
                        "max_odds": hi,
                        "n_total": n,
                        "lifetime_roi_pct": round(lifetime_roi, 2),
                        "lifetime_hit_pct": round(lifetime_hit, 2),
                        "windows_total": len(window_results),
                        "windows_pos_pct": round(pct_pos, 1),
                        "avg_picks_per_14d": round(avg_n, 1),
                        "best_window_roi_pct": round(best, 2),
                        "worst_window_roi_pct": round(worst, 2),
                    })

    out["windows_analysed"] = len(window_starts)

    # Per-tier candidate selection
    candidates_per_tier = {}
    for tier_name, min_n_per_window in tier_floor.items():
        if tier_name == "platinum":
            pct_threshold = 80.0
        elif tier_name == "gold":
            pct_threshold = 70.0
        elif tier_name == "silver":
            pct_threshold = 60.0
        else:
            pct_threshold = 50.0  # free: just break-even

        # Filter by sample size + windows positive %
        eligible = [
            r for r in results
            if r["avg_picks_per_14d"] >= min_n_per_window
            and r["windows_pos_pct"] >= pct_threshold
        ]
        # For free, also cap avg picks per 14d at 28 (~2/day)
        if tier_name == "free":
            eligible = [r for r in eligible if r["avg_picks_per_14d"] <= 28]
        # Sort by lifetime ROI
        eligible.sort(key=lambda x: x["lifetime_roi_pct"], reverse=True)
        candidates_per_tier[tier_name] = eligible[:10]

    out["candidates_per_tier"] = candidates_per_tier

    # Top 30 stacks overall by lifetime ROI (with min sample size 100)
    top_overall = [r for r in results if r["n_total"] >= 100]
    top_overall.sort(key=lambda x: x["lifetime_roi_pct"], reverse=True)
    out["top_30_overall"] = top_overall[:30]

    if not out["errors"]:
        del out["errors"]
    return out


# ─────────────────────────────────────────────────────────────────────────────
# Predictions Rebuild — Phase 1.1C: Feature-pipeline isolation spot-check
# ─────────────────────────────────────────────────────────────────────────────


@router.get(
    "/audit/feature-isolation-spotcheck",
    summary="Re-run feature_service for sample predictions and diff against stored snapshot",
    dependencies=[Depends(require_internal_ops_key)],
)
async def feature_isolation_spotcheck(db: AsyncSession = Depends(get_db)) -> dict:
    """For 10 random predictions: re-run feature_service.build_features
    NOW and diff against the stored features_snapshot. If feature_service
    uses cutoff = match.scheduled_at consistently and the underlying
    historical data hasn't been mutated, diffs should be near zero.

    Material diffs = either feature service is non-deterministic OR
    historical data was added/changed after the original prediction was
    made (which would shift point-in-time features).
    """
    from sqlalchemy import text as _text
    from app.features.feature_service import FeatureService

    rows = (await db.execute(_text("""
        SELECT
            p.id::text AS pid,
            p.match_id::text AS mid,
            p.prediction_source,
            p.predicted_at,
            m.scheduled_at,
            CAST(p.features_snapshot AS TEXT) AS snap_text
        FROM predictions p
        JOIN matches m ON m.id = p.match_id
        WHERE p.created_at >= '2026-04-16 11:00:00+00'
          AND p.features_snapshot IS NOT NULL
        ORDER BY RANDOM()
        LIMIT 10
    """))).all()

    import json as _json
    fs = FeatureService()
    out_rows = []
    for r in rows:
        try:
            stored = _json.loads(r.snap_text) if r.snap_text else {}
        except Exception:
            stored = {}
        try:
            # Re-run features now with the same cutoff (= match.scheduled_at)
            # The feature service derives cutoff from the match itself, so we
            # just call build_features and trust the internal cutoff logic.
            import uuid as _uuid
            recomputed = await fs.build_match_features(_uuid.UUID(r.mid), db)
            recomputed_dict = (
                recomputed if isinstance(recomputed, dict) else {}
            )
        except Exception as exc:
            out_rows.append({
                "pid": r.pid,
                "mid": r.mid,
                "source": r.prediction_source,
                "scheduled_at": r.scheduled_at.isoformat(),
                "error": f"{type(exc).__name__}: {str(exc)[:200]}",
            })
            continue

        # Diff every shared key
        keys = sorted(set(stored.keys()) | set(recomputed_dict.keys()))
        diffs = []
        identical = 0
        for k in keys:
            sv = stored.get(k)
            rv = recomputed_dict.get(k)
            if sv == rv:
                identical += 1
            else:
                # Tolerance for float drift
                try:
                    if abs(float(sv) - float(rv)) < 1e-4:
                        identical += 1
                        continue
                except (TypeError, ValueError):
                    pass
                diffs.append({"key": k, "stored": sv, "recomputed": rv})

        out_rows.append({
            "pid": r.pid,
            "mid": r.mid,
            "source": r.prediction_source,
            "scheduled_at": r.scheduled_at.isoformat(),
            "predicted_at": r.predicted_at.isoformat() if r.predicted_at else None,
            "total_keys": len(keys),
            "identical_keys": identical,
            "diffs_count": len(diffs),
            "diffs_first_5": diffs[:5],
        })

    total_keys_compared = sum(r.get("total_keys", 0) for r in out_rows)
    total_identical = sum(r.get("identical_keys", 0) for r in out_rows)
    total_diffs = sum(r.get("diffs_count", 0) for r in out_rows)
    return {
        "samples": len(out_rows),
        "total_keys_compared": total_keys_compared,
        "identical_keys": total_identical,
        "differing_keys": total_diffs,
        "identical_pct": (
            round(100.0 * total_identical / total_keys_compared, 2)
            if total_keys_compared else None
        ),
        "verdict": (
            "✅ Features reproducible — backtest source is point-in-time clean"
            if total_keys_compared and total_identical / total_keys_compared > 0.95
            else "⚠ Material drift — investigate per-row diffs"
            if total_keys_compared
            else "no data"
        ),
        "rows": out_rows,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Predictions Rebuild — Phase 2B: Live-only ROI scenario sweep
# ─────────────────────────────────────────────────────────────────────────────


@router.get(
    "/audit/rebuild-phase2b-live-sweep",
    summary="Rebuild Phase 2B — live-only ROI sweep across params x tier x window",
    dependencies=[Depends(require_internal_ops_key)],
)
async def audit_rebuild_phase2b_live_sweep(db: AsyncSession = Depends(get_db)) -> dict:
    """Live-only sweep. Source = 'live' ONLY (the clean cohort from Phase 1).

    Returns ROI for parameter combinations on prediction_source='live':
      - by_confidence
      - by_edge
      - by_odds_range
      - top_stacks_conf_x_edge_x_odds (n>=10)
      - per_tier_recipes (proposed parameter sets per tier with rolling windows)

    No backtest / batch_local_fill source — those are polluted (see Phase 1).
    """
    from sqlalchemy import text as _text
    import json as _json

    out: dict = {"errors": {}}

    rows = (await db.execute(_text("""
        SELECT
            p.id::text AS pid,
            p.confidence,
            p.home_win_prob, p.draw_prob, p.away_win_prob,
            pe.is_correct,
            CAST(p.closing_odds_snapshot AS TEXT) AS snap_text,
            l.name AS league,
            l.id::text AS league_id,
            m.scheduled_at,
            p.predicted_at
        FROM predictions p
        JOIN prediction_evaluations pe ON pe.prediction_id = p.id
        JOIN matches m ON m.id = p.match_id
        JOIN leagues l ON l.id = m.league_id
        WHERE p.prediction_source = 'live'
          AND p.created_at >= '2026-04-16 11:00:00+00'
          AND p.predicted_at < m.scheduled_at
          AND p.closing_odds_snapshot IS NOT NULL
        ORDER BY m.scheduled_at ASC
    """))).all()

    records = []
    for r in rows:
        try:
            snap = _json.loads(r.snap_text) if r.snap_text else None
        except Exception:
            snap = None
        if not isinstance(snap, dict):
            continue
        bm = snap.get("bookmaker_odds")
        if not isinstance(bm, dict):
            continue
        h = float(r.home_win_prob or 0)
        d = float(r.draw_prob or 0)
        a = float(r.away_win_prob or 0)
        sides = sorted(
            [("home", h), ("draw", d), ("away", a)],
            key=lambda x: x[1], reverse=True,
        )
        pick, our_p = sides[0]
        try:
            o = float(bm.get(pick) or 0)
            h_o = float(bm.get("home", 0) or 0)
            d_o = float(bm.get("draw", 0) or 0)
            a_o = float(bm.get("away", 0) or 0)
        except (TypeError, ValueError):
            continue
        if o <= 1.0 or h_o <= 1.0 or a_o <= 1.0:
            continue
        ovr = 1.0 / h_o + 1.0 / a_o + (1.0 / d_o if d_o > 1.0 else 0.0)
        if ovr <= 0:
            continue
        edge = our_p - (1.0 / o) / ovr
        pnl = (o - 1.0) if r.is_correct else -1.0
        records.append({
            "conf": float(r.confidence or 0),
            "pick": pick,
            "odds": o,
            "edge": edge,
            "is_correct": bool(r.is_correct),
            "league": r.league,
            "scheduled_at": r.scheduled_at,
            "pnl": pnl,
        })

    out["live_population"] = len(rows)
    out["analysed"] = len(records)

    if not records:
        out["errors"]["no_records"] = "No live records survived parsing"
        return out

    def stats(filt):
        n = len(filt)
        if n == 0:
            return {"n": 0, "hit_pct": None, "roi_pct": None, "pnl": 0.0, "avg_odds": None}
        won = sum(1 for x in filt if x["is_correct"])
        pnl = sum(x["pnl"] for x in filt)
        return {
            "n": n,
            "hit_pct": round(100.0 * won / n, 2),
            "roi_pct": round(100.0 * pnl / n, 2),
            "pnl": round(pnl, 2),
            "avg_odds": round(sum(x["odds"] for x in filt) / n, 3),
            "avg_edge_pct": round(100.0 * sum(x["edge"] for x in filt) / n, 2),
        }

    out["baseline"] = stats(records)

    out["by_confidence"] = {
        f"conf_ge_{thr:.2f}": stats([r for r in records if r["conf"] >= thr])
        for thr in (0.50, 0.55, 0.60, 0.62, 0.65, 0.70, 0.75, 0.78, 0.82)
    }

    out["by_edge"] = {
        f"edge_ge_{int(thr*100):+d}pct": stats([r for r in records if r["edge"] >= thr])
        for thr in (-0.05, 0.0, 0.02, 0.05, 0.08, 0.10, 0.12, 0.15)
    }

    out["by_odds_range"] = {
        label: stats([r for r in records if lo <= r["odds"] <= hi])
        for label, lo, hi in [
            ("1.30-1.50", 1.30, 1.50),
            ("1.50-1.70", 1.50, 1.70),
            ("1.70-1.90", 1.70, 1.90),
            ("1.90-2.20", 1.90, 2.20),
            ("2.20-2.60", 2.20, 2.60),
            ("2.60-3.50", 2.60, 3.50),
            ("ge_3.50", 3.50, 100),
        ]
    }

    # ── Proposed per-tier recipes per the rebuild brief ──
    # Each tier needs:
    #  - Min sample requirement per 14d window (Platinum 5, Gold 12, Silver 25, Free <=28)
    #  - +EV in majority of 14d windows
    #
    # We compute candidate recipes server-side and report ROI + sample size.
    # The full rolling-window analysis happens in Phase 3 — this is the
    # candidate shortlist.

    candidate_recipes = [
        # Platinum candidates: tight conf + edge + odds floor
        {"label": "Platinum-A: conf>=0.78 + edge>=8% + odds>=1.50",
         "conf": 0.78, "edge": 0.08, "min_odds": 1.50, "max_odds": 100, "tier": "platinum"},
        {"label": "Platinum-B: conf>=0.75 + edge>=10% + odds>=1.50",
         "conf": 0.75, "edge": 0.10, "min_odds": 1.50, "max_odds": 100, "tier": "platinum"},
        {"label": "Platinum-C: conf>=0.70 + edge>=10% + odds in [1.70, 3.00]",
         "conf": 0.70, "edge": 0.10, "min_odds": 1.70, "max_odds": 3.00, "tier": "platinum"},
        # Gold candidates: middle-conf + clear edge
        {"label": "Gold-A: conf>=0.70 + edge>=6% + odds>=1.50",
         "conf": 0.70, "edge": 0.06, "min_odds": 1.50, "max_odds": 100, "tier": "gold"},
        {"label": "Gold-B: conf>=0.65 + edge>=8% + odds>=1.60",
         "conf": 0.65, "edge": 0.08, "min_odds": 1.60, "max_odds": 100, "tier": "gold"},
        # Silver candidates: looser conf + moderate edge
        {"label": "Silver-A: conf>=0.62 + edge>=4% + odds>=1.60",
         "conf": 0.62, "edge": 0.04, "min_odds": 1.60, "max_odds": 100, "tier": "silver"},
        {"label": "Silver-B: conf>=0.62 + edge>=6% + odds>=1.50",
         "conf": 0.62, "edge": 0.06, "min_odds": 1.50, "max_odds": 100, "tier": "silver"},
        # Free candidates: top picks of the day
        {"label": "Free-A: conf>=0.55 + edge>=10% + odds>=1.70",
         "conf": 0.55, "edge": 0.10, "min_odds": 1.70, "max_odds": 100, "tier": "free"},
    ]

    recipe_results = []
    for r in candidate_recipes:
        filt = [
            x for x in records
            if x["conf"] >= r["conf"]
            and x["edge"] >= r["edge"]
            and r["min_odds"] <= x["odds"] <= r["max_odds"]
        ]
        s = stats(filt)
        recipe_results.append({**r, **s})
    out["candidate_recipes"] = recipe_results

    # ── Open conf x edge x odds_floor exhaustive sweep (n>=10) ──
    stacks = []
    for c in (0.55, 0.60, 0.62, 0.65, 0.70, 0.75, 0.78, 0.82):
        for e in (0.0, 0.02, 0.04, 0.06, 0.08, 0.10, 0.12):
            for o_floor in (1.30, 1.50, 1.70, 1.90):
                filt = [
                    x for x in records
                    if x["conf"] >= c and x["edge"] >= e and x["odds"] >= o_floor
                ]
                s = stats(filt)
                if s["n"] < 10:
                    continue
                stacks.append({
                    "conf_ge": c, "edge_ge_pct": round(e * 100, 1),
                    "odds_ge": o_floor,
                    **s,
                })
    stacks.sort(key=lambda x: x["roi_pct"] if x["roi_pct"] is not None else -999, reverse=True)
    out["top_stacks"] = stacks[:30]

    # ── Rolling 14-day window analysis on best stack ──
    # For the most-promising stack, count how many 14-day windows are +EV.
    if stacks:
        best = stacks[0]
        records_sorted = sorted(records, key=lambda x: x["scheduled_at"])
        window_size = timedelta(days=14)
        if records_sorted:
            first_date = records_sorted[0]["scheduled_at"]
            last_date = records_sorted[-1]["scheduled_at"]
            cur = first_date
            windows = []
            while cur + window_size <= last_date + timedelta(days=1):
                end = cur + window_size
                window_filt = [
                    x for x in records_sorted
                    if cur <= x["scheduled_at"] < end
                    and x["conf"] >= best["conf_ge"]
                    and x["edge"] >= best["edge_ge_pct"] / 100.0
                    and x["odds"] >= best["odds_ge"]
                ]
                if window_filt:
                    s = stats(window_filt)
                    windows.append({
                        "window_start": cur.date().isoformat(),
                        "window_end": end.date().isoformat(),
                        **s,
                    })
                cur += timedelta(days=7)  # rolling 7-day step

            n_pos = sum(1 for w in windows if (w.get("roi_pct") or 0) > 0)
            out["rolling_window_check_best_stack"] = {
                "best_stack": best,
                "windows_analysed": len(windows),
                "windows_positive_roi": n_pos,
                "windows_positive_pct": round(100.0 * n_pos / len(windows), 1) if windows else None,
                "windows": windows,
            }

    # ── League ranked ROI within live cohort ──
    league_groups = {}
    for r in records:
        league_groups.setdefault(r["league"] or "unknown", []).append(r)
    league_ranked = sorted(league_groups.items(), key=lambda kv: len(kv[1]), reverse=True)[:25]
    out["by_league_top25"] = {l: stats(rs) for l, rs in league_ranked}

    if not out["errors"]:
        del out["errors"]
    return out
# ─────────────────────────────────────────────────────────────────────────────
# Predictions Rebuild — Phase 1: Data Integrity Audit
# ─────────────────────────────────────────────────────────────────────────────


@router.get(
    "/audit/rebuild-phase1-integrity",
    summary="Rebuild Phase 1 — leakage + coverage integrity audit",
    dependencies=[Depends(require_internal_ops_key)],
)
async def audit_rebuild_phase1(db: AsyncSession = Depends(get_db)) -> dict:
    """Phase 1 of Predictions rebuild — leakage + data-coverage checks.

    Runs five sub-checks in one query batch:
      A) Pre-match lock integrity per source
      B) Closing odds capture timing vs kickoff
      C) Sample for feature-pipeline spot-check (manual reproduction needed)
      D) v81 cutoff respect overall (counts in / out)
      1.2) Data coverage per period + tier + snapshot fill
    """
    from sqlalchemy import text as _text

    out: dict = {"errors": {}}

    # ── Check A — Pre-match lock per source (post-deploy) ──
    try:
        q = await db.execute(_text("""
            SELECT
                p.prediction_source,
                COUNT(*) FILTER (WHERE p.predicted_at > m.scheduled_at) AS post_kickoff,
                COUNT(*) FILTER (WHERE p.predicted_at = m.scheduled_at) AS exact_same,
                COUNT(*) FILTER (WHERE p.predicted_at < m.scheduled_at) AS pre_match,
                COUNT(*) AS total,
                AVG(EXTRACT(EPOCH FROM (m.scheduled_at - p.predicted_at)) / 3600.0)
                  FILTER (WHERE p.predicted_at < m.scheduled_at) AS avg_lead_hours_pre
            FROM predictions p
            JOIN matches m ON m.id = p.match_id
            WHERE p.created_at >= '2026-04-16 11:00:00+00'
            GROUP BY p.prediction_source
            ORDER BY p.prediction_source
        """))
        out["A_pre_match_lock_per_source"] = [
            {
                "source": r[0],
                "post_kickoff": int(r[1]),
                "exact_same_as_kickoff": int(r[2]),
                "pre_match_strict": int(r[3]),
                "total": int(r[4]),
                "avg_lead_hours_pre_match": round(float(r[5] or 0), 2),
                "leakage_flag": int(r[1]) > 0,
            }
            for r in q.all()
        ]
    except Exception as e:
        out["errors"]["A_pre_match_lock"] = f"{type(e).__name__}: {str(e)[:300]}"

    # ── Check B — Closing odds capture timing ──
    # Snapshot may include {timestamp, recorded_at, fetched_at, source}.
    # We sample 30 and inspect to see if any odds were captured POST kickoff.
    try:
        q = await db.execute(_text("""
            SELECT
                p.id::text AS pid,
                p.prediction_source,
                CAST(p.closing_odds_snapshot AS TEXT) AS snap_text,
                m.scheduled_at,
                p.predicted_at
            FROM predictions p
            JOIN matches m ON m.id = p.match_id
            WHERE p.created_at >= '2026-04-16 11:00:00+00'
              AND p.closing_odds_snapshot IS NOT NULL
            ORDER BY RANDOM()
            LIMIT 30
        """))
        import json as _json
        from datetime import datetime, timezone
        snap_check_rows = []
        for r in q.all():
            try:
                snap = _json.loads(r.snap_text) if r.snap_text else None
            except Exception:
                snap = None
            snap_ts = None
            for k in ("recorded_at", "fetched_at", "timestamp", "captured_at"):
                if isinstance(snap, dict) and snap.get(k):
                    snap_ts = snap[k]
                    break
            post_kickoff = None
            if snap_ts:
                try:
                    parsed = datetime.fromisoformat(str(snap_ts).replace("Z", "+00:00"))
                    if parsed.tzinfo is None:
                        parsed = parsed.replace(tzinfo=timezone.utc)
                    post_kickoff = parsed > r.scheduled_at
                except Exception:
                    post_kickoff = None
            snap_check_rows.append({
                "pid": r.pid,
                "source": r.prediction_source,
                "scheduled_at": r.scheduled_at.isoformat(),
                "predicted_at": r.predicted_at.isoformat() if r.predicted_at else None,
                "snapshot_keys": (
                    sorted(list(snap.keys())) if isinstance(snap, dict) else None
                ),
                "snapshot_timestamp_field": snap_ts,
                "snapshot_post_kickoff": post_kickoff,
            })
        post_kickoff_count = sum(
            1 for r in snap_check_rows if r["snapshot_post_kickoff"] is True
        )
        out["B_closing_odds_capture_timing"] = {
            "sampled": len(snap_check_rows),
            "snapshot_post_kickoff_count": post_kickoff_count,
            "leakage_flag": post_kickoff_count > 0,
            "rows": snap_check_rows,
        }
    except Exception as e:
        out["errors"]["B_closing_odds"] = f"{type(e).__name__}: {str(e)[:300]}"

    # ── Check C — Feature pipeline isolation sample ──
    # Pull 20 random predictions with features_snapshot — caller will need to
    # reproduce features point-in-time externally; we surface IDs + snapshot
    # so the comparison can be done without re-running the full ML pipeline
    # in this endpoint.
    try:
        q = await db.execute(_text("""
            SELECT
                p.id::text AS pid,
                p.prediction_source,
                p.predicted_at,
                m.scheduled_at,
                m.id::text AS mid,
                ht.name || ' vs ' || at.name AS match_label,
                p.features_snapshot IS NOT NULL AS has_snapshot
            FROM predictions p
            JOIN matches m ON m.id = p.match_id
            JOIN teams ht ON ht.id = m.home_team_id
            JOIN teams at ON at.id = m.away_team_id
            WHERE p.created_at >= '2026-04-16 11:00:00+00'
            ORDER BY RANDOM()
            LIMIT 20
        """))
        out["C_feature_isolation_sample"] = {
            "note": (
                "Manual reproduction needed — re-run feature_service "
                "with cutoff = predicted_at and compare to features_snapshot. "
                "Mismatch = leakage. Identical = clean."
            ),
            "rows": [
                {
                    "pid": r.pid,
                    "match_id": r.mid,
                    "match": r.match_label,
                    "source": r.prediction_source,
                    "predicted_at": r.predicted_at.isoformat() if r.predicted_at else None,
                    "scheduled_at": r.scheduled_at.isoformat(),
                    "has_features_snapshot": r.has_snapshot,
                }
                for r in q.all()
            ],
        }
    except Exception as e:
        out["errors"]["C_feature_sample"] = f"{type(e).__name__}: {str(e)[:300]}"

    # ── Check D — v81 cutoff respect ──
    try:
        q = await db.execute(_text("""
            SELECT
                COUNT(*) FILTER (WHERE p.created_at >= '2026-04-16 11:00:00+00') AS post_v81,
                COUNT(*) FILTER (WHERE p.created_at < '2026-04-16 11:00:00+00') AS pre_v81,
                COUNT(*) AS total
            FROM predictions p
        """))
        r = q.first()
        out["D_v81_cutoff_population"] = {
            "post_v81": int(r[0]),
            "pre_v81": int(r[1]),
            "total": int(r[2]),
            "note": (
                "trackrecord_filter() excludes pre_v81 from every aggregate "
                "endpoint. Pre-v81 rows are kept only for historical context."
            ),
        }
    except Exception as e:
        out["errors"]["D_v81_cutoff"] = f"{type(e).__name__}: {str(e)[:300]}"

    # ── 1.2 Data coverage ──
    try:
        q = await db.execute(_text("""
            SELECT
                COUNT(*) FILTER (WHERE p.created_at >= '2026-04-16 11:00:00+00'
                                  AND pe.id IS NOT NULL) AS evaluated_post_v81,
                COUNT(*) FILTER (WHERE p.created_at >= '2025-01-01'
                                  AND pe.id IS NOT NULL) AS evaluated_since_2025,
                COUNT(*) FILTER (WHERE p.created_at >= '2026-04-16 11:00:00+00'
                                  AND p.closing_odds_snapshot IS NOT NULL) AS post_v81_with_snapshot,
                COUNT(*) FILTER (WHERE p.created_at >= '2026-04-16 11:00:00+00') AS post_v81_total
            FROM predictions p
            LEFT JOIN prediction_evaluations pe ON pe.prediction_id = p.id
        """))
        r = q.first()
        out["coverage_overview"] = {
            "evaluated_post_v81": int(r[0]),
            "evaluated_since_2025_01_01": int(r[1]),
            "post_v81_with_snapshot": int(r[2]),
            "post_v81_total": int(r[3]),
            "snapshot_coverage_pct": round(
                100.0 * int(r[2]) / int(r[3]), 2
            ) if r[3] else None,
        }
    except Exception as e:
        out["errors"]["coverage_overview"] = f"{type(e).__name__}: {str(e)[:300]}"

    # Per-tier coverage (using simple confidence ladder, post-v81 evaluated)
    try:
        q = await db.execute(_text("""
            SELECT
                CASE
                  WHEN p.confidence >= 0.78 THEN 'platinum'
                  WHEN p.confidence >= 0.70 THEN 'gold'
                  WHEN p.confidence >= 0.62 THEN 'silver'
                  WHEN p.confidence >= 0.55 THEN 'free'
                  ELSE 'below_floor'
                END AS tier,
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE p.closing_odds_snapshot IS NOT NULL) AS with_snapshot,
                COUNT(*) FILTER (WHERE pe.id IS NOT NULL) AS evaluated
            FROM predictions p
            LEFT JOIN prediction_evaluations pe ON pe.prediction_id = p.id
            JOIN matches m ON m.id = p.match_id
            WHERE p.created_at >= '2026-04-16 11:00:00+00'
              AND p.predicted_at <= m.scheduled_at
            GROUP BY tier
            ORDER BY tier
        """))
        out["coverage_per_tier_post_v81"] = [
            {
                "tier": r[0],
                "total": int(r[1]),
                "with_snapshot": int(r[2]),
                "evaluated": int(r[3]),
                "snapshot_pct": round(100.0 * int(r[2]) / int(r[1]), 2) if r[1] else None,
            }
            for r in q.all()
        ]
    except Exception as e:
        out["errors"]["coverage_per_tier"] = f"{type(e).__name__}: {str(e)[:300]}"

    if not out["errors"]:
        del out["errors"]
    return out


