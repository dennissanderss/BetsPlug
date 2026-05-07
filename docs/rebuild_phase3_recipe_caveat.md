# Phase 3 Recipe Caveat — Recent Data Weakness

*Generated 2026-05-07. Important context for interpreting Phase 9 shadow mode results.*

## TL;DR

The 4 verified per-tier recipes (`docs/parameter_optimization.md`) were derived from **lifetime data spanning 1,374 days (2022-08 → 2026-05)**. That sample shows a clean ROI funnel: Free +0.75% → Silver +7% → Gold +11% → Platinum +19%.

**However**, when restricted to **only the last ~4 months (2026-01 → 2026-05, 1,630 picks)**, the same recipes perform much worse:

| Tier | Lifetime ROI | Recent 4-month ROI |
|---|---:|---:|
| Free | +0.75% | **-0.79%** |
| Silver | +7.31% | **-5.21%** |
| Gold | +10.89% | **-11.97%** |
| Platinum | +18.86% | **+2.25%** |

## Why this matters

If users live-test any recipe right now, they will likely see numbers closer to the recent-4-month figures than the lifetime figures. We should NOT promote any tier to a marketing claim until Phase 9 shadow mode confirms the recipe holds in live conditions for ≥ 4-6 weeks.

## Possible explanations (unverified)

1. **Model decay** — pre-trained on older data, doesn't generalise to 2026 fixtures
2. **Bookmaker sharpening** — odds are tighter than they were 2022-2024, edges have shrunk
3. **Sample variance** — 4 months is short, could be a bad period that mean-reverts
4. **Selection bias** — recipe was fit on the entire history; out-of-sample (recent) performance naturally weaker

## What we did NOT do

- **Did not** label the extended-cohort data as "live since January" (would be misleading)
- **Did not** ship the Platinum +18.86% claim to marketing (would not survive live test)
- **Did not** investigate root cause (deferred — needs deeper diagnostic)

## What Phase 9 shadow mode will test

For 14+ days post-Phase 4 deploy:
- Apply the 4 recipes to live cron output
- Track per-tier ROI on real picks (not historical replay)
- Acceptance threshold: Platinum live ROI > +5% to promote to headline marketing

If Phase 9 shows the recent-4-month pattern continues (Platinum ~+2%, Gold negative), do not promote. Revisit recipe choice or investigate the model decay hypothesis.

## Action items

- ✅ Phase 3 recipes locked
- ⏸ Phase 4 implementation begins (display filter + simple UI)
- ⏸ Phase 9 shadow mode is the validation gate
- 🔜 Future: investigate why 2026 data underperforms older sample (root cause analysis)

This caveat exists so that 2 weeks from now, when shadow mode results come in, we remember why Platinum may not hit the lifetime +18.86% mark.
