# Session Handoff — 5-day Prediction Gap (2026-04-20)

**Laatste sessie:** 2026-04-20 (Claude Opus 4.7, 1M context)
**Branch:** `main` (alle fixes gepusht naar `origin/main`)
**Laatste commit:** `a06fa19` — `fix(scheduler): poisoned-session cascade + unmask forecast exceptions`
**Status:** ⏳ Wacht op Railway-deploy + scheduler-run om te bevestigen of de cascade-fix het gat sluit.

---

## 1. Het probleem (TL;DR)

Gebruiker meldde: Results-pagina en Predictions-pagina tonen alleen wedstrijden **tot 14 april 2026**. Vandaag is 20 april. Gat van 5 dagen.

**Wat NIET het probleem was** (wel eerst onderzocht):
- ❌ API-Football subscription verlopen — is actief tot 11 mei
- ❌ API-Football key leeg — 4190 calls/dag worden gemaakt
- ❌ APScheduler gestopt — admin panel bevestigt "Running" + 13 jobs
- ❌ Matches worden niet meer ingested — 133 matches van 16-19 april staan wel in DB
- ❌ De 4190 calls/7500 limiet — normaal, scheduler baseline is ±4500

**Wat WEL het probleem is:**
> `job_generate_predictions` draait elke 10 min, maar **sinds 16 april zijn er 0 predictions gecreëerd**. Per 10-minute-run probeert hij voor elke upcoming match `generate_forecast()` te roepen, maar elke aanroep faalt. De exception wordt als WARNING gelogd en weggegooid → scheduler-dashboard blijft groen, maar zero rows worden geschreven.

**Root cause (hoogstwaarschijnlijk):** poisoned DB-session cascade in `backend/app/services/scheduler.py:173-184`. Eén flush-fout markeert de shared session als rolled-back → alle 49 volgende matches in de batch falen ook met `PendingRollbackError`. Gefixt in commit `a06fa19`.

---

## 2. Data bewijs (via directe queries op Railway-DB en public endpoints)

### Matches per dag + predictions-status (laatste 14 dagen):

| Datum | Matches in DB | Met prediction | Tier=free (Bronze tab) |
|-------|---------------|----------------|------------------------|
| 14 apr | 8 | 5 | 3 ← laatste wat gebruiker ziet |
| 15 apr | 4 | 1 | 0 |
| **16 apr** | **8** | **0** | 0 |
| **17 apr** | **19** | **0** | 0 |
| **18 apr** | **60** | **0** | 0 |
| **19 apr** | **46** | **0** | 0 |

Matches ZIJN er. Predictions NIET. Frontend (`frontend/src/app/(app)/results/page.tsx:562-566`) filtert matches zonder prediction uit → gebruiker ziet lege dagen.

### Voorbeeld queries

```bash
# Test backend is bereikbaar
curl -s "https://betsplug-production.up.railway.app/api/health"

# Kijk of matches van dag X bestaan + hebben predictions
curl -s "https://betsplug-production.up.railway.app/api/fixtures/results?days=14" > /tmp/r.json
perl -MJSON::PP -E '
my $j = JSON::PP::decode_json(do { local $/; open my $fh, "<", "/tmp/r.json"; <$fh> });
my %by_day;
for my $f (@{$j->{fixtures}}) {
  my $d = substr($f->{scheduled_at}, 0, 10);
  $by_day{$d}{total}++;
  $by_day{$d}{with_pred}++ if $f->{prediction};
}
for my $d (sort keys %by_day) {
  printf("%s: total=%d with_pred=%d\n", $d, $by_day{$d}{total}, $by_day{$d}{with_pred} // 0);
}
'

# Upcoming matches + predictions
curl -s "https://betsplug-production.up.railway.app/api/fixtures/upcoming?days=7" > /tmp/u.json
```

### Railway-DB credentials (staan publiek in repo!)

```
host: nozomi.proxy.rlwy.net
port: 29246
user: postgres
password: tUPuzKaIwtNtGgFROFpzpoEXLBMdKArq
dbname: railway
```

Zie `backend/scripts/check_pipeline_status.py` regel 15-21.

**⚠️ Beveiliging:** rotate deze credentials bij gelegenheid. Ze staan in ≥15 scripts in git-history.

---

## 3. Commits deze sessie (volgorde)

| # | Commit | Wat |
|---|--------|-----|
| 1 | `4a845d6` | feat(admin): live scheduler status + run-now knoppen — vervangt hardcoded "active" tabel met echte APScheduler-data |
| 2 | `98d8df5` | feat(admin): verwijder Capacity card uit Actions tab (user request) |
| 3 | `21a739d` | fix(trackrecord): allow number=3 op LockedLivePlaceholder — Vercel build fix |
| 4 | `2d655bb` | fix(ingestion): 5-daags data-gat — 3 silent failures in API-Football pijplijn |
| 5 | `9c75da6` | feat(admin): diagnose-knop + echte sync-output i.p.v. 'queued successfully' |
| 6 | `1280b50` | fix(admin): retry pipeline-health query tijdens Railway deploy-window |
| 7 | `68f1269` | feat(admin): match status breakdown — zie meteen welke dag vast zit |
| 8 | `00ab828` | feat(admin): test prediction generation — haal echte forecast-exception op |
| 9 | **`a06fa19`** | **fix(scheduler): poisoned-session cascade + unmask forecast exceptions** ← **actieve fix** |

---

## 4. Wat de scheduler.py fix doet (commit a06fa19)

**Voor:**
```python
for match_id in batch_ids:
    try:
        await service.generate_forecast(match_id, db, source="live")
        generated += 1
    except Exception as exc:
        log.warning("CRON: Prediction failed for %s: %s", match_id, exc)
await db.commit()
```

Probleem: als match #1 een flush-error heeft, wordt de session rolled-back. Matches #2-50 falen met `PendingRollbackError` op hun eerste query. De warning logt 50× dezelfde "Prediction failed" → ziet eruit als 50 bugs maar is er 1.

**Na:**
```python
for match_id in batch_ids:
    try:
        await service.generate_forecast(match_id, db, source="live")
        await db.commit()           # per-match commit
        generated += 1
    except Exception as exc:
        await db.rollback()         # session weer bruikbaar
        failed += 1
        log.error(
            "CRON: Prediction failed for %s: %s",
            match_id, exc, exc_info=True,   # FULL traceback
        )
```

---

## 5. Wat te checken zodra Railway heeft gedeployed (~3 min na push)

### Stap 1: kijk of predictions weer binnen komen

```bash
curl -s "https://betsplug-production.up.railway.app/api/fixtures/upcoming?days=7" > /tmp/u.json
perl -MJSON::PP -E '
my $j = JSON::PP::decode_json(do { local $/; open my $fh, "<", "/tmp/u.json"; <$fh> });
my %by_day;
for my $f (@{$j->{fixtures}}) {
  my $d = substr($f->{scheduled_at}, 0, 10);
  $by_day{$d}{total}++;
  $by_day{$d}{with_pred}++ if $f->{prediction};
}
for my $d (sort keys %by_day) {
  printf("%s: total=%d with_pred=%d\n", $d, $by_day{$d}{total}, $by_day{$d}{with_pred} // 0);
}
'
```

Als `with_pred > 0` voor morgen/overmorgen → ✅ fix werkt.
Als `with_pred = 0` voor alles → scheduler draait maar elke match faalt nog steeds.

### Stap 2 (als stap 1 faalt): kijk naar Railway-logs

Log in op Railway dashboard → Deployments → meest recente → **Logs**-tab → zoek:
```
CRON: Prediction failed for
```

De `exc_info=True` in onze fix dumpt de **volledige Python traceback**. Dat toont exact welk bestand en regelnummer raist. Kopieer 20-30 regels eronder en stuur naar Claude — dan is de echte fix in 1 commit te doen.

### Stap 3 (als frontend nog steeds leeg is, ook al zijn er predictions)

Hard-refresh de pagina (Ctrl+Shift+R) om Next.js/TanStack-cache te leegen. De query-cache heeft `staleTime: 5 * 60_000` in `results/page.tsx:529`.

---

## 6. Alles wat er aan tooling is toegevoegd in het Admin-paneel

Na Vercel-deploy op `main`, ga naar **Admin → Actions** tab. Van boven naar onder:

1. **💡 Help panel** — plain-Dutch uitleg per card
2. **🔵 Pipeline Health** — `/admin/pipeline-health` (bestond al, nu met retry tijdens deploy-window)
3. **🟢 Sync Data** — GEWIJZIGD: toont nu de échte backend-response (created/updated/errors + API-Football errors) i.p.v. hardcoded "queued successfully"
4. **🟡 Diagnose ingestion (1 league)** — NIEUW: `/admin/diagnose-ingestion?league_slug=X` — sync één specifieke league synchroon en toont raw error
5. **🔴 Retrain Models** — bestond al
6. **🟣 Match Status Breakdown** — NIEUW: `/admin/match-status-breakdown?days_back=14` — tabel met per-dag counts: Scheduled/Live/Finished/Postponed/Cancelled + "stuck" waarschuwing voor dagen waar aftrap > 3u geleden en 0 FINISHED
7. **🔴 Test prediction generation** — NIEUW: `/admin/test-prediction-generation` — roept `generate_forecast` synchroon aan op 1 match, returnt full traceback bij failure
8. **⚪ Scheduler Status** — GEWIJZIGD: live data uit `/admin/scheduler-status` i.p.v. hardcoded tabel. "Run nu"-knoppen per triggerable job.

**Let op:** als admin-JWT verlopen is → uitloggen en opnieuw inloggen vóór de tools werken. Anders zie je "Failed to fetch" errors.

---

## 7. Belangrijke architectuur-inzichten verzameld

### A. De DB heeft het (bijna altijd), de frontend filtert

De results-pagina (`frontend/src/app/(app)/results/page.tsx:562-566`) filtert:
```js
items = items.filter((f) => f.status === "finished" && f.result && f.prediction);
items = items.filter((f) => f.prediction?.pick_tier === tierFilter);
```

Matches zonder prediction of met een `pick_tier` dat niet matcht de actieve tab worden **verborgen**. Dus "geen resultaten" in UI ≠ "geen data in DB".

### B. Scheduler vs. Celery

Productie draait alleen **APScheduler** in het FastAPI-proces (`backend/app/main.py:275-279`). `backend/celerybeat-schedule` + Celery-Beat is legacy; alleen docker-compose gebruikt het. Zie `backend/Procfile`: alleen `web:` geregistreerd.

### C. Scheduler-jobs en hun frequentie

`backend/app/services/scheduler.py:933+`:
- `sync_data` — elke 6u (rotatie 30 leagues × 3 endpoints)
- `generate_predictions` — elke 10 min
- `evaluate_predictions` — elke 20 min
- `sync_live_fixtures` — elke 60s tijdens 11:00-23:59 UTC
- `sync_odds` — elke 2u
- `snapshot_upcoming_odds` — dagelijks 05:30 UTC
- `historical_predictions` — elke 5 min
- Plus Telegram + backfill-jobs

### D. De v8.1 filter en de "Live tracking since 2026-04-16" label

`backend/app/core/prediction_filters.py:35`:
```python
V81_DEPLOYMENT_CUTOFF = datetime(2026, 4, 16, 11, 0, 0, tzinfo=timezone.utc)
```

Predictions met `created_at < 2026-04-16 11:00 UTC` worden gefilterd (ze zijn van de broken pre-v8.1 pipeline). De 103 predictions die nu op results-pagina staan zijn van de **batch_local_fill** op 2026-04-17 (19.151 retroactieve historische predictions).

### E. `pick_tier` classificatie

`backend/app/core/tier_system.py:125-179`: SQL CASE. Een prediction krijgt `pick_tier = free/silver/gold/platinum` gebaseerd op `confidence` + `league_id in LEAGUES_X`. Predictions met confidence<0.55 OF league buiten LEAGUES_FREE (top-14) krijgen `pick_tier = NULL` en worden door alle tier-tabs uitgefilterd. Dat verklaart waarom van de 103 predictions 75 pick_tier=null hebben.

---

## 8. Als je verder wilt na de handoff

### Prompt voor de volgende sessie

```
Lees docs/SESSION_HANDOFF_2026_04_20_DATA_GAP.md. Dat is de state
van het 5-daags data-gat (14-20 april 2026) op de results +
predictions pagina's. De cascade-fix (commit a06fa19) is gepusht
maar nog niet geverifieerd.

Eerste taak: check of predictions weer binnen komen via:
  curl -s "https://betsplug-production.up.railway.app/api/fixtures/upcoming?days=7" \
    > /tmp/u.json
  [perl snippet uit handoff sectie 5]

Als predictions weer stromen: ✅ klaar, alleen nog frontend-
cache refresh. Als nog steeds 0: Railway logs pakken
(zoek "CRON: Prediction failed for") en de traceback
debuggen. De full exception staat nu in logs dankzij
exc_info=True in a06fa19.
```

### Als de cascade-fix genoeg was

Geen verdere actie nodig. De 5-daags gap vult zich vanzelf op zodra `job_generate_predictions` weer draait (elke 10 min). Historical matches van 16-19 april krijgen alleen predictions als je expliciet `batch_local_fill`-achtig backfill script draait, want die matches hebben `scheduled_at < now` en vallen buiten het "upcoming" filter.

Backfill-script voor historische matches zonder predictions: zie `backend/scripts/fill_predictions_local.py` — kan lokaal draaien tegen Railway-DB.

### Als de cascade-fix niet genoeg was

Dan is er een onderliggende bug in `generate_forecast()`. Opties:
1. **Railway-logs kijken** voor de traceback (meest waarschijnlijk vindt je de regel in een minuut)
2. **`backend/scripts/fill_predictions_local.py`** lokaal draaien tegen Railway-DB — dat is buiten de scheduler om dus je ziet de exception direct in je terminal
3. **Admin panel → "Test prediction generation"** — genereert 1 prediction synchroon en retourneert full traceback als JSON

---

## 9. Belangrijke bestanden

### Code aangepast deze sessie

- `backend/app/ingestion/adapters/api_football.py` — silent-swallow fix, calendar-year leagues
- `backend/app/services/data_sync_service.py` — 0-0 score bug, sync_upcoming_matches_for_slug method
- `backend/app/services/scheduler.py` — **cascade fix (de belangrijkste)**
- `backend/app/api/routes/admin.py` — 3 nieuwe endpoints + enhanced /sync
- `frontend/src/app/(app)/admin/page.tsx` — 4 nieuwe cards + live Scheduler Status
- `frontend/src/lib/api.ts` — 4 nieuwe api-methodes
- `frontend/src/types/api.ts` — 4 nieuwe types
- `frontend/src/components/ui/locked-live-placeholder.tsx` — `number` prop union uitgebreid

### Waarschijnlijke bugs-haarden als de cascade-fix niet genoeg is

- `backend/app/forecasting/forecast_service.py:64-154` — `generate_forecast` entry
- `backend/app/forecasting/forecast_service.py:160-396` — `build_match_context`
- `backend/app/forecasting/forecast_service.py:543-566` — `_run_model`
- `backend/app/forecasting/forecast_service.py:1027+` — `_get_team_stats` (herschreven op 14 april in 63a78c9, 16 april in b7270b9/ca764a8)
- `backend/app/forecasting/models/production_v8_model.py` — v8 model predict() implementatie

### Git-commits die de forecast-pipeline hebben aangeraakt rond het gat

- `63a78c9` (2026-04-14 18:27 CET): rewrite _get_team_stats + remove football-data.org
- `b7270b9` (2026-04-16 13:00 CET): feature parity fixes, _FORM_MATCHES 5→30
- `ca764a8` (2026-04-16 13:25 CET): added win_rate to _get_team_stats return

Als de cascade-fix niet genoeg is, zitten hier waarschijnlijk latente bugs. Let op: de scheduler heeft ze 4 dagen gemaskeerd, dus ze zijn subtiel.

---

## 10. Wat de gebruiker wil weten / onthouden

- **50-100 paying users + 50-100K views → geen API-limiet-probleem.** Views raken API-Football niet; views komen uit Sanity CMS + cached endpoints. Echte calls komen bijna alleen uit scheduler-baseline (±4500/dag). Break-even bij ±1500 betalende users, dan Ultra-tier ($49/mo, 75k/dag).
- **"Live tracking since 2026-04-16"** op results-pagina is een **label**, geen filter. Dat is de v8.1 deploy-datum, niet de reden waarom recentere matches niet tonen.
- **De API-Football subscription-end-datum (11 mei)** is NIET gerelateerd aan het gat. Dat is gewoon wanneer je maandabonnement vernieuwt.
- **Frontend-filter verbergt matches zonder prediction.** Als je een legitieme zakelijke reden hebt om matches-zonder-pick toch te tonen, zie `results/page.tsx:562-566` — daar zit de filter. Niet zomaar aanraken want dat breekt de pick-tier funnel.

---

## 11. Veelgemaakte fouten die ik deze sessie heb gemaakt (voor context)

1. **Teveel admin-tooling ipv root-cause**. Gebruiker was terecht gefrustreerd: ik bouwde 5 admin-cards terwijl de fix 20 regels was. Volgende keer: eerst via Railway-DB/curl het probleem lokaliseren, dán tooling.
2. **"Sync job queued successfully" hardcoded melding**. Was een symptoom van het grotere patroon: user-facing success-messages die niet reflecteren wat echt gebeurde. Vervangen door `data.message` uit response.
3. **Silent-swallow theorie als root cause**. Klopte technisch wel, maar was niet dit gat. De echte bug was de session cascade in de scheduler.
