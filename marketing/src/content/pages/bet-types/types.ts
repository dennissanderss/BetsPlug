/**
 * Type contract for /bet-types pillar page content.
 */

export interface CtaCanonical { label: string; canonical: string }

export interface BetTypeExample {
  homeTeam: string;
  awayTeam: string;
  league: string;
  prediction: string;
  confidence: number;
}

export interface BetTypeSection {
  /** TOC anchor id. */
  id: string;
  /** H2 — bet-type name. */
  h2: string;
  /** One-line definition shown directly under H2. */
  definition: string;
  howItWorks: string[];
  whenPredictable: string[];
  howBetsplugPredicts: string[];
  tips: string[];
  example: BetTypeExample;
}

export interface BetTypesContent {
  _meta: {
    translationStatus: "source" | "ai-generated" | "human-reviewed";
    needsReview: boolean;
    lastUpdated: string;
  };
  meta: { title: string; description: string; ogImage: string };
  hero: {
    h1: string;
    subheadline: string;
  };
  toc: {
    label: string;
    items: { id: string; label: string }[];
  };
  /** Section labels reused across all 8 bet types. */
  sectionLabels: {
    howItWorks: string;
    whenPredictable: string;
    howBetsplugPredicts: string;
    tips: string;
    exampleTitle: string;
  };
  betTypes: BetTypeSection[];
  coverage: {
    h2: string;
    body: string;
    headers: { betType: string; freeTier: string; paidTier: string };
    rows: { betType: string; free: boolean; paid: boolean | string }[];
    note: string;
    cta: CtaCanonical;
  };
  faq: {
    h2: string;
    questions: { q: string; a: string }[];
  };
  finalCta: {
    h2: string;
    body: string;
    ctaPrimary: CtaCanonical;
    ctaSecondary: CtaCanonical;
  };
}
