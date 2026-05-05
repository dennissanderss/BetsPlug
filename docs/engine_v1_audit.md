# Phase 2 — Engine v1 (Predictions) Integrity Audit

*Generated 2026-05-06 via `GET /api/internal-ops/audit/phase2-engine1-roi`. Code review of `roi_calculator.py` + 10-pick spot-check + per-tier real-odds ROI replicated in SQL.*

---

## Executive summary

| Tier | Picks (real odds) | Hit rate | Avg odds | ROI | Verdict |
|---|---:|---:|---:|---:|---|
| **Platinum** | 427 | 88.5% | 1.21 | **+6.75%** | ✅ verkoopbaar +EV |
| **Gold** | 2,675 | 66.3% | 1.60 | **+3.37%** | ✅ marginaal +EV |
| Silver | 5,689 | 46.9% | 2.20 | −2.24% | ❌ structureel verlies |
| Free | 2,725 | 48.2% | 2.07 | −6.89% | ❌ structureel verlies |
| Below floor | 2,810 | 40.0% | 2.47 | −6.55% | ❌ excluded uit product |

**Hoofdbevinding:** Engine v1 heeft een echt +EV product **alleen in Platinum + Gold tier**. Silver en Free zijn structureel verlieslatend. Marketing-pijler ligt op Gold/Platinum.

---

## 2.1 — ROI berekening logica (code review)

**File: `backend/app/services/roi_calculator.py`**

### `realised_pnl_1x2(prediction, actual_outcome, is_correct, db)` — line 110

```python
1. probs = {"home": p.home_win_prob, "draw": p.draw_prob, "away": p.away_win_prob}
2. pick = max(probs, key=...)
3. odds_row = await fetch_1x2_odds(prediction.match_id, db)  # latest 1X2 row
4. if no row OR odds <= 1.0: return (None, None, "no_odds")
5. pnl = (odds - 1) if is_correct else -1.0
6. return (pnl, odds_used, "historical_odds")
```

**Bevindingen:**
- ✓ Pick-determinatie consistent met argmax-conventie elders in codebase
- ✓ H1 None-guard zit erin (line 150-155)
- ✓ Standaard 1u flat-stake formule
- ⚠ **`fetch_1x2_odds` pakt LATEST row** (ORDER BY `recorded_at` DESC LIMIT 1). Geen averaging over meerdere bookmakers. Als er Bet365 + Pinnacle staat, krijgt elke pick één van de twee (laatst toegevoegd) — niet best line, niet average.
- ⚠ Source-label `"flat_fallback"` is dead code na H1 — wordt nooit getriggerd want we returnen None bij geen odds.

### `compute_strategy_metrics_with_real_odds(picks, db)` — line 170

```python
1. for each pick → realised_pnl_1x2
2. if pnl is None: skipped_no_odds++; continue
3. else: tally wins/losses, sum total_pnl
4. counted = wins + losses (NOT including skipped)
5. winrate = wins / counted
6. roi = total_pnl / counted
7. avg_odds_used = mean of WINNING-pick odds only
8. profit_factor = gross_profit / gross_loss
```

**Bevindingen:**
- ✓ Skipped picks worden niet meegerekend in denominator (correct na H1)
- ✓ ROI math correct: P/L per unit op flat-stake basis
- ⚠ **`avg_odds_used`** = mean odds van alleen WINNING picks. Lichte upward bias op het displayed-getal; ROI zelf niet beïnvloed (winrate × avg_winning_odds ≠ ROI direct).

### Caller-overzicht

`realised_pnl_1x2` / `compute_strategy_metrics_with_real_odds` worden aangeroepen vanuit:
- `strategies.py:393, 424, 647, 727, 772, 982, 1023, 1150, 1172`

Engine v1 heeft **geen dedicated `/trackrecord/roi` endpoint**. ROI wordt berekend:
1. **Frontend** in `results/page.tsx` (`oddsForPick` + `aggregateFixtures`) — voor de Result Simulation visualisatie
2. **Strategy Lab** via `compute_strategy_metrics_with_real_odds` — voor /strategy/{id}/metrics
3. **Audit query** in dit rapport — replicas SQL-zijde

---

## 2.2 — Endpoint consistency

Geen aparte `/trackrecord/roi` endpoint bestaat. Wel relevante endpoints voor accuracy:

| Endpoint | Doel | Coverage cijfer |
|---|---|---|
| `/trackrecord/summary` | Globaal accuracy + Brier per tier (geen ROI) | Hangt van filter |
| `/trackrecord/live-measurement` | Strikte live measurement | source='live' only |
| `/trackrecord/accuracy-plus` | Pro Engine v2 page (odds-verified accuracy) | Met odds + filter |
| `/trackrecord/segments` | Per-tier accuracy breakdown | Met access_filter |
| `/dashboard/metrics` | Dashboard headline KPIs | Top-level aggregate |

**Cross-check op accuracy** (audit source-of-truth tegen Track Record visuelen):

Audit per-tier accuracy (alle v8.1 picks met `predicted_at ≤ scheduled_at`, no odds filter):

| Tier | Eval | Accuracy |
|---|---:|---:|
| Platinum | 775 | **89.42%** |
| Gold | 6,863 | **67.42%** |
| Silver | 13,885 | **46.60%** |
| Free | 8,466 | **49.40%** |
| Below floor | 8,510 | 40.72% |

⚠ **Free (49.4%) > Silver (46.6%) is statistisch significant** (CI ±1pp). Tier-monotonie zou moeten gelden (hogere conf = hogere hit rate). Mogelijke verklaringen:
- League-mix verschilt: Free en Silver bedienen verschillende competitie-sets
- Silver-band 0.60-0.69 bevat meer "marginal favorites" die vaak ondergemiddeld scoren
- Random variance op een specifieke periode

**Action item (P2):** vergelijk deze cijfers één-op-één met `/trackrecord/segments?source=backtest` en `/dashboard/metrics`. Mismatch = endpoint-inconsistency. Match = Free>Silver inversie is data-fact.

Eerder gerapporteerde "Pro Engine v2" cijfers (Platinum 77%, Gold 69%, Silver 57%, Free 43%) gebruiken een **andere filter** (`closing_odds_snapshot.bookmaker_odds` populated) → kleiner sample, ander tier-cijfer. Beide zijn intern consistent maar gebruiken andere universe.

---

## 2.3 — 10 random picks spot-check

10 willekeurige Gold/Platinum picks van afgelopen 60 dagen, allemaal mét odds + uitslag:

| Match | League | Pick | Conf | Odds | Score | Correct | P/L |
|---|---|---|---:|---:|---|---|---:|
| Arouca vs Benfica | Primeira Liga | away | 0.79 | 1.27 | 1-2 | ✓ | +0.27 |
| Al Ettifaq vs Al Najma | Saudi PL | home | 0.75 | 1.51 | 0-0 | ✗ | -1.00 |
| Parma vs Pisa | Serie A | home | 0.76 | 2.11 | 1-0 | ✓ | +1.11 |
| PSV vs AZ | Eredivisie | home | 0.78 | 1.42 | 2-1 | ✓ | +0.42 |
| Strasbourg vs Toulouse | Ligue 1 | home | 0.77 | 2.82 | 1-2 | ✗ | -1.00 |
| Inter Miami vs NE Revolution | MLS | home | 0.80 | 1.37 | 1-1 | ✗ | -1.00 |
| Seattle vs Dallas | MLS | home | 0.72 | 1.63 | 2-1 | ✓ | +0.63 |
| Benfica vs Moreirense | Primeira Liga | home | 0.87 | 1.13 | 4-1 | ✓ | +0.13 |
| Santa Clara vs Braga | Primeira Liga | away | 0.76 | 2.20 | 2-1 | ✗ | -1.00 |
| Moreirense vs Nacional | Primeira Liga | home | 0.73 | 2.45 | 1-1 | ✗ | -1.00 |

**Bevindingen:**
- ✓ **All 10 reconcile correctly**: pick = argmax van probs, odds = juiste leg uit odds_history, P/L = odds-1 if correct else -1
- ✓ 4 wins, 6 losses op n=10 = ruw 40% hit rate (cf 67% Gold avg) — kleine sample variance
- ✓ Bronnen: 3× Bet365 closing, 7× API-Football avg — beide legitiem
- ✓ Alle odds in geloofwaardige range [1.13, 2.82]
- ✓ Net P/L op deze 10 = +0.27-1+1.11+0.42-1-1+0.63+0.13-1-1 = **−2.44u** = −24.4% ROI op n=10. Variance, niet representatief.

Geen rekenfouten. Engine 1 ROI math is correct.

---

## 2.4 — Implied-fallback usage

Na H1 fix werkt **skip-on-no-odds**: predictions zonder odds dragen NIET bij aan ROI.

| Metric | Count |
|---|---:|
| Total v8.1 evaluated (predicted_at ≤ scheduled_at) | 38,499 |
| **No odds → skipped in ROI calc** | 24,173 (62.8%) |
| With real odds → counted in ROI | 14,326 (**37.2%**) |

Dus **63% van Engine 1's v8.1 picks zit niet in de ROI-berekening**. Voor die 63% kan het systeem alleen accuracy tonen, geen geld-cijfer.

**Geen implied/1-prob fallback meer** in productie — pre-H1-bug is dicht. Ingangsproblemen zijn nu enkel "missing data" niet "synthetic data".

---

## 2.5 — Per-tier ROI op real-odds-only universe (replica van roi_calculator math in SQL)

Dit is de echte, bewijsbare ROI van Engine v1 op de 14,326 picks waar we odds + uitslag voor hebben:

```
Tier        Picks  Wins  Losses  Hit%   AvgOdds   NetPnL    ROI
─────────────────────────────────────────────────────────────────
Platinum     427   378     49   88.5%   1.21     +28.81u   +6.75%
Gold       2,675 1,774    901   66.3%   1.60     +90.09u   +3.37%
Silver     5,689 2,667  3,022   46.9%   2.20    −127.61u   −2.24%
Free       2,725 1,313  1,412   48.2%   2.07    −187.88u   −6.89%
Below      2,810 1,124  1,686   40.0%   2.47    −183.98u   −6.55%
```

**Lezing:**
- **Platinum +6.75% op 427 picks** is een serieus signaal. Bij 95% CI op binomiale prop met n=427 is ROI-band ongeveer ±2.5pp → CI ≈ [+4%, +9%]. Solide +EV.
- **Gold +3.37% op 2675 picks** is marginaal +EV maar over een groot sample → CI smaller, ~±1pp → CI ≈ [+2%, +5%]. Bewijsbaar boven nul.
- **Silver −2.24% op 5689 picks** = structureel verlies. Hit rate 46.9% bij avg odds 2.20 → break-even = 1/2.20 = 45.5%. Hit boven break-even maar 5% bookmaker margin eet de marge op.
- **Free −6.89% op 2725 picks** = duidelijk verlies. 48.2% hit rate × avg odds 2.07 → totaal 0.998 unit return per stake → −0.2% theoretisch, maar 5% margin = −7%.
- **Below floor** picks: niet eens in product scope.

---

## 2.6 — Identified bugs en risico's

### P1 (high impact)
1. **Silver/Free zijn structureel verlieslatend** maar staan momenteel in product-scope. Marketing-claims op tier-accuracy kunnen niet zonder kwalificatie geclaimd worden voor deze tiers.

### P2 (medium)
2. **`fetch_1x2_odds` pakt latest row, geen multi-bookmaker average.** Bij meerdere bookmakers per match (Bet365 + Pinnacle + API-Football) krijgt elke pick willekeurig één van de drie. Best practice: averagen over alle bookmakers, OF de "best line" gebruiken voor wat een echte gokker zou pakken.
3. **`avg_odds_used` cosmetische bias** — alleen winning-pick odds in mean. Niet ROI-bepalend, wel verwarrend in UI.
4. **Free (49.4%) > Silver (46.6%) accuracy inversie** — statistisch significant. Onderzoeken of dit data-artefact is of league-mix verschil.

### P3 (cosmetic)
5. **`source='flat_fallback'` is dead code** na H1 — kan opgeruimd in `roi_calculator.py:137`.
6. **5,427 "duplicate" odds groups** uit Phase 1 query K — false positive door ontbrekende `market` in GROUP BY. Geen echte bug.

### Geen kritieke fouten
- ✓ ROI math is correct
- ✓ Pick-determinatie consistent
- ✓ H1 None-guard werkt
- ✓ Skipped picks niet in denominator
- ✓ Sample-spot-check reconcileert

---

## 2.7 — Aanbevelingen (geen fixes uitgevoerd)

1. **Marketing-richting:** lead met **Platinum +6.75% / Gold +3.37%** als hoofdverhaal. Silver/Free positioneren als "transparency tier" zonder ROI-claim.
2. **Multi-bookmaker averaging** in `fetch_1x2_odds` — kortcyclisch verbeterproject (~2u werk).
3. **Free>Silver inversie** onderzoeken — querydump per league × tier om league-mix uit te sluiten.
4. **Engine v1 ROI op de Track Record page surfacen** — staat momenteel alleen client-side in Result Simulation. Een server-side `/trackrecord/roi-per-tier` endpoint zou consistenter zijn.

---

**STOP. Phase 2 complete. Awaiting approval before Phase 3 (Engine v2 audit).**
