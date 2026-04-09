"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import {
  type Article,
  type ArticleBlock,
  getAdjacentArticles,
  getRelatedArticles,
} from "@/data/articles";
import { CoverArt, SportBadge } from "./article-visuals";

/* ──────────────────────────────────────────────────────────────
 * ArticleTemplate — rendered for every single article page.
 *
 * Layout (≥lg):
 *   ┌─────────────────────────┬──────────────┐
 *   │  Header / cover / body  │ sticky promo │
 *   │                         │   sidebar    │
 *   └─────────────────────────┴──────────────┘
 *   ┌────────────── prev / next ─────────────┐
 *   ├─────────────── related ────────────────┤
 *
 * On mobile both columns stack and the promo card slots in
 * after the body, just before the prev/next nav.
 * ────────────────────────────────────────────────────────────── */

export function ArticleTemplate({ article }: { article: Article }) {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const related = getRelatedArticles(article, 3);
  const { prev, next } = getAdjacentArticles(article);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070a12] text-white">
      {/* Ambient background (matches archive page) */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#070a12] via-[#0b1220] to-[#070a12]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(74,222,128,0.5) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute left-1/2 top-40 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-green-500/[0.06] blur-[150px]" />
      </div>

      <SiteNav />

      <main className="relative z-10 pt-28 pb-24 sm:pt-32">
        {/* ── Wider container ── */}
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-2 text-xs text-slate-500"
          >
            <Link
              href={loc("/")}
              className="transition-colors hover:text-white"
            >
              {t("articles.breadcrumbHome")}
            </Link>
            <span>/</span>
            <Link
              href={loc("/articles")}
              className="transition-colors hover:text-white"
            >
              {t("articles.breadcrumbBlog")}
            </Link>
            <span>/</span>
            <span className="truncate text-slate-600">{article.title}</span>
          </nav>

          {/* Back link */}
          <Link
            href={loc("/articles")}
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-green-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("articles.back")}
          </Link>

          {/* ── Two-column grid: article body + sticky promo sidebar ── */}
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
            {/* ── Main column ── */}
            <article className="min-w-0">
              {/* Header */}
              <motion.header
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="mb-8"
              >
                <div className="mb-5">
                  <SportBadge sport={article.sport} />
                </div>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
                  {article.title}
                </h1>
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                  <span>
                    {t("articles.byline")}{" "}
                    <span className="text-slate-300">{article.author}</span>
                  </span>
                  <span className="text-slate-700">·</span>
                  <span>{formatDate(article.publishedAt)}</span>
                  <span className="text-slate-700">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {article.readingMinutes} {t("articles.readTime")}
                  </span>
                </div>
              </motion.header>

              {/* Cover */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.7,
                  delay: 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative mb-10 aspect-[16/9] overflow-hidden rounded-3xl border border-white/[0.08]"
              >
                <CoverArt
                  gradient={article.coverGradient}
                  pattern={article.coverPattern}
                  sport={article.sport}
                  size="lg"
                />
              </motion.div>

              {/* TL;DR */}
              {article.tldr && (
                <motion.aside
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  className="mb-10 rounded-2xl border border-green-500/20 bg-green-500/[0.04] p-5 backdrop-blur-xl sm:p-6"
                >
                  <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-green-300">
                    {t("articles.tldr")}
                  </p>
                  <p className="text-base leading-relaxed text-slate-200">
                    {article.tldr}
                  </p>
                </motion.aside>
              )}

              {/* Body */}
              <div className="space-y-6 text-base leading-[1.8] text-slate-300 sm:text-[17px]">
                {article.blocks.map((block, i) => (
                  <BlockRenderer key={i} block={block} />
                ))}
              </div>

              {/* ── Mobile-only inline promo (sidebar is hidden <lg) ── */}
              <div className="lg:hidden">
                <InlinePromoBanner />
              </div>

              {/* Share + footer meta */}
              <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.05] pt-6">
                <SportBadge sport={article.sport} />
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <Share2 className="h-3.5 w-3.5" />
                  <span className="font-semibold uppercase tracking-wider">
                    {t("articles.share")}
                  </span>
                  <ShareButtons title={article.title} slug={article.slug} />
                </div>
              </div>
            </article>

            {/* ── Right sticky sidebar (≥lg only) ── */}
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <StickyPromoBanner />
              </div>
            </aside>
          </div>

          {/* ── Prev / Next navigation ── */}
          {(prev || next) && (
            <PrevNextNav prev={prev} next={next} />
          )}

          {/* ── Related articles ── */}
          {related.length > 0 && (
            <section className="mt-20">
              <h2 className="mb-6 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                {t("articles.related")}
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((a) => (
                  <Link
                    key={a.slug}
                    href={loc(`/articles/${a.slug}`)}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-green-500/40 hover:shadow-[0_0_40px_rgba(74,222,128,0.12)]"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <CoverArt
                        gradient={a.coverGradient}
                        pattern={a.coverPattern}
                        sport={a.sport}
                        size="md"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-6">
                      <SportBadge sport={a.sport} />
                      <h3 className="text-base font-extrabold leading-snug tracking-tight text-white sm:text-lg">
                        {a.title}
                      </h3>
                      <div className="mt-auto flex items-center gap-3 border-t border-white/[0.05] pt-3 text-xs text-slate-500">
                        <span>{formatDate(a.publishedAt)}</span>
                        <span className="text-slate-700">·</span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {a.readingMinutes} {t("articles.readTime")}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <BetsPlugFooter />
    </div>
  );
}

/* ── Block renderer ───────────────────────────────────────── */

function BlockRenderer({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "heading":
      return (
        <h2 className="mt-10 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          {block.text}
        </h2>
      );
    case "paragraph":
      return <p>{block.text}</p>;
    case "quote":
      return (
        <blockquote className="relative my-8 rounded-2xl border-l-4 border-green-500/60 bg-white/[0.02] py-5 pl-6 pr-4 text-slate-200">
          <p className="text-lg font-medium italic leading-relaxed">
            &ldquo;{block.text}&rdquo;
          </p>
          {block.cite && (
            <footer className="mt-3 text-xs font-semibold uppercase tracking-wider text-green-300/80">
              — {block.cite}
            </footer>
          )}
        </blockquote>
      );
    case "list":
      return (
        <ul className="space-y-3 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <CheckCircle2
                className="mt-1 h-4 w-4 flex-shrink-0 text-green-400"
                strokeWidth={2.5}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

/* ── Sticky promo banner (vertical, sidebar) ─────────────── */

function StickyPromoBanner() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl border border-green-500/25 bg-gradient-to-br from-green-500/[0.1] via-emerald-500/[0.04] to-transparent p-6 backdrop-blur-xl"
    >
      {/* Subtle glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-[220px] w-[220px] rounded-full bg-green-500/[0.18] blur-[100px]" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-[160px] w-[160px] rounded-full bg-emerald-500/[0.12] blur-[80px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(74,222,128,0.8) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative flex flex-col gap-5">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-green-300">
          <Sparkles className="h-3 w-3" />
          {t("articles.ctaBadge")}
        </span>
        <h3 className="text-xl font-extrabold leading-tight tracking-tight text-white">
          {t("articles.ctaTitle")}
        </h3>
        <p className="text-sm leading-relaxed text-slate-300">
          {t("articles.ctaSubtitle")}
        </p>
        <Link
          href={`${loc("/checkout")}?plan=bronze`}
          className="btn-gradient inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold tracking-tight text-black shadow-lg shadow-green-500/30 transition-all duration-300 hover:shadow-green-500/50"
        >
          {t("articles.ctaButton")}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <span className="text-center text-[11px] text-slate-500">
          {t("articles.ctaNoCard")}
        </span>
      </div>
    </motion.aside>
  );
}

/* ── Inline promo banner (mobile fallback) ──────────────── */

function InlinePromoBanner() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  return (
    <motion.aside
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative my-12 overflow-hidden rounded-3xl border border-green-500/25 bg-gradient-to-br from-green-500/[0.08] via-emerald-500/[0.03] to-transparent p-6 backdrop-blur-xl sm:p-8"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-[260px] w-[260px] rounded-full bg-green-500/[0.12] blur-[100px]" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 h-[200px] w-[200px] rounded-full bg-emerald-500/[0.1] blur-[90px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(74,222,128,0.8) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-green-300">
            <Sparkles className="h-3 w-3" />
            {t("articles.ctaBadge")}
          </span>
          <h3 className="text-xl font-extrabold leading-tight tracking-tight text-white sm:text-2xl">
            {t("articles.ctaTitle")}
          </h3>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-300 sm:text-base">
            {t("articles.ctaSubtitle")}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Link
            href={`${loc("/checkout")}?plan=bronze`}
            className="btn-gradient inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold tracking-tight text-black shadow-lg shadow-green-500/30 transition-all duration-300 hover:shadow-green-500/50"
          >
            {t("articles.ctaButton")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <span className="text-[11px] text-slate-500">
            {t("articles.ctaNoCard")}
          </span>
        </div>
      </div>
    </motion.aside>
  );
}

/* ── Prev / Next navigation ──────────────────────────────── */

function PrevNextNav({
  prev,
  next,
}: {
  prev?: Article;
  next?: Article;
}) {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  return (
    <motion.nav
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      aria-label={t("articles.navLabel")}
      className="mt-16 grid gap-4 sm:grid-cols-2"
    >
      {prev ? (
        <Link
          href={loc(`/articles/${prev.slug}`)}
          className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-green-500/40 hover:shadow-[0_0_40px_rgba(74,222,128,0.12)]"
        >
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-green-300">
            <ArrowLeft className="h-3 w-3" />
            {t("articles.prevPost")}
          </span>
          <h3 className="text-base font-extrabold leading-snug tracking-tight text-white transition-colors group-hover:text-green-300 sm:text-lg">
            {prev.title}
          </h3>
          <div className="mt-auto flex items-center gap-3 border-t border-white/[0.05] pt-3 text-xs text-slate-500">
            <SportBadge sport={prev.sport} />
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {prev.readingMinutes} {t("articles.readTime")}
            </span>
          </div>
        </Link>
      ) : (
        // Empty placeholder so the next-card stays right-aligned on sm+
        <div className="hidden sm:block" />
      )}

      {next ? (
        <Link
          href={loc(`/articles/${next.slug}`)}
          className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-green-500/40 hover:shadow-[0_0_40px_rgba(74,222,128,0.12)] sm:items-end sm:text-right"
        >
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-green-300">
            {t("articles.nextPost")}
            <ArrowRight className="h-3 w-3" />
          </span>
          <h3 className="text-base font-extrabold leading-snug tracking-tight text-white transition-colors group-hover:text-green-300 sm:text-lg">
            {next.title}
          </h3>
          <div className="mt-auto flex items-center gap-3 border-t border-white/[0.05] pt-3 text-xs text-slate-500">
            <SportBadge sport={next.sport} />
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {next.readingMinutes} {t("articles.readTime")}
            </span>
          </div>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}
    </motion.nav>
  );
}

/* ── Share buttons (native share API + fallback) ─────────── */

function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const handleShare = () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}`;
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
    }
  };
  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 transition-all duration-200 hover:border-green-500/40 hover:text-white"
      aria-label={`Share ${slug}`}
    >
      <Share2 className="h-3 w-3" />
      Share
    </button>
  );
}

/* ── Utils ────────────────────────────────────────────────── */

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
