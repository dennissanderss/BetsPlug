import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Sparkles,
  ChevronRight,
  BookOpen,
  HelpCircle,
  Gauge,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { UnlockBanner } from "@/components/match-predictions/unlock-banner";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
} from "@/i18n/config";
import {
  fetchLeagueHubSlugs,
  fetchLeagueHubBySlug,
  fetchAllLeagueHubs,
  type LeagueHub,
  type LeagueHubLocale,
} from "@/lib/sanity-data";
import { pickHubLocale } from "@/data/league-hubs";
import { getLeagueLogoPath } from "@/data/league-logos";
import { getLocalizedAlternates } from "@/lib/seo-helpers";

import { LeagueHubFixtures } from "./league-hub-fixtures";
import { LeagueHubTopPick } from "./league-hub-top-pick";
import { LeagueHubMethodology } from "./league-hub-methodology";
import { LeagueHubRecent } from "./league-hub-recent";
import { LeagueHubSiblings } from "./league-hub-siblings";
import { BET_TYPE_HUBS } from "@/data/bet-type-hubs";
import { COMBO_LEAGUE_SLUGS } from "@/data/bet-type-league-combos";

export const revalidate = 60;

/**
 * League hub — public SEO landing page for one competition.
 * URL: /match-predictions/[league_slug]
 *
 * Rebuilt for longtail SEO + conversion (2026 edit):
 *   - Hero with the league crest, freshness timestamp, trust strip
 *   - "Top Pick of the Gameweek" scarcity block pointing at checkout
 *   - Existing free + locked fixture grid (club logos via API)
 *   - Methodology section for E-E-A-T (targets "how AI predicts X")
 *   - Recent results strip with ✓ / ✗ for transparent track record
 *   - Unlock CTA + FAQ (FAQPage JSON-LD)
 *   - Sibling leagues internal-link hub
 *   - Enhanced JSON-LD: WebPage + BreadcrumbList + FAQPage +
 *     SportsOrganization + ItemList of SportsEvent (per fixture)
 *
 * Editorial copy (tagline, intro, FAQ, meta) comes from Sanity,
 * keyed by locale. Everything else is derived client-side from
 * the fixtures API.
 */

const SITE_URL = "https://betsplug.com";

type Params = { league_slug: string };

/* ── Static params ────────────────────────────────────────── */

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await fetchLeagueHubSlugs();
  return slugs.map((slug) => ({ league_slug: slug }));
}

/* ── Helpers ──────────────────────────────────────────────── */

function readLocaleFromCookie(): LeagueHubLocale {
  const raw = cookies().get(LOCALE_COOKIE)?.value;
  const uiLocale = isLocale(raw) ? raw : defaultLocale;
  return pickHubLocale(uiLocale);
}

function currentGameweekLabel(locale: LeagueHubLocale): string {
  // Quick-n-dirty freshness signal. Not the real gameweek but a
  // human-readable window Google can see on every crawl.
  const now = new Date();
  const weekday = now.toLocaleDateString(locale === "nl" ? "nl-NL" : "en-GB", {
    weekday: "long",
  });
  return locale === "nl" ? `vanaf ${weekday}` : `starting ${weekday}`;
}

/* ── Metadata ─────────────────────────────────────────────── */

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { league_slug } = await props.params;
  const hub = await fetchLeagueHubBySlug(league_slug);
  if (!hub) {
    return {
      title: "League Not Found · BetsPlug",
      description:
        "The league predictions page you're looking for could not be found.",
    };
  }

  const editorialLocale = readLocaleFromCookie();
  const title = hub.metaTitle[editorialLocale];
  const description = hub.metaDescription[editorialLocale];
  const alternates = getLocalizedAlternates(`/match-predictions/${hub.slug}`);

  return {
    title,
    description,
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_URL}/match-predictions/${hub.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/* ── JSON-LD builder ──────────────────────────────────────── */

function buildJsonLd(hub: LeagueHub, editorialLocale: LeagueHubLocale) {
  const url = `${SITE_URL}/match-predictions/${hub.slug}`;
  const faqs = hub.faqs[editorialLocale];
  const logo = getLeagueLogoPath(hub.slug);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: hub.metaTitle[editorialLocale],
        description: hub.metaDescription[editorialLocale],
        inLanguage: editorialLocale,
        dateModified: new Date().toISOString(),
        isPartOf: {
          "@type": "WebSite",
          "@id": `${SITE_URL}#website`,
          name: "BetsPlug",
          url: SITE_URL,
        },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "BetsPlug",
              item: SITE_URL,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Match Predictions",
              item: `${SITE_URL}/match-predictions`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: hub.name[editorialLocale],
              item: url,
            },
          ],
        },
      },
      {
        // Standalone BreadcrumbList node — some SEO crawlers only
        // detect breadcrumbs declared as a top-level @graph entity.
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "BetsPlug",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Match Predictions",
            item: `${SITE_URL}/match-predictions`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: hub.name[editorialLocale],
            item: url,
          },
        ],
      },
      {
        "@type": "SportsOrganization",
        "@id": `${url}#league`,
        name: hub.name.en,
        sport: "Soccer",
        ...(logo ? { logo: `${SITE_URL}${logo}` } : {}),
        url,
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a,
          },
        })),
      },
    ],
  };
}

/* ── Page ─────────────────────────────────────────────────── */

export default async function LeagueHubPage(props: {
  params: Promise<Params>;
}) {
  const { league_slug } = await props.params;
  const hub = await fetchLeagueHubBySlug(league_slug);
  if (!hub) notFound();

  const editorialLocale = readLocaleFromCookie();
  const jsonLd = buildJsonLd(hub, editorialLocale);
  const t = (en: string, nl: string) => (editorialLocale === "nl" ? nl : en);
  const logoPath = getLeagueLogoPath(hub.slug);

  const allHubs = await fetchAllLeagueHubs();
  const siblingList = allHubs.map((h) => ({
    slug: h.slug,
    name: h.name[editorialLocale],
    flag: h.countryFlag,
  }));

  const lastUpdated = new Date().toLocaleDateString(
    editorialLocale === "nl" ? "nl-NL" : "en-GB",
    { day: "numeric", month: "short", year: "numeric" },
  );
  const gameweekLabel = currentGameweekLabel(editorialLocale);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="relative min-h-screen overflow-x-hidden bg-background text-[#ededed]">
        <SiteNav />

        {/* Hero — league crest + H1 + trust strip */}
        <section className="relative overflow-hidden pt-28 pb-14 md:pt-36 md:pb-20">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-10 h-[460px] w-[820px] -translate-x-1/2 rounded-full"
            style={{
              background: "hsl(var(--accent-green) / 0.14)",
              filter: "blur(150px)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-40 h-[360px] w-[520px] rounded-full"
            style={{
              background: "hsl(var(--accent-purple) / 0.10)",
              filter: "blur(140px)",
            }}
          />

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="mb-6 flex items-center gap-1.5 text-xs text-[#6b7280]"
            >
              <Link href="/" className="transition hover:text-[#4ade80]">
                BetsPlug
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link
                href="/match-predictions"
                className="transition hover:text-[#4ade80]"
              >
                {t("Match Predictions", "Wedstrijdvoorspellingen")}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-[#a3a9b8]">
                {hub.name[editorialLocale]}
              </span>
            </nav>

            {/* Logo + country row */}
            <div className="flex flex-col items-center gap-4 text-center">
              {logoPath ? (
                <div className="relative">
                  <div
                    aria-hidden
                    className="absolute inset-0 -m-4 rounded-full"
                    style={{
                      background: "hsl(var(--accent-green) / 0.22)",
                      filter: "blur(40px)",
                    }}
                  />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.04] p-3 sm:h-28 sm:w-28 backdrop-blur-xl">
                    <Image
                      src={logoPath}
                      alt={`${hub.name.en} logo`}
                      width={96}
                      height={96}
                      className="object-contain drop-shadow-[0_0_24px_rgba(74,222,128,0.35)]"
                      priority
                    />
                  </div>
                </div>
              ) : (
                <HexBadge variant="green" size="xl">
                  <Sparkles className="h-9 w-9" />
                </HexBadge>
              )}

              <span className="section-label">
                <span aria-hidden="true">{hub.countryFlag}</span>
                {hub.country[editorialLocale]}
              </span>

              <h1 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                {hub.name[editorialLocale]}{" "}
                <span className="gradient-text-green">
                  {t("AI predictions", "AI-voorspellingen")}
                </span>
              </h1>

              <p className="mx-auto max-w-2xl text-balance text-base leading-relaxed text-[#a3a9b8] sm:text-lg">
                {hub.tagline[editorialLocale]}
              </p>

              {/* Freshness + trust strip */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <Pill
                  tone="default"
                  className="inline-flex items-center gap-1.5 !text-[10px]"
                >
                  <Zap className="h-3 w-3 text-[#4ade80]" />
                  {t("Updated", "Bijgewerkt")} {lastUpdated}
                </Pill>
                <Pill
                  tone="default"
                  className="inline-flex items-center gap-1.5 !text-[10px]"
                >
                  <Gauge className="h-3 w-3 text-[#4ade80]" />
                  {t("Fresh picks", "Nieuwe picks")} {gameweekLabel}
                </Pill>
                <Pill
                  tone="default"
                  className="inline-flex items-center gap-1.5 !text-[10px]"
                >
                  <ShieldCheck className="h-3 w-3 text-[#4ade80]" />
                  {t("Public track record", "Openbaar trackrecord")}
                </Pill>
              </div>
            </div>

            {/* Stats + free + locked block (client island) */}
            <LeagueHubFixtures leagueSlug={hub.slug} />
          </div>
        </section>

        {/* Top Pick of the Gameweek — high-conviction scarcity block */}
        <LeagueHubTopPick
          leagueSlug={hub.slug}
          leagueName={hub.name[editorialLocale]}
          locale={editorialLocale}
        />

        {/* Methodology — E-E-A-T + SEO copy */}
        <LeagueHubMethodology
          leagueName={hub.name[editorialLocale]}
          locale={editorialLocale}
        />

        {/* Editorial intro (Sanity) */}
        <section className="relative py-16 md:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 top-10 h-[360px] w-[520px] rounded-full"
            style={{
              background: "hsl(var(--accent-green) / 0.08)",
              filter: "blur(140px)",
            }}
          />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
            <div className="card-neon card-neon-green relative overflow-hidden p-6 sm:p-8">
              <div className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <HexBadge variant="green" size="md">
                    <BookOpen className="h-5 w-5" />
                  </HexBadge>
                  <span className="section-label">
                    {t("Model brief", "Model briefing")}
                  </span>
                </div>
                <h2 className="text-heading text-2xl text-[#ededed] sm:text-3xl">
                  {t(
                    `About our ${hub.name.en} model`,
                    `Over ons ${hub.name.nl}-model`,
                  )}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[#ededed]">
                  {hub.intro[editorialLocale]}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/track-record"
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    {t("See our track record", "Bekijk ons trackrecord")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="#methodology"
                    className="btn-glass inline-flex items-center gap-2"
                  >
                    {t("How the AI works", "Hoe de AI werkt")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent results — trust + freshness */}
        <LeagueHubRecent leagueSlug={hub.slug} locale={editorialLocale} />

        {/* Unlock CTA */}
        <section className="relative py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <UnlockBanner />
          </div>
        </section>

        {/* FAQ */}
        <section className="relative py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <span className="section-label">
              <HelpCircle className="h-3 w-3" />
              FAQ
            </span>
            <h2 className="text-heading mt-3 text-2xl text-[#ededed] sm:text-3xl lg:text-4xl">
              {t(
                `${hub.name.en} predictions FAQ`,
                `Veelgestelde vragen over ${hub.name.nl}-voorspellingen`,
              )}
            </h2>
            <p className="mt-3 text-sm text-[#a3a9b8] sm:text-base">
              {t(
                "Everything we get asked about how the model works.",
                "Alles wat we krijgen gevraagd over hoe het model werkt.",
              )}
            </p>

            <div className="mt-8 flex flex-col gap-3">
              {hub.faqs[editorialLocale].map((faq) => (
                <details
                  key={faq.q}
                  className="glass-panel-lifted group overflow-hidden"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 text-left text-sm font-semibold text-[#ededed] transition hover:text-[#4ade80] sm:text-base">
                    <span>{faq.q}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#6b7280] transition group-open:rotate-90" />
                  </summary>
                  <div className="px-5 pb-5 text-sm leading-relaxed text-[#a3a9b8]">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Sibling leagues — internal linking + club SEO hub */}
        <LeagueHubSiblings
          currentSlug={hub.slug}
          leagues={siblingList}
          locale={editorialLocale}
        />

        {/* ═══ By market — longtail combo cluster ═══
           Links to /bet-types/[slug]/[this-league] combo pages so
           visitors (and crawlers) can drill into market-specific
           analysis for this league. Only renders when the league
           is one of our covered combo leagues. */}
        {COMBO_LEAGUE_SLUGS.includes(hub.slug) && (
          <section className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6">
            <div className="mb-6 flex items-center gap-3">
              <HexBadge variant="green" size="sm" noGlow>
                <Sparkles className="h-4 w-4" />
              </HexBadge>
              <h2 className="text-heading text-2xl text-[#ededed] sm:text-3xl">
                {hub.name[editorialLocale]}{" "}
                <span className="gradient-text-green">
                  {editorialLocale === "nl" ? "marktanalyses" : "market breakdowns"}
                </span>
              </h2>
            </div>
            <p className="mb-6 max-w-2xl text-sm text-[#a3a9b8]">
              {editorialLocale === "nl"
                ? `Hoe onze AI elk van de populairste markten leest voor ${hub.name.nl}-wedstrijden.`
                : `How our AI reads each of the most popular markets for ${hub.name.en} fixtures.`}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {BET_TYPE_HUBS.map((bt) => (
                <Link
                  key={bt.slug}
                  href={`/bet-types/${bt.slug}/${hub.slug}`}
                  className="group flex items-center gap-3 rounded-xl border p-4 transition-colors hover:border-[#4ade80]/40"
                  style={{
                    borderColor: "hsl(0 0% 100% / 0.06)",
                    background: "hsl(230 16% 10% / 0.4)",
                  }}
                >
                  <span className="inline-flex h-10 min-w-[48px] items-center justify-center rounded-lg border border-[#4ade80]/20 bg-[#4ade80]/5 px-2 text-[11px] font-semibold tracking-wider text-[#4ade80]">
                    {bt.shortCode}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-[#ededed] transition-colors group-hover:text-[#4ade80]">
                      {bt.name[editorialLocale]} · {hub.name[editorialLocale]}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#6b7280]">
                      {editorialLocale === "nl" ? "Marktanalyse + picks" : "Market analysis + picks"}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#6b7280] transition-all group-hover:translate-x-0.5 group-hover:text-[#4ade80]" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <BetsPlugFooter />
      </div>
    </>
  );
}
