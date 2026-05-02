/**
 * Type contract for per-league content JSON.
 *
 * Storage strategy:
 *   - One source-of-truth EN file per league at
 *     `src/content/leagues/{slug}/en.json` containing every field.
 *   - Per non-EN locale: a "delta" file at
 *     `src/content/leagues/{slug}/{locale}.json` with only the
 *     unique fields (meta, hero.h1, hero.subheadline,
 *     context.{h2,paragraphs,statsPanel.h3,statsPanel.ctaLabel},
 *     methodology.{h2,body}, faq, finalCta).
 *   - Plus shared per-locale labels at
 *     `src/content/leagues/_labels/{locale}.json` for UI strings.
 *   - The loader (lib/league-content.ts) deep-merges:
 *     EN file ← delta file ← labels file → final LeaguePageContent.
 */

export interface CtaCanonical { label: string; canonical: string }
export interface CtaHref { label: string; href: string }

export interface LeaguePageContent {
  _meta: {
    translationStatus: "source" | "ai-generated" | "human-reviewed";
    needsReview: boolean;
    lastUpdated: string;
  };
  meta: { title: string; description: string; ogImage: string };
  hero: {
    h1: string;
    subheadline: string;
    trustStripPredictionsThisWeek: string;
    trustStripUpdated: string;
    trustStripLocked: string;
    ctaPrimaryFreeLabel: string;
    ctaPrimaryGatedLabel: string;
    ctaSecondary: CtaCanonical;
    statsTeams: string;
    statsMatchweek: string;
    statsThisWeek: string;
  };
  cards: {
    locked: string; freePick: string; unlock: string;
    subscribeToView: string; viewAnalysis: string;
    confidence: string; lockedBeforeKickoff: string; viewPricing: string;
  };
  filter: { today: string; thisWeek: string; allUpcoming: string };
  cardsSection: {
    moreTodayPaid: string;
    unlockAll: string;
    fixturesOnlyHeading: string;
    fixturesEmpty: string;
  };
  context: {
    h2: string;
    paragraphs: [string, string, string];
    statsPanel: {
      h3: string;
      teamsLabel: string;
      seasonLabel: string;
      matchweekLabel: string;
      topScorerLabel: string;
      predictionsThisSeasonLabel: string;
      updatedLabel: string;
      ctaLabel: string;
    };
  };
  topTeams: {
    h2: string;
    positionLabel: string;
    formLabel: string;
    viewTeamLabel: string;
  };
  methodology: {
    h2: string;
    body: string;
    pillars: { icon: "calc" | "ml" | "lock"; label: string }[];
    cta: CtaCanonical;
  };
  faq: {
    h2: string;
    questions: { q: string; a: string }[];
    cta: CtaCanonical;
  };
  finalCta: {
    h2Free: string;
    h2Gated: string;
    bodyFree: string;
    bodyGated: string;
    ctaPrimary: CtaCanonical;
    ctaSecondary: CtaHref;
  };
}
