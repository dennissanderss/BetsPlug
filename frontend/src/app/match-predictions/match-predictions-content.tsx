"use client";

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

/* ──────────────────────────────────────────────────────────────
 * Match Predictions — public marketing teaser
 * ────────────────────────────────────────────────────────────── */

/* ── Main page content ─────────────────────────────────────── */

export function MatchPredictionsContent() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  const fixturesQuery = useQuery({
    queryKey: ["match-predictions-public", 7],
    queryFn: () => api.getFixturesUpcoming(7),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    retry: 2,
  });

  const fixtures = fixturesQuery.data?.fixtures ?? [];

  // Only upcoming scheduled matches, sorted by kickoff ASC
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
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime(),
      );
  }, [fixtures]);

  // Prefer matches that actually have predictions for the free 3
  const withPred = useMemo(
    () => upcoming.filter((f) => f.prediction !== null),
    [upcoming],
  );
  const withoutPred = useMemo(
    () => upcoming.filter((f) => f.prediction === null),
    [upcoming],
  );

  const free: Fixture[] = withPred.slice(0, FREE_PICKS);
  // Lock the next matches (prefer ones with predictions for realism)
  const lockedPool = [
    ...withPred.slice(FREE_PICKS),
    ...withoutPred,
  ].slice(0, LOCKED_PREVIEW);

  const isLoading = fixturesQuery.isLoading;
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

  const stats = [
    {
      label: t("matchPred.statFree"),
      value: String(free.length || FREE_PICKS),
      icon: Sparkles,
      color: "#4ade80",
    },
    {
      label: t("matchPred.statUpcoming"),
      value: String(upcoming.length),
      icon: Clock,
      color: "#38bdf8",
    },
    {
      label: t("matchPred.statLocked"),
      value: String(
        Math.max(upcoming.length - free.length, LOCKED_PREVIEW),
      ),
      icon: Lock,
      color: "#f59e0b",
    },
    {
      label: t("matchPred.statAvgConf"),
      value: avgConf !== null ? `${avgConf}%` : " - ",
      icon: TrendingUp,
      color: "#a855f7",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a1220] text-slate-100">
      <SiteNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pb-10 pt-28 sm:pt-32">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-green-500/[0.12] blur-[140px]" />
        <div className="pointer-events-none absolute -right-40 -top-20 h-[420px] w-[420px] rounded-full bg-emerald-500/[0.10] blur-[140px]" />

        <div className="relative mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-green-300"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t("matchPred.eyebrow")}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-5 text-balance break-words text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            {t("matchPred.title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-slate-300 sm:text-lg"
          >
            {t("matchPred.subtitle")}
          </motion.p>

          {/* Trust pills */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-slate-400"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
              <Zap className="h-3 w-3 text-green-400" />
              {t("matchPred.trust1")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
              <Activity className="h-3 w-3 text-blue-400" />
              {t("matchPred.trust2")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
              <Shield className="h-3 w-3 text-emerald-400" />
              {t("matchPred.trust3")}
            </span>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="glass-card flex flex-col items-center justify-center gap-1 px-3 py-4 text-center"
              >
                <Icon className="h-4 w-4" style={{ color }} />
                <span className="mt-1 text-2xl font-extrabold leading-none tabular-nums text-white">
                  {value}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Free 3 predictions ── */}
      <section className="relative px-4 pb-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {t("matchPred.freeHeading")}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {t("matchPred.freeSub")}
              </p>
            </div>
            {fixturesQuery.isFetching && !isLoading && (
              <button
                type="button"
                onClick={() => fixturesQuery.refetch()}
                className="hidden items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition hover:border-green-500/40 hover:text-green-300 sm:inline-flex"
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
            <div className="glass-card flex flex-col items-start gap-3 border-amber-500/30 bg-amber-500/[0.06] p-6 sm:flex-row sm:items-center">
              <AlertTriangle className="h-6 w-6 shrink-0 text-amber-400" />
              <div className="flex-1">
                <p className="font-bold text-amber-300">
                  {t("matchPred.errorTitle")}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {t("matchPred.errorDesc")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => fixturesQuery.refetch()}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t("matchPred.refresh")}
              </button>
            </div>
          )}

          {!isLoading && !isError && !hasFree && (
            <div className="glass-card flex flex-col items-center gap-4 p-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-green-500/25 bg-green-500/10">
                <Clock className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">
                  {t("matchPred.emptyTitle")}
                </h3>
                <p className="mt-1 max-w-md text-sm text-slate-400">
                  {t("matchPred.emptyDesc")}
                </p>
              </div>
              <Link
                href={loc("/track-record")}
                className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/[0.08] px-5 py-2.5 text-xs font-bold text-green-300 transition hover:border-green-500/50 hover:bg-green-500/[0.15]"
              >
                <Eye className="h-3.5 w-3.5" />
                {t("matchPred.emptyCta")}
              </Link>
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
      <section className="relative px-4 pb-12">
        <div className="mx-auto max-w-5xl">
          <UnlockBanner />
        </div>
      </section>

      {/* ── Locked pool ── */}
      <section className="relative px-4 pb-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5">
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {t("matchPred.lockedHeading")}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
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

      {/* ── Final CTA ── */}
      <section className="relative px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-8 text-center shadow-2xl sm:p-12"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-green-500/[0.08] via-transparent to-emerald-500/[0.06]" />
          <div className="relative z-10">
            <h2 className="text-balance break-words text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {t("matchPred.ctaFinalTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
              {t("matchPred.ctaFinalDesc")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={loc("/checkout")}
                className="btn-gradient group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-extrabold text-black shadow-xl shadow-green-500/30 transition-all hover:shadow-green-500/50"
              >
                {t("matchPred.ctaFinalButton")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={loc("/checkout")}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-8 py-4 text-sm font-bold text-white transition-all hover:border-green-500/40 hover:bg-green-500/[0.08]"
              >
                {t("matchPred.ctaFinalSecondary")}
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <BetsPlugFooter />
    </div>
  );
}
