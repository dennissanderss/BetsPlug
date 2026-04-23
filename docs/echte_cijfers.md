# Fase 2 — Echte Cijfers

*Gegenereerd op 2026-04-22T22:57:57.276718+00:00Z*

**Dataset:** 190 geëvalueerde pre-match predicties (Prediction.predicted_at < Match.scheduled_at, join met PredictionEvaluation).


---

## 2.1 Sample size en tijdvak per tier

Wilson 95% CI op accuracy. Periode = eerste → laatste geëvalueerde pick. Picks/dag = totaal ÷ dagen in periode.


| Tier | Bucket | N | Correct | Accuracy | 95% CI | Periode | Picks/dag | Picks/week | Picks/maand |
|---|---|---:|---:|---:|---|---|---:|---:|---:|
| **Free** | all | 19 | 10 | 52.6% | [31.7%, 72.7%] | 2026-04-17 → 2026-04-22 (5d) | 3.80 | 26.6 | 114 |
| **Free** | backtest | 18 | 9 | 50.0% | [29.0%, 71.0%] | 2026-04-17 → 2026-04-22 (5d) | 3.60 | 25.2 | 108 |
| **Free** | live | 1 | 1 | 100.0% | [20.7%, 100.0%] | 2026-04-21 → 2026-04-21 (1d) | 1.00 | 7.0 | 30 |
| **Silver** | all | 6 | 5 | 83.3% | [43.6%, 97.0%] | 2026-04-17 → 2026-04-22 (6d) | 1.00 | 7.0 | 30 |
| **Silver** | backtest | 6 | 5 | 83.3% | [43.6%, 97.0%] | 2026-04-17 → 2026-04-22 (6d) | 1.00 | 7.0 | 30 |
| **Silver** | live | 0 | 0 | 0.0% | — | — | 0.00 | 0.0 | 0 |
| **Gold** | all | 11 | 7 | 63.6% | [35.4%, 84.8%] | 2026-04-17 → 2026-04-22 (6d) | 1.83 | 12.8 | 55 |
| **Gold** | backtest | 6 | 4 | 66.7% | [30.0%, 90.3%] | 2026-04-17 → 2026-04-22 (6d) | 1.00 | 7.0 | 30 |
| **Gold** | live | 5 | 3 | 60.0% | [23.1%, 88.2%] | 2026-04-18 → 2026-04-22 (4d) | 1.25 | 8.8 | 38 |
| **Platinum** | all | 1 | 1 | 100.0% | [20.7%, 100.0%] | 2026-04-18 → 2026-04-18 (1d) | 1.00 | 7.0 | 30 |
| **Platinum** | backtest | 1 | 1 | 100.0% | [20.7%, 100.0%] | 2026-04-18 → 2026-04-18 (1d) | 1.00 | 7.0 | 30 |
| **Platinum** | live | 0 | 0 | 0.0% | — | — | 0.00 | 0.0 | 0 |

## 2.2 Echte odds coverage per tier

Hoeveel van de picks hebben **echte bookmaker odds** (uit closing_odds_snapshot of odds_history)? De rest kan alleen via implied-odds fallback, wat we in Fase 4 niet meer gaan gebruiken.


| Tier | Totaal picks | Met echte odds | Alleen implied | % echte odds |
|---|---:|---:|---:|---:|
| **Free** | 19 | 19 | 0 | 100.0% |
| **Silver** | 6 | 6 | 0 | 100.0% |
| **Gold** | 11 | 11 | 0 | 100.0% |
| **Platinum** | 1 | 1 | 0 | 100.0% |

## 2.3 ROI — uitsluitend echte odds (€1 stake normalisatie)

Per tier × bucket. Alleen picks waarvoor we echte bookmaker odds hebben. Bootstrap 95% CI (n ≥ 30). Gemarkeerd als **onbetrouwbaar** bij n < 100.


| Tier | Bucket | N (real odds) | Accuracy | Gem. odds | Netto (€1/pick) | ROI | 95% CI | Betrouwbaar? |
|---|---|---:|---:|---:|---:|---:|---|---|
| **Free** | all | 19 | 52.6% | 1.79x | -2.89 | -15.2% | n/a | ⚠️ te klein (<100) |
| **Free** | backtest | 18 | 50.0% | 1.78x | -3.79 | -21.1% | n/a | ⚠️ te klein (<100) |
| **Free** | live | 1 | 100.0% | 1.90x | +0.90 | +89.9% | n/a | ⚠️ te klein (<100) |
| **Silver** | all | 6 | 83.3% | 1.33x | +0.53 | +8.9% | n/a | ⚠️ te klein (<100) |
| **Silver** | backtest | 6 | 83.3% | 1.33x | +0.53 | +8.9% | n/a | ⚠️ te klein (<100) |
| **Gold** | all | 11 | 63.6% | 1.36x | -2.01 | -18.3% | n/a | ⚠️ te klein (<100) |
| **Gold** | backtest | 6 | 66.7% | 1.30x | -0.91 | -15.2% | n/a | ⚠️ te klein (<100) |
| **Gold** | live | 5 | 60.0% | 1.44x | -1.10 | -22.0% | n/a | ⚠️ te klein (<100) |
| **Platinum** | all | 1 | 100.0% | 1.39x | +0.39 | +39.4% | n/a | ⚠️ te klein (<100) |
| **Platinum** | backtest | 1 | 100.0% | 1.39x | +0.39 | +39.4% | n/a | ⚠️ te klein (<100) |

## 2.4 Gebruikers-tijdschaal — €10 per pick

**Dit is het getal dat een gebruiker snapt.** Voor elk tier: als je €10 per pick inzet op alle picks van dat tier, wat is dan het gemiddelde per dag/week/maand? Alleen echte odds (geen implied fallback).


### Free — Afgelopen 90 dagen

- Periode: 2026-01-22 → 2026-04-22 (91 dagen)
- Picks met echte odds: **19** (accuracy: 52.6%)
- Gemiddeld **0.21 picks per dag** → **€2,09** inzet per dag

- **Dagelijks netto resultaat: €-0,32** (verlies)
- **Wekelijks netto: €-2,22**
- **Maandelijks netto: €-9,54** op €62,64 inzet (-15.2%)

- Totale periode: €-28,93 netto op €190,00 inzet (-15.2%)

### Free — Hele periode

- Periode: 2026-04-17 → 2026-04-22 (5 dagen)
- Picks met echte odds: **19** (accuracy: 52.6%)
- Gemiddeld **3.80 picks per dag** → **€38,00** inzet per dag

- **Dagelijks netto resultaat: €-5,79** (verlies)
- **Wekelijks netto: €-40,50**
- **Maandelijks netto: €-173,55** op €1.140,00 inzet (-15.2%)

- Totale periode: €-28,93 netto op €190,00 inzet (-15.2%)

### Silver — Afgelopen 90 dagen

- Periode: 2026-01-22 → 2026-04-22 (91 dagen)
- Picks met echte odds: **6** (accuracy: 83.3%)
- Gemiddeld **0.07 picks per dag** → **€0,66** inzet per dag

- **Dagelijks netto resultaat: €0,06** (winst)
- **Wekelijks netto: €0,41**
- **Maandelijks netto: €1,76** op €19,78 inzet (+8.9%)

- Totale periode: €5,34 netto op €60,00 inzet (+8.9%)

### Silver — Hele periode

- Periode: 2026-04-17 → 2026-04-22 (6 dagen)
- Picks met echte odds: **6** (accuracy: 83.3%)
- Gemiddeld **1.00 picks per dag** → **€10,00** inzet per dag

- **Dagelijks netto resultaat: €0,89** (winst)
- **Wekelijks netto: €6,23**
- **Maandelijks netto: €26,68** op €300,00 inzet (+8.9%)

- Totale periode: €5,34 netto op €60,00 inzet (+8.9%)

### Gold — Afgelopen 90 dagen

- Periode: 2026-01-22 → 2026-04-22 (91 dagen)
- Picks met echte odds: **11** (accuracy: 63.6%)
- Gemiddeld **0.12 picks per dag** → **€1,21** inzet per dag

- **Dagelijks netto resultaat: €-0,22** (verlies)
- **Wekelijks netto: €-1,55**
- **Maandelijks netto: €-6,64** op €36,26 inzet (-18.3%)

- Totale periode: €-20,13 netto op €110,00 inzet (-18.3%)

### Gold — Hele periode

- Periode: 2026-04-17 → 2026-04-22 (6 dagen)
- Picks met echte odds: **11** (accuracy: 63.6%)
- Gemiddeld **1.83 picks per dag** → **€18,33** inzet per dag

- **Dagelijks netto resultaat: €-3,36** (verlies)
- **Wekelijks netto: €-23,49**
- **Maandelijks netto: €-100,66** op €550,00 inzet (-18.3%)

- Totale periode: €-20,13 netto op €110,00 inzet (-18.3%)

### Platinum — Afgelopen 90 dagen

- Periode: 2026-01-22 → 2026-04-22 (91 dagen)
- Picks met echte odds: **1** (accuracy: 100.0%)
- Gemiddeld **0.01 picks per dag** → **€0,11** inzet per dag

- **Dagelijks netto resultaat: €0,04** (winst)
- **Wekelijks netto: €0,30**
- **Maandelijks netto: €1,30** op €3,30 inzet (+39.4%)

- Totale periode: €3,94 netto op €10,00 inzet (+39.4%)

### Platinum — Hele periode

- Periode: 2026-04-18 → 2026-04-18 (1 dagen)
- Picks met echte odds: **1** (accuracy: 100.0%)
- Gemiddeld **1.00 picks per dag** → **€10,00** inzet per dag

- **Dagelijks netto resultaat: €3,94** (winst)
- **Wekelijks netto: €27,58**
- **Maandelijks netto: €118,20** op €300,00 inzet (+39.4%)

- Totale periode: €3,94 netto op €10,00 inzet (+39.4%)

## 2.5 Consistency check

Vergelijk de cijfers hierboven met:

- `/api/pricing/comparison` response — welke accuracy-claims per tier?
- Homepage hero copy — staat daar een percentage?
- `/engine` pagina — statische claims of dynamic?
- Pricing page — tier descriptions met accuracy-nummers

**Handmatig uit te voeren** (script kan dit niet zonder deployed staging-URL op te vragen). Noteer per pagina: welke getallen staan er, matchen ze met sectie 2.1 boven?

---

*Einde rapport — gegenereerd door `fase2_echte_cijfers.py`.*
