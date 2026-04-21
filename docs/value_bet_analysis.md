# Value Bet Engine — Fase 1 Data Analyse

**Datum:** 2026-04-21
**Auteur:** analyse gedraaid tegen Railway PostgreSQL (read-only)
**Scripts:**
- `backend/scripts/value_bet_phase1_inventory.py`
- `backend/scripts/value_bet_phase1_snapshot_probe.py`
- `backend/scripts/value_bet_phase1_indicative.py`

---

## TL;DR — niet levensvatbaar in huidige staat

**De data ondersteunt een betrouwbare value-bet backtest op dit moment NIET.**
De odds-pipeline leeft pas sinds 2026-04-15 (6 dagen) en heeft één enkele bron
(`api_football_avg`). Er zijn 184 predictions met gevulde
`closing_odds_snapshot` en 104 evaluated — ver onder het minimum van 500 uit de
Fase 1 brief. Elk getal dat daaruit volgt is richting-indicatief, niet
publiceerbaar.

**Drie bruikbare paden voorwaarts (keuze aan stakeholder — niet mijn besluit):**

| # | Pad | Consequentie | Eerste oplevering |
|---|-----|--------------|-------------------|
| A | **Wachten** tot sample n >= 500 evaluated-met-odds | Zuivere backtest, eerlijke ROI-claim | ~8-10 weken (bij ~50 evals/week) |
| B | **Bouwen zonder backtest-claim** — alleen live meting, "meting loopt, te klein voor conclusies" tot n >= 30 | Snel zichtbaar, geen ROI-claims mogelijk | nu bouwbaar, 3-4 weken voor eerste honest-sample |
| C | **Historisch odds-archief** importeren (bv. Betfair historical, Oddsportal-dump) | Backtest mogelijk, maar odds-bron != live-bron -> distribution shift risico | 1-2 weken voor import + validatie |

Ik raad **pad B** aan als snelle zichtbaarheid nodig is, met pad A als
parallel-spoor. Pad C alleen als extern budget beschikbaar is en distribution-
shift apart gevalideerd wordt.

---

## 1.1 Odds-data inventarisatie

| Metric | Waarde |
|--------|-------:|
| `odds_history` rows | **4,714** |
| `predictions` rows | 98,483 |
| `prediction_evaluations` rows | 98,162 |
| `matches` rows | 58,160 |
| Unieke odds-bronnen | **1** — `api_football_avg` |
| Markten in odds_history | `1x2`, `btts`, `over_under_2_5` |
| 1x2 odds-rows totaal | 1,572 |
| Odds-data vanaf | **2026-04-15 20:45 UTC** |
| Odds-data tot | 2026-04-21 15:11 UTC |
| Pre-kickoff odds-rows | **1,572 (100%)** ✔ |
| Post-kickoff odds-rows | 0 |

**Bookmaker-margin:** niet per-bookmaker meetbaar — we hebben één bron die zelf
al een average is. `closing_odds_snapshot.implied_probs_fair` wordt door de
pipeline ingevuld; margin zit al gecorrigeerd in de fair probabilities.

---

## 1.1.b Predictions met odds — overlap

| Metric | n |
|--------|---:|
| predictions met ≥1 1x2 odds-row (`odds_history`) | 455 |
| daarvan: geëvalueerd | **189** |
| predictions met `closing_odds_snapshot` != null/{} | **184** |
| daarvan: `live` source | 145 |
| daarvan: geëvalueerd | **104** |

`predictions.closing_odds_snapshot` blijkt al een kant-en-klare waarde-laag te
bevatten (per rij):

```json
{
  "pick": "HOME",
  "source": "api_football_avg",
  "bookmaker_odds":     {"home": 1.885, "draw": 3.446, "away": 4.061},
  "implied_probs_fair": {"home":  ...,  "draw":  ...,  "away":  ... },
  "model_edge":         {"home": 0.1097,"draw": -0.0514,"away": -0.0583},
  "expected_value":     {"home": 0.144, "draw": -0.2398,"away": -0.2994},
  "is_value_bet": true
}
```

Dat betekent: de engine-laag die in Fase 3 gebouwd zou worden bestaat in
rudimentaire vorm al. **Geen nieuwe selectie-rekenkern nodig — alleen
aggregatie, selectie-van-de-dag, evaluatie en UI.**

---

## 1.2-1.4 Implied prob & edge-distributie (n=104)

Sample is onder publiceer-drempel. Alleen als richting-indicator:

| Best-edge stat | Waarde |
|----------------|-------:|
| n | 104 |
| mean | +7.5% |
| median | +6.0% |
| p90 | +14.3% |
| p95 | +16.1% |
| max | +22.8% |
| % rows met best_edge > 0 | **100%** |

**Rood vlag:** 100% van gesampelde predictions heeft érgens een positieve edge.
Dat wijst sterker op model-overconfidence / bookmaker-alignment-mismatch dan
op werkelijke alpha. Zie risico 2.2 (volgende fase).

---

## 1.5 Threshold-simulatie (indicatief, n veel te klein)

Flat 1u stake op best-edge outcome, odds-filter 1.50 ≤ odds ≤ 5.00, geen
staking-adjustment.

| threshold | picks | acc% | avg_odds | ROI% | pnl_u |
|----------:|------:|-----:|---------:|-----:|------:|
| 0%  (no filter) | 83 | 39.8 | 2.87 | +8.7 | +7.2 |
| 3%  | 76 | 40.8 | 2.84 | +10.7 | +8.2 |
| 5%  | 53 | 41.5 | 2.75 | +3.7  | +1.9 |
| 8%  | 33 | 45.5 | 2.87 | **+16.7** | +5.5 |
| 10% | 28 | 42.9 | 2.85 | +11.3 | +3.2 |
| 15% | 10 | 30.0 | 3.66 | -1.3  | -0.1 |

**Interpretatie:** getallen zijn niet-interpreteerbaar met n=10-83. Max
drawdown en Sharpe niet berekend — sample-window is 6 dagen, geen zinvolle
risicomaat daaruit af te leiden.

---

## 1.6 Odds-range @ edge ≥ 5% (indicatief, n te klein)

| range | picks | acc% | ROI% | pnl_u |
|-------|------:|-----:|-----:|------:|
| 1.50-2.00 |  9 | 66.7 | +12.1 | +1.1 |
| 2.00-3.00 | 25 | 40.0 |  -4.7 | -1.2 |
| 3.00-5.00 | 19 | 31.6 | +10.7 | +2.0 |
| 5.00+     |  7 | 14.3 |  -9.9 | -0.7 |

Geen uitspraak mogelijk bij deze sample-groottes.

---

## 1.7 Conclusie & aanbeveling

### Is de data-basis voldoende?

**Nee.** De brief eist minimum 500 predictions met odds-data voor een
betrouwbare backtest. We hebben 104-189 (afhankelijk van hoe streng
"met odds" gedefinieerd is). Dat is **21-38% van het minimum**.

### Wat werkt er wel?

1. **Odds-pipeline werkt** — 1,572 rows, 100% pre-kickoff, lijnbeweging (max
   7 snapshots per match) aanwezig voor closing-line-value analyse later.
2. **Value-laag bestaat al** in `closing_odds_snapshot` JSONB — elke pred krijgt
   al een `is_value_bet` flag, `expected_value` dict, `model_edge` en
   `implied_probs_fair`. Selectie-engine hoeft hier niet opnieuw gebouwd.
3. **Engine v8.1 niet aangeraakt** — value-laag is orthogonaal.

### Wat mist er voor launch-waardige backtest?

- **Sample-omvang:** n >= 500 evaluated predictions met odds.
- **Multi-bookmaker:** nu één bron, geen arbitrage/fair-line derivation
  mogelijk; `implied_probs_fair` is gebaseerd op 1 boekmaker-marge, niet
  op cross-book consensus.
- **Kalibratie-validatie:** 100% van sample heeft edge > 0 — dit moet eerst
  opgelost worden in Fase 2 (risico-analyse) voor we betrouwbaarheid kunnen
  claimen.
- **Tijdsdiepte:** 6 dagen is te kort om seizoen-effecten, cluster-variantie,
  drawdown-distributie of Sharpe te meten.

### Aanbevolen parameters — ALS Fase 3 toch start (pad B)

Met expliciete disclaimer "meting loopt, sample n<30":

- **Edge threshold:** 8% (hoogste indicatieve ROI, minste vals-positieven —
  maar met n=33 is dit een educated guess, geen statistisch onderbouwde keuze)
- **Odds-range:** 1.50 ≤ odds ≤ 3.50 (de 3.00-5.00 range heeft nog te veel
  variantie; 5.00+ presteert slecht in de mini-sample)
- **Tier-voorkeur:** preferent uit Gold/Platinum-scope predictions (kalibratie
  is daar het best gemeten)
- **Selectie:** 1 pick per dag, hoogste `edge × confidence` score
- **Evaluatie:** backtest-veld leeg laten tot n >= 500, ALLEEN live-meting
  tonen

### Volgende stap

**Stop. Wacht op akkoord.** De vervolgfase-beslissing is:

- **Pad A/C** → Fase 2 risico-analyse uitstellen, dataverzameling opschalen.
- **Pad B** → Fase 2 risico-analyse nu starten, maar met het expliciete
  statement dat de backtest-claim niet leverbaar is bij launch en de UI
  alleen "live meting (n < 30)" kan tonen.

Mijn inschatting: pad B met sterke honesty-disclaimers past bij de eerdere
v7/v8 honest-ROI principes van dit platform. Pad A alleen is de meest
zuivere keuze maar zet de feature 2-3 maanden op hold.
