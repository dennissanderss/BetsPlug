"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
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
import { HeroMediaBg } from "@/components/ui/media-bg";
import { PAGE_IMAGES } from "@/data/page-images";
import { Pill } from "@/components/noct/pill";
import { HexBadge } from "@/components/noct/hex-badge";

/* ──────────────────────────────────────────────────────────────
 * Articles archive — NOCTURNE rebuild
 * ────────────────────────────────────────────────────────────── */

type TabId = "all" | Sport;
type Variant = "green" | "purple" | "blue";

const VARIANT_CYCLE: Variant[] = ["green", "purple", "blue"];

interface ArticlesContentProps {
  articles: Article[];
}

export function ArticlesContent({ articles }: ArticlesContentProps) {
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState<TabId>("all");

  const tabs: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
    { id: "all", label: t("articles.allArticles"), icon: LayoutGrid },
    { id: "football", label: t("articles.sportFootball"), icon: Trophy },
  ];

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

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-[#ededed]">
      <SiteNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <HeroMediaBg src={PAGE_IMAGES.articles.hero} alt={PAGE_IMAGES.articles.alt} />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-10 h-[420px] w-[780px] -translate-x-1/2 rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.12)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="section-label mx-auto">
              <Newspaper className="h-3 w-3" />
              {t("articles.badge")}
            </span>
            <h1 className="text-heading mt-4 text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("articles.title")}{" "}
              <span className="gradient-text-green">insights</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#a3a9b8] sm:text-lg">
              {t("articles.subtitle")}
            </p>
          </div>
        </div>
      </section>

      <main className="relative z-10 py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-40 h-[360px] w-[480px] rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.08)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6">
          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12 flex justify-center sm:mb-14"
          >
            <div
              role="tablist"
              aria-label="Filter articles by category"
              className="no-scrollbar flex w-full max-w-full items-center gap-2 overflow-x-auto sm:w-auto"
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
                    className="shrink-0"
                  >
                    <Pill
                      tone={isActive ? "active" : "default"}
                      className="inline-flex items-center gap-2 px-4 py-2"
                    >
                      {Icon ? (
                        <Icon className="h-3.5 w-3.5" />
                      ) : (
                        <SportIcon sport={tab.id as Sport} className="h-3.5 w-3.5" />
                      )}
                      <span>{tab.label}</span>
                    </Pill>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="card-neon mx-auto max-w-lg p-10 text-center">
              <div className="relative">
                <HexBadge variant="green" size="md" className="mx-auto mb-4">
                  <Newspaper className="h-5 w-5" />
                </HexBadge>
                <p className="text-sm text-[#a3a9b8]">{t("articles.empty")}</p>
              </div>
            </div>
          )}

          {/* Grid of articles */}
          {filtered.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((article, i) => (
                  <motion.div
                    key={`${activeTab}-${article.slug}`}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ArticleCard
                      article={article}
                      variant={VARIANT_CYCLE[i % VARIANT_CYCLE.length]}
                    />
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

/* ── Article card — card-neon variant ─────────────────────── */

function ArticleCard({
  article,
  variant,
}: {
  article: Article;
  variant: Variant;
}) {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  return (
    <Link
      href={loc(`/articles/${article.slug}`)}
      className={`card-neon card-neon-${variant} group relative block h-full overflow-hidden transition-transform duration-300 hover:-translate-y-1`}
    >
      <div className="relative">
        <div className="relative aspect-[16/9] overflow-hidden rounded-t-[inherit]">
          <CoverArt
            gradient={article.coverGradient}
            pattern={article.coverPattern}
            sport={article.sport}
            size="md"
          />
        </div>
        <div className="flex flex-1 flex-col gap-4 p-6 sm:p-7">
          <SportBadge sport={article.sport} />
          <h3 className="text-heading text-lg text-[#ededed] transition-colors group-hover:text-[#4ade80] sm:text-xl">
            {article.title}
          </h3>
          <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-[#a3a9b8]">
            {article.excerpt}
          </p>
          <div className="mt-2 flex items-center gap-3 border-t border-white/[0.06] pt-4 text-xs text-[#6b7280]">
            <span>{formatDate(article.publishedAt)}</span>
            <span className="text-[#3a3f4a]">/</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {article.readingMinutes} {t("articles.readTime")}
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-[#4ade80] opacity-0 transition-opacity group-hover:opacity-100">
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
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
