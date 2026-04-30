import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getLocalizedAlternates,
  getLocalizedBreadcrumbs,
  getOpenGraphLocales,
} from "@/lib/seo-helpers";
import {
  BreadcrumbJsonLd,
  PricingProductJsonLd,
  FaqJsonLd,
} from "@/components/seo/json-ld";
import { PricingContent } from "./pricing-content";
import { fetchPricingConfig } from "@/lib/sanity-data";
import { PAGE_META } from "@/data/page-meta";
import { PRICING_FAQS } from "./pricing-faqs";
import { isLocale, locales, type Locale } from "@/i18n/config";

export const dynamic = "force-static";
export const revalidate = 60;

type Params = { locale: string };

export async function generateStaticParams(): Promise<Params[]> {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) return {};
  const locale: Locale = rawLocale;

  const meta = PAGE_META["/pricing"]?.[locale] ?? PAGE_META["/pricing"].en;
  const alternates = getLocalizedAlternates("/pricing", undefined, locale);
  const og = getOpenGraphLocales(locale);
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
      locale: og.locale,
      alternateLocale: og.alternateLocales,
    },
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();

  const breadcrumbs = getLocalizedBreadcrumbs([
    { labelKey: "bc.home", canonicalPath: "/" },
    { labelKey: "nav.pricing", canonicalPath: "/pricing" },
  ]);

  const pricingConfig = await fetchPricingConfig();

  // Product/Offer JSON-LD so Google can show price rich snippets in SERPs.
  // Prices mirror the visible plan cards in PricingContent — keep in sync.
  const pricingOffers = [
    {
      name: "Bronze · 7-day trial",
      price: "0.01",
      priceCurrency: "EUR",
      description: "Full Gold access for 7 days. Cancel anytime in two clicks.",
      url: "https://betsplug.com/checkout?plan=bronze",
      category: "https://schema.org/TimedSubscription",
    },
    {
      name: "Silver",
      price: "9.99",
      priceCurrency: "EUR",
      description: "Silver + Free picks across the top 14 competitions.",
      url: "https://betsplug.com/checkout?plan=silver",
      category: "https://schema.org/Subscription",
      billingDuration: "P1M",
    },
    {
      name: "Gold",
      price: "14.99",
      priceCurrency: "EUR",
      description:
        "Gold + Silver + Free picks, Data Analyst tools, PDF/CSV/JSON exports, Gold Telegram community.",
      url: "https://betsplug.com/checkout?plan=gold",
      category: "https://schema.org/Subscription",
      billingDuration: "P1M",
    },
    {
      name: "Platinum lifetime",
      price: "199.00",
      priceCurrency: "EUR",
      description:
        "Platinum elite picks (80%+ historical accuracy) + all lower tiers, one-time lifetime price.",
      url: "https://betsplug.com/checkout?plan=platinum",
      category: "https://schema.org/OneTime",
    },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <PricingProductJsonLd
        name="BetsPlug AI football predictions — subscription plans"
        description="Four tiers of AI football analytics — Free Access at €0, Silver, Gold, and a Platinum lifetime plan. Every prediction tracked publicly."
        offers={pricingOffers}
      />
      <FaqJsonLd
        items={PRICING_FAQS.map((f) => ({ question: f.q, answer: f.a }))}
      />
      <PricingContent pricingConfig={pricingConfig} />
    </>
  );
}
