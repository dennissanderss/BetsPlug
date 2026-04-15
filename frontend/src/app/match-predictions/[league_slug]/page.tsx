import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles, ChevronRight } from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { UnlockBanner } from "@/components/match-predictions/unlock-banner";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  locales,
  localeMeta,
} from "@/i18n/config";
import { localizePath } from "@/i18n/routes";
import {
  fetchLeagueHubSlugs,
  fetchLeagueHubBySlug,
  type LeagueHub,
  type LeagueHubLocale,
} from "@/lib/sanity-data";
import { pickHubLocale } from "@/data/league-hubs";
import { LeagueHubFixtures } from "./league-hub-fixtures";
import { HeroMediaBg, CtaMediaBg } from "@/components/ui/media-bg";
import { PAGE_IMAGES } from "@/data/page-images";

export const revalidate = 60;

/**
 * League hub — public SEO landing page for one competition.
 * URL: /match-predictions/[league_slug]
 *
 * Editorial intro + FAQ are server-rendered for SEO; the fixtures
 * widget is a client island that fetches /api/fixtures/upcoming
 * filtered by league_slug. Localized content is supplied for EN +
 * NL today; other locales fall back to EN until handwritten
 * translations land.
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

function languageAlternates(slug: string): Record<string, string> {
  const map: Record<string, string> = {};
  const canonical = `/match-predictions/${slug}`;
  for (const l of locales) {
    const tag = localeMeta[l].hreflang;
    map[tag] = `${SITE_URL}${localizePath(canonical, l)}`;
  }
  map["x-default"] = `${SITE_URL}${localizePath(canonical, defaultLocale)}`;
  return map;
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
      description: "The league predictions page you're looking for could not be found.",
    };
  }

  const editorialLocale = readLocaleFromCookie();
  const title = hub.metaTitle[editorialLocale];
  const description = hub.metaDescription[editorialLocale];

  return {
    title,
    description,
    alternates: {
      canonical: `/match-predictions/${hub.slug}`,
      languages: languageAlternates(hub.slug),
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

  // SportsEvent series + FAQPage emitted as a graph so a single
  // <script> tag covers both schemas.
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

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="relative min-h-screen overflow-x-hidden bg-background text-slate-900">
        <SiteNav />

        {/* Hero */}
        <section className="no-rhythm relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28 bg-[#050505]">
          <HeroMediaBg src={PAGE_IMAGES["match-predictions"].hero} alt={PAGE_IMAGES["match-predictions"].alt} />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-slate-500"
            >
              <Link
                href="/"
                className="transition hover:text-green-600"
              >
                BetsPlug
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link
                href="/match-predictions"
                className="transition hover:text-green-600"
              >
                {t("Match Predictions", "Wedstrijd voorspellingen")}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-slate-600">{hub.name[editorialLocale]}</span>
            </nav>

            <div className="text-center">
              <span className="section-label mx-auto">
                <Sparkles className="h-3.5 w-3.5" />
                <span aria-hidden="true">{hub.countryFlag}</span>
                {hub.country[editorialLocale]}
              </span>

              <h1 className="text-display mt-5 text-3xl text-white sm:text-4xl lg:text-5xl">
                {hub.name[editorialLocale]}{" "}
                {t("AI Predictions", "AI voorspellingen")}
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-[#a3a3a3] sm:text-lg">
                {hub.tagline[editorialLocale]}
              </p>
            </div>

            {/* Stats + free + locked block (client island) */}
            <LeagueHubFixtures leagueSlug={hub.slug} />
          </div>
        </section>

        {/* Editorial intro */}
        <section className="relative py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <div className="bg-[#0a0a0a] border border-white/[0.08] p-6 sm:p-8">
                <h2 className="text-display text-3xl text-white sm:text-4xl lg:text-5xl">
                  {t(
                    `About our ${hub.name.en} model`,
                    `Over ons ${hub.name.nl}-model`,
                  )}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[#a3a3a3]">
                  {hub.intro[editorialLocale]}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/track-record" className="btn-lime">
                    {t("See our track record", "Bekijk ons trackrecord")}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  <Link href="/match-predictions" className="btn-outline">
                    {t("All leagues", "Alle competities")}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
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
            <h2 className="text-display text-3xl text-white sm:text-4xl lg:text-5xl">
              {t(
                `${hub.name.en} predictions FAQ`,
                `Veelgestelde vragen over ${hub.name.nl}-voorspellingen`,
              )}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t(
                "Everything we get asked about how the model works.",
                "Alles wat we krijgen gevraagd over hoe het model werkt.",
              )}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              {hub.faqs[editorialLocale].map((faq) => (
                <details
                  key={faq.q}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 text-left text-base font-bold text-slate-900 transition hover:text-green-600">
                    <span>{faq.q}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-90" />
                  </summary>
                  <div className="px-5 pb-5 text-sm leading-relaxed text-slate-600">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
            </div>
          </div>
        </section>

        <BetsPlugFooter />
      </div>
    </>
  );
}
