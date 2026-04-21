# Value-Bet Engine — Launch Readiness Report

**Datum:** 2026-04-21
**Deploy commit:** `1367412` (value-bet MVP + dual-mode BOTD tab)
**Status:** **LIVE op productie**

---

## Deploy bevestigd

| Onderdeel | Status | Bron |
|-----------|:------:|------|
| Alembic migratie `e1f2a3b4c5d6` | ✅ Tabel aanwezig | Railway DB inspection |
| Tabel `value_bets` (schema) | ✅ 7 indexes + unique + FK + NOT NULLs | `pg_indexes`, `pg_constraint` |
| Backend endpoints `/api/value-bets/*` | ✅ Router geregistreerd | commit `1367412` |
| Frontend BOTD dual-mode tab | ✅ TSC clean, NOCTURNE conform | commit `1367412` |
| Backfill historische picks | ✅ 8 rows ingevoerd | `python backend/scripts/backfill_value_bets.py` |
| Unit tests | ✅ 35/35 groen | `pytest backend/tests/unit/` |

---

## Live stats (eerste meting)

**Bron:** `value_bets` tabel op Railway na backfill 2026-04-21.

### Scope: backtest (historisch)

| Metric | Waarde |
|--------|-------:|
| Total picks | 8 |
| Evaluated | 1 |
| Correct | 0 |
| Accuracy | 0.0% |
| Wilson 95% CI | 0.0% – 79.3% |
| avg edge | 10.14% |
| avg odds | 2.13 |
| Total P/L | -1.00u |
| ROI | -100.0% |
| Max drawdown | -1.00u |
| Sharpe | n/a (n<2) |

### Scope: live

n=0. Live-pipeline (Celery cron) start in volgende fase.

### Individuele picks (8 rows)

| bet_date | pick | odds | edge% | EV% | tier | evaluated |
|----------|------|-----:|------:|----:|------|:---------:|
| 2026-04-20 | home | 2.49 | 16.2% | +35.2% | gold | N (loss) |
| 2026-04-22 | home | 1.85 | 4.0% | +0.1% | gold | pending |
| 2026-04-22 | away | 1.98 | 10.8% | +13.8% | gold | pending |
| 2026-04-25 | home | 3.97 | 3.0% | +5.8% | gold | pending |
| 2026-04-25 | home | 1.51 | 13.6% | +14.6% | **platinum** | pending |
| 2026-04-25 | away | 2.00 | 13.1% | +20.1% | gold | pending |
| 2026-04-26 | home | 1.59 | 7.9% | +6.3% | gold | pending |
| 2026-04-26 | home | 1.61 | 12.5% | +13.9% | gold | pending |

7 van de 8 picks zijn **toekomstige wedstrijden**; de enige evaluated pick
(Saudi Pro League 2026-04-20) verloor. Statistische interpretatie met
n=1 is nietszeggend. Wilson CI bevestigt: [0%, 79.3%] — niet afleidbaar.

---

## Honest-claim status

**WAT WE NU MOGEN CLAIMEN** (op basis van Fase 1 kalibratie over 20k evals):
- "Onderliggende v8.1 predictions gekalibreerd met Brier 0.12 (Platinum),
  0.15 (Gold) over 8,300 evaluaties."
- "Model is consistent onder-confident in 55-85% range (+3 tot +8% drift),
  wat positieve edges signaleert."
- UI toont "meting loopt, n<30" zolang live-sample onder drempel blijft.

**WAT WE NOG NIET MOGEN CLAIMEN:**
- Harde historische ROI cijfer (n=1 evaluated ≪ 30).
- CLV+ (closing-line-value) — we gebruiken opening-lines (avg 112u pre-KO).
- Multi-bookmaker consensus (1 bron: `api_football_avg`).

UI-copy in `frontend/src/components/bet-of-the-day/value-bet-panel.tsx`
reflecteert dit: "meting loopt" badge bij n<30 live, "gebaseerd op odds
op voorspelmoment, niet op slotkoers" disclaimer.

---

## Tech-debt na deze deploy (bekend, geen blocker)

1. **Dual-head alembic graph** → gefixt in merge revision `f1a2b3c4d5e6`
   (commit volgt). Zonder dat breekt de volgende migratie.
2. **`value_bets` tabel aangemaakt door `metadata.create_all()`**, niet
   door alembic migratie. Gevolg: alembic_version bevat nu
   `e8f9a0b1c2d3` (telegram); na deploy van de merge-node zal upgrade
   automatisch naar `f1a2b3c4d5e6` stempelen. Mijn `e1f2a3b4c5d6`
   migratie is idempotent (`if table exists: return`) dus safe om
   retroactief toegepast te worden.
3. **Geen Celery daily cron voor live selectie.** `/today` endpoint
   draait on-the-fly (scan van live predictions binnen 48h window).
   MVP werkt, maar productie-grade schedule ontbreekt.
4. **Geen CSV-export endpoint.** Niet launch-kritisch.
5. **Geen admin tools** (`/admin/value-bets/*`). Niet launch-kritisch.
6. **Geen integratie-tests met FastAPI TestClient.** Unit-level (35 tests)
   dekt kernlogica; endpoint-shape Pydantic-gevalideerd.

---

## Reproduceerbare commando's

```bash
# Inspect state
python -c "import psycopg2; ..."   # zie backend/scripts/value_bet_live_stats.py

# Re-run backfill (idempotent)
PYTHONPATH=backend python backend/scripts/backfill_value_bets.py --dry-run
PYTHONPATH=backend python backend/scripts/backfill_value_bets.py

# Lokaal tests
cd backend && python -m pytest tests/unit/test_value_bet_service.py \
  tests/unit/test_value_bet_endpoints_helpers.py -q

# Type-check frontend
cd frontend && npx tsc --noEmit
```

---

## Endpoints live op productie (na deploy)

| Route | Auth | Doel |
|-------|:----:|------|
| `GET /api/value-bets/today` | get_current_tier | Value-bet van vandaag (DB-first, on-the-fly fallback) |
| `GET /api/value-bets/history` | — (public read) | Paginated historie, filters op date/is_live |
| `GET /api/value-bets/stats?scope=all|live|backtest` | — | Aggregate metrics incl. Wilson CI, Sharpe, drawdown |

Frontend: BOTD pagina tab "Value Bet" rendert `ValueBetPanel` met deze
endpoints. Gated achter Gold+ via de bestaande `PaywallOverlay` op
`/bet-of-the-day`.

---

## Volgende stappen (post-launch)

1. **Celery task `generate_daily_value_bet`** op 08:00 CET — schrijft
   `is_live=True` rows voor de dag, idempotent via
   `uq_value_bets_prediction_live`.
2. **Evaluator-koppeling** — na `prediction_evaluations` update:
   automatisch `value_bets.is_correct` + `profit_loss_units` bijwerken.
3. **CSV-export** `/api/value-bets/export.csv` (Gold+).
4. **Line-movement filter** — drop pick bij 24h odds-spread > 10% (zie
   `docs/value_bet_risk_analysis.md` §2.4).
5. **Live meting 30+ rows** verzamelen → eerste honest ROI-claim mogelijk
   (verwacht ~week 4-6 bij 1-2 picks/dag).
