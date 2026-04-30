import type { Metadata } from "next";
import { EngineContent } from "./engine-content";
import {
  getServerLocale,
  getLocalizedAlternates,
  getLocalizedBreadcrumbs,
  getOpenGraphLocales,
} from "@/lib/seo-helpers";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { PAGE_META } from "@/data/page-meta";

/**
 * /engine — public transparency page.
 *
 * Explains how BetsPlug classifies every prediction into a quality tier,
 * what "accuracy" means in our context, and shows the live per-tier
 * numbers from /api/pricing/comparison so visitors can verify our
 * marketing claims before signing up.
 *
 * Indexed by search engines (SEO).
 */
export const revalidate = 300; // 5-minute ISR — tier stats don't change often

export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta =
    PAGE_META["/engine"]?.[locale] ?? PAGE_META["/engine"].en;
  const alternates = getLocalizedAlternates("/engine");
const og = getOpenGraphLocales();
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
      type: "article",
      locale: og.locale,
      alternateLocale: og.alternateLocales,
    },
  };
}

export default async function EnginePage() {
  const breadcrumbs = getLocalizedBreadcrumbs([
    { labelKey: "bc.home", canonicalPath: "/" },
    { labelKey: "nav.engine", canonicalPath: "/engine" },
  ]);

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <EngineContent />
    </>
  );
}
