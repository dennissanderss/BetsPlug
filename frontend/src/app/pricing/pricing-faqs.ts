/**
 * Pricing FAQs — single source of truth
 * ────────────────────────────────────────────────────────────
 * Consumed by both the visible FAQ accordion in pricing-content
 * and the FAQPage JSON-LD emitted from page.tsx. Keep these two
 * in sync by editing only this file.
 *
 * Only EN for now — the visible section falls back to EN for
 * non-EN locales until translations land. (We'd rather ship an
 * honest English FAQ than auto-translated legal-adjacent copy.)
 */

export interface PricingFaq {
  q: string;
  a: string;
}

export const PRICING_FAQS: PricingFaq[] = [
  {
    q: "How long is the Bronze trial?",
    a: "Bronze is a 7-day trial for €0.01 with full Gold access. It does not auto-convert to a paid plan — if you do nothing, it simply ends. Upgrade manually from inside the app if you want to continue with Silver, Gold, or Platinum.",
  },
  {
    q: "Can I cancel at any time?",
    a: "Yes. Every subscription plan (Silver, Gold) is month-to-month and cancellable in two clicks from your account dashboard. You keep access until the end of the paid billing period. Platinum is a one-time lifetime payment and therefore has no recurring charge to cancel.",
  },
  {
    q: "What is your refund policy?",
    a: "If something goes wrong in your first 7 days on a paid plan, email support@betsplug.com and we'll refund in full, no questions asked. After 7 days we evaluate refunds case by case — but in practice, unhappy customers can also just cancel and keep the rest of their billing period.",
  },
  {
    q: "What's the difference between Silver, Gold, and Platinum picks?",
    a: "Silver unlocks picks in the top 14 competitions with a 60%+ historical hit rate at confidence ≥65%. Gold adds a Data Analyst toolkit (Match Deep Dive, Predictions Explorer, CSV/PDF exports) and higher-conviction 70%+ accuracy picks across the top 10 leagues. Platinum adds elite top-5-league picks at 85%+ historical accuracy, plus lifetime pricing.",
  },
  {
    q: "What if my results don't match the advertised hit rate?",
    a: "Our public track record logs every pick — wins and losses — before kickoff, with no cherry-picking. The hit rates we advertise are measured across thousands of historical picks, so short-term variance is expected on any given week or month. We recommend evaluating results over 200+ picks before drawing conclusions. If you ever suspect the numbers are off, the raw CSV exports let you verify them yourself.",
  },
  {
    q: "Is BetsPlug legal in my country?",
    a: "BetsPlug is an educational analytics tool — we publish AI-derived probabilities and track our accuracy; we don't take bets, hold funds, or issue payouts. Availability of sports betting itself is governed by local law. You're responsible for verifying that betting with third-party bookmakers is legal in your jurisdiction.",
  },
  {
    q: "Do you offer team or enterprise pricing?",
    a: "Yes — if you're a publisher, affiliate, or syndicate looking at 5+ seats or API access to our probabilities, get in touch via /b2b and we'll scope a partnership rate.",
  },
];
