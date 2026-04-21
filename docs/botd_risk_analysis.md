# BOTD Complete-Fix Sprint — Fase 2 Risico-analyse

**Datum:** 2026-04-21
**Basis:** `docs/botd_diagnosis.md`
**Scope:** Per voorgestelde fix — wat raakt het, wat kan breken,
rollback-pad. Engine v8.1 blijft onaangetast in elke fix.

---

## Legenda

| Kolom | Betekenis |
|---|---|
| **Impact** | Hoe groot is het effect als het werkt (L/M/H) |
| **Blast-radius** | Hoeveel andere features kunnen breken (L/M/H) |
| **Reversibel** | Is een rollback via `git revert` voldoende (ja/nee) |
| **Bewaarmoment** | Welke DB-state moet onaangetast blijven |

---

## Fix 1 — Backfill session-poisoning + transparante errors

**Impact:** H · **Blast-radius:** L · **Reversibel:** ja

### Wat wordt geraakt
- `backend/app/api/routes/admin_backfill.py` endpoint
  `POST /api/admin/botd/backfill-missed`.
- Geen andere endpoints, geen shared helpers, geen models.

### Wat kan breken
- Niets aan bestaande predictions: endpoint schrijft alleen wanneer
  gebruiker het knopje drukt.
- Frontend `BotdBackfillCard` leest `data.details` en `data.errors` —
  beide al aanwezig in response-shape, `error_details` wordt nu
  gevulder → geen breaking change.
- Nieuwe `action: "skipped_already_live"` rij in `details[]`. Als de
  admin UI alleen gekleurde badges toont per action-type, kan die
  action onbekend zijn. **Niet kritiek** — UI rendert gewoon de string.

### Regressiepreventie
- `has_live`-check filtert nu op `confidence ≥ 0.60` zodat lage-conf
  picks niet wrongly als "gedekt" gelden. Zelfde filter als BOTD
  gebruikt → consistent.
- Per-step try/except kan onverwachte errors tonen die voorheen werden
  gemaskeerd. Dat is gewenst — niet "nieuwe" errors, alleen nu zichtbaar.

### Rollback
- `git revert <commit>` → terug naar oude silent-fail gedrag.
- Geen DB-schema wijzigingen, geen data-migratie.

---

## Fix 2 — Diagnostic endpoint `/admin/predictions-inventory`

**Impact:** M (diagnose-enabler) · **Blast-radius:** L · **Reversibel:** ja

### Wat wordt geraakt
- Nieuwe route in `admin.py` of `admin_backfill.py`.
- Read-only aggregates (`COUNT`, `AVG`) over `predictions` + `matches`.
- Geen write-paden, geen cache-invalidation.

### Wat kan breken
- Query kost ~1 aggregate-scan per dag × sinds 16 april. Op een tabel
  met honderdduizenden rijen is dat sub-seconde. Verwaarloosbare DB-load.
- Authenticatie: admin-only, achter bestaande admin-dependency.

### Regressiepreventie
- Gebruik bestaande `trackrecord_filter`/`v81_predictions_filter`
  patronen voor source-classificatie, niet nieuwe logica.
- `LIMIT` op output om per ongeluk lang-gaande runs te voorkomen.

### Rollback
- Route verwijderen. Geen verdere sporen.

---

## Fix 3 — Admin card toont `error_details`

**Impact:** M · **Blast-radius:** L · **Reversibel:** ja

### Wat wordt geraakt
- `frontend/src/app/(app)/admin/page.tsx` alleen de `BotdBackfillCard`.
- TS-type in `frontend/src/lib/api.ts` al correct na vorige fix.

### Wat kan breken
- Visueel kan een lange error-lijst de card uitrekken. **Niet kritiek**
  — rendering is `flex-wrap` en scroll-safe.

### Rollback
- Component-edit terugdraaien. Geen impact buiten admin panel.

---

## Fix 4 — Live-pipeline: minder race, meer veerkracht

**Impact:** H · **Blast-radius:** M · **Reversibel:** ja (configuratie)

### Wat wordt geraakt
- `backend/app/services/scheduler.py` cadans of chain-logica.
  Voorstel: chain-trigger ook draaien na `job_sync_live_fixtures`
  (elke 60s), niet alleen na `sync_data`. OF: cadans van
  `generate_predictions` verlagen van 10 min → 5 min.

### Wat kan breken
- **5 min cadans:** dubbele belasting op feature-engineering + DB. Bij
  30 leagues × N matches per loop, DB-connecties moeten aangekund worden.
  Huidige scheduler gebruikt 1 sessie per batch → moet geverifieerd.
- **Chain na live-sync (60s):** lagere latency maar kans op overlappende
  runs. APScheduler default `max_instances=1` voorkomt dit; verifiëren.
- **API-Football rate limits:** scheduler schrijft naar DB, haalt data
  niet extern op in de generate-loop. Geen externe rate-limit-risico.

### Regressiepreventie
- Behouden: bestaande `job_sync_data` (6u) en `job_generate_predictions`
  (10 min) blijven. Alleen de drempel tussen "fixture binnen" en
  "prediction gelocked" verkleinen.
- Optie A (conservatief): buffer-veld in `_persist()` → als
  `scheduled_at - now < N min`, nog steeds toestaan als `live` zonder
  downgrade. Dit raakt echter de engine-regel. **Niet kiezen** als
  "engine niet aanraken" strikt is.
- Optie B (veiliger): in `job_generate_predictions` prioriteit geven
  aan matches die binnen 2 uur aftrappen. Voegt ORDER BY + LIMIT toe.
  Geen gedrag-wijziging, alleen volgorde. **Voorkeur.**

### Rollback
- Trigger/cadans in scheduler.py terugzetten. Geen DB-artifacts.

---

## Fix 5 — ForecastService `_persist` downgrade — NIET TORNEN

**Impact:** — · **Blast-radius:** — · **Status:** uit-scope deze sprint

### Waarom niet
- De downgrade-regel (regel 672–674) is de enige bescherming tegen
  retroactieve "live" labels bij bulk-backfill van historische runs.
- Sprint-regel: engine niet aanraken.
- Als we hem verwijderen raakt dat:
  - `admin_backfill.py` step 3 → de "backtest→live" patch-logica wordt
    dan overbodig, maar de patch staat er nog → inconsistent.
  - `job_generate_historical_predictions` (batch 100) → die schrijft
    bewust als backtest. Als `source="live"` default wordt, overschrijft
    dat per ongeluk tier-labeling in de trackrecord.
  - `integrity_relabel_sprint.md` beleid — we declareren daar dat
    alleen picks met strict pre-match timing als live tellen.

### Voorkeurspad
- Downgrade behouden. Het compenseerpatroon in `admin_backfill.py`
  (generate → UPDATE back to live) blijft zoals het is — Fix 1 maakt
  het alleen veerkrachtig tegen silent failures.

---

## Fix 6 — BOTD-selectielogica herstructureren — uit-scope deze sprint

**Impact:** H · **Blast-radius:** H · **Reversibel:** ja (alleen
query-logic) **— maar niet nu**

### Waarom niet nu
- De user-prompt vroeg de tier-gebaseerde selectie (Platinum > Gold >
  Silver > geen) op regel 3.4 van de originele sprint. De user zei
  daarna **"ga door ik wil gewoon dat bet of the day werkt"** → focus
  verschuift naar het werkend krijgen (geen picks zichtbaar). Selectie
  herstructureren lost dat probleem niet op — eerst data moeten erin
  staan.
- Tier-selectie raakt marketing-claims op pricing-pagina
  (`~82% Platinum accuracy` etc.). Moet met backtest-verificatie.

### Bewaarplaats
- Eigen sprint na deze. Afhankelijkheid: Fix 2 (inventory-endpoint)
  om werkelijke per-tier sample sizes te kennen.

---

## Fix 7 — "Vandaag" filter UTC/lokale-tijd — uit-scope deze sprint

**Impact:** M · **Blast-radius:** M · **Reversibel:** ja

### Waarom niet nu
- Lost de BOTD-werking niet direct op.
- Aparte pagina (`/predictions`), aparte component. Eigen fix na deze
  sprint, wanneer user bevestigt dat BOTD "werkt".

---

## Besluit-matrix voor deze sprint

| # | Fix | Doen nu | Waarom |
|---|---|---|---|
| 1 | Backfill hardening | ✅ | Unblockt het knopje waarmee user wél data kan vullen |
| 2 | Inventory endpoint | ✅ | Zonder deze data tast je in het donker |
| 3 | Admin error UI | ✅ | Zonder zichtbare errors geen debugging |
| 4 | Scheduler prioriteit (Optie B) | ⏳ later | Nu eerst data achterstand wegwerken |
| 5 | `_persist` aanpassen | ❌ | Engine-regel + fragiel |
| 6 | BOTD tier-selectie | ❌ | Aparte sprint, marketing-claim impact |
| 7 | "Vandaag" filter TZ | ❌ | Raakt BOTD niet direct |

---

## Rollback-plan (alle fixes in deze sprint)

1. Vercel: bij visual regressie, promote vorige deployment.
2. Railway: bij 500 op admin-endpoints, `git revert <sha> && git push`
   → automatisch redeploy.
3. DB: geen schema-wijzigingen, geen data-migraties, geen destructieve
   UPDATEs buiten admin-endpoint. Alle wijzigingen blijven binnen
   gebruiker-getriggerde acties.

**Einde Fase 2.** Doorgaan naar implementatie van fix 2 en fix 3.
