import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight, GraduationCap, Sparkles } from "lucide-react";
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
import { HexBadge } from "@/components/noct/hex-badge";

type Variant = "green" | "purple" | "blue";
const CYCLE: Variant[] = ["green", "purple", "blue"];

/**
 * /learn — NOCTURNE evergreen pillar hub.
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
    <div className="relative min-h-screen overflow-x-hidden bg-background text-[#ededed]">
      <SiteNav />

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <HeroMediaBg src={PAGE_IMAGES.learn.hero} alt="" />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-10 h-[420px] w-[780px] -translate-x-1/2 rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.12)", filter: "blur(140px)" }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-1.5 text-xs text-[#6b7280]"
          >
            <Link href="/" className="transition hover:text-[#4ade80]">
              BetsPlug
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#a3a9b8]">{t("Learn", "Leren")}</span>
          </nav>

          <div className="text-center">
            <HexBadge variant="green" size="lg" className="mx-auto mb-4">
              <GraduationCap className="h-7 w-7" />
            </HexBadge>
            <span className="section-label mx-auto">
              <GraduationCap className="h-3 w-3" />
              {t("Six pillar guides · written for bettors, not mathematicians", "Zes pillar-gidsen · geschreven voor bettors, niet wiskundigen")}
            </span>

            <h1 className="text-heading mt-5 text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("Learn the math behind every", "Leer de wiskunde achter elke")}{" "}
              <span className="gradient-text-green">
                {t("AI football prediction.", "AI-voetbalvoorspelling.")}
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-[#a3a9b8] sm:text-lg">
              {t(
                "Six in-depth guides covering the ideas behind every BetsPlug prediction — value betting, expected goals, team ratings, smart staking, goal models and bankroll management. Read one a day and stop relying on tipster guesswork.",
                "Zes diepgaande gidsen over de ideeën achter elke BetsPlug-voorspelling — value betting, expected goals, teamratings, slim inzetten, doelpuntenmodellen en bankroll-management. Lees er één per dag en stop met vertrouwen op tipster-gokwerk.",
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Pillar cards */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-20 h-[360px] w-[520px] rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.08)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((pillar, i) => {
              const variant = CYCLE[i % CYCLE.length];
              return (
                <Link
                  key={pillar.slug}
                  href={`/learn/${pillar.slug}`}
                  className={`card-neon card-neon-${variant} group relative block overflow-hidden p-6 transition-transform duration-300 hover:-translate-y-1 sm:p-7`}
                >
                  <div className="relative flex flex-col gap-4">
                    <HexBadge variant={variant} size="md">
                      <BookOpen className="h-5 w-5" />
                    </HexBadge>
                    <span className="section-label">
                      {t(`Pillar ${String(i + 1).padStart(2, "0")}`, `Pillar ${String(i + 1).padStart(2, "0")}`)}
                    </span>
                    <h2 className="text-heading break-words text-2xl text-[#ededed] transition group-hover:text-[#4ade80]">
                      {pillar.title[editorialLocale]}
                    </h2>
                    <p className="text-sm leading-relaxed text-[#a3a9b8]">
                      {pillar.tagline[editorialLocale]}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#4ade80]">
                      {t("Read the guide", "Lees de gids")}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="card-neon card-neon-green halo-green relative overflow-hidden p-6 sm:p-8 md:p-16">
            <CtaMediaBg src={PAGE_IMAGES.learn.cta} alt={PAGE_IMAGES.learn.alt} pattern={PAGE_IMAGES.learn.pattern} />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-[260px] w-[260px] rounded-full"
              style={{ background: "hsl(var(--accent-green) / 0.28)", filter: "blur(80px)" }}
            />
            <div className="relative">
              <HexBadge variant="green" size="md" className="mb-5">
                <GraduationCap className="h-5 w-5" />
              </HexBadge>
              <span className="section-label">
                <Sparkles className="h-3 w-3" />
                {t("From theory to tonight's slate", "Van theorie naar vanavonds wedstrijden")}
              </span>
              <h2 className="text-heading mt-4 text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                {t(
                  "See the math run live on every",
                  "Zie de wiskunde live draaien op elke",
                )}{" "}
                <span className="gradient-text-green">
                  {t("AI football prediction.", "AI-voetbalvoorspelling.")}
                </span>
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#a3a9b8]">
                {t(
                  "Reading about betting theory is one thing — watching the AI apply it to tonight's matches is where it clicks. Start your €0,01 trial and test what you've learned against real AI football predictions.",
                  "Lezen over wedtheorie is één ding — de AI het zien toepassen op vanavonds wedstrijden is waar het klikt. Start je €0,01 proefperiode en test wat je hebt geleerd tegen echte AI-voetbalvoorspellingen.",
                )}
              </p>

              <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link href="/register" className="btn-primary inline-flex items-center gap-2">
                  {t("Claim €0,01 trial", "Claim €0,01 proefperiode")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/how-it-works" className="btn-glass inline-flex items-center gap-2">
                  {t("See how the AI works", "Zie hoe de AI werkt")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="mt-5 text-xs text-[#6b7280]">
                {t(
                  "No lock-in · Cancel in two clicks · Stripe-secured",
                  "Geen lock-in · Annuleer in twee kliks · Beveiligd door Stripe",
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      <BetsPlugFooter />
    </div>
  );
}
