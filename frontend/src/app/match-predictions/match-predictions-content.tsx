"use client";

import React from "react";
import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Sparkles,
  Lock,
  Clock,
  Shield,
  Zap,
  ArrowRight,
  TrendingUp,
  Activity,
  Eye,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { api } from "@/lib/api";
import type { Fixture } from "@/types/api";
import {
  FreeMatchCard,
  LockedMatchCard,
  LockedSkeleton,
  FreeSkeleton,
} from "@/components/match-predictions/match-cards";
import { UnlockBanner } from "@/components/match-predictions/unlock-banner";
import {
  FREE_PICKS,
  LOCKED_PREVIEW,
} from "@/components/match-predictions/shared";
import { useFreeMatchIds } from "@/components/match-predictions/use-free-match-ids";
import { HeroMediaBg, CtaMediaBg } from "@/components/ui/media-bg";
import { PAGE_IMAGES } from "@/data/page-images";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

/* ──────────────────────────────────────────────────────────────
 * Match Predictions — NOCTURNE rebuild
 * ────────────────────────────────────────────────────────────── */

export function MatchPredictionsContent({ faqSlot }: { faqSlot?: React.ReactNode }) {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  const { freeMatchIds, isLoadingFreeIds } = useFreeMatchIds();

  const fixturesQuery = useQuery({
    queryKey: ["match-predictions-public", 7],
    queryFn: () => api.getFixturesUpcoming(7),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    retry: 2,
  });

  const fixtures = fixturesQuery.data?.fixtures ?? [];

  const upcoming = useMemo(() => {
    const now = Date.now();
    return fixtures
      .filter((f) => {
        if (f.status !== "scheduled") return false;
        const t = new Date(f.scheduled_at).getTime();
        return Number.isFinite(t) && t > now;
      })
      .sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
      );
  }, [fixtures]);

  const free: Fixture[] = useMemo(
    () => upcoming.filter((f) => freeMatchIds.has(f.id)),
    [upcoming, freeMatchIds],
  );
  const lockedPool = useMemo(() => {
    const withPred = upcoming.filter((f) => !freeMatchIds.has(f.id) && f.prediction !== null);
    const withoutPred = upcoming.filter((f) => !freeMatchIds.has(f.id) && f.prediction === null);
    return [...withPred, ...withoutPred].slice(0, LOCKED_PREVIEW);
  }, [upcoming, freeMatchIds]);

  const isLoading = fixturesQuery.isLoading || isLoadingFreeIds;
  const isError = fixturesQuery.isError;
  const hasFree = free.length > 0;

  const avgConf = useMemo(() => {
    if (free.length === 0) return null;
    const sum = free.reduce(
      (acc, f) => acc + (f.prediction?.confidence ?? 0),
      0,
    );
    return Math.round((sum / free.length) * 100);
  }, [free]);

  const stats: {
    label: string;
    value: string;
    icon: typeof Sparkles;
    variant: "green" | "purple" | "blue";
  }[] = [
    { label: t("matchPred.statFree"), value: String(free.length || FREE_PICKS), icon: Sparkles, variant: "green" },
    { label: t("matchPred.statUpcoming"), value: String(upcoming.length), icon: Clock, variant: "blue" },
    {
      label: t("matchPred.statLocked"),
      value: String(Math.max(upcoming.length - free.length, LOCKED_PREVIEW)),
      icon: Lock,
      variant: "purple",
    },
    {
      label: t("matchPred.statAvgConf"),
      value: avgConf !== null ? `${avgConf}%` : " - ",
      icon: TrendingUp,
      variant: "green",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-[#ededed]">
      <SiteNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <HeroMediaBg src={PAGE_IMAGES["match-predictions"].hero} alt={PAGE_IMAGES["match-predictions"].alt} />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-10 h-[420px] w-[min(780px,100vw)] -translate-x-1/2 rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.12)", filter: "blur(140px)" }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="section-label mx-auto"
          >
            <Sparkles className="h-3 w-3" />
            {t("matchPred.eyebrow")}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-heading mt-5 text-2xl text-[#ededed] sm:text-3xl lg:text-5xl"
          >
            {t("matchPred.title")}{" "}
            <span className="gradient-text-green">live</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-[#a3a9b8] sm:text-lg"
          >
            {t("matchPred.subtitle")}
          </motion.p>

          {/* Trust pills */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-2"
          >
            <Pill tone="default" className="inline-flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-[#4ade80]" />
              {t("matchPred.trust1")}
            </Pill>
            <Pill tone="default" className="inline-flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-[#60a5fa]" />
              {t("matchPred.trust2")}
            </Pill>
            <Pill tone="default" className="inline-flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-[#4ade80]" />
              {t("matchPred.trust3")}
            </Pill>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {stats.map(({ label, value, icon: Icon, variant }) => (
              <div
                key={label}
                className={`card-neon card-neon-${variant} relative overflow-hidden px-3 py-5 text-center`}
              >
                <div className="relative flex flex-col items-center gap-2">
                  <HexBadge variant={variant} size="sm">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </HexBadge>
                  <span className="text-stat text-2xl leading-none text-[#ededed]">
                    {value}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6b7280]">
                    {label}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Free picks ── */}
      <section className="relative py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-[360px] w-[min(520px,90vw)] rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.1)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 sm:mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="section-label">
                <Sparkles className="h-3 w-3" />
                {t("matchPred.statFree")}
              </span>
              <h2 className="text-heading mt-4 text-2xl text-[#ededed] sm:text-3xl lg:text-5xl">
                {t("matchPred.freeHeading")}
              </h2>
              <p className="mt-3 max-w-xl text-base text-[#a3a9b8]">
                {t("matchPred.freeSub")}
              </p>
            </div>
            {fixturesQuery.isFetching && !isLoading && (
              <button
                type="button"
                onClick={() => fixturesQuery.refetch()}
                className="btn-glass hidden items-center gap-1.5 sm:inline-flex"
              >
                <RefreshCw className="h-3 w-3 animate-spin" />
                {t("matchPred.refresh")}
              </button>
            )}
          </div>

          {isLoading && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: FREE_PICKS }).map((_, i) => (
                <FreeSkeleton key={i} />
              ))}
            </div>
          )}

          {!isLoading && isError && (
            <div className="card-neon card-neon-purple relative overflow-hidden p-6">
              <div className="relative flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <HexBadge variant="purple" size="md">
                  <AlertTriangle className="h-5 w-5" />
                </HexBadge>
                <div className="flex-1">
                  <p className="text-heading text-lg text-[#ededed]">
                    {t("matchPred.errorTitle")}
                  </p>
                  <p className="mt-1 text-sm text-[#a3a9b8]">
                    {t("matchPred.errorDesc")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fixturesQuery.refetch()}
                  className="btn-glass inline-flex items-center gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {t("matchPred.refresh")}
                </button>
              </div>
            </div>
          )}

          {!isLoading && !isError && !hasFree && (
            <div className="card-neon card-neon-green relative overflow-hidden p-10 text-center">
              <div className="relative flex flex-col items-center gap-4">
                <HexBadge variant="green" size="lg">
                  <Clock className="h-7 w-7" />
                </HexBadge>
                <div>
                  <h3 className="text-heading text-xl text-[#ededed]">
                    {t("matchPred.emptyTitle")}
                  </h3>
                  <p className="mt-2 max-w-md text-sm text-[#a3a9b8]">
                    {t("matchPred.emptyDesc")}
                  </p>
                </div>
                <Link
                  href={loc("/track-record")}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {t("matchPred.emptyCta")}
                </Link>
              </div>
            </div>
          )}

          {!isLoading && hasFree && (
            <div className="flex flex-col gap-3">
              {free.map((f) => (
                <FreeMatchCard key={f.id} fixture={f} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Unlock banner ── */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <UnlockBanner />
        </div>
      </section>

      {/* ── Locked pool ── */}
      <section className="relative py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-10 h-[360px] w-[min(520px,90vw)] rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.1)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 sm:mb-14">
            <span className="section-label">
              <Lock className="h-3 w-3" />
              {t("matchPred.statLocked")}
            </span>
            <h2 className="text-heading mt-4 text-2xl text-[#ededed] sm:text-3xl lg:text-5xl">
              {t("matchPred.lockedHeading")}
            </h2>
            <p className="mt-3 max-w-xl text-base text-[#a3a9b8]">
              {t("matchPred.lockedSub")}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {lockedPool.length > 0
              ? lockedPool.map((f) => (
                  <LockedMatchCard key={f.id} fixture={f} />
                ))
              : Array.from({ length: LOCKED_PREVIEW }).map((_, i) => (
                  <LockedSkeleton key={i} />
                ))}
          </div>
        </div>
      </section>

      {faqSlot}

      {/* ── Final CTA ── */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="card-neon card-neon-green halo-green relative overflow-hidden p-6 sm:p-10 md:p-16">
            <CtaMediaBg
              src={PAGE_IMAGES["match-predictions"].cta}
              alt={PAGE_IMAGES["match-predictions"].alt}
              pattern={PAGE_IMAGES["match-predictions"].pattern}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-[260px] w-[260px] rounded-full"
              style={{ background: "hsl(var(--accent-green) / 0.28)", filter: "blur(80px)" }}
            />
            <div className="relative text-center">
              <HexBadge variant="green" size="lg" className="mx-auto mb-5">
                <Sparkles className="h-7 w-7" />
              </HexBadge>
              <h2 className="text-heading text-2xl text-[#ededed] sm:text-3xl lg:text-5xl">
                {t("matchPred.ctaFinalTitle")}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#a3a9b8]">
                {t("matchPred.ctaFinalDesc")}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href={loc("/checkout")}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {t("matchPred.ctaFinalButton")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={loc("/checkout")}
                  className="btn-ghost inline-flex items-center gap-2"
                >
                  {t("matchPred.ctaFinalSecondary")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BetsPlugFooter />
    </div>
  );
}
