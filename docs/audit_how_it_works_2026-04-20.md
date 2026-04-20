# How-It-Works Page Audit Report

**Date:** 2026-04-20  
**Primary File:** `frontend/src/app/how-it-works/how-it-works-content.tsx`  
**Supporting i18n:** `frontend/src/i18n/messages.ts`

## CRITICAL ISSUES

### Issue 1: Model Count Inconsistency (4 vs 5) — MUST FIX

**Problem:**
- Page Step 2: "Four models, one AI football prediction per match"  
- Page Flow: "Five AI models vote"

**Code Reality:**
- `backend/app/forecasting/models/__init__.py:26-30` has exactly 4 classes: Elo, Poisson, Logistic, Ensemble
- Over/Under is supplementary (forecast_service.py:125-141), not a voting member

**Files to Edit:**
- `frontend/src/i18n/messages.ts:1017` (hiw.step2Title)
- `frontend/src/i18n/messages.ts:1087` (hiw.flowStep2Title)

---

### Issue 2: Marketing Model Names ≠ Backend Classes — MUST FIX

**Page Claims:**
- Pattern Finder, Scoreline Predictor, Team Strength Tracker, Odds Calibrator

**Backend Has:**
- EloModel, PoissonModel, LogisticModel, EnsembleModel

**Impact:** Audit trail broken. No mapping exists.

**Files to Edit:**
- `frontend/src/i18n/messages.ts:1173-1180` (engine names)
- `backend/app/forecasting/models/__init__.py`

---

### Issue 3: Sync Cadence — REWRITE

**Page:** "Refreshed every night"  
**Code:** Every 6 hours + every 3 minutes for predictions

**Evidence:** backend/app/services/scheduler.py:8

**Files to Edit:**
- `frontend/src/i18n/messages.ts:1008-1009`

---

### Issue 4: "30+" Leagues — MINOR

**Page:** "30+ football leagues"  
**Code:** Exactly 30 in api_football.py:39-91

**Files to Edit:**
- `frontend/src/i18n/messages.ts:993`

---

## VERIFIED (NO CHANGES)

✓ Accuracy fallback current (2026-04-19)  
✓ CSV export exists  
✓ Pre-match lock mechanism (locked_at + prediction_source='live')  
✓ Auto-evaluation runs daily  
✓ No soft-delete or cherry-picking  
✓ Walk-forward validation documented  
✓ Ensemble weighted-average architecture  
✓ Tier system correctly implemented

---

## ACTION SUMMARY

| Priority | Action | Effort |
|----------|--------|--------|
| P0 | Resolve 4 vs 5 model count | 1 hour |
| P0 | Map/align marketing names to backend | 2-3 hours |
| P1 | Update cadence copy | 15 min |
| P1 | Update "30+" to "30" | 5 min |

---

Overall assessment: Page is largely accurate. Issues are naming/scope gaps, not fundamental untruths. No evidence of cherry-picking or manipulation in the codebase.

Report generated: 2026-04-20  
Reviewer: Claude Code
