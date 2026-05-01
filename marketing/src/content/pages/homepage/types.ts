/**
 * Type contract for homepage content JSON.
 * One source of truth for all 6 locales.
 *
 * `canonical` fields are unlocalized page IDs (e.g. "pricing") that
 * components resolve to the locale-correct path via getLocalizedPath().
 * `href` fields are absolute external URLs (e.g. app.betsplug.com).
 */

export interface CtaCanonical {
  label: string;
  canonical: string;
}

export interface CtaHref {
  label: string;
  href: string;
}

export type Cta = CtaCanonical | CtaHref;

export interface HomepageContent {
  _meta: {
    translationStatus: "source" | "ai-generated" | "human-reviewed";
    needsReview: boolean;
    lastUpdated: string;
  };
  meta: {
    title: string;
    description: string;
    ogImage: string;
  };
  hero: {
    kicker: string;
    h1: string;
    subheadline: string;
    trustStrip: string[];
    ctaPrimary: CtaHref;
    ctaSecondary: CtaCanonical;
    visual: {
      league: string;
      homeTeam: string;
      awayTeam: string;
      kickoff: string;
      prediction: string;
      confidence: number;
      methodologyBadge: string;
      lockLabel: string;
    };
  };
  howItWorks: {
    h2: string;
    subhead: string;
    steps: Array<{
      number: string;
      icon: "database" | "cpu" | "lock";
      h3: string;
      body: string;
      microDetail: string;
    }>;
    cta: CtaCanonical;
  };
  livePredictions: {
    h2: string;
    subhead: string;
    liveLabel: string;
    liveSecondsAgo: string;
    lockedLabel: string;
    loadingLabel: string;
    errorLabel: string;
    ctaSection: {
      h3: string;
      body: string;
      ctaPrimary: CtaCanonical;
      ctaSecondary: CtaHref;
    };
  };
  methodology: {
    h2: string;
    paragraphs: string[];
    stats: Array<{ value: string; label: string }>;
    diagram: {
      input: string;
      inputItems: string[];
      models: string[];
      output: string;
    };
    cta: CtaCanonical;
  };
  trackRecord: {
    h2: string;
    body: string;
    topLineLabel: string;
    topLineValue: string;
    legend: {
      win: string;
      loss: string;
      void: string;
      pending: string;
    };
    cta: CtaCanonical;
  };
  comparison: {
    h2: string;
    headers: { criterion: string; tipster: string; betsplug: string };
    rows: Array<{ criterion: string; tipster: string; betsplug: string }>;
    footnote: string;
    cta: CtaCanonical;
  };
  pricing: {
    h2: string;
    subhead: string;
    tiers: Array<{
      id: "free" | "silver" | "gold";
      name: string;
      price: string;
      period: string;
      description: string;
      badge?: string;
      features: string[];
      cta: CtaHref;
      highlighted: boolean;
    }>;
    guaranteeMicro: string;
    compareLink: CtaCanonical;
  };
  faq: {
    h2: string;
    questions: Array<{ q: string; a: string }>;
    cta: CtaCanonical;
  };
  finalCta: {
    h2: string;
    body: string;
    ctaPrimary: CtaHref;
    trustSignals: string[];
  };
}
