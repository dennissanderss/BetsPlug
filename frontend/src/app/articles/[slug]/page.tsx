import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articles, getArticleBySlug, type Article } from "@/data/articles";
import { ArticleTemplate } from "../article-template";

/**
 * Single article page — uses the shared ArticleTemplate so every
 * post has identical layout, typography and promo banner.
 */

const SITE_URL = "https://betsplug.com";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return articles.map((a) => ({ slug: a.slug }));
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
  const article = getArticleBySlug(slug);
  if (!article) {
    return {
      title: "Article not found | BetsPlug",
      description: "The article you're looking for could not be found.",
    };
  }

  const ogImage = absoluteCoverImage(article);

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    alternates: {
      canonical: `/articles/${article.slug}`,
    },
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt ?? article.publishedAt,
      authors: [article.author],
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: article.metaTitle,
      description: article.metaDescription,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

/* ── JSON-LD builder ─────────────────────────────────────── */

function buildArticleJsonLd(article: Article) {
  const url = `${SITE_URL}/articles/${article.slug}`;
  const image = absoluteCoverImage(article);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
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
    inLanguage: "en",
    articleSection: article.sport,
  };
}

export default async function SingleArticlePage(props: {
  params: Promise<Params>;
}) {
  const { slug } = await props.params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const jsonLd = buildArticleJsonLd(article);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleTemplate article={article} />
    </>
  );
}
