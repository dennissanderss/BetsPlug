/**
 * Type contract for /learn hub content.
 */

export interface CtaCanonical { label: string; canonical: string }

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface ArticleCardData {
  /** Canonical (English) slug — resolved to localized slug at render. */
  slug: string;
  title: string;
  excerpt: string;
  readingTime: string;
  difficulty: Difficulty;
}

export interface CategoryGroup {
  title: string;
  articles: ArticleCardData[];
}

export interface LearnHubContent {
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
  };
  grid: {
    h2: string;
    /** Localized "Read article →" label. */
    readMore: string;
    /** Difficulty label translations. */
    difficultyLabels: Record<Difficulty, string>;
    categories: CategoryGroup[];
  };
  whyTopics: {
    h2: string;
    paragraphs: string[];
  };
  finalCta: {
    h2: string;
    body: string;
    ctaPrimary: CtaCanonical;
    ctaSecondary: CtaCanonical;
  };
}
