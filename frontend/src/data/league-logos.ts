/**
 * Maps a league slug (as used in the URL / Sanity) to the local PNG in
 * public/leagues/. The filenames aren't always the same as the slug
 * (e.g. slug "la-liga" → file "laliga.png"), so this shim lives here
 * instead of inside the page component.
 *
 * When a mapping is missing, the caller should render an initials
 * fallback instead of a broken <img>.
 */
export const LEAGUE_LOGO_PATH: Record<string, string> = {
  "premier-league": "/leagues/premier-league.png",
  "la-liga": "/leagues/laliga.png",
  "bundesliga": "/leagues/bundesliga.png",
  "serie-a": "/leagues/serie-a.png",
  "ligue-1": "/leagues/ligue-1.png",
  "eredivisie": "/leagues/eredivisie.png",
  "champions-league": "/leagues/champions-league.png",
  "europa-league": "/leagues/europa-league.png",
  "conference-league": "/leagues/conference-league.png",
  "championship": "/leagues/championship.png",
  "primeira-liga": "/leagues/liga-portugal.png",
  "liga-portugal": "/leagues/liga-portugal.png",
  "jupiler-pro-league": "/leagues/jupiler-pro-league.png",
  "scottish-premiership": "/leagues/scottish-premiership.png",
  "swiss-super-league": "/leagues/swiss-super-league.png",
  "super-lig": "/leagues/super-lig.png",
  "saudi-pro-league": "/leagues/saudi-pro-league.png",
  "mls": "/leagues/mls.png",
  "liga-mx": "/leagues/liga-mx.png",
  "brasileirao-serie-a": "/leagues/brazil-serie-a.png",
  "brazil-serie-a": "/leagues/brazil-serie-a.png",
  "copa-libertadores": "/leagues/copa-libertadores.png",
  "liga-profesional-argentina": "/leagues/liga-profesional-argentina.png",
  "allsvenskan": "/leagues/allsvenskan.png",
};

/** Safe accessor — returns null when no logo is available for the slug. */
export function getLeagueLogoPath(slug: string): string | null {
  return LEAGUE_LOGO_PATH[slug] ?? null;
}
