import type { Metadata } from "next";
import { AboutContent } from "./about-content";
import { getServerLocale, getLocalizedAlternates } from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";

/* ── Per-page SEO metadata ─────────────────────────────────────
   Overrides the root layout defaults so the About page has its
   own title, description and canonical URL -- essential for
   indexability and rich-result eligibility.                     */
export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta = PAGE_META["/about-us"]?.[locale] ?? PAGE_META["/about-us"].en;
  const alternates = getLocalizedAlternates("/about-us");

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

export default function AboutPage() {
  return <AboutContent />;
}
