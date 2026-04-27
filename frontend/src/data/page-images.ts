/**
 * Centralised mapping of per-page hero and final-CTA background images.
 *
 * HERO strategy (2026-04-15): every page shares ONE canonical hero
 * image (`/hero/ai-football-predictions-stadium.jpg`). Reasons:
 *   1. The hero is decorative — heavy grayscale + tint + stripe +
 *      gradient overlays wash out visual variety anyway.
 *   2. Single URL = ideal CDN cache hit ratio across navigations.
 *   3. Zero risk of mis-matched stock photos on any page.
 *   4. No SEO loss vs. 15 different filenames of identical or near-
 *      identical images — Google hashes bytes, not URLs, and would
 *      canonicalize duplicates into a single image-search entry.
 * If you later source genuinely distinct, vetted stadium photos,
 * swap individual `hero:` fields to their own filenames.
 *
 * CTA images remain per-page (varied celebration / action shots
 * paired with per-page `pattern:` overlays for distinction).
 *
 * Files live under /public/hero/ or /public/cta/ with SEO-friendly
 * descriptive filenames. The mapping below uses `.jpg`, but `.webp`
 * is also supported — just change the extension in the matching entry.
 *
 * Missing files fail open — the overlays (gradient + pattern + tint)
 * still render, just without the photo.
 */

export type PageImageKey =
  | "home"
  | "how-it-works"
  | "track-record"
  | "about"
  | "contact"
  | "b2b"
  | "welcome"
  | "match-predictions"
  | "learn"
  | "bet-types"
  | "checkout"
  | "thank-you"
  | "pricing";

/** Subtle pattern key used for per-page CTA variety. */
export type CtaPattern =
  | "dots"
  | "grid"
  | "diagonal"
  | "vertical"
  | "horizontal"
  | "chevron"
  | "crosshatch"
  | "ticks"
  | "checker"
  | "plus"
  | "dashes"
  | "waves"
  | "zigzag"
  | "dotgrid"
  | "triangles";

interface PageImagePair {
  hero: string;
  cta: string;
  alt: string;
  pattern: CtaPattern;
}

/** Canonical hero background — shared by every page (see file header). */
const CANONICAL_HERO = "/hero/ai-football-predictions-stadium.jpg";

export const PAGE_IMAGES: Record<PageImageKey, PageImagePair> = {
  home: {
    hero: CANONICAL_HERO,
    cta: "/cta/football-player-celebrating-goal.jpg",
    alt: "Footballer celebrating a goal",
    pattern: "dots",
  },
  "how-it-works": {
    hero: CANONICAL_HERO,
    cta: "/cta/football-team-huddle-tactics.jpg",
    alt: "Football team in a tactical huddle",
    pattern: "grid",
  },
  "track-record": {
    hero: CANONICAL_HERO,
    cta: "/cta/football-striker-scoring-winner.jpg",
    alt: "Football striker scoring a match-winning goal",
    pattern: "diagonal",
  },
  about: {
    hero: CANONICAL_HERO,
    cta: "/cta/football-fans-celebrating-victory.jpg",
    alt: "Football fans celebrating a victory",
    pattern: "crosshatch",
  },
  contact: {
    hero: CANONICAL_HERO,
    cta: "/cta/footballer-triumphant-pose-stadium.jpg",
    alt: "Footballer in triumphant pose under stadium lights",
    pattern: "chevron",
  },
  b2b: {
    hero: CANONICAL_HERO,
    cta: "/cta/professional-football-match-broadcast.jpg",
    alt: "Professional football match broadcast setup",
    pattern: "ticks",
  },
  welcome: {
    hero: CANONICAL_HERO,
    cta: "/cta/football-captain-lifting-trophy.jpg",
    alt: "Football captain lifting the trophy",
    pattern: "vertical",
  },
  "match-predictions": {
    hero: CANONICAL_HERO,
    cta: "/cta/football-player-raising-fist-celebration.jpg",
    alt: "Football player raising fist in celebration",
    pattern: "horizontal",
  },
  learn: {
    hero: CANONICAL_HERO,
    cta: "/cta/football-midfielder-passing-action.jpg",
    alt: "Football midfielder in action",
    pattern: "plus",
  },
  "bet-types": {
    hero: CANONICAL_HERO,
    cta: "/cta/football-goalkeeper-diving-save.jpg",
    alt: "Football goalkeeper diving for a save",
    pattern: "checker",
  },
  checkout: {
    hero: CANONICAL_HERO,
    cta: "/cta/football-team-celebration-lineup.jpg",
    alt: "Football team celebration lineup",
    pattern: "waves",
  },
  "thank-you": {
    hero: CANONICAL_HERO,
    cta: "/cta/footballer-pointing-to-sky-celebration.jpg",
    alt: "Footballer pointing to sky in celebration",
    pattern: "zigzag",
  },
  pricing: {
    hero: CANONICAL_HERO,
    cta: "/cta/champion-footballer-trophy-lift.jpg",
    alt: "Champion footballer lifting trophy",
    pattern: "triangles",
  },
};

export function getPageImages(key: PageImageKey): PageImagePair {
  return PAGE_IMAGES[key];
}
