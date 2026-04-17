# Tier Data Integrity Audit — 2026-04-17

**Scope:** 6 user-reported findings in de live app en publieke site (Fase B + Fase B QA follow-up).
**Methode:** read-only audit van backend routes, services, tier-core, frontend pagina's, componenten en API-client. Geen fixes uitgevoerd.
**Canonical tier-feiten:** zie `docs/SESSION_HANDOFF.md §4` en `backend/app/core/tier_system.py`.

---

## Executive samenvatting

| Bevinding | Status | Severity |
|---|---|---|
| 1 — Trackrecord tier-filtering + CSV integriteit | ⚠️ **PARTIAL** | P1 (1 data-leak-by-design + 1 UX gap) |
| 2 — Admin tier switch error | ❌ **FAIL** | **P0** (echte bug, blokkeert admin QA-flow) |
| 3 — Dashboard toont niks bij andere tier | ⚠️ **PARTIAL** | P1 (data-sparsity, geen code-bug, maar UX onduidelijk) |
| 4 — Voorspellingen pagina | ✅ **PASS** | — (klein punt: client-side classifier mirror) |
| 5 — Rapporten pagina + tier-scoping | ⚠️ **PARTIAL** | P1 (geen backend gate) + P2 (KPI placeholders) |
| 6 — Publieke Track Record CSV + consistency | ✅ **PASS** | P2 (1h-cache lag + CSV filename edge) |

**P0 bugs (blokkerend, direct fixen):** 1 — admin tier switch werkt niet omdat `api.ts` de localStorage-key niet leest.

**P1 bugs (functioneel kapot of data-lek-by-design, bewust besluit nodig):** 4 — (a) Free user kan via publieke CSV endpoint álle Platinum-voorspellingen downloaden mét wedstrijdnamen; (b) Dashboard toont nagenoeg nul rijen voor Free tier door samenloop `access_filter(FREE)` + `v81_predictions_filter` cutoff (2026-04-16 11:00 UTC, ~30u data); (c) `/api/reports/generate` heeft geen backend tier-gate — frontend paywall is de enige bescherming; (d) In-app trackrecord tier-filter verandert aggregate maar niet de "Recent Predictions Feed" (verwarrend UX).

**P2 (drift/cosmetisch):** 3 — KPI-tegels Reports zijn hardcoded `—`, CSV filename `betsplug-trackrecord--2026-04-17.csv` heeft dubbele dash zonder pick_tier, publieke page vs pricing-cache 1u lag.

---

## Canonical feiten (waartegen we valideren)

```
Free:     top-14 leagues + conf 0.55–0.65   ~45% accuracy claim
Silver:   top-14 leagues + conf ≥0.65       ~60% accuracy claim
Gold:     top-10 leagues + conf ≥0.70       ~70% accuracy claim
Platinum: top-5  leagues + conf ≥0.75       ~85% accuracy claim
```

`access_filter(FREE)` (tier_system.py:185–244):
```
baseline: league_id IN LEAGUES_FREE (=LEAGUES_SILVER, top-14) AND conf ≥ 0.55
AND NOT (league IN LEAGUES_PLATINUM AND conf ≥ 0.75)
AND NOT (league IN LEAGUES_GOLD     AND conf ≥ 0.70)
AND NOT (league IN LEAGUES_SILVER   AND conf ≥ 0.65)
```
→ Free ziet effectief alleen top-14 picks in de conf band **0.55–0.65**. Dat is een smalle band en bij lage volumes (post-v8.1 deploy) kan die leeg zijn.

`v81_predictions_filter()` (core/prediction_filters.py:48–60):
```
Prediction.prediction_source IN ('batch_local_fill','backtest','live')
AND Prediction.created_at >= 2026-04-16 11:00 UTC
```
→ Dashboard + trackrecord top-level queries zitten op een window van **~30 uur data** (vandaag is 2026-04-17). Dit verklaart veel van de "weinig/geen data" ervaring.

---

## Bevinding 1 — Trackrecord tier-filtering en data integriteit

**Bestanden:**
- Frontend: `frontend/src/app/(app)/trackrecord/page.tsx:1260–1350` (tier-tabs) + `:800–900` (RecentPredictionsFeed)
- Backend: `backend/app/api/routes/trackrecord.py:41–60` (`_parse_public_pick_tier`), `:63–200` (summary), `:203–384` (segments), `:388–521` (calibration), `:540–793` (CSV export)
- API-client: `frontend/src/lib/api.ts:391–402` (`getTrackrecordExportUrl`)

### A) Wat verandert bij tier-klik?

| Elementen op /trackrecord | Reageert op tier-tab? | Bron |
|---|---|---|
| `TrackrecordSummary` (top KPIs: accuracy, total, brier, logloss) | ✅ | `/summary?pick_tier=<tier>` |
| `PerTierBreakdownTable` (alle 4 tiers naast elkaar) | ❌ (toont altijd alle 4) | `summary.per_tier` dict (unfiltered per Bug 1-fix) |
| `trackrecord-segments` (maand/sport/league) | ✅ | `/segments?pick_tier=<tier>` |
| `calibration` (reliability diagram) | ✅ | `/calibration?pick_tier=<tier>` |
| **`RecentPredictionsFeed`** (individuele picks lijst) | ❌ | `api.getPredictions()` — geen tier param doorgestuurd |
| CSV download-knop | ✅ | `/export.csv?pick_tier=<tier>` |

### B) Transparantie / access-concern

**In-app**: Free user die op "Platinum 85%+" klikt:
- ✅ Ziet aggregate cijfers (count, accuracy) — correct, dat is bedoeld (transparency).
- ✅ `RecentPredictionsFeed` blijft zijn eigen toegewezen picks tonen — `api.getPredictions()` respecteert `access_filter(user_tier)` op `backend/app/api/routes/predictions.py:107–110`.
- ❌ **Kan individuele Platinum-picks niet in de UI zien** (goed).

**CSV** (zelfde endpoint, ook gebruikt door publieke page): Free user die CSV download met `?pick_tier=platinum`:
- Bestanden bevatten **17 kolommen inclusief `Match Date`, `League`, `Home Team`, `Away Team`, `Prediction`, `Actual Outcome`, `P/L`** (trackrecord.py:601–620).
- `_parse_public_pick_tier` (trackrecord.py:41–60) **bypassed** access_filter en scoped naar `pick_tier_expression() == public_tier.value`.
- **Docstring zegt letterlijk**: "Safe to expose publicly — the trackrecord page is the product's transparency surface and every user (Free or Platinum) needs to see accuracy broken down per tier." (trackrecord.py:47–50)

→ **Design-decision**: publieke endpoint geeft historische picks (wedstrijd + prediction + uitkomst) per tier vrij. Aggregaten zou je altijd willen delen, individuele historische records is een product-keuze. **Flag voor beslissing.**

### C) Toelichting op pagina

- ✅ Er is een `DataTransparencyCard` (lines 701–796) die uitlegt hoe accuracy wordt gemeten en dat de track-record automatisch update.
- ✅ Er is een strip-header "Tier scope — click any tier to audit its track record" (line 1287).
- ❌ **Ontbreekt**: uitleg dat de tier-tabs **niet** de individuele picks lijst filteren (de Recent Predictions Feed eronder blijft gelijk). Dit is verwarrend.
- ❌ **Ontbreekt**: uitleg hoe elke tier wordt geclassificeerd (conf-drempel + league-scope). Een gebruiker zonder CLAUDE.md weet niet wat "Silver = 60%+" precies betekent.
- ❌ **Ontbreekt**: uitleg of accuracy live of gecached is (trackrecord is live/no-cache; pricing is 1h cache — verschil niet duidelijk).

### D) CSV integriteit

Kolommen (trackrecord.py:601–620): `Match Date | League | Home Team | Away Team | Home% | Draw% | Away% | Confidence% | Prediction | Odds Used | Odds Source | Actual Outcome | Correct? | Home Score | Away Score | P/L (units) | Model`.

Filter-logica per tier (trackrecord.py:645–649):
- `?pick_tier=platinum` → `WHERE pick_tier_expression() = 3` (top-5 leagues + conf ≥0.75)
- `?pick_tier=silver` → `WHERE pick_tier_expression() = 1`
- geen param → `WHERE access_filter(user_tier)`

Consistency check:
- **Accuracy uit CSV** = `count(Correct?="Yes") / total rows` = wat backend meldt (trackrecord.py:135).
- ✅ Geen predictions uit andere tiers — CASE expression is mutually exclusive.
- ✅ Confidence range per tier is correct afgedwongen via SQL CASE.
- ✅ Competities per tier correct via `league_id IN LEAGUES_*`.

**Kleine cosmetic bug (P2)**: filename zonder `pick_tier` wordt `betsplug-trackrecord--2026-04-17.csv` (dubbele dash) — zie `trackrecord.py:775–779`.

### Status finding 1: ⚠️ PARTIAL

---

## Bevinding 2 — Admin tier switch error ❌ P0

**Bestanden:**
- UI: `frontend/src/app/(app)/admin/page.tsx:711–781` (TierSwitcher)
- API-client: `frontend/src/lib/api.ts:71–117` (request method, 100% vd endpoints)
- Backend dep: `backend/app/auth/tier.py:153–186` (`get_current_tier`, verwacht `?tier=`)
- Error boundary: `frontend/src/app/error.tsx` — rendert **letterlijk** de tekst "Er ging iets mis op deze pagina"
- Tier hook: `frontend/src/hooks/use-tier.ts` — leest `localStorage.betsplug_tier`

### Root cause

TierSwitcher schrijft:
```ts
localStorage.setItem("betsplug_tier", tier);                  // ← useTier() leest dit
localStorage.setItem("betsplug_admin_testing_tier", tier);    // ← niets leest dit
window.location.reload();
```

`ApiClient.request()` voegt **nergens** `?tier=<slug>` toe aan requests. Er is **geen** `getAdminTestingTier()` helper, geen URL-patching, geen interceptor.

**Backend vergelijking**: `get_current_tier` in `auth/tier.py:178–184` honoreert alleen de `?tier=` query param voor admins. Zonder param valt het terug op de admin's eigen abonnement (Platinum of hun echte plan). Dus:
- **UI-laag (useTier):** denkt user = Silver (uit localStorage)
- **API-laag:** request heeft geen `?tier=` → backend resolved tier naar admin's werkelijke abonnement (meestal Platinum)
- **Gevolg:** frontend component verwacht Silver-scoped data, krijgt Platinum-scoped data terug (veel meer picks, mogelijk nieuwe velden, Paywall triggert op wat admin "nu Silver is", component state drift). Ergens throwt een component (missende veld, null deref, React key collision) en de error-boundary vangt het af → "Er ging iets mis op deze pagina".

Daarnaast: frontend-paywalls (`PaywallOverlay` in `/bet-of-the-day`, `/predictions`, `/reports`, `/analyst`) checken de localStorage-tier, dus admin ziet ze óók staan. Op `/analyst` (Gold required) of `/reports` (Gold required) kan de component in een staat belanden waarbij hij crasht als de payload inconsistent is met wat de overlay verwacht.

### Wat precies crasht

Onbekend zonder een live repro — maar waarschijnlijke kandidaten:
1. **`/admin` zelf** — na reload queried `getDataSources()` / `getAdminErrors()` zonder `?tier=`, dus correct Platinum — geen issue daar op.
2. **Doorklik naar andere pagina's** — bijv. `/bet-of-the-day` of `/predictions` waar PaywallOverlay op `betsplug_tier === "silver"` de blur activeert, maar data die binnenkomt is Platinum-scoped → mogelijke inconsistency.
3. **`useSubscription` / `useTier` hydration race** — `useTier()` heeft geen timeout (zie P3.1 in fase_b_qa_report).

### Status finding 2: ❌ **FAIL (P0)**

---

## Bevinding 3 — Dashboard toont niks bij andere tier

**Bestand:** `backend/app/api/routes/dashboard.py:59–220`, `frontend/src/components/dashboard/TierPerformanceCard.tsx:133–195`

### Gedrag per tier

Top-level metrics (`accuracy`, `total`, `correct`, etc.) passen `access_filter(user_tier)` toe (dashboard.py:98,104). Per_tier breakdown is unfiltered (dashboard.py:187 — zoals bedoeld na Bug 1 fix).

| Admin override | Top-level metrics | per_tier | Front-end render |
|---|---|---|---|
| `?tier=platinum` | Alle top-14 picks conf ≥0.55 | alle 4 tiers | volledig |
| `?tier=gold` | Top-14 conf ≥0.55 excl. Platinum-qualifiers | alle 4 tiers | volledig |
| `?tier=silver` | Top-14 conf ≥0.55 excl. Platinum+Gold-qualifiers | alle 4 tiers | volledig |
| `?tier=free` | **Top-14 conf 0.55–0.65 excl. alle higher-qualifiers** — smalle band | alle 4 tiers | top-level mogelijk nul |

**Belangrijke samenloop**: `v81_predictions_filter()` (prediction_filters.py:48) kapt alles < 2026-04-16 11:00 UTC af. Vandaag is 2026-04-17 → effectief ~30 uur aan v8.1-data. In die 30u is het Free-band (top-14, conf 0.55–0.65) naar alle waarschijnlijkheid zeer dun of leeg.

Bovendien werkt de admin tier switch **niet** (zie Finding 2) — admin die "test als Free" krijgt feitelijk zijn eigen Platinum-scope terug. Dus "Dashboard shows nothing" treedt alléén op wanneer admin **handmatig** `?tier=free` achter de URL plakt, OF wanneer een echte Free user zijn/haar dashboard bekijkt.

### Frontend handling

`TierPerformanceCard` (lines 133–195) toont altijd alle 4 tiers-rijen via `perTier?.[slug]`. Als `breakdown` undefined/null is per tier, rendert het "No data yet" (geen crash).

Top-level KPIs op `/dashboard` worden getoond zelfs als `has_data=false` (dashboard.py:213) — renderen als "0" / "—" afhankelijk van component.

### Root cause hypothese

1. **Primair**: `v81_predictions_filter` cutoff + smalle Free-band → top-level metrics voor `user_tier=FREE` zijn zeer dun in de huidige window.
2. **Secundair**: admin tier switch werkt niet op API-laag (Finding 2), dus admin denkt "ik kijk als Free" maar krijgt Platinum-data — inverse van wat beschreven is.

### Status finding 3: ⚠️ PARTIAL (geen code-bug in de query; wel UX-issue + afhankelijkheid van Finding 2)

---

## Bevinding 4 — Voorspellingen pagina controle ✅

**Bestanden:**
- Frontend: `frontend/src/app/(app)/predictions/page.tsx:1074–1205`, `:307–477` (CompactMatchRow)
- Classifier mirror: `frontend/src/lib/pick-tier.ts:15–106`
- Backend: `backend/app/api/routes/predictions.py:39–231`, `backend/app/services/pick_drivers.py:134–184`
- Tier constants: `backend/app/core/tier_leagues.py:30–56`
- PaywallOverlay: `frontend/src/components/ui/paywall-overlay.tsx:155–294`
- PickReasoningBlock: `frontend/src/components/predictions/PickReasoningBlock.tsx`

### Data correctness

- `odds` komt uit DB tabel `OddsHistory` (via The Odds API adapter). Geen hardcoded data. Let op: snapshots zijn historisch (niet live).
- `confidence` komt direct uit `Prediction.confidence` (per match, float, distinct). Geen risico op uniforme waardes.
- `pick_tier` wordt conditioneel meegestuurd (alleen als `TIER_SYSTEM_ENABLED=true`, predictions.py:217–220).
- `top_drivers` (uit `pick_drivers.py`) wordt per request fresh berekend. Returnt `None` als features_snapshot leeg is — safe.

### Tier filtering (client-side!)

`/predictions` page filtert **client-side** met `classifyPickTier()` (page.tsx:1164–1174). Geen backend tier-query param.

Consistency frontend ↔ backend tier-sets:

| Tier | Frontend UUIDs (pick-tier.ts) | Backend UUIDs (tier_leagues.py) | Match |
|---|---|---|---|
| Platinum | 5 | 5 (CL, Süper Lig, Eredivisie, PL, Saudi) | ✅ |
| Gold | +5 | +5 | ✅ |
| Silver | +4 | +4 | ✅ |
| Free | = Silver | = Silver | ✅ |

Confidence thresholds 0.75/0.70/0.65/0.55 zijn op beide kanten identiek.

**Drift-risico (P2.2 al gedocumenteerd)**: twee bronnen van waarheid. Vandaag correct.

### Competition filter

Zelfde strategie — client-side filter, AND-combinatie met tier-filter (page.tsx:1151–1174). Werkt correct.

### PickReasoningBlock ("Why this pick?")

- Geïmplementeerd in `frontend/src/components/predictions/PickReasoningBlock.tsx` (NIEUW in deze pull).
- Tier-gated op `hasAccess("gold")` (line 60). Free/Silver zien locked teaser met upgrade link (lines 66–93).
- Drivers-service (`backend/app/services/pick_drivers.py`, NIEUW +187 regels) kiest top-3 features uit 8 candidates (elo_diff, form_diff, venue_form_diff, h2h_home_wr, gd_diff, h_cs_pct, a_cs_pct, h_home_wr) gesorteerd op z-score.
- Returnt `None` bij missend `features_snapshot` — legacy rows zien niks, nieuwe rows zien drivers. Safe.
- **⚠️ Integratie in UI**: component bestaat in `/components/predictions/`, maar in `predictions/page.tsx` (CompactMatchRow, lines 307–477) wordt `PickReasoningBlock` **niet aangeroepen**. Grep bevestigt geen import van `PickReasoningBlock` in `page.tsx`. Dus het blokje is geschreven maar nog niet gerenderd op de lijst. Mogelijk op match-detail page; niet geverifieerd.

### Status finding 4: ✅ PASS (met notitie: PickReasoningBlock niet geïntegreerd in predictions lijst)

---

## Bevinding 5 — Rapporten pagina en tier-scoping

**Bestanden:**
- Frontend: `frontend/src/app/(app)/reports/page.tsx:1–372`
- Backend route: `backend/app/api/routes/reports.py:77–160`
- Service: `backend/app/services/report_service.py` (uitgebreid met +207 regels in deze pull)

### Tier gating

- **Frontend**: `<PaywallOverlay feature="reports_exports" requiredTier="gold">` (page.tsx:308). Free + Silver zien blur + upgrade. Gold + Platinum hebben toegang.
- **Backend (`POST /reports/generate`)**: endpoint ontvangt `user_tier: PickTier = Depends(get_current_tier)` (reports.py:80). **Geen expliciete check** — er staat geen `if user_tier == PickTier.FREE: raise 403`.

→ **Bug (P1)**: een Free-gebruiker die via cURL of scripts direct `POST /api/reports/generate` aanroept krijgt gewoon een rapport. Frontend paywall is de enige bescherming. Dit is dezelfde klasse gap als Finding 1's CSV endpoint — bewust? Niet gedocumenteerd.

### Tier-scoping van data

Report service (`report_service.py:179–278`):
- Line 222–223: toepast `v81_predictions_filter()` + `access_filter(user_tier)` op hoofddataset. ✅
- Line 255–264: per-tier breakdown zónder `access_filter` voor comparison table. ✅
- Line 67–72: `_TIER_SCOPE_LABEL` dict met leesbare scope-regel ("Scope: Platinum tier · Top-5 elite leagues · 85%+ historical").
- Line 555–586: PDF header banner met scope-regel en tier-metadata.
- Line 739–779: PDF tabel met alle 4 tiers naast elkaar.

Getoetst per user_tier:
- **Platinum user**: rapport bevat alle top-14 picks (baseline), banner zegt "Scope: Platinum".
- **Gold user**: alle picks behalve Platinum-qualifiers. Banner zegt "Scope: Gold".
- **Silver user**: alle picks behalve Platinum+Gold. Banner zegt "Scope: Silver".
- **Free user** (als paywall bypast): alleen Free-band. Banner zegt "Scope: Free".

Alle data-scoping is technisch correct. Alleen de **autorisatie** ontbreekt backend-side.

### KPIs op Reports pagina

`/reports/page.tsx:340–365` toont 4 KPI-tegels:
```tsx
<KpiTile label="Win rate" value="—" ... />
<KpiTile label="ROI"      value="—" ... />
<KpiTile label="Streak"   value="—" ... />
<KpiTile label="Total reports" value={dynamic} />
```

Alleen `Total reports` is dynamisch (lengte van reports-lijst). **De andere drie zijn hardcoded `—`** — geen API call, geen koppeling met `/api/dashboard/metrics` of `/api/trackrecord/summary`. Dit is een onvoltooide feature, niet een data-bug.

### Status finding 5: ⚠️ PARTIAL (P1 missing backend gate + P2 KPI placeholders onpopulated)

---

## Bevinding 6 — Publieke Track Record pagina tier CSV download ✅

**Bestanden:**
- Frontend: `frontend/src/app/track-record/track-record-content.tsx:48–217`
- Backend: `backend/app/api/routes/trackrecord.py:540–793` (`_stream_trackrecord_csv` + `/export.csv`)
- Pricing: `backend/app/api/routes/pricing.py:136–212`

### CSV download per tier

- Endpoint: `GET /api/trackrecord/export.csv?pick_tier=<slug>`
- **Publieke access**: de endpoint vereist `Depends(get_current_tier)` (niet `get_current_user`), dus ook ongeauthenticeerde callers krijgen response (unauth users resolven naar `PickTier.FREE`).
- `?pick_tier=` **bypassed** access_filter (_parse_public_pick_tier gedocumenteerd als transparency-surface).

Columns + filter-logica zoals in Finding 1 (D). ✅ Correct gescoped qua leagues + confidence via `pick_tier_expression()`.

### Consistency matrix

| Bron | Endpoint | Cache | Platinum accuracy bron |
|---|---|---|---|
| Publieke /track-record pagina | `/api/trackrecord/summary?pick_tier=platinum` | geen (live) | `v81_predictions_filter` + `pick_tier_expression() == 3` |
| In-app /trackrecord page (top KPIs) | idem | geen | idem |
| In-app /trackrecord per_tier table | `/api/trackrecord/summary` (geen filter) → `summary.per_tier.platinum` | geen | `v81_predictions_filter` + `GROUP BY pick_tier_expression()` |
| /engine + /pricing (via `useLiveTrackRecordStats`) | `/api/pricing/comparison` | **1u Redis** (pricing.py:212) | `v81_predictions_filter` + tier CASE + `conf ≥ 0.55` |

**Alle bronnen gebruiken dezelfde SQL-bouwstenen** (v81_predictions_filter + pick_tier_expression). De enige vertraging is de 1-uur Redis cache op `/api/pricing/comparison` — een Platinum-percentage kan in de cache 0.2pp afwijken van de live track-record call.

### 4 KPI-containers op publieke track-record

`track-record-content.tsx:180–217`: 4 cards = Accuracy, BOTD Accuracy, Total Predictions, Brier Score.

- `Accuracy` / `Total Predictions` / `Brier Score` komen van `summary.accuracy` / `summary.total_predictions` / `summary.brier_score` — de **top-level velden**, die door `?pick_tier=` worden gescoped (trackrecord.py:124–129). ✅ Correct per tier.
- `BOTD Accuracy` komt van een losse call `/api/bet-of-the-day/track-record` — **niet** tier-scoped. Toont altijd dezelfde waarde ongeacht welke tier-tab actief is. **Verwarrend UX** maar niet foutief (BOTD is geen tier-classifier).

### In-app vs publieke trackrecord consistency

Beide pages gebruiken exact dezelfde `/api/trackrecord/summary` backend path. Dezelfde `pick_tier_expression()`. Dezelfde `v81_predictions_filter`. **Identieke cijfers gegarandeerd** voor dezelfde tier-scope.

### Status finding 6: ✅ PASS (P2: CSV filename cosmetic, BOTD-KPI niet tier-aware visueel)

---

## Lijst van alle gevonden bugs + prioriteit

### P0 (blokkerend — fixen vóór demo)

| # | Bug | Fix target | Schatting |
|---|---|---|---|
| **B0.1** | Admin TierSwitcher werkt niet: `api.ts ApiClient.request()` leest `localStorage.betsplug_admin_testing_tier` nooit, dus `?tier=` wordt nooit meegestuurd. Backend zet admin's eigen tier terug → UI-state drift → error boundary. | `frontend/src/lib/api.ts:71–117` — bij admin + localStorage-key aanwezig, `?tier=<slug>` injecteren op GET-URLs. Plus overwegen: nieuwe env/header i.p.v. query param om cache-keys schoon te houden. | 30–60 min |

### P1 (functioneel/data-lek — product-beslissing vereist)

| # | Bug | Fix target | Schatting |
|---|---|---|---|
| **B1.1** | CSV export `/export.csv?pick_tier=platinum` geeft Free-users downloadbare file mét wedstrijdnamen + outcomes van alle historische Platinum picks. Docstring zegt "safe by design" — maar het geeft feitelijk Platinum-product-waarde weg. Flag: akkoord of gate op authenticated + hogere tier? | `trackrecord.py:540–793` — ofwel alleen aggregaten exposen publiekelijk (CSV zonder match-kolommen), ofwel `access_filter` weer toepassen en aparte summary-endpoint voor publieke cijfers bouwen. | 1–2u afhankelijk van besluit |
| **B1.2** | `POST /api/reports/generate` heeft geen backend tier-gate. Free-user met cURL kan PDF genereren. Frontend PaywallOverlay is enige bescherming. | `reports.py:77–89` — toevoegen: `if user_tier < PickTier.GOLD: raise HTTPException(402 Payment Required, "Reports require Gold tier")`. | 15 min |
| **B1.3** | Dashboard top-level KPIs voor Free tier zijn nagenoeg altijd leeg door samenloop smalle `access_filter(FREE)` band (0.55–0.65 in top-14) + `v81_predictions_filter` cutoff 2026-04-16 11:00 UTC (~30u window). Zelfs bij groei van dataset blijft Free visueel mager. | Ofwel (a) breder baseline voor Free dashboard (b.v. Free toont de `summary.per_tier.free` cijfers expliciet als "jouw tier historie") ofwel (b) duidelijke messaging "geen picks beschikbaar in jouw tier deze periode". | 1u |
| **B1.4** | In-app `/trackrecord` tier-tabs filteren summary, segments, calibration en CSV, maar **niet** de `RecentPredictionsFeed` (de lijst met individuele picks eronder). Verwarrend: user klikt "Platinum", aggregaten veranderen, maar zijn eigen Free-picks blijven staan. | `frontend/src/app/(app)/trackrecord/page.tsx` — ofwel RecentPredictionsFeed verbergen wanneer tier-tab ≠ "all", ofwel expliciete label "Jouw recente picks" zodat duidelijk is dat deze lijst NIET mee-filtert. | 30 min |

### P2 (cosmetisch / drift-risico / onvoltooid)

| # | Bug | Fix target | Schatting |
|---|---|---|---|
| **B2.1** | `/reports/page.tsx` 3 KPI-tegels (Win rate, ROI, Streak) zijn hardcoded `—`. Geen API-koppeling. | Koppel aan `/api/dashboard/metrics` (die tier-scope kent) of verberg tegels tot ze werken. | 30 min |
| **B2.2** | CSV filename "betsplug-trackrecord--2026-04-17.csv" heeft dubbele dash wanneer `?pick_tier=` ontbreekt. | `trackrecord.py:775–779` — `tier_suffix = f"-{public_tier.name.lower()}"` only in filename if public_tier. | 2 min |
| **B2.3** | Publieke track-record `BOTD Accuracy` KPI blijft gelijk ongeacht tier-tab — komt uit aparte endpoint. | UX: visueel scheiden van tier-scoped KPIs, of hide als tier ≠ "all". | 15 min |
| **B2.4** | Geen uitleg op /trackrecord over (a) tier-definities, (b) live vs cached, (c) dat tier-tabs alleen aggregaten filteren, niet de picks-lijst. | Kleine tooltip/info-icon bij tier-strip. | 30 min |
| **B2.5** | PickReasoningBlock-component is geschreven en backend-service bestaat, maar is **niet geïntegreerd** in `predictions/page.tsx` (`CompactMatchRow`). | Import + render per rij met `drivers={prediction.top_drivers}`. | 20 min |
| **B2.6** | `/api/pricing/comparison` cache 1h vs live trackrecord-summary: cijfers kunnen 0.2pp uiteenlopen. | Acceptabel voor marketing-page; documenteer óf zet beide op dezelfde cache-layer. | 15 min docs |

### P3 (observaties, geen fix nodig)

Geen nieuwe P3-items; `useTier()` ready-race (P3.1 uit fase_b_qa_report) blijft gedocumenteerd.

---

## Data consistency matrix

Gecheckt per 2026-04-17 tegen `TIER_METADATA` in `tier_system.py`:

| Bron | Free | Silver | Gold | Platinum | Cache | Notes |
|---|---|---|---|---|---|---|
| `backend/TIER_METADATA` (tier_system.py:98–119) | 45%+ | 60%+ | 70%+ | 85%+ | — | Bron van waarheid |
| `/api/pricing/comparison` (live DB, 60d) | dynamic | dynamic | dynamic | dynamic | **1u Redis** | marketing |
| `/api/dashboard/metrics.per_tier` | dynamic | dynamic | dynamic | dynamic | 5m Redis per tier | Bug 1 fix |
| `/api/trackrecord/summary.per_tier` | dynamic | dynamic | dynamic | dynamic | geen | Bug 2 fix |
| `/api/trackrecord/summary` top-level met `?pick_tier=` | dynamic | dynamic | dynamic | dynamic | geen | Publieke transparency |
| `/engine` pagina | live | live | live | live | via pricing/comparison 1u | — |
| `/pricing` pagina (pricing-content.tsx) | 45%+ hardcoded ✓ | 60%+ hardcoded ✓ | 70%+ hardcoded ✓ | 85%+ hardcoded ✓ | — | P2.4 drift-risico |
| `PickTierBadge TIER_DISPLAY` | 45%+ ✓ | 60%+ ✓ | 70%+ ✓ | 85%+ ✓ | — | P2.1 drift-risico |

**Geen cijfer-mismatches**. Alle hardcoded strings staan in sync met canonical values. Risico is conceptueel (toekomstige drift), niet empirisch.

---

## CSV validatie resultaten per tier (statisch, zonder live download)

Gebaseerd op code-inspectie van `trackrecord.py:540–793` en `pick_tier_expression()` logica.

| Tier | League scope gewaarborgd? | Confidence range gewaarborgd? | Kolommen | Accuracy uit CSV = pagina? | Cross-tier contamination? |
|---|---|---|---|---|---|
| Free | ✅ LEAGUES_FREE (=LEAGUES_SILVER, top-14) | ✅ 0.55 ≤ conf < 0.65 (via mutually-exclusive CASE) | 17 | ✅ `count(Yes) / total` | ✅ Geen |
| Silver | ✅ LEAGUES_SILVER (top-14) | ✅ conf ≥ 0.65 excl. Gold/Platinum-qualifiers | 17 | ✅ | ✅ |
| Gold | ✅ LEAGUES_GOLD (top-10) | ✅ conf ≥ 0.70 excl. Platinum-qualifiers | 17 | ✅ | ✅ |
| Platinum | ✅ LEAGUES_PLATINUM (top-5) | ✅ conf ≥ 0.75 | 17 | ✅ | ✅ |

Formele garantie komt uit de SQL CASE (tier_system.py:145–179): elke rij krijgt exact één tier-waarde (0/1/2/3/NULL). `WHERE pick_tier_expression() = <N>` kan niet lekken.

---

## Aanbevolen fix-volgorde

| Prio | Fix | Tijd | Reden |
|---|---|---|---|
| 1 | **B0.1** (admin tier switch via `?tier=`) | 45 min | Blokkeert alle overige QA-flows — zonder deze fix kun je de andere bevindingen niet als admin reproduceren. |
| 2 | **B1.2** (backend tier-gate op /reports/generate) | 15 min | Trivial, voorkomt abuse/omleiding van paywall. |
| 3 | **B1.4** (trackrecord-tabs UX verwarrend) | 30 min | Raakt elke dag-user, direct visueel oplosbaar. |
| 4 | **B1.1 decision** (CSV Platinum public) | product-call | Business-decision eerst; dan implementatie. |
| 5 | **B1.3** (dashboard Free empty state) | 1u | Framework voor "geen data in tier" messaging die ook bij toekomstige tier-splits werkt. |
| 6 | **B2.1** (Reports KPIs koppelen of verwijderen) | 30 min | Maakt reports-pagina niet meer misleidend. |
| 7 | Overige P2 | 1–2u totaal | Afhandelen wanneer je er tóch in zit. |

---

## Wachten op beslissing

Drie keuzes aan jou voordat een fix-sprint kan starten:

1. **B1.1** — publieke CSV met Platinum wedstrijdnamen: houden als transparency-feature, ofwel afknijpen naar aggregaten-only + alleen row-level voor ingelogde gebruikers met die tier?
2. **B1.3** — Free dashboard visueel nagenoeg leeg: breed maken of duidelijke "upgrade voor meer picks" framing?
3. **B2.5** — PickReasoningBlock nu integreren op predictions-lijst (gold+) of pas in Fase-2 v10 werk?

Daarna kan ik per bug een losse commit maken zoals in de handoff-doc beschreven.
