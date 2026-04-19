# Full System Audit — Finale Pre-Launch Deep Dive

**Datum:** 2026-04-19
**Scope:** backend + scheduler + frontend-displays, niet-engine. Werkt ondersteunend aan `docs/database_inventory.md`, `docs/filter_inventory.md`, `docs/process_flows.md`, `docs/dashboard_card_diagnosis.md`, `docs/live_tracking_diagnosis.md`, `docs/consistency_matrix.md`.

## TL;DR

Alle gevonden inconsistenties tussen dashboard / trackrecord / pricing / BOTD / live-meting zijn terug te brengen tot **drie onderliggende problemen**:

1. **P0 — Dashboard `per_tier` crasht** door een halfafgemaakte rename (`_v81` staat nog in `dashboard.py:187`; had `_track` moeten zijn). Effect: dashboard tier-kaart leeg/0 voor elke tier, ook al werkt trackrecord en pricing. *Eén regel code.*
2. **P0 — Live-meting blijft leeg** omdat APScheduler `job_generate_predictions` maar **elke 6 uur** draait (scheduler.py:843-850) en `batch_local_fill` 19.151 fixtures heeft geclaimd die nu nooit meer een `source='live'`-rij krijgen (idempotent filter). Celery Beat die elke 3 min zou draaien is dode code in prod (geen Procfile-entry). *Scheduler-config + fallback-UI.*
3. **P1 — Filter-duplicatie** tussen dashboard / trackrecord / pricing / BOTD. Dezelfde SQL-compositie staat 4× herhaald; dat is precies hoe regressie #1 kon ontstaan. Harmoniseren via shared helpers. *Geen engine-impact.*

Plus een handvol P2-items (BOTD-tab frontend, frontend pick-tier drift, scheduler-monitoring).

## 1. Database-staat samenvatting

Schema en alembic zijn in orde: 22 kolommen op `predictions` inclusief de v7 honesty-fields (`prediction_source`, `locked_at`, `match_scheduled_at`, `lead_time_hours`, `closing_odds_snapshot`). `PredictionEvaluation` is 1:1 met `Prediction` en bevat `is_correct + brier_score + log_loss`. Geen BOTD-tabel — BOTD wordt runtime berekend.

Key facts:
- `V81_DEPLOYMENT_CUTOFF = 2026-04-16 11:00 UTC` — alle user-facing aggregates filteren hier strikt op.
- Prediction-sources in code: `batch_local_fill` (eenmalige bulk, 19.151 rijen) / `backtest` (historische fill, elke 5 min) / `live` (upcoming, elke 6u).
- `LEAGUES_FREE = LEAGUES_SILVER` (top-14, 14 UUIDs). Picks buiten top-14 krijgen `pick_tier=NULL` en vallen uit elk aggregate.

Volledige inventaris + SQL-probes: `docs/database_inventory.md`.

## 2. Filter-inventaris met inconsistenties

Vijf actieve filters: `v81_predictions_filter`, `trackrecord_filter`, `access_filter`, `pick_tier_expression`, inline `live-measurement`.

Twee bronnen die **exact identiek** moeten zijn per tier:
- `/api/pricing/comparison[*].sample_size + accuracy_pct`
- `/api/trackrecord/summary.per_tier`
- (en, na fix) `/api/dashboard/metrics.per_tier`

Bron die bewust **anders** is: `/api/trackrecord/live-measurement` en `/api/bet-of-the-day/live-tracking` — strikt `<`, alleen `source='live'`, eigen cutoffs.

Bron die toevallig **anders** is (buggy): `/api/dashboard/metrics.per_tier` — crasht op `NameError _v81`.

Endpoint × filter matrix + harmonisatie-aanbevelingen: `docs/filter_inventory.md`.

## 3. Proces-flows met knelpunten

| Flow | Frequentie prod | Knelpunt |
|---|---|---|
| Fixture-ingest | 6h | 6u gap tussen insert en eerste prediction |
| Prediction-gen (live) | 6h | Cadence te laag; batch_local_fill heeft coverage al beslagen |
| Historical pred-gen (backtest) | 5m | OK |
| Evaluator | 6h | Lag van 6u voor evaluation in dashboards |
| BOTD selectie | on-request | Deterministische tiebreak ontbreekt |
| Tier-classification | on-select | Frontend mirror kan driften (P2.2) |

Details + aanbevelingen (scheduler-config, geen engine-wijziging): `docs/process_flows.md`.

**Kritische achtergrond:** Celery Beat draait NIET in prod (Procfile = `web: python start.py`). Elke "cron 3m" commit in CLAUDE.md is niet daadwerkelijk scheduled — alleen APScheduler telt.

## 4. Dashboard-kaart root cause

Eén regel Python-bug in `backend/app/api/routes/dashboard.py:187`:

```python
.where(_v81)           # ← ondefinieerd, moet _track zijn
```

Regressie uit commit `cf23773`. Maakt `/api/dashboard/metrics` een 500 voor elke TIER_SYSTEM_ENABLED-user. TierPerformanceCard toont dan loading-fallback / 0-0 afhankelijk van cache-staat.

Fix: rename `_v81 → _track`, bump cache-key naar v3, flush Redis.

Volledige analyse: `docs/dashboard_card_diagnosis.md`.

## 5. Live-meting root cause

Drie cumulatieve oorzaken:
- Generatie-cadence 6h (niet 3m zoals CLAUDE.md suggereert → Celery Beat draait niet).
- batch_local_fill heeft bijna alle 7d-upcoming fixtures al voorspeld → idempotent filter skipt ze voor live-run.
- Evaluator-lag 6h.
- + strikte `<` (niet `<=`) boundary.

Gevolg: **live-pool begint bij 0 en groeit alleen met écht nieuwe post-deploy matches**. Tot 2026-04-19 (3 dagen) verwacht: mogelijk enkele tot een paar tientallen rijen, na eval-ronde.

Fix: scheduler-config aanpassen (6h → 10m + 20m), ingestion→prediction chainen, UI-fallback "groeit dag-per-dag".

Volledige analyse: `docs/live_tracking_diagnosis.md`.

## 6. Consistency matrix

| Pair | Verwacht | Status |
|---|---|---|
| Pricing ↔ Trackrecord per_tier | gelijk | ✓ (beide gebruiken trackrecord_filter + pte) |
| Dashboard per_tier ↔ Trackrecord per_tier | gelijk | ✗ (dashboard crasht) |
| Dashboard per_tier ↔ Pricing | gelijk | ✗ (idem) |
| Live-meting ↔ Trackrecord | bewust kleiner | ✓ maar nu 0/0 — zie Fase 5 |
| BOTD live-tracking ↔ BOTD track-record | bewust kleiner | ✓ |

Getallen die DB-toegang vereisen: matrix `docs/consistency_matrix.md § 6.3` met `?`-cellen.

## 7. Prioriteit-lijst

### P0 — blokkeert launch
- **P0.1** Fix `dashboard.py:187` (`_v81` → `_track`). Eén regel. Test: `curl /api/dashboard/metrics` geeft `per_tier`-dict terug; browser-dashboard toont echte getallen voor elke tier van een Platinum-admin-override.
- **P0.2** Scheduler-cadence verhogen in `scheduler.py` (generate_predictions 6h → 10m, evaluate_predictions 6h → 20m). Klein. Geen engine.
- **P0.3** UI-fallback "Live meting groeit" zodat FREE/Silver-gebruikers niet een lege 0/0 kaart zien. Te combineren met dashboard-fix.

### P1 — voor launch-ready
- **P1.1** Shared helper extraheren (`aggregate_filter()` = trackrecord_filter + optional tier-scope). Dashboard, trackrecord, pricing, BOTD delen hem.
- **P1.2** BOTD-tab op `/trackrecord` die `/api/bet-of-the-day/track-record` hydrateert met KPI-kaartjes + per-tier breakdown + CSV download.
- **P1.3** Ingestion→prediction chaining (na sync_upcoming_matches direct generate_predictions_for_upcoming aanroepen).
- **P1.4** Consistency-pytest (`tests/consistency/test_tier_parity.py`) die dashboard/trackrecord/pricing per tier vergelijkt.

### P2 — na launch
- **P2.1** Frontend `pick-tier.ts` mirror vervangen door backend-`tier_info()` (P2.2 QA-rapport).
- **P2.2** Hardcoded accuracy % in `pricing-content.tsx` migreren naar live fetch van `/api/pricing/comparison` (P2.4 QA).
- **P2.3** Scheduler health-endpoint (`/api/admin/scheduler-status`) met laatste run per job.
- **P2.4** Celery Beat opruimen of daadwerkelijk deployen (momenteel dode code).
- **P2.5** BOTD deterministische tiebreak (secundaire `.order_by(Prediction.id)`).
- **P2.6** Cache-invalidatie: `pricing:*` pattern flush na elke live-run zodat getallen niet 5 min achter lopen.

## 8. Voorgestelde volgorde voor Fase 8 (fix sprint)

1. **Dag 1** — P0.1 (dashboard bug) + P0.2 (scheduler cadence) + P0.3 (UI fallback). Klein, geen risico, directe zichtbaarheid.
2. **Dag 1 (avond)** — P1.4 consistency test in CI. Verifieert dat P0.1 geland is + voorkomt regressie.
3. **Dag 2** — P1.1 shared helper refactor + P1.3 ingestion→prediction chain. Medium risico; behoeft pytest-run.
4. **Dag 3** — P1.2 BOTD-tab op trackrecord. Frontend-werk + backend-respons al aanwezig (`/bet-of-the-day/track-record`).
5. **Dag 3 (avond) / Dag 4** — P2-items in volgorde van omvang. P2.1 en P2.2 kunnen parallel door een frontend-collega gedaan worden.

## 9. Strikte grenzen die deze audit respecteert

- **Engine v8.1 onaangeraakt.** Geen model, features, Elo, Dixon-Coles gewijzigd.
- **Bestaande predictions in DB ongemoeid.** Geen UPDATE-scripts op de tabel — alleen nieuwe rijen via bestaande scheduler-paden.
- Alleen query-logica, filter-logica, frontend-display, scheduler-config, nieuwe endpoints, docs.

## 10. STOP — wacht op goedkeuring

Geen fixes aangebracht. Alle conclusies zijn code-analyse; cellen met `?` in de consistency-matrix vereisen DB-toegang. De snelste weg naar sign-off:

1. User draait de 5 SQL-queries uit `database_inventory.md § 4` tegen Railway DB en plakt output.
2. Ik update `consistency_matrix.md § 6.3` en bevestig dat trackrecord-per_tier == pricing-comparison.
3. User keurt P0/P1 prioriteit goed → ik start Fase 8 in separate commits per prioriteit.

Tot die goedkeuring: **geen code-wijzigingen**.
