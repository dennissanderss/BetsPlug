# Feature Pipeline Verification Report

**Datum:** 16 april 2026
**Vraag:** Zijn de features die `ProductionV8Model` in productie genereert EXACT gelijk aan die van `train_local.py`?
**Antwoord:** **NEE. 22 van 39 features verschillen systematisch.**

---

## Methode

Script `backend/scripts/verify_feature_parity.py` vergelijkt features op 10 recente matches (april 2026):
1. Lokale pipeline: `train_local.py::compute_features` op volledige dataset
2. Productie pipeline: `ProductionV8Model._build_feature_vector` met backend-style `match_context` (5 form matches, season-only stats, h2h uit DB)

## Resultaten

**22 van 39 features verschillen. Geen enkele match had identieke feature vectors.**

### Kritieke verschillen

| Feature | Mismatches | Max verschil | Root cause |
|---------|:----------:|:------------:|------------|
| `h_mp` (matches_played) | 10/10 | **243** | Local = ALLE matches history; Production = alleen huidige seizoen |
| `a_mp` | 10/10 | **244** | Zelfde |
| `h_gd_season` | 10/10 | 0.84 | Zelfde (all-history goals / matches vs season-only) |
| `a_gd_season` | 10/10 | 0.53 | Zelfde |
| `h_swr` (win rate) | 10/10 | 0.19 | Zelfde |
| `a_swr` | 10/10 | 0.17 | Zelfde |
| `h_consistency` | 10/10 | 0.74 | Local = std over last 10; Production = over last 5 |
| `a_consistency` | 10/10 | 0.62 | Zelfde |
| `h_home_ppg` | 10/10 | **1.8** | Local = full history filtered home-only; Production = last 5 filtered |
| `a_away_ppg` | 10/10 | 1.0 | Zelfde |
| `h_home_wr` / `a_away_wr` | 8-9/10 | 0.4-0.6 | Zelfde |
| `h_ppg10` / `a_ppg10` | 9/10 | 0.5-0.7 | Local = 10 matches; Production = 5 (backend `_FORM_MATCHES = 5`) |
| `h_gd10` / `a_gd10` | 9-10/10 | 0.6-1.8 | Zelfde |
| `venue_form_diff` (derived) | 9/10 | 2.1 | Propagatie van `h_home_ppg` en `a_away_ppg` |
| `gd_diff` (derived) | 10/10 | 0.57 | Propagatie van `h_gd_season` / `a_gd_season` |
| `h_cs_pct` / `a_cs_pct` | 7/10 | 0.3 | Local = clean sheets last 10; Production = last 5 |
| `h2h_home_wr` / `h2h_draw_pct` | 4-5/10 | 0.6 | Subtiele volgorde / filtering verschillen |

### Voorbeeld uit match 1 (april 2026)

```
Feature            Local    Production   Diff
h_mp              223.000    33.000     190.000
a_mp              151.000    33.000     118.000
h_home_ppg          2.200     3.000       0.800
h_gd_season         0.179     0.970       0.790
a_away_ppg          1.400     2.000       0.600
```

**Interpretatie:** De matches_played van 223 (local) naar 33 (production) betekent dat
lokaal telt alle historie van het team (5+ seizoenen = ~220-270 matches), terwijl productie
alleen het huidige seizoen telt (~30-40 matches).

---

## Root Cause Analyse

### Verschil 1: `season_stats()` interpretatie

**train_local.py (line 173-183):**
```python
def season_stats(team_id, history):
    season_matches = [r for r in history if True]  # ALL history, no season filter!
    mp = len(season_matches)
    ...
```

**Productie (`app/forecasting/forecast_service.py::_get_team_stats`):**
```python
stmt = select(Match).where(
    Match.season_id == season_id,   # Filter op SEIZOEN
    Match.scheduled_at < before,
    ...
)
```

**Gevolg:** Feature "h_mp" betekent fundamenteel verschillende dingen in beide pipelines.

### Verschil 2: `_FORM_MATCHES = 5` in backend

**train_local.py:**
- Bouwt per match een `team_results[team_id]` accumulator met ALLE history
- Last-5 → laatste 5 van complete history
- Last-10 → laatste 10 van complete history

**Productie (`forecast_service.py::_get_team_form`):**
```python
_FORM_MATCHES = 5  # Alleen laatste 5 geladen uit DB
```

**Gevolg:** ProductionV8Model krijgt maar 5 matches om `h_ppg10`, `h_consistency`, `h_cs_pct`
op te bouwen. De comment in `production_v8_model.py:233-236` geeft toe:

```python
# ── Form last 10 — the backend only loads 5, so we approximate ──
# This is a minor fidelity loss vs train_local.py
```

"Minor" bleek NIET minor — dit raakt 9-10 van 10 features.

### Verschil 3: Home-only / Away-only filtering

**train_local.py:**
```python
h_home_hist = [m for m in home_history if m.is_home == True]  # uit ALLE history
```

Dit geeft typisch 50-100 home matches om over te middelen.

**ProductionV8Model:**
```python
h_home_hist = [h for h in h_hist5 if h["is_home"] is True]  # uit laatste 5
```

Dit geeft typisch 2-3 home matches. Veel meer ruis per prediction.

---

## Impact op validatie

**De walk-forward validatie cijfers zijn NIET gevalideerd voor productie.**

Walk-forward validatie gebruikte de lokale features:
- 39 features met full-history season_stats + 10-match form
- 28,838 out-of-sample test picks
- 78.2% accuracy bij ≥75% confidence

Productie-ensemble gebruikt andere features:
- Zelfde 39 namen, andere interpretatie (season-only + 5-match form)
- Model is op andere feature distribution getrained

**Gemeten productie-accuracy** (16 april 2026):
- Platinum (≥75%): **73.0%** vs 78.2% walk-forward (-5.2pp)
- Gold+ (≥65%): **60.1%** vs 70.6% walk-forward (-10.5pp)

De Gold+ gap van 10.5pp is te groot voor puur cold-start effect — deze feature mismatch
is een primaire oorzaak.

---

## Fix-opties

### Optie A — Backend aanpassen aan train_local (aanbevolen)

Wijzig `backend/app/forecasting/forecast_service.py`:
1. `_FORM_MATCHES = 5` → **10**
2. `_get_team_stats(season_id, before)` → laat season_id weg; gebruik ALLE historische matches (of voeg nieuwe `_get_team_total_history()` toe die dit doet)
3. Pas `ProductionV8Model._build_feature_vector` aan om `form_10` afzonderlijk te verwerken

**Voordelen:**
- Behoud huidige getrainde `.pkl` modellen (walk-forward gevalideerd)
- 67-78% cijfers worden weer geldig
- ~1-2 uur code werk

**Nadelen:**
- Match context is groter (10 matches ipv 5) → licht zwaarder op DB
- Backend moet ALLE history kunnen loaden voor season_stats

### Optie B — Productie features leren

Hertrain XGBoost + Logistic op de features die productie WEL genereert (season-only, 5-match).

**Voordelen:**
- Minder backend wijzigingen
- Volledig consistent model + features

**Nadelen:**
- ~2-3 uur werk (nieuwe walk-forward validatie)
- Mogelijk lagere accuracy (minder feature info)
- Bestaande `.pkl` files zijn waardeloos

---

## Aanbeveling

**Optie A.** De lokale features zijn rijker (10-match form, full-history season stats),
dat geeft meer signaal. We hebben al bewijs dat die combinatie 78% haalt op premium picks.

Backend bug fixen = 1-2 uur werk en je houdt je gevalideerde model.

## Action items

- [ ] Bevestig keuze: A (fix backend) of B (retrain)
- [ ] Bij A: PR op forecast_service.py met `_FORM_MATCHES = 10` + all-history season stats
- [ ] Herverificeer: run `verify_feature_parity.py` tot 0/39 mismatches
- [ ] Regenereer productie predictions (Celery pakt het daarna vanzelf op)
- [ ] Meet opnieuw: Platinum accuracy → zou terug naar ~78% moeten gaan
