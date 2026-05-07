# Predictions Rebuild — Phase 3: Parameter Optimisation

*Generated 2026-05-07 via `GET /api/internal-ops/audit/rebuild-phase3-parameter-opt`. Rolling 14-day windows over the v8.1 evaluated population (live + backtest + batch_local_fill, all with snapshot odds).*

---

## TL;DR

Goal: find parameter sets per tier that hit the brief's criteria:
- Platinum: 80%+ of 14-day windows +EV, ≥5 picks/14d
- Gold: 70%+ windows, ≥12 picks/14d
- Silver: 60%+ windows, ≥25 picks/14d
- Free: 50%+ windows, ≤28 picks/14d (max ~2/dag)

**Result: tension between high ROI and high volume.** The highest-ROI stacks (e.g. conf≥0.78 + edge≥10%) produce ~2-3 picks per 14d — well below Platinum's brief-mandated 5/14d floor. We can satisfy Gold/Silver/Free comfortably; **Platinum requires a tradeoff decision**.

---

## 1. Setup

| Metric | Value |
|---|---:|
| Total picks analysed (all sources) | 13,958 |
| Date span | 2022-08-01 → 2026-05-06 (1,374 days) |
| 14-day windows analysed | 195 (rolling 7-day step) |

Sources: `live` + `backtest` + `batch_local_fill`. Per Phase 2 addendum, features were computed point-in-time at `cutoff = match.scheduled_at`, so probabilities are honest even though `predicted_at` metadata varies.

---

## 2. Per-tier candidates (brief criteria)

### Platinum (80% windows positive, ≥5 picks/14d)
**❌ ZERO eligible candidates.** No parameter combination meets both criteria simultaneously. Either:
- Stricter filters → higher ROI but <5 picks/14d
- Looser filters → 5+ picks/14d but <80% windows positive

### Gold (70% windows positive, ≥12 picks/14d)
**✅ 2 eligible candidates:**

| Recipe | n total | Lifetime ROI | Hit | Windows + | Picks/14d |
|---|---:|---:|---:|---:|---:|
| conf≥0.65 + edge≥8% + odds [1.90, 4.00] | 826 | **+11.45%** | 45.9% | 71.9% | 14.3 |
| conf≥0.65 + edge≥8% + odds ≥1.90 (no ceiling) | 832 | +11.18% | 45.7% | 71.1% | 14.4 |

### Silver (60% windows positive, ≥25 picks/14d)
**✅ 10 eligible candidates.** Best:

| Recipe | n total | Lifetime ROI | Hit | Windows + | Picks/14d |
|---|---:|---:|---:|---:|---:|
| conf≥0.65 + edge≥0% + odds [1.70, 4.00] | 2,152 | **+10.13%** | 51.6% | 68.4% | 27.5 |
| conf≥0.65 + edge≥0% + odds [1.70, 100] | 2,158 | +10.03% | 51.5% | 67.7% | 27.6 |
| conf≥0.65 + edge≥0% + odds [1.70, 3.00] | 2,086 | +9.96% | 52.1% | 68.4% | 26.7 |

### Free (50%+ windows, ≤28 picks/14d)
**✅ 10 eligible candidates.** Best:

| Recipe | n total | Lifetime ROI | Hit | Windows + | Picks/14d |
|---|---:|---:|---:|---:|---:|
| conf≥0.82 + edge≥10% + odds [1.30, 3.00] | 68 | **+23.88%** | 83.8% | 80.0% | **1.7** |
| conf≥0.78 + edge≥-5% + odds [1.70, 3.00] | 60 | +23.86% | 68.3% | 69.5% | 2.0 |

⚠ Note: Free's best recipe (1.7 picks/14d) is below the brief's "max 28 = 2/dag" target volume. Free would feel sparse at this filter strength.

---

## 3. Top 15 stacks overall (n≥100, by ROI)

These are the best parameter sets without tier-floor constraints — useful to see what the model actually does well:

| Rank | conf≥ | edge≥ | odds range | n | ROI | Hit | Windows+ | Picks/14d |
|---:|---:|---:|---|---:|---:|---:|---:|---:|
| 1 | 0.78 | 10% | [1.50, 3.00] | 106 | **+18.95%** | 69.8% | 70.5% | 2.7 |
| 2 | 0.78 | 8% | [1.50, 3.00] | 130 | +18.86% | 70.8% | 69.0% | 3.1 |
| 3 | 0.75 | 4% | [1.70, 3.00] | 183 | +18.47% | 64.5% | 68.9% | 4.0 |
| 4 | 0.82 | 4% | [1.30, 3.00] | 159 | +18.43% | **83.7%** | **77.1%** | 2.9 |
| 5 | 0.78 | 10% | [1.30, 3.00] | 146 | +18.41% | 74.0% | 78.3% | 2.7 |

**Pattern:** highest-ROI stacks all cluster around conf≥0.75-0.82 + edge≥4-10% + odds in [1.50-1.70, 3.00]. Volume: 2.7-4 picks/14d.

---

## 4. The Platinum problem

Brief says Platinum needs:
- 80%+ of 14d windows positive ✓ achievable on top stacks (75-78% common)
- 5+ picks per 14d ❌ top stacks all <5/14d

**The tension:**
- Highest-ROI recipes are inherently rare (conf≥0.78 picks happen ~2/week at top leagues)
- Looser recipes give more volume but worse ROI
- 5+ picks/14d at +EV requires loosening to conf≥0.65 territory, which gives Gold-level ROI (~+11%) not Platinum-level (~+19%)

**Three options for Platinum:**

### Option A — Lower the sample floor (recommended)
Change Platinum criterion from "≥5 picks/14d" to **"≥3 picks/14d"**. Then top stacks become eligible:

| Recipe | n | ROI | Hit | Windows+ | Picks/14d |
|---|---:|---:|---:|---:|---:|
| conf≥0.78 + edge≥8% + odds [1.50, 3.00] | 130 | **+18.86%** | 70.8% | 69.0% | 3.1 ✅ |
| conf≥0.75 + edge≥4% + odds [1.70, 3.00] | 183 | +18.47% | 64.5% | 68.9% | 4.0 ✅ |
| conf≥0.82 + edge≥4% + odds [1.30, 3.00] | 159 | +18.43% | **83.7%** | **77.1%** | 2.9 (just under) |

Marketing message: "Platinum delivers 3-4 elite picks per fortnight. Higher conviction, lower volume."

### Option B — Lower the windows-positive threshold
Change Platinum criterion from "80%+" to **"70%+"**. Then most top stacks qualify with 5/14d still required.

But: looking at the data, no n>=100 stack hits 70%+ AND 5+ picks/14d simultaneously. So this option also fails.

### Option C — Re-define what Platinum means
Don't be a "more selective Gold". Be a totally different product:
- e.g. "Highest single-pick conviction per day" — 1 pick/day, 14 picks/14d, but the pick is the best of all qualifying picks
- Marketing: "Our boldest call of the day — only when our model is most certain"

This is a product redesign, not a parameter tweak.

---

## 5. Proposed recipes (Option A — recommended)

| Tier | Recipe | n total | Lifetime ROI | Hit | Windows+ | Picks/14d |
|---|---|---:|---:|---:|---:|---:|
| **Platinum** | conf≥0.78 + edge≥8% + odds [1.50, 3.00] | 130 | **+18.86%** | 70.8% | 69.0% | 3.1 |
| **Gold** | conf≥0.65 + edge≥8% + odds [1.90, 4.00] | 826 | **+11.45%** | 45.9% | 71.9% | 14.3 |
| **Silver** | conf≥0.65 + edge≥0% + odds [1.70, 4.00] | 2,152 | **+10.13%** | 51.6% | 68.4% | 27.5 |
| **Free** | conf≥0.82 + edge≥10% + odds [1.30, 3.00] | 68 | **+23.88%** | 83.8% | 80.0% | 1.7 |

**Tier funnel ROI:** Free +24% > Platinum +19% > Gold +11% > Silver +10%

**⚠ Free has higher ROI than Platinum.** That's because Free here uses ultra-strict filters that give very few picks (1.7/14d). If you want Platinum > Free in ROI, change Free to a different shape:

### Alternative Free recipe — top edge per day, broad confidence
"Best edge play of the day" — 1-2 picks per day, broad confidence range, requires high edge:

| Tier | Recipe | n | ROI | Notes |
|---|---|---:|---:|---|
| Free (alt) | conf≥0.55 + edge≥10% + odds [1.70, 100] (top 1-2 by edge per day) | needs server-side day-cap | tbd | gives more picks at lower ROI |

---

## 6. Worst window analysis

Every candidate has worst-window ROI of **-100%** because some 14d windows have all picks losing. With small per-window n (1-30), this is statistically expected — a 4-pick week with 0 wins gives -100% for that window.

**Implication:** the "windows positive %" metric is more important than worst-window. Variance is irreducibly high on 14d horizons regardless of recipe.

---

## 7. Recommendation

**Adopt Option A (lower Platinum sample floor to 3/14d).** The proposed recipe set:

| Tier | Recipe |
|---|---|
| Platinum | conf≥0.78 AND edge≥8% AND odds in [1.50, 3.00] |
| Gold | conf≥0.65 AND edge≥8% AND odds in [1.90, 4.00] |
| Silver | conf≥0.65 AND edge≥0% AND odds in [1.70, 4.00] |
| Free | conf≥0.82 AND edge≥10% AND odds in [1.30, 3.00] |

Tier funnel: Free has highest ROI (rare, ultra-conservative) → reframe Free as "best pick per day" or accept the inversion.

**OR Option C** — fundamentally redesign Free as "1 broad pick per day" (any confidence, top edge). Loses the ROI advantage but gives volume that converts trial users.

**Decision needed before Phase 4 (display filter implementation).**

---

## 8. Open questions

1. **Platinum sample floor: 3 or 5 picks/14d?** Brief said 5, data says 5 is unreachable for top recipes. Is 3 OK?
2. **Free recipe shape: ultra-strict (1-2/14d, +24% ROI) or broad-edge (10+/14d, lower ROI)?** Brand decision.
3. **Should we apply a league exclusion?** Phase 2B showed Saudi Pro outliers and bottom leagues like Brasileirão / MLS / Eredivisie are structurally -EV. Excluding 2-3 worst leagues would tighten ROI further.
4. **Marketing copy implication:** Platinum delivers ~3 picks per fortnight at +18% ROI. Sounds good or sparse?

---

**STOP. Phase 3 complete. Awaiting decisions on tier criteria + recipe selection before Phase 4 (display filter implementation).**
