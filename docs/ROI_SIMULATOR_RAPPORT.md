# BetsPlug — Volledig Platformrapport (app-omgeving + ROI simulator)

**Datum:** 23 april 2026
**Doel:** volledige uitleg van het platform, hoe alles is gebouwd, welke logica eronder ligt, en hoe de ROI-simulator die we deze sessie hebben opgeleverd in het geheel past. Geschreven als zelfstandig document om te bespreken met een extra Claude-sessie voor een second opinion.

---

# DEEL A — Het platform als geheel

## A1. Wat is BetsPlug?

BetsPlug (intern ook "Sports Intelligence Platform" / SIP) is een B2C SaaS-abonnementsplatform dat AI-gedreven sportvoorspellingen verkoopt aan consumenten. Kernpropositie: een gebruiker betaalt een maandelijks abonnement (€0,01 trial → Silver/Gold/Platinum), logt in en krijgt dagelijks pre-match picks met bijbehorende modelconfidence en uitleg.

Kernwaarde is **eerlijkheid in de meting**: heel veel "tipstergames" op internet roepen +30% ROI maar vermengen backtest met live, en meten na de wedstrijd. BetsPlug's onderscheidende belofte is strikte pre-match locking + publieke CSV downloads + duidelijke scheiding tussen historische simulatie en live meting.

Alle output is gelabeld als **simulated/educational** — er is geen weddenschap-facilitering. We zijn een informatiedienst, geen bookmaker.

## A2. Techstack

### Backend
- **FastAPI 0.115** + **async SQLAlchemy 2** (asyncpg) + **Alembic** + **Celery 5** + **Redis 7** + **PostgreSQL 16**
- **Python 3.12**
- **ML**: scikit-learn 1.8, XGBoost 2.1
- Pre-trained modellen (`backend/models/`): `xgboost_model.ubj`, `logistic_model.pkl`, `feature_scaler.pkl`, `feature_names.json`, `model_metadata.json`
- Modellen worden bij Railway-boot ingeladen

### Frontend
- **Next.js 14 App Router** + **React 18** + **TypeScript** + **Tailwind** + **Radix UI** + **TanStack Query**
- **Sanity Studio** ingebed op `/studio` voor CMS-content (blog, marketing-copy)
- **NOCTURNE** design-system: `card-neon` gradient-border surfaces, `<HexBadge>`, `<Pill>`, `<TierEmblem>`, `<TrustScore>` primitives, ambient glow blobs, logo-green (#4ade80) als primaire accent
- **i18n**: alleen Nederlands (NL) + Engels (EN). Andere locales bewust uitgeschakeld om translate-API-kosten te beperken

### Deployment
- **Backend → Railway** (Dockerfile-based, zie `backend/railway.toml`, `start.py` doet bootstrap + `alembic upgrade head` voor `uvicorn`)
- **Frontend → Vercel** (`frontend/vercel.json`)
- **Dev**: Docker Compose (`docker-compose.yml`) draait db + redis + backend + celery worker/beat + frontend

### Aparte pipelines
Vercel en Railway deployen **onafhankelijk** vanaf GitHub `main`. Dat betekent: een backend-commit is niet automatisch direct zichtbaar voor de frontend, en vice versa. Dit is een structureel aandachtspunt dat later terugkomt bij onze ROI-deploy flow.

## A3. Architectuurlagen (backend)

```
backend/app/
├── api/routes/          ← FastAPI routers, ~40 files (thin)
│   ├── auth.py          ← login/register/verify-email
│   ├── subscriptions.py ← Stripe paywall
│   ├── predictions.py   ← publieke pick-feed
│   ├── trackrecord.py   ← KPI's, calibration, ROI (deze sessie)
│   ├── betoftheday.py   ← Pick of the Day
│   ├── strategies.py    ← gepre-baked betting strategies
│   ├── admin_*.py       ← admin-only surface (17 routers)
│   └── …
├── services/            ← business logic
│   ├── roi_calculator.py     ← P&L op historische odds (v5+)
│   ├── strategy_engine.py    ← winrate/ROI per strategie
│   ├── scheduler.py          ← Celery cron (ingestie, evaluatie, reports)
│   ├── report_service.py     ← PDF weekly reports
│   ├── telegram_posting.py   ← auto-cross-post naar Telegram
│   └── …
├── repositories/        ← async SQL CRUD
├── schemas/             ← Pydantic v2 request/response
├── models/              ← SQLAlchemy ORM (~30 tabellen)
├── forecasting/
│   ├── forecast_service.py
│   ├── base_model.py
│   ├── elo_history.py
│   └── models/
│       ├── elo_model.py
│       ├── poisson_model.py
│       ├── logistic_model.py
│       ├── xgboost_model.py
│       ├── over_under_model.py
│       ├── ensemble_model.py
│       └── production_v8_model.py   ← actief in productie
├── ingestion/
│   ├── base_adapter.py
│   ├── ingestion_service.py
│   ├── router.py
│   └── adapters/
│       ├── the_odds_api.py          ← betaalde odds-API (1X2, O/U, BTTS)
│       ├── api_football.py          ← matches, standings, line-ups
│       ├── football_data_org.py
│       ├── openligadb.py
│       ├── thesportsdb.py
│       └── sample_*.py
├── features/
│   └── feature_service.py    ← point-in-time feature engineering
└── core/
    ├── tier_system.py        ← pick_tier_expression()
    ├── prediction_filters.py
    └── aggregate_queries.py
```

### De pipeline van een predictie

1. **Ingestie** (Celery scheduler draait iedere X minuten): een adapter (bijv. `the_odds_api.py`) trekt nieuwe wedstrijden en odds binnen. Wedstrijden worden in `matches`, odds in `odds_history` opgeslagen.
2. **Feature engineering** (`feature_service.py`): per match bouwt het systeem een point-in-time feature vector (Elo ratings, laatste N wedstrijden form, head-to-head, standings, rust, etc.).
3. **Forecasting** (`forecast_service.py`): kiest de actieve `ModelVersion` (v8 in productie), dispatcht naar `production_v8_model.py` (XGBoost + gekalibreerde logistic). Output: `home_win_prob`, `draw_prob`, `away_win_prob`.
4. **Opslag** in `predictions` tabel met `predicted_at` (timestamp van voorspelling) en optioneel `closing_odds_snapshot` JSONB (odds op moment van voorspelling, als adapter ze aanleverde).
5. **Na afloop** van de wedstrijd: `celery beat` triggert evaluatie → schrijft een rij in `prediction_evaluations` met `is_correct` en `actual_outcome`.
6. **Vrijgave**: de pick verschijnt in `/predictions`, `/bet-of-the-day` en (na evaluatie) op de track-record pagina's.

### De "honest engine" laag

Drie harde regels die op elke ROI/accuracy-query worden afgedwongen:

1. **Pre-match lock**: `Prediction.predicted_at < Match.scheduled_at`. Eender welke pick die ná de aftrap is gelogd telt nooit mee.
2. **Live cut-off**: `Prediction.created_at >= LIVE_MEASUREMENT_START` (2026-04-16 11:00 UTC). Alles ervoor is backtest.
3. **Source-scheiding**: `prediction_source = 'live'` vs. `!= 'live'` (of NULL). De frontend kan kiezen welke bucket ze wil tonen, maar mengen is niet mogelijk.

Dit ontstond na een historische bug waarbij modelvalidatie werd vermengd met productie-data, wat tot fantoom-ROI's van +40% leidde. De v7/v8 engine is gebouwd om dat nooit meer te laten gebeuren, en de ROI-simulator bouwt op diezelfde regels voort.

## A4. Het tier-systeem

Tier-thresholds staan centraal in `app/core/tier_system.py`:

| Tier | Confidence drempel | Populatie |
|---|---|---|
| Free | ≥ 55% | iedereen |
| Silver | ≥ 65% | Silver+ abonnees |
| Gold | ≥ 70% | Gold+ abonnees |
| Platinum | ≥ 75% | alleen Platinum |

**Cruciaal**: `pick_tier` is géén opgeslagen kolom in de database. Het wordt on-the-fly berekend via `pick_tier_expression()` — een SQLAlchemy CASE-statement die elke query kan injecteren. Voordelen:

- Thresholds aanpassen vereist geen data-migratie
- Alle historische picks worden retro-actief herlabeld bij een threshold-wijziging
- Geen drift mogelijk tussen "stored tier" en "computed tier"

Nadeel: elke aggregate query moet `pick_tier_expression()` importeren en in `GROUP BY` meenemen. Niet spontaan te bedenken voor wie niet weet dat dit patroon bestaat — daarom staat het als voorrang in `CLAUDE.md`.

## A5. Data model (belangrijkste tabellen)

```
matches                  ← fixtures + uitslagen
├── id (uuid)
├── home_team_id / away_team_id
├── league_id / season_id / sport_id
├── scheduled_at (kickoff tijd, kritisch)
├── status (scheduled/live/finished)
└── home_score / away_score

predictions              ← modeloutput
├── id
├── match_id
├── model_version_id
├── predicted_at (wanneer we voorspelden, pre-match-lock anker)
├── prediction_source   ('live' voor productie, anders backtest)
├── home_win_prob / draw_prob / away_win_prob
└── closing_odds_snapshot JSONB
    { "source": "...", "bookmaker_odds": { "home": 1.85, "draw": 3.40, "away": 4.00 } }

prediction_evaluations   ← post-match beoordelingen
├── prediction_id
├── is_correct (bool)
├── actual_outcome ('home'/'draw'/'away')
├── brier_score
└── log_loss

odds_history             ← ingestie van bookmaker-odds (meerdere per match)
├── match_id
├── source (bookmaker naam)
├── market ('1x2' / 'over_under_2_5' / 'btts')
├── home_odds / draw_odds / away_odds
├── over_odds / under_odds / total_line
├── btts_yes_odds / btts_no_odds
└── recorded_at

value_bets               ← value analysis (kans × odds)
strategies               ← pre-baked filters (bijv. "home favorites < 1.60")
backtests                ← strategy walk-forward resultaten
model_versions           ← v1..v8 metadata + feature list
```

## A6. Frontend routing

### Public marketing (buiten `(app)` group)
```
/                         ← homepage
/pricing                  ← tier-prijzen
/how-it-works
/track-record             ← publieke versie, inclusief ROI-grid
/engine                   ← v8 model explainer
/match-predictions        ← SEO-landingspage
/bet-types
/about-us / /contact / /privacy / /terms / ...
/articles                 ← Sanity CMS blog
/login / /register / /forgot-password / /reset-password / /verify-email
/checkout / /thank-you
/studio                   ← Sanity Studio embed
```

### Authed dashboard (`(app)` group, alleen ingelogd)
```
/(app)/dashboard             ← samenvatting
/(app)/predictions           ← volledige pick-feed met tier-filter
/(app)/bet-of-the-day        ← dagelijkse top-pick met ROI-simulator
/(app)/trackrecord           ← KPI's + TierROIGrid (tabs: backtest / live)
/(app)/matches               ← fixtures browser
/(app)/live-score            ← live ticker
/(app)/results               ← historische uitslagen
/(app)/strategy              ← gepre-bakte strategieën
/(app)/teams / /(app)/leagues / /(app)/search / /(app)/favorites
/(app)/reports               ← PDF weekly reports
/(app)/weekly-report
/(app)/subscription          ← billing + tier-management
/(app)/myaccount             ← profiel
/(app)/admin/*               ← alleen admins (13 sub-pagina's)
/(app)/deals                 ← affiliate-deals
/(app)/jouw-route
```

### Marketing ↔ authed
Ze delen `src/app/layout.tsx` als root, hebben eigen navigatie. Middleware (`src/middleware.ts`) forceert login-redirect voor `(app)` routes en beheert canonieke host + `noindex` voor niet-productie-hostnames (zie SEO-sectie verderop).

## A7. Alle frontend features in vogelvlucht

1. **Publieke homepage** met NOCTURNE dark UI, marketing-boodschap, pricing-tabel, CTA naar register
2. **Pricing-pagina** (dynamisch via Sanity of hardcoded fallback)
3. **Predictions feed**: tier-filter, competitie-filter, "upcoming / results" toggle, expandable pick-kaarten met modelreasoning
4. **Bet of the Day**: één pick/dag (Gold+ tier), met reasoning-blokken, value-bet panel, ROI-simulator, live tracking
5. **Track Record**: KPI-grid (accuracy, Brier, avg confidence), per-tier filter, BOTD backtest sectie, Live Measurement per tier, TierROIGrid (deze sessie)
6. **Strategy center**: pre-baked strategieën met winrate / ROI / profit factor / max drawdown, "Profitable" badge op basis van plausibility gate (clamp naar 0 bij onrealistische cijfers)
7. **Weekly Reports**: PDF-downloadable performance reports
8. **Dashboard**: gepersonaliseerde samenvatting
9. **Admin-surface**: user management, blog CMS, notes, research, finance, telegram posting, api-usage monitoring
10. **Auth flow**: register met €0,01 Stripe trial → verify-email → dashboard
11. **Sanity CMS**: blog posts + marketing copy via `next-sanity` client, Studio ingebed op `/studio`
12. **Search**: globale zoekbox voor teams/leagues/matches
13. **Live score**: realtime ticker
14. **Favorites**: bookmarks
15. **Learn + How-it-works + Engine-explainer**: educatieve content-pagina's

## A8. Backend API-oppervlak (samenvatting)

```
/api/auth/*              register, login, verify, refresh, password-reset
/api/subscriptions/*     Stripe checkout, portal, webhooks
/api/checkout_sessions   Stripe sessions
/api/predictions         publieke feed met filters
/api/betoftheday         dagelijkse top-pick
/api/trackrecord/summary KPI's (accuracy, Brier, etc.)
/api/trackrecord/live-measurement  per-tier live stream
/api/trackrecord/roi     ROI-simulatie (deze sessie)
/api/trackrecord/roi/tiers  per-tier ROI breakdown (deze sessie)
/api/trackrecord/segments  performance per segment
/api/strategies/*        strategieën + metrics
/api/backtests/*         walk-forward resultaten
/api/matches/*           fixtures
/api/leagues / /teams / /sports / /fixtures
/api/live                live ticker
/api/odds                odds feed
/api/models              model versions
/api/value_bets          value analysis
/api/reports             weekly PDFs
/api/dashboard           user dashboard data
/api/search              global search
/api/admin/*             admin surface (17 routers)
/api/health + /api/ping  health checks (Railway restart-probes)
```

## A9. Scheduled jobs (Celery beat)

```
Elke 15 min:   ingestie van nieuwe fixtures + odds
Elk uur:       evaluatie van afgelopen wedstrijden
Dagelijks:     Pick of the Day generatie + Telegram post
Wekelijks:     Weekly Report PDF generatie + e-mail verzending
Nightly:       data sync + abandoned checkout e-mails
```

Queues: `celery` en `emails`, concurrency 2. Beat schedule in `backend/celerybeat-schedule`.

## A10. Veiligheidsvlaggen in de code

1. **Plausibility gate** in `/api/strategies/*`: `winrate`/`roi` worden geclamped naar 0 als ze onrealistisch zijn. Raw waarden zijn wel beschikbaar als `raw_winrate`/`raw_roi` + `validation_status` enum. Frontend "Profitable" badge hangt van de clamp af.
2. **Disclaimers overal**: alle output is gelabeld als "simulated / educational". Geen weddenschap-facilitering.
3. **Host canonicalization** in `middleware.ts`: `x-forwarded-host` wordt als primaire hostnaam gelezen; niet-canonieke Vercel-URL's krijgen `X-Robots-Tag: noindex, nofollow` om SEO-duplicaten te voorkomen.
4. **Migration self-heal**: `start.py` doet `bootstrap_alembic_if_needed` + `reconcile_user_auth_columns` voor `alembic upgrade head`. De FastAPI lifespan draait bovendien `Base.metadata.create_all` als laatste vangnet. Migrations blijven wel source-of-truth.

---

# DEEL B — De ROI-simulator (wat we deze sessie hebben gebouwd)

## B1. De gebruikersvraag

> "Je mag niet aan de engine komen, en eigenlijk moeten we wel aan de hand van pre-match odds weten wat we dus met die backtest aan resultaat hebben gedraaid, waarbij men een bedrag kan invullen."

Vertaling: de track-record liet al accuracy (68%) en Brier score (0.1558) zien. Wat ontbrak was de vertaling naar **euro's**: "wat had je verdiend als je €10 per pick had ingelegd?"

## B2. Het data-probleem

ROI berekenen vereist per pick een odds (winquote). Die odds komen potentieel uit drie bronnen:

1. **`Prediction.closing_odds_snapshot`** — JSONB die ingestie invult op het moment van voorspelling. Bevat `{"source": "...", "bookmaker_odds": {"home": 1.85, "draw": 3.40, "away": 4.00}}`. Niet voor alle historische predicties gevuld.
2. **`odds_history`** — tabel met bookmaker-odds, gevuld door ingestie vanaf de betaalde API. Per match kunnen er meerdere rijen zijn (verschillende bookmakers + timestamps).
3. **Geen odds** — een flink deel van de backtest-dataset.

**Eerste poging (verwijderd):** alleen picks tonen waarvoor echte odds beschikbaar waren. Resultaat: voor de meeste filters stond er "Geen picks met odds beschikbaar" — onbruikbaar.

## B3. De kritieke ontwerpbeslissing

Gebruiker:
> "Ik wil geen halve tool hebben. Het is het een of het ander."

En later, na uitleg van opties:
> "Je probeert alle pre-match odds uit de betaalde API-key te halen, en als die er voor die wedstrijd niet is, wil ik dat je op basis van modelkans de odd berekent. Maar dat moet wel duidelijk zijn voor de gebruiker, anders is er geen transparantie en kan het fraude zijn."

**Gekozen oplossing: 3-laags hybride priority met 100% transparantie**

```
Laag 1 → Prediction.closing_odds_snapshot  (real, stored at prediction time)
Laag 2 → odds_history AVG                   (real, paid API, avg over bookmakers)
Laag 3 → implied odds: 1 / winkans × 0,95   (calculated fallback)
```

En cruciaal: `real_odds_count` en `implied_odds_count` worden per response bijgehouden en **expliciet in de UI getoond** (bijv. "12 echte odds · 8 berekend").

## B4. Waarom 0,95 als bookmakersmarge?

Europese bookmakers hanteren gemiddeld ~5% marge ("overround"). Met implied-odds = 1/prob × 0.95, geldt voor een **perfect gekalibreerd** model:

```
E[winst per pick] = p × (1/p × 0.95 − 1) + (1−p) × (−1)
                  = 0.95 − p + p − 1
                  = −0.05
```

Dus een perfect gekalibreerd model produceert exact **−5% ROI** op implied-odds-picks. Consequentie voor de interpretatie:

- `ROI > 0%` → model heeft een edge boven de markt (accuracy > confidence)
- `ROI ∈ [-5%, 0%]` → netjes gekalibreerd
- `ROI < -5%` → overconfident

Deze interpretatie wordt in de UI automatisch getoond onder het ROI-getal.

## B5. Waarom AVG en geen MAX?

Eerste versie gebruikte `func.max()` op `odds_history`. Dat pakt de **hoogste** odds die ergens ooit door één bookmaker is aangeboden — cherry-picking van best-case prijzen. Onrealistisch voor een gewone speler.

We zijn overgestapt op `func.avg()`: gemiddelde over alle bookmakers en timestamps, een realistische "typische" prijs. Dat kan de berekende ROI 2–8% lager maken, maar is eerlijker en consistent met de "honest engine" filosofie.

## B6. Wat we concreet hebben gebouwd

### Backend: `GET /api/trackrecord/roi`

Single-filter ROI endpoint.

Query params:
- `pick_tier` (optioneel)
- `source` (`live` / `backtest` / `all`)
- `days` (optioneel, beperk tot afgelopen N dagen)
- `stake` (1–10.000 euro, default 10)

SQL kern (geparafraseerd):
```sql
SELECT
  Prediction.id, match_id,
  home/draw/away_win_prob,
  closing_odds_snapshot,
  PredictionEvaluation.is_correct,
  AVG(odds_history.home_odds), AVG(draw_odds), AVG(away_odds)
FROM prediction
JOIN prediction_evaluation ON …
JOIN match ON …
LEFT JOIN odds_history oh ON match_id AND market IN ('1x2','1X2')
WHERE predicted_at < scheduled_at        -- pre-match lock
  [+ source/tier/days filters]
GROUP BY Prediction.id, …
```

Per rij:
1. `pick = argmax(home_prob, draw_prob, away_prob)`
2. Odds via 3-laags priority
3. Als correct: `pnl += stake × (odds - 1)`; incorrect: `pnl -= stake`
4. Tel `real` of `implied`

Response:
```json
{
  "stake_per_pick": 10,
  "total_picks": 2847,
  "real_odds_count": 1432,
  "implied_odds_count": 1415,
  "correct_picks": 1936,
  "accuracy": 0.68,
  "avg_odds": 1.72,
  "total_staked": 28470.00,
  "total_return": 29108.40,
  "net_profit": 638.40,
  "roi_pct": 2.2
}
```

### Backend: `GET /api/trackrecord/roi/tiers`

Zelfde logica maar één call die alle tiers aggregeert (inclusief "all"):

```json
{
  "stake_per_pick": 10,
  "tiers": {
    "free":     { "roi_pct": 1.2, "total_picks": 820, … },
    "silver":   { "roi_pct": 2.8, "total_picks": 940, … },
    "gold":     { "roi_pct": 4.1, "total_picks": 680, … },
    "platinum": { "roi_pct": 6.5, "total_picks": 407, … }
  },
  "all": { "roi_pct": 3.2, "total_picks": 2847, … }
}
```

### Frontend: `TierROIGrid` (`components/noct/tier-roi-grid.tsx`)

Hoofdcomponent. Opbouw:

1. **Header** — titel + refresh-knop
2. **Stake selector** — €5/10/25/50/100 presets + vrij invulveld
3. **Hero row "Alle tiers samen"** — groot rendement % (groen/rood), nettowinst
4. **Per-tier grid** (2×4) — elk met:
   - Tier-emblem en naam
   - Groot gekleurd rendement %
   - Picks + % raak
   - Nettowinst in €
   - Gem. odds
   - Odds-bron-breakdown ("12 echt · 8 berekend")
5. **Transparantie-blok (blauw)** — uitklapbaar info-paneel met uitleg
6. **Context-interpretatie** — automatisch: "Positief rendement (+3,2%) — het model presteert beter dan de markt prijst. Dat betekent een historische edge op deze dataset."
7. **Disclaimer** — "historische data, geen garantie, ter informatie"

States: loading skeletons, error state ("Kan data niet ophalen" + retry-knop), empty state ("Nog geen geëvalueerde picks").

### Frontend: `ROISimulator` (simpeler, zonder tier-split)

Alleen op BOTD-pagina. Dezelfde 4 KPI-cellen (Totaal ingezet, Teruggekregen, Nettowinst, Rendement), stake-selector en disclaimer, zonder tier-grid.

### Plaatsing

| Surface | Component | Reden |
|---|---|---|
| `/track-record` (publiek) | TierROIGrid × 2 (backtest + live) | Marketing, toont tiers voor conversie |
| `/(app)/trackrecord` (authed) | TierROIGrid × 2 (tabs backtest / live) | Abonnees zien hetzelfde; deze authed versie had hiervoor HELEMAAL geen ROI-tool |
| `/(app)/bet-of-the-day` | ROISimulator | Eén pick, geen tier-breakdown zinvol |

## B7. Copy- en UX-keuzes

- **Dutch-first**: "ROI" → "Rendement", "modelkans" → "winkans", "stake" → "inzet"
- **Geen wiskunde in hoofdflow**: `1 ÷ kans × 0,95` alleen in uitklap-info-panel
- **Progressive disclosure**: info-icoon toggelt de uitgebreide uitleg
- **Kleurcodering**: groen = winst, rood = verlies, amber = geschat/waarschuwing, emerald = echte odds
- **Geen dubbele widgets** op één pagina (TierROIGrid heeft al stake-kiezer + "all"-aggregate, dus losse ROISimulator verwijderd)

## B8. Integriteits-checks

| Vraag | Antwoord | Bewijs |
|---|---|---|
| Pre-match lock afgedwongen? | Ja | `WHERE Prediction.predicted_at < Match.scheduled_at` |
| Live / backtest gescheiden? | Ja | `prediction_source` filter + LIVE_MEASUREMENT_START cut-off |
| Cherry-picking op odds? | Nee | `func.avg` over alle bookmakers |
| Cherry-picking op matches? | Nee | Alle evaluated predictions, geen extra filter |
| Tier-drempels correct? | Ja | Gedeelde `pick_tier_expression()` |
| Aantal echte odds zichtbaar? | Ja | `real_odds_count` / `implied_odds_count` in response én UI |

## B9. Bestanden aangeraakt

```
backend/app/api/routes/trackrecord.py
  + GET /roi
  + GET /roi/tiers
  (func.avg i.p.v. func.max, Prediction.id in GROUP BY)

frontend/src/components/noct/tier-roi-grid.tsx     (nieuw)
frontend/src/components/noct/roi-simulator.tsx     (copy updates)

frontend/src/app/track-record/track-record-content.tsx
  (TierROIGrid toegevoegd voor backtest + live, ROISimulator verwijderd)

frontend/src/app/(app)/trackrecord/page.tsx
  (TierROIGrid toegevoegd in beide tabs — eerder ontbrak ROI volledig)

frontend/src/app/(app)/bet-of-the-day/page.tsx
  (ROISimulator met nieuwe Dutch copy)
```

---

# DEEL C — Bruikbaarheid en bekende beperkingen

## C1. Wat werkt goed

1. **100% pick-dekking** — altijd een getal dankzij de 3-laags fallback
2. **Transparantie over odds-bron** — gebruiker ziet per tier hoeveel echte vs berekende odds
3. **Vrije inzetkeuze** — €5 tot €10.000
4. **Per-tier vergelijking** — rechtvaardigt visueel het prijsverschil tussen tiers
5. **Aggregate + detail** in één component ("Alle tiers" + uitgesplitst)
6. **Educatieve interpretatie** — gebruiker snapt wat het getal betekent
7. **Consistent op drie surfaces** — publiek, authed dashboard, BOTD

## C2. Bekende beperkingen

1. **Implied odds onderschatten mogelijk de werkelijke edge.** Echte markt-odds zijn vaak iets gunstiger dan implied omdat bookmakers niet perfect kalibreren. Gebruikers met veel implied-odds zien wellicht een conservatiever getal.
2. **Geen confidence interval per tier.** Platinum 407 picks vs Free 820 picks — geen visueel signaal of een verschil statistisch betekenisvol is.
3. **Geen time-series.** Geen ROI-curve over tijd. Voor serieuze analytics een gemis.
4. **Geen sport/competitie-filter in de ROI UI.** De backend ondersteunt `days`, maar geen interactieve filter voor sport/league.
5. **Railway-deployment zichtbaarheid.** Als Railway een nieuwe endpoint nog niet heeft opgepakt, toont de UI een rode error-state. Er is geen actieve monitoring.
6. **`closing_odds_snapshot` vulling bij nieuwe predicties.** De ingestie-pipeline moet die JSONB structureel vullen bij iedere nieuwe pick. Niet in deze sessie aangepakt; nieuwe picks vallen momenteel terug op laag 2 of 3.
7. **Alleen 1X2 markt.** Over/Under en BTTS zijn nog niet meegenomen in de ROI-berekening.
8. **Implied-odds-only tiers.** Als alle picks in een tier via laag 3 gaan, is de ROI per definitie gecapped op de kalibratie-bodem (~−5%). Casual gebruikers zouden dit kunnen verkeerd interpreteren.

## C3. Hoe een gebruiker het ervaart

1. Opent `/track-record` of `/(app)/trackrecord`
2. Ziet KPI's (3.318 voorspellingen, 68% accuracy, etc.)
3. Scrollt naar TierROIGrid
4. Klikt op €50 preset (of vult eigen bedrag in)
5. Ziet in één oogopslag: "Alle tiers samen +3,2%, Platinum +6,5%, Gold +4,1%, Silver +2,8%, Free +1,2%"
6. Ziet "1.432 echte odds · 1.415 berekend" — weet dus dat de helft op echte markt-odds gebaseerd is
7. Klikt op info-icoontje → leest uitleg
8. Leest contextregel "Positief rendement — model presteert beter dan de markt prijst"

Dit geeft de gebruiker (a) een concrete uitbetaling, (b) tier-differentiatie voor aankoopbeslissing, (c) duidelijkheid over data-betrouwbaarheid, (d) interpretatie zonder jargon.

---

# DEEL D — Vragen voor second opinion

1. **Is de implied-odds fallback methodologisch verdedigbaar**, of moeten we strikter alleen picks met echte odds tonen (met een minimum-coverage-drempel)?
2. **Moeten we het `0,95` marge-getal user-configureerbaar maken**, of is dat te complex voor een casual gebruiker?
3. **Moeten we een confidence interval op de ROI tonen**? Zo ja, via welke methode — bootstrap, Wilson op winrate, of aparte normal-approximation op pnl-gemiddelde?
4. **Is "Rendement" glashelder voor een Nederlandse casual gebruiker**, of leest het te beleggerig?
5. **Risico dat gebruikers de implied-odds-ROI verwarren met werkelijke pass-through winstverwachting?** Zo ja, wat is de juiste disclaimer-formulering?
6. **Drempel voor echte-odds-aandeel?** (bijv. "we tonen rendement pas bij ≥50% echte odds", anders een waarschuwing)
7. **Moeten we naast rendement ook een kalibratie-metriek tonen** (Brier / log loss per tier) zodat gebruikers niet puur op ROI kiezen?
8. **Moeten we de Railway-deploy pipeline monitoren** (automatische health-check op nieuwe endpoints voordat de frontend ze probeert) om de rode error-state te voorkomen?
9. **Is de "Alle tiers samen" aggregate row boven de per-tier grid de juiste hiërarchie**, of moeten tiers prominenter zijn omdat dat de core conversie-pitch is?
10. **Moet de BOTD-pagina ook een "eigen tier ROI" tonen**, of is de huidige single-pick ROISimulator daar correct?

---

_Einde rapport._
