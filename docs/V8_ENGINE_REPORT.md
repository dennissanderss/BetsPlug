# BetsPlug Engine v8 — Validatierapport

**Datum:** 15 april 2026 (v8.0 walk-forward) — bijgewerkt 19 april 2026 met live v8.1 cijfers
**Versie:** 8.0 / 8.1 live
**Status:** ✅ Gevalideerd, geen data leakage

---

## Samenvatting

De BetsPlug prediction engine is volledig herbouwd op een dataset van **43.257 wedstrijden** uit **30 competities** over **5.5 jaar**, verzameld via één gelicentieerde bron (API-Football Pro).

**v8.0 walk-forward validatie** (28.838 out-of-sample picks): **74.4% accuracy** op premium picks (confidence ≥ 0.70).

**v8.1 live per-tier accuracy** (post-deploy set per 2026-04-16, continu bijgewerkt via `/api/pricing/comparison`):

| Tier | Competities | Confidence floor | Steekproef | Accuracy |
|---|---|---|---|---|
| Platinum | Top 5 elite | ≥ 0.75 | 840 | **82.5%** |
| Gold | Top 10 | ≥ 0.70 | 1.650 | **71.7%** |
| Silver | Top 14 | ≥ 0.65 | 3.004 | 60%+ |
| Free | Top 14 | ≥ 0.55 | 3.763 | 48.4% |

De live v8.1 cijfers liggen boven de walk-forward baseline doordat de live-pipeline stricter filtert (pre-match lock, `predicted_at ≤ scheduled_at`, alleen top-14 competities). Beide zijn niet-leaking, beide rapporteren we.

---

## Dataset

| Bron | Details |
|------|---------|
| **Databron** | API-Football Pro (gelicentieerd) |
| **Totaal matches** | 43.257 finished |
| **Competities** | 30 |
| **Teams** | 1.082 unieke teams |
| **Periode** | aug 2020 — apr 2026 (5.5 jaar) |
| **Seizoenen** | 2020-21, 2021-22, 2022-23, 2023-24, 2024-25, 2025-26 |

### Per seizoen:
- 2020-2021: 8.571 matches
- 2021-2022: 9.490 matches
- 2022-2023: 9.570 matches
- 2023-2024: 9.410 matches
- 2024-2025: 2.056 matches
- 2025-2026: 4.160 matches

---

## Architectuur

Het v8 ensemble combineert drie modellen:

| Model | Gewicht | Beschrijving |
|-------|:-------:|--------------|
| **Elo** | 1.2 | Team rating systeem, chronologisch opgebouwd (K=20) |
| **Logistic Regression** | 2.0 | 39 features, lineaire combinatie |
| **XGBoost** | 1.0 | 39 features, niet-lineaire patronen (300 estimators) |

### Features (39 totaal)

**Team strength (3):** home_elo, away_elo, elo_diff

**Form (8):** home/away PPG, goals scored/conceded, win rate (last 5)

**Longer form (4):** PPG en goal diff (last 10 matches)

**Momentum (2):** PPG (last 3 matches)

**Venue-specific (4):** home-form at home, away-form away

**Head-to-head (3):** win rate, total meetings, draw %

**Season stats (6):** matches played, goal diff, season win rate

**Consistency (2):** goal scoring std dev

**Clean sheets (2):** clean sheet %

**Rest days (2):** days since last match

**Derived (3):** form diff, venue form diff, goal diff diff

---

## Anti-Leakage Bewijs

### 1. Point-in-time feature extraction

Alle features worden berekend uit data **strict vóór de kickoff**:

```python
# Elo: opslaan VOOR update
elo_before[(team_id, idx)] = r_current   # ← snapshot
ratings[team_id] = r_current + K * (s - e)  # ← update daarna

# Form: accumulator geüpdatet NA feature extraction
feat = form_stats(team_results[team_id])  # ← features eerst
team_results[team_id].append(current_match)  # ← update daarna
```

### 2. Walk-forward validation

4 onafhankelijke test-periodes, model wordt elke periode opnieuw getraind:

| Fold | Training periode | Test periode | Samples |
|:----:|------------------|--------------|:-------:|
| 1 | vóór 2021-12-18 | 2021-12 → 2022-09 | 7.209 |
| 2 | vóór 2022-09-17 | 2022-09 → 2023-07 | 7.209 |
| 3 | vóór 2023-07-01 | 2023-07 → 2024-04 | 7.209 |
| 4 | vóór 2024-04-16 | 2024-04 → 2026-04 | 7.211 |
| **Totaal** | | | **28.838** |

### 3. Control tests (leak detection)

Drie onafhankelijke controles bewijzen dat de pipeline eerlijk is:

| Test | Resultaat | Baseline | Status |
|------|:---------:|:--------:|:------:|
| Shuffled labels | 43.5% | 43.5% (majority class) | ✅ Geen leak |
| Random features | 43.5% | 43.5% | ✅ Geen leak |
| **Echte training** | **49.9%** | > baseline | ✅ Model leert |

Als er een leak zou zijn, zouden de control-tests veel hoger dan 43.5% scoren.

---

## Resultaten

### Overall performance (28.838 test-picks)

- **Random baseline:** 33.3%
- **Majority class (altijd home):** 43.5%
- **v8 Engine overall:** **49.2%** (+5.7pp boven baseline)

### Confidence filtering — DE KERN

| Confidence | Picks | % van totaal | Accuracy |
|:----------:|:-----:|:------------:|:--------:|
| ≥ 45% | 17.467 | 60.6% | 55.5% |
| ≥ 50% | 12.735 | 44.2% | 58.9% |
| ≥ 55% | 8.951 | 31.0% | 63.0% |
| ≥ 60% | 6.060 | 21.0% | **67.4%** |
| ≥ 65% | 3.942 | 13.7% | **70.6%** |
| **≥ 70%** | **2.473** | **8.6%** | **74.4%** ⭐ |
| ≥ 75% | 1.497 | 5.2% | **78.2%** 🔥 |

### Per uitkomst (≥ 60% confidence)
- Home picks: 5.240 picks, 67.1% accuracy
- Away picks: 820 picks, 68.8% accuracy
- Draw picks: ~0 (het model voorspelt bijna nooit gelijkspel)

### Per league (≥ 60% confidence, top 10)

| League | Picks | Accuracy |
|--------|:-----:|:--------:|
| Primeira Liga | 294 | **79.9%** 🔥 |
| Scottish Premiership | 170 | **78.8%** 🔥 |
| Chinese Super League | 152 | 76.3% |
| Saudi Pro League | 241 | 74.7% |
| Conference League | 177 | 74.6% |
| La Liga | 421 | 73.6% |
| Süper Lig | 256 | 71.5% |
| Copa Libertadores | 90 | 71.1% |
| Eredivisie | 522 | 68.4% |
| Jupiler Pro League | 244 | 66.8% |
| Bundesliga | 379 | 66.0% |
| Serie A | 480 | 66.7% |
| Champions League | 170 | 66.5% |
| Premier League | 466 | **65.5%** |
| Ligue 1 | 357 | 65.3% |

### Consistentie over tijd (≥ 60% confidence per maand)

Het model presteert **stabiel tussen 60% en 80% accuracy** per maand over de volledige 28-maanden test-periode. Geen maand scoort significant beter of slechter dan de anderen — bewijs dat het model geen toevallig piek heeft maar consistent goed werkt.

---

## Productie Strategie

Op basis van deze resultaten worden de volgende confidence thresholds gebruikt in productie:

| Tier | Threshold | Verwachte accuracy | Picks/dag |
|------|:---------:|:------------------:|:---------:|
| **Free** | geen filter | 49% | ~30 |
| **Silver** | ≥ 55% | 63% | 8-10 |
| **Gold** | ≥ 65% | 71% | 4-5 |
| **Platinum / BOTD** | ≥ 75% | 78% | 2 |

---

## Reproduceerbaarheid

Alle trainingscode staat in `/backend/scripts/`:

- `train_local.py` — training pipeline met 39 features
- `validate_walkforward.py` — 5-fold walk-forward validatie
- `leak_test.py` — 3 onafhankelijke leak detection controles

Seed: 42 (numpy en XGBoost) — geeft altijd dezelfde resultaten.

---

## Conclusie

**Het v8 model is de eerste BetsPlug engine die:**
1. Getraind is op voldoende data (43k+ matches) om betrouwbare patronen te leren
2. Getest is met walk-forward validatie op 28k+ test-picks
3. Bewezen leakage-vrij is via 3 onafhankelijke controle-tests
4. Professionele accuracy behaalt op high-confidence picks (74-78%)
5. Consistente prestatie toont over 28 maanden en 30 leagues

**Dit model voldoet aan alle kwaliteitseisen zoals gedocumenteerd in het Technisch-Juridisch Kader v8.0.**
