/**
 * Type contract for /methodology long-form content.
 * 12 sections, ~3500 words EN.
 */

export interface CtaCanonical { label: string; canonical: string }

export interface MethodologyContent {
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
  toc: { h2: string; items: { id: string; label: string }[] };
  pillars: {
    h2: string;
    intro: string;
    items: { tagline: string; oneLiner: string; icon: "elo" | "poisson" | "ml" }[];
  };
  elo: {
    h2: string;
    paragraphs: string[];
    formulaCaption: string;
    exampleBoxLabel: string;
    exampleBoxBody: string;
  };
  poisson: {
    h2: string;
    paragraphs: string[];
    formulaCaption: string;
    exampleBoxLabel: string;
    exampleBoxBody: string;
  };
  ml: {
    h2: string;
    paragraphs: string[];
    diagramCaption: string;
  };
  data: {
    h2: string;
    paragraphs: string[];
    panelTitle: string;
    panelItems: string[];
  };
  locking: {
    h2: string;
    paragraphs: string[];
    timelineCaption: string;
    timelineSteps: { label: string; detail: string }[];
  };
  whatWeDontDo: {
    h2: string;
    intro: string;
    items: { title: string; detail: string }[];
  };
  limitations: {
    h2: string;
    paragraphs: string[];
  };
  faq: {
    h2: string;
    questions: { q: string; a: string }[];
    cta: CtaCanonical;
  };
  finalCta: {
    h2: string;
    body: string;
    ctaPrimary: CtaCanonical;
    ctaSecondary: CtaCanonical;
  };
}
