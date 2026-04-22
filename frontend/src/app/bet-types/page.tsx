import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowRight, ChevronRight, Sparkles, Target } from "lucide-react";
import { CtaMediaBg } from "@/components/ui/media-bg";
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
import { localizePath } from "@/i18n/routes";
import { PAGE_META } from "@/data/page-meta";
import { HeroMediaBg } from "@/components/ui/media-bg";

import { PAGE_IMAGES } from "@/data/page-images";
import { HexBadge } from "@/components/noct/hex-badge";

export const revalidate = 60;

type Variant = "green" | "purple" | "blue";
const CYCLE: Variant[] = ["green", "purple", "blue"];

/**
 * /bet-types — NOCTURNE hub index.
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
  // UI locale drives URL localization so non-EN/NL visitors see
  // same-locale internal links instead of being redirected back
  // to the EN canonical via 308.
  const uiLocale = getServerLocale();
  const lhref = (canonical: string) => localizePath(canonical, uiLocale);
  const t = (en: string, nl: string) => (editorialLocale === "nl" ? nl : en);
  const hubs = await fetchAllBetTypeHubs();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-[#ededed]">
      <SiteNav />

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <HeroMediaBg src={PAGE_IMAGES["bet-types"].hero} alt={PAGE_IMAGES["bet-types"].alt} />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-10 h-[420px] w-[780px] -translate-x-1/2 rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.12)", filter: "blur(140px)" }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-1.5 text-xs text-[#6b7280]"
          >
            <Link href={lhref("/")} className="transition hover:text-[#4ade80]">
              BetsPlug
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#a3a9b8]">
              {t("Bet Types", "Wed-types")}
            </span>
          </nav>

          <div className="text-center">
            <HexBadge variant="green" size="lg" className="mx-auto mb-4">
              <Target className="h-7 w-7" />
            </HexBadge>
            <span className="section-label mx-auto">
              <Target className="h-3 w-3" />
              {t(
                "Every market, scored by the same AI football prediction engine",
                "Elke markt, gescoord door dezelfde AI-voetbalvoorspellingsengine",
              )}
            </span>

            <h1 className="text-heading mt-5 text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("Bet types decoded by", "Wed-types ontcijferd door")}{" "}
              <span className="gradient-text-green">
                {t("AI football predictions.", "AI-voetbalvoorspellingen.")}
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-[#a3a9b8] sm:text-lg">
              {t(
                "1X2, Over/Under, Both Teams To Score, Asian Handicap, Double Chance — each market works differently. Our guides show exactly how BetsPlug's AI analyses them, when they hide real value, and the tipster traps to avoid.",
                "1X2, Over/Under, Both Teams To Score, Asian Handicap, Double Chance — elke markt werkt anders. Onze gidsen laten zien hoe de AI van BetsPlug ze analyseert, wanneer ze echte value bieden en welke tipster-valkuilen je moet vermijden.",
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Hub cards */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-20 h-[360px] w-[520px] rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.08)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {hubs.map((hub, i) => {
              const variant = CYCLE[i % CYCLE.length];
              return (
                <Link
                  key={hub.slug}
                  href={lhref(`/bet-types/${hub.slug}`)}
                  className={`card-neon card-neon-${variant} group relative block overflow-hidden p-6 transition-transform duration-300 hover:-translate-y-1 sm:p-7`}
                >
                  <div className="relative flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <HexBadge variant={variant} size="md">
                        <Target className="h-5 w-5" />
                      </HexBadge>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6b7280]">
                        {hub.shortCode}
                      </span>
                    </div>
                    <h2 className="text-heading break-words text-2xl text-[#ededed] transition group-hover:text-[#4ade80]">
                      {hub.name[editorialLocale]}
                    </h2>
                    <p className="text-sm leading-relaxed text-[#a3a9b8]">
                      {hub.tagline[editorialLocale]}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#4ade80]">
                      {t("Read the explainer", "Lees de uitleg")}
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
            <CtaMediaBg src={PAGE_IMAGES["bet-types"].cta} alt={PAGE_IMAGES["bet-types"].alt} pattern={PAGE_IMAGES["bet-types"].pattern} />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-[260px] w-[260px] rounded-full"
              style={{ background: "hsl(var(--accent-green) / 0.28)", filter: "blur(80px)" }}
            />
            <div className="relative">
              <HexBadge variant="green" size="md" className="mb-5">
                <Target className="h-5 w-5" />
              </HexBadge>
              <span className="section-label">
                <Sparkles className="h-3 w-3" />
                {t("Pick a market · see the model", "Kies een markt · zie het model")}
              </span>
              <h2 className="text-heading mt-4 text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                {t("Every market, priced by our", "Elke markt, geprijsd door onze")}{" "}
                <span className="gradient-text-green">
                  {t("AI football predictions.", "AI-voetbalvoorspellingen.")}
                </span>
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#a3a9b8]">
                {t(
                  "Open any match in BetsPlug and compare the bookmaker odds against our AI prediction. If there's value, you'll see it flagged — across 30 leagues, updated every hour.",
                  "Open een wedstrijd in BetsPlug en vergelijk de bookmaker-odds met onze AI-voorspelling. Als er value is, zie je het direct — over 30 competities, elk uur bijgewerkt.",
                )}
              </p>

              <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link href={lhref("/register")} className="btn-primary inline-flex items-center gap-2">
                  {t("Claim €0,01 trial", "Claim €0,01 proefperiode")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={lhref("/match-predictions")} className="btn-glass inline-flex items-center gap-2">
                  {t("Browse today's predictions", "Bekijk vandaag's voorspellingen")}
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
