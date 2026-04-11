"""v5 rebuild admin endpoints.

These are fire-and-forget, idempotent endpoints that the one-off
migration to the v5 data stack goes through. They are **all** POSTs
because each one mutates the database. None of them require
authentication in this first cut — Dennis is expected to call them
manually via curl, and all of them are harmless to re-run.

Flow:
  1. POST /api/admin/v5/backfill-fixtures
        → pull finished fixtures for the last 90 days from API-Football
          for each configured league. Upserts by external_id.
  2. POST /api/admin/v5/backfill-statistics
        → for every finished match without a MatchStatistics row, fetch
          shots/possession/corners/cards from API-Football.
  3. POST /api/admin/v5/backfill-odds
        → fetch pre-match 1X2 / Over-Under / BTTS odds for every
          finished match without an odds_history row in the 1x2 market.
  4. POST /api/admin/v5/backfill-top-scorers
        → refresh the top_scorers table for every configured league.
  5. POST /api/admin/v5/backfill-elo-history
        → wipe team_elo_history and rebuild sequentially from finished
          matches. No external API calls. Hard-fail anti-leakage.
  6. POST /api/admin/v5/regenerate-predictions
        → delete all evaluated predictions and regenerate them against
          the new Elo history. Also evaluates them against actual
          results so the strategy metrics see a fresh sample.
  7. POST /api/admin/v5/seed-ou-strategies
        → insert the two new Over/Under seed strategies if they
          don't exist yet.

Every endpoint returns a summary dict and logs via structlog.
"""
from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import get_db
from app.forecasting.elo_history import EloHistoryService
from app.ingestion.adapters.api_football import (
    APIFootballAdapter,
    LEAGUE_SLUG_TO_ID,
)
from app.models.elo_history import TeamEloHistory
from app.models.league import League
from app.models.match import Match, MatchResult, MatchStatus
from app.models.match_statistics import MatchStatistics
from app.models.odds import OddsHistory
from app.models.prediction import (
    Prediction,
    PredictionEvaluation,
    PredictionExplanation,
)
from app.models.strategy import PredictionStrategy, Strategy
from app.models.top_scorer import TopScorer
from app.services.api_usage_tracker import record_api_call

router = APIRouter()
log = logging.getLogger(__name__)

_settings = get_settings()


# Leagues the v5 rebuild targets. Mirrors LEAGUE_PROVIDER_CONFIG minus
# leagues API-Football doesn't cover (championship, belgian, super-lig).
V5_LEAGUES = [
    ("premier-league", "Premier League", 39),
    ("la-liga", "La Liga", 140),
    ("bundesliga", "Bundesliga", 78),
    ("serie-a", "Serie A", 135),
    ("ligue-1", "Ligue 1", 61),
    ("eredivisie", "Eredivisie", 88),
]


def _season_for_date(d: date) -> int:
    """Football season year — season 2025/26 starts in July 2025."""
    return d.year if d.month >= 7 else d.year - 1


async def _api_football() -> APIFootballAdapter:
    if not _settings.api_football_key:
        raise HTTPException(
            status_code=503, detail="API_FOOTBALL_KEY not configured"
        )
    client = httpx.AsyncClient(timeout=30)
    return APIFootballAdapter(
        config={
            "api_key": _settings.api_football_key,
            "rate_limit_seconds": 0.3,
        },
        http_client=client,
    )


# ──────────────────────────────────────────────────────────────────────────────
# 1. Fixtures backfill
# ──────────────────────────────────────────────────────────────────────────────


@router.post(
    "/backfill-fixtures",
    summary="Pull last-90d finished fixtures for all v5 leagues (API-Football)",
)
async def backfill_fixtures(
    days: int = 90,
    db: AsyncSession = Depends(get_db),
):
    """Pull finished fixtures for the last *days* days. Idempotent
    upsert on ``external_id``."""
    import traceback
    adapter = await _api_football()
    today = date.today()
    date_from = today - timedelta(days=days)

    created_matches = 0
    updated_matches = 0
    created_results = 0
    api_calls = 0
    per_league: list[dict] = []
    fatal_error: Optional[str] = None

    try:
        # Make sure every target league exists first
        for slug, name, _api_id in V5_LEAGUES:
            lg = (
                await db.execute(select(League).where(League.slug == slug))
            ).scalar_one_or_none()
            if lg is None:
                lg = League(
                    id=uuid.uuid4(),
                    slug=slug,
                    name=name,
                    country="",
                    tier=1,
                    is_active=True,
                    sport_id=await _ensure_football_sport_id(db),
                )
                db.add(lg)
                await db.flush()

        await db.commit()

        for slug, name, api_league_id in V5_LEAGUES:
            season = _season_for_date(today)
            t0 = datetime.now(timezone.utc)
            try:
                raw = await adapter.fetch_fixtures_raw(
                    league_id=api_league_id,
                    season=season,
                    date_from=date_from,
                    date_to=today,
                    status="FT-AET-PEN",
                )
                api_calls += 1
                await record_api_call(
                    "api_football",
                    "/fixtures",
                    200,
                    int((datetime.now(timezone.utc) - t0).total_seconds() * 1000),
                )
            except Exception as exc:
                log.warning("backfill_fixtures_league_failed slug=%s err=%s", slug, exc)
                per_league.append({"league": slug, "error": str(exc)})
                continue

            lg = (
                await db.execute(select(League).where(League.slug == slug))
            ).scalar_one_or_none()
            if lg is None:
                continue

            league_created = 0
            league_updated = 0
            league_results = 0
            for item in raw:
                try:
                    result = await _upsert_fixture_from_api_football(
                        db=db, item=item, league=lg
                    )
                    if result == "created":
                        league_created += 1
                        created_matches += 1
                    elif result == "updated":
                        league_updated += 1
                        updated_matches += 1
                    if result in ("created", "updated"):
                        rc = await _upsert_result_from_api_football(
                            db=db, item=item
                        )
                        if rc:
                            league_results += 1
                            created_results += 1
                except Exception as exc:
                    log.warning(
                        "fixture_upsert_failed slug=%s item_id=%s err=%s",
                        slug,
                        (item.get("fixture") or {}).get("id"),
                        exc,
                    )
            await db.commit()

            per_league.append(
                {
                    "league": slug,
                    "raw_count": len(raw),
                    "created": league_created,
                    "updated": league_updated,
                    "results_upserted": league_results,
                }
            )
    except Exception as exc:
        log.exception("backfill_fixtures_fatal")
        try:
            await db.rollback()
        except Exception:
            pass
        fatal_error = f"{type(exc).__name__}: {exc}\n{traceback.format_exc()[:2000]}"
    finally:
        try:
            await adapter.http_client.aclose()
        except Exception:
            pass

    return {
        "days_window": days,
        "api_calls": api_calls,
        "created_matches": created_matches,
        "updated_matches": updated_matches,
        "created_results": created_results,
        "per_league": per_league,
        "fatal_error": fatal_error,
    }


# ──────────────────────────────────────────────────────────────────────────────
# 2. Match statistics backfill
# ──────────────────────────────────────────────────────────────────────────────


@router.post(
    "/backfill-statistics",
    summary="Pull fixture stats (shots/possession/corners/cards) for finished matches",
)
async def backfill_statistics(
    limit: int = 300,
    db: AsyncSession = Depends(get_db),
):
    """For finished matches without a ``match_statistics`` row, hit
    API-Football's ``/fixtures/statistics`` endpoint. Respects *limit*
    to cap the number of API calls per invocation."""
    adapter = await _api_football()
    # Only target matches that were ingested via API-Football (their
    # external_id starts with ``apifb_match_``). Anything synced via
    # football-data.org uses a different prefix and can't be looked up
    # in API-Football's /fixtures/statistics endpoint anyway.
    # Order by scheduled_at DESC so the most recent matches get
    # enriched first — most valuable for the strategy metrics.
    target_ids_stmt = (
        select(Match.id, Match.external_id)
        .outerjoin(MatchStatistics, MatchStatistics.match_id == Match.id)
        .where(
            and_(
                Match.status == MatchStatus.FINISHED,
                MatchStatistics.id.is_(None),
                Match.external_id.is_not(None),
                Match.external_id.like("apifb_match_%"),
            )
        )
        .order_by(Match.scheduled_at.desc())
        .limit(limit)
    )
    rows = (await db.execute(target_ids_stmt)).all()
    calls = 0
    inserted = 0
    skipped = 0
    errors: list[dict] = []

    try:
        for match_id, external_id in rows:
            if not external_id or not external_id.startswith("apifb_match_"):
                skipped += 1
                continue
            raw_id = external_id.replace("apifb_match_", "")
            try:
                t0 = datetime.now(timezone.utc)
                stats = await adapter.fetch_fixture_statistics(raw_id)
                calls += 1
                await record_api_call(
                    "api_football",
                    "/fixtures/statistics",
                    200,
                    int((datetime.now(timezone.utc) - t0).total_seconds() * 1000),
                )
            except Exception as exc:
                errors.append({"match_id": str(match_id), "err": str(exc)})
                continue

            home = stats.get("home") or {}
            away = stats.get("away") or {}
            if not (home or away):
                skipped += 1
                continue

            db.add(
                MatchStatistics(
                    id=uuid.uuid4(),
                    match_id=match_id,
                    home_shots_total=home.get("shots_total"),
                    home_shots_on_target=home.get("shots_on_target"),
                    home_possession_pct=home.get("possession_pct"),
                    home_corners=home.get("corners"),
                    home_yellow_cards=home.get("yellow_cards"),
                    home_red_cards=home.get("red_cards"),
                    home_fouls=home.get("fouls"),
                    home_offsides=home.get("offsides"),
                    home_passes_accurate=home.get("passes_accurate"),
                    away_shots_total=away.get("shots_total"),
                    away_shots_on_target=away.get("shots_on_target"),
                    away_possession_pct=away.get("possession_pct"),
                    away_corners=away.get("corners"),
                    away_yellow_cards=away.get("yellow_cards"),
                    away_red_cards=away.get("red_cards"),
                    away_fouls=away.get("fouls"),
                    away_offsides=away.get("offsides"),
                    away_passes_accurate=away.get("passes_accurate"),
                    source_provider="api_football",
                )
            )
            inserted += 1
            if inserted % 25 == 0:
                await db.commit()

        await db.commit()
    finally:
        try:
            await adapter.http_client.aclose()
        except Exception:
            pass

    return {
        "matches_considered": len(rows),
        "api_calls": calls,
        "rows_inserted": inserted,
        "skipped": skipped,
        "errors": errors[:10],
    }


# ──────────────────────────────────────────────────────────────────────────────
# 3. Historical odds backfill
# ──────────────────────────────────────────────────────────────────────────────


@router.post(
    "/backfill-odds",
    summary="Pull pre-match 1X2/O-U/BTTS odds for finished matches without 1x2 row",
)
async def backfill_odds(
    limit: int = 300,
    db: AsyncSession = Depends(get_db),
):
    import traceback
    fatal_error: Optional[str] = None
    adapter = await _api_football()

    # Subquery: match_ids that already have a 1x2 odds row.
    existing_stmt = select(OddsHistory.match_id).where(
        OddsHistory.market.in_(["1x2", "1X2"])
    )
    existing_ids = {row[0] for row in (await db.execute(existing_stmt)).all()}

    # Only target matches whose external_id is an API-Football id — we
    # can't look up odds for a football-data.org-sourced match here.
    target_stmt = (
        select(Match.id, Match.external_id)
        .where(
            and_(
                Match.status == MatchStatus.FINISHED,
                Match.external_id.is_not(None),
                Match.external_id.like("apifb_match_%"),
            )
        )
        .order_by(Match.scheduled_at.desc())
        .limit(limit * 2)
    )
    all_rows = (await db.execute(target_stmt)).all()
    targets = [(mid, ext) for mid, ext in all_rows if mid not in existing_ids][:limit]

    calls = 0
    rows_inserted = 0
    errors: list[dict] = []

    try:
        for match_id, external_id in targets:
            if not external_id or not external_id.startswith("apifb_match_"):
                continue
            raw_id = external_id.replace("apifb_match_", "")
            try:
                t0 = datetime.now(timezone.utc)
                odds = await adapter.fetch_pre_match_odds_raw(raw_id)
                calls += 1
                await record_api_call(
                    "api_football",
                    "/odds",
                    200,
                    int((datetime.now(timezone.utc) - t0).total_seconds() * 1000),
                )
            except Exception as exc:
                errors.append({"match_id": str(match_id), "err": str(exc)})
                continue

            if not odds:
                continue

            now = datetime.now(timezone.utc)
            # One row per market so the aggregate helper stays simple.
            if odds.get("home_odds") and odds.get("away_odds"):
                db.add(
                    OddsHistory(
                        id=uuid.uuid4(),
                        match_id=match_id,
                        source="api_football_avg",
                        market="1x2",
                        home_odds=odds.get("home_odds"),
                        draw_odds=odds.get("draw_odds"),
                        away_odds=odds.get("away_odds"),
                        recorded_at=now,
                    )
                )
                rows_inserted += 1

            if odds.get("over_odds") and odds.get("under_odds"):
                db.add(
                    OddsHistory(
                        id=uuid.uuid4(),
                        match_id=match_id,
                        source="api_football_avg",
                        market="over_under_2_5",
                        over_odds=odds.get("over_odds"),
                        under_odds=odds.get("under_odds"),
                        total_line=2.5,
                        recorded_at=now,
                    )
                )
                rows_inserted += 1

            if odds.get("btts_yes_odds") and odds.get("btts_no_odds"):
                db.add(
                    OddsHistory(
                        id=uuid.uuid4(),
                        match_id=match_id,
                        source="api_football_avg",
                        market="btts",
                        btts_yes_odds=odds.get("btts_yes_odds"),
                        btts_no_odds=odds.get("btts_no_odds"),
                        recorded_at=now,
                    )
                )
                rows_inserted += 1

            if rows_inserted % 30 == 0:
                await db.commit()

        await db.commit()
    except Exception as exc:
        log.exception("backfill_odds_fatal")
        try:
            await db.rollback()
        except Exception:
            pass
        fatal_error = f"{type(exc).__name__}: {exc}\n{traceback.format_exc()[:2000]}"
    finally:
        try:
            await adapter.http_client.aclose()
        except Exception:
            pass

    return {
        "matches_considered": len(targets),
        "api_calls": calls,
        "rows_inserted": rows_inserted,
        "errors": errors[:10],
        "fatal_error": fatal_error,
    }


# ──────────────────────────────────────────────────────────────────────────────
# 4. Top scorers backfill
# ──────────────────────────────────────────────────────────────────────────────


@router.post(
    "/backfill-top-scorers",
    summary="Refresh top scorers for every configured league",
)
async def backfill_top_scorers(
    db: AsyncSession = Depends(get_db),
):
    adapter = await _api_football()
    season = _season_for_date(date.today())
    api_calls = 0
    inserted = 0
    per_league: list[dict] = []
    try:
        for slug, _name, api_league_id in V5_LEAGUES:
            league = (
                await db.execute(select(League).where(League.slug == slug))
            ).scalar_one_or_none()
            if league is None:
                per_league.append({"league": slug, "skipped": "league_missing"})
                continue

            try:
                t0 = datetime.now(timezone.utc)
                scorers = await adapter.fetch_top_scorers(api_league_id, season)
                api_calls += 1
                await record_api_call(
                    "api_football",
                    "/players/topscorers",
                    200,
                    int((datetime.now(timezone.utc) - t0).total_seconds() * 1000),
                )
            except Exception as exc:
                per_league.append({"league": slug, "err": str(exc)})
                continue

            # Wipe the league's existing rows for this season, re-insert.
            await db.execute(
                delete(TopScorer).where(
                    and_(
                        TopScorer.league_id == league.id,
                        TopScorer.season_name == str(season),
                    )
                )
            )

            for scorer in scorers:
                db.add(
                    TopScorer(
                        id=uuid.uuid4(),
                        league_id=league.id,
                        season_name=str(season),
                        rank=scorer["rank"],
                        player_external_id=scorer.get("player_external_id") or None,
                        player_name=scorer.get("player_name") or "",
                        team_name=scorer.get("team_name") or None,
                        team_external_id=scorer.get("team_external_id") or None,
                        nationality=scorer.get("nationality"),
                        photo_url=scorer.get("photo_url"),
                        goals=scorer.get("goals") or 0,
                        assists=scorer.get("assists"),
                        appearances=scorer.get("appearances"),
                        minutes_played=scorer.get("minutes_played"),
                        source_provider="api_football",
                    )
                )
                inserted += 1
            await db.commit()
            per_league.append(
                {"league": slug, "scorers": len(scorers)}
            )
    finally:
        try:
            await adapter.http_client.aclose()
        except Exception:
            pass

    return {
        "api_calls": api_calls,
        "rows_inserted": inserted,
        "per_league": per_league,
    }


# ──────────────────────────────────────────────────────────────────────────────
# 5. Elo history backfill
# ──────────────────────────────────────────────────────────────────────────────


@router.post(
    "/backfill-elo-history",
    summary="Wipe team_elo_history and rebuild sequentially from finished matches",
)
async def backfill_elo_history(
    db: AsyncSession = Depends(get_db),
):
    svc = EloHistoryService(db)
    result = await svc.reset_and_backfill()
    await db.commit()

    # Sanity check: return the current top-10 teams by latest rating.
    top_stmt = (
        select(
            TeamEloHistory.team_id,
            func.max(TeamEloHistory.effective_at).label("latest"),
        )
        .group_by(TeamEloHistory.team_id)
        .subquery()
    )
    latest_ratings_stmt = (
        select(TeamEloHistory)
        .join(
            top_stmt,
            and_(
                TeamEloHistory.team_id == top_stmt.c.team_id,
                TeamEloHistory.effective_at == top_stmt.c.latest,
            ),
        )
        .order_by(TeamEloHistory.rating.desc())
        .limit(10)
    )
    top_rows = (await db.execute(latest_ratings_stmt)).scalars().all()

    top_teams = []
    for row in top_rows:
        team_name = None
        try:
            from app.models.team import Team
            team_obj = (
                await db.execute(select(Team).where(Team.id == row.team_id))
            ).scalar_one_or_none()
            if team_obj:
                team_name = team_obj.name
        except Exception:
            pass
        top_teams.append(
            {
                "team_id": str(row.team_id),
                "team_name": team_name,
                "rating": round(row.rating, 1),
                "effective_at": row.effective_at.isoformat(),
            }
        )

    return {
        "matches_processed": result["processed"],
        "rows_inserted": result["total_rows"],
        "top_10_current_teams": top_teams,
    }


# ──────────────────────────────────────────────────────────────────────────────
# 6. Regenerate predictions
# ──────────────────────────────────────────────────────────────────────────────


@router.post(
    "/regenerate-predictions",
    summary="Wipe predictions + evaluate against real results using v5 Elo",
)
async def regenerate_predictions(
    limit: int = 1000,
    db: AsyncSession = Depends(get_db),
):
    """Drop every existing prediction (they were generated with leaky
    Elo seeds) and regenerate them chronologically for every finished
    match using the new EloHistoryService-backed ensemble. Each new
    prediction is then evaluated against the actual result so the
    strategy metrics see a fresh sample immediately.
    """
    from app.forecasting.forecast_service import ForecastService
    from app.models.model_version import ModelVersion

    # Ensure an active ensemble model version exists.
    mv_row = (
        await db.execute(
            select(ModelVersion).where(ModelVersion.is_active.is_(True)).limit(1)
        )
    ).scalar_one_or_none()
    if mv_row is None:
        mv_row = ModelVersion(
            id=uuid.uuid4(),
            name="BetsPlug Ensemble v5",
            version="5.0.0",
            model_type="ensemble",
            sport_scope="all",
            is_active=True,
            description="v5 rebuild: ensemble backed by persistent point-in-time Elo.",
            hyperparameters={
                "weights": {"elo": 1.0, "poisson": 1.2, "logistic": 0.8},
            },
            trained_at=datetime.now(timezone.utc),
        )
        db.add(mv_row)
        await db.commit()

    # Wipe existing predictions / evaluations / explanations / strategy links.
    await db.execute(delete(PredictionStrategy))
    await db.execute(delete(PredictionEvaluation))
    await db.execute(delete(PredictionExplanation))
    await db.execute(delete(Prediction))
    await db.commit()

    # Walk every finished match chronologically.
    stmt = (
        select(Match)
        .join(MatchResult, MatchResult.match_id == Match.id)
        .where(Match.status == MatchStatus.FINISHED)
        .order_by(Match.scheduled_at.asc())
        .limit(limit)
    )
    matches = list((await db.execute(stmt)).scalars().all())

    forecast_service = ForecastService()

    generated = 0
    evaluated = 0
    leakage_failures = 0
    errors: list[dict] = []
    for match in matches:
        try:
            pred = await forecast_service.generate_forecast(match.id, db)
            generated += 1
        except Exception as exc:
            errors.append(
                {"match_id": str(match.id), "stage": "forecast", "err": str(exc)}
            )
            if "Leakage" in str(exc) or "FeatureLeakage" in type(exc).__name__:
                leakage_failures += 1
            continue

        # Evaluate against actual result.
        result = (
            await db.execute(
                select(MatchResult).where(MatchResult.match_id == match.id)
            )
        ).scalar_one_or_none()
        if result is None:
            continue

        if result.home_score > result.away_score:
            actual = "home"
        elif result.home_score < result.away_score:
            actual = "away"
        else:
            actual = "draw"

        probs = {
            "home": float(pred.home_win_prob or 0.0),
            "draw": float(pred.draw_prob or 0.0),
            "away": float(pred.away_win_prob or 0.0),
        }
        predicted = max(probs, key=lambda k: probs[k])
        is_correct = predicted == actual
        brier = (1.0 - probs[actual]) ** 2

        db.add(
            PredictionEvaluation(
                id=uuid.uuid4(),
                prediction_id=pred.id,
                actual_outcome=actual,
                actual_home_score=result.home_score,
                actual_away_score=result.away_score,
                is_correct=is_correct,
                brier_score=brier,
                log_loss=None,
                evaluated_at=datetime.now(timezone.utc),
            )
        )
        evaluated += 1

        if evaluated % 50 == 0:
            await db.commit()

    await db.commit()

    return {
        "model_version_id": str(mv_row.id),
        "matches_considered": len(matches),
        "predictions_generated": generated,
        "predictions_evaluated": evaluated,
        "leakage_failures": leakage_failures,
        "errors_sample": errors[:5],
    }


# ──────────────────────────────────────────────────────────────────────────────
# 7. Seed Over/Under strategies
# ──────────────────────────────────────────────────────────────────────────────


@router.post(
    "/seed-ou-strategies",
    summary="Insert the two v5 Over/Under seed strategies",
)
async def seed_ou_strategies(
    db: AsyncSession = Depends(get_db),
):
    defs = [
        {
            "name": "High-Scoring Match",
            "description": (
                "Over 2.5 goals pick when both sides have strong attacking "
                "form and our Poisson lambda sees value over the market."
            ),
            "rules": [
                {"feature": "expected_total_goals", "operator": ">", "value": 2.8},
                {"feature": "over_2_5_edge", "operator": ">", "value": 0.04},
            ],
        },
        {
            "name": "Defensive Battle",
            "description": (
                "Under 2.5 goals pick when both sides are defensively tight "
                "and the market overestimates the total."
            ),
            "rules": [
                {"feature": "expected_total_goals", "operator": "<", "value": 2.2},
                {"feature": "under_2_5_edge", "operator": ">", "value": 0.04},
            ],
        },
    ]

    created = 0
    updated = 0
    for d in defs:
        existing = (
            await db.execute(select(Strategy).where(Strategy.name == d["name"]))
        ).scalar_one_or_none()
        if existing is None:
            db.add(
                Strategy(
                    id=uuid.uuid4(),
                    name=d["name"],
                    description=d["description"],
                    rules=d["rules"],
                    staking={"type": "flat", "amount": 1.0},
                    # Start inactive until validation has data
                    is_active=False,
                )
            )
            created += 1
        else:
            existing.description = d["description"]
            updated += 1
    await db.commit()
    return {"created": created, "updated": updated}


# ══════════════════════════════════════════════════════════════════════════════
# Helpers
# ══════════════════════════════════════════════════════════════════════════════


async def _ensure_football_sport_id(db: AsyncSession) -> uuid.UUID:
    from app.models.sport import Sport
    row = (
        await db.execute(select(Sport).where(Sport.slug == "football"))
    ).scalar_one_or_none()
    if row is None:
        row = Sport(
            id=uuid.uuid4(),
            slug="football",
            name="Football",
            icon="⚽",
            is_active=True,
        )
        db.add(row)
        await db.flush()
    return row.id


async def _upsert_fixture_from_api_football(
    db: AsyncSession, item: dict, league: League
) -> str:
    """Upsert a single API-Football fixture item into matches.

    Returns "created", "updated", or "skipped".
    """
    fixture = item.get("fixture", {}) or {}
    teams = item.get("teams", {}) or {}
    league_info = item.get("league", {}) or {}

    api_id = fixture.get("id")
    if api_id is None:
        return "skipped"
    external_id = f"apifb_match_{api_id}"

    home_team_raw = teams.get("home") or {}
    away_team_raw = teams.get("away") or {}
    if not home_team_raw.get("name") or not away_team_raw.get("name"):
        return "skipped"

    home_team = await _upsert_team(db, league, home_team_raw)
    away_team = await _upsert_team(db, league, away_team_raw)

    season_name = str(league_info.get("season") or "")
    season = await _ensure_season(db, league.id, season_name)

    scheduled_str = fixture.get("date")
    if not scheduled_str:
        return "skipped"
    try:
        scheduled_at = datetime.fromisoformat(scheduled_str.replace("Z", "+00:00"))
    except ValueError:
        return "skipped"

    raw_status = (fixture.get("status") or {}).get("short", "")
    finished_codes = {"FT", "AET", "PEN", "WO", "AWD"}
    if raw_status in finished_codes:
        status = MatchStatus.FINISHED
    elif raw_status in {"PST", "CANC", "ABD"}:
        status = MatchStatus.CANCELLED
    else:
        status = MatchStatus.SCHEDULED

    existing = (
        await db.execute(select(Match).where(Match.external_id == external_id))
    ).scalar_one_or_none()
    if existing is None:
        match = Match(
            id=uuid.uuid4(),
            league_id=league.id,
            season_id=season.id if season else None,
            home_team_id=home_team.id,
            away_team_id=away_team.id,
            external_id=external_id,
            status=status,
            scheduled_at=scheduled_at,
            venue=(fixture.get("venue") or {}).get("name"),
            round_name=league_info.get("round"),
            matchday=None,
        )
        db.add(match)
        await db.flush()
        return "created"
    else:
        existing.status = status
        existing.scheduled_at = scheduled_at
        return "updated"


async def _upsert_team(db: AsyncSession, league: League, team_raw: dict):
    from app.models.team import Team
    import re

    name = team_raw.get("name") or ""
    slug_raw = re.sub(r"[^\w\s-]", "", name.lower())
    slug_raw = re.sub(r"[\s_]+", "-", slug_raw).strip("-")
    if not slug_raw:
        slug_raw = f"team-{team_raw.get('id')}"

    existing = (
        await db.execute(select(Team).where(Team.slug == slug_raw))
    ).scalar_one_or_none()
    if existing is not None:
        return existing

    team = Team(
        id=uuid.uuid4(),
        league_id=league.id,
        slug=slug_raw,
        name=name,
        short_name=team_raw.get("code"),
        country=team_raw.get("country"),
        venue=None,
        logo_url=team_raw.get("logo"),
        is_active=True,
    )
    db.add(team)
    await db.flush()
    return team


async def _ensure_season(db: AsyncSession, league_id: uuid.UUID, season_name: str):
    """Find-or-create a Season row.

    API-Football returns the season as a single year integer ("2025"),
    but the existing DataSyncService writes names like "2025-2026".
    We normalise to the "YYYY-YYYY" format so both code paths share
    the same rows. start_date / end_date are NOT NULL in the schema —
    we derive them from the year.
    """
    from datetime import date as _date
    from app.models.season import Season

    if not season_name:
        return None

    # Normalise "2025" → "2025-2026". Leave strings that already have
    # a dash alone.
    normalised = season_name
    if "-" not in normalised:
        try:
            year = int(normalised)
            normalised = f"{year}-{year + 1}"
        except ValueError:
            normalised = season_name

    existing = (
        await db.execute(
            select(Season).where(
                and_(Season.league_id == league_id, Season.name == normalised)
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        return existing

    # Derive start/end from the first year of the normalised name.
    try:
        start_year = int(normalised.split("-")[0])
    except (ValueError, IndexError):
        start_year = _date.today().year
    season = Season(
        id=uuid.uuid4(),
        league_id=league_id,
        name=normalised,
        start_date=_date(start_year, 8, 1),
        end_date=_date(start_year + 1, 5, 31),
        is_current=True,
    )
    db.add(season)
    await db.flush()
    return season


async def _upsert_result_from_api_football(db: AsyncSession, item: dict) -> bool:
    fixture = item.get("fixture", {}) or {}
    api_id = fixture.get("id")
    if api_id is None:
        return False
    external_id = f"apifb_match_{api_id}"

    match = (
        await db.execute(select(Match).where(Match.external_id == external_id))
    ).scalar_one_or_none()
    if match is None:
        return False

    goals = item.get("goals", {}) or {}
    score = item.get("score", {}) or {}
    ft = score.get("fulltime", {}) or {}
    ht = score.get("halftime", {}) or {}

    home_score = ft.get("home") if ft.get("home") is not None else goals.get("home")
    away_score = ft.get("away") if ft.get("away") is not None else goals.get("away")
    if home_score is None or away_score is None:
        return False

    existing = (
        await db.execute(
            select(MatchResult).where(MatchResult.match_id == match.id)
        )
    ).scalar_one_or_none()
    if existing is not None:
        existing.home_score = int(home_score)
        existing.away_score = int(away_score)
        existing.home_score_ht = ht.get("home")
        existing.away_score_ht = ht.get("away")
        existing.winner = (
            "home" if home_score > away_score else ("away" if home_score < away_score else "draw")
        )
        return True

    db.add(
        MatchResult(
            id=uuid.uuid4(),
            match_id=match.id,
            home_score=int(home_score),
            away_score=int(away_score),
            home_score_ht=ht.get("home"),
            away_score_ht=ht.get("away"),
            winner=(
                "home" if home_score > away_score else ("away" if home_score < away_score else "draw")
            ),
            extra_data=None,
        )
    )
    return True
