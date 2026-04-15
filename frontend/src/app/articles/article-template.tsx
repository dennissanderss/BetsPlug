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
    // overflow-x-clip (not -hidden) so position:sticky still works for the
    // right-column promo banner. -hidden implicitly forces overflow-y:auto on
    // this element which creates a scroll container and breaks sticky.
    <div className="relative min-h-screen overflow-x-clip bg-[#050505] text-[#ededed]">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-20" />

      <SiteNav />

      <main className="relative z-10 pt-28 pb-24 sm:pt-32">
        {/* ── Wider container ── */}
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#707070]"
          >
            <Link
              href={loc("/")}
              className="transition-colors hover:text-[#4ade80]"
            >
              {t("articles.breadcrumbHome")}
            </Link>
            <span>/</span>
            <Link
              href={loc("/articles")}
              className="transition-colors hover:text-[#4ade80]"
            >
              {t("articles.breadcrumbBlog")}
            </Link>
            <span>/</span>
            <span className="truncate text-[#a3a3a3]">{article.title}</span>
          </nav>

          {/* Back link */}
          <Link
            href={loc("/articles")}
            className="mb-6 inline-flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#4ade80] transition-colors hover:text-[#86efac]"
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
                <h1 className="text-display text-3xl leading-[1.05] text-white sm:text-4xl md:text-5xl">
                  {article.title}
                </h1>
                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-widest text-[#707070]">
                  <span>
                    {t("articles.byline")}{" "}
                    <span className="text-[#ededed]">{article.author}</span>
                  </span>
                  <span>/</span>
                  <span>{formatDate(article.publishedAt)}</span>
                  <span>/</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
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
                className="relative mb-10 aspect-[16/9] overflow-hidden border border-white/10"
              >
                <span className="pointer-events-none absolute left-[-1px] top-[-1px] z-10 h-3 w-3 border-l-2 border-t-2 border-[#4ade80]" />
                <span className="pointer-events-none absolute right-[-1px] bottom-[-1px] z-10 h-3 w-3 border-r-2 border-b-2 border-[#4ade80]" />
                <CoverArt
                  gradient={article.coverGradient}
                  pattern={article.coverPattern}
                  sport={article.sport}
                  size="lg"
                  imageUrl={article.coverImage}
                  imageAlt={article.coverImageAlt ?? article.title}
                />
              </motion.div>

              {/* TL;DR */}
              {article.tldr && (
                <motion.aside
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  className="relative mb-10 border-l-2 border-[#4ade80] bg-[#4ade80]/[0.05] p-5 sm:p-6"
                >
                  <p className="mb-2 font-mono text-[10px] font-black uppercase tracking-widest text-[#4ade80]">
                    {t("articles.tldr")}
                  </p>
                  <p className="text-base leading-relaxed text-[#ededed]">
                    {article.tldr}
                  </p>
                </motion.aside>
              )}

              {/* Body */}
              <div className="space-y-6 text-base leading-[1.8] text-[#cfcfcf] sm:text-[17px]">
                {article.blocks.map((block, i) => (
                  <BlockRenderer key={i} block={block} />
                ))}
              </div>

              {/* ── Mobile-only inline promo (sidebar is hidden <lg) ── */}
              <div className="lg:hidden">
                <InlinePromoBanner />
              </div>

              {/* Share + footer meta */}
              <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.08] pt-6">
                <SportBadge sport={article.sport} />
                <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-[#707070]">
                  <Share2 className="h-3.5 w-3.5" />
                  <span className="font-black text-[#4ade80]">
                    {t("articles.share")}
                  </span>
                  <ShareButtons title={article.title} slug={article.slug} />
                </div>
              </div>
            </article>

            {/* ── Right sticky sidebar (≥lg only) ──
                top-32 (= 8rem / 128px) clears the fixed SiteNav
                (lg height ≈ 96–108px) plus a comfortable gap so the
                card never touches the header on scroll. */}
            <aside className="hidden lg:block">
              <div className="sticky top-32">
                <StickyPromoBanner />
              </div>
            </aside>
          </div>

          {/* ── Prev / Next navigation (always rendered) ── */}
          <PrevNextNav prev={prev} next={next} />

          {/* ── Related articles ── */}
          {related.length > 0 && (
            <section className="mt-20">
              <span className="section-label">
                {t("articles.related")}
              </span>
              <h2 className="text-display mb-8 text-2xl text-white sm:text-3xl">
                {t("articles.related")}
              </h2>
              <div className="grid gap-[1px] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-3">
                {related.map((a) => (
                  <Link
                    key={a.slug}
                    href={loc(`/articles/${a.slug}`)}
                    className="group relative flex h-full flex-col overflow-hidden bg-[#0a0a0a] transition-all duration-200 hover:bg-[#111]"
                  >
                    <span className="pointer-events-none absolute left-0 top-0 z-10 h-3 w-3 border-l-2 border-t-2 border-[#4ade80] opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className="pointer-events-none absolute right-0 bottom-0 z-10 h-3 w-3 border-r-2 border-b-2 border-[#4ade80] opacity-0 transition-opacity group-hover:opacity-100" />
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
                      <h3 className="text-display text-base text-white transition-colors group-hover:text-[#4ade80] sm:text-lg">
                        {a.title}
                      </h3>
                      <div className="mt-auto flex items-center gap-3 border-t border-white/[0.08] pt-3 font-mono text-[10px] uppercase tracking-widest text-[#707070]">
                        <span>{formatDate(a.publishedAt)}</span>
                        <span>/</span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
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
        <h2 className="text-display mt-10 text-2xl text-white sm:text-3xl">
          {block.text}
        </h2>
      );
    case "paragraph":
      return (
        <p>
          <RichText text={block.text} />
        </p>
      );
    case "quote":
      return (
        <blockquote className="relative my-8 border-l-2 border-[#4ade80] bg-[#4ade80]/[0.05] py-5 pl-6 pr-4 text-[#ededed]">
          <p className="text-lg font-medium italic leading-relaxed">
            &ldquo;<RichText text={block.text} />&rdquo;
          </p>
          {block.cite && (
            <footer className="mt-3 font-mono text-[10px] font-black uppercase tracking-widest text-[#4ade80]">
              / {block.cite}
            </footer>
          )}
        </blockquote>
      );
    case "list":
      return (
        <ul className="space-y-3 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center border border-[#4ade80]">
                <CheckCircle2 className="h-2.5 w-2.5 text-[#4ade80]" strokeWidth={3} />
              </span>
              <span>
                <RichText text={item} />
              </span>
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

/* ── Inline markdown-link parser ─────────────────────────────
 * Parses `[text](/path)` and `[text](https://example.com)` into
 * real links. Internal paths (starting with "/") use Next.js
 * <Link> for client-side navigation + localized href, while
 * external URLs render as <a target="_blank" rel="noopener">.
 *
 * This is intentionally minimal — no bold/italic/inline-code —
 * because the block editor can always be extended with dedicated
 * block types later. The goal is to make automated articles able
 * to include internal links for link-juice distribution without
 * restructuring the content model.
 * ────────────────────────────────────────────────────────── */

const INLINE_LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;

function RichText({ text }: { text: string }) {
  const loc = useLocalizedHref();
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  // Reset regex state in case the pattern is reused across renders
  INLINE_LINK_RE.lastIndex = 0;

  while ((match = INLINE_LINK_RE.exec(text)) !== null) {
    const [full, label, href] = match;
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const isExternal = /^https?:\/\//i.test(href);
    if (isExternal) {
      parts.push(
        <a
          key={`link-${key++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-[#4ade80] underline decoration-[#4ade80]/40 underline-offset-4 transition-colors hover:text-[#86efac]"
        >
          {label}
        </a>
      );
    } else {
      parts.push(
        <Link
          key={`link-${key++}`}
          href={loc(href)}
          className="font-bold text-[#4ade80] underline decoration-[#4ade80]/40 underline-offset-4 transition-colors hover:text-[#86efac]"
        >
          {label}
        </Link>
      );
    }
    lastIndex = match.index + full.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
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
      className="relative overflow-hidden border border-[#4ade80]/30 bg-[#0a0a0a] p-6"
    >
      <span className="pointer-events-none absolute left-[-1px] top-[-1px] h-3 w-3 border-l-2 border-t-2 border-[#4ade80]" />
      <span className="pointer-events-none absolute right-[-1px] bottom-[-1px] h-3 w-3 border-r-2 border-b-2 border-[#4ade80]" />

      <div className="relative flex flex-col gap-5">
        <span className="section-label w-fit">
          <Sparkles className="h-3 w-3" />
          {t("articles.ctaBadge")}
        </span>
        <h3 className="text-display text-xl text-white">
          {t("articles.ctaTitle")}
        </h3>
        <p className="text-sm leading-relaxed text-[#a3a3a3]">
          {t("articles.ctaSubtitle")}
        </p>
        <Link
          href={`${loc("/checkout")}?plan=bronze`}
          className="btn-lime w-full"
        >
          {String(t("articles.ctaButton")).toUpperCase()} →
        </Link>
        <span className="text-center font-mono text-[10px] uppercase tracking-widest text-[#707070]">
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
      className="relative my-12 overflow-hidden border border-[#4ade80]/30 bg-[#0a0a0a] p-6 sm:p-8"
    >
      <span className="pointer-events-none absolute left-[-1px] top-[-1px] h-3 w-3 border-l-2 border-t-2 border-[#4ade80]" />
      <span className="pointer-events-none absolute right-[-1px] bottom-[-1px] h-3 w-3 border-r-2 border-b-2 border-[#4ade80]" />

      <div className="relative grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <span className="section-label mb-3">
            <Sparkles className="h-3 w-3" />
            {t("articles.ctaBadge")}
          </span>
          <h3 className="text-display text-xl text-white sm:text-2xl">
            {t("articles.ctaTitle")}
          </h3>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#a3a3a3] sm:text-base">
            {t("articles.ctaSubtitle")}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Link
            href={`${loc("/checkout")}?plan=bronze`}
            className="btn-lime"
          >
            {String(t("articles.ctaButton")).toUpperCase()} →
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#707070]">
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

  // No prev AND no next → render a single wide "Browse all articles"
  // CTA so the bottom of every article still has a navigation hand-off,
  // even when only one article exists in the archive.
  if (!prev && !next) {
    return (
      <motion.nav
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        aria-label={t("articles.navLabel")}
        className="mt-16"
      >
        <Link
          href={loc("/articles")}
          className="group relative flex flex-col items-center gap-3 overflow-hidden border border-white/10 bg-[#0a0a0a] p-8 text-center transition-all duration-200 hover:border-[#4ade80]/40 hover:bg-[#111]"
        >
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#4ade80]">
            <ArrowLeft className="h-3 w-3" />
            {t("articles.back")}
          </span>
          <h3 className="text-display text-lg text-white transition-colors group-hover:text-[#4ade80] sm:text-xl">
            {t("articles.related")}
          </h3>
        </Link>
      </motion.nav>
    );
  }

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
          className="group relative flex h-full flex-col gap-3 overflow-hidden border border-white/10 bg-[#0a0a0a] p-6 transition-all duration-200 hover:border-[#4ade80]/40 hover:bg-[#111]"
        >
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#4ade80]">
            <ArrowLeft className="h-3 w-3" />
            {t("articles.prevPost")}
          </span>
          <h3 className="text-display text-base text-white transition-colors group-hover:text-[#4ade80] sm:text-lg">
            {prev.title}
          </h3>
          <div className="mt-auto flex items-center gap-3 border-t border-white/[0.08] pt-3 font-mono text-[10px] uppercase tracking-widest text-[#707070]">
            <SportBadge sport={prev.sport} />
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
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
          className="group relative flex h-full flex-col gap-3 overflow-hidden border border-white/10 bg-[#0a0a0a] p-6 transition-all duration-200 hover:border-[#4ade80]/40 hover:bg-[#111] sm:items-end sm:text-right"
        >
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#4ade80]">
            {t("articles.nextPost")}
            <ArrowRight className="h-3 w-3" />
          </span>
          <h3 className="text-display text-base text-white transition-colors group-hover:text-[#4ade80] sm:text-lg">
            {next.title}
          </h3>
          <div className="mt-auto flex items-center gap-3 border-t border-white/[0.08] pt-3 font-mono text-[10px] uppercase tracking-widest text-[#707070]">
            <SportBadge sport={next.sport} />
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
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
      className="inline-flex items-center gap-1.5 border border-white/10 bg-[#0a0a0a] px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#a3a3a3] transition-all duration-200 hover:border-[#4ade80]/50 hover:text-[#4ade80]"
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
