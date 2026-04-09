"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Clock, Newspaper } from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { articles as ALL_ARTICLES } from "@/data/articles";
import { CoverArt, SportBadge } from "@/app/articles/article-visuals";

/**
 * LatestArticlesSection
 * ────────────────────────────────────────────────────────────
 * Compact marketing strip rendered near the bottom of the
 * homepage (right before the final CTA). Shows the three most
 * recent articles and a light "check all articles" link so
 * casual visitors discover the blog without leaving the page.
 */
export function LatestArticlesSection() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  const latest = [...ALL_ARTICLES]
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
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#0b1220]/40 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-20 h-[320px] w-[620px] -translate-x-1/2 rounded-full bg-green-500/[0.05] blur-[140px]" />

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
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-300">
              <Newspaper className="h-3.5 w-3.5" />
              {t("articles.badge")}
            </span>
            <h2
              id="latest-articles-heading"
              className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl"
            >
              <span className="gradient-text">{t("articles.title")}</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
              {t("articles.subtitle")}
            </p>
          </motion.div>

          {/* Light CTA — desktop only */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="hidden sm:block"
          >
            <Link
              href={loc("/articles")}
              className="group inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-300 backdrop-blur-xl transition-all duration-300 hover:border-green-500/40 hover:bg-green-500/[0.08] hover:text-white"
            >
              {t("articles.checkAll")}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* Article cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((article, i) => (
            <motion.div
              key={article.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.6,
                delay: i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Link
                href={loc(`/articles/${article.slug}`)}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-green-500/40 hover:shadow-[0_0_40px_rgba(74,222,128,0.12)]"
              >
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
                  <h3 className="text-lg font-extrabold leading-snug tracking-tight text-white group-hover:text-green-50 sm:text-xl">
                    {article.title}
                  </h3>
                  <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-slate-400">
                    {article.excerpt}
                  </p>
                  <div className="mt-2 flex items-center gap-3 border-t border-white/[0.05] pt-4 text-xs text-slate-500">
                    <span>{formatDate(article.publishedAt)}</span>
                    <span className="text-slate-700">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {article.readingMinutes} {t("articles.readTime")}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Mobile CTA — shown below the grid */}
        <div className="mt-10 flex justify-center sm:hidden">
          <Link
            href={loc("/articles")}
            className="group inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-300 backdrop-blur-xl transition-all duration-300 hover:border-green-500/40 hover:bg-green-500/[0.08] hover:text-white"
          >
            {t("articles.checkAll")}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
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
