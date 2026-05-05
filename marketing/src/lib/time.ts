/**
 * Football-time formatting utilities.
 * See docs/specs/04-design-system.md → SPORT-DNA.
 *
 * Provides locale-aware kickoff countdowns ("Kickoff in 2h 34m"),
 * football-style match minute labels ("78'", "90+3'"), match status
 * shortcodes (LIVE/FT/HT/AET/PEN/...), relative-time labels
 * ("5' ago" / "12 min ago"), and matchweek labels per locale.
 *
 * Marketing locales: en, nl, de, fr, es, it, sw (7 locales — frozen).
 *
 * Pure server/client safe — no browser-only APIs. Tests live next to
 * the file (lib/time.test.ts) when added.
 */
import type { Locale } from "@/i18n/locales";

interface TimeStrings {
  /** "Kickoff in" prefix */
  kickoffIn: string;
  /** Day unit label (singular, abbreviated) */
  d: string;
  /** Hour unit label (abbreviated) */
  h: string;
  /** Minute unit label (abbreviated) */
  m: string;
  /** Used in relative-time, e.g. "12 min ago" */
  minAgo: (n: number) => string;
  hAgo: (n: number) => string;
  dAgo: (n: number) => string;
  justNow: string;
  /** "Matchweek" prefix */
  matchweek: string;
  /** "Round" prefix (knockout) */
  round: string;
  /** Relative-time short suffix used after seconds in "5' ago" */
  ago: string;
  /** "In progress" fallback when countdown has elapsed */
  inProgress: string;
}

const STRINGS: Record<Locale, TimeStrings> = {
  en: {
    kickoffIn: "Kickoff in",
    d: "d", h: "h", m: "m",
    minAgo: (n) => `${n} min ago`,
    hAgo:   (n) => `${n}h ago`,
    dAgo:   (n) => `${n}d ago`,
    justNow: "Just now",
    matchweek: "Matchweek",
    round: "Round",
    ago: "ago",
    inProgress: "In progress",
  },
  nl: {
    kickoffIn: "Aftrap over",
    d: "d", h: "u", m: "m",
    minAgo: (n) => `${n} min geleden`,
    hAgo:   (n) => `${n}u geleden`,
    dAgo:   (n) => `${n}d geleden`,
    justNow: "Zojuist",
    matchweek: "Speelronde",
    round: "Ronde",
    ago: "geleden",
    inProgress: "Bezig",
  },
  de: {
    kickoffIn: "Anstoß in",
    d: "T", h: "Std", m: "Min",
    minAgo: (n) => `vor ${n} Min`,
    hAgo:   (n) => `vor ${n} Std`,
    dAgo:   (n) => `vor ${n} T`,
    justNow: "Gerade eben",
    matchweek: "Spieltag",
    round: "Runde",
    ago: "vor",
    inProgress: "Läuft",
  },
  fr: {
    kickoffIn: "Coup d'envoi dans",
    d: "j", h: "h", m: "min",
    minAgo: (n) => `il y a ${n} min`,
    hAgo:   (n) => `il y a ${n} h`,
    dAgo:   (n) => `il y a ${n} j`,
    justNow: "À l'instant",
    matchweek: "Journée",
    round: "Tour",
    ago: "il y a",
    inProgress: "En cours",
  },
  es: {
    kickoffIn: "Saque inicial en",
    d: "d", h: "h", m: "min",
    minAgo: (n) => `hace ${n} min`,
    hAgo:   (n) => `hace ${n} h`,
    dAgo:   (n) => `hace ${n} d`,
    justNow: "Justo ahora",
    matchweek: "Jornada",
    round: "Ronda",
    ago: "hace",
    inProgress: "En curso",
  },
  it: {
    kickoffIn: "Calcio d'inizio tra",
    d: "g", h: "h", m: "min",
    minAgo: (n) => `${n} min fa`,
    hAgo:   (n) => `${n} h fa`,
    dAgo:   (n) => `${n} g fa`,
    justNow: "Proprio ora",
    matchweek: "Giornata",
    round: "Turno",
    ago: "fa",
    inProgress: "In corso",
  },
  sw: {
    kickoffIn: "Mechi inaanza baada ya",
    d: "siku", h: "saa", m: "dak",
    minAgo: (n) => `dakika ${n} zilizopita`,
    hAgo:   (n) => `saa ${n} zilizopita`,
    dAgo:   (n) => `siku ${n} zilizopita`,
    justNow: "Sasa hivi",
    matchweek: "Wiki ya mechi",
    round: "Raundi",
    ago: "zilizopita",
    inProgress: "Inaendelea",
  },
};

const BCP47: Record<Locale, string> = {
  en: "en-GB",
  nl: "nl-NL",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  it: "it-IT",
  sw: "sw-KE",
};

/**
 * Format a kickoff countdown — "Kickoff in 2h 34m", "Kickoff in 3d 4h",
 * "Kickoff in 12m". Returns the locale's "in progress" string when the
 * kickoff is in the past.
 */
export function formatKickoffCountdown(kickoffISO: string, locale: Locale): string {
  const t = STRINGS[locale];
  const kickoff = new Date(kickoffISO).getTime();
  if (Number.isNaN(kickoff)) return "";

  const now = Date.now();
  const diffMs = kickoff - now;
  if (diffMs <= 0) return t.inProgress;

  const totalMin = Math.floor(diffMs / 60_000);
  const days  = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins  = totalMin % 60;

  if (days >= 1) {
    // 3d 4h — drop minutes once we're talking days.
    return `${t.kickoffIn} ${days}${t.d} ${hours}${t.h}`;
  }
  if (hours >= 1) {
    return `${t.kickoffIn} ${hours}${t.h} ${mins}${t.m}`;
  }
  return `${t.kickoffIn} ${mins}${t.m}`;
}

/**
 * Match minute label using football's apostrophe convention:
 *   - 78          → "78'"
 *   - 90 + 3      → "90+3'"
 */
export function formatMatchMinute(minute: number, addedTime?: number): string {
  if (typeof addedTime === "number" && addedTime > 0) {
    return `${minute}+${addedTime}'`;
  }
  return `${minute}'`;
}

export type MatchStatus =
  | "live"
  | "ft"
  | "ht"
  | "aet"
  | "pen"
  | "postponed"
  | "cancelled"
  | "tbd"
  | "upcoming";

/** Universal short-code label — football conventions in caps. */
export function formatMatchStatus(status: MatchStatus): string {
  const map: Record<MatchStatus, string> = {
    live:      "LIVE",
    ft:        "FT",
    ht:        "HT",
    aet:       "AET",
    pen:       "PEN",
    postponed: "POSTPONED",
    cancelled: "CANCELLED",
    tbd:       "TBD",
    upcoming:  "UPCOMING",
  };
  return map[status];
}

/**
 * Relative-time label. Football convention: under an hour we use the
 * apostrophe minute style ("5' ago"); above an hour we switch to "1h
 * ago", "2d ago" — beyond a week we render an absolute date.
 */
export function formatRelativeTime(isoString: string, locale: Locale): string {
  const t = STRINGS[locale];
  const ts = new Date(isoString).getTime();
  if (Number.isNaN(ts)) return "";

  const diffMs   = Date.now() - ts;
  const diffMin  = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay  = Math.floor(diffHour / 24);

  if (diffMin < 1)   return t.justNow;
  // Football minute style: "5' ago" / "5' geleden" / etc.
  if (diffMin < 60)  return `${diffMin}' ${t.ago}`;
  if (diffHour < 24) return t.hAgo(diffHour);
  if (diffDay  < 7)  return t.dAgo(diffDay);

  // Older: format as locale-aware short date ("3 May", "3 mei", ...).
  return new Intl.DateTimeFormat(BCP47[locale], {
    day: "numeric",
    month: "short",
  }).format(new Date(ts));
}

/** "Matchweek 32" / "Speelronde 32" / "Spieltag 32" / ... */
export function formatMatchweek(weekNumber: number, locale: Locale): string {
  return `${STRINGS[locale].matchweek} ${weekNumber}`;
}

/** "Round 16" / "Ronde 16" / "Runde 16" / ... — knockout rounds. */
export function formatRound(roundNumber: number, locale: Locale): string {
  return `${STRINGS[locale].round} ${roundNumber}`;
}
