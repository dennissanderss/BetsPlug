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
from fastapi import APIRouter, Depends, HTTPException, Query
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


# All tier-1 domestic leagues + European cups targeted by the prediction engine.
# API-Football Pro tier (7 500 req/day) easily covers all of these.
V5_LEAGUES = [
    # Top 6 domestic
    ("premier-league", "Premier League", 39),
    ("la-liga", "La Liga", 140),
    ("bundesliga", "Bundesliga", 78),
    ("serie-a", "Serie A", 135),
    ("ligue-1", "Ligue 1", 61),
    ("eredivisie", "Eredivisie", 88),
    # European cups
    ("champions-league", "Champions League", 2),
    ("europa-league", "Europa League", 3),
    ("conference-league", "Conference League", 848),
    # Additional tier-1 domestic
    ("championship", "Championship", 40),
    ("primeira-liga", "Primeira Liga", 94),
    ("super-lig", "Süper Lig", 203),
    ("jupiler-pro-league", "Jupiler Pro League", 144),
    ("scottish-premiership", "Scottish Premiership", 179),
    ("swiss-super-league", "Swiss Super League", 207),
    # Americas
    ("brasileirao-serie-a", "Brasileirão Série A", 71),
    ("liga-mx", "Liga MX", 262),
    ("mls", "MLS", 253),
    ("copa-libertadores", "Copa Libertadores", 13),
    ("liga-profesional-argentina", "Liga Profesional Argentina", 128),
    # Rest of world
    ("saudi-pro-league", "Saudi Pro League", 307),
    ("j1-league", "J1 League", 98),
    ("a-league", "A-League", 188),
    ("k-league-1", "K League 1", 292),
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
# 0. Team logos backfill
# ──────────────────────────────────────────────────────────────────────────────


@router.post(
    "/backfill-team-logos",
    summary="Fetch missing team logos from API-Football for all leagues",
)
async def backfill_team_logos(
    db: AsyncSession = Depends(get_db),
):
    """For every league mapped in API-Football, fetch team rosters and
    update logo_url on teams that currently have NULL logos."""
    from app.models.team import Team
    from app.models.league import League
    from app.ingestion.adapters.api_football import LEAGUE_SLUG_TO_ID
    import re, asyncio

    adapter = await _api_football()
    updated = 0
    errors: list[str] = []

    for slug, league_api_id in LEAGUE_SLUG_TO_ID.items():
        league = (
            await db.execute(select(League).where(League.slug == slug))
        ).scalar_one_or_none()
        if league is None:
            continue

        try:
            season = _season_for_date(datetime.now(timezone.utc).date())
            resp = await adapter._get("teams", {"league": league_api_id, "season": season})
            items = resp.get("response", []) if isinstance(resp, dict) else []

            for item in items:
                team_data = item.get("team", {})
                logo = team_data.get("logo")
                name = team_data.get("name", "")
                if not logo or not name:
                    continue

                # Build slug same way as _upsert_team
                team_slug = re.sub(r"[^\w\s-]", "", name.lower())
                team_slug = re.sub(r"[\s_]+", "-", team_slug).strip("-")

                team = (
                    await db.execute(select(Team).where(Team.slug == team_slug))
                ).scalar_one_or_none()
                if team and not team.logo_url:
                    team.logo_url = logo
                    updated += 1

            await asyncio.sleep(0.3)
        except Exception as exc:
            errors.append(f"{slug}: {exc}")

    await db.commit()
    return {"updated": updated, "errors": errors}


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
    summary="Wipe + evaluate predictions using v5 Elo, in chunks",
)
async def regenerate_predictions(
    limit: int = 400,
    wipe_first: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """Chunked regenerate. Call once with ``wipe_first=true`` to clear
    every existing prediction (they were generated with leaky Elo
    seeds), then call repeatedly with ``wipe_first=false`` (the
    default) until the response reports ``remaining_matches = 0``.

    Each call processes up to *limit* matches. Default 400 fits
    inside the ~120s Railway request budget comfortably. The
    response includes ``remaining_matches`` so a simple shell loop
    can drive the whole backfill.
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

    # Optionally wipe existing predictions on the first call.
    if wipe_first:
        await db.execute(delete(PredictionStrategy))
        await db.execute(delete(PredictionEvaluation))
        await db.execute(delete(PredictionExplanation))
        await db.execute(delete(Prediction))
        await db.commit()

    # Subquery: matches that already have a prediction.
    existing_pred_stmt = select(Prediction.match_id).distinct()
    existing_match_ids = {
        row[0] for row in (await db.execute(existing_pred_stmt)).all()
    }

    # Walk finished matches chronologically, skipping the ones we've
    # already predicted on.
    all_matches_stmt = (
        select(Match)
        .join(MatchResult, MatchResult.match_id == Match.id)
        .where(Match.status == MatchStatus.FINISHED)
        .order_by(Match.scheduled_at.asc())
    )
    all_matches = list((await db.execute(all_matches_stmt)).scalars().all())
    todo = [m for m in all_matches if m.id not in existing_match_ids]
    total_remaining_before = len(todo)
    matches = todo[:limit]

    forecast_service = ForecastService()

    generated = 0
    evaluated = 0
    leakage_failures = 0
    errors: list[dict] = []
    for match in matches:
        try:
            pred = await forecast_service.generate_forecast(match.id, db, source="backtest")
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
        "wipe_first": wipe_first,
        "matches_in_chunk": len(matches),
        "total_remaining_before": total_remaining_before,
        "remaining_matches": max(0, total_remaining_before - generated),
        "predictions_generated": generated,
        "predictions_evaluated": evaluated,
        "leakage_failures": leakage_failures,
        "errors_sample": errors[:5],
    }


# ──────────────────────────────────────────────────────────────────────────────
# 7. Seed Over/Under strategies
# ──────────────────────────────────────────────────────────────────────────────


# Process-level pending training samples — drained by /train-logistic-fit.
_pending_logistic_samples: list[dict] = []


@router.post(
    "/train-logistic-collect",
    summary="Chunked: collect training samples into in-memory cache",
)
async def train_logistic_collect(
    offset: int = 0,
    limit: int = 300,
    reset: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """Build training samples for LogisticModel in chunks.

    Call sequence (typical):
        POST /train-logistic-collect?offset=0&limit=300&reset=true
        POST /train-logistic-collect?offset=300&limit=300
        POST /train-logistic-collect?offset=600&limit=300
        ... (until the response shows matches_fetched < limit)
        POST /train-logistic-fit

    Each chunk pulls ``limit`` finished matches starting at
    ``offset``, builds their match_context via ForecastService, and
    appends to a module-level list (``_pending_logistic_samples``).
    ``reset=true`` clears the list before collecting — always pass
    it on the first call.

    Why chunked: ``build_match_context`` is expensive (~300ms per
    match × 7 queries) and a full 2 000-match run exceeds Railway's
    180 s request budget. 300 per chunk fits in ~90 s.
    """
    import traceback
    from app.forecasting.forecast_service import ForecastService

    global _pending_logistic_samples
    if reset:
        _pending_logistic_samples = []

    matches_fetched = 0
    samples_appended = 0
    error: Optional[str] = None
    error_counts: dict[str, int] = {}
    error_samples: list[str] = []
    skipped_no_result = 0
    try:
        stmt = (
            select(Match)
            .join(MatchResult, MatchResult.match_id == Match.id)
            .where(Match.status == MatchStatus.FINISHED)
            .order_by(Match.scheduled_at.desc())
            .offset(offset)
            .limit(limit)
        )
        matches = list((await db.execute(stmt)).scalars().all())
        matches_fetched = len(matches)

        forecast_service = ForecastService()
        for match in matches:
            try:
                ctx = await forecast_service.build_match_context(match, db)
            except Exception as exc:
                err_type = type(exc).__name__
                error_counts[err_type] = error_counts.get(err_type, 0) + 1
                if len(error_samples) < 5:
                    error_samples.append(f"{err_type}: {str(exc)[:200]}")
                continue
            mr = (
                await db.execute(
                    select(MatchResult).where(MatchResult.match_id == match.id)
                )
            ).scalar_one_or_none()
            if mr is None:
                skipped_no_result += 1
                continue
            ctx["home_score"] = int(mr.home_score)
            ctx["away_score"] = int(mr.away_score)
            _pending_logistic_samples.append(ctx)
            samples_appended += 1
            # NOTE: do NOT call db.expire_all() here — it invalidates
            # all lazily-loaded relationships and the next iteration's
            # ``match.home_team.name`` access raises
            # ``MissingGreenlet: greenlet_spawn has not been called``
            # from inside the sync ORM path. We tolerate the larger
            # memory footprint (~300 match contexts in Python dicts)
            # for the duration of the chunk.
    except Exception as exc:
        log.exception("train_logistic_collect_fatal")
        error = f"{type(exc).__name__}: {exc}\n{traceback.format_exc()[:1200]}"

    return {
        "offset": offset,
        "limit": limit,
        "reset": reset,
        "matches_fetched": matches_fetched,
        "samples_appended": samples_appended,
        "pending_total": len(_pending_logistic_samples),
        "skipped_no_result": skipped_no_result,
        "error_counts": error_counts,
        "error_samples": error_samples,
        "error": error,
    }


@router.post(
    "/train-logistic-fit",
    summary="Chunked: fit LogisticModel on the collected pending samples",
)
async def train_logistic_fit(
    clear_after: bool = True,
    db: AsyncSession = Depends(get_db),
):
    """Fit LogisticModel using every sample collected by
    ``/train-logistic-collect``. Caches the trained instance on
    ``ForecastService._cached_logistic`` so the ensemble reuses it.
    Clears the pending list after a successful fit by default.
    """
    import traceback
    from uuid import uuid4
    from app.forecasting.forecast_service import ForecastService
    from app.forecasting.models.logistic_model import LogisticModel

    global _pending_logistic_samples
    pending = _pending_logistic_samples
    if not pending:
        return {
            "trained": False,
            "reason": "no_pending_samples",
            "hint": "Run /train-logistic-collect with reset=true first.",
        }

    try:
        model = LogisticModel(uuid4(), config={})
        metrics = model.train(pending)
        ForecastService.set_cached_logistic(model)
        if clear_after:
            _pending_logistic_samples = []
        return {
            "trained": True,
            "samples_fitted": len(pending),
            "metrics": metrics,
            "feature_count": len(LogisticModel._FEATURE_NAMES),
            "cache_cleared": clear_after,
        }
    except Exception as exc:
        log.exception("train_logistic_fit_fatal")
        return {
            "trained": False,
            "fatal_error": f"{type(exc).__name__}: {exc}\n{traceback.format_exc()[:1200]}",
            "samples_attempted": len(pending),
        }


@router.post(
    "/train-xgboost-fit",
    summary="v3: fit XGBoostModel on the same collected pending samples",
)
async def train_xgboost_fit(
    db: AsyncSession = Depends(get_db),
):
    """Fit XGBoostModel using the same samples collected by
    ``/train-logistic-collect``. Does NOT clear pending samples so
    you can train both logistic + xgboost on the same data.
    Caches the trained instance on ``ForecastService._cached_xgboost``.
    """
    import traceback
    from uuid import uuid4
    from app.forecasting.forecast_service import ForecastService
    from app.forecasting.models.xgboost_model import XGBoostModel

    global _pending_logistic_samples
    pending = _pending_logistic_samples
    if not pending:
        return {
            "trained": False,
            "reason": "no_pending_samples",
            "hint": "Run /train-logistic-collect first, then call this.",
        }

    try:
        model = XGBoostModel(uuid4(), config={})
        metrics = model.train(pending)
        ForecastService.set_cached_xgboost(model)
        return {
            "trained": True,
            "model_type": "xgboost",
            "samples_fitted": len(pending),
            "metrics": metrics,
        }
    except Exception as exc:
        log.exception("train_xgboost_fit_fatal")
        return {
            "trained": False,
            "fatal_error": f"{type(exc).__name__}: {exc}\n{traceback.format_exc()[:1200]}",
            "samples_attempted": len(pending),
        }


@router.post(
    "/train-logistic",
    summary="Train the LogisticModel on recent finished matches",
)
async def train_logistic(
    limit: int = 2000,
    db: AsyncSession = Depends(get_db),
):
    """Fit a LogisticModel using the most recent *limit* finished
    matches + their full ``build_match_context``. Caches the trained
    instance on ``ForecastService._cached_logistic`` so future
    predictions in this Python process use it. Returns training
    metrics. Idempotent — retrains on every call.

    Note: the trained model is in-process only. When the Railway
    container restarts the cache is lost and Logistic falls back to
    uniform priors until this endpoint is called again. Good enough
    for our needs; persistence can be added later via pickling to a
    mounted volume or S3.
    """
    import traceback
    from app.forecasting.forecast_service import ForecastService
    from app.forecasting.models.logistic_model import LogisticModel
    from uuid import UUID, uuid4

    fatal_error: Optional[str] = None
    samples_built = 0
    try:
        stmt = (
            select(Match)
            .join(MatchResult, MatchResult.match_id == Match.id)
            .where(Match.status == MatchStatus.FINISHED)
            .order_by(Match.scheduled_at.desc())
            .limit(limit)
        )
        matches = list((await db.execute(stmt)).scalars().all())

        forecast_service = ForecastService()
        training_data: list[dict] = []
        for match in matches:
            try:
                ctx = await forecast_service.build_match_context(match, db)
            except Exception as exc:
                continue
            mr = (
                await db.execute(
                    select(MatchResult).where(MatchResult.match_id == match.id)
                )
            ).scalar_one_or_none()
            if mr is None:
                continue
            ctx["home_score"] = int(mr.home_score)
            ctx["away_score"] = int(mr.away_score)
            training_data.append(ctx)
            samples_built += 1
            if samples_built % 100 == 0:
                # Free ORM state periodically so we don't blow memory
                db.expire_all()

        if not training_data:
            return {
                "samples_built": 0,
                "trained": False,
                "reason": "no_training_data",
            }

        model = LogisticModel(uuid4(), config={})
        metrics = model.train(training_data)
        ForecastService.set_cached_logistic(model)

        return {
            "samples_built": samples_built,
            "trained": True,
            "metrics": metrics,
            "feature_count": len(LogisticModel._FEATURE_NAMES),
        }
    except Exception as exc:
        log.exception("train_logistic_fatal")
        fatal_error = f"{type(exc).__name__}: {exc}\n{traceback.format_exc()[:1500]}"
        return {
            "samples_built": samples_built,
            "trained": False,
            "fatal_error": fatal_error,
        }


@router.post(
    "/force-schema-patch",
    summary="Emergency: ADD COLUMN IF NOT EXISTS on odds_history to unblock backfill",
)
async def force_schema_patch(
    db: AsyncSession = Depends(get_db),
):
    """Last-resort schema patch that bypasses alembic entirely.

    Runs raw ``ALTER TABLE ... ADD COLUMN IF NOT EXISTS`` statements
    against odds_history so the v5 columns exist even if the formal
    migration didn't run for some reason. Safe — uses IF NOT EXISTS
    on every statement.
    """
    from sqlalchemy import text

    stmts = [
        "ALTER TABLE odds_history ADD COLUMN IF NOT EXISTS over_odds DOUBLE PRECISION",
        "ALTER TABLE odds_history ADD COLUMN IF NOT EXISTS under_odds DOUBLE PRECISION",
        "ALTER TABLE odds_history ADD COLUMN IF NOT EXISTS total_line DOUBLE PRECISION",
        "ALTER TABLE odds_history ADD COLUMN IF NOT EXISTS btts_yes_odds DOUBLE PRECISION",
        "ALTER TABLE odds_history ADD COLUMN IF NOT EXISTS btts_no_odds DOUBLE PRECISION",
        "ALTER TABLE odds_history ALTER COLUMN home_odds DROP NOT NULL",
        "ALTER TABLE odds_history ALTER COLUMN away_odds DROP NOT NULL",
        "CREATE INDEX IF NOT EXISTS ix_odds_match_market ON odds_history (match_id, market)",
    ]

    executed: list[str] = []
    errors: list[dict] = []
    for sql in stmts:
        try:
            await db.execute(text(sql))
            executed.append(sql)
        except Exception as exc:
            errors.append({"sql": sql, "err": str(exc)})

    await db.commit()

    # Verify the new columns are present.
    verify = await db.execute(
        text(
            """
            SELECT column_name, is_nullable FROM information_schema.columns
            WHERE table_name='odds_history'
            ORDER BY ordinal_position
            """
        )
    )
    columns = [{"name": r[0], "nullable": r[1]} for r in verify.all()]

    return {
        "executed": executed,
        "errors": errors,
        "odds_history_columns": columns,
    }


@router.post(
    "/snapshot-upcoming-odds",
    summary="Snapshot current odds for upcoming fixtures (run daily)",
)
async def snapshot_upcoming_odds(
    limit: int = 400,
    hours_ahead: int = 336,
    db: AsyncSession = Depends(get_db),
):
    """For every scheduled fixture in the next *hours_ahead* hours, pull
    the current pre-match 1X2 / O-U / BTTS odds from API-Football and
    write them into ``odds_history``. Designed to be called daily by a
    cron job so the odds accumulate naturally over time — a fixture
    kicked off yesterday that was first snapshotted 3 days ago now has
    3 rows in the history, the earliest of which qualifies as "the
    closing line we could have seen".

    Idempotent in the weak sense: re-running within the same day will
    re-insert identical rows. That's fine — the metrics endpoint just
    picks the most recent ``recorded_at``. We skip fixtures that
    already have a 1x2 row written *today* so the cron can safely run
    multiple times per day.
    """
    import traceback
    from datetime import date as _date

    fatal_error: Optional[str] = None
    adapter = await _api_football()

    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(hours=hours_ahead)

    # Upcoming fixtures within the window that came from API-Football
    # (external_id starts with apifb_match_) and don't already have an
    # odds row from today.
    today_start = datetime.combine(_date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
    recent_odds_stmt = select(OddsHistory.match_id).where(
        and_(
            OddsHistory.market.in_(["1x2", "1X2"]),
            OddsHistory.recorded_at >= today_start,
        )
    )
    already_snapshotted_today = {
        row[0] for row in (await db.execute(recent_odds_stmt)).all()
    }

    targets_stmt = (
        select(Match.id, Match.external_id)
        .where(
            and_(
                Match.status == MatchStatus.SCHEDULED,
                Match.scheduled_at >= now,
                Match.scheduled_at <= cutoff,
                Match.external_id.is_not(None),
                Match.external_id.like("apifb_match_%"),
            )
        )
        .order_by(Match.scheduled_at.asc())
        .limit(limit * 2)
    )
    all_rows = (await db.execute(targets_stmt)).all()
    targets = [
        (mid, ext) for mid, ext in all_rows if mid not in already_snapshotted_today
    ][:limit]

    calls = 0
    rows_inserted = 0
    fixtures_with_odds = 0
    errors: list[dict] = []

    try:
        for match_id, external_id in targets:
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

            had_any = False
            recorded_at = datetime.now(timezone.utc)
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
                        recorded_at=recorded_at,
                    )
                )
                rows_inserted += 1
                had_any = True
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
                        recorded_at=recorded_at,
                    )
                )
                rows_inserted += 1
                had_any = True
            if odds.get("btts_yes_odds") and odds.get("btts_no_odds"):
                db.add(
                    OddsHistory(
                        id=uuid.uuid4(),
                        match_id=match_id,
                        source="api_football_avg",
                        market="btts",
                        btts_yes_odds=odds.get("btts_yes_odds"),
                        btts_no_odds=odds.get("btts_no_odds"),
                        recorded_at=recorded_at,
                    )
                )
                rows_inserted += 1
                had_any = True
            if had_any:
                fixtures_with_odds += 1
            if rows_inserted % 30 == 0:
                await db.commit()

        await db.commit()
    except Exception as exc:
        log.exception("snapshot_upcoming_odds_fatal")
        try:
            await db.rollback()
        except Exception:
            pass
        fatal_error = f"{type(exc).__name__}: {exc}\n{traceback.format_exc()[:1500]}"
    finally:
        try:
            await adapter.http_client.aclose()
        except Exception:
            pass

    return {
        "fixtures_targeted": len(targets),
        "api_calls": calls,
        "rows_inserted": rows_inserted,
        "fixtures_with_odds": fixtures_with_odds,
        "errors": errors[:5],
        "fatal_error": fatal_error,
    }


@router.post(
    "/dedupe-matches",
    summary="Delete duplicate Match rows (same teams + same kickoff date)",
)
async def dedupe_matches(
    db: AsyncSession = Depends(get_db),
):
    """After team dedupe, there are still duplicate Match rows: the
    same fixture ingested via two providers with different
    ``external_id`` values. We group by
    ``(home_team_id, away_team_id, scheduled_at::date)`` and keep the
    oldest row as the winner. Losers get deleted — their
    ``match_results``, ``predictions``, ``odds_history``,
    ``match_statistics`` children all cascade-delete via the ``ondelete=CASCADE``
    FK clauses in the model.

    Data loss is acceptable here because the losing rows are
    duplicates of data we already have (or can re-fetch via the
    backfill endpoints).
    """
    from sqlalchemy import func as sfunc, text as sqltext

    # Find groups where more than one match has the same (home, away, date).
    group_stmt = sqltext(
        """
        SELECT home_team_id, away_team_id, DATE(scheduled_at AT TIME ZONE 'UTC') AS d, COUNT(*) AS n
        FROM matches
        GROUP BY home_team_id, away_team_id, d
        HAVING COUNT(*) > 1
        """
    )
    groups = (await db.execute(group_stmt)).all()

    total_deleted = 0
    merge_examples: list[dict] = []
    for home_id, away_id, d, n in groups:
        rows = (
            await db.execute(
                select(Match).where(
                    and_(
                        Match.home_team_id == home_id,
                        Match.away_team_id == away_id,
                        sfunc.date(Match.scheduled_at) == d,
                    )
                ).order_by(Match.created_at.asc())
            )
        ).scalars().all()
        if len(rows) < 2:
            continue
        winner = rows[0]
        losers = rows[1:]
        for loser in losers:
            await db.delete(loser)
            total_deleted += 1
        if len(merge_examples) < 10:
            merge_examples.append({
                "date": str(d),
                "winner_id": str(winner.id),
                "winner_external_id": winner.external_id,
                "deleted": len(losers),
            })
    await db.commit()
    return {
        "groups_found": len(groups),
        "matches_deleted": total_deleted,
        "examples": merge_examples,
    }


@router.post(
    "/dedupe-teams",
    summary="Merge duplicate team rows into the canonical one",
)
async def dedupe_teams(
    db: AsyncSession = Depends(get_db),
):
    """Some teams were ingested twice — once via football-data.org and
    once via API-Football — because their slugs differed slightly. The
    top-10 Elo leaderboard shows ``FC Internazionale Milano`` and
    ``SSC Napoli`` twice for this reason. This endpoint groups teams
    by ``lower(name)`` and, where it finds duplicates, merges all
    child rows (matches, elo history, stats) onto the team with the
    oldest ``created_at`` timestamp. The losing duplicates are then
    deleted.

    Idempotent. Safe to re-run.
    """
    from sqlalchemy import func as sfunc, text as sqltext
    from app.models.team import Team

    # 1. Find groups of duplicates by lower(name).
    stmt = (
        select(sfunc.lower(Team.name).label("key"), sfunc.count().label("n"))
        .group_by("key")
        .having(sfunc.count() > 1)
    )
    groups = (await db.execute(stmt)).all()

    merges: list[dict] = []
    for key, _count in groups:
        team_rows = (
            await db.execute(
                select(Team)
                .where(sfunc.lower(Team.name) == key)
                .order_by(Team.created_at.asc())
            )
        ).scalars().all()
        if len(team_rows) < 2:
            continue

        # The oldest row wins; the rest lose.
        winner = team_rows[0]
        losers = team_rows[1:]
        loser_ids = [t.id for t in losers]

        # Repoint every child table's FK to the winner.
        # Every UPDATE uses a SQL bindparam list so no parameter
        # injection is possible.
        for sql in [
            "UPDATE matches SET home_team_id = :w WHERE home_team_id = ANY(:l)",
            "UPDATE matches SET away_team_id = :w WHERE away_team_id = ANY(:l)",
            "UPDATE team_elo_history SET team_id = :w WHERE team_id = ANY(:l)",
            "UPDATE team_stats SET team_id = :w WHERE team_id = ANY(:l)",
        ]:
            try:
                await db.execute(
                    sqltext(sql),
                    {"w": winner.id, "l": loser_ids},
                )
            except Exception as exc:
                log.warning("dedupe_update_failed sql=%s err=%s", sql[:60], exc)

        # Delete the losers.
        for t in losers:
            try:
                await db.delete(t)
            except Exception as exc:
                log.warning("dedupe_delete_failed id=%s err=%s", t.id, exc)

        merges.append(
            {
                "key": key,
                "winner_id": str(winner.id),
                "winner_name": winner.name,
                "losers_merged": len(losers),
                "loser_ids": [str(x) for x in loser_ids],
            }
        )

    await db.commit()

    return {
        "groups_found": len(groups),
        "merges": merges,
    }


@router.post(
    "/seed-ou-strategies",
    summary="Insert the two v5 Over/Under seed strategies",
)
async def seed_ou_strategies(
    db: AsyncSession = Depends(get_db),
):
    # v5.1: rules no longer require the edge feature because historical
    # odds coverage is < 2% — the edge would be 0 for every pick and the
    # strategy would match nothing. Once the daily odds snapshot has
    # accumulated ~2 weeks of data we can add an `edge > 0.04` variant.
    defs = [
        {
            "name": "High-Scoring Match",
            "description": (
                "Over 2.5 goals pick when our Poisson lambda sees a high "
                "expected total. Until real historical odds are available, "
                "we don't enforce a market-edge check — treat the strike "
                "rate as a calibration signal, not a profit claim."
            ),
            "rules": [
                {"feature": "expected_total_goals", "operator": ">", "value": 2.8},
                {"feature": "over_2_5_prob", "operator": ">", "value": 0.55},
            ],
        },
        {
            "name": "Defensive Battle",
            "description": (
                "Under 2.5 goals pick when our Poisson lambda sees a low "
                "expected total. Same caveat as High-Scoring Match about "
                "the market-edge check."
            ),
            "rules": [
                {"feature": "expected_total_goals", "operator": "<", "value": 2.2},
                {"feature": "under_2_5_prob", "operator": ">", "value": 0.55},
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
            # v5.1: also update rules when reseeding so old seeds can
            # be upgraded in place without manual DB editing.
            existing.rules = d["rules"]
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
        if not existing.logo_url and team_raw.get("logo"):
            existing.logo_url = team_raw["logo"]
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


# ──────────────────────────────────────────────────────────────────────────────
# Engine comparison: v2 vs v3
# ──────────────────────────────────────────────────────────────────────────────


@router.get(
    "/engine-comparison",
    summary="Compare old (v2) vs new (v3) prediction accuracy",
)
async def engine_comparison(
    cutoff: str = Query(
        default="2026-04-12T22:00:00",
        description="ISO datetime marking the v3 deploy. Predictions before = v2, after = v3.",
    ),
    db: AsyncSession = Depends(get_db),
):
    """Compare accuracy of predictions made BEFORE the v3 engine deploy
    vs predictions made AFTER. Both must be evaluated (have results).
    """
    from datetime import datetime as dt
    from app.models.prediction import PredictionEvaluation

    cutoff_dt = dt.fromisoformat(cutoff.replace("Z", "+00:00"))
    if cutoff_dt.tzinfo is None:
        cutoff_dt = cutoff_dt.replace(tzinfo=timezone.utc)

    stmt = (
        select(Prediction, PredictionEvaluation)
        .join(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
    )
    rows = (await db.execute(stmt)).all()

    v2_correct = v2_total = v3_correct = v3_total = 0
    for pred, ev in rows:
        if pred.predicted_at < cutoff_dt:
            v2_total += 1
            if ev.is_correct:
                v2_correct += 1
        else:
            v3_total += 1
            if ev.is_correct:
                v3_correct += 1

    v2_acc = (v2_correct / v2_total * 100) if v2_total > 0 else 0.0
    v3_acc = (v3_correct / v3_total * 100) if v3_total > 0 else 0.0

    return {
        "cutoff": cutoff,
        "v2_old_engine": {"predictions": v2_total, "correct": v2_correct, "accuracy_pct": round(v2_acc, 1)},
        "v3_new_engine": {"predictions": v3_total, "correct": v3_correct, "accuracy_pct": round(v3_acc, 1)},
        "difference_pct": round(v3_acc - v2_acc, 1),
        "verdict": (
            "v3 is better" if (v3_acc - v2_acc) > 1
            else "v3 is worse" if (v3_acc - v2_acc) < -1
            else "too close to call" if v3_total >= 30
            else f"need more data ({v3_total} evaluated, need 30+)"
        ),
    }


# ── Ensemble weight optimizer ────────────────────────────────────────────────


@router.post(
    "/optimize-ensemble",
    summary="Grid search over ensemble weights using stored sub-model outputs",
)
async def optimize_ensemble(
    backtest_cutoff: str = Query(
        default="2026-01-01",
        description="ISO date: matches before = backtest, after = validation",
    ),
    min_confidence: float = Query(default=0.0, description="Min confidence filter for BOTD sim"),
    db: AsyncSession = Depends(get_db),
):
    """Re-weight the ensemble using sub-model outputs stored in raw_output.

    For each weight combination, re-compute the ensemble probability,
    determine the pick, and evaluate against actual results. Returns
    accuracy metrics for both backtest (pre-cutoff) and validation
    (post-cutoff) periods.

    This does NOT re-run models — it reads existing raw_output and
    re-combines with different weights. Very fast (~seconds).
    """
    from app.models.prediction import PredictionEvaluation
    from itertools import product

    cutoff_dt = datetime.fromisoformat(backtest_cutoff).replace(tzinfo=timezone.utc)

    # Load all evaluated predictions with raw_output
    stmt = (
        select(Prediction, PredictionEvaluation, Match.scheduled_at)
        .join(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
        .join(Match, Match.id == Prediction.match_id)
        .where(Prediction.raw_output.isnot(None))
    )
    rows = (await db.execute(stmt)).all()

    if not rows:
        return {"error": "No evaluated predictions with raw_output found"}

    # Parse sub-model outputs
    parsed = []
    for pred, ev, sched_at in rows:
        raw = pred.raw_output or {}
        subs = raw.get("sub_models", [])
        if not subs:
            continue
        models = {}
        for sm in subs:
            name = sm.get("model", "")
            if "error" in sm:
                continue
            models[name] = {
                "home": sm.get("home_win_prob", 0),
                "draw": sm.get("draw_prob", 0),
                "away": sm.get("away_win_prob", 0),
            }
        if not models:
            continue
        parsed.append({
            "models": models,
            "actual": ev.actual_outcome,
            "is_backtest": sched_at < cutoff_dt,
            "confidence_orig": pred.confidence,
            "scheduled_at": sched_at,
        })

    # Define weight grid
    weight_options = [0.0, 0.4, 0.8, 1.2, 1.6, 2.0]
    model_names = ["EloModel", "PoissonModel", "LogisticModel", "XGBoostModel"]

    # Generate combinations (skip all-zero)
    combos = [
        dict(zip(model_names, w))
        for w in product(weight_options, repeat=4)
        if sum(w) > 0
    ]

    results = []
    for weights in combos:
        bt_correct = bt_total = val_correct = val_total = 0
        bt_botd_correct = bt_botd_total = val_botd_correct = val_botd_total = 0

        for p in parsed:
            # Re-compute ensemble with these weights
            weighted_probs = {"home": 0, "draw": 0, "away": 0}
            total_weight = 0
            for model_name, w in weights.items():
                if w == 0 or model_name not in p["models"]:
                    continue
                mp = p["models"][model_name]
                for outcome in ("home", "draw", "away"):
                    weighted_probs[outcome] += w * mp.get(outcome, 0)
                total_weight += w

            if total_weight == 0:
                continue

            # Normalize
            for outcome in ("home", "draw", "away"):
                weighted_probs[outcome] /= total_weight

            pick = max(weighted_probs, key=lambda k: weighted_probs[k])
            correct = pick == p["actual"]

            # Confidence proxy: max prob
            conf = max(weighted_probs.values())

            if p["is_backtest"]:
                bt_total += 1
                if correct:
                    bt_correct += 1
                if conf >= 0.60:
                    bt_botd_total += 1
                    if correct:
                        bt_botd_correct += 1
            else:
                val_total += 1
                if correct:
                    val_correct += 1
                if conf >= 0.60:
                    val_botd_total += 1
                    if correct:
                        val_botd_correct += 1

        bt_acc = bt_correct / bt_total * 100 if bt_total else 0
        val_acc = val_correct / val_total * 100 if val_total else 0
        bt_botd_acc = bt_botd_correct / bt_botd_total * 100 if bt_botd_total else 0
        val_botd_acc = val_botd_correct / val_botd_total * 100 if val_botd_total else 0

        results.append({
            "weights": weights,
            "backtest": {
                "accuracy": round(bt_acc, 1),
                "total": bt_total,
                "correct": bt_correct,
                "botd_accuracy": round(bt_botd_acc, 1),
                "botd_total": bt_botd_total,
            },
            "validation": {
                "accuracy": round(val_acc, 1),
                "total": val_total,
                "correct": val_correct,
                "botd_accuracy": round(val_botd_acc, 1),
                "botd_total": val_botd_total,
            },
        })

    # Sort by validation accuracy (primary), backtest accuracy (secondary)
    results.sort(
        key=lambda r: (r["validation"]["accuracy"], r["backtest"]["accuracy"]),
        reverse=True,
    )

    # Top 20 configurations
    top_20 = results[:20]

    # Also find best BOTD config
    botd_sorted = sorted(
        [r for r in results if r["validation"]["botd_total"] >= 5],
        key=lambda r: (r["validation"]["botd_accuracy"], r["backtest"]["botd_accuracy"]),
        reverse=True,
    )

    return {
        "total_predictions_analyzed": len(parsed),
        "backtest_period": f"before {backtest_cutoff}",
        "validation_period": f"from {backtest_cutoff}",
        "configurations_tested": len(combos),
        "current_weights": {"EloModel": 0.8, "PoissonModel": 1.2, "LogisticModel": 0.8, "XGBoostModel": 1.5},
        "top_20_overall": top_20,
        "top_5_botd": botd_sorted[:5],
    }
