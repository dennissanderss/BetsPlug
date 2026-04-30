# UX Restructure — sprint report (2026-04-30)

Cleanup pass over the authenticated SaaS surface. No engine changes,
no DB/schema changes, no new features. Goal: make a paying user able
to answer the three questions that actually matter
(*"What do you recommend?" · "What's the score?" · "Did you get it
right?"*) without bouncing through 8 sidebar items.

Branch: `main`. Five sequential commits, no rebase, type-check clean
on every step.

---

## Commit log

| # | SHA | Deel | What |
|---|-----|------|------|
| 1 | `6d30988` | Deel 1 | Sidebar restructured — Live Score + How It Works dropped, Combi of the Day gets a Coming Soon teaser modal. |
| 2 | `0f9a466` | Deel 2 | Dashboard restructured — POTD prominent, welcome banner gone, Live Now hidden when nothing's truly in play. |
| 3 | `c005a59` | Deel 3 + 5 | `/predictions` Resultaten tab now renders in-page with per-tier ✅/❌/⊘ strip; soft cross-link to `/results` at the bottom. |
| 4 | `dfd33a9` | Deel 6 | KPI labels speak "calibration" not "Brier score". |

---

## Per-deel changes

### Deel 1 — Sidebar

`frontend/src/components/layout/sidebar.tsx`,
`frontend/src/components/noct/coming-soon-modal.tsx` (new)

- Removed: Live Score · How It Works · the entire Help section.
- Combi of the Day stays in the Voorspellingen group as a hard-locked
  stub. Click opens `<ComingSoonModal>` (`combo.comingSoonTitle/Body/
  developmentBadge` keys, already translated). Admins keep the live
  link.
- Final layout: **Overview** (Dashboard) → **Voorspellingen** (Pick
  of the Day · Combi of the Day · Voorspellingen) → **Resultaten**
  (Resultaten & Simulatie · Trackrecord) → **Systeem** (Beheer,
  admin-only).
- The `nav.live_score` / `nav.jouwRoute` i18n keys are now orphan in
  16 locale files but harmless — left in place.

### Deel 4 — Route deletions

The plan referenced `/(app)/how-it-works`. **That route does not
exist** — the sidebar's "Hoe het werkt" link pointed to the public
marketing page `/how-it-works`, which is also consumed by the footer,
site-nav, learn pages, league hubs, recognize-this card, blog
landing… 13 surfaces in total. Deleting the public page would
cascade-break the marketing site, so it stays. The sidebar removal in
Deel 1 already covers the spec's actual intent (no in-app entry point
for "Hoe het werkt").

`/live-score` route is left intact as a deep-link target per the
spec's own caveat ("route mag blijven bestaan voor diepe links").
The redirect to `/predictions?tab=live` was deliberately not added —
the predictions page already has a `viewMode` URL-state, but isn't
URL-synced; redirecting now would land users on the wrong tab. If a
URL-sync ever lands on `/predictions`, this redirect becomes free.

### Deel 2 — Dashboard

`frontend/src/app/(app)/dashboard/page.tsx`,
`frontend/src/components/dashboard/LiveMatchesStrip.tsx`,
`frontend/src/components/dashboard/WelcomeBanner.tsx` (deleted).

Top-down layout:

1. **Pick of the Day** prominent (`HeroBotdCompact`) for Gold/Platinum.
   Free/Silver get `UpgradeNudgeCard` instead — never both.
2. **Tier accuracy widget** (`SportsHubSidebar`) sticky in the right
   column on `xl`+ screens, falls under the main flow on narrow ones.
3. **Today's matches** (`TodayMatchesList`).
4. **Live Now** (`LiveMatchesStrip`) — only rendered when the page
   sees ≥1 truly-live match. Filter logic now matches between page
   and strip: `status === "live"` AND `kickoff <= now` AND
   `now - kickoff <= 120 min`. Anything past two hours is treated as
   a stale upstream flag and dropped.
5. **Yesterday's results** (`YesterdayResultsStrip` — already existed,
   wasn't wired). Pulls `getFixtureResults(2)`, trims client-side to
   the previous calendar day in the user's local timezone.
6. **Slim quick link** to Trackrecord. No second CTA card, no second
   upsell stack.

Removed: `WelcomeBanner` (3-step onboarding card), the persistent
"All systems operational" widget on the dashboard surface (it lives
in the sidebar footer only, per spec).

### Deel 3 — Predictions tabs

`frontend/src/app/(app)/predictions/page.tsx`.

- The Resultaten tab used to be a `<Link href="/results">` inside the
  three-tab header — clicking it bounced users out of the page,
  losing date/league/tier filter state. Replaced with a button that
  flips `viewMode="results"` like the other two tabs. The page
  already had the in-page rendering branch; it just wasn't reachable
  from the tab.
- Each row in the Resultaten tab now renders a `<PerTierScopeStrip>`
  beneath it: four chips (F · S · G · P) showing whether that match
  was within each tier's scope and, for finished matches, ✅ / ❌ for
  the pick. Out-of-scope chips dim and show ⊘. Cumulative tier model:
  a pick classified `gold` is in scope for free / silver / gold but
  not platinum. Tooltip on each chip says "tier — correct/incorrect/
  open/niet in scope".
- Live tab gains the same two-hour stale-live filter as the dashboard
  strip. Without it, predictions Live still showed matches the
  backend had wrongly stuck at `status=LIVE` long after FT.
- New i18n key `pred.advancedSimulationLink` for the soft "View
  advanced simulation →" link at the bottom of Resultaten — auto-
  translated to all 14 aux locales by the pre-commit hook.

### Deel 5 — Results & Simulation cross-link

Soft link at the bottom of the Resultaten tab → `/results` for power
users who want the ROI/simulation drill-down. The dedicated `/results`
page is otherwise unchanged.

### Deel 6 — Copy + jargon

`frontend/src/i18n/messages.ts`.

Targeted softening — the loudest "Brier score" labels users hit on
the trackrecord landing now read "Prediction quality" / "Calibration
score" (NL: "Voorspellingskwaliteit" / "Calibratiescore"). The full
FAQ explanations keep the term — that's where it belongs.

What was *not* changed and why:
- Tier names (Bronze/Silver/Gold/Platinum) — explicitly out-of-scope
  per the plan ("internationaal herkenbaar").
- The bulk of `Pick`/`Confidence`/`Final score` strings — most are
  branded ("Pick of the Day", "BOTD") or already translated. A
  blanket rewrite would touch 100+ keys and risk rotating tested
  copy. Out-of-scope for a UX restructure pass.
- `WelcomeBanner.*` i18n keys — orphan after the component delete,
  but cleaning them touches 16 locale files for zero functional gain.

### Tier badge consistency

`PickTierBadge` in `frontend/src/components/noct/pick-tier-badge.tsx`
is the established pattern and is used by every authenticated
surface that shows a tier (BOTD card, prediction rows, dashboard
sidebar, paywall lock states, sidebar lock items). The new
`PerTierScopeStrip` is the only new place that doesn't use
`PickTierBadge` — it uses the same colour scheme as
`YesterdayResultsStrip` (TIER_CHIP map) so the small four-letter
chips match an existing convention. No off-brand tier styling
introduced.

---

## Verification matrix (Gold tier)

End-to-end Gold-user flow walks must be re-run on the deployed env
since I can't bring up the backend from this sandbox. Type-check is
clean on every commit.

| Step | What to check | Status |
|------|---------------|--------|
| 1 | Sign in as Gold, land on `/dashboard` | manual ✋ |
| 2 | Dashboard shows POTD card, tier accuracy widget, today's matches, yesterday's results | manual ✋ |
| 3 | Live Now card hidden when no live, visible when ≥1 truly-live match | manual ✋ |
| 4 | `/predictions` Upcoming tab is default | code ✅ (`useState<ViewMode>("upcoming")`) |
| 5 | `/predictions` → Live tab → no stale-live rows past kickoff+2h | code ✅ (filter on line ~1280) |
| 6 | `/predictions` → Resultaten tab — per-tier ✅/❌ visible per row | code ✅ |
| 7 | Click Combi of the Day (non-admin) → Coming Soon modal opens, no nav | code ✅ |
| 8 | `/trackrecord` numbers match Resultaten tab numbers for the same window | manual ✋ |

### Data-consistency matrix (Gold tier accuracy on `live_measurement`)

These five surfaces must read the same number. Manual sweep on the
deployed env — values not asserted from this sandbox.

| Source | Endpoint / hook | Today | Last 7 days | Last 30 days |
|--------|-----------------|-------|-------------|--------------|
| Dashboard "Vandaag" sectie | `getFixturesToday` filtered to Gold tier | — | — | — |
| Predictions Resultaten tab + Gold filter + Vandaag | `getFixtureResults(7)` + tierFilter=gold | — | — | — |
| Trackrecord Gold tier breakdown | `getTrackrecordSummary({ pick_tier: "gold" })` | — | — | — |
| Results & Simulatie + filter Gold + live meting | `/results` UI live-measurement toggle | — | — | — |
| `/api/trackrecord/summary?tier=gold` | Direct API | — | — | — |

If any cell mismatches, the most likely culprit is a divergence
between `/fixtures/results?days=N` and `/api/trackrecord/summary`
on the inclusion of `batch_local_fill` rows — that's the bug
class the v8.1 dashboard fix hit (see commit `cf23773` in the
prior session). The current sweep just makes the discrepancy
visible at a glance.

---

## Resterende rough edges

1. **No URL-sync on `/predictions` viewMode.** Users can't bookmark
   the Live tab. If we want `?tab=live` someday, also add a redirect
   from `/live-score` → `/predictions?tab=live`.
2. **Orphan i18n keys.** `nav.live_score`, `nav.jouwRoute`,
   `welcomeBanner.*`. Harmless but technically dead.
3. **Per-tier strip semantics.** The strip shows scope inclusion +
   correctness, not separate per-tier confidences. The plan's
   example (`🥉 Free: Home (62%, odds 1.85)`) implied four
   independent picks per match, but the engine only ever produces
   one prediction per match — confidence is shared across tiers,
   it's the league set + threshold that gates inclusion. The strip
   reflects that data model honestly.
4. **`/(app)/how-it-works` does not exist.** The plan referenced it;
   the path was wrong. Sidebar removal in Deel 1 covers the actual
   intent. The public `/how-it-works` page stays.
5. **Live tab two-hour window is client-side only.** Backend
   `/fixtures/live` still returns any `status=LIVE` row regardless
   of age. A backend-side fix would be cleaner — leaving it for now
   because the spec said no engine changes.
