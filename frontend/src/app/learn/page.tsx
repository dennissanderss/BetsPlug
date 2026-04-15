import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight, GraduationCap } from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { HeroMediaBg, CtaMediaBg } from "@/components/ui/media-bg";
import { PAGE_IMAGES } from "@/data/page-images";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
} from "@/i18n/config";
import {
  pickLearnPillarLocale,
  type LearnPillarLocale,
} from "@/data/learn-pillars";
import { fetchAllLearnPillars } from "@/lib/sanity-data";
import { getServerLocale, getLocalizedAlternates } from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";

/**
 * /learn — index page listing every evergreen learn pillar.
 * Editorial intro + cards → each card links to a long-form
 * deep-dive. Localized EN + NL today; other locales fall back
 * to EN.
 */

function readLocaleFromCookie(): LearnPillarLocale {
  const raw = cookies().get(LOCALE_COOKIE)?.value;
  const uiLocale = isLocale(raw) ? raw : defaultLocale;
  return pickLearnPillarLocale(uiLocale);
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta = PAGE_META["/learn"]?.[locale] ?? PAGE_META["/learn"].en;
  const alternates = getLocalizedAlternates("/learn");

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

export const revalidate = 60;

export default async function LearnIndexPage() {
  const editorialLocale = readLocaleFromCookie();
  const pillars = await fetchAllLearnPillars();
  const t = (en: string, nl: string) => (editorialLocale === "nl" ? nl : en);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-white">
      <SiteNav />

      {/* Hero */}
      <section className="no-rhythm relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <HeroMediaBg src={PAGE_IMAGES.learn.hero} alt="" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-slate-300"
          >
            <Link href="/" className="transition hover:text-green-400">
              BetsPlug
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white">{t("Learn", "Leren")}</span>
          </nav>

          <div className="text-center">
            <span className="section-label inline-flex items-center gap-2">
              <GraduationCap className="h-3.5 w-3.5" />
              {t("Pillar guides", "Pillar gidsen")}
            </span>

            <h1 className="text-display mt-5 text-balance break-words text-4xl text-white sm:text-5xl lg:text-6xl">
              {t("Learn the Math", "Leer de Wiskunde")}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-slate-300 sm:text-lg">
              {t(
                "Six handwritten deep-dives into the concepts that anchor BetsPlug's ensemble - value betting, expected goals, Elo, Kelly, Poisson, and bankroll management.",
                "Zes handgeschreven deep-dives in de concepten die het ensemble van BetsPlug verankeren - value betting, expected goals, Elo, Kelly, Poisson en bankroll management.",
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Pillar cards */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-[1px] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <Link
                key={pillar.slug}
                href={`/learn/${pillar.slug}`}
                className="group flex flex-col gap-3 bg-[#0a0a0a] p-6 transition hover:bg-[#0f0f0f] sm:p-8"
              >
                <div className="flex items-center gap-2">
                  <span className="section-label inline-flex items-center gap-1.5">
                    <BookOpen className="h-3 w-3" />
                    {t("Pillar", "Pillar")}
                  </span>
                </div>
                <h2 className="text-display text-2xl text-white transition group-hover:text-[#4ade80]">
                  {pillar.title[editorialLocale]}
                </h2>
                <p className="text-sm leading-relaxed text-slate-400">
                  {pillar.tagline[editorialLocale]}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#4ade80]">
                  {t("Read the guide", "Lees de gids")}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="relative overflow-hidden bg-[#4ade80] p-10 md:p-16">
            <CtaMediaBg src={PAGE_IMAGES.learn.cta} alt={PAGE_IMAGES.learn.alt} pattern={PAGE_IMAGES.learn.pattern} />
            <span className="pointer-events-none absolute left-0 top-0 z-10 h-4 w-4 border-l-2 border-t-2 border-[#050505]" />
            <span className="pointer-events-none absolute right-0 top-0 z-10 h-4 w-4 border-r-2 border-t-2 border-[#050505]" />
            <span className="pointer-events-none absolute left-0 bottom-0 z-10 h-4 w-4 border-l-2 border-b-2 border-[#050505]" />
            <span className="pointer-events-none absolute right-0 bottom-0 z-10 h-4 w-4 border-r-2 border-b-2 border-[#050505]" />

            <div className="relative">
              <span className="mb-6 inline-flex items-center gap-2 bg-[#050505] px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#4ade80]">
                <GraduationCap className="h-3 w-3" />
                {t("Start applying", "Aan de slag")}
              </span>
              <h2 className="text-display text-3xl text-[#050505] sm:text-4xl lg:text-5xl">
                {t("Put theory into practice.", "Breng theorie in de praktijk.")}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#050505]/80">
                {t(
                  "Once you understand the math, see it run live on every fixture inside BetsPlug.",
                  "Zodra je de wiskunde snapt, zie je het live draaien op elke wedstrijd in BetsPlug.",
                )}
              </p>

              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-[#050505] px-8 py-4 text-xs font-black uppercase tracking-widest text-[#4ade80] transition-colors hover:bg-[#1a1a1a]"
                >
                  {t("VIEW PREDICTIONS", "BEKIJK VOORSPELLINGEN")} →
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-2 border-b-2 border-[#050505] pb-1 text-xs font-black uppercase tracking-widest text-[#050505] transition-colors hover:border-white hover:text-white"
                >
                  {t("HOW IT WORKS", "HOE HET WERKT")} →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BetsPlugFooter />
    </div>
  );
}
