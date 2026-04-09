import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articles, getArticleBySlug } from "@/data/articles";
import { ArticleTemplate } from "../article-template";

/**
 * Single article page — uses the shared ArticleTemplate so every
 * post has identical layout, typography and promo banner.
 */

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return articles.map((a) => ({ slug: a.slug }));
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
      authors: [article.author],
    },
    twitter: {
      card: "summary_large_image",
      title: article.metaTitle,
      description: article.metaDescription,
    },
  };
}

export default async function SingleArticlePage(props: {
  params: Promise<Params>;
}) {
  const { slug } = await props.params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();
  return <ArticleTemplate article={article} />;
}
