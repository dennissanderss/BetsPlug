"""Strategy research endpoints — run rigorous testing on candidate strategies."""

import logging
import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.match import Match, MatchResult, MatchStatus
from app.models.prediction import Prediction, PredictionEvaluation
from app.models.strategy import Strategy

router = APIRouter()
log = logging.getLogger(__name__)


# Candidate strategies with rules that use AVAILABLE features only
CANDIDATE_STRATEGIES = [
    {
        "name": "Strong Home Favorite",
        "description": "Back home teams when model gives >55% home win probability with decent confidence.",
        "hypothesis": "Home advantage combined with strong model probability indicates genuine edge.",
        "rules": [
            {"feature": "home_win_prob", "operator": ">", "value": 0.55},
            {"feature": "confidence", "operator": ">=", "value": 0.60},
        ],
    },
    {
        "name": "Away Upset Value",
        "description": "Back away teams when model gives >35% away win probability (higher than typical away odds imply).",
        "hypothesis": "When model sees away strength that market undervalues, there's edge on away win.",
        "rules": [
            {"feature": "away_win_prob", "operator": ">", "value": 0.35},
            {"feature": "confidence", "operator": ">=", "value": 0.60},
        ],
    },
    {
        "name": "Draw Specialist",
        "description": "Back draws when model gives unusually high draw probability.",
        "hypothesis": "Draws are underbet by public. When model sees >30% draw, odds may offer value.",
        "rules": [
            {"feature": "draw_prob", "operator": ">", "value": 0.28},
            {"feature": "confidence", "operator": ">=", "value": 0.58},
        ],
    },
    {
        "name": "High Confidence Any",
        "description": "Follow the model's top pick when confidence is very high.",
        "hypothesis": "When all sub-models agree strongly, the prediction is more reliable.",
        "rules": [
            {"feature": "confidence", "operator": ">=", "value": 0.65},
        ],
    },
    {
        "name": "Home Dominant",
        "description": "Back home teams with >60% win probability — strong favorites at home.",
        "hypothesis": "Very strong home favorites with model backing should win more than odds imply.",
        "rules": [
            {"feature": "home_win_prob", "operator": ">", "value": 0.60},
        ],
    },
    {
        "name": "Balanced Match Away",
        "description": "In balanced matches (no clear favorite), back the away team.",
        "hypothesis": "In close matches, away teams are often overpriced. Model disagreeing with home bias = value.",
        "rules": [
            {"feature": "away_win_prob", "operator": ">", "value": 0.28},
            {"feature": "home_win_prob", "operator": "<", "value": 0.45},
        ],
    },
    {
        "name": "Conservative Favorite",
        "description": "Only back clear favorites (>58% prob) with high confidence.",
        "hypothesis": "Conservative approach: fewer bets but higher strike rate.",
        "rules": [
            {"feature": "home_win_prob", "operator": ">", "value": 0.58},
            {"feature": "confidence", "operator": ">=", "value": 0.62},
        ],
    },
    {
        "name": "Underdog Hunter",
        "description": "Back away underdogs when model gives surprisingly high away probability.",
        "hypothesis": "Market overreacts to home advantage. Away teams with real quality are mispriced.",
        "rules": [
            {"feature": "away_win_prob", "operator": ">", "value": 0.38},
        ],
    },
    {
        "name": "Low Draw High Home",
        "description": "Back home when draw probability is very low — decisive matches.",
        "hypothesis": "When model predicts low draw chance, the match is decisive. Home in decisive matches perform well.",
        "rules": [
            {"feature": "draw_prob", "operator": "<", "value": 0.20},
            {"feature": "home_win_prob", "operator": ">", "value": 0.50},
        ],
    },
    {
        "name": "Model Confidence Elite",
        "description": "Only the highest confidence predictions.",
        "hypothesis": "Top 10% confidence predictions should have highest accuracy.",
        "rules": [
            {"feature": "confidence", "operator": ">=", "value": 0.635},
        ],
    },
    {
        "name": "Home Value Medium Odds",
        "description": "Home teams at medium probability range — not too strong, not too weak.",
        "hypothesis": "Sweet spot: home teams at 45-55% are often underpriced vs very high/low probabilities.",
        "rules": [
            {"feature": "home_win_prob", "operator": ">=", "value": 0.45},
            {"feature": "home_win_prob", "operator": "<=", "value": 0.55},
        ],
    },
    {
        "name": "Anti-Draw Filter",
        "description": "Back the model's pick but only when draw probability is low.",
        "hypothesis": "Matches with low draw chance have clearer outcomes, making model predictions more reliable.",
        "rules": [
            {"feature": "draw_prob", "operator": "<", "value": 0.22},
            {"feature": "confidence", "operator": ">=", "value": 0.60},
        ],
    },
]


class ResearchResult(BaseModel):
    strategy_name: str
    hypothesis: str
    sample_size: int
    wins: int
    losses: int
    winrate: float
    roi: float
    max_drawdown: float
    sharpe: float
    profit_factor: float
    bootstrap_ci_95: list[float]
    p_value: float
    passes_all_tests: bool
    fail_reasons: list[str]
    status: str  # validated, break_even, rejected, insufficient_data


class ResearchReport(BaseModel):
    total_tested: int
    validated: int
    break_even: int
    rejected: int
    insufficient_data: int
    results: list[ResearchResult]
    generated_at: str


@router.post(
    "/run-research",
    response_model=ResearchReport,
    summary="Run strategy research on all candidates",
)
async def run_strategy_research(
    db: AsyncSession = Depends(get_db),
) -> ResearchReport:
    """Test all candidate strategies against historical evaluated predictions."""
    from app.services.research.strategy_harness import run_full_analysis
    from app.services.strategy_engine import get_feature_value

    # Load all evaluated predictions
    stmt = (
        select(Prediction, PredictionEvaluation, Match)
        .join(Match, Match.id == Prediction.match_id)
        .join(PredictionEvaluation, PredictionEvaluation.prediction_id == Prediction.id)
        .where(Match.status == MatchStatus.FINISHED)
        .order_by(Match.scheduled_at)
    )
    rows = (await db.execute(stmt)).all()
    log.info("Research: loaded %d evaluated predictions", len(rows))

    all_picks = []
    for pred, evaluation, match in rows:
        pick_data = {
            "prediction_id": str(pred.id),
            "match_id": str(match.id),
            "home_win_prob": pred.home_win_prob,
            "draw_prob": pred.draw_prob or 0.0,
            "away_win_prob": pred.away_win_prob,
            "confidence": pred.confidence,
            "is_correct": evaluation.is_correct,
            "actual_outcome": evaluation.actual_outcome,
            "scheduled_at": match.scheduled_at.isoformat() if match.scheduled_at else "",
        }
        all_picks.append(pick_data)

    # Test each candidate
    results: list[ResearchResult] = []
    validated = 0
    break_even = 0
    rejected = 0
    insufficient = 0

    for candidate in CANDIDATE_STRATEGIES:
        # Filter picks that match strategy rules
        matched = []
        for pick in all_picks:
            matches_all = True
            evaluable = 0
            for rule in candidate["rules"]:
                feat = rule["feature"]
                val = pick.get(feat)
                if val is None:
                    matches_all = False
                    break
                evaluable += 1
                op = rule["operator"]
                target = rule["value"]
                if op == ">" and not (val > target):
                    matches_all = False
                elif op == "<" and not (val < target):
                    matches_all = False
                elif op == ">=" and not (val >= target):
                    matches_all = False
                elif op == "<=" and not (val <= target):
                    matches_all = False
                elif op == "between" and not (target[0] <= val <= target[1]):
                    matches_all = False
            if matches_all and evaluable > 0:
                matched.append(pick)

        # Run analysis
        analysis = run_full_analysis(
            strategy_name=candidate["name"],
            picks=matched,
        )

        # Determine status
        if analysis.sample_size < 30:
            status = "insufficient_data"
            insufficient += 1
        elif analysis.roi > 0.02 and analysis.passes_all_tests:
            status = "validated"
            validated += 1
        elif -0.02 <= analysis.roi <= 0.02:
            status = "break_even"
            break_even += 1
        else:
            status = "rejected"
            rejected += 1

        results.append(ResearchResult(
            strategy_name=candidate["name"],
            hypothesis=candidate.get("hypothesis", ""),
            sample_size=analysis.sample_size,
            wins=analysis.wins,
            losses=analysis.losses,
            winrate=round(analysis.winrate, 4),
            roi=round(analysis.roi, 4),
            max_drawdown=round(analysis.max_drawdown, 2),
            sharpe=round(analysis.sharpe, 4),
            profit_factor=round(analysis.profit_factor, 4),
            bootstrap_ci_95=[analysis.bootstrap_ci_95[0], analysis.bootstrap_ci_95[1]],
            p_value=analysis.p_value,
            passes_all_tests=analysis.passes_all_tests,
            fail_reasons=analysis.fail_reasons,
            status=status,
        ))

        # Upsert strategy in DB
        existing = await db.execute(
            select(Strategy).where(Strategy.name == candidate["name"])
        )
        strat = existing.scalar_one_or_none()
        if strat is None:
            strat = Strategy(
                id=uuid.uuid4(),
                name=candidate["name"],
                description=candidate["description"],
                rules=candidate["rules"],
                staking={"type": "flat", "amount": 1},
                is_active=(status == "validated"),
            )
            db.add(strat)
        else:
            strat.is_active = (status == "validated")
            strat.description = candidate["description"]

    await db.commit()

    return ResearchReport(
        total_tested=len(CANDIDATE_STRATEGIES),
        validated=validated,
        break_even=break_even,
        rejected=rejected,
        insufficient_data=insufficient,
        results=results,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )
