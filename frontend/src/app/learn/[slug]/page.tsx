import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Sparkles,
} from "lucide-react";
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
  getAllLearnPillarSlugs,
  getLearnPillar,
  pickLearnPillarLocale,
  type LearnPillar,
  type LearnPillarLocale,
} from "@/data/learn-pillars";

/**
 * Learn pillar — long-form evergreen explainer.
 * URL: /learn/[slug]
 *
 * Each pillar is ~1200–1500 words of handwritten content covering
 * one foundational concept (value betting, xG, Elo, Kelly, Poisson,
 * bankroll). These are the internal-link targets for the Phase 3
 * automated blog feed: every blog post should link to at least one
 * pillar to concentrate PageRank on these evergreen URLs.
 *
 * Server-rendered for SEO with WebPage + BreadcrumbList + FAQPage
 * JSON-LD. Localized EN + NL today; other locales fall back to EN.
 */

const SITE_URL = "https://betsplug.com";

type Params = { slug: string };

/* ── Static params ────────────────────────────────────────── */

export function generateStaticParams(): Params[] {
  return getAllLearnPillarSlugs().map((slug) => ({ slug }));
}

/* ── Helpers ──────────────────────────────────────────────── */

function readLocaleFromCookie(): LearnPillarLocale {
  const raw = cookies().get(LOCALE_COOKIE)?.value;
  const uiLocale = isLocale(raw) ? raw : defaultLocale;
  return pickLearnPillarLocale(uiLocale);
}

function languageAlternates(slug: string): Record<string, string> {
  const map: Record<string, string> = {};
  const canonical = `/learn/${slug}`;
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
  const pillar = getLearnPillar(slug);
  if (!pillar) {
    return {
      title: "Topic not found | BetsPlug",
      description: "The learn topic you're looking for could not be found.",
    };
  }

  const editorialLocale = readLocaleFromCookie();
  const title = pillar.metaTitle[editorialLocale];
  const description = pillar.metaDescription[editorialLocale];

  return {
    title,
    description,
    alternates: {
      canonical: `/learn/${pillar.slug}`,
      languages: languageAlternates(pillar.slug),
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${SITE_URL}/learn/${pillar.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/* ── JSON-LD builder ──────────────────────────────────────── */

function buildJsonLd(pillar: LearnPillar, editorialLocale: LearnPillarLocale) {
  const url = `${SITE_URL}/learn/${pillar.slug}`;
  const faqs = pillar.faqs[editorialLocale];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: pillar.metaTitle[editorialLocale],
        description: pillar.metaDescription[editorialLocale],
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
              name: "Learn",
              item: `${SITE_URL}/learn`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: pillar.title[editorialLocale],
              item: url,
            },
          ],
        },
      },
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: pillar.title[editorialLocale],
        description: pillar.metaDescription[editorialLocale],
        inLanguage: editorialLocale,
        url,
        author: {
          "@type": "Organization",
          name: "BetsPlug",
          url: SITE_URL,
        },
        publisher: {
          "@type": "Organization",
          name: "BetsPlug",
          url: SITE_URL,
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${url}#webpage`,
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

export default async function LearnPillarPage(props: {
  params: Promise<Params>;
}) {
  const { slug } = await props.params;
  const pillar = getLearnPillar(slug);
  if (!pillar) notFound();

  const editorialLocale = readLocaleFromCookie();
  const jsonLd = buildJsonLd(pillar, editorialLocale);
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

          <div className="relative mx-auto max-w-3xl">
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-slate-500"
            >
              <Link href="/" className="transition hover:text-green-300">
                BetsPlug
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/learn" className="transition hover:text-green-300">
                {t("Learn", "Leren")}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-slate-300">
                {pillar.title[editorialLocale]}
              </span>
            </nav>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-green-300">
                <GraduationCap className="h-3.5 w-3.5" />
                {t("Pillar guide", "Pillar gids")}
              </div>

              <h1 className="mt-5 text-balance break-words text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl">
                {pillar.title[editorialLocale]}
              </h1>

              <p className="mt-5 max-w-2xl text-balance text-base leading-relaxed text-slate-300 sm:text-lg">
                {pillar.tagline[editorialLocale]}
              </p>
            </div>
          </div>
        </section>

        {/* Intro + sections */}
        <section className="relative px-4 pb-12">
          <div className="mx-auto max-w-3xl">
            <div className="glass-card p-6 sm:p-10">
              <p className="text-lg leading-relaxed text-slate-200">
                {pillar.intro[editorialLocale]}
              </p>

              {pillar.sections.map((section) => (
                <div key={section.heading.en} className="mt-10">
                  <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    {section.heading[editorialLocale]}
                  </h2>
                  <div className="mt-4 flex flex-col gap-4">
                    {section.body[editorialLocale].map((paragraph, idx) => (
                      <p
                        key={idx}
                        className="text-base leading-relaxed text-slate-300"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
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
        <section className="relative px-4 pb-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {t(
                `${pillar.title.en} - FAQ`,
                `${pillar.title.nl} - Veelgestelde vragen`,
              )}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {t(
                "Common questions on this topic, answered without the marketing fluff.",
                "Veelgestelde vragen over dit onderwerp, beantwoord zonder marketingpraatjes.",
              )}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              {pillar.faqs[editorialLocale].map((faq) => (
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
          </div>
        </section>

        {/* Related pillars */}
        {pillar.related.length > 0 && (
          <section className="relative px-4 pb-20">
            <div className="mx-auto max-w-3xl">
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-green-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("Keep reading", "Verder lezen")}
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {pillar.related
                    .map((s) => getLearnPillar(s))
                    .filter((p): p is LearnPillar => Boolean(p))
                    .filter((p) => p.slug !== pillar.slug)
                    .map((p) => (
                      <Link
                        key={p.slug}
                        href={`/learn/${p.slug}`}
                        className="group flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-green-500/40 hover:bg-green-500/[0.05] hover:text-green-300"
                      >
                        <span className="flex items-center gap-2">
                          <BookOpen className="h-3.5 w-3.5 text-slate-500 transition group-hover:text-green-300" />
                          {p.title[editorialLocale]}
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:text-green-300" />
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <BetsPlugFooter />
      </div>
    </>
  );
}
