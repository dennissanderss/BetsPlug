/**
 * BetsPlug AI Assistant - Knowledge Base
 * ─────────────────────────────────────────────────────────
 * Static content the chatbot is grounded on. Written once,
 * in English, and injected into the system prompt. The LLM
 * must reply in the user's locale but only using facts from
 * this document. If the answer is not in here, the assistant
 * must return NO_ANSWER exactly so the frontend can fall
 * back to the human support email.
 */

export const CHAT_KB = `
# BetsPlug - Product Knowledge Base

BetsPlug is a premium AI-powered football analytics platform for serious bettors and football analysts. It uses BetsPlug Pulse, our AI engine that combines Elo ratings, Poisson models and logistic regression to produce transparent, data-driven predictions.

## What BetsPlug does
- Publishes daily AI-driven predictions and picks across top leagues.
- Tracks every pick publicly (wins, losses, ROI) so users can see real performance.
- Offers a live dashboard with model accuracy, confidence scores and per-league breakdowns.
- Strategy Lab for backtesting and custom filters is coming soon.
- Provides a "Pick of the Day" - the single highest-confidence pick.
- Sends alerts when premium picks go live.
- Covers: Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie, Champions League and more top leagues.

## How it works (3 steps)
1. Create an account on betsplug.com.
2. Explore daily predictions, live matches and the public track record in the dashboard.
3. Use insights to make informed decisions - BetsPlug is an analytics tool, not financial advice.

## AI engine - BetsPlug Pulse
BetsPlug Pulse is our AI engine that combines three prediction models:
- Elo rating system (team strength)
- Poisson goal expectation (goal prediction)
- Logistic regression on match features (pattern recognition)
They are combined via weighted averaging into a single output with a confidence score.

## Pricing plans (VAT-inclusive)
BetsPlug has four tiers. Silver and Gold bill monthly or yearly (yearly saves ~20%).

- **Free Access - €0 forever** (no card required): Create a free account and get full app access at the Free tier - browse every upcoming prediction, see which picks won or lost after kickoff, follow the public track record, live agenda + scores. Pre-match odds, the simulation calculator, Pick of the Day and Bet of the Day stream are paid features.
- **Silver - €9.99/month or €7.99/month billed yearly (€95.88/year)**: Builds on Free Access. Adds Silver-tier predictions (≥60% confidence floor, ~71% historical accuracy), pre-match bookmaker odds visible per pick, the full Results & Simulation calculator (stake, period, simulated payout + ROI), Net P/L and euro Return column on every result.
- **Gold - €14.99/month or €11.99/month billed yearly (€143.88/year) - most popular**: Builds on Silver. Adds Gold-tier predictions (≥70% confidence, ~77% historical accuracy), daily Pick of the Day, the Bet of the Day simulation stream in Results & Simulation, Data Analyst tools (Deep Dive, Predictions Explorer, Calibration view), PDF / CSV / JSON exports of every prediction, first access to every new tool we ship.
- **Platinum Lifetime - €199 one-time** (around 100 members per yearly cycle): Adds Platinum elite picks (top-5 strictest leagues, ≥80% confidence, ~86% historical accuracy), every tier unlocked, private Telegram channel for real-time pick notifications, first access to every new feature, direct founder email, lifetime price lock. Final-sale after the 14-day refund window.

Free Access IS the no-cost entry point - paid tiers do not have a separate trial. Add-ons on Silver/Gold are opt-in during checkout (Telegram VIP, Pick of the Day add-on, etc).

## Payments
BetsPlug accepts major credit cards (Visa, Mastercard, American Express), iDEAL, Bancontact, SEPA, PayPal and Apple Pay / Google Pay. All payments are processed through a PCI-compliant payment provider. The company is based in the EU; prices include 21% VAT where applicable.

## Refunds and cancellation
- Users can cancel any subscription at any time from their dashboard.
- After cancellation the subscription remains active until the end of the current billing period - no auto-renewal.
- A pro-rata refund is available within 14 days of purchase for any paid subscription under EU consumer law.
- The Platinum Lifetime deal is final-sale after 14 days.
- To request a refund, email support@betsplug.com with the order number.

## Track record and transparency
- Every prediction ever published is logged on the public Track Record page.
- Users can filter by date range, league, model or strategy.
- Overall accuracy, ROI, Brier score and confidence calibration are shown live.
- BetsPlug does not cherry-pick results. Losing picks are shown alongside winners.

## Disclaimer
BetsPlug is an analytics and educational tool. It does not guarantee profit and does not provide financial advice. Users are responsible for their own betting decisions. Gambling can be addictive; always play responsibly and within legal limits.

## Community and communication
- Telegram VIP channels for Gold and Platinum members.
- Public Instagram: @betsplug_com
- Email support: support@betsplug.com
- Typical response time: under 12 hours on business days.

## Privacy and security
- GDPR-compliant.
- 256-bit SSL encryption site-wide.
- No personal betting data sold to third parties.
- Users can export or delete their data at any time from account settings.

## Dashboard features
- Real-time "Live data" indicator.
- KPIs: Total forecasts, overall accuracy, average edge, average confidence.
- Accuracy broken down by league.
- Rolling accuracy trend chart over time.
- System status panel showing data source health.
- Sidebar navigation: Dashboard, Predictions, Results, Pick of the Day, Track Record, Live Matches, Weekly Report, Strategy Lab (coming soon), Reports, Admin (internal only), Settings, Deals.

## Languages supported
The BetsPlug website is available in English, Dutch, German, French, Spanish, Italian, Swahili and Indonesian.

## Account & login
- Users log in at betsplug.com/login (localized URL per language).
- "Remember this device" stores a secure token locally so returning users skip the form.
- Password reset is available via email.
- SSO: Google and Apple sign-in are supported.

## Contacting a human
For anything not covered above - billing disputes, account issues, partnership requests, press, bug reports - email **support@betsplug.com**. The team replies within 12 hours on business days.
`.trim();
