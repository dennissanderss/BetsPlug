"""Strategy Research Harness — rigorous testing framework.

Provides walk-forward validation, bootstrap confidence intervals,
and pass/fail criteria for strategy evaluation.
"""

import math
import random
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class StrategyTestResult:
    strategy_name: str
    sample_size: int = 0
    wins: int = 0
    losses: int = 0
    winrate: float = 0.0
    roi: float = 0.0
    max_drawdown: float = 0.0
    sharpe: float = 0.0
    profit_factor: float = 0.0
    bootstrap_ci_95: tuple[float, float] = (0.0, 0.0)
    p_value: float = 1.0
    passes_all_tests: bool = False
    fail_reasons: list[str] = field(default_factory=list)
    walk_forward_rois: list[float] = field(default_factory=list)


def calculate_metrics(
    picks: list[dict],
    avg_win_odds: float = 1.90,
) -> StrategyTestResult:
    """Calculate full metrics for a set of strategy picks.

    Each pick must have: 'is_correct' (bool), 'confidence' (float)
    """
    result = StrategyTestResult(strategy_name="")
    result.sample_size = len(picks)

    if result.sample_size == 0:
        result.fail_reasons.append("No picks")
        return result

    result.wins = sum(1 for p in picks if p.get("is_correct"))
    result.losses = result.sample_size - result.wins
    result.winrate = result.wins / result.sample_size

    # ROI: flat 1 unit, win pays (odds - 1), lose costs 1
    win_payout = avg_win_odds - 1.0
    total_profit = (result.wins * win_payout) - (result.losses * 1.0)
    result.roi = total_profit / result.sample_size

    # Max drawdown
    equity = 0.0
    peak = 0.0
    max_dd = 0.0
    returns = []
    for p in picks:
        r = win_payout if p.get("is_correct") else -1.0
        returns.append(r)
        equity += r
        if equity > peak:
            peak = equity
        dd = peak - equity
        if dd > max_dd:
            max_dd = dd
    result.max_drawdown = max_dd

    # Sharpe ratio (annualized, assume ~3 bets/week = 156/year)
    if returns and len(returns) > 1:
        mean_r = sum(returns) / len(returns)
        var_r = sum((r - mean_r) ** 2 for r in returns) / (len(returns) - 1)
        std_r = math.sqrt(var_r) if var_r > 0 else 0.001
        result.sharpe = (mean_r / std_r) * math.sqrt(156)
    else:
        result.sharpe = 0.0

    # Profit factor
    gross_profit = result.wins * win_payout
    gross_loss = result.losses * 1.0
    result.profit_factor = gross_profit / gross_loss if gross_loss > 0 else 0.0

    return result


def walk_forward_validate(
    picks: list[dict],
    train_weeks: int = 4,
    test_weeks: int = 1,
    avg_win_odds: float = 1.90,
) -> list[float]:
    """Walk-forward validation with rolling windows.

    Returns list of ROIs per test window.
    """
    if len(picks) < 20:
        return []

    # Sort by date
    sorted_picks = sorted(picks, key=lambda p: p.get("scheduled_at", ""))

    # Calculate picks per week (approx)
    total = len(sorted_picks)
    weeks_approx = max(1, total // 5)  # assume ~5 picks per week
    train_size = max(5, (train_weeks * total) // weeks_approx)
    test_size = max(2, (test_weeks * total) // weeks_approx)

    rois = []
    start = 0
    while start + train_size + test_size <= total:
        test_picks = sorted_picks[start + train_size: start + train_size + test_size]
        if len(test_picks) >= 2:
            wins = sum(1 for p in test_picks if p.get("is_correct"))
            losses = len(test_picks) - wins
            win_payout = avg_win_odds - 1.0
            roi = ((wins * win_payout) - (losses * 1.0)) / len(test_picks)
            rois.append(roi)
        start += test_size

    return rois


def bootstrap_confidence_interval(
    picks: list[dict],
    n_bootstrap: int = 1000,
    confidence: float = 0.95,
    avg_win_odds: float = 1.90,
) -> tuple[float, float, float]:
    """Bootstrap 95% CI on ROI.

    Returns (lower_bound, upper_bound, p_value).
    p_value = fraction of bootstrap samples with ROI <= 0.
    """
    if len(picks) < 10:
        return (-1.0, 1.0, 1.0)

    win_payout = avg_win_odds - 1.0
    rois = []

    for _ in range(n_bootstrap):
        sample = random.choices(picks, k=len(picks))
        wins = sum(1 for p in sample if p.get("is_correct"))
        losses = len(sample) - wins
        roi = ((wins * win_payout) - (losses * 1.0)) / len(sample)
        rois.append(roi)

    rois.sort()
    alpha = (1 - confidence) / 2
    low_idx = int(alpha * n_bootstrap)
    high_idx = int((1 - alpha) * n_bootstrap) - 1

    ci_low = rois[low_idx]
    ci_high = rois[high_idx]
    p_value = sum(1 for r in rois if r <= 0) / n_bootstrap

    return (round(ci_low, 4), round(ci_high, 4), round(p_value, 4))


def run_full_analysis(
    strategy_name: str,
    picks: list[dict],
    avg_win_odds: float = 1.90,
) -> StrategyTestResult:
    """Run complete strategy analysis: metrics + walk-forward + bootstrap."""
    result = calculate_metrics(picks, avg_win_odds)
    result.strategy_name = strategy_name

    if result.sample_size < 30:
        result.fail_reasons.append(f"Insufficient sample: {result.sample_size} < 30")
        return result

    # Walk-forward
    result.walk_forward_rois = walk_forward_validate(picks, avg_win_odds=avg_win_odds)

    # Bootstrap
    ci_low, ci_high, p_value = bootstrap_confidence_interval(picks, avg_win_odds=avg_win_odds)
    result.bootstrap_ci_95 = (ci_low, ci_high)
    result.p_value = p_value

    # Pass/fail criteria
    if result.sample_size < 30:
        result.fail_reasons.append(f"Sample size {result.sample_size} < 30")
    if result.roi <= 0:
        result.fail_reasons.append(f"ROI {result.roi:.1%} <= 0")
    if ci_low < -0.02:
        result.fail_reasons.append(f"Bootstrap CI lower bound {ci_low:.1%} < -2%")
    if result.walk_forward_rois:
        wf_mean = sum(result.walk_forward_rois) / len(result.walk_forward_rois)
        if abs(result.winrate - (0.5 + wf_mean / 2)) > 0.10:
            result.fail_reasons.append("Walk-forward inconsistent with overall winrate")

    result.passes_all_tests = len(result.fail_reasons) == 0
    return result
