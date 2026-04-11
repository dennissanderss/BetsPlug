import type { Metadata } from "next";
import { ArticlesContent } from "./articles-content";
import { getServerLocale, getLocalizedAlternates } from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";

/**
 * Public articles archive page.
 * Lists every article with tab filters per sport and a hero
 * featured post at the top. Data comes from the static
 * src/data/articles.ts source so the page is fully SSG-friendly.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta = PAGE_META["/articles"]?.[locale] ?? PAGE_META["/articles"].en;
  const alternates = getLocalizedAlternates("/articles");

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

export default function ArticlesPage() {
  return <ArticlesContent />;
}
