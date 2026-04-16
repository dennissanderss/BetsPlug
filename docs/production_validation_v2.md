# Production Validation v2 — Post Feature-Parity Fix

**Datum:** 16 april 2026
**Status:** IN PROGRESS — predictions regenereren, accuracy-meting volgt
**Context:** Opvolger van `feature_pipeline_verification.md`. Documenteert de impact van de v8.1 backend-fix op accuracy cijfers.

---

## Samenvatting

De productie feature-pipeline week af van `train_local.py` (de walk-forward gevalideerde pipeline) in 22 van 39 features. Dit verklaart waarom productie-accuracy 5–11 procentpunt lager lag dan het gevalideerde model (Platinum 73% i.p.v. 78%, Gold+ 60% i.p.v. 70%).

De backend is gefixed in commit `b7270b9`. Na deploy naar Railway zijn feature-mismatches teruggebracht van **22/39 → 0/39** (100% parity).

Dit document volgt de accuracy-meting op de nieuwe pipeline.

---

## Uitgevoerde fixes

### 1. `_FORM_MATCHES` 5 → 30
Het oude systeem laadde alleen de laatste 5 matches per team. `train_local.py` gebruikt de volledige history. Bumping naar 30 matches geeft genoeg data om:
- Last-5 en last-10 form features identiek te berekenen
- Home-only / away-only filters met ~10 matches te voeden (i.p.v. 2-3)

### 2. `_get_team_stats` — season filter verwijderd
`train_local.py` gebruikt **alle** historische matches voor `h_mp`, `h_gd_season`, `h_swr`. De backend filterde op `season_id`, wat alleen het huidige seizoen (~30-40 matches) gaf i.p.v. ~220-270 matches. Gevolg: `h_mp` verschil van **243 matches** per prediction.

### 3. `_get_team_form` — league filter verwijderd
Backend filterde op `league_id`; `train_local.py` gebruikt cross-league history. Kleinere impact (teams spelen zelden buiten hun liga) maar wel gefixed voor volledige parity.

### 4. `_get_h2h` — volgorde omgedraaid
`train_local` bouwt h2h oudste-eerst, `h2h[-5:]` = 5 meest recente. Backend leverde nieuwste-eerst via `ORDER BY DESC LIMIT 10`, dus `h2h[-5:]` gaf de 5 *oudste* van de 10 meest recente. Gefixed door te reversen.

### 5. `ProductionV8Model._build_feature_vector`
- Hernoemd `h_hist5` / `a_hist5` → `h_hist` / `a_hist` (geen 5-match truncatie meer)
- "Approximate last-10" blok verwijderd — nu echte 10-match window
- `_goal_consistency`, `_clean_sheet_pct`, `_days_rest` gebruiken volle history

---

## Verification script resultaat

`backend/scripts/verify_feature_parity.py` vergelijkt `train_local.py::compute_features` vs `ProductionV8Model._build_feature_vector` op 10 recente matches:

| Run | Mismatches | Status |
|-----|:----------:|--------|
| Voor fix | 22/39 features verschilden op alle 10 matches | ❌ Pipeline kapot |
| Na bump `_FORM_MATCHES=10` + season-fix | 7/39 (venue + H2H gaten) | ⚠️  Deels gefixed |
| **Na bump `_FORM_MATCHES=30` + H2H reverse** | **0/39** | ✅ Volledige parity |

---

## Impact op accuracy

**Voor fix (gemeten 16 april):**
- Platinum (≥75% conf): 73.0%  vs walk-forward 78.2%  → -5.2pp
- Gold+ (≥65% conf): 60.1%  vs walk-forward 70.6%  → -10.5pp

**Na fix (nog te meten):**
- Target Platinum: ~78%
- Target Gold+: ~70%
- Target BOTD (≥60%): ~67%

### Meetmethode

- 71,077 bestaande predictions zijn gemaakt met de KAPOTTE pipeline → NIET representatief
- 20,751 finished matches hebben nog geen prediction → worden nu gegenereerd met de GEFIXTE pipeline
- Accuracy wordt gemeten op deze nieuwe set (groter dan walk-forward's 28,838)
- Predictions waarvan created_at > deploy-timestamp = nieuwe pipeline

---

## Model compatibility

Belangrijke check: de pre-trained `.pkl` bestanden:
- `backend/models/xgboost_model.ubj`
- `backend/models/logistic_model.pkl`
- `backend/models/feature_scaler.pkl`

Deze zijn op de oorspronkelijke (correcte) feature distributie getraind via `train_local.py`. De fix zorgt ervoor dat productie-inputs nu matchen met hoe het model getrained is. **Geen retrain nodig.**

---

## Action items

- [x] Stap 1: `_FORM_MATCHES` 5 → 30
- [x] Stap 2: `_get_team_stats` season filter weg
- [x] Stap 2b: `_get_h2h` reverse + `_get_team_form` league filter weg
- [x] Stap 3: `verify_feature_parity.py` → 0/39
- [x] Stap 4: Deploy naar Railway (commit `b7270b9`)
- [ ] Stap 5: Fill 20,751 predictions met nieuwe pipeline — IN PROGRESS (~90 min)
- [ ] Stap 6: Meet Platinum / Gold+ / BOTD accuracy op nieuwe set
- [ ] Stap 7: Update dit document met resultaten + beslissen: accept (>target) of debug (<target)

---

## Next run-log (auto-invullen)

Predictions regeneratie log en accuracy-cijfers worden hieronder bijgehouden zodra de fill klaar is.
