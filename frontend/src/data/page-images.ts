/**
 * Centralised mapping of per-page hero and final-CTA background images.
 *
 * Files live under /public/hero/ or /public/cta/ with SEO-friendly
 * descriptive filenames. The mapping below uses `.jpg`, but `.webp`
 * is also supported — just change the extension in the matching entry
 * (or rename the dropped file to match). Both formats render directly
 * as CSS background-image without any code change.
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
  | "articles"
  | "article"
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

export const PAGE_IMAGES: Record<PageImageKey, PageImagePair> = {
  home: {
    hero: "/hero/ai-football-predictions-stadium.jpg",
    cta: "/cta/football-player-celebrating-goal.jpg",
    alt: "Footballer celebrating a goal",
    pattern: "dots",
  },
  "how-it-works": {
    hero: "/hero/football-data-analytics-workflow.jpg",
    cta: "/cta/football-team-huddle-tactics.jpg",
    alt: "Football team in a tactical huddle",
    pattern: "grid",
  },
  "track-record": {
    hero: "/hero/football-match-statistics-scoreboard.jpg",
    cta: "/cta/football-striker-scoring-winner.jpg",
    alt: "Football striker scoring a match-winning goal",
    pattern: "diagonal",
  },
  about: {
    hero: "/hero/football-coach-analysis-sideline.jpg",
    cta: "/cta/football-fans-celebrating-victory.jpg",
    alt: "Football fans celebrating a victory",
    pattern: "crosshatch",
  },
  contact: {
    hero: "/hero/football-stadium-empty-seats.jpg",
    cta: "/cta/footballer-triumphant-pose-stadium.jpg",
    alt: "Footballer in triumphant pose under stadium lights",
    pattern: "chevron",
  },
  b2b: {
    hero: "/hero/football-tactical-board-boardroom.jpg",
    cta: "/cta/professional-football-match-broadcast.jpg",
    alt: "Professional football match broadcast setup",
    pattern: "ticks",
  },
  welcome: {
    hero: "/hero/football-training-session-sunrise.jpg",
    cta: "/cta/football-captain-lifting-trophy.jpg",
    alt: "Football captain lifting the trophy",
    pattern: "vertical",
  },
  articles: {
    hero: "/hero/football-journalist-press-room.jpg",
    cta: "/cta/football-match-action-shot.jpg",
    alt: "Dynamic football match action shot",
    pattern: "dotgrid",
  },
  article: {
    hero: "/hero/football-article-editorial-backdrop.jpg",
    cta: "/cta/football-winning-moment-crowd.jpg",
    alt: "Winning moment at a packed football stadium",
    pattern: "dashes",
  },
  "match-predictions": {
    hero: "/hero/football-pitch-markings-aerial.jpg",
    cta: "/cta/football-player-raising-fist-celebration.jpg",
    alt: "Football player raising fist in celebration",
    pattern: "horizontal",
  },
  learn: {
    hero: "/hero/football-playbook-strategy-notes.jpg",
    cta: "/cta/football-midfielder-passing-action.jpg",
    alt: "Football midfielder in action",
    pattern: "plus",
  },
  "bet-types": {
    hero: "/hero/football-statistics-graph-overlay.jpg",
    cta: "/cta/football-goalkeeper-diving-save.jpg",
    alt: "Football goalkeeper diving for a save",
    pattern: "checker",
  },
  checkout: {
    hero: "/hero/football-premium-locker-room.jpg",
    cta: "/cta/football-team-celebration-lineup.jpg",
    alt: "Football team celebration lineup",
    pattern: "waves",
  },
  "thank-you": {
    hero: "/hero/football-welcome-stadium-gates.jpg",
    cta: "/cta/footballer-pointing-to-sky-celebration.jpg",
    alt: "Footballer pointing to sky in celebration",
    pattern: "zigzag",
  },
  pricing: {
    hero: "/hero/football-premium-seating-vip.jpg",
    cta: "/cta/champion-footballer-trophy-lift.jpg",
    alt: "Champion footballer lifting trophy",
    pattern: "triangles",
  },
};

export function getPageImages(key: PageImageKey): PageImagePair {
  return PAGE_IMAGES[key];
}
