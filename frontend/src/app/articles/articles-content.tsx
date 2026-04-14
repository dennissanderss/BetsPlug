"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Clock,
  ArrowRight,
  Newspaper,
  LayoutGrid,
  Trophy,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import type { Article, Sport } from "@/data/articles";
import { SportIcon, SportBadge, CoverArt } from "./article-visuals";

/* ──────────────────────────────────────────────────────────────
 * Articles archive — public marketing page
 * ────────────────────────────────────────────────────────────── */

type TabId = "all" | Sport;

interface ArticlesContentProps {
  articles: Article[];
}

export function ArticlesContent({ articles }: ArticlesContentProps) {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const [activeTab, setActiveTab] = useState<TabId>("all");

  const tabs: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
    { id: "all", label: t("articles.allArticles"), icon: LayoutGrid },
    { id: "football", label: t("articles.sportFootball"), icon: Trophy },
  ];

  // Sort newest first
  const sorted = useMemo(
    () =>
      [...articles].sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      ),
    [articles]
  );

  const filtered = useMemo(() => {
    if (activeTab === "all") return sorted;
    return sorted.filter((a) => a.sport === activeTab);
  }, [sorted, activeTab]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-slate-900">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-[#0f1420] to-background" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(74,222,128,0.3) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute left-1/2 top-40 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-green-500/[0.04] blur-[150px]" />
        <div className="absolute -left-32 top-[60vh] h-[320px] w-[320px] rounded-full bg-emerald-500/[0.03] blur-[120px]" />
        <div className="absolute -right-32 top-[30vh] h-[320px] w-[320px] rounded-full bg-green-500/[0.03] blur-[120px]" />
      </div>

      <SiteNav />

      <main className="relative z-10 pt-36 pb-24 sm:pt-40">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          {/* Hero heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mb-10 max-w-3xl text-center sm:mb-14"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-700">
              <Newspaper className="h-3.5 w-3.5" />
              {t("articles.badge")}
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              <span className="gradient-text">{t("articles.title")}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              {t("articles.subtitle")}
            </p>
          </motion.div>

          {/* Sport tab filters */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10 flex justify-center sm:mb-14"
          >
            <div
              role="tablist"
              aria-label="Filter articles by category"
              className="no-scrollbar flex w-full max-w-full items-center gap-2 overflow-x-auto rounded-full border border-slate-200 bg-white p-1.5 shadow-sm sm:w-auto sm:gap-1"
            >
              {tabs.map((tab) => {
                const Icon = tab.id === "all" ? LayoutGrid : undefined;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 sm:px-5 sm:text-sm ${
                      isActive
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-[0_0_20px_rgba(74,222,128,0.2)]"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {Icon ? (
                      <Icon className="h-4 w-4" />
                    ) : (
                      <SportIcon sport={tab.id as Sport} className="h-4 w-4" />
                    )}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <Newspaper className="mx-auto mb-4 h-10 w-10 text-slate-400" />
              <p className="text-sm text-slate-500">{t("articles.empty")}</p>
            </div>
          )}

          {/* Featured article */}
          {featured && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`featured-${activeTab}-${featured.slug}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="mb-10 sm:mb-14"
              >
                <FeaturedCard article={featured} />
              </motion.div>
            </AnimatePresence>
          )}

          {/* Grid of remaining articles */}
          {rest.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {rest.map((article) => (
                  <motion.div
                    key={`${activeTab}-${article.slug}`}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{
                      duration: 0.35,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <ArticleCard article={article} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <BetsPlugFooter />
    </div>
  );
}

/* ── Featured card (wide) ─────────────────────────────────── */

function FeaturedCard({ article }: { article: Article }) {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  return (
    <Link
      href={loc(`/articles/${article.slug}`)}
      className="group relative grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-green-500/40 hover:shadow-lg hover:shadow-slate-200/50 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
    >
      {/* Cover art */}
      <div className="relative aspect-[16/9] overflow-hidden lg:aspect-auto lg:min-h-[360px]">
        <CoverArt
          gradient={article.coverGradient}
          pattern={article.coverPattern}
          sport={article.sport}
          size="lg"
        />
      </div>

      {/* Text */}
      <div className="relative flex flex-col justify-center gap-5 p-6 sm:p-8 lg:p-10">
        <SportBadge sport={article.sport} />
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
          {article.title}
        </h2>
        <p className="line-clamp-3 text-sm leading-relaxed text-slate-600 sm:text-base">
          {article.excerpt}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          <span>{formatDate(article.publishedAt)}</span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {article.readingMinutes} {t("articles.readTime")}
          </span>
        </div>
        <span className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-green-700 transition-all duration-300 group-hover:bg-green-100 group-hover:text-green-800">
          Read article
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

/* ── Article card (grid) ──────────────────────────────────── */

function ArticleCard({ article }: { article: Article }) {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  return (
    <Link
      href={loc(`/articles/${article.slug}`)}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-500/40 hover:shadow-lg hover:shadow-slate-200/50"
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
        <h3 className="text-lg font-extrabold leading-snug tracking-tight text-slate-900 group-hover:text-green-700 sm:text-xl">
          {article.title}
        </h3>
        <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-slate-600">
          {article.excerpt}
        </p>
        <div className="mt-2 flex items-center gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500">
          <span>{formatDate(article.publishedAt)}</span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {article.readingMinutes} {t("articles.readTime")}
          </span>
        </div>
      </div>
    </Link>
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
