"""Backend endpoints that feed the "Your Route" UI's three paths.

The frontend has three entry points:
  * Strategy Follower — "I trust the validated strategies, show me what
    they pick today and I'll back those."
  * Quick Pick — "Just give me today's highest-confidence, honestly
    scored pick."
  * Explorer — "Show me every upcoming fixture and let me browse."

Each endpoint returns data in a ``{ "data": ..., "meta": ... }`` shape
so the frontend can distinguish a legitimate empty state from an error.
Empty state is NEVER an HTTP error — we always return 200 with
``data: null`` or ``data: []`` and a human-readable ``reason``.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.db.session import get_db
from app.models.league import League
from app.models.match import Match, MatchStatus
from app.models.prediction import Prediction, PredictionEvaluation
from app.models.strategy import Strategy
from app.models.team import Team
from app.services.strategy_engine import evaluate_strategy

router = APIRouter()


# ──────────────────────────────────────────────────────────────────────────────
# helpers
# ──────────────────────────────────────────────────────────────────────────────


def _serialize_fixture(match: Match, home_name: str, away_name: str, league_name: str) -> dict:
    return {
        "id": str(match.id),
        "home_team": home_name,
        "away_team": away_name,
        "league": league_name,
        "kickoff": match.scheduled_at.isoformat() if match.scheduled_at else None,
        "status": (
            match.status.value if hasattr(match.status, "value") else str(match.status)
        ),
    }


def _serialize_prediction(pred: Prediction) -> dict:
    probs = {
        "home": float(pred.home_win_prob or 0.0),
        "draw": float(pred.draw_prob or 0.0),
        "away": float(pred.away_win_prob or 0.0),
    }
    pick = max(probs, key=lambda k: probs[k])
    return {
        "id": str(pred.id),
        "pick": pick.upper(),
        "confidence": round(float(pred.confidence or 0.0), 4),
        "probabilities": {k: round(v, 4) for k, v in probs.items()},
        "predicted_home_score": pred.predicted_home_score,
        "predicted_away_score": pred.predicted_away_score,
        "features_snapshot": pred.features_snapshot or {},
    }


# ──────────────────────────────────────────────────────────────────────────────
# Strategy Follower
# ──────────────────────────────────────────────────────────────────────────────


@router.get(
    "/strategy-follower",
    summary="List validated strategies + today's matching upcoming picks",
)
async def strategy_follower(
    db: AsyncSession = Depends(get_db),
):
    """Return every strategy that survived v5 validation plus the
    upcoming matches (next 72h) that pass its filter.

    Frontend uses this to render the "Strategy Follower" path. If there
    are no validated strategies at all, the response includes an
    honest ``reason`` so the UI can surface it.
    """
    result = await db.execute(
        select(Strategy).where(Strategy.is_active.is_(True)).order_by(Strategy.name)
    )
    strategies = list(result.scalars().all())

    if not strategies:
        return {
            "data": [],
            "meta": {"total_validated": 0},
            "reason": "no_validated_strategies_yet",
            "message": (
                "Geen gevalideerde strategieën beschikbaar. We zijn aan het "
                "hertesten op een nieuwe datapijplijn — kom over een paar dagen "
                "terug."
            ),
        }

    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(hours=72)

    HomeTeam = aliased(Team)
    AwayTeam = aliased(Team)

    fixtures_stmt = (
        select(
            Prediction,
            Match,
            HomeTeam.name.label("home_name"),
            AwayTeam.name.label("away_name"),
            League.name.label("league_name"),
        )
        .join(Match, Match.id == Prediction.match_id)
        .join(HomeTeam, HomeTeam.id == Match.home_team_id)
        .join(AwayTeam, AwayTeam.id == Match.away_team_id)
        .join(League, League.id == Match.league_id)
        .where(
            and_(
                Match.status == MatchStatus.SCHEDULED,
                Match.scheduled_at >= now,
                Match.scheduled_at <= cutoff,
            )
        )
        .order_by(Match.scheduled_at)
    )
    rows = (await db.execute(fixtures_stmt)).all()

    strategy_blocks: list[dict] = []
    for strat in strategies:
        today_picks: list[dict] = []
        for pred, match, home_name, away_name, league_name in rows:
            if evaluate_strategy(strat, pred, odds=None):
                today_picks.append(
                    {
                        "fixture": _serialize_fixture(match, home_name, away_name, league_name),
                        "prediction": _serialize_prediction(pred),
                    }
                )

        strategy_blocks.append(
            {
                "strategy": {
                    "id": str(strat.id),
                    "name": strat.name,
                    "description": strat.description,
                    "rules": strat.rules,
                },
                "today_picks_count": len(today_picks),
                "today_picks": today_picks[:5],
            }
        )

    return {
        "data": strategy_blocks,
        "meta": {
            "total_validated": len(strategies),
            "window_hours": 72,
        },
    }


# ──────────────────────────────────────────────────────────────────────────────
# Quick Pick
# ──────────────────────────────────────────────────────────────────────────────


@router.get(
    "/quick-pick",
    summary="Highest-confidence upcoming pick from a validated strategy",
)
async def quick_pick(
    db: AsyncSession = Depends(get_db),
):
    """Return a "quick pick" — the highest-confidence upcoming pick,
    preferring picks that match a validated strategy when possible.

    v6 softened behaviour: even when zero strategies have been
    promoted to ``is_active=true`` (the v5.3 gate is strict until
    odds coverage grows), we still show the single
    highest-confidence upcoming prediction so the UI has something
    to display. The response ``source`` field tells the frontend
    whether the pick is backed by a validated strategy or is just
    the model's top pick.
    """
    validated_result = await db.execute(
        select(Strategy).where(Strategy.is_active.is_(True))
    )
    validated_strategies = list(validated_result.scalars().all())

    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(hours=72)

    HomeTeam = aliased(Team)
    AwayTeam = aliased(Team)

    stmt = (
        select(
            Prediction,
            Match,
            HomeTeam.name.label("home_name"),
            AwayTeam.name.label("away_name"),
            League.name.label("league_name"),
        )
        .join(Match, Match.id == Prediction.match_id)
        .join(HomeTeam, HomeTeam.id == Match.home_team_id)
        .join(AwayTeam, AwayTeam.id == Match.away_team_id)
        .join(League, League.id == Match.league_id)
        .where(
            and_(
                Match.status == MatchStatus.SCHEDULED,
                Match.scheduled_at > now,
                Match.scheduled_at <= cutoff,
            )
        )
        .order_by(Prediction.confidence.desc())
    )
    rows = (await db.execute(stmt)).all()

    chosen = None
    chosen_matched_strategies: list[Strategy] = []
    # Phase 1: look for a pick that matches a validated strategy.
    if validated_strategies:
        for pred, match, home_name, away_name, league_name in rows:
            matched_strats = [
                s for s in validated_strategies if evaluate_strategy(s, pred, odds=None)
            ]
            if matched_strats:
                chosen = (pred, match, home_name, away_name, league_name)
                chosen_matched_strategies = matched_strats
                break

    # Phase 2 (v6): fallback to the model's top-confidence upcoming
    # pick. The response source field signals that no validated
    # strategy vouched for this pick.
    source = "validated_strategy"
    if chosen is None and rows:
        pred, match, home_name, away_name, league_name = rows[0]
        if float(pred.confidence or 0) >= 0.55:
            chosen = (pred, match, home_name, away_name, league_name)
            source = "top_confidence_fallback"

    if chosen is None:
        return {
            "data": None,
            "source": None,
            "reason": "no_qualifying_pick_today",
            "message": (
                "Geen upcoming wedstrijd voldoet vandaag aan een gevalideerde strategie. "
                "Dit is eerlijk: niet elke dag is er een pick die door onze filters komt."
            ),
        }

    pred, match, home_name, away_name, league_name = chosen
    return {
        "data": {
            "fixture": _serialize_fixture(match, home_name, away_name, league_name),
            "prediction": _serialize_prediction(pred),
            "matched_strategies": [
                {
                    "id": str(s.id),
                    "name": s.name,
                    "description": s.description,
                }
                for s in chosen_matched_strategies
            ],
            "source": source,
            "analysis": {
                "reasoning": (
                    pred.features_snapshot or {}
                ).get("summary")
                or f"{home_name} thuis tegen {away_name}: model confidence {float(pred.confidence or 0):.1%}.",
            },
        }
    }


# ──────────────────────────────────────────────────────────────────────────────
# Explorer
# ──────────────────────────────────────────────────────────────────────────────


@router.get(
    "/explorer",
    summary="All upcoming fixtures with their prediction, optionally filtered",
)
async def explorer(
    league: Optional[str] = Query(default=None, description="League slug filter"),
    hours_ahead: int = Query(default=168, ge=1, le=720, description="Window in hours"),
    db: AsyncSession = Depends(get_db),
):
    """Flat list of upcoming fixtures with their latest prediction.

    Pagination is not enabled yet — we return up to 200 fixtures. The
    frontend groups them client-side by league and date.
    """
    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(hours=hours_ahead)

    HomeTeam = aliased(Team)
    AwayTeam = aliased(Team)

    stmt = (
        select(
            Match,
            HomeTeam.name.label("home_name"),
            AwayTeam.name.label("away_name"),
            League.name.label("league_name"),
            League.slug.label("league_slug"),
        )
        .join(HomeTeam, HomeTeam.id == Match.home_team_id)
        .join(AwayTeam, AwayTeam.id == Match.away_team_id)
        .join(League, League.id == Match.league_id)
        .where(
            and_(
                Match.status == MatchStatus.SCHEDULED,
                Match.scheduled_at >= now,
                Match.scheduled_at <= cutoff,
            )
        )
        .order_by(Match.scheduled_at)
        .limit(200)
    )
    rows = (await db.execute(stmt)).all()

    filtered = [r for r in rows if (league is None or r[4] == league)]

    match_ids = [r[0].id for r in filtered]
    preds_by_match: dict[uuid.UUID, Prediction] = {}
    if match_ids:
        pred_stmt = (
            select(Prediction)
            .where(Prediction.match_id.in_(match_ids))
            .order_by(Prediction.predicted_at.desc())
        )
        for p in (await db.execute(pred_stmt)).scalars().all():
            # First one wins (most recent) due to order_by desc.
            if p.match_id not in preds_by_match:
                preds_by_match[p.match_id] = p

    items: list[dict] = []
    for match, home_name, away_name, league_name, _league_slug in filtered:
        pred = preds_by_match.get(match.id)
        items.append(
            {
                "fixture": _serialize_fixture(match, home_name, away_name, league_name),
                "prediction": _serialize_prediction(pred) if pred else None,
            }
        )

    return {
        "data": items,
        "meta": {
            "count": len(items),
            "league_filter": league,
            "window_hours": hours_ahead,
        },
    }
