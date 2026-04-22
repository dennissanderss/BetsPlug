import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, Sparkles, Target, BookOpen, Lightbulb, HelpCircle } from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { UnlockBanner } from "@/components/match-predictions/unlock-banner";
import { HexBadge } from "@/components/noct/hex-badge";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
} from "@/i18n/config";
import {
  fetchBetTypeHubSlugs,
  fetchBetTypeHubBySlug,
  fetchAllBetTypeHubs,
  type BetTypeHub,
  type BetTypeHubLocale,
} from "@/lib/sanity-data";
import { pickBetTypeHubLocale } from "@/data/bet-type-hubs";
import { getLocalizedAlternates, getServerLocale } from "@/lib/seo-helpers";
import { localizePath } from "@/i18n/routes";
import { BetTypeHubFixtures } from "./bet-type-hub-fixtures";
import { HeroMediaBg } from "@/components/ui/media-bg";
import { PAGE_IMAGES } from "@/data/page-images";
import Image from "next/image";
import { COMBO_LEAGUE_SLUGS } from "@/data/bet-type-league-combos";
import { LEAGUE_CATALOG, getLeagueName as getCatalogLeagueName } from "@/data/league-catalog";
import { getLeagueLogoPath } from "@/data/league-logos";

export const revalidate = 60;

/**
 * Bet-type hub — public SEO landing page for one betting market.
 * URL: /bet-types/[slug]
 *
 * Editorial explainer + strategy + FAQ are server-rendered for
 * SEO; the "today's most confident fixtures" widget is a client
 * island that fetches /api/fixtures/upcoming and sorts by the
 * 1X2 confidence score. Localized content is supplied for EN
 * and NL today; other locales fall back to EN.
 */

const SITE_URL = "https://betsplug.com";

type Params = { slug: string };

/* ── Static params ────────────────────────────────────────── */

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await fetchBetTypeHubSlugs();
  return slugs.map((slug) => ({ slug }));
}

/* ── Helpers ──────────────────────────────────────────────── */

function readLocaleFromCookie(): BetTypeHubLocale {
  const raw = cookies().get(LOCALE_COOKIE)?.value;
  const uiLocale = isLocale(raw) ? raw : defaultLocale;
  return pickBetTypeHubLocale(uiLocale);
}

/* ── Metadata ─────────────────────────────────────────────── */

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const hub = await fetchBetTypeHubBySlug(slug);
  if (!hub) {
    return {
      title: "Bet Type Not Found · BetsPlug",
      description:
        "The betting market page you're looking for could not be found.",
    };
  }

  const editorialLocale = readLocaleFromCookie();
  const title = hub.metaTitle[editorialLocale];
  const description = hub.metaDescription[editorialLocale];
  const alternates = getLocalizedAlternates(`/bet-types/${hub.slug}`);

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
      type: "article",
      url: alternates.canonical,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/* ── JSON-LD builder ──────────────────────────────────────── */

function buildJsonLd(hub: BetTypeHub, editorialLocale: BetTypeHubLocale) {
  const url = `${SITE_URL}/bet-types/${hub.slug}`;
  const faqs = hub.faqs[editorialLocale];

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
              name: "Bet Types",
              item: `${SITE_URL}/bet-types`,
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

export default async function BetTypeHubPage(props: {
  params: Promise<Params>;
}) {
  const { slug } = await props.params;
  const hub = await fetchBetTypeHubBySlug(slug);
  if (!hub) notFound();

  const editorialLocale = readLocaleFromCookie();
  // UI locale (8 locales) for URL building; editorialLocale is
  // EN/NL only. Keeps internal link graph on the visitor's locale
  // so a German user on /de/wett-arten/btts sees sibling links
  // like /de/wett-arten/over-2-5 instead of the EN canonical.
  const uiLocale = getServerLocale();
  const lhref = (canonical: string) => localizePath(canonical, uiLocale);
  const jsonLd = buildJsonLd(hub, editorialLocale);
  const t = (en: string, nl: string) => (editorialLocale === "nl" ? nl : en);
  const allHubs = await fetchAllBetTypeHubs();

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="mb-6 flex items-center gap-1.5 text-xs text-[#6b7280]"
            >
              <Link href={lhref("/")} className="transition hover:text-[#4ade80]">
                BetsPlug
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-[#6b7280]">
                {t("Bet Types", "Wed-types")}
              </span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-[#a3a9b8]">
                {hub.name[editorialLocale]}
              </span>
            </nav>

            <div className="text-center">
              <HexBadge variant="green" size="lg" className="mx-auto mb-4">
                <Target className="h-7 w-7" />
              </HexBadge>
              <span className="section-label mx-auto">
                <Target className="h-3 w-3" />
                {hub.shortCode}
              </span>

              <h1 className="text-heading mt-5 text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                {hub.name[editorialLocale]}
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-[#a3a9b8] sm:text-lg">
                {hub.tagline[editorialLocale]}
              </p>
            </div>

            {/* Fixtures block (client island) */}
            <BetTypeHubFixtures
              heading={hub.matchesHeading[editorialLocale]}
              sub={hub.matchesSub[editorialLocale]}
            />
          </div>
        </section>

        {/* Explainer */}
        <section className="relative py-20 md:py-28">
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 top-10 h-[360px] w-[520px] rounded-full"
            style={{ background: "hsl(var(--accent-green) / 0.08)", filter: "blur(140px)" }}
          />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <div className="card-neon card-neon-green relative overflow-hidden p-6 sm:p-8">
                <div className="relative">
                  <div className="mb-4 flex items-center gap-3">
                    <HexBadge variant="green" size="md">
                      <BookOpen className="h-5 w-5" />
                    </HexBadge>
                    <span className="section-label">
                      {t("Explainer", "Uitleg")}
                    </span>
                  </div>
                  <h2 className="text-heading text-2xl text-[#ededed] sm:text-3xl lg:text-4xl">
                    {t(
                      `What is ${hub.name.en}?`,
                      `Wat is ${hub.name.nl}?`,
                    )}
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-[#ededed]">
                    {hub.explainer[editorialLocale]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Strategy */}
        <section className="relative py-20 md:py-28">
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-10 h-[360px] w-[520px] rounded-full"
            style={{ background: "hsl(var(--accent-purple) / 0.08)", filter: "blur(140px)" }}
          />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <div className="card-neon card-neon-purple relative overflow-hidden p-6 sm:p-8">
                <div className="relative">
                  <div className="mb-4 flex items-center gap-3">
                    <HexBadge variant="purple" size="md">
                      <Lightbulb className="h-5 w-5" />
                    </HexBadge>
                    <span className="section-label">
                      {t("Strategy", "Strategie")}
                    </span>
                  </div>
                  <h2 className="text-heading text-2xl text-[#ededed] sm:text-3xl lg:text-4xl">
                    {t(
                      `${hub.name.en} strategy`,
                      `${hub.name.nl}-strategie`,
                    )}
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-[#ededed]">
                    {hub.strategy[editorialLocale]}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={lhref("/track-record")} className="btn-primary inline-flex items-center gap-2">
                      {t("See our track record", "Bekijk ons trackrecord")}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href={lhref("/match-predictions")} className="btn-glass inline-flex items-center gap-2">
                      {t("All predictions", "Alle voorspellingen")}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Unlock CTA */}
        <section className="relative py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <UnlockBanner />
          </div>
        </section>

        {/* FAQ */}
        <section className="relative py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <span className="section-label">
                <HelpCircle className="h-3 w-3" />
                FAQ
              </span>
              <h2 className="text-heading mt-4 text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                {t(
                  `${hub.name.en} FAQ`,
                  `Veelgestelde vragen over ${hub.name.nl}`,
                )}
              </h2>
              <p className="mt-3 text-base text-[#a3a9b8]">
                {t(
                  "Everything the market asks about how this bet type works.",
                  "Alles wat de markt vraagt over hoe dit wed-type werkt.",
                )}
              </p>

              <div className="mt-8 flex flex-col gap-3">
                {hub.faqs[editorialLocale].map((faq) => (
                  <details
                    key={faq.q}
                    className="glass-panel-lifted group overflow-hidden"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 text-left text-base font-semibold text-[#ededed] transition hover:text-[#4ade80]">
                      <span>{faq.q}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#6b7280] transition group-open:rotate-90" />
                    </summary>
                    <div className="px-5 pb-5 text-sm leading-relaxed text-[#a3a9b8]">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>

              {/* Related markets */}
              <div className="card-neon card-neon-blue relative mt-10 overflow-hidden p-6">
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <HexBadge variant="blue" size="sm">
                      <Sparkles className="h-4 w-4" />
                    </HexBadge>
                    <span className="section-label">
                      {t("Related markets", "Gerelateerde markten")}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {allHubs
                      .filter((other) => other.slug !== hub.slug)
                      .map((other) => (
                        <Link
                          key={other.slug}
                          href={lhref(`/bet-types/${other.slug}`)}
                          className="glass-panel group flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-[#ededed] transition hover:text-[#4ade80]"
                        >
                          <span>{other.name[editorialLocale]}</span>
                          <ArrowRight className="h-4 w-4 text-[#6b7280] transition group-hover:text-[#4ade80]" />
                        </Link>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ This market by league — longtail SEO cluster ═══
           Funnels into the /bet-types/[slug]/[league_slug] combo
           pages. Each card targets a keyword-rich query like
           "BTTS Premier League tips" or "Over 2.5 La Liga
           predictions". */}
        <section className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="mb-6 flex items-center gap-3">
            <HexBadge variant="green" size="sm" noGlow>
              <Sparkles className="h-4 w-4" />
            </HexBadge>
            <h2 className="text-heading text-2xl text-[#ededed] sm:text-3xl">
              {hub.name[editorialLocale]}{" "}
              <span className="gradient-text-green">
                {editorialLocale === "nl" ? "per competitie" : "by league"}
              </span>
            </h2>
          </div>
          <p className="mb-6 max-w-2xl text-sm text-[#a3a9b8]">
            {editorialLocale === "nl"
              ? `Hoe ${hub.name.nl} zich gedraagt in elk van onze gedekte topcompetities — met historische cijfers en marktanalyse per competitie.`
              : `How ${hub.name.en} behaves in each of our covered top competitions — with historical numbers and market analysis per league.`}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COMBO_LEAGUE_SLUGS.map((leagueSlug) => {
              const entry = LEAGUE_CATALOG.find((l) => l.slug === leagueSlug);
              if (!entry) return null;
              const lname = getCatalogLeagueName(entry, editorialLocale);
              const logo = getLeagueLogoPath(leagueSlug);
              return (
                <Link
                  key={leagueSlug}
                  href={lhref(`/bet-types/${hub.slug}/${leagueSlug}`)}
                  className="group flex items-center gap-3 rounded-xl border p-4 transition-colors hover:border-[#4ade80]/40"
                  style={{
                    borderColor: "hsl(0 0% 100% / 0.06)",
                    background: "hsl(230 16% 10% / 0.4)",
                  }}
                >
                  {logo ? (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.03] p-1">
                      <Image src={logo} alt="" width={32} height={32} className="h-full w-full object-contain" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-white/[0.03]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-[#ededed] transition-colors group-hover:text-[#4ade80]">
                      {hub.name[editorialLocale]} · {lname}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#6b7280]">
                      {editorialLocale === "nl" ? "Marktanalyse + picks" : "Market analysis + picks"}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#6b7280] transition-all group-hover:translate-x-0.5 group-hover:text-[#4ade80]" />
                </Link>
              );
            })}
          </div>
        </section>

        <BetsPlugFooter />
      </div>
    </>
  );
}
