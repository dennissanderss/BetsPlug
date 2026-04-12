# BetsPlug v6 — Comprehensive System Audit Report

## Datum
12 april 2026, 21:30 UTC

## Executive Summary

BetsPlug heeft een **werkend platform in productie** met 5.110 predictions, live scores, trackrecord, en exports. De meeste pagina's functioneren correct na de v6.x bugfix rondes.

Er zijn **3 kritieke issues**, **4 high priority issues**, en **6 medium/low issues** gevonden. Het belangrijkste probleem: **Strategy Lab toont misleidende "Profitable" badges** omdat twee validatie engines tegenstrijdige resultaten geven. De `/metrics` endpoint (simpele ROI > 0 check) zegt "validated", de `/validation-refresh-v2` endpoint (walk-forward + odds coverage) zegt "under_investigation". De frontend leest de eerste, niet de tweede.

---

## Backend Health (Stap 1)

### Endpoint Status

| Endpoint | HTTP | Response | Issues |
|---|---|---|---|
| GET /api/health | 200 | status:ok, all checks green | None |
| GET /api/dashboard/metrics | 200 | 5110 forecasts, 49.6% accuracy | None |
| GET /api/strategies/ | 200 | 14 strategies, all is_active=false | None |
| GET /api/strategies/{id}/metrics | 200 | Returns validation_status + ROI | **CRITICAL: uses lenient validation** |
| GET /api/strategies/{id}/picks | 200 | 2719 total, 50 per page | None |
| GET /api/strategies/{id}/upcoming-picks | 404 | Not Found | Endpoint doesn't exist |
| GET /api/strategies/{id}/historical-picks | 404 | Not Found | Endpoint doesn't exist |
| GET /api/strategies/active | 422 | Validation Error | Endpoint exists but broken query param |
| GET /api/predictions/ | 200 | Paginated, total=5110 | match field is null (model_validate fallback) |
| GET /api/route/strategy-follower | 200 | data=[], 0 validated | **Correct: no validated strategies** |
| GET /api/route/quick-pick | 200 | Liverpool vs PSG, conf=0.63 | Working |
| GET /api/route/explorer | 200 | Upcoming fixtures with predictions | Working |
| GET /api/trackrecord/summary | 200 | 4999 evaluated, 49.5% accuracy | None |
| GET /api/trackrecord/segments?group_by=league | 200 | 6 leagues | None |
| GET /api/trackrecord/calibration | 200 | 10 buckets, ECE=0.035 | None |
| GET /api/bet-of-the-day/ | 200 | Liverpool vs PSG, odds included | None |
| GET /api/bet-of-the-day/track-record | 200 | 346 picks, 66.7% accuracy | **HIGH: suspiciously high — needs verification** |
| GET /api/fixtures/upcoming | 200 | 8 fixtures (dedup working) | None |
| GET /api/fixtures/live | 200 | 7 live fixtures | None |
| GET /api/fixtures/results | 200 | 42 results | None |
| GET /api/models/ | 200 | 1 model: BetsPlug Pulse v2.1.0 | None |
| GET /api/reports/ | 200 | 13 reports | None |
| GET /api/trackrecord/export.csv | 200 | Streaming CSV | None |
| POST /api/strategies/validation-refresh-v2 | 200 | 0 validated, 7 under_investigation | **Uses strict walk-forward validation** |

### Code Structure Findings

1. **Two conflicting validation engines:**
   - `/strategies/{id}/metrics` → `_compute_validation_status()` (line ~179 in strategies.py) — simple check: ROI > 0 + sample > threshold = "validated"
   - `/strategies/validation-refresh-v2` → walk-forward validation with odds coverage requirement — returns "under_investigation" for same strategies
   - **Frontend reads `/metrics` which uses the lenient engine**

2. **prediction_strategies join table exists but is NOT used** — matching happens on-demand in `/picks` endpoint via `evaluate_strategy()` function. The table is only cleared in admin endpoints.

3. **No background job matches predictions to strategies** — all matching is real-time per API request.

4. **No hardcoded mock data** in frontend — all data comes from API.

5. **validation_status is NOT a DB column** — it's computed on-the-fly in the `/metrics` endpoint.

---

## Database State (Stap 2)

### Counts

| Table | Count | Notes |
|---|---|---|
| Predictions | 5,110 | 5,000 evaluated, 110 pending |
| Correct predictions | 2,477 | 49.6% accuracy |
| Finished fixtures | 4,699 | Across 6 leagues |
| Scheduled fixtures | 239 | Next 7+ days |
| Strategies | 14 | All is_active=false |
| Models | 1 | BetsPlug Pulse v2.1.0 |
| Reports | 13 | PDF/CSV |
| Odds rows (real) | ~27 | **CRITICAL: <1% coverage** |

### Data Coverage by Month
19 months of data: Aug 2024 — Apr 2026. Per-month accuracy ranges from 41.3% (Aug 2024) to 56.0% (Apr 2026 partial). No gaps in coverage except Jun-Jul 2025 (summer break).

### Strategy Metrics Comparison: Two Engines

| Strategy | /metrics status | /validation-refresh-v2 status | Conflict? |
|---|---|---|---|
| High Confidence Any | **validated** | **under_investigation** | YES — CRITICAL |
| Model Confidence Elite | **validated** | **under_investigation** | YES — CRITICAL |
| Home Dominant | under_investigation (0% WR) | under_investigation | Partial — WR=0 in metrics but 63.3% in refresh |
| Conservative Favorite | under_investigation (0% WR) | under_investigation | Same |
| Anti-Draw Filter | under_investigation (0% WR) | under_investigation | Same |
| Defensive Battle | rejected | rejected | Match |
| Draw Specialist | rejected | rejected | Match |

**Root cause**: `/metrics` evaluates ALL matching predictions against the strategy rules on-the-fly and computes a simple winrate/ROI. The ROI calculation uses the 1.90 fallback odds for 99% of picks. If winrate × 1.90 > 1.0 → it says "validated".

The `/validation-refresh-v2` uses walk-forward windows and requires real odds coverage > 5% to trust ROI numbers.

---

## Frontend Pages (Stap 3)

| Page | Path | Status | Key Issues |
|---|---|---|---|
| Jouw Route | /jouw-route | ✅ OK | None |
| Dashboard | /dashboard | ⚠️ | "Recente voorspellingen" works now; charts work |
| Strategie Lab | /strategie | ❌ CRITICAL | "Profitable" badges misleading; metrics use lenient validation |
| Tip van de Dag | /pick-van-de-dag | ✅ OK | BOTD track record shows 66.7% — verify this |
| Voorspellingen | /voorspellingen | ✅ OK | 3 tabs, league grouping, live scores, dedup working |
| Resultaten | /resultaten | ✅ OK | Strategy context banner added |
| Weekrapport | /weekrapport | ✅ OK | None |
| Trackrecord | /prestaties | ✅ OK | Data transparency card, CSV export, models panel |
| Rapporten | /rapporten | ✅ OK | List shows, generate works, PDF/CSV/JSON |
| Instellingen | /instellingen | ✅ OK | None |

---

## Strategy Lab Data Flow Trace (Stap 4)

### The Complete Flow

```
User opens Strategy Lab (/strategie)
  └─ Frontend calls: GET /api/strategies/
     └─ Returns: 14 strategies with name, rules, is_active
        └─ For each strategy, frontend calls: GET /api/strategies/{id}/metrics
           └─ Backend: _compute_validation_status() runs
              └─ Evaluates ALL predictions against strategy rules in-memory
              └─ Computes winrate=55.6%, ROI=+5.6% (with 1.90 fallback odds)
              └─ Simple check: ROI > 0 AND sample > 100 → validation_status="validated"
           └─ Frontend receives: validation_status="validated"
              └─ Frontend shows: GREEN "Profitable" badge

User clicks "High Confidence Any"
  └─ Navigate to /strategie/[id]
     └─ Frontend calls: GET /api/strategies/{id}/picks?limit=200
        └─ Backend: evaluate_strategy() runs for each recent prediction
        └─ Returns: mixed list of upcoming + historical picks
        └─ Frontend filters client-side:
           └─ Today's picks: predictions where match is today + scheduled
           └─ All picks: paginated list
```

### ROOT CAUSE — Strategy Lab "Profitable" Mismatch

The `/metrics` endpoint uses `_compute_validation_status()` which has a **lenient** validation gate:
- If winrate > 0.5 AND ROI > 0 AND sample > 100 → "validated"
- This doesn't check real odds coverage
- This doesn't run walk-forward validation
- This uses 1.90 fallback odds → inflates ROI

The `/validation-refresh-v2` endpoint uses the **strict** walk-forward gate:
- Requires real odds coverage > 5%
- Runs rolling walk-forward windows
- Checks Sharpe ratio stability
- Result: "under_investigation" (not enough real odds)

**The frontend only reads `/metrics`** → shows "Profitable" for strategies that the strict engine would not validate.

---

## Inconsistency Hunt (Stap 5)

| Metric | Dashboard | Trackrecord | Strategy Lab | Match? |
|---|---|---|---|---|
| Total predictions | 5,110 | 4,999 (evaluated only) | N/A | ✅ Explainable (111 pending) |
| Accuracy | 49.6% | 49.5% | 55.6% (HCA only) | ⚠️ Strategy shows filtered subset |
| Profitable strategies | N/A | N/A | 2 shown | ❌ Backend says 0 validated |
| BOTD accuracy | N/A | N/A | N/A | 66.7% — needs verification |

### BOTD Track Record: 66.7% Accuracy — Suspicious?

The BOTD endpoint reports 346 picks with 66.7% accuracy. This is the **highest-confidence subset** of all predictions (confidence >= 0.55, best per day). A 66.7% accuracy on high-confidence picks is **plausible** — the model's overall accuracy is 49.6% on all 3-way predictions, but high-confidence picks should outperform. However, this should be verified by checking if the BOTD logic correctly selects only one pick per day and uses point-in-time data.

---

## Homepage Overload Analysis (Stap 6)

The homepage is the **public-facing landing page** (not the logged-in dashboard). Sections from top to bottom:

| # | Section | Purpose | Keep/Change? |
|---|---|---|---|
| 1 | Hero with CTA | Attract signups | ✅ Keep |
| 2 | Feature badges (AI, transparent, live) | Trust building | ✅ Keep |
| 3 | How BetsPlug Works (3 steps) | Explain the product | ✅ Keep |
| 4 | Live predictions preview | Show the product in action | ✅ Keep but simplify |
| 5 | Track Record section | Social proof | ⚠️ Overlaps with /trackrecord page |
| 6 | Pricing | Convert visitors | ✅ Keep |
| 7 | Testimonials | Social proof | ✅ Keep |
| 8 | FAQ | Answer objections | ✅ Keep |
| 9 | Telegram CTA | Community | ✅ Keep |
| 10 | Footer | Navigation + legal | ✅ Keep |

**Verdict**: Homepage is information-dense but acceptable for a SaaS landing page. The Track Record section (#5) could link to the full page instead of duplicating data. No critical issues.

---

## Severity Classification

### CRITICAL — Must fix before launch

**C1: Strategy Lab validation_status conflict**
- **What**: `/metrics` says "validated", `/validation-refresh-v2` says "under_investigation". Frontend shows "Profitable" based on lenient check.
- **Why critical**: Misleads users into trusting strategies with unverified ROI
- **Fix**: Make `/metrics` use the same validation logic as `/validation-refresh-v2`, OR add `validation_status` as a DB column that's only set by the strict refresh endpoint, and have `/metrics` read that column instead of computing its own.
- **ETA**: 30-60 min
- **Risk**: Low — only changes where validation_status comes from

**C2: ROI based on 1.90 fallback odds (99% of picks)**
- **What**: Real odds coverage is <2%. All ROI numbers are unreliable.
- **Why critical**: Any positive ROI is meaningless if odds are fake
- **Fix option A**: Show disclaimer "ROI based on estimated odds" on Strategy Lab until coverage > 50%
- **Fix option B**: Hide ROI entirely and only show winrate until real odds are available
- **Fix option C**: Backfill historical odds from a different source
- **ETA**: 15-30 min (option A or B), unknown (option C)
- **Risk**: Low for A/B, unknown for C

**C3: Frontend "Profitable" badge ignores backend validation**
- **What**: Frontend checks `roi > 0` from `/metrics`, not `validation_status`
- **Why critical**: Even if we fix C1, frontend won't use it unless updated
- **Fix**: Frontend Strategy Lab page to use `validation_status` field for badge color/text
- **ETA**: 15 min
- **Risk**: Low

### HIGH — Should fix this week

**H1: predictions list match field is null**
- **What**: GET /api/predictions/ items have `match: null` — the model_validate fallback doesn't include match data
- **Why**: The v6.3 rewrite of predictions.py removed the PredictionMatchSummary construction
- **Fix**: Add match data back in the fallback path
- **ETA**: 20 min
- **Risk**: Low

**H2: BOTD track record 66.7% — verify calculation**
- **What**: 346 picks at 66.7% accuracy seems high. May be selecting multiple picks per day or including non-BOTD picks.
- **Fix**: Review the `/bet-of-the-day/track-record` query logic
- **ETA**: 15 min to verify, 30 min if needs fix
- **Risk**: Low

**H3: Strategy Lab — some strategies show 0% winrate in /metrics**
- **What**: Home Dominant (63.3% in refresh-v2) shows 0% in /metrics. The evaluate_strategy() function may not match predictions correctly for all strategy types.
- **Fix**: Debug evaluate_strategy() for strategies with 0% match rate
- **ETA**: 30-60 min
- **Risk**: Medium

**H4: Remaining "Brier Score" / "Ensemble" references**
- **What**: Strategie Lab page has hardcoded "BRIER SCORE" label. Trackrecord transparency text mentions "Brier score". Blog articles say "Ensemble" instead of "BetsPlug Pulse".
- **Fix**: Update i18n strings + hardcoded text
- **ETA**: 15 min
- **Risk**: Low

### MEDIUM — Can wait

**M1: Duplicate fixtures in DB (dedup filter hides them)**
- **What**: ~50% of fixtures exist twice (football-data.org + API-Football versions)
- **Fix**: DB cleanup script to merge/delete apifb duplicates
- **ETA**: 30 min
- **Risk**: Medium — must preserve linked predictions

**M2: Admin paywall — verify it works for all pages**
- **What**: Admin bypass was added but login session may not persist correctly across all pages
- **Fix**: Test admin session persistence on all protected pages
- **ETA**: 15 min
- **Risk**: Low

**M3: CSV export date format could be friendlier**
- **What**: ISO 2024-08-09 format is technical; "09 Aug 2024" is more readable
- **Fix**: Change strftime format in export
- **ETA**: 5 min
- **Risk**: Low

### LOW — Nice to have

**L1: Visual Pulse diagram on About page**
**L2: Blog/articles "Ensemble" → "Pulse" content update
**L3: Homepage track record section → link to full page instead of duplicating**

---

## Aanbevolen Fix Volgorde

1. **C1 + C3** together — Fix validation_status source + frontend badge. This is the core trust issue.
2. **C2** — Add ROI disclaimer or hide until real odds available
3. **H1** — Fix predictions match field
4. **H3** — Debug strategy evaluate matching
5. **H4** — Label/text cleanup
6. **H2** — Verify BOTD track record calculation
7. Rest can wait

---

## Wat Vereist User Beslissing

1. **C2 — ROI display**: User must choose:
   - Option A: Show ROI with disclaimer "based on estimated odds"
   - Option B: Hide ROI entirely, only show winrate
   - Option C: Try to backfill real historical odds from another source

2. **Strategy Lab visibility**: User must decide:
   - Show all 14 strategies with honest statuses (validated/under_investigation/rejected)?
   - Or only show strategies that pass the strict validation gate (currently 0)?
   - Or hide Strategy Lab entirely until real odds data accumulates?

3. **BOTD 66.7%**: If this is inflated, do we:
   - Fix the calculation to be more conservative?
   - Add context like "based on X picks, confidence threshold Y"?

---

## Wat NIET in deze audit

- Engine model wijzigingen (Pulse engine werkt, 49.6% accuracy is realistisch)
- Database schema changes
- ML model retraining
- Nieuwe features
- Architectuur wijzigingen
- Homepage redesign (beyond minor cleanup)
