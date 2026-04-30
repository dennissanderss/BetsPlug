import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeContent } from "../home-content";
import {
  OrganizationJsonLd,
  WebSiteJsonLd,
  ServiceJsonLd,
  FaqJsonLd,
} from "@/components/seo/json-ld";
import { fetchAllTestimonials, fetchHomepage, fetchPricingConfig } from "@/lib/sanity-data";
import { getHomeFaqJsonLdItems } from "@/data/home-faq";
import { getLocalizedAlternates, getOpenGraphLocales } from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";
import { isLocale, locales, type Locale } from "@/i18n/config";

const SITE_URL = "https://betsplug.com";

const OG_IMAGE = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "BetsPlug · AI-Driven football predictions",
  type: "image/jpeg",
} as const;

/**
 * STATIC homepage per locale.
 * ────────────────────────────────────────────────────────────
 * URL: /[locale]/  →  /en, /nl, /de, /fr, /es, /it (+ 10 parked).
 *
 * Generated at build time for all 16 locales via
 * `generateStaticParams()`. Locale comes from the URL `params`,
 * NOT from headers() / cookies() — that's the whole reason this
 * file exists. Reading those would force the page back to dynamic
 * SSR and we'd lose the CDN cache that the migration is meant to
 * win.
 *
 * The middleware redirects "/" → "/en" so EN visitors keep landing
 * on the canonical bare URL while the underlying response comes
 * from this static `[locale]/` flow.
 */

export const dynamic = "force-static";
export const revalidate = 60;

type Params = { locale: string };

/* ── Static params: pre-render all 16 locales ────────────────── */

export async function generateStaticParams(): Promise<Params[]> {
  return locales.map((locale) => ({ locale }));
}

/* ── Metadata ────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) return {};

  const locale: Locale = rawLocale;
  const meta = PAGE_META["/"]?.[locale] ?? PAGE_META["/"].en;
  const alternates = getLocalizedAlternates("/", undefined, locale);
  const og = getOpenGraphLocales(locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
    openGraph: {
      type: "website",
      siteName: "BetsPlug",
      url: alternates.canonical,
      title: meta.ogTitle ?? meta.title,
      description: meta.ogDescription ?? meta.description,
      images: [OG_IMAGE],
      locale: og.locale,
      alternateLocale: og.alternateLocales,
    },
    twitter: {
      card: "summary_large_image",
      site: "@betsplug",
      creator: "@betsplug",
      title: meta.ogTitle ?? meta.title,
      description: meta.ogDescription ?? meta.description,
      images: [OG_IMAGE.url],
    },
  };
}

/* ── Page ────────────────────────────────────────────────────── */

export default async function HomePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;

  const [sanityTestimonials, homepage, pricingConfig] = await Promise.all([
    fetchAllTestimonials(),
    fetchHomepage(),
    fetchPricingConfig(),
  ]);

  const testimonials = sanityTestimonials.map((t) => ({
    text: t.text,
    image: t.imageUrl,
    name: t.name,
    role: t.role,
  }));

  const faqItems = getHomeFaqJsonLdItems(locale);

  return (
    <>
      <OrganizationJsonLd locale={locale} />
      <WebSiteJsonLd locale={locale} />
      <ServiceJsonLd locale={locale} />
      <FaqJsonLd items={faqItems} />

      <HomeContent
        testimonials={testimonials}
        homepage={homepage}
        pricingConfig={pricingConfig}
      />
    </>
  );
}
