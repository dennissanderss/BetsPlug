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
  Quote as QuoteIcon,
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
import { CtaMediaBg } from "@/components/ui/media-bg";
import { PAGE_IMAGES } from "@/data/page-images";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

/* ──────────────────────────────────────────────────────────────
 * ArticleTemplate — NOCTURNE rebuild of the single-article layout.
 * ────────────────────────────────────────────────────────────── */

type Variant = "green" | "purple" | "blue";
const CYCLE: Variant[] = ["green", "purple", "blue"];

export function ArticleTemplate({ article }: { article: Article }) {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const related = getRelatedArticles(article, 3);
  const { prev, next } = getAdjacentArticles(article);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-[#ededed]">
      <SiteNav />

      <main className="relative z-10 pt-28 pb-24 sm:pt-32">
        {/* Ambient glow blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-10 h-[400px] w-[780px] -translate-x-1/2 rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.08)", filter: "blur(160px)" }}
        />

        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
          {/* Breadcrumbs */}
          <nav
            aria-label={t("a11y.breadcrumb")}
            className="mb-6 flex items-center gap-2 text-xs text-[#6b7280]"
          >
            <Link href={loc("/")} className="transition-colors hover:text-[#4ade80]">
              {t("articles.breadcrumbHome")}
            </Link>
            <span className="text-[#3a3f4a]">/</span>
            <Link href={loc("/articles")} className="transition-colors hover:text-[#4ade80]">
              {t("articles.breadcrumbBlog")}
            </Link>
            <span className="text-[#3a3f4a]">/</span>
            <span className="truncate text-[#a3a9b8]">{article.title}</span>
          </nav>

          {/* Back link */}
          <Link
            href={loc("/articles")}
            className="btn-ghost mb-6 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("articles.back")}
          </Link>

          {/* Two-column grid */}
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
            {/* Main column */}
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
                <h1 className="text-display text-3xl leading-[1.1] text-[#ededed] sm:text-4xl md:text-5xl">
                  {article.title}
                </h1>
                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#6b7280]">
                  <span>
                    {t("articles.byline")}{" "}
                    <span className="text-[#ededed]">{article.author}</span>
                  </span>
                  <span className="text-[#3a3f4a]">/</span>
                  <span>{formatDate(article.publishedAt)}</span>
                  <span className="text-[#3a3f4a]">/</span>
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
                transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="glass-panel-lifted relative mb-10 aspect-[16/9] overflow-hidden"
              >
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
                  className="card-neon card-neon-green relative mb-10 overflow-hidden p-6 sm:p-7"
                >
                  <div className="relative">
                    <span className="section-label mb-3">
                      <Sparkles className="h-3 w-3" />
                      {t("articles.tldr")}
                    </span>
                    <p className="text-base leading-relaxed text-[#ededed]">
                      {article.tldr}
                    </p>
                  </div>
                </motion.aside>
              )}

              {/* Body */}
              <div className="space-y-6 text-base leading-[1.8] text-[#ededed] sm:text-[17px]">
                {article.blocks.map((block, i) => (
                  <BlockRenderer key={i} block={block} />
                ))}
              </div>

              {/* Mobile-only inline promo */}
              <div className="lg:hidden">
                <InlinePromoBanner />
              </div>

              {/* Share + footer meta */}
              <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.08] pt-6">
                <SportBadge sport={article.sport} />
                <div className="flex items-center gap-3 text-xs text-[#6b7280]">
                  <Share2 className="h-3.5 w-3.5" />
                  <span className="font-semibold text-[#4ade80]">
                    {t("articles.share")}
                  </span>
                  <ShareButtons title={article.title} slug={article.slug} />
                </div>
              </div>
            </article>

            {/* Sticky sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-32">
                <StickyPromoBanner />
              </div>
            </aside>
          </div>

          {/* Prev / Next */}
          <PrevNextNav prev={prev} next={next} />

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-20">
              <span className="section-label mb-4">
                <Sparkles className="h-3 w-3" />
                {t("articles.related")}
              </span>
              <h2 className="text-heading mb-8 text-2xl text-[#ededed] sm:text-3xl">
                {t("articles.related")}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((a, i) => (
                  <Link
                    key={a.slug}
                    href={loc(`/articles/${a.slug}`)}
                    className={`card-neon card-neon-${CYCLE[i % CYCLE.length]} group block h-full overflow-hidden transition-transform duration-300 hover:-translate-y-1`}
                  >
                    <div className="relative">
                      <div className="relative aspect-[16/9] overflow-hidden rounded-t-[inherit]">
                        <CoverArt
                          gradient={a.coverGradient}
                          pattern={a.coverPattern}
                          sport={a.sport}
                          size="md"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-3 p-6">
                        <SportBadge sport={a.sport} />
                        <h3 className="text-heading text-base text-[#ededed] transition-colors group-hover:text-[#4ade80] sm:text-lg">
                          {a.title}
                        </h3>
                        <div className="mt-auto flex items-center gap-3 border-t border-white/[0.06] pt-3 text-xs text-[#6b7280]">
                          <span>{formatDate(a.publishedAt)}</span>
                          <span className="text-[#3a3f4a]">/</span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {a.readingMinutes} {t("articles.readTime")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ═══ Keep exploring — blog → money page funnel ═══
             SEO reasoning: blog posts drive organic traffic but
             without internal links out, they don't pass equity to
             the pages that convert (predictions / pricing / track
             record). This cluster gives every article a deliberate
             exit ramp to each of our four money-page clusters, with
             keyword-rich anchor text. */}
          <section className="mt-20">
            <span className="section-label mb-4">
              <Sparkles className="h-3 w-3" />
              Keep exploring
            </span>
            <h2 className="text-heading mb-8 text-2xl text-[#ededed] sm:text-3xl">
              Put the theory to work
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href={loc("/match-predictions")}
                className="group block rounded-xl border p-5 transition-colors hover:border-[#4ade80]/40"
                style={{
                  borderColor: "hsl(0 0% 100% / 0.06)",
                  background: "hsl(230 16% 10% / 0.4)",
                }}
              >
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#4ade80]">
                  Predictions
                </div>
                <h3 className="text-heading text-base text-[#ededed] transition-colors group-hover:text-[#4ade80]">
                  Today&rsquo;s AI football predictions
                </h3>
                <p className="mt-2 text-xs text-[#a3a9b8]">
                  Pre-match locked picks across 15+ leagues with live confidence scores.
                </p>
              </Link>

              <Link
                href={loc("/learn")}
                className="group block rounded-xl border p-5 transition-colors hover:border-[#4ade80]/40"
                style={{
                  borderColor: "hsl(0 0% 100% / 0.06)",
                  background: "hsl(230 16% 10% / 0.4)",
                }}
              >
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#4ade80]">
                  Learn
                </div>
                <h3 className="text-heading text-base text-[#ededed] transition-colors group-hover:text-[#4ade80]">
                  The math behind every pick
                </h3>
                <p className="mt-2 text-xs text-[#a3a9b8]">
                  Elo, Poisson, Kelly, value betting — read the deep-dive pillars.
                </p>
              </Link>

              <Link
                href={loc("/bet-types")}
                className="group block rounded-xl border p-5 transition-colors hover:border-[#4ade80]/40"
                style={{
                  borderColor: "hsl(0 0% 100% / 0.06)",
                  background: "hsl(230 16% 10% / 0.4)",
                }}
              >
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#4ade80]">
                  Bet markets
                </div>
                <h3 className="text-heading text-base text-[#ededed] transition-colors group-hover:text-[#4ade80]">
                  BTTS, Over/Under, DNB decoded
                </h3>
                <p className="mt-2 text-xs text-[#a3a9b8]">
                  How each market is priced and where our model finds value.
                </p>
              </Link>

              <Link
                href={loc("/track-record")}
                className="group block rounded-xl border p-5 transition-colors hover:border-[#4ade80]/40"
                style={{
                  borderColor: "hsl(0 0% 100% / 0.06)",
                  background: "hsl(230 16% 10% / 0.4)",
                }}
              >
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#4ade80]">
                  Proof
                </div>
                <h3 className="text-heading text-base text-[#ededed] transition-colors group-hover:text-[#4ade80]">
                  Our public track record
                </h3>
                <p className="mt-2 text-xs text-[#a3a9b8]">
                  Every pick — wins and losses — logged before kickoff.
                </p>
              </Link>
            </div>
          </section>
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
        <h2 className="text-heading mt-10 text-2xl text-[#ededed] sm:text-3xl">
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
        <div className="card-neon card-neon-purple relative my-8 overflow-hidden p-6">
          <div className="relative flex gap-4">
            <QuoteIcon className="h-6 w-6 shrink-0 text-[#d8b4fe]" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-lg font-medium italic leading-relaxed text-[#ededed]">
                &ldquo;<RichText text={block.text} />&rdquo;
              </p>
              {block.cite && (
                <div className="mt-4">
                  <Pill tone="purple">{block.cite}</Pill>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    case "list":
      return (
        <ul className="space-y-3 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <CheckCircle2
                className="mt-1 h-4 w-4 flex-shrink-0 text-[#4ade80]"
                strokeWidth={2.25}
              />
              <span className="text-[#ededed]">
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

/* ── Rich text ────────────────────────────────────────────── */

const INLINE_LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;

function RichText({ text }: { text: string }) {
  const loc = useLocalizedHref();
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

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
          className="font-semibold text-[#4ade80] underline decoration-[#4ade80]/40 underline-offset-4 transition-colors hover:text-[#86efac]"
        >
          {label}
        </a>
      );
    } else {
      parts.push(
        <Link
          key={`link-${key++}`}
          href={loc(href)}
          className="font-semibold text-[#4ade80] underline decoration-[#4ade80]/40 underline-offset-4 transition-colors hover:text-[#86efac]"
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

/* ── Sticky sidebar promo ────────────────────────────────── */

function StickyPromoBanner() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="card-neon card-neon-green halo-green relative overflow-hidden p-6"
    >
      <CtaMediaBg
        src={PAGE_IMAGES.article.cta}
        alt={PAGE_IMAGES.article.alt}
        pattern={PAGE_IMAGES.article.pattern}
      />
      <div className="relative flex flex-col gap-4">
        <HexBadge variant="green" size="md">
          <Sparkles className="h-5 w-5" />
        </HexBadge>
        <span className="section-label">
          {t("articles.ctaBadge")}
        </span>
        <h3 className="text-heading text-xl text-[#ededed]">
          {t("articles.ctaTitle")}
        </h3>
        <p className="text-sm leading-relaxed text-[#a3a9b8]">
          {t("articles.ctaSubtitle")}
        </p>
        <Link
          href={`${loc("/checkout")}?plan=bronze`}
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          {t("articles.ctaButton")}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <span className="text-center text-xs text-[#6b7280]">
          {t("articles.ctaNoCard")}
        </span>
      </div>
    </motion.aside>
  );
}

/* ── Inline promo (mobile fallback) ──────────────────────── */

function InlinePromoBanner() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  return (
    <motion.aside
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="card-neon card-neon-green halo-green relative my-12 overflow-hidden p-6 sm:p-8"
    >
      <CtaMediaBg
        src={PAGE_IMAGES.article.cta}
        alt={PAGE_IMAGES.article.alt}
        pattern={PAGE_IMAGES.article.pattern}
      />
      <div className="relative grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <HexBadge variant="green" size="md">
              <Sparkles className="h-5 w-5" />
            </HexBadge>
            <span className="section-label">
              {t("articles.ctaBadge")}
            </span>
          </div>
          <h3 className="text-heading text-xl text-[#ededed] sm:text-2xl">
            {t("articles.ctaTitle")}
          </h3>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#a3a9b8] sm:text-base">
            {t("articles.ctaSubtitle")}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Link
            href={`${loc("/checkout")}?plan=bronze`}
            className="btn-primary inline-flex items-center gap-2"
          >
            {t("articles.ctaButton")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <span className="text-xs text-[#6b7280]">
            {t("articles.ctaNoCard")}
          </span>
        </div>
      </div>
    </motion.aside>
  );
}

/* ── Prev / Next ──────────────────────────────────────────── */

function PrevNextNav({
  prev,
  next,
}: {
  prev?: Article;
  next?: Article;
}) {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

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
          className="card-neon card-neon-green group relative block overflow-hidden p-8 text-center transition-all duration-300 hover:-translate-y-1"
        >
          <div className="relative flex flex-col items-center gap-3">
            <span className="section-label">
              <ArrowLeft className="h-3 w-3" />
              {t("articles.back")}
            </span>
            <h3 className="text-heading text-lg text-[#ededed] transition-colors group-hover:text-[#4ade80] sm:text-xl">
              {t("articles.related")}
            </h3>
          </div>
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
          className="card-neon card-neon-green group relative flex h-full flex-col gap-3 overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1"
        >
          <div className="relative flex flex-col gap-3">
            <span className="section-label">
              <ArrowLeft className="h-3 w-3" />
              {t("articles.prevPost")}
            </span>
            <h3 className="text-heading text-base text-[#ededed] transition-colors group-hover:text-[#4ade80] sm:text-lg">
              {prev.title}
            </h3>
            <div className="mt-auto flex items-center gap-3 border-t border-white/[0.06] pt-3 text-xs text-[#6b7280]">
              <SportBadge sport={prev.sport} />
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {prev.readingMinutes} {t("articles.readTime")}
              </span>
            </div>
          </div>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}

      {next ? (
        <Link
          href={loc(`/articles/${next.slug}`)}
          className="card-neon card-neon-purple group relative flex h-full flex-col gap-3 overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 sm:items-end sm:text-right"
        >
          <div className="relative flex flex-col gap-3 sm:items-end">
            <span className="section-label">
              {t("articles.nextPost")}
              <ArrowRight className="h-3 w-3" />
            </span>
            <h3 className="text-heading text-base text-[#ededed] transition-colors group-hover:text-[#d8b4fe] sm:text-lg">
              {next.title}
            </h3>
            <div className="mt-auto flex items-center gap-3 border-t border-white/[0.06] pt-3 text-xs text-[#6b7280]">
              <SportBadge sport={next.sport} />
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {next.readingMinutes} {t("articles.readTime")}
              </span>
            </div>
          </div>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}
    </motion.nav>
  );
}

/* ── Share button ─────────────────────────────────────────── */

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
    <button type="button" onClick={handleShare} aria-label={`Share ${slug}`}>
      <Pill tone="default" className="inline-flex items-center gap-1.5">
        <Share2 className="h-3 w-3" />
        Share
      </Pill>
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
