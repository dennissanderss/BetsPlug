"""Top-3 pick drivers — inline explainability for predictions.

Reads the per-prediction ``features_snapshot`` JSONB (already stored on
every Prediction row by the v8.1 forecasting pipeline) and returns the
three features whose values deviate most from "typical" for that feature.
The result is the reasoning block surfaced on Gold+ prediction cards.

Design notes
------------

- **No ML at request time.** No SHAP, no permutation importance, no
  scaler unpickling. We use hand-curated priors per feature (typical
  mean + std). This keeps the endpoint cheap and deterministic.
- **Hand-picked candidate set.** We restrict the impact computation to
  8 features a human can actually interpret (Elo diff, form gap, H2H,
  etc). The raw 39-dim vector contains redundant / low-level signals
  (h_ppg10 vs h_ppg5 etc) that wouldn't read well in UI copy.
- **Directional label.** When it's informative we tag the driver with
  which team benefits (``home`` / ``away``) so the frontend can colour
  it or use the right phrasing.
- **Safe on None.** If ``features_snapshot`` is missing (older rows,
  non-v8.1 predictions) the function returns ``None`` so the API just
  omits the field.

Keeping this logic here — not in ``feature_service`` or a forecasting
module — because it's presentation-layer: what we *show* the user, not
what the engine computes.
"""
from __future__ import annotations

from typing import Any, Optional, TypedDict


# ---------------------------------------------------------------------------
# Per-feature presentation metadata
# ---------------------------------------------------------------------------
# `mean` and `std` are rough priors — good enough to rank which features
# are "surprising" vs baseline for a particular match. They don't need to
# match the scaler exactly; this is for UI sorting, not model math.
#
# `fmt` is a Python format spec used on the raw feature value. `label` is
# the English copy shown in the UI (NL translation happens client-side).
# `direction` is one of:
#   - None       : value is neutral (e.g. "Home consistency 1.4")
#   - "signed"   : positive value favours home, negative favours away
#   - "pct_home" : value in [0,1] where >0.5 favours home
# ---------------------------------------------------------------------------
_DRIVER_CANDIDATES: dict[str, dict[str, Any]] = {
    "elo_diff": {
        "label": "Elo advantage",
        "mean": 0.0,
        "std": 80.0,
        "fmt": "{:+.0f}",
        "direction": "signed",
    },
    "form_diff": {
        "label": "Form gap (home - away, 5 games)",
        "mean": 0.0,
        "std": 0.6,
        "fmt": "{:+.2f} ppg",
        "direction": "signed",
    },
    "venue_form_diff": {
        "label": "Venue form gap (home vs away)",
        "mean": 0.0,
        "std": 0.7,
        "fmt": "{:+.2f} ppg",
        "direction": "signed",
    },
    "h2h_home_wr": {
        "label": "H2H home win rate",
        "mean": 0.45,
        "std": 0.25,
        "fmt": "{:.0%}",
        "direction": "pct_home",
    },
    "gd_diff": {
        "label": "Season goal-diff gap",
        "mean": 0.0,
        "std": 12.0,
        "fmt": "{:+.0f}",
        "direction": "signed",
    },
    "h_cs_pct": {
        "label": "Home clean sheet rate (10)",
        "mean": 0.30,
        "std": 0.18,
        "fmt": "{:.0%}",
        "direction": None,
    },
    "a_cs_pct": {
        "label": "Away clean sheet rate (10)",
        "mean": 0.30,
        "std": 0.18,
        "fmt": "{:.0%}",
        "direction": None,
    },
    "h_home_wr": {
        "label": "Home win rate at home (5)",
        "mean": 0.40,
        "std": 0.22,
        "fmt": "{:.0%}",
        "direction": None,
    },
}


class DriverInfo(TypedDict):
    """Shape of one driver entry returned in the API response."""

    feature: str
    label: str
    value: str
    impact: float  # abs z-score rounded to 2 decimals
    direction: Optional[str]  # "home" | "away" | "neutral"


def _derive_direction(kind: Optional[str], raw: float) -> str:
    if kind == "signed":
        if raw > 0.05:
            return "home"
        if raw < -0.05:
            return "away"
        return "neutral"
    if kind == "pct_home":
        if raw > 0.55:
            return "home"
        if raw < 0.35:
            return "away"
        return "neutral"
    return "neutral"


def compute_top_drivers(
    features_snapshot: dict[str, Any] | None,
    *,
    top_n: int = 3,
) -> Optional[list[DriverInfo]]:
    """Return the ``top_n`` features that deviate most from their prior mean.

    Each entry is a small dict the API can surface as-is. Returns ``None``
    when the snapshot is missing / empty so the caller can omit the
    field altogether.
    """
    if not features_snapshot or not isinstance(features_snapshot, dict):
        return None

    scored: list[tuple[float, str, dict[str, Any], float]] = []
    for key, meta in _DRIVER_CANDIDATES.items():
        raw = features_snapshot.get(key)
        if raw is None:
            continue
        try:
            val = float(raw)
        except (TypeError, ValueError):
            continue
        std = float(meta.get("std") or 1.0) or 1.0
        mean = float(meta.get("mean") or 0.0)
        z = abs((val - mean) / std)
        scored.append((z, key, meta, val))

    if not scored:
        return None

    scored.sort(key=lambda t: t[0], reverse=True)

    out: list[DriverInfo] = []
    for z, key, meta, val in scored[:top_n]:
        fmt = meta.get("fmt") or "{:.2f}"
        try:
            value_str = fmt.format(val)
        except (ValueError, KeyError):
            value_str = f"{val:.2f}"
        direction = _derive_direction(meta.get("direction"), val)
        out.append(
            DriverInfo(
                feature=key,
                label=str(meta.get("label") or key),
                value=value_str,
                impact=round(float(z), 2),
                direction=direction,
            )
        )
    return out


__all__ = ["DriverInfo", "compute_top_drivers"]
