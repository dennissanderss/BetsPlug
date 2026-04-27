/**
 * Sanity data adapter layer
 * ────────────────────────────────────────────────────────────
 * Async functions that fetch content from Sanity and transform
 * it to match the existing TypeScript interfaces. Every function
 * falls back to the hardcoded data files if Sanity is unreachable.
 *
 * ISR: pages importing these should set `revalidate = 60`.
 */
import { client } from "../../sanity/lib/client";
import {
  allLearnPillarsQuery,
  learnPillarBySlugQuery,
  allLeagueHubsQuery,
  leagueHubBySlugQuery,
  allBetTypeHubsQuery,
  betTypeHubBySlugQuery,
  allTestimonialsQuery,
  legalPageByTypeQuery,
  pageMetaByKeyQuery,
} from "../../sanity/lib/queries";

// Fallback imports
import {
  LEARN_PILLARS,
  type LearnPillar,
  type LearnPillarLocale,
  type LearnPillarSection,
  type LearnPillarFaq,
} from "@/data/learn-pillars";
import {
  LEAGUE_HUBS,
  type LeagueHub,
  type LeagueHubLocale,
  type LeagueHubFaq,
} from "@/data/league-hubs";
import {
  BET_TYPE_HUBS,
  type BetTypeHub,
  type BetTypeHubLocale,
  type BetTypeHubFaq,
} from "@/data/bet-type-hubs";
import { PAGE_META, type PageMeta } from "@/data/page-meta";
import type { Locale } from "@/i18n/config";
import { expandArrayLocales } from "@/i18n/expand";

// Re-export types so consumers import from one place
export type {
  LearnPillar,
  LearnPillarLocale,
  LearnPillarSection,
  LearnPillarFaq,
  LeagueHub,
  LeagueHubLocale,
  LeagueHubFaq,
  BetTypeHub,
  BetTypeHubLocale,
  BetTypeHubFaq,
  PageMeta,
};

// ── Transform helpers ─────────────────────────────────────

/** Extract a locale value from a Sanity localeString/localeText object. */
function loc(obj: Record<string, unknown> | undefined, locale: string): string {
  if (!obj) return "";
  return (obj[locale] as string) ?? (obj.en as string) ?? "";
}

/**
 * Build a locale record from a Sanity locale object. Every locale
 * in the app (16 after Phase 2 rollout) is guaranteed to resolve
 * to a non-empty string via EN fallback, so components can do
 * `hub.name[locale]` without a missing-key guard. Until a
 * `translate-sanity` run fills the new locales, `/ru` etc. render
 * the EN copy — which is hidden from Google via middleware noindex
 * but still visually consistent for the visitor.
 */
function locRecord(
  obj: Record<string, unknown> | undefined,
): Record<string, string> {
  const source = obj ?? {};
  // 1) collect every string value under any locale key
  const direct: Record<string, string> = {};
  for (const [k, v] of Object.entries(source)) {
    if (k !== "_type" && typeof v === "string") direct[k] = v;
  }
  // 2) EN fallback — first non-empty wins: en → nl → any → ""
  const fallback =
    direct.en ||
    direct.nl ||
    Object.values(direct).find((v) => v.length > 0) ||
    "";
  // 3) emit all 16 locales, filling absent/empty with the fallback
  const rec: Record<string, string> = {};
  for (const l of SANITY_LOCALES) {
    const v = direct[l];
    rec[l] = v && v.length > 0 ? v : fallback;
  }
  return rec;
}

// Phase 2 top-16 locale set. Keep aligned with `src/i18n/config.ts`.
const SANITY_LOCALES = [
  "en", "nl", "de", "fr", "es", "it", "sw", "id",
  "pt", "tr", "pl", "ro", "ru", "el", "da", "sv",
] as const;

// ── Articles: removed 2026-04-27 (blog discontinued).
//    All /articles* URLs 301 → /learn via next.config.js redirects.

// ── Learn Pillars ─────────────────────────────────────────

function transformLearnPillar(raw: any): LearnPillar {
  const faqsSeed: Partial<Record<string, LearnPillarFaq[]>> = {
    en: [],
    nl: [],
  };
  for (const f of raw.faqs ?? []) {
    faqsSeed.en!.push({ q: loc(f.question, "en"), a: loc(f.answer, "en") });
    faqsSeed.nl!.push({
      q: loc(f.question, "nl") || loc(f.question, "en"),
      a: loc(f.answer, "nl") || loc(f.answer, "en"),
    });
  }

  return {
    slug: raw.slug?.current ?? "",
    title: locRecord(raw.title) as Record<LearnPillarLocale, string>,
    tagline: locRecord(raw.tagline) as Record<LearnPillarLocale, string>,
    metaTitle: locRecord(raw.metaTitle) as Record<LearnPillarLocale, string>,
    metaDescription: locRecord(raw.metaDescription) as Record<LearnPillarLocale, string>,
    intro: locRecord(raw.intro) as Record<LearnPillarLocale, string>,
    sections: (raw.sections ?? []).map((s: any): LearnPillarSection => ({
      heading: locRecord(s.heading) as Record<LearnPillarLocale, string>,
      body: expandArrayLocales({
        en: (loc(s.body, "en") || "").split("\n\n").filter(Boolean),
        nl: (loc(s.body, "nl") || loc(s.body, "en") || "").split("\n\n").filter(Boolean),
      }),
    })),
    faqs: expandArrayLocales(faqsSeed),
    related: (raw.related ?? []).map((r: any) => r.slug?.current ?? r._ref?.replace("learnPillar-", "") ?? ""),
  };
}

export async function fetchAllLearnPillars(): Promise<LearnPillar[]> {
  try {
    // Need full data for index page
    const raw = await client.fetch(
      `*[_type == "learnPillar"] | order(title.en asc) {
        _id, title, slug, tagline, metaTitle, metaDescription,
        intro, sections, faqs, related[]->{ slug }
      }`,
    );
    if (!raw?.length) return LEARN_PILLARS;
    return raw.map(transformLearnPillar);
  } catch {
    return LEARN_PILLARS;
  }
}

export async function fetchLearnPillarBySlug(
  slug: string,
): Promise<LearnPillar | undefined> {
  try {
    const raw = await client.fetch(learnPillarBySlugQuery, { slug });
    if (!raw) return LEARN_PILLARS.find((p) => p.slug === slug);
    return transformLearnPillar(raw);
  } catch {
    return LEARN_PILLARS.find((p) => p.slug === slug);
  }
}

export async function fetchLearnPillarSlugs(): Promise<string[]> {
  try {
    const raw: { slug: { current: string } }[] = await client.fetch(
      `*[_type == "learnPillar"]{ slug }`,
    );
    if (!raw?.length) return LEARN_PILLARS.map((p) => p.slug);
    return raw.map((r) => r.slug.current);
  } catch {
    return LEARN_PILLARS.map((p) => p.slug);
  }
}

// ── League Hubs ───────────────────────────────────────────

function transformLeagueHub(raw: any): LeagueHub {
  const faqsSeed: Partial<Record<string, LeagueHubFaq[]>> = { en: [], nl: [] };
  for (const f of raw.faqs ?? []) {
    faqsSeed.en!.push({ q: loc(f.question, "en"), a: loc(f.answer, "en") });
    faqsSeed.nl!.push({
      q: loc(f.question, "nl") || loc(f.question, "en"),
      a: loc(f.answer, "nl") || loc(f.answer, "en"),
    });
  }

  return {
    slug: raw.slug?.current ?? "",
    sportSlug: "football",
    countryCode: raw.countryCode ?? "",
    countryFlag: raw.countryFlag ?? "",
    name: locRecord(raw.name) as Record<LeagueHubLocale, string>,
    country: locRecord(raw.country) as Record<LeagueHubLocale, string>,
    tagline: locRecord(raw.tagline) as Record<LeagueHubLocale, string>,
    intro: locRecord(raw.intro) as Record<LeagueHubLocale, string>,
    metaTitle: locRecord(raw.metaTitle) as Record<LeagueHubLocale, string>,
    metaDescription: locRecord(raw.metaDescription) as Record<LeagueHubLocale, string>,
    faqs: expandArrayLocales(faqsSeed),
  };
}

export async function fetchAllLeagueHubs(): Promise<LeagueHub[]> {
  try {
    const raw = await client.fetch(
      `*[_type == "leagueHub"] | order(name.en asc) {
        _id, name, slug, sportSlug, countryCode, countryFlag,
        country, tagline, intro, metaTitle, metaDescription, faqs
      }`,
    );
    if (!raw?.length) return LEAGUE_HUBS;
    return raw.map(transformLeagueHub);
  } catch {
    return LEAGUE_HUBS;
  }
}

export async function fetchLeagueHubBySlug(
  slug: string,
): Promise<LeagueHub | undefined> {
  // 1. Sanity first — richest editorial content.
  try {
    const raw = await client.fetch(leagueHubBySlugQuery, { slug });
    if (raw) return transformLeagueHub(raw);
  } catch {
    /* fall through to fallbacks */
  }
  // 2. Handcrafted LEAGUE_HUBS (src/data/league-hubs.ts) — the
  //    pre-Sanity originals for leagues we invested editorial time in.
  const handcrafted = LEAGUE_HUBS.find((h) => h.slug === slug);
  if (handcrafted) return handcrafted;

  // 3. Auto-generated skeleton from the shared catalog. Guarantees
  //    every league we advertise in the nav / footer / mega-menu
  //    renders a valid page — no more 404s when we add a new league
  //    to the catalog before it has Sanity content.
  const { ALL_LEAGUES } = await import("@/data/league-catalog");
  const { buildSkeletonHub } = await import("@/data/league-hub-skeleton");
  const entry = ALL_LEAGUES.find((l) => l.slug === slug);
  if (entry) return buildSkeletonHub(entry);

  return undefined;
}

export async function fetchLeagueHubSlugs(): Promise<string[]> {
  // Start with the static catalog so every league we advertise is
  // always returned — Sanity / LEAGUE_HUBS only ADD to the set.
  const { ALL_LEAGUES } = await import("@/data/league-catalog");
  const out = new Set<string>();
  ALL_LEAGUES.forEach((l) => out.add(l.slug));
  LEAGUE_HUBS.forEach((h) => out.add(h.slug));

  try {
    const raw: { slug: { current: string } }[] = await client.fetch(
      `*[_type == "leagueHub"]{ slug }`,
    );
    (raw ?? []).forEach((r) => out.add(r.slug.current));
  } catch {
    /* ignore — fallbacks cover us */
  }

  return Array.from(out);
}

// ── Bet Type Hubs ─────────────────────────────────────────

function transformBetTypeHub(raw: any): BetTypeHub {
  const faqsSeed: Partial<Record<string, BetTypeHubFaq[]>> = {
    en: [],
    nl: [],
  };
  for (const f of raw.faqs ?? []) {
    faqsSeed.en!.push({ q: loc(f.question, "en"), a: loc(f.answer, "en") });
    faqsSeed.nl!.push({
      q: loc(f.question, "nl") || loc(f.question, "en"),
      a: loc(f.answer, "nl") || loc(f.answer, "en"),
    });
  }

  return {
    slug: raw.slug?.current ?? "",
    name: locRecord(raw.name) as Record<BetTypeHubLocale, string>,
    shortCode: raw.shortCode ?? "",
    tagline: locRecord(raw.tagline) as Record<BetTypeHubLocale, string>,
    explainer: locRecord(raw.explainer) as Record<BetTypeHubLocale, string>,
    strategy: locRecord(raw.strategy) as Record<BetTypeHubLocale, string>,
    matchesHeading: locRecord(raw.matchesHeading) as Record<BetTypeHubLocale, string>,
    matchesSub: locRecord(raw.matchesSub) as Record<BetTypeHubLocale, string>,
    metaTitle: locRecord(raw.metaTitle) as Record<BetTypeHubLocale, string>,
    metaDescription: locRecord(raw.metaDescription) as Record<BetTypeHubLocale, string>,
    faqs: expandArrayLocales(faqsSeed),
  };
}

export async function fetchAllBetTypeHubs(): Promise<BetTypeHub[]> {
  try {
    const raw = await client.fetch(
      `*[_type == "betTypeHub"] | order(name.en asc) {
        _id, name, slug, shortCode, tagline, explainer, strategy,
        matchesHeading, matchesSub, metaTitle, metaDescription, faqs
      }`,
    );
    if (!raw?.length) return BET_TYPE_HUBS;
    return raw.map(transformBetTypeHub);
  } catch {
    return BET_TYPE_HUBS;
  }
}

export async function fetchBetTypeHubBySlug(
  slug: string,
): Promise<BetTypeHub | undefined> {
  try {
    const raw = await client.fetch(betTypeHubBySlugQuery, { slug });
    if (!raw) return BET_TYPE_HUBS.find((h) => h.slug === slug);
    return transformBetTypeHub(raw);
  } catch {
    return BET_TYPE_HUBS.find((h) => h.slug === slug);
  }
}

export async function fetchBetTypeHubSlugs(): Promise<string[]> {
  try {
    const raw: { slug: { current: string } }[] = await client.fetch(
      `*[_type == "betTypeHub"]{ slug }`,
    );
    if (!raw?.length) return BET_TYPE_HUBS.map((h) => h.slug);
    return raw.map((r) => r.slug.current);
  } catch {
    return BET_TYPE_HUBS.map((h) => h.slug);
  }
}

// ── Testimonials ──────────────────────────────────────────

export interface SanityTestimonial {
  name: string;
  role: string;
  text: string;
  imageUrl: string;
}

export async function fetchAllTestimonials(): Promise<SanityTestimonial[]> {
  try {
    const raw: any[] = await client.fetch(allTestimonialsQuery);
    if (!raw?.length) return [];
    return raw.map((t) => ({
      name: t.name ?? "",
      role: t.role ?? "",
      text: t.text ?? "",
      imageUrl: t.image?.asset?._ref
        ? `https://cdn.sanity.io/images/nk7ioy85/production/${t.image.asset._ref
            .replace("image-", "")
            .replace("-jpg", ".jpg")
            .replace("-png", ".png")
            .replace("-webp", ".webp")}`
        : "",
    }));
  } catch {
    return [];
  }
}

// ── Page Meta ─────────────────────────────────────────────

export async function fetchPageMeta(
  pageKey: string,
  locale: Locale | string,
): Promise<PageMeta> {
  const fallback =
    PAGE_META[pageKey]?.[locale as Locale] ?? PAGE_META[pageKey]?.en;

  try {
    const raw = await client.fetch(pageMetaByKeyQuery, { pageKey });
    if (!raw) return fallback ?? { title: "", description: "" };

    return {
      title: loc(raw.title, locale) || fallback?.title || "",
      description: loc(raw.description, locale) || fallback?.description || "",
      ogTitle: loc(raw.ogTitle, locale) || fallback?.ogTitle,
      ogDescription: loc(raw.ogDescription, locale) || fallback?.ogDescription,
    };
  } catch {
    return fallback ?? { title: "", description: "" };
  }
}

// ── Page Singletons ───────────────────────────────────────

/** Generic singleton fetcher — returns the raw document or null. */
async function fetchSingleton<T = any>(type: string): Promise<T | null> {
  try {
    const raw = await client.fetch<T | null>(`*[_type == "${type}"][0]`);
    return raw ?? null;
  } catch {
    return null;
  }
}

export async function fetchHomepage() { return fetchSingleton("homepage"); }
export async function fetchPricingConfig() { return fetchSingleton("pricingConfig"); }
export async function fetchAboutPage() { return fetchSingleton("aboutPage"); }
export async function fetchThankYouPage() { return fetchSingleton("thankYouPage"); }
export async function fetchHowItWorksPage() { return fetchSingleton("howItWorksPage"); }
export async function fetchContactPage() { return fetchSingleton("contactPage"); }
export async function fetchB2bPage() { return fetchSingleton("b2bPage"); }
export async function fetchWelcomePage() { return fetchSingleton("welcomePage"); }
export async function fetchCheckoutPage() { return fetchSingleton("checkoutPage"); }
export async function fetchTrackRecordPage() { return fetchSingleton("trackRecordPage"); }

/** Helper: get a locale value from a Sanity locale field, with i18n key fallback. */
export function getLocaleValue(
  field: Record<string, unknown> | undefined,
  locale: string,
): string {
  if (!field) return "";
  return (field[locale] as string) ?? (field.en as string) ?? "";
}

// ── Sitemap helpers ───────────────────────────────────────

export async function fetchAllSlugsForSitemap(): Promise<{
  learnPillars: string[];
  leagueHubs: string[];
  betTypeHubs: string[];
}> {
  // Leagues / bet-types / learn pillars: emit the UNION of static
  // catalogs + Sanity so the sitemap covers every URL the route
  // handlers actually serve.
  const { ALL_LEAGUES } = await import("@/data/league-catalog");
  const leagueSlugs = new Set<string>();
  ALL_LEAGUES.forEach((l) => leagueSlugs.add(l.slug));
  LEAGUE_HUBS.forEach((h) => leagueSlugs.add(h.slug));

  const betTypeSlugs = new Set<string>();
  BET_TYPE_HUBS.forEach((h) => betTypeSlugs.add(h.slug));

  const pillarSlugs = new Set<string>();
  LEARN_PILLARS.forEach((p) => pillarSlugs.add(p.slug));

  try {
    const [cmsPillars, cmsLeagues, cmsBetTypes] = await Promise.all([
      client.fetch<any[]>(`*[_type == "learnPillar"]{ "slug": slug.current }`),
      client.fetch<any[]>(`*[_type == "leagueHub"]{ "slug": slug.current }`),
      client.fetch<any[]>(`*[_type == "betTypeHub"]{ "slug": slug.current }`),
    ]);

    (cmsPillars ?? []).forEach((p) => pillarSlugs.add(p.slug));
    (cmsLeagues ?? []).forEach((l) => leagueSlugs.add(l.slug));
    (cmsBetTypes ?? []).forEach((b) => betTypeSlugs.add(b.slug));
  } catch {
    // Static fallbacks already populated above.
  }

  return {
    learnPillars: Array.from(pillarSlugs),
    leagueHubs: Array.from(leagueSlugs),
    betTypeHubs: Array.from(betTypeSlugs),
  };
}
