"""Small stats helpers used by the value-bet stats endpoint.

Kept separate from the routes module so tests can import them without
pulling in the full FastAPI routes package (which has heavy
transitive deps — aiosmtplib, etc).
"""
from __future__ import annotations

import math
from typing import Optional


def wilson_ci(correct: int, total: int, z: float = 1.96) -> tuple[float, float]:
    """Two-sided Wilson score CI for a binomial proportion."""
    if total <= 0:
        return (0.0, 0.0)
    p = correct / total
    denom = 1 + z * z / total
    center = (p + z * z / (2 * total)) / denom
    margin = (z / denom) * math.sqrt(
        p * (1 - p) / total + z * z / (4 * total * total)
    )
    return (max(0.0, center - margin), min(1.0, center + margin))


def max_drawdown(pnls: list[float]) -> float:
    """Max drawdown over a cumulative P/L series. Returns a non-positive number."""
    cum = 0.0
    peak = 0.0
    dd = 0.0
    for p in pnls:
        cum += p
        peak = max(peak, cum)
        dd = min(dd, cum - peak)
    return dd


def sharpe(returns: list[float]) -> Optional[float]:
    """Annual-ish Sharpe proxy: mean / sd * sqrt(n). None when variance==0 or n<2."""
    if len(returns) < 2:
        return None
    mean = sum(returns) / len(returns)
    var = sum((r - mean) ** 2 for r in returns) / (len(returns) - 1)
    if var <= 0:
        return None
    sd = math.sqrt(var)
    return mean / sd * math.sqrt(len(returns))
