import type { Metadata } from "next";
import { TrackRecordContent } from "./track-record-content";
import { getServerLocale, getLocalizedAlternates } from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";

/* ── Per-page SEO metadata ─────────────────────────────────────
   The track-record page is one of BetsPlug's highest-trust
   entry points, so it gets its own rich metadata -- distinct
   title, description and canonical URL.                         */
export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta = PAGE_META["/track-record"]?.[locale] ?? PAGE_META["/track-record"].en;
  const alternates = getLocalizedAlternates("/track-record");

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

export default function TrackRecordPage() {
  return <TrackRecordContent />;
}
