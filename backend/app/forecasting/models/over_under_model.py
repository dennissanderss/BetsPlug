"""Over/Under 2.5 goals model.

Computes the expected total goals for a match by combining each side's
recent average goals scored and conceded (point-in-time from the form
data already in ``match_context``). Feeds those lambdas into a Poisson
distribution and reports P(Over 2.5) / P(Under 2.5).

This is a lightweight companion model to the main ensemble. It only
produces the O/U 2.5 market output; it does not touch the 1X2 flow.
"""
from __future__ import annotations

import math
from typing import Optional


_OU_LINE = 2.5
_DEFAULT_LAMBDA_HOME = 1.4
_DEFAULT_LAMBDA_AWAY = 1.1
_MIN_LAMBDA = 0.2
_MAX_LAMBDA = 5.5


def _poisson_pmf(k: int, lam: float) -> float:
    """Standard Poisson pmf — no scipy dependency for this one call."""
    if lam <= 0:
        return 1.0 if k == 0 else 0.0
    return math.exp(-lam) * (lam ** k) / math.factorial(k)


def _clip(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def _avg_goals_from_form(form: list[dict], for_team_id: str, side: str) -> tuple[float, float]:
    """Return (avg_scored, avg_conceded) from a list of past match dicts.

    ``form`` is what ``ForecastService._get_team_form`` returns: a list
    of ``{home_team_id, away_team_id, home_score, away_score}`` dicts
    sorted newest-first. ``for_team_id`` identifies which row of each
    dict is "our" team. ``side`` is "home" or "away" and is only used
    for the fall-back league average if ``form`` is empty.
    """
    if not form:
        return (_DEFAULT_LAMBDA_HOME if side == "home" else _DEFAULT_LAMBDA_AWAY,
                _DEFAULT_LAMBDA_AWAY if side == "home" else _DEFAULT_LAMBDA_HOME)

    scored = 0.0
    conceded = 0.0
    n = 0
    for m in form:
        try:
            hs = int(m.get("home_score") or 0)
            aws = int(m.get("away_score") or 0)
        except (TypeError, ValueError):
            continue
        home_id = str(m.get("home_team_id", ""))
        if home_id == for_team_id:
            scored += hs
            conceded += aws
        else:
            scored += aws
            conceded += hs
        n += 1

    if n == 0:
        return (_DEFAULT_LAMBDA_HOME, _DEFAULT_LAMBDA_AWAY)
    return (scored / n, conceded / n)


def predict_over_under_2_5(match_context: dict) -> dict:
    """Compute P(Over 2.5) / P(Under 2.5) for a fixture.

    Returns a dict with:
      - ``over_2_5_prob``: P(total goals > 2.5)
      - ``under_2_5_prob``: 1 - over
      - ``expected_home_goals``: lambda used for home side
      - ``expected_away_goals``: lambda used for away side
      - ``expected_total_goals``: sum of the two lambdas
      - ``method``: which feature path produced the lambdas
    """
    home_id = str(match_context.get("home_team_id", ""))
    away_id = str(match_context.get("away_team_id", ""))
    home_form = match_context.get("home_form") or []
    away_form = match_context.get("away_form") or []

    home_scored, home_conceded = _avg_goals_from_form(home_form, home_id, "home")
    away_scored, away_conceded = _avg_goals_from_form(away_form, away_id, "away")

    # Lambda for each side: combine own attack with opposition defence.
    lam_home = _clip((home_scored + away_conceded) / 2.0, _MIN_LAMBDA, _MAX_LAMBDA)
    lam_away = _clip((away_scored + home_conceded) / 2.0, _MIN_LAMBDA, _MAX_LAMBDA)

    # P(total goals <= 2) under independent Poissons.
    # We enumerate home=0..5 and away=0..5 which covers >99.9% of the mass.
    p_under_or_equal_2 = 0.0
    for h in range(0, 6):
        for a in range(0, 6):
            if h + a <= 2:
                p_under_or_equal_2 += (
                    _poisson_pmf(h, lam_home) * _poisson_pmf(a, lam_away)
                )

    p_over = max(0.0, min(1.0, 1.0 - p_under_or_equal_2))
    p_under = 1.0 - p_over

    method = (
        "form_average"
        if (home_form or away_form)
        else "default_lambda"
    )

    return {
        "over_2_5_prob": round(p_over, 6),
        "under_2_5_prob": round(p_under, 6),
        "expected_home_goals": round(lam_home, 3),
        "expected_away_goals": round(lam_away, 3),
        "expected_total_goals": round(lam_home + lam_away, 3),
        "method": method,
    }
