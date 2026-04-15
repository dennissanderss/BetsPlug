import type { Metadata } from "next";
import {
  getServerLocale,
  getLocalizedAlternates,
  getLocalizedBreadcrumbs,
} from "@/lib/seo-helpers";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { PricingContent } from "./pricing-content";
import { fetchPricingConfig } from "@/lib/sanity-data";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const alternates = getLocalizedAlternates("/pricing");
  return {
    title: "Pricing Plans · AI Football Predictions · BetsPlug",
    description:
      "Choose the BetsPlug plan that fits you — Bronze trial for €0.01, Silver for casual bettors, Gold for full access, or Platinum Lifetime founder-tier for €199 once.",
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
    openGraph: {
      title: "BetsPlug Pricing · AI Football Predictions",
      description:
        "Bronze, Silver, Gold or Platinum Lifetime — pick the plan built for your betting style.",
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
