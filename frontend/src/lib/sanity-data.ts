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
  allArticlesQuery,
  articleBySlugQuery,
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
  articles as hardcodedArticles,
  getArticleBySlug as hardcodedGetArticleBySlug,
  type Article,
  type ArticleBlock,
} from "@/data/articles";
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

// Re-export types so consumers import from one place
export type {
  Article,
  ArticleBlock,
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

/** Build a locale record from a Sanity locale object. */
function locRecord(obj: Record<string, unknown> | undefined): Record<string, string> {
  if (!obj) return { en: "" };
  const rec: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k !== "_type" && typeof v === "string") rec[k] = v;
  }
  return rec;
}

// ── Articles ──────────────────────────────────────────────

function transformArticle(raw: any): Article {
  return {
    slug: raw.slug?.current ?? raw.slug ?? "",
    title: raw.title ?? "",
    excerpt: raw.excerpt ?? "",
    metaTitle: raw.metaTitle ?? "",
    metaDescription: raw.metaDescription ?? "",
    sport: raw.sport ?? "football",
    author: raw.author ?? "The BetsPlug Team",
    publishedAt: raw.publishedAt ?? "",
    updatedAt: raw.updatedAt ?? undefined,
    readingMinutes: raw.readingMinutes ?? 5,
    coverGradient: raw.coverGradient ?? "",
    coverPattern: raw.coverPattern ?? undefined,
    coverImage: raw.coverImage
      ? `https://cdn.sanity.io/images/nk7ioy85/production/${raw.coverImage.asset?._ref
          ?.replace("image-", "")
          .replace("-jpg", ".jpg")
          .replace("-png", ".png")
          .replace("-webp", ".webp")}`
      : undefined,
    coverImageAlt: raw.coverImageAlt ?? undefined,
    tldr: raw.tldr ?? undefined,
    blocks: (raw.blocks ?? []).map((b: any): ArticleBlock => {
      if (b.blockType === "list") return { type: "list", items: b.items ?? [] };
      if (b.blockType === "quote")
        return { type: "quote", text: b.text ?? "", cite: b.cite ?? undefined };
      return { type: b.blockType ?? "paragraph", text: b.text ?? "" } as ArticleBlock;
    }),
  };
}

export async function fetchAllArticles(): Promise<Article[]> {
  try {
    const raw = await client.fetch(allArticlesQuery);
    if (!raw?.length) return hardcodedArticles;
    return raw.map(transformArticle);
  } catch {
    return hardcodedArticles;
  }
}

export async function fetchArticleBySlug(
  slug: string,
): Promise<Article | undefined> {
  try {
    const raw = await client.fetch(articleBySlugQuery, { slug });
    if (!raw) return hardcodedGetArticleBySlug(slug);
    return transformArticle(raw);
  } catch {
    return hardcodedGetArticleBySlug(slug);
  }
}

export async function fetchArticleSlugs(): Promise<string[]> {
  try {
    const raw: { slug: { current: string } }[] = await client.fetch(
      `*[_type == "article"]{ slug }`,
    );
    if (!raw?.length) return hardcodedArticles.map((a) => a.slug);
    return raw.map((r) => r.slug.current);
  } catch {
    return hardcodedArticles.map((a) => a.slug);
  }
}

// ── Learn Pillars ─────────────────────────────────────────

function transformLearnPillar(raw: any): LearnPillar {
  const faqs: Record<LearnPillarLocale, LearnPillarFaq[]> = { en: [], nl: [] };
  for (const f of raw.faqs ?? []) {
    faqs.en.push({ q: loc(f.question, "en"), a: loc(f.answer, "en") });
    faqs.nl.push({
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
      body: {
        en: (loc(s.body, "en") || "").split("\n\n").filter(Boolean),
        nl: (loc(s.body, "nl") || loc(s.body, "en") || "").split("\n\n").filter(Boolean),
      },
    })),
    faqs,
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
  const faqs: Record<LeagueHubLocale, LeagueHubFaq[]> = { en: [], nl: [] };
  for (const f of raw.faqs ?? []) {
    faqs.en.push({ q: loc(f.question, "en"), a: loc(f.answer, "en") });
    faqs.nl.push({
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
    faqs,
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
  try {
    const raw = await client.fetch(leagueHubBySlugQuery, { slug });
    if (!raw) return LEAGUE_HUBS.find((h) => h.slug === slug);
    return transformLeagueHub(raw);
  } catch {
    return LEAGUE_HUBS.find((h) => h.slug === slug);
  }
}

export async function fetchLeagueHubSlugs(): Promise<string[]> {
  try {
    const raw: { slug: { current: string } }[] = await client.fetch(
      `*[_type == "leagueHub"]{ slug }`,
    );
    if (!raw?.length) return LEAGUE_HUBS.map((h) => h.slug);
    return raw.map((r) => r.slug.current);
  } catch {
    return LEAGUE_HUBS.map((h) => h.slug);
  }
}

// ── Bet Type Hubs ─────────────────────────────────────────

function transformBetTypeHub(raw: any): BetTypeHub {
  const faqs: Record<BetTypeHubLocale, BetTypeHubFaq[]> = { en: [], nl: [] };
  for (const f of raw.faqs ?? []) {
    faqs.en.push({ q: loc(f.question, "en"), a: loc(f.answer, "en") });
    faqs.nl.push({
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
    faqs,
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
  articles: { slug: string; publishedAt?: string }[];
  learnPillars: string[];
  leagueHubs: string[];
  betTypeHubs: string[];
}> {
  try {
    const [articles, pillars, leagues, betTypes] = await Promise.all([
      client.fetch<any[]>(`*[_type == "article"]{ "slug": slug.current, publishedAt }`),
      client.fetch<any[]>(`*[_type == "learnPillar"]{ "slug": slug.current }`),
      client.fetch<any[]>(`*[_type == "leagueHub"]{ "slug": slug.current }`),
      client.fetch<any[]>(`*[_type == "betTypeHub"]{ "slug": slug.current }`),
    ]);

    return {
      articles: (articles ?? []).map((a) => ({ slug: a.slug, publishedAt: a.publishedAt })),
      learnPillars: (pillars ?? []).map((p) => p.slug),
      leagueHubs: (leagues ?? []).map((l) => l.slug),
      betTypeHubs: (betTypes ?? []).map((b) => b.slug),
    };
  } catch {
    return {
      articles: hardcodedArticles.map((a) => ({ slug: a.slug, publishedAt: a.publishedAt })),
      learnPillars: LEARN_PILLARS.map((p) => p.slug),
      leagueHubs: LEAGUE_HUBS.map((h) => h.slug),
      betTypeHubs: BET_TYPE_HUBS.map((h) => h.slug),
    };
  }
}
