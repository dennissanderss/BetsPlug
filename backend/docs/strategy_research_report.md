# Strategy Research Report — April 9, 2026

## Executive Summary
- **Strategies tested:** 12
- **Validated (passed all tests):** 3
- **Break-even:** 0
- **Rejected:** 7
- **Insufficient data:** 2

## Methodology
- **Data source:** 300 evaluated predictions from BetsPlug ensemble model (Elo + Poisson + Logistic)
- **Sample period:** Jan 8, 2026 – Apr 8, 2026 (90 days)
- **Leagues:** Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie
- **Validation:** Walk-forward (4-week train / 1-week test rolling) + Bootstrap 95% CI (1000 iterations)
- **Pass criteria:** Sample ≥30, ROI >0%, Bootstrap CI lower bound >-2%, Walk-forward consistent

## Validated Strategies

### 1. Strong Home Favorite ✅
- **Hypothesis:** Home advantage + strong model probability = genuine edge
- **Rules:** home_win_prob > 0.55 AND confidence >= 0.60
- **Results:** 56 picks, 71.4% winrate, +35.7% ROI, CI [+12%, +56%], p=0.000
- **Analysis:** The model correctly identifies strong home teams. When both probability AND confidence are high, strike rate exceeds breakeven point.

### 2. Home Dominant ✅
- **Hypothesis:** Very strong home favorites should win more than odds imply
- **Rules:** home_win_prob > 0.60
- **Results:** 36 picks, 69.4% winrate, +31.9% ROI, CI [+0.3%, +58%], p=0.015
- **Analysis:** Narrower filter version of Strong Home Favorite. Higher strike rate but lower volume. CI barely positive at lower bound — monitor closely.

### 3. Anti-Draw Filter ✅
- **Hypothesis:** Low draw probability matches have clearer outcomes, improving model reliability
- **Rules:** draw_prob < 0.22 AND confidence >= 0.60
- **Results:** 63 picks, 68.3% winrate, +29.7% ROI, CI [+8.6%, +51%], p=0.006
- **Analysis:** Strongest statistical significance (p=0.006). By filtering out "draw-prone" matches, the model's directional accuracy improves significantly.

## Rejected Strategies (with reasons)

### Away Upset Value ❌
ROI -3.6%, CI [-26%, +18%]. Away predictions are less reliable in our model.

### Balanced Match Away ❌
ROI -10.7%, CI [-26%, +5%]. Betting against home advantage in balanced matches loses.

### Model Confidence Elite ❌
ROI -23.0%, CI [-54%, +8%]. Highest confidence ≠ highest accuracy. Counterintuitive but true.

### Home Value Medium Odds ❌
ROI -22.9%, CI [-39%, -3%]. Mid-range home favorites underperform. The sweet spot is at the extremes.

### Conservative Favorite ❌
ROI +15.2% but CI [-19%, +44%]. Not statistically significant despite positive ROI.

### Underdog Hunter ❌
ROI +6.4% but CI [-20%, +33%]. Promising but sample too noisy.

### Low Draw High Home ❌
ROI +23.2% but CI [-7.6%, +49%]. Just barely misses significance. Candidate for re-test with more data.

## Key Findings

1. **Home advantage is real and exploitable** — all 3 validated strategies have a home component
2. **Away betting is consistently unprofitable** — every away-focused strategy lost money
3. **Draw filtering works** — excluding draw-prone matches improves accuracy
4. **High confidence ≠ high accuracy** — the "elite confidence" strategy was the worst performer
5. **Model's directional accuracy is highest on decisive matches** (low draw probability)

## Important Limitations

1. **Sample size:** 300 predictions over 90 days is statistically limited
2. **Odds estimation:** Using flat 1.90 average odds. Real odds vary per match
3. **Cold-start model:** Ensemble uses seed ratings, not trained on historical performance
4. **No odds data in strategy rules:** Strategies can't use real edge until The Odds API historical data is available
5. **Survivorship bias risk:** 12 strategies tested, 3 passed. Could be lucky subsample
6. **Single time period:** Jan-Apr 2026 may not be representative of all seasons

## Recommendations

1. **Paper-track the 3 validated strategies for 30+ days** before promoting to users
2. **Re-validate monthly** with fresh data
3. **Integrate real odds** from The Odds API for proper edge calculation
4. **Increase sample size** to 1000+ predictions before making profitability claims
5. **Do NOT claim "proven profitability"** — claim "statistically promising in backtesting"
6. **Monitor "Low Draw High Home" and "Conservative Favorite"** — both are close to passing and may validate with more data

## Honest Assessment

Three strategies show statistically significant positive ROI in backtesting. However:
- This is a 90-day sample on a cold-start model
- Real-world performance with actual odds will differ
- The sports betting market is efficient; long-term edges are hard to maintain
- Users should treat these as "promising candidates under active monitoring" not "guaranteed winners"
