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
  "nav.articles": "Articles",
  "nav.login": "Login",
  "nav.startFreeTrial": "Start Free Trial",
  "nav.menu": "Menu",
  "nav.getStarted": "Get Started",
  "nav.joinBlurb": "Join 1,500+ analysts and get data-driven predictions today.",

  /* Hero */
  "hero.badge": "Be ahead of the bookmakers",
  "hero.titleLine1": "Best AI-driven",
  "hero.titleLine2": "football predictions",
  "hero.titleLine3": "for your edge.",
  "hero.subtitle":
    "BetsPlug unites data, Elo ratings, Poisson models and machine learning into one platform. Live probabilities, deep insights, proven track record - built for serious football analysts.",
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
  "hero.usp1Desc": "Poisson, XGBoost, Elo & market-implied - blended.",
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
    "Here's exactly what separates BetsPlug from typical tipster sites - no fine print, no cherry-picked wins.",
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
    "A simple, transparent workflow built around data - no hype, no guesswork.",
  "how.step1Title": "Create your account",
  "how.step1Desc": "Sign up in seconds. A symbolic €0.01 activates your 7-day full-access trial - we only charge real cards to keep the platform fraud-free.",
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
    "Get real-time picks, edge alerts and live chat with our AI analysts. Be the first to know when a high-value match hits the board - straight in your pocket.",
  "footer.perk1": "Instant value alerts",
  "footer.perk2": "Private analyst Q&A",
  "footer.perk3": "Daily free picks",
  "footer.perk4": "VIP-only deep dives",
  "footer.joinCta": "Join the Premium Group",
  "footer.limited": "Limited spots · Members only",
  "footer.onlineNow": "1,200+ members online",
  "footer.brandTagline":
    "BetsPlug unites data, Elo ratings, Poisson models and machine learning into one platform - built for serious football analysts who refuse to guess.",
  "footer.product": "Product",
  "footer.company": "Company",
  "footer.legal": "Legal",
  "footer.secureTitle": "Secure payments",
  "footer.secureDesc": "256-bit SSL encrypted checkout",
  "footer.pciCompliant": "PCI DSS compliant",
  "footer.copyright":
    "All rights reserved. BetsPlug is a data & analytics platform - not a gambling operator.",
  "footer.responsible": "18+ Play responsibly",
  "footer.aboutUs": "About Us",
  "footer.ourModels": "Our Models",
  "footer.contact": "Contact",
  "footer.termsOfService": "Terms of Service",
  "footer.privacyPolicy": "Privacy Policy",
  "footer.cookiePolicy": "Cookie Policy",
  "footer.comparison": "Comparison",
  "footer.betTypes": "Bet Types",
  "footer.viewAll": "View all",
  "footer.learn": "Learn",
  "footer.bottomPrivacy": "Privacy",
  "footer.bottomTerms": "Terms",
  "footer.bottomCookies": "Cookies",

  /* Leagues ticker */
  "leagues.badge": "Top Leagues",
  "leagues.titleA": "The biggest",
  "leagues.titleB": "leagues",

  /* Trusted Partner */
  "trusted.titleA": "Your",
  "trusted.titleHighlight": "trusted",
  "trusted.titleB": "partner",
  "trusted.titleC": "in football analytics.",
  "trusted.subtitle":
    "BetsPlug unites and secures a growing ecosystem of data sources, AI models, and proven strategies. One platform for data-driven football analysts who refuse to guess.",
  "trusted.card1Title": "Service for Any Level of Expertise.",
  "trusted.card1Desc":
    "From beginner to pro-analyst - our dashboards, tutorials, and transparent stats make it easy to understand every prediction.",
  "trusted.card2Title": "Industry best practices.",
  "trusted.card2Desc":
    "Four AI models (Elo, Poisson, Logistic, Ensemble) combine to deliver predictions you can trust. Proven methods, transparent results.",
  "trusted.learnMore": "Learn More",
  "trusted.card3Title": "Protected by transparency.",
  "trusted.card3Desc":
    "Every prediction is logged, tracked, and publicly verified. No hidden results, no cherry-picking - just data you can audit yourself.",

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
    "This is a unified platform that secures a growing ecosystem of football data, AI predictions, and strategy backtesting tools. All predictions are logged and publicly tracked - full transparency, always.",
  "track.desc2":
    "Whether you follow the Premier League, La Liga or the Champions League, BetsPlug unites data and machine learning into insights you can actually use.",
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
  "features.f5Title": "Pick of the Day",
  "features.f5Desc":
    "Our algorithm picks the single highest-value prediction each day. Premium members get it first.",
  "features.f6Title": "Growing Community",
  "features.f6Desc":
    "Join a community of data-driven football analysts who share insights and strategies.",

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
  "finalCta.subtitle": "Join thousands of football analysts who use BetsPlug's AI-driven predictions. €0.01 activates your 7-day full-access trial.",
  "finalCta.primary": "Start Free Trial",
  "finalCta.secondary": "Learn more →",
  "finalCta.moneyBack": "14-Day Money-Back",
  "finalCta.cancelAnytime": "Cancel Anytime",
  "finalCta.instantAccess": "Instant Access",

  /* Pricing - plan details */
  "pricing.bronzeTagline": "Full access trial for just €0.01",
  "pricing.bronzeCta": "Start €0.01 Trial",
  "pricing.bronzeF1": "Full Gold access for 7 days",
  "pricing.bronzeF2": "All 30+ leagues & 4 AI models",
  "pricing.bronzeF3": "Unlimited daily AI predictions",
  "pricing.bronzeF4": "Instant Pick of the Day + alerts",
  "pricing.bronzeF5": "Just €0.01 · Cancel anytime",
  "pricing.silverTagline": "Essentials for casual analysts",
  "pricing.silverCta": "Start Silver",
  "pricing.silverF1": "Top 5 European leagues only",
  "pricing.silverF2": "Ensemble-only (no per-model breakdown)",
  "pricing.silverF3": "Picks delayed 2h vs Gold",
  "pricing.silverF4": "Basic confidence scores",
  "pricing.silverF5": "Email support (48h response)",
  "pricing.goldTagline": "Everything you need to win",
  "pricing.goldCta": "Start Gold",
  "pricing.goldF1": "All 30+ leagues worldwide (CL, UEL, MLS…)",
  "pricing.goldF2": "All 4 AI models + Ensemble breakdown",
  "pricing.goldF3": "Instant picks + daily Pick of the Day",
  "pricing.goldF4": "Live probability tracking & alerts",
  "pricing.goldF5": "Exclusive Gold Telegram + Strategy Lab",
  "pricing.goldF6": "Priority support (12h) + monthly strategy review",
  "pricing.perMonth": "/ month",
  "pricing.forever": "/ 7-day trial",
  "pricing.billedMonthly": "Billed monthly",
  "pricing.billedYearlySilver": "Billed €95,90 yearly",
  "pricing.billedYearlyGold": "Billed €143,90 yearly",
  "pricing.platTagline": "Lifetime access. Founder-tier perks.",
  "pricing.platPitch": "Pay once, unlock every current and future Gold feature - plus private perks you won't find on any plan.",
  "pricing.platBadgeLifetime": "Lifetime Deal",
  "pricing.platLimited": "Limited to 100/year",
  "pricing.platOneTime": "One-time payment",
  "pricing.platNoSub": "No subscription. No renewals. Ever.",
  "pricing.platCta": "Claim Lifetime Access",
  "pricing.platF1": "Lifetime Gold - every current & future feature",
  "pricing.platF2": "Private Platinum Telegram (max 20 seats)",
  "pricing.platF3": "1-on-1 onboarding call with our founders",
  "pricing.platF4": "Monthly personal strategy review",
  "pricing.platF5": "Early access + read-only API + lifetime price lock",
  "pricing.trust1": "14-Day Money-Back Guarantee",
  "pricing.trust2": "Cancel Anytime",
  "pricing.trust3": "Secure payment by Stripe",

  /* Articles */
  "articles.badge": "Football Analysis",
  "articles.title": "Latest Analysis",
  "articles.subtitle": "Football news, AI match breakdowns and data-driven betting insights.",
  "articles.allArticles": "All Articles",
  "articles.sportFootball": "Football",
  "articles.readTime": "min read",
  "articles.empty": "No articles in this category yet - check back soon.",
  "articles.back": "Back to all articles",
  "articles.breadcrumbHome": "Home",
  "articles.breadcrumbBlog": "Articles",
  "articles.share": "Share",
  "articles.related": "Related Articles",
  "articles.ctaBadge": "BetsPlug members",
  "articles.ctaTitle": "Turn this analysis into a real edge.",
  "articles.ctaSubtitle": "Get live AI probabilities, Pick of the Day and the full Ensemble model output - free for 7 days.",
  "articles.ctaButton": "Start Free Trial",
  "articles.ctaNoCard": "Symbolic €0.01 to activate your 7-day trial",
  "articles.tldr": "TL;DR",
  "articles.publishedOn": "Published",
  "articles.byline": "By",
  "articles.checkAll": "Check all articles",
  "articles.prevPost": "Previous article",
  "articles.nextPost": "Next article",
  "articles.navLabel": "Continue reading",

  /* SEO section */
  "seo.badge": "The Smart Way to Research Bets",
  "seo.titleA": "AI Football Predictions &",
  "seo.titleB": "Data-Driven Betting Picks",
  "seo.subtitle":
    "BetsPlug is the data-driven home for AI football predictions, machine-learning betting picks and statistical match forecasts. Whether you're researching your next accumulator, analysing league form or backtesting a new strategy - our AI football predictor gives you the edge you need to beat the closing line.",
  "seo.pillar1Title": "AI Football Prediction Engine",
  "seo.pillar1Desc":
    "Our AI football prediction engine combines Elo ratings, Poisson goal models, and machine learning to forecast match outcomes across all major football leagues with data-driven accuracy.",
  "seo.pillar2Title": "Data-Backed Betting Predictions",
  "seo.pillar2Desc":
    "Every AI betting prediction on BetsPlug is backed by thousands of historical matches, live form data, and expected-goals metrics - giving you the sharpest football picks online.",
  "seo.pillar3Title": "Verified Track Record",
  "seo.pillar3Desc":
    "Transparency first. Explore our public track record to see every AI football pick we've ever published, with full ROI, hit-rate and confidence scores logged and timestamped.",
  "seo.pillar4Title": "Pick of the Day",
  "seo.pillar4Desc":
    "Short on time? Our daily AI-powered Pick of the Day highlights the single highest-confidence value pick across all leagues - selected by our algorithm, not by feeling.",
  "seo.pillar5Title": "Live AI Probabilities",
  "seo.pillar5Desc":
    "Watch probabilities shift in real-time as matches unfold. Our live AI football predictor recalculates win probabilities every second so you can spot value the moment it appears.",
  "seo.pillar6Title": "Analytics, Not Gambling",
  "seo.pillar6Desc":
    "BetsPlug is a football analytics platform - not a bookmaker. We deliver AI-driven football predictions and data insights so you can make informed decisions, without ever placing a bet on our site.",

  /* FAQ */
  "faq.badge": "Frequently Asked Questions",
  "faq.titleA": "Got Questions?",
  "faq.titleB": "We've Got Answers",
  "faq.subtitle":
    "Everything you need to know about our AI football prediction platform, from getting started to advanced integrations.",
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
    "Get instant answers from our AI assistant, browse the FAQ, or reach our team directly - whichever works best for you.",
  "contact.chatPlaceholder": "Ask our AI anything about BetsPlug…",
  "contact.chatStart": "Start chat",
  "contact.chatHint": "Powered by BetsPlug AI · Usually responds in seconds",

  "contact.card1Title": "Chat with AI Assistant",
  "contact.card1Desc":
    "Get instant answers about pricing, models, predictions and anything else - 24/7, no waiting.",
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
    "BetsPlug is a pure football analytics platform. We publish AI-driven predictions, Elo ratings, Poisson models and transparent track records so you can make data-backed decisions. We're not a bookmaker - you cannot place bets with us.",
  "contact.faq2Q": "Do I need to pay to try BetsPlug?",
  "contact.faq2A":
    "No. Our Bronze tier is 100% free and gives you a daily AI pick, basic predictions and access to our public track record. Upgrade to Silver or Gold only when you want live probabilities, backtesting and advanced markets.",
  "contact.faq3Q": "Which leagues do you cover?",
  "contact.faq3A":
    "We cover 70+ football competitions worldwide, including the Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Eredivisie, UEFA Champions League, Europa League and 20+ more. We're adding new football leagues every month as our models mature.",

  "contact.faqGroup2": "Account & Billing",
  "contact.faq4Q": "Can I cancel my subscription anytime?",
  "contact.faq4A":
    "Yes, all Silver and Gold plans are month-to-month with zero lock-in. Cancel from your dashboard and keep access until the end of your current billing period - no questions asked.",
  "contact.faq5Q": "Do you offer refunds?",
  "contact.faq5A": "We offer a 14-day money-back guarantee on all paid plans under EU consumer law. If BetsPlug isn't right for you, email support within the first 14 days and we'll refund in full. Platinum Lifetime is final-sale after the 14-day window.",
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
  "chatbot.close": "Close chat",
  "chatbot.footer": "AI assistant grounded on BetsPlug docs - for anything else, email support@betsplug.com",
  "chatbot.suggestion1": "How does the Pick of the Day work?",
  "chatbot.suggestion2": "What's the difference between Silver and Gold?",
  "chatbot.suggestion3": "How accurate are your predictions?",
  "chatbot.replyDefault":
    "Thanks for reaching out! A BetsPlug analyst will get back to you shortly. In the meantime, check our FAQ or drop us a line at support@betsplug.com.",
  "chatbot.replyHello":
    "Hey there! 👋 I'm the BetsPlug AI. Ask me anything about our models, pricing or predictions - I'll do my best to help.",
  "chatbot.replyPricing": "We have four tiers. Bronze is a symbolic €0.01 trial - full access for 7 days, real card required (this keeps the platform fraud-free). Silver (€9.99/mo) is an entry-level plan limited to the top 5 European leagues and Ensemble-only picks with a 2h delay. Gold (€14.99/mo) is our most popular - all 30+ leagues worldwide, all 4 AI models, instant picks, daily Pick of the Day, Gold Telegram and Strategy Lab. Platinum (€199 one-time lifetime) adds private Telegram, 1-on-1 onboarding and a lifetime price lock. All paid plans are backed by a 14-day EU money-back guarantee.",
  "chatbot.replyRefund": "All Silver and Gold plans can be cancelled anytime from your dashboard - you keep access until the end of your billing period. We also offer a 14-day money-back guarantee on all paid plans under EU consumer law. Platinum Lifetime is final-sale after the 14-day refund window.",
  "chatbot.replyAccuracy":
    "Every prediction is logged in our public track record with hit-rate, ROI and confidence scores. You can filter by league, market and date range. No cherry-picking, no hidden losses - transparency is the whole point.",
  "chatbot.replyTelegram":
    "Our Telegram community has 1,200+ active members with daily picks, edge alerts and live Q&A with our analysts. Join at t.me/betsplug - free for Bronze users, VIP channels for Silver/Gold.",

  /* About Us page */
  "about.metaTitle":
    "About Us · BetsPlug AI Football Analytics Team",
  "about.metaDesc":
    "Meet the two engineers building BetsPlug. Football fanatics with an ICT background, turning raw match data into transparent, probability-driven predictions for all major football leagues.",
  "about.breadcrumbHome": "Home",
  "about.breadcrumbAbout": "About",

  "about.heroBadge": "Our Story",
  "about.heroTitleA": "Built by football fanatics.",
  "about.heroTitleB": "Engineered by data obsessives.",
  "about.heroSubtitle":
    "BetsPlug is an AI-powered football analytics platform built by two engineers who got tired of hot takes, armchair tipsters and influencer noise. We replaced gut feeling with statistical models, and loud opinions with transparent probabilities.",

  "about.missionBadge": "The Mission",
  "about.missionTitle": "We turn raw match data into a measurable edge.",
  "about.missionBody1":
    "For too long the football prediction market has run on hype. YouTube gurus chasing clout, Telegram channels selling \"locks of the week,\" paid tipsters with no verifiable history. As lifelong football fans, it drove us up the wall - because we knew the underlying data was far better than the noise surrounding it.",
  "about.missionBody2":
    "So we built the tool we always wished existed: a platform that ingests thousands of matches per week, runs them through Elo ratings, Poisson scoring models and gradient-boosted classifiers, and only surfaces the picks where our models genuinely disagree with the closing line. No vibes. No survivorship bias. Just math, published in the open.",
  "about.missionCta": "See how it works",

  "about.statsBadge": "By the Numbers",
  "about.statsTitle": "A decade of engineering. A lifetime of football.",
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
    "BetsPlug isn't a tipster. It's a disciplined system. These are the rules we wrote for ourselves - and the ones we refuse to break.",
  "about.value1Title": "Data over opinion",
  "about.value1Desc":
    "Every recommendation comes from a model, not a mood. We publish the explicit probability, the expected value and the confidence score so you can verify the reasoning instead of trusting a face on a screen.",
  "about.value2Title": "Track record in public",
  "about.value2Desc":
    "Every pick we call lives forever on our public track record - wins, losses and pushes, never deleted. If we don't beat the market over the long run, we don't deserve a cent of your money. Transparency is the whole point.",
  "about.value3Title": "Continuous retraining",
  "about.value3Desc":
    "Football evolves. Managers get sacked, rosters reshuffle, new leagues surface. Our models retrain weekly on fresh results so they never stagnate, and we publish the retraining notes alongside the picks.",
  "about.value4Title": "Your edge, not ours",
  "about.value4Desc":
    "We're analysts, not bookmakers. When the market moves in your favour, you're the one who benefits - not a platform skimming a vig off your losses. That alignment shapes every product decision we make.",

  "about.teamBadge": "Meet the Founders",
  "about.teamTitle": "Two founders. Zero armchair experts.",
  "about.teamSubtitle":
    "We're not influencers and we're not tipsters. We're engineers who ship. Everything on BetsPlug was built, broken and rebuilt by the two of us.",

  "about.founder1Name": "Cas",
  "about.founder1Role": "Co-founder · Engineering & Product",
  "about.founder1Bio":
    "Lifelong football fan with a background in ICT. Builds the systems that keep BetsPlug running and makes sure the data flows cleanly from source to screen.",

  "about.founder2Name": "Dennis",
  "about.founder2Role": "Co-founder · Data Science & Modelling",
  "about.founder2Bio":
    "Football enthusiast turned data nerd with years of ICT experience. Focuses on the models and statistics that turn match data into useful insights.",

  "about.ctaTitle": "Ready to trade guesswork for data?",
  "about.ctaSubtitle":
    "Join 1,500+ analysts who get the picks, the probabilities and the receipts - delivered before the closing line adjusts.",
  "about.ctaButton": "Start Free Trial",

  /* Track Record page */
  "tr.metaTitle":
    "Track Record · Verified AI Prediction Results · BetsPlug",
  "tr.metaDesc":
    "Transparent, auditable results for every BetsPlug pick. See how our AI models turn raw match data into a measurable edge - documented weekly, never cherry-picked.",
  "tr.breadcrumbHome": "Home",
  "tr.breadcrumbTrack": "Track Record",

  "tr.heroBadge": "Fully transparent",
  "tr.heroTitleA": "A track record you can",
  "tr.heroTitleB": "actually verify.",
  "tr.heroSubtitle":
    "Every pick BetsPlug publishes is timestamped, probability-weighted and logged to a public ledger - win or lose. This is how the numbers are built, and how real users put them to work.",
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
  "tr.kpi3Note": "Across 70+ football competitions",
  "tr.kpi4Value": "0.061",
  "tr.kpi4Label": "Brier score (lower = better)",
  "tr.kpi4Note": "Calibrated across win/draw/loss",

  /* How we track it - data pipeline */
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
    "For every fixture we compute 1,200+ features - Elo, xG trends, rest days, travel, head-to-head, referee bias, market movement - then store them in a point-in-time feature store so training never leaks future information.",
  "tr.pipe4Title": "Model ensemble",
  "tr.pipe4Desc":
    "Four independent models vote on the outcome: a Poisson goals model, a gradient-boosted classifier, an Elo-based baseline and a market-implied calibrator. Their probabilities are blended with stacked regression.",
  "tr.pipe5Title": "Value detection",
  "tr.pipe5Desc":
    "We compare the ensemble probability to the best available market odds. Only picks with a statistically significant edge - after commission and expected closing-line slippage - are marked as value.",
  "tr.pipe6Title": "Publish & grade",
  "tr.pipe6Desc":
    "Picks are timestamped the moment they go live. Once the match ends, results are graded automatically and written to the public track-record ledger - win, loss or push.",

  /* Methodology principles */
  "tr.methodBadge": "Methodology",
  "tr.methodTitle": "Four rules we never bend.",
  "tr.methodSubtitle":
    "Every number on this page survives these guardrails. If a result can't, it doesn't get counted.",
  "tr.method1Title": "Point-in-time only",
  "tr.method1Desc":
    "Models are trained on data that was actually available at kick-off - no hindsight, no silently re-graded matches.",
  "tr.method2Title": "Closing-line adjusted",
  "tr.method2Desc":
    "ROI figures subtract realistic slippage between our publish time and the closing line, so you see returns you could actually execute.",
  "tr.method3Title": "Nothing is deleted",
  "tr.method3Desc":
    "Losing picks stay on the ledger forever. A track record that only shows winners isn't a track record - it's marketing.",
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
    "I filter the track record by Serie A and over/under markets only. In 2025 that slice hit 61% on 412 picks - so I size up confidently on Sunday mornings instead of second-guessing myself.",
  "tr.case1Metric1Label": "His filtered sample size",
  "tr.case1Metric1Value": "412 picks",
  "tr.case1Metric2Label": "Verified hit rate",
  "tr.case1Metric2Value": "61.2%",
  "tr.case1Metric3Label": "Average closing edge",
  "tr.case1Metric3Value": "+4.8%",
  "tr.case1Outcome":
    "Uses the ledger to pick a market where the model has a proven edge, then ignores the rest. Result: fewer bets, higher conviction, better ROI.",

  "tr.case2Role": "Data-driven football analyst",
  "tr.case2Name": "Priya, 29 · London",
  "tr.case2Quote":
    "I care about calibration more than hit rate. Seeing that BetsPlug's match-result Brier score sits under 0.07 tells me the probabilities are honest - not just lucky.",
  "tr.case2Metric1Label": "Match-result Brier score",
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
  "tr.transTitle": "Don't take our word for it - read the ledger.",
  "tr.transSubtitle":
    "Every graded prediction we've ever published is searchable by match, date, market and model. No filters hide the losers.",
  "tr.transCta1": "Explore live results",
  "tr.transCta2": "Start Free Trial",

  /* How It Works page - dedicated deep-dive */
  "hiw.metaTitle":
    "How It Works · BetsPlug AI Prediction Engine",
  "hiw.metaDesc":
    "A full, step-by-step walkthrough of the BetsPlug prediction engine: how we collect data, engineer features, train models, detect value and publish picks you can verify.",
  "hiw.breadcrumbHome": "Home",
  "hiw.breadcrumbHow": "How it works",

  "hiw.heroBadge": "The BetsPlug engine",
  "hiw.heroTitleA": "How we turn raw match data",
  "hiw.heroTitleB": "into predictions you can trust.",
  "hiw.heroSubtitle":
    "Every pick on BetsPlug is the end of a long, carefully engineered pipeline. No hunches, no cherry-picking, no hidden rules. This is the exact process - from the moment a fixture is announced, to the moment a verified pick lands on your dashboard.",
  "hiw.heroCtaPrimary": "See the track record",
  "hiw.heroCtaSecondary": "Start Free Trial",
  "hiw.heroStatDataSources": "Data sources",
  "hiw.heroStatLeagues": "European leagues",
  "hiw.heroStatModels": "Ensemble models",
  "hiw.heroStatUpdates": "Sync cycle",

  /* Overview strip */
  "hiw.overviewBadge": "The pipeline",
  "hiw.overviewTitle": "Seven stages. Full transparency.",
  "hiw.overviewSubtitle":
    "Each stage is built and monitored independently. Here's exactly what happens under the hood.",

  /* Stage 1 - Data acquisition */
  "hiw.s1Badge": "Stage 01 · Data acquisition",
  "hiw.s1Title": "We start where the market starts: the raw feed.",
  "hiw.s1Lead":
    "Garbage in, garbage out. So our pipeline begins with reliable data sources covering fixtures, results, standings and bookmaker odds.",
  "hiw.s1P1":
    "Every 6 hours we sync fixtures, results and standings from API-Football and football-data.org for 6 European leagues. Bookmaker odds are fetched from The Odds API every 2 hours. During match hours (12:00-24:00 UTC), live scores update every 5 minutes so your dashboard stays current.",
  "hiw.s1P2":
    "Every record is timestamped so we can replay any moment in history exactly as our models saw it - critical for honest backtesting.",
  "hiw.s1Point1Title": "3 data providers",
  "hiw.s1Point1Desc":
    "API-Football, football-data.org and The Odds API - each covering different aspects of the match.",
  "hiw.s1Point2Title": "6-hour sync cycle",
  "hiw.s1Point2Desc":
    "Fixtures and predictions refresh every 6 hours. Live scores update every 5 minutes during match hours.",
  "hiw.s1Point3Title": "Point-in-time storage",
  "hiw.s1Point3Desc":
    "Nothing is overwritten. Every change is a new row - history is permanent.",

  /* Stage 2 - Cleaning */
  "hiw.s2Badge": "Stage 02 · Cleaning & normalisation",
  "hiw.s2Title": "We enforce one source of truth before a model ever sees the data.",
  "hiw.s2Lead":
    "Raw football data is famously messy. Team names differ between feeds, leagues rename themselves, markets get suspended mid-match. We fix all of it - in a deterministic, reproducible way.",
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

  /* Stage 3 - Feature engineering */
  "hiw.s3Badge": "Stage 03 · Feature engineering",
  "hiw.s3Title": "Multiple signal families per match - each one earns its place.",
  "hiw.s3Lead":
    "A prediction is only as sharp as the signals it's built on. This is where a match becomes a structured profile our models can reason about.",
  "hiw.s3P1":
    "For every fixture we compute features across several families: Elo ratings, Poisson goal rates, league standings, recent form, head-to-head history and bookmaker odds. These feed into three independent models that each look at the data differently.",
  "hiw.s3P2":
    "All features use only data available before kick-off. Our models never see the future when generating a prediction - a key safeguard against overfitting.",
  "hiw.s3Family1Title": "Elo ratings",
  "hiw.s3Family1Desc": "Dynamic team strength ratings updated after every match result.",
  "hiw.s3Family2Title": "Poisson goal rates",
  "hiw.s3Family2Desc": "Expected attacking and defensive rates for each team based on recent matches.",
  "hiw.s3Family3Title": "Head-to-head",
  "hiw.s3Family3Desc": "Historical meetings between the two teams, home and away.",
  "hiw.s3Family4Title": "Bookmaker odds",
  "hiw.s3Family4Desc": "Pre-match odds from major bookmakers via The Odds API.",
  "hiw.s3Family5Title": "League standings",
  "hiw.s3Family5Desc": "Current league position, points, goal difference and recent form.",
  "hiw.s3Family6Title": "Match context",
  "hiw.s3Family6Desc": "Home/away status, scheduling and fixture details.",

  /* Stage 4 - Model ensemble */
  "hiw.s4Badge": "Stage 04 · Model ensemble",
  "hiw.s4Title": "Three independent models. One honest probability.",
  "hiw.s4Lead":
    "A single model will always have blind spots. So we run three different statistical approaches and combine their predictions with weighted averaging.",
  "hiw.s4P1":
    "Each model captures a different aspect of match dynamics. Their predictions are combined into a single set of win/draw/loss probabilities plus a confidence score for every upcoming match.",
  "hiw.s4Model1Name": "Elo Rating Model",
  "hiw.s4Model1Desc":
    "A dynamic team strength rating that updates after every result. Converts the rating gap between two teams into win probabilities.",
  "hiw.s4Model2Name": "Poisson Goal Model",
  "hiw.s4Model2Desc":
    "Estimates expected attacking and defensive goal rates for each team and integrates over all possible scorelines to produce match outcome probabilities.",
  "hiw.s4Model3Name": "Logistic Regression",
  "hiw.s4Model3Desc":
    "A statistical classifier that uses multiple match features - form, standings, home advantage - to predict match outcomes directly.",
  "hiw.s4BlendTitle": "Weighted averaging",
  "hiw.s4BlendDesc":
    "The three probabilities are combined through weighted averaging. The current weights (Elo 1.0, Poisson 1.5, Logistic 1.0) give slightly more influence to the Poisson model.",

  /* Stage 5 - Value detection */
  "hiw.s5Badge": "Stage 05 · Value detection",
  "hiw.s5Title": "We only publish picks where our edge survives the real world.",
  "hiw.s5Lead":
    "Being right isn't enough. A pick only becomes a pick when our probability suggests value compared to the available odds.",
  "hiw.s5P1":
    "We compare our ensemble probabilities to bookmaker odds fetched from The Odds API. Our Strategy Lab filters predictions using rules validated through walk-forward backtesting - such as requiring high home-win probability or low draw probability.",
  "hiw.s5P2":
    "Currently 3 strategies have passed statistical validation with positive backtested ROI over 90 days. But these are backtested results on a limited sample - real-world performance will vary. We are honest about that.",
  "hiw.s5FormulaTitle": "The check every pick has to pass",
  "hiw.s5FormulaLine1": "Model probability × Best odds",
  "hiw.s5FormulaLine2": "−  expected slippage",
  "hiw.s5FormulaLine3": "−  bookmaker margin",
  "hiw.s5FormulaLine4": "=  real edge",
  "hiw.s5FormulaFoot":
    "If this number isn't clearly above zero, the pick never leaves the lab.",

  /* Stage 6 - Publishing */
  "hiw.s6Badge": "Stage 06 · Publishing & grading",
  "hiw.s6Title": "Every pick is timestamped, shipped and publicly gradable.",
  "hiw.s6Lead":
    "This is where most prediction sites get vague. This is where we get loud.",
  "hiw.s6P1":
    "The moment a pick is generated, it is timestamped, signed, and published to your dashboard and our public ledger at the same second. You and a regulator see the exact same record.",
  "hiw.s6P2":
    "Once the match ends, every pick is graded automatically against the official result feed. Wins, losses and pushes are all recorded. Losing picks stay on the ledger forever - because a track record that only shows winners isn't a track record, it's marketing.",
  "hiw.s6Point1Title": "Same-second publishing",
  "hiw.s6Point1Desc":
    "Subscribers and the public ledger are updated simultaneously - no back-dating possible.",
  "hiw.s6Point2Title": "Automatic grading",
  "hiw.s6Point2Desc":
    "Results are scored from the official feed, not by a human who might look the other way.",
  "hiw.s6Point3Title": "Nothing is deleted",
  "hiw.s6Point3Desc":
    "Losing picks are permanent. The ledger is append-only by design.",

  /* Stage 7 - Continuous evaluation */
  "hiw.s7Badge": "Stage 07 · Continuous evaluation",
  "hiw.s7Title": "Every prediction is graded against the real result.",
  "hiw.s7Lead":
    "Predictions mean nothing if you don't check them. Our system automatically evaluates every prediction once the match is finished.",
  "hiw.s7P1":
    "Every 6 hours, after results are synced, the system scores all finished predictions. Each pick is evaluated with Brier score and log-loss metrics, and marked as correct or incorrect. This lets us track real accuracy over time.",
  "hiw.s7P2":
    "Current 3-way accuracy (home/draw/away) is around 50% - above the 33% random baseline, but not extraordinary. We publish all results, wins and losses alike, so you can verify the track record yourself.",
  "hiw.s7Bullet1": "6-hour evaluation cycle",
  "hiw.s7Bullet2": "Brier score and log-loss tracking",
  "hiw.s7Bullet3": "All predictions graded automatically",
  "hiw.s7Bullet4": "Wins and losses both published permanently",

  /* Trust reinforcement / proof */
  "hiw.proofBadge": "Why this matters",
  "hiw.proofTitle": "The reason our predictions actually hold up.",
  "hiw.proofSubtitle":
    "Every choice in this pipeline exists for one reason: to give you an honest, data-driven probability - not a guess.",
  "hiw.proof1Title": "No hindsight bias",
  "hiw.proof1Desc":
    "Models only see data available before kick-off. Predictions are generated and timestamped before the match starts.",
  "hiw.proof2Title": "Ensemble, not one-trick-pony",
  "hiw.proof2Desc":
    "Three independent models (Elo, Poisson, Logistic) cross-check each other. One blind spot can't poison the whole prediction.",
  "hiw.proof3Title": "Backtested strategies",
  "hiw.proof3Desc":
    "Strategy Lab filters are validated with walk-forward backtesting and bootstrap confidence intervals before being published.",
  "hiw.proof4Title": "Full transparency",
  "hiw.proof4Desc":
    "You can verify every prediction we've published. Wins and losses. Current 3-way accuracy is around 50%.",
  "hiw.proof5Title": "Evaluated every 6 hours",
  "hiw.proof5Desc":
    "Every finished match is scored automatically. Brier score and log-loss track calibration over time.",
  "hiw.proof6Title": "Built by people who ship",
  "hiw.proof6Desc":
    "A two-person team of football fanatics with an ICT background. Every line of this pipeline is hand-rolled, not bolted together from plugins.",

  /* Objection section - FAQ */
  "hiw.faqBadge": "Honest answers",
  "hiw.faqTitle": "The questions every serious analyst asks us.",
  "hiw.faqSubtitle":
    "If you've tried a tipster site before, you've probably been burned. Here's exactly why BetsPlug is different.",
  "hiw.faq1Q": "How accurate are your predictions?",
  "hiw.faq1A":
    "Our 3-way match predictions (home/draw/away) hit around 50% accuracy. That's above the 33% random baseline, but we're honest - it's not a magic number. Every prediction is timestamped before kick-off and graded automatically after the match, so you can verify the track record yourself.",
  "hiw.faq2Q": "What happens on a losing streak?",
  "hiw.faq2A":
    "Losing predictions stay visible permanently. We publish them just as openly as the winners. Our Strategy Lab strategies were backtested on a 90-day sample, so we expect variance. Losing streaks happen - that's football.",
  "hiw.faq3Q": "Why not just use one really smart model?",
  "hiw.faq3A":
    "Because every model has blind spots. Our three models - Elo ratings, Poisson goal model and Logistic regression - each capture different patterns. The ensemble with weighted averaging consistently outperforms any single member.",
  "hiw.faq4Q": "Can I actually profit from these predictions?",
  "hiw.faq4A":
    "Our backtested strategies show positive ROI over 90 days, but backtesting is not a guarantee. Real-world performance depends on odds you get, timing, and variance. We provide the data and analysis - the rest is your call.",
  "hiw.faq5Q": "Which football leagues do you cover?",
  "hiw.faq5A":
    "We cover 70+ football competitions worldwide, including the Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie and all major UEFA competitions. We're always adding more leagues as our models mature.",
  "hiw.faq6Q": "Is this gambling advice?",
  "hiw.faq6A":
    "No. BetsPlug is a football analytics platform. We publish probabilities, confidence scores and a verifiable track record. What you do with that information is entirely your decision.",

  /* Final CTA */
  "hiw.ctaBadge": "Ready to see it in action?",
  "hiw.ctaTitle": "Stop guessing. Start trusting the pipeline.",
  "hiw.ctaSubtitle":
    "Now you know exactly how the pipeline works. See the predictions it produces - live, timestamped and ready to verify.",
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
    "Switch to yearly billing and save 20% - that's {amount} off every year.",
  "checkout.yearlySaving": "You're saving {amount} / year",

  /* Upsells */
  "checkout.upsellsTitle": "Supercharge your subscription",
  "checkout.upsellsSubtitle":
    "Optional extras that most members add to get the full edge. Cancel any add-on independently at any time.",
  "checkout.upsell1Title": "VIP Telegram Alerts",
  "checkout.upsell1Desc":
    "Get every pick pushed straight to your Telegram - no need to log in, every edge the moment it drops.",
  "checkout.upsell1Badge": "Most popular",
  "checkout.upsell2Title": "Weekly Deep-Dive Report",
  "checkout.upsell2Desc":
    "Every Monday: a 20-page PDF breaking down the past week's ROI, model drift and upcoming edges.",
  "checkout.upsell3Title": "Priority 1-on-1 Support",
  "checkout.upsell3Desc":
    "Skip the queue with a direct line to our analysts - replies within 2 hours, 7 days a week.",
  "checkout.upsell4Title": "Tip of the Day Access",
  "checkout.upsell4Desc":
    "One high-confidence pick delivered to your inbox every single day - our single highest-edge bet for the next 24 hours.",
  "checkout.upsellIncluded": "Included with Platinum",
  "checkout.upsellPerMonth": "/mo",

  /* Trial picker */
  "checkout.trialSectionTitle": "How do you want to start?",
  "checkout.trialSectionSubtitle":
    "Try BetsPlug risk-free or skip the trial and get full access immediately.",
  "checkout.trialOption1Title": "7-day free trial",
  "checkout.trialOption1Desc":
    "Full access for 7 days. Nothing is charged today — Stripe just verifies your card. First charge on {date} if you don't cancel.",
  "checkout.trialOption1Badge": "Recommended",
  "checkout.trialOption2Title": "Subscribe now",
  "checkout.trialOption2Desc":
    "Charged today, no trial period. Ideal if you already know our track record.",
  "checkout.trialPausedNote":
    "Cancel during the trial and your account is paused - not deleted. You can resume any time.",
  "checkout.trialBadge": "7-day free trial active",
  "checkout.trialDueToday": "€0.00 today",
  "checkout.trialFirstCharge": "First charge on {date}",
  "checkout.trialNotAvailable":
    "The free trial is only available on monthly and yearly plans.",
  "checkout.trialPaymentNote":
    "Nothing is charged today — Stripe verifies your card so we can start your subscription on {date}. Cancel any time before then and you won't be billed.",
  "checkout.submitTrial": "Start my 7-day free trial",

  "checkout.freeTrial": "14-day free trial",
  "checkout.trialNote":
    "Nothing is charged today — Stripe verifies your card so we can start your subscription. Cancel any time during the trial.",
  "checkout.couponQuestion": "Have a coupon?",
  "checkout.couponPlaceholder": "Enter code",
  "checkout.couponApply": "Apply",
  "checkout.summaryIncluded": "What's included",
  "checkout.perMonth": "/month",
  "checkout.perYear": "/year",

  /* Step 1 - Account */
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

  /* Step 2 - Billing */
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

  /* Step 3 - Payment */
  "checkout.paymentTitle": "Payment",
  "checkout.paymentSubtitle":
    "Review your order and proceed to our secure payment page.",
  "checkout.stripeRedirectTitle": "Secure payment via Stripe",
  "checkout.stripeRedirectDesc":
    "After clicking the button below, you will be redirected to Stripe's secure checkout page to complete your payment. We accept all major credit cards, debit cards, and PayPal.",

  /* Terms & action row */
  "checkout.agreeTerms": "I agree to the",
  "checkout.termsLink": "Terms & Conditions",
  "checkout.and": "and",
  "checkout.privacyLink": "Privacy Policy",
  "checkout.next": "Continue",
  "checkout.back": "Back",
  "checkout.submit": "Start my subscription",
  "checkout.processing": "Processing…",
  "checkout.weAccept": "We accept",

  /* Footer */
  "checkout.footer.secure": "256-bit SSL encrypted checkout",
  "checkout.footer.guarantee": "14-day money-back guarantee",
  "checkout.footer.support": "Need help? support@betsplug.com",
  "checkout.footer.copy": "© {year} BetsPlug. All rights reserved.",

  /* Success */
  "checkout.successTitle": "Welcome to BetsPlug!",
  "checkout.successBody":
    "Your subscription is now active! You will be redirected to your dashboard.",
  "checkout.successCta": "Go to dashboard",

  /* ─── Welcome / thank-you page ─────────────────────────── */
  "welcome.meta.title": "Welcome aboard - You're officially a BetsPlug member",
  "welcome.meta.description":
    "Your BetsPlug membership is active. Log in to see today's picks, track your ROI and start winning smarter - we've got your back.",

  "welcome.badge": "You're in.",
  "welcome.title": "Welcome to the inside circle.",
  "welcome.titleHighlight": "This is where it starts.",
  "welcome.subtitle":
    "No more chasing tipsters, no more second-guessing. You're now part of a community that wins with data, discipline and a little bit of swagger. Let's make this the year you stop gambling - and start investing.",

  "welcome.trialTitle": "Your 7-day free trial is active",
  "welcome.trialBody":
    "You won't be charged today. Cancel anytime in the next 7 days and your account quietly pauses - no questions, no pressure.",
  "welcome.paidTitle": "Your membership is active",
  "welcome.paidBody":
    "Your account is fully unlocked. Every pick, every stat, every edge - it's all waiting for you inside the dashboard.",

  "welcome.ctaPrimary": "Log in to your dashboard",
  "welcome.ctaSecondary": "Back to homepage",
  "welcome.emailHint":
    "A confirmation email is on its way. Check your inbox (and spam, just in case).",

  "welcome.nextTitle": "What happens next",
  "welcome.next1Title": "Log in with your new account",
  "welcome.next1Body":
    "Use the email and password you just created to unlock the member dashboard.",
  "welcome.next2Title": "See today's picks",
  "welcome.next2Body":
    "Curated, data-driven selections land every morning. No fluff, just value.",
  "welcome.next3Title": "Track your ROI",
  "welcome.next3Body":
    "Watch the numbers go up with our live bankroll tracker and weekly performance reports.",

  "welcome.statMembers": "active members",
  "welcome.statRoi": "average monthly ROI",
  "welcome.statPicks": "picks posted in the last 30 days",

  "welcome.quote":
    "\"Finally a service that treats betting like a craft, not a lottery ticket. BetsPlug turned my weekends around.\"",
  "welcome.quoteAuthor": " - Thomas R., member since 2024",

  "welcome.footerNote":
    "Questions? Reach us at support@betsplug.com - a real human will answer.",

  /* Quickstart timeline */
  "welcome.quickstartEyebrow": "Quickstart",
  "welcome.quickstartTitle": "Your first 10 minutes with BetsPlug",
  "welcome.quickstartSubtitle":
    "Five simple steps from here to your first data-backed pick. Follow the path - we'll guide you the whole way.",
  "welcome.quickstartDuration": "≈ 10 minutes total",

  "welcome.qs1Title": "Confirm your email",
  "welcome.qs1Body":
    "Open the confirmation email we just sent you and tap the green button to verify your account.",
  "welcome.qs1Duration": "1 min",

  "welcome.qs2Title": "Log in to your dashboard",
  "welcome.qs2Body":
    "Use the email and password you just created. Enable \"Remember this device\" for instant access next time.",
  "welcome.qs2Duration": "30 sec",

  "welcome.qs3Title": "Set up your bankroll",
  "welcome.qs3Body":
    "Tell us your starting budget and unit size. We'll calculate stake recommendations that match your risk profile.",
  "welcome.qs3Duration": "2 min",

  "welcome.qs4Title": "See today's picks",
  "welcome.qs4Body":
    "Browse the daily selections, filter by league or odds range, and read the data-driven reasoning behind every tip.",
  "welcome.qs4Duration": "3 min",

  "welcome.qs5Title": "Place your first bet",
  "welcome.qs5Body":
    "Pick the tip that fits you, place the wager at your sportsbook, then mark it in your tracker. That's it - you're live.",
  "welcome.qs5Duration": "3 min",

  /* Dashboard tour */
  "welcome.tourEyebrow": "Dashboard tour",
  "welcome.tourTitle": "Where to find what, once you're inside",
  "welcome.tourSubtitle":
    "A quick lay of the land. The dashboard has everything organised into 6 simple areas - here's what each one does so you feel at home from minute one.",

  "welcome.tour1Title": "Today's Picks",
  "welcome.tour1Body":
    "The first thing you see after login. Every data-backed pick of the day, sorted by confidence score, with full reasoning, odds and recommended stake.",
  "welcome.tour1Where": "Sidebar → Picks",

  "welcome.tour2Title": "Bankroll Tracker",
  "welcome.tour2Body":
    "Your personal P&L. Set a starting bankroll, log your bets with one click and watch your ROI climb in real-time charts.",
  "welcome.tour2Where": "Sidebar → Bankroll",

  "welcome.tour3Title": "Track Record",
  "welcome.tour3Body":
    "The full, unfiltered history of every pick we've ever posted. Filter by league, market, tipster or date range - nothing is hidden.",
  "welcome.tour3Where": "Sidebar → Track Record",

  "welcome.tour4Title": "Live Matches",
  "welcome.tour4Body":
    "Real-time odds, form and in-play alerts for every game we're watching. Spot value as it happens, not after the final whistle.",
  "welcome.tour4Where": "Sidebar → Live",

  "welcome.tour5Title": "Community & Telegram",
  "welcome.tour5Body":
    "Chat with other members, ask the experts and get instant pick notifications the moment they're posted - even when you're off the site.",
  "welcome.tour5Where": "Top bar → Community",

  "welcome.tour6Title": "Account & Billing",
  "welcome.tour6Body":
    "Manage your plan, update payment details, switch billing cycle, download invoices or cancel any time - all in one place.",
  "welcome.tour6Where": "Top-right avatar → Settings",

  "welcome.tourProTipTitle": "Pro tip",
  "welcome.tourProTipBody":
    "Press ⌘K (or Ctrl+K on Windows) anywhere in the dashboard to jump straight to any section in two keystrokes.",

  /* ─── Login page ──────────────────────────────────────── */
  "login.meta.title": "Log In · BetsPlug",
  "login.meta.description":
    "Log in to your BetsPlug account to see today's picks, track your ROI and manage your subscription.",

  "login.badge": "Members area",
  "login.title": "Welcome back.",
  "login.titleHighlight": "Let's get that edge.",
  "login.subtitle":
    "Sign in to see today's picks, your live bankroll tracker and the latest wins from the community.",

  "login.email": "Email address",
  "login.emailPh": "you@example.com",
  "login.emailError": "Enter a valid email address",

  "login.password": "Password",
  "login.passwordPh": "Your password",
  "login.passwordError": "Password is required",
  "login.showPassword": "Show password",
  "login.hidePassword": "Hide password",

  "login.rememberDevice": "Remember this device",
  "login.rememberHint":
    "Stay signed in on this device for 30 days. Don't enable on shared computers.",

  "login.forgot": "Forgot password?",
  "login.submit": "Log in",
  "login.submitting": "Signing you in…",

  "login.orDivider": "or continue with",
  "login.google": "Continue with Google",
  "login.apple": "Continue with Apple",

  "login.noAccount": "Don't have an account yet?",
  "login.createAccount": "Start your free trial",

  "login.errorTitle": "We couldn't sign you in",
  "login.errorGeneric":
    "The email or password you entered is incorrect. Double-check and try again.",

  "login.trust1": "256-bit SSL encrypted",
  "login.trust2": "GDPR-compliant",
  "login.trust3": "Cancel anytime",

  /* Dashboard Preview (homepage) */
  "dashPrev.badge": "Your command center",
  "dashPrev.titleA": "Every premium feature,",
  "dashPrev.titleHighlight": "one click away",
  "dashPrev.titleB": ".",
  "dashPrev.subtitle":
    "Log in and step straight into your personal BetsPlug dashboard - a clean, distraction-free command center where every daily pick, model insight, live match and historical result lives in a single view. No spreadsheets, no guesswork, no jumping between tabs.",
  "dashPrev.feature1Title": "Daily picks at a glance",
  "dashPrev.feature1Desc":
    "See today's highest-confidence predictions the moment you sign in - sorted by edge, confidence and kick-off time.",
  "dashPrev.feature2Title": "Live model accuracy",
  "dashPrev.feature2Desc":
    "Real-time accuracy per league and per model. Watch your edge update as results come in.",
  "dashPrev.feature3Title": "Transparent track record",
  "dashPrev.feature3Desc":
    "Every pick we've ever made - wins, losses and ROI - logged publicly and filterable by date or strategy.",
  "dashPrev.feature4Title": "Strategy Lab & alerts",
  "dashPrev.feature4Desc":
    "Build custom filters, bookmark your favorite leagues and get notified the second a premium pick drops.",
  "dashPrev.cta": "Explore the dashboard",
  "dashPrev.mockTitle": "Dashboard",
  "dashPrev.mockSubtitle": "Model performance overview and real-time system status",
  "dashPrev.mockLive": "Live data",
  "dashPrev.mockKpi1Label": "Total forecasts",
  "dashPrev.mockKpi2Label": "Overall accuracy",
  "dashPrev.mockKpi2Note": "vs last period",
  "dashPrev.mockKpi3Label": "Avg edge",
  "dashPrev.mockKpi3Note": "higher is better",
  "dashPrev.mockKpi4Label": "Avg confidence",
  "dashPrev.mockKpi4Note": "Model certainty",
  "dashPrev.mockNavDashboard": "Dashboard",
  "dashPrev.mockNavPredictions": "Predictions",
  "dashPrev.mockNavResults": "Results",
  "dashPrev.mockNavBet": "Bet of the day",
  "dashPrev.mockNavTrack": "Track record",
  "dashPrev.mockNavLive": "Live matches",
  "dashPrev.mockChartTitle": "Model performance trend",
  "dashPrev.mockChartSub": "Rolling accuracy over time",
  "dashPrev.mockAccuracyTitle": "Accuracy by league",
  "dashPrev.mockAccuracySub": "Prediction accuracy segmented by league",

  /* ── Match Predictions (public teaser) ─────────────────── */
  "matchPred.metaTitle": "AI Match Predictions · Free Football Picks · BetsPlug",
  "matchPred.metaDesc":
    "Preview 3 free AI-powered match predictions with win probabilities and confidence scores. Unlock the full slate of upcoming games with a BetsPlug subscription.",
  "matchPred.eyebrow": "Free preview",
  "matchPred.title": "AI match predictions for upcoming games",
  "matchPred.subtitle":
    "A preview of the matches our Ensemble model is crunching right now. See 3 full predictions for free - unlock the rest with a trial.",
  "matchPred.trust1": "4-model Ensemble",
  "matchPred.trust2": "Live probabilities",
  "matchPred.trust3": "Public track record",
  "matchPred.statFree": "Free previews",
  "matchPred.statUpcoming": "Upcoming matches",
  "matchPred.statLocked": "Locked predictions",
  "matchPred.statAvgConf": "Avg confidence",
  "matchPred.freeHeading": "Your 3 free predictions",
  "matchPred.freeSub":
    "Full win probabilities, confidence scores and model details - on the house.",
  "matchPred.lockedHeading": "Premium match pool",
  "matchPred.lockedSub":
    "These matches are reserved for members. Unlock every pick, every league, every day.",
  "matchPred.bannerBadge": "Members only",
  "matchPred.bannerTitle": "Unlock every game",
  "matchPred.bannerDesc":
    "Join BetsPlug to see all upcoming predictions across the top leagues - with confidence scores, live updates and our full public track record.",
  "matchPred.bannerBullet1": "Unlimited daily AI predictions",
  "matchPred.bannerBullet2": "All 4 models + Ensemble output",
  "matchPred.bannerBullet3": "Live probability tracking",
  "matchPred.bannerBullet4": "Cancel anytime - 14-day refund",
  "matchPred.bannerCta": "Unlock all games",
  "matchPred.bannerCtaSecondary": "See pricing",
  "matchPred.bannerNote": "Just €0.01 activates your 7-day full-access trial.",
  "matchPred.ctaFinalTitle": "Stop guessing. Start deciding with data.",
  "matchPred.ctaFinalDesc":
    "Every upcoming match, every model, every confidence score - unlocked in seconds. Join the bettors who trust transparent analytics.",
  "matchPred.ctaFinalButton": "Start your free trial",
  "matchPred.ctaFinalSecondary": "Browse plans",
  "matchPred.loadingTitle": "Loading upcoming matches…",
  "matchPred.emptyTitle": "No upcoming matches in the window",
  "matchPred.emptyDesc":
    "New fixtures are scheduled every morning. Check back shortly or explore our track record.",
  "matchPred.emptyCta": "View track record",
  "matchPred.errorTitle": "Couldn't load live fixtures",
  "matchPred.errorDesc":
    "Our fixture feed is temporarily unavailable. The full dashboard still works for members.",
  "matchPred.refresh": "Refresh",
  "matchPred.lockedLabel": "Locked",
  "matchPred.confidenceLabel": "Confidence",
  "matchPred.winProbLabel": "Win probability",
  "matchPred.kickoffLabel": "Kickoff",
  "matchPred.unlockThis": "Unlock this pick",

  /* B2B Partnerships */
  "b2b.badge": "Business Partnerships",
  "b2b.titleA": "Partner with BetsPlug",
  "b2b.titleB": "for smarter football analytics",
  "b2b.subtitle":
    "We collaborate with businesses across the football analytics ecosystem. From data licensing to white-label solutions \u2014 let\u2019s build something together.",
  "b2b.partnershipsBadge": "Partnership models",
  "b2b.partnershipsTitle": "How we work together",
  "b2b.partnershipsSubtitle":
    "Whether you need raw data, a turnkey prediction engine, or a revenue-sharing model \u2014 we have a partnership track for you.",
  "b2b.dataLicensing": "Data Licensing",
  "b2b.dataLicensingDesc":
    "Access our AI predictions, Elo ratings, and match data through a robust API. Perfect for sportsbooks, media companies, and analytics platforms.",
  "b2b.whiteLabel": "White-Label Solutions",
  "b2b.whiteLabelDesc":
    "Integrate BetsPlug\u2019s prediction engine into your own platform. Custom branding, dedicated support, and flexible pricing.",
  "b2b.affiliate": "Affiliate Program",
  "b2b.affiliateDesc":
    "Earn competitive commissions by referring users to BetsPlug. We provide marketing materials, tracking, and timely payouts.",
  "b2b.media": "Media & Content",
  "b2b.mediaDesc":
    "Collaborate on football analytics content, research papers, and data journalism. Perfect for sports media and publishers.",
  "b2b.whyPartner": "Why partner with us",
  "b2b.whyPartnerTitle": "Built for scale, proven in public",
  "b2b.usp1": "AI models combined into one ensemble",
  "b2b.usp2": "Football leagues covered",
  "b2b.usp3": "Active analysts on the platform",
  "b2b.usp4": "Public transparency on results",
  "b2b.contactTitle": "Let\u2019s talk business",
  "b2b.contactSubtitle":
    "Interested in a partnership? Reach out to our business team and we\u2019ll get back to you within 24 hours.",
  "b2b.contactCta": "Contact Business Team",
  "b2b.email": "business@betsplug.com",

  /* ── Dashboard navigation ─────────────────────────────────── */
  "nav.dashboard": "Dashboard",
  "nav.search": "Search",
  "nav.live_matches": "Live Matches",
  "nav.bet_of_the_day": "Pick of the Day",
  "nav.strategy_lab": "Strategy Lab",
  "nav.trackrecord": "Trackrecord",
  "nav.reports": "Reports",
  "nav.admin": "Admin",
  "nav.settings": "Settings",
  "nav.deals": "Deals",
  "nav.jouwRoute": "Your Route",
  "nav.weekly_report": "Weekly Report",
  "nav.results": "Results",

  /* ── Dashboard page titles ────────────────────────────────── */
  "page.dashboard": "Dashboard",
  "page.search": "Search",
  "page.live_matches": "Live Matches",
  "page.predictions": "Predictions",
  "page.strategy_lab": "Strategy Lab",
  "page.trackrecord": "Trackrecord",
  "page.reports": "Reports",
  "page.admin": "Admin Panel",
  "page.settings": "Settings",
  "page.deals": "Deals",

  /* ── Dashboard common labels ──────────────────────────────── */
  "common.dashboard": "Dashboard",
  "common.search": "Search",
  "common.live_matches": "Live Matches",
  "common.predictions": "Predictions",
  "common.strategy_lab": "Strategy Lab",
  "common.trackrecord": "Trackrecord",
  "common.reports": "Reports",
  "common.admin": "Admin",
  "common.settings": "Settings",
  "common.deals": "Deals",
  "common.win": "Win",
  "common.loss": "Loss",
  "common.draw": "Draw",
  "common.home": "Home",
  "common.away": "Away",
  "common.confidence": "Confidence",
  "common.probability": "Probability",
  "common.accuracy": "Accuracy",
  "common.loading": "Loading...",
  "common.error": "Error",
  "common.no_data": "No data available",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
  "common.close": "Close",
  "common.back": "Back",
  "common.next": "Next",
  "common.submit": "Submit",
  "common.refresh": "Refresh",
  "common.export": "Export",
  "common.filter": "Filter",
  "common.sort": "Sort",
  "common.search_placeholder": "Search teams, matches, leagues...",
  "common.language": "Language",
  "common.notifications": "Notifications",
  "common.sign_out": "Sign out",
  "common.all_systems": "All systems operational",

  /* ── Dashboard phrases ────────────────────────────────────── */
  "phrase.simulation_disclaimer": "Results shown are based on simulated model outputs.",
  "phrase.educational_only": "For analytical & educational purposes only.",
  "phrase.no_financial_advice": "Not financial advice.",
  "phrase.live_data": "Live data",
  "phrase.last_updated": "Last updated",
  "phrase.view_all": "View all",
  "phrase.see_details": "See details",
  "phrase.select_language": "Select language",

  /* ── Sidebar sections ────────────────────────────────────── */
  "sidebar.gettingStarted": "Getting Started",
  "sidebar.strategiesAndPicks": "Strategies & Picks",
  "sidebar.performance": "Performance",
  "sidebar.system": "System",

  /* ── Header ──────────────────────────────────────────────── */
  "header.live": "Live",
  "header.searchPlaceholder": "Search teams, matches, leagues...",
  "header.notifications": "Notifications",
  "header.noNotifications": "No new notifications",
  "header.myAccount": "My Account",
  "header.favorites": "Favorites",
  "header.subscription": "Subscription",
  "header.settings": "Settings",
  "header.adminPanel": "Admin Panel",
  "header.logout": "Logout",
  /* ── Strategy page ───────────────────────────────────── */
  "strategy.title": "Strategy Lab",
  "strategy.subtitle": "Explore and compare quantitative betting strategies powered by our AI model.",
  "strategy.cardCategory": "Football · Match Result",
  "strategy.profitable": "Profitable",
  "strategy.unprofitable": "Unprofitable",
  "strategy.loading": "Loading...",
  "strategy.winRate": "Win Rate",
  "strategy.winRateTooltip": "Percentage of picks that were correct",
  "strategy.roiTooltip": "Return on Investment - profit/loss as percentage of total staked",
  "strategy.sampleSize": "Sample Size",
  "strategy.sampleSizeTooltip": "Total number of evaluated picks for this strategy",
  "strategy.maxDrawdown": "Max Drawdown",
  "strategy.maxDrawdownTooltip": "Largest peak-to-trough loss in units (1 unit = 1 stake). E.g., 4.3u means at worst you'd be down 4.3 stakes",
  "strategy.howItWorksCard": "How it works",
  "strategy.viewAllPicks": "View All Picks & Results",
  "strategy.readyToBacktest": "Ready to backtest",
  "strategy.awaitingData": "Awaiting data",
  "strategy.howItWorks": "How Our System Works",
  "strategy.step1Title": "Our AI Model Analyzes",
  "strategy.step1Desc": "Our ensemble combines 3 proven models - Elo ratings (team strength), Poisson distribution (goal prediction), and Logistic regression (pattern recognition) - to calculate win/draw/loss probabilities for every upcoming match.",
  "strategy.step2Title": "A Strategy Filters",
  "strategy.step2Desc": "A strategy is a set of rules that selects only the best opportunities from the model's output. For example: \"only follow picks where the home team has > 60% predicted win probability\" or \"only back matches with low draw probability\". Each strategy has a different risk/reward profile.",
  "strategy.step3Title": "You Follow the Picks",
  "strategy.step3Desc": "Pick a strategy below, then click \"View All Picks & Results\" to see which upcoming matches it recommends. Each strategy shows its historical win rate and ROI so you can choose based on real backtested data.",
  "strategy.profitableStrategies": "Profitable Strategies",
  "strategy.profitableStrategiesDesc": "Strategies with a positive ROI based on live data",
  "strategy.liveData": "Live data",
  "strategy.archivedNotProfitable": "Archived - Not Profitable",
  "strategy.realPredictionData": "Real Prediction Data (from database)",
  "strategy.totalPredictions": "Total Predictions",
  "strategy.accuracy": "Accuracy",
  "strategy.brierScore": "Brier Score",
  "strategy.avgConfidence": "Avg Confidence",
  "strategy.realPredictionDisclaimer": "These figures are real model outputs from the database. They reflect prediction accuracy metrics only - not betting P/L, which requires backtest analysis.",

  /* ── Route page ───────────────────────────────────── */
  "route.title": "Your Route",
  "route.subtitle": "Choose your path to get the most out of BetsPlug. Each route leads to smarter picks - pick the one that fits your style.",
  "route.path1Title": "Strategy Follower",
  "route.path1Subtitle": "For serious analysts",
  "route.path1Step1Label": "Go to Strategy Lab",
  "route.path1Step1Desc": "Pick a proven strategy",
  "route.path1Step2Label": "Check Today's Picks",
  "route.path1Step2Desc": "See which matches your strategy recommends",
  "route.path1Step3Label": "Track Results",
  "route.path1Step3Desc": "Monitor your strategy's performance",
  "route.path2Title": "Quick Pick",
  "route.path2Subtitle": "For daily insights",
  "route.path2Step1Label": "Check Pick of the Day",
  "route.path2Step1Desc": "Our AI's #1 recommendation",
  "route.path2Step2Label": "See the analysis",
  "route.path2Step2Desc": "Probabilities, reasoning, key factors",
  "route.path2Step3Label": "Track Results",
  "route.path2Step3Desc": "Was it correct?",
  "route.path3Title": "Explorer",
  "route.path3Subtitle": "Browse everything",
  "route.path3Step1Label": "Browse Predictions",
  "route.path3Step1Desc": "All upcoming matches with AI analysis",
  "route.path3Step2Label": "Click View Details",
  "route.path3Step2Desc": "Deep dive into any match",
  "route.path3Step3Label": "Make your own picks",
  "route.path3Step3Desc": "Compare with our model",
  "route.startThisPath": "Start this path",
  "route.commonForAllPaths": "Common for all paths",
  "route.commonTrackResults": "Track Results",
  "route.commonTrackResultsDesc": "See outcomes of all predictions",
  "route.commonWeeklyReport": "Weekly Report",
  "route.commonWeeklyReportDesc": "Performance summary",
  "route.commonTrackrecord": "Trackrecord",
  "route.commonTrackrecordDesc": "Long-term accuracy data",

  /* ── Dash page ───────────────────────────────────── */
  "dash.title": "Dashboard",
  "dash.subtitle": "Model performance overview and real-time system status",
  "dash.liveData": "Live data",
  "dash.totalForecasts": "Total Forecasts",
  "dash.allTime": "All time",
  "dash.totalForecastsTooltip": "Total number of predictions our AI model has generated across all leagues",
  "dash.overallAccuracy": "Overall Accuracy",
  "dash.vsLastPeriod": "vs last period",
  "dash.overallAccuracyTooltip": "Percentage of predictions where our model correctly predicted the match outcome (home/draw/away)",
  "dash.avgBrierScore": "Avg Brier Score",
  "dash.lowerIsBetter": "Lower is better",
  "dash.avgBrierScoreTooltip": "Model calibration metric (0-1, lower is better). Measures how well our probabilities match actual outcomes. Below 0.25 is good.",
  "dash.avgConfidence": "Avg Confidence",
  "dash.modelCertainty": "Model certainty",
  "dash.avgConfidenceTooltip": "Average confidence level across all predictions. Higher means the model was more certain about its picks.",
  "dash.recentPredictions": "Recent Predictions",
  "dash.recentPredictionsDesc": "Latest model outputs with evaluation",
  "dash.lastTen": "Last 10",
  "dash.thMatch": "Match",
  "dash.thDate": "Date",
  "dash.thPredicted": "Predicted",
  "dash.thConfidence": "Confidence",
  "dash.thResult": "Result",
  "dash.noPredictions": "No predictions recorded yet.",
  "dash.pending": "Pending",
  "dash.correct": "Correct",
  "dash.incorrect": "Incorrect",
  "dash.accuracyByLeague": "Accuracy by League",
  "dash.accuracyByLeagueDesc": "Prediction accuracy segmented by league",
  "dash.noSegmentData": "No segment data available yet.",
  "dash.modelPerformanceTrend": "Model Performance Trend",
  "dash.modelPerformanceTrendDesc": "Rolling accuracy over time (monthly)",
  "dash.noMonthlyData": "No monthly data available yet.",
  "dash.systemStatus": "System Status",
  "dash.systemStatusDesc": "Data source health and last sync times",
  "dash.healthy": "healthy",
  "dash.noDataSources": "No data sources configured.",

  /* ── Botd page ───────────────────────────────────── */
  "botd.title": "Pick of the Day",
  "botd.subtitle": "Our AI's highest-conviction pick for today",
  "botd.subtitleFuture": "Our AI's highest-conviction pick",
  "botd.premiumFeature": "Premium Feature",
  "botd.failedToLoad": "Failed to load Pick of the Day",
  "botd.failedToLoadDesc": "Could not reach the prediction API. Please try refreshing.",
  "botd.noPickAvailable": "No Pick Available",
  "botd.noPickAvailableDesc": "Our AI hasn't found a match meeting the minimum confidence threshold (65%) for the next few days. Check back as more matches get analysed.",
  "botd.futureDateBanner": "No high-confidence pick for today — showing the best pick for",
  "botd.draw": "Draw",
  "botd.predicted": "Predicted",
  "botd.modelConfidence": "Model Confidence",
  "botd.predictedOutcome": "Predicted Outcome",
  "botd.modelReasoning": "Model Reasoning",
  "botd.valueDetection": "Value Detection",
  "botd.valueDetectionDesc": "This pick was selected because our ensemble model identified a significant edge in the probability vs market odds.",
  "botd.modelsAgree": "4 Models Agree",
  "botd.modelsAgreeDesc": "Elo, Poisson, Logistic Regression, and our Ensemble model all contribute to this prediction for maximum reliability.",
  "botd.dailySelection": "Daily Selection",
  "botd.dailySelectionDesc": "Only one pick per day - we choose quality over quantity. Minimum 65% confidence required for selection.",

  /* ── Pred page ───────────────────────────────────── */
  "pred.title": "Predictions",
  "pred.subtitle": "AI-powered match analysis and probability forecasting - next 7 days",
  "pred.modelEnsemble": "Model: Ensemble",
  "pred.autoRefresh": "Auto-refreshes every 60s · Last:",
  "pred.predicted": "Predicted",
  "pred.upcoming": "Upcoming",
  "pred.correctSoFar": "Correct so far",
  "pred.date": "Date",
  "pred.previousDay": "Previous day",
  "pred.today": "Today",
  "pred.nextDay": "Next day",
  "pred.historical": "Historical",
  "pred.upcomingMatches": "Upcoming Matches",
  "pred.predictionsReady": "Predictions Ready",
  "pred.analysisPendingStat": "Analysis Pending",
  "pred.avgConfidence": "Avg Confidence",
  "pred.sortConfidence": "Confidence",
  "pred.sortTime": "Time",
  "pred.sortLeague": "League",
  "pred.errorLoading": "Could not load fixture data from the database. Please try refreshing.",
  "pred.noUpcomingMatches": "No upcoming matches in the next 7 days",
  "pred.noUpcomingMatchesDesc": "No scheduled fixtures were found in the database. Check back shortly.",
  "pred.noMatchingPredictions": "No predictions match your filters",
  "pred.noMatchingPredictionsDesc": "Try adjusting the league or confidence filters above.",
  "pred.clearFilters": "Clear filters",
  "pred.upgradePrompt": "See all predictions with our Silver plan or higher.",
  "pred.winProbability": "Win Probability",
  "pred.analysisPending": "Analysis pending",
  "pred.confidence": "Confidence",
  "pred.hideDetails": "Hide Details",
  "pred.viewDetails": "View Details",
  "pred.venue": "Venue",
  "pred.predictedOn": "Predicted",
  "pred.notProcessed": "This match has not yet been processed by the prediction engine. Check back closer to kick-off.",
  "pred.preMatchOdds": "Pre-match odds",
  "pred.modelPick": "Model Pick",
  "pred.homeWin": "Home Win",
  "pred.draw": "Draw",
  "pred.awayWin": "Away Win",
  "pred.modelReasoning": "Model Reasoning",
  "pred.keyFactors": "Key Factors",

  /* ── Results page ───────────────────────────────────── */
  "results.title": "Results & Outcomes",
  "results.subtitle": "Match results and prediction accuracy",
  "results.thisWeekPerformance": "This Week's Performance",
  "results.noResultsThisWeek": "No results this week yet.",
  "results.statTotalCalls": "Total Calls",
  "results.statWon": "Won",
  "results.statLost": "Lost",
  "results.statWinRate": "Win Rate",
  "results.statPLUnits": "P/L Units",
  "results.bestPerformers": "Best Performers",
  "results.worstPerformers": "Worst Performers",
  "results.last7Days": "Last 7 days",
  "results.last14Days": "Last 14 days",
  "results.last30Days": "Last 30 days",
  "results.filterAll": "All",
  "results.filterCorrect": "Correct",
  "results.filterIncorrect": "Incorrect",
  "results.allLeagues": "All Leagues",
  "results.resultsPlural": "results",
  "results.resultSingular": "result",
  "results.prediction": "Prediction",
  "results.outcomeHomeWin": "Home Win",
  "results.outcomeAwayWin": "Away Win",
  "results.outcomeDraw": "Draw",
  "results.correct": "CORRECT",
  "results.incorrect": "INCORRECT",
  "results.pendingEval": "Pending eval",
  "results.confidence": "confidence",
  "results.pnlRealTooltip": "Realised P/L computed from the actual pre-match odds stored for this fixture.",
  "results.pnlEstimatedTooltip": "Realised P/L estimated at a flat 1.90 odds because no real odds row is on file yet.",
  "results.noPredictionMade": "No prediction made",
  "results.errorLoading": "Could not load results data. The API may be temporarily unavailable.",
  "results.noResults": "No results found",
  "results.noResultsHint": "No finished matches with results in the selected period. Try a wider date range.",
  "results.expandTo30Days": "Expand to 30 days",
  "results.noResultsMatchFilters": "No results match your filters",
  "results.noResultsMatchFiltersHint": "Try adjusting the period or result filter above.",
  "results.clearFilters": "Clear filters",

  /* ── WeeklyReport page ───────────────────────────────────── */
  "weeklyReport.title": "Weekly Report",
  "weeklyReport.subtitle": "Performance summary for the past 7 days",
  "weeklyReport.errorLoading": "Could not load report data. The API may be temporarily unavailable.",
  "weeklyReport.performanceOverview": "Performance Overview",
  "weeklyReport.noPerformanceData": "No performance data for this week yet.",
  "weeklyReport.noPerformanceDataHint": "Check back once matches with predictions have finished.",
  "weeklyReport.totalCalls": "Total Calls",
  "weeklyReport.wins": "Wins",
  "weeklyReport.losses": "Losses",
  "weeklyReport.winRate": "Win Rate",
  "weeklyReport.netPL": "Net P/L",
  "weeklyReport.vsLastWeek": "vs last week",
  "weeklyReport.winnersAndLosses": "Winners & Losses",
  "weeklyReport.topWinners": "Top Winners",
  "weeklyReport.lossesTitle": "Losses",
  "weeklyReport.noEvaluatedPredictions": "No evaluated predictions this week yet.",
  "weeklyReport.noCorrectCalls": "No correct calls this week.",
  "weeklyReport.noIncorrectCalls": "No incorrect calls this week.",
  "weeklyReport.win": "WIN",
  "weeklyReport.loss": "LOSS",
  "weeklyReport.ourCall": "Our call",
  "weeklyReport.result": "Result",
  "weeklyReport.confidence": "Confidence",
  "weeklyReport.outcomeHomeWin": "Home Win",
  "weeklyReport.outcomeAwayWin": "Away Win",
  "weeklyReport.outcomeDraw": "Draw",
  "weeklyReport.callLog": "Call Log",
  "weeklyReport.allCallsThisWeek": "All Calls This Week",
  "weeklyReport.calls": "calls",
  "weeklyReport.noCallsThisWeek": "No calls with predictions this week.",
  "weeklyReport.colDate": "Date",
  "weeklyReport.colMatch": "Match",
  "weeklyReport.colLeague": "League",
  "weeklyReport.colOurCall": "Our Call",
  "weeklyReport.colOdds": "Odds",
  "weeklyReport.colResult": "Result",
  "weeklyReport.colCorrect": "Correct?",
  "weeklyReport.colPL": "P/L",
  "weeklyReport.yes": "Yes",
  "weeklyReport.no": "No",
  "weeklyReport.weeklyTotal": "Weekly Total",

  /* ── Live page ───────────────────────────────────── */
  "live.title": "Live Matches",
  "live.subtitle": "Today's matches and upcoming fixtures - next 3 days",
  "live.statusLive": "Live",
  "live.statusUpcoming": "Upcoming",
  "live.statusFinished": "Finished",
  "live.lastUpdated": "Last updated",
  "live.fetchingData": "Fetching data…",
  "live.errorBackend": "Could not reach the backend API. Showing cached data if available - retrying automatically.",
  "live.noMatchesToday": "No matches scheduled for today. Next fixtures:",
  "live.status": "Status",
  "live.filterAll": "All",
  "live.filterLive": "Live",
  "live.filterUpcoming": "Upcoming",
  "live.filterFinished": "Finished",
  "live.noDataBackendUnreachable": "No data available - backend unreachable.",
  "live.noMatchesFound": "No matches found. Check back when fixtures are scheduled.",
  "live.noMatchesForFilter": "No matches found for the selected filter.",
  "live.clearFilters": "Clear filters",
  "live.postponed": "Postponed",
  "live.cancelled": "Cancelled",
  "live.analysisPending": "Analysis pending",
  "live.winProbability": "Win probability",
  "live.kickOff": "Kick-off",
  "live.viewAnalysis": "View Analysis",

  /* ── Deals page ───────────────────────────────────── */
  "deals.title": "Exclusive Deals",
  "deals.subtitle": "Special offers for BetsPlug members",
  "deals.membersOnly": "Members Only",
  "deals.memberReward": "Member reward",
  "deals.heroTitle": "Get 20% OFF your BetsPlug Pro subscription",
  "deals.heroDescription": "Exclusive discount unlocked for your account. Share your referral link with friends and earn credits for every successful sign-up.",
  "deals.yourReferralLink": "Your referral link",
  "deals.bothGetFreeMonth": "Both you and your friend get 1 month free",
  "deals.copied": "Copied!",
  "deals.copy": "Copy",
  "deals.partnerDeals": "Partner Deals",
  "deals.partnerDealsDescription": "Choose the plan that fits your workflow - all prices reflect your member discount",
  "deals.mostPopular": "Most Popular",
  "deals.customPricing": "Custom pricing",
  "deals.perMonth": "per month",
  "deals.bestValue": "Best value",
  "deals.saveAnnual": "Save $72/year",
  "deals.saveMonthly": "Save $8/month",
  "deals.claimDiscount": "Claim Discount",
  "deals.contactSales": "Contact Sales",
  "deals.featureUnlimitedPredictions": "Unlimited predictions",
  "deals.featureAllStrategies": "All betting strategies",
  "deals.featurePriorityAlerts": "Priority match alerts",
  "deals.featureFullApi": "Full API access",
  "deals.featureAdvancedAnalytics": "Advanced analytics",
  "deals.featurePrioritySupport": "Priority support",
  "deals.featureCustomModels": "Custom ML models",
  "deals.featureDedicatedSupport": "Dedicated account support",
  "deals.featureWhiteLabel": "White-label integration",
  "deals.featureBulkApi": "Bulk API access",
  "deals.featureSlaGuarantee": "SLA guarantee",
  "deals.featureTeamManagement": "Team management",
  "deals.referralProgram": "Referral Program",
  "deals.referralProgramDescription": "Earn credits by inviting friends to BetsPlug",
  "deals.howItWorks": "How it works",
  "deals.step1Title": "Share your unique link",
  "deals.step1Description": "Copy and send your personal referral URL to friends or post on socials",
  "deals.step2Title": "Friend signs up and subscribes",
  "deals.step2Description": "Your friend creates an account and picks any paid BetsPlug plan",
  "deals.step3Title": "Both get 1 month free",
  "deals.step3Description": "Credits are applied automatically to both accounts within 24 hours",
  "deals.yourReferralStats": "Your referral stats",
  "deals.totalReferrals": "Total Referrals",
  "deals.active": "Active",
  "deals.creditsEarned": "Credits Earned",
  "deals.disclaimer": "Disclaimer",
  "deals.disclaimerText": "Affiliate links and referral programs are subject to terms and conditions. Discounts apply to new and renewing subscriptions only. Credits are non-transferable and may not be exchanged for cash. BetsPlug reserves the right to modify or terminate the referral program at any time with prior notice.",

  /* ── Reports page ───────────────────────────────────── */
  "reports.title": "Reports & Exports",
  "reports.subtitle": "Generate and download performance reports",
  "reports.generateReport": "Generate Report",
  "reports.generateReportDescription": "Generate a new performance report based on model predictions.",
  "reports.reportType": "Report Type",
  "reports.weeklySummary": "Weekly Summary",
  "reports.monthlySummary": "Monthly Summary",
  "reports.customRange": "Custom Range",
  "reports.format": "Format",
  "reports.generating": "Generating…",
  "reports.reportQueued": "Report job queued successfully. The report will appear in the list below once ready.",
  "reports.generateFailed": "Failed to generate report. Please try again.",
  "reports.generatedReports": "Generated Reports",
  "reports.allAvailableReports": "All available performance reports",
  "reports.reportSingular": "report",
  "reports.reportPlural": "reports",
  "reports.noReportsYet": "No reports generated yet",
  "reports.noReportsHint": "Use the form above to generate your first report.",
  "reports.ready": "Ready",
  "reports.download": "Download",

  /* ── Trackrecord page ───────────────────────────────────── */
  "trackrecord.title": "Track Record",
  "trackrecord.subtitle": "Historical model performance, calibration, and segment analysis",
  "trackrecord.realApiData": "Real API data",
  "trackrecord.performance": "Performance",
  "trackrecord.calibration": "Calibration",
  "trackrecord.segments": "Segments",
  "trackrecord.filters": "Filters",
  "trackrecord.from": "From",
  "trackrecord.to": "To",
  "trackrecord.allLeagues": "All Leagues",
  "trackrecord.totalPredictions": "Total Predictions",
  "trackrecord.accuracy": "Accuracy",
  "trackrecord.brierScore": "Brier Score",
  "trackrecord.logLoss": "Log Loss",
  "trackrecord.calibrationError": "Calibration Error",
  "trackrecord.calibrationErrorECE": "Calibration Error (ECE)",
  "trackrecord.avgConfidence": "Avg Confidence",
  "trackrecord.periodStart": "Period Start",
  "trackrecord.periodEnd": "Period End",
  "trackrecord.metric": "Metric",
  "trackrecord.value": "Value",
  "trackrecord.segment": "Segment",
  "trackrecord.total": "Total",
  "trackrecord.realModelPerformance": "Real Model Performance",
  "trackrecord.liveDataFromDb": "Live data from the database",
  "trackrecord.predictions": "Predictions",
  "trackrecord.noPredictionsYet": "No predictions recorded yet",
  "trackrecord.noPredictionsYetDesc": "Data collection is in progress. Prediction statistics will appear here once the first model evaluations are complete.",
  "trackrecord.noPredictionsEmptyDesc": "Predictions will appear here once the model has generated forecasts for upcoming matches. Data collection is in progress.",
  "trackrecord.disclaimer": "These figures are real model outputs. Brier score measures probabilistic accuracy (lower is better). This is not financial or betting advice.",
  "trackrecord.pending": "Pending",
  "trackrecord.correct": "Correct",
  "trackrecord.incorrect": "Incorrect",
  "trackrecord.recentPredictions": "Recent Predictions",
  "trackrecord.last15ModelCalls": "Last 15 model calls",
  "trackrecord.recentPredictionsResults": "Recent Predictions & Results",
  "trackrecord.lastNModelCalls": "Last {n} model calls - real data from database",
  "trackrecord.conf": "Conf.",
  "trackrecord.vs": "vs",
  "trackrecord.match": "Match",
  "trackrecord.accuracyOverTime": "Accuracy Over Time",
  "trackrecord.monthlyModelAccuracy": "Monthly model accuracy",
  "trackrecord.monthlyModelAccuracyReal": "Monthly model accuracy - real data ({n} months)",
  "trackrecord.notEnoughData": "Not enough data yet",
  "trackrecord.notEnoughDataDesc": "Monthly accuracy trends will appear here once sufficient prediction data has been collected and resolved across multiple months.",
  "trackrecord.noLeagueBreakdownData": "No league breakdown data available yet.",
  "trackrecord.accuracyCorrectPredictions": "Accuracy (correct predictions)",
  "trackrecord.monthlyAccuracy": "Monthly Accuracy",
  "trackrecord.accuracyByLeague": "Accuracy by League",
  "trackrecord.accuracyByLeagueDesc": "Prediction accuracy broken down by league - real data",
  "trackrecord.accuracyTrend": "Accuracy Trend",
  "trackrecord.accuracyTrendDesc": "Monthly rolling accuracy over the selected period",
  "trackrecord.noMonthlyData": "No monthly data available for the selected filters.",
  "trackrecord.summaryStatistics": "Summary Statistics",
  "trackrecord.summaryStatisticsDesc": "Aggregate metrics for the selected period and filters",
  "trackrecord.noSummaryData": "No summary data available.",
  "trackrecord.calibrationChart": "Calibration Chart",
  "trackrecord.calibrationChartDesc": "Predicted probability vs. actual frequency",
  "trackrecord.noCalibrationData": "No calibration data available for the selected filters.",
  "trackrecord.whatIsCalibration": "What is Calibration?",
  "trackrecord.calibrationExplanation1": "A perfectly calibrated model is one where, among all predictions assigned probability p, exactly p × 100% of events actually occur.",
  "trackrecord.calibrationExplanation2": "The diagonal dashed line represents perfect calibration. Points above the line mean the model is under-confident; points below mean the model is over-confident.",
  "trackrecord.keyMetrics": "Key Metrics",
  "trackrecord.eceExplanation": "Lower is better. Values near 0 indicate excellent calibration.",
  "trackrecord.calibrationMeasurement": "Calibration is measured using equal-width probability buckets. Each point in the scatter represents one bucket of predictions.",
  "trackrecord.performanceByLeague": "Performance by League",
  "trackrecord.performanceByLeagueDesc": "Prediction accuracy broken down by league",
  "trackrecord.performanceByConfidence": "Performance by Confidence Bucket",
  "trackrecord.performanceByConfidenceDesc": "How accuracy varies across model confidence levels",
  "trackrecord.league": "League",
  "trackrecord.confidenceBucket": "Confidence Bucket",
  "trackrecord.noSegmentData": "No segment data available for {segment}.",
  "trackrecord.noPredictionDataYet": "No prediction data yet",
  "trackrecord.noPredictionDataYetDesc": "The system has not yet generated or evaluated any predictions. KPI cards, charts, and tables below will populate automatically as the model runs and match outcomes are recorded. Check back after the first batch of predictions has been processed.",

  /* ── Settings page ───────────────────────────────────── */
  "settings.title": "Settings",
  "settings.subtitle": "Customize your experience",
  "settings.profile": "Profile",
  "settings.profileDesc": "Your personal information and account role",
  "settings.editProfile": "Edit profile",
  "settings.done": "Done",
  "settings.admin": "Admin",
  "settings.followedLeagues": "Followed Leagues",
  "settings.followedLeaguesDesc": "Select the leagues you want to track and receive intelligence for",
  "settings.alertsFollowedOnly": "Receive alerts for followed leagues only",
  "settings.alertsFollowedOnlyDesc": "Suppress notifications from leagues you don't follow",
  "settings.leaguePreferences": "League Preferences",
  "settings.leaguePreferencesDesc": "Choose specific competitions within your followed leagues",
  "settings.notificationPreferences": "Notification Preferences",
  "settings.notificationPreferencesDesc": "Control which alerts and reports you receive",
  "settings.matchStartAlerts": "Match start alerts",
  "settings.matchStartAlertsDesc": "Get notified when followed matches kick off",
  "settings.predictionUpdates": "Prediction updates",
  "settings.predictionUpdatesDesc": "Receive updates when model predictions change significantly",
  "settings.strategyCalls": "Strategy calls",
  "settings.strategyCallsDesc": "Alerts when a strategy generates a new betting signal",
  "settings.weeklyReportEmails": "Weekly report emails",
  "settings.weeklyReportEmailsDesc": "A summary of model performance every Monday morning",
  "settings.modelPerformanceAlerts": "Model performance alerts",
  "settings.modelPerformanceAlertsDesc": "Notify when accuracy drops below your threshold",
  "settings.displayPreferences": "Display Preferences",
  "settings.displayPreferencesDesc": "Adjust how data and the interface appears to you",
  "settings.oddsFormat": "Odds Format",
  "settings.oddsDecimal": "Decimal (2.10)",
  "settings.oddsFractional": "Fractional (11/10)",
  "settings.oddsAmerican": "American (+110)",
  "settings.language": "Language",
  "settings.timezone": "Timezone",
  "settings.lightMode": "Light mode",
  "settings.darkMode": "Dark mode",
  "settings.switchToDark": "Switch back to the premium dark interface",
  "settings.darkThemeActive": "Dark theme active - easy on the eyes",
  "settings.discard": "Discard",
  "settings.saveSettings": "Save settings",
  "settings.savedSuccessfully": "Settings saved successfully",

  /* ── Search page ───────────────────────────────────── */
  "search.title": "Search",
  "search.subtitle": "Find leagues, teams, and matches",
  "search.placeholder": "Search across leagues, teams, and matches…",
  "search.searchThePlatform": "Search the platform",
  "search.typeAtLeast2Chars": "Type at least 2 characters to search across leagues, teams, and matches",
  "search.tagFootball": "Football",
  "search.tagLeagues": "Leagues",
  "search.tagTeams": "Teams",
  "search.tagMatches": "Matches",
  "search.typeLeague": "League",
  "search.typeTeam": "Team",
  "search.typeMatch": "Match",
  "search.tabAll": "All",
  "search.noResultsFound": "No results found",
  "search.nothingMatched": "Nothing matched",
  "search.tryDifferentTerm": "Try a different term.",
  "search.noResultsInCategory": "No results in this category.",
  "search.results": "results",
  "search.result": "result",
  "search.for": "for",
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
  "nav.articles": "Artikelen",
  "nav.login": "Inloggen",
  "nav.startFreeTrial": "Gratis proberen",
  "nav.menu": "Menu",
  "nav.getStarted": "Begin nu",
  "nav.joinBlurb":
    "Sluit je aan bij 1.500+ analisten en krijg vandaag nog datagedreven voorspellingen.",

  "hero.badge": "Wees de bookmaker voor",
  "hero.titleLine1": "De beste AI-gedreven",
  "hero.titleLine2": "voetbalvoorspellingen",
  "hero.titleLine3": "voor jouw voordeel.",
  "hero.subtitle":
    "BetsPlug combineert data, Elo-ratings, Poisson-modellen en machine learning in één platform. Live kansen, diepgaande inzichten en een bewezen track record - gemaakt voor serieuze voetbalanalisten.",
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
  "hero.usp1Desc": "Poisson, XGBoost, Elo & markt-geïmpliceerd - gemengd.",
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
    "Dit is precies wat BetsPlug onderscheidt van gewone tipstersites - geen kleine lettertjes, geen uitgekozen successen.",
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
    "Een eenvoudig, transparant proces rond data - geen hype, geen gokken.",
  "how.step1Title": "Maak een account",
  "how.step1Desc": "Registreer in enkele seconden. Een symbolische €0,01 activeert je 7-daagse volledige-toegang-proef - we rekenen alleen echte kaarten af om fraude te voorkomen.",
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
    "Krijg realtime picks, value-alerts en live chat met onze AI-analisten. Wees de eerste die weet wanneer er een hoge-waarde wedstrijd langskomt - direct in je zak.",
  "footer.perk1": "Directe value-alerts",
  "footer.perk2": "Privé Q&A met analisten",
  "footer.perk3": "Dagelijkse gratis picks",
  "footer.perk4": "VIP-only diepgaande analyses",
  "footer.joinCta": "Word lid van de Premium Groep",
  "footer.limited": "Beperkte plekken · Alleen voor leden",
  "footer.onlineNow": "1.200+ leden online",
  "footer.brandTagline":
    "BetsPlug combineert data, Elo-ratings, Poisson-modellen en machine learning in één platform - gemaakt voor serieuze voetbalanalisten die niet willen gokken.",
  "footer.product": "Product",
  "footer.company": "Bedrijf",
  "footer.legal": "Juridisch",
  "footer.secureTitle": "Veilige betalingen",
  "footer.secureDesc": "256-bit SSL versleutelde checkout",
  "footer.pciCompliant": "PCI DSS gecertificeerd",
  "footer.copyright":
    "Alle rechten voorbehouden. BetsPlug is een data- & analyseplatform - geen gokaanbieder.",
  "footer.responsible": "18+ Speel verantwoord",
  "footer.aboutUs": "Over Ons",
  "footer.ourModels": "Onze Modellen",
  "footer.contact": "Contact",
  "footer.termsOfService": "Algemene Voorwaarden",
  "footer.privacyPolicy": "Privacybeleid",
  "footer.cookiePolicy": "Cookiebeleid",
  "footer.comparison": "Vergelijking",
  "footer.betTypes": "Wedmarkten",
  "footer.viewAll": "Bekijk alles",
  "footer.learn": "Leren",
  "footer.bottomPrivacy": "Privacy",
  "footer.bottomTerms": "Voorwaarden",
  "footer.bottomCookies": "Cookies",

  "leagues.badge": "Top competities",
  "leagues.titleA": "De grootste",
  "leagues.titleB": "competities",

  "trusted.titleA": "Jouw",
  "trusted.titleHighlight": "vertrouwde",
  "trusted.titleB": "partner",
  "trusted.titleC": "in voetbalanalyse.",
  "trusted.subtitle":
    "BetsPlug bundelt en beveiligt een groeiend ecosysteem van databronnen, AI-modellen en bewezen strategieën. Eén platform voor datagedreven voetbalanalisten die niet willen gokken.",
  "trusted.card1Title": "Voor elk kennisniveau.",
  "trusted.card1Desc":
    "Van beginner tot pro-analist - onze dashboards, tutorials en transparante statistieken maken elke voorspelling makkelijk te begrijpen.",
  "trusted.card2Title": "Beste werkwijzen in de sector.",
  "trusted.card2Desc":
    "Vier AI-modellen (Elo, Poisson, Logistic, Ensemble) leveren samen voorspellingen die je kunt vertrouwen. Bewezen methodes, transparante resultaten.",
  "trusted.learnMore": "Meer lezen",
  "trusted.card3Title": "Beschermd door transparantie.",
  "trusted.card3Desc":
    "Elke voorspelling wordt gelogd, bijgehouden en openbaar geverifieerd. Geen verborgen resultaten, geen selectief kiezen - gewoon data die jijzelf kunt controleren.",

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
    "Eén platform dat een groeiend ecosysteem van voetbaldata, AI-voorspellingen en strategie-backtesting tools bij elkaar brengt. Alle voorspellingen worden gelogd en publiek bijgehouden - altijd volledig transparant.",
  "track.desc2":
    "Of je nu de Premier League, La Liga of de Champions League volgt, BetsPlug verenigt data en machine learning tot inzichten die je écht kunt gebruiken.",
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
  "features.f5Title": "Analyse van de Dag",
  "features.f5Desc":
    "Ons algoritme kiest elke dag de pick met de hoogste waarde. Premium-leden zien hem als eerste.",
  "features.f6Title": "Groeiende community",
  "features.f6Desc":
    "Sluit je aan bij datagedreven voetbalanalisten die inzichten en strategieën delen.",

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
  "finalCta.subtitle": "Sluit je aan bij duizenden voetbalanalisten die BetsPlug's AI-voorspellingen gebruiken. €0,01 activeert je 7-daagse volledige-toegang-proef.",
  "finalCta.primary": "Gratis proberen",
  "finalCta.secondary": "Meer info →",
  "finalCta.moneyBack": "14 dagen geld-terug",
  "finalCta.cancelAnytime": "Altijd opzegbaar",
  "finalCta.instantAccess": "Direct toegang",

  "pricing.bronzeTagline": "Volledige toegang voor slechts €0,01",
  "pricing.bronzeCta": "Start €0,01 proef",
  "pricing.bronzeF1": "Volledige Gold-toegang voor 7 dagen",
  "pricing.bronzeF2": "Alle 30+ competities & 4 AI-modellen",
  "pricing.bronzeF3": "Onbeperkt dagelijkse AI-voorspellingen",
  "pricing.bronzeF4": "Direct Analyse van de Dag + meldingen",
  "pricing.bronzeF5": "Slechts €0,01 · Altijd opzegbaar",
  "pricing.silverTagline": "Basis voor gelegenheidsanalisten",
  "pricing.silverCta": "Start Silver",
  "pricing.silverF1": "Alleen top 5 Europese competities",
  "pricing.silverF2": "Alleen Ensemble (geen modeldetails)",
  "pricing.silverF3": "Picks 2u vertraagd t.o.v. Gold",
  "pricing.silverF4": "Basis-confidence scores",
  "pricing.silverF5": "E-mailsupport (48u reactietijd)",
  "pricing.goldTagline": "Alles wat je nodig hebt om te winnen",
  "pricing.goldCta": "Start Gold",
  "pricing.goldF1": "Alle 30+ competities wereldwijd (CL, UEL, MLS…)",
  "pricing.goldF2": "Alle 4 AI-modellen + Ensemble-details",
  "pricing.goldF3": "Directe picks + dagelijkse Analyse van de Dag",
  "pricing.goldF4": "Live kansberekening & meldingen",
  "pricing.goldF5": "Exclusief Gold Telegram + Strategy Lab",
  "pricing.goldF6": "Prioriteitsupport (12u) + maandelijkse strategiereview",
  "pricing.perMonth": "/ maand",
  "pricing.forever": "/ 7-daagse proef",
  "pricing.billedMonthly": "Maandelijks gefactureerd",
  "pricing.billedYearlySilver": "€95,90 per jaar gefactureerd",
  "pricing.billedYearlyGold": "€143,90 per jaar gefactureerd",
  "pricing.platTagline": "Levenslange toegang. Founder-voordelen.",
  "pricing.platPitch": "Betaal één keer, ontgrendel elke huidige en toekomstige Gold-functie - plus privévoordelen die je op geen enkel ander plan vindt.",
  "pricing.platBadgeLifetime": "Levenslange deal",
  "pricing.platLimited": "Beperkt tot 100/jaar",
  "pricing.platOneTime": "Eenmalige betaling",
  "pricing.platNoSub": "Geen abonnement. Geen verlengingen. Nooit.",
  "pricing.platCta": "Claim levenslange toegang",
  "pricing.platF1": "Levenslang Gold - elke huidige & toekomstige functie",
  "pricing.platF2": "Privé Platinum Telegram (max 20 plekken)",
  "pricing.platF3": "1-op-1 onboarding met onze oprichters",
  "pricing.platF4": "Maandelijkse persoonlijke strategiereview",
  "pricing.platF5": "Vroege toegang + read-only API + levenslange prijs-lock",
  "pricing.trust1": "14 dagen geld-terug-garantie",
  "pricing.trust2": "Altijd opzegbaar",
  "pricing.trust3": "Veilige betaling via Stripe",

  /* Articles */
  "articles.badge": "Voetbalanalyse",
  "articles.title": "Laatste analyses",
  "articles.subtitle": "Voetbalnieuws, AI-wedstrijdanalyses en datagedreven inzichten.",
  "articles.allArticles": "Alle artikelen",
  "articles.sportFootball": "Voetbal",
  "articles.readTime": "min leestijd",
  "articles.empty": "Nog geen artikelen in deze categorie - kom snel terug.",
  "articles.back": "Terug naar alle artikelen",
  "articles.breadcrumbHome": "Home",
  "articles.breadcrumbBlog": "Artikelen",
  "articles.share": "Delen",
  "articles.related": "Gerelateerde artikelen",
  "articles.ctaBadge": "BetsPlug leden",
  "articles.ctaTitle": "Zet deze analyse om in een echt voordeel.",
  "articles.ctaSubtitle": "Krijg live AI-kansen, Analyse van de Dag en de volledige Ensemble-output - 7 dagen gratis.",
  "articles.ctaButton": "Start gratis proefperiode",
  "articles.ctaNoCard": "Symbolische €0,01 om je 7-daagse proef te activeren",
  "articles.tldr": "TL;DR",
  "articles.publishedOn": "Gepubliceerd",
  "articles.byline": "Door",
  "articles.checkAll": "Bekijk alle artikelen",
  "articles.prevPost": "Vorig artikel",
  "articles.nextPost": "Volgend artikel",
  "articles.navLabel": "Verder lezen",

  "seo.badge": "De slimme manier om bets te onderzoeken",
  "seo.titleA": "AI-voetbalvoorspellingen &",
  "seo.titleB": "datagedreven betting picks",
  "seo.subtitle":
    "BetsPlug is het datagedreven thuis voor AI-voetbalvoorspellingen, machine-learning picks en statistische match-analyses. Of je nu een voetbalaccu onderzoekt, competitievorm analyseert of een nieuwe strategie backtest - onze AI-predictor geeft je het voordeel dat je nodig hebt.",
  "seo.pillar1Title": "AI Voetbalvoorspelling Engine",
  "seo.pillar1Desc":
    "Onze AI-engine combineert Elo-ratings, Poisson-modellen en machine learning om uitslagen in alle grote voetbalcompetities datagedreven te voorspellen.",
  "seo.pillar2Title": "Data-gestaafde voorspellingen",
  "seo.pillar2Desc":
    "Elke AI-voorspelling op BetsPlug is gebaseerd op duizenden historische wedstrijden, live vormdata en xG-metrics - voor de scherpste picks online.",
  "seo.pillar3Title": "Geverifieerd track record",
  "seo.pillar3Desc":
    "Transparantie voorop. Bekijk ons openbare track record met elke AI-pick die we ooit publiceerden - volledige ROI, hit-rate en confidence gelogd en getimestampt.",
  "seo.pillar4Title": "Analyse van de Dag",
  "seo.pillar4Desc":
    "Weinig tijd? Onze dagelijkse AI-Analyse van de Dag geeft de pick met de hoogste confidence uit alle competities - gekozen door ons algoritme, niet op gevoel.",
  "seo.pillar5Title": "Live AI-kansen",
  "seo.pillar5Desc":
    "Zie kansen realtime verschuiven tijdens een match. Onze live AI-predictor herberekent winstkansen elke seconde zodat je value spot zodra die verschijnt.",
  "seo.pillar6Title": "Analyse, geen gokken",
  "seo.pillar6Desc":
    "BetsPlug is een voetbalanalyse-platform - geen bookmaker. We leveren AI-voorspellingen en data-inzichten zodat jij geïnformeerd kunt beslissen, zonder ooit op onze site te wedden.",

  "faq.badge": "Veelgestelde vragen",
  "faq.titleA": "Vragen?",
  "faq.titleB": "Wij hebben antwoorden",
  "faq.subtitle":
    "Alles wat je moet weten over ons AI-voetbalvoorspellingsplatform, van de eerste stappen tot geavanceerde integraties.",
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
    "Krijg direct antwoord van onze AI-assistent, blader door de FAQ of bereik ons team persoonlijk - wat het beste voor jou werkt.",
  "contact.chatPlaceholder": "Vraag onze AI iets over BetsPlug…",
  "contact.chatStart": "Start chat",
  "contact.chatHint": "Powered by BetsPlug AI · Antwoord binnen seconden",

  "contact.card1Title": "Chat met AI-assistent",
  "contact.card1Desc":
    "Direct antwoord op vragen over prijzen, modellen, voorspellingen en meer - 24/7, zonder wachttijd.",
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
    "BetsPlug is een puur voetbal-analyseplatform. We publiceren AI-gedreven voorspellingen, Elo-ratings, Poisson-modellen en transparante track records zodat jij datagedreven beslissingen kunt nemen. We zijn geen bookmaker - je kunt bij ons geen weddenschappen plaatsen.",
  "contact.faq2Q": "Moet ik betalen om BetsPlug te proberen?",
  "contact.faq2A":
    "Nee. Onze Bronze tier is 100% gratis en geeft je een dagelijkse AI-pick, basisvoorspellingen en toegang tot ons publieke track record. Upgrade pas naar Silver of Gold als je live-kansen, backtesting en geavanceerde markten wilt.",
  "contact.faq3Q": "Welke competities dekken jullie?",
  "contact.faq3A":
    "We dekken 70+ voetbalcompetities wereldwijd, waaronder de Eredivisie, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, UEFA Champions League, Europa League en 20+ meer. Elke maand voegen we nieuwe voetbalcompetities toe naarmate onze modellen rijpen.",

  "contact.faqGroup2": "Account & facturatie",
  "contact.faq4Q": "Kan ik mijn abonnement op elk moment opzeggen?",
  "contact.faq4A":
    "Ja, alle Silver- en Gold-plannen zijn per maand opzegbaar zonder lock-in. Annuleer in je dashboard en behoud toegang tot het einde van je huidige factureringsperiode - geen gedoe.",
  "contact.faq5Q": "Bieden jullie restituties?",
  "contact.faq5A": "We bieden een 14 dagen niet-goed-geld-terug-garantie op alle betaalde plannen conform EU-consumentenrecht. Is BetsPlug niks voor jou? Mail support binnen 14 dagen en je krijgt volledige restitutie. Platinum Lifetime is final-sale na de 14 dagen.",
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
  "chatbot.close": "Chat sluiten",
  "chatbot.footer":
    "AI-assistent gebaseerd op BetsPlug-info - voor alles daarbuiten mail support@betsplug.com",
  "chatbot.suggestion1": "Hoe werkt de Analyse van de Dag?",
  "chatbot.suggestion2": "Wat is het verschil tussen Silver en Gold?",
  "chatbot.suggestion3": "Hoe nauwkeurig zijn jullie voorspellingen?",
  "chatbot.replyDefault":
    "Bedankt voor je bericht! Een BetsPlug-analist neemt snel contact op. Bekijk ondertussen onze FAQ of stuur een mail naar support@betsplug.com.",
  "chatbot.replyHello":
    "Hey! 👋 Ik ben de BetsPlug AI. Vraag me alles over onze modellen, prijzen of voorspellingen - ik help je graag verder.",
  "chatbot.replyPricing": "We hebben vier tiers. Bronze is een symbolische €0,01 proef - volledige toegang voor 7 dagen, echte kaart vereist (dit houdt het platform fraudevrij). Silver (€9,99/mnd) is een instapplan beperkt tot de top 5 Europese competities met alleen Ensemble-picks en 2u vertraging. Gold (€14,99/mnd) is onze populairste - alle 30+ competities wereldwijd, alle 4 AI-modellen, directe picks, dagelijkse Analyse van de Dag, Gold Telegram en Strategy Lab. Platinum (eenmalig €199 levenslang) voegt privé Telegram toe, 1-op-1 onboarding en levenslange prijs-lock. Alle betaalde plannen hebben een 14 dagen EU geld-terug-garantie.",
  "chatbot.replyRefund": "Silver- en Gold-plannen kun je op elk moment opzeggen in je dashboard - je behoudt toegang tot het einde van je factureringsperiode. We bieden ook een 14 dagen niet-goed-geld-terug-garantie op alle betaalde plannen conform EU-recht. Platinum Lifetime is final-sale na de 14-dagen.",
  "chatbot.replyAccuracy":
    "Elke voorspelling wordt gelogd in ons publieke track record met hit-rate, ROI en confidence scores. Filter op competitie, markt en datum. Geen cherry-picking, geen verborgen verliezen - transparantie staat voorop.",
  "chatbot.replyTelegram":
    "Onze Telegram-community heeft 1.200+ actieve leden met dagelijkse picks, edge-meldingen en live Q&A met onze analisten. Join via t.me/betsplug - gratis voor Bronze, VIP-kanalen voor Silver/Gold.",

  /* About Us page */
  "about.metaTitle":
    "Over Ons · BetsPlug AI Voetbalanalyse Team",
  "about.metaDesc":
    "Maak kennis met de twee engineers die BetsPlug bouwen. Voetbalfanaten met een ICT-achtergrond die ruwe wedstrijddata omzetten in transparante, datagedreven voorspellingen voor alle grote voetbalcompetities.",
  "about.breadcrumbHome": "Home",
  "about.breadcrumbAbout": "Over ons",

  "about.heroBadge": "Ons Verhaal",
  "about.heroTitleA": "Gebouwd door voetbalfanaten.",
  "about.heroTitleB": "Ontwikkeld door data-obsessieven.",
  "about.heroSubtitle":
    "BetsPlug is een AI-gedreven voetbalanalyseplatform, gebouwd door twee engineers die klaar waren met meningen, tipsters en influencer-ruis. Wij vervingen buikgevoel door statistische modellen, en luide meningen door transparante waarschijnlijkheden.",

  "about.missionBadge": "De Missie",
  "about.missionTitle": "Wij maken van ruwe wedstrijddata een meetbare voorsprong.",
  "about.missionBody1":
    "De voorspellingsmarkt draait al veel te lang op hype. YouTube-goeroes die views achternajagen, Telegram-kanalen die \"locks of the week\" verkopen, betaalde tipsters zonder verifieerbare historie. Als levenslange voetbalfans werden we daar helemaal gek van - want we wisten dat de onderliggende data veel beter was dan de ruis eromheen.",
  "about.missionBody2":
    "Dus bouwden we het product dat we altijd al wilden hebben: een platform dat duizenden wedstrijden per week verwerkt, ze doorrekent met Elo-ratings, Poisson-scoremodellen en gradient-boosted classifiers, en alleen de picks toont waar onze modellen écht afwijken van de closing line. Geen onderbuik. Geen cherry picking. Alleen statistiek, open gepubliceerd.",
  "about.missionCta": "Zie hoe het werkt",

  "about.statsBadge": "In Cijfers",
  "about.statsTitle": "Een decennium engineering. Een leven lang voetbal.",
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
    "BetsPlug is geen tipster. Het is een gedisciplineerd systeem. Dit zijn de regels die we voor onszelf schreven - en die we weigeren te breken.",
  "about.value1Title": "Data boven mening",
  "about.value1Desc":
    "Elke aanbeveling komt uit een model, niet uit een onderbuikgevoel. We publiceren de expliciete waarschijnlijkheid, verwachte waarde en confidence score zodat je de redenering kunt verifiëren in plaats van blind op een gezicht te vertrouwen.",
  "about.value2Title": "Track record openbaar",
  "about.value2Desc":
    "Elke pick die we publiceren staat voor altijd op onze publieke track record-pagina - winsten, verliezen, pushes, nooit verwijderd. Als we op lange termijn de markt niet verslaan, verdienen we geen cent van jouw geld. Transparantie is het hele punt.",
  "about.value3Title": "Doorlopend hertrainen",
  "about.value3Desc":
    "Voetbal verandert. Coaches worden ontslagen, selecties worden geschud, nieuwe competities komen op. Onze modellen hertrainen wekelijks op verse resultaten zodat ze nooit verouderen, en we publiceren de retraining-notes naast de picks.",
  "about.value4Title": "Jouw voordeel, niet het onze",
  "about.value4Desc":
    "Wij zijn analisten, geen bookmakers. Als de markt in jouw voordeel beweegt, profiteer jij - geen platform dat commissie pakt op jouw verliezen. Die alignment vormt elke product-beslissing die we maken.",

  "about.teamBadge": "Ontmoet de Oprichters",
  "about.teamTitle": "Twee oprichters. Nul fauteuil-experts.",
  "about.teamSubtitle":
    "Wij zijn geen influencers en geen tipsters. Wij zijn engineers die leveren. Alles op BetsPlug is gebouwd, gesloopt en herbouwd door ons tweeën.",

  "about.founder1Name": "Cas",
  "about.founder1Role": "Mede-oprichter · Engineering & Product",
  "about.founder1Bio":
    "Voetballiefhebber in hart en nieren met een achtergrond in ICT. Bouwt de systemen die BetsPlug draaiende houden en zorgt dat data netjes van bron naar scherm stroomt.",

  "about.founder2Name": "Dennis",
  "about.founder2Role": "Mede-oprichter · Data Science & Modellering",
  "about.founder2Bio":
    "Voetbalfanaat en data-enthousiasteling met jarenlange ICT-ervaring. Richt zich op de modellen en statistieken die wedstrijddata omzetten in bruikbare inzichten.",

  "about.ctaTitle": "Klaar om gokken te vervangen door data?",
  "about.ctaSubtitle":
    "Sluit je aan bij 1.500+ analisten die de picks, waarschijnlijkheden en bewijsstukken krijgen - voordat de closing line zich aanpast.",
  "about.ctaButton": "Start Free Trial",

  /* Track Record page */
  "tr.metaTitle":
    "Trackrecord · Geverifieerde AI-Voorspellingsresultaten · BetsPlug",
  "tr.metaDesc":
    "Transparante, controleerbare resultaten voor elke BetsPlug-pick. Zie hoe onze AI-modellen ruwe wedstrijddata omzetten in een meetbare voorsprong - wekelijks gedocumenteerd, nooit cherry-picked.",
  "tr.breadcrumbHome": "Home",
  "tr.breadcrumbTrack": "Track Record",

  "tr.heroBadge": "Volledig transparant",
  "tr.heroTitleA": "Een track record dat je",
  "tr.heroTitleB": "écht kunt verifiëren.",
  "tr.heroSubtitle":
    "Elke pick die BetsPlug publiceert krijgt een tijdstempel, wordt gewogen op waarschijnlijkheid en gelogd in een publiek grootboek - winst of verlies. Zo worden de cijfers opgebouwd, en zo zetten echte gebruikers ze in de praktijk in.",
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
  "tr.kpi3Note": "Over 70+ voetbalcompetities",
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
    "Voor elke wedstrijd berekenen we 1.200+ features - Elo, xG-trends, rustdagen, reisafstand, onderlinge duels, scheidsrechterbias, marktbewegingen - en slaan ze op in een point-in-time feature store, zodat training nooit toekomstinformatie lekt.",
  "tr.pipe4Title": "Model-ensemble",
  "tr.pipe4Desc":
    "Vier onafhankelijke modellen stemmen over de uitkomst: een Poisson goals-model, een gradient-boosted classifier, een Elo-baseline en een markt-geïmpliceerde kalibrator. Hun waarschijnlijkheden worden gecombineerd via stacked regression.",
  "tr.pipe5Title": "Value-detectie",
  "tr.pipe5Desc":
    "We vergelijken de ensemble-waarschijnlijkheid met de beste beschikbare marktkoers. Alleen picks met een statistisch significant voordeel - ná commissie en verwachte slippage - krijgen het label 'value'.",
  "tr.pipe6Title": "Publiceren & beoordelen",
  "tr.pipe6Desc":
    "Picks krijgen een tijdstempel op het moment dat ze live gaan. Zodra de wedstrijd is afgelopen worden resultaten automatisch beoordeeld en naar het publieke track-record grootboek geschreven - winst, verlies of push.",

  "tr.methodBadge": "Methodologie",
  "tr.methodTitle": "Vier regels waar we niet vanaf wijken.",
  "tr.methodSubtitle":
    "Elk getal op deze pagina overleeft deze vangrails. Als een resultaat dat niet kan, telt het niet mee.",
  "tr.method1Title": "Alleen point-in-time",
  "tr.method1Desc":
    "Modellen worden getraind op data die daadwerkelijk beschikbaar was bij de aftrap - geen achteraf-inzichten, geen stilletjes opnieuw beoordeelde wedstrijden.",
  "tr.method2Title": "Closing-line gecorrigeerd",
  "tr.method2Desc":
    "ROI-cijfers trekken realistische slippage af tussen publicatie en de closing line, zodat je rendementen ziet die je ook echt had kunnen realiseren.",
  "tr.method3Title": "Niets wordt verwijderd",
  "tr.method3Desc":
    "Verloren picks blijven voor altijd in het grootboek staan. Een track record dat alleen winnaars laat zien is geen track record - dat is marketing.",
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
    "Ik filter het track record op Serie A en over/under-markten. In 2025 scoorde die selectie 61% op 412 picks - dus ik verhoog mijn inzet met vertrouwen op zondagochtend in plaats van te twijfelen.",
  "tr.case1Metric1Label": "Zijn gefilterde sample",
  "tr.case1Metric1Value": "412 picks",
  "tr.case1Metric2Label": "Geverifieerde hit rate",
  "tr.case1Metric2Value": "61,2%",
  "tr.case1Metric3Label": "Gemiddelde closing edge",
  "tr.case1Metric3Value": "+4,8%",
  "tr.case1Outcome":
    "Gebruikt het grootboek om één markt te kiezen waar het model een bewezen voorsprong heeft, en negeert de rest. Resultaat: minder weddenschappen, meer overtuiging, betere ROI.",

  "tr.case2Role": "Data-gedreven voetbalanalist",
  "tr.case2Name": "Priya, 29 · Londen",
  "tr.case2Quote":
    "Ik geef meer om kalibratie dan om hit rate. Als de Brier-score op de wedstrijduitslag onder de 0,07 blijft, weet ik dat de kansen eerlijk zijn - niet gewoon geluk.",
  "tr.case2Metric1Label": "Wedstrijduitslag Brier-score",
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
  "tr.transTitle": "Vertrouw ons niet op ons woord - lees het grootboek.",
  "tr.transSubtitle":
    "Elke beoordeelde voorspelling die we ooit hebben gepubliceerd is doorzoekbaar op wedstrijd, datum, markt en model. Geen filter dat de verliezers verstopt.",
  "tr.transCta1": "Bekijk live resultaten",
  "tr.transCta2": "Gratis proberen",

  /* How It Works page - dedicated deep-dive */
  "hiw.metaTitle":
    "Hoe Het Werkt · BetsPlug AI-Voorspellingsmotor",
  "hiw.metaDesc":
    "Een volledige, stapsgewijze uitleg van de BetsPlug-voorspelengine: hoe we data verzamelen, features bouwen, modellen trainen, value detecteren en picks publiceren die je zelf kunt verifiëren.",
  "hiw.breadcrumbHome": "Home",
  "hiw.breadcrumbHow": "Hoe het werkt",

  "hiw.heroBadge": "De BetsPlug-engine",
  "hiw.heroTitleA": "Hoe we ruwe wedstrijddata",
  "hiw.heroTitleB": "omzetten in voorspellingen die je kunt vertrouwen.",
  "hiw.heroSubtitle":
    "Elke pick op BetsPlug is het eindpunt van een lange, zorgvuldig ontworpen pipeline. Geen onderbuikgevoelens, geen cherry-picking, geen verborgen regels. Dit is het exacte proces - van het moment dat een wedstrijd wordt aangekondigd, tot het moment dat een geverifieerde pick op je dashboard verschijnt.",
  "hiw.heroCtaPrimary": "Bekijk het track record",
  "hiw.heroCtaSecondary": "Gratis proberen",
  "hiw.heroStatDataSources": "Databronnen",
  "hiw.heroStatLeagues": "Europese competities",
  "hiw.heroStatModels": "Ensemble-modellen",
  "hiw.heroStatUpdates": "Sync-cyclus",

  "hiw.overviewBadge": "De pipeline",
  "hiw.overviewTitle": "Zeven stappen. Volledige transparantie.",
  "hiw.overviewSubtitle":
    "Elke stap wordt onafhankelijk gebouwd en gemonitord. Dit is precies wat er onder de motorkap gebeurt.",

  "hiw.s1Badge": "Stap 01 · Data-acquisitie",
  "hiw.s1Title": "We beginnen waar de markt begint: bij de ruwe feed.",
  "hiw.s1Lead":
    "Rommel erin, rommel eruit. Onze pipeline begint dus met betrouwbare databronnen voor wedstrijden, uitslagen, standen en bookmaker-odds.",
  "hiw.s1P1":
    "Elke 6 uur synchroniseren we wedstrijden, uitslagen en standen van API-Football en football-data.org voor 6 Europese competities. Bookmaker-odds worden elke 2 uur opgehaald via The Odds API. Tijdens wedstrijduren (12:00-24:00 UTC) worden live scores elke 5 minuten bijgewerkt zodat je dashboard actueel blijft.",
  "hiw.s1P2":
    "Elk record krijgt een tijdstempel zodat we elk moment in de geschiedenis exact kunnen terugspelen zoals onze modellen het zagen - cruciaal voor eerlijke backtesting.",
  "hiw.s1Point1Title": "3 dataleveranciers",
  "hiw.s1Point1Desc":
    "API-Football, football-data.org en The Odds API - elk voor een ander aspect van de wedstrijd.",
  "hiw.s1Point2Title": "6-uur sync-cyclus",
  "hiw.s1Point2Desc":
    "Wedstrijden en voorspellingen worden elke 6 uur ververst. Live scores updaten elke 5 minuten tijdens wedstrijduren.",
  "hiw.s1Point3Title": "Point-in-time opslag",
  "hiw.s1Point3Desc":
    "Niets wordt overschreven. Elke wijziging is een nieuwe regel - geschiedenis is permanent.",

  "hiw.s2Badge": "Stap 02 · Opschonen & normaliseren",
  "hiw.s2Title":
    "Wij dwingen één bron van waarheid af voordat een model ook maar iets ziet.",
  "hiw.s2Lead":
    "Ruwe voetbaldata staat bekend als rommelig. Teamnamen verschillen per feed, competities hernoemen zichzelf, markten worden midden in een wedstrijd opgeschort. Wij lossen dat allemaal op - op een deterministische, reproduceerbare manier.",
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
  "hiw.s3Title": "Meerdere signalfamilies per wedstrijd - elk verdient zijn plek.",
  "hiw.s3Lead":
    "Een voorspelling is alleen zo scherp als de signalen waar hij op gebouwd is. Hier wordt een wedstrijd een gestructureerd profiel waar onze modellen over kunnen redeneren.",
  "hiw.s3P1":
    "Voor elke wedstrijd berekenen we features in verschillende families: Elo-ratings, Poisson-doelkansratios, competitiestanden, recente vorm, onderlinge geschiedenis en bookmaker-odds. Deze voeden drie onafhankelijke modellen die elk op een andere manier naar de data kijken.",
  "hiw.s3P2":
    "Alle features gebruiken alleen data die beschikbaar is vóór de aftrap. Onze modellen zien nooit de toekomst bij het genereren van een voorspelling - een essentiële bescherming tegen overfitting.",
  "hiw.s3Family1Title": "Elo-ratings",
  "hiw.s3Family1Desc": "Dynamische teamsterkte-ratings die na elke wedstrijduitslag worden bijgewerkt.",
  "hiw.s3Family2Title": "Poisson-doelkansen",
  "hiw.s3Family2Desc": "Verwachte aanvals- en verdedigingsratio's per team op basis van recente wedstrijden.",
  "hiw.s3Family3Title": "Onderling",
  "hiw.s3Family3Desc": "Historische ontmoetingen tussen de twee teams, thuis en uit.",
  "hiw.s3Family4Title": "Bookmaker-odds",
  "hiw.s3Family4Desc": "Pre-match odds van grote bookmakers via The Odds API.",
  "hiw.s3Family5Title": "Competitiestanden",
  "hiw.s3Family5Desc": "Huidige positie, punten, doelsaldo en recente vorm.",
  "hiw.s3Family6Title": "Wedstrijdcontext",
  "hiw.s3Family6Desc": "Thuis/uit-status, schema en wedstrijddetails.",

  "hiw.s4Badge": "Stap 04 · Model-ensemble",
  "hiw.s4Title": "Drie onafhankelijke modellen. Eén eerlijke waarschijnlijkheid.",
  "hiw.s4Lead":
    "Een enkel model heeft altijd blinde vlekken. Daarom draaien we drie verschillende statistische benaderingen en combineren hun voorspellingen met gewogen middeling.",
  "hiw.s4P1":
    "Elk model vangt een ander aspect van de wedstrijddynamiek. Hun voorspellingen worden gecombineerd tot één set win/gelijk/verlies-waarschijnlijkheden plus een confidence-score voor elke aankomende wedstrijd.",
  "hiw.s4Model1Name": "Elo Rating Model",
  "hiw.s4Model1Desc":
    "Een dynamische teamsterkte-rating die na elk resultaat wordt bijgewerkt. Zet het ratingverschil tussen twee teams om in winstkansen.",
  "hiw.s4Model2Name": "Poisson Goal Model",
  "hiw.s4Model2Desc":
    "Schat verwachte aanvals- en verdedigingsratio's per team en integreert over alle mogelijke eindstanden om wedstrijduitkomst-waarschijnlijkheden te produceren.",
  "hiw.s4Model3Name": "Logistische Regressie",
  "hiw.s4Model3Desc":
    "Een statistische classifier die meerdere wedstrijdfeatures - vorm, stand, thuisvoordeel - gebruikt om wedstrijduitslagen direct te voorspellen.",
  "hiw.s4BlendTitle": "Gewogen middeling",
  "hiw.s4BlendDesc":
    "De drie waarschijnlijkheden worden gecombineerd via gewogen middeling. De huidige weights (Elo 1.0, Poisson 1.5, Logistic 1.0) geven iets meer invloed aan het Poisson-model.",

  "hiw.s5Badge": "Stap 05 · Value-detectie",
  "hiw.s5Title": "We publiceren alleen picks waarvan de edge de echte wereld overleeft.",
  "hiw.s5Lead":
    "Gelijk hebben is niet genoeg. Een pick wordt pas een pick wanneer onze waarschijnlijkheid waarde suggereert ten opzichte van de beschikbare odds.",
  "hiw.s5P1":
    "We vergelijken onze ensemble-waarschijnlijkheden met bookmaker-odds opgehaald via The Odds API. Onze Strategy Lab filtert voorspellingen met regels die gevalideerd zijn door walk-forward backtesting - zoals het vereisen van hoge thuiswinstkans of lage gelijkspeelkans.",
  "hiw.s5P2":
    "Momenteel hebben 3 strategieën de statistische validatie doorstaan met positieve backtested ROI over 90 dagen. Maar dit zijn backtested resultaten op een beperkte steekproef - de werkelijke prestaties zullen variëren. Daar zijn we eerlijk over.",
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
    "Op het moment dat een pick wordt gegenereerd, krijgt hij een tijdstempel, wordt hij ondertekend, en gepubliceerd op zowel je dashboard als ons publieke grootboek - exact dezelfde seconde. Jij en een toezichthouder zien exact hetzelfde record.",
  "hiw.s6P2":
    "Zodra de wedstrijd is afgelopen wordt elke pick automatisch beoordeeld aan de hand van de officiële resultaat-feed. Winst, verlies en push worden allemaal vastgelegd. Verloren picks blijven voor altijd in het grootboek staan - want een track record dat alleen winnaars laat zien is geen track record, dat is marketing.",
  "hiw.s6Point1Title": "Publicatie op de seconde",
  "hiw.s6Point1Desc":
    "Abonnees en het publieke grootboek worden gelijktijdig bijgewerkt - geen backdating mogelijk.",
  "hiw.s6Point2Title": "Automatische beoordeling",
  "hiw.s6Point2Desc":
    "Resultaten worden gescoord vanuit de officiële feed, niet door een mens die de andere kant op zou kunnen kijken.",
  "hiw.s6Point3Title": "Niets wordt verwijderd",
  "hiw.s6Point3Desc":
    "Verloren picks zijn permanent. Het grootboek is by design append-only.",

  "hiw.s7Badge": "Stap 07 · Continue evaluatie",
  "hiw.s7Title": "Elke voorspelling wordt beoordeeld aan het echte resultaat.",
  "hiw.s7Lead":
    "Voorspellingen betekenen niets als je ze niet controleert. Ons systeem evalueert automatisch elke voorspelling zodra de wedstrijd is afgelopen.",
  "hiw.s7P1":
    "Elke 6 uur, nadat resultaten zijn gesynchroniseerd, scoort het systeem alle afgelopen voorspellingen. Elke pick wordt geëvalueerd met Brier-score en log-loss metrics, en gemarkeerd als correct of incorrect. Zo kunnen we de werkelijke nauwkeurigheid in de tijd volgen.",
  "hiw.s7P2":
    "De huidige 3-way nauwkeurigheid (thuis/gelijk/uit) ligt rond de 50% - boven de 33% willekeurige baseline, maar niet buitengewoon. We publiceren alle resultaten, winst en verlies, zodat je het track record zelf kunt verifiëren.",
  "hiw.s7Bullet1": "6-uur evaluatiecyclus",
  "hiw.s7Bullet2": "Brier-score en log-loss tracking",
  "hiw.s7Bullet3": "Alle voorspellingen automatisch beoordeeld",
  "hiw.s7Bullet4": "Winst en verlies beide permanent gepubliceerd",

  "hiw.proofBadge": "Waarom dit uitmaakt",
  "hiw.proofTitle": "De reden dat onze voorspellingen ook echt overeind blijven.",
  "hiw.proofSubtitle":
    "Elke keuze in deze pipeline bestaat om één reden: om je een eerlijke, datagedreven waarschijnlijkheid te geven - geen gok.",
  "hiw.proof1Title": "Geen hindsight bias",
  "hiw.proof1Desc":
    "Modellen zien alleen data die beschikbaar is vóór de aftrap. Voorspellingen worden gegenereerd en getijdstempeld voordat de wedstrijd begint.",
  "hiw.proof2Title": "Ensemble, geen éénpitter",
  "hiw.proof2Desc":
    "Drie onafhankelijke modellen (Elo, Poisson, Logistisch) controleren elkaar. Eén blinde vlek kan niet de hele voorspelling vergiftigen.",
  "hiw.proof3Title": "Backtested strategieën",
  "hiw.proof3Desc":
    "Strategy Lab-filters worden gevalideerd met walk-forward backtesting en bootstrap-betrouwbaarheidsintervallen voordat ze worden gepubliceerd.",
  "hiw.proof4Title": "Volledige transparantie",
  "hiw.proof4Desc":
    "Je kunt elke voorspelling die we hebben gepubliceerd verifiëren. Winst en verlies. De huidige 3-way nauwkeurigheid is circa 50%.",
  "hiw.proof5Title": "Elke 6 uur geëvalueerd",
  "hiw.proof5Desc":
    "Elke afgelopen wedstrijd wordt automatisch gescoord. Brier-score en log-loss volgen de kalibratie in de tijd.",
  "hiw.proof6Title": "Gebouwd door mensen die shippen",
  "hiw.proof6Desc":
    "Een tweekoppig team van voetbalfanaten met een ICT-achtergrond. Elke regel van deze pipeline is met de hand geschreven, niet in elkaar geklikt uit plugins.",

  "hiw.faqBadge": "Eerlijke antwoorden",
  "hiw.faqTitle": "De vragen die elke serieuze analist ons stelt.",
  "hiw.faqSubtitle":
    "Als je eerder een tipstersite hebt geprobeerd, ben je waarschijnlijk teleurgesteld. Hier is precies waarom BetsPlug anders is.",
  "hiw.faq1Q": "Hoe nauwkeurig zijn jullie voorspellingen?",
  "hiw.faq1A":
    "Onze 3-way wedstrijdvoorspellingen (thuis/gelijk/uit) scoren rond de 50% nauwkeurigheid. Dat is boven de 33% willekeurige baseline, maar we zijn eerlijk - het is geen magisch getal. Elke voorspelling krijgt een tijdstempel vóór de aftrap en wordt automatisch beoordeeld na de wedstrijd, dus je kunt het track record zelf verifiëren.",
  "hiw.faq2Q": "Wat gebeurt er bij een verliesreeks?",
  "hiw.faq2A":
    "Verloren voorspellingen blijven permanent zichtbaar. We publiceren ze net zo openlijk als de winnaars. Onze Strategy Lab-strategieën zijn backtested op een steekproef van 90 dagen, dus we verwachten variantie. Verliesreeksen komen voor - dat is voetbal.",
  "hiw.faq3Q": "Waarom niet gewoon één heel slim model gebruiken?",
  "hiw.faq3A":
    "Omdat elk model blinde vlekken heeft. Onze drie modellen - Elo-ratings, Poisson-doelmodel en Logistische regressie - vangen elk andere patronen. Het ensemble met gewogen middeling presteert consistent beter dan elk individueel lid.",
  "hiw.faq4Q": "Kan ik daadwerkelijk winst maken met deze voorspellingen?",
  "hiw.faq4A":
    "Onze backtested strategieën tonen positieve ROI over 90 dagen, maar backtesting is geen garantie. De werkelijke prestaties hangen af van de odds die je krijgt, timing en variantie. Wij leveren de data en analyse - de rest is aan jou.",
  "hiw.faq5Q": "Welke voetbalcompetities dekken jullie?",
  "hiw.faq5A":
    "We dekken 70+ voetbalcompetities wereldwijd, waaronder de Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie en alle grote UEFA-competities. We voegen voortdurend nieuwe competities toe naarmate onze modellen rijpen.",
  "hiw.faq6Q": "Is dit gokadvies?",
  "hiw.faq6A":
    "Nee. BetsPlug is een pure voetbal-analytics platform. Wij publiceren waarschijnlijkheden, expected values en een verifieerbaar track record. Wat je met die informatie doet, is volledig jouw eigen beslissing.",

  "hiw.ctaBadge": "Klaar om het in actie te zien?",
  "hiw.ctaTitle": "Stop met gokken. Begin met de pipeline te vertrouwen.",
  "hiw.ctaSubtitle":
    "Nu weet je precies hoe de pipeline werkt. Bekijk de voorspellingen die hij produceert - live, getijdstempeld en klaar om te verifiëren.",
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
    "Schakel over naar jaarlijks en bespaar 20% - dat is {amount} per jaar korting.",
  "checkout.yearlySaving": "Je bespaart {amount} per jaar",

  /* Upsells */
  "checkout.upsellsTitle": "Haal alles uit je abonnement",
  "checkout.upsellsSubtitle":
    "Optionele extra's die de meeste leden toevoegen voor de volledige edge. Elke extra is apart opzegbaar.",
  "checkout.upsell1Title": "VIP Telegram Alerts",
  "checkout.upsell1Desc":
    "Ontvang alle tips direct via Telegram - je hoeft niet in te loggen om op de hoogte te blijven van elke edge.",
  "checkout.upsell1Badge": "Meest gekozen",
  "checkout.upsell2Title": "Wekelijks Strategie-rapport",
  "checkout.upsell2Desc":
    "Elke maandag: een 20-pagina PDF met ROI-analyse, modeldrift en aankomende edges.",
  "checkout.upsell3Title": "Priority 1-op-1 Support",
  "checkout.upsell3Desc":
    "Direct contact met onze analisten - reactie binnen 2 uur, 7 dagen per week.",
  "checkout.upsell4Title": "Tip van de Dag toegang",
  "checkout.upsell4Desc":
    "Elke dag één high-confidence pick in je inbox - onze hoogste-edge weddenschap voor de komende 24 uur.",
  "checkout.upsellIncluded": "Inbegrepen bij Platinum",
  "checkout.upsellPerMonth": "/mnd",

  /* Trial picker */
  "checkout.trialSectionTitle": "Hoe wil je starten?",
  "checkout.trialSectionSubtitle":
    "Probeer BetsPlug risicovrij of sla de proefperiode over voor directe volledige toegang.",
  "checkout.trialOption1Title": "7 dagen gratis proberen",
  "checkout.trialOption1Desc":
    "7 dagen volledige toegang. Vandaag wordt er niets afgeschreven — Stripe verifieert alleen je kaart. Eerste afschrijving op {date} als je niet opzegt.",
  "checkout.trialOption1Badge": "Aanbevolen",
  "checkout.trialOption2Title": "Direct abonneren",
  "checkout.trialOption2Desc":
    "Vandaag afgeschreven, geen proefperiode. Ideaal als je ons track record al kent.",
  "checkout.trialPausedNote":
    "Zeg je op tijdens de proefperiode? Dan wordt je account gepauzeerd - niet verwijderd. Je kunt altijd hervatten.",
  "checkout.trialBadge": "7 dagen gratis proberen actief",
  "checkout.trialDueToday": "€0,00 vandaag",
  "checkout.trialFirstCharge": "Eerste afschrijving op {date}",
  "checkout.trialNotAvailable":
    "De gratis proefperiode is alleen beschikbaar bij maandelijkse en jaarlijkse abonnementen.",
  "checkout.trialPaymentNote":
    "Vandaag wordt er niets afgeschreven — Stripe verifieert alleen je kaart zodat je abonnement op {date} kan starten. Zeg je op vóór die datum? Dan wordt er nooit iets in rekening gebracht.",
  "checkout.submitTrial": "Start mijn 7 dagen gratis proberen",

  "checkout.freeTrial": "14 dagen gratis proberen",
  "checkout.trialNote":
    "Vandaag wordt er niets afgeschreven — Stripe verifieert alleen je kaart zodat je abonnement kan starten. Altijd opzegbaar tijdens de proefperiode.",
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

  "checkout.paymentTitle": "Betaling",
  "checkout.paymentSubtitle":
    "Controleer je bestelling en ga verder naar onze beveiligde betaalpagina.",
  "checkout.stripeRedirectTitle": "Veilig betalen via Stripe",
  "checkout.stripeRedirectDesc":
    "Na het klikken op de onderstaande knop word je doorgestuurd naar de beveiligde betaalpagina van Stripe. We accepteren alle gangbare creditcards, betaalpassen en PayPal.",

  "checkout.agreeTerms": "Ik ga akkoord met de",
  "checkout.termsLink": "Algemene Voorwaarden",
  "checkout.and": "en het",
  "checkout.privacyLink": "Privacybeleid",
  "checkout.next": "Doorgaan",
  "checkout.back": "Terug",
  "checkout.submit": "Start mijn abonnement",
  "checkout.processing": "Bezig…",
  "checkout.weAccept": "Wij accepteren",

  "checkout.footer.secure": "256-bit SSL versleutelde checkout",
  "checkout.footer.guarantee": "14 dagen niet-goed-geld-terug",
  "checkout.footer.support": "Hulp nodig? support@betsplug.com",
  "checkout.footer.copy": "© {year} BetsPlug. Alle rechten voorbehouden.",

  "checkout.successTitle": "Welkom bij BetsPlug!",
  "checkout.successBody":
    "Je abonnement is geactiveerd! Je wordt nu doorgestuurd naar je dashboard.",
  "checkout.successCta": "Naar dashboard",

  /* Welcome / thank-you */
  "welcome.meta.title": "Welkom aan Boord · BetsPlug",
  "welcome.meta.description":
    "Je BetsPlug-lidmaatschap staat klaar. Log in om de picks van vandaag te zien, je ROI bij te houden en slimmer te beginnen winnen.",

  "welcome.badge": "Je bent binnen.",
  "welcome.title": "Welkom in de inner circle.",
  "welcome.titleHighlight": "Hier begint het.",
  "welcome.subtitle":
    "Geen tipsters meer achterna zitten, geen twijfels meer. Je maakt nu deel uit van een community die wint met data, discipline en een beetje lef. Laat dit het jaar worden waarin je stopt met gokken - en start met investeren.",

  "welcome.trialTitle": "Je 7-daagse gratis proefperiode is actief",
  "welcome.trialBody":
    "Je wordt vandaag nog niets in rekening gebracht. Annuleer binnen 7 dagen en je account wordt rustig gepauzeerd - geen vragen, geen druk.",
  "welcome.paidTitle": "Je lidmaatschap is actief",
  "welcome.paidBody":
    "Je account is volledig ontgrendeld. Elke pick, elke statistiek, elke edge - het staat klaar in het dashboard.",

  "welcome.ctaPrimary": "Log in op je dashboard",
  "welcome.ctaSecondary": "Terug naar de homepage",
  "welcome.emailHint":
    "Er is een bevestigingsmail onderweg. Check je inbox (en voor de zekerheid ook je spam).",

  "welcome.nextTitle": "Dit is wat er nu gebeurt",
  "welcome.next1Title": "Log in met je nieuwe account",
  "welcome.next1Body":
    "Gebruik het e-mailadres en wachtwoord dat je net hebt aangemaakt om het dashboard te openen.",
  "welcome.next2Title": "Bekijk de picks van vandaag",
  "welcome.next2Body":
    "Elke ochtend verschijnen zorgvuldig geselecteerde, data-gedreven picks. Geen ruis, alleen waarde.",
  "welcome.next3Title": "Volg je ROI",
  "welcome.next3Body":
    "Zie je bankroll groeien met onze live tracker en wekelijkse performance-rapporten.",

  "welcome.statMembers": "actieve leden",
  "welcome.statRoi": "gemiddelde maandelijkse ROI",
  "welcome.statPicks": "picks de afgelopen 30 dagen",

  "welcome.quote":
    "\"Eindelijk een dienst die wedden behandelt als een vak, niet als een loterij. BetsPlug heeft mijn weekends compleet veranderd.\"",
  "welcome.quoteAuthor": " - Thomas R., lid sinds 2024",

  "welcome.footerNote":
    "Vragen? Mail ons op support@betsplug.com - er antwoordt een echt mens.",

  /* Quickstart timeline */
  "welcome.quickstartEyebrow": "Quickstart",
  "welcome.quickstartTitle": "Jouw eerste 10 minuten met BetsPlug",
  "welcome.quickstartSubtitle":
    "Vijf simpele stappen van hier tot je eerste data-gedreven pick. Volg het pad - wij begeleiden je van begin tot eind.",
  "welcome.quickstartDuration": "± 10 minuten totaal",

  "welcome.qs1Title": "Bevestig je e-mail",
  "welcome.qs1Body":
    "Open de bevestigingsmail die we net hebben gestuurd en klik op de groene knop om je account te verifiëren.",
  "welcome.qs1Duration": "1 min",

  "welcome.qs2Title": "Log in op je dashboard",
  "welcome.qs2Body":
    "Gebruik het e-mailadres en wachtwoord dat je net hebt aangemaakt. Zet \"Onthoud dit apparaat\" aan voor directe toegang de volgende keer.",
  "welcome.qs2Duration": "30 sec",

  "welcome.qs3Title": "Stel je bankroll in",
  "welcome.qs3Body":
    "Vertel ons je startbudget en unit-grootte. Wij berekenen stake-adviezen die passen bij jouw risicoprofiel.",
  "welcome.qs3Duration": "2 min",

  "welcome.qs4Title": "Bekijk de picks van vandaag",
  "welcome.qs4Body":
    "Blader door de dagelijkse picks, filter op competitie of odds-range, en lees de onderbouwing achter elke tip.",
  "welcome.qs4Duration": "3 min",

  "welcome.qs5Title": "Plaats je eerste weddenschap",
  "welcome.qs5Body":
    "Kies de tip die bij je past, plaats de inzet bij je bookmaker en voeg hem toe aan je tracker. Klaar - je bent live.",
  "welcome.qs5Duration": "3 min",

  /* Dashboard tour */
  "welcome.tourEyebrow": "Dashboard-tour",
  "welcome.tourTitle": "Waar vind je wat, zodra je binnen bent",
  "welcome.tourSubtitle":
    "Even de weg wijzen. Het dashboard is opgedeeld in 6 overzichtelijke secties - hier lees je wat elke sectie doet zodat je je vanaf minuut één thuis voelt.",

  "welcome.tour1Title": "Picks van vandaag",
  "welcome.tour1Body":
    "Het eerste wat je ziet na het inloggen. Alle data-gedreven picks van de dag, gesorteerd op confidence-score, met volledige onderbouwing, odds en aanbevolen inzet.",
  "welcome.tour1Where": "Sidebar → Picks",

  "welcome.tour2Title": "Bankroll-tracker",
  "welcome.tour2Body":
    "Jouw persoonlijke winst/verlies. Stel een startbankroll in, log je weddenschappen met één klik en zie je ROI live groeien in grafieken.",
  "welcome.tour2Where": "Sidebar → Bankroll",

  "welcome.tour3Title": "Track record",
  "welcome.tour3Body":
    "De volledige, ongefilterde historie van elke pick die we ooit hebben gepost. Filter op competitie, markt, tipster of datum - niets wordt verborgen.",
  "welcome.tour3Where": "Sidebar → Track record",

  "welcome.tour4Title": "Live wedstrijden",
  "welcome.tour4Body":
    "Real-time odds, vorm en in-play alerts voor elke wedstrijd die we volgen. Spot waarde terwijl het gebeurt, niet na het laatste fluitsignaal.",
  "welcome.tour4Where": "Sidebar → Live",

  "welcome.tour5Title": "Community & Telegram",
  "welcome.tour5Body":
    "Chat met andere leden, stel vragen aan de experts en ontvang direct een melding zodra er een nieuwe pick online komt - ook als je niet op de site bent.",
  "welcome.tour5Where": "Bovenbalk → Community",

  "welcome.tour6Title": "Account & facturering",
  "welcome.tour6Body":
    "Beheer je pakket, werk je betaalgegevens bij, wissel van maandelijks naar jaarlijks, download facturen of zeg altijd direct op - allemaal op één plek.",
  "welcome.tour6Where": "Rechtsboven avatar → Instellingen",

  "welcome.tourProTipTitle": "Pro tip",
  "welcome.tourProTipBody":
    "Druk overal in het dashboard op ⌘K (of Ctrl+K op Windows) om in twee toetsaanslagen naar elke sectie te springen.",

  /* Login */
  "login.meta.title": "Inloggen · BetsPlug",
  "login.meta.description":
    "Log in op je BetsPlug-account om de picks van vandaag te bekijken, je ROI te volgen en je abonnement te beheren.",

  "login.badge": "Ledengedeelte",
  "login.title": "Welkom terug.",
  "login.titleHighlight": "Tijd voor je edge.",
  "login.subtitle":
    "Log in om de picks van vandaag te bekijken, je live bankroll-tracker en de nieuwste winsten uit de community.",

  "login.email": "E-mailadres",
  "login.emailPh": "jij@voorbeeld.nl",
  "login.emailError": "Vul een geldig e-mailadres in",

  "login.password": "Wachtwoord",
  "login.passwordPh": "Je wachtwoord",
  "login.passwordError": "Wachtwoord is verplicht",
  "login.showPassword": "Wachtwoord tonen",
  "login.hidePassword": "Wachtwoord verbergen",

  "login.rememberDevice": "Onthoud dit apparaat",
  "login.rememberHint":
    "Blijf 30 dagen ingelogd op dit apparaat. Niet gebruiken op gedeelde computers.",

  "login.forgot": "Wachtwoord vergeten?",
  "login.submit": "Inloggen",
  "login.submitting": "Bezig met inloggen…",

  "login.orDivider": "of ga verder met",
  "login.google": "Verder met Google",
  "login.apple": "Verder met Apple",

  "login.noAccount": "Nog geen account?",
  "login.createAccount": "Start je gratis proefperiode",

  "login.errorTitle": "Inloggen mislukt",
  "login.errorGeneric":
    "Het e-mailadres of wachtwoord dat je hebt ingevuld klopt niet. Controleer het en probeer het opnieuw.",

  "login.trust1": "256-bit SSL versleuteld",
  "login.trust2": "AVG-proof",
  "login.trust3": "Altijd opzegbaar",

  /* Dashboard Preview */
  "dashPrev.badge": "Jouw commandocentrum",
  "dashPrev.titleA": "Elke premium feature,",
  "dashPrev.titleHighlight": "binnen één klik",
  "dashPrev.titleB": ".",
  "dashPrev.subtitle":
    "Log in en stap direct in jouw persoonlijke BetsPlug-dashboard - een overzichtelijk, afleidingsvrij commandocentrum waar elke dagelijkse pick, elk model-inzicht, elke live wedstrijd en elk historisch resultaat op één plek samenkomt. Geen spreadsheets, geen gokwerk, geen tabjes meer wisselen.",
  "dashPrev.feature1Title": "Dagelijkse picks in één oogopslag",
  "dashPrev.feature1Desc":
    "Zie direct bij het inloggen de picks met de hoogste confidence van vandaag - gesorteerd op edge, zekerheid en aftraptijd.",
  "dashPrev.feature2Title": "Live modelnauwkeurigheid",
  "dashPrev.feature2Desc":
    "Realtime accuracy per competitie en per model. Zie je edge updaten terwijl de resultaten binnenkomen.",
  "dashPrev.feature3Title": "Transparante track record",
  "dashPrev.feature3Desc":
    "Elke pick die we ooit hebben gemaakt - winst, verlies en ROI - publiekelijk gelogd en filterbaar op datum of strategie.",
  "dashPrev.feature4Title": "Strategy Lab & alerts",
  "dashPrev.feature4Desc":
    "Bouw eigen filters, bookmark je favoriete competities en ontvang direct een melding zodra er een premium pick live staat.",
  "dashPrev.cta": "Ontdek het dashboard",
  "dashPrev.mockTitle": "Dashboard",
  "dashPrev.mockSubtitle": "Modelprestaties en realtime systeemstatus in één overzicht",
  "dashPrev.mockLive": "Live data",
  "dashPrev.mockKpi1Label": "Totaal voorspellingen",
  "dashPrev.mockKpi2Label": "Totale nauwkeurigheid",
  "dashPrev.mockKpi2Note": "t.o.v. vorige periode",
  "dashPrev.mockKpi3Label": "Gem. edge",
  "dashPrev.mockKpi3Note": "hoger is beter",
  "dashPrev.mockKpi4Label": "Gem. confidence",
  "dashPrev.mockKpi4Note": "Zekerheid van het model",
  "dashPrev.mockNavDashboard": "Dashboard",
  "dashPrev.mockNavPredictions": "Voorspellingen",
  "dashPrev.mockNavResults": "Resultaten",
  "dashPrev.mockNavBet": "Pick van de dag",
  "dashPrev.mockNavTrack": "Track record",
  "dashPrev.mockNavLive": "Live wedstrijden",
  "dashPrev.mockChartTitle": "Trend modelprestaties",
  "dashPrev.mockChartSub": "Rollende nauwkeurigheid over tijd",
  "dashPrev.mockAccuracyTitle": "Nauwkeurigheid per competitie",
  "dashPrev.mockAccuracySub": "Voorspelnauwkeurigheid gesegmenteerd per competitie",

  /* ── Match Predictions (publieke teaser) ─────────────────── */
  "matchPred.metaTitle": "AI Wedstrijdvoorspellingen · Gratis Picks · BetsPlug",
  "matchPred.metaDesc":
    "Bekijk 3 gratis AI-wedstrijdvoorspellingen met winkansen en betrouwbaarheidsscores. Ontgrendel alle aankomende wedstrijden met een BetsPlug-abonnement.",
  "matchPred.eyebrow": "Gratis preview",
  "matchPred.title": "AI-wedstrijdvoorspellingen voor aankomende wedstrijden",
  "matchPred.subtitle":
    "Een preview van de wedstrijden die ons Ensemble-model nu analyseert. Bekijk 3 volledige voorspellingen gratis - ontgrendel de rest met een proefperiode.",
  "matchPred.trust1": "4-model Ensemble",
  "matchPred.trust2": "Live kansberekening",
  "matchPred.trust3": "Openbaar track record",
  "matchPred.statFree": "Gratis previews",
  "matchPred.statUpcoming": "Aankomende wedstrijden",
  "matchPred.statLocked": "Vergrendelde picks",
  "matchPred.statAvgConf": "Gem. betrouwbaarheid",
  "matchPred.freeHeading": "Jouw 3 gratis voorspellingen",
  "matchPred.freeSub":
    "Volledige winkansen, betrouwbaarheidsscores en modeldetails - van het huis.",
  "matchPred.lockedHeading": "Premium wedstrijdpool",
  "matchPred.lockedSub":
    "Deze wedstrijden zijn voorbehouden aan leden. Ontgrendel elke pick, elke competitie, elke dag.",
  "matchPred.bannerBadge": "Alleen voor leden",
  "matchPred.bannerTitle": "Ontgrendel elke wedstrijd",
  "matchPred.bannerDesc":
    "Sluit je aan bij BetsPlug en zie alle aankomende voorspellingen uit de topcompetities - met betrouwbaarheidsscores, live updates en ons volledige publieke track record.",
  "matchPred.bannerBullet1": "Onbeperkte dagelijkse AI-voorspellingen",
  "matchPred.bannerBullet2": "Alle 4 modellen + Ensemble-output",
  "matchPred.bannerBullet3": "Live kansberekening",
  "matchPred.bannerBullet4": "Altijd opzegbaar - 14 dagen retour",
  "matchPred.bannerCta": "Ontgrendel alle wedstrijden",
  "matchPred.bannerCtaSecondary": "Bekijk prijzen",
  "matchPred.bannerNote": "Slechts €0,01 activeert je 7-daagse volledige-toegang-proef.",
  "matchPred.ctaFinalTitle": "Stop met gokken. Beslis met data.",
  "matchPred.ctaFinalDesc":
    "Elke aankomende wedstrijd, elk model, elke betrouwbaarheidsscore - in enkele seconden ontgrendeld. Sluit je aan bij wedders die transparante analyses vertrouwen.",
  "matchPred.ctaFinalButton": "Start je gratis proefperiode",
  "matchPred.ctaFinalSecondary": "Bekijk abonnementen",
  "matchPred.loadingTitle": "Aankomende wedstrijden laden…",
  "matchPred.emptyTitle": "Geen aankomende wedstrijden in dit venster",
  "matchPred.emptyDesc":
    "Elke ochtend worden nieuwe wedstrijden ingepland. Kom later terug of bekijk ons track record.",
  "matchPred.emptyCta": "Bekijk track record",
  "matchPred.errorTitle": "Kan live fixtures niet laden",
  "matchPred.errorDesc":
    "Onze wedstrijdfeed is tijdelijk niet beschikbaar. Het volledige dashboard werkt nog steeds voor leden.",
  "matchPred.refresh": "Vernieuwen",
  "matchPred.lockedLabel": "Vergrendeld",
  "matchPred.confidenceLabel": "Betrouwbaarheid",
  "matchPred.winProbLabel": "Winkans",
  "matchPred.kickoffLabel": "Aftrap",
  "matchPred.unlockThis": "Ontgrendel deze pick",

  /* B2B Partnerships */
  "b2b.badge": "Zakelijke samenwerkingen",
  "b2b.titleA": "Werk samen met BetsPlug",
  "b2b.titleB": "voor slimmere voetbalanalyses",
  "b2b.subtitle":
    "We werken samen met bedrijven in het voetbalanalyse-ecosysteem. Van datalicenties tot white-label oplossingen \u2014 laten we samen iets bouwen.",
  "b2b.partnershipsBadge": "Samenwerkingsmodellen",
  "b2b.partnershipsTitle": "Hoe we samenwerken",
  "b2b.partnershipsSubtitle":
    "Of je nu ruwe data nodig hebt, een kant-en-klare voorspellingsmotor of een omzetdelingsmodel \u2014 we hebben een passend partnerschap voor je.",
  "b2b.dataLicensing": "Datalicenties",
  "b2b.dataLicensingDesc":
    "Toegang tot onze AI-voorspellingen, Elo-ratings en wedstrijddata via een robuuste API. Ideaal voor bookmakers, mediabedrijven en analyseplatforms.",
  "b2b.whiteLabel": "White-Label Oplossingen",
  "b2b.whiteLabelDesc":
    "Integreer de voorspellingsmotor van BetsPlug in je eigen platform. Eigen branding, dedicated support en flexibele prijzen.",
  "b2b.affiliate": "Partnerprogramma",
  "b2b.affiliateDesc":
    "Verdien competitieve commissies door gebruikers naar BetsPlug te verwijzen. Wij bieden marketingmaterialen, tracking en tijdige uitbetalingen.",
  "b2b.media": "Media & Content",
  "b2b.mediaDesc":
    "Werk samen aan voetbalanalyse-content, onderzoeksrapporten en datajournalistiek. Ideaal voor voetbalmedia en uitgevers.",
  "b2b.whyPartner": "Waarom samenwerken",
  "b2b.whyPartnerTitle": "Gebouwd voor schaal, bewezen in het openbaar",
  "b2b.usp1": "AI-modellen gecombineerd in \u00e9\u00e9n ensemble",
  "b2b.usp2": "Voetbalcompetities gedekt",
  "b2b.usp3": "Actieve analisten op het platform",
  "b2b.usp4": "Publieke transparantie over resultaten",
  "b2b.contactTitle": "Laten we zaken doen",
  "b2b.contactSubtitle":
    "Ge\u00efnteresseerd in een samenwerking? Neem contact op met ons zakelijke team en we reageren binnen 24 uur.",
  "b2b.contactCta": "Neem contact op",
  "b2b.email": "business@betsplug.com",

  /* ── Dashboard navigation ─────────────────────────────────── */
  "nav.dashboard": "Dashboard",
  "nav.search": "Zoeken",
  "nav.live_matches": "Live Wedstrijden",
  "nav.bet_of_the_day": "Tip van de Dag",
  "nav.strategy_lab": "Strategie Lab",
  "nav.trackrecord": "Trackrecord",
  "nav.reports": "Rapporten",
  "nav.admin": "Beheer",
  "nav.settings": "Instellingen",
  "nav.deals": "Aanbiedingen",
  "nav.jouwRoute": "Jouw Route",
  "nav.weekly_report": "Weekrapport",
  "nav.results": "Resultaten",

  /* ── Dashboard page titles ────────────────────────────────── */
  "page.dashboard": "Dashboard",
  "page.search": "Zoeken",
  "page.live_matches": "Live Wedstrijden",
  "page.predictions": "Voorspellingen",
  "page.strategy_lab": "Strategie Lab",
  "page.trackrecord": "Trackrecord",
  "page.reports": "Rapporten",
  "page.admin": "Beheerpaneel",
  "page.settings": "Instellingen",
  "page.deals": "Aanbiedingen",

  /* ── Dashboard common labels ──────────────────────────────── */
  "common.dashboard": "Dashboard",
  "common.search": "Zoeken",
  "common.live_matches": "Live Wedstrijden",
  "common.predictions": "Voorspellingen",
  "common.strategy_lab": "Strategie Lab",
  "common.trackrecord": "Trackrecord",
  "common.reports": "Rapporten",
  "common.admin": "Beheer",
  "common.settings": "Instellingen",
  "common.deals": "Aanbiedingen",
  "common.win": "Winst",
  "common.loss": "Verlies",
  "common.draw": "Gelijkspel",
  "common.home": "Thuis",
  "common.away": "Uit",
  "common.confidence": "Betrouwbaarheid",
  "common.probability": "Kans",
  "common.accuracy": "Nauwkeurigheid",
  "common.loading": "Laden...",
  "common.error": "Fout",
  "common.no_data": "Geen gegevens beschikbaar",
  "common.save": "Opslaan",
  "common.cancel": "Annuleren",
  "common.confirm": "Bevestigen",
  "common.close": "Sluiten",
  "common.back": "Terug",
  "common.next": "Volgende",
  "common.submit": "Verzenden",
  "common.refresh": "Verversen",
  "common.export": "Exporteren",
  "common.filter": "Filteren",
  "common.sort": "Sorteren",
  "common.search_placeholder": "Zoek teams, wedstrijden, competities...",
  "common.language": "Taal",
  "common.notifications": "Meldingen",
  "common.sign_out": "Uitloggen",
  "common.all_systems": "Alle systemen operationeel",

  /* ── Dashboard phrases ────────────────────────────────────── */
  "phrase.simulation_disclaimer": "Getoonde resultaten zijn gebaseerd op gesimuleerde modeluitvoer.",
  "phrase.educational_only": "Alleen voor analytische en educatieve doeleinden.",
  "phrase.no_financial_advice": "Geen financieel advies.",
  "phrase.live_data": "Live gegevens",
  "phrase.last_updated": "Laatst bijgewerkt",
  "phrase.view_all": "Alles bekijken",
  "phrase.see_details": "Details bekijken",
  "phrase.select_language": "Taal selecteren",

  /* ── Sidebar sections ────────────────────────────────────── */
  "sidebar.gettingStarted": "Aan de slag",
  "sidebar.strategiesAndPicks": "Strategieën & Picks",
  "sidebar.performance": "Prestaties",
  "sidebar.system": "Systeem",

  /* ── Header ──────────────────────────────────────────────── */
  "header.live": "Live",
  "header.searchPlaceholder": "Zoek teams, wedstrijden, competities...",
  "header.notifications": "Meldingen",
  "header.noNotifications": "Geen nieuwe meldingen",
  "header.myAccount": "Mijn Account",
  "header.favorites": "Favorieten",
  "header.subscription": "Abonnement",
  "header.settings": "Instellingen",
  "header.adminPanel": "Beheerpaneel",
  "header.logout": "Uitloggen",
  /* ── Strategy page ───────────────────────────────────── */
  "strategy.title": "Strategielab",
  "strategy.subtitle": "Ontdek en vergelijk kwantitatieve wedstrategieën op basis van ons AI-model.",
  "strategy.cardCategory": "Voetbal · Wedstrijduitslag",
  "strategy.profitable": "Winstgevend",
  "strategy.unprofitable": "Niet winstgevend",
  "strategy.loading": "Laden...",
  "strategy.winRate": "Winstpercentage",
  "strategy.winRateTooltip": "Percentage tips dat correct was",
  "strategy.roiTooltip": "Return on Investment - winst/verlies als percentage van de totale inzet",
  "strategy.sampleSize": "Steekproefgrootte",
  "strategy.sampleSizeTooltip": "Totaal aantal beoordeelde tips voor deze strategie",
  "strategy.maxDrawdown": "Max Drawdown",
  "strategy.maxDrawdownTooltip": "Grootste piek-tot-dal verlies in eenheden (1 eenheid = 1 inzet). Bijv. 4,3u betekent dat je op het dieptepunt 4,3 inzetten achter stond",
  "strategy.howItWorksCard": "Hoe het werkt",
  "strategy.viewAllPicks": "Bekijk alle tips & resultaten",
  "strategy.readyToBacktest": "Klaar voor backtest",
  "strategy.awaitingData": "Wacht op data",
  "strategy.howItWorks": "Hoe ons systeem werkt",
  "strategy.step1Title": "Ons AI-model analyseert",
  "strategy.step1Desc": "Ons ensemble combineert 3 bewezen modellen - Elo-ratings (teamsterkte), Poisson-verdeling (doelpuntenvoorspelling) en Logistische regressie (patroonherkenning) - om win/gelijkspel/verlies-kansen te berekenen voor elke komende wedstrijd.",
  "strategy.step2Title": "Een strategie filtert",
  "strategy.step2Desc": "Een strategie is een set regels die alleen de beste kansen selecteert uit de modeluitvoer. Bijvoorbeeld: \"volg alleen tips waarbij het thuisteam > 60% voorspelde winstkans heeft\" of \"kies alleen wedstrijden met een lage gelijkspelkans\". Elke strategie heeft een ander risico/rendement-profiel.",
  "strategy.step3Title": "Jij volgt de tips",
  "strategy.step3Desc": "Kies hieronder een strategie en klik op \"Bekijk alle tips & resultaten\" om te zien welke komende wedstrijden worden aanbevolen. Elke strategie toont het historische winstpercentage en ROI zodat je kunt kiezen op basis van echte backtestdata.",
  "strategy.profitableStrategies": "Winstgevende strategieën",
  "strategy.profitableStrategiesDesc": "Strategieën met een positieve ROI op basis van live data",
  "strategy.liveData": "Live data",
  "strategy.archivedNotProfitable": "Gearchiveerd - Niet winstgevend",
  "strategy.realPredictionData": "Echte voorspellingsdata (uit database)",
  "strategy.totalPredictions": "Totaal voorspellingen",
  "strategy.accuracy": "Nauwkeurigheid",
  "strategy.brierScore": "Brier Score",
  "strategy.avgConfidence": "Gem. betrouwbaarheid",
  "strategy.realPredictionDisclaimer": "Deze cijfers zijn echte modeluitvoer uit de database. Ze weerspiegelen alleen de nauwkeurigheid van voorspellingen - niet de W/V van weddenschappen, waarvoor backtestanalyse nodig is.",

  /* ── Route page ───────────────────────────────────── */
  "route.title": "Jouw route",
  "route.subtitle": "Kies je pad om het meeste uit BetsPlug te halen. Elke route leidt naar slimmere tips - kies degene die bij jouw stijl past.",
  "route.path1Title": "Strategie-volger",
  "route.path1Subtitle": "Voor serieuze analisten",
  "route.path1Step1Label": "Ga naar het Strategielab",
  "route.path1Step1Desc": "Kies een bewezen strategie",
  "route.path1Step2Label": "Bekijk de tips van vandaag",
  "route.path1Step2Desc": "Zie welke wedstrijden jouw strategie aanbeveelt",
  "route.path1Step3Label": "Volg de resultaten",
  "route.path1Step3Desc": "Houd de prestaties van je strategie bij",
  "route.path2Title": "Snelle tip",
  "route.path2Subtitle": "Voor dagelijkse inzichten",
  "route.path2Step1Label": "Bekijk de Tip van de Dag",
  "route.path2Step1Desc": "De #1 aanbeveling van onze AI",
  "route.path2Step2Label": "Bekijk de analyse",
  "route.path2Step2Desc": "Kansen, onderbouwing, belangrijke factoren",
  "route.path2Step3Label": "Volg de resultaten",
  "route.path2Step3Desc": "Was het correct?",
  "route.path3Title": "Verkenner",
  "route.path3Subtitle": "Alles doorbladeren",
  "route.path3Step1Label": "Blader door voorspellingen",
  "route.path3Step1Desc": "Alle komende wedstrijden met AI-analyse",
  "route.path3Step2Label": "Klik op Details bekijken",
  "route.path3Step2Desc": "Duik diep in elke wedstrijd",
  "route.path3Step3Label": "Maak je eigen keuzes",
  "route.path3Step3Desc": "Vergelijk met ons model",
  "route.startThisPath": "Start dit pad",
  "route.commonForAllPaths": "Gemeenschappelijk voor alle paden",
  "route.commonTrackResults": "Resultaten volgen",
  "route.commonTrackResultsDesc": "Bekijk uitkomsten van alle voorspellingen",
  "route.commonWeeklyReport": "Weekrapport",
  "route.commonWeeklyReportDesc": "Prestatie-overzicht",
  "route.commonTrackrecord": "Track Record",
  "route.commonTrackrecordDesc": "Langetermijn nauwkeurigheidsdata",

  /* ── Dash page ───────────────────────────────────── */
  "dash.title": "Dashboard",
  "dash.subtitle": "Overzicht van modelprestaties en real-time systeemstatus",
  "dash.liveData": "Live data",
  "dash.totalForecasts": "Totaal voorspellingen",
  "dash.allTime": "Alle tijden",
  "dash.totalForecastsTooltip": "Totaal aantal voorspellingen dat ons AI-model heeft gegenereerd over alle competities",
  "dash.overallAccuracy": "Totale nauwkeurigheid",
  "dash.vsLastPeriod": "t.o.v. vorige periode",
  "dash.overallAccuracyTooltip": "Percentage voorspellingen waarbij ons model de wedstrijduitslag (thuis/gelijk/uit) correct voorspelde",
  "dash.avgBrierScore": "Gem. Brier Score",
  "dash.lowerIsBetter": "Lager is beter",
  "dash.avgBrierScoreTooltip": "Modelkalibratiemetriek (0-1, lager is beter). Meet hoe goed onze kansen overeenkomen met werkelijke uitslagen. Onder 0,25 is goed.",
  "dash.avgConfidence": "Gem. betrouwbaarheid",
  "dash.modelCertainty": "Modelzekerheid",
  "dash.avgConfidenceTooltip": "Gemiddelde betrouwbaarheid over alle voorspellingen. Hoger betekent dat het model zekerder was over zijn tips.",
  "dash.recentPredictions": "Recente voorspellingen",
  "dash.recentPredictionsDesc": "Laatste modeluitvoer met evaluatie",
  "dash.lastTen": "Laatste 10",
  "dash.thMatch": "Wedstrijd",
  "dash.thDate": "Datum",
  "dash.thPredicted": "Voorspeld",
  "dash.thConfidence": "Betrouwbaarheid",
  "dash.thResult": "Resultaat",
  "dash.noPredictions": "Nog geen voorspellingen geregistreerd.",
  "dash.pending": "In afwachting",
  "dash.correct": "Correct",
  "dash.incorrect": "Incorrect",
  "dash.accuracyByLeague": "Nauwkeurigheid per competitie",
  "dash.accuracyByLeagueDesc": "Voorspellingsnauwkeurigheid uitgesplitst per competitie",
  "dash.noSegmentData": "Nog geen segmentdata beschikbaar.",
  "dash.modelPerformanceTrend": "Modelprestatie-trend",
  "dash.modelPerformanceTrendDesc": "Voortschrijdende nauwkeurigheid over tijd (maandelijks)",
  "dash.noMonthlyData": "Nog geen maandelijkse data beschikbaar.",
  "dash.systemStatus": "Systeemstatus",
  "dash.systemStatusDesc": "Status van databronnen en laatste synchronisatietijden",
  "dash.healthy": "gezond",
  "dash.noDataSources": "Geen databronnen geconfigureerd.",

  /* ── Botd page ───────────────────────────────────── */
  "botd.title": "Tip van de Dag",
  "botd.subtitle": "De tip met de hoogste betrouwbaarheid van onze AI voor vandaag",
  "botd.subtitleFuture": "De tip met de hoogste betrouwbaarheid van onze AI",
  "botd.premiumFeature": "Premium functie",
  "botd.failedToLoad": "Tip van de Dag kon niet worden geladen",
  "botd.failedToLoadDesc": "De voorspellings-API kon niet worden bereikt. Probeer de pagina te vernieuwen.",
  "botd.noPickAvailable": "Geen tip beschikbaar",
  "botd.noPickAvailableDesc": "Onze AI heeft geen wedstrijd gevonden die voldoet aan de minimale betrouwbaarheidsdrempel (65%) voor de komende dagen. Kom later terug wanneer er meer wedstrijden zijn geanalyseerd.",
  "botd.futureDateBanner": "Geen tip met hoge betrouwbaarheid voor vandaag — de beste tip wordt getoond voor",
  "botd.draw": "Gelijkspel",
  "botd.predicted": "Voorspeld",
  "botd.modelConfidence": "Modelbetrouwbaarheid",
  "botd.predictedOutcome": "Voorspelde uitslag",
  "botd.modelReasoning": "Onderbouwing model",
  "botd.valueDetection": "Waardedetectie",
  "botd.valueDetectionDesc": "Deze tip is geselecteerd omdat ons ensemblemodel een significant verschil heeft geïdentificeerd tussen de berekende kans en de marktkansen.",
  "botd.modelsAgree": "4 modellen eens",
  "botd.modelsAgreeDesc": "Elo, Poisson, Logistische Regressie en ons Ensemblemodel dragen allemaal bij aan deze voorspelling voor maximale betrouwbaarheid.",
  "botd.dailySelection": "Dagelijkse selectie",
  "botd.dailySelectionDesc": "Slechts één tip per dag - we kiezen kwaliteit boven kwantiteit. Minimaal 65% betrouwbaarheid vereist voor selectie.",

  /* ── Pred page ───────────────────────────────────── */
  "pred.title": "Voorspellingen",
  "pred.subtitle": "AI-gestuurde wedstrijdanalyse en kansberekening - komende 7 dagen",
  "pred.modelEnsemble": "Model: Ensemble",
  "pred.autoRefresh": "Ververst automatisch elke 60s · Laatst:",
  "pred.predicted": "Voorspeld",
  "pred.upcoming": "Komend",
  "pred.correctSoFar": "Tot nu toe correct",
  "pred.date": "Datum",
  "pred.previousDay": "Vorige dag",
  "pred.today": "Vandaag",
  "pred.nextDay": "Volgende dag",
  "pred.historical": "Historisch",
  "pred.upcomingMatches": "Komende wedstrijden",
  "pred.predictionsReady": "Voorspellingen klaar",
  "pred.analysisPendingStat": "Analyse in behandeling",
  "pred.avgConfidence": "Gem. betrouwbaarheid",
  "pred.sortConfidence": "Betrouwbaarheid",
  "pred.sortTime": "Tijd",
  "pred.sortLeague": "Competitie",
  "pred.errorLoading": "Wedstrijddata kon niet uit de database worden geladen. Probeer de pagina te vernieuwen.",
  "pred.noUpcomingMatches": "Geen komende wedstrijden in de komende 7 dagen",
  "pred.noUpcomingMatchesDesc": "Er zijn geen geplande wedstrijden gevonden in de database. Kom zo terug.",
  "pred.noMatchingPredictions": "Geen voorspellingen die aan je filters voldoen",
  "pred.noMatchingPredictionsDesc": "Pas de competitie- of betrouwbaarheidsfilters hierboven aan.",
  "pred.clearFilters": "Filters wissen",
  "pred.upgradePrompt": "Bekijk alle voorspellingen met ons Silver-abonnement of hoger.",
  "pred.winProbability": "Winstkans",
  "pred.analysisPending": "Analyse in behandeling",
  "pred.confidence": "Betrouwbaarheid",
  "pred.hideDetails": "Details verbergen",
  "pred.viewDetails": "Details bekijken",
  "pred.venue": "Locatie",
  "pred.predictedOn": "Voorspeld",
  "pred.notProcessed": "Deze wedstrijd is nog niet verwerkt door de voorspellingsengine. Kom dichter bij de aftrap terug.",
  "pred.preMatchOdds": "Voorwedstrijdkansen",
  "pred.modelPick": "Modeltip",
  "pred.homeWin": "Thuiswinst",
  "pred.draw": "Gelijkspel",
  "pred.awayWin": "Uitwinst",
  "pred.modelReasoning": "Onderbouwing model",
  "pred.keyFactors": "Belangrijke factoren",

  /* ── Results page ───────────────────────────────────── */
  "results.title": "Resultaten & uitslagen",
  "results.subtitle": "Wedstrijduitslagen en voorspellingsnauwkeurigheid",
  "results.thisWeekPerformance": "Prestaties deze week",
  "results.noResultsThisWeek": "Nog geen resultaten deze week.",
  "results.statTotalCalls": "Totaal tips",
  "results.statWon": "Gewonnen",
  "results.statLost": "Verloren",
  "results.statWinRate": "Winstpercentage",
  "results.statPLUnits": "W/V eenheden",
  "results.bestPerformers": "Beste prestaties",
  "results.worstPerformers": "Slechtste prestaties",
  "results.last7Days": "Laatste 7 dagen",
  "results.last14Days": "Laatste 14 dagen",
  "results.last30Days": "Laatste 30 dagen",
  "results.filterAll": "Alles",
  "results.filterCorrect": "Correct",
  "results.filterIncorrect": "Incorrect",
  "results.allLeagues": "Alle competities",
  "results.resultsPlural": "resultaten",
  "results.resultSingular": "resultaat",
  "results.prediction": "Voorspelling",
  "results.outcomeHomeWin": "Thuiswinst",
  "results.outcomeAwayWin": "Uitwinst",
  "results.outcomeDraw": "Gelijkspel",
  "results.correct": "CORRECT",
  "results.incorrect": "INCORRECT",
  "results.pendingEval": "Evaluatie in afwachting",
  "results.confidence": "betrouwbaarheid",
  "results.pnlRealTooltip": "Gerealiseerde W/V berekend op basis van de werkelijke voorwedstrijdkansen die voor deze wedstrijd zijn opgeslagen.",
  "results.pnlEstimatedTooltip": "Geschatte W/V op basis van een vaste odds van 1,90 omdat er nog geen werkelijke odds beschikbaar zijn.",
  "results.noPredictionMade": "Geen voorspelling gemaakt",
  "results.errorLoading": "Resultaatdata kon niet worden geladen. De API is mogelijk tijdelijk niet beschikbaar.",
  "results.noResults": "Geen resultaten gevonden",
  "results.noResultsHint": "Geen afgelopen wedstrijden met uitslagen in de geselecteerde periode. Probeer een breder datumbereik.",
  "results.expandTo30Days": "Uitbreiden naar 30 dagen",
  "results.noResultsMatchFilters": "Geen resultaten voldoen aan je filters",
  "results.noResultsMatchFiltersHint": "Pas de periode of het resultaatfilter hierboven aan.",
  "results.clearFilters": "Filters wissen",

  /* ── WeeklyReport page ───────────────────────────────────── */
  "weeklyReport.title": "Weekrapport",
  "weeklyReport.subtitle": "Prestatie-overzicht van de afgelopen 7 dagen",
  "weeklyReport.errorLoading": "Rapportdata kon niet worden geladen. De API is mogelijk tijdelijk niet beschikbaar.",
  "weeklyReport.performanceOverview": "Prestatie-overzicht",
  "weeklyReport.noPerformanceData": "Nog geen prestatiedata voor deze week.",
  "weeklyReport.noPerformanceDataHint": "Kom terug zodra wedstrijden met voorspellingen zijn afgelopen.",
  "weeklyReport.totalCalls": "Totaal tips",
  "weeklyReport.wins": "Winst",
  "weeklyReport.losses": "Verlies",
  "weeklyReport.winRate": "Winstpercentage",
  "weeklyReport.netPL": "Netto W/V",
  "weeklyReport.vsLastWeek": "t.o.v. vorige week",
  "weeklyReport.winnersAndLosses": "Winnaars & verliezers",
  "weeklyReport.topWinners": "Topwinnaars",
  "weeklyReport.lossesTitle": "Verliezers",
  "weeklyReport.noEvaluatedPredictions": "Nog geen beoordeelde voorspellingen deze week.",
  "weeklyReport.noCorrectCalls": "Geen correcte tips deze week.",
  "weeklyReport.noIncorrectCalls": "Geen incorrecte tips deze week.",
  "weeklyReport.win": "WINST",
  "weeklyReport.loss": "VERLIES",
  "weeklyReport.ourCall": "Onze tip",
  "weeklyReport.result": "Resultaat",
  "weeklyReport.confidence": "Betrouwbaarheid",
  "weeklyReport.outcomeHomeWin": "Thuiswinst",
  "weeklyReport.outcomeAwayWin": "Uitwinst",
  "weeklyReport.outcomeDraw": "Gelijkspel",
  "weeklyReport.callLog": "Tipoverzicht",
  "weeklyReport.allCallsThisWeek": "Alle tips deze week",
  "weeklyReport.calls": "tips",
  "weeklyReport.noCallsThisWeek": "Geen tips met voorspellingen deze week.",
  "weeklyReport.colDate": "Datum",
  "weeklyReport.colMatch": "Wedstrijd",
  "weeklyReport.colLeague": "Competitie",
  "weeklyReport.colOurCall": "Onze tip",
  "weeklyReport.colOdds": "Odds",
  "weeklyReport.colResult": "Resultaat",
  "weeklyReport.colCorrect": "Correct?",
  "weeklyReport.colPL": "W/V",
  "weeklyReport.yes": "Ja",
  "weeklyReport.no": "Nee",
  "weeklyReport.weeklyTotal": "Weektotaal",

  /* ── Live page ───────────────────────────────────── */
  "live.title": "Live wedstrijden",
  "live.subtitle": "Wedstrijden van vandaag en komende 3 dagen",
  "live.statusLive": "Live",
  "live.statusUpcoming": "Komend",
  "live.statusFinished": "Afgelopen",
  "live.lastUpdated": "Laatst bijgewerkt",
  "live.fetchingData": "Data ophalen…",
  "live.errorBackend": "Backend-API kon niet worden bereikt. Gecachte data wordt getoond indien beschikbaar - automatisch opnieuw proberen.",
  "live.noMatchesToday": "Geen wedstrijden gepland voor vandaag. Eerstvolgende wedstrijden:",
  "live.status": "Status",
  "live.filterAll": "Alles",
  "live.filterLive": "Live",
  "live.filterUpcoming": "Komend",
  "live.filterFinished": "Afgelopen",
  "live.noDataBackendUnreachable": "Geen data beschikbaar - backend niet bereikbaar.",
  "live.noMatchesFound": "Geen wedstrijden gevonden. Kom terug wanneer er wedstrijden gepland staan.",
  "live.noMatchesForFilter": "Geen wedstrijden gevonden voor het geselecteerde filter.",
  "live.clearFilters": "Filters wissen",
  "live.postponed": "Uitgesteld",
  "live.cancelled": "Afgelast",
  "live.analysisPending": "Analyse in behandeling",
  "live.winProbability": "Winstkans",
  "live.kickOff": "Aftrap",
  "live.viewAnalysis": "Analyse bekijken",

  /* ── Deals page ───────────────────────────────────── */
  "deals.title": "Exclusieve Deals",
  "deals.subtitle": "Speciale aanbiedingen voor BetsPlug-leden",
  "deals.membersOnly": "Alleen voor leden",
  "deals.memberReward": "Ledenvoordeel",
  "deals.heroTitle": "Ontvang 20% KORTING op je BetsPlug Pro-abonnement",
  "deals.heroDescription": "Exclusieve korting ontgrendeld voor jouw account. Deel je verwijzingslink met vrienden en verdien credits voor elke succesvolle aanmelding.",
  "deals.yourReferralLink": "Jouw verwijzingslink",
  "deals.bothGetFreeMonth": "Jullie krijgen allebei 1 maand gratis",
  "deals.copied": "Gekopieerd!",
  "deals.copy": "Kopiëren",
  "deals.partnerDeals": "Partnerdeals",
  "deals.partnerDealsDescription": "Kies het abonnement dat bij jouw werkwijze past - alle prijzen zijn inclusief je ledenkorting",
  "deals.mostPopular": "Populairst",
  "deals.customPricing": "Prijs op maat",
  "deals.perMonth": "per maand",
  "deals.bestValue": "Beste waarde",
  "deals.saveAnnual": "Bespaar $72/jaar",
  "deals.saveMonthly": "Bespaar $8/maand",
  "deals.claimDiscount": "Korting claimen",
  "deals.contactSales": "Neem contact op met sales",
  "deals.featureUnlimitedPredictions": "Onbeperkte voorspellingen",
  "deals.featureAllStrategies": "Alle wedstrategieën",
  "deals.featurePriorityAlerts": "Prioriteitsmeldingen voor wedstrijden",
  "deals.featureFullApi": "Volledige API-toegang",
  "deals.featureAdvancedAnalytics": "Geavanceerde analyses",
  "deals.featurePrioritySupport": "Prioriteitsondersteuning",
  "deals.featureCustomModels": "Aangepaste ML-modellen",
  "deals.featureDedicatedSupport": "Persoonlijke accountondersteuning",
  "deals.featureWhiteLabel": "White-label integratie",
  "deals.featureBulkApi": "Bulk API-toegang",
  "deals.featureSlaGuarantee": "SLA-garantie",
  "deals.featureTeamManagement": "Teambeheer",
  "deals.referralProgram": "Verwijzingsprogramma",
  "deals.referralProgramDescription": "Verdien credits door vrienden uit te nodigen voor BetsPlug",
  "deals.howItWorks": "Hoe het werkt",
  "deals.step1Title": "Deel je unieke link",
  "deals.step1Description": "Kopieer en stuur je persoonlijke verwijzings-URL naar vrienden of deel hem op social media",
  "deals.step2Title": "Vriend meldt zich aan en neemt een abonnement",
  "deals.step2Description": "Je vriend maakt een account aan en kiest een betaald BetsPlug-abonnement",
  "deals.step3Title": "Allebei 1 maand gratis",
  "deals.step3Description": "Credits worden binnen 24 uur automatisch op beide accounts bijgeschreven",
  "deals.yourReferralStats": "Jouw verwijzingsstatistieken",
  "deals.totalReferrals": "Totaal verwijzingen",
  "deals.active": "Actief",
  "deals.creditsEarned": "Verdiende credits",
  "deals.disclaimer": "Disclaimer",
  "deals.disclaimerText": "Affiliate-links en verwijzingsprogramma's zijn onderworpen aan algemene voorwaarden. Kortingen gelden alleen voor nieuwe en verlengde abonnementen. Credits zijn niet overdraagbaar en kunnen niet worden ingewisseld voor geld. BetsPlug behoudt het recht om het verwijzingsprogramma op elk moment te wijzigen of te beëindigen met voorafgaande kennisgeving.",

  /* ── Reports page ───────────────────────────────────── */
  "reports.title": "Rapporten & exports",
  "reports.subtitle": "Genereer en download prestatierapporten",
  "reports.generateReport": "Rapport genereren",
  "reports.generateReportDescription": "Genereer een nieuw prestatierapport op basis van modelvoorspellingen.",
  "reports.reportType": "Rapporttype",
  "reports.weeklySummary": "Weekoverzicht",
  "reports.monthlySummary": "Maandoverzicht",
  "reports.customRange": "Aangepast bereik",
  "reports.format": "Formaat",
  "reports.generating": "Genereren…",
  "reports.reportQueued": "Rapportopdracht succesvol in de wachtrij geplaatst. Het rapport verschijnt hieronder zodra het klaar is.",
  "reports.generateFailed": "Rapport genereren mislukt. Probeer het opnieuw.",
  "reports.generatedReports": "Gegenereerde rapporten",
  "reports.allAvailableReports": "Alle beschikbare prestatierapporten",
  "reports.reportSingular": "rapport",
  "reports.reportPlural": "rapporten",
  "reports.noReportsYet": "Nog geen rapporten gegenereerd",
  "reports.noReportsHint": "Gebruik het formulier hierboven om je eerste rapport te genereren.",
  "reports.ready": "Gereed",
  "reports.download": "Downloaden",

  /* ── Trackrecord page ───────────────────────────────────── */
  "trackrecord.title": "Track Record",
  "trackrecord.subtitle": "Historische modelprestaties, kalibratie en segmentanalyse",
  "trackrecord.realApiData": "Echte API-data",
  "trackrecord.performance": "Prestaties",
  "trackrecord.calibration": "Kalibratie",
  "trackrecord.segments": "Segmenten",
  "trackrecord.filters": "Filters",
  "trackrecord.from": "Van",
  "trackrecord.to": "Tot",
  "trackrecord.allLeagues": "Alle competities",
  "trackrecord.totalPredictions": "Totaal voorspellingen",
  "trackrecord.accuracy": "Nauwkeurigheid",
  "trackrecord.brierScore": "Brier Score",
  "trackrecord.logLoss": "Log Loss",
  "trackrecord.calibrationError": "Kalibratiefout",
  "trackrecord.calibrationErrorECE": "Kalibratiefout (ECE)",
  "trackrecord.avgConfidence": "Gem. betrouwbaarheid",
  "trackrecord.periodStart": "Begin periode",
  "trackrecord.periodEnd": "Einde periode",
  "trackrecord.metric": "Metriek",
  "trackrecord.value": "Waarde",
  "trackrecord.segment": "Segment",
  "trackrecord.total": "Totaal",
  "trackrecord.realModelPerformance": "Echte modelprestaties",
  "trackrecord.liveDataFromDb": "Live data uit de database",
  "trackrecord.predictions": "Voorspellingen",
  "trackrecord.noPredictionsYet": "Nog geen voorspellingen geregistreerd",
  "trackrecord.noPredictionsYetDesc": "De dataverzameling is bezig. Voorspellingsstatistieken verschijnen hier zodra de eerste modelevaluaties zijn afgerond.",
  "trackrecord.noPredictionsEmptyDesc": "Voorspellingen verschijnen hier zodra het model prognoses heeft gegenereerd voor komende wedstrijden. De dataverzameling is bezig.",
  "trackrecord.disclaimer": "Deze cijfers zijn echte modeluitvoer. Brier Score meet probabilistische nauwkeurigheid (lager is beter). Dit is geen financieel of wedadvies.",
  "trackrecord.pending": "In afwachting",
  "trackrecord.correct": "Correct",
  "trackrecord.incorrect": "Incorrect",
  "trackrecord.recentPredictions": "Recente voorspellingen",
  "trackrecord.last15ModelCalls": "Laatste 15 modeltips",
  "trackrecord.recentPredictionsResults": "Recente voorspellingen & resultaten",
  "trackrecord.lastNModelCalls": "Laatste {n} modeltips - echte data uit database",
  "trackrecord.conf": "Betr.",
  "trackrecord.vs": "vs",
  "trackrecord.match": "Wedstrijd",
  "trackrecord.accuracyOverTime": "Nauwkeurigheid over tijd",
  "trackrecord.monthlyModelAccuracy": "Maandelijkse modelnauwkeurigheid",
  "trackrecord.monthlyModelAccuracyReal": "Maandelijkse modelnauwkeurigheid - echte data ({n} maanden)",
  "trackrecord.notEnoughData": "Nog niet genoeg data",
  "trackrecord.notEnoughDataDesc": "Maandelijkse nauwkeurigheidstrends verschijnen hier zodra er voldoende voorspellingsdata is verzameld en beoordeeld over meerdere maanden.",
  "trackrecord.noLeagueBreakdownData": "Nog geen uitsplitsingsdata per competitie beschikbaar.",
  "trackrecord.accuracyCorrectPredictions": "Nauwkeurigheid (correcte voorspellingen)",
  "trackrecord.monthlyAccuracy": "Maandelijkse nauwkeurigheid",
  "trackrecord.accuracyByLeague": "Nauwkeurigheid per competitie",
  "trackrecord.accuracyByLeagueDesc": "Voorspellingsnauwkeurigheid per competitie - echte data",
  "trackrecord.accuracyTrend": "Nauwkeurigheidstrend",
  "trackrecord.accuracyTrendDesc": "Maandelijks voortschrijdende nauwkeurigheid over de geselecteerde periode",
  "trackrecord.noMonthlyData": "Geen maandelijkse data beschikbaar voor de geselecteerde filters.",
  "trackrecord.summaryStatistics": "Samenvattende statistieken",
  "trackrecord.summaryStatisticsDesc": "Totaalcijfers voor de geselecteerde periode en filters",
  "trackrecord.noSummaryData": "Geen samenvattende data beschikbaar.",
  "trackrecord.calibrationChart": "Kalibratiegrafiek",
  "trackrecord.calibrationChartDesc": "Voorspelde kans vs. werkelijke frequentie",
  "trackrecord.noCalibrationData": "Geen kalibratiedata beschikbaar voor de geselecteerde filters.",
  "trackrecord.whatIsCalibration": "Wat is kalibratie?",
  "trackrecord.calibrationExplanation1": "Een perfect gekalibreerd model is een model waarbij, van alle voorspellingen met kans p, precies p × 100% van de gebeurtenissen daadwerkelijk plaatsvindt.",
  "trackrecord.calibrationExplanation2": "De diagonale stippellijn geeft perfecte kalibratie weer. Punten boven de lijn betekenen dat het model te voorzichtig is; punten eronder dat het model te zelfverzekerd is.",
  "trackrecord.keyMetrics": "Belangrijke metrieken",
  "trackrecord.eceExplanation": "Lager is beter. Waarden dicht bij 0 duiden op uitstekende kalibratie.",
  "trackrecord.calibrationMeasurement": "Kalibratie wordt gemeten met probabiliteitsbuckets van gelijke breedte. Elk punt in de grafiek vertegenwoordigt één groep voorspellingen.",
  "trackrecord.performanceByLeague": "Prestaties per competitie",
  "trackrecord.performanceByLeagueDesc": "Voorspellingsnauwkeurigheid uitgesplitst per competitie",
  "trackrecord.performanceByConfidence": "Prestaties per betrouwbaarheidsniveau",
  "trackrecord.performanceByConfidenceDesc": "Hoe nauwkeurigheid varieert per niveau van modelbetrouwbaarheid",
  "trackrecord.league": "Competitie",
  "trackrecord.confidenceBucket": "Betrouwbaarheidsniveau",
  "trackrecord.noSegmentData": "Geen segmentdata beschikbaar voor {segment}.",
  "trackrecord.noPredictionDataYet": "Nog geen voorspellingsdata",
  "trackrecord.noPredictionDataYetDesc": "Het systeem heeft nog geen voorspellingen gegenereerd of beoordeeld. KPI-kaarten, grafieken en tabellen hieronder worden automatisch gevuld zodra het model draait en wedstrijduitslagen zijn vastgelegd. Kom terug nadat de eerste batch voorspellingen is verwerkt.",

  /* ── Settings page ───────────────────────────────────── */
  "settings.title": "Instellingen",
  "settings.subtitle": "Pas je ervaring aan",
  "settings.profile": "Profiel",
  "settings.profileDesc": "Je persoonlijke gegevens en accountrol",
  "settings.editProfile": "Profiel bewerken",
  "settings.done": "Klaar",
  "settings.admin": "Beheerder",
  "settings.followedLeagues": "Gevolgde competities",
  "settings.followedLeaguesDesc": "Selecteer de competities die je wilt volgen en waarvoor je inzichten wilt ontvangen",
  "settings.alertsFollowedOnly": "Alleen meldingen voor gevolgde competities",
  "settings.alertsFollowedOnlyDesc": "Onderdruk meldingen van competities die je niet volgt",
  "settings.leaguePreferences": "Competitievoorkeuren",
  "settings.leaguePreferencesDesc": "Kies specifieke toernooien binnen je gevolgde competities",
  "settings.notificationPreferences": "Meldingsvoorkeuren",
  "settings.notificationPreferencesDesc": "Bepaal welke meldingen en rapporten je ontvangt",
  "settings.matchStartAlerts": "Wedstrijdstartmeldingen",
  "settings.matchStartAlertsDesc": "Ontvang een melding wanneer gevolgde wedstrijden van start gaan",
  "settings.predictionUpdates": "Voorspellingsupdates",
  "settings.predictionUpdatesDesc": "Ontvang updates wanneer modelvoorspellingen significant wijzigen",
  "settings.strategyCalls": "Strategietips",
  "settings.strategyCallsDesc": "Meldingen wanneer een strategie een nieuw wedsignaal genereert",
  "settings.weeklyReportEmails": "Weekrapport per e-mail",
  "settings.weeklyReportEmailsDesc": "Een overzicht van modelprestaties elke maandagochtend",
  "settings.modelPerformanceAlerts": "Modelprestatiemeldingen",
  "settings.modelPerformanceAlertsDesc": "Melding wanneer de nauwkeurigheid onder je drempelwaarde zakt",
  "settings.displayPreferences": "Weergavevoorkeuren",
  "settings.displayPreferencesDesc": "Pas aan hoe data en de interface worden weergegeven",
  "settings.oddsFormat": "Quoteringsformaat",
  "settings.oddsDecimal": "Decimaal (2,10)",
  "settings.oddsFractional": "Fractioneel (11/10)",
  "settings.oddsAmerican": "Amerikaans (+110)",
  "settings.language": "Taal",
  "settings.timezone": "Tijdzone",
  "settings.lightMode": "Lichte modus",
  "settings.darkMode": "Donkere modus",
  "settings.switchToDark": "Terug naar de premium donkere interface",
  "settings.darkThemeActive": "Donker thema actief - rustgevend voor de ogen",
  "settings.discard": "Annuleren",
  "settings.saveSettings": "Instellingen opslaan",
  "settings.savedSuccessfully": "Instellingen succesvol opgeslagen",

  /* ── Search page ───────────────────────────────────── */
  "search.title": "Zoeken",
  "search.subtitle": "Vind competities, teams en wedstrijden",
  "search.placeholder": "Zoek in competities, teams en wedstrijden…",
  "search.searchThePlatform": "Doorzoek het platform",
  "search.typeAtLeast2Chars": "Typ minstens 2 tekens om te zoeken in competities, teams en wedstrijden",
  "search.tagFootball": "Voetbal",
  "search.tagLeagues": "Competities",
  "search.tagTeams": "Teams",
  "search.tagMatches": "Wedstrijden",
  "search.typeLeague": "Competitie",
  "search.typeTeam": "Team",
  "search.typeMatch": "Wedstrijd",
  "search.tabAll": "Alles",
  "search.noResultsFound": "Geen resultaten gevonden",
  "search.nothingMatched": "Geen overeenkomsten",
  "search.tryDifferentTerm": "Probeer een andere zoekterm.",
  "search.noResultsInCategory": "Geen resultaten in deze categorie.",
  "search.results": "resultaten",
  "search.result": "resultaat",
  "search.for": "voor",
};


/* ── Locale dictionaries ──────────────────────────────────────
 * All locales are statically imported so translations are
 * available immediately on first render — no async loading,
 * no flash of English content. The total bundle overhead is
 * ~200 KB of strings which gzips to ~25 KB.
 */

import deDict from "./locales/de";
import frDict from "./locales/fr";
import esDict from "./locales/es";
import itDict from "./locales/it";
import swDict from "./locales/sw";
import idDict from "./locales/id";

export const messages: Record<string, Dictionary> = {
  en,
  nl,
  de: deDict,
  fr: frDict,
  es: esDict,
  it: itDict,
  sw: swDict,
  id: idDict,
};

export function translate(locale: string, key: TranslationKey): string {
  const dict = messages[locale];
  return dict?.[key] ?? en[key];
}
