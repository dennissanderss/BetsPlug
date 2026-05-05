/**
 * Type contract for the standalone /how-it-works page (one JSON per locale).
 * Six pipeline steps from raw fixture to graded pick, written in plain
 * language — no engine-internals jargon. The icon names map onto the
 * inline SVG set in HowItWorksPage.astro.
 */

export interface CtaCanonical { label: string; canonical: string }

export type HowItWorksIcon =
  | "database"   // step 1 — collection
  | "cpu"        // step 2 — engine math
  | "layers"     // step 3 — tier sorting
  | "lock"       // step 4 — lock before kickoff
  | "check"      // step 5 — settle + grade
  | "eye";       // step 6 — visibility / verification

export interface HowItWorksStep {
  number: string;
  icon: HowItWorksIcon;
  title: string;
  body: string;
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
  };
  hero: {
    kicker: string;
    /** May contain a single {{accent}}…{{/accent}} segment. */
    title: string;
    subtitle: string;
  };
  steps: HowItWorksStep[];
  ctaPrimary: CtaCanonical;
  ctaSecondary: CtaCanonical;
}
