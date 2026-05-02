/**
 * Type contract for /telegram landing page.
 */

export interface CtaCanonical { label: string; canonical: string }
export interface CtaHref { label: string; href: string }

export interface ValueCard {
  icon: "trending-up" | "info" | "check-circle";
  title: string;
  body: string;
}

export interface TelegramContent {
  _meta: {
    translationStatus: "source" | "ai-generated" | "human-reviewed";
    needsReview: boolean;
    lastUpdated: string;
  };
  meta: { title: string; description: string; ogImage: string };
  hero: {
    h1: string;
    subheadline: string;
    /** TODO: verify Telegram channel URL */
    telegramUrl: string;
    ctaLabel: string;
    trustStrip: string[];
  };
  whatYouGet: {
    h2: string;
    cards: ValueCard[];
  };
  whyTelegram: {
    h2: string;
    paragraphs: string[];
  };
  upgradePath: {
    h2: string;
    body: string;
    ctaPrimary: CtaCanonical;
    ctaSecondary: CtaHref;
  };
  faq: {
    h2: string;
    questions: { q: string; a: string }[];
  };
}
