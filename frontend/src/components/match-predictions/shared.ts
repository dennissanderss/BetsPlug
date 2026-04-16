/**
 * Shared constants + utilities for the public match-prediction
 * pages (the teaser at /match-predictions and the per-league
 * hubs at /match-predictions/[league_slug]).
 */

export const FREE_PICKS = 3;
export const LOCKED_PREVIEW = 6;

export type ConfLevel = "High" | "Medium" | "Low";

export function formatKickoff(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(locale === "en" ? "en-GB" : locale, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

export function confLevel(score: number): ConfLevel {
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

export function confColor(level: ConfLevel): string {
  if (level === "High") return "#4ade80";
  if (level === "Medium") return "#ededed";
  return "#ef4444";
}

/**
 * Format the live-match elapsed minute for display.
 *
 * API-Football short status codes:
 *   "1H" → First half  → "12'"
 *   "HT" → Half-time   → "HT"
 *   "2H" → Second half → "67'"
 *   "ET" → Extra time  → "95'"
 *   "BT" → Break (ET)  → "HT (ET)"
 *   "P"  → Penalties   → "Pen."
 *   "FT" → Finished    → "FT" (rare — usually fixture.status becomes "finished")
 *
 * Returns null when no live data is available.
 */
export function formatLiveMinute(
  live: { elapsed: number | null; status: string | null } | null | undefined,
): string | null {
  if (!live) return null;
  const s = (live.status ?? "").toUpperCase();
  if (s === "HT") return "HT";
  if (s === "BT") return "HT ET";
  if (s === "P") return "Pen.";
  if (s === "FT") return "FT";
  if (live.elapsed == null) return null;
  // Second half overruns (injury time) come through as >= 45 elapsed in "2H"
  // but API-Football doesn't split out the +N portion — render plain minute.
  return `${live.elapsed}'`;
}
