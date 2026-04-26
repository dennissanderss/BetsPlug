import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchArticleSlugs,
  fetchArticleBySlug,
  type Article,
} from "@/lib/sanity-data";
import { pickLocalized } from "@/data/articles";
import { getLocalizedAlternates, getServerLocale } from "@/lib/seo-helpers";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { ArticleTemplate } from "../article-template";

export const revalidate = 60;

/**
 * Single article page — uses the shared ArticleTemplate so every
 * post has identical layout, typography and promo banner.
 */

const SITE_URL = "https://betsplug.com";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await fetchArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

/* ── Helpers ─────────────────────────────────────────────── */

function absoluteCoverImage(article: Article): string | undefined {
  if (!article.coverImage) return undefined;
  // Relative asset → resolve against SITE_URL; absolute URL → pass through
  return article.coverImage.startsWith("http")
    ? article.coverImage
    : `${SITE_URL}${article.coverImage}`;
}

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const article = await fetchArticleBySlug(slug);
  if (!article) {
    return {
      title: "Article Not Found · BetsPlug",
      description: "The article you're looking for could not be found.",
    };
  }

  const ogImage = absoluteCoverImage(article);
  const alternates = getLocalizedAlternates(`/articles/${article.slug}`);
  const locale = getServerLocale();
  const metaTitle = pickLocalized(article.metaTitle, locale);
  const metaDescription = pickLocalized(article.metaDescription, locale);

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt ?? article.publishedAt,
      authors: [article.author],
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

/* ── JSON-LD builder ─────────────────────────────────────── */

function buildArticleJsonLd(article: Article, locale: string) {
  const url = `${SITE_URL}/articles/${article.slug}`;
  const image = absoluteCoverImage(article);
  const headline = pickLocalized(article.title, locale as any);
  const description = pickLocalized(article.metaDescription, locale as any);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    url,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    author: {
      "@type": "Organization",
      name: article.author,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "BetsPlug",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.webp`,
      },
    },
    ...(image ? { image: [image] } : {}),
    inLanguage: locale,
    articleSection: article.sport,
  };
}

export default async function SingleArticlePage(props: {
  params: Promise<Params>;
}) {
  const { slug } = await props.params;
  const article = await fetchArticleBySlug(slug);
  if (!article) notFound();

  const locale = getServerLocale();
  const jsonLd = buildArticleJsonLd(article, locale);

  // Breadcrumb schema so Google can render breadcrumb rich snippets
  // in SERPs (the visual breadcrumb lives inside ArticleTemplate but
  // was missing its JSON-LD counterpart before).
  const breadcrumbItems = [
    { name: "BetsPlug", href: "/" },
    { name: "Articles", href: "/articles" },
    { name: pickLocalized(article.title, locale), href: `/articles/${article.slug}` },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ArticleTemplate article={article} />
    </>
  );
}
