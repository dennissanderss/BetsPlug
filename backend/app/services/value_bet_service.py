"""Value-bet selector & math.

Pure service layer on top of the v8.1 prediction engine. Implements the
parameters settled in docs/value_bet_data_analysis.md (Fase 1):

  normalization : proportional (Shin approximation gives <=2.5% drift at
                  the measured 6.83% margin — not worth the complexity)
  edge_threshold: 0.03 (best Sharpe on indicative backtest)
  odds_range    : 1.50 <= odds <= 5.00
  tier_filter   : {"gold", "platinum"} (basis: Brier 0.12-0.15)
  scoring       : edge * confidence * tier_bonus

Kept deliberately pure so ``test_value_bet_service.py`` can cover the
math without a DB.

Engine rule: this module MUST NOT import from app.forecasting.* or
change any probability that upstream stored on the Prediction row.
It only reads ``home_win_prob / draw_prob / away_win_prob / confidence``
and bookmaker odds.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Iterable, Mapping, Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
DEFAULT_TIER_BONUS: dict[str, float] = {
    "platinum": 1.2,
    "gold": 1.0,
    "silver": 0.8,
    "free": 0.5,
}


@dataclass(frozen=True)
class ValueBetConfig:
    """Selector parameters. Defaults mirror Fase 1 aanbeveling.

    Freeze the dataclass so the config is safe to share across requests
    and cannot be mutated mid-computation.
    """

    edge_threshold: float = 0.03
    min_odds: float = 1.50
    max_odds: float = 5.00
    tier_filter: tuple[str, ...] = ("gold", "platinum")
    normalization_method: str = "proportional"
    edge_weight: float = 1.0
    confidence_weight: float = 0.5
    tier_bonus: Mapping[str, float] = field(default_factory=lambda: dict(DEFAULT_TIER_BONUS))
    odds_freshness_hours: float = 24.0


# ---------------------------------------------------------------------------
# Normalization & math — pure functions
# ---------------------------------------------------------------------------
def raw_implied(odds: float) -> float:
    """1 / odds — raw implied probability."""
    if odds is None or odds <= 1.0:
        raise ValueError(f"odds must be > 1.0; got {odds!r}")
    return 1.0 / odds


def overround(h: float, d: float | None, a: float) -> float:
    """Sum of raw implied probabilities — always >= 1 for valid odds."""
    parts = [raw_implied(h), raw_implied(a)]
    if d is not None:
        parts.append(raw_implied(d))
    return sum(parts)


def normalize_proportional(
    odds_home: float, odds_draw: float | None, odds_away: float
) -> tuple[float, float | None, float]:
    """Fair implied via proportional vig removal.

    Returns ``(fair_home, fair_draw, fair_away)``. When draw is not
    applicable (e.g. sport has no draw) caller passes ``None`` and gets
    the two-way normalised split back.
    """
    ov = overround(odds_home, odds_draw, odds_away)
    rh = raw_implied(odds_home) / ov
    ra = raw_implied(odds_away) / ov
    rd = raw_implied(odds_draw) / ov if odds_draw is not None else None
    return rh, rd, ra


def normalize(
    odds_home: float,
    odds_draw: float | None,
    odds_away: float,
    method: str = "proportional",
) -> tuple[float, float | None, float]:
    """Dispatch by method. Only proportional is implemented — Shin and
    power can be added later behind the same signature."""
    if method == "proportional":
        return normalize_proportional(odds_home, odds_draw, odds_away)
    raise ValueError(f"unknown normalization method: {method!r}")


def compute_edge(our_prob: float, fair_implied: float) -> float:
    return our_prob - fair_implied


def compute_expected_value(our_prob: float, odds: float) -> float:
    """EV per 1 unit staked. Positive = value bet."""
    return our_prob * odds - 1.0


def kelly_fraction(our_prob: float, odds: float) -> float:
    """Full Kelly. Caller decides whether to fraction it (half/quarter-Kelly)."""
    b = odds - 1.0
    if b <= 0:
        return 0.0
    k = (our_prob * b - (1.0 - our_prob)) / b
    return max(0.0, k)


# ---------------------------------------------------------------------------
# Candidate scoring
# ---------------------------------------------------------------------------
@dataclass
class ValueBetCandidate:
    """Intermediate shape used by the selector before persistence."""

    prediction_id: Any
    match_id: Any
    pick: str  # home/draw/away
    our_prob_home: float
    our_prob_draw: float | None
    our_prob_away: float
    confidence: float
    tier: str | None
    odds_home: float
    odds_draw: float | None
    odds_away: float
    odds_source: str
    odds_snapshot_at: datetime | None
    fair_home: float
    fair_draw: float | None
    fair_away: float
    overround: float
    margin: float
    edge: float
    expected_value: float
    kelly: float
    best_odds_for_pick: float
    scheduled_at: datetime | None = None

    @property
    def our_probability(self) -> float:
        return {
            "home": self.our_prob_home,
            "draw": self.our_prob_draw or 0.0,
            "away": self.our_prob_away,
        }[self.pick]

    @property
    def fair_implied_for_pick(self) -> float:
        return {
            "home": self.fair_home,
            "draw": self.fair_draw or 0.0,
            "away": self.fair_away,
        }[self.pick]


class ValueBetSelector:
    """Apply config rules and produce ranked candidates."""

    def __init__(self, config: ValueBetConfig | None = None):
        self.config = config or ValueBetConfig()

    # --- factory -----------------------------------------------------------
    def build_candidate(
        self,
        *,
        prediction_id: Any,
        match_id: Any,
        home_prob: float,
        draw_prob: float | None,
        away_prob: float,
        confidence: float,
        tier: str | None,
        odds_home: float,
        odds_draw: float | None,
        odds_away: float,
        odds_source: str,
        odds_snapshot_at: datetime | None = None,
        scheduled_at: datetime | None = None,
    ) -> ValueBetCandidate | None:
        """Compute fair implied, edges, EV, score. Return None if the row
        is unusable (missing odds, odds <=1, probabilities don't add up)."""
        if odds_home is None or odds_away is None:
            return None
        try:
            fh, fd, fa = normalize(
                odds_home, odds_draw, odds_away, self.config.normalization_method
            )
        except ValueError:
            return None
        our = {"home": home_prob, "draw": draw_prob, "away": away_prob}
        fair = {"home": fh, "draw": fd, "away": fa}
        odds_map = {"home": odds_home, "draw": odds_draw, "away": odds_away}
        edges: dict[str, float] = {}
        for outcome in ("home", "draw", "away"):
            our_p = our[outcome]
            fair_p = fair[outcome]
            if our_p is None or fair_p is None:
                continue
            edges[outcome] = compute_edge(our_p, fair_p)
        if not edges:
            return None
        pick = max(edges, key=edges.__getitem__)
        best_edge = edges[pick]
        best_odds = odds_map[pick]
        if best_odds is None:
            return None
        ev = compute_expected_value(our[pick], best_odds)
        kelly = kelly_fraction(our[pick], best_odds)
        ov = overround(odds_home, odds_draw, odds_away)
        return ValueBetCandidate(
            prediction_id=prediction_id,
            match_id=match_id,
            pick=pick,
            our_prob_home=home_prob,
            our_prob_draw=draw_prob,
            our_prob_away=away_prob,
            confidence=confidence,
            tier=tier,
            odds_home=odds_home,
            odds_draw=odds_draw,
            odds_away=odds_away,
            odds_source=odds_source,
            odds_snapshot_at=odds_snapshot_at,
            fair_home=fh,
            fair_draw=fd,
            fair_away=fa,
            overround=ov,
            margin=ov - 1.0,
            edge=best_edge,
            expected_value=ev,
            kelly=kelly,
            best_odds_for_pick=best_odds,
            scheduled_at=scheduled_at,
        )

    # --- filters -----------------------------------------------------------
    def passes_filters(self, c: ValueBetCandidate) -> bool:
        cfg = self.config
        if c.edge < cfg.edge_threshold:
            return False
        if not (cfg.min_odds <= c.best_odds_for_pick <= cfg.max_odds):
            return False
        if cfg.tier_filter and c.tier not in cfg.tier_filter:
            return False
        return True

    def score(self, c: ValueBetCandidate) -> float:
        """Higher = better. Matches brief: edge * confidence weighted + tier bonus."""
        cfg = self.config
        tier_mult = cfg.tier_bonus.get(c.tier or "free", 1.0)
        return (
            (c.edge * cfg.edge_weight)
            * (1.0 + c.confidence * cfg.confidence_weight)
            * tier_mult
        )

    # --- selection ---------------------------------------------------------
    def rank(self, candidates: Iterable[ValueBetCandidate]) -> list[ValueBetCandidate]:
        filtered = [c for c in candidates if self.passes_filters(c)]
        filtered.sort(key=self.score, reverse=True)
        return filtered

    def select_best(
        self, candidates: Iterable[ValueBetCandidate]
    ) -> ValueBetCandidate | None:
        """Return the single highest-scoring candidate that passes filters
        or ``None`` when no candidate qualifies."""
        ranked = self.rank(candidates)
        return ranked[0] if ranked else None


# ---------------------------------------------------------------------------
# Snapshot extraction helper — normalises the two on-disk shapes
# ---------------------------------------------------------------------------
def extract_candidate_from_snapshot(
    *,
    prediction_id: Any,
    match_id: Any,
    home_prob: float,
    draw_prob: float | None,
    away_prob: float,
    confidence: float,
    tier: str | None,
    snapshot: Mapping[str, Any] | None,
    selector: ValueBetSelector,
    scheduled_at: datetime | None = None,
) -> ValueBetCandidate | None:
    """Build a candidate from a ``predictions.closing_odds_snapshot`` dict.

    Returns ``None`` for empty / malformed snapshots.
    """
    if not snapshot:
        return None
    book = snapshot.get("bookmaker_odds") if isinstance(snapshot, Mapping) else None
    if not isinstance(book, Mapping):
        return None
    home = book.get("home")
    draw = book.get("draw")
    away = book.get("away")
    if home is None or away is None:
        return None
    source = snapshot.get("source") or "unknown"
    return selector.build_candidate(
        prediction_id=prediction_id,
        match_id=match_id,
        home_prob=home_prob,
        draw_prob=draw_prob,
        away_prob=away_prob,
        confidence=confidence,
        tier=tier,
        odds_home=float(home),
        odds_draw=float(draw) if draw is not None else None,
        odds_away=float(away),
        odds_source=str(source),
        odds_snapshot_at=None,
        scheduled_at=scheduled_at,
    )


__all__ = [
    "ValueBetConfig",
    "ValueBetSelector",
    "ValueBetCandidate",
    "normalize",
    "normalize_proportional",
    "compute_edge",
    "compute_expected_value",
    "kelly_fraction",
    "extract_candidate_from_snapshot",
    "DEFAULT_TIER_BONUS",
]
