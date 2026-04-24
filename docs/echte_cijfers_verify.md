# Fase 2 — Verificatie: Drie Filter-niveaus Naast Elkaar

*Gegenereerd 2026-04-22T23:25:18.320137+00:00Z*


Totaal geëvalueerde predicties in DB (ruwe JOIN, geen filter): **98202**


## Timing breakdown — `predicted_at` vs `scheduled_at`

(Na v8.1 cutoff + valid-source filter)


| Situatie | Aantal |
|---|---:|
| `predicted_at < scheduled_at` (echt pre-match) | 18 |
| `predicted_at = scheduled_at` (batch simulation @ kickoff) | 19151 |
| `predicted_at > scheduled_at` (retroactieve backfill) | 10037 |

## Source breakdown

| prediction_source | Aantal |
|---|---:|
| batch_local_fill | 19151 |
| backtest | 10037 |
| live | 18 |

---

## Accuracy per tier — drie filter-niveaus


Filter A = **v81_predictions_filter** (source + cutoff)

Filter B = **trackrecord_filter** (A + `predicted_at ≤ scheduled_at`) — **dit is wat de site toont**

Filter C = **strict pre-match** (A + `predicted_at < scheduled_at`) — de echte pre-match lock


| Tier | A (v81) N | A Acc | B (site) N | B Acc | C (strict) N | C Acc |
|---|---:|---:|---:|---:|---:|---:|
| **Free** | 3786 | 48.4% | 1641 | 60.0% | 2 | 0.0% |
| **Silver** | 3011 | 60.6% | 811 | 71.1% | 2 | 50.0% |
| **Gold** | 1667 | 70.4% | 580 | 77.4% | 7 | 57.1% |
| **Platinum** | 843 | 82.3% | 286 | 86.0% | 0 | — |
| **Totaal** | 9307 | 59.4% | 3318 | 68.0% | 11 | 45.5% |

## Wilson 95% CI per tier onder Filter B (site-weergave)

| Tier | N | Accuracy | 95% CI |
|---|---:|---:|---|
| **Free** | 1641 | 60.0% | [57.6%, 62.4%] |
| **Silver** | 811 | 71.1% | [67.9%, 74.2%] |
| **Gold** | 580 | 77.4% | [73.8%, 80.6%] |
| **Platinum** | 286 | 86.0% | [81.5%, 89.6%] |
| **Totaal** | 3318 | 68.0% | [66.4%, 69.6%] |

## Wilson 95% CI per tier onder Filter C (strict pre-match)

| Tier | N | Accuracy | 95% CI |
|---|---:|---:|---|
| **Free** | 2 | 0.0% | [0.0%, 65.8%] |
| **Silver** | 2 | 50.0% | [9.5%, 90.5%] |
| **Gold** | 7 | 57.1% | [25.0%, 84.2%] |
| **Platinum** | 0 | — | — |
| **Totaal** | 11 | 45.5% | [21.3%, 72.0%] |

---

## Conclusie


- **9307** predicties na v8.1-source + cutoff filter.
- **3318** daarvan heeft `predicted_at ≤ scheduled_at` — dit is wat de site toont.
- **11** daarvan is écht pre-match (`predicted_at < scheduled_at`, strict kleiner).
- **3307** predicties hebben `predicted_at = scheduled_at` (batch-simulatie op kickoff-tijd).

### Welk getal is 'waar'?
- Filter B is **historische modelvalidatie**: hoe goed het model zou hebben voorspeld met alleen pre-kickoff data, in batch geëvalueerd.
- Filter C is **honest engine**: alleen picks die strikt vóór aftrap zijn vastgelegd (live + een paar vroeg-gescheduled backtests).
- Beide zijn legitiem, afhankelijk van welke claim je maakt.
- Marketing-claim 'wat het model kan' → Filter B acceptabel.
- Marketing-claim 'wat wij voorspellen vóór de wedstrijd' → Filter C is de enige eerlijke optie.
