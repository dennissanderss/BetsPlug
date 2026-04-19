# Database Inventory — Deep Audit Fase 1

**Datum:** 2026-04-19
**Status:** inventaris van schema + alle queries waar de user zelf DB-getallen mee kan ophalen. Geen fixes.

## 1. Tabellen-overzicht (kerntabellen)

Uit `backend/app/models/` (zie ook de agent-samenvatting):

| Tabel | Bron | Doel |
|---|---|---|
| `predictions` | `models/prediction.py:19-87` | Kern-forecast-records (immutable). 22 kolommen incl. honesty-fields. |
| `prediction_evaluations` | `models/prediction.py:104-123` | 1-op-1 met prediction, bevat `is_correct`, `brier_score`, `log_loss`, `actual_outcome`. |
| `matches` | `models/match.py:30-71` | Fixtures met `status ∈ MatchStatus`, `scheduled_at`, `league_id`. |
| `match_results` | `models/match.py:74-89` | 1-op-1 met match; scores + winner. |
| `model_versions` | `models/model_version.py` | Metadata van elke getrainde versie; `is_active`. |
| `leagues`, `teams`, `sports`, `seasons` | idem | Standaard taxonomie. |
| `odds_history` | `models/odds.py` | Per match/bookmaker/market (1X2, O/U, BTTS). |
| `strategies`, `prediction_strategies` | `models/strategy.py` | Staking-regels (niet direct voor trackrecord). |
| `users`, `subscriptions` | — | Auth + tier-mapping (`BASIC→SILVER`, `GOLD`, `PLATINUM`, else `FREE`). |

**Géén BOTD-tabel.** Pick-of-the-Day wordt runtime berekend in `/api/bet-of-the-day` (`betoftheday.py`). Zie Fase 3.

## 2. Prediction-kolommen die je vaak nodig hebt

| Kolom | Type | Bron-bestand | Relevant voor |
|---|---|---|---|
| `predicted_at` | DateTime tz, NOT NULL | `prediction.py` | Pre-match lock check (`< scheduled_at`) |
| `created_at` | DateTime tz | TimestampMixin | v8.1 deploy-cutoff filter |
| `prediction_source` | String(20), NULLABLE | `prediction.py` | Filter `batch_local_fill / backtest / live` |
| `confidence` | Float, NOT NULL | `prediction.py` | Tier-classificatie |
| `match_id` | FK matches | `prediction.py` | JOIN voor `league_id`, `scheduled_at` |
| `locked_at` | DateTime tz, NULL | `prediction.py` | Bewijs-timestamp voor live-picks |
| `lead_time_hours` | Float, NULL | `prediction.py` | Afgeleid (scheduled − now) |

`MatchStatus`-enum waarden: `SCHEDULED | LIVE | FINISHED | POSTPONED | CANCELLED` (`match.py:22-27`).

## 3. Alembic — 10 meest recente

Uit `backend/alembic/versions/` (agent-output, chronologisch oudste→nieuwste):
`239b393c2b2b` initial schema → `a1b2…` subscriptions → `b2c3d4e5f6a7` auth-kolommen + manual_expense → `b3c4d5e6f7g8` abandoned checkout → `c5d6…` v5-merge (elo_history, stats, api_usage) → `c6e8…` odds O/U/BTTS force-add → **`d7e8f9a0b1c2`** (2026-04-13, honesty-fields voor predictions: `prediction_source`, `locked_at`, `match_scheduled_at`, `lead_time_hours`, `closing_odds_snapshot`).

## 4. Canonieke runtime queries (draai zelf tegen Railway DB)

### 4.1 Totalen + per prediction_source

```sql
SELECT prediction_source, COUNT(*),
       MIN(created_at) AS first_created, MAX(created_at) AS last_created
FROM predictions
GROUP BY prediction_source
ORDER BY 2 DESC;
```

Verwachte waarden op basis van code:
- `batch_local_fill` ≈ 19.151 (zie `scripts/verify_accuracy_numbers.py:86`).
- `backtest` → groeit elke 5 min via `job_generate_historical_predictions` (`source="backtest"`, `scheduler.py:521`).
- `live` → alleen nieuwe upcoming matches na deploy, elke **6 uur** via `job_generate_predictions` (`scheduler.py:156, 843-850`).
- `NULL` → alles vóór migratie `d7e8f9a0b1c2` (zijn via UPDATE ingevuld als `'backtest'`, zie `d7e8f…:54`).

### 4.2 Predicted_at vs scheduled_at

```sql
SELECT
  COUNT(*) FILTER (WHERE p.predicted_at <  m.scheduled_at) AS strict_pre_match,
  COUNT(*) FILTER (WHERE p.predicted_at =  m.scheduled_at) AS exact_same,
  COUNT(*) FILTER (WHERE p.predicted_at >  m.scheduled_at) AS post_kickoff,
  COUNT(*) FILTER (WHERE p.predicted_at IS NULL)           AS null_predicted_at
FROM predictions p
JOIN matches m ON m.id = p.match_id;
```

Code-invariant: `_persist()` stampt `predicted_at=now` op aanmaakmoment (`forecast_service.py:690`). Voor live-picks geldt ook `source="live"` + geen auto-downgrade, dus `now < scheduled_at`. Voor batch/backtest is `now` meestal ná `scheduled_at` → `trackrecord_filter()` (`prediction_filters.py:88-92`) kantelt op `<=` om gelijke timestamps (batch-default: `predicted_at := scheduled_at`) mee te nemen. **14 rijen** zijn volgens de docstring (`prediction_filters.py:70-78`) 3-27 dagen ná kickoff en worden uitgesloten.

### 4.3 Bucket-verdeling pre-match lead time

```sql
SELECT
  CASE
    WHEN diff_min < 5       THEN '<5min'
    WHEN diff_min < 60      THEN '5-60min'
    WHEN diff_min < 720     THEN '1-12hr'
    WHEN diff_min < 1440    THEN '12-24hr'
    ELSE                         '>24hr'
  END AS bucket,
  COUNT(*)
FROM (
  SELECT EXTRACT(EPOCH FROM (m.scheduled_at - p.predicted_at))/60 AS diff_min
  FROM predictions p JOIN matches m ON m.id = p.match_id
  WHERE p.predicted_at < m.scheduled_at
) t
GROUP BY 1 ORDER BY 1;
```

Verwachting: de meeste strict-pre-match picks zitten in `1-12hr` (APScheduler draait elke 6u; upcoming = 7d window). Kleine `<5min`-bucket = random in-cycle timing.

### 4.4 Evaluaties coverage

```sql
-- Finished matches die een prediction hebben
SELECT COUNT(*) AS finished_with_pred
FROM predictions p JOIN matches m ON m.id = p.match_id
WHERE m.status = 'FINISHED';

-- Evaluaties totaal
SELECT COUNT(*) AS total_evaluated,
       COUNT(*) FILTER (WHERE is_correct) AS correct
FROM prediction_evaluations;
```

Evaluator draait elke **6 uur** (`scheduler.py:853-860`) én als stap 3 van de daily pipeline (06:00/12:00/17:00 UTC, `celery_app.py` — NB: celery beat draait niet in prod; zie Fase 3). Lag na kickoff is dus tot ±6u.

### 4.5 Per-tier via pick_tier_expression (matcht `pricing:comparison`)

```sql
SELECT
  CASE
    WHEN m.league_id IN (<LEAGUES_PLATINUM>) AND p.confidence >= 0.75 THEN 'platinum'
    WHEN m.league_id IN (<LEAGUES_GOLD>)     AND p.confidence >= 0.70 THEN 'gold'
    WHEN m.league_id IN (<LEAGUES_SILVER>)   AND p.confidence >= 0.65 THEN 'silver'
    WHEN m.league_id IN (<LEAGUES_FREE>)     AND p.confidence >= 0.55 THEN 'free'
    ELSE NULL
  END AS tier,
  COUNT(pe.id) AS total,
  COUNT(pe.id) FILTER (WHERE pe.is_correct) AS correct
FROM predictions p
JOIN matches m ON m.id = p.match_id
JOIN prediction_evaluations pe ON pe.prediction_id = p.id
WHERE p.prediction_source IN ('batch_local_fill','backtest','live')
  AND p.created_at >= '2026-04-16 11:00:00+00'
  AND p.predicted_at <= m.scheduled_at
GROUP BY 1;
```

UUIDs: `backend/app/core/tier_leagues.py`. Dit is exact wat `/trackrecord/summary.per_tier` én `/pricing/comparison.accuracy_pct` berekenen.

### 4.6 Matches upcoming — met/zonder prediction

```sql
SELECT
  COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM predictions p WHERE p.match_id = m.id)) AS with_pred,
  COUNT(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM predictions p WHERE p.match_id = m.id)) AS without_pred
FROM matches m
WHERE m.status = 'SCHEDULED' AND m.scheduled_at > NOW();
```

APScheduler slaat rijen over waar al een prediction bestaat (`data_sync_service.py:695-699`). Na een "batch_local_fill" run zal `with_pred` heel hoog zijn en `live`-rijen alleen komen op echt nieuwe fixtures.

### 4.7 BOTD — historische selectie

BOTD is runtime-berekend in `betoftheday.py`. Reconstructie-query:

```sql
SELECT DATE(m.scheduled_at AT TIME ZONE 'UTC') AS match_day,
       p.id AS prediction_id,
       p.confidence,
       p.prediction_source
FROM predictions p
JOIN matches m ON m.id = p.match_id
WHERE p.confidence >= 0.60
  AND p.created_at >= '2026-04-16 11:00:00+00'
  AND p.prediction_source IN ('batch_local_fill','backtest','live')
  AND p.predicted_at <= m.scheduled_at
ORDER BY match_day, p.confidence DESC;
```

BOTD per dag = `DISTINCT ON (match_day)` met hoogste `confidence`. Conflicten (gelijke confidence) worden niet deterministisch afgehandeld — `ORDER BY` stopt bij `confidence DESC`, de DB kiest willekeurig.

## 5. Openstaande vragen die DB-toegang vereisen

1. Hoeveel rijen heeft `predictions` vandaag echt? (zie query 4.1)
2. Hoeveel unieke `prediction_source='live'`-rijen met `predicted_at < scheduled_at` sinds 2026-04-16 11:00? (zie Fase 5 query)
3. Hoeveel `prediction_evaluations` zijn gekoppeld aan `source='live'` rijen?
4. Zijn er picks met `confidence >= 0.55` waar `pick_tier_expression()` NULL teruggeeft (bv match waarvan `league_id` niet in `LEAGUES_FREE`)? → Na v8.3 zouden dit er 0 moeten zijn want `LEAGUES_FREE = LEAGUES_SILVER`.

Deze getallen zijn nodig om de consistency-matrix (Fase 6) definitief dicht te spijkeren.
