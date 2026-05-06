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
                COUNT(*) FILTER (WHERE result IS NOT NULL) AS evaluated,
                SUM(CASE WHEN result = 'won' THEN 1 ELSE 0 END) AS won,
                SUM(CASE WHEN result = 'lost' THEN 1 ELSE 0 END) AS lost,
                SUM(actual_pnl) AS pnl,
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

