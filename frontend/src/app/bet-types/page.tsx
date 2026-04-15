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
            <Link href="/" className="transition hover:text-[#4ade80]">
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
              {t("Betting markets", "Wedmarkten")}
            </span>

            <h1 className="text-heading mt-5 text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("Bet Types", "Wed-types")}{" "}
              <span className="gradient-text-green">
                {t("Explained", "Uitgelegd")}
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-[#a3a9b8] sm:text-lg">
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
                  href={`/bet-types/${hub.slug}`}
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
                    <h2 className="text-heading text-2xl text-[#ededed] transition group-hover:text-[#4ade80]">
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

      <BetsPlugFooter />
    </div>
  );
}
