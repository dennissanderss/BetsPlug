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
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a1220] text-slate-100">
      <SiteNav />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-10 pt-28 sm:pt-32">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-green-500/[0.12] blur-[140px]" />
        <div className="pointer-events-none absolute -right-40 -top-20 h-[420px] w-[420px] rounded-full bg-emerald-500/[0.10] blur-[140px]" />

        <div className="relative mx-auto max-w-5xl">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-slate-500"
          >
            <Link href="/" className="transition hover:text-green-300">
              BetsPlug
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-300">
              {t("Bet Types", "Wed-types")}
            </span>
          </nav>

          <div className="text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-green-300">
              <Target className="h-3.5 w-3.5" />
              {t("Betting markets", "Wedmarkten")}
            </div>

            <h1 className="mt-5 text-balance break-words text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t("Bet Types Explained", "Wed-types Uitgelegd")}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-slate-300 sm:text-lg">
              {t(
                "Deep dives into the most popular football betting markets - how they're priced, when they offer value, and how BetsPlug's ensemble reads them.",
                "Diepgaande uitleg over de populairste wedmarkten in het voetbal - hoe ze geprijsd worden, wanneer ze value bieden en hoe het BetsPlug-ensemble ze leest.",
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Hub cards */}
      <section className="relative px-4 pb-20">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
          {hubs.map((hub) => (
            <Link
              key={hub.slug}
              href={`/bet-types/${hub.slug}`}
              className="group glass-card flex flex-col gap-3 p-6 transition hover:border-green-500/40"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-300">
                  <Target className="h-3 w-3" />
                  {hub.shortCode}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white transition group-hover:text-green-300">
                {hub.name[editorialLocale]}
              </h2>
              <p className="text-sm leading-relaxed text-slate-400">
                {hub.tagline[editorialLocale]}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-green-300">
                {t("Read the explainer", "Lees de uitleg")}
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <BetsPlugFooter />
    </div>
  );
}
