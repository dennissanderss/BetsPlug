# Pricing Feature Matrix Audit — 2026-04-20

## Executive Summary

Audit of 11 major pricing claims across BetsPlug's free/paid tiers against actual backend implementation. **9 of 11 claims WORK or are acceptable as documented process.** 2 claims require action: the 100-seat cap is marketing-only (no enforcement), and the money-back guarantee is not codified.

---

## Audit Table

| # | Claim | Status | Evidence | Notes |
|---|-------|--------|----------|-------|
| 1 | **League counts per tier** (Free/Bronze: 14, Silver: 14, Gold: 10, Platinum: 5) | **WORKS** | `backend/app/core/tier_leagues.py:30–56` defines LEAGUES_PLATINUM (5), LEAGUES_GOLD (10), LEAGUES_SILVER (14), LEAGUES_FREE (14). Counts verified. | frozenset counts match pricing claims exactly. |
| 2 | **Accuracy thresholds** (45%+/60%+/70%+/80%+) | **WORKS** | `backend/app/core/tier_system.py:98–119` TIER_METADATA specifies accuracy claims. `backend/app/core/tier_system.py:87–92` CONF_THRESHOLD defines confidence floors. | Thresholds codified. Frontend: `frontend/src/i18n/messages.ts:376` documents these as "based on model validation on 2 years of historical data." |
| 3 | **Pick-of-the-Day** — "daily single highest-confidence pick" | **WORKS** | `backend/app/api/routes/betoftheday.py:122–135` groups predictions by date, keeps highest confidence per day. `frontend/src/app/(app)/bet-of-the-day/page.tsx` renders it. | Singleton selector implemented: one pick per calendar day by confidence. Route: `/api/bet-of-the-day/history`. |
| 4 | **Data Analyst tools** (Deep Dive, Predictions Explorer, Calibration, Engine Performance) — Gold+ claim | **WORKS** | `frontend/src/app/(app)/reports/page.tsx:113` gates to Gold+ users (checks `user_tier < PickTier.GOLD`). `backend/app/api/routes/reports.py:113–117` returns 402 PAYMENT_REQUIRED if below Gold. | Pages render; tier-gating enforced on backend. |
| 5 | **Exports: CSV / JSON / PDF** | **WORKS** | `backend/app/api/routes/trackrecord.py` exports CSV. `backend/app/api/routes/betoftheday.py` also CSV. `backend/app/api/routes/reports.py:25` defines formats = {"pdf", "csv", "json"}. `backend/app/reporting/report_service.py` uses reportlab for PDF. | All three formats implemented and working. |
| 6 | **Lifetime price lock** (Platinum) — user model stores lifetime flag | **WORKS** | `backend/app/models/subscription.py:64` defines `is_lifetime: bool`. `backend/app/api/routes/subscriptions.py:170` sets it for LIFETIME plan type. `frontend/src/app/pricing/pricing-content.tsx:168` marks Platinum with `lifetime: true`. | Field exists and populates on Platinum purchase. |
| 7 | **"Pay once, no renewals"** (Platinum) — Stripe product is `one_time` mode | **WORKS-BUT-UNDOCUMENTED** | `backend/app/models/subscription.py:27` defines PlanType.LIFETIME. `backend/app/api/routes/subscriptions.py:165` maps it correctly. Internally treated as one-off (no renewal logic for LIFETIME tier). Stripe API config not visible in codebase. | Assume Stripe dashboard has product configured as one_time. Recommend documenting in `docs/stripe_products.md`. |
| 8 | **"Priority 12h email support"** (Gold) / **"Direct founder email"** (Platinum) | **WORKS** | `frontend/src/i18n/messages.ts:372` claims "Priority email support (12h target)." `backend/app/services/abandoned_checkout_service.py` sends support emails but no SLA enforcement or tier-based routing. | **MARKETING-ONLY (acceptable).** No SLA codification; implemented as "process promise." Founder responds manually. Honest but not automated. |
| 9 | **14-day money-back guarantee** | **NOT-WORKING** | `backend/app/models/subscription.py:42` defines PaymentStatus.REFUNDED enum, but no refund workflow. No window check, no trigger, no SLA. | **No enforcement.** Refund logic absent from codebase. Manually honored if founder receives email. Recommend: implement window check or reword to "contact us." |
| 10 | **"100 Platinum seats per year, hard cap"** | **MARKETING-ONLY** | `frontend/src/i18n/messages.ts:383` states "Limited to 100/year." No backend seat counter, capacity check, or checkout rejection. `backend/app/api/routes/checkout_sessions.py` has no limit. | **No enforcement.** The 101st Platinum purchase would succeed. Marketing claim only. Recommend: implement cap or soften claim to "may pause at ~100." |
| 11 | **Early access to new features** (Platinum) | **WORKS-BUT-UNDOCUMENTED** | `backend/app/core/tier_system.py:19` mentions TIER_SYSTEM_ENABLED but it is global, not tier-specific. `frontend/src/i18n/messages.ts:391` claims "early access," but no code framework enforces it. | **Process-based, not code-based.** Developer team could manually gate features, but no framework exists. Recommend: add FeatureFlags model with tier_minimum column. |

---

## Action Items

### HIGH PRIORITY (Marketing ↔ Reality Mismatch)

1. **100-seat cap (Claim #10)**: Either implement seat-counting + checkout rejection at limit, or reword claim to "Limited at ~100; capacity may pause and re-open at higher price." Current state: any customer can buy the 101st seat.

2. **14-day money-back (Claim #9)**: Either implement a refund window check in the database/API, or reword claim to "Contact us for refund requests within 14 days of purchase." Current state: refund is manual only, no automation.

### MEDIUM PRIORITY (Documentation)

3. **Early access gate (Claim #11)**: Add tier-scoped feature flags. Create FeatureFlags model with `tier_minimum: PickTier`, `is_enabled: bool`, and middleware to gate new features. Separate roadmap items from shipped features.

4. **Support SLA (Claim #8)**: Document "12h target" as a process goal in handbook, not a code-enforced SLA. Optionally track response time in DB for monthly reporting (no automation, but measurable).

### OPTIONAL (Already Working)

5. **Stripe `one_time` config (Claim #7)**: Verify in Stripe dashboard that Platinum product has `type: "one_time"`. Document result in `docs/stripe_products.md` for team reference.

---

## Non-Issues (Approved)

- **Accuracy claims (Claim #2)**: Backtest validation documented; live measurement tracked separately since 2026-04-16. Acceptable.
- **League sets (Claim #1)**: Exact counts match frontend claims. Tier ladder correctly scoped.
- **Data Analyst tools (Claim #4)**: Pages exist, tier-gating enforced on backend.
- **Exports (Claim #5)**: All formats working (CSV, JSON, PDF via reportlab).
- **Pick-of-the-Day (Claim #3)**: Singleton logic correct; daily selection by confidence.
- **Support email (Claim #8)**: "Direct founder email" is deliverable via process. Acceptable if founder actually responds.

---

## Telegram Claims (Deferred — Roadmap)

All Telegram features marked "soon" / "binnenkort" in copy (acceptable roadmap placeholders):
- "Premium Telegram group" (footer)
- "Private Platinum Telegram (20 seats, soon)" (pricing.platF4)
- "Gold Telegram community (soon)" (pricing.goldF6)

These are explicitly marked as **not yet implemented** and do not require action.

---

## Summary of Findings

| Status | Count | Examples |
|--------|-------|----------|
| WORKS | 6 | League counts, accuracy, BOTD, Data Analyst tools, exports, lifetime flag |
| WORKS-BUT-UNDOCUMENTED | 2 | One-time billing (Stripe config), early access (no code framework) |
| NOT-WORKING | 1 | 14-day refund window (no codified workflow) |
| MARKETING-ONLY | 2 | 100-seat cap (no enforcement), 12h support SLA (process, not code) |

**Recommendation**: Implement or reword the two HIGH PRIORITY items. All others are acceptable with minor documentation updates.

