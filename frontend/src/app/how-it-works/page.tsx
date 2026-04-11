import type { Metadata } from "next";
import { HowItWorksContent } from "./how-it-works-content";
import { getServerLocale, getLocalizedAlternates } from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";

/* ── Per-page SEO metadata ─────────────────────────────────────
   The How-It-Works page is the main trust-building entry point
   for prospects doing due diligence. It gets dedicated title,
   description, canonical URL and OpenGraph tags.               */
export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta = PAGE_META["/how-it-works"]?.[locale] ?? PAGE_META["/how-it-works"].en;
  const alternates = getLocalizedAlternates("/how-it-works");

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

export default function HowItWorksPage() {
  return <HowItWorksContent />;
}
