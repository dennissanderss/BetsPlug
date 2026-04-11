import type { Metadata } from "next";
import { B2BContent } from "./b2b-content";
import { getServerLocale, getLocalizedAlternates } from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";

export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta = PAGE_META["/b2b"]?.[locale] ?? PAGE_META["/b2b"].en;
  const alternates = getLocalizedAlternates("/b2b");

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
  };
}

export default function B2BPage() {
  return <B2BContent />;
}
