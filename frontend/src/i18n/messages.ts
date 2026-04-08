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
} as const;

export type TranslationKey = keyof typeof en;

type Dictionary = Partial<Record<TranslationKey, string>>;

/* ── Dutch ─────────────────────────────────────────────────── */
const nl: Dictionary = {
  "nav.predictions": "Voorspellingen",
  "nav.howItWorks": "Hoe het werkt",
  "nav.trackRecord": "Track Record",
  "nav.pricing": "Prijzen",
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
};

/* ── German ────────────────────────────────────────────────── */
const de: Dictionary = {
  "nav.predictions": "Prognosen",
  "nav.howItWorks": "So funktioniert's",
  "nav.trackRecord": "Erfolgsbilanz",
  "nav.pricing": "Preise",
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
