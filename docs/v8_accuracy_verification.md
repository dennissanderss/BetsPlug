# V8.1 Accuracy Cijfers — Verificatie Rapport

**Datum:** 16 april 2026
**Script:** `backend/scripts/verify_accuracy_numbers.py`
**Te verifiëren claim:** Platinum **82.5%** / Gold+ **71.7%** / BOTD **66.9%** op n=**19,697** predictions.
**Acceptatie criteria:** max 1pp afwijking bij hermeten; tellingsfouten of onlogische waarden = FLAG.

---

## ⚠️ EINDCONCLUSIE — VLAGGEN GEVONDEN

| Vraag | Antwoord |
|-------|:--:|
| Kloppen gerapporteerde cijfers binnen 1pp bij hermeten? | **NEE** |
| Zijn er onlogische waarden? | **NEE** |
| Zijn er tellingsfouten? | **NEE** |

**De cijfers zijn niet fout berekend — maar ze zijn gemeten op een andere populatie dan later werd gecommuniceerd.** Zie §1 voor detail.

### Samengevat

- Eerdere rapportage `82.5% / 71.7% / 66.9%` op n=**19,697** was telling over TWEE populaties:
  - 19,151 `batch_local_fill` predictions (mijn lokale ensemble)
  - 546 `backtest` predictions (Celery / Railway backend, post-deploy)
- Filter op alleen `prediction_source='batch_local_fill'` (zoals jij vroeg) = 19,151 predictions en geeft **84.1% / 74.7% / 70.1%** — hoger omdat de 546 `backtest` preds gemiddeld slechter presteerden (44.9% overall vs 49.9%).
- Beide tellingen kloppen wiskundig. Het verschil is een filter-definitie mismatch, niet een rekenfout.

---

## 1. Hertel van de cijfers (acceptance check)

### 1a. Twee filter-strategieën geven twee sample sizes

| Filter | n |
|--------|:-:|
| `prediction_source = 'batch_local_fill'` (jouw expliciete vraag) | **19,151** |
| `created_at > 2026-04-16 11:40 UTC` (mijn eerdere filter) | **19,697** |
| Verschil | 546 |

De 546 verschillende predictions zijn allemaal `prediction_source='backtest'`, created_at window `11:40:00 → 11:47:56 UTC`. Waarschijnlijk door Celery of een backtest-taak op Railway, niet door `fill_predictions_local.py`.

### 1b. Hertel per tier — filter `prediction_source = 'batch_local_fill'`

| Tier | Count | Correct | Accuracy |
|------|:--:|:--:|:--:|
| Total | 19,151 | 9,559 | 49.9% |
| **Platinum (≥75%)** | 705 | 593 | **84.1%** |
| **Gold+ (≥65%)** | 2,125 | 1,588 | **74.7%** |
| **BOTD (≥60%)** | 3,343 | 2,343 | **70.1%** |
| Silver (≥55%) | 5,025 | 3,314 | 66.0% |
| Below (<55%) | 14,126 | 6,245 | 44.2% |

### 1c. Vergelijking met eerder gerapporteerd

| Tier | Eerder (n=19,697) | Nu (n=19,151) | Δ | Status |
|------|:--:|:--:|:--:|:--:|
| Platinum | 662 / 802 = 82.5% | 593 / 705 = 84.1% | **+1.61pp** | **FLAG** (>1pp) |
| Gold+ | 1,763 / 2,458 = 71.7% | 1,588 / 2,125 = 74.7% | **+3.03pp** | **FLAG** (>1pp) |
| BOTD | 2,582 / 3,858 = 66.9% | 2,343 / 3,343 = 70.1% | **+3.19pp** | **FLAG** (>1pp) |

**Oorzaak:** de 546 `backtest` predictions hebben per tier:

| Tier | Count | Correct | Accuracy |
|------|:--:|:--:|:--:|
| Platinum | 97 | 69 | 71.1% |
| Gold+ | 333 | 175 | 52.6% |
| BOTD | 515 | 239 | 46.4% |

Dit zijn systematisch slechter — ze trokken de gemengde meting omlaag tot 82.5% / 71.7% / 66.9%. Som-check:

- Platinum: 705 (batch) + 97 (backtest) = 802 ✓ | 593 + 69 = 662 ✓
- Gold+: 2,125 + 333 = 2,458 ✓ | 1,588 + 175 = 1,763 ✓
- BOTD: 3,343 + 515 = 3,858 ✓ | 2,343 + 239 = 2,582 ✓

Alle sommen kloppen. De eerdere 19,697-telling was **correct voor die populatie** — maar de populatie was gemengd, niet puur `batch_local_fill`.

---

## 2. Dubbele tellingen + tier overlap

- **Predictions per match_id binnen `batch_local_fill`:** 19,151 matches × 1 prediction = 1:1, geen duplicates.
- **Matches die in zowel `batch_local_fill` als andere source voorkomen:** 0.
- **Tier inclusiviteit som-check:**
  - Platinum alleen (705) + Gold-only (1,420) = 2,125 = Gold+ totaal ✓
  - Gold+ (2,125) + BOTD-only (1,218) = 3,343 = BOTD totaal ✓
- **Cumulatieve telling per design:** Platinum zit binnen Gold+ binnen BOTD — dat is correct en bedoeld.

**Geen tellingsfouten.**

---

## 3. Evaluatie-logica check — 20 random predictions

Voor elke random prediction: pick bepaald uit `argmax(home_win_prob, draw_prob, away_win_prob)`, actual uit score-vergelijking.

Resultaten:
- 20/20 picks correct bepaald (ad-hoc logica is deterministisch en klopt met intuitie).
- **0/20 hadden een rij in `prediction_evaluations`** — de officiële evaluatie-tabel dekt maar 200/19,151 = **1.0%** van de batch. Mijn ad-hoc berekening kon dus niet cross-checked worden tegen de DB.

**Wat wél gecheckt:** op de 200 predictions mét evaluation-rij was de DB-gebaseerde accuracy 50.0% (100/200) — consistent met de 49.9% ad-hoc total accuracy. Geen tekenen van logisch fout is_correct berekenen.

**Aandachtspunt:** het trackrecord-systeem in productie leest uit `prediction_evaluations`, niet uit ad-hoc SQL. Als die tabel niet backfilled is voor de 19,151 nieuwe preds, zal de productie-UI NIET de 84.1% Platinum cijfers laten zien — alleen wat er in de evaluatie-tabel staat.

---

## 4. Data integriteit

| Check | Resultaat |
|-------|:--:|
| FINISHED matches zonder score (niet evalueerbaar) | 0 |
| Predictions op NIET-finished matches | 0 |
| NULL confidence | 0 |
| NULL home/draw/away prob | 0/0/0 |
| Confidence buiten [0.33, 1.0] | 0 |
| Probs die niet naar 1 sommeren (tol 0.01) | 0 |

**Data is schoon. Geen onlogische waarden.**

---

## 5. Steekproef 5 random per tier

### Platinum (≥0.75)
```
match 7652e684 conf=0.87 pick=HOME score=6-0 actual=HOME CORRECT
match 7956dfa0 conf=0.78 pick=HOME score=0-1 actual=AWAY WRONG
match c8ffa568 conf=0.86 pick=HOME score=1-1 actual=DRAW  WRONG
match a7b26ade conf=0.85 pick=HOME score=4-1 actual=HOME CORRECT
match 8caed31d conf=0.87 pick=HOME score=3-1 actual=HOME CORRECT
```
→ **3/5** correct (60%). Kleine sample — 84.1% is gemiddelde over 705.

### Gold+ exclusive (0.65 ≤ conf < 0.75)
```
match 18e30ae9 conf=0.67 pick=HOME score=2-1 actual=HOME CORRECT
match c4896ad5 conf=0.69 pick=AWAY score=3-3 actual=DRAW  WRONG
match cf351ac9 conf=0.65 pick=AWAY score=0-5 actual=AWAY CORRECT
match 1a23de4d conf=0.73 pick=HOME score=3-1 actual=HOME CORRECT
match 457ed790 conf=0.66 pick=HOME score=1-0 actual=HOME CORRECT
```
→ **4/5** correct (80%). Boven gemiddelde, binnen verwachtingen van 74.7% op 2,125.

### BOTD exclusive (0.60 ≤ conf < 0.65)
```
match 3dd71d2a conf=0.62 pick=HOME score=0-1 actual=AWAY WRONG
match 73ecf4d9 conf=0.64 pick=HOME score=3-4 actual=AWAY WRONG
match 37a447a2 conf=0.62 pick=HOME score=2-0 actual=HOME CORRECT
match cf7d62a5 conf=0.63 pick=HOME score=3-2 actual=HOME CORRECT
match ddbec3e6 conf=0.64 pick=HOME score=2-0 actual=HOME CORRECT
```
→ **3/5** correct (60%). 70.1% over 3,343 is gemiddelde — 5-sample ruis verwacht.

**Alle 15 steekproef-picks handmatig gevalideerd. Geen enkele logisch fout.**

---

## Conclusie — expliciete JA/NEE

> **Kloppen de gerapporteerde cijfers (82.5% / 71.7% / 66.9%) binnen 1pp afwijking bij deze verificatie?**

**NEE.** Afwijking van respectievelijk **+1.61pp / +3.03pp / +3.19pp** bij hermeten met filter `prediction_source='batch_local_fill'` (19,151 rijen). De eerdere meting zat op n=19,697 en telde ook 546 `backtest`-source predictions mee die systematisch slechter presteerden. De eerdere telling was wiskundig correct voor die gemengde populatie, maar de populatie verschilde van wat ik later communiceerde ("batch_local_fill").

> **Zijn er onlogische waarden gevonden?**

**NEE.** Data is schoon: 0 NULLs, 0 invalid probs, 0 missing scores, alle tier-sommen kloppen, 20/20 handmatige evaluatie-picks correct.

> **Zijn er tellingsfouten?**

**NEE.** De telling was wiskundig correct. Wat wel FLAG-waardig is: de populatie-definitie was inconsistent (created_at vs prediction_source).

---

## Aanbevelingen (niet uitgevoerd — wachtend op beslissing)

1. **Voor officiële rapportage:** kies één populatie-definitie en documenteer die. Aanbeveling: filter op `prediction_source='batch_local_fill'` — geeft 19,151 preds en **84.1% / 74.7% / 70.1%**. Dit is de "cleanste" v8.1-only meting.

2. **`prediction_evaluations` tabel is voor 99% niet gevuld** voor de nieuwe preds. Het productie trackrecord-systeem leest uit deze tabel. Aanbeveling: een evaluator-run draaien zodat alle 19,151 preds een `is_correct` rij krijgen in `prediction_evaluations`. Anders toont trackrecord-UI deze 84% cijfers NIET.

3. **De 546 `backtest` predictions** kwamen van een ander proces dan `fill_predictions_local.py`. Waarom ze slechter presteren (71%/53%/46%) is niet 100% geverifieerd — mogelijk: race condition met de win_rate deploy, een andere model-versie in dat codepath, of toevallig een moeilijker matchvenster (enkele uren). Geen onderdeel van deze verificatie; flagging voor follow-up.

**Einde verificatie. Wachtend op beslissing.**
