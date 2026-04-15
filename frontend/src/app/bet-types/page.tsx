import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowRight, ChevronRight, Target } from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
} from "@/i18n/config";
import { fetchAllBetTypeHubs } from "@/lib/sanity-data";
import {
  pickBetTypeHubLocale,
  type BetTypeHubLocale,
} from "@/data/bet-type-hubs";
import { getServerLocale, getLocalizedAlternates } from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";
import { HeroMediaBg } from "@/components/ui/media-bg";
import { PAGE_IMAGES } from "@/data/page-images";

export const revalidate = 60;

/**
 * /bet-types — index page listing every bet-type hub.
 * Editorial intro + cards → each card links to the hub detail.
 * Localized EN + NL today; other locales fall back to EN.
 */

function readLocaleFromCookie(): BetTypeHubLocale {
  const raw = cookies().get(LOCALE_COOKIE)?.value;
  const uiLocale = isLocale(raw) ? raw : defaultLocale;
  return pickBetTypeHubLocale(uiLocale);
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta = PAGE_META["/bet-types"]?.[locale] ?? PAGE_META["/bet-types"].en;
  const alternates = getLocalizedAlternates("/bet-types");

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
    openGraph: {
      title: meta.ogTitle ?? meta.title,
      description: meta.ogDescription ?? meta.description,
      type: "website",
      url: alternates.canonical,
    },
  };
}

export default async function BetTypesIndexPage() {
  const editorialLocale = readLocaleFromCookie();
  const t = (en: string, nl: string) => (editorialLocale === "nl" ? nl : en);
  const hubs = await fetchAllBetTypeHubs();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-slate-900">
      <SiteNav />

      {/* Hero */}
      <section className="no-rhythm relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28 bg-[#050505]">
        <HeroMediaBg src={PAGE_IMAGES["bet-types"].hero} alt={PAGE_IMAGES["bet-types"].alt} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-slate-500"
          >
            <Link href="/" className="transition hover:text-green-600">
              BetsPlug
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600">
              {t("Bet Types", "Wed-types")}
            </span>
          </nav>

          <div className="text-center">
            <span className="section-label mx-auto">
              <Target className="h-3.5 w-3.5" />
              {t("Betting markets", "Wedmarkten")}
            </span>

            <h1 className="text-display mt-5 text-3xl text-white sm:text-4xl lg:text-5xl">
              {t("Bet Types Explained", "Wed-types Uitgelegd")}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-[#a3a3a3] sm:text-lg">
              {t(
                "Deep dives into the most popular football betting markets - how they're priced, when they offer value, and how BetsPlug's ensemble reads them.",
                "Diepgaande uitleg over de populairste wedmarkten in het voetbal - hoe ze geprijsd worden, wanneer ze value bieden en hoe het BetsPlug-ensemble ze leest.",
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Hub cards */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-[1px] bg-white/[0.08] sm:grid-cols-2">
          {hubs.map((hub) => (
            <Link
              key={hub.slug}
              href={`/bet-types/${hub.slug}`}
              className="group flex flex-col gap-3 bg-[#0a0a0a] p-6 sm:p-8 transition hover:bg-[#111]"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-700">
                  <Target className="h-3 w-3" />
                  {hub.shortCode}
                </span>
              </div>
              <h2 className="text-display text-2xl text-white transition group-hover:text-[#4ade80]">
                {hub.name[editorialLocale]}
              </h2>
              <p className="text-sm leading-relaxed text-[#a3a3a3]">
                {hub.tagline[editorialLocale]}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#4ade80]">
                {t("Read the explainer", "Lees de uitleg")}
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
        </div>
      </section>

      <BetsPlugFooter />
    </div>
  );
}
