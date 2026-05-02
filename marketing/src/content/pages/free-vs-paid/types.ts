/**
 * Type contract for /free-vs-paid content.
 */

export interface CtaCanonical { label: string; canonical: string }
export interface CtaHref { label: string; href: string }

export interface UseCaseProfile {
  icon: "user" | "trending-up" | "chart";
  title: string;
  description: string;
  recommendation: string;
  cta: CtaCanonical | CtaHref;
}

export interface ComparisonRow {
  feature: string;
  free: string;
  silver: string;
  gold: string;
}

export interface FreeVsPaidContent {
  _meta: {
    translationStatus: "source" | "ai-generated" | "human-reviewed";
    needsReview: boolean;
    lastUpdated: string;
  };
  meta: { title: string; description: string; ogImage: string };
  hero: { h1: string; subheadline: string };
  visual: {
    h2: string;
    free: {
      header: string;
      subheader: string;
      useCases: string[];
      limitations: string[];
      cta: CtaHref;
      mockMatch: { home: string; away: string; league: string; pick: string; confidence: number };
    };
    paid: {
      header: string;
      subheader: string;
      useCases: string[];
      cta: CtaCanonical;
      mockMatch: { home: string; away: string; league: string; pick: string; confidence: number; xg: string; h2h: string; lineup: string };
    };
  };
  comparison: {
    h2: string;
    headers: { feature: string; free: string; silver: string; gold: string };
    rows: ComparisonRow[];
    cta: CtaCanonical;
  };
  useCases: {
    h2: string;
    profiles: UseCaseProfile[];
  };
  faq: {
    h2: string;
    questions: { q: string; a: string }[];
  };
  finalCta: {
    h2: string;
    body: string;
    ctaPrimary: CtaHref;
    ctaSecondary: CtaCanonical;
  };
}
