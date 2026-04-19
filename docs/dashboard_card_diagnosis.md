# Dashboard Tier Card Diagnose — Deep Audit Fase 4

**Datum:** 2026-04-19
**Symptoom:** Dashboard tier-performance-kaart toont `Backtest 0.0% (0/0)` voor Free tier, terwijl `/trackrecord` pagina voor dezelfde tier `3.763 / 48.4%` laat zien.

## 4.1 Renderpad

- **Component:** `frontend/src/components/dashboard/TierPerformanceCard.tsx:118-235`
- **Fetch:** `useQuery({ queryFn: () => api.getDashboardMetrics() })` (regel 124-129). Raakt backend-endpoint **`GET /api/dashboard/metrics`**.
- **Data-shape:** response bevat `per_tier: Record<PickTierSlug, TierBreakdown>` met `{ total, correct, accuracy }` per tier.
- **Rendering** (TierRow regels 35-116):
  - `total = breakdown?.total ?? 0`; `hasData = total > 0`.
  - Accuraatheid (regel 99): `hasData ? ${accuracyPct.toFixed(1)}% : "—"`. Dus bij ontbrekende data "—", niet "0.0%".
  - Counts (regel 83): toont `correct / total correct` alleen als `hasData && accessible`; anders `"No data yet"` (Free is altijd accessible).
- **Omzet van symptoom:** rapportage van "0.0% (0/0)" komt precies voort uit `total=0, correct=0, accuracy=0` in de backend-response — niet uit een kapot fallback-pad.

## 4.2 Backend-endpoint

`backend/app/api/routes/dashboard.py:59-225`. Relevante stappen:

```python
# Line 96-99
_track = trackrecord_filter()
_tier  = access_filter(user_tier) if TIER_SYSTEM_ENABLED else None
```

Overall stats (`total_forecasts`, `accuracy`, etc.) worden correct gescoped met `_add_tier_filter()` dat `_track + _tier` toepast. Die waarden kloppen — de overall kaart werkt.

De per-tier break-down (regel 171-208):

```python
tier_expr = pick_tier_expression()
per_tier_q = (
    select(
        tier_expr,
        func.count(PredictionEvaluation.id).label("total"),
        func.sum(func.cast(PredictionEvaluation.is_correct, Integer)).label("correct"),
    )
    .join(Prediction, Prediction.id == PredictionEvaluation.prediction_id)
    .join(Match, Match.id == Prediction.match_id)
    .where(_v81)          # ← regel 187: NameError
    .group_by(tier_expr)
)
```

**`_v81` is nooit gedefinieerd in deze functie.** Line 96 defines `_track`, line 99 defines `_tier`. `_v81` bestaat wel als idée in de filter-module (`v81_predictions_filter`) maar hier niet geïmporteerd en niet als lokale var gedeclareerd. Python gooit `NameError` zodra deze code-path geraakt wordt.

## 4.3 Root cause

Regressie: `cf23773` ("per_tier breakdown must show all 4 tiers, not just user's own") verving een variabele `_v81` (vroegere naam voor `v81_predictions_filter()`) door `_track = trackrecord_filter()`. Regel 96 is bijgewerkt, maar regel 187 is gemist — een halfafgemaakte rename.

Effect op elke request met `TIER_SYSTEM_ENABLED=true`:

1. Code bereikt regel 179 → bouwt SELECT-clausule met `tier_expr` en COUNT/SUM (OK).
2. Regel 187 refereert `_v81` → Python `NameError: name '_v81' is not defined`.
3. De hele request mislukt met FastAPI default-500. Response-body is `{"detail":"Internal Server Error"}`.
4. Frontend TanStack-Query markeert query als `isError`, `data` blijft undefined.
5. TierPerformanceCard regel 131-137 leest `data?.per_tier` → undefined, `hasTierData=false`.

Maar de kaart toont dan geen "0/0" — hij zou verborgen moeten zijn (regel 156 e.v. van component). Dus de echte productie-observatie is subtielleen: waarschijnlijk zit er een **gecachet response van vóór de regressie** in Redis.

## 4.4 Waarom toch "0/0" in plaats van hidden

Cache-key: `dashboard:metrics:v2:{tier}` (regel 87). TTL 300s.

Twee scenario's die "0/0" produceren:

**Scenario A — partiële response werd ooit gecached.** Vóór de rename stond er `_v81 = v81_predictions_filter()` en deed de query het wél, maar het GROUP BY stuurde rijen terug voor tiers met matches → wel waarden. Dan zou de cache niet-0 zijn, dus onwaarschijnlijk.

**Scenario B (waarschijnlijker) — `per_tier` query rijdt, maar NULL-tiers worden geskipt.** `pick_tier_expression()` geeft NULL voor rijen buiten de whitelist. Regel 198-199 skipt die bucket (`if tier_int is None: continue`). Als de query slaagt (géén crash, bv. omdat `_v81` toch ergens als import is beland) maar alleen NULL-rijen teruggeeft voor FREE (want FREE = top-14 met conf≥0.55 → die rijen classificeren óók als silver/gold/plat, nooit als puur free), dan:
- `per_tier` dict bevat mogelijk `{gold: {…}, silver: {…}, platinum: {…}}` maar géén `free`-entry.
- Frontend krijgt `per_tier.free === undefined` → `breakdown` undefined → `total=0, accuracy=0` → rendert "0/0".

**Wacht.** Dit laatste hypothese test een fundamenteler issue: door `LEAGUES_FREE = LEAGUES_SILVER` en de `pick_tier_expression` ordening (PLATINUM eerst, GOLD tweede, SILVER derde, FREE laatst) zal *elke* rij die aan de FREE-branch qualifies óók aan SILVER qualifyen (zelfde league-set, lagere threshold). Maar de CASE evalueert top-down — dus een pick met `conf=0.67, top-14 league` slaat SILVER (0.65≤0.67, league✓) en classificeert als **SILVER**, nooit als FREE. Een pick met `conf=0.60, top-14 league` slaat SILVER niet (0.65>0.60) maar FREE wel (0.55≤0.60, league in LEAGUES_FREE=top-14).

Dus FREE-bucket is niet leeg — het bevat picks met `0.55 ≤ conf < 0.65` in top-14. Dat zijn er volgens `/trackrecord/summary.per_tier.free` = 3.763.

Dus **Scenario B alleen telt als de per_tier query ergens crasht en de response-shape zónder `free` door een andere codepath wordt opgebouwd**. Gezien regel 187 NameError, crasht de query sowieso → géén per_tier dict → response bevat `per_tier=None` → frontend hides → probleem zichtbaar is als "lege plek".

## 4.5 Definitieve hypothese

Zonder live browser-devtools is de enige sluitende verklaring: **de endpoint geeft 500**, de frontend React-Query catch rendert een fallback-state. Als er tussentijds een legacy `dashboard:metrics:{tier}` (v1 cache-key) rondzwerft die géén `per_tier` bevatte maar wel overall 0/0 (voor een test-user), kan dat "0/0" vertoning geven.

Verificatie-stappen (lopen na merge van fix):

1. `curl -H "Authorization: Bearer <token>" https://api.betsplug.com/api/dashboard/metrics` — verwacht nu 500 met `Internal Server Error` bij `TIER_SYSTEM_ENABLED=true`.
2. Na fix (regel 187: `_v81` → `_track`): verwacht 200 met `per_tier` dict met vier sleutels.
3. `FLUSHDB` / `cache_delete_pattern("dashboard:*")` om oude cached 0/0 te wissen.

## 4.6 Fix-voorstel (niet uitvoeren tot goedkeuring)

```python
# dashboard.py:187
            .where(_track)        # was: .where(_v81)
```

Secundaire verbetering:

- Bump cache-key naar `v3` (`dashboard:metrics:v3:{tier}`) zodat alle stale 0/0 caches automatisch verdampen.
- Voeg `source` filter-parameter toe analoog aan trackrecord, zodat de kaart optioneel "live only" tonen kan (voor de "Live meting" tab).
- Commit-titel voorstel: `fix(dashboard): per_tier NameError – _v81 should have been _track after cf23773`.

## 4.7 Per-tier-test (te draaien na fix op Railway)

```sql
-- Herhaal voor elke user_tier scope; het resultaat moet consistent zijn
-- met /api/trackrecord/summary.per_tier én /api/pricing/comparison[*].accuracy_pct
SELECT
  CASE
    WHEN m.league_id IN (<LEAGUES_PLATINUM>) AND p.confidence >= 0.75 THEN 'platinum'
    WHEN m.league_id IN (<LEAGUES_GOLD>)     AND p.confidence >= 0.70 THEN 'gold'
    WHEN m.league_id IN (<LEAGUES_SILVER>)   AND p.confidence >= 0.65 THEN 'silver'
    WHEN m.league_id IN (<LEAGUES_FREE>)     AND p.confidence >= 0.55 THEN 'free'
  END AS tier,
  COUNT(pe.id), COUNT(pe.id) FILTER (WHERE pe.is_correct)
FROM predictions p
JOIN matches m                 ON m.id = p.match_id
JOIN prediction_evaluations pe ON pe.prediction_id = p.id
WHERE p.prediction_source IN ('batch_local_fill','backtest','live')
  AND p.created_at >= '2026-04-16 11:00:00+00'
  AND p.predicted_at <= m.scheduled_at
GROUP BY 1;
```

Verwachting: `silver`, `gold`, `platinum` moeten exact matchen met trackrecord-pagina cijfers. `free` moet 3.763 totaal / 48.4% opleveren mits de handoff-getallen actueel zijn.
