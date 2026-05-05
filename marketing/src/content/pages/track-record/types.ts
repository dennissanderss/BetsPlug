/**
 * Type contract for /track-record content JSON.
 *
 * Trust-building narrative — every CTA is a canonical site path.
 * (Earlier drafts pointed at the dashboard's track-record route,
 * but that route doesn't exist; we now route users into /predictions
 * for conversion or /methodology for technical depth.)
 */

export interface CtaCanonical { label: string; canonical: string }
export interface CtaHref      { label: string; href: string }

export interface TrustStripItem { icon: string; text: string }

export interface PillarItem {
  icon: string;
  title: string;
  body: string;
}

export interface VerifyFeature {
  icon: string;
  text: string;
}

export interface FaqItem { q: string; a: string }

export interface TrackRecordContent {
  _meta: {
    translationStatus: "source" | "ai-generated" | "human-reviewed";
    needsReview: boolean;
    lastUpdated: string;
  };

  meta: { title: string; description: string; ogImage: string };

  hero: {
    h1: string;
    subheadline: string;
    trustStrip: TrustStripItem[];
    ctaPrimary:   CtaCanonical;
    ctaSecondary: CtaCanonical;
  };

  whyTransparency: {
    h2: string;
    paragraphs: string[];
  };

  pillars: {
    h2: string;
    subH2: string;
    items: PillarItem[];
  };

  whatYouCanVerify: {
    h2: string;
    subH2: string;
    features: VerifyFeature[];
    cta: CtaCanonical;
    noteUnderCta: string;
    mockup: {
      urlLabel:        string;
      filterAllLeagues: string;
      filterRange:      string;
      filterAllMarkets: string;
      statTotal:  string;
      statWins:   string;
      statLosses: string;
      statVoids:  string;
      gridLabel:  string;
      lockedLabel: string;
      winLabel:   string;
      lossLabel:  string;
    };
  };

  methodologyConnection: {
    h2: string;
    paragraphs: string[];
    cta: CtaCanonical;
  };

  faq: {
    h2: string;
    questions: FaqItem[];
  };

  finalCta: {
    h2: string;
    subH2: string;
    body: string;
    ctaPrimary:   CtaCanonical;
    ctaSecondary: CtaCanonical;
  };
}
