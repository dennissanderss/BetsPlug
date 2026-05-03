/**
 * Team metadata — colours + (optional) logoUrl.
 *
 * TODO: logoUrl is intentionally absent for every entry. When the
 * API-Football integration on app.betsplug.com is ready, point each
 * record at `https://app.betsplug.com/api/teams/{slug}/logo` (or set
 * a single base URL helper) and the TeamLogo component will switch
 * automatically — placeholder shield is the fallback path.
 *
 * Coverage today: ~10 top sides per major league × 6 leagues. Extend
 * as new league pages need it; PlaceholderShield handles unknown
 * teams gracefully (charcoal fallback) so absence is non-fatal.
 */

export interface TeamColors {
  primary: string;   // Used for shield body + card border accent
  secondary: string; // Used for shield outline + monogram text
}

export interface Team {
  slug: string;
  name: string;
  league: string;
  colors: TeamColors;
  logoUrl?: string;
}

export const teams: Record<string, Team> = {
  // ── Premier League ────────────────────────────────────
  "manchester-city":   { slug: "manchester-city",   name: "Manchester City",   league: "premier-league", colors: { primary: "#6CABDD", secondary: "#FFFFFF" } },
  "arsenal":           { slug: "arsenal",           name: "Arsenal",           league: "premier-league", colors: { primary: "#EF0107", secondary: "#FFFFFF" } },
  "liverpool":         { slug: "liverpool",         name: "Liverpool",         league: "premier-league", colors: { primary: "#C8102E", secondary: "#F6EB61" } },
  "chelsea":           { slug: "chelsea",           name: "Chelsea",           league: "premier-league", colors: { primary: "#034694", secondary: "#FFFFFF" } },
  "manchester-united": { slug: "manchester-united", name: "Manchester United", league: "premier-league", colors: { primary: "#DA291C", secondary: "#FBE122" } },
  "tottenham":         { slug: "tottenham",         name: "Tottenham",         league: "premier-league", colors: { primary: "#132257", secondary: "#FFFFFF" } },
  "newcastle":         { slug: "newcastle",         name: "Newcastle",         league: "premier-league", colors: { primary: "#241F20", secondary: "#FFFFFF" } },
  "brighton":          { slug: "brighton",          name: "Brighton",          league: "premier-league", colors: { primary: "#0057B8", secondary: "#FFCD00" } },
  "aston-villa":       { slug: "aston-villa",       name: "Aston Villa",       league: "premier-league", colors: { primary: "#670E36", secondary: "#94BEE5" } },
  "west-ham":          { slug: "west-ham",          name: "West Ham",          league: "premier-league", colors: { primary: "#7A263A", secondary: "#1BB1E7" } },

  // ── La Liga ───────────────────────────────────────────
  "real-madrid":       { slug: "real-madrid",       name: "Real Madrid",       league: "la-liga",        colors: { primary: "#FEBE10", secondary: "#00529F" } },
  "barcelona":         { slug: "barcelona",         name: "Barcelona",         league: "la-liga",        colors: { primary: "#A50044", secondary: "#FFD700" } },
  "atletico-madrid":   { slug: "atletico-madrid",   name: "Atlético Madrid",   league: "la-liga",        colors: { primary: "#CB3524", secondary: "#FFFFFF" } },
  "athletic-bilbao":   { slug: "athletic-bilbao",   name: "Athletic Bilbao",   league: "la-liga",        colors: { primary: "#EE2523", secondary: "#FFFFFF" } },
  "real-sociedad":     { slug: "real-sociedad",     name: "Real Sociedad",     league: "la-liga",        colors: { primary: "#0067B1", secondary: "#FFFFFF" } },
  "sevilla":           { slug: "sevilla",           name: "Sevilla",           league: "la-liga",        colors: { primary: "#D81920", secondary: "#FFFFFF" } },
  "real-betis":        { slug: "real-betis",        name: "Real Betis",        league: "la-liga",        colors: { primary: "#0BB363", secondary: "#FFFFFF" } },
  "villarreal":        { slug: "villarreal",        name: "Villarreal",        league: "la-liga",        colors: { primary: "#FFE667", secondary: "#005187" } },

  // ── Bundesliga ────────────────────────────────────────
  "bayern-munich":     { slug: "bayern-munich",     name: "Bayern Munich",     league: "bundesliga",     colors: { primary: "#DC052D", secondary: "#FFFFFF" } },
  "borussia-dortmund": { slug: "borussia-dortmund", name: "Borussia Dortmund", league: "bundesliga",     colors: { primary: "#FDE100", secondary: "#000000" } },
  "bayer-leverkusen":  { slug: "bayer-leverkusen",  name: "Bayer Leverkusen",  league: "bundesliga",     colors: { primary: "#E32221", secondary: "#000000" } },
  "rb-leipzig":        { slug: "rb-leipzig",        name: "RB Leipzig",        league: "bundesliga",     colors: { primary: "#DD0741", secondary: "#FFFFFF" } },
  "eintracht":         { slug: "eintracht",         name: "Eintracht Frankfurt", league: "bundesliga",   colors: { primary: "#E1000F", secondary: "#000000" } },
  "stuttgart":         { slug: "stuttgart",         name: "VfB Stuttgart",     league: "bundesliga",     colors: { primary: "#E32219", secondary: "#FFFFFF" } },
  "monchengladbach":   { slug: "monchengladbach",   name: "Borussia Mönchengladbach", league: "bundesliga", colors: { primary: "#000000", secondary: "#00B04F" } },
  "werder-bremen":     { slug: "werder-bremen",     name: "Werder Bremen",     league: "bundesliga",     colors: { primary: "#1D9053", secondary: "#FFFFFF" } },

  // ── Serie A ───────────────────────────────────────────
  "inter":             { slug: "inter",             name: "Inter Milan",       league: "serie-a",        colors: { primary: "#0068A8", secondary: "#000000" } },
  "juventus":          { slug: "juventus",          name: "Juventus",          league: "serie-a",        colors: { primary: "#000000", secondary: "#FFFFFF" } },
  "ac-milan":          { slug: "ac-milan",          name: "AC Milan",          league: "serie-a",        colors: { primary: "#FB090B", secondary: "#000000" } },
  "napoli":            { slug: "napoli",            name: "Napoli",            league: "serie-a",        colors: { primary: "#0F65B1", secondary: "#FFFFFF" } },
  "roma":              { slug: "roma",              name: "Roma",              league: "serie-a",        colors: { primary: "#8E1B1B", secondary: "#FBBA00" } },
  "atalanta":          { slug: "atalanta",          name: "Atalanta",          league: "serie-a",        colors: { primary: "#1E71B8", secondary: "#000000" } },
  "lazio":             { slug: "lazio",             name: "Lazio",             league: "serie-a",        colors: { primary: "#87CEEB", secondary: "#FFFFFF" } },
  "fiorentina":        { slug: "fiorentina",        name: "Fiorentina",        league: "serie-a",        colors: { primary: "#592C82", secondary: "#FFFFFF" } },

  // ── Ligue 1 ───────────────────────────────────────────
  "psg":               { slug: "psg",               name: "PSG",               league: "ligue-1",        colors: { primary: "#004170", secondary: "#DA291C" } },
  "marseille":         { slug: "marseille",         name: "Marseille",         league: "ligue-1",        colors: { primary: "#2FAEE0", secondary: "#FFFFFF" } },
  "monaco":            { slug: "monaco",            name: "Monaco",            league: "ligue-1",        colors: { primary: "#CE1126", secondary: "#FFFFFF" } },
  "lyon":              { slug: "lyon",              name: "Lyon",              league: "ligue-1",        colors: { primary: "#003586", secondary: "#DA291C" } },
  "lille":             { slug: "lille",             name: "Lille",             league: "ligue-1",        colors: { primary: "#E01E12", secondary: "#FFFFFF" } },
  "nice":              { slug: "nice",              name: "Nice",              league: "ligue-1",        colors: { primary: "#E10E10", secondary: "#000000" } },
  "lens":              { slug: "lens",              name: "Lens",              league: "ligue-1",        colors: { primary: "#FFD700", secondary: "#E20E0F" } },
  "rennes":            { slug: "rennes",            name: "Rennes",            league: "ligue-1",        colors: { primary: "#E20E0F", secondary: "#000000" } },

  // ── Eredivisie ────────────────────────────────────────
  "ajax":              { slug: "ajax",              name: "Ajax",              league: "eredivisie",     colors: { primary: "#D2122E", secondary: "#FFFFFF" } },
  "psv":               { slug: "psv",               name: "PSV",               league: "eredivisie",     colors: { primary: "#ED1C24", secondary: "#FFFFFF" } },
  "feyenoord":         { slug: "feyenoord",         name: "Feyenoord",         league: "eredivisie",     colors: { primary: "#CC0000", secondary: "#FFFFFF" } },
  "az-alkmaar":        { slug: "az-alkmaar",        name: "AZ Alkmaar",        league: "eredivisie",     colors: { primary: "#E2071A", secondary: "#FFFFFF" } },
  "fc-twente":         { slug: "fc-twente",         name: "FC Twente",         league: "eredivisie",     colors: { primary: "#E2071A", secondary: "#FFFFFF" } },
  "vitesse":           { slug: "vitesse",           name: "Vitesse",           league: "eredivisie",     colors: { primary: "#FFD600", secondary: "#000000" } },
  "heerenveen":        { slug: "heerenveen",        name: "Heerenveen",        league: "eredivisie",     colors: { primary: "#1E60AF", secondary: "#FFFFFF" } },
  "fc-utrecht":        { slug: "fc-utrecht",        name: "FC Utrecht",        league: "eredivisie",     colors: { primary: "#E2071A", secondary: "#FFFFFF" } },
};

/** Charcoal fallback for unknown teams. */
export const FALLBACK_COLORS: TeamColors = {
  primary: "#5A6478",
  secondary: "#FFFFFF",
};

/** Lookup by slug. */
export function getTeam(slug: string): Team | null {
  return teams[slug] ?? null;
}

/** Best-effort slug from a team name — used as a fallback when callers
 * pass `name` only. Strips diacritics + lowercases + dashes. */
export function slugifyTeam(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Look up team colours by slug or by best-effort name slug. Returns
 * fallback charcoal if the team isn't in the registry yet. */
export function getTeamColors(slug?: string, name?: string): TeamColors {
  if (slug && teams[slug]) return teams[slug].colors;
  if (name) {
    const guess = slugifyTeam(name);
    if (teams[guess]) return teams[guess].colors;
  }
  return FALLBACK_COLORS;
}
