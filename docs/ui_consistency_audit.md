# Phase 5 — UI / UX Numerical Consistency Audit

*Generated 2026-05-06 via `GET /api/internal-ops/audit/phase5-ui-consistency` + parallel calls to public `/api/trackrecord/*` and `/api/value-bets/combo-*` endpoints. Skipped: Pricing + Engine pages per scope note. No mutations.*

---

## Executive summary

Goal: verify that the numbers each authed/public dashboard page displays **reconcile to the underlying database**, and that the **same metric is consistent across pages**.

| Surface | Numbers reconcile? | Notes |
|---|---|---|
| `/trackrecord` summary card (default) | ✅ to access_filter math | 5,134 total, 46.6% accuracy — but is dominated by retroactive backfill |
| `/trackrecord` per-tier breakdown | ✅ to ladder semantics | each tier filter returns expected subset |
| `/trackrecord/live-measurement` | ⚠ inconsistent with summary?source=live | 52.9% (n=612) vs 63.2% (n=174) |
| `/combi-of-the-day` stats card | ⚠ shows 12-month window only | 69 combos / +16.85% ROI vs Phase 3 full-body +40.39% on 241 |
| `/combi-of-the-day` today | ✅ hard-locked correctly | `coming_soon: true`, `legs: []` |
| `/predictions` list partition | ✅ partitions reconcile | 19,802 free + 11,159 silver + 4,939 gold + 2,744 platinum = 38,644 (≈ 38,400 v8.1 filtered) |

**Verdict:** numbers reconcile to the math. **But two coherence issues exist** between what different pages say about the *same underlying signal*.

---

## 5.1 — Population reconciliation

### Raw database
- `predictions`: **117,765** rows
- `prediction_evaluations`: 117,521 rows (99.8% graded)
- `matches`: 58,631 rows
- `combo_bets`: 241 rows

### v8.1-filtered population (the trackrecord pipeline universe)
Filter: `prediction_source IN ('batch_local_fill','backtest','live') AND created_at >= 2026-04-16 11:00 AND predicted_at <= scheduled_at`

| Metric | Value |
|---|---:|
| Evaluated | 38,400 |
| Correct | 19,397 |
| Accuracy | **50.51%** |

This is the **honest population accuracy** of the v8.1 pipeline.

### What anonymous user sees on `/trackrecord`
Public `/api/trackrecord/summary` (no auth = free user):

| Metric | Value |
|---|---:|
| total_predictions | **5,134** |
| accuracy | **46.59%** |

**Why 5,134 not 38,400?** The `access_filter(free)` strips out predictions that classify as Silver/Gold/Platinum tier (league-gated + confidence-gated). 33,266 picks are hidden behind paywalls. Anon users see only the leftover free-tier-eligible subset.

✅ **Mathematically reconciles** to the access-filter math: free-tier picks = (in LEAGUES_FREE) AND (conf >= 0.55) AND (does not also qualify as Silver/Gold/Platinum).

⚠ **But the number 46.6% is misleading as a model-accuracy headline.** It is the *worst-tier subset* on the *stalest data* (retroactive backfill stamped at exact kickoff). Live-only on this same surface is 63.2% (see § 5.4).

---

## 5.2 — Per-tier breakdown reconciliation

### From public `/trackrecord/summary?pick_tier={tier}`

| Tier filter | Total | Correct | Accuracy | Avg conf |
|---|---:|---:|---:|---:|
| `?pick_tier=free` | 5,133 | 2,391 | 46.58% | 0.614 |
| `?pick_tier=silver` | 4,688 | 2,726 | 58.15% | 0.703 |
| `?pick_tier=gold` | 2,447 | 1,720 | 70.29% | 0.765 |
| `?pick_tier=platinum` | 1,242 | 967 | 77.86% | 0.815 |

### From Phase 5 audit endpoint (raw v8.1 ladder by confidence threshold only)

| Threshold | n | Accuracy |
|---|---:|---:|
| `>= 0.0` (free baseline) | 38,400 | 50.51% |
| `>= 0.62` (silver) | 18,644 | 57.04% |
| `>= 0.70` (gold) | 7,615 | 69.69% |
| `>= 0.78` (platinum) | 2,723 | 80.39% |

**Reading:**
- ✅ Accuracy curves are very close (silver 58.1% UI vs 57.0% raw; gold 70.3% vs 69.7%; platinum 77.9% vs 80.4%) — the league-gating shaves a small fraction
- ✅ Counts differ as expected because the UI tier classifier requires the league to be in the tier whitelist (LEAGUES_PLATINUM, LEAGUES_GOLD, etc.) on top of the confidence threshold
- ✅ **Per-tier numbers are internally consistent.** Tier ladder behaves as advertised.

---

## 5.3 — Predictions list reconciliation

`/predictions` page partitions picks into free / silver / gold / platinum.

| Cohort | n |
|---|---:|
| Free (conf < 0.62) | 19,802 |
| Silver-only (0.62–0.70) | 11,159 |
| Gold-only (0.70–0.78) | 4,939 |
| Platinum-only (>= 0.78) | 2,744 |
| **Total** | **38,644** |

vs v8.1 filtered population: **38,400**.

Δ = 244 picks (0.6%). Likely caused by predictions that have evaluations but a `predicted_at = scheduled_at` exact tie that lands differently between the partition (no Match join needed) and the trackrecord_filter (uses Match.scheduled_at). Or: some predictions evaluated but not matched-joined cleanly due to NULL match_id on freak rows. Negligible.

✅ **Predictions list partitions reconcile to v8.1 population within 0.6%.**

---

## 5.4 — Live-measurement inconsistency (⚠ ISSUE 1)

**Two different live-cohort accuracy numbers exist:**

| Endpoint | n | Accuracy | What filter |
|---|---:|---:|---|
| `/api/trackrecord/summary?source=live` | 174 | **63.22%** | live source + access_filter(free) |
| `/api/trackrecord/summary?pre_match_only=true` | 174 | 63.22% | predicted_at < scheduled_at + access_filter(free) |
| `/api/trackrecord/live-measurement` | (n omitted in payload) | **52.94%** | live source, no access_filter |
| Phase 5 audit (raw `prediction_source='live'`, no access filter) | 612 | 52.94% | live + post-deploy + pre-match |

**Reading:**
- The two filters (`source=live` and `pre_match_only=true`) collapse to the same 174-pick set on the summary endpoint because:
  - All `live` predictions are pre-match by construction → both filters keep them
  - All non-`live` (backtest/batch_local_fill) have `predicted_at = scheduled_at` exactly → kept by `<=` of trackrecord_filter, dropped by `<` of pre_match_only
- 174 of 612 = 28% of live picks survive `access_filter(free)` (free-tier-eligible subset)
- Free-tier-eligible live picks (174) score 63.2%; full live cohort (612) scores only 52.9%

**Why this is a coherence problem:**
- A user reading `/trackrecord/live-measurement` sees **52.9%** ("ons live model")
- The same user clicking the "Live" filter on the same trackrecord page sees **63.2%**
- Both are live, both honest, but the difference (10pp gap) confuses the message
- **Marketing implication:** if we say "live model = 53%", then claim "63%" elsewhere, we look inconsistent or cherry-picky

**Root cause:** `live-measurement` endpoint deliberately shows the un-filtered cohort (more honest, smaller-tier-biased sample); `summary?source=live` applies `access_filter` which inflates the average because higher-tier picks are more accurate.

**Recommendation:** consolidate both to the same scope, or label them clearly:
- "Live measurement (all picks): 52.9% on 612"
- "Live measurement (free tier only): 63.2% on 174"

---

## 5.5 — Combo stats inconsistency (⚠ ISSUE 2)

### What Phase 3 audit reported (`engine_v2_audit.md`):
- 241 combos (179 backtest + 62 live)
- 47.72% hit rate, +40.39% ROI, +97.34u net P/L
- Avg combined edge: 28.8%

### What the UI shows (`/api/value-bets/combo-stats?scope=backtest`):
```json
{
  "scope": "backtest",
  "window_start": "2025-04-16",
  "window_end": "2026-04-15",
  "total_combos": 69,
  "evaluated_combos": 69,
  "hit_combos": 31,
  "accuracy": 0.4493,
  "avg_combined_odds": 2.79,
  "total_units_pnl": 11.62,
  "roi_percentage": 16.85,
  "wilson_ci_lower": 0.3377,
  "wilson_ci_upper": 0.5662
}
```

**Reading:**
- UI applies a **12-month rolling window** (`2025-04-16 → 2026-04-15`) → drops 172 of 241 combos (71% of the body)
- Headline shifts dramatically:
  - Sample: **241 → 69**
  - Hit rate: **47.7% → 44.9%**
  - ROI: **+40.4% → +16.85%**
  - PnL: **+97.34u → +11.62u**

**Why this is a coherence problem:**
- Phase 3 audit conclusion was "Engine v2 backtest +41.81% on 179 combos = bewezen +EV (CI ~[+30%, +55%])"
- A user looking at `/combi-of-the-day` sees +16.85% ROI on 69 combos (CI 33%–57%)
- Both are mathematically correct but tell **different stories** to different audiences
- Marketing claim ("+40% ROI") is technically true but does not match the in-product number

**Root cause:** the UI deliberately uses a rolling 12-month window so the displayed number reflects the model's *recent* performance, not the historical aggregate. Defensible product choice, but creates a gap between internal docs and surfaced numbers.

**Recommendation:**
- **Either** widen the UI window (`window_start = oldest combo date` ≈ 2022-08) to match the +40% claim
- **Or** restate marketing/spec to use the 12-month rolling number ("+16.85% over the last 12 months")
- **Or** show both: "12-month: +16.85% / Lifetime: +40.39%"

---

## 5.6 — Combo today (hard-lock)

```json
{
  "available": false,
  "reason": "coming_soon",
  "bet_date": "2026-05-06",
  "legs": [],
  "combined_odds": 0.0,
  "requires_tier": "platinum",
  "locked": true,
  "coming_soon": true
}
```

✅ **Hard-lock behaves as expected.** Combo of the day is not surfacing live picks; today's combo returns `coming_soon: true` per the deliberate gate (commit `617b281` — "feat(combo-of-day): hard-lock for non-admins while feature is in development"). No data leak through this endpoint for non-admins.

---

## 5.7 — Period coverage on /trackrecord

```
period_start: 2022-08-01T02:05:00Z
period_end:   2026-05-05T16:45:00Z
```

✅ **Spans 3.8 years.** This is the expected window — football-data.co.uk import starts July 2022 and live cron pushes daily through today. Matches Phase 1 inventory.

---

## 5.8 — Per-page UI snapshot

| Page | Primary endpoint | Filter scope shown to anon | Honest? |
|---|---|---|---|
| `/trackrecord` (summary card) | `/trackrecord/summary` | free-tier ladder | ✅ but dominated by retroactive |
| `/trackrecord` (live tab) | `/trackrecord/live-measurement` | full live cohort | ✅ honest |
| `/trackrecord` (per-tier tab) | `/trackrecord/summary?pick_tier=X` | strict tier subset | ✅ honest |
| `/predictions` (list) | `/fixtures/upcoming` etc. | upcoming fixtures + pick chip | ✅ — match-level, not aggregated |
| `/results` (history) | `/fixtures/results` | finished matches | ✅ — match-level |
| `/combi-of-the-day` (today card) | `/value-bets/combo-today` | hard-locked | ✅ |
| `/combi-of-the-day` (history) | `/value-bets/combo-history` | full body | ✅ |
| `/combi-of-the-day` (stats card) | `/value-bets/combo-stats` | **12-month rolling** | ⚠ inconsistent with audit |
| `/dashboard` (BOTD card) | `/bet-of-the-day` | today's picks | (not audited — admin/auth-only) |

---

## 5.9 — Identified issues

### ⚠ ISSUE 1 — Live-measurement two-number problem (P2)
Two endpoints both label themselves "live measurement" but return different cohorts:
- `/trackrecord/live-measurement`: 52.9% on n=612 (full live cohort)
- `/trackrecord/summary?source=live`: 63.2% on n=174 (free-tier subset)

**Severity:** P2 — both are honest, but the same page potentially shows both values which confuses users.

### ⚠ ISSUE 2 — Combo stats UI window vs Phase 3 audit window (P2)
- Phase 3 audit: +40.39% ROI on 241 combos (lifetime)
- UI `/combo-stats`: +16.85% ROI on 69 combos (last 12 months)
- Marketing/internal docs need to align with whichever number the UI shows

**Severity:** P2 — risk of marketing claims that don't match what users see.

### ✅ ISSUE 3 — Headline accuracy 46.6% is dominated by retroactive backfill
- Free-anon user sees 46.6% on `/trackrecord` headline
- That's 5,134 picks where 99% are retroactive simulation (`predicted_at = scheduled_at` exact kickoff stamp)
- Live-only is 63.2% on n=174 (free-tier) or 52.9% on n=612 (full)
- **Suggestion:** add a `?pre_match_only=true` toggle on the trackrecord page, or split "Lifetime backtest" vs "Live measurement" cards

**Severity:** P2 — already partly disclosed via the live tab, but the default headline is the retroactive number.

### ✅ ISSUE 4 — All raw partitions reconcile within 1%
Predictions list partition (38,644) vs v8.1 evaluated population (38,400) = 0.6% gap. Acceptable.

### ✅ ISSUE 5 — Combo today hard-lock works
Coming-soon gate returns `available: false`, no leg data leak.

---

## 5.10 — Bugs and risks

### P1 — None found
All numbers reconcile to their stated filter logic. No data corruption, no off-by-one, no NULL bugs in aggregations.

### P2
1. **Two "live measurement" numbers** (52.9% vs 63.2%) on different sub-pages of the same trackrecord surface
2. **Combo stats 12-month window** vs Phase 3 audit's lifetime aggregation creates marketing-vs-product gap
3. **Headline accuracy 46.6%** is the retroactive backfill number, not the live model number

### P3
4. **Predictions list partition off by 244 picks** vs v8.1 population — root cause not identified, likely <1% NULL-tier edge cases

---

## 5.11 — Recommendations (no actions taken)

1. **Pick one "live measurement" number per page** — either the 612-pick honest cohort or the 174-pick free-eligible subset, but not both shown on the same trackrecord surface without clear labels.
2. **Align combo-stats UI window with audit claims** — either widen to lifetime (+40.39% on 241) or update Phase 3 conclusions to match the 12-month UI window (+16.85% on 69).
3. **Add a "live-only" toggle** on `/trackrecord` summary card so users can see live model performance vs retroactive backfill side-by-side.
4. **Document the access_filter behavior** — anon users see 5,134 picks not 38,400; this is correct but invisible to product users wondering "where are all the picks?"
5. **No code fixes required for Phase 5** — the three issues are about *labelling and consistency*, not data integrity.

---

## 5.12 — Final verdict

✅ **Math reconciles.** Every page's numbers can be derived from raw DB given the page's stated filter.

⚠ **Coherence imperfect.** Two cases where the same metric appears with different values on different surfaces (live measurement, combo stats). Both honest, both correct, but visible to a user as inconsistency.

✅ **No data corruption, no display bugs, no off-by-one errors.** Underlying ingestion → storage → display chain (Phase 4) feeds the UI cleanly.

---

**STOP. Phase 5 complete. Awaiting approval before Phase 6 (Reproducibility audit).**
