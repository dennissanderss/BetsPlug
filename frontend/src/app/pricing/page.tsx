import type { Metadata } from "next";
import {
  getServerLocale,
  getLocalizedAlternates,
  getLocalizedBreadcrumbs,
} from "@/lib/seo-helpers";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { PricingContent } from "./pricing-content";
import { fetchPricingConfig } from "@/lib/sanity-data";
import { PAGE_META } from "@/data/page-meta";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta =
    PAGE_META["/pricing"]?.[locale] ?? PAGE_META["/pricing"].en;
  const alternates = getLocalizedAlternates("/pricing");
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
    },
  };
}

export default async function PricingPage() {
  const breadcrumbs = getLocalizedBreadcrumbs([
    { labelKey: "bc.home", canonicalPath: "/" },
    { labelKey: "nav.pricing", canonicalPath: "/pricing" },
  ]);

  const pricingConfig = await fetchPricingConfig();

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <PricingContent pricingConfig={pricingConfig} />
    </>
  );
}
