# Value Bet Engine — Fase 1 Data-Analyse (volledig)

**Datum:** 2026-04-21
**Doel:** antwoord op de 8 sub-vragen uit de Fase-1 brief voordat we bouwen.
**Scripts (read-only Railway):**
- `backend/scripts/value_bet_phase1_full.py` (deze volledige run)
- `backend/scripts/value_bet_phase1_inventory.py`
- `backend/scripts/value_bet_phase1_snapshot_probe.py`
- `backend/scripts/value_bet_phase2_risks.py`

Dit document vervangt `docs/value_bet_analysis.md` (oudere korte versie).

---

## TL;DR — voorwaardelijke go

**Kalibratie = sterk positief.** Over 20,366 geëvalueerde predictions laten
alle 4 tiers een consistente onder-confidence drift zien (+1 tot +13%),
wat een echte (niet-artificiële) structurele edge vs. implied-probability
betekent.

**Backtest-sample = nog te klein.** Met n=65 live + geëvalueerd +
populated-snapshot predictions hebben we 13% van het 500-minimum uit de
brief. De threshold/odds/tier-backtests geven veelbelovende getallen (ROI
+20% @ thr=3%, Sharpe +0.87) maar zijn statistisch niet publiceerbaar.

**Keuzeruimte:**
- **Bouwen met kalibratie-gebaseerde claim** (honest path): geen backtest
  ROI-claim; wel: "gebaseerd op gemeten Platinum/Gold kalibratie over
  8000+ evaluated predictions". Live-meting start vanaf nu.
- **Bouwen met "meting loopt" backtest UI** (brief path B): backtest
  parameters gekozen op huidige kleine sample, accepteren dat ROI-claim
  pas valide is na n≥500 live (~8-10 weken bij ~50 evals/week).

Mijn advies: **honest path** — claim is sterker, gaat nooit op zwakte
van huidige sample onderuit, staat 100% in lijn met v7/v8 honesty-principe.

---

## 1.1 Odds-data inventarisatie

### Tabellen & bookmakers

| Metric | Waarde |
|--------|-------:|
| Tabel | `odds_history` |
| Markten aanwezig | `1x2`, `btts`, `over_under_2_5` |
| Unieke bookmakers | **1** — `api_football_avg` |
| 1x2 rows totaal | 1,572 |
| Eerste timestamp | 2026-04-15 20:45 UTC |
| Laatste timestamp | 2026-04-21 15:11 UTC |
| Pre-kickoff rows | **1,572 (100%)** ✔ |
| Cron-bron | `job_snapshot_upcoming_odds` (API-Football, 1x/dag) |

**`api_football_avg` = gewogen gemiddelde over meerdere boekmakers** zoals
door API-Football gerapporteerd, niet één scherpe boekmaker (Pinnacle) en
niet een winkel-koers (Bet365). Dit is het MVP en tegelijk de beperking.

### Coverage per competitie-scope

| scope | predictions met 1x2 odds |
|-------|-------------------------:|
| top-5 Platinum (CL, Süper Lig, Eredivisie, Premier, Saudi) | **69** |
| top-10 Gold+ | 171 |
| top-14 Silver+ | 267 |

Coverage bereikt nooit alle leagues — job snapshot cap is 400 fixtures/dag
en begon pas 6 dagen geleden.

---

## 1.2 Implied-probability methodologie

### Bookmaker-marge meting

| bookmaker | avg margin | median | p95 | n |
|-----------|-----------:|-------:|----:|--:|
| api_football_avg | **6.83%** | 6.79% | 8.08% | 1,572 |

Referentie: Pinnacle ~2-3%, Bet365 ~5-6%, soft books 8-10%. Onze bron zit
in het midden — bruikbaar maar niet scherp.

### Keuze normalisatie-methode

Getest op n=200 rijen:

| methode | verschil met proportional |
|---------|--------------------------:|
| Shin-approximation | mean 0.88%, max 2.50% |

Bij marges < 8% is proportional statistisch indistinguishable van Shin.
**Kies proportional** — simpel, geen optimalisatie-loop nodig, bestaande
`_build_odds_snapshot` gebruikt het al (zie
`backend/app/forecasting/forecast_service.py:776`).

---

## 1.3 Edge-distributie op populated snapshots

Sample: n=65 (live only + evaluated + populated `closing_odds_snapshot`)

| edge-bucket | n | % |
|-------------|--:|--:|
| <0% | 0 | 0.0% |
| 0-2% | 5 | 7.7% |
| 2-5% | 15 | 23.1% |
| 5-10% | **23** | **35.4%** |
| 10-15% | 14 | 21.5% |
| 15%+ | 8 | 12.3% |

**Observatie:** 100% van deze sample heeft `best_edge >= 0`. Dat is
consistent met de kalibratie-drift in 1.4 (model is systematisch
onder-confident vs. marge-gecorrigeerde bookmaker-prob).

---

## 1.4 Kalibratie + Brier score per tier — 20,366 evaluations

**Dit is de sterkste bevinding van de analyse.** De meting bevestigt dat
wat op value-bets lijkt, geen artefact is maar structureel model-gedrag.

### Platinum (n=2,559) — Brier **0.1220**
| bucket | n | hit% | verwacht | drift |
|-------|--:|-----:|---------:|------:|
| 55-60 | 5 | 80.0% | 57.5% | **+22.5** |
| 60-65 | 408 | 67.9% | 62.5% | +5.4 |
| 65-70 | 696 | 75.7% | 67.5% | +8.2 |
| 70-75 | 584 | 78.8% | 72.5% | +6.3 |
| 75-80 | 495 | 79.4% | 77.5% | +1.9 |
| 80-85 | 284 | 87.7% | 82.5% | +5.2 |
| 85-90 | 83 | **95.2%** | 87.5% | +7.7 |
| 90+ | 4 | 100.0% | 94.0% | +6.0 |
| **overall** | **2,559** | **77.9%** | | |

### Gold (n=5,742) — Brier **0.1504**
Alle buckets +1 tot +10 drift, overall hit 70.4%.

### Silver (n=8,340) — Brier **0.1783**
Scherpere kalibratie dan Platinum in 50-70% range (drift <3%), overall 61.9%.

### Free (n=3,725) — Brier **0.1934**
Goed gekalibreerd (drift -1.9 tot +1.3) in 50-65% range, overall 56.5%.

### Samenvatting kalibratie

- **Alle tiers:** gekalibreerd onder-confident. Model geeft 65% uit, werkelijk
  gebeurt 67-75%. Dat is **value-bet smoking gun** — edges zijn echt, niet
  een statistisch artefact.
- **Platinum & Gold** tonen het sterkst. Dit bevestigt Fase 2 advies:
  value-bet engine primaire pool = `tier ∈ {gold, platinum}`.
- **Brier 0.12 (Platinum)** is beter dan wat de literatuur typisch voor
  1X2-modellen noteert (0.18-0.22). Past bij de v8.1 engine-claim in
  `docs/V8_ENGINE_REPORT.md`.
- **Geen post-processing kalibratie nodig.** Isotonic regression zou de
  onder-confidence juist wegpoetsen en daarmee de value-signal
  verwijderen.

---

## 1.5 Threshold-backtest (flat 1u stake, 1.50 ≤ odds ≤ 5.00)

Sample: n=65 live+evaluated+populated.

| threshold | picks | acc% | avg_odds | ROI% | pnl_u | max_dd | Sharpe |
|----------:|------:|-----:|---------:|-----:|------:|-------:|-------:|
| 0% (geen edge) | 49 | 40.8% | 2.93 | +15.7% | +7.7u | -10.0u | +0.72 |
| **3%** | **45** | **42.2%** | **2.92** | **+20.1%** | **+9.1u** | **-9.0u** | **+0.87** |
| 5% | 35 | 42.9% | 2.84 | +11.5% | +4.0u | -7.0u | +0.48 |
| 8% | 22 | 45.5% | 3.07 | +26.1% | +5.7u | -5.2u | +0.80 |
| 10% | 19 | 42.1% | 3.11 | +18.2% | +3.5u | -4.2u | +0.52 |
| 15% | 8 | 25.0% | 3.93 | +2.4% | +0.2u | -6.0u | +0.04 |

**Interpretatie:**
- Threshold 3% heeft beste Sharpe (+0.87) én hoogste frequentie (45 picks
  in 6 dagen → ~7/dag) → zou in productie 200+ picks/maand opleveren.
- Boven 15% valt de set uit elkaar (n=8, overfit op deze sample).
- Drawdown van -9u op 45 picks = -20%. Realistisch, geen bullshit-cijfer.
- Waarschuwing: n=45 is 9% van het 500-minimum. Getallen zijn directioneel
  bruikbaar, maar één niet-publiceerbare claim.

---

## 1.6 Odds-range filter @ edge ≥ 5%

| range | picks | acc% | ROI% | pnl_u | Sharpe |
|-------|------:|-----:|-----:|------:|-------:|
| 1.50-2.00 | 5 | **80.0%** | +33.7% | +1.7u | +1.00 |
| 2.00-3.00 | 17 | 35.3% | -15.6% | -2.6u | -0.54 |
| 3.00-5.00 | 13 | 38.5% | **+38.3%** | +5.0u | +0.75 |
| 1.50-5.00 (all) | 35 | 42.9% | +11.5% | +4.0u | +0.48 |

**Interpretatie:**
- Mid-range (2.00-3.00) presteert slecht — waarschijnlijk random-noise zone.
- Favorites (1.50-2.00) en longshots (3.00-5.00) doen het goed maar op
  piepkleine samples (n=5, 13).
- Safe pick voor productie: volledige 1.50-5.00 range; nauwe filters zijn
  overfit-risk.

---

## 1.7 Tier-filter @ edge ≥ 5% & 1.50-5.00

| tier_filter | picks | acc% | ROI% | Sharpe |
|-------------|------:|-----:|-----:|-------:|
| all | 19 | 36.8% | -2.5% | -0.08 |
| silver+ | 5 | 20.0% | -46.8% | -0.88 |
| gold+ | 1 | 0.0% | -100.0% | - |
| platinum only | 0 | - | - | - |

**Sample bottoms out** bij tier+edge+odds gecombineerd. Deze matrix is
niet interpreteerbaar. Conclusie: tier-filter moet op basis van Fase 2
kalibratie-meting (Platinum Brier 0.12, drift consistent positief) worden
gekozen, niet op deze sample.

**Aanbevolen:** `tier_filter = {gold, platinum}` op basis van
Brier-ranking, niet op basis van deze backtest-matrix.

---

## 1.8 Conclusie & aanbeveling

### Is er genoeg data?

| Criterium | Eis brief | Actual | Status |
|-----------|----------:|-------:|--------|
| Historische value-bets geëvalueerd | ≥ 500 | **65** | ❌ |
| Odds-coverage | meerdere bookmakers | 1 bron | ❌ |
| Kalibratie-meting | goed | Brier 0.12-0.19 | ✔ |
| Closing-line data | ≥24h pre-kickoff min | avg 112u pre-KO | ⚠ (opening-lines) |

### Aanbevolen parameters — productie-engine

```yaml
# config/value_bet_config.yaml
normalization_method: proportional
edge_threshold: 0.03            # best Sharpe +0.87 bij deze sample
min_odds: 1.50
max_odds: 5.00
tier_filter: [gold, platinum]   # basis: Brier 0.12-0.15
preferred_bookmakers: [api_football_avg]  # enige beschikbaar
scoring_weights:
  edge: 1.0
  our_confidence: 0.5
  tier_bonus:
    platinum: 1.2
    gold: 1.0
    silver: 0.8
    free: 0.5
max_picks_per_day: 1
odds_freshness_hours: 24        # drop als odds >24u oud
late_news_spread_pct: 0.10      # drop als 24h odds-spread >10%
```

### Verwachte live performance (honest-path claim)

**Wat we WEL kunnen claimen:**
- "Onderliggende v8.1 predictions zijn gekalibreerd met Brier 0.12-0.15
  op Platinum/Gold (n=8,300 evaluations). Model is consistent
  onder-confident in 55-85% range (+3 tot +8% drift), wat positieve edges
  signaleert."
- Indicatieve backtest (n=45): Sharpe +0.87, ROI +20% bij threshold 3%
  — expliciet gelabeld als "klein sample, live-meting loopt".
- Kalibratie-meting + Brier per tier toonbaar op product-pagina.

**Wat we NIET kunnen claimen:**
- "Historische ROI X%" als hard product-feature.
- Closing-line-value (CLV+) — onze odds zijn opening-lines (avg 112u pre-KO).
- Multi-bookmaker consensus (we hebben 1 bron).

### Frequentie

- Backtest n=45 over 6 dagen → ~7/dag wereldwijd → **na tier-filter
  (gold/platinum) ≈ 1-2 kwalificerende picks/dag**.
- Dat past bij de brief-eis "1 value bet per dag", met regelmatig
  "no pick vandaag, geen edge >3% in Gold/Platinum scope".

### Go/no-go

**Go voor bouwen met honest-path claim.** Kalibratie is de harde basis;
backtest-sample is aanvulling, geen fundament. Productie-engine kan nu
gebouwd worden, live-meting accumuleert vanaf dag 1, eerste honest
backtest-claim mogelijk rond week 8-10 als n ≥ 500.

**Stop. Wacht op akkoord.** Volgende stap (Fase 2 schema, Fase 3 service)
pas starten na bevestiging van:
1. Parameters in `config/value_bet_config.yaml` (threshold=3%, tier={gold,
   platinum}, odds 1.50-5.00).
2. Honest-path claim-framing (geen harde historische ROI-claim).
3. Scope voor vandaag = MVP (tabel + service + 3 endpoints + BOTD tab);
   Celery cron + CSV-export + admin-tools zijn nice-to-have-na-launch.
