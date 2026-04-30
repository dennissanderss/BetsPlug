import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  GraduationCap,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { UnlockBanner } from "@/components/match-predictions/unlock-banner";
import { HeroMediaBg, CtaMediaBg } from "@/components/ui/media-bg";
import { HexBadge } from "@/components/noct/hex-badge";
import { PAGE_IMAGES } from "@/data/page-images";
import { isLocale, locales, type Locale } from "@/i18n/config";
import {
  pickLearnPillarLocale,
  type LearnPillar,
  type LearnPillarLocale,
} from "@/data/learn-pillars";
import { fetchLearnPillarSlugs, fetchLearnPillarBySlug } from "@/lib/sanity-data";
import {
  getLocalizedAlternates,
  getOpenGraphLocales,
} from "@/lib/seo-helpers";
import { localizePath } from "@/i18n/routes";

const SITE_URL = "https://betsplug.com";

export const dynamic = "force-static";
export const revalidate = 60;

type Params = { locale: string; slug: string };

/* ── Static params: 16 locales × N pillars ─────────────────── */

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await fetchLearnPillarSlugs();
  const out: Params[] = [];
  for (const locale of locales) {
    for (const slug of slugs) {
      out.push({ locale, slug });
    }
  }
  return out;
}

function detectTranslatedLocales(pillar: LearnPillar): Locale[] {
  const enTitle = pillar.title.en;
  return (Object.keys(pillar.title) as Locale[]).filter(
    (l) => l === "en" || pillar.title[l] !== enTitle,
  );
}

/* ── Metadata ─────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) return {};
  const locale: Locale = rawLocale;

  const pillar = await fetchLearnPillarBySlug(slug);
  if (!pillar) {
    return {
      title: "Topic Not Found · BetsPlug",
      description: "The learn topic you're looking for could not be found.",
    };
  }

  const editorialLocale: LearnPillarLocale = pickLearnPillarLocale(locale);
  const title = pillar.metaTitle[editorialLocale];
  const description = pillar.metaDescription[editorialLocale];
  const translatedLocales = detectTranslatedLocales(pillar);
  const alternates = getLocalizedAlternates(
    `/learn/${pillar.slug}`,
    translatedLocales,
    locale,
  );
  const og = getOpenGraphLocales(locale);
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
      locale: og.locale,
      alternateLocale: og.alternateLocales,
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

export default async function LearnPillarPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const editorialLocale: LearnPillarLocale = pickLearnPillarLocale(locale);

  const pillar = await fetchLearnPillarBySlug(slug);
  if (!pillar) notFound();

  const lhref = (canonical: string) => localizePath(canonical, locale);
  const jsonLd = buildJsonLd(pillar, editorialLocale);
  const t = (en: string, nl: string) => (editorialLocale === "nl" ? nl : en);

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
              <Link href={lhref("/")} className="transition hover:text-[#4ade80]">
                BetsPlug
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link href={lhref("/learn")} className="transition hover:text-[#4ade80]">
                {t("Learn", "Leren")}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-[#a3a9b8]">
                {pillar.title[editorialLocale]}
              </span>
            </nav>

            <div>
              <HexBadge variant="green" size="lg" className="mb-4">
                <GraduationCap className="h-7 w-7" />
              </HexBadge>
              <span className="section-label">
                <GraduationCap className="h-3 w-3" />
                {t("Pillar guide", "Pillar gids")}
              </span>

              <h1 className="text-heading mt-5 text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                {pillar.title[editorialLocale]}
              </h1>

              <p className="mt-5 max-w-2xl text-balance text-base leading-relaxed text-[#a3a9b8] sm:text-lg">
                {pillar.tagline[editorialLocale]}
              </p>
            </div>
          </div>
        </section>

        {/* Intro + sections */}
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
                  <p className="text-lg leading-relaxed text-[#ededed]">
                    {pillar.intro[editorialLocale]}
                  </p>

                  {pillar.sections.map((section) => (
                    <div key={section.heading.en} className="mt-10">
                      <h2 className="text-heading text-2xl text-[#ededed] sm:text-3xl">
                        {section.heading[editorialLocale]}
                      </h2>
                      <div className="mt-4 flex flex-col gap-4">
                        {section.body[editorialLocale].map((paragraph, idx) => (
                          <p
                            key={idx}
                            className="text-base leading-relaxed text-[#ededed]"
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
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
              <div className="mb-12 sm:mb-14">
                <span className="section-label">
                  <HelpCircle className="h-3 w-3" />
                  FAQ
                </span>
                <h2 className="text-heading mt-4 text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                  {t(
                    `${pillar.title.en} - FAQ`,
                    `${pillar.title.nl} - Veelgestelde vragen`,
                  )}
                </h2>
                <p className="mt-4 text-base text-[#a3a9b8]">
                  {t(
                    "Common questions on this topic, answered without the marketing fluff.",
                    "Veelgestelde vragen over dit onderwerp, beantwoord zonder marketingpraatjes.",
                  )}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {pillar.faqs[editorialLocale].map((faq) => (
                  <details
                    key={faq.q}
                    className="glass-panel-lifted group overflow-hidden"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-6 text-left text-base font-semibold text-[#ededed] transition hover:text-[#4ade80] sm:p-7">
                      <span>{faq.q}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#6b7280] transition group-open:rotate-90" />
                    </summary>
                    <div className="px-6 pb-6 text-sm leading-relaxed text-[#a3a9b8] sm:px-7 sm:pb-7">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Related pillars */}
        {pillar.related.length > 0 && (
          <section className="relative py-20 md:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="mx-auto max-w-5xl">
                <span className="section-label">
                  <Sparkles className="h-3 w-3" />
                  {t("Keep reading", "Verder lezen")}
                </span>
                <h2 className="text-heading mt-4 text-2xl text-[#ededed] sm:text-3xl">
                  {t("Related pillars", "Gerelateerde pillars")}
                </h2>
                <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {(await Promise.all(pillar.related.map((s) => fetchLearnPillarBySlug(s))))
                    .filter((p): p is LearnPillar => Boolean(p))
                    .filter((p) => p.slug !== pillar.slug)
                    .map((p, i) => {
                      const variant = (["green", "purple", "blue"] as const)[i % 3];
                      return (
                        <Link
                          key={p.slug}
                          href={lhref(`/learn/${p.slug}`)}
                          className={`card-neon card-neon-${variant} group relative block overflow-hidden p-6 transition-transform duration-300 hover:-translate-y-1`}
                        >
                          <div className="relative flex flex-col gap-3">
                            <HexBadge variant={variant} size="sm">
                              <BookOpen className="h-4 w-4" />
                            </HexBadge>
                            <h3 className="text-heading text-lg text-[#ededed] transition group-hover:text-[#4ade80]">
                              {p.title[editorialLocale]}
                            </h3>
                            <ArrowRight className="h-4 w-4 text-[#6b7280] transition group-hover:text-[#4ade80]" />
                          </div>
                        </Link>
                      );
                    })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="relative py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="card-neon card-neon-green halo-green relative overflow-hidden p-10 md:p-16">
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
                  {t("Start applying", "Aan de slag")}
                </span>
                <h2 className="text-heading mt-4 text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                  {t("Put theory into practice.", "Breng theorie in de praktijk.")}
                </h2>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-[#a3a9b8]">
                  {t(
                    "Once you understand the math, see it run live on every fixture inside BetsPlug.",
                    "Zodra je de wiskunde snapt, zie je het live draaien op elke wedstrijd in BetsPlug.",
                  )}
                </p>

                <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <Link href={lhref("/")} className="btn-primary inline-flex items-center gap-2">
                    {t("View predictions", "Bekijk voorspellingen")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href={lhref("/learn")} className="btn-glass inline-flex items-center gap-2">
                    {t("All guides", "Alle gidsen")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <BetsPlugFooter />
      </div>
    </>
  );
}
