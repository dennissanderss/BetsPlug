/**
 * Type contract for /how-it-works educational page.
 * 9 sections, conversational tone, no gambling terminology.
 *
 * Tier names are CANONICAL and must mirror docs/tier_system_plan.md:
 * Free / Silver / Gold / Platinum (badges ⬜ ⚪ 🔵 🟢).
 */

export interface CtaCanonical {
  label: string;
  canonical: string;
}

export interface USPLine {
  icon: string;
  text: string;
}

export interface ProcessStage {
  number: string;
  title: string;
  body: string;
  bodyExtra?: string;
  visualLabels: Record<string, string>;
}

export interface Pillar {
  icon: string;
  title: string;
  body: string;
}

export interface TierCard {
  badge: "free" | "silver" | "gold" | "platinum";
  name: string;
  tagline: string;
  bullets: string[];
}

export interface FaqQA {
  q: string;
  a: string;
}

export interface HowItWorksContent {
  _meta: {
    translationStatus: "source" | "ai-generated" | "human-reviewed";
    needsReview: boolean;
    lastUpdated: string;
  };
  meta: {
    title: string;
    description: string;
    ogImage?: string;
  };
  hero: {
    kicker: string;
    h1: string;
    subheadline: string;
    trustStrip: USPLine[];
    ctaPrimary: CtaCanonical;
    ctaSecondary: CtaCanonical;
  };
  problem: {
    h2: string;
    paragraphs: string[];
  };
  process: {
    h2: string;
    subH2: string;
    stages: ProcessStage[];
  };
  example: {
    h2: string;
    subH2: string;
    steps: USPLine[];
    ctaPrimary: CtaCanonical;
    ctaSecondary: CtaCanonical;
    mockupLabels: Record<string, string>;
  };
  why: {
    h2: string;
    pillars: Pillar[];
  };
  tiers: {
    h2: string;
    subH2: string;
    items: TierCard[];
    ctaPrimary: CtaCanonical;
    ctaSecondary: CtaCanonical;
  };
  methodologyTease: {
    h2: string;
    body: string;
    cta: CtaCanonical;
  };
  faq: {
    h2: string;
    questions: FaqQA[];
  };
  finalCta: {
    h2: string;
    subH2: string;
    body: string;
    ctaPrimary: CtaCanonical;
    ctaSecondary: CtaCanonical;
  };
}
