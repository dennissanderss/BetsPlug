/**
 * Homepage FAQ — single source of truth
 * ────────────────────────────────────────────────────────────
 * Consumed by:
 *   1. `<FaqBlock>` in `components/ui/seo-section.tsx` — the visible
 *      categorized accordion on the public homepage.
 *   2. `<FaqJsonLd>` in `app/page.tsx` — the Schema.org FAQPage
 *      structured data Google reads for rich results.
 *
 * Keeping both render paths on a single array guarantees the visible
 * Q/A matches what Google indexes. Drift here is a rich-snippet
 * mismatch risk — don't add questions to one consumer without the
 * other.
 *
 * Copy is currently English-only by design (the Sanity migration
 * will take this over per the content-model refactor in-flight).
 * Do not localize through i18n keys here — the visible accordion is
 * EN everywhere today; keeping JSON-LD in sync requires sharing the
 * same source.
 */

export type HomeFaqCategoryId =
  | "getting-started"
  | "predictions"
  | "pricing"
  | "data-security";

export interface HomeFaqItem {
  question: string;
  answer: string;
}

export interface HomeFaqCategory {
  id: HomeFaqCategoryId;
  label: string;
  items: HomeFaqItem[];
}

export const homeFaqCategories: HomeFaqCategory[] = [
  {
    id: "getting-started",
    label: "Getting Started",
    items: [
      {
        question: "What is an AI football prediction platform?",
        answer:
          "An AI football prediction platform uses machine learning models, historical data, and statistical engines (like Elo and Poisson) to forecast the most likely outcome of football matches. BetsPlug is built as a pure analytics tool - we show you the numbers, probabilities and expected value, so you can decide which bets to place with a bookmaker of your choice.",
      },
      {
        question: "How do I get started with BetsPlug?",
        answer:
          "Start with our Bronze plan - a symbolic €0.01 trial that unlocks 7 days of full Gold-level access: daily AI football picks, upcoming match predictions, our verified track record and every model output. We charge one cent through Stripe so we can verify the card is real (this is how we keep the platform fraud-free). Upgrade to Silver, Gold or Platinum when you're ready.",
      },
      {
        question: "Which football leagues does the AI predictor cover?",
        answer:
          "Our AI predictor is focused exclusively on football, covering the Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Eredivisie, Champions League and more. New football leagues are added regularly as our models are trained and validated.",
      },
    ],
  },
  {
    id: "predictions",
    label: "Predictions & Models",
    items: [
      {
        question: "How accurate are AI football betting predictions?",
        answer:
          "Accuracy depends on the league, the market and the model. Our AI betting predictions are continuously benchmarked against closing lines and logged in our public track record. You can see the exact hit-rate, ROI and confidence distribution of every model we run - no cherry-picking, no hidden losses.",
      },
      {
        question: "Which models power BetsPlug predictions?",
        answer:
          "We combine Elo ratings, Poisson goal models, and machine-learning classifiers trained on hundreds of thousands of historical matches. Each prediction includes win probability, expected goals, confidence score, and edge over the current bookmaker line.",
      },
      {
        question: "Can I use AI for football betting research?",
        answer:
          "Absolutely. Thousands of data-driven bettors use BetsPlug as their research layer: compare our AI predictions against bookmaker odds, filter by confidence, backtest strategies, and identify value bets before the market corrects.",
      },
    ],
  },
  {
    id: "pricing",
    label: "Pricing & Billing",
    items: [
      {
        question: "Do I need a subscription to see AI picks?",
        answer:
          "We offer a free tier with daily AI football picks so you can try the platform. For full access to live probabilities, strategy backtesting and the complete track record, check our subscription plans.",
      },
      {
        question: "Can I cancel my subscription anytime?",
        answer:
          "Yes. All plans are month-to-month with no long-term commitment. You can cancel anytime from your account dashboard and keep access until the end of your current billing period.",
      },
      {
        question: "Do you offer refunds?",
        answer:
          "We offer a 14-day money-back guarantee on all paid plans under EU consumer law. If BetsPlug isn't right for you, contact support within the first 14 days and we'll issue a full refund - no questions asked. Platinum Lifetime is final-sale after the 14-day window.",
      },
    ],
  },
  {
    id: "data-security",
    label: "Data & Security",
    items: [
      {
        question: "Is BetsPlug a betting or gambling website?",
        answer:
          "No. BetsPlug is a data analytics platform for football fans, traders and researchers. We provide AI football predictions, statistics and insights. You cannot gamble, deposit or place bets on BetsPlug - we exist to inform your decisions, not to take them.",
      },
      {
        question: "How is my data protected?",
        answer:
          "Your data is encrypted in transit (TLS 1.3) and at rest (AES-256). We never sell or share personal information, and we process payments through PCI-compliant providers so we never store your card details on our servers.",
      },
      {
        question: "Where does your football data come from?",
        answer:
          "We aggregate data from licensed football data providers, official league feeds, and public statistical sources. Every data point feeding our models is verified and timestamped for full reproducibility in our track record.",
      },
    ],
  },
];

/** Flat list — identical order — for FAQPage JSON-LD emission. */
export const homeFaqItems: HomeFaqItem[] = homeFaqCategories.flatMap(
  (c) => c.items,
);
