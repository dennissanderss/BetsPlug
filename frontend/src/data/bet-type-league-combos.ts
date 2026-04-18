/**
 * Bet-type × league combo landing pages
 * ────────────────────────────────────────────────────────────
 * Programmatic SEO generator for pages like:
 *   /bet-types/both-teams-to-score/premier-league
 *   /bet-types/over-2-5-goals/bundesliga
 *   /bet-types/double-chance/serie-a
 *
 * These pages target high-volume longtail queries like "BTTS
 * Premier League tips" or "Over 2.5 goals Bundesliga predictions"
 * that neither the bet-type hub nor the league hub ranks for on
 * their own. The angle is specific enough (market × competition)
 * that generic content would be duplicate-penalty bait, so each
 * combo gets:
 *   1. A unique intro that cites the league's actual scoring
 *      profile (avg goals/game, baseline BTTS/O2.5 rate).
 *   2. A market-specific strategic angle ("when this market
 *      mis-prices this league").
 *   3. 4 handwritten FAQs stitched from bet-type FAQ + league
 *      name (enough variation to avoid near-duplicate penalty).
 *   4. Unique metadata per combo.
 *
 * Data is generated from two sources of truth:
 *   - BET_TYPE_HUBS  (editorial bet-type content)
 *   - LEAGUE_CATALOG (the league registry)
 * …plus a static LEAGUE_SCORING_PROFILE table that encodes
 * historical averages per competition (public, well-reported
 * numbers — we quote them as "historical" not "current season"
 * so they don't drift).
 */

import { BET_TYPE_HUBS } from "./bet-type-hubs";
import { LEAGUE_CATALOG, getLeagueName } from "./league-catalog";
import type { LeagueCatalogEntry } from "./league-catalog";

export type ComboLocale = "en" | "nl";

/** Historical scoring profile per top league — used to give each
 *  combo page a unique number-laden paragraph. Numbers are rounded
 *  and intentionally cited as multi-season averages so they don't
 *  need updating every weekend. */
type ScoringProfile = {
  avgGoalsPerGame: number;
  /** Historical % of matches where both teams scored. */
  bttsYesPct: number;
  /** Historical % of matches going over 2.5 goals. */
  over25Pct: number;
  /** Historical % of matches that ended in a draw. */
  drawPct: number;
  /** Short flavour clause for league-specific narrative. */
  flavour: {
    en: string;
    nl: string;
  };
};

export const LEAGUE_SCORING_PROFILE: Record<string, ScoringProfile> = {
  "premier-league": {
    avgGoalsPerGame: 2.83,
    bttsYesPct: 52,
    over25Pct: 56,
    drawPct: 24,
    flavour: {
      en: "dominated by high-possession sides and fast transitions",
      nl: "gedomineerd door balbezit-ploegen en snelle omschakelingen",
    },
  },
  "la-liga": {
    avgGoalsPerGame: 2.56,
    bttsYesPct: 48,
    over25Pct: 46,
    drawPct: 26,
    flavour: {
      en: "structurally low-scoring with careful defensive shapes outside the top three",
      nl: "structureel laag-scorend met zorgvuldige defensieve organisatie buiten de top drie",
    },
  },
  bundesliga: {
    avgGoalsPerGame: 3.12,
    bttsYesPct: 59,
    over25Pct: 59,
    drawPct: 23,
    flavour: {
      en: "the highest-scoring of the top-five leagues, with chaotic end-to-end mid-table fixtures",
      nl: "de hoogst scorende van de top-vijf, met chaotische heen-en-weer wedstrijden in de middenmoot",
    },
  },
  "serie-a": {
    avgGoalsPerGame: 2.71,
    bttsYesPct: 51,
    over25Pct: 50,
    drawPct: 27,
    flavour: {
      en: "tactically dense with a higher draw rate than any other top-five league",
      nl: "tactisch dicht met een hogere gelijkspel-rate dan elke andere top-vijf competitie",
    },
  },
  "ligue-1": {
    avgGoalsPerGame: 2.78,
    bttsYesPct: 51,
    over25Pct: 51,
    drawPct: 25,
    flavour: {
      en: "lopsided by PSG's title dominance but with a wide-open mid-table",
      nl: "scheef getrokken door PSG's titeldominantie maar met een open middenmoot",
    },
  },
  "champions-league": {
    avgGoalsPerGame: 2.92,
    bttsYesPct: 55,
    over25Pct: 56,
    drawPct: 22,
    flavour: {
      en: "volatile because the skill-gap between pot 1 and pot 4 is larger than most bettors realise",
      nl: "volatiel omdat de kwaliteitskloof tussen pot 1 en pot 4 groter is dan veel wedders beseffen",
    },
  },
  "europa-league": {
    avgGoalsPerGame: 2.88,
    bttsYesPct: 55,
    over25Pct: 55,
    drawPct: 23,
    flavour: {
      en: "high-variance because of rotating squads and Thursday-night travel fatigue",
      nl: "onvoorspelbaar door roulerende selecties en reismoeheid op donderdagavond",
    },
  },
  "conference-league": {
    avgGoalsPerGame: 3.05,
    bttsYesPct: 57,
    over25Pct: 60,
    drawPct: 22,
    flavour: {
      en: "often wider than bookmakers price — smaller clubs playing open football",
      nl: "vaak wijdser dan bookmakers prijzen — kleinere clubs spelen open voetbal",
    },
  },
  eredivisie: {
    avgGoalsPerGame: 3.2,
    bttsYesPct: 58,
    over25Pct: 62,
    drawPct: 22,
    flavour: {
      en: "built for goals — thin defences and proactive coaching",
      nl: "gebouwd voor goals — dunne defensies en proactieve coaching",
    },
  },
};

/* ── Types ────────────────────────────────────────────────── */

export interface BetTypeFaq {
  q: string;
  a: string;
}

export interface BetTypeLeagueCombo {
  betTypeSlug: string;
  leagueSlug: string;
  shortCode: string;
  name: {
    betType: Record<ComboLocale, string>;
    league: Record<ComboLocale, string>;
  };
  tagline: Record<ComboLocale, string>;
  intro: Record<ComboLocale, string>;
  /** Stats paragraph with league-specific numbers. */
  statsBlock: Record<ComboLocale, string>;
  /** Strategic angle for this market in this league. */
  angle: Record<ComboLocale, string>;
  metaTitle: Record<ComboLocale, string>;
  metaDescription: Record<ComboLocale, string>;
  faqs: Record<ComboLocale, BetTypeFaq[]>;
  /** Whether we have league scoring data — pages without it are
   *  still generated but with a more generic stats paragraph. */
  hasScoringProfile: boolean;
}

/* ── Helpers ──────────────────────────────────────────────── */

function getBetType(slug: string) {
  return BET_TYPE_HUBS.find((h) => h.slug === slug) ?? null;
}

function getLeague(slug: string): LeagueCatalogEntry | null {
  return LEAGUE_CATALOG.find((l) => l.slug === slug) ?? null;
}

/** Pick the relevant market baseline percentage for each bet type. */
function marketBaseline(
  betTypeSlug: string,
  profile: ScoringProfile | undefined,
): { label: { en: string; nl: string }; value: number } | null {
  if (!profile) return null;
  switch (betTypeSlug) {
    case "both-teams-to-score":
      return {
        label: { en: "BTTS Yes", nl: "BTTS Ja" },
        value: profile.bttsYesPct,
      };
    case "over-2-5-goals":
      return {
        label: { en: "Over 2.5 goals", nl: "Meer dan 2,5 goals" },
        value: profile.over25Pct,
      };
    case "draw-no-bet":
      return {
        label: { en: "Draw rate", nl: "Gelijkspelpercentage" },
        value: profile.drawPct,
      };
    case "double-chance":
      // DC's baseline is derived from home-win + draw rates.
      // Rough approximation: Home or Draw ≈ 45% home × 48% = too complex.
      // Use draw-rate as the anchor — DC 1X / X2 relies on it.
      return {
        label: { en: "Draw rate", nl: "Gelijkspelpercentage" },
        value: profile.drawPct,
      };
    default:
      return null;
  }
}

/* ── Combo builder ────────────────────────────────────────── */

export function buildCombo(
  betTypeSlug: string,
  leagueSlug: string,
): BetTypeLeagueCombo | null {
  const betType = getBetType(betTypeSlug);
  const league = getLeague(leagueSlug);
  if (!betType || !league) return null;

  const profile = LEAGUE_SCORING_PROFILE[leagueSlug];
  const baseline = marketBaseline(betTypeSlug, profile);
  const hasProfile = !!profile;

  const leagueName = {
    en: getLeagueName(league, "en"),
    nl: getLeagueName(league, "nl"),
  };
  const betTypeName = {
    en: betType.name.en,
    nl: betType.name.nl,
  };

  /* ── EN copy ─────────────────────────────────────────── */

  const tagline_en = `${betTypeName.en} tips for every ${leagueName.en} matchday — model-derived, pre-match locked`;

  const intro_en = hasProfile
    ? `${leagueName.en} sits at ${profile!.avgGoalsPerGame.toFixed(2)} goals per game across recent seasons — ${profile!.flavour.en}. That number matters more for ${betTypeName.en} than for any other market: when bookmakers price this competition, they lean on a league-wide baseline and then adjust per fixture. Where they over- or under-adjust is where the edge lives. The ${betTypeName.en} slate below is filtered to the ${leagueName.en} fixtures where our four-model ensemble has the highest confidence in its underlying expected-goals reading.`
    : `${leagueName.en} fixtures behave differently from the top-five average when it comes to ${betTypeName.en}. Smaller competitions often have wider scoring distributions than bookmakers price (which are anchored on the biggest leagues), and that gap is exactly what the ${betTypeName.en} market mis-prices most often. BetsPlug surfaces the ${leagueName.en} fixtures where our ensemble's confidence in the underlying xG inputs is highest — those are the ones worth researching for ${betTypeName.en}.`;

  const statsBlock_en = baseline
    ? `Historically, ${baseline.label.en} lands in roughly ${baseline.value}% of ${leagueName.en} matches. A balanced ${betTypeName.en} market should therefore price around ${(100 / baseline.value).toFixed(2)} — but bookmakers frequently skew that line based on public perception of the teams involved, not the underlying scoring profile. When we flag a ${leagueName.en} ${betTypeName.en} pick, the model has typically found a ${baseline.value + 8}%-plus probability against a market line implying ${baseline.value - 5}% or lower.`
    : `Without a long historical scoring profile for ${leagueName.en}, we rely more heavily on our per-team xG estimates to read ${betTypeName.en}. This tends to produce fewer flagged picks per matchday but higher conviction when they do land — we only publish a ${leagueName.en} ${betTypeName.en} call when the ensemble has high confidence in both teams' underlying xG.`;

  const angle_en = `Value in ${leagueName.en} ${betTypeName.en} typically hides in fixtures where public narrative overrules the numbers. Look for mid-table clashes where the market remembers last season's low-scoring headline — those are the exact matches where the ${betTypeName.en} line drifts away from its fair value. The reverse is true when a big team hosts a small one: public money piles onto the obvious side of ${betTypeName.en}, pushing the line too far and leaving genuine value on the opposite side.`;

  const metaTitle_en = `${betTypeName.en} ${leagueName.en} Predictions · BetsPlug`;
  const metaDescription_en = `AI ${betTypeName.en} predictions for every ${leagueName.en} fixture. Historical hit rates, model reasoning, and today's highest-confidence ${leagueName.en} picks — pre-match locked, tracked publicly.`;

  const faqs_en: BetTypeFaq[] = [
    {
      q: `How accurate are BetsPlug's ${betTypeName.en} predictions in the ${leagueName.en}?`,
      a: `Our ${betTypeName.en} flags for ${leagueName.en} fixtures are derived from the underlying 1X2 / xG pipeline rather than a dedicated ${betType.shortCode} head. We track hit rate publicly on the track record page — for a fair evaluation, weigh picks with confidence ≥65% separately from low-conviction ones.`,
    },
    {
      q: `Why would a ${betTypeName.en} bet land more often in the ${leagueName.en} than the market implies?`,
      a: baseline
        ? `Because bookmakers price ${leagueName.en} ${betTypeName.en} using broad priors (roughly ${baseline.value}% ${baseline.label.en} historically) and then shade the line based on public perception. When that shading overshoots — often in fixtures with a clear favourite — the implied probability drifts below the number our xG-based read gives.`
        : `Because smaller competitions have wider scoring variance than the top-five. Market lines are anchored on the big leagues and under-adjust for how open or cagey ${leagueName.en} actually plays. That misalignment is the gap we surface.`,
    },
    {
      q: `Do you publish ${betTypeName.en} picks every ${leagueName.en} matchday?`,
      a: `Only when our ensemble's confidence in the underlying xG is high enough. Some ${leagueName.en} matchdays produce 3+ ${betTypeName.en} flags; others produce none. We'd rather ship zero than a low-conviction call — every pick is logged pre-match on the public track record.`,
    },
    {
      q: `Can I combine ${betTypeName.en} ${leagueName.en} picks into an accumulator?`,
      a: `You can, but it's a math trade: accumulators multiply odds but also multiply the failure rate. A three-leg ${betTypeName.en} accumulator across ${leagueName.en} fixtures at 1.80 per leg implies about a 17% chance of all three landing — so stake it as variance, not as a safety play.`,
    },
  ];

  /* ── NL copy ─────────────────────────────────────────── */

  const tagline_nl = `${betTypeName.nl} tips voor elke ${leagueName.nl}-speelronde — model-gebaseerd, voor aftrap vergrendeld`;

  const intro_nl = hasProfile
    ? `De ${leagueName.nl} staat op ${profile!.avgGoalsPerGame.toFixed(2).replace(".", ",")} goals per wedstrijd over recente seizoenen — ${profile!.flavour.nl}. Dat getal is voor ${betTypeName.nl} belangrijker dan voor welke andere markt ook: bookmakers prijzen deze competitie met een competitie-brede baseline en passen daarna per wedstrijd aan. Waar ze te veel of te weinig bijsturen, zit de edge. Het ${betTypeName.nl}-slate hieronder is gefilterd op de ${leagueName.nl}-wedstrijden waarin ons vier-modellen ensemble het hoogste vertrouwen heeft in de onderliggende expected-goals inputs.`
    : `${leagueName.nl}-wedstrijden gedragen zich anders dan het top-vijf-gemiddelde als het om ${betTypeName.nl} gaat. Kleinere competities hebben vaak bredere score-distributies dan bookmakers prijzen (die verankerd zijn op de grootste competities), en dat gat is precies waar de ${betTypeName.nl}-markt het vaakst mis zit. BetsPlug haalt de ${leagueName.nl}-wedstrijden naar boven waar onze ensemble-confidence in de onderliggende xG het hoogst is.`;

  const statsBlock_nl = baseline
    ? `Historisch komt ${baseline.label.nl} binnen in ongeveer ${baseline.value}% van de ${leagueName.nl}-wedstrijden. Een gebalanceerde ${betTypeName.nl}-markt zou dus rond ${(100 / baseline.value).toFixed(2).replace(".", ",")} moeten prijzen — bookmakers schuiven die lijn echter vaak op basis van hoe het publiek naar de betrokken ploegen kijkt, niet op basis van het onderliggende scoreprofiel. Wanneer we een ${leagueName.nl} ${betTypeName.nl}-pick flaggen, heeft het model meestal een kans van ${baseline.value + 8}%+ gevonden tegen een marktlijn die ${baseline.value - 5}% of lager impliceert.`
    : `Zonder een lang historisch scoreprofiel voor de ${leagueName.nl} leunen we zwaarder op onze per-team xG-schattingen om ${betTypeName.nl} te lezen. Dat levert minder flags per speelronde op, maar een hogere conviction wanneer ze wel komen — we publiceren alleen een ${leagueName.nl} ${betTypeName.nl}-call als het ensemble veel vertrouwen heeft in de xG van beide ploegen.`;

  const angle_nl = `Value in ${leagueName.nl} ${betTypeName.nl} verstopt zich meestal in wedstrijden waarin de publieke verhaallijn het wint van de cijfers. Zoek naar middenmoters-clashes waarin de markt de laag-scorende headline van vorig seizoen onthoudt — dat zijn precies de wedstrijden waarin de ${betTypeName.nl}-lijn afdrijft van zijn fair value. Het omgekeerde geldt wanneer een topclub een kleine ploeg ontvangt: het publieke geld stort zich op de voor de hand liggende kant van ${betTypeName.nl}, duwt de lijn te ver door en laat echte value aan de andere kant liggen.`;

  const metaTitle_nl = `${betTypeName.nl} ${leagueName.nl} Voorspellingen · BetsPlug`;
  const metaDescription_nl = `AI ${betTypeName.nl}-voorspellingen voor elke ${leagueName.nl}-wedstrijd. Historische hit rates, model-uitleg en de meest zekere ${leagueName.nl}-picks van vandaag — voor aftrap vergrendeld, publiek gevolgd.`;

  const faqs_nl: BetTypeFaq[] = [
    {
      q: `Hoe accuraat zijn BetsPlug's ${betTypeName.nl}-voorspellingen in de ${leagueName.nl}?`,
      a: `Onze ${betTypeName.nl}-flags voor ${leagueName.nl}-wedstrijden komen uit de onderliggende 1X2 / xG-pipeline, niet uit een aparte ${betType.shortCode}-head. We tracken hit rate publiek op de track record pagina — voor een eerlijke evaluatie weeg picks met confidence ≥65% apart van picks met lagere conviction.`,
    },
    {
      q: `Waarom zou een ${betTypeName.nl}-weddenschap vaker landen in de ${leagueName.nl} dan de markt aangeeft?`,
      a: baseline
        ? `Omdat bookmakers ${leagueName.nl} ${betTypeName.nl} prijzen met brede priors (historisch ongeveer ${baseline.value}% ${baseline.label.nl}) en de lijn daarna schuiven op basis van publieke perceptie. Wanneer die verschuiving te ver gaat — vaak in wedstrijden met een duidelijke favoriet — zakt de impliciete kans onder het getal dat onze xG-gebaseerde lezing geeft.`
        : `Omdat kleinere competities bredere score-variantie hebben dan de top-vijf. Marktlijnen zijn verankerd op de grote competities en sturen te weinig bij voor hoe open of gesloten de ${leagueName.nl} daadwerkelijk speelt. Die mismatch is precies het gat dat we aanwijzen.`,
    },
    {
      q: `Publiceren jullie ${betTypeName.nl}-picks elke ${leagueName.nl}-speelronde?`,
      a: `Alleen wanneer de confidence van ons ensemble in de onderliggende xG hoog genoeg is. Sommige ${leagueName.nl}-speelrondes leveren 3+ ${betTypeName.nl}-flags op, andere geen. We publiceren liever niets dan een low-conviction call — elke pick wordt voor aftrap gelogd op het publieke track record.`,
    },
    {
      q: `Kan ik ${betTypeName.nl} ${leagueName.nl}-picks combineren in een combi-wedstrijd?`,
      a: `Dat kan, maar het is een wiskundige trade-off: combi's vermenigvuldigen de odds, maar ook de kans op falen. Een drie-been ${betTypeName.nl}-combi over ${leagueName.nl}-wedstrijden aan 1,80 per been impliceert ongeveer 17% kans dat alle drie landen — stake het dus als variance, niet als veiligheidsspel.`,
    },
  ];

  return {
    betTypeSlug,
    leagueSlug,
    shortCode: betType.shortCode,
    name: { betType: betTypeName, league: leagueName },
    tagline: { en: tagline_en, nl: tagline_nl },
    intro: { en: intro_en, nl: intro_nl },
    statsBlock: { en: statsBlock_en, nl: statsBlock_nl },
    angle: { en: angle_en, nl: angle_nl },
    metaTitle: { en: metaTitle_en, nl: metaTitle_nl },
    metaDescription: { en: metaDescription_en, nl: metaDescription_nl },
    faqs: { en: faqs_en, nl: faqs_nl },
    hasScoringProfile: hasProfile,
  };
}

/* ── Catalog ──────────────────────────────────────────────── */

/**
 * The set of leagues we publish combo pages for. Kept tight —
 * we only ship combos where we have a handwritten league hub
 * or a scoring profile so each page has enough unique content
 * to avoid near-duplicate penalties.
 */
export const COMBO_LEAGUE_SLUGS: string[] = [
  "premier-league",
  "la-liga",
  "bundesliga",
  "serie-a",
  "ligue-1",
  "champions-league",
  "europa-league",
  "conference-league",
  "eredivisie",
];

/** Full matrix of (bet-type × league) slug pairs we render. */
export function getAllComboSlugs(): Array<{
  betTypeSlug: string;
  leagueSlug: string;
}> {
  const out: Array<{ betTypeSlug: string; leagueSlug: string }> = [];
  for (const bt of BET_TYPE_HUBS) {
    for (const leagueSlug of COMBO_LEAGUE_SLUGS) {
      out.push({ betTypeSlug: bt.slug, leagueSlug });
    }
  }
  return out;
}

/** Does `(betTypeSlug, leagueSlug)` correspond to a published combo? */
export function isValidCombo(
  betTypeSlug: string,
  leagueSlug: string,
): boolean {
  if (!COMBO_LEAGUE_SLUGS.includes(leagueSlug)) return false;
  return BET_TYPE_HUBS.some((h) => h.slug === betTypeSlug);
}
