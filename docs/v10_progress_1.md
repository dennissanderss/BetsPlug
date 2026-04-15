# V10 Progress — Step 1: Engine Capabilities

Datum: 15 april 2026

---

## 1A — Database structuur

### Tabellen (41 totaal) — gesorteerd naar relevantie

| Tabel | Rijen | Functie |
|-------|:-----:|---------|
| **predictions** | 26,620 | Elke voorspelling met confidence, home/draw/away probs |
| **prediction_evaluations** | 26,411 | Of voorspelling correct was + Brier/log-loss |
| **prediction_explanations** | 26,620 | Uitleg (leeg: `top_factors_for: {}`) — **NIET GEVULD** |
| **matches** | 43,742 | Alle wedstrijden (finished + scheduled) |
| **match_results** | 43,256 | Eindstand per finished match |
| **team_elo_history** | 12,418 | Walked-forward Elo snapshots per team per datum |
| **odds_history** | 2,529 | 843 1x2, 843 over/under, 843 btts (3.2% coverage!) |
| **leagues** | 29 | 30e league ontbreekt in DB (Conference League?) |
| **teams** | 1,128 | Over 30 competities, 5.5 jaar |
| **seasons** | 150 | Per league × seizoen |
| **standings_snapshots** | 2,031 | Daggebonden league table |
| **strategies** | 14 | 14 strategieën, **alle is_active=false** |
| **match_statistics** | 818 | Schoten, balbezit etc. — **schaars gevuld** (2%) |
| **top_scorers** | 120 | Topscorers per league/seizoen — **schaars gevuld** |
| **model_versions** | 1 | BetsPlug Ensemble v8 (actief) |
| **users** | 3 | Slechts 3 users in productie |
| **subscriptions** | 0 | Geen subscription data |
| **generated_reports** | 13 | Rapporten-feature is in gebruik |
| **injuries, players, player_stats** | 0 | Leeg — **NIET GEBRUIKT** |
| **blog_posts, coupons, payments** | 0 | Leeg |

### Kolommen `predictions` (belangrijkste)

```
id, match_id, model_version_id
home_win_prob, draw_prob, away_win_prob (3-way kansen)
confidence (max van de drie probs)
predicted_home_score, predicted_away_score (Poisson goals)
features_snapshot (jsonb — 39 features die model gebruikte)
raw_output (jsonb — ruwe submodel outputs)
prediction_source ('live' | 'backtest')
locked_at (timestamp wanneer pre-match vastgezet)
lead_time_hours (uren voor kickoff)
closing_odds_snapshot (jsonb — bookmaker odds bij lock)
```

### Kolommen `odds_history`
```
match_id, source, market ('1x2', 'over_under_2_5', 'btts')
home_odds, draw_odds, away_odds
over_odds, under_odds, total_line
btts_yes_odds, btts_no_odds
```

---

## 1B — Backend endpoints (user-facing)

| Route | Endpoints |
|-------|-----------|
| **`/api/botd`** | `/`, `/history`, `/track-record` |
| **`/api/trackrecord`** | `/summary`, `/segments`, `/calibration`, `/export.csv` |
| **`/api/predictions`** | `/`, `/{id}`, `/run` |
| **`/api/fixtures`** | `/upcoming`, `/live`, `/today`, `/results`, `/results/weekly-summary` |
| **`/api/dashboard`** | `/metrics` |
| **`/api/strategies`** | `/`, `/{id}`, `/{id}/picks`, `/{id}/today-picks`, `/{id}/metrics`, `/{id}/walk-forward`, `/all/walk-forward`, `/validation-refresh-v2` |
| **`/api/reports`** | `/generate`, `/`, `/{id}`, `/{id}/download` |
| **`/api/backtests`** | `/run`, `/`, `/{id}` |
| **`/api/homepage`** | home page aggregates |
| **`/api/models`** | model version info |
| **`/api/matches, /teams, /leagues, /search`** | directory browsing |
| **`/api/live`** | live scores |
| **`/api/odds`** | bookmaker odds (schaars) |

### Admin-endpoints (apart)
`admin`, `admin_v5`, `admin_backfill`, `admin_users`, `admin_blog`, `admin_finance`, `admin_notes`, `admin_seo`, `admin_settings`, `admin_api_usage`, `admin_research`, `admin_cleanup`, `subscription_gate`, `subscriptions`, `checkout_sessions`, `auth`, `health`.

---

## 1C — Confidence Tier Implementatie

**Locatie:** `backend/app/api/routes/betoftheday.py` lines 30-37

```python
BOTD_MIN_CONFIDENCE = 0.60       # BOTD threshold
CONFIDENCE_SILVER = 0.55         # Silver tier: 63.0% accuracy
CONFIDENCE_GOLD = 0.65           # Gold tier:   70.6% accuracy
CONFIDENCE_PLATINUM = 0.75       # Premium:     78.2% accuracy
```

**Active model:** `BetsPlug Ensemble v8 v8.0.0` met weights:
```json
{"elo": 1.2, "logistic": 2.0, "xgboost": 1.0, "poisson": 0.3}
```

**Endpoints die tiers gebruiken:** Alleen `BOTD_MIN_CONFIDENCE` is actief in `betoftheday.py`. De constants `CONFIDENCE_SILVER`, `CONFIDENCE_GOLD`, `CONFIDENCE_PLATINUM` zijn **gedefinieerd maar nergens gebruikt** in endpoints. Geen filtering op tiers in de UI.

**Frontend tier mapping:** te verifiëren met eigenaar — bestaat mogelijk in sidebar/subscription gates maar niet in de endpoints zelf.

---

## 🚨 KRITIEKE BEVINDING: Productie ≠ Walk-forward resultaten

Walk-forward validation rapport in `V8_ENGINE_REPORT.md` toont:
- BOTD ≥60%: **67.4% accuracy** (6,060 picks)
- Gold ≥65%: **70.6%** (3,942 picks)
- Platinum ≥75%: **78.2%** (1,497 picks)

**Maar in productie database:**
- Silver ≥55%: 14,822 picks, **43.27% accuracy**
- BOTD ≥60%: 4,111 picks, **42.42% accuracy**
- Gold ≥65%: **0 picks** (model geeft nooit 65%+)
- Platinum ≥75%: **0 picks**

**Confidence distribution productie:**
- Max confidence = **0.612** (NOOIT boven 62%)
- Min = 0.339, Avg = 0.547

**Verklaring:** Het lokale trainingsscript gebruikte **39 nieuwe features** + correct gekalibreerd XGBoost op 43k samples. De productie-backend gebruikt een **andere pipeline** (44 features via `feature_service.py`) met **ongetrained Logistic/XGBoost** (slechts 600 samples getraind via Railway chunked endpoint).

**CONSEQUENTIE:** De productie engine levert nu **47% accuracy op beste picks, niet 67%**. De prachtige walk-forward nummers zijn nog niet in productie beschikbaar.

**Status:** te verifiëren met eigenaar — wil hij dat de lokale modellen gepickled worden en naar Railway gestuurd? Of wordt de productie pipeline opnieuw getraind op volledige dataset? **Dit is een engine-fix, buiten scope van v10 UI redesign**, maar de UI-tiers moeten hierop aansluiten.

---

## 1D — Engine Capabilities (feitelijk geverifieerd)

### ✅ Per-wedstrijd output — BESCHIKBAAR
- **Confidence score**: ja, 0-1 float. **Productie range: 0.34 – 0.61** (niet 0.90+)
- **Probabilities per uitkomst**:
  - ✅ 1X2 (home_win_prob, draw_prob, away_win_prob)
  - ✅ Goal totals (predicted_home_score, predicted_away_score uit Poisson)
  - ❌ GEEN over/under 2.5 probability (kan berekend worden uit Poisson)
  - ❌ GEEN BTTS probability (kan berekend worden uit Poisson)
- **Pick met tier** ('HOME'/'DRAW'/'AWAY'): ja, berekend als argmax
- **Features snapshot (jsonb)**: ja, 39 features per prediction
- **Raw submodel outputs (jsonb)**: ja, Elo/Logistic/XGBoost/Poisson afzonderlijk
- **Pre-match odds (closing_odds_snapshot)**: **kolom bestaat**, gevuld bij ~843 matches (3.2%)
- **Lock timestamp** (locked_at, lead_time_hours): ja, bewijs dat pick vóór kickoff was

### ✅ Per-wedstrijd metadata — BESCHIKBAAR
- League, seizoen, matchday, round
- Home/away team, venue
- Status (scheduled/live/finished)
- Elo ratings op moment van prediction (via `team_elo_history`)

### ⚠️ Explanations / reasoning — **LEEG**
- `prediction_explanations` tabel heeft 26,620 rijen, maar:
  - `top_factors_for`: `{}` leeg voor alle
  - `top_factors_against`: `{}` leeg
  - `summary`: waarschijnlijk ook leeg
  - `feature_importances`: waarschijnlijk leeg
- **Reasoning-feature is geïmplementeerd maar niet gevuld**

### ✅ Aggregate data — BESCHIKBAAR
- Cumulatieve accuracy per tier: ja, ad-hoc berekenbaar uit predictions + evaluations
- ROI tracking: **alleen als odds_history gekoppeld** (3.2% coverage)
- Sample sizes: ja
- Brier score, log-loss: ja, per prediction opgeslagen

### ✅ Time-based — BESCHIKBAAR
- Totaal: 26,620 predictions, 26,411 geëvalueerd (99.2%)
- Periode: matches van 2020-08 t/m 2026-04 (5.5 jaar)
- Live predictions: 208 stuks (sinds live deploy)
- Backtest predictions: 26,412 stuks
- Per-league coverage: zie 1A (alle 29 leagues)

### ✅ Walk-forward validation — BESCHIKBAAR
- Rapport in `docs/V8_ENGINE_REPORT.md`
- Script: `backend/scripts/validate_walkforward.py`
- Laatste run: 15 april 2026 op 28,838 test picks
- ⚠️ Nog niet ingebed in API endpoint voor frontend

### ✅ Calibration — BESCHIKBAAR
- `/api/trackrecord/calibration` endpoint
- 10-bucket calibration report
- Brier score per prediction

### ✅ Strategies — BESCHIKBAAR MAAR INACTIEF
- 14 strategieën gedefinieerd (zie onder)
- **Alle is_active=false** — geen enkele strategie draait live
- Overlapt conceptueel met confidence tiers
- **te verifiëren met eigenaar**: wat is het verschil tussen "strategy" en "confidence tier"? Zijn strategieën nog relevant na v8?

**Strategielijst:**
1. Anti-Draw Filter
2. Away Upset Value
3. Balanced Match Away
4. Conservative Favorite
5. Defensive Battle (Under 2.5)
6. Draw Specialist
7. High Confidence Any
8. High-Scoring Match (Over 2.5)
9. Home Dominant
10. Home Value Medium Odds
11. Low Draw High Home
12. Model Confidence Elite
13. Strong Home Favorite
14. Underdog Hunter

### ✅ Reports (PDF/CSV export) — BESCHIKBAAR
- `/api/reports/generate` + download
- 13 reports gegenereerd in DB
- Background via Celery

### ✅ Backtests — BESCHIKBAAR MAAR LEEG
- `/api/backtests/run` + endpoints
- Tabellen `backtest_runs` en `backtest_results` zijn **leeg** (0 rijen)
- **te verifiëren met eigenaar**: wordt backtest-functie gebruikt?

### ✅ Notifications — te verifiëren
- Geen notification tabel zichtbaar
- Email flow voor abandoned checkout bestaat (`abandoned-checkout-flow.md`)
- **te verifiëren met eigenaar**: zijn er email notifications voor picks?

### ✅ API exports voor users — te verifiëren
- CSV export: `/api/trackrecord/export.csv` bestaat
- **te verifiëren met eigenaar**: is er een publieke API voor platinum users?

---

## Conclusie Stap 1

**Engine kan veel meer dan nu zichtbaar is in UI.** Er is:
- Rijke feature snapshot data per prediction (39 features, niet gebruikt in UI)
- Raw submodel outputs (Elo/Logistic/XGBoost/Poisson outputs apart, niet zichtbaar)
- Match statistics (soms) met schoten, balbezit, kaarten
- Top scorers per league/seizoen
- Standings snapshots over tijd
- Goal predictions (Poisson lambda — kan over/under + BTTS probabilities genereren)

**Maar:**
- Prediction explanations zijn **leeg** ondanks schema
- Productie confidence is te laag (max 0.61) — Gold/Platinum tiers hebben **geen picks**
- 14 strategies bestaan maar **draaien niet**
- Odds coverage is slechts 3.2% — geen echte ROI mogelijk
- Backtest endpoints leeg

**Voor v10 UI redesign relevant:**
- Product kan 3-way, over/under, BTTS aanbieden (laatste 2 nog bouwen via Poisson)
- Walk-forward validation rapport bestaat lokaal maar nog niet als user-facing feature
- Calibration data bestaat maar wordt niet getoond
- Strategies vs tiers is verwarrend — heroverwegen

**Vragen aan eigenaar (te noteren):**
1. Productie accuracy gap (42% vs 67% in validation) — moet opgelost worden voor tier claims legitiem zijn. Wanneer?
2. Wat is het verschil tussen "Strategy" en "Confidence Tier"? Beide behouden of samenvoegen?
3. Wordt de backtests-feature gebruikt? (Tabellen leeg)
4. Moeten over/under 2.5 en BTTS markten toegevoegd worden? (Data is er via Poisson)
5. Notification preferences per user: gepland of niet?
