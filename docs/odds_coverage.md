# Fase 2 — Odds coverage & ROI (echte dataset: 3.318 picks)

*Gegenereerd 2026-04-22T23:37:01.486465+00:00Z*


**Dataset:** 19169 geëvalueerde predicties onder `trackrecord_filter()` — exact dezelfde filter als de site gebruikt.


---

## 1. Odds coverage per tier


| Tier | Picks | closing_odds_snapshot | odds_history | Échte odds (één van beide) | % dekking |
|---|---:|---:|---:|---:|---:|
| **Free** | 1641 | 0 | 2 | 2 | 0.1% |
| **Silver** | 811 | 0 | 2 | 2 | 0.2% |
| **Gold** | 580 | 3 | 7 | 7 | 1.2% |
| **Platinum** | 286 | 0 | 0 | 0 | 0.0% |
| **Totaal** | 3318 | 3 | 11 | 11 | 0.3% |

---

## 2. ROI per tier — alleen picks met ECHTE odds (€1 stake)


| Tier | N met echte odds | Accuracy | Gem. odds | Netto (€1/pick) | Rendement | 95% CI |
|---|---:|---:|---:|---:|---:|---|
| **Free** | 2 | 0.0% | 2.37x | -2.00 | -100.0% | [-100.0%, -100.0%] |
| **Silver** | 2 | 50.0% | 1.91x | -0.06 | -3.0% | [-100.0%, +94.0%] |
| **Gold** | 7 | 57.1% | 1.65x | -1.20 | -17.2% | [-72.9%, +35.6%] |
| **Totaal** | 11 | 45.5% | 1.83x | -3.26 | -29.7% | [-75.2%, +18.1%] |

---

## 3. Wat betekent dit voor een gebruiker op €10 per pick


### Free

- **2 picks** met echte odds, gemiddelde odds **2.37x**, accuracy **0.0%**
- Totale inzet: €20,00
- Netto resultaat: **€-20,00** (-100.0%)

### Silver

- **2 picks** met echte odds, gemiddelde odds **1.91x**, accuracy **50.0%**
- Totale inzet: €20,00
- Netto resultaat: **€-0,60** (-3.0%)

### Gold

- **7 picks** met echte odds, gemiddelde odds **1.65x**, accuracy **57.1%**
- Totale inzet: €70,00
- Netto resultaat: **€-12,03** (-17.2%)

### ALLE TIERS SAMEN

- **11 picks** met echte odds, gemiddelde odds **1.83x**, accuracy **45.5%**
- Totale inzet: €110,00
- Netto resultaat: **€-32,63** (-29.7%)

---

## Conclusie


- Van de **3318 predicties** heeft **11** (0.3%) echte bookmaker odds.
- 3 uit `closing_odds_snapshot` (stored at prediction time)
- 11 uit `odds_history` (ingested from paid API)
- **3307** predicties hebben géén echte odds en zouden een implied fallback nodig hebben.
