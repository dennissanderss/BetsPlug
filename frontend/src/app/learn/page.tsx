import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight, GraduationCap } from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
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
            <span className="text-slate-300">{t("Learn", "Leren")}</span>
          </nav>

          <div className="text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-green-300">
              <GraduationCap className="h-3.5 w-3.5" />
              {t("Pillar guides", "Pillar gidsen")}
            </div>

            <h1 className="mt-5 text-balance break-words text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
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
      <section className="relative px-4 pb-20">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <Link
              key={pillar.slug}
              href={`/learn/${pillar.slug}`}
              className="group glass-card flex flex-col gap-3 p-6 transition hover:border-green-500/40"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-300">
                  <BookOpen className="h-3 w-3" />
                  {t("Pillar", "Pillar")}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white transition group-hover:text-green-300">
                {pillar.title[editorialLocale]}
              </h2>
              <p className="text-sm leading-relaxed text-slate-400">
                {pillar.tagline[editorialLocale]}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-green-300">
                {t("Read the guide", "Lees de gids")}
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
