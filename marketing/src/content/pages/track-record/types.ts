/**
 * Type contract for /track-record content JSON.
 */

export interface CtaCanonical { label: string; canonical: string }
export interface CtaHref { label: string; href: string }

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
    trustStrip: string[];
    ctaPrimary: CtaCanonical;
    ctaSecondary: CtaCanonical;
  };
  widget: {
    h2: string;
    subhead: string;
    rangeLabel: string;
    range30: string;
    range90: string;
    rangeAll: string;
    leagueLabel: string;
    leagueAll: string;
    statsTotal: string;
    statsWins: string;
    statsLosses: string;
    statsVoids: string;
    legendWin: string;
    legendLoss: string;
    legendVoid: string;
    explanationH3: string;
    explanationBody: string;
    loadingLabel: string;
    errorLabel: string;
    tooltipPattern: string;
  };
  whyPublishLosses: {
    h2: string;
    paragraphs: string[];
    panel: {
      totalLabel: string;
      daysLabel: string;
      leaguesLabel: string;
      lastAddedLabel: string;
      leaguesValue: string;
    };
  };
  methodologyLink: {
    h2: string;
    body: string;
    cta: CtaCanonical;
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
