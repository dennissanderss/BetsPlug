# BOTD Complete-Fix Sprint — Fase 1 Diagnose

**Datum:** 2026-04-21
**Scope:** Read-only onderzoek. Geen fixes in dit document.
**Bron-scan:** backend (routes, services, forecasting, core), frontend
(bet-of-the-day, predictions, trackrecord pagina's), scheduler.
**Engine v8.1:** niet aangeraakt. Geen algoritme- of feature-wijziging
voorgesteld.

Dit rapport beschrijft wat er nu daadwerkelijk gebeurt in code, met
bestand + regelnummers en gequote code waar de diagnose hangt op een
specifieke regel. Het is basis voor Fase 2 (risico-matrix) en Fase 3
(fixes).

---

## 1. Database staat — kan niet lokaal geverifieerd worden

De diagnose-prompt vraagt om match- en prediction-tellingen sinds 16 april.
Deze kan ik **niet lokaal beantwoorden** — de productie-DB draait op
Railway; de lokale container heeft alleen seed-data. Wat ik wel zie:

* Er is **geen admin diagnostic endpoint** dat dit eenvoudig rapporteert.
  `/api/admin/jobs` (admin.py) toont APScheduler-status;
  `/api/admin/league-inventory` toont sync-tellingen per league; geen van
  beide toont "predictions per dag per source" of "matches per dag per
  status".
* `/api/trackrecord/summary` (trackrecord.py regel 73) accepteert
  `?source=` maar retourneert alleen aggregaten (totaal, correct,
  accuracy), geen per-dag uitsplitsing.

**Implicatie voor Fase 3:** we kunnen niet vaststellen of Railway
echt picks mist zonder ofwel:
1. Railway `psql` toegang (handmatig SQL uitvoeren), of
2. Een nieuw `/api/admin/predictions-inventory` endpoint dat per dag
   een `{date, source, count, min_conf, max_conf, finished_matches}` rij
   oplevert.

Aan te bevelen diagnose-queries (voor handmatig draaien of nieuwe
endpoint):

```sql
-- Predictions per dag per source sinds 16 april
SELECT date_trunc('day', m.scheduled_at) AS day,
       p.prediction_source,
       COUNT(*) AS rows,
       SUM((p.predicted_at < m.scheduled_at)::int) AS strict_pre_match,
       SUM((p.predicted_at = m.scheduled_at)::int) AS exact_kickoff,
       SUM((p.predicted_at > m.scheduled_at)::int) AS post_kickoff,
       AVG(p.confidence) AS avg_conf
FROM predictions p
JOIN matches m ON m.id = p.match_id
WHERE m.scheduled_at >= '2026-04-16'
GROUP BY 1, 2
ORDER BY 1 DESC, 2;

-- Matches per dag per status sinds 16 april
SELECT date_trunc('day', scheduled_at) AS day,
       status,
       COUNT(*)
FROM matches
WHERE scheduled_at >= '2026-04-16'
GROUP BY 1, 2
ORDER BY 1 DESC;
```

---

## 2. BOTD huidige staat — selectielogica gedetailleerd

**Bestand:** `backend/app/api/routes/betoftheday.py`

### Constanten (regel 46–59)

```python
LIVE_BOTD_START      = datetime(2026, 4, 18, tzinfo=timezone.utc)
BOTD_MIN_CONFIDENCE  = 0.60   # ← BOTD gebruikt 60%, níet 70%+
CONFIDENCE_SILVER    = 0.55
CONFIDENCE_GOLD      = 0.65
CONFIDENCE_PLATINUM  = 0.75
```

De in `tier_system.py` gedefinieerde drempels zijn echter:

```python
CONF_THRESHOLD = {
    PLATINUM: 0.75, GOLD: 0.70, SILVER: 0.65, FREE: 0.55
}
```

**Observatie:** `BOTD_MIN_CONFIDENCE = 0.60` valt tussen Free (0.55) en
Silver (0.65) — het past op geen enkele tier exact. BOTD kiest dus
impliciet een "bijna-Silver maar niet echt" bucket. De docstring op regel
52–55 schat 67.4% historische accuracy (v8 walk-forward, 28838 picks),
maar dat is een walk-forward-claim voor *alle* picks ≥60%, niet voor de
enkele hoogste-confidence pick per dag.

### Selectiequery (regel 688–715) — `GET /bet-of-the-day/`

```python
base_clauses = [
    Match.scheduled_at >= window_start,      # nu → nu+72h
    Match.scheduled_at <= window_end,
    Prediction.confidence >= BOTD_MIN_CONFIDENCE,
]
stmt = (
    select(Prediction)
    .join(Match, Match.id == Prediction.match_id)
    .where(and_(*base_clauses, Prediction.prediction_source == "live"))
    .order_by(Prediction.confidence.desc(), Prediction.id)
    .limit(1)
)
```

Met fallback (regel 722–735) zonder de `live`-filter: als er geen live
pick is, wordt `backtest` geaccepteerd. Dit verklaart waarom de pagina
"Pick of the Day vandaag" kan werken terwijl het live-tracking
dashboard leeg blijft — verschillende filters, zelfde endpointfamilie.

### Live-tracking endpoint (regel 441, helper regel 462–464)

```python
require_pre_match=True,
require_live_source=True,
created_from=LIVE_BOTD_START,   # 2026-04-18
```

Drie strikte eisen:
1. `prediction_source == 'live'`
2. `predicted_at < scheduled_at` (écht pre-match)
3. `created_at >= 2026-04-18`

Een prediction die aan één van deze drie niet voldoet, telt niet mee in
de live meting — ook niet als hij qua confidence prima zou zijn.

### Model-validation endpoint (regel 336, helper regel 354–356)

```python
require_pre_match=False,
require_live_source=False,
created_from=V81_DEPLOYMENT_CUTOFF,   # 2026-04-16 11:00 UTC
```

Alle sources, alle timings, mits v8.1-gedeployed. Dit is de brede
backtest-weergave (historisch modelvalidatie).

### Sample size voor live meting

Zonder DB-toegang kan ik het niet kwantificeren, maar de frontend toont
momenteel 3 picks (22 apr / 26 apr / 27 apr — allemaal toekomst). Dat
betekent: **0 geëvalueerde live BOTDs sinds 18 april**. Met de huidige
cadans (1 BOTD per dag, 3 dagen lopend) is een betrouwbare claim van
≥70% accuracy pas mogelijk na ~30 geëvalueerde picks (n≥30 voor
approximate normal CI). Bij 1 BOTD/dag is dat ~30 dagen.

---

## 3. Backfill endpoint — silent failures + session poisoning

**Bestand:** `backend/app/api/routes/admin_backfill.py` regel 402–532.

### Try/except overzicht

| Regel | Blok | Gedrag |
|---|---|---|
| 496–503 | `for m in day_matches: try: forecast_service.generate_forecast(...)` | **Slikt** exceptions, appendt naar `errors` list. Loop gaat door met volgende match. |
| 467–471 | `UPDATE prediction_source='live'` (relabel) | **Geen** try/except. Fout propageert. Ook **geen** `db.rollback()` na fout. |
| 506–515 | `UPDATE prediction_source='live', predicted_at=...` (na fresh generate) | Zelfde: geen try/except, geen rollback. |
| 472, 516 | `await db.commit()` | Gebeurt direct na UPDATE. Als commit zelf raist — niet opgevangen. |

### Session-poison risico

SQLAlchemy-async met asyncpg: zodra een INSERT/UPDATE/commit faalt,
staat de sessie in `PendingRollbackError`-staat tot er expliciet wordt
gerolbackt. De `while cursor < today_utc:` outer-loop itereert per dag
en hergebruikt dezelfde `db` sessie (regel 407 parameter). Een enkele
fout rond relabel of fresh-generate zet alle volgende dagen op een
doodlopende sessie. Resultaat: endpoint eindigt met 500 of (erger) een
succesresponse waarin de meeste dagen stilletjes zijn overgeslagen.

Dit verklaart het gedrag dat je beschrijft ("0 dagen ingevuld, niets te
doen"): zodra dag 18 april een fout gooit en wordt overgeslagen door de
except in step 3, blijft de sessie mogelijk poisoned voor 19 en 20
april. De `0 dagen ingevuld` weergave onderscheidt geen enkele hiervan.

### generate_forecast() faalmodes

Uit `forecast_service.py` lezen: de functie retourneert óf een
`Prediction` óf raist. Ze retourneert niet `None`. De backfill op regel
497 (`if pred and pred.confidence > best_conf`) doet wel `if pred` — dat
is defensief maar in deze codepath overbodig. Belangrijker is: als
`generate_forecast` raist **binnen een specifieke match** (bijv. geen
feature-data, geen Elo-rating, geen standings voor die league), dan
wordt dat weggestopt in `errors` en niet getoond in het admin UI.

### Ontbrekende step-logging

Geen enkele `log.info(...)` in de loop — je kunt uit de Railway-logs
niet reconstrueren of een dag step 1 (skip), step 2 (relabel), of step
3 (generate) koos. Elke run is een black-box met alleen de aggregate
respons.

---

## 4. ForecastService._persist() — de live→backtest downgrade

**Bestand:** `backend/app/forecasting/forecast_service.py` regel 657–735.

### Kernlogica (regel 667–715)

```python
now = datetime.now(timezone.utc)
scheduled = match.scheduled_at

# ── Pre-match enforcement for live predictions ──
if source == "live" and scheduled and scheduled <= now:
    # Match already started — downgrade to backtest
    source = "backtest"

locked_at = now if source == "live" else None
lead_time = (scheduled - now).total_seconds() / 3600.0 if scheduled else None

prediction = Prediction(
    ...
    predicted_at=now,                  # ← altijd wall-clock nu
    prediction_source=source,          # ← evt. gedowngraded
    locked_at=locked_at,               # ← None na downgrade
    match_scheduled_at=scheduled,
    lead_time_hours=round(lead_time, 2) if lead_time is not None else None,
    ...
)
db.add(prediction)
await db.flush()
```

### Kenmerken

1. **`predicted_at` = `now()`**, niet `match.scheduled_at`. Elke
   prediction krijgt de wall-clock van het moment van genereren. Dit
   maakt "strikt pre-match" (`predicted_at < scheduled_at`) alleen waar
   als de forecast *vóór* de aftrap draaide.

2. **Downgrade-voorwaarde** (regel 672): `source == "live"` **AND**
   `scheduled_at <= now`. Staat scheduled in de toekomst → blijft "live".
   Staat hij in het verleden → gedowngraded naar "backtest".

3. **INSERT-only.** `db.add(prediction)` op regel 718 is altijd een
   nieuwe rij. Geen UPSERT. Aanroepers die hetzelfde `match.id` twee
   keer laten genereren, krijgen twee rijen.

4. **Geen eigen try/except.** Fouten in `_build_odds_snapshot`,
   `generate_explanation`, of `db.flush()` propageren naar de aanroeper.

### Bewust of bug?

Commit-historie wijst op "bewust ontwerp": de downgrade voorkomt dat
een backfill van oude wedstrijden zich als "live pre-match" voordoet —
wat een integriteitskwestie was in v6.3. Maar de bijwerking is dat
`admin_backfill.py` step 3 daardoor ook gedowngraded wordt, en
vervolgens met een tweede `sql_update(...)` teruggezet naar `live`
(regel 510). Dat maakt step 3 fragiel: als de sql_update faalt (zie
§3), blijft de pred in de DB staan als `backtest` met `locked_at=None`
en `predicted_at=now` — onbruikbaar voor de live meting, en ook niet
uit te filteren.

### Aanroepers die op deze downgrade leunen

Grep op `generate_forecast`:

* `backend/app/services/scheduler.py:176` — reguliere live-loop. Match
  is `status IN (SCHEDULED, LIVE)` en `scheduled_at >= now`, dus
  downgrade gebeurt bijna nooit (alleen bij race condition tussen
  match-start en prediction-generate).
* `backend/app/api/routes/admin_backfill.py:497` — vertrouwt op de
  downgrade → sql_update "live" compenseerpatroon.
* `backend/app/api/routes/admin.py` / `historical` / `prediction` — zie
  grep hieronder voor een volledig beeld:

```bash
grep -rn "generate_forecast" backend/app
```

---

## 5. Live-meting pipeline — APScheduler (niet Celery)

**Bestand:** `backend/app/services/scheduler.py`

### Cadans (regel 952–1115)

| Job | Trigger | Doel |
|---|---|---|
| `sync_data` | elke 6 uur | Fixtures + results + standings |
| `generate_predictions` | **elke 10 min** | Live predictions |
| `evaluate_predictions` | elke 20 min | Finished → scored |
| `sync_live_fixtures` | elke 60 sec | Live score updates |
| `sync_odds` | elke 2 uur | Odds uit The Odds API |
| `snapshot_upcoming_odds` | dagelijks 05:30 UTC | v5 odds history |
| `daily_results_sync` | dagelijks 06:00 UTC | Full results sweep |
| `historical_predictions` | elke 5 min | Backtest batch 100 |

### `job_generate_predictions` (regel 90–213) in detail

1. Selecteert matches waar `scheduled_at ∈ [now, now+7d]` en
   `status ∈ (SCHEDULED, LIVE)` (regel 134–138).
2. Filtert op "heeft nog géén `prediction_source='live'` rij" (regel
   149–154). **Niet** op confidence of tier — zodra er één live rij is,
   wordt geen tweede gegenereerd, zelfs niet als de eerste
   sub-threshold confidence had.
3. Per match: `generate_forecast(id, db, source="live")` (regel 176),
   gevolgd door `db.commit()` (regel 185). Fout → `db.rollback()` +
   `log.error(..., exc_info=True)` (regel 194–199). **Geen** `errors`
   list die aan de eindpunt wordt getoond — alleen Railway-logs.

### Chain-trigger (regel 80–85)

Na succesvolle `sync_data` met `total_created > 0` wordt
`job_generate_predictions()` direct in-process aangeroepen. Logisch,
maar: als er matches worden geïngedt die **binnen 10 minuten**
aftrappen, draait pas na `sync_data` + `generate_predictions` in één
keer hun forecast — dat kan al te laat zijn.

### Race-gevoelige grens

Match geïmporteerd met `scheduled_at = now + 8 min`:
* als chain triggert vóór aftrap → `predicted_at = now`, `scheduled_at
  = now+8min` → strikt pre-match, telt mee in live-tracking ✓
* als chain pas na aftrap → `scheduled_at <= now` → downgrade naar
  `backtest` → telt **niet** mee in live-tracking ✗

Geen buffer, geen "lock ≥ N min voor KO" threshold.

### Logs afgelopen 48 uur

Kan ik niet lokaal inzien. Commit `a06fa19` (2026-04-20) heeft
geprobeerd het "poisoned session cascade" probleem op te lossen met
per-match rollback + `exc_info=True`. Commit message noemt "unmask
forecast exceptions" — wat impliceert dat daarvóór exceptions stilletjes
werden gelogd als generieke "Prediction failed" warnings. Railway-logs
vanaf 2026-04-20 zouden nu wél tracebacks bevatten.

---

## 6. Frontend display staat

### BOTD pagina

**Bestand:** `frontend/src/app/(app)/bet-of-the-day/page.tsx` (± rootniveau)

Hits de volgende endpoints:
* `GET /api/bet-of-the-day` — vandaag's pick
* `GET /api/bet-of-the-day/history?limit=N` — historische picks
* `GET /api/bet-of-the-day/track-record` — aggregate stats
* `GET /api/bet-of-the-day/live-tracking?limit=N` — strict live meting

### Trackrecord Live-meting tab

**Bestand:** `frontend/src/app/(app)/trackrecord/page.tsx`

Laadt `BotdLiveTrackingSection`
(`frontend/src/components/ui/botd-live-tracking-section.tsx`) die fetcht
`/api/bet-of-the-day/live-tracking?limit=15`.

### Trackrecord Backtest tab

Laadt `BotdTrackRecordSection` die `/bet-of-the-day/track-record` fetcht
— **andere query, andere filter set.**

### Consistency risico

De twee secties op `/prestaties` (live + backtest) gebruiken twee
verschillende endpoints met verschillende filter-predicaten
(`require_pre_match` / `require_live_source` / `created_from`). Cijfers
kunnen legitiem uiteenlopen zonder dat de UI dat uitlegt.

### Cache

Geen `revalidate`, geen `fetchCache`, geen `Cache-Control`-headers op
de backend-routes. Next.js fetches gebruiken default (server-side geen
dedupe over requests heen). Voor het oog "fresh", geen stale-read risico
waarneembaar.

---

## 7. Voorspellingen-pagina "Vandaag" filter — tijdzone-mismatch

**Bestand:** `frontend/src/app/(app)/predictions/page.tsx`, rond regel
625–642 voor labeling; rond regel 1145–1170 voor date-navigation.

### Huidige logica

```javascript
const [y, m, d] = dateIso.split("-").map(Number);
const dt  = new Date(y, m - 1, d);   // lokale browsertijd-middernacht
const now = new Date();              // lokale browser-nu
const isToday = dt.toDateString() === now.toDateString();
```

* Tijdzone: **lokale browser-tijd**, niet UTC.
* Backend slaat `scheduled_at` op in **UTC**.
* Een match met `scheduled_at = 2026-04-21 22:30 UTC` is voor een NL
  gebruiker 2026-04-22 00:30 lokaal. "Vandaag" = 21-apr voor de user,
  maar de match ligt op 22-apr UTC → "Vandaag" toont die match
  afhankelijk van welk veld de filter gebruikt.

### Navigation

Knoppen "vorige dag / vandaag / volgende dag" via `addDays()` helper.
Geen "deze week" / "deze maand" filter aanwezig; multi-day wordt wel
elders in de pagina intern gecomputed met `Date.UTC()` (regel ~1167),
inconsistent met de lokale-tijd filter aan de top.

### Waarom de user "Vandaag toont morgen"-klacht zag

Vermoedelijke oorzaak: de filter werkt op de lokale datum maar de API
query (of omgekeerd) werkt op UTC-datum, en de set gekozen matches
omvat wedstrijden die in UTC op de volgende dag vallen. Exacte
reconstructie vereist een test in de browser met vaste tijdzone.

---

## 8. Samenvatting — wat drijft de 3 observeerbare bugs

| Symptoom | Primaire oorzaak | Secundaire oorzaak |
|---|---|---|
| Backfill "0 dagen ingevuld" | Session-poisoning + silent exception-swallow in step 3 | Missende step-logging en admin UI toont geen `error_details` |
| Live-meting blijft leeg sinds 18 apr | Fixture-ingestion < 10 min voor KO → `_persist` downgrade → `backtest` → uitgesloten door `require_live_source=True` | Scheduler kan geen "lock ≥N min voor KO" garanderen |
| BOTD-accuracy claim vs. weergave mismatch | BOTD-drempel 60% = bijna-Silver ≠ tier-labeling (Silver=65%, Gold=70%, Platinum=75%) | Fallback van `live` → `backtest` op Pick-of-the-Day vandaag endpoint verzacht het probleem maar verbloemt waar de live meting vandaan komt |
| "Vandaag" toont komende dagen | Lokale browsertijd vs UTC-scheduled_at mismatch | Geen "deze week/maand" filter als alternatief |

---

## 9. Wat Fase 1 **niet** heeft beantwoord (vereist DB-toegang)

1. Hoeveel matches zijn er werkelijk in de DB per dag sinds 16 april,
   per status?
2. Hoeveel predictions per dag per source?
3. Zijn er predictions voor 18–20 april mét confidence ≥ 0.60 die niet
   het `live`-label hebben? (Dat zou step 2 van de backfill moeten
   vangen, maar ≥60% is niet gegarandeerd beschikbaar als de batch
   liep met andere drempels.)
4. Welke excepties staan in `errors` van de laatste backfill-run?
   (Admin UI toont ze nu niet; API-response wel, maar er is geen log.)
5. Wat is de werkelijke historische BOTD-accuracy van de 60%-drempel op
   de strict-live subset? (walk-forward cijfer 67.4% is over álle picks
   ≥60%, niet per-dag enkele BOTD-keuze.)

Deze vijf data-punten bepalen fundamenteel welke fix in Fase 3 het
juiste is. Zonder ze: gokwerk.

---

## 10. Relevante bestanden (voor Fase 2/3 referentie)

```
backend/app/services/scheduler.py            # APScheduler jobs + cadans
backend/app/forecasting/forecast_service.py  # _persist downgrade
backend/app/api/routes/admin_backfill.py     # backfill endpoint
backend/app/api/routes/betoftheday.py        # BOTD selectie + live-tracking
backend/app/core/prediction_filters.py       # V81_DEPLOYMENT_CUTOFF + filters
backend/app/core/tier_system.py              # CONF_THRESHOLD per tier
backend/app/core/tier_leagues.py             # LEAGUES_FREE/SILVER/GOLD/PLATINUM

frontend/src/app/(app)/predictions/page.tsx  # "Vandaag" filter (lokale tijd)
frontend/src/app/(app)/bet-of-the-day/page.tsx
frontend/src/app/(app)/trackrecord/page.tsx
frontend/src/components/ui/botd-live-tracking-section.tsx
frontend/src/components/ui/botd-track-record-section.tsx
frontend/src/hooks/use-botd-track-record.ts
frontend/src/hooks/use-botd-history.ts
```

---

**Einde Fase 1.** Wacht op akkoord voor Fase 2 (risico-matrix).
