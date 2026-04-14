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
