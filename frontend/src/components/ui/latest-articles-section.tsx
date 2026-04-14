"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Clock, Newspaper } from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import type { Article } from "@/data/articles";
import { CoverArt, SportBadge } from "@/app/articles/article-visuals";

/**
 * LatestArticlesSection
 * ────────────────────────────────────────────────────────────
 * Compact marketing strip rendered near the bottom of the
 * homepage (right before the final CTA). Shows the three most
 * recent articles and a light "check all articles" link so
 * casual visitors discover the blog without leaving the page.
 *
 * Performance: previously every heading + CTA + card had its own
 * whileInView with a per-card i*0.08 delay. That meant 5 separate
 * IntersectionObservers and the last card only finished revealing
 * ~400ms after the first. Now only the section heading fades in
 * once; everything else is static.
 */
interface LatestArticlesSectionProps {
  articles: Article[];
}

export function LatestArticlesSection({ articles }: LatestArticlesSectionProps) {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  const latest = [...articles]
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .slice(0, 3);

  if (latest.length === 0) return null;

  return (
    <section
      id="latest-articles"
      className="relative py-20 md:py-24"
      aria-labelledby="latest-articles-heading"
    >
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6">
        {/* Section heading */}
        <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:mb-14 sm:flex-row sm:items-end">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <span className="section-tag mb-5">
              <Newspaper className="h-3 w-3" />
              {t("articles.badge")}
            </span>
            <h2
              id="latest-articles-heading"
              className="text-display text-3xl text-white sm:text-4xl lg:text-5xl"
            >
              {t("articles.title")}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#a3a3a3] sm:text-base">
              {t("articles.subtitle")}
            </p>
          </motion.div>

          <div className="hidden sm:block">
            <Link href={loc("/articles")} className="btn-outline">
              {String(t("articles.checkAll")).toUpperCase()} →
            </Link>
          </div>
        </div>

        {/* Article cards */}
        <div className="grid gap-[1px] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((article) => (
            <Link
              key={article.slug}
              href={loc(`/articles/${article.slug}`)}
              className="group relative flex h-full flex-col overflow-hidden bg-[#0a0a0a] transition-all duration-200 hover:bg-[#111]"
            >
              {/* Corner brackets */}
              <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-[#4ade80] opacity-0 transition-opacity group-hover:opacity-100 z-10" />
              <span className="pointer-events-none absolute right-0 bottom-0 h-3 w-3 border-r-2 border-b-2 border-[#4ade80] opacity-0 transition-opacity group-hover:opacity-100 z-10" />

              <div className="relative aspect-[16/9] overflow-hidden">
                <CoverArt
                  gradient={article.coverGradient}
                  pattern={article.coverPattern}
                  sport={article.sport}
                  size="md"
                />
              </div>
              <div className="flex flex-1 flex-col gap-4 p-6">
                <SportBadge sport={article.sport} />
                <h3 className="text-display text-lg text-white transition-colors group-hover:text-[#4ade80] sm:text-xl">
                  {article.title}
                </h3>
                <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-[#a3a3a3]">
                  {article.excerpt}
                </p>
                <div className="mt-2 flex items-center gap-3 border-t border-white/[0.08] pt-4 font-mono text-[10px] uppercase tracking-widest text-[#707070]">
                  <span>{formatDate(article.publishedAt)}</span>
                  <span>/</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {article.readingMinutes} {t("articles.readTime")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-10 flex justify-center sm:hidden">
          <Link href={loc("/articles")} className="btn-outline">
            {String(t("articles.checkAll")).toUpperCase()} →
          </Link>
        </div>
      </div>
    </section>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
