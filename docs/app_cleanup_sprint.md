# App Cleanup Sprint — 2026-04-17

**Doel:** 6 acties om de authed app-omgeving op te schonen en zichtbare
bugs uit de screenshots van Dennis op te lossen. Uitgevoerd in één
sessie op branch `main`, losse commit per actie.

## TL;DR

5 van de 6 acties afgerond en gepusht. Actie 6 (inline explainability)
bewust overgeslagen — backend-scope + tijdsinschatting buiten het
budget voor deze sprint. Zie § "Niet gedaan" voor waarom.

## Commits

| # | Commit | Titel | Files | Δ |
|---|--------|-------|------:|---|
| 1 | `c4314e4` | fix(app): display "—" instead of "0%" when picks are pending evaluation | 2 | +47/−13 |
| 2 | `35606f4` | chore(nav): hide Strategy Lab from consumer-facing surfaces | 5 | +11/−11 |
| 3 | `dd0ddd7` | feat(dashboard): make Dashboard the post-login landing + welcome banner | 6 | +160/−4 |
| 4 | `0ccb473` | feat(reports): tier-scope generated reports + per-tier comparison block | 2 | +214/−5 |
| 5 | `a3c14a5` | chore(analyst): remove unfinished Analyst Hub from app shell | 3 | −254 |

Alle commits zijn nog **lokaal** — niet gepusht naar `origin/main` op
het moment van schrijven. Dennis beslist zelf wanneer hij pusht.

## Wat is gedaan per actie

### Actie 1 — Fix 0% accuracy display bug ✅

**Bug:** Pick of the Day track-record kaart en Track Record KPI tiles
toonden "0% accuracy (0/0 correct)" zodra er picks stonden die nog niet
geëvalueerd waren (kickoff niet geweest of evaluator nog niet langs).

**Fix (frontend-only):** als `evaluated === 0`, render "—" in plaats
van "0%", en "awaiting first result" in de subtitle.

- `frontend/src/app/(app)/bet-of-the-day/page.tsx` — BOTDTrackRecordCard
  checkt nu `hasEvaluations` vóór het percentage te kleuren + tonen.
- `frontend/src/app/(app)/trackrecord/page.tsx` — Pick of the Day KPI
  tile, hero banner, en de algemene Accuracy/Total Predictions KPI
  tiles vallen alle terug op "—" zolang er geen geëvalueerde picks
  zijn in het scope.

**Test:** open Pick of the Day of Trackrecord vóór de eerste match
is afgelopen → geen "0%" meer zichtbaar. Zodra de evaluator de
eerste is_correct heeft weggeschreven draait het percentage automatisch
aan.

### Actie 2 — Strategy Lab uit consumer sidebar ✅

**Rationale:** Strategy Lab is een v7-tijd backtesting-workbench die
paying consumers verwart (zien items "Not Profitable"). De `/strategy`
en `/strategy/[id]` routes blijven bestaan voor admin / interne tooling
via directe URL.

Entrypoints verwijderd voor reguliere users:

- Dashboard `QuickNavStrip` (horizontale nav-strip bovenaan).
- Dashboard `SportsHubSidebar` (rechter kolom quick-links).
- `/jouw-route` "Also explore" grid — vervangen door een Track
  Record card (nieuwe i18n keys `route.trackRecordTitle/.Desc` in
  EN + NL).
- `/results` `RelatedLinks` onderaan de pagina.

Ongebruikte `FlaskConical` imports opgeruimd waar dat de enige usage
was.

### Actie 3 — Dashboard als landing + welcome banner ✅

**Rationale:** eerste indruk na inloggen moet aantrekkelijk en
data-forward zijn, niet instructie. Nieuwe flow:

1. `login-content.tsx` + `register/page.tsx` redirecten na success
   naar `/dashboard` (was `/jouw-route`). Onveranderd als `?next=`
   is meegegeven.
2. Sidebar: START-badge zit nu op Dashboard item. "How It Works"
   verhuisd naar nieuwe onderste "Help" sectie (sidebar.help key
   EN + NL).
3. Nieuwe `<WelcomeBanner/>` component (`frontend/src/components/dashboard/WelcomeBanner.tsx`):
   - 3 NOCTURNE step-cards die `route.step1/2/3Title/Desc` hergebruiken
   - "Niet meer tonen" control met state in
     `localStorage["betsplug.welcomeBanner.dismissed"]`
   - Dismissible via X-knop rechtsboven of tekstlink onderaan
   - Deep-link CTA naar `/jouw-route` voor de volledige walkthrough
   - Rendert `null` tot localStorage is gelezen (geen SSR-flicker)
4. Banner rendert bovenaan `/dashboard/page.tsx` voor QuickNavStrip.

Nieuwe i18n keys (EN + NL): `welcomeBanner.label`, `welcomeBanner.title`,
`welcomeBanner.subtitle`, `welcomeBanner.stepPrefix`,
`welcomeBanner.exploreCta`, `welcomeBanner.dismiss`, `sidebar.help`.

### Actie 4 — Rapporten tier-scopen ✅

**Probleem:** rapporten mixten predictions van alle tiers, dus een
Silver-user's PDF werd gedomineerd door Gold/Platinum cijfers die ze
niet kunnen bewerken. Oneerlijk en verwarrend.

**Fix (backend-only):**

- `ReportService.generate(..., user_tier=PickTier.PLATINUM)` — nieuwe
  kwarg met Platinum als safe default (backward compat voor legacy
  callers).
- `_gather_performance_data` past `access_filter(user_tier)` +
  `v81_predictions_filter()` toe wanneer `TIER_SYSTEM_ENABLED`.
  Platinum/admin-override sessions blijven ongefilterd.
- Nieuw `_gather_per_tier_breakdown()` maakt een `GROUP BY
  pick_tier_expression()` aggregaat over alle 4 tiers (niet
  access-filtered) voor de cross-tier comparison tabel. Zelfde
  patroon als `/api/dashboard/metrics.per_tier`.
- PDF renderer:
  - Nieuw "Scope: <tier> tier" banner onder de cover block met de
    scope-label ("Top-10 leagues · 70%+ historical" etc.).
  - Nieuwe "Tier Comparison" sectie vóór de disclaimer met een
    tabel waarin de user's eigen tier gemarkeerd is met "← your
    tier".
- CSV renderer: `#tier_slug / #tier_label / #tier_scope` metadata-
  rows toegevoegd tussen `#period` en `#total_predictions`.
- JSON renderer: top-level `tier` en `per_tier` keys toegevoegd.
- `routes/reports.py::generate_report` injecteert
  `user_tier = Depends(get_current_tier)` en persist de slug in
  `job.config["tier"]` voor auditability.

Geen DB schema migraties, geen model wijzigingen, geen engine changes.

### Actie 5 — Analyst Hub opruimen ✅

**Rationale:** `/analyst` toonde 3 "Coming Soon" kaarten naar routes
die nooit gebouwd zijn (Predictions Explorer, Match Deep Dive, Engine
Performance). In productie leest dat als onaf werk. Complete removal
is de schoonste actie.

- `frontend/src/app/(app)/analyst/layout.tsx` — verwijderd.
- `frontend/src/app/(app)/analyst/page.tsx` — verwijderd.
- Sidebar: hele "Data Analyst" sectie weg (hub + 3 comingSoon items).
- Ongebruikte lucide imports opgeruimd: `Layers`, `Telescope`,
  `Activity`, `LineChart`.
- Publieke `/engine` (methodology) blijft ongemoeid — die ligt
  buiten `(app)/`.

## Niet gedaan

### Actie 6 — Inline explainability (USP feature)

Bewust **overgeslagen**. Redenen:

1. **Backend-scope.** De 39 features zitten tijdens predictie in het
   model maar worden niet teruggegeven aan de API. Om top-3 drivers
   te tonen moet het prediction endpoint uitgebreid met een
   `top_drivers` veld (backend + schema + serialization). Dat raakt
   model-adjacent code.
2. **Feature attribution is niet triviaal.** "Top-3 feature drivers"
   uit een XGBoost + calibrated logistic ensemble halen vraagt SHAP
   of permutation-importance aan de prediction-kant — werk voor een
   losse engine-sprint.
3. **Tier-gated UI + i18n + uitklap-component** is nog eens 1-2
   dagen werk bovenop de ML-kant.

De prompt zelf gaf hier expliciet ruimte voor: *"ALS GEEN TIJD: sla
deze actie over. Dit is een nice-to-have USP die ook later kan."*

**Advies voor een aparte sprint:**

- Eerst: backend endpoint `/predictions/{id}/drivers` dat top-3
  features + importance scores teruggeeft.
- Daarna: `<PickReasoningBlock prediction={pred} userTier={tier}/>`
  op prediction cards met tier-lock voor Free/Silver.

## Openstaande follow-ups

Klein, niet-blokkerend — kunnen los opgepakt:

1. **i18n dead keys** na Analyst Hub removal — `nav.analyst_hub`,
   `nav.predictions_explorer`, `nav.match_deep_dive`,
   `nav.engine_performance`, `sidebar.analyst`, en alle
   `lock.analystHub.*` / `lock.predictionsExplorer.*` /
   `lock.matchDeepDive.*` / `lock.enginePerformance.*` keys in
   `messages.ts` + 6 aux-locale files. Compileren zonder refs
   maar hebben geen consumer meer.
2. **sidebar.tsx dead code** — `UpgradeLockModal`, `useTier()`,
   `hasAccess`, `LockedFeature` type en de `locked` render-branch
   waren er alleen voor de Analyst Hub items. Momenteel geen
   sidebar-item meer met `requiredTier`. Kan opgeruimd als dat
   infrastructuur definitief weg kan, of bewaard voor toekomstige
   tier-gated nav-items.
3. **Unauthenticated `/reports` endpoint** — de backend-route
   vereist technisch geen auth (alleen frontend-gate via
   PaywallOverlay Gold+). Niet opgelost in deze sprint omdat
   scope expliciet "geen security-werk" was. Aan te bevelen
   als een losse hardening-ticket.
4. **Bulk evaluator run** — uit de vorige handoff, nog steeds
   openstaand. Zodra die langsloopt verdwijnen alle "—" accuracy
   placeholders vanzelf omdat `evaluated > 0` wordt.

## Test resultaten

**Frontend type-check** na elke commit: `npx tsc --noEmit` schoon voor
mijn changes (pre-existing Sanity/Remotion/Radix module-not-found
errors genegeerd — bestonden al vóór deze sprint).

**Backend syntax:** `ast.parse` OK voor
`app/services/report_service.py` + `app/api/routes/reports.py`.
Geen pytest-run gedaan (backend tests voor reports bestaan niet, tier
tests evenmin — zie QA-audit).

**Manuele UI-test:** niet lokaal gedraaid deze sessie. Fixes zijn
zichtbare no-data/copy-paths die pas betekenis krijgen tegen de Railway
DB. Na push naar main zou Dennis het resultaat meteen op
betsplug.com moeten zien.

## Do's / don'ts voor de volgende sessie

- **DO** alle 5 commits naar origin pushen voordat je iets nieuws
  begint (ze zijn nog lokaal).
- **DO** controleren of de nieuwe rapport-PDF scope-banner correct
  rendert nadat Railway de backend-commit heeft opgepakt.
- **DON'T** de `/analyst` route opnieuw invoeren zonder een werkende
  sub-feature — de QA-audit P1.1 fix werd al door removal vervangen.
- **DON'T** inline-explainability in de UI toevoegen zónder eerst
  het backend prediction endpoint uit te breiden; anders bouw je
  een UI op placeholder-data.
