# V10 Engine Audit Playbook

**Doel:** zodra de DB vol is (target: 55k+ matches, 1076 teams, 11k+ Elo ratings, 31k+ predictions), meten wát de nieuwe v8-engine werkelijk ondersteunt, vóórdat we UI-features bouwen.

**Runner:** psql tegen Railway Postgres, of via `/api/admin` endpoints. Per sectie staat hieronder:
1. SQL query (copy-paste ready)
2. Wat het meet
3. Beslissingsdrempel (wanneer is de feature haalbaar vs niet)

Vul de resultaten in de tabellen onderaan. Daarna → herziening v10 plan.

---

## 1. Basis-volumes

### 1.1 Rij-tellingen per hoofdtabel

```sql
SELECT 'matches'                    AS tbl, COUNT(*) FROM matches
UNION ALL SELECT 'teams',                     COUNT(*) FROM teams
UNION ALL SELECT 'leagues',                   COUNT(*) FROM leagues
UNION ALL SELECT 'predictions',               COUNT(*) FROM predictions
UNION ALL SELECT 'prediction_evaluations',    COUNT(*) FROM prediction_evaluations
UNION ALL SELECT 'prediction_explanations',   COUNT(*) FROM prediction_explanations
UNION ALL SELECT 'team_elo_history',          COUNT(*) FROM team_elo_history
UNION ALL SELECT 'odds_history',              COUNT(*) FROM odds_history
UNION ALL SELECT 'match_statistics',          COUNT(*) FROM match_statistics
UNION ALL SELECT 'standings_snapshots',       COUNT(*) FROM standings_snapshots
UNION ALL SELECT 'model_versions',            COUNT(*) FROM model_versions
ORDER BY tbl;
```

**Verwacht (target na fill):** matches ≥55k, teams ~1076, predictions ≥31k, elo_history ≥11k.
**Rood (stop):** predictions < 1000 → kan geen betrouwbare calibration tonen.

### 1.2 Welk model versie is actief

```sql
SELECT id, name, version, trained_at, is_active, sample_count
FROM model_versions
ORDER BY trained_at DESC
LIMIT 10;
```

**Wat:** verifieer dat v8 (43.256 samples, version 8.x) de `is_active=true` rij is.
**Rood:** actieve versie is niet v8 → engine draait nog op oude cache, audit is niet representatief.

---

## 2. Predictions coverage per feature

### 2.1 Coverage van jsonb-velden

```sql
SELECT
  COUNT(*)                                            AS total,
  COUNT(features_snapshot)                            AS has_features,
  COUNT(raw_output)                                   AS has_raw_output,
  COUNT(closing_odds_snapshot)                        AS has_closing_odds,
  COUNT(*) FILTER (WHERE predicted_home_score IS NOT NULL) AS has_poisson_goals,
  COUNT(*) FILTER (WHERE lead_time_hours > 0)         AS has_positive_leadtime,
  COUNT(*) FILTER (WHERE prediction_source = 'live')  AS live_picks,
  COUNT(*) FILTER (WHERE prediction_source = 'backtest') AS backtest_picks
FROM predictions;
```

**Wat:** welk percentage van predictions heeft de jsonb-data die features als Pick Reasoning, Match Deep Dive en Over/Under nodig hebben.

| Feature die dit ondersteunt | Nodige coverage |
|---|---|
| F1 Pick Reasoning (basis) | `has_features ≥ 95%` |
| F7 Match Deep Dive submodels | `has_raw_output ≥ 95%` |
| F2 Over/Under markten | `has_poisson_goals ≥ 95%` |
| F6 Engine Transparency (live vs backtest) | beide > 0, ratio zinvol |
| F3 Value Bets | `has_closing_odds ≥ 30%` (anders kapot) |

### 2.2 Is prediction_explanations eindelijk gevuld?

```sql
SELECT
  COUNT(*)                                                    AS total_rows,
  COUNT(*) FILTER (WHERE top_factors_for != '{}'::jsonb)      AS filled_for,
  COUNT(*) FILTER (WHERE top_factors_against != '{}'::jsonb)  AS filled_against,
  COUNT(*) FILTER (WHERE feature_importances IS NOT NULL)     AS has_importances
FROM prediction_explanations;
```

**Wat:** is de "waarom deze pick?" data gegenereerd? Was `{}` leeg in alle 26k rijen vóór v8.
**Rood:** `filled_for < 50% van total_rows` → Pick Reasoning nog steeds niet leverbaar. Moet backend-side opgelost in F1 build of direct gevuld via een backfill-job.

---

## 3. Confidence distributie per tier

### 3.1 Hoeveel picks per tier

```sql
SELECT
  CASE
    WHEN confidence >= 0.75 THEN 'platinum'
    WHEN confidence >= 0.65 THEN 'gold'
    WHEN confidence >= 0.60 THEN 'botd'
    WHEN confidence >= 0.55 THEN 'silver'
    ELSE 'below_silver'
  END AS tier,
  COUNT(*) AS n_picks,
  ROUND(AVG(confidence)::numeric, 3) AS avg_conf,
  ROUND(MIN(confidence)::numeric, 3) AS min_conf,
  ROUND(MAX(confidence)::numeric, 3) AS max_conf
FROM predictions
GROUP BY tier
ORDER BY avg_conf DESC;
```

**Wat:** verifieer v8 deploy claim (Platinum bereikt 0.877, Gold ≥ 5/50). In de gevulde DB wil je minimaal:
- Platinum: ≥ 500 picks
- Gold: ≥ 2000 picks
- Silver: ≥ 10.000 picks

**Rood:** Platinum < 100 picks → tier voelt leeg, gebruikers zien maanden niks. Heroverweeg tier-drempels.

### 3.2 Confidence spreiding over tijd

```sql
SELECT
  date_trunc('month', predicted_at) AS month,
  COUNT(*)                          AS picks,
  ROUND(AVG(confidence)::numeric, 3) AS avg_conf,
  ROUND(MAX(confidence)::numeric, 3) AS max_conf,
  COUNT(*) FILTER (WHERE confidence >= 0.65) AS gold_plus
FROM predictions
WHERE predicted_at > NOW() - INTERVAL '12 months'
GROUP BY month
ORDER BY month DESC;
```

**Wat:** clusteren Gold/Platinum picks op specifieke periodes (bv. start van seizoen) of gelijkmatig verdeeld?
**Implicatie:** als 80% van Gold picks in 2 maanden zit, is er een leegte-probleem in rest van jaar.

---

## 4. Accuracy per segment

### 4.1 Per tier — live vs backtest

```sql
WITH joined AS (
  SELECT
    p.confidence,
    p.prediction_source,
    pe.is_correct,
    pe.brier_score,
    CASE
      WHEN p.confidence >= 0.75 THEN 'platinum'
      WHEN p.confidence >= 0.65 THEN 'gold'
      WHEN p.confidence >= 0.60 THEN 'botd'
      WHEN p.confidence >= 0.55 THEN 'silver'
      ELSE 'below_silver'
    END AS tier
  FROM predictions p
  JOIN prediction_evaluations pe ON pe.prediction_id = p.id
)
SELECT
  tier,
  prediction_source,
  COUNT(*)                                       AS n,
  ROUND(AVG(is_correct::int)::numeric * 100, 1)  AS accuracy_pct,
  ROUND(AVG(brier_score)::numeric, 4)            AS avg_brier
FROM joined
GROUP BY tier, prediction_source
ORDER BY tier, prediction_source;
```

**Wat:** is live-accuracy dichtbij walk-forward claim (67-78% ≥60%)? Of is er nog steeds een grote gap?
**Rood:** live `accuracy_pct` Gold+ < 55% → tier-claim is misleidend, kan niet worden verkocht. Eerst engine-fix, dan UI.

### 4.2 Per league

```sql
SELECT
  l.name,
  l.sport,
  COUNT(*)                                       AS n,
  ROUND(AVG(pe.is_correct::int)::numeric * 100, 1) AS accuracy_pct,
  ROUND(AVG(p.confidence)::numeric, 3)           AS avg_conf
FROM predictions p
JOIN prediction_evaluations pe ON pe.prediction_id = p.id
JOIN matches m                 ON m.id = p.match_id
JOIN leagues l                 ON l.id = m.league_id
GROUP BY l.id, l.name, l.sport
HAVING COUNT(*) >= 50
ORDER BY accuracy_pct DESC
LIMIT 20;
```

**Wat:** identificeert "specialist leagues" — waar is het model sterk genoeg om als killer-feature aan Gold/Platinum te verkopen?
**Implicatie voor F14 League Specialist View:** alleen behouden als er ≥3 leagues met accuracy ≥60% + sample ≥200 zijn.

---

## 5. Calibration

### 5.1 10-bucket calibration

```sql
WITH buckets AS (
  SELECT
    FLOOR(p.confidence * 10) / 10 AS bucket_low,
    pe.is_correct
  FROM predictions p
  JOIN prediction_evaluations pe ON pe.prediction_id = p.id
  WHERE p.confidence >= 0.1 AND p.confidence < 1.0
)
SELECT
  bucket_low,
  COUNT(*)                                       AS n,
  ROUND(AVG(is_correct::int)::numeric * 100, 1)  AS actual_pct,
  ROUND((bucket_low + 0.05)::numeric * 100, 1)   AS expected_pct,
  ROUND((AVG(is_correct::int) - (bucket_low + 0.05))::numeric * 100, 1) AS gap_pp
FROM buckets
GROUP BY bucket_low
ORDER BY bucket_low;
```

**Wat:** is het model goed gecalibreerd? Perfecte calibratie = `actual_pct ≈ expected_pct` (gap_pp klein).
**Drempel voor F4 Calibration Chart:** ≥6 buckets met n ≥ 200 en |gap_pp| < 5 → chart is verkoopbaar.
**Rood:** gap_pp > 10 in meerdere buckets → model is overconfident, tier-claims zijn misleidend.

---

## 6. Data-rijkdom voor Match Deep Dive (F7)

### 6.1 Coverage per secundaire bron

```sql
SELECT
  'match_statistics'    AS src,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM matches WHERE status = 'finished'), 2) AS pct_of_finished
FROM match_statistics
UNION ALL SELECT 'odds_history',
  ROUND(COUNT(DISTINCT match_id) * 100.0 / (SELECT COUNT(*) FROM matches WHERE status = 'finished'), 2)
FROM odds_history
UNION ALL SELECT 'standings_snapshots',
  ROUND(COUNT(DISTINCT league_id) * 100.0 / NULLIF((SELECT COUNT(*) FROM leagues), 0), 2)
FROM standings_snapshots
UNION ALL SELECT 'team_elo_history',
  ROUND(COUNT(DISTINCT team_id) * 100.0 / NULLIF((SELECT COUNT(*) FROM teams), 0), 2)
FROM team_elo_history
ORDER BY pct_of_finished DESC;
```

**Wat:** welke aanvullende sources (stats, odds, standings, Elo-history) hebben voldoende coverage om Match Deep Dive echt "deep" te laten voelen?

| Bron | Nodige coverage voor inclusie in Match Deep Dive |
|---|---|
| team_elo_history | ≥ 90% van teams |
| match_statistics | ≥ 20% van matches |
| odds_history | ≥ 20% van matches |
| standings_snapshots | ≥ 80% van leagues |

**Rood:** bron < drempel → die specifieke sectie schrappen uit Match Deep Dive, niet faken.

---

## 7. Lead-time & betrouwbaarheid van "live" picks

```sql
SELECT
  ROUND(AVG(lead_time_hours)::numeric, 1)                         AS avg_leadtime_h,
  ROUND(MIN(lead_time_hours)::numeric, 1)                         AS min_leadtime_h,
  COUNT(*) FILTER (WHERE lead_time_hours >= 1)                    AS locked_1h_before,
  COUNT(*) FILTER (WHERE lead_time_hours >= 24)                   AS locked_24h_before,
  COUNT(*) FILTER (WHERE lead_time_hours IS NULL OR lead_time_hours < 0) AS late_or_missing
FROM predictions
WHERE prediction_source = 'live';
```

**Wat:** bewijst dat "live" picks daadwerkelijk vóór kickoff zijn gelockt. Dit is de integriteit-check voor de Engine Transparency Hub.
**Rood:** `late_or_missing > 5%` van live picks → transparency-claim is zwak, niet openbaar maken tot gefixt.

---

## 8. Beslissings-matrix (vullen na runs)

| # | Feature | Data-afhankelijkheid | Meetpunt uit audit | Status |
|:-:|---------|----------------------|--------------------|:------:|
| F1 | Pick Reasoning | top_factors_for filled | §2.2 filled_for % | ⬜ |
| F2 | Over/Under & BTTS | Poisson goals coverage | §2.1 has_poisson_goals % | ⬜ |
| F3 | Value Bets | closing_odds coverage | §2.1 has_closing_odds % | ⬜ |
| F4 | Calibration chart | buckets met n ≥ 200 | §5.1 bucket distribution | ⬜ |
| F6 | Engine Transparency | live vs backtest + leadtime integrity | §2.1 + §7 | ⬜ |
| F7 | Match Deep Dive | raw_output + Elo hist + stats | §2.1 + §6.1 | ⬜ |
| F8 | Predictions Explorer | totaal predictions + tier spread | §1.1 + §3.1 | ⬜ |
| F11 | Weekend Preview | top-N picks per week met Gold+ dekking | §3.2 | ⬜ |
| F14 | League Specialist View | ≥3 leagues met n≥200 + acc≥60% | §4.2 | ⬜ |

Legenda: ⬜ nog te meten · ✅ ondersteund · ⚠️ beperkt (met uitleg) · ❌ niet leverbaar

---

## 9. Na de audit

Zodra §1–§7 ingevuld zijn:

1. **Vul §8 Beslissings-matrix** met ✅/⚠️/❌ per feature.
2. **Per ❌ feature** — schrap uit v10 plan of verplaats naar "Later" tot de data er is.
3. **Per ⚠️ feature** — schrijf een **afgeslankt scope-voorstel** (wat is wel, wat niet, waarom).
4. **Herzie `docs/v10_final_plan.md`** met de nieuwe waarheid. Haal features die niet meer passen eruit; voeg features toe die de data wél ondersteunt.
5. **Optioneel** — als de audit laat zien dat strategies / BOTD / huidige concepten niet meer bij de v8-engine passen, propose **concepten-herontwerp** (bv. tier-gebaseerde "Pick Feeds" i.p.v. Strategy Lab).

**Belangrijk:** Fase 0 (tier-aware sidebar + upgrade-modal + analyst route-guard, commit `4d17d1f`) staat los van feature-decisies. Blijft meestal bruikbaar, maar kan met `git revert 4d17d1f` volledig weg als het Data Analyst-concept komt te vervallen.
