import type { Metadata } from "next";
import { ArticlesContent } from "./articles-content";
import {
  getServerLocale,
  getLocalizedAlternates,
  getLocalizedBreadcrumbs,
} from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { fetchAllArticles } from "@/lib/sanity-data";

export const revalidate = 3600;

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

export default async function ArticlesPage() {
  const [allArticles, breadcrumbs] = await Promise.all([
    fetchAllArticles(),
    Promise.resolve(
      getLocalizedBreadcrumbs([
        { labelKey: "bc.home", canonicalPath: "/" },
        { labelKey: "bc.articles", canonicalPath: "/articles" },
      ]),
    ),
  ]);

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <ArticlesContent articles={allArticles} />
    </>
  );
}
