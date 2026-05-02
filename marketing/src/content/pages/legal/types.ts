/**
 * Type contract for the 4 legal pages: /privacy, /terms,
 * /cookies, /responsible-gambling.
 *
 * Source-of-truth strategy: content is authored in EN as a TS module
 * (so we can compose helpers + tables without re-typing JSON), and
 * non-EN locales receive a thin overrides JSON for the few items that
 * MUST be localized:
 *   - H1, intro paragraph, page meta
 *   - Section H2 titles (everything else falls back to EN)
 *   - Country-specific resources (data-protection authority,
 *     responsible-gambling helplines)
 *
 * Lawyer review BEFORE production launch — see top of every page.
 */

export interface LegalCellRich {
  text: string;
  /** Optional inline list rendered as a bulleted <ul> below the text. */
  bullets?: string[];
}

/** Rendered paragraph block. Plain string is the default. */
export type LegalParagraph =
  | string
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "callout"; tone: "warn" | "info"; text: string }
  | {
      kind: "table";
      caption?: string;
      headers: string[];
      rows: string[][];
    };

export interface LegalSectionContent {
  /** Stable id for TOC anchor + deep-linking. */
  id: string;
  /** Section heading (numbered when `number` is set). */
  title: string;
  /** Optional 1-indexed numbering shown before the title. */
  number?: number;
  body: LegalParagraph[];
}

export interface LegalMeta {
  title: string;
  description: string;
  ogImage?: string;
}

export interface LegalContact {
  email: string;
  postalAddressLine: string;
  /** Optional Data Protection Officer line. */
  dpo?: string;
  /** Locale-aware authority block, rendered after the email. */
  authority?: {
    /** "Netherlands", "Germany", … in the user's locale. */
    countryLabel: string;
    name: string;
    url?: string;
  };
}

export interface LegalPageContent {
  _meta: {
    translationStatus: "source" | "ai-generated" | "human-reviewed";
    needsReview: boolean;
    /** ISO date — when content was last updated. */
    lastUpdated: string;
    version: string;
    effectiveDate: string;
  };
  meta: LegalMeta;
  hero: {
    h1: string;
    intro: string;
  };
  /** UI labels for the layout chrome (TOC, "last updated", etc). */
  labels: {
    tocTitle: string;
    lastUpdatedLabel: string;
    versionLabel: string;
    effectiveDateLabel: string;
    lawyerReviewWarning: string;
    contactHeading: string;
  };
  sections: LegalSectionContent[];
  contact: LegalContact;
}
