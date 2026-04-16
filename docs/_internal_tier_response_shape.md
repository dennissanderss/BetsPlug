# Tier Response Shape — Internal Spec

**Purpose:** every user-facing endpoint that returns picks MUST include
these three fields per pick when `TIER_SYSTEM_ENABLED=true`. When the
flag is off, the fields are omitted entirely (backward compat).

## Per-pick fields (pick-level response)

```json
{
  "...existing pick fields...": "unchanged",
  "pick_tier": "platinum",
  "pick_tier_label": "🟢 Platinum",
  "pick_tier_accuracy": "85%+"
}
```

- `pick_tier` (string) — stable API slug. One of: `"free" | "silver" | "gold" | "platinum"`. Clients key off this.
- `pick_tier_label` (string) — UI-ready string with emoji. Human copy.
- `pick_tier_accuracy` (string) — historical accuracy claim for this tier.

## Aggregate endpoints (trackrecord, dashboard)

Breakdown by pick_tier is added as a `per_tier` block alongside existing
totals. Each sub-key is a tier slug, the value is whatever aggregate shape
the endpoint already produces:

```json
{
  "total": 320,
  "correct": 186,
  "accuracy": 0.581,
  "per_tier": {
    "platinum": { "total": 12, "correct": 10, "accuracy": 0.833 },
    "gold":     { "total": 45, "correct": 34, "accuracy": 0.756 },
    "silver":   { "total": 98, "correct": 66, "accuracy": 0.673 },
    "free":     { "total": 165, "correct": 76, "accuracy": 0.461 }
  }
}
```

Tiers with zero samples in the user's access scope are OMITTED from
`per_tier` (they are not present as empty objects).

## Helper

All three fields come from `tier_info(PickTier)` in
`app/core/tier_system.py`:

```python
from app.core.tier_system import tier_info, PickTier
tier_info(PickTier.PLATINUM)
# {'pick_tier': 'platinum', 'pick_tier_label': '🟢 Platinum', 'pick_tier_accuracy': '85%+'}

# From SQL-side integer result:
tier_info(row.pick_tier)   # accepts int 0..3
```

## Feature-flag behavior

- `TIER_SYSTEM_ENABLED=true` → fields present on every pick + per_tier block on aggregates
- `TIER_SYSTEM_ENABLED=false` → fields omitted, response is byte-identical to pre-tier-system
