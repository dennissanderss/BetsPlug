import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, Sparkles, Target } from "lucide-react";
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
  getAllBetTypeHubSlugs,
  getBetTypeHub,
  pickBetTypeHubLocale,
  type BetTypeHub,
  type BetTypeHubLocale,
} from "@/data/bet-type-hubs";
import { BetTypeHubFixtures } from "./bet-type-hub-fixtures";

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

export function generateStaticParams(): Params[] {
  return getAllBetTypeHubSlugs().map((slug) => ({ slug }));
}

/* ── Helpers ──────────────────────────────────────────────── */

function readLocaleFromCookie(): BetTypeHubLocale {
  const raw = cookies().get(LOCALE_COOKIE)?.value;
  const uiLocale = isLocale(raw) ? raw : defaultLocale;
  return pickBetTypeHubLocale(uiLocale);
}

function languageAlternates(slug: string): Record<string, string> {
  const map: Record<string, string> = {};
  const canonical = `/bet-types/${slug}`;
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
  const { slug } = await props.params;
  const hub = getBetTypeHub(slug);
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

  return {
    title,
    description,
    alternates: {
      canonical: `/bet-types/${hub.slug}`,
      languages: languageAlternates(hub.slug),
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${SITE_URL}/bet-types/${hub.slug}`,
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
  const hub = getBetTypeHub(slug);
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

      <div className="relative min-h-screen overflow-x-hidden bg-[#0a1220] text-slate-100">
        <SiteNav />

        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-10 pt-28 sm:pt-32">
          <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-green-500/[0.12] blur-[140px]" />
          <div className="pointer-events-none absolute -right-40 -top-20 h-[420px] w-[420px] rounded-full bg-emerald-500/[0.10] blur-[140px]" />

          <div className="relative mx-auto max-w-5xl">
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-slate-500"
            >
              <Link href="/" className="transition hover:text-green-300">
                BetsPlug
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-slate-400">
                {t("Bet Types", "Wed-types")}
              </span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-slate-300">
                {hub.name[editorialLocale]}
              </span>
            </nav>

            <div className="text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-green-300">
                <Target className="h-3.5 w-3.5" />
                {hub.shortCode}
              </div>

              <h1 className="mt-5 text-balance break-words text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                {hub.name[editorialLocale]}
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-slate-300 sm:text-lg">
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
        <section className="relative px-4 pb-10">
          <div className="mx-auto max-w-3xl">
            <div className="glass-card p-6 sm:p-10">
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {t(
                  `What is ${hub.name.en}?`,
                  `Wat is ${hub.name.nl}?`,
                )}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                {hub.explainer[editorialLocale]}
              </p>
            </div>
          </div>
        </section>

        {/* Strategy */}
        <section className="relative px-4 pb-12">
          <div className="mx-auto max-w-3xl">
            <div className="glass-card p-6 sm:p-10">
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {t(
                  `${hub.name.en} strategy`,
                  `${hub.name.nl}-strategie`,
                )}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                {hub.strategy[editorialLocale]}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/track-record"
                  className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/[0.08] px-4 py-2 text-xs font-bold text-green-300 transition hover:border-green-500/50 hover:bg-green-500/[0.15]"
                >
                  {t("See our track record", "Bekijk ons trackrecord")}
                  <ArrowRight className="h-3 w-3" />
                </Link>
                <Link
                  href="/match-predictions"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-bold text-slate-300 transition hover:border-green-500/40 hover:text-green-300"
                >
                  {t("All predictions", "Alle voorspellingen")}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Unlock CTA */}
        <section className="relative px-4 pb-12">
          <div className="mx-auto max-w-5xl">
            <UnlockBanner />
          </div>
        </section>

        {/* FAQ */}
        <section className="relative px-4 pb-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {t(
                `${hub.name.en} FAQ`,
                `Veelgestelde vragen over ${hub.name.nl}`,
              )}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {t(
                "Everything the market asks about how this bet type works.",
                "Alles wat de markt vraagt over hoe dit wed-type werkt.",
              )}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              {hub.faqs[editorialLocale].map((faq) => (
                <details
                  key={faq.q}
                  className="group glass-card overflow-hidden p-0"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 text-left text-base font-bold text-white transition hover:text-green-300">
                    <span>{faq.q}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-90" />
                  </summary>
                  <div className="px-5 pb-5 text-sm leading-relaxed text-slate-300">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>

            {/* Cross-links to other bet types */}
            <div className="mt-10 glass-card p-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-green-300">
                <Sparkles className="h-3.5 w-3.5" />
                {t("Related markets", "Gerelateerde markten")}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {getAllBetTypeHubSlugs()
                  .filter((s) => s !== hub.slug)
                  .map((s) => {
                    const other = getBetTypeHub(s);
                    if (!other) return null;
                    return (
                      <Link
                        key={s}
                        href={`/bet-types/${s}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-green-500/40 hover:bg-green-500/[0.05] hover:text-green-300"
                      >
                        <span>{other.name[editorialLocale]}</span>
                        <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:text-green-300" />
                      </Link>
                    );
                  })}
              </div>
            </div>
          </div>
        </section>

        <BetsPlugFooter />
      </div>
    </>
  );
}
