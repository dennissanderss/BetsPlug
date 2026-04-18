/**
 * League hub skeleton generator
 * ────────────────────────────────────────────────────────────
 * Auto-builds a minimal but valid `LeagueHub` document from a
 * `LEAGUE_CATALOG` entry when no Sanity content is available.
 *
 * The goal is **never shipping a 404** for a league we advertise
 * in the nav / footer / mega-menu. Handcrafted entries in
 * `LEAGUE_HUBS` (or Sanity) always take priority; this is the
 * last-resort fallback so every catalog slug has at least a
 * rankable page.
 *
 * The templated copy is SEO-usable (mentions the league + key
 * competitors + longtail variants) without claiming anything
 * specific that would need editorial review.
 */

import type { LeagueCatalogEntry } from "./league-catalog";
import type { LeagueHub } from "./league-hubs";

type CompType = "domestic" | "uefa-cup" | "continental-cup";

/** Rough bucketing so the copy can reference the right context. */
function classify(slug: string): CompType {
  if (
    slug === "champions-league" ||
    slug === "europa-league" ||
    slug === "conference-league"
  )
    return "uefa-cup";
  if (slug === "copa-libertadores") return "continental-cup";
  return "domestic";
}

function countryFromFlag(flag: string): { en: string; nl: string } {
  const map: Record<string, { en: string; nl: string }> = {
    "🏴󠁧󠁢󠁥󠁮󠁧󠁿": { en: "England", nl: "Engeland" },
    "🏴󠁧󠁢󠁳󠁣󠁴󠁿": { en: "Scotland", nl: "Schotland" },
    "🇪🇸": { en: "Spain", nl: "Spanje" },
    "🇩🇪": { en: "Germany", nl: "Duitsland" },
    "🇮🇹": { en: "Italy", nl: "Italië" },
    "🇫🇷": { en: "France", nl: "Frankrijk" },
    "🇳🇱": { en: "Netherlands", nl: "Nederland" },
    "🇵🇹": { en: "Portugal", nl: "Portugal" },
    "🇹🇷": { en: "Turkey", nl: "Turkije" },
    "🇧🇪": { en: "Belgium", nl: "België" },
    "🇨🇭": { en: "Switzerland", nl: "Zwitserland" },
    "🇧🇷": { en: "Brazil", nl: "Brazilië" },
    "🇲🇽": { en: "Mexico", nl: "Mexico" },
    "🇺🇸": { en: "USA", nl: "Verenigde Staten" },
    "🇦🇷": { en: "Argentina", nl: "Argentinië" },
    "🇸🇦": { en: "Saudi Arabia", nl: "Saoedi-Arabië" },
    "🏆": { en: "International", nl: "Internationaal" },
  };
  return map[flag] ?? { en: "International", nl: "Internationaal" };
}

function countryCodeFromFlag(flag: string): string {
  if (flag === "🏆") return "INT";
  if (flag === "🏴󠁧󠁢󠁥󠁮󠁧󠁿") return "GB";
  if (flag === "🏴󠁧󠁢󠁳󠁣󠁴󠁿") return "GB";
  const pairs: Record<string, string> = {
    "🇪🇸": "ES",
    "🇩🇪": "DE",
    "🇮🇹": "IT",
    "🇫🇷": "FR",
    "🇳🇱": "NL",
    "🇵🇹": "PT",
    "🇹🇷": "TR",
    "🇧🇪": "BE",
    "🇨🇭": "CH",
    "🇧🇷": "BR",
    "🇲🇽": "MX",
    "🇺🇸": "US",
    "🇦🇷": "AR",
    "🇸🇦": "SA",
  };
  return pairs[flag] ?? "XX";
}

export function buildSkeletonHub(entry: LeagueCatalogEntry): LeagueHub {
  const kind = classify(entry.slug);
  const country = countryFromFlag(entry.flag);
  const code = countryCodeFromFlag(entry.flag);
  const n = entry.name;

  const ctx = {
    en:
      kind === "uefa-cup"
        ? "European cup"
        : kind === "continental-cup"
          ? "continental cup"
          : "domestic league",
    nl:
      kind === "uefa-cup"
        ? "Europese beker"
        : kind === "continental-cup"
          ? "continentale beker"
          : "nationale competitie",
  } as const;

  return {
    slug: entry.slug,
    sportSlug: "football",
    countryCode: code,
    countryFlag: entry.flag,
    name: n,
    country,
    tagline: {
      en: `Free AI predictions for every ${n.en} fixture`,
      nl: `Gratis AI-voorspellingen voor elke ${n.nl}-wedstrijd`,
    },
    intro: {
      en: `${n.en} is one of the ${ctx.en}s covered by BetsPlug. Every fixture is analysed by three models — an Elo-style team strength rating, a Poisson-style scoreline predictor and a pattern-recognition model — and blended into a single probability for home win, draw and away win. Every prediction is timestamped before kick-off and graded against the result automatically, so the track record stays public and verifiable. Three picks per gameweek are free on this page; members unlock the full slate, Kelly stakes and closing-line reports.`,
      nl: `${n.nl} is een van de ${ctx.nl}s die BetsPlug dekt. Elke wedstrijd wordt geanalyseerd door drie modellen — een Elo-achtige teamsterkte-rating, een Poisson-achtige scoreline-voorspeller en een patroonherkenner — en gecombineerd tot één kans voor thuiswinst, gelijkspel en uitwinst. Elke voorspelling wordt vóór de aftrap tijdstempeld en automatisch beoordeeld, zodat het trackrecord openbaar en verifieerbaar blijft. Drie picks per speelronde zijn hier gratis; members krijgen het volledige programma, Kelly-inzetten en closing-line rapporten.`,
    },
    metaTitle: {
      en: `${n.en} AI Predictions, Tips & Odds · BetsPlug`,
      nl: `${n.nl} AI-voorspellingen, tips & odds · BetsPlug`,
    },
    metaDescription: {
      en: `Free AI-powered ${n.en} predictions, win probabilities and confidence scores for every upcoming matchday. Built on calibrated Elo, Poisson and pattern-recognition models with a public track record.`,
      nl: `Gratis AI-voorspellingen voor ${n.nl}: winstkansen, confidence-scores en odds voor elke speelronde. Gebouwd op Elo-, Poisson- en patroonherkenningsmodellen met een openbaar trackrecord.`,
    },
    faqs: {
      en: [
        {
          q: `How accurate are your ${n.en} predictions?`,
          a: `Our model's rolling 30-day calibration on ${n.en} fixtures is published on /track-record alongside every other league. Every settled pick is graded automatically so the hit rate you see is the actual hit rate — no cherry-picking.`,
        },
        {
          q: `Do you cover every ${n.en} match?`,
          a: `Yes — every scheduled ${n.en} fixture gets a model run as soon as line-ups and odds stabilise. The three highest-edge picks per gameweek are shown free on this page; the rest are unlocked for BetsPlug members.`,
        },
        {
          q: `Which betting markets are covered?`,
          a: `The free preview covers the 1X2 (home / draw / away) market. Members also get over / under 2.5 goals, both teams to score, Asian handicap and a Kelly stake recommendation per pick.`,
        },
        {
          q: `How often are predictions updated?`,
          a: `Individual fixture predictions are recalculated whenever a lineup, injury report or significant odds shift triggers our sync task — typically every 5 minutes during the matchday window.`,
        },
        {
          q: `Is BetsPlug a bookmaker?`,
          a: `No. BetsPlug is an analytics platform — we don't accept wagers or hold customer funds. Predictions are for informational and educational purposes. Always check your local regulator and gamble responsibly.`,
        },
      ],
      nl: [
        {
          q: `Hoe accuraat zijn jullie ${n.nl}-voorspellingen?`,
          a: `De rollende 30-daagse kalibratie van ons model op ${n.nl}-wedstrijden staat op /trackrecord-resultaten naast alle andere competities. Elke afgewikkelde pick wordt automatisch beoordeeld, dus de hit rate die je ziet is de echte hit rate — geen cherry-picking.`,
        },
        {
          q: `Dekken jullie elke ${n.nl}-wedstrijd?`,
          a: `Ja — elke geplande ${n.nl}-wedstrijd krijgt een model-run zodra opstellingen en odds stabiel zijn. De drie picks met het hoogste edge per speelronde zie je hier gratis; de rest ontgrendel je als BetsPlug-member.`,
        },
        {
          q: `Welke weddenschapsmarkten dekken jullie?`,
          a: `De gratis preview dekt de 1X2-markt (thuis / gelijk / uit). Members krijgen daarnaast over / under 2.5 goals, beide teams scoren, Asian handicap en een Kelly-inzet-aanbeveling per pick.`,
        },
        {
          q: `Hoe vaak worden voorspellingen bijgewerkt?`,
          a: `Individuele wedstrijdvoorspellingen worden herberekend zodra een opstelling, blessurerapport of significante oddsverschuiving onze sync-task triggert — meestal elke 5 minuten tijdens het speelrondevenster.`,
        },
        {
          q: `Is BetsPlug een bookmaker?`,
          a: `Nee. BetsPlug is een analytics-platform — we accepteren geen voorspellingen en beheren geen klantgelden. Voorspellingen zijn voor informatieve en educatieve doeleinden. Check altijd je lokale toezichthouder en gok verantwoord.`,
        },
      ],
    },
  };
}
