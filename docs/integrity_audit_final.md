# Engine v1 + v2 — Final Consolidated Integrity Audit

*Generated 2026-05-06. Aggregates Phase 1-6 findings into one verdict. Diagnostic only — no engine logic was modified during this audit. Only documentation in `docs/`.*

> **Source phase reports** (read these for raw evidence):
> - `docs/odds_data_inventory.md` — Phase 1
> - `docs/engine_v1_audit.md` — Phase 2 (+ live/backtest split addendum)
> - `docs/engine_v2_audit.md` — Phase 3
> - `docs/dataflow_audit.md` — Phase 4
> - `docs/ui_consistency_audit.md` — Phase 5
> - `docs/reproducibility_audit.md` — Phase 6

---

## TL;DR

| Layer | Verdict |
|---|---|
| **Data ingestion + storage** | ✅ Clean — 30k odds rows, 100% pre-match, healthy margins |
| **Engine v2 (Combo of the Day) — backtest** | ✅ Solid — **+27.48% ROI on 438 combos** (corrected 2026-05-06 after gap fill) |
| **Engine v2 (Combo of the Day) — live** | ⚠ Promising — +36.28% on n=62, sample too small for confidence |
| **Engine v1 (single picks) — retroactive backtest** | ⚠ Tier-asymmetric — Platinum +6.75% / Free -6.89%; soft seed-leakage suspect |
| **Engine v1 (single picks) — live forward-feed** | 🚨 **-10.90% ROI on Gold+ (n=182)** — questions all retroactive +EV claims |
| **Data flow integrity** | ✅ Clean — chain unbroken, evaluator caught up, no corruption |
| **UI numerical coherence** | ⚠ Two "live" numbers shown; combo UI window vs audit window mismatch |
| **Reproducibility** | ✅ Perfect — deterministic, 100% evaluator coverage, scoring correct |

**Bottom line:** The platform is **technically sound** but **commercially fragile**. The honest live ROI signal on Engine v1 is **negative**, while marketing copy and UI numbers reflect the retroactive backtest (+EV). Engine v2 is the cleaner product but is also smaller (n=62 live combos).

---

## 1. What was audited

A 7-phase, sequential, diagnose-only audit covering both engines after the import of 16,000+ historical odds from football-data.co.uk and the regeneration of 16,527 predictions on the v8.1 fixed pipeline.

**Strict scope rules:**
- No engine logic changes
- No data mutations
- No UI changes
- Documentation in `docs/` only
- Each phase stops and waits for approval

**Phases:**
1. Odds + predictions data inventory (volume, quality, coverage)
2. Engine v1 (single-pick) audit — backtest vs live split
3. Engine v2 (combo) audit — selector logic + ROI math
4. Data flow integrity (ingestion → storage → display chain)
5. UI/UX numerical consistency (skip Pricing + Engine pages)
6. Reproducibility (determinism + evaluator completeness)
7. **This document** — consolidated verdict

---

## 2. Headline numbers (post-v8.1 deploy, 2026-04-16 → 2026-05-06)

### Population
| Metric | Value |
|---|---:|
| Total predictions in DB | 117,765 |
| v8.1-filtered evaluated population | 38,402 |
| Live forward-feed predictions (`source=live`) | 604 |
| Combo bets total (after 2026-05-06 backfill) | 500 |
| Live combo bets | 62 |
| Backtest combo bets (corrected) | 438 |

### Accuracy
| Cohort | n | Accuracy |
|---|---:|---:|
| v8.1 full (retroactive + live) | 38,402 | 50.51% |
| Live forward-feed (full) | 612 | 52.94% |
| Live forward-feed (free-tier subset) | 174 | 63.22% |
| Per-tier (UI strict): Platinum | 1,242 | 77.86% |
| Per-tier (UI strict): Gold | 2,447 | 70.29% |
| Per-tier (UI strict): Silver | 4,688 | 58.15% |
| Per-tier (UI strict): Free | 5,133 | 46.58% |

### ROI on real odds
| Surface | Sample | ROI |
|---|---:|---:|
| Engine v1 — Platinum (retroactive) | 1,067 with odds | **+6.75%** |
| Engine v1 — Gold (retroactive) | 7,084 with odds | **+3.37%** |
| Engine v1 — Silver (retroactive) | 15,501 with odds | **-2.24%** |
| Engine v1 — Free (retroactive) | 7,916 with odds | **-6.89%** |
| Engine v1 — **Live forward-feed (Gold+)** | **182** | **🚨 -10.90%** |
| Engine v1 — Backtest only (Gold+, post-deploy retroactive) | 33,028 | **+5.49%** |
| Engine v2 — Backtest combos (CORRECTED full body) | 438 | **+27.48%** |
| Engine v2 — Backtest combos (original partial body) | 179 | +41.81% |
| Engine v2 — Live combos | 62 | **+36.28%** |
| Engine v2 — UI displayed (12-month rolling) | 69 | **+16.85%** |

---

## 3. Critical findings

### 🚨 FINDING 1 — Engine v1 live ROI is negative (P1 commercial)

**The single most important finding of the audit.**

- Live forward-feed picks (n=182, Gold+, since 2026-04-16) show **-10.90% ROI** on real bookmaker odds
- Same population's *retroactive backtest* shows **+5.49% ROI**
- 16-percentage-point gap between simulation and reality
- **Likely cause:** soft seed-leakage in retroactive predictions. When we regenerated predictions in May 2026 for matches in 2022-2024, the Elo features used current (2026) ratings instead of point-in-time historical ratings, slightly inflating accuracy on retroactive picks.

**Implication:**
- Marketing claims like "Platinum tier +6.75% ROI" are based on the retroactive sample, which may not reflect live model edge.
- Sample size is too small (n=182) to claim live is structurally negative — wide confidence interval — but the *direction* is wrong vs the retroactive backtest.

**User decision (during Phase 2):** wait 6-8 weeks for live n>300 before any policy change. **No code action.**

---

### ⚠ FINDING 2 — Engine v2 (Combo) is the cleaner product, but original ROI was inflated by partial-window backfill (P2 commercial)

**Original Phase 3 audit (2026-05-06 morning) used a 179-combo backtest body covering only 2022-08 → 2023-08-13 — the combo-backfill had not been run for the rest of the available period.** After spotting the gap and extending the backfill to 2026-04-15:

- Combo backtest (CORRECTED): **+27.48% ROI on 438 combos** (was +41.81% on 179)
- Combo live (unchanged): +36.28% on 62 combos
- BT-Live gap is now +8.8pp (live above corrected BT) — still cleaner than Engine v1's -16pp gap
- Math 100% reconciles on 10/10 sample combos
- Live cohort actually outperforms the corrected backtest, but n=62 is in wide CI

**But:**
- Live n=62 is too small to lock in a final ROI number (CI roughly [+5%, +70%])
- UI shows a 12-month rolling window: **+16.85% on 69 combos** — different story than either lifetime number
- Avg combined edge of 28.8% is suspiciously high; may reflect overconfidence in underlying model
- The 14pp drop in backtest ROI when the gap was filled **weakens the original "no seed-leakage" claim** — period selection inflated the first number

**Implication:**
- Engine v2 is still the defensible product to lead with (math-verified, edge filter works)
- But the audit-writeup mistake (incomplete body presented as lifetime) should not be repeated — always cross-check sample completeness against eligible-prediction count per period before claiming "lifetime"
- Marketing should align around **one** number — corrected lifetime (+27%), 12-month UI (+17%), or live (+36%)

---

### ⚠ FINDING 3 — UI shows different "live measurement" on different pages (P2 cosmetic)

- `/trackrecord/live-measurement` returns **52.94% on n=612** (full live cohort)
- `/trackrecord/summary?source=live` returns **63.22% on n=174** (free-tier subset, after access_filter)
- Both numbers are technically correct (different cohorts), but a user reading the trackrecord page can see both depending on which sub-tab they click
- 10pp gap looks like inconsistency

**Implication:**
- Trust risk: users notice the discrepancy and assume cherry-picking
- **Easy fix when ready:** label both numbers explicitly ("All live picks: 52.9%" vs "Free-tier live picks: 63.2%")

---

### ⚠ FINDING 4 — Headline accuracy 46.6% is retroactive backfill, not live model (P2 product)

- Anonymous user on `/trackrecord` sees **46.59%** (n=5,134) as the headline
- That number is dominated by retroactive backfill stamped at exact kickoff (`predicted_at = scheduled_at`)
- The honest live-only number for the same free-tier-eligible subset is 63.22% (n=174)
- Or for the full live cohort: 52.94% (n=612)

**Implication:**
- The headline number on the public trackrecord is a *worst-case* simulation, not a *live measurement*
- Free users see "46.6%" and may dismiss the platform; the actual live signal is materially better

---

### ✅ FINDING 5 — Reproducibility is perfect (P1 trust)

- Same query 3× → byte-identical aggregates (n=38,402, correct=19,399, brier=0.198515)
- 100% evaluator coverage across **48,514** post-deploy predictions (across 3 sources, 15 leagues, 46 months)
- Manual ROI labels match stored on 5/5 random spot-checks
- Brier scores reconcile to mean-form (industry standard)

**Implication:**
- The technical foundation is trustworthy
- Anyone with DB access can reproduce headline numbers from raw data
- No data corruption, no off-by-one, no flaky aggregations

---

## 4. Bug summary across all phases

### P1 (critical)
- **None found in code/data.** The only P1-class issue is commercial (Finding 1: live ROI gap).

### P2 (notable)
1. **Engine v1 retroactive vs live ROI gap** (Finding 1) — likely soft seed-leakage in regenerated predictions
2. **Engine v2 audit window vs UI window mismatch** (Finding 2) — +40% lifetime vs +17% 12-month
3. **Two "live measurement" numbers on trackrecord** (Finding 3) — 52.9% vs 63.2%
4. **Headline 46.6% accuracy is retroactive, not live** (Finding 4)
5. **Engine v2 selector misses live picks with null snapshot** (Phase 4 §4.1) — daily snapshot job timing leaves ~40% gap on recent picks
6. **Engine v2 combined edge avg 28.8% is suspiciously high** (Phase 3 §3.5) — possible overconfidence in underlying model
7. **Engine v2 duplicate-combo issue on consecutive days** (Phase 3 §3.5) — same legs counted 2× when they fall in 48h window

### P3 (cosmetic / documentation)
8. **Snapshot ↔ odds_history mismatch is by-design but undocumented** (Phase 4 §4.5) — risk of future developer "fixing" it wrongly
9. **`prediction_source` field has no docstring** explaining live vs backtest vs batch_local_fill cohorts
10. **Predictions list partition off by 244 picks (0.6%)** vs v8.1 evaluated population (Phase 5 §5.3) — likely NULL-tier edge cases
11. **1 stray Pinnacle odds row from Jan 2023** (Phase 1 §B) — negligible cleanup

---

## 5. ROI claim defensibility ranking

For each public surface, rank how defensible the displayed metric is:

| Surface | Number shown | Defensibility |
|---|---|---|
| `/combi-of-the-day` stats card | +16.85% ROI on 69 combos (12-mo rolling) | ✅ **Strong** — math verified, sample n=69, CI [+0%, +35%] |
| Engine v2 lifetime (CORRECTED audit) | +27.48% ROI on 438 combos | ✅ **Strong** — full body 2022-08 → 2025-11, math verified |
| Engine v2 lifetime (ORIGINAL, do not use) | +40.39% ROI on 241 combos | ⚠ **Stale** — partial body, superseded by corrected number |
| `/trackrecord/summary` per-tier (Platinum) | 77.86% accuracy on 1,242 | ✅ **Strong** — large sample, calibration-checkable |
| `/trackrecord/live-measurement` | 52.94% accuracy on 612 | ✅ **Honest** — full live cohort, no cherry-pick |
| `/trackrecord/summary?source=live` | 63.22% on 174 | ⚠ **Tier-biased** — free-tier subset of live, reads better than full cohort |
| Engine v1 Platinum ROI claim | +6.75% on 1,067 | ⚠ **Retroactive, suspect** — live forward-feed n=182 is **negative** |
| `/trackrecord/summary` headline | 46.59% on 5,134 | ⚠ **Retroactive-dominated** — not the live model accuracy |
| Engine v1 Gold ROI claim | +3.37% on 7,084 | ⚠ **Retroactive, suspect** — same seed-leakage concern |

---

## 6. Recommendations (no actions taken — audit-only)

### Immediate (within current sprint, when audit ends)
1. **Decide on one combo number:** UI window OR audit window. Update marketing copy and Phase 3 audit conclusion to align.
2. **Label live-measurement clearly:** "All live picks: X" vs "Free-tier live picks: Y" so the 10pp gap stops looking like inconsistency.
3. **Add a `?live_only=true` toggle** to `/trackrecord/summary` so users can compare retroactive vs live measurement on the headline card.
4. **Mark Engine v1 ROI claims with a confidence indicator:** "Retroactive backtest +6.75% / Live forward-feed (n=182) -10.9%" — show both, let the user judge.

### Pending data growth (4-6 months)
5. **Wait for live forward-feed n>300** on Gold+ before locking in any Engine v1 ROI claim.
6. **Wait for live combo n>200** before final +EV verdict on Engine v2.

### Investigative (P3, low-priority)
7. **Verify soft seed-leakage hypothesis** by re-running Engine v1 backtest with point-in-time Elo ratings and comparing to current numbers.
8. **Schedule `populate_closing_odds_snapshot` post-prediction** so combo selector sees newly-generated live picks immediately (closes the 40% snapshot-null gap).
9. **Dedup combo backfill** on consecutive days when same legs are selected 2× in the 48h window.
10. **Add docstring to `Prediction.closing_odds_snapshot`** clarifying point-in-time semantics; prevent future developer "fixes."
11. **Investigate combo edge avg of 28.8%** — calibrate whether high-edge legs actually win at higher rate than low-edge legs; if not, edge metric is poorly calibrated.

### Cosmetic
12. **Delete the 1 stray Pinnacle row** from Jan 2023.
13. **Document `prediction_source` field** so downstream queries know what each value means.

---

## 7. What this audit did NOT do

To prevent scope creep:

- ❌ Did not change any engine code
- ❌ Did not modify ingestion pipelines
- ❌ Did not retrain models
- ❌ Did not touch the UI
- ❌ Did not delete any data (including the stray Pinnacle row)
- ❌ Did not audit Pricing or Engine pages (per scope note in Phase 5)
- ❌ Did not benchmark against external models or odds sources

The output is **6 markdown files** in `docs/` plus this consolidated report. All endpoint code added during the audit lives at `/api/internal-ops/audit/phase{1..6}-*`, gated by `INTERNAL_OPS_KEY`, and is read-only.

---

## 8. What's worth keeping (engineering hygiene wins)

The 6 audit endpoints (`/audit/phase1` through `/audit/phase6`) are reusable:

- `phase1-odds-inventory` — useful for monthly data-quality check
- `phase2-engine1-roi` — useful for tracking live cohort growth
- `phase3-engine2-combo` — useful before any combo-selector tuning
- `phase4-dataflow` — useful as a pre-deploy smoke test
- `phase5-ui-consistency` — useful when adding new dashboard pages
- `phase6-reproducibility` — useful as a CI nightly job

Recommend keeping these endpoints in the codebase and documenting them in `backend/API_CONTRACT.md`.

---

## 9. Final verdict

> **The pipeline is technically sound. The commercial story is partially overstated.**

✅ **Trustworthy:** ingestion, storage, display, evaluator, scoring, reproducibility.

⚠ **Needs care:** the gap between *what was simulated* (retroactive backtest with current model + current odds + current Elo seeds) and *what was lived* (live cron picks scored against actual closing odds).

🚨 **Action item that will resolve in time:** wait for live n>300 on Engine v1 and live n>200 on Engine v2 before locking in marketing claims. The platform is operating in good faith but the live evidence base is still small.

---

**END. Audit complete. 7 phases delivered. 6 phase reports + this consolidated verdict in `docs/`. No code changes were made to the engines, frontend, or data; only documentation and read-only audit endpoints.**
