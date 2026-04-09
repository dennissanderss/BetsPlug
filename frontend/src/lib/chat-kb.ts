/**
 * BetsPlug AI Assistant — Knowledge Base
 * ─────────────────────────────────────────────────────────
 * Static content the chatbot is grounded on. Written once,
 * in English, and injected into the system prompt. The LLM
 * must reply in the user's locale but only using facts from
 * this document. If the answer is not in here, the assistant
 * must return NO_ANSWER exactly so the frontend can fall
 * back to the human support email.
 */

export const CHAT_KB = `
# BetsPlug — Product Knowledge Base

BetsPlug is a premium AI-powered sports analytics platform for serious bettors and sports analysts. It combines data, Elo ratings, Poisson models, XGBoost and an ensemble to produce transparent, data-driven predictions.

## What BetsPlug does
- Publishes daily AI-driven predictions and picks across top leagues.
- Tracks every pick publicly (wins, losses, ROI) so users can see real performance.
- Offers a live dashboard with model accuracy, confidence scores and per-league breakdowns.
- Includes a Strategy Lab for backtesting and custom filters.
- Provides a "Bet of the Day" — the single highest-confidence pick.
- Sends alerts when premium picks go live.
- Covers: Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie, Champions League and more top leagues.

## How it works (3 steps)
1. Create an account on betsplug.com.
2. Explore daily predictions, live matches and the public track record in the dashboard.
3. Use insights to make informed decisions — BetsPlug is an analytics tool, not financial advice.

## AI models
BetsPlug uses an ensemble of four models:
- Elo rating system
- Poisson goal expectation
- Logistic regression on match features
- XGBoost gradient boosting
They are combined into a single Ensemble output with a confidence score.

## Pricing plans (VAT-inclusive)
BetsPlug has four tiers. Billing is either monthly or yearly (yearly saves ~20%).

- **Bronze — €0.01** (essentially free): 1 Bet of the Day, 3 daily AI predictions, public track record access, community insights, email support. Designed to let users explore for free.
- **Silver — €9.99/month or €95.88/year**: Unlimited AI predictions, all 4 AI models (Ensemble), live probability tracking, strategy backtesting, priority email support.
- **Gold — €14.99/month or €143.88/year** (most popular): Everything in Silver PLUS exclusive Gold Telegram channel, early access to picks, daily live alerts, VIP support.
- **Platinum Lifetime — €299 one-time**: Lifetime access to every current and future feature, private Platinum channel, one-on-one onboarding.

Silver and Gold offer a free trial. Bronze does not have a trial (it is already free). Add-ons on Silver/Gold are opt-in during checkout (Telegram VIP, Tip of the Day, etc).

## Payments
BetsPlug accepts major credit cards (Visa, Mastercard, American Express), iDEAL, Bancontact, SEPA, PayPal and Apple Pay / Google Pay. All payments are processed through a PCI-compliant payment provider. The company is based in the EU; prices include 21% VAT where applicable.

## Refunds and cancellation
- Users can cancel any subscription at any time from their dashboard.
- After cancellation the subscription remains active until the end of the current billing period — no auto-renewal.
- A pro-rata refund is available within 14 days of purchase for any paid subscription under EU consumer law.
- The Platinum Lifetime deal is final-sale after 14 days.
- To request a refund, email support@betsplug.com with the order number.

## Track record and transparency
- Every prediction ever published is logged on the public Track Record page.
- Users can filter by date range, sport, league, model or strategy.
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
- Accuracy broken down by sport and league.
- Rolling accuracy trend chart over time.
- System status panel showing data source health.
- Sidebar navigation: Dashboard, Predictions, Results, Bet of the Day, Track Record, Live Matches, Weekly Report, Strategy Lab, Reports, Admin (internal only), Settings, Deals.

## Languages supported
The BetsPlug website is available in English, Dutch, German, French, Spanish, Italian, Swahili and Indonesian.

## Account & login
- Users log in at betsplug.com/login (localized URL per language).
- "Remember this device" stores a secure token locally so returning users skip the form.
- Password reset is available via email.
- SSO: Google and Apple sign-in are supported.

## Contacting a human
For anything not covered above — billing disputes, account issues, partnership requests, press, bug reports — email **support@betsplug.com**. The team replies within 12 hours on business days.
`.trim();
