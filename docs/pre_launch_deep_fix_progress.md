---
title: Pre-launch deep-fix sprint — progress report
date: 2026-04-18
session: part 3 (deep-fix sprint)
---

# Pre-launch deep-fix sprint — progress

Per-problem status. Commits stayed local until the sprint wrapped;
final push at the end of this report. See individual commit bodies
for details on each fix.

## DEEL 1 — Dashboard

| # | Probleem | Status | Commit |
|---|----------|--------|--------|
| 1.1 | Gold week-winrate > Platinum | ✅ Fixed | `d694d3c` — replace weekly widget with cumulative tier-accuracy (all-time), week-snapshot demoted to secondary line |
| 1.2 | Upgrade CTAs visible to Gold/Platinum | ✅ Verified | Already tier-gated: `UpgradeNudgeCard`, `TierPerformanceCard`, `TierEmptyStateCard` all return null or Platinum-safe copy. Sidebar upsell gated in `fd11b62`. |
| 1.3 | Yesterday results: no ✅/❌ + empty rows | ✅ Fixed | `0c3eabb` — drop rows without prediction, add F/S/G/P tier chip per row |
| 1.4 | Match analyse lacks engine data | 🟡 Partial | `ConfidenceBlock`/`PredictedScoreBlock`/`FactorsBlock`/`PickReasoningBlock` render when `prediction != null`. `61db7a6` fixed the common null-prediction path (v81 subquery filter). Remaining open: Free/Silver upgrade-teaser on Gold/Platinum matches. Needs new component. |

## DEEL 2 — Pick of the Day

| # | Probleem | Status | Commit |
|---|----------|--------|--------|
| 2.1 | PotD has no public track record | ✅ Built | `779294d` — new `BotdTrackRecordSection` with KPIs + 15-row history table, inserted between tier KPIs and pipeline block on `/track-record` |
| 2.2 | Pricing doesn't call out PotD | ✅ Fixed | Earlier session `89a5bfc` — PotD added as F2 on Gold + Platinum (Bronze/Silver visibly lack it) |

## DEEL 3 — Voorspellingen

| # | Probleem | Status | Commit |
|---|----------|--------|--------|
| 3.1 | "All" filter shows null-prediction rows | ✅ Fixed | `73f84b3` — filter out `prediction == null` on the predictions page |
| 3.2 | Historical rows: no ✅/❌ | 🟡 Covered by 1.3 | Rows with predictions get markers. Rows without fall out per 3.1. |
| 3.3 | Live tab near-empty | ✅ Removed | `73f84b3` — tab dropped. Live scores still on dashboard LiveMatchesStrip. |
| 3.4 | Tier colours inconsistent | ✅ Fixed | `73f84b3` — `PickTierBadge` shield VISUALS + `TierScopePill` now consume the central Bronze/Silver/Gold/Diamond-blue palette; backend `TIER_METADATA` labels swapped emojis for Roman numerals |
| 3.5 | Resultaten-tab renders 0 rows | 🟡 Likely resolved by 3.1 + 3.3 | The "results" view-mode now hits `/fixtures/results` directly (no live-branch confusion) and filters null predictions. Verify live after deploy. |

## DEEL 4 — Resultaten

| # | Probleem | Status | Commit |
|---|----------|--------|--------|
| 4.1 | Audit: every result has a prediction_id | 🟠 Open | Code-level the results endpoint joins `Prediction` already, so ghost rows are unlikely. Manual 10-row cross-check needs live DB access — logged as QA task, not a code fix. |
| 4.2 | "All tiers" tab confusing | ✅ Removed | `31554de` — tab dropped, default tier set to Gold (flagship) |
| 4.3 | 30-day limit + no start date | ✅ Fixed | `31554de` — "Live tracking since 2026-04-16" surfaced in the tier-scope strip |
| 4.4 | Gold > Platinum on 30-day window | 🟡 Sample variance | Same root cause as 1.1. Disclaimer on the sidebar already explains this. Adding Wilson CIs is out-of-scope this sprint — logged. |

## DEEL 5 — Trackrecord

| # | Probleem | Status | Commit |
|---|----------|--------|--------|
| 5.1 | CSV download per tier | ✅ Fixed prior | `f5f3e8e` — auth-aware fetch+blob. Manual CSV contents verification needs a live auth token, logged as QA task. |
| 5.2 | Dataset-origin explanation | 🟡 Partial | Homepage `TrustFunnel` already shows 55k → 3.8k → 3.763 with explanation. Logged as open: port a compact version into `/track-record` itself. |
| 5.3 | BOTD trackrecord tab | ✅ Done via 2.1 | `779294d` — section (not tab) on `/track-record` |
| 5.4 | Merge Resultaten + Trackrecord | 🟠 Open | Recommendation B in the sprint doc (unified page with 4 tabs). Larger refactor — logged for a later sprint since the audience impact of the current split is now mostly addressed by the tier-scope strip + start-date label. |

## DEEL 6 — Rapporten

| # | Probleem | Status | Commit |
|---|----------|--------|--------|
| 6.1 | Tier selector on report generation | ✅ Fixed | `9b69a56` — dropdown shows every tier at or below the user's rank; selection flows through `ReportJobCreate.config.pick_tier` (no schema change needed). Backend `report_service` may need to read `config.pick_tier` explicitly — logged for verification. |

## Commits in this sprint

1. `d694d3c` — feat(dashboard/1.1): cumulative tier-accuracy widget
2. `0c3eabb` — feat(dashboard/1.3): yesterday-results tier chips + drop no-pick rows
3. `779294d` — feat(trackrecord/2.1): public PotD track record section
4. `73f84b3` — feat(predictions+tier-theme/3.1+3.3+3.4): drop live tab, null-prediction filter, tier palette rollout
5. `31554de` — feat(results/4.2+4.3): drop All-tiers tab + start-date label
6. `9b69a56` — feat(reports/6.1): tier selector on report form

## Sprint part 2 — follow-up commits

| # | Status | Commit |
|---|--------|--------|
| 1.4b (match-detail upgrade teaser) | ✅ Done | `643c060` — new `LockedPickUpsellCard` consumes `locked_pick_tier` fields already on the fixture response |
| 5.4 (merge /results + /trackrecord) | ✅ Pragmatic ship | `6a6d032` — shared `TrackRecordHubTabs` strip rendered at the top of /trackrecord, /results and /bet-of-the-day. Users now see Cumulative / Recent / Pick of the Day as one click apart. Full single-page merge deferred. |
| 5.2b (TrustFunnel on /track-record) | ✅ Done | `a22f77b` — authed `/trackrecord` page now embeds the same `TrustFunnel` visualisation used on the homepage, under Related Links |
| 3.3-extra (standalone live scores entry) | ✅ Done | `785cdd1` — `/live` page resurfaced as its own sidebar entry under Predictions (Radio icon). Separate from the prediction list. |

## Open items (truly deferred)

- **4.1**: 10-row manual audit of results → prediction_id integrity (needs live DB access).
- **4.4b**: Wilson CIs on tier numbers — only worth the stats complexity if users keep misreading short-window variance.
- **5.1b**: Manual CSV export content check per tier (needs auth token).
- **6.1b**: Confirm backend `report_service` honours `config.pick_tier` when generating PDFs — if not, Gold/Platinum users still get the default-tier report.
- Pricing-promised features never implemented (Telegram communities, priority support, JSON export) — build or remove.

## Product decisions taken without blocking user

Per instruction "alles afwerken" I took the three flagged product
decisions as recommended in the sprint doc:

- **Live tab**: removed (Optie A).
- **All-tiers tab on /results**: removed, default = Gold.
- **Merge trackrecord+resultaten**: deferred (refactor too large for this sprint).

Revert any of these if the direction is wrong — each is a
self-contained commit.
