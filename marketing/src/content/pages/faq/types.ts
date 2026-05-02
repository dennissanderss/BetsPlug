/**
 * Type contract for the central /faq pillar page.
 */

export interface CtaCanonical { label: string; canonical: string }

export interface FAQItem {
  /** Stable id for anchor + search index. e.g. "about-1". */
  id: string;
  question: string;
  answer: string;
}

export interface FAQCategory {
  /** Used as anchor prefix and in URLs. */
  id: string;
  name: string;
  description: string;
  questions: FAQItem[];
}

export interface FAQContent {
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
  search: {
    label: string;
    placeholder: string;
    noResultsText: string;
    /** Localized "Submit search" — used as button label for no-JS fallback. */
    submitLabel: string;
    /** Pre-filtered hint shown above categories when ?q= is set on no-JS fallback. */
    filterAppliedTemplate: string;
    clearLabel: string;
  };
  categories: FAQCategory[];
  stillHaveQuestions: {
    h2: string;
    body: string;
    ctaPrimary: CtaCanonical;
    ctaSecondary: CtaCanonical;
  };
}
