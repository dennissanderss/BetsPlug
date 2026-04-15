# BetsPlug — Market Expansion Research

_Written 2026-04-11 during the v4 audit session. This is research and
recommendations, **not** an implementation plan. No new markets are wired up
in this session._

## Purpose

Dennis asked which betting markets are worth adding to BetsPlug beyond the
current 1X2 (match result) focus. This document reviews what the public
sports-betting quant literature says about edge availability per market,
applies it to what BetsPlug can realistically do with its current data
sources, and recommends a priority order.

**Reality check up front:** no reputable quant shop consistently publishes
+20% ROI on any football market. The numbers our Strategy Lab currently
shows (+30%, +40% ROI) are data artefacts, not real edge. Any new market we
add must start from the assumption that real, sustainable edge is
**1-5% ROI** at best, and anything above that on a fresh backtest is a
sign of leakage — not success.

---

## Markets, ranked by "is it worth building"

### 1. Over / Under 2.5 goals  ⭐ Top recommendation

- **Market efficiency:** High, but slightly less efficient than 1X2.
- **Realistic edge for a serious model:** 2-4% ROI.
- **Data needed:** Per-team expected goals (xG) or strong proxy, historical
  team goals-scored / goals-conceded at home/away, league average.
- **What we already have:** Poisson model (already in the ensemble) produces
  expected goals implicitly. Season-level goals_for / goals_against are in
  the database. **We don't have per-match xG.**
- **What we'd need to add:** A real historical Over/Under 2.5 odds feed
  (The Odds API supports this via market `totals`, available on the free tier
  but only for current matches — historical odds require a paid plan).
- **Why it's a good candidate:**
  - Most-studied market in football betting literature, meaning there's a
    rich academic/public record of what works (and what doesn't)
  - Easy for users to understand ("will there be more/less than 2.5 goals?")
  - The Poisson model we already run is precisely the right tool
- **Risk:** Our Poisson model currently inherits the same feature-leakage
  problem as the Elo model — it's seeded from "current day" team strength
  rather than point-in-time. Fixing that is a prerequisite to any honest
  Over/Under backtest.
- **Effort to ship an honest version:** Medium. Two weeks of work to (a)
  persist historical standings/Goals-For-Against as point-in-time snapshots
  and (b) validate the Poisson lambdas are correctly anchored to kickoff
  time.

### 2. Both Teams To Score (BTTS)  ⭐ Good second add

- **Market efficiency:** Middle-high. Bookies price this reasonably well
  but not as tightly as 1X2.
- **Realistic edge:** 1-3% ROI.
- **Data needed:** Same as Over/Under 2.5 — xG or goals proxy for BOTH teams,
  form-adjusted.
- **What we'd need to add:** Historical BTTS odds (not free in any provider
  we currently know of).
- **Why it's a good candidate:** Big public appeal ("both teams will
  score"), most casual bettors already understand the market, and the
  Poisson model can calculate it directly.
- **Effort:** Low, assuming we've already done the point-in-time fix for
  Over/Under 2.5. Basically a read-off of the Poisson model output.

### 3. Asian Handicap  — For the serious bettor segment only

- **Market efficiency:** Very high, often **more** efficient than 1X2
  because liquidity is higher.
- **Realistic edge:** 1-2% ROI.
- **Data needed:** Same as 1X2 plus correct handicap line.
- **Why it's niche:** Hard to explain to casual users, but the serious
  sports-betting community cares about it. Probably worth adding as a
  Gold / Platinum tier feature rather than the main product.
- **Effort:** Medium. Rule engine needs to handle split handicaps (e.g. -0.25
  where half the stake goes on 0 and half on -0.5).

### 4. First-Half / Second-Half markets  — Skip for now

- **Market efficiency:** Lower, but **sample sizes are small** (fewer
  public-facing models, less literature) which means false positives in
  backtests are more common.
- **Realistic edge:** 1-2% ROI if you really know what you're doing.
- **Data needed:** Half-time scores (we have `home_score_ht` / `away_score_ht`
  from football-data.org) plus specialised half-specific models.
- **Verdict:** Technically feasible but too much extra modelling work for
  marginal gain. Revisit after Over/Under 2.5 and BTTS are live.

### 5. Correct Score  — Skip

- **Market efficiency:** Deliberately priced with a huge bookie margin
  (8-12% vig vs 3-5% on 1X2). Essentially impossible to beat long-term.
- **Verdict:** Avoid. It's a "lottery" market for casual bettors.

### 6. Player props (goals, assists, cards)  — Skip until we have player data

- **Data needed:** Per-player historical performance, line-ups, minutes
  played, xG per 90.
- **What we have:** Nothing on free tier. API-Football Pro ships this.
- **Verdict:** Requires paid API-Football plan plus an entirely different
  model class. Premium / pro tier feature for later.

---

## Summary recommendation

| Priority | Market             | When                          | Why                          |
|---------:|--------------------|--------------------------------|------------------------------|
| **1**    | Over / Under 2.5   | After the Elo / Poisson fix   | Highest expected edge, most-researched, data path already half-built |
| **2**    | BTTS               | Right after Over/Under 2.5    | Same model, same data, cheap add |
| **3**    | Asian Handicap     | When serious-user segment grows | Premium feature for Gold/Platinum users |
| skip     | 1H/2H, Correct Score, Player Props | — | Not worth the build cost in current state |

## Important honesty notes

1. **Market expansion is not our biggest problem.** The current 1X2 product
   shows fake "Profitable" labels because of feature leakage. Fixing that —
   by rebuilding the Elo model with persistent point-in-time ratings and
   wiring in real historical odds — is a much higher-leverage project than
   adding new markets on top of the same broken base.
2. **Every "realistic edge" number above is what serious quants can
   occasionally reach after years of tuning.** Our cold-start ensemble cannot
   credibly hit those numbers yet.
3. **If a newly added market appears to deliver more than ~5% ROI in
   backtesting, that is a red flag.** Run it through the same plausibility
   gates we applied to the 1X2 strategies before showing any number to users.
