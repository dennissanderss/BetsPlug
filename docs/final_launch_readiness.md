# BetsPlug — Productie Stabiliteitsaudit

**Datum:** 2026-04-18
**Auditor:** Claude Opus 4.7 (1M)
**Scope:** Volledig product — backend API, Celery pipeline, frontend (app + publiek), tier-systeem
**Evidence:** `docs/_audit_evidence/2026-04-18/` (API responses saved as `.json`)

> **Beperking:** directe productie Postgres-connectie (Railway DB) is geweigerd als "Production Reads zonder expliciete autorisatie". Alle cijfers in dit rapport komen uit **live API responses** (Railway production) en **statische code-analyse**. Waar DB-bevestiging kritiek is, staat dit expliciet als "⚠ DB-verificatie nodig".

---

## 1. EXECUTIVE SUMMARY

### Verdict: 🟡 **CONDITIONAL GO — Launch mogelijk na fix van 2 P0 en 4 P1 issues**

**Vertrouwensniveau dat dit wekenlang draait zonder breuk: 6/10.**

De kern — tier-logica, access filters, plausibility-clamp, error-handling, Celery schedule — is **solide gebouwd**. Geen runtime crashes te verwachten. Maar er zijn **marketing-eerlijkheid** en **data-pijplijn** issues die een betalende klant zal merken.

**Samenvatting per prioriteit:**

| Prio | Aantal | Launch-impact |
|------|-------:|---------------|
| **P0** | 2 | Moeten voor launch: Platinum-claim ≠ werkelijkheid; Bronze→tier mapping geeft verkeerde toegang |
| **P1** | 6 | Binnen 1 week na launch: Pre-match coverage, eval-lag, home fake fallbacks, TIER_SYSTEM_ENABLED-breker, tier query-param silent-fail, API period_end stale |
| **P2** | 8 | Backlog: i18n gaps, hardcoded TIER_DISPLAY, geen `meets_claim` flag, Wilson CI niet frontend-gevalideerd, NULL pick_tier inconsistent, etc. |
| **P3** | 3 | Nice-to-have |

---

## 2. DATABASE BASELINE (via API, geen direct DB-access)

### Lifetime trackrecord (v8.1 sample since 2024-01-24)

| Tier | Total | Correct | Accuracy | Wilson CI Lower | Avg Conf |
|------|-------:|-------:|---------:|----------------:|---------:|
| Free | 3,763 | 1,822 | 48.42% | 46.8% | 0.609 |
| Silver | 3,004 | 1,824 | 60.72% | 59.0% | 0.703 |
| Gold | 1,650 | 1,164 | 70.55% | 68.3% | 0.764 |
| Platinum | **840** | **691** | **82.26%** | **79.5%** | 0.813 |
| **TOTAAL** | 9,257 | 5,501 | 59.4% | — | — |

**Bronnen (allemaal moeten identiek zijn — zijn het ook):**
- `/api/pricing/comparison`
- `/api/trackrecord/summary?pick_tier=*` (per_tier block is gelijk voor alle 4 queries ✅ — Bug 1 uit handoff is gefikst)
- `/api/dashboard/metrics` per_tier block

### Fixtures & evaluaties status

| Endpoint | Count | Met prediction |
|----------|------:|---------------:|
| `/fixtures/today` (2026-04-18) | 60 | **0** (⚠ 0%) |
| `/fixtures/upcoming` | 178 | 6 (3.4%) |
| `/fixtures/results` (7d) | 189 | 24 (12.7%) |
| `/fixtures/live` | 0 | — |

### Eval-lag (finished matches per dag met predictions)

```
2026-04-11: 74 finished,  10 met prediction
2026-04-12: 63 finished,   9 met prediction
2026-04-13: 10 finished,   1 met prediction
2026-04-14:  8 finished,   4 met prediction
2026-04-15:  4 finished,   0 met prediction   ← gap start
2026-04-16:  8 finished,   0 met prediction
2026-04-17: 19 finished,   0 met prediction
2026-04-18:  3 finished,   0 met prediction
```

`trackrecord/summary` period_end = **2026-04-14 19:00 UTC** — betekent ~**4 dagen** evaluatie-lag. Laatste prediction in DB: 2026-04-17 23:27 UTC (via /predictions endpoint). Dus **predictions worden gemaakt**, maar NIET gekoppeld aan fixtures-endpoint en NIET geëvalueerd richting trackrecord.

### Pending predictions

`/dashboard/metrics`: `pending_count: 38` — 38 predictions wachten op evaluatie.

---

## 3. API ENDPOINT VALIDATIE

| Endpoint | Unauth | Auth req? | Tier-override (non-admin) | Status |
|----------|:-----:|:---------:|:-------------------------:|:------:|
| `/pricing/comparison` | 200 | nee | — (publiek) | ✅ |
| `/trackrecord/summary?pick_tier=free\|silver\|gold\|platinum` | 200 | nee | ok, per_tier compleet | ✅ |
| `/dashboard/metrics` | 200 | nee (defaults FREE) | — | ⚠ zie P1 |
| `/predictions/?tier=X` | 200 | nee | **silently ignored** | ⚠ P1 |
| `/bet-of-the-day/` | 200 | nee | — | ✅ |
| `/fixtures/upcoming\|today\|results\|live` | 200 | nee | — | ✅ |
| `/trackrecord/export.csv` | 401 | JA | tier-gated 402 | ✅ |
| `/homepage/free-picks` | 200 | nee | — | ⚠ stats-window mismatch |

**Kernbevinding:** `?tier=` param voor non-admin wordt stil genegeerd (`backend/app/auth/tier.py:178-184` — alleen `Role.ADMIN` passes). Dit is **by design** (zie handoff §5) maar levert `total=19475` identiek op voor alle 4 tier-queries → elke frontend-component die afhankelijk is van dit response voor tier-differentiatie krijgt **verkeerd signaal** als een normale user admin-testing probeert.

**Plausibility-clamp intact:** `backend/app/api/routes/strategies.py:580-595` — `raw_winrate`/`raw_roi` preserved, `display_winrate`/`display_roi` geclampt naar 0.0 bij `under_investigation`. ✅

---

## 4. CONSISTENCY MATRIX (concrete waarden)

| Bron | Free acc | Silver acc | Gold acc | Plat acc | Free n | Silver n | Gold n | Plat n |
|------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `/pricing/comparison` | 48.4% | 60.7% | 70.5% | **82.3%** | 3763 | 3004 | 1650 | 840 |
| `/trackrecord/summary` per_tier | 48.4% | 60.7% | 70.5% | 82.3% | 3763 | 3004 | 1650 | 840 |
| `/dashboard/metrics` per_tier | 48.4% | 60.7% | 70.6% | 82.3% | 3763 | 3004 | 1650 | 840 |
| `/homepage/free-picks` stats | **50.0%** | — | — | — | **166** | — | — | — |
| `TIER_METADATA` (code) claim | **45%+** | **60%+** | **70%+** | **85%+** | — | — | — | — |
| `PickTierBadge.TIER_DISPLAY` (frontend) | 45%+ | 60%+ | 70%+ | 85%+ | — | — | — | — |
| Pricing JSON-LD (static) | — | — | — | 85%+ | — | — | — | — |
| Home-content fallback (line 766/829/849) | — | "64.8%" | — | — | — | "1,247" | — | — |

**Mismatches gevonden:**

1. **P0** — Platinum **CLAIM 85%+** vs **ACTUAL 82.3%** (Wilson lower 79.5%). **Het product belooft 85% en levert structureel 82%.** Geen UI-signaal dat dit een gap is.
2. **P1** — Homepage stats (50% / 166) ≠ pricing/trackrecord Free (48.4% / 3763). Verschillende tijdvensters maar UI differentieert niet → verwarring.
3. **P1** — Home-content hardcoded fallback **"64.8%"** + **"1,247"** wanneer `stats.winrate === 0` (`frontend/src/app/home-content.tsx:766, 829, 849` en `botd` fallback regel 445). Dit is exact het soort fake fallback dat de user wil uitbannen. Lijkt honest fallback (commit `f4f0ec8` "honest fallbacks") maar is het **niet** — 64.8% is niet gelabeld als hypothetisch.

---

## 5. TIER SYSTEEM INTEGRITEITSTEST

### Test 1 — Pick classificatie
Sample: Liverpool vs Paris Saint Germain (Champions League), confidence 0.6173, → API zegt `pick_tier: "free"`.
- CL ∈ LEAGUES_PLATINUM (top-5) ✓
- 0.6173 < 0.75 (platinum) ✓ niet-platinum
- 0.6173 < 0.70 (gold) ✓ niet-gold
- 0.6173 < 0.65 (silver) ✓ niet-silver
- 0.6173 ≥ 0.55, CL ∈ LEAGUES_FREE ✓ → **FREE correct** ✅

### Test 2 — Access filter Free baseline
`backend/app/core/tier_system.py:217-219`: elke user (ook Platinum) moet door `free_whitelist = Match.league_id.in_(LEAGUES_FREE)`.
`backend/app/core/tier_leagues.py:56`: `LEAGUES_FREE = LEAGUES_SILVER` (14 leagues).

**Conclusie:** Free user ziet NIET "all leagues" — alleen top-14. Dit matcht pricing `leagues_count: null` voor Free **niet** (null suggereert "onbeperkt"). ⚠ **P2 marketing-copy mismatch.**

### Test 3 — Inclusief systeem (FREE < SILVER < GOLD < PLATINUM)
Niet volledig te testen zonder admin Bearer token. Code-analyse bevestigt `access_filter()` (lines 221-244): Platinum = baseline-only, lagere tiers bouwen exclusions op. Logica is correct.

### Test 4 — Frontend/backend classifier drift
`frontend/src/lib/pick-tier.ts:14-106` is een **1:1 mirror** van `backend/app/core/tier_system.py:125-179`. UUIDs matchen, thresholds matchen, NULL-edge-case matchen. ✅ — maar **wel een drift-risico** (P2.2 uit handoff).

### Test 5 — Stripe plan → tier mapping (CRITICAL FINDING)

`backend/app/api/routes/subscriptions.py:594-601` — checkout webhook:
```python
plan_map = {
    "basic": PlanType.BASIC,  "bronze": PlanType.BASIC,
    "standard": PlanType.STANDARD, "silver": PlanType.STANDARD,
    "premium": PlanType.PREMIUM, "gold": PlanType.PREMIUM,
    "lifetime": PlanType.LIFETIME, "platinum": PlanType.LIFETIME,
}
```

`/subscriptions/status` retourneert `plan = sub.plan_type.value` = `"basic"` / `"standard"` / `"premium"` / `"lifetime"`.

`frontend/src/hooks/use-tier.ts:18-23`:
```typescript
const API_TIER_MAP: Record<string, Tier> = {
  basic: "silver",    // ← bronze wordt hier SILVER
  standard: "silver",
  premium: "gold",
  lifetime: "platinum",
};
```

**Keten:** Bronze-checkout (€0,01) → `PLAN_ALIASES["bronze"]="bronze"` → webhook opslaat als `PlanType.BASIC` → status retourneert `"basic"` → frontend `API_TIER_MAP["basic"]="silver"` → **Bronze user krijgt SILVER-tier toegang**.

Handoff §4 zegt expliciet: _"Bronze = legacy €0,01 Gold-trial SKU, GEEN pick-tier"_. Dit is **niet zo** in de code. Bronze users krijgen **Silver**-tier UI, niet Gold (ondanks "Gold-trial" naam) en niet "geen tier" (ondanks doc-claim).

**Impact:** Betalende Bronze-user krijgt misschien te weinig toegang (wil Gold, krijgt Silver) of juist te veel (moest niks krijgen, krijgt Silver). Afhankelijk van intent is dit **P0 of P1**. Als Bronze bedoeld is als Gold-trial → P0 (paywall gebroken). Als intent is "Bronze = Free" → P1 (users zien meer dan betaald).

---

## 6. STABILITEITSTEST (4 checks)

### Check 1 — Celery pipeline (code-analyse)

| Task | Interval | Queue | Laatste bewijs |
|------|----------|-------|----------------|
| `task_sync_matches` | */5 min | ingestion | matches uit 2026-04-18 staan in DB → draait |
| `task_sync_standings` | */30 min | ingestion | niet gemeten |
| `task_generate_predictions` | */10 min | forecasting | laatste pred 2026-04-17 23:27 UTC → **8u oud op auditmoment** |
| `task_daily_pipeline` | 06/12/17 UTC | ingestion | pending_count=38, period_end=2026-04-14 → **NIET up-to-date** |
| `task_weekly_report` | Mon 08:00 UTC | reports | niet gemeten |

**⚠ P1 — evaluator achter:** Finished matches van 15/16/17/18 april hebben nul predictions gekoppeld in de fixtures-results endpoint. Ofwel de backfill (v8.1 `backtest` source) is gestopt, ofwel de fixtures-endpoint-query filter is te streng. `trackrecord/summary` period_end = 14 april bewijst dat evaluaties **stilstaan op 14 april**.

### Check 2 — Database groei
Niet direct meetbaar zonder DB-access. Predictions ~19k totaal over ~27 maanden = ~700/maand. Triviaal voor Postgres.

### Check 3 — API stabiliteit
Geen 500's waargenomen in deze audit (alle endpoints 200/307/401/402). Error-handling in routes uitstekend: alle divisie-door-0 sites guarded (`trackrecord.py:137`, `betoftheday.py:236`, `strategies.py:577`). ✅

### Check 4 — Cache
Cache-keys tier-scoped: `dashboard:metrics:v2:{tier}`, `strategy:today:{id}:{tier}`. Cache-key v2-bump na Bug 1 fix voorkomt stale data. ⚠ `pricing:comparison` TTL onbekend — check nodig op `backend/app/api/routes/pricing.py`.

---

## 7. COMPLETE BUGLIJST

### P0 — MOETEN VOOR LAUNCH

**P0-1: Platinum-claim mismatch**
- Claim: 85%+ in TIER_METADATA, pricing-pagina, JSON-LD schema, pick-tier-badge fallback.
- Werkelijk: 82.3% (Wilson lower 79.5%) over 840 samples. Claim is **2.7pp te hoog**; ondergrens CI ligt **5.5pp onder** de claim.
- Marketing-oneerlijk + juridisch risico (SaaS-claim consumentenbescherming).
- **Fix-optie A:** Claim verlagen naar "80%+" in TIER_METADATA, pricing, JSON-LD, pick-tier-badge, i18n-strings.
- **Fix-optie B:** Drempel verhogen tot ≥0.80 confidence voor Platinum (kleinere sample maar waarschijnlijk 85%+).
- **Files:** `backend/app/core/tier_system.py:102`, `frontend/src/components/noct/pick-tier-badge.tsx:31`, `frontend/src/app/pricing/page.tsx:77`, i18n keys, generate-*-doc scripts.

**P0-2: Bronze-plan tier-mapping kapot / onduidelijk**
- Checkout ondersteunt `bronze`, maar mapping: bronze → `PlanType.BASIC` → `/status` zegt `"basic"` → `API_TIER_MAP["basic"] = "silver"`.
- Resultaat: **Bronze-user krijgt Silver-tier**. Handoff zegt "Bronze = GEEN pick-tier".
- Actie: bepaal intent (Gold-trial? Free? Silver?). Pas aan: OF `API_TIER_MAP`, OF een nieuwe `PlanType.BRONZE` enum met eigen tier-mapping, OF blokkeer bronze-checkout.
- **Files:** `backend/app/models/subscription.py:24-28` (enum mist BRONZE), `backend/app/api/routes/subscriptions.py:594-601` (plan_map), `frontend/src/hooks/use-tier.ts:18-23` (API_TIER_MAP).

### P1 — BINNEN 1 WEEK NA LAUNCH

**P1-1: Evaluator/backfill achterstand 4 dagen**
- Trackrecord period_end = 2026-04-14; today is 2026-04-18. Finished matches van 15-18 april zonder predictions gekoppeld.
- Actie: check Celery-beat logs op Railway voor `task_daily_pipeline` runs sinds 14 april. Check of `v81_predictions_filter` per ongeluk recente picks uitsluit.

**P1-2: Pre-match prediction coverage 3.4%**
- Van 178 upcoming matches hebben er 6 een prediction. Alle 60 matches van vandaag (2026-04-18) hebben er nul.
- Actie: verifieer dat `task_generate_predictions` daadwerkelijk de next-72h-scope pakt en niet ergens stuit op een FK-constraint of feature-build-error.

**P1-3: Homepage fake fallbacks 64.8% / 1,247**
- `frontend/src/app/home-content.tsx:766,767,829,849,445` — vaste waarden "64.8%" en "1,247" worden getoond wanneer `stats.winrate === 0`.
- Deze getallen zijn niet gelabeld als hypothetisch/simulatie.
- Fix: toon "—" of "Data syncing…" bij afwezigheid van stats, GEEN hardcoded getallen.

**P1-4: TIER_SYSTEM_ENABLED=false breekt UX**
- `backend/app/core/tier_system.py:66` default true, maar één verkeerde Railway env var → pricing/comparison retourneert 503, dashboard TierPerformanceCard hides silently.
- Frontend heeft **geen graceful fallback** (component returns null).
- Fix: expliciete "TIER SYSTEM UNAVAILABLE" banner in frontend als API 503'd.

**P1-5: `?tier=` param silent-fail voor non-admin**
- Non-admin user die `?tier=platinum` aanroept krijgt zijn eigen tier zonder signaal. Kan verwarring geven bij demo/debug.
- Fix: 403 voor non-admin met `tier` param (i.p.v. stille fallback). `backend/app/auth/tier.py:178-184`.

**P1-6: Homepage stats ≠ trackrecord stats**
- Home: 50.0% / 166 samples. Trackrecord Free: 48.4% / 3763. Verschillende vensters, zelfde "accuracy"-label.
- Fix: label op home toevoegen ("afgelopen 7 dagen", "afgelopen 166 picks") of zelfde bron gebruiken.

### P2 — BACKLOG

- **P2-1** Tier-filter chips op `/predictions` hardcoded in Engels (`predictions/page.tsx:936`).
- **P2-2** `PickTierBadge.TIER_DISPLAY` hardcoded 45/60/70/85 (drift-risk, handoff P2.1).
- **P2-3** Frontend `pick-tier.ts` is mirror van backend (handoff P2.2 — drift-risk).
- **P2-4** Pricing-content.tsx heeft nog ~50 Engels-only strings in deep-dive plans/comparisons (handoff P2.3 rest-scope, P2.4).
- **P2-5** Geen `meets_claim: bool` field in `/pricing/comparison` response → UI kan niet automatisch rood kleuren bij gap.
- **P2-6** Wilson CI niet frontend-gevalideerd (geen assertion dat `wilson_ci_lower ≤ accuracy_pct`).
- **P2-7** NULL `pick_tier` inconsistent afgehandeld (backend cast naar FREE, frontend kan null laten staan).
- **P2-8** `leagues_count: null` voor Free in pricing/comparison suggereert "alle leagues"; werkelijk = top-14 (zelfde als Silver).

### P3 — NICE TO HAVE

- **P3-1** `useTier()` heeft geen timeout op `ready` → blank scherm bij hang (handoff P3.1).
- **P3-2** `/preview-pick-tier-badge` dev-route kan weg.
- **P3-3** SIMULATION/EDUCATIONAL disclaimer niet overal consistent (wel in /fixtures JSON `disclaimer`, niet expliciet op elke frontend-page).

---

## 8. AANBEVELING

### Launch-besluit
**CONDITIONAL GO.** Launch is mogelijk zodra:
1. P0-1 (Platinum-claim) is gefikst of neergezet als "~82% actueel, ambitie 85%+" — keuze aan product.
2. P0-2 (Bronze tier-mapping) is verhelderd en gefikst; intent moet gedocumenteerd.

### Fix-volgorde (1 dag werk)
1. Platinum-claim aanpassen: `tier_system.py:102` → `"accuracy_claim": "80%+"` + sync frontend badge + pricing JSON-LD + i18n-strings. Eén commit.
2. Bronze-mapping: `API_TIER_MAP["basic"] = "free"` als Bronze = trial. OF add `"bronze"` key met juiste tier. Één commit.
3. Home-content fake fallbacks: vervang "64.8%" en "1,247" door i18n `home.awaitingData` + "—". Één commit.
4. `/fixtures/today` 0/60 predictions: run `task_generate_predictions` handmatig en check Celery logs. Ops-actie.
5. Evaluator-lag: vergelijkbaar — trigger `task_daily_pipeline` handmatig en check waarom periode niet doorloopt sinds 14 april.

### Resterende risico's bij GO
- **Klant ziet 50% accuracy op home, 48.4% op pricing, 82.3% Platinum op engine** — als Platinum claim nog 85%+ staat, ontstaat een expectation-gap die snel via reviews terugkomt.
- **Silvermarket** die Free tier noemt "alle leagues" → user zoekt Liga MX / J-League pick, krijgt niks, voelt zich misleid.
- **Celery-monitoring ontbreekt** in audit-scope. Als beat-process crasht, predictions stoppen stil en `stats.winrate=0` → homepage toont fake 64.8%.

### Monitoring plan voor eerste week live
1. **Dagelijkse check:** `/api/pricing/comparison` Platinum `accuracy_pct` blijft ≥ claim-drempel.
2. **Dagelijkse check:** `/api/trackrecord/summary` `period_end` is binnen 48u van `now()`.
3. **Dagelijkse check:** `/api/fixtures/today` count matches > 0 AND `count with prediction` > 30% van totaal.
4. **Per Stripe-event:** log `event.plan` → Subscription.plan_type → `/status.plan` keten om de Bronze/Basic/Silver verwarring te traceren.
5. **Sentry:** enable front-end error tracking; specifiek `TierPerformanceCard` null-render en `useTier()` never-resolved.

### Slotwoord
De architectuur is **solide** — tier-logica mathematisch correct, access filters consistent, plausibility-clamp intact, error-guards waarmaken. De audit vond **geen crash-class bugs** of data-leaks tussen tiers. Wat overblijft is **marketing-honesty** (Platinum-claim) en **data-pijplijn-completeness** (pre-match coverage, eval-lag). Beide zijn in minder dan een dag fixbaar. Na die fixes: vertrouwen 8/10 voor een stabiele 2-4 weken live-run; monitoring-dashboard is dan de volgende investering.
