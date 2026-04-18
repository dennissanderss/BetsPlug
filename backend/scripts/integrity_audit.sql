-- ============================================================
-- BetsPlug — Trackrecord integrity audit
-- ============================================================
--
-- Run these 4 queries on production PostgreSQL (Railway → Data tab
-- → Query) to confirm the headline accuracy numbers on the site
-- are backed by clean referential data. Expected output for every
-- query: either zero rows or a count of zero.
--
-- Non-zero output = data problem that silently inflates or deflates
-- the user-facing accuracy figures. See per-query comments for how
-- each failure mode would surface.
--
-- Safe to run at any time — read-only, no locks beyond index scans.
-- ============================================================


-- ── 1. Ghost predictions ────────────────────────────────────
-- Predictions pointing at a match row that no longer exists.
-- Would show up as an accuracy number that can't be audited back
-- to a real fixture.
SELECT 'Q1 ghost predictions' AS check_name, COUNT(*) AS row_count
FROM predictions p
LEFT JOIN matches m ON m.id = p.match_id
WHERE m.id IS NULL;


-- ── 2. Ghost evaluations ────────────────────────────────────
-- Evaluations pointing at a prediction that no longer exists.
-- Would inflate total_evaluated while no pick backs it.
SELECT 'Q2 ghost evaluations' AS check_name, COUNT(*) AS row_count
FROM prediction_evaluations e
LEFT JOIN predictions p ON p.id = e.prediction_id
WHERE p.id IS NULL;


-- ── 3. Duplicate evaluations ────────────────────────────────
-- Same prediction evaluated more than once. Each duplicate is a
-- correct/incorrect that's counted twice in the accuracy number.
-- Empty result = every prediction is graded exactly once.
SELECT
  prediction_id,
  COUNT(*) AS eval_rows
FROM prediction_evaluations
GROUP BY prediction_id
HAVING COUNT(*) > 1
ORDER BY eval_rows DESC
LIMIT 20;


-- ── 4. is_correct contradicts the scoreboard ────────────────
-- Evaluation rows where actual_outcome disagrees with the real
-- match score. Any row returned is an evaluator bug: we'd be
-- counting a win that the scoreboard says was a loss (or vice
-- versa). Catches the class of issue where a fixture got rescored
-- but the evaluation didn't refresh.
SELECT
  e.prediction_id,
  e.actual_outcome,
  r.home_score,
  r.away_score,
  e.is_correct
FROM prediction_evaluations e
JOIN predictions p       ON p.id = e.prediction_id
JOIN matches m           ON m.id = p.match_id
JOIN match_results r     ON r.match_id = m.id
WHERE r.home_score IS NOT NULL
  AND r.away_score IS NOT NULL
  AND NOT (
    (e.actual_outcome = 'home' AND r.home_score >  r.away_score) OR
    (e.actual_outcome = 'draw' AND r.home_score =  r.away_score) OR
    (e.actual_outcome = 'away' AND r.home_score <  r.away_score)
  )
LIMIT 20;


-- ============================================================
-- Expected output when the DB is clean
-- ------------------------------------------------------------
--   Q1 ghost predictions   row_count=0
--   Q2 ghost evaluations   row_count=0
--   Q3 (empty result set)
--   Q4 (empty result set)
--
-- Any non-zero count / any non-empty Q3/Q4 result is a real data
-- defect. Flag the rows to a dev before launch — they materially
-- affect the public accuracy numbers.
-- ============================================================
