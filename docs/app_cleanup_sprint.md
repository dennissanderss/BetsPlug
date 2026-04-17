# App Cleanup Sprint — 2026-04-17

**Doel:** 6 acties om de authed app-omgeving op te schonen en zichtbare
bugs uit de screenshots van Dennis op te lossen. Uitgevoerd in één
sessie op branch `main`, losse commit per actie.

## TL;DR

Alle 6 acties + eindrapport afgerond in één sessie. Commits staan
lokaal op `main` — nog niet gepusht naar `origin/main`. Dennis beslist
wanneer.

## Commits

| # | Commit | Titel | Files | Δ |
|---|--------|-------|------:|---|
| 1 | `c4314e4` | fix(app): display "—" instead of "0%" when picks are pending evaluation | 2 | +47/−13 |
| 2 | `35606f4` | chore(nav): hide Strategy Lab from consumer-facing surfaces | 5 | +11/−11 |
| 3 | `dd0ddd7` | feat(dashboard): make Dashboard the post-login landing + welcome banner | 6 | +160/−4 |
| 4 | `0ccb473` | feat(reports): tier-scope generated reports + per-tier comparison block | 2 | +214/−5 |
| 5 | `a3c14a5` | chore(analyst): remove unfinished Analyst Hub from app shell | 3 | −254 |
| 6 | `cadd920` | docs(sprint): initial sprint report (acties 1-5) | 1 | +220 |
| 7 | `190fc1a` | feat(explain): inline "Why this pick?" block on prediction cards (v8.2) | 12 | +505/−4 |

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

### Actie 6 — Inline explainability ✅

**Rationale:** users hebben nu geen idee waarom de AI een bepaalde
pick maakt. Transparantie/explainability is een echte USP die
concurrenten niet bieden.

**Aanpak zonder ML-werk:** de 39 features worden al opgeslagen in
`Prediction.features_snapshot` (JSONB column, elke v8.1 rij). In
plaats van SHAP/permutation importance bij elke request te draaien,
gebruikt de nieuwe `pick_drivers` service een hand-gekozen set van
8 candidaat-features met hard-coded priors (mean/std) en ranked top-3
op abs z-score. Deterministisch, geen model-call, geen scaler-unpickle.

**Backend:**

- `backend/app/services/pick_drivers.py` (new) — 8 kandidaat-features
  (elo_diff, form_diff, venue_form_diff, h2h_home_wr, gd_diff,
  h_cs_pct, a_cs_pct, h_home_wr) met label/mean/std/formatter/direction
  metadata. `compute_top_drivers(features_snapshot)` geeft max N
  entries terug, of `None` als snapshot mist.
- `backend/app/schemas/prediction.py` — nieuwe `PredictionDriver`
  sub-model + optional `top_drivers` list op `PredictionResponse`.
- 4 endpoints geven `top_drivers` terug:
  - `routes/predictions.py` list + single-prediction
  - `routes/matches.py` (via lokale helper)
  - `routes/fixtures.py` via `PredictionSummary` — zodat elke
    fixture-call het meestuurt en /predictions list view het ziet.
  - `routes/betoftheday.py` via nieuw inline `BOTDDriver` sub-model.

**Frontend:**

- `frontend/src/components/predictions/PickReasoningBlock.tsx` (new)
  NOCTURNE-gestijlde collapsible card. `useTier()` gated:
  Gold+ zien "Why this pick?" met drie gekleurde driver rows
  (groen/rood/slate dot per direction), Free/Silver zien een
  Lock-icon teaser met "Upgrade" CTA naar `/pricing`. Returns `null`
  als er geen drivers zijn OF zolang tier hydrateert (geen flicker).
- `frontend/src/types/api.ts` — `PredictionDriver` type + `top_drivers`
  op `Prediction`, `BetOfTheDayResponse` en `FixturePrediction`.
- Gerenderd op 3 plekken:
  - `/bet-of-the-day` — wide variant, open by default.
  - `/predictions` list (via `FreeMatchCard` in `match-cards.tsx`) —
    compact variant onder de confidence score.
  - `/matches/[id]` detail page — wide variant boven de
    sub-model `FactorsBlock`.
- i18n (EN + NL): `reasoning.kicker`, `.title`, `.footnote`,
  `.lockedKicker`, `.lockedTitle`, `.lockedBody`, `.lockedCta`.

**Belangrijk:** geen DB migratie, geen wijziging aan forecasting
pipeline, geen model/scaler aanraking. Alles draait op de reeds
opgeslagen `features_snapshot` JSONB en presentation-layer code.

**Beperking:** de 8 kandidaat-features zijn met de hand gekozen op
interpreteerbaarheid (wat leest de user makkelijk?), niet op model
importance. Voor "wat trok de XGBoost het zwaarst" zou een echte
SHAP-aftakking nodig zijn — losse sprint.

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
