/**
 * Pick-of-the-Day track-record stats — static fallback / SSR source
 * ────────────────────────────────────────────────────────────
 * Single source of truth for the "X% accuracy on Y picks" narrative
 * numbers baked into SEO metadata, pricing-tier feature lists, and
 * any other build-time / server-rendered surface where a live fetch
 * isn't available.
 *
 * Client-rendered surfaces (homepage hero, how-it-works hero,
 * top-bar, Track Record page) use `useBotdTrackRecord()` to fetch
 * live numbers from `/api/bet-of-the-day/track-record` at mount.
 * This file is the fallback for everything that can't.
 *
 * Update policy:
 *   - Manually refresh roughly every 2–4 weeks, or whenever the
 *     live numbers drift by ≥1pp from what's below.
 *   - Source the current values from
 *     https://betsplug-production.up.railway.app/api/bet-of-the-day/track-record
 *     (fields `accuracy_pct` and `total_picks`).
 *   - Update `lastReviewed` when you bump the numbers so future
 *     reviewers know how stale the snapshot is.
 *
 * A follow-up will wire these into the 90+ i18n strings that still
 * carry hardcoded "66.7% / 346" copy (template-placeholder system),
 * at which point this file becomes their fallback too.
 */

export const POTD_STATS = {
  /**
   * Gold-tier accuracy (confidence >= 0.70) as a one-decimal percentage.
   * Source: /api/trackrecord/summary?pick_tier=gold — refreshed 2026-04-18.
   * Gold tier is the flagship tier shown on all public marketing pages because
   * it represents the largest volume of premium evaluated predictions (1 650+)
   * at an honest, compelling win-rate of 70 %+.
   */
  accuracy: "70.6",
  /** Total Gold-tier picks evaluated — human-formatted string. */
  totalPicks: "1650",
  /**
   * NL-formatted accuracy using the Dutch decimal comma.
   * Keep in sync with `accuracy` above.
   */
  accuracyNL: "70,6",
  /** ISO date of the last manual refresh — bump when numbers change. */
  lastReviewed: "2026-04-18",
} as const;
