/**
 * Type contract for learn articles.
 * Body is a structured array of section objects (rendered server-side
 * by ArticleBody.astro) — no MDX needed. KaTeX formulas + SVG diagrams
 * are referenced by component-name + props.
 */

import type { Difficulty } from "@/content/pages/learn/types";

export interface Paragraph {
  type: "paragraph";
  text: string;
}
export interface ParagraphList {
  type: "list";
  ordered?: boolean;
  items: string[];
}
export interface Heading3 {
  type: "h3";
  text: string;
}
export interface Formula {
  type: "formula";
  /** LaTeX source — rendered with KaTeX displayMode. */
  latex: string;
  caption?: string;
}
export interface Diagram {
  type: "diagram";
  /** Component identifier — caller renders the matching SVG component. */
  name: "xg-shot-map" | "elo-update" | "kelly-curve" | "poisson-distribution";
  caption: string;
}
export interface ExampleBox {
  type: "example";
  label: string;
  body: string;
}
export interface BlockQuote {
  type: "quote";
  text: string;
}

export type Block =
  | Paragraph
  | ParagraphList
  | Heading3
  | Formula
  | Diagram
  | ExampleBox
  | BlockQuote;

export interface ArticleSection {
  /** ID for TOC anchor. */
  id: string;
  /** H2 heading text. */
  h2: string;
  blocks: Block[];
}

export interface FaqItem { q: string; a: string }

export interface ArticleContent {
  _meta: {
    translationStatus: "source" | "ai-generated" | "human-reviewed";
    needsReview: boolean;
    lastUpdated: string;
  };
  meta: { title: string; description: string; ogImage: string };
  /** Header data (matches ArticleCardData but with full breadcrumb context). */
  header: {
    h1: string;
    excerpt: string;
    readingTime: string;
    difficulty: Difficulty;
    category: string;
    publishedAt: string;
    updatedAt: string;
  };
  /** TOC label e.g. "In This Article". */
  tocLabel: string;
  /** Intro paragraph displayed before sections (~150 words). */
  intro: string;
  sections: ArticleSection[];
  keyTakeaways: {
    h3: string;
    items: string[];
  };
  faq: {
    h2: string;
    questions: FaqItem[];
  };
  /** Slugs of related articles to render at end. */
  relatedArticles: {
    h2: string;
    /** Canonical (English) slugs — resolved via ArticleCard. */
    slugs: string[];
  };
  applyThis: {
    h2: string;
    body: string;
    ctaPrimary: { label: string; canonical: string };
    ctaSecondary: { label: string; canonical: string };
  };
  breadcrumbLearn: string; // localized "Learn" label
}
