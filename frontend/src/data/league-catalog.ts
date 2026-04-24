/**
 * League catalog — static client-safe source of truth for league
 * navigation widgets (mega-menu, homepage strip, footer cluster,
 * match-predictions index grid).
 *
 * Each entry mirrors the Sanity `leagueHub` slug so the URL
 * `/match-predictions/{slug}` always resolves. The EN/NL `name`
 * field is duplicated here so client components don't have to await
 * a Sanity fetch to render the nav — this is UI scaffolding, not
 * editorial copy.
 *
 * `tier: "primary"` leagues are featured in the mega-menu top block
 * and the homepage popular-leagues strip. The rest surface in
 * "All leagues" lists (footer cluster + index grid + mega-menu
 * overflow).
 */

export type LeagueTier = "primary" | "secondary";

export interface LeagueCatalogEntry {
  slug: string;
  name: { en: string; nl: string };
  flag: string; // emoji fallback when no crest available
  tier: LeagueTier;
}

export const LEAGUE_CATALOG: LeagueCatalogEntry[] = [
  // ── Europe — top 5 ──
  { slug: "premier-league", name: { en: "Premier League", nl: "Premier League" }, flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tier: "primary" },
  { slug: "la-liga", name: { en: "La Liga", nl: "La Liga" }, flag: "🇪🇸", tier: "primary" },
  { slug: "bundesliga", name: { en: "Bundesliga", nl: "Bundesliga" }, flag: "🇩🇪", tier: "primary" },
  { slug: "serie-a", name: { en: "Serie A", nl: "Serie A" }, flag: "🇮🇹", tier: "primary" },
  { slug: "ligue-1", name: { en: "Ligue 1", nl: "Ligue 1" }, flag: "🇫🇷", tier: "primary" },

  // ── UEFA cups ──
  { slug: "champions-league", name: { en: "Champions League", nl: "Champions League" }, flag: "🏆", tier: "primary" },
  { slug: "europa-league", name: { en: "Europa League", nl: "Europa League" }, flag: "🏆", tier: "primary" },
  { slug: "conference-league", name: { en: "Conference League", nl: "Conference League" }, flag: "🏆", tier: "secondary" },

  // ── Other tier-1 domestic ──
  { slug: "eredivisie", name: { en: "Eredivisie", nl: "Eredivisie" }, flag: "🇳🇱", tier: "primary" },
  { slug: "primeira-liga", name: { en: "Primeira Liga", nl: "Primeira Liga" }, flag: "🇵🇹", tier: "secondary" },
  { slug: "championship", name: { en: "Championship", nl: "Championship" }, flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tier: "secondary" },
  { slug: "super-lig", name: { en: "Süper Lig", nl: "Süper Lig" }, flag: "🇹🇷", tier: "secondary" },
  { slug: "jupiler-pro-league", name: { en: "Jupiler Pro League", nl: "Jupiler Pro League" }, flag: "🇧🇪", tier: "secondary" },
  { slug: "scottish-premiership", name: { en: "Scottish Premiership", nl: "Scottish Premiership" }, flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", tier: "secondary" },
  { slug: "swiss-super-league", name: { en: "Swiss Super League", nl: "Swiss Super League" }, flag: "🇨🇭", tier: "secondary" },

  // ── Americas ──
  { slug: "brasileirao-serie-a", name: { en: "Brasileirão Série A", nl: "Brasileirão Série A" }, flag: "🇧🇷", tier: "secondary" },
  { slug: "liga-mx", name: { en: "Liga MX", nl: "Liga MX" }, flag: "🇲🇽", tier: "secondary" },
  { slug: "mls", name: { en: "MLS", nl: "MLS" }, flag: "🇺🇸", tier: "secondary" },
  { slug: "copa-libertadores", name: { en: "Copa Libertadores", nl: "Copa Libertadores" }, flag: "🏆", tier: "secondary" },
  { slug: "liga-profesional-argentina", name: { en: "Liga Profesional", nl: "Liga Profesional" }, flag: "🇦🇷", tier: "secondary" },

  // ── Rest of world ──
  { slug: "saudi-pro-league", name: { en: "Saudi Pro League", nl: "Saudi Pro League" }, flag: "🇸🇦", tier: "secondary" },
];

/** Primary leagues only — for the 8-up mega-menu block + homepage strip. */
export const PRIMARY_LEAGUES = LEAGUE_CATALOG.filter((l) => l.tier === "primary");

/** Full list — for footer cluster + index grid. */
export const ALL_LEAGUES = LEAGUE_CATALOG;

/** Returns the display name for a locale with EN fallback. League
 *  names are mostly proper nouns (brand entities) so non-EN/NL
 *  locales get the EN copy — Nerdytips-style keyword preservation. */
export function getLeagueName(
  entry: LeagueCatalogEntry,
  locale: string,
): string {
  return (entry.name as Record<string, string>)[locale] ?? entry.name.en;
}
