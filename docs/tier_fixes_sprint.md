# Tier Fixes Sprint — 2026-04-17

Follow-up sprint to `docs/tier_data_integrity_audit.md`. Seven fixes, one commit per fix, no engine or DB-schema changes.

All commits on `main`. Branch clean at the end of the sprint.

## Commits (in order)

| # | Commit | Bug ID | One-liner |
|---|---|---|---|
| 1 | `5218e36` | **B0.1** (P0) | `api.ts` injects `?tier=<slug>` from `betsplug_admin_testing_tier` so the admin TierSwitcher actually impersonates on the backend |
| 2 | `6b9abd7` | **B1.2** (P1) | `POST /reports/generate` returns 402 for Free/Silver — backend parity with the Gold+ `PaywallOverlay` |
| 3 | `a1d7b90` | **B1.4** (P1) | Trackrecord RecentPredictionsFeed is swapped for an explainer card when a specific tier tab is active |
| 4 | `87c1cc9` | **B1.1** (P1) | `/trackrecord/export.csv` requires auth (401) and rejects `?pick_tier` above the caller's subscription (402); public page shows sign-in CTA |
| 5 | `e4eb14f` | **B1.3** (P1) | New `TierEmptyStateCard` on the dashboard surfaces upgrade copy when the user's own tier has zero picks in the v8.1 window |
| 6 | `b02439a` | **B2.5** (P2) | `PickReasoningBlock` integrated into the predictions list — Gold+ expand the 3-driver breakdown, Free/Silver see a locked teaser |
| 7 | `b03781a` | **B2.1, B2.3, B2.4** (P2) | Reports Win-rate wired to `/dashboard/metrics`; BOTD KPI hidden on specific tier tabs of public track-record; tier-tabs on in-app trackrecord ship an inline definition row |

## What's actually fixed

- **Admin QA flow.** Tier switcher now produces real tier-scoped responses, not UI drift → error boundary. Every outgoing request (JSON + `<a href>` downloads) carries the `?tier=` override.
- **Reports paywall.** cURL / Postman access to `/api/reports/generate` as Free/Silver returns 402 with an explicit "Gold tier required" detail.
- **CSV leak.** Anonymous visitors can no longer download any tier CSV; Free can only download Free; Silver gets Free+Silver; and so on. Aggregate numbers stay public via `/trackrecord/summary`.
- **Trackrecord UX.** Tier tabs no longer imply they filter the picks list — the feed is hidden (with a short explainer) when a specific tier is active.
- **Dashboard empty state.** `TierEmptyStateCard` replaces silent zeros for users whose tier has no picks in the current v8.1 window; auto-hides once data exists.
- **"Why this pick?" integration.** The block is rendered per match card on `/predictions`, self-gating on Gold+.
- **Polish.** Reports Win-rate KPI uses live metrics; ROI/Streak now carry tooltips explaining the pending state. Public track-record BOTD KPI no longer confuses users on specific tier tabs. In-app tier-tabs now ship with a one-line definition of each tier's rules.

## Not changed (deliberate)

- **B2.2 (CSV filename double dash).** The claim turned out to be wrong — the existing f-string already emits a single dash when `pick_tier` is omitted (`betsplug-trackrecord-2026-04-17.csv`). No code change.
- **P2.1 / P2.2 / P2.4 / P3.1 drift items** from the earlier QA report remain open — they are drift-risk, not present bugs.
- **Backend data-scoping changes.** Data-level tier logic (`access_filter`, `pick_tier_expression`, `v81_predictions_filter`) was already correct per the audit. This sprint only added authorization / UX layers on top.
- **Engine, DB schema, migrations.** Untouched per brief.

## Type-safety

`npx tsc --noEmit` in `frontend/` was clean after each fix. `python -c "import ast; ast.parse(...)"` clean on every edited backend file.

## Follow-up items (not blocking)

- `tier_data_integrity_audit.md` lists three product-decisions that were flagged but not addressed in this sprint:
  1. Whether to tighten CSV even further (e.g. drop row-level columns entirely for lower tiers) — the current 402-gate already removes the leak, so lower urgency.
  2. Whether ROI/Streak on the Reports page should be built out next — they ship as "—" with tooltips for now.
  3. Whether `PickReasoningBlock` should also be rendered on the match-detail page — the sprint only added it to the predictions list.

- The `refresh` call in `useTier()` (see `hooks/use-tier.ts`) is unchanged — the admin switcher's `window.location.reload()` still blows away React Query cache, so tier-suffix on queryKeys isn't strictly needed yet. If we ever want to support tier-switching without reload, we'd add the suffix then.
