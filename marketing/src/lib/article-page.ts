/**
 * Article content loader.
 * Articles live at src/content/articles/{canonical-slug}/{locale}.json.
 * Falls back to EN when locale-specific file is missing.
 */
import { defaultLocale, type Locale } from "@/lib/i18n";
import type { ArticleContent } from "@/content/articles/types";

const articleLoaders = import.meta.glob<{ default: ArticleContent }>(
  "/src/content/articles/*/*.json",
);

const ARTICLE_SLUGS = [
  "expected-goals-explained",
  "elo-rating-explained",
  "poisson-goal-models",
  "what-is-value-betting",
  "kelly-criterion",
  "bankroll-management",
  "ai-vs-tipsters",
] as const;

export type ArticleSlug = typeof ARTICLE_SLUGS[number];

export function isArticleSlug(value: string): value is ArticleSlug {
  return (ARTICLE_SLUGS as readonly string[]).includes(value);
}

export function listArticleSlugs(): readonly ArticleSlug[] {
  return ARTICLE_SLUGS;
}

export async function loadArticle(slug: ArticleSlug, locale: Locale): Promise<ArticleContent> {
  const candidatePath = `/src/content/articles/${slug}/${locale}.json`;
  const fallbackPath  = `/src/content/articles/${slug}/${defaultLocale}.json`;

  const candidate = articleLoaders[candidatePath];
  if (candidate) {
    return (await candidate()).default;
  }
  const fallback = articleLoaders[fallbackPath];
  if (fallback) {
    if (locale !== defaultLocale) {
      console.warn(`[articles] Missing ${slug}/${locale}, falling back to ${defaultLocale}`);
    }
    return (await fallback()).default;
  }
  throw new Error(`[articles] No content file for "${slug}" — looked for ${candidatePath} and ${fallbackPath}`);
}
