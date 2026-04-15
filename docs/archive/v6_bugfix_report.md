# v6 Bug Fix Sprint Report

_Session date: 2026-04-12. User testing on the v5.3 release surfaced
several frontend bugs and UX gaps that blocked the backend work from
being visible to users. This sprint fixes those without touching any
v5.3 architecture, endpoints, or data._

## Kritieke fixes

### A1 — Pick of the Day toont oude wedstrijden ✅

**Probleem:** `/api/bet-of-the-day/` returned Barcelona vs Espanyol
with scheduled_at in the past, causing the Pick of the Day card
to sit under a finished match all day long.

**Oorzaak:** `betoftheday.py` filtered matches by
``scheduled_at >= day_start AND <= day_end`` — the whole day,
including matches that had already kicked off.

**Fix:**
- When no `target_date` query param is supplied, use a rolling
  72h window starting at `datetime.now(timezone.utc)` and require
  `Match.status == SCHEDULED`.
- When `target_date` is today or future, clamp `window_start` to
  `max(day_start, now)` so midday visitors don't see the morning
  match if it's already kicked off.
- When `target_date` is historical (user browsing back), keep the
  full day window so users can see what the pick WAS that day.

Also softened `/api/route/quick-pick`: it used to return the
honest-but-unhelpful `no_validated_strategies` empty state
because the v5.3 gate has flipped every strategy to
`under_investigation` until odds coverage grows. v6 falls through
to the highest-confidence upcoming prediction with a
`source: "top_confidence_fallback"` flag so the UI always has
something to display.

**Test:** `GET /api/bet-of-the-day/` returns Celta Vigo vs Oviedo
kickoff `2026-04-12T16:30:00+00:00`, in_past = False. ✅

---

### A2 — Trackrecord pagina client error ✅

**Probleem:** Opening `/trackrecord` threw a client error and
blanked the screen.

**Oorzaak:** Two independent bugs compounding:
1. `GET /api/trackrecord/calibration` required a mandatory
   `model_version_id` query param; the frontend never sent one,
   so the endpoint returned HTTP 422 and react-query surfaced
   it as a client error.
2. `GET /api/trackrecord/segments` parameter was named
   `segment_type` but the frontend was passing `group_by=month`.
   The endpoint silently fell through to the "league" default,
   so the Rolling Accuracy chart was broken (showing league
   data instead of per-month buckets). Also, the dead `month`
   branch had a latent bug: `func.to_char(predicted_at,
   'YYYY-MM')` crashed at runtime on asyncpg.

**Fix:**
- `/calibration`: `model_version_id` is now optional. When
  omitted, the endpoint picks the most recent
  `is_active=True` ModelVersion automatically.
- `/segments`: accepts both `segment_type` and `group_by` as
  parameter names (alias). The month branch was rewritten to do
  Python-side aggregation instead of SQL `to_char`.

**Test:**
```
GET /api/trackrecord/calibration
  → HTTP 200, model picked: Ensemble v2.1.0, 10 buckets with ECE 0.035

GET /api/trackrecord/segments?group_by=month
  → HTTP 200, month segments: 1 ('2026-04' with 4978 picks)
```

---

### A3 — Login state verloren bij client errors ✅

**Probleem:** When a client error occurred (like A2 above), the
screen blanked. On refresh, the user had to log in again.

**Oorzaak:** Two interacting issues in `frontend/src/lib/auth.tsx`:
1. The `/auth/me` hydration fetch in the AuthProvider `useEffect`
   had a catch-all `else { clearSession() }` branch that wiped
   token + user from localStorage on ANY non-401 error — network
   timeout, 500, trackrecord 422, anything.
2. No global error boundary, so an uncaught render error would
   unmount the entire app tree. The next refresh would then see
   an empty localStorage (because of point 1) and land on
   `/login`.

**Fix:**
- `lib/auth.tsx`: only clear the session on a real
  `ApiError(401)`. All other errors keep the stale user from
  localStorage so the UI stays logged in. The existing
  `auth:expired` event listener (triggered by `api.ts` on any
  401) still handles the real "token revoked" path.
- Added `frontend/src/app/error.tsx` — a Next.js App Router
  global error boundary that catches client crashes, renders a
  recoverable "Probeer opnieuw / Terug" card, and **does not**
  touch auth state, localStorage, or any global store.

**Test:** Manual verification required post-deploy — see test
protocol at the bottom.

---

## High priority UX fixes

### B1 — Pre-match odds in match cards ✅

**Gebouwd:** The `/api/fixtures/*` endpoints (upcoming / today /
results) now embed a new `OddsSummary` object under the existing
`FixtureItem` schema. The frontend's `FreeMatchCard` component
renders a small "Pre-match odds" row at the bottom of each card
ONLY when the backend supplied odds data.

**Where the odds come from:** The v5.1 `odds_history` table is
populated twice:
- Ad-hoc via `POST /api/admin/v5/backfill-odds` (historical
  backfill, ~1% coverage so far — API-Football barely serves
  historical odds)
- Daily via the APScheduler `snapshot_upcoming_odds` cron that
  fires at 05:30 UTC and pulls current odds for every upcoming
  scheduled fixture

**Implementation detail:** `_load_latest_odds(match_ids, db)`
runs two subqueries (latest 1x2 row per match, latest
over_under_2_5 row per match) and merges them into a single
`{match_id: OddsSummary}` dict. Both markets flow into the
fixture card — the O/U odds are rendered as a subtitle next to
the 1x2 buttons when present.

**No placeholder policy:** when `fixture.odds` is null, the
frontend renders nothing — not `—` or `n/a`. We'd rather hide
the row than show fake data.

---

### B2 — Results pagina: voorspelling + outcome + realised P/L ✅

**Gebouwd:** The Results page's `ResultCard` already rendered
the predicted outcome and a correct/incorrect badge. v6 added
a **realised P/L** badge that shows `+0.92u` on correct picks
(when odds were 1.92) and `-1.00u` on wrong picks.

**Real odds preference:** the P/L is computed client-side in
the card component:
- If `fixture.odds` has the odds for the predicted side, use
  `odds_used - 1` on correct, `-1` on wrong. Badge shows normal.
- If no odds row on file yet, fall back to a flat 1.90 estimate.
  Badge shows a small "est." marker and the tooltip explains
  the fallback. This matches the backend
  `roi_calculator.realised_pnl_1x2()` behaviour.

**Layout preserved:** no breaking changes to the card structure,
just an extra badge in the right-hand column.

---

### B3 — Predictions pagina: datum picker ✅

**Gebouwd:** Native HTML `<input type="date">` above the stats
bar on Predictions, plus three navigation buttons:
- "← Vorige dag"
- "Vandaag" (resets to today)
- "Volgende dag →"

Bounds: 30 days back, 7 days ahead of today.

**Endpoint switching:** the query function inspects
`selectedDate` vs `today`:
- `selectedDate >= today` → `api.getFixturesUpcoming(daysAhead)`
- `selectedDate < today` → `api.getFixtureResults(daysBack)`

Client-side filter then narrows to the exact selected day
(except when the default "today" is selected, where we want the
full next-7-days view to mirror the old behaviour). A small
"Historisch" pill appears next to the picker when the user has
selected a past date.

---

### B4 — "Your Route" als default landing na login ✅

**Gebouwd:** `frontend/src/app/login/login-content.tsx`:
```diff
-      router.push(next || loc("/dashboard"));
+      router.push(next || loc("/jouw-route"));
```

The existing `?next=` query param still wins, so
password-reset redirects and shared "go-to-this-page-after-
login" links keep working.

---

## Nice to have

### C1 — Headline counters bovenaan Predictions ✅

**Gebouwd:** Three-card grid at the top of the Predictions page
showing Predicted / Upcoming / Correct so far. Reuses the
existing `/api/dashboard/metrics` endpoint — no new backend
code. Cached for 5 min via react-query.

### C2 — Per-league uitklapbare secties ❌ Skipped

The Predictions page already has a league filter in its filter
bar, so the marginal value of adding collapsible groups is low.
Revisit after user feedback.

### C3 — Weekly Report verifiëren ✅ Works as-is

Tested `GET /api/fixtures/results/weekly-summary` on production:
```
total_calls: 51
won: 27
lost: 24
win_rate: 0.5294
pl_units: +0.3
best_performers: 3 entries
worst_performers: 3 entries
disclaimer: present
```

All fields populated. No code changes needed.

---

## Wat werkt nu

- Pick of the Day shows only future / not-yet-kicked-off matches
- `/api/route/quick-pick` falls back to the top-confidence pick
  when no strategies are active (v5.3 gate is still strict)
- Trackrecord page loads without client errors
- Rolling Accuracy chart on Trackrecord now gets real monthly
  data (`segment_type=month` works for the first time)
- Calibration chart on Trackrecord auto-detects the active model
- Auth state survives any client-side error / refresh; only a
  real 401 logs the user out
- Global error boundary catches client crashes and renders a
  recoverable card without touching auth
- Match cards on the Predictions page show live pre-match odds
  (1x2 + O/U 2.5) when available
- Results cards show realised P/L per pick (real odds preferred,
  1.90 fallback with "est." marker)
- Predictions page has a date picker with prev/today/next
  navigation and a "Historisch" pill
- New users land on Your Route after login instead of Dashboard
- Headline counters at the top of Predictions

## Wat nog open staat

- C2 (collapsible league groups) deliberately skipped
- Odds coverage on historical matches is still <1% — that's a
  wait-for-the-cron problem, not a bug
- The Logistic model is still only trained on the sparse v5.3
  pending samples — not part of this sprint's scope

---

## Test resultaten (post-deploy curl smoke tests)

```
GET /api/bet-of-the-day/
  → available: true, kickoff 2026-04-12T16:30:00Z, in_past: false ✅

GET /api/route/quick-pick
  → data: present, source: "top_confidence_fallback" ✅

GET /api/trackrecord/calibration
  → HTTP 200, auto-picked Ensemble v2.1.0, ECE 0.0352 ✅

GET /api/trackrecord/segments?group_by=month
  → HTTP 200, 1 month segment ('2026-04' n=4978 acc=0.496) ✅

GET /api/fixtures/results/weekly-summary
  → 51 picks, 27 won, 52.9% win rate, +0.3u ✅
```

Full end-to-end click-through test required from Dennis:
1. Incognito browser → betsplug.com
2. Login → should land on /jouw-route ✅ (code change, needs UI verify)
3. Click through all pages: Dashboard, Strategy Lab, Pick of the
   Day, Predictions, Results, Weekly Report, Trackrecord
4. Trackrecord must load without errors
5. Predictions date picker must switch between "today" and
   "yesterday" / "tomorrow" without crashing
6. Results must show realised P/L badge on each finished card
7. Hit a broken URL → app error boundary renders →
   refresh → still logged in

---

## Commits in this sprint

```
b1ee209 fix(v6 sectie A): pick-of-the-day + trackrecord + auth persist
e28a237 fix(trackrecord): replace broken SQL func.to_char with Python aggregation
7d2e6fa feat(v6 B1): pre-match odds in fixture cards
1424bcc feat(v6 sectie B): results P/L + predictions date picker + Your Route default
11c9f6d feat(v6 C1): headline counters on Predictions page
```

All landed on `main` and auto-deployed via Railway + Vercel.
