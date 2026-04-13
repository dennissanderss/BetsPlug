# BetsPlug Engine Validation Protocol

## Prompt voor eerlijke backtest en engine validatie

Gebruik deze prompt in elke toekomstige sessie waarin de prediction engine wordt gewijzigd of gevalideerd.

---

### Context

BetsPlug is een AI-gedreven voetbalvoorspellingsplatform. De engine gebruikt een ensemble van statistische modellen (Elo + Logistic Regression) om wedstrijduitslagen te voorspellen. Alle voorspellingen zijn voor educatieve doeleinden en vormen geen financieel advies.

### Validatie-eisen

Bij ELKE wijziging aan de engine, features, of gewichten MOET je:

1. **Data splitsen op datum**:
   - Backtest: alle wedstrijden tot en met 31-12-2025
   - Validatie: alle wedstrijden vanaf 01-01-2026
   - NOOIT trainen op validatiedata

2. **Point-in-time enforcement**:
   - Features mogen ALLEEN data bevatten die beschikbaar was VOOR de kickoff
   - Elo ratings moeten strict `effective_at < scheduled_at` zijn
   - Teamvorm: alleen wedstrijden met kickoff VOOR de te voorspellen wedstrijd
   - H2H: alleen historische ontmoetingen

3. **Eerlijke evaluatie**:
   - Accuracy: % correct voorspeld van gevalueerde picks
   - BOTD accuracy: accuracy van picks met confidence >= 0.60
   - P/L: ALLEEN berekenen met echte bookmaker odds, niet met implied odds uit het model
   - Brier score: lagere = beter gecalibreerd

4. **Overfitting check**:
   - Backtest accuracy en validatie accuracy mogen maximaal 3 procentpunt afwijken
   - Als validatie accuracy > 5pp lager is dan backtest: vermoeden van overfitting
   - Altijd minstens 200 picks in de validatieset

5. **Rapporteer altijd**:
   - Backtest accuracy + sample size
   - Validatie accuracy + sample size
   - BOTD accuracy + sample size (backtest EN validatie)
   - Per-league accuracy breakdown
   - Configuratie: welke modellen, welke gewichten
   - Welke features zijn gebruikt

### Huidige optimale configuratie (v7, 13 april 2026)

```
Ensemble weights:
  Elo:      1.2
  Poisson:  0.0 (uitgeschakeld)
  Logistic: 2.0
  XGBoost:  0.0 (uitgeschakeld)

BOTD threshold: 0.60 (60% confidence minimum)

Resultaten:
  Backtest (pre-2026):  50.4% overall, 70.1% BOTD (432 picks)
  Validatie (2026):     48.9% overall, 71.1% BOTD (232 picks)
  
Grid search: 1,295 configuraties getest op 6,502 predictions
```

### Verboden acties

- NOOIT accuracy rapporteren zonder duidelijk te vermelden of het backtest of live data is
- NOOIT P/L berekenen met implied odds van het eigen model
- NOOIT features gebruiken die toekomstige data bevatten (leakage)
- NOOIT gewichten tunen op de validatieset
- NOOIT "66.7% accuracy" claimen zonder de context (welke periode, hoeveel picks, live of backtest)
