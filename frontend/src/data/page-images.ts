/**
 * Centralised mapping of per-page hero and final-CTA background images.
 *
 * Every file is a WebP under /public/hero/ or /public/cta/ with an
 * SEO-friendly descriptive filename. The image itself is rendered at
 * low opacity behind a diagonal-stripe pattern + dark gradient overlay.
 *
 * Drop the actual .webp files into /public/hero and /public/cta with
 * the exact filenames below. Missing files fail open (the gradient +
 * pattern still render, just without the photo).
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

interface PageImagePair {
  hero: string;
  cta: string;
  alt: string;
}

export const PAGE_IMAGES: Record<PageImageKey, PageImagePair> = {
  home: {
    hero: "/hero/ai-football-predictions-stadium.webp",
    cta: "/cta/football-player-celebrating-goal.webp",
    alt: "Footballer celebrating a goal",
  },
  "how-it-works": {
    hero: "/hero/football-data-analytics-workflow.webp",
    cta: "/cta/football-team-huddle-tactics.webp",
    alt: "Football team in a tactical huddle",
  },
  "track-record": {
    hero: "/hero/football-match-statistics-scoreboard.webp",
    cta: "/cta/football-striker-scoring-winner.webp",
    alt: "Football striker scoring a match-winning goal",
  },
  about: {
    hero: "/hero/football-coach-analysis-sideline.webp",
    cta: "/cta/football-fans-celebrating-victory.webp",
    alt: "Football fans celebrating a victory",
  },
  contact: {
    hero: "/hero/football-stadium-empty-seats.webp",
    cta: "/cta/footballer-triumphant-pose-stadium.webp",
    alt: "Footballer in triumphant pose under stadium lights",
  },
  b2b: {
    hero: "/hero/football-tactical-board-boardroom.webp",
    cta: "/cta/professional-football-match-broadcast.webp",
    alt: "Professional football match broadcast setup",
  },
  welcome: {
    hero: "/hero/football-training-session-sunrise.webp",
    cta: "/cta/football-captain-lifting-trophy.webp",
    alt: "Football captain lifting the trophy",
  },
  articles: {
    hero: "/hero/football-journalist-press-room.webp",
    cta: "/cta/football-match-action-shot.webp",
    alt: "Dynamic football match action shot",
  },
  article: {
    hero: "/hero/football-article-editorial-backdrop.webp",
    cta: "/cta/football-winning-moment-crowd.webp",
    alt: "Winning moment at a packed football stadium",
  },
  "match-predictions": {
    hero: "/hero/football-pitch-markings-aerial.webp",
    cta: "/cta/football-player-raising-fist-celebration.webp",
    alt: "Football player raising fist in celebration",
  },
  learn: {
    hero: "/hero/football-playbook-strategy-notes.webp",
    cta: "/cta/football-midfielder-passing-action.webp",
    alt: "Football midfielder in action",
  },
  "bet-types": {
    hero: "/hero/football-statistics-graph-overlay.webp",
    cta: "/cta/football-goalkeeper-diving-save.webp",
    alt: "Football goalkeeper diving for a save",
  },
  checkout: {
    hero: "/hero/football-premium-locker-room.webp",
    cta: "/cta/football-team-celebration-lineup.webp",
    alt: "Football team celebration lineup",
  },
  "thank-you": {
    hero: "/hero/football-welcome-stadium-gates.webp",
    cta: "/cta/footballer-pointing-to-sky-celebration.webp",
    alt: "Footballer pointing to sky in celebration",
  },
  pricing: {
    hero: "/hero/football-premium-seating-vip.webp",
    cta: "/cta/champion-footballer-trophy-lift.webp",
    alt: "Champion footballer lifting trophy",
  },
};

export function getPageImages(key: PageImageKey): PageImagePair {
  return PAGE_IMAGES[key];
}
