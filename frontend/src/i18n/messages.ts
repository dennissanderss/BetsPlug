/**
 * Translation dictionaries
 * ────────────────────────────────────────────────────────────
 * Flat key → string map per locale. Keys use dot notation for
 * logical grouping (nav.predictions, hero.title …). Fallback
 * behaviour: if a key is missing in a locale, the hook falls
 * back to the English version.
 */

import type { Locale } from "./config";

/* ── English (source of truth) ─────────────────────────────── */
const en = {
  /* Navigation */
  "nav.predictions": "Predictions",
  "nav.howItWorks": "How It Works",
  "nav.trackRecord": "Track Record",
  "nav.pricing": "Pricing",
  "nav.contact": "Contact",
  "nav.about": "About",
  "nav.login": "Login",
  "nav.startFreeTrial": "Start Free Trial",
  "nav.menu": "Menu",
  "nav.getStarted": "Get Started",
  "nav.joinBlurb": "Join 1,500+ analysts and get data-driven predictions today.",

  /* Hero */
  "hero.badge": "Be ahead of the bookmakers",
  "hero.titleLine1": "Best AI-driven",
  "hero.titleLine2": "sports predictions",
  "hero.titleLine3": "for your edge.",
  "hero.subtitle":
    "BetsPlug unites data, Elo ratings, Poisson models and machine learning into one platform. Live probabilities, deep insights, proven track record — built for serious sports analysts.",
  "hero.activeUsers": "Active Users",
  "hero.ctaPrimary": "Start Free Trial",
  "hero.ctaSecondary": "How it works",
  "hero.livePick": "Live Pick",
  "hero.hot": "Hot",
  "hero.homeWin": "Home win",
  "hero.draw": "Draw",
  "hero.away": "Away",
  "hero.confidence": "Confidence",
  "hero.edge": "Edge",
  "hero.joinNow": "Join Now",
  "hero.winRate": "Win Rate",
  "hero.today": "Today",
  "hero.wins": "Wins",
  "hero.usp1Title": "4-Model AI Ensemble",
  "hero.usp1Desc": "Poisson, XGBoost, Elo & market-implied — blended.",
  "hero.usp2Title": "Verified +EV Picks",
  "hero.usp2Desc": "Only published when the edge beats real-world slippage.",
  "hero.usp3Title": "Public Track Record",
  "hero.usp3Desc": "Every pick timestamped. Wins and losses, forever.",

  /* Language switcher */
  "lang.label": "Language",
  "lang.switch": "Switch language",

  /* Comparison table */
  "comparison.badge": "Why BetsPlug",
  "comparison.titleA": "Not all prediction sites",
  "comparison.titleB": "are built the same.",
  "comparison.subtitle":
    "Here's exactly what separates BetsPlug from typical tipster sites — no fine print, no cherry-picked wins.",
  "comparison.feature": "Feature",
  "comparison.winner": "Winner",
  "comparison.others": "Others",
  "comparison.typicalTipsters": "Typical tipsters",
  "comparison.finalScore": "Final score",
  "comparison.fullHouse": "Full house",
  "comparison.fallsShort": "Falls short",
  "comparison.caption":
    "Comparison based on publicly available information from leading tipster platforms as of 2026.",

  /* How it works */
  "how.badge": "How it works",
  "how.title": "From signup to smarter picks in 3 steps.",
  "how.subtitle":
    "A simple, transparent workflow built around data — no hype, no guesswork.",
  "how.step1Title": "Create your account",
  "how.step1Desc":
    "Sign up for free in seconds. No credit card required to explore our daily value picks.",
  "how.step2Title": "Explore AI predictions",
  "how.step2Desc":
    "Four AI models combine live odds, Elo, form and historical data to surface real edges.",
  "how.step3Title": "Make smarter decisions",
  "how.step3Desc":
    "Use transparent probabilities, edges and confidence scores to bet with conviction.",
  "how.deepDive": "See the full engine",

  /* Pricing */
  "pricing.badge": "Pricing",
  "pricing.title": "Simple pricing. Serious edge.",
  "pricing.subtitle":
    "Start free. Upgrade when you're ready. Cancel anytime.",
  "pricing.monthly": "Monthly",
  "pricing.yearly": "Yearly",
  "pricing.save": "Save 20%",
  "pricing.savingNote": "You're saving 2 months",
  "pricing.mostPopular": "Most popular",
  "pricing.ctaFree": "Start free",
  "pricing.ctaUpgrade": "Upgrade",
  "pricing.ctaLifetime": "Get lifetime access",

  /* Final CTA */
  "cta.badge": "Ready to win smarter?",
  "cta.title": "Start your data-driven edge today.",
  "cta.subtitle":
    "Join 1,500+ analysts already using BetsPlug to make sharper, calmer, data-backed decisions.",
  "cta.primary": "Start Free Trial",
  "cta.secondary": "View Predictions",

  /* Footer */
  "footer.premiumBadge": "Premium access",
  "footer.premiumTitleA": "Join our",
  "footer.premiumTitleB": "Premium Telegram",
  "footer.premiumTitleC": "group",
  "footer.premiumSubtitle":
    "Get real-time picks, edge alerts and live chat with our AI analysts. Be the first to know when a high-value match hits the board — straight in your pocket.",
  "footer.perk1": "Instant value alerts",
  "footer.perk2": "Private analyst Q&A",
  "footer.perk3": "Daily free picks",
  "footer.perk4": "VIP-only deep dives",
  "footer.joinCta": "Join the Premium Group",
  "footer.limited": "Limited spots · Members only",
  "footer.onlineNow": "1,200+ members online",
  "footer.brandTagline":
    "BetsPlug unites data, Elo ratings, Poisson models and machine learning into one platform — built for serious sports analysts who refuse to guess.",
  "footer.product": "Product",
  "footer.company": "Company",
  "footer.legal": "Legal",
  "footer.secureTitle": "Secure payments",
  "footer.secureDesc": "256-bit SSL encrypted checkout",
  "footer.pciCompliant": "PCI DSS compliant",
  "footer.copyright":
    "All rights reserved. BetsPlug is a data & analytics platform — not a gambling operator.",
  "footer.responsible": "18+ Play responsibly",

  /* Leagues ticker */
  "leagues.badge": "Global Coverage",
  "leagues.titleA": "Leagues We",
  "leagues.titleB": "Cover",

  /* Trusted Partner */
  "trusted.titleA": "Your",
  "trusted.titleHighlight": "trusted",
  "trusted.titleB": "partner",
  "trusted.titleC": "in sports analytics.",
  "trusted.subtitle":
    "BetsPlug unites and secures a growing ecosystem of data sources, AI models, and proven strategies. One platform for data-driven sports analysts who refuse to guess.",
  "trusted.card1Title": "Service for Any Level of Expertise.",
  "trusted.card1Desc":
    "From beginner to pro-analyst — our dashboards, tutorials, and transparent stats make it easy to understand every prediction.",
  "trusted.card2Title": "Industry best practices.",
  "trusted.card2Desc":
    "Four AI models (Elo, Poisson, Logistic, Ensemble) combine to deliver predictions you can trust. Proven methods, transparent results.",
  "trusted.learnMore": "Learn More",
  "trusted.card3Title": "Protected by transparency.",
  "trusted.card3Desc":
    "Every prediction is logged, tracked, and publicly verified. No hidden results, no cherry-picking — just data you can audit yourself.",

  /* Track record section */
  "track.label": "Track Record",
  "track.accuracy": "Overall accuracy",
  "track.thisWeek": "This week",
  "track.metricPredictions": "Predictions",
  "track.metricModels": "Models",
  "track.metricLeagues": "Leagues",
  "track.badge": "Proven Results",
  "track.titleA": "Trusted",
  "track.titleHighlight": "platform",
  "track.titleB": "anytime & anywhere.",
  "track.rating": "4.9 / 5 from 1,200+ analysts",
  "track.desc1":
    "This is a unified platform that secures a growing ecosystem of sports data, AI predictions, and strategy backtesting tools. All predictions are logged and publicly tracked — full transparency, always.",
  "track.desc2":
    "Whether you follow football, basketball, or tennis, BetsPlug unites data and machine learning into insights you can actually use.",
  "track.cta": "Learn More",
  "track.askQuestion": "Ask a question?",

  /* Features */
  "features.badge": "Features",
  "features.titleA": "Everything you need to",
  "features.titleB": "win smart.",
  "features.f1Title": "Real-Time Predictions",
  "features.f1Desc":
    "Live probability updates as match conditions change. Never miss a value opportunity.",
  "features.f2Title": "4 AI Models Combined",
  "features.f2Desc":
    "Elo, Poisson, Logistic Regression, and our proprietary Ensemble model for maximum accuracy.",
  "features.f3Title": "Strategy Backtesting",
  "features.f3Desc":
    "Test your betting strategies against historical data. Know your edge before you place a bet.",
  "features.f4Title": "Verified Data Sources",
  "features.f4Desc":
    "We only use official APIs and verified data providers. No scraped or unreliable data.",
  "features.f5Title": "Bet of the Day",
  "features.f5Desc":
    "Our algorithm picks the single highest-value prediction each day. Premium members get it first.",
  "features.f6Title": "Growing Community",
  "features.f6Desc":
    "Join a community of data-driven sports analysts who share insights and strategies.",

  /* Testimonials */
  "testimonials.badge": "Testimonials",
  "testimonials.titleA": "What our",
  "testimonials.titleHighlight": "analysts",
  "testimonials.titleB": "say",
  "testimonials.subtitle":
    "Join 1,500+ data-driven bettors who trust BetsPlug for their edge over the bookmakers.",

  /* Final landing CTA */
  "finalCta.badge": "Ready to win?",
  "finalCta.titleA": "Start making",
  "finalCta.titleHighlight": "smarter picks",
  "finalCta.titleB": "today.",
  "finalCta.subtitle":
    "Join thousands of sports analysts who use BetsPlug's AI-driven predictions. Free trial — no credit card required.",
  "finalCta.primary": "Start Free Trial",
  "finalCta.secondary": "Learn more →",
  "finalCta.moneyBack": "3-Day Money-Back",
  "finalCta.cancelAnytime": "Cancel Anytime",
  "finalCta.instantAccess": "Instant Access",

  /* Pricing — plan details */
  "pricing.bronzeTagline": "Start exploring, free forever",
  "pricing.bronzeCta": "Get Started Free",
  "pricing.bronzeF1": "1 Bet of the Day (free pick)",
  "pricing.bronzeF2": "3 daily AI predictions",
  "pricing.bronzeF3": "Access to public track record",
  "pricing.bronzeF4": "Community insights",
  "pricing.bronzeF5": "Email support",
  "pricing.silverTagline": "For serious analysts",
  "pricing.silverCta": "Start Silver",
  "pricing.silverF1": "Unlimited AI predictions",
  "pricing.silverF2": "All 4 AI models (Ensemble)",
  "pricing.silverF3": "Live probability tracking",
  "pricing.silverF4": "Strategy backtesting",
  "pricing.silverF5": "Priority email support",
  "pricing.goldTagline": "Most popular choice",
  "pricing.goldCta": "Start Gold",
  "pricing.goldF1": "Everything in Silver, plus:",
  "pricing.goldF2": "Exclusive Gold Telegram channel",
  "pricing.goldF3": "Early access to Bet of the Day",
  "pricing.goldF4": "Personal AI strategy advisor",
  "pricing.goldF5": "VIP leaderboard & analytics",
  "pricing.goldF6": "24/7 priority support",
  "pricing.perMonth": "/ month",
  "pricing.forever": "/ forever",
  "pricing.billedMonthly": "Billed monthly",
  "pricing.billedYearlySilver": "Billed €95,90 yearly",
  "pricing.billedYearlyGold": "Billed €143,90 yearly",
  "pricing.platTagline": "One-time payment. Lifetime access.",
  "pricing.platPitch":
    "Pay once, own your edge forever — every current feature and every future upgrade, included.",
  "pricing.platBadgeLifetime": "Lifetime Deal",
  "pricing.platLimited": "Limited to 100/year",
  "pricing.platOneTime": "One-time payment",
  "pricing.platNoSub": "No subscription. No renewals. Ever.",
  "pricing.platCta": "Claim Lifetime Access",
  "pricing.platF1": "Lifetime access to every feature",
  "pricing.platF2": "All future releases included forever",
  "pricing.platF3": "Direct line to our analyst team",
  "pricing.platF4": "Founder-tier leaderboard badge",
  "pricing.platF5": "Limited to 100 members per year",
  "pricing.trust1": "3-Day Money-Back Guarantee",
  "pricing.trust2": "Cancel Anytime",
  "pricing.trust3": "Secure payment by Stripe",

  /* SEO section */
  "seo.badge": "The Smart Way to Research Bets",
  "seo.titleA": "AI Sports Predictions &",
  "seo.titleB": "Data-Driven Betting Picks",
  "seo.subtitle":
    "BetsPlug is the data-driven home for AI sports predictions, machine-learning betting picks and statistical match forecasts. Whether you're researching your next football accumulator, hunting value in NBA player props, or backtesting a new strategy — our AI sports predictor gives you the edge you need to beat the closing line.",
  "seo.pillar1Title": "AI Sports Prediction Engine",
  "seo.pillar1Desc":
    "Our AI sports prediction engine combines Elo ratings, Poisson goal models, and machine learning to forecast match outcomes across football, basketball, and tennis with data-driven accuracy.",
  "seo.pillar2Title": "Data-Backed Betting Predictions",
  "seo.pillar2Desc":
    "Every AI betting prediction on BetsPlug is backed by thousands of historical matches, live form data, and expected-goals metrics — giving you the sharpest sports picks online.",
  "seo.pillar3Title": "Verified Track Record",
  "seo.pillar3Desc":
    "Transparency first. Explore our public track record to see every AI sports pick we've ever published, with full ROI, hit-rate and confidence scores logged and timestamped.",
  "seo.pillar4Title": "Bet of the Day",
  "seo.pillar4Desc":
    "Short on time? Our daily AI-powered Bet of the Day highlights the single highest-confidence value pick across all leagues — hand-picked by our algorithm, not by feeling.",
  "seo.pillar5Title": "Live AI Probabilities",
  "seo.pillar5Desc":
    "Watch probabilities shift in real-time as matches unfold. Our live AI sports predictor recalculates win probabilities every second so you can spot value the moment it appears.",
  "seo.pillar6Title": "Analytics, Not Gambling",
  "seo.pillar6Desc":
    "BetsPlug is a sports analytics platform — not a bookmaker. We deliver AI-driven sports predictions and data insights so you can make informed decisions, without ever placing a bet on our site.",

  /* FAQ */
  "faq.badge": "Frequently Asked Questions",
  "faq.titleA": "Got Questions?",
  "faq.titleB": "We've Got Answers",
  "faq.subtitle":
    "Everything you need to know about our AI sports prediction platform, from getting started to advanced integrations.",
  "faq.browseBy": "Browse by Category",
  "faq.stillQuestions": "Still have questions?",
  "faq.supportBlurb":
    "Can't find the answer you're looking for? Our support team is here to help.",
  "faq.contactSupport": "Contact Support",
  "faq.articles": "articles",

  /* Contact page */
  "contact.backHome": "Back to home",
  "contact.badge": "We're here to help",
  "contact.titleA": "How can we",
  "contact.titleB": "help you?",
  "contact.subtitle":
    "Get instant answers from our AI assistant, browse the FAQ, or reach our team directly — whichever works best for you.",
  "contact.chatPlaceholder": "Ask our AI anything about BetsPlug…",
  "contact.chatStart": "Start chat",
  "contact.chatHint": "Powered by BetsPlug AI · Usually responds in seconds",

  "contact.card1Title": "Chat with AI Assistant",
  "contact.card1Desc":
    "Get instant answers about pricing, models, predictions and anything else — 24/7, no waiting.",
  "contact.card1Cta": "Open chat",
  "contact.card2Title": "Join Telegram Community",
  "contact.card2Desc":
    "1,200+ members online, daily picks, live Q&A with analysts and instant edge alerts.",
  "contact.card2Cta": "Join Telegram",
  "contact.card3Title": "Email Support",
  "contact.card3Desc":
    "Prefer email? Drop us a line and a real human will reply within 24 hours on business days.",
  "contact.card3Cta": "Send email",

  "contact.faqBadge": "Help Center",
  "contact.faqTitleA": "Answers at your",
  "contact.faqTitleB": "fingertips.",
  "contact.faqSubtitle":
    "Search our knowledge base or browse the most common questions below.",
  "contact.faqSearch": "Search the help center…",
  "contact.faqEmpty":
    "No results. Try a different keyword or start a chat with our AI assistant.",

  "contact.faqGroup1": "Getting Started",
  "contact.faq1Q": "What exactly is BetsPlug?",
  "contact.faq1A":
    "BetsPlug is a pure sports analytics platform. We publish AI-driven predictions, Elo ratings, Poisson models and transparent track records so you can make data-backed decisions. We're not a bookmaker — you cannot place bets with us.",
  "contact.faq2Q": "Do I need to pay to try BetsPlug?",
  "contact.faq2A":
    "No. Our Bronze tier is 100% free and gives you a daily AI pick, basic predictions and access to our public track record. Upgrade to Silver or Gold only when you want live probabilities, backtesting and advanced markets.",
  "contact.faq3Q": "Which sports and leagues do you cover?",
  "contact.faq3A":
    "Football (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Eredivisie, UEFA competitions and 20+ more), basketball (NBA), and tennis. We're adding new leagues and sports every month as our models mature.",

  "contact.faqGroup2": "Account & Billing",
  "contact.faq4Q": "Can I cancel my subscription anytime?",
  "contact.faq4A":
    "Yes, all Silver and Gold plans are month-to-month with zero lock-in. Cancel from your dashboard and keep access until the end of your current billing period — no questions asked.",
  "contact.faq5Q": "Do you offer refunds?",
  "contact.faq5A":
    "We offer a 7-day money-back guarantee on all paid plans. If BetsPlug isn't right for you, email support within your first week and we'll refund in full.",
  "contact.faq6Q": "Is my payment information secure?",
  "contact.faq6A":
    "Absolutely. All payments are processed through PCI-DSS compliant providers with 256-bit SSL encryption. We never see or store your card details on our servers.",

  "contact.stillNeedTitle": "Still need a hand?",
  "contact.stillNeedDesc":
    "Our AI assistant answers instantly. For complex account issues, a real human is one email away.",
  "contact.trust1": "Avg. reply under 2 min",
  "contact.trust2": "GDPR compliant",
  "contact.trust3": "1,500+ happy users",

  /* Chatbot */
  "chatbot.title": "BetsPlug AI Assistant",
  "chatbot.online": "Online",
  "chatbot.clear": "Clear",
  "chatbot.greetingTitle": "How can I help you?",
  "chatbot.greetingDesc":
    "Ask me about pricing, our AI models, the track record, or anything else BetsPlug-related.",
  "chatbot.placeholder": "Type your message…",
  "chatbot.footer": "AI responses are simulated — for urgent issues, email support@betsplug.com",
  "chatbot.suggestion1": "How does the Bet of the Day work?",
  "chatbot.suggestion2": "What's the difference between Silver and Gold?",
  "chatbot.suggestion3": "How accurate are your predictions?",
  "chatbot.replyDefault":
    "Thanks for reaching out! A BetsPlug analyst will get back to you shortly. In the meantime, check our FAQ or drop us a line at support@betsplug.com.",
  "chatbot.replyHello":
    "Hey there! 👋 I'm the BetsPlug AI. Ask me anything about our models, pricing or predictions — I'll do my best to help.",
  "chatbot.replyPricing":
    "We have three plans: Bronze (free forever), Silver (€9.99/mo) and Gold (€14.99/mo). There's also a Platinum lifetime deal at €199 one-time. All paid plans come with a 7-day money-back guarantee.",
  "chatbot.replyRefund":
    "All Silver and Gold plans can be cancelled anytime from your dashboard — you keep access until the end of your billing period. We also offer a 7-day money-back guarantee on all paid plans, no questions asked.",
  "chatbot.replyAccuracy":
    "Every prediction is logged in our public track record with hit-rate, ROI and confidence scores. You can filter by league, market and date range. No cherry-picking, no hidden losses — transparency is the whole point.",
  "chatbot.replyTelegram":
    "Our Telegram community has 1,200+ active members with daily picks, edge alerts and live Q&A with our analysts. Join at t.me/betsplug — free for Bronze users, VIP channels for Silver/Gold.",

  /* About Us page */
  "about.metaTitle":
    "About BetsPlug — The team behind the AI sports analytics platform",
  "about.metaDesc":
    "Meet the two engineers building BetsPlug. Sports fanatics with an ICT background, turning raw match data into transparent, probability-driven predictions for football, basketball, tennis and more.",
  "about.breadcrumbHome": "Home",
  "about.breadcrumbAbout": "About",

  "about.heroBadge": "Our Story",
  "about.heroTitleA": "Built by sports fanatics.",
  "about.heroTitleB": "Engineered by data obsessives.",
  "about.heroSubtitle":
    "BetsPlug is an AI-powered sports analytics platform built by two engineers who got tired of hot takes, armchair tipsters and influencer noise. We replaced gut feeling with statistical models, and loud opinions with transparent probabilities.",

  "about.missionBadge": "The Mission",
  "about.missionTitle": "We turn raw match data into a measurable edge.",
  "about.missionBody1":
    "For too long the sports prediction market has run on hype. YouTube gurus chasing clout, Telegram channels selling \"locks of the week,\" paid tipsters with no verifiable history. As lifelong football, basketball and tennis fans, it drove us up the wall — because we knew the underlying data was far better than the noise surrounding it.",
  "about.missionBody2":
    "So we built the tool we always wished existed: a platform that ingests thousands of matches per week, runs them through Elo ratings, Poisson scoring models and gradient-boosted classifiers, and only surfaces the picks where our models genuinely disagree with the closing line. No vibes. No survivorship bias. Just math, published in the open.",
  "about.missionCta": "See how it works",

  "about.statsBadge": "By the Numbers",
  "about.statsTitle": "A decade of engineering. A lifetime of sport.",
  "about.stat1Value": "20+",
  "about.stat1Label": "Combined years in ICT & data engineering",
  "about.stat2Value": "450+",
  "about.stat2Label": "Matches analysed every week",
  "about.stat3Value": "1,200+",
  "about.stat3Label": "Data points evaluated per match",
  "about.stat4Value": "1,500+",
  "about.stat4Label": "Active analysts & subscribers",

  "about.valuesBadge": "What We Believe",
  "about.valuesTitle": "Four principles behind every pick.",
  "about.valuesSubtitle":
    "BetsPlug isn't a tipster. It's a disciplined system. These are the rules we wrote for ourselves — and the ones we refuse to break.",
  "about.value1Title": "Data over opinion",
  "about.value1Desc":
    "Every recommendation comes from a model, not a mood. We publish the explicit probability, the expected value and the confidence score so you can verify the reasoning instead of trusting a face on a screen.",
  "about.value2Title": "Track record in public",
  "about.value2Desc":
    "Every pick we call lives forever on our public track record — wins, losses and pushes, never deleted. If we don't beat the market over the long run, we don't deserve a cent of your money. Transparency is the whole point.",
  "about.value3Title": "Continuous retraining",
  "about.value3Desc":
    "Football evolves. Managers get sacked, rosters reshuffle, new leagues surface. Our models retrain weekly on fresh results so they never stagnate, and we publish the retraining notes alongside the picks.",
  "about.value4Title": "Your edge, not ours",
  "about.value4Desc":
    "We're analysts, not bookmakers. When the market moves in your favour, you're the one who benefits — not a platform skimming a vig off your losses. That alignment shapes every product decision we make.",

  "about.teamBadge": "Meet the Founders",
  "about.teamTitle": "Two founders. Zero armchair experts.",
  "about.teamSubtitle":
    "We're not influencers and we're not tipsters. We're engineers who ship. Everything on BetsPlug was built, broken and rebuilt by the two of us.",

  "about.founder1Name": "Cas",
  "about.founder1Role": "Co-founder · Engineering & Product",
  "about.founder1Bio":
    "Lifelong sports fan with a background in ICT. Builds the systems that keep BetsPlug running and makes sure the data flows cleanly from source to screen.",

  "about.founder2Name": "Dennis",
  "about.founder2Role": "Co-founder · Data Science & Modelling",
  "about.founder2Bio":
    "Sports enthusiast turned data nerd with years of ICT experience. Focuses on the models and statistics that turn match data into useful insights.",

  "about.ctaTitle": "Ready to trade guesswork for data?",
  "about.ctaSubtitle":
    "Join 1,500+ analysts who get the picks, the probabilities and the receipts — delivered before the closing line adjusts.",
  "about.ctaButton": "Start Free Trial",

  /* Track Record page */
  "tr.metaTitle":
    "Track Record — Verified BetsPlug prediction performance",
  "tr.metaDesc":
    "Transparent, auditable results for every BetsPlug pick. See how our AI models turn raw match data into a measurable edge — documented weekly, never cherry-picked.",
  "tr.breadcrumbHome": "Home",
  "tr.breadcrumbTrack": "Track Record",

  "tr.heroBadge": "Fully transparent",
  "tr.heroTitleA": "A track record you can",
  "tr.heroTitleB": "actually verify.",
  "tr.heroSubtitle":
    "Every pick BetsPlug publishes is timestamped, probability-weighted and logged to a public ledger — win or lose. This is how the numbers are built, and how real users put them to work.",
  "tr.heroCtaPrimary": "See the latest results",
  "tr.heroCtaSecondary": "Back to home",

  /* Headline KPIs */
  "tr.kpisBadge": "Last 12 months",
  "tr.kpisTitle": "The numbers, unfiltered.",
  "tr.kpisSubtitle":
    "A rolling, honest snapshot of how our models performed over the last year of live publishing.",
  "tr.kpi1Value": "58.3%",
  "tr.kpi1Label": "Hit rate on value picks",
  "tr.kpi1Note": "Only picks flagged with +EV ≥ 3%",
  "tr.kpi2Value": "+14.6%",
  "tr.kpi2Label": "ROI on flat 1u stake",
  "tr.kpi2Note": "After closing-line slippage",
  "tr.kpi3Value": "24,180",
  "tr.kpi3Label": "Graded predictions",
  "tr.kpi3Note": "Across 9 sports and 70+ leagues",
  "tr.kpi4Value": "0.061",
  "tr.kpi4Label": "Brier score (lower = better)",
  "tr.kpi4Note": "Calibrated across win/draw/loss",

  /* How we track it — data pipeline */
  "tr.pipeBadge": "How the data is processed",
  "tr.pipeTitle": "From raw match data to a scored prediction.",
  "tr.pipeSubtitle":
    "No black boxes. Here is the exact pipeline every pick runs through before it ever reaches your dashboard.",
  "tr.pipe1Title": "Ingest",
  "tr.pipe1Desc":
    "We pull match, lineup, injury and odds data from 14 audited providers every 30 seconds. Each record is versioned so we can replay any moment in history.",
  "tr.pipe2Title": "Clean & normalise",
  "tr.pipe2Desc":
    "Team names, leagues and market types are mapped to a single canonical schema. Outliers, late-cancelled games and suspended markets are flagged and removed before modelling.",
  "tr.pipe3Title": "Feature engineering",
  "tr.pipe3Desc":
    "For every fixture we compute 1,200+ features — Elo, xG trends, rest days, travel, head-to-head, referee bias, market movement — then store them in a point-in-time feature store so training never leaks future information.",
  "tr.pipe4Title": "Model ensemble",
  "tr.pipe4Desc":
    "Four independent models vote on the outcome: a Poisson goals model, a gradient-boosted classifier, an Elo-based baseline and a market-implied calibrator. Their probabilities are blended with stacked regression.",
  "tr.pipe5Title": "Value detection",
  "tr.pipe5Desc":
    "We compare the ensemble probability to the best available market odds. Only picks with a statistically significant edge — after commission and expected closing-line slippage — are marked as value.",
  "tr.pipe6Title": "Publish & grade",
  "tr.pipe6Desc":
    "Picks are timestamped the moment they go live. Once the match ends, results are graded automatically and written to the public track-record ledger — win, loss or push.",

  /* Methodology principles */
  "tr.methodBadge": "Methodology",
  "tr.methodTitle": "Four rules we never bend.",
  "tr.methodSubtitle":
    "Every number on this page survives these guardrails. If a result can't, it doesn't get counted.",
  "tr.method1Title": "Point-in-time only",
  "tr.method1Desc":
    "Models are trained on data that was actually available at kick-off — no hindsight, no silently re-graded matches.",
  "tr.method2Title": "Closing-line adjusted",
  "tr.method2Desc":
    "ROI figures subtract realistic slippage between our publish time and the closing line, so you see returns you could actually execute.",
  "tr.method3Title": "Nothing is deleted",
  "tr.method3Desc":
    "Losing picks stay on the ledger forever. A track record that only shows winners isn't a track record — it's marketing.",
  "tr.method4Title": "Third-party gradable",
  "tr.method4Desc":
    "Every pick includes the match ID, market, odds and timestamp so any user or auditor can verify the outcome independently.",

  /* Use cases */
  "tr.casesBadge": "Real users, real workflows",
  "tr.casesTitle": "How analysts actually use the track record.",
  "tr.casesSubtitle":
    "The numbers only matter if they change decisions. Here's what that looks like for three typical BetsPlug members.",

  "tr.case1Role": "Weekend football specialist",
  "tr.case1Name": "Luca, 34 · Milan",
  "tr.case1Quote":
    "I filter the track record by Serie A and over/under markets only. In 2025 that slice hit 61% on 412 picks — so I size up confidently on Sunday mornings instead of second-guessing myself.",
  "tr.case1Metric1Label": "His filtered sample size",
  "tr.case1Metric1Value": "412 picks",
  "tr.case1Metric2Label": "Verified hit rate",
  "tr.case1Metric2Value": "61.2%",
  "tr.case1Metric3Label": "Average closing edge",
  "tr.case1Metric3Value": "+4.8%",
  "tr.case1Outcome":
    "Uses the ledger to pick a market where the model has a proven edge, then ignores the rest. Result: fewer bets, higher conviction, better ROI.",

  "tr.case2Role": "Data-driven NBA fan",
  "tr.case2Name": "Priya, 29 · London",
  "tr.case2Quote":
    "I care about calibration more than hit rate. Seeing that BetsPlug's NBA moneyline Brier score sits under 0.07 tells me the probabilities are honest — not just lucky.",
  "tr.case2Metric1Label": "NBA Brier score",
  "tr.case2Metric1Value": "0.068",
  "tr.case2Metric2Label": "Games graded",
  "tr.case2Metric2Value": "1,240",
  "tr.case2Metric3Label": "ROI at flat 1u",
  "tr.case2Metric3Value": "+11.4%",
  "tr.case2Outcome":
    "Trusts the probabilities to build her own parlays and spread bets. The public ledger is her proof the models haven't drifted.",

  "tr.case3Role": "Full-time value bettor",
  "tr.case3Name": "Mikael, 41 · Stockholm",
  "tr.case3Quote":
    "I plug the track record CSV into my own bankroll tool every Monday. Because every pick has a timestamp and closing price, I can verify the edge is real before I risk a cent.",
  "tr.case3Metric1Label": "Picks replayed in 2025",
  "tr.case3Metric1Value": "2,860",
  "tr.case3Metric2Label": "Yield vs. closing line",
  "tr.case3Metric2Value": "+3.1%",
  "tr.case3Metric3Label": "Max drawdown",
  "tr.case3Metric3Value": "−6.4%",
  "tr.case3Outcome":
    "Uses the historical ledger as an independent backtest. If the closing-line value holds up there, he trusts it for live staking.",

  /* Transparency CTA */
  "tr.transBadge": "Audit it yourself",
  "tr.transTitle": "Don't take our word for it — read the ledger.",
  "tr.transSubtitle":
    "Every graded prediction we've ever published is searchable by match, date, market and model. No filters hide the losers.",
  "tr.transCta1": "Explore live results",
  "tr.transCta2": "Start Free Trial",

  /* How It Works page — dedicated deep-dive */
  "hiw.metaTitle":
    "How BetsPlug Works — From raw match data to AI-driven predictions",
  "hiw.metaDesc":
    "A full, step-by-step walkthrough of the BetsPlug prediction engine: how we collect data, engineer features, train models, detect value and publish picks you can verify.",
  "hiw.breadcrumbHome": "Home",
  "hiw.breadcrumbHow": "How it works",

  "hiw.heroBadge": "The BetsPlug engine",
  "hiw.heroTitleA": "How we turn raw match data",
  "hiw.heroTitleB": "into predictions you can trust.",
  "hiw.heroSubtitle":
    "Every pick on BetsPlug is the end of a long, carefully engineered pipeline. No hunches, no cherry-picking, no hidden rules. This is the exact process — from the moment a fixture is announced, to the moment a verified pick lands on your dashboard.",
  "hiw.heroCtaPrimary": "See the track record",
  "hiw.heroCtaSecondary": "Start Free Trial",
  "hiw.heroStatDataSources": "Data sources",
  "hiw.heroStatFeatures": "Features per match",
  "hiw.heroStatModels": "Independent models",
  "hiw.heroStatUpdates": "Refresh cycle",

  /* Overview strip */
  "hiw.overviewBadge": "The 7-stage engine",
  "hiw.overviewTitle": "Seven stages. Zero guesswork.",
  "hiw.overviewSubtitle":
    "Each stage is built, tested and monitored independently. If any stage breaks, the pick is held — never published.",

  /* Stage 1 — Data acquisition */
  "hiw.s1Badge": "Stage 01 · Data acquisition",
  "hiw.s1Title": "We start where the market starts: the raw feed.",
  "hiw.s1Lead":
    "Garbage in, garbage out. So our pipeline begins with the highest-quality, most redundant data sources we can get our hands on — and we never trust a single one.",
  "hiw.s1P1":
    "Every 30 seconds, we pull structured data from 14 independent providers: match schedules, live odds from 40+ bookmakers, injury reports, confirmed lineups, referee assignments, weather at venue, travel distance, and historical head-to-head archives going back two decades.",
  "hiw.s1P2":
    "Every single record is timestamped and version-controlled. That means we can replay any moment in history exactly as our models saw it — critical for honest backtesting and essential for regulatory-grade auditability.",
  "hiw.s1Point1Title": "14 redundant providers",
  "hiw.s1Point1Desc":
    "If one source disagrees with the rest, it gets quarantined until we understand why.",
  "hiw.s1Point2Title": "30-second refresh",
  "hiw.s1Point2Desc":
    "Odds, lineups and injuries are re-pulled every half minute up until kick-off.",
  "hiw.s1Point3Title": "Point-in-time storage",
  "hiw.s1Point3Desc":
    "Nothing is overwritten. Every change is a new row — history is permanent.",

  /* Stage 2 — Cleaning */
  "hiw.s2Badge": "Stage 02 · Cleaning & normalisation",
  "hiw.s2Title": "We enforce one source of truth before a model ever sees the data.",
  "hiw.s2Lead":
    "Raw sports data is famously messy. Team names differ between feeds, leagues rename themselves, markets get suspended mid-match. We fix all of it — in a deterministic, reproducible way.",
  "hiw.s2P1":
    "Teams, leagues, players and market types are mapped to a single canonical schema through a manually audited lookup table. Suspended, voided or late-cancelled markets are flagged and excluded before any model ever touches them.",
  "hiw.s2P2":
    "Outlier detection catches bad data the moment it lands. Any record that fails a sanity check (impossible scores, negative times, odds outside a 1.01–1000 range) gets pulled out of the pipeline and logged for manual review.",
  "hiw.s2BulletsTitle": "What we clean",
  "hiw.s2Bullet1": "Team & league aliases unified",
  "hiw.s2Bullet2": "Timezones normalised to UTC",
  "hiw.s2Bullet3": "Suspended / voided markets removed",
  "hiw.s2Bullet4": "Odds sanity-checked across books",
  "hiw.s2Bullet5": "Missing values explicitly marked (never silently imputed)",

  /* Stage 3 — Feature engineering */
  "hiw.s3Badge": "Stage 03 · Feature engineering",
  "hiw.s3Title": "1,200+ features per match — and every single one earns its place.",
  "hiw.s3Lead":
    "A prediction is only as sharp as the signals it's built on. This is where a match becomes a high-dimensional fingerprint our models can actually reason about.",
  "hiw.s3P1":
    "For every fixture we compute more than 1,200 features across six families: strength ratings (Elo, Glicko, market-implied), recent form (xG, expected points, momentum), situational context (rest days, travel km, altitude), head-to-head history, market movement (line drift, sharp action) and discipline metrics.",
  "hiw.s3P2":
    "All features are stored in a point-in-time feature store. When we train a model on last season's Champions League final, it sees only what was available at kick-off — not a single byte of the future. This is the single biggest reason most public models overfit and ours don't.",
  "hiw.s3Family1Title": "Strength & form",
  "hiw.s3Family1Desc": "Elo, Glicko, xG trends, rolling SRS, expected points.",
  "hiw.s3Family2Title": "Situational context",
  "hiw.s3Family2Desc": "Rest days, travel km, altitude, venue, weather.",
  "hiw.s3Family3Title": "Head-to-head",
  "hiw.s3Family3Desc": "Last 20 meetings, venue splits, style matchups.",
  "hiw.s3Family4Title": "Market signals",
  "hiw.s3Family4Desc": "Opening vs. current odds, steam moves, sharp money.",
  "hiw.s3Family5Title": "Lineups & availability",
  "hiw.s3Family5Desc": "Confirmed XI, minutes lost to injury, fatigue index.",
  "hiw.s3Family6Title": "Discipline & referee",
  "hiw.s3Family6Desc": "Cards per 90, referee strictness, historical bias.",

  /* Stage 4 — Model ensemble */
  "hiw.s4Badge": "Stage 04 · Model ensemble",
  "hiw.s4Title": "Four independent models. One honest probability.",
  "hiw.s4Lead":
    "A single model will always have blind spots. So we run four completely different approaches, each trained on the same feature store, and blend their votes.",
  "hiw.s4P1":
    "Each model is tested independently before it's allowed into the ensemble. If a new model doesn't outperform the current blend on out-of-sample data for three consecutive months, it simply doesn't ship.",
  "hiw.s4Model1Name": "Poisson Goals Model",
  "hiw.s4Model1Desc":
    "A goals-based probabilistic model that estimates expected attacking and defensive rates for each team and integrates over all possible scorelines.",
  "hiw.s4Model2Name": "Gradient-Boosted Classifier",
  "hiw.s4Model2Desc":
    "An XGBoost-style classifier trained on the full feature store. Strongest at capturing non-linear interactions between form, injuries and market movement.",
  "hiw.s4Model3Name": "Elo + Glicko Baseline",
  "hiw.s4Model3Desc":
    "A transparent rating-based model that anchors the ensemble and prevents it from drifting too far from the fundamentals of team strength.",
  "hiw.s4Model4Name": "Market-Implied Calibrator",
  "hiw.s4Model4Desc":
    "A meta-model that learns how the sharpest books price games and corrects the other three models whenever their probabilities drift away from efficient pricing.",
  "hiw.s4BlendTitle": "Stacked blending",
  "hiw.s4BlendDesc":
    "The four probabilities are combined through a stacked regressor that has been trained to minimise log-loss on held-out matches. The weights are recomputed weekly as new results come in.",

  /* Stage 5 — Value detection */
  "hiw.s5Badge": "Stage 05 · Value detection",
  "hiw.s5Title": "We only publish picks where our edge survives the real world.",
  "hiw.s5Lead":
    "Being right isn't enough. A pick only becomes a pick when our probability beats the market by more than the friction of actually playing it.",
  "hiw.s5P1":
    "For every possible market we compare our ensemble probability to the best available odds across 40+ bookmakers, then subtract a realistic slippage budget: commission, expected closing-line movement, and execution delay. Whatever remains is the true edge.",
  "hiw.s5P2":
    "Only picks with a statistically significant positive expected value survive. Everything else is discarded — even if it would have won. Because a track record built on luck collapses the moment luck runs out.",
  "hiw.s5FormulaTitle": "The check every pick has to pass",
  "hiw.s5FormulaLine1": "Model probability × Best odds",
  "hiw.s5FormulaLine2": "−  expected slippage",
  "hiw.s5FormulaLine3": "−  bookmaker margin",
  "hiw.s5FormulaLine4": "=  real edge",
  "hiw.s5FormulaFoot":
    "If this number isn't clearly above zero, the pick never leaves the lab.",

  /* Stage 6 — Publishing */
  "hiw.s6Badge": "Stage 06 · Publishing & grading",
  "hiw.s6Title": "Every pick is timestamped, shipped and publicly gradable.",
  "hiw.s6Lead":
    "This is where most prediction sites get vague. This is where we get loud.",
  "hiw.s6P1":
    "The moment a pick is generated, it is timestamped, signed, and published to your dashboard and our public ledger at the same second. You and a regulator see the exact same record.",
  "hiw.s6P2":
    "Once the match ends, every pick is graded automatically against the official result feed. Wins, losses and pushes are all recorded. Losing picks stay on the ledger forever — because a track record that only shows winners isn't a track record, it's marketing.",
  "hiw.s6Point1Title": "Same-second publishing",
  "hiw.s6Point1Desc":
    "Subscribers and the public ledger are updated simultaneously — no back-dating possible.",
  "hiw.s6Point2Title": "Automatic grading",
  "hiw.s6Point2Desc":
    "Results are scored from the official feed, not by a human who might look the other way.",
  "hiw.s6Point3Title": "Nothing is deleted",
  "hiw.s6Point3Desc":
    "Losing picks are permanent. The ledger is append-only by design.",

  /* Stage 7 — Retraining */
  "hiw.s7Badge": "Stage 07 · Continuous retraining",
  "hiw.s7Title": "The engine gets smarter every Sunday night.",
  "hiw.s7Lead":
    "Sport changes. Coaches change. Tactics change. If your model doesn't change with them, it dies.",
  "hiw.s7P1":
    "Every Sunday night, after the week's matches have settled, the entire ensemble is retrained on the latest data. Model weights are re-estimated, stacking coefficients are updated, and the new version is shadow-tested against the live version for 48 hours before it takes over.",
  "hiw.s7P2":
    "Drift detection runs continuously in the background. If the model's calibration starts slipping on any sport or league, an alert fires and the ensemble is rolled back to the last known-good version until the issue is understood.",
  "hiw.s7Bullet1": "Weekly retraining cycle",
  "hiw.s7Bullet2": "48-hour shadow test before go-live",
  "hiw.s7Bullet3": "Continuous drift monitoring",
  "hiw.s7Bullet4": "Automatic rollback on calibration failure",

  /* Trust reinforcement / proof */
  "hiw.proofBadge": "Why this matters",
  "hiw.proofTitle": "The reason our predictions actually hold up.",
  "hiw.proofSubtitle":
    "Every choice in this pipeline exists for one reason: to give you a probability you can bet your bankroll on without blinking.",
  "hiw.proof1Title": "No hindsight bias",
  "hiw.proof1Desc":
    "Point-in-time feature store. The model never learns from information that wasn't available at kick-off.",
  "hiw.proof2Title": "Ensemble, not one-trick-pony",
  "hiw.proof2Desc":
    "Four independent models cross-check each other. One blind spot can't poison the whole prediction.",
  "hiw.proof3Title": "Edge survives slippage",
  "hiw.proof3Desc":
    "Picks only ship if the edge holds after commission, margin and closing-line movement are subtracted.",
  "hiw.proof4Title": "Permanent public ledger",
  "hiw.proof4Desc":
    "You can verify every pick we've ever published. Wins and losses. No exceptions.",
  "hiw.proof5Title": "Retrained every week",
  "hiw.proof5Desc":
    "The engine adapts to new tactics, injuries and market behaviour — with an automatic rollback if it drifts.",
  "hiw.proof6Title": "Built by people who ship",
  "hiw.proof6Desc":
    "A two-person team of sports fanatics with an ICT background. Every line of this pipeline is hand-rolled, not bolted together from plugins.",

  /* Objection section — FAQ */
  "hiw.faqBadge": "Honest answers",
  "hiw.faqTitle": "The questions every serious analyst asks us.",
  "hiw.faqSubtitle":
    "If you've tried a tipster site before, you've probably been burned. Here's exactly why BetsPlug is different.",
  "hiw.faq1Q": "How do I know you're not just lucky?",
  "hiw.faq1A":
    "Over 24,000 graded picks across nine sports. Luck evens out at that sample size — skill compounds. Every prediction is time-stamped before kick-off, so you can verify it against the official result feed yourself.",
  "hiw.faq2Q": "What happens on a losing streak?",
  "hiw.faq2A":
    "Losing picks stay on the public ledger permanently. We publish them just as loudly as the winners. If a model starts drifting, automatic drift detection rolls the ensemble back to the last known-good version within hours.",
  "hiw.faq3Q": "Why not just use one really smart model?",
  "hiw.faq3A":
    "Because every single model has blind spots — statistical ones, tactical ones, or situational ones. Four independent models with different architectures will catch each other's mistakes. The ensemble consistently beats its strongest individual member.",
  "hiw.faq4Q": "Can I actually execute these edges at a sportsbook?",
  "hiw.faq4A":
    "Yes — and we prove it. Every ROI figure we publish is adjusted for realistic slippage between our publish time and the closing line. The edge you see is the edge you can actually play.",
  "hiw.faq5Q": "What sports and leagues do you cover?",
  "hiw.faq5A":
    "Nine sports and 70+ leagues. Football (all top European leagues + internationals), basketball (NBA, EuroLeague), tennis (ATP, WTA, Grand Slams), plus selected coverage of baseball, ice hockey, American football, MMA, rugby and esports.",
  "hiw.faq6Q": "Is this gambling advice?",
  "hiw.faq6A":
    "No. BetsPlug is a pure sports analytics platform. We publish probabilities, expected values and a verifiable track record. What you do with that information is entirely your decision.",

  /* Final CTA */
  "hiw.ctaBadge": "Ready to see it in action?",
  "hiw.ctaTitle": "Stop guessing. Start trusting the pipeline.",
  "hiw.ctaSubtitle":
    "You've just read the most honest how-it-works page in sports analytics. Now see the picks it produces — live, timestamped, and ready to verify.",
  "hiw.ctaPrimary": "Start Free Trial",
  "hiw.ctaSecondary": "See the track record",

  /* ── Checkout flow ────────────────────────────────────────── */
  /* Header */
  "checkout.backToSite": "Back to site",
  "checkout.header.usp1Title": "Secure payments",
  "checkout.header.usp1Desc": "256-bit SSL encryption",
  "checkout.header.usp2Title": "Cancel anytime",
  "checkout.header.usp2Desc": "No questions asked",
  "checkout.header.usp3Title": "Instant access",
  "checkout.header.usp3Desc": "Picks unlocked in seconds",

  /* Page heading */
  "checkout.pageTitle": "Complete your subscription",
  "checkout.pageSubtitle":
    "You're seconds away from unlocking data-driven picks. All plans come with a 14-day no-risk guarantee.",

  /* Stepper labels */
  "checkout.step1": "Account",
  "checkout.step2": "Billing",
  "checkout.step3": "Payment",
  "checkout.stepOf": "Step {current} of {total}",

  /* Plan summary (right column) */
  "checkout.summaryTitle": "Order summary",
  "checkout.planLabel": "Plan",
  "checkout.billingLabel": "Billing",
  "checkout.monthly": "Monthly",
  "checkout.yearly": "Yearly",
  "checkout.changePlan": "Change plan",
  "checkout.subtotal": "Plan",
  "checkout.addons": "Add-ons",
  "checkout.vatIncluded": "All prices include 21% VAT",
  "checkout.total": "Total due today",
  "checkout.yearlySaveBadge": "Save 20%",
  "checkout.yearlySaveCallout":
    "Switch to yearly billing and save 20% — that's {amount} off every year.",
  "checkout.yearlySaving": "You're saving {amount} / year",

  /* Upsells */
  "checkout.upsellsTitle": "Supercharge your subscription",
  "checkout.upsellsSubtitle":
    "Optional extras that most members add to get the full edge. Cancel any add-on independently at any time.",
  "checkout.upsell1Title": "VIP Telegram Alerts",
  "checkout.upsell1Desc":
    "Get every pick pushed straight to your Telegram — no need to log in, every edge the moment it drops.",
  "checkout.upsell1Badge": "Most popular",
  "checkout.upsell2Title": "Weekly Deep-Dive Report",
  "checkout.upsell2Desc":
    "Every Monday: a 20-page PDF breaking down the past week's ROI, model drift and upcoming edges.",
  "checkout.upsell3Title": "Priority 1-on-1 Support",
  "checkout.upsell3Desc":
    "Skip the queue with a direct line to our analysts — replies within 2 hours, 7 days a week.",
  "checkout.upsell4Title": "Tip of the Day Access",
  "checkout.upsell4Desc":
    "One high-confidence pick delivered to your inbox every single day — our single highest-edge bet for the next 24 hours.",
  "checkout.upsellIncluded": "Included with Platinum",
  "checkout.upsellPerMonth": "/mo",

  /* Trial picker */
  "checkout.trialSectionTitle": "How do you want to start?",
  "checkout.trialSectionSubtitle":
    "Try BetsPlug risk-free or skip the trial and get full access immediately.",
  "checkout.trialOption1Title": "7-day free trial",
  "checkout.trialOption1Desc":
    "Full access for 7 days, €0 today. First charge on {date} if you don't cancel.",
  "checkout.trialOption1Badge": "Recommended",
  "checkout.trialOption2Title": "Subscribe now",
  "checkout.trialOption2Desc":
    "Charged today, no trial period. Ideal if you already know our track record.",
  "checkout.trialPausedNote":
    "Cancel during the trial and your account is paused — not deleted. You can resume any time.",
  "checkout.trialBadge": "7-day free trial active",
  "checkout.trialDueToday": "€0.00 today",
  "checkout.trialFirstCharge": "First charge on {date}",
  "checkout.trialNotAvailable":
    "The free trial is only available on monthly and yearly plans.",
  "checkout.trialPaymentNote":
    "Your payment details are required to activate the trial, but you will not be charged today. Cancel any time before {date} and nothing will be billed.",
  "checkout.submitTrial": "Start my 7-day free trial",

  "checkout.freeTrial": "14-day free trial",
  "checkout.trialNote":
    "You won't be charged today. Cancel any time during the trial.",
  "checkout.couponQuestion": "Have a coupon?",
  "checkout.couponPlaceholder": "Enter code",
  "checkout.couponApply": "Apply",
  "checkout.summaryIncluded": "What's included",
  "checkout.perMonth": "/month",
  "checkout.perYear": "/year",

  /* Step 1 — Account */
  "checkout.accountTitle": "Create your account",
  "checkout.accountSubtitle":
    "You'll use these details to sign in to BetsPlug.",
  "checkout.firstName": "First name",
  "checkout.firstNamePh": "John",
  "checkout.lastName": "Last name",
  "checkout.lastNamePh": "Doe",
  "checkout.email": "Email address",
  "checkout.emailPh": "you@example.com",
  "checkout.password": "Password",
  "checkout.passwordPh": "At least 8 characters",
  "checkout.passwordHint": "Minimum 8 characters, 1 number.",
  "checkout.confirmPassword": "Confirm password",
  "checkout.alreadyHaveAccount": "Already have an account?",
  "checkout.signIn": "Sign in",

  /* Step 2 — Billing */
  "checkout.billingTitle": "Billing address",
  "checkout.billingSubtitle":
    "We use this only for VAT calculation and your invoice.",
  "checkout.country": "Country",
  "checkout.countryPh": "Select country",
  "checkout.address": "Street address",
  "checkout.addressPh": "123 Main Street",
  "checkout.city": "City",
  "checkout.cityPh": "Amsterdam",
  "checkout.postalCode": "Postal code",
  "checkout.postalCodePh": "1012 AB",
  "checkout.state": "State / Province (optional)",
  "checkout.company": "Company name (optional)",
  "checkout.vatId": "VAT ID (optional)",

  /* Step 3 — Payment */
  "checkout.paymentTitle": "Payment method",
  "checkout.paymentSubtitle":
    "Choose how you'd like to pay. A real payment provider will be connected soon — this is a demo checkout.",
  "checkout.payCard": "Credit card",
  "checkout.payCardDesc": "Visa, Mastercard, Amex",
  "checkout.payPaypal": "PayPal",
  "checkout.payPaypalDesc": "Pay with your PayPal balance",
  "checkout.cardNumber": "Card number",
  "checkout.cardNumberPh": "1234 5678 9012 3456",
  "checkout.cardExpiry": "Expiry",
  "checkout.cardExpiryPh": "MM/YY",
  "checkout.cardCvc": "CVC",
  "checkout.cardCvcPh": "123",
  "checkout.cardName": "Name on card",
  "checkout.cardNamePh": "John Doe",
  "checkout.paypalNote":
    "You'll be redirected to PayPal to complete the payment.",
  "checkout.demoBadge": "Demo mode",
  "checkout.demoNote":
    "Payments are not processed yet. We'll connect a real provider (Stripe / PayPal) before launch.",

  /* Terms & action row */
  "checkout.agreeTerms": "I agree to the",
  "checkout.termsLink": "Terms & Conditions",
  "checkout.and": "and",
  "checkout.privacyLink": "Privacy Policy",
  "checkout.next": "Continue",
  "checkout.back": "Back",
  "checkout.submit": "Start my subscription",
  "checkout.processing": "Processing…",

  /* Footer */
  "checkout.footer.secure": "256-bit SSL encrypted checkout",
  "checkout.footer.guarantee": "14-day money-back guarantee",
  "checkout.footer.support": "Need help? support@betsplug.com",
  "checkout.footer.copy": "© {year} BetsPlug. All rights reserved.",

  /* Success */
  "checkout.successTitle": "Welcome to BetsPlug!",
  "checkout.successBody":
    "Your demo checkout was received. In production you'd now be redirected to your dashboard — for now, explore the site.",
  "checkout.successCta": "Go to dashboard",
} as const;

export type TranslationKey = keyof typeof en;

type Dictionary = Partial<Record<TranslationKey, string>>;

/* ── Dutch ─────────────────────────────────────────────────── */
const nl: Dictionary = {
  "nav.predictions": "Voorspellingen",
  "nav.howItWorks": "Hoe het werkt",
  "nav.trackRecord": "Track Record",
  "nav.pricing": "Prijzen",
  "nav.contact": "Contact",
  "nav.about": "Over ons",
  "nav.login": "Inloggen",
  "nav.startFreeTrial": "Gratis proberen",
  "nav.menu": "Menu",
  "nav.getStarted": "Begin nu",
  "nav.joinBlurb":
    "Sluit je aan bij 1.500+ analisten en krijg vandaag nog datagedreven voorspellingen.",

  "hero.badge": "Wees de bookmaker voor",
  "hero.titleLine1": "De beste AI-gedreven",
  "hero.titleLine2": "sportvoorspellingen",
  "hero.titleLine3": "voor jouw voordeel.",
  "hero.subtitle":
    "BetsPlug combineert data, Elo-ratings, Poisson-modellen en machine learning in één platform. Live kansen, diepgaande inzichten en een bewezen track record — gemaakt voor serieuze sportanalisten.",
  "hero.activeUsers": "Actieve gebruikers",
  "hero.ctaPrimary": "Gratis proberen",
  "hero.ctaSecondary": "Hoe het werkt",
  "hero.livePick": "Live pick",
  "hero.hot": "Hot",
  "hero.homeWin": "Thuiswinst",
  "hero.draw": "Gelijk",
  "hero.away": "Uit",
  "hero.confidence": "Zekerheid",
  "hero.edge": "Voordeel",
  "hero.joinNow": "Word lid",
  "hero.winRate": "Winst %",
  "hero.today": "Vandaag",
  "hero.wins": "Gewonnen",
  "hero.usp1Title": "4-modellen AI-ensemble",
  "hero.usp1Desc": "Poisson, XGBoost, Elo & markt-geïmpliceerd — gemengd.",
  "hero.usp2Title": "Geverifieerde +EV picks",
  "hero.usp2Desc": "Alleen gepubliceerd als de edge echte slippage verslaat.",
  "hero.usp3Title": "Publiek track record",
  "hero.usp3Desc": "Elke pick krijgt een tijdstempel. Winst én verlies, voor altijd.",

  "lang.label": "Taal",
  "lang.switch": "Wissel taal",

  "comparison.badge": "Waarom BetsPlug",
  "comparison.titleA": "Niet elke voorspelsite",
  "comparison.titleB": "is hetzelfde gebouwd.",
  "comparison.subtitle":
    "Dit is precies wat BetsPlug onderscheidt van gewone tipstersites — geen kleine lettertjes, geen uitgekozen successen.",
  "comparison.feature": "Functie",
  "comparison.winner": "Winnaar",
  "comparison.others": "Anderen",
  "comparison.typicalTipsters": "Gewone tipsters",
  "comparison.finalScore": "Eindscore",
  "comparison.fullHouse": "Alles goed",
  "comparison.fallsShort": "Schiet tekort",
  "comparison.caption":
    "Vergelijking gebaseerd op openbaar beschikbare informatie van toonaangevende tipsterplatforms (2026).",

  "how.badge": "Hoe het werkt",
  "how.title": "Van aanmelden tot slimmere picks in 3 stappen.",
  "how.subtitle":
    "Een eenvoudig, transparant proces rond data — geen hype, geen gokken.",
  "how.step1Title": "Maak een account",
  "how.step1Desc":
    "Registreer gratis in enkele seconden. Geen creditcard nodig voor onze dagelijkse value picks.",
  "how.step2Title": "Bekijk AI-voorspellingen",
  "how.step2Desc":
    "Vier AI-modellen combineren live odds, Elo, vorm en historische data voor echte voordelen.",
  "how.step3Title": "Neem slimmere beslissingen",
  "how.step3Desc":
    "Gebruik transparante kansen, voordelen en confidence scores om met overtuiging te kiezen.",
  "how.deepDive": "Bekijk de volledige engine",

  "pricing.badge": "Prijzen",
  "pricing.title": "Simpele prijzen. Serieus voordeel.",
  "pricing.subtitle":
    "Begin gratis. Upgrade wanneer je wilt. Altijd opzegbaar.",
  "pricing.monthly": "Maandelijks",
  "pricing.yearly": "Jaarlijks",
  "pricing.save": "Bespaar 20%",
  "pricing.savingNote": "Je bespaart 2 maanden",
  "pricing.mostPopular": "Meest gekozen",
  "pricing.ctaFree": "Gratis starten",
  "pricing.ctaUpgrade": "Upgraden",
  "pricing.ctaLifetime": "Lifetime toegang",

  "cta.badge": "Klaar om slimmer te winnen?",
  "cta.title": "Begin vandaag nog je datagedreven voordeel.",
  "cta.subtitle":
    "Sluit je aan bij 1.500+ analisten die BetsPlug al gebruiken voor scherpere, rustigere beslissingen.",
  "cta.primary": "Gratis proberen",
  "cta.secondary": "Bekijk voorspellingen",

  "footer.premiumBadge": "Premium toegang",
  "footer.premiumTitleA": "Word lid van onze",
  "footer.premiumTitleB": "Premium Telegram",
  "footer.premiumTitleC": "groep",
  "footer.premiumSubtitle":
    "Krijg realtime picks, value-alerts en live chat met onze AI-analisten. Wees de eerste die weet wanneer er een hoge-waarde wedstrijd langskomt — direct in je zak.",
  "footer.perk1": "Directe value-alerts",
  "footer.perk2": "Privé Q&A met analisten",
  "footer.perk3": "Dagelijkse gratis picks",
  "footer.perk4": "VIP-only diepgaande analyses",
  "footer.joinCta": "Word lid van de Premium Groep",
  "footer.limited": "Beperkte plekken · Alleen voor leden",
  "footer.onlineNow": "1.200+ leden online",
  "footer.brandTagline":
    "BetsPlug combineert data, Elo-ratings, Poisson-modellen en machine learning in één platform — gemaakt voor serieuze sportanalisten die niet willen gokken.",
  "footer.product": "Product",
  "footer.company": "Bedrijf",
  "footer.legal": "Juridisch",
  "footer.secureTitle": "Veilige betalingen",
  "footer.secureDesc": "256-bit SSL versleutelde checkout",
  "footer.pciCompliant": "PCI DSS gecertificeerd",
  "footer.copyright":
    "Alle rechten voorbehouden. BetsPlug is een data- & analyseplatform — geen gokaanbieder.",
  "footer.responsible": "18+ Speel verantwoord",

  "leagues.badge": "Wereldwijde dekking",
  "leagues.titleA": "Competities die wij",
  "leagues.titleB": "dekken",

  "trusted.titleA": "Jouw",
  "trusted.titleHighlight": "vertrouwde",
  "trusted.titleB": "partner",
  "trusted.titleC": "in sportanalyse.",
  "trusted.subtitle":
    "BetsPlug bundelt en beveiligt een groeiend ecosysteem van databronnen, AI-modellen en bewezen strategieën. Eén platform voor datagedreven sportanalisten die niet willen gokken.",
  "trusted.card1Title": "Voor elk kennisniveau.",
  "trusted.card1Desc":
    "Van beginner tot pro-analist — onze dashboards, tutorials en transparante statistieken maken elke voorspelling makkelijk te begrijpen.",
  "trusted.card2Title": "Beste werkwijzen in de sector.",
  "trusted.card2Desc":
    "Vier AI-modellen (Elo, Poisson, Logistic, Ensemble) leveren samen voorspellingen die je kunt vertrouwen. Bewezen methodes, transparante resultaten.",
  "trusted.learnMore": "Meer lezen",
  "trusted.card3Title": "Beschermd door transparantie.",
  "trusted.card3Desc":
    "Elke voorspelling wordt gelogd, bijgehouden en openbaar geverifieerd. Geen verborgen resultaten, geen selectief kiezen — gewoon data die jijzelf kunt controleren.",

  "track.label": "Track record",
  "track.accuracy": "Totale nauwkeurigheid",
  "track.thisWeek": "Deze week",
  "track.metricPredictions": "Voorspellingen",
  "track.metricModels": "Modellen",
  "track.metricLeagues": "Competities",
  "track.badge": "Bewezen resultaten",
  "track.titleA": "Vertrouwd",
  "track.titleHighlight": "platform",
  "track.titleB": "altijd & overal.",
  "track.rating": "4.9 / 5 van 1.200+ analisten",
  "track.desc1":
    "Eén platform dat een groeiend ecosysteem van sportdata, AI-voorspellingen en strategie-backtesting tools bij elkaar brengt. Alle voorspellingen worden gelogd en publiek bijgehouden — altijd volledig transparant.",
  "track.desc2":
    "Of je nu voetbal, basketbal of tennis volgt, BetsPlug verenigt data en machine learning tot inzichten die je écht kunt gebruiken.",
  "track.cta": "Meer lezen",
  "track.askQuestion": "Vraag stellen?",

  "features.badge": "Functies",
  "features.titleA": "Alles wat je nodig hebt om",
  "features.titleB": "slim te winnen.",
  "features.f1Title": "Realtime voorspellingen",
  "features.f1Desc":
    "Live kansberekeningen terwijl de wedstrijd verandert. Mis nooit meer een value-kans.",
  "features.f2Title": "4 AI-modellen gecombineerd",
  "features.f2Desc":
    "Elo, Poisson, Logistische Regressie en ons eigen Ensemble-model voor maximale nauwkeurigheid.",
  "features.f3Title": "Strategie backtesting",
  "features.f3Desc":
    "Test je strategieën op historische data. Ken je voordeel voordat je inzet.",
  "features.f4Title": "Geverifieerde databronnen",
  "features.f4Desc":
    "Wij gebruiken alleen officiële API's en geverifieerde data. Geen gescrapte of onbetrouwbare bronnen.",
  "features.f5Title": "Bet of the Day",
  "features.f5Desc":
    "Ons algoritme kiest elke dag de pick met de hoogste waarde. Premium-leden zien hem als eerste.",
  "features.f6Title": "Groeiende community",
  "features.f6Desc":
    "Sluit je aan bij datagedreven sportanalisten die inzichten en strategieën delen.",

  "testimonials.badge": "Ervaringen",
  "testimonials.titleA": "Wat onze",
  "testimonials.titleHighlight": "analisten",
  "testimonials.titleB": "zeggen",
  "testimonials.subtitle":
    "Sluit je aan bij 1.500+ datagedreven bettors die BetsPlug vertrouwen voor hun voordeel op de bookmakers.",

  "finalCta.badge": "Klaar om te winnen?",
  "finalCta.titleA": "Begin vandaag met",
  "finalCta.titleHighlight": "slimmere picks",
  "finalCta.titleB": "maken.",
  "finalCta.subtitle":
    "Sluit je aan bij duizenden sportanalisten die BetsPlug's AI-voorspellingen gebruiken. Gratis proefversie — geen creditcard nodig.",
  "finalCta.primary": "Gratis proberen",
  "finalCta.secondary": "Meer info →",
  "finalCta.moneyBack": "3 dagen geld-terug",
  "finalCta.cancelAnytime": "Altijd opzegbaar",
  "finalCta.instantAccess": "Direct toegang",

  "pricing.bronzeTagline": "Begin met verkennen, voor altijd gratis",
  "pricing.bronzeCta": "Gratis beginnen",
  "pricing.bronzeF1": "1 Bet of the Day (gratis pick)",
  "pricing.bronzeF2": "3 dagelijkse AI-voorspellingen",
  "pricing.bronzeF3": "Toegang tot openbaar track record",
  "pricing.bronzeF4": "Community-inzichten",
  "pricing.bronzeF5": "E-mailondersteuning",
  "pricing.silverTagline": "Voor serieuze analisten",
  "pricing.silverCta": "Start Silver",
  "pricing.silverF1": "Onbeperkt AI-voorspellingen",
  "pricing.silverF2": "Alle 4 AI-modellen (Ensemble)",
  "pricing.silverF3": "Live kansberekening",
  "pricing.silverF4": "Strategie backtesting",
  "pricing.silverF5": "Prioritaire e-mailsupport",
  "pricing.goldTagline": "Meest gekozen optie",
  "pricing.goldCta": "Start Gold",
  "pricing.goldF1": "Alles van Silver, plus:",
  "pricing.goldF2": "Exclusief Gold Telegram-kanaal",
  "pricing.goldF3": "Vroege toegang tot Bet of the Day",
  "pricing.goldF4": "Persoonlijke AI-strategieadviseur",
  "pricing.goldF5": "VIP leaderboard & analyses",
  "pricing.goldF6": "24/7 prioritaire support",
  "pricing.perMonth": "/ maand",
  "pricing.forever": "/ voor altijd",
  "pricing.billedMonthly": "Maandelijks gefactureerd",
  "pricing.billedYearlySilver": "€95,90 per jaar gefactureerd",
  "pricing.billedYearlyGold": "€143,90 per jaar gefactureerd",
  "pricing.platTagline": "Eenmalige betaling. Levenslange toegang.",
  "pricing.platPitch":
    "Betaal één keer, behoud je voordeel voor altijd — elke huidige functie en elke toekomstige update, inbegrepen.",
  "pricing.platBadgeLifetime": "Levenslange deal",
  "pricing.platLimited": "Beperkt tot 100/jaar",
  "pricing.platOneTime": "Eenmalige betaling",
  "pricing.platNoSub": "Geen abonnement. Geen verlengingen. Nooit.",
  "pricing.platCta": "Claim levenslange toegang",
  "pricing.platF1": "Levenslange toegang tot elke functie",
  "pricing.platF2": "Alle toekomstige releases voor altijd inbegrepen",
  "pricing.platF3": "Directe lijn met ons analistenteam",
  "pricing.platF4": "Founder-tier leaderboard badge",
  "pricing.platF5": "Beperkt tot 100 leden per jaar",
  "pricing.trust1": "3 dagen geld-terug-garantie",
  "pricing.trust2": "Altijd opzegbaar",
  "pricing.trust3": "Veilige betaling via Stripe",

  "seo.badge": "De slimme manier om bets te onderzoeken",
  "seo.titleA": "AI-sportvoorspellingen &",
  "seo.titleB": "datagedreven betting picks",
  "seo.subtitle":
    "BetsPlug is het datagedreven thuis voor AI-sportvoorspellingen, machine-learning picks en statistische match-analyses. Of je nu een voetbalaccu onderzoekt, value zoekt in NBA player props of een nieuwe strategie backtest — onze AI-predictor geeft je het voordeel dat je nodig hebt.",
  "seo.pillar1Title": "AI Sportvoorspelling Engine",
  "seo.pillar1Desc":
    "Onze AI-engine combineert Elo-ratings, Poisson-modellen en machine learning om uitslagen in voetbal, basketbal en tennis datagedreven te voorspellen.",
  "seo.pillar2Title": "Data-gestaafde voorspellingen",
  "seo.pillar2Desc":
    "Elke AI-voorspelling op BetsPlug is gebaseerd op duizenden historische wedstrijden, live vormdata en xG-metrics — voor de scherpste picks online.",
  "seo.pillar3Title": "Geverifieerd track record",
  "seo.pillar3Desc":
    "Transparantie voorop. Bekijk ons openbare track record met elke AI-pick die we ooit publiceerden — volledige ROI, hit-rate en confidence gelogd en getimestampt.",
  "seo.pillar4Title": "Bet of the Day",
  "seo.pillar4Desc":
    "Weinig tijd? Onze dagelijkse AI-Bet of the Day geeft de pick met de hoogste confidence uit alle competities — gekozen door ons algoritme, niet op gevoel.",
  "seo.pillar5Title": "Live AI-kansen",
  "seo.pillar5Desc":
    "Zie kansen realtime verschuiven tijdens een match. Onze live AI-predictor herberekent winstkansen elke seconde zodat je value spot zodra die verschijnt.",
  "seo.pillar6Title": "Analyse, geen gokken",
  "seo.pillar6Desc":
    "BetsPlug is een sportanalyse-platform — geen bookmaker. We leveren AI-voorspellingen en data-inzichten zodat jij geïnformeerd kunt beslissen, zonder ooit op onze site te wedden.",

  "faq.badge": "Veelgestelde vragen",
  "faq.titleA": "Vragen?",
  "faq.titleB": "Wij hebben antwoorden",
  "faq.subtitle":
    "Alles wat je moet weten over ons AI-sportvoorspellingsplatform, van de eerste stappen tot geavanceerde integraties.",
  "faq.browseBy": "Bladeren per categorie",
  "faq.stillQuestions": "Nog vragen?",
  "faq.supportBlurb":
    "Vind je niet wat je zoekt? Ons supportteam helpt je graag verder.",
  "faq.contactSupport": "Neem contact op",
  "faq.articles": "artikelen",

  /* Contact page */
  "contact.backHome": "Terug naar home",
  "contact.badge": "We helpen je graag",
  "contact.titleA": "Hoe kunnen wij je",
  "contact.titleB": "helpen?",
  "contact.subtitle":
    "Krijg direct antwoord van onze AI-assistent, blader door de FAQ of bereik ons team persoonlijk — wat het beste voor jou werkt.",
  "contact.chatPlaceholder": "Vraag onze AI iets over BetsPlug…",
  "contact.chatStart": "Start chat",
  "contact.chatHint": "Powered by BetsPlug AI · Antwoord binnen seconden",

  "contact.card1Title": "Chat met AI-assistent",
  "contact.card1Desc":
    "Direct antwoord op vragen over prijzen, modellen, voorspellingen en meer — 24/7, zonder wachttijd.",
  "contact.card1Cta": "Open chat",
  "contact.card2Title": "Word lid van Telegram",
  "contact.card2Desc":
    "1.200+ leden online, dagelijkse picks, live Q&A met analisten en directe edge-meldingen.",
  "contact.card2Cta": "Join Telegram",
  "contact.card3Title": "E-mail support",
  "contact.card3Desc":
    "Liever mailen? Stuur ons een bericht en een echte medewerker reageert binnen 24 uur op werkdagen.",
  "contact.card3Cta": "Mail versturen",

  "contact.faqBadge": "Helpcentrum",
  "contact.faqTitleA": "Antwoorden binnen",
  "contact.faqTitleB": "handbereik.",
  "contact.faqSubtitle":
    "Doorzoek onze kennisbank of bekijk hieronder de meest gestelde vragen.",
  "contact.faqSearch": "Zoek in het helpcentrum…",
  "contact.faqEmpty":
    "Geen resultaten. Probeer een ander zoekwoord of start een chat met onze AI.",

  "contact.faqGroup1": "Aan de slag",
  "contact.faq1Q": "Wat is BetsPlug precies?",
  "contact.faq1A":
    "BetsPlug is een puur sport-analyseplatform. We publiceren AI-gedreven voorspellingen, Elo-ratings, Poisson-modellen en transparante track records zodat jij datagedreven beslissingen kunt nemen. We zijn geen bookmaker — je kunt bij ons geen weddenschappen plaatsen.",
  "contact.faq2Q": "Moet ik betalen om BetsPlug te proberen?",
  "contact.faq2A":
    "Nee. Onze Bronze tier is 100% gratis en geeft je een dagelijkse AI-pick, basisvoorspellingen en toegang tot ons publieke track record. Upgrade pas naar Silver of Gold als je live-kansen, backtesting en geavanceerde markten wilt.",
  "contact.faq3Q": "Welke sporten en competities dekken jullie?",
  "contact.faq3A":
    "Voetbal (Eredivisie, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, UEFA-competities en 20+ meer), basketbal (NBA) en tennis. Elke maand voegen we nieuwe competities en sporten toe naarmate onze modellen rijpen.",

  "contact.faqGroup2": "Account & facturatie",
  "contact.faq4Q": "Kan ik mijn abonnement op elk moment opzeggen?",
  "contact.faq4A":
    "Ja, alle Silver- en Gold-plannen zijn per maand opzegbaar zonder lock-in. Annuleer in je dashboard en behoud toegang tot het einde van je huidige factureringsperiode — geen gedoe.",
  "contact.faq5Q": "Bieden jullie restituties?",
  "contact.faq5A":
    "We hanteren een 7-daagse niet-goed-geld-terug-garantie op alle betaalde plannen. Is BetsPlug niks voor jou? Mail support binnen de eerste week en je krijgt volledige restitutie.",
  "contact.faq6Q": "Zijn mijn betaalgegevens veilig?",
  "contact.faq6A":
    "Absoluut. Alle betalingen gaan via PCI-DSS-gecertificeerde providers met 256-bit SSL-encryptie. Wij zien of bewaren je kaartgegevens nooit op onze servers.",

  "contact.stillNeedTitle": "Toch nog hulp nodig?",
  "contact.stillNeedDesc":
    "Onze AI-assistent antwoordt direct. Voor complexe accountzaken is een echte medewerker één e-mail verderop.",
  "contact.trust1": "Gem. reactie onder 2 min",
  "contact.trust2": "AVG-compliant",
  "contact.trust3": "1.500+ tevreden gebruikers",

  /* Chatbot */
  "chatbot.title": "BetsPlug AI-assistent",
  "chatbot.online": "Online",
  "chatbot.clear": "Wissen",
  "chatbot.greetingTitle": "Hoe kan ik je helpen?",
  "chatbot.greetingDesc":
    "Stel me vragen over prijzen, onze AI-modellen, het track record of alles rondom BetsPlug.",
  "chatbot.placeholder": "Typ je bericht…",
  "chatbot.footer":
    "AI-antwoorden zijn gesimuleerd — voor urgente zaken mail support@betsplug.com",
  "chatbot.suggestion1": "Hoe werkt de Bet of the Day?",
  "chatbot.suggestion2": "Wat is het verschil tussen Silver en Gold?",
  "chatbot.suggestion3": "Hoe nauwkeurig zijn jullie voorspellingen?",
  "chatbot.replyDefault":
    "Bedankt voor je bericht! Een BetsPlug-analist neemt snel contact op. Bekijk ondertussen onze FAQ of stuur een mail naar support@betsplug.com.",
  "chatbot.replyHello":
    "Hey! 👋 Ik ben de BetsPlug AI. Vraag me alles over onze modellen, prijzen of voorspellingen — ik help je graag verder.",
  "chatbot.replyPricing":
    "We hebben drie plannen: Bronze (altijd gratis), Silver (€9,99/mnd) en Gold (€14,99/mnd). Er is ook een Platinum lifetime deal voor eenmalig €199. Alle betaalde plannen komen met een 7-daagse niet-goed-geld-terug-garantie.",
  "chatbot.replyRefund":
    "Silver- en Gold-plannen kun je op elk moment opzeggen in je dashboard — je behoudt toegang tot het einde van je factureringsperiode. We bieden ook een 7-daagse niet-goed-geld-terug-garantie op alle betaalde plannen.",
  "chatbot.replyAccuracy":
    "Elke voorspelling wordt gelogd in ons publieke track record met hit-rate, ROI en confidence scores. Filter op competitie, markt en datum. Geen cherry-picking, geen verborgen verliezen — transparantie staat voorop.",
  "chatbot.replyTelegram":
    "Onze Telegram-community heeft 1.200+ actieve leden met dagelijkse picks, edge-meldingen en live Q&A met onze analisten. Join via t.me/betsplug — gratis voor Bronze, VIP-kanalen voor Silver/Gold.",

  /* About Us page */
  "about.metaTitle":
    "Over BetsPlug — Het team achter het AI-sportanalyseplatform",
  "about.metaDesc":
    "Maak kennis met de twee engineers die BetsPlug bouwen. Sportfanaten met een ICT-achtergrond die ruwe wedstrijddata omzetten in transparante, datagedreven voorspellingen voor voetbal, basketbal, tennis en meer.",
  "about.breadcrumbHome": "Home",
  "about.breadcrumbAbout": "Over ons",

  "about.heroBadge": "Ons Verhaal",
  "about.heroTitleA": "Gebouwd door sportfanaten.",
  "about.heroTitleB": "Ontwikkeld door data-obsessieven.",
  "about.heroSubtitle":
    "BetsPlug is een AI-gedreven sportanalyseplatform, gebouwd door twee engineers die klaar waren met meningen, tipsters en influencer-ruis. Wij vervingen buikgevoel door statistische modellen, en luide meningen door transparante waarschijnlijkheden.",

  "about.missionBadge": "De Missie",
  "about.missionTitle": "Wij maken van ruwe wedstrijddata een meetbare voorsprong.",
  "about.missionBody1":
    "De voorspellingsmarkt draait al veel te lang op hype. YouTube-goeroes die views achternajagen, Telegram-kanalen die \"locks of the week\" verkopen, betaalde tipsters zonder verifieerbare historie. Als levenslange voetbal-, basketbal- en tennisfans werden we daar helemaal gek van — want we wisten dat de onderliggende data veel beter was dan de ruis eromheen.",
  "about.missionBody2":
    "Dus bouwden we het product dat we altijd al wilden hebben: een platform dat duizenden wedstrijden per week verwerkt, ze doorrekent met Elo-ratings, Poisson-scoremodellen en gradient-boosted classifiers, en alleen de picks toont waar onze modellen écht afwijken van de closing line. Geen onderbuik. Geen cherry picking. Alleen statistiek, open gepubliceerd.",
  "about.missionCta": "Zie hoe het werkt",

  "about.statsBadge": "In Cijfers",
  "about.statsTitle": "Een decennium engineering. Een leven lang sport.",
  "about.stat1Value": "20+",
  "about.stat1Label": "Jaar gecombineerde ICT- & data-ervaring",
  "about.stat2Value": "450+",
  "about.stat2Label": "Wedstrijden per week geanalyseerd",
  "about.stat3Value": "1.200+",
  "about.stat3Label": "Datapunten per wedstrijd",
  "about.stat4Value": "1.500+",
  "about.stat4Label": "Actieve analisten & abonnees",

  "about.valuesBadge": "Waar We In Geloven",
  "about.valuesTitle": "Vier principes achter elke pick.",
  "about.valuesSubtitle":
    "BetsPlug is geen tipster. Het is een gedisciplineerd systeem. Dit zijn de regels die we voor onszelf schreven — en die we weigeren te breken.",
  "about.value1Title": "Data boven mening",
  "about.value1Desc":
    "Elke aanbeveling komt uit een model, niet uit een onderbuikgevoel. We publiceren de expliciete waarschijnlijkheid, verwachte waarde en confidence score zodat je de redenering kunt verifiëren in plaats van blind op een gezicht te vertrouwen.",
  "about.value2Title": "Track record openbaar",
  "about.value2Desc":
    "Elke pick die we publiceren staat voor altijd op onze publieke track record-pagina — winsten, verliezen, pushes, nooit verwijderd. Als we op lange termijn de markt niet verslaan, verdienen we geen cent van jouw geld. Transparantie is het hele punt.",
  "about.value3Title": "Doorlopend hertrainen",
  "about.value3Desc":
    "Voetbal verandert. Coaches worden ontslagen, selecties worden geschud, nieuwe competities komen op. Onze modellen hertrainen wekelijks op verse resultaten zodat ze nooit verouderen, en we publiceren de retraining-notes naast de picks.",
  "about.value4Title": "Jouw voordeel, niet het onze",
  "about.value4Desc":
    "Wij zijn analisten, geen bookmakers. Als de markt in jouw voordeel beweegt, profiteer jij — geen platform dat commissie pakt op jouw verliezen. Die alignment vormt elke product-beslissing die we maken.",

  "about.teamBadge": "Ontmoet de Oprichters",
  "about.teamTitle": "Twee oprichters. Nul fauteuil-experts.",
  "about.teamSubtitle":
    "Wij zijn geen influencers en geen tipsters. Wij zijn engineers die leveren. Alles op BetsPlug is gebouwd, gesloopt en herbouwd door ons tweeën.",

  "about.founder1Name": "Cas",
  "about.founder1Role": "Mede-oprichter · Engineering & Product",
  "about.founder1Bio":
    "Sportliefhebber in hart en nieren met een achtergrond in ICT. Bouwt de systemen die BetsPlug draaiende houden en zorgt dat data netjes van bron naar scherm stroomt.",

  "about.founder2Name": "Dennis",
  "about.founder2Role": "Mede-oprichter · Data Science & Modellering",
  "about.founder2Bio":
    "Sportfanaat en data-enthousiasteling met jarenlange ICT-ervaring. Richt zich op de modellen en statistieken die wedstrijddata omzetten in bruikbare inzichten.",

  "about.ctaTitle": "Klaar om gokken te vervangen door data?",
  "about.ctaSubtitle":
    "Sluit je aan bij 1.500+ analisten die de picks, waarschijnlijkheden en bewijsstukken krijgen — voordat de closing line zich aanpast.",
  "about.ctaButton": "Start Free Trial",

  /* Track Record page */
  "tr.metaTitle":
    "Track Record — Geverifieerde prestaties van BetsPlug",
  "tr.metaDesc":
    "Transparante, controleerbare resultaten voor elke BetsPlug-pick. Zie hoe onze AI-modellen ruwe wedstrijddata omzetten in een meetbare voorsprong — wekelijks gedocumenteerd, nooit cherry-picked.",
  "tr.breadcrumbHome": "Home",
  "tr.breadcrumbTrack": "Track Record",

  "tr.heroBadge": "Volledig transparant",
  "tr.heroTitleA": "Een track record dat je",
  "tr.heroTitleB": "écht kunt verifiëren.",
  "tr.heroSubtitle":
    "Elke pick die BetsPlug publiceert krijgt een tijdstempel, wordt gewogen op waarschijnlijkheid en gelogd in een publiek grootboek — winst of verlies. Zo worden de cijfers opgebouwd, en zo zetten echte gebruikers ze in de praktijk in.",
  "tr.heroCtaPrimary": "Bekijk de nieuwste resultaten",
  "tr.heroCtaSecondary": "Terug naar home",

  "tr.kpisBadge": "Afgelopen 12 maanden",
  "tr.kpisTitle": "De cijfers, ongefilterd.",
  "tr.kpisSubtitle":
    "Een rolling, eerlijke momentopname van hoe onze modellen hebben gepresteerd in het afgelopen jaar publiek publiceren.",
  "tr.kpi1Value": "58,3%",
  "tr.kpi1Label": "Hit rate op value picks",
  "tr.kpi1Note": "Alleen picks met +EV ≥ 3%",
  "tr.kpi2Value": "+14,6%",
  "tr.kpi2Label": "ROI bij vlakke 1u-inzet",
  "tr.kpi2Note": "Na closing-line slippage",
  "tr.kpi3Value": "24.180",
  "tr.kpi3Label": "Afgeronde voorspellingen",
  "tr.kpi3Note": "Over 9 sporten en 70+ competities",
  "tr.kpi4Value": "0,061",
  "tr.kpi4Label": "Brier-score (lager = beter)",
  "tr.kpi4Note": "Gekalibreerd over winst/gelijk/verlies",

  "tr.pipeBadge": "Hoe de data wordt verwerkt",
  "tr.pipeTitle": "Van ruwe wedstrijddata naar een gescoorde voorspelling.",
  "tr.pipeSubtitle":
    "Geen black boxes. Dit is de exacte pipeline die elke pick doorloopt voordat hij op je dashboard verschijnt.",
  "tr.pipe1Title": "Inladen",
  "tr.pipe1Desc":
    "We halen wedstrijd-, opstellings-, blessure- en odds-data binnen bij 14 gecontroleerde leveranciers, elke 30 seconden. Elk record is geversioneerd zodat we elk historisch moment kunnen terugspelen.",
  "tr.pipe2Title": "Schoonmaken & normaliseren",
  "tr.pipe2Desc":
    "Teamnamen, competities en markttypen worden gemapt naar één canoniek schema. Uitschieters, laat afgelaste wedstrijden en opgeschorte markten worden gemarkeerd en verwijderd vóór het modelleren.",
  "tr.pipe3Title": "Feature engineering",
  "tr.pipe3Desc":
    "Voor elke wedstrijd berekenen we 1.200+ features — Elo, xG-trends, rustdagen, reisafstand, onderlinge duels, scheidsrechterbias, marktbewegingen — en slaan ze op in een point-in-time feature store, zodat training nooit toekomstinformatie lekt.",
  "tr.pipe4Title": "Model-ensemble",
  "tr.pipe4Desc":
    "Vier onafhankelijke modellen stemmen over de uitkomst: een Poisson goals-model, een gradient-boosted classifier, een Elo-baseline en een markt-geïmpliceerde kalibrator. Hun waarschijnlijkheden worden gecombineerd via stacked regression.",
  "tr.pipe5Title": "Value-detectie",
  "tr.pipe5Desc":
    "We vergelijken de ensemble-waarschijnlijkheid met de beste beschikbare marktkoers. Alleen picks met een statistisch significant voordeel — ná commissie en verwachte slippage — krijgen het label 'value'.",
  "tr.pipe6Title": "Publiceren & beoordelen",
  "tr.pipe6Desc":
    "Picks krijgen een tijdstempel op het moment dat ze live gaan. Zodra de wedstrijd is afgelopen worden resultaten automatisch beoordeeld en naar het publieke track-record grootboek geschreven — winst, verlies of push.",

  "tr.methodBadge": "Methodologie",
  "tr.methodTitle": "Vier regels waar we niet vanaf wijken.",
  "tr.methodSubtitle":
    "Elk getal op deze pagina overleeft deze vangrails. Als een resultaat dat niet kan, telt het niet mee.",
  "tr.method1Title": "Alleen point-in-time",
  "tr.method1Desc":
    "Modellen worden getraind op data die daadwerkelijk beschikbaar was bij de aftrap — geen achteraf-inzichten, geen stilletjes opnieuw beoordeelde wedstrijden.",
  "tr.method2Title": "Closing-line gecorrigeerd",
  "tr.method2Desc":
    "ROI-cijfers trekken realistische slippage af tussen publicatie en de closing line, zodat je rendementen ziet die je ook echt had kunnen realiseren.",
  "tr.method3Title": "Niets wordt verwijderd",
  "tr.method3Desc":
    "Verloren picks blijven voor altijd in het grootboek staan. Een track record dat alleen winnaars laat zien is geen track record — dat is marketing.",
  "tr.method4Title": "Extern controleerbaar",
  "tr.method4Desc":
    "Elke pick bevat het wedstrijd-ID, de markt, de koers en de tijdstempel, zodat elke gebruiker of auditor de uitkomst onafhankelijk kan verifiëren.",

  "tr.casesBadge": "Echte gebruikers, echte workflows",
  "tr.casesTitle": "Hoe analisten het track record daadwerkelijk gebruiken.",
  "tr.casesSubtitle":
    "Cijfers tellen alleen als ze beslissingen veranderen. Zo ziet dat er uit voor drie typische BetsPlug-leden.",

  "tr.case1Role": "Voetbal-specialist in het weekend",
  "tr.case1Name": "Luca, 34 · Milaan",
  "tr.case1Quote":
    "Ik filter het track record op Serie A en over/under-markten. In 2025 scoorde die selectie 61% op 412 picks — dus ik verhoog mijn inzet met vertrouwen op zondagochtend in plaats van te twijfelen.",
  "tr.case1Metric1Label": "Zijn gefilterde sample",
  "tr.case1Metric1Value": "412 picks",
  "tr.case1Metric2Label": "Geverifieerde hit rate",
  "tr.case1Metric2Value": "61,2%",
  "tr.case1Metric3Label": "Gemiddelde closing edge",
  "tr.case1Metric3Value": "+4,8%",
  "tr.case1Outcome":
    "Gebruikt het grootboek om één markt te kiezen waar het model een bewezen voorsprong heeft, en negeert de rest. Resultaat: minder weddenschappen, meer overtuiging, betere ROI.",

  "tr.case2Role": "Data-gedreven NBA-fan",
  "tr.case2Name": "Priya, 29 · Londen",
  "tr.case2Quote":
    "Ik geef meer om kalibratie dan om hit rate. Als de Brier-score op de NBA moneyline onder de 0,07 blijft, weet ik dat de kansen eerlijk zijn — niet gewoon geluk.",
  "tr.case2Metric1Label": "NBA Brier-score",
  "tr.case2Metric1Value": "0,068",
  "tr.case2Metric2Label": "Wedstrijden beoordeeld",
  "tr.case2Metric2Value": "1.240",
  "tr.case2Metric3Label": "ROI bij vlakke 1u",
  "tr.case2Metric3Value": "+11,4%",
  "tr.case2Outcome":
    "Vertrouwt de waarschijnlijkheden om haar eigen parlays en spreads te bouwen. Het publieke grootboek is haar bewijs dat de modellen niet zijn afgedwaald.",

  "tr.case3Role": "Fulltime value-bettor",
  "tr.case3Name": "Mikael, 41 · Stockholm",
  "tr.case3Quote":
    "Ik importeer de track-record CSV elke maandag in mijn eigen bankroll-tool. Omdat elke pick een tijdstempel en closing price heeft, kan ik verifiëren of de edge echt is voordat ik ook maar een cent riskeer.",
  "tr.case3Metric1Label": "Picks hergespeeld in 2025",
  "tr.case3Metric1Value": "2.860",
  "tr.case3Metric2Label": "Yield vs. closing line",
  "tr.case3Metric2Value": "+3,1%",
  "tr.case3Metric3Label": "Max drawdown",
  "tr.case3Metric3Value": "−6,4%",
  "tr.case3Outcome":
    "Gebruikt het historische grootboek als een onafhankelijke backtest. Als de closing-line value daar stand houdt, vertrouwt hij het voor live staking.",

  "tr.transBadge": "Controleer het zelf",
  "tr.transTitle": "Vertrouw ons niet op ons woord — lees het grootboek.",
  "tr.transSubtitle":
    "Elke beoordeelde voorspelling die we ooit hebben gepubliceerd is doorzoekbaar op wedstrijd, datum, markt en model. Geen filter dat de verliezers verstopt.",
  "tr.transCta1": "Bekijk live resultaten",
  "tr.transCta2": "Gratis proberen",

  /* How It Works page — dedicated deep-dive */
  "hiw.metaTitle":
    "Hoe BetsPlug werkt — Van ruwe wedstrijddata tot AI-voorspellingen",
  "hiw.metaDesc":
    "Een volledige, stapsgewijze uitleg van de BetsPlug-voorspelengine: hoe we data verzamelen, features bouwen, modellen trainen, value detecteren en picks publiceren die je zelf kunt verifiëren.",
  "hiw.breadcrumbHome": "Home",
  "hiw.breadcrumbHow": "Hoe het werkt",

  "hiw.heroBadge": "De BetsPlug-engine",
  "hiw.heroTitleA": "Hoe we ruwe wedstrijddata",
  "hiw.heroTitleB": "omzetten in voorspellingen die je kunt vertrouwen.",
  "hiw.heroSubtitle":
    "Elke pick op BetsPlug is het eindpunt van een lange, zorgvuldig ontworpen pipeline. Geen onderbuikgevoelens, geen cherry-picking, geen verborgen regels. Dit is het exacte proces — van het moment dat een wedstrijd wordt aangekondigd, tot het moment dat een geverifieerde pick op je dashboard verschijnt.",
  "hiw.heroCtaPrimary": "Bekijk het track record",
  "hiw.heroCtaSecondary": "Gratis proberen",
  "hiw.heroStatDataSources": "Databronnen",
  "hiw.heroStatFeatures": "Features per wedstrijd",
  "hiw.heroStatModels": "Onafhankelijke modellen",
  "hiw.heroStatUpdates": "Ververs-cyclus",

  "hiw.overviewBadge": "De 7-stappen engine",
  "hiw.overviewTitle": "Zeven stappen. Nul gokwerk.",
  "hiw.overviewSubtitle":
    "Elke stap wordt onafhankelijk gebouwd, getest en gemonitord. Als ook maar één stap breekt, wordt de pick tegengehouden — nooit gepubliceerd.",

  "hiw.s1Badge": "Stap 01 · Data-acquisitie",
  "hiw.s1Title": "We beginnen waar de markt begint: bij de ruwe feed.",
  "hiw.s1Lead":
    "Rommel erin, rommel eruit. Onze pipeline begint dus met de hoogste kwaliteit, meest redundante databronnen die we kunnen krijgen — en we vertrouwen er nooit slechts één.",
  "hiw.s1P1":
    "Elke 30 seconden halen we gestructureerde data binnen bij 14 onafhankelijke leveranciers: wedstrijdschema's, live odds van 40+ bookmakers, blessurerapporten, bevestigde opstellingen, scheidsrechteraanstellingen, weer bij het stadion, reisafstand, en historische onderlinge archieven die twee decennia teruggaan.",
  "hiw.s1P2":
    "Elk record krijgt een tijdstempel en versiebeheer. Dat betekent dat we elk moment in de geschiedenis exact kunnen terugspelen zoals onze modellen het zagen — cruciaal voor eerlijke backtesting en essentieel voor audit-waardige controleerbaarheid.",
  "hiw.s1Point1Title": "14 redundante leveranciers",
  "hiw.s1Point1Desc":
    "Als één bron afwijkt van de rest, wordt die in quarantaine gezet tot we begrijpen waarom.",
  "hiw.s1Point2Title": "Ververs elke 30 seconden",
  "hiw.s1Point2Desc":
    "Odds, opstellingen en blessures worden elke halve minuut opnieuw opgehaald tot aan de aftrap.",
  "hiw.s1Point3Title": "Point-in-time opslag",
  "hiw.s1Point3Desc":
    "Niets wordt overschreven. Elke wijziging is een nieuwe regel — geschiedenis is permanent.",

  "hiw.s2Badge": "Stap 02 · Opschonen & normaliseren",
  "hiw.s2Title":
    "Wij dwingen één bron van waarheid af voordat een model ook maar iets ziet.",
  "hiw.s2Lead":
    "Ruwe sportdata staat bekend als rommelig. Teamnamen verschillen per feed, competities hernoemen zichzelf, markten worden midden in een wedstrijd opgeschort. Wij lossen dat allemaal op — op een deterministische, reproduceerbare manier.",
  "hiw.s2P1":
    "Teams, competities, spelers en markttypen worden via een handmatig gecontroleerde lookup-tabel gemapt naar één canoniek schema. Opgeschorte, vernietigde of laat afgelaste markten worden gemarkeerd en uitgesloten vóór welk model dan ook ze aanraakt.",
  "hiw.s2P2":
    "Outlier-detectie vangt slechte data op het moment dat die binnenkomt. Elk record dat een sanity check niet haalt (onmogelijke scores, negatieve tijden, odds buiten het bereik 1,01–1000) wordt uit de pipeline gehaald en gelogd voor handmatige review.",
  "hiw.s2BulletsTitle": "Wat we opschonen",
  "hiw.s2Bullet1": "Team- & competitie-aliassen samengevoegd",
  "hiw.s2Bullet2": "Tijdzones genormaliseerd naar UTC",
  "hiw.s2Bullet3": "Opgeschorte / vernietigde markten verwijderd",
  "hiw.s2Bullet4": "Odds kruiselings gecontroleerd tussen bookmakers",
  "hiw.s2Bullet5": "Ontbrekende waarden expliciet gemarkeerd (nooit stilletjes ingevuld)",

  "hiw.s3Badge": "Stap 03 · Feature engineering",
  "hiw.s3Title": "1.200+ features per wedstrijd — en elke feature verdient zijn plek.",
  "hiw.s3Lead":
    "Een voorspelling is alleen zo scherp als de signalen waar hij op gebouwd is. Hier wordt een wedstrijd een hoogdimensionale vingerafdruk waar onze modellen daadwerkelijk over kunnen redeneren.",
  "hiw.s3P1":
    "Voor elke wedstrijd berekenen we meer dan 1.200 features in zes families: sterkteratings (Elo, Glicko, markt-geïmpliceerd), recente vorm (xG, expected points, momentum), situationele context (rustdagen, reisafstand, hoogte), onderlinge geschiedenis, marktbeweging (lijn-drift, sharp action) en discipline-metrics.",
  "hiw.s3P2":
    "Alle features worden opgeslagen in een point-in-time feature store. Wanneer we een model trainen op de Champions League-finale van vorig seizoen, ziet het alleen wat er bij de aftrap beschikbaar was — geen enkele byte uit de toekomst. Dit is de belangrijkste reden dat de meeste publieke modellen overfitten en de onze niet.",
  "hiw.s3Family1Title": "Sterkte & vorm",
  "hiw.s3Family1Desc": "Elo, Glicko, xG-trends, rolling SRS, expected points.",
  "hiw.s3Family2Title": "Situationele context",
  "hiw.s3Family2Desc": "Rustdagen, reisafstand, hoogte, stadion, weer.",
  "hiw.s3Family3Title": "Onderling",
  "hiw.s3Family3Desc": "Laatste 20 ontmoetingen, thuis/uit splits, stijl-matchups.",
  "hiw.s3Family4Title": "Marktsignalen",
  "hiw.s3Family4Desc": "Open- vs. huidige odds, steam moves, sharp money.",
  "hiw.s3Family5Title": "Opstellingen & beschikbaarheid",
  "hiw.s3Family5Desc": "Bevestigde XI, minuten verloren aan blessures, vermoeidheidsindex.",
  "hiw.s3Family6Title": "Discipline & scheidsrechter",
  "hiw.s3Family6Desc": "Kaarten per 90, strengheid scheidsrechter, historische bias.",

  "hiw.s4Badge": "Stap 04 · Model-ensemble",
  "hiw.s4Title": "Vier onafhankelijke modellen. Eén eerlijke waarschijnlijkheid.",
  "hiw.s4Lead":
    "Een enkel model heeft altijd blinde vlekken. Daarom draaien we vier volledig verschillende benaderingen, elk getraind op dezelfde feature store, en combineren we hun stemmen.",
  "hiw.s4P1":
    "Elk model wordt onafhankelijk getest voordat het in het ensemble mag. Als een nieuw model drie maanden achter elkaar niet beter presteert dan de huidige blend op out-of-sample data, wordt het simpelweg niet uitgerold.",
  "hiw.s4Model1Name": "Poisson Goals Model",
  "hiw.s4Model1Desc":
    "Een doelpunten-gebaseerd probabilistisch model dat verwachte aanvals- en verdedigingsratios per team schat en integreert over alle mogelijke eindstanden.",
  "hiw.s4Model2Name": "Gradient-Boosted Classifier",
  "hiw.s4Model2Desc":
    "Een XGBoost-achtige classifier getraind op de volledige feature store. Sterk in het vangen van niet-lineaire interacties tussen vorm, blessures en marktbeweging.",
  "hiw.s4Model3Name": "Elo + Glicko Baseline",
  "hiw.s4Model3Desc":
    "Een transparant rating-gebaseerd model dat het ensemble verankert en voorkomt dat het te ver afdwaalt van de fundamenten van teamsterkte.",
  "hiw.s4Model4Name": "Markt-geïmpliceerde Kalibrator",
  "hiw.s4Model4Desc":
    "Een metamodel dat leert hoe de scherpste bookmakers wedstrijden prijzen en de andere drie modellen corrigeert wanneer hun waarschijnlijkheden afdwalen van efficiënte prijsvorming.",
  "hiw.s4BlendTitle": "Stacked blending",
  "hiw.s4BlendDesc":
    "De vier waarschijnlijkheden worden gecombineerd via een stacked regressor die is getraind om log-loss te minimaliseren op niet-geziene wedstrijden. De weights worden wekelijks opnieuw berekend zodra nieuwe resultaten binnenkomen.",

  "hiw.s5Badge": "Stap 05 · Value-detectie",
  "hiw.s5Title": "We publiceren alleen picks waarvan de edge de echte wereld overleeft.",
  "hiw.s5Lead":
    "Gelijk hebben is niet genoeg. Een pick wordt pas een pick wanneer onze waarschijnlijkheid de markt verslaat met méér dan de frictie van daadwerkelijk spelen.",
  "hiw.s5P1":
    "Voor elke mogelijke markt vergelijken we onze ensemble-waarschijnlijkheid met de beste beschikbare odds bij 40+ bookmakers, en trekken we vervolgens een realistisch slippage-budget af: commissie, verwachte beweging richting de closing line, en uitvoeringsvertraging. Wat overblijft is de echte edge.",
  "hiw.s5P2":
    "Alleen picks met een statistisch significante positieve expected value overleven. Al het andere wordt verworpen — zelfs als het gewonnen zou hebben. Want een track record gebouwd op geluk stort in op het moment dat het geluk opraakt.",
  "hiw.s5FormulaTitle": "De check die elke pick moet doorstaan",
  "hiw.s5FormulaLine1": "Modelkans × Beste odds",
  "hiw.s5FormulaLine2": "−  verwachte slippage",
  "hiw.s5FormulaLine3": "−  bookmakermarge",
  "hiw.s5FormulaLine4": "=  echte edge",
  "hiw.s5FormulaFoot":
    "Als dit getal niet duidelijk boven nul staat, verlaat de pick nooit het lab.",

  "hiw.s6Badge": "Stap 06 · Publiceren & beoordelen",
  "hiw.s6Title": "Elke pick krijgt een tijdstempel, wordt verzonden en is publiek te controleren.",
  "hiw.s6Lead":
    "Hier worden de meeste voorspelsites vaag. Hier worden wij juist luid.",
  "hiw.s6P1":
    "Op het moment dat een pick wordt gegenereerd, krijgt hij een tijdstempel, wordt hij ondertekend, en gepubliceerd op zowel je dashboard als ons publieke grootboek — exact dezelfde seconde. Jij en een toezichthouder zien exact hetzelfde record.",
  "hiw.s6P2":
    "Zodra de wedstrijd is afgelopen wordt elke pick automatisch beoordeeld aan de hand van de officiële resultaat-feed. Winst, verlies en push worden allemaal vastgelegd. Verloren picks blijven voor altijd in het grootboek staan — want een track record dat alleen winnaars laat zien is geen track record, dat is marketing.",
  "hiw.s6Point1Title": "Publicatie op de seconde",
  "hiw.s6Point1Desc":
    "Abonnees en het publieke grootboek worden gelijktijdig bijgewerkt — geen backdating mogelijk.",
  "hiw.s6Point2Title": "Automatische beoordeling",
  "hiw.s6Point2Desc":
    "Resultaten worden gescoord vanuit de officiële feed, niet door een mens die de andere kant op zou kunnen kijken.",
  "hiw.s6Point3Title": "Niets wordt verwijderd",
  "hiw.s6Point3Desc":
    "Verloren picks zijn permanent. Het grootboek is by design append-only.",

  "hiw.s7Badge": "Stap 07 · Continu hertrainen",
  "hiw.s7Title": "De engine wordt elke zondagavond slimmer.",
  "hiw.s7Lead":
    "Sport verandert. Trainers veranderen. Tactiek verandert. Als je model niet meeverandert, sterft het.",
  "hiw.s7P1":
    "Elke zondagavond, nadat de wedstrijden van de week zijn uitgespeeld, wordt het volledige ensemble opnieuw getraind op de nieuwste data. Modelgewichten worden opnieuw geschat, stacking-coëfficiënten worden bijgewerkt, en de nieuwe versie wordt 48 uur lang shadow-getest tegen de live versie voordat hij het overneemt.",
  "hiw.s7P2":
    "Drift-detectie draait continu op de achtergrond. Als de kalibratie van het model begint af te glijden op een sport of competitie, gaat er een alert af en wordt het ensemble teruggerold naar de laatste bekende goede versie totdat het probleem is begrepen.",
  "hiw.s7Bullet1": "Wekelijkse hertraincyclus",
  "hiw.s7Bullet2": "48-uur shadow test voor go-live",
  "hiw.s7Bullet3": "Continue drift-monitoring",
  "hiw.s7Bullet4": "Automatische rollback bij kalibratiefalen",

  "hiw.proofBadge": "Waarom dit uitmaakt",
  "hiw.proofTitle": "De reden dat onze voorspellingen ook echt overeind blijven.",
  "hiw.proofSubtitle":
    "Elke keuze in deze pipeline bestaat om één reden: om je een waarschijnlijkheid te geven waar je zonder knipperen je bankroll op kunt zetten.",
  "hiw.proof1Title": "Geen hindsight bias",
  "hiw.proof1Desc":
    "Point-in-time feature store. Het model leert nooit van informatie die niet beschikbaar was bij de aftrap.",
  "hiw.proof2Title": "Ensemble, geen éénpitter",
  "hiw.proof2Desc":
    "Vier onafhankelijke modellen controleren elkaar. Eén blinde vlek kan niet de hele voorspelling vergiftigen.",
  "hiw.proof3Title": "Edge overleeft slippage",
  "hiw.proof3Desc":
    "Picks gaan alleen live als de edge standhoudt nadat commissie, marge en closing-line beweging zijn afgetrokken.",
  "hiw.proof4Title": "Permanent publiek grootboek",
  "hiw.proof4Desc":
    "Je kunt elke pick die we ooit hebben gepubliceerd verifiëren. Winst en verlies. Zonder uitzondering.",
  "hiw.proof5Title": "Wekelijks hertraind",
  "hiw.proof5Desc":
    "De engine past zich aan nieuwe tactieken, blessures en marktgedrag aan — met automatische rollback bij drift.",
  "hiw.proof6Title": "Gebouwd door mensen die shippen",
  "hiw.proof6Desc":
    "Een tweekoppig team van sportfanaten met een ICT-achtergrond. Elke regel van deze pipeline is met de hand geschreven, niet in elkaar geklikt uit plugins.",

  "hiw.faqBadge": "Eerlijke antwoorden",
  "hiw.faqTitle": "De vragen die elke serieuze analist ons stelt.",
  "hiw.faqSubtitle":
    "Als je eerder een tipstersite hebt geprobeerd, ben je waarschijnlijk teleurgesteld. Hier is precies waarom BetsPlug anders is.",
  "hiw.faq1Q": "Hoe weet ik dat jullie niet gewoon geluk hebben?",
  "hiw.faq1A":
    "Meer dan 24.000 beoordeelde picks over negen sporten. Geluk middelt uit bij die sample size — skill stapelt zich op. Elke voorspelling heeft een tijdstempel vóór de aftrap, dus je kunt het zelf verifiëren tegen de officiële resultaat-feed.",
  "hiw.faq2Q": "Wat gebeurt er bij een verliesreeks?",
  "hiw.faq2A":
    "Verloren picks blijven permanent in het publieke grootboek. We publiceren ze net zo luid als de winnaars. Als een model begint af te drijven, rolt de automatische drift-detectie het ensemble binnen uren terug naar de laatste bekende goede versie.",
  "hiw.faq3Q": "Waarom niet gewoon één heel slim model gebruiken?",
  "hiw.faq3A":
    "Omdat elk model blinde vlekken heeft — statistische, tactische of situationele. Vier onafhankelijke modellen met verschillende architecturen vangen elkaars fouten op. Het ensemble verslaat consistent zijn sterkste individuele lid.",
  "hiw.faq4Q": "Kan ik deze edges daadwerkelijk uitvoeren bij een bookmaker?",
  "hiw.faq4A":
    "Ja — en we bewijzen het. Elk ROI-cijfer dat we publiceren is gecorrigeerd voor realistische slippage tussen onze publicatietijd en de closing line. De edge die je ziet is de edge die je ook echt kunt spelen.",
  "hiw.faq5Q": "Welke sporten en competities dekken jullie?",
  "hiw.faq5A":
    "Negen sporten en 70+ competities. Voetbal (alle topcompetities in Europa + internationaal), basketbal (NBA, EuroLeague), tennis (ATP, WTA, Grand Slams), plus geselecteerde dekking van honkbal, ijshockey, American football, MMA, rugby en esports.",
  "hiw.faq6Q": "Is dit gokadvies?",
  "hiw.faq6A":
    "Nee. BetsPlug is een pure sport-analytics platform. Wij publiceren waarschijnlijkheden, expected values en een verifieerbaar track record. Wat je met die informatie doet, is volledig jouw eigen beslissing.",

  "hiw.ctaBadge": "Klaar om het in actie te zien?",
  "hiw.ctaTitle": "Stop met gokken. Begin met de pipeline te vertrouwen.",
  "hiw.ctaSubtitle":
    "Je hebt zojuist de meest eerlijke hoe-het-werkt pagina in sport-analytics gelezen. Bekijk nu de picks die hij produceert — live, getijdstempeld, en klaar om te verifiëren.",
  "hiw.ctaPrimary": "Gratis proberen",
  "hiw.ctaSecondary": "Bekijk het track record",

  /* ── Checkout flow ────────────────────────────────────────── */
  "checkout.backToSite": "Terug naar site",
  "checkout.header.usp1Title": "Veilige betalingen",
  "checkout.header.usp1Desc": "256-bit SSL-versleuteling",
  "checkout.header.usp2Title": "Altijd opzegbaar",
  "checkout.header.usp2Desc": "Geen vragen gesteld",
  "checkout.header.usp3Title": "Direct toegang",
  "checkout.header.usp3Desc": "Picks binnen seconden ontgrendeld",

  "checkout.pageTitle": "Rond je abonnement af",
  "checkout.pageSubtitle":
    "Je bent seconden verwijderd van datagedreven picks. Alle plannen hebben een 14-daagse niet-goed-geld-terug garantie.",

  "checkout.step1": "Account",
  "checkout.step2": "Facturatie",
  "checkout.step3": "Betaling",
  "checkout.stepOf": "Stap {current} van {total}",

  "checkout.summaryTitle": "Overzicht",
  "checkout.planLabel": "Pakket",
  "checkout.billingLabel": "Facturatie",
  "checkout.monthly": "Maandelijks",
  "checkout.yearly": "Jaarlijks",
  "checkout.changePlan": "Pakket wijzigen",
  "checkout.subtotal": "Pakket",
  "checkout.addons": "Extra's",
  "checkout.vatIncluded": "Alle prijzen zijn inclusief 21% BTW",
  "checkout.total": "Nu te betalen",
  "checkout.yearlySaveBadge": "Bespaar 20%",
  "checkout.yearlySaveCallout":
    "Schakel over naar jaarlijks en bespaar 20% — dat is {amount} per jaar korting.",
  "checkout.yearlySaving": "Je bespaart {amount} per jaar",

  /* Upsells */
  "checkout.upsellsTitle": "Haal alles uit je abonnement",
  "checkout.upsellsSubtitle":
    "Optionele extra's die de meeste leden toevoegen voor de volledige edge. Elke extra is apart opzegbaar.",
  "checkout.upsell1Title": "VIP Telegram Alerts",
  "checkout.upsell1Desc":
    "Ontvang alle tips direct via Telegram — je hoeft niet in te loggen om op de hoogte te blijven van elke edge.",
  "checkout.upsell1Badge": "Meest gekozen",
  "checkout.upsell2Title": "Wekelijks Strategie-rapport",
  "checkout.upsell2Desc":
    "Elke maandag: een 20-pagina PDF met ROI-analyse, modeldrift en aankomende edges.",
  "checkout.upsell3Title": "Priority 1-op-1 Support",
  "checkout.upsell3Desc":
    "Direct contact met onze analisten — reactie binnen 2 uur, 7 dagen per week.",
  "checkout.upsell4Title": "Tip van de Dag toegang",
  "checkout.upsell4Desc":
    "Elke dag één high-confidence pick in je inbox — onze hoogste-edge weddenschap voor de komende 24 uur.",
  "checkout.upsellIncluded": "Inbegrepen bij Platinum",
  "checkout.upsellPerMonth": "/mnd",

  /* Trial picker */
  "checkout.trialSectionTitle": "Hoe wil je starten?",
  "checkout.trialSectionSubtitle":
    "Probeer BetsPlug risicovrij of sla de proefperiode over voor directe volledige toegang.",
  "checkout.trialOption1Title": "7 dagen gratis proberen",
  "checkout.trialOption1Desc":
    "Volledige toegang 7 dagen lang, €0 vandaag. Eerste afschrijving op {date} als je niet opzegt.",
  "checkout.trialOption1Badge": "Aanbevolen",
  "checkout.trialOption2Title": "Direct abonneren",
  "checkout.trialOption2Desc":
    "Vandaag afgeschreven, geen proefperiode. Ideaal als je ons track record al kent.",
  "checkout.trialPausedNote":
    "Zeg je op tijdens de proefperiode? Dan wordt je account gepauzeerd — niet verwijderd. Je kunt altijd hervatten.",
  "checkout.trialBadge": "7 dagen gratis proberen actief",
  "checkout.trialDueToday": "€0,00 vandaag",
  "checkout.trialFirstCharge": "Eerste afschrijving op {date}",
  "checkout.trialNotAvailable":
    "De gratis proefperiode is alleen beschikbaar bij maandelijkse en jaarlijkse abonnementen.",
  "checkout.trialPaymentNote":
    "Je betaalgegevens zijn nodig om de proefperiode te activeren, maar je wordt vandaag niet afgeschreven. Zeg je op vóór {date}? Dan wordt er niets in rekening gebracht.",
  "checkout.submitTrial": "Start mijn 7 dagen gratis proberen",

  "checkout.freeTrial": "14 dagen gratis proberen",
  "checkout.trialNote":
    "Je wordt vandaag niet afgeschreven. Altijd opzegbaar tijdens de proefperiode.",
  "checkout.couponQuestion": "Heb je een kortingscode?",
  "checkout.couponPlaceholder": "Code invoeren",
  "checkout.couponApply": "Toepassen",
  "checkout.summaryIncluded": "Wat krijg je",
  "checkout.perMonth": "/maand",
  "checkout.perYear": "/jaar",

  "checkout.accountTitle": "Maak je account aan",
  "checkout.accountSubtitle":
    "Je gebruikt deze gegevens om in te loggen bij BetsPlug.",
  "checkout.firstName": "Voornaam",
  "checkout.firstNamePh": "Jan",
  "checkout.lastName": "Achternaam",
  "checkout.lastNamePh": "Jansen",
  "checkout.email": "E-mailadres",
  "checkout.emailPh": "jij@voorbeeld.nl",
  "checkout.password": "Wachtwoord",
  "checkout.passwordPh": "Minstens 8 tekens",
  "checkout.passwordHint": "Minimaal 8 tekens, 1 cijfer.",
  "checkout.confirmPassword": "Bevestig wachtwoord",
  "checkout.alreadyHaveAccount": "Heb je al een account?",
  "checkout.signIn": "Inloggen",

  "checkout.billingTitle": "Factuuradres",
  "checkout.billingSubtitle":
    "Alleen gebruikt voor BTW-berekening en je factuur.",
  "checkout.country": "Land",
  "checkout.countryPh": "Selecteer land",
  "checkout.address": "Straat en huisnummer",
  "checkout.addressPh": "Damstraat 1",
  "checkout.city": "Stad",
  "checkout.cityPh": "Amsterdam",
  "checkout.postalCode": "Postcode",
  "checkout.postalCodePh": "1012 AB",
  "checkout.state": "Provincie (optioneel)",
  "checkout.company": "Bedrijfsnaam (optioneel)",
  "checkout.vatId": "BTW-nummer (optioneel)",

  "checkout.paymentTitle": "Betaalmethode",
  "checkout.paymentSubtitle":
    "Kies hoe je wilt betalen. Een echte betaalprovider wordt binnenkort gekoppeld — dit is een demo-checkout.",
  "checkout.payCard": "Creditcard",
  "checkout.payCardDesc": "Visa, Mastercard, Amex",
  "checkout.payPaypal": "PayPal",
  "checkout.payPaypalDesc": "Betaal met je PayPal-saldo",
  "checkout.cardNumber": "Kaartnummer",
  "checkout.cardNumberPh": "1234 5678 9012 3456",
  "checkout.cardExpiry": "Vervaldatum",
  "checkout.cardExpiryPh": "MM/JJ",
  "checkout.cardCvc": "CVC",
  "checkout.cardCvcPh": "123",
  "checkout.cardName": "Naam op kaart",
  "checkout.cardNamePh": "Jan Jansen",
  "checkout.paypalNote":
    "Je wordt doorgestuurd naar PayPal om de betaling af te ronden.",
  "checkout.demoBadge": "Demo modus",
  "checkout.demoNote":
    "Betalingen worden nog niet verwerkt. We koppelen een echte provider (Stripe / PayPal) vóór de lancering.",

  "checkout.agreeTerms": "Ik ga akkoord met de",
  "checkout.termsLink": "Algemene Voorwaarden",
  "checkout.and": "en het",
  "checkout.privacyLink": "Privacybeleid",
  "checkout.next": "Doorgaan",
  "checkout.back": "Terug",
  "checkout.submit": "Start mijn abonnement",
  "checkout.processing": "Bezig…",

  "checkout.footer.secure": "256-bit SSL versleutelde checkout",
  "checkout.footer.guarantee": "14 dagen niet-goed-geld-terug",
  "checkout.footer.support": "Hulp nodig? support@betsplug.com",
  "checkout.footer.copy": "© {year} BetsPlug. Alle rechten voorbehouden.",

  "checkout.successTitle": "Welkom bij BetsPlug!",
  "checkout.successBody":
    "Je demo-checkout is ontvangen. In productie zou je nu worden doorgestuurd naar je dashboard — verken voor nu de site.",
  "checkout.successCta": "Naar dashboard",
};

/* ── German ────────────────────────────────────────────────── */
const de: Dictionary = {
  "nav.predictions": "Prognosen",
  "nav.howItWorks": "So funktioniert's",
  "nav.trackRecord": "Erfolgsbilanz",
  "nav.pricing": "Preise",
  "nav.contact": "Kontakt",
  "nav.about": "Über uns",
  "nav.login": "Anmelden",
  "nav.startFreeTrial": "Kostenlos testen",
  "nav.menu": "Menü",
  "nav.getStarted": "Jetzt starten",
  "nav.joinBlurb":
    "Schließ dich 1.500+ Analysten an und erhalte noch heute datengetriebene Prognosen.",

  "hero.badge": "Sei den Buchmachern voraus",
  "hero.titleLine1": "Die besten KI-gestützten",
  "hero.titleLine2": "Sport-Prognosen",
  "hero.titleLine3": "für deinen Vorteil.",
  "hero.subtitle":
    "BetsPlug vereint Daten, Elo-Ratings, Poisson-Modelle und maschinelles Lernen auf einer Plattform. Live-Wahrscheinlichkeiten, tiefe Einblicke und nachgewiesene Ergebnisse — für ernsthafte Sportanalysten.",
  "hero.activeUsers": "Aktive Nutzer",
  "hero.ctaPrimary": "Kostenlos testen",
  "hero.ctaSecondary": "So funktioniert's",
  "hero.livePick": "Live-Tipp",
  "hero.hot": "Hot",
  "hero.homeWin": "Heimsieg",
  "hero.draw": "Unentschieden",
  "hero.away": "Auswärts",
  "hero.confidence": "Sicherheit",
  "hero.edge": "Vorteil",
  "hero.joinNow": "Beitreten",
  "hero.winRate": "Trefferquote",
  "hero.today": "Heute",
  "hero.wins": "Siege",

  "lang.label": "Sprache",
  "lang.switch": "Sprache wechseln",

  "comparison.badge": "Warum BetsPlug",
  "comparison.titleA": "Nicht alle Prognose-Seiten",
  "comparison.titleB": "sind gleich gebaut.",
  "comparison.subtitle":
    "Genau das unterscheidet BetsPlug von typischen Tipster-Seiten — kein Kleingedrucktes, keine Rosinenpickerei.",
  "comparison.feature": "Funktion",
  "comparison.winner": "Sieger",
  "comparison.others": "Andere",
  "comparison.typicalTipsters": "Typische Tipster",
  "comparison.finalScore": "Endstand",
  "comparison.fullHouse": "Alles erfüllt",
  "comparison.fallsShort": "Ungenügend",
  "comparison.caption":
    "Vergleich basierend auf öffentlich verfügbaren Informationen führender Tipster-Plattformen (2026).",

  "how.badge": "So funktioniert's",
  "how.title": "Von der Anmeldung zu klügeren Picks in 3 Schritten.",
  "how.subtitle":
    "Ein einfacher, transparenter Workflow rund um Daten — kein Hype, kein Rätselraten.",
  "how.step1Title": "Konto erstellen",
  "how.step1Desc":
    "Kostenlos in Sekunden registrieren. Keine Kreditkarte nötig für unsere täglichen Value-Picks.",
  "how.step2Title": "KI-Prognosen entdecken",
  "how.step2Desc":
    "Vier KI-Modelle kombinieren Live-Quoten, Elo, Form und historische Daten für echte Vorteile.",
  "how.step3Title": "Klügere Entscheidungen treffen",
  "how.step3Desc":
    "Nutze transparente Wahrscheinlichkeiten, Vorteile und Confidence-Scores mit voller Überzeugung.",

  "pricing.badge": "Preise",
  "pricing.title": "Einfache Preise. Echter Vorteil.",
  "pricing.subtitle":
    "Starte kostenlos. Upgrade jederzeit. Jederzeit kündbar.",
  "pricing.monthly": "Monatlich",
  "pricing.yearly": "Jährlich",
  "pricing.save": "20% sparen",
  "pricing.savingNote": "Du sparst 2 Monate",
  "pricing.mostPopular": "Am beliebtesten",
  "pricing.ctaFree": "Kostenlos starten",
  "pricing.ctaUpgrade": "Upgrade",
  "pricing.ctaLifetime": "Lifetime-Zugang",

  "cta.badge": "Bereit, klüger zu gewinnen?",
  "cta.title": "Starte heute deinen datengetriebenen Vorteil.",
  "cta.subtitle":
    "Schließ dich 1.500+ Analysten an, die BetsPlug bereits für schärfere, ruhigere Entscheidungen nutzen.",
  "cta.primary": "Kostenlos testen",
  "cta.secondary": "Prognosen ansehen",

  "footer.premiumBadge": "Premium-Zugang",
  "footer.premiumTitleA": "Tritt unserer",
  "footer.premiumTitleB": "Premium Telegram",
  "footer.premiumTitleC": "Gruppe bei",
  "footer.premiumSubtitle":
    "Erhalte Echtzeit-Picks, Edge-Alerts und Live-Chat mit unseren KI-Analysten. Sei der Erste, der erfährt, wann ein hoch bewerteter Match reinkommt — direkt in deine Tasche.",
  "footer.perk1": "Sofortige Value-Alerts",
  "footer.perk2": "Privates Analysten-Q&A",
  "footer.perk3": "Tägliche kostenlose Picks",
  "footer.perk4": "Exklusive VIP-Analysen",
  "footer.joinCta": "Der Premium-Gruppe beitreten",
  "footer.limited": "Begrenzte Plätze · Nur für Mitglieder",
  "footer.onlineNow": "1.200+ Mitglieder online",
  "footer.brandTagline":
    "BetsPlug vereint Daten, Elo-Ratings, Poisson-Modelle und maschinelles Lernen auf einer Plattform — für ernsthafte Sportanalysten, die nicht raten wollen.",
  "footer.product": "Produkt",
  "footer.company": "Unternehmen",
  "footer.legal": "Rechtliches",
  "footer.secureTitle": "Sichere Zahlungen",
  "footer.secureDesc": "256-Bit-SSL verschlüsselter Checkout",
  "footer.pciCompliant": "PCI DSS konform",
  "footer.copyright":
    "Alle Rechte vorbehalten. BetsPlug ist eine Daten- & Analyseplattform — kein Buchmacher.",
  "footer.responsible": "18+ Spiele verantwortungsvoll",

  "leagues.badge": "Globale Abdeckung",
  "leagues.titleA": "Ligen, die wir",
  "leagues.titleB": "abdecken",

  "trusted.titleA": "Dein",
  "trusted.titleHighlight": "vertrauensvoller",
  "trusted.titleB": "Partner",
  "trusted.titleC": "für Sportanalysen.",
  "trusted.subtitle":
    "BetsPlug vereint ein wachsendes Ökosystem aus Datenquellen, KI-Modellen und bewährten Strategien. Eine Plattform für datengetriebene Sportanalysten, die nicht raten wollen.",
  "trusted.card1Title": "Service für jedes Expertise-Level.",
  "trusted.card1Desc":
    "Vom Einsteiger bis zum Profi — unsere Dashboards, Tutorials und transparenten Statistiken machen jede Prognose leicht verständlich.",
  "trusted.card2Title": "Beste Branchenpraktiken.",
  "trusted.card2Desc":
    "Vier KI-Modelle (Elo, Poisson, Logistic, Ensemble) liefern gemeinsam Prognosen, denen du vertrauen kannst. Bewährte Methoden, transparente Ergebnisse.",
  "trusted.learnMore": "Mehr erfahren",
  "trusted.card3Title": "Geschützt durch Transparenz.",
  "trusted.card3Desc":
    "Jede Prognose wird protokolliert, verfolgt und öffentlich überprüft. Keine verborgenen Ergebnisse, keine Rosinenpickerei — nur Daten, die du selbst prüfen kannst.",

  "track.label": "Erfolgsbilanz",
  "track.accuracy": "Gesamtgenauigkeit",
  "track.thisWeek": "Diese Woche",
  "track.metricPredictions": "Prognosen",
  "track.metricModels": "Modelle",
  "track.metricLeagues": "Ligen",
  "track.badge": "Bewährte Ergebnisse",
  "track.titleA": "Vertrauensvolle",
  "track.titleHighlight": "Plattform",
  "track.titleB": "jederzeit & überall.",
  "track.rating": "4,9 / 5 von 1.200+ Analysten",
  "track.desc1":
    "Eine vereinte Plattform, die ein wachsendes Ökosystem aus Sportdaten, KI-Prognosen und Strategie-Backtesting-Tools bündelt. Alle Prognosen werden protokolliert und öffentlich nachverfolgt — volle Transparenz, immer.",
  "track.desc2":
    "Egal ob Fußball, Basketball oder Tennis — BetsPlug vereint Daten und maschinelles Lernen zu Insights, die du wirklich nutzen kannst.",
  "track.cta": "Mehr erfahren",
  "track.askQuestion": "Frage stellen?",

  "features.badge": "Funktionen",
  "features.titleA": "Alles, was du brauchst, um",
  "features.titleB": "klug zu gewinnen.",
  "features.f1Title": "Echtzeit-Prognosen",
  "features.f1Desc":
    "Live-Wahrscheinlichkeiten, die sich mit der Spielsituation ändern. Verpasse keine Value-Gelegenheit.",
  "features.f2Title": "4 KI-Modelle kombiniert",
  "features.f2Desc":
    "Elo, Poisson, logistische Regression und unser eigenes Ensemble-Modell für maximale Genauigkeit.",
  "features.f3Title": "Strategie-Backtesting",
  "features.f3Desc":
    "Teste deine Strategien anhand historischer Daten. Kenne deinen Vorteil, bevor du setzt.",
  "features.f4Title": "Verifizierte Datenquellen",
  "features.f4Desc":
    "Wir nutzen nur offizielle APIs und verifizierte Datenanbieter. Keine gescrapten oder unzuverlässigen Daten.",
  "features.f5Title": "Bet of the Day",
  "features.f5Desc":
    "Unser Algorithmus wählt täglich die werthaltigste Prognose. Premium-Mitglieder sehen sie zuerst.",
  "features.f6Title": "Wachsende Community",
  "features.f6Desc":
    "Tritt einer Community datengetriebener Sportanalysten bei, die Insights und Strategien teilen.",

  "testimonials.badge": "Stimmen",
  "testimonials.titleA": "Was unsere",
  "testimonials.titleHighlight": "Analysten",
  "testimonials.titleB": "sagen",
  "testimonials.subtitle":
    "Tritt 1.500+ datengetriebenen Bettors bei, die BetsPlug für ihren Vorteil gegenüber den Buchmachern vertrauen.",

  "finalCta.badge": "Bereit zu gewinnen?",
  "finalCta.titleA": "Treffe ab heute",
  "finalCta.titleHighlight": "klügere Picks",
  "finalCta.titleB": ".",
  "finalCta.subtitle":
    "Schließ dich tausenden Sportanalysten an, die BetsPlugs KI-Prognosen nutzen. Kostenlose Testphase — keine Kreditkarte erforderlich.",
  "finalCta.primary": "Kostenlos testen",
  "finalCta.secondary": "Mehr erfahren →",
  "finalCta.moneyBack": "3 Tage Geld-zurück",
  "finalCta.cancelAnytime": "Jederzeit kündbar",
  "finalCta.instantAccess": "Sofortiger Zugang",

  "pricing.bronzeTagline": "Erkunde kostenlos, für immer",
  "pricing.bronzeCta": "Kostenlos starten",
  "pricing.bronzeF1": "1 Bet of the Day (kostenloser Pick)",
  "pricing.bronzeF2": "3 tägliche KI-Prognosen",
  "pricing.bronzeF3": "Zugang zur öffentlichen Erfolgsbilanz",
  "pricing.bronzeF4": "Community-Einblicke",
  "pricing.bronzeF5": "E-Mail-Support",
  "pricing.silverTagline": "Für ernsthafte Analysten",
  "pricing.silverCta": "Silver starten",
  "pricing.silverF1": "Unbegrenzte KI-Prognosen",
  "pricing.silverF2": "Alle 4 KI-Modelle (Ensemble)",
  "pricing.silverF3": "Live-Wahrscheinlichkeits-Tracking",
  "pricing.silverF4": "Strategie-Backtesting",
  "pricing.silverF5": "Prioritärer E-Mail-Support",
  "pricing.goldTagline": "Beliebteste Wahl",
  "pricing.goldCta": "Gold starten",
  "pricing.goldF1": "Alles aus Silver, plus:",
  "pricing.goldF2": "Exklusiver Gold-Telegram-Kanal",
  "pricing.goldF3": "Früher Zugang zu Bet of the Day",
  "pricing.goldF4": "Persönlicher KI-Strategie-Berater",
  "pricing.goldF5": "VIP-Leaderboard & Analysen",
  "pricing.goldF6": "24/7 Prioritätssupport",
  "pricing.perMonth": "/ Monat",
  "pricing.forever": "/ für immer",
  "pricing.billedMonthly": "Monatlich abgerechnet",
  "pricing.billedYearlySilver": "Jährlich €95,90 abgerechnet",
  "pricing.billedYearlyGold": "Jährlich €143,90 abgerechnet",
  "pricing.platTagline": "Einmalzahlung. Lebenslanger Zugang.",
  "pricing.platPitch":
    "Einmal zahlen, deinen Vorteil für immer behalten — jede aktuelle Funktion und jedes zukünftige Upgrade inklusive.",
  "pricing.platBadgeLifetime": "Lifetime-Deal",
  "pricing.platLimited": "Auf 100/Jahr begrenzt",
  "pricing.platOneTime": "Einmalzahlung",
  "pricing.platNoSub": "Kein Abo. Keine Verlängerungen. Niemals.",
  "pricing.platCta": "Lifetime-Zugang sichern",
  "pricing.platF1": "Lebenslanger Zugang zu allen Funktionen",
  "pricing.platF2": "Alle zukünftigen Releases für immer inklusive",
  "pricing.platF3": "Direkter Draht zu unserem Analystenteam",
  "pricing.platF4": "Founder-Tier Leaderboard-Badge",
  "pricing.platF5": "Auf 100 Mitglieder pro Jahr begrenzt",
  "pricing.trust1": "3 Tage Geld-zurück-Garantie",
  "pricing.trust2": "Jederzeit kündbar",
  "pricing.trust3": "Sichere Zahlung über Stripe",

  "seo.badge": "Der smarte Weg, Wetten zu recherchieren",
  "seo.titleA": "KI-Sportprognosen &",
  "seo.titleB": "datengetriebene Wett-Picks",
  "seo.subtitle":
    "BetsPlug ist das datengetriebene Zuhause für KI-Sportprognosen, Machine-Learning-Picks und statistische Match-Analysen. Ob du deinen nächsten Fußball-Kombischein erforschst, Value in NBA-Player-Props suchst oder eine neue Strategie backtestest — unser KI-Predictor liefert den Vorteil, den du brauchst.",
  "seo.pillar1Title": "KI-Sportprognose-Engine",
  "seo.pillar1Desc":
    "Unsere Engine kombiniert Elo-Ratings, Poisson-Tormodelle und maschinelles Lernen, um Spielausgänge in Fußball, Basketball und Tennis datengetrieben zu prognostizieren.",
  "seo.pillar2Title": "Datenbasierte Wett-Prognosen",
  "seo.pillar2Desc":
    "Jede KI-Prognose auf BetsPlug stützt sich auf tausende historische Spiele, Live-Formdaten und xG-Metriken — für die schärfsten Picks online.",
  "seo.pillar3Title": "Verifizierte Erfolgsbilanz",
  "seo.pillar3Desc":
    "Transparenz zuerst. Sieh dir unsere öffentliche Bilanz mit jedem KI-Pick an, den wir je veröffentlicht haben — ROI, Trefferquote und Confidence-Scores protokolliert und zeitgestempelt.",
  "seo.pillar4Title": "Bet of the Day",
  "seo.pillar4Desc":
    "Wenig Zeit? Unser täglicher KI-Bet of the Day hebt den Pick mit der höchsten Confidence aller Ligen hervor — vom Algorithmus ausgewählt, nicht vom Gefühl.",
  "seo.pillar5Title": "Live-KI-Wahrscheinlichkeiten",
  "seo.pillar5Desc":
    "Sieh Wahrscheinlichkeiten in Echtzeit während des Spiels verändern. Unser Live-KI-Predictor berechnet Gewinnwahrscheinlichkeiten jede Sekunde neu.",
  "seo.pillar6Title": "Analyse, kein Glücksspiel",
  "seo.pillar6Desc":
    "BetsPlug ist eine Sportanalyse-Plattform — kein Buchmacher. Wir liefern KI-Prognosen und Dateneinblicke, damit du informiert entscheiden kannst, ohne je auf unserer Seite zu wetten.",

  "faq.badge": "Häufig gestellte Fragen",
  "faq.titleA": "Fragen?",
  "faq.titleB": "Wir haben Antworten",
  "faq.subtitle":
    "Alles, was du über unsere KI-Sportprognose-Plattform wissen musst — von den ersten Schritten bis zu fortgeschrittenen Integrationen.",
  "faq.browseBy": "Nach Kategorie durchsuchen",
  "faq.stillQuestions": "Noch Fragen?",
  "faq.supportBlurb":
    "Findest du nicht die Antwort, die du suchst? Unser Support-Team hilft dir gern.",
  "faq.contactSupport": "Support kontaktieren",
  "faq.articles": "Artikel",
};

/* ── French ────────────────────────────────────────────────── */
const fr: Dictionary = {
  "nav.predictions": "Prédictions",
  "nav.howItWorks": "Comment ça marche",
  "nav.trackRecord": "Historique",
  "nav.pricing": "Tarifs",
  "nav.contact": "Contact",
  "nav.about": "À propos",
  "nav.login": "Connexion",
  "nav.startFreeTrial": "Essai gratuit",
  "nav.menu": "Menu",
  "nav.getStarted": "Commencer",
  "nav.joinBlurb":
    "Rejoignez plus de 1 500 analystes et obtenez des prédictions fondées sur les données dès aujourd'hui.",

  "hero.badge": "Gardez une longueur d'avance sur les bookmakers",
  "hero.titleLine1": "Les meilleures prédictions",
  "hero.titleLine2": "sportives par IA",
  "hero.titleLine3": "à votre avantage.",
  "hero.subtitle":
    "BetsPlug réunit données, classements Elo, modèles de Poisson et machine learning sur une seule plateforme. Probabilités en direct, analyses approfondies, historique prouvé — pensé pour les analystes sportifs exigeants.",
  "hero.activeUsers": "Utilisateurs actifs",
  "hero.ctaPrimary": "Essai gratuit",
  "hero.ctaSecondary": "Comment ça marche",
  "hero.livePick": "Pick en direct",
  "hero.hot": "Hot",
  "hero.homeWin": "Victoire domicile",
  "hero.draw": "Nul",
  "hero.away": "Extérieur",
  "hero.confidence": "Confiance",
  "hero.edge": "Avantage",
  "hero.joinNow": "Rejoindre",
  "hero.winRate": "Taux de réussite",
  "hero.today": "Aujourd'hui",
  "hero.wins": "Victoires",

  "lang.label": "Langue",
  "lang.switch": "Changer de langue",

  "comparison.badge": "Pourquoi BetsPlug",
  "comparison.titleA": "Tous les sites de pronostics",
  "comparison.titleB": "ne se valent pas.",
  "comparison.subtitle":
    "Voici exactement ce qui distingue BetsPlug des sites de tipsters classiques — aucune petite ligne, aucune victoire triée sur le volet.",
  "comparison.feature": "Fonction",
  "comparison.winner": "Gagnant",
  "comparison.others": "Autres",
  "comparison.typicalTipsters": "Tipsters classiques",
  "comparison.finalScore": "Score final",
  "comparison.fullHouse": "Sans-faute",
  "comparison.fallsShort": "Insuffisant",
  "comparison.caption":
    "Comparaison basée sur les informations publiquement disponibles des principales plateformes de tipsters (2026).",

  "how.badge": "Comment ça marche",
  "how.title": "De l'inscription à des picks plus intelligents en 3 étapes.",
  "how.subtitle":
    "Un workflow simple et transparent axé sur les données — ni hype, ni devinettes.",
  "how.step1Title": "Créez votre compte",
  "how.step1Desc":
    "Inscription gratuite en quelques secondes. Aucune carte bancaire requise pour nos picks de valeur quotidiens.",
  "how.step2Title": "Explorez les prédictions IA",
  "how.step2Desc":
    "Quatre modèles d'IA combinent cotes en direct, Elo, forme et historique pour révéler de vrais avantages.",
  "how.step3Title": "Prenez de meilleures décisions",
  "how.step3Desc":
    "Utilisez des probabilités, avantages et scores de confiance transparents pour parier avec conviction.",

  "pricing.badge": "Tarifs",
  "pricing.title": "Tarifs simples. Avantage sérieux.",
  "pricing.subtitle":
    "Commencez gratuitement. Passez payant quand vous voulez. Annulation à tout moment.",
  "pricing.monthly": "Mensuel",
  "pricing.yearly": "Annuel",
  "pricing.save": "Économisez 20%",
  "pricing.savingNote": "Vous économisez 2 mois",
  "pricing.mostPopular": "Le plus populaire",
  "pricing.ctaFree": "Commencer gratuitement",
  "pricing.ctaUpgrade": "Passer payant",
  "pricing.ctaLifetime": "Accès à vie",

  "cta.badge": "Prêt à gagner plus intelligemment ?",
  "cta.title": "Lancez dès aujourd'hui votre avantage fondé sur les données.",
  "cta.subtitle":
    "Rejoignez plus de 1 500 analystes qui utilisent déjà BetsPlug pour des décisions plus nettes et plus sereines.",
  "cta.primary": "Essai gratuit",
  "cta.secondary": "Voir les prédictions",

  "footer.premiumBadge": "Accès premium",
  "footer.premiumTitleA": "Rejoignez notre",
  "footer.premiumTitleB": "groupe Telegram",
  "footer.premiumTitleC": "Premium",
  "footer.premiumSubtitle":
    "Recevez des picks en temps réel, des alertes de valeur et un chat en direct avec nos analystes IA. Soyez le premier informé dès qu'un match à forte valeur arrive — directement dans votre poche.",
  "footer.perk1": "Alertes de valeur instantanées",
  "footer.perk2": "Q&A privé avec les analystes",
  "footer.perk3": "Picks gratuits quotidiens",
  "footer.perk4": "Analyses exclusives VIP",
  "footer.joinCta": "Rejoindre le groupe Premium",
  "footer.limited": "Places limitées · Réservé aux membres",
  "footer.onlineNow": "1 200+ membres en ligne",
  "footer.brandTagline":
    "BetsPlug réunit données, classements Elo, modèles de Poisson et machine learning sur une seule plateforme — pensé pour les analystes sportifs exigeants qui refusent de deviner.",
  "footer.product": "Produit",
  "footer.company": "Société",
  "footer.legal": "Mentions légales",
  "footer.secureTitle": "Paiements sécurisés",
  "footer.secureDesc": "Paiement chiffré SSL 256 bits",
  "footer.pciCompliant": "Conforme PCI DSS",
  "footer.copyright":
    "Tous droits réservés. BetsPlug est une plateforme de données & d'analyses — pas un opérateur de jeu.",
  "footer.responsible": "18+ Jouez de manière responsable",

  "leagues.badge": "Couverture mondiale",
  "leagues.titleA": "Les championnats",
  "leagues.titleB": "que nous couvrons",

  "trusted.titleA": "Votre partenaire",
  "trusted.titleHighlight": "de confiance",
  "trusted.titleB": "",
  "trusted.titleC": "en analyse sportive.",
  "trusted.subtitle":
    "BetsPlug unit et sécurise un écosystème grandissant de sources de données, modèles d'IA et stratégies éprouvées. Une seule plateforme pour les analystes sportifs qui refusent de deviner.",
  "trusted.card1Title": "Un service pour tous les niveaux.",
  "trusted.card1Desc":
    "Du débutant à l'analyste pro — nos tableaux de bord, tutoriels et statistiques transparentes rendent chaque prédiction facile à comprendre.",
  "trusted.card2Title": "Meilleures pratiques du secteur.",
  "trusted.card2Desc":
    "Quatre modèles IA (Elo, Poisson, Logistic, Ensemble) s'associent pour livrer des prédictions fiables. Méthodes éprouvées, résultats transparents.",
  "trusted.learnMore": "En savoir plus",
  "trusted.card3Title": "Protégé par la transparence.",
  "trusted.card3Desc":
    "Chaque prédiction est enregistrée, suivie et vérifiée publiquement. Pas de résultats cachés, pas de tri sélectif — juste des données que vous pouvez auditer.",

  "track.label": "Historique",
  "track.accuracy": "Précision globale",
  "track.thisWeek": "Cette semaine",
  "track.metricPredictions": "Prédictions",
  "track.metricModels": "Modèles",
  "track.metricLeagues": "Ligues",
  "track.badge": "Résultats prouvés",
  "track.titleA": "Plateforme",
  "track.titleHighlight": "fiable",
  "track.titleB": "à tout moment, partout.",
  "track.rating": "4,9 / 5 par 1 200+ analystes",
  "track.desc1":
    "Une plateforme unifiée qui regroupe un écosystème grandissant de données sportives, de prédictions IA et d'outils de backtesting stratégique. Toutes les prédictions sont enregistrées et publiquement suivies — transparence totale, toujours.",
  "track.desc2":
    "Que vous suiviez le football, le basketball ou le tennis, BetsPlug unit données et machine learning en insights réellement exploitables.",
  "track.cta": "En savoir plus",
  "track.askQuestion": "Poser une question ?",

  "features.badge": "Fonctionnalités",
  "features.titleA": "Tout ce qu'il faut pour",
  "features.titleB": "gagner intelligemment.",
  "features.f1Title": "Prédictions en temps réel",
  "features.f1Desc":
    "Mises à jour des probabilités en direct selon l'évolution du match. Ne ratez jamais une opportunité de valeur.",
  "features.f2Title": "4 modèles IA combinés",
  "features.f2Desc":
    "Elo, Poisson, régression logistique et notre propre modèle Ensemble pour une précision maximale.",
  "features.f3Title": "Backtesting de stratégies",
  "features.f3Desc":
    "Testez vos stratégies sur des données historiques. Connaissez votre edge avant de miser.",
  "features.f4Title": "Sources de données vérifiées",
  "features.f4Desc":
    "Nous n'utilisons que des APIs officielles et des fournisseurs vérifiés. Pas de scraping, pas de données douteuses.",
  "features.f5Title": "Bet of the Day",
  "features.f5Desc":
    "Notre algorithme choisit chaque jour la prédiction à plus forte valeur. Les membres Premium la reçoivent en premier.",
  "features.f6Title": "Communauté grandissante",
  "features.f6Desc":
    "Rejoignez une communauté d'analystes sportifs qui partagent insights et stratégies.",

  "testimonials.badge": "Témoignages",
  "testimonials.titleA": "Ce que nos",
  "testimonials.titleHighlight": "analystes",
  "testimonials.titleB": "disent",
  "testimonials.subtitle":
    "Rejoignez 1 500+ parieurs data-driven qui font confiance à BetsPlug pour leur avantage sur les bookmakers.",

  "finalCta.badge": "Prêt à gagner ?",
  "finalCta.titleA": "Commencez à faire",
  "finalCta.titleHighlight": "des picks plus malins",
  "finalCta.titleB": "dès aujourd'hui.",
  "finalCta.subtitle":
    "Rejoignez des milliers d'analystes qui utilisent les prédictions IA de BetsPlug. Essai gratuit — aucune carte requise.",
  "finalCta.primary": "Essai gratuit",
  "finalCta.secondary": "En savoir plus →",
  "finalCta.moneyBack": "Remboursé 3 jours",
  "finalCta.cancelAnytime": "Annulation à tout moment",
  "finalCta.instantAccess": "Accès immédiat",

  "pricing.bronzeTagline": "Explorez gratuitement, à vie",
  "pricing.bronzeCta": "Commencer gratuitement",
  "pricing.bronzeF1": "1 Bet of the Day (pick gratuit)",
  "pricing.bronzeF2": "3 prédictions IA par jour",
  "pricing.bronzeF3": "Accès à l'historique public",
  "pricing.bronzeF4": "Insights de la communauté",
  "pricing.bronzeF5": "Support par e-mail",
  "pricing.silverTagline": "Pour les analystes sérieux",
  "pricing.silverCta": "Démarrer Silver",
  "pricing.silverF1": "Prédictions IA illimitées",
  "pricing.silverF2": "Les 4 modèles IA (Ensemble)",
  "pricing.silverF3": "Suivi des probabilités en direct",
  "pricing.silverF4": "Backtesting de stratégies",
  "pricing.silverF5": "Support e-mail prioritaire",
  "pricing.goldTagline": "Le choix le plus populaire",
  "pricing.goldCta": "Démarrer Gold",
  "pricing.goldF1": "Tout Silver, plus :",
  "pricing.goldF2": "Canal Telegram Gold exclusif",
  "pricing.goldF3": "Accès anticipé au Bet of the Day",
  "pricing.goldF4": "Conseiller stratégie IA personnel",
  "pricing.goldF5": "Classement VIP & analytics",
  "pricing.goldF6": "Support prioritaire 24/7",
  "pricing.perMonth": "/ mois",
  "pricing.forever": "/ à vie",
  "pricing.billedMonthly": "Facturé mensuellement",
  "pricing.billedYearlySilver": "Facturé 95,90 €/an",
  "pricing.billedYearlyGold": "Facturé 143,90 €/an",
  "pricing.platTagline": "Paiement unique. Accès à vie.",
  "pricing.platPitch":
    "Payez une fois, gardez votre avantage pour toujours — chaque fonctionnalité actuelle et chaque future mise à jour inclue.",
  "pricing.platBadgeLifetime": "Offre à vie",
  "pricing.platLimited": "Limité à 100/an",
  "pricing.platOneTime": "Paiement unique",
  "pricing.platNoSub": "Pas d'abonnement. Pas de renouvellement. Jamais.",
  "pricing.platCta": "Obtenir l'accès à vie",
  "pricing.platF1": "Accès à vie à toutes les fonctionnalités",
  "pricing.platF2": "Toutes les futures versions incluses à jamais",
  "pricing.platF3": "Ligne directe avec notre équipe d'analystes",
  "pricing.platF4": "Badge de classement tier Fondateur",
  "pricing.platF5": "Limité à 100 membres par an",
  "pricing.trust1": "Garantie remboursé 3 jours",
  "pricing.trust2": "Annulation à tout moment",
  "pricing.trust3": "Paiement sécurisé par Stripe",

  "seo.badge": "La façon intelligente de rechercher vos paris",
  "seo.titleA": "Prédictions sportives IA &",
  "seo.titleB": "picks basés sur la data",
  "seo.subtitle":
    "BetsPlug est la maison data-driven des prédictions sportives IA, des picks issus du machine learning et des projections statistiques. Que vous prépariez un combiné foot, cherchiez de la valeur sur les props NBA ou testiez une nouvelle stratégie — notre prédicteur IA vous donne l'avantage nécessaire.",
  "seo.pillar1Title": "Moteur de prédictions sportives IA",
  "seo.pillar1Desc":
    "Notre moteur combine classements Elo, modèles de Poisson et machine learning pour prédire les résultats en football, basketball et tennis avec une précision data-driven.",
  "seo.pillar2Title": "Prédictions étayées par les données",
  "seo.pillar2Desc":
    "Chaque prédiction BetsPlug repose sur des milliers de matchs historiques, la forme en direct et les xG — pour les picks les plus aiguisés en ligne.",
  "seo.pillar3Title": "Historique vérifié",
  "seo.pillar3Desc":
    "La transparence avant tout. Explorez notre historique public : chaque pick IA publié avec ROI, hit-rate et confidence enregistrés et horodatés.",
  "seo.pillar4Title": "Bet of the Day",
  "seo.pillar4Desc":
    "Peu de temps ? Notre Bet of the Day IA quotidien met en avant le pick à plus haute confiance toutes ligues confondues — choisi par l'algorithme, pas par le feeling.",
  "seo.pillar5Title": "Probabilités IA en direct",
  "seo.pillar5Desc":
    "Regardez les probabilités évoluer en temps réel pendant les matchs. Notre prédicteur IA en direct recalcule les chances chaque seconde.",
  "seo.pillar6Title": "Analytique, pas de jeu",
  "seo.pillar6Desc":
    "BetsPlug est une plateforme d'analyse sportive — pas un bookmaker. Nous livrons prédictions IA et insights data pour que vous décidiez en connaissance, sans jamais parier chez nous.",

  "faq.badge": "Questions fréquentes",
  "faq.titleA": "Des questions ?",
  "faq.titleB": "Nous avons les réponses",
  "faq.subtitle":
    "Tout ce que vous devez savoir sur notre plateforme de prédictions sportives IA, des premiers pas aux intégrations avancées.",
  "faq.browseBy": "Parcourir par catégorie",
  "faq.stillQuestions": "Encore des questions ?",
  "faq.supportBlurb":
    "Vous ne trouvez pas la réponse ? Notre équipe support est là pour vous aider.",
  "faq.contactSupport": "Contacter le support",
  "faq.articles": "articles",
};

/* ── Spanish ───────────────────────────────────────────────── */
const es: Dictionary = {
  "nav.predictions": "Predicciones",
  "nav.howItWorks": "Cómo funciona",
  "nav.trackRecord": "Historial",
  "nav.pricing": "Precios",
  "nav.contact": "Contacto",
  "nav.about": "Nosotros",
  "nav.login": "Entrar",
  "nav.startFreeTrial": "Prueba gratis",
  "nav.menu": "Menú",
  "nav.getStarted": "Empezar",
  "nav.joinBlurb":
    "Únete a más de 1.500 analistas y obtén predicciones basadas en datos hoy mismo.",

  "hero.badge": "Adelántate a las casas de apuestas",
  "hero.titleLine1": "Las mejores predicciones",
  "hero.titleLine2": "deportivas con IA",
  "hero.titleLine3": "para tu ventaja.",
  "hero.subtitle":
    "BetsPlug combina datos, Elo, modelos de Poisson y machine learning en una sola plataforma. Probabilidades en vivo, análisis profundos y un historial comprobado — creado para analistas deportivos serios.",
  "hero.activeUsers": "Usuarios activos",
  "hero.ctaPrimary": "Prueba gratis",
  "hero.ctaSecondary": "Cómo funciona",
  "hero.livePick": "Pick en vivo",
  "hero.hot": "Hot",
  "hero.homeWin": "Victoria local",
  "hero.draw": "Empate",
  "hero.away": "Visitante",
  "hero.confidence": "Confianza",
  "hero.edge": "Ventaja",
  "hero.joinNow": "Unirse",
  "hero.winRate": "% Aciertos",
  "hero.today": "Hoy",
  "hero.wins": "Victorias",

  "lang.label": "Idioma",
  "lang.switch": "Cambiar idioma",

  "comparison.badge": "Por qué BetsPlug",
  "comparison.titleA": "No todas las webs de predicciones",
  "comparison.titleB": "están hechas igual.",
  "comparison.subtitle":
    "Esto es exactamente lo que separa a BetsPlug de los típicos sitios de tipsters — sin letra pequeña, sin victorias cuidadosamente seleccionadas.",
  "comparison.feature": "Función",
  "comparison.winner": "Ganador",
  "comparison.others": "Otros",
  "comparison.typicalTipsters": "Tipsters típicos",
  "comparison.finalScore": "Puntuación final",
  "comparison.fullHouse": "Pleno",
  "comparison.fallsShort": "Se queda corto",
  "comparison.caption":
    "Comparación basada en información pública de las principales plataformas de tipsters (2026).",

  "how.badge": "Cómo funciona",
  "how.title": "Del registro a picks más inteligentes en 3 pasos.",
  "how.subtitle":
    "Un flujo simple y transparente alrededor de los datos — sin hype, sin adivinanzas.",
  "how.step1Title": "Crea tu cuenta",
  "how.step1Desc":
    "Regístrate gratis en segundos. No se necesita tarjeta para explorar nuestros picks diarios.",
  "how.step2Title": "Explora predicciones IA",
  "how.step2Desc":
    "Cuatro modelos de IA combinan cuotas en vivo, Elo, forma e historial para revelar ventajas reales.",
  "how.step3Title": "Toma decisiones más inteligentes",
  "how.step3Desc":
    "Usa probabilidades, ventajas y niveles de confianza transparentes para apostar con convicción.",

  "pricing.badge": "Precios",
  "pricing.title": "Precios simples. Ventaja seria.",
  "pricing.subtitle":
    "Empieza gratis. Actualiza cuando quieras. Cancela cuando quieras.",
  "pricing.monthly": "Mensual",
  "pricing.yearly": "Anual",
  "pricing.save": "Ahorra 20%",
  "pricing.savingNote": "Ahorras 2 meses",
  "pricing.mostPopular": "Más popular",
  "pricing.ctaFree": "Empieza gratis",
  "pricing.ctaUpgrade": "Actualizar",
  "pricing.ctaLifetime": "Acceso de por vida",

  "cta.badge": "¿Listo para ganar más inteligente?",
  "cta.title": "Empieza hoy tu ventaja basada en datos.",
  "cta.subtitle":
    "Únete a más de 1.500 analistas que ya usan BetsPlug para decisiones más nítidas y tranquilas.",
  "cta.primary": "Prueba gratis",
  "cta.secondary": "Ver predicciones",

  "footer.premiumBadge": "Acceso premium",
  "footer.premiumTitleA": "Únete a nuestro",
  "footer.premiumTitleB": "grupo Telegram",
  "footer.premiumTitleC": "Premium",
  "footer.premiumSubtitle":
    "Obtén picks en tiempo real, alertas de valor y chat en vivo con nuestros analistas IA. Sé el primero en saberlo cuando aparezca un partido de alto valor — directamente en tu bolsillo.",
  "footer.perk1": "Alertas de valor instantáneas",
  "footer.perk2": "Q&A privado con analistas",
  "footer.perk3": "Picks gratis diarios",
  "footer.perk4": "Análisis exclusivos VIP",
  "footer.joinCta": "Unirse al grupo Premium",
  "footer.limited": "Plazas limitadas · Solo miembros",
  "footer.onlineNow": "1.200+ miembros en línea",
  "footer.brandTagline":
    "BetsPlug combina datos, ratings Elo, modelos de Poisson y machine learning en una sola plataforma — creado para analistas deportivos serios que no quieren adivinar.",
  "footer.product": "Producto",
  "footer.company": "Empresa",
  "footer.legal": "Legal",
  "footer.secureTitle": "Pagos seguros",
  "footer.secureDesc": "Pago cifrado SSL 256 bits",
  "footer.pciCompliant": "Conforme PCI DSS",
  "footer.copyright":
    "Todos los derechos reservados. BetsPlug es una plataforma de datos y análisis — no un operador de apuestas.",
  "footer.responsible": "18+ Juega con responsabilidad",

  "leagues.badge": "Cobertura global",
  "leagues.titleA": "Ligas que",
  "leagues.titleB": "cubrimos",

  "trusted.titleA": "Tu socio",
  "trusted.titleHighlight": "de confianza",
  "trusted.titleB": "",
  "trusted.titleC": "en analítica deportiva.",
  "trusted.subtitle":
    "BetsPlug une y asegura un ecosistema creciente de fuentes de datos, modelos de IA y estrategias probadas. Una sola plataforma para analistas deportivos que no quieren adivinar.",
  "trusted.card1Title": "Servicio para cualquier nivel.",
  "trusted.card1Desc":
    "Del principiante al analista profesional — nuestros paneles, tutoriales y estadísticas transparentes hacen fácil entender cada predicción.",
  "trusted.card2Title": "Mejores prácticas del sector.",
  "trusted.card2Desc":
    "Cuatro modelos de IA (Elo, Poisson, Logistic, Ensemble) se combinan para ofrecer predicciones en las que puedes confiar. Métodos probados, resultados transparentes.",
  "trusted.learnMore": "Más información",
  "trusted.card3Title": "Protegido por transparencia.",
  "trusted.card3Desc":
    "Cada predicción es registrada, seguida y verificada públicamente. Sin resultados ocultos, sin selección — solo datos que puedes auditar tú mismo.",

  "track.label": "Historial",
  "track.accuracy": "Precisión global",
  "track.thisWeek": "Esta semana",
  "track.metricPredictions": "Predicciones",
  "track.metricModels": "Modelos",
  "track.metricLeagues": "Ligas",
  "track.badge": "Resultados comprobados",
  "track.titleA": "Plataforma",
  "track.titleHighlight": "fiable",
  "track.titleB": "siempre y en cualquier lugar.",
  "track.rating": "4,9 / 5 de 1.200+ analistas",
  "track.desc1":
    "Una plataforma unificada que asegura un ecosistema creciente de datos deportivos, predicciones IA y herramientas de backtesting. Todas las predicciones quedan registradas y públicamente rastreables — transparencia total, siempre.",
  "track.desc2":
    "Ya sigas fútbol, baloncesto o tenis, BetsPlug une datos y machine learning en insights que realmente puedes usar.",
  "track.cta": "Más información",
  "track.askQuestion": "¿Hacer una pregunta?",

  "features.badge": "Funciones",
  "features.titleA": "Todo lo que necesitas para",
  "features.titleB": "ganar inteligentemente.",
  "features.f1Title": "Predicciones en tiempo real",
  "features.f1Desc":
    "Actualizaciones de probabilidad en vivo según cambia el partido. No pierdas oportunidades de valor.",
  "features.f2Title": "4 modelos IA combinados",
  "features.f2Desc":
    "Elo, Poisson, regresión logística y nuestro propio modelo Ensemble para máxima precisión.",
  "features.f3Title": "Backtesting de estrategias",
  "features.f3Desc":
    "Prueba tus estrategias con datos históricos. Conoce tu ventaja antes de apostar.",
  "features.f4Title": "Fuentes de datos verificadas",
  "features.f4Desc":
    "Solo usamos APIs oficiales y proveedores verificados. Sin scraping ni datos dudosos.",
  "features.f5Title": "Bet of the Day",
  "features.f5Desc":
    "Nuestro algoritmo elige cada día la predicción de mayor valor. Los miembros Premium la reciben primero.",
  "features.f6Title": "Comunidad creciente",
  "features.f6Desc":
    "Únete a una comunidad de analistas deportivos que comparten insights y estrategias.",

  "testimonials.badge": "Testimonios",
  "testimonials.titleA": "Qué dicen nuestros",
  "testimonials.titleHighlight": "analistas",
  "testimonials.titleB": "",
  "testimonials.subtitle":
    "Únete a 1.500+ apostadores data-driven que confían en BetsPlug para tener ventaja sobre las casas.",

  "finalCta.badge": "¿Listo para ganar?",
  "finalCta.titleA": "Empieza a hacer",
  "finalCta.titleHighlight": "picks más inteligentes",
  "finalCta.titleB": "hoy.",
  "finalCta.subtitle":
    "Únete a miles de analistas que usan las predicciones IA de BetsPlug. Prueba gratis — sin tarjeta.",
  "finalCta.primary": "Prueba gratis",
  "finalCta.secondary": "Más información →",
  "finalCta.moneyBack": "3 días garantía devolución",
  "finalCta.cancelAnytime": "Cancela cuando quieras",
  "finalCta.instantAccess": "Acceso inmediato",

  "pricing.bronzeTagline": "Explora gratis, para siempre",
  "pricing.bronzeCta": "Empezar gratis",
  "pricing.bronzeF1": "1 Bet of the Day (pick gratis)",
  "pricing.bronzeF2": "3 predicciones IA diarias",
  "pricing.bronzeF3": "Acceso al historial público",
  "pricing.bronzeF4": "Insights de la comunidad",
  "pricing.bronzeF5": "Soporte por email",
  "pricing.silverTagline": "Para analistas serios",
  "pricing.silverCta": "Empezar Silver",
  "pricing.silverF1": "Predicciones IA ilimitadas",
  "pricing.silverF2": "Los 4 modelos IA (Ensemble)",
  "pricing.silverF3": "Seguimiento de probabilidades en vivo",
  "pricing.silverF4": "Backtesting de estrategias",
  "pricing.silverF5": "Soporte email prioritario",
  "pricing.goldTagline": "La opción más popular",
  "pricing.goldCta": "Empezar Gold",
  "pricing.goldF1": "Todo Silver, además:",
  "pricing.goldF2": "Canal Telegram Gold exclusivo",
  "pricing.goldF3": "Acceso anticipado al Bet of the Day",
  "pricing.goldF4": "Asesor de estrategia IA personal",
  "pricing.goldF5": "Leaderboard VIP & analíticas",
  "pricing.goldF6": "Soporte prioritario 24/7",
  "pricing.perMonth": "/ mes",
  "pricing.forever": "/ para siempre",
  "pricing.billedMonthly": "Facturado mensualmente",
  "pricing.billedYearlySilver": "Facturado 95,90 €/año",
  "pricing.billedYearlyGold": "Facturado 143,90 €/año",
  "pricing.platTagline": "Pago único. Acceso de por vida.",
  "pricing.platPitch":
    "Paga una vez, conserva tu ventaja para siempre — cada función actual y cada futura actualización incluidas.",
  "pricing.platBadgeLifetime": "Oferta de por vida",
  "pricing.platLimited": "Limitado a 100/año",
  "pricing.platOneTime": "Pago único",
  "pricing.platNoSub": "Sin suscripción. Sin renovaciones. Nunca.",
  "pricing.platCta": "Obtener acceso de por vida",
  "pricing.platF1": "Acceso de por vida a cada función",
  "pricing.platF2": "Todas las futuras versiones incluidas para siempre",
  "pricing.platF3": "Línea directa con nuestro equipo de analistas",
  "pricing.platF4": "Insignia de leaderboard tier Fundador",
  "pricing.platF5": "Limitado a 100 miembros por año",
  "pricing.trust1": "Garantía de devolución 3 días",
  "pricing.trust2": "Cancela cuando quieras",
  "pricing.trust3": "Pago seguro con Stripe",

  "seo.badge": "La forma inteligente de investigar apuestas",
  "seo.titleA": "Predicciones deportivas IA &",
  "seo.titleB": "picks basados en datos",
  "seo.subtitle":
    "BetsPlug es la casa data-driven de las predicciones deportivas IA, picks de machine learning y proyecciones estadísticas. Ya investigues una combinada de fútbol, busques valor en props de NBA o testees una estrategia — nuestro predictor IA te da la ventaja que necesitas.",
  "seo.pillar1Title": "Motor de predicción deportiva IA",
  "seo.pillar1Desc":
    "Nuestro motor combina ratings Elo, modelos de Poisson y machine learning para predecir resultados en fútbol, baloncesto y tenis con precisión basada en datos.",
  "seo.pillar2Title": "Predicciones respaldadas por datos",
  "seo.pillar2Desc":
    "Cada predicción de BetsPlug se apoya en miles de partidos históricos, datos de forma en vivo y xG — para los picks más afilados online.",
  "seo.pillar3Title": "Historial verificado",
  "seo.pillar3Desc":
    "Transparencia primero. Explora nuestro historial público con cada pick IA publicado — ROI, hit-rate y confianza registrados y con timestamp.",
  "seo.pillar4Title": "Bet of the Day",
  "seo.pillar4Desc":
    "¿Poco tiempo? Nuestro Bet of the Day IA diario destaca el pick de mayor confianza entre todas las ligas — elegido por el algoritmo, no por instinto.",
  "seo.pillar5Title": "Probabilidades IA en vivo",
  "seo.pillar5Desc":
    "Observa las probabilidades cambiar en tiempo real durante los partidos. Nuestro predictor IA recalcula las probabilidades cada segundo.",
  "seo.pillar6Title": "Analítica, no apuestas",
  "seo.pillar6Desc":
    "BetsPlug es una plataforma de analítica deportiva — no una casa de apuestas. Entregamos predicciones IA e insights para que decidas informado, sin apostar nunca en nuestro sitio.",

  "faq.badge": "Preguntas frecuentes",
  "faq.titleA": "¿Preguntas?",
  "faq.titleB": "Tenemos respuestas",
  "faq.subtitle":
    "Todo lo que necesitas saber sobre nuestra plataforma de predicciones deportivas IA, desde los primeros pasos hasta las integraciones avanzadas.",
  "faq.browseBy": "Explorar por categoría",
  "faq.stillQuestions": "¿Aún tienes dudas?",
  "faq.supportBlurb":
    "¿No encuentras la respuesta? Nuestro equipo de soporte está aquí para ayudarte.",
  "faq.contactSupport": "Contactar soporte",
  "faq.articles": "artículos",
};

/* ── Italian ───────────────────────────────────────────────── */
const it: Dictionary = {
  "nav.predictions": "Pronostici",
  "nav.howItWorks": "Come funziona",
  "nav.trackRecord": "Storico",
  "nav.pricing": "Prezzi",
  "nav.contact": "Contatti",
  "nav.about": "Chi siamo",
  "nav.login": "Accedi",
  "nav.startFreeTrial": "Prova gratis",
  "nav.menu": "Menu",
  "nav.getStarted": "Inizia",
  "nav.joinBlurb":
    "Unisciti a oltre 1.500 analisti e ottieni pronostici basati sui dati oggi stesso.",

  "hero.badge": "Anticipa i bookmaker",
  "hero.titleLine1": "I migliori pronostici",
  "hero.titleLine2": "sportivi con AI",
  "hero.titleLine3": "per il tuo vantaggio.",
  "hero.subtitle":
    "BetsPlug combina dati, Elo, modelli di Poisson e machine learning in un'unica piattaforma. Probabilità live, analisi approfondite e uno storico comprovato — pensato per analisti sportivi seri.",
  "hero.activeUsers": "Utenti attivi",
  "hero.ctaPrimary": "Prova gratis",
  "hero.ctaSecondary": "Come funziona",
  "hero.livePick": "Pick live",
  "hero.hot": "Hot",
  "hero.homeWin": "Vittoria casa",
  "hero.draw": "Pareggio",
  "hero.away": "Trasferta",
  "hero.confidence": "Sicurezza",
  "hero.edge": "Vantaggio",
  "hero.joinNow": "Iscriviti",
  "hero.winRate": "% Vittorie",
  "hero.today": "Oggi",
  "hero.wins": "Vittorie",

  "lang.label": "Lingua",
  "lang.switch": "Cambia lingua",

  "comparison.badge": "Perché BetsPlug",
  "comparison.titleA": "Non tutti i siti di pronostici",
  "comparison.titleB": "sono uguali.",
  "comparison.subtitle":
    "Ecco esattamente cosa distingue BetsPlug dai tipici siti di tipster — nessuna riga in piccolo, nessuna vittoria scelta a caso.",
  "comparison.feature": "Funzione",
  "comparison.winner": "Vincitore",
  "comparison.others": "Altri",
  "comparison.typicalTipsters": "Tipster tipici",
  "comparison.finalScore": "Punteggio finale",
  "comparison.fullHouse": "Pieno",
  "comparison.fallsShort": "Insufficiente",
  "comparison.caption":
    "Confronto basato su informazioni pubbliche delle principali piattaforme di tipster (2026).",

  "how.badge": "Come funziona",
  "how.title": "Dall'iscrizione a pick più intelligenti in 3 passi.",
  "how.subtitle":
    "Un flusso semplice e trasparente attorno ai dati — niente hype, niente congetture.",
  "how.step1Title": "Crea il tuo account",
  "how.step1Desc":
    "Iscriviti gratis in pochi secondi. Nessuna carta richiesta per esplorare i nostri value pick quotidiani.",
  "how.step2Title": "Esplora i pronostici IA",
  "how.step2Desc":
    "Quattro modelli IA combinano quote live, Elo, forma e storico per rivelare veri vantaggi.",
  "how.step3Title": "Prendi decisioni più intelligenti",
  "how.step3Desc":
    "Usa probabilità, vantaggi e punteggi di confidenza trasparenti per scommettere con convinzione.",

  "pricing.badge": "Prezzi",
  "pricing.title": "Prezzi semplici. Vantaggio serio.",
  "pricing.subtitle":
    "Inizia gratis. Passa a pagamento quando vuoi. Cancella in qualsiasi momento.",
  "pricing.monthly": "Mensile",
  "pricing.yearly": "Annuale",
  "pricing.save": "Risparmi il 20%",
  "pricing.savingNote": "Stai risparmiando 2 mesi",
  "pricing.mostPopular": "Più popolare",
  "pricing.ctaFree": "Inizia gratis",
  "pricing.ctaUpgrade": "Aggiorna",
  "pricing.ctaLifetime": "Accesso a vita",

  "cta.badge": "Pronto a vincere in modo più intelligente?",
  "cta.title": "Inizia oggi il tuo vantaggio basato sui dati.",
  "cta.subtitle":
    "Unisciti a oltre 1.500 analisti che usano già BetsPlug per decisioni più nitide e tranquille.",
  "cta.primary": "Prova gratuita",
  "cta.secondary": "Vedi pronostici",

  "footer.premiumBadge": "Accesso premium",
  "footer.premiumTitleA": "Unisciti al nostro",
  "footer.premiumTitleB": "gruppo Telegram",
  "footer.premiumTitleC": "Premium",
  "footer.premiumSubtitle":
    "Ricevi pick in tempo reale, avvisi di valore e chat live con i nostri analisti IA. Sii il primo a sapere quando arriva una partita ad alto valore — direttamente in tasca.",
  "footer.perk1": "Avvisi di valore istantanei",
  "footer.perk2": "Q&A privato con gli analisti",
  "footer.perk3": "Pick gratuiti quotidiani",
  "footer.perk4": "Analisi esclusive VIP",
  "footer.joinCta": "Entra nel gruppo Premium",
  "footer.limited": "Posti limitati · Solo membri",
  "footer.onlineNow": "1.200+ membri online",
  "footer.brandTagline":
    "BetsPlug combina dati, rating Elo, modelli di Poisson e machine learning in un'unica piattaforma — pensato per analisti sportivi seri che non vogliono tirare a indovinare.",
  "footer.product": "Prodotto",
  "footer.company": "Azienda",
  "footer.legal": "Legale",
  "footer.secureTitle": "Pagamenti sicuri",
  "footer.secureDesc": "Checkout cifrato SSL 256 bit",
  "footer.pciCompliant": "Conforme PCI DSS",
  "footer.copyright":
    "Tutti i diritti riservati. BetsPlug è una piattaforma di dati e analisi — non un operatore di scommesse.",
  "footer.responsible": "18+ Gioca responsabilmente",

  "leagues.badge": "Copertura globale",
  "leagues.titleA": "Campionati che",
  "leagues.titleB": "copriamo",

  "trusted.titleA": "Il tuo partner",
  "trusted.titleHighlight": "di fiducia",
  "trusted.titleB": "",
  "trusted.titleC": "nell'analisi sportiva.",
  "trusted.subtitle":
    "BetsPlug unisce e protegge un ecosistema in crescita di fonti dati, modelli IA e strategie collaudate. Un'unica piattaforma per analisti sportivi data-driven che rifiutano di tirare a indovinare.",
  "trusted.card1Title": "Servizio per ogni livello di esperienza.",
  "trusted.card1Desc":
    "Dal principiante all'analista pro — le nostre dashboard, tutorial e statistiche trasparenti rendono facile capire ogni previsione.",
  "trusted.card2Title": "Migliori pratiche del settore.",
  "trusted.card2Desc":
    "Quattro modelli IA (Elo, Poisson, Logistic, Ensemble) si combinano per fornire previsioni affidabili. Metodi collaudati, risultati trasparenti.",
  "trusted.learnMore": "Scopri di più",
  "trusted.card3Title": "Protetto dalla trasparenza.",
  "trusted.card3Desc":
    "Ogni previsione viene registrata, tracciata e verificata pubblicamente. Nessun risultato nascosto, nessuna selezione — solo dati che puoi verificare tu stesso.",

  "track.label": "Storico",
  "track.accuracy": "Precisione complessiva",
  "track.thisWeek": "Questa settimana",
  "track.metricPredictions": "Previsioni",
  "track.metricModels": "Modelli",
  "track.metricLeagues": "Campionati",
  "track.badge": "Risultati comprovati",
  "track.titleA": "Piattaforma",
  "track.titleHighlight": "affidabile",
  "track.titleB": "sempre e ovunque.",
  "track.rating": "4,9 / 5 da 1.200+ analisti",
  "track.desc1":
    "Una piattaforma unificata che riunisce un ecosistema in crescita di dati sportivi, previsioni IA e strumenti di backtesting strategico. Tutte le previsioni sono registrate e tracciate pubblicamente — trasparenza totale, sempre.",
  "track.desc2":
    "Che tu segua calcio, basket o tennis, BetsPlug unisce dati e machine learning in insight davvero utili.",
  "track.cta": "Scopri di più",
  "track.askQuestion": "Fare una domanda?",

  "features.badge": "Funzionalità",
  "features.titleA": "Tutto ciò che serve per",
  "features.titleB": "vincere con intelligenza.",
  "features.f1Title": "Previsioni in tempo reale",
  "features.f1Desc":
    "Aggiornamenti di probabilità live man mano che la partita cambia. Non perdere più un'occasione di valore.",
  "features.f2Title": "4 modelli IA combinati",
  "features.f2Desc":
    "Elo, Poisson, regressione logistica e il nostro modello Ensemble per la massima precisione.",
  "features.f3Title": "Backtesting di strategie",
  "features.f3Desc":
    "Testa le tue strategie su dati storici. Conosci il tuo vantaggio prima di scommettere.",
  "features.f4Title": "Fonti dati verificate",
  "features.f4Desc":
    "Usiamo solo API ufficiali e fornitori verificati. Niente scraping, niente dati inaffidabili.",
  "features.f5Title": "Bet of the Day",
  "features.f5Desc":
    "Il nostro algoritmo sceglie ogni giorno la previsione a più alto valore. I membri Premium la ricevono per primi.",
  "features.f6Title": "Comunità in crescita",
  "features.f6Desc":
    "Unisciti a una comunità di analisti sportivi che condividono insight e strategie.",

  "testimonials.badge": "Testimonianze",
  "testimonials.titleA": "Cosa dicono i nostri",
  "testimonials.titleHighlight": "analisti",
  "testimonials.titleB": "",
  "testimonials.subtitle":
    "Unisciti a 1.500+ scommettitori data-driven che si affidano a BetsPlug per avere un vantaggio sui bookmaker.",

  "finalCta.badge": "Pronto a vincere?",
  "finalCta.titleA": "Inizia a fare",
  "finalCta.titleHighlight": "pick più intelligenti",
  "finalCta.titleB": "oggi.",
  "finalCta.subtitle":
    "Unisciti a migliaia di analisti che usano le previsioni IA di BetsPlug. Prova gratuita — nessuna carta richiesta.",
  "finalCta.primary": "Prova gratuita",
  "finalCta.secondary": "Scopri di più →",
  "finalCta.moneyBack": "3 giorni soddisfatto o rimborsato",
  "finalCta.cancelAnytime": "Annulla quando vuoi",
  "finalCta.instantAccess": "Accesso immediato",

  "pricing.bronzeTagline": "Esplora gratis, per sempre",
  "pricing.bronzeCta": "Inizia gratis",
  "pricing.bronzeF1": "1 Bet of the Day (pick gratuito)",
  "pricing.bronzeF2": "3 previsioni IA al giorno",
  "pricing.bronzeF3": "Accesso allo storico pubblico",
  "pricing.bronzeF4": "Insight dalla comunità",
  "pricing.bronzeF5": "Supporto via email",
  "pricing.silverTagline": "Per analisti seri",
  "pricing.silverCta": "Inizia Silver",
  "pricing.silverF1": "Previsioni IA illimitate",
  "pricing.silverF2": "Tutti e 4 i modelli IA (Ensemble)",
  "pricing.silverF3": "Tracking probabilità live",
  "pricing.silverF4": "Backtesting di strategie",
  "pricing.silverF5": "Supporto email prioritario",
  "pricing.goldTagline": "La scelta più popolare",
  "pricing.goldCta": "Inizia Gold",
  "pricing.goldF1": "Tutto Silver, più:",
  "pricing.goldF2": "Canale Telegram Gold esclusivo",
  "pricing.goldF3": "Accesso anticipato al Bet of the Day",
  "pricing.goldF4": "Consulente strategico IA personale",
  "pricing.goldF5": "Leaderboard VIP & analytics",
  "pricing.goldF6": "Supporto prioritario 24/7",
  "pricing.perMonth": "/ mese",
  "pricing.forever": "/ per sempre",
  "pricing.billedMonthly": "Fatturato mensilmente",
  "pricing.billedYearlySilver": "Fatturato 95,90 €/anno",
  "pricing.billedYearlyGold": "Fatturato 143,90 €/anno",
  "pricing.platTagline": "Pagamento unico. Accesso a vita.",
  "pricing.platPitch":
    "Paga una volta, mantieni il tuo vantaggio per sempre — ogni funzione attuale e ogni futuro upgrade inclusi.",
  "pricing.platBadgeLifetime": "Offerta a vita",
  "pricing.platLimited": "Limitato a 100/anno",
  "pricing.platOneTime": "Pagamento unico",
  "pricing.platNoSub": "Nessun abbonamento. Nessun rinnovo. Mai.",
  "pricing.platCta": "Ottieni accesso a vita",
  "pricing.platF1": "Accesso a vita a ogni funzione",
  "pricing.platF2": "Tutte le future release incluse per sempre",
  "pricing.platF3": "Contatto diretto con il nostro team di analisti",
  "pricing.platF4": "Badge leaderboard tier Fondatore",
  "pricing.platF5": "Limitato a 100 membri all'anno",
  "pricing.trust1": "Garanzia rimborso 3 giorni",
  "pricing.trust2": "Annulla quando vuoi",
  "pricing.trust3": "Pagamento sicuro con Stripe",

  "seo.badge": "Il modo intelligente di studiare le scommesse",
  "seo.titleA": "Previsioni sportive IA &",
  "seo.titleB": "pick basati sui dati",
  "seo.subtitle":
    "BetsPlug è la casa data-driven delle previsioni sportive IA, dei pick di machine learning e delle proiezioni statistiche. Che tu stia studiando una multipla di calcio, cercando valore sui prop NBA o testando una nuova strategia — il nostro predictor IA ti dà il vantaggio di cui hai bisogno.",
  "seo.pillar1Title": "Motore di previsione sportiva IA",
  "seo.pillar1Desc":
    "Il nostro motore combina rating Elo, modelli di Poisson e machine learning per prevedere risultati in calcio, basket e tennis con precisione data-driven.",
  "seo.pillar2Title": "Previsioni supportate dai dati",
  "seo.pillar2Desc":
    "Ogni previsione BetsPlug si basa su migliaia di partite storiche, dati di forma live e metriche xG — per i pick più affilati online.",
  "seo.pillar3Title": "Storico verificato",
  "seo.pillar3Desc":
    "Trasparenza prima di tutto. Esplora il nostro storico pubblico con ogni pick IA pubblicato — ROI, hit-rate e confidence registrati e timestampati.",
  "seo.pillar4Title": "Bet of the Day",
  "seo.pillar4Desc":
    "Poco tempo? Il nostro Bet of the Day IA giornaliero evidenzia il pick a più alta confidenza tra tutti i campionati — scelto dall'algoritmo, non dall'istinto.",
  "seo.pillar5Title": "Probabilità IA live",
  "seo.pillar5Desc":
    "Guarda le probabilità cambiare in tempo reale durante le partite. Il nostro predictor IA live ricalcola le probabilità ogni secondo.",
  "seo.pillar6Title": "Analisi, non scommesse",
  "seo.pillar6Desc":
    "BetsPlug è una piattaforma di analisi sportiva — non un bookmaker. Forniamo previsioni IA e insight per decidere informato, senza mai scommettere sul nostro sito.",

  "faq.badge": "Domande frequenti",
  "faq.titleA": "Hai domande?",
  "faq.titleB": "Abbiamo le risposte",
  "faq.subtitle":
    "Tutto ciò che devi sapere sulla nostra piattaforma di previsioni sportive IA, dai primi passi alle integrazioni avanzate.",
  "faq.browseBy": "Sfoglia per categoria",
  "faq.stillQuestions": "Hai ancora domande?",
  "faq.supportBlurb":
    "Non trovi la risposta che cerchi? Il nostro team di supporto è qui per aiutarti.",
  "faq.contactSupport": "Contatta il supporto",
  "faq.articles": "articoli",
};

/* ── Swahili ───────────────────────────────────────────────── */
const sw: Dictionary = {
  "nav.predictions": "Utabiri",
  "nav.howItWorks": "Jinsi inavyofanya kazi",
  "nav.trackRecord": "Rekodi ya Mafanikio",
  "nav.pricing": "Bei",
  "nav.contact": "Wasiliana",
  "nav.about": "Kuhusu",
  "nav.login": "Ingia",
  "nav.startFreeTrial": "Anza bure",
  "nav.menu": "Menyu",
  "nav.getStarted": "Anza sasa",
  "nav.joinBlurb":
    "Jiunge na zaidi ya wachambuzi 1,500 na upate utabiri wa msingi wa data leo.",

  "hero.badge": "Tangulia mbele ya kampuni za kamari",
  "hero.titleLine1": "Utabiri bora wa michezo",
  "hero.titleLine2": "unaoendeshwa na AI",
  "hero.titleLine3": "kwa faida yako.",
  "hero.subtitle":
    "BetsPlug inaunganisha data, ukadiriaji wa Elo, miundo ya Poisson na machine learning katika jukwaa moja. Uwezekano wa moja kwa moja, maarifa ya kina, rekodi iliyothibitishwa — imetengenezwa kwa wachambuzi wa michezo wa kweli.",
  "hero.activeUsers": "Watumiaji hai",
  "hero.ctaPrimary": "Anza bure",
  "hero.ctaSecondary": "Jinsi inavyofanya kazi",
  "hero.livePick": "Chaguo la moja kwa moja",
  "hero.hot": "Moto",
  "hero.homeWin": "Ushindi wa nyumbani",
  "hero.draw": "Sare",
  "hero.away": "Ugenini",
  "hero.confidence": "Uhakika",
  "hero.edge": "Faida",
  "hero.joinNow": "Jiunge sasa",
  "hero.winRate": "Kiwango cha kushinda",
  "hero.today": "Leo",
  "hero.wins": "Ushindi",

  "lang.label": "Lugha",
  "lang.switch": "Badilisha lugha",

  "comparison.badge": "Kwa nini BetsPlug",
  "comparison.titleA": "Sio kila tovuti ya utabiri",
  "comparison.titleB": "imejengwa sawa.",
  "comparison.subtitle":
    "Hivi ndivyo hasa BetsPlug inavyotofautiana na tovuti za kawaida za washauri — hakuna maandishi madogo, hakuna ushindi uliochaguliwa.",
  "comparison.feature": "Kipengele",
  "comparison.winner": "Mshindi",
  "comparison.others": "Wengine",
  "comparison.typicalTipsters": "Washauri wa kawaida",
  "comparison.finalScore": "Alama ya mwisho",
  "comparison.fullHouse": "Kamili",
  "comparison.fallsShort": "Haifiki",
  "comparison.caption":
    "Ulinganisho unategemea taarifa zinazopatikana hadharani za majukwaa makuu ya washauri (2026).",

  "how.badge": "Jinsi inavyofanya kazi",
  "how.title": "Kutoka kujiandikisha hadi chaguo bora kwa hatua 3.",
  "how.subtitle":
    "Mtiririko rahisi na wa uwazi kuzunguka data — hakuna kelele, hakuna kubahatisha.",
  "how.step1Title": "Tengeneza akaunti yako",
  "how.step1Desc":
    "Jisajili bure kwa sekunde chache. Hakuna kadi ya mkopo inayohitajika.",
  "how.step2Title": "Chunguza utabiri wa AI",
  "how.step2Desc":
    "Miundo minne ya AI inachanganya viwango vya moja kwa moja, Elo, fomu na data ya kihistoria.",
  "how.step3Title": "Fanya maamuzi bora",
  "how.step3Desc":
    "Tumia uwezekano wa uwazi, faida na alama za uhakika kuchagua kwa ujasiri.",

  "pricing.badge": "Bei",
  "pricing.title": "Bei rahisi. Faida kubwa.",
  "pricing.subtitle":
    "Anza bure. Boresha unapotaka. Ghairi wakati wowote.",
  "pricing.monthly": "Kwa mwezi",
  "pricing.yearly": "Kwa mwaka",
  "pricing.save": "Okoa 20%",
  "pricing.savingNote": "Unaokoa miezi 2",
  "pricing.mostPopular": "Maarufu zaidi",

  "cta.badge": "Uko tayari kushinda kwa ustadi?",
  "cta.title": "Anza faida yako ya msingi wa data leo.",
  "cta.subtitle":
    "Jiunge na wachambuzi 1,500+ wanaotumia BetsPlug kwa maamuzi bora.",
  "cta.primary": "Anza bure",
  "cta.secondary": "Tazama utabiri",

  "footer.premiumBadge": "Ufikiaji wa Premium",
  "footer.premiumTitleA": "Jiunge na",
  "footer.premiumTitleB": "Telegram Premium",
  "footer.premiumTitleC": "yetu",
  "footer.premiumSubtitle":
    "Pata chaguo za wakati halisi, tahadhari za thamani na mazungumzo na wachambuzi wetu wa AI.",
  "footer.perk1": "Tahadhari za thamani za haraka",
  "footer.perk2": "Q&A ya faragha na wachambuzi",
  "footer.perk3": "Chaguo za bure za kila siku",
  "footer.perk4": "Uchambuzi wa kina wa VIP",
  "footer.joinCta": "Jiunge na Kikundi cha Premium",
  "footer.limited": "Nafasi ndogo · Wanachama pekee",
  "footer.onlineNow": "Wanachama 1,200+ mtandaoni",
  "footer.brandTagline":
    "BetsPlug inaunganisha data, Elo, miundo ya Poisson na machine learning katika jukwaa moja — kwa wachambuzi wa michezo wasiotaka kubahatisha.",
  "footer.product": "Bidhaa",
  "footer.company": "Kampuni",
  "footer.legal": "Kisheria",
  "footer.secureTitle": "Malipo salama",
  "footer.secureDesc": "Malipo ya SSL 256-bit",
  "footer.pciCompliant": "Inafuata PCI DSS",
  "footer.copyright":
    "Haki zote zimehifadhiwa. BetsPlug ni jukwaa la data na uchambuzi — sio mwendeshaji wa kamari.",
  "footer.responsible": "18+ Cheza kwa uwajibikaji",

  "leagues.badge": "Ufunikaji wa Kimataifa",
  "leagues.titleA": "Ligi tunazo",
  "leagues.titleB": "funika",

  "trusted.titleA": "Mshirika wako",
  "trusted.titleHighlight": "wa kuaminika",
  "trusted.titleB": "",
  "trusted.titleC": "katika uchambuzi wa michezo.",
  "trusted.subtitle":
    "BetsPlug inaunganisha mfumo unaokua wa vyanzo vya data, miundo ya AI na mikakati iliyothibitishwa.",
  "trusted.card1Title": "Huduma kwa kila kiwango cha utaalamu.",
  "trusted.card1Desc":
    "Kutoka kwa mwanzilishi hadi mchambuzi wa kitaaluma — dashibodi, mafunzo na takwimu wazi.",
  "trusted.card2Title": "Mbinu bora za sekta.",
  "trusted.card2Desc":
    "Miundo minne ya AI (Elo, Poisson, Logistic, Ensemble) inatoa utabiri unaoaminika.",
  "trusted.learnMore": "Jifunze zaidi",
  "trusted.card3Title": "Inalindwa na uwazi.",
  "trusted.card3Desc":
    "Kila utabiri umerekodiwa, unafuatiliwa na kuthibitishwa hadharani — data unayoweza kukagua mwenyewe.",

  "track.label": "Rekodi ya Mafanikio",
  "track.accuracy": "Usahihi wa jumla",
  "track.thisWeek": "Wiki hii",
  "track.metricPredictions": "Utabiri",
  "track.metricModels": "Miundo",
  "track.metricLeagues": "Ligi",
  "track.badge": "Matokeo yaliyothibitishwa",
  "track.titleA": "Jukwaa",
  "track.titleHighlight": "linaloaminika",
  "track.titleB": "wakati wowote na mahali popote.",
  "track.rating": "4.9 / 5 kutoka kwa wachambuzi 1,200+",
  "track.desc1":
    "Jukwaa moja linalounganisha mfumo unaokua wa data ya michezo, utabiri wa AI na zana za backtesting. Utabiri wote umerekodiwa hadharani.",
  "track.desc2":
    "Iwe unafuatilia mpira wa miguu, kikapu au tenisi, BetsPlug inaunganisha data na machine learning.",
  "track.cta": "Jifunze zaidi",
  "track.askQuestion": "Uliza swali?",

  "features.badge": "Vipengele",
  "features.titleA": "Kila kitu unachohitaji",
  "features.titleB": "kushinda kwa akili.",
  "features.f1Title": "Utabiri wa wakati halisi",
  "features.f1Desc":
    "Masasisho ya moja kwa moja ya uwezekano. Usikose fursa ya thamani.",
  "features.f2Title": "Miundo 4 ya AI imeunganishwa",
  "features.f2Desc":
    "Elo, Poisson, Logistic Regression na muundo wetu wa Ensemble.",
  "features.f3Title": "Backtesting ya mikakati",
  "features.f3Desc":
    "Jaribu mikakati yako kwenye data ya kihistoria kabla ya kuweka dau.",
  "features.f4Title": "Vyanzo vya data vilivyothibitishwa",
  "features.f4Desc":
    "Tunatumia APIs rasmi na watoaji walioidhinishwa pekee.",
  "features.f5Title": "Chaguo la Siku",
  "features.f5Desc":
    "Algoriti yetu huchagua utabiri wa thamani zaidi kila siku.",
  "features.f6Title": "Jumuiya inayokua",
  "features.f6Desc":
    "Jiunge na jumuiya ya wachambuzi wa michezo wa data-driven.",

  "testimonials.badge": "Ushuhuda",
  "testimonials.titleA": "Wachambuzi",
  "testimonials.titleHighlight": "wetu",
  "testimonials.titleB": "wanasema nini",
  "testimonials.subtitle":
    "Jiunge na wacheza dau 1,500+ wanaomtegemea BetsPlug kwa faida dhidi ya mabuku.",

  "finalCta.badge": "Uko tayari kushinda?",
  "finalCta.titleA": "Anza kufanya",
  "finalCta.titleHighlight": "chaguo za akili",
  "finalCta.titleB": "leo.",
  "finalCta.subtitle":
    "Jiunge na maelfu ya wachambuzi wa michezo wanaotumia utabiri wa AI wa BetsPlug. Jaribio bure.",
  "finalCta.primary": "Anza bure",
  "finalCta.secondary": "Jifunze zaidi →",
  "finalCta.moneyBack": "Siku 3 kurudishwa pesa",
  "finalCta.cancelAnytime": "Ghairi wakati wowote",
  "finalCta.instantAccess": "Ufikiaji wa papo hapo",

  "seo.badge": "Njia ya akili ya kutafiti dau",
  "seo.titleA": "Utabiri wa Michezo wa AI &",
  "seo.titleB": "Chaguo za msingi wa data",
  "seo.subtitle":
    "BetsPlug ni nyumba ya data kwa utabiri wa AI wa michezo, chaguo za machine learning na utabiri wa takwimu.",

  "faq.badge": "Maswali yanayoulizwa mara kwa mara",
  "faq.titleA": "Una maswali?",
  "faq.titleB": "Tuna majibu",
  "faq.subtitle":
    "Kila kitu unachohitaji kujua kuhusu jukwaa letu la utabiri wa michezo wa AI.",
  "faq.browseBy": "Vinjari kwa kitengo",
  "faq.stillQuestions": "Bado una maswali?",
  "faq.supportBlurb":
    "Huwezi kupata jibu unalotafuta? Timu yetu ya msaada iko hapa kukusaidia.",
  "faq.contactSupport": "Wasiliana na msaada",
  "faq.articles": "makala",
};

/* ── Indonesian ────────────────────────────────────────────── */
const id: Dictionary = {
  "nav.predictions": "Prediksi",
  "nav.howItWorks": "Cara kerja",
  "nav.trackRecord": "Rekam Jejak",
  "nav.pricing": "Harga",
  "nav.contact": "Kontak",
  "nav.about": "Tentang",
  "nav.login": "Masuk",
  "nav.startFreeTrial": "Coba gratis",
  "nav.menu": "Menu",
  "nav.getStarted": "Mulai",
  "nav.joinBlurb":
    "Bergabunglah dengan 1.500+ analis dan dapatkan prediksi berbasis data hari ini.",

  "hero.badge": "Unggul dari bandar taruhan",
  "hero.titleLine1": "Prediksi olahraga",
  "hero.titleLine2": "berbasis AI terbaik",
  "hero.titleLine3": "untuk keunggulan Anda.",
  "hero.subtitle":
    "BetsPlug menyatukan data, peringkat Elo, model Poisson, dan machine learning dalam satu platform. Probabilitas langsung, wawasan mendalam, rekam jejak terbukti — dibangun untuk analis olahraga serius.",
  "hero.activeUsers": "Pengguna aktif",
  "hero.ctaPrimary": "Coba gratis",
  "hero.ctaSecondary": "Cara kerja",
  "hero.livePick": "Pilihan Langsung",
  "hero.hot": "Panas",
  "hero.homeWin": "Kemenangan kandang",
  "hero.draw": "Seri",
  "hero.away": "Tandang",
  "hero.confidence": "Keyakinan",
  "hero.edge": "Keunggulan",
  "hero.joinNow": "Gabung sekarang",
  "hero.winRate": "Tingkat kemenangan",
  "hero.today": "Hari ini",
  "hero.wins": "Kemenangan",

  "lang.label": "Bahasa",
  "lang.switch": "Ganti bahasa",

  "comparison.badge": "Mengapa BetsPlug",
  "comparison.titleA": "Tidak semua situs prediksi",
  "comparison.titleB": "dibangun sama.",
  "comparison.subtitle":
    "Inilah yang membedakan BetsPlug dari situs tipster biasa — tanpa huruf kecil, tanpa kemenangan yang dipilih-pilih.",
  "comparison.feature": "Fitur",
  "comparison.winner": "Pemenang",
  "comparison.others": "Lainnya",
  "comparison.typicalTipsters": "Tipster biasa",
  "comparison.finalScore": "Skor akhir",
  "comparison.fullHouse": "Sempurna",
  "comparison.fallsShort": "Kurang",
  "comparison.caption":
    "Perbandingan berdasarkan informasi yang tersedia secara publik dari platform tipster terkemuka (2026).",

  "how.badge": "Cara kerja",
  "how.title": "Dari pendaftaran hingga pilihan cerdas dalam 3 langkah.",
  "how.subtitle":
    "Alur kerja sederhana dan transparan berdasarkan data — tanpa hype, tanpa tebakan.",
  "how.step1Title": "Buat akun Anda",
  "how.step1Desc":
    "Daftar gratis dalam hitungan detik. Tidak perlu kartu kredit.",
  "how.step2Title": "Jelajahi prediksi AI",
  "how.step2Desc":
    "Empat model AI menggabungkan odds langsung, Elo, form, dan data historis.",
  "how.step3Title": "Buat keputusan lebih cerdas",
  "how.step3Desc":
    "Gunakan probabilitas, keunggulan, dan skor keyakinan transparan untuk bertaruh dengan yakin.",

  "pricing.badge": "Harga",
  "pricing.title": "Harga sederhana. Keunggulan serius.",
  "pricing.subtitle":
    "Mulai gratis. Upgrade kapan Anda siap. Batalkan kapan saja.",
  "pricing.monthly": "Bulanan",
  "pricing.yearly": "Tahunan",
  "pricing.save": "Hemat 20%",
  "pricing.savingNote": "Anda menghemat 2 bulan",
  "pricing.mostPopular": "Paling populer",

  "cta.badge": "Siap menang lebih cerdas?",
  "cta.title": "Mulai keunggulan berbasis data Anda hari ini.",
  "cta.subtitle":
    "Bergabunglah dengan 1.500+ analis yang sudah menggunakan BetsPlug.",
  "cta.primary": "Coba gratis",
  "cta.secondary": "Lihat prediksi",

  "footer.premiumBadge": "Akses premium",
  "footer.premiumTitleA": "Bergabunglah dengan",
  "footer.premiumTitleB": "grup Telegram Premium",
  "footer.premiumTitleC": "kami",
  "footer.premiumSubtitle":
    "Dapatkan pilihan waktu nyata, peringatan nilai, dan obrolan langsung dengan analis AI kami.",
  "footer.perk1": "Peringatan nilai instan",
  "footer.perk2": "Q&A pribadi dengan analis",
  "footer.perk3": "Pilihan gratis harian",
  "footer.perk4": "Analisis VIP eksklusif",
  "footer.joinCta": "Gabung Grup Premium",
  "footer.limited": "Tempat terbatas · Hanya anggota",
  "footer.onlineNow": "1.200+ anggota online",
  "footer.brandTagline":
    "BetsPlug menyatukan data, Elo, model Poisson dan machine learning dalam satu platform — untuk analis olahraga serius yang menolak menebak.",
  "footer.product": "Produk",
  "footer.company": "Perusahaan",
  "footer.legal": "Hukum",
  "footer.secureTitle": "Pembayaran aman",
  "footer.secureDesc": "Checkout terenkripsi SSL 256-bit",
  "footer.pciCompliant": "Sesuai PCI DSS",
  "footer.copyright":
    "Semua hak dilindungi. BetsPlug adalah platform data & analitik — bukan operator perjudian.",
  "footer.responsible": "18+ Bermain dengan bertanggung jawab",

  "leagues.badge": "Cakupan Global",
  "leagues.titleA": "Liga yang kami",
  "leagues.titleB": "liput",

  "trusted.titleA": "Mitra",
  "trusted.titleHighlight": "tepercaya",
  "trusted.titleB": "Anda",
  "trusted.titleC": "dalam analitik olahraga.",
  "trusted.subtitle":
    "BetsPlug menyatukan ekosistem sumber data, model AI, dan strategi teruji yang terus berkembang.",
  "trusted.card1Title": "Layanan untuk semua level keahlian.",
  "trusted.card1Desc":
    "Dari pemula hingga analis profesional — dasbor, tutorial, dan statistik transparan kami.",
  "trusted.card2Title": "Praktik terbaik industri.",
  "trusted.card2Desc":
    "Empat model AI (Elo, Poisson, Logistic, Ensemble) bergabung untuk memberikan prediksi yang bisa dipercaya.",
  "trusted.learnMore": "Pelajari lebih lanjut",
  "trusted.card3Title": "Dilindungi oleh transparansi.",
  "trusted.card3Desc":
    "Setiap prediksi dicatat, dilacak, dan diverifikasi secara publik — data yang bisa Anda audit sendiri.",

  "track.label": "Rekam Jejak",
  "track.accuracy": "Akurasi keseluruhan",
  "track.thisWeek": "Minggu ini",
  "track.metricPredictions": "Prediksi",
  "track.metricModels": "Model",
  "track.metricLeagues": "Liga",
  "track.badge": "Hasil terbukti",
  "track.titleA": "Platform",
  "track.titleHighlight": "tepercaya",
  "track.titleB": "kapan saja & di mana saja.",
  "track.rating": "4,9 / 5 dari 1.200+ analis",
  "track.desc1":
    "Platform terpadu yang mengamankan ekosistem data olahraga, prediksi AI, dan alat backtesting strategi. Semua prediksi dicatat dan dilacak secara publik.",
  "track.desc2":
    "Entah Anda mengikuti sepak bola, basket, atau tenis, BetsPlug menyatukan data dan machine learning.",
  "track.cta": "Pelajari lebih lanjut",
  "track.askQuestion": "Ajukan pertanyaan?",

  "features.badge": "Fitur",
  "features.titleA": "Semua yang Anda butuhkan untuk",
  "features.titleB": "menang dengan cerdas.",
  "features.f1Title": "Prediksi waktu nyata",
  "features.f1Desc":
    "Pembaruan probabilitas langsung saat kondisi pertandingan berubah.",
  "features.f2Title": "4 model AI digabungkan",
  "features.f2Desc":
    "Elo, Poisson, Regresi Logistik, dan model Ensemble kami.",
  "features.f3Title": "Backtesting strategi",
  "features.f3Desc":
    "Uji strategi Anda terhadap data historis sebelum bertaruh.",
  "features.f4Title": "Sumber data terverifikasi",
  "features.f4Desc":
    "Kami hanya menggunakan API resmi dan penyedia data terverifikasi.",
  "features.f5Title": "Pilihan Hari Ini",
  "features.f5Desc":
    "Algoritma kami memilih prediksi bernilai tertinggi setiap hari.",
  "features.f6Title": "Komunitas yang berkembang",
  "features.f6Desc":
    "Bergabunglah dengan komunitas analis olahraga berbasis data.",

  "testimonials.badge": "Testimoni",
  "testimonials.titleA": "Apa kata",
  "testimonials.titleHighlight": "analis",
  "testimonials.titleB": "kami",
  "testimonials.subtitle":
    "Bergabunglah dengan 1.500+ petaruh berbasis data yang mempercayai BetsPlug.",

  "finalCta.badge": "Siap menang?",
  "finalCta.titleA": "Mulai buat",
  "finalCta.titleHighlight": "pilihan lebih cerdas",
  "finalCta.titleB": "hari ini.",
  "finalCta.subtitle":
    "Bergabunglah dengan ribuan analis olahraga yang menggunakan prediksi AI BetsPlug. Uji coba gratis.",
  "finalCta.primary": "Coba gratis",
  "finalCta.secondary": "Pelajari lebih lanjut →",
  "finalCta.moneyBack": "Jaminan 3 hari uang kembali",
  "finalCta.cancelAnytime": "Batalkan kapan saja",
  "finalCta.instantAccess": "Akses instan",

  "seo.badge": "Cara cerdas meneliti taruhan",
  "seo.titleA": "Prediksi Olahraga AI &",
  "seo.titleB": "Pilihan berbasis data",
  "seo.subtitle":
    "BetsPlug adalah rumah berbasis data untuk prediksi olahraga AI, pilihan machine learning, dan prakiraan statistik.",

  "faq.badge": "Pertanyaan yang sering diajukan",
  "faq.titleA": "Ada pertanyaan?",
  "faq.titleB": "Kami punya jawabannya",
  "faq.subtitle":
    "Semua yang perlu Anda ketahui tentang platform prediksi olahraga AI kami.",
  "faq.browseBy": "Telusuri berdasarkan kategori",
  "faq.stillQuestions": "Masih punya pertanyaan?",
  "faq.supportBlurb":
    "Tidak menemukan jawabannya? Tim dukungan kami siap membantu.",
  "faq.contactSupport": "Hubungi dukungan",
  "faq.articles": "artikel",
};

export const messages: Record<Locale, Dictionary> = { en, nl, de, fr, es, it, sw, id };

/** Resolve a key for a locale, falling back to English if missing. */
export function translate(locale: Locale, key: TranslationKey): string {
  return messages[locale]?.[key] ?? en[key];
}
