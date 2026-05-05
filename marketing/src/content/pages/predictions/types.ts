/**
 * Type contract for predictions hub content JSON (one per locale).
 */

export interface CtaCanonical { label: string; canonical: string }
export interface CtaHref { label: string; href: string }

export interface PredictionsHubContent {
  _meta: {
    translationStatus: "source" | "ai-generated" | "human-reviewed";
    needsReview: boolean;
    lastUpdated: string;
  };
  meta: { title: string; description: string; ogImage: string };
  hero: {
    /** {date} placeholder is replaced server-side with today's date in locale format. */
    h1Template: string;
    subheadline: string;
    trustStrip: string[];
    liveLabel: string;       // "Updated"
    liveSecondsAgo: string;  // "{seconds}s ago"
    ctaPrimary: CtaCanonical; // → /pricing
    ctaSecondary: CtaCanonical; // → /methodology
    miniRecord: {
      title: string;          // "Last 30 days"
      subtitle: string;       // "All predictions published — public ledger"
      legendWin: string;
      legendLoss: string;
    };
  };
  filter: {
    today: string;
    tomorrow: string;
    thisWeek: string;
    todayActiveAria: string; // "Showing today's predictions"
  };
  emptyToday: string; // shown when the live API returns 0 picks for today

  cards: {
    /** Card-component labels — passed into <PredictionCard /> labels prop. */
    locked: string;
    freePick: string;
    unlock: string;            // "Unlock prediction"
    subscribeToView: string;   // "Subscribe to view prediction"
    viewAnalysis: string;      // "View match analysis"
    confidence: string;
    lockedBeforeKickoff: string;
    viewPricing: string;
  };
  tomorrowEmpty: {
    teaserTitle: string;        // "🔒 Unlock Tomorrow's Predictions"
    teaserBody: string;         // "{count} more predictions tomorrow"
    cta: CtaCanonical;
  };
  weekTab: {
    h3: string;                 // "This Week Overview"
    body: string;
    weekdayLabels: string[];    // ["Mon","Tue",...]
    cta: CtaCanonical;
  };
  paywall: {
    h2Template: string;         // "You're Seeing 5 of {total} Today's Predictions"
    body: string;
    bullets: string[];
    ctaPrimary: CtaCanonical;
    ctaSecondary: CtaCanonical;
  };
  leagueGrid: {
    h2: string;
    cardCta: string;             // "View predictions →"
    todayCountTemplate: string;  // "{count} predictions today"
    featuredBadge: string;
  };
  methodology: {
    h2: string;
    body: string[];
    pillars: { icon: "calc" | "ml" | "lock"; label: string }[];
    cta: CtaCanonical;
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
    ctaSecondary: CtaHref;
  };
}
