/**
 * Type contract for /track-record content JSON.
 *
 * The page no longer renders live data — it is a trust-building
 * narrative. Every CTA is either a canonical site path or an
 * external app URL (browse track record in the dashboard).
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
    ctaSecondary: CtaHref;
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
    cta: CtaHref;
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
    ctaSecondary: CtaHref;
  };
}
