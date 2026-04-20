"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Lock,
  Clock,
  TrendingUp,
  Eye,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { api } from "@/lib/api";
import type { Fixture } from "@/types/api";
import {
  FreeMatchCard,
  LockedMatchCard,
  LockedSkeleton,
  FreeSkeleton,
} from "@/components/match-predictions/match-cards";
import { FREE_PICKS, LOCKED_PREVIEW } from "@/components/match-predictions/shared";

/**
 * League-scoped fixtures block for the /match-predictions/[league_slug]
 * hubs. Mirrors the public teaser layout: 4 stats, free picks (this
 * league's Bronze-tier picks) and a locked-pool preview. Data is
 * fetched client-side via TanStack Query so the surrounding server
 * component stays cacheable.
 *
 * Free-vs-locked split is driven by the backend tier gate: for an
 * unauth visitor `user_tier = FREE`, so the fixtures endpoint only
 * populates `f.prediction` on picks the Bronze tier is allowed to
 * see. Anything above Bronze comes back with `prediction: null` +
 * `locked_pick_tier` metadata — those belong in the locked pool.
 *
 * Earlier this page intersected per-league fixtures with the global
 * 3-item `useFreeMatchIds` set from /homepage/free-picks, which meant
 * most league hubs showed 0 free picks (their picks weren't in the
 * global top-3). Using the backend's own tier gate fixes that per
 * league automatically.
 */
export function LeagueHubFixtures({ leagueSlug }: { leagueSlug: string }) {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  const fixturesQuery = useQuery({
    queryKey: ["league-hub-fixtures", leagueSlug, 14],
    queryFn: () => api.getFixturesUpcoming(14, leagueSlug),
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
        const ts = new Date(f.scheduled_at).getTime();
        return Number.isFinite(ts) && ts > now;
      })
      .sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime(),
      );
  }, [fixtures]);

  // Free picks: fixtures where the backend returned a visible prediction.
  // Capped at FREE_PICKS so the page doesn't snowball on league-heavy
  // weekends; the rest flows into the locked pool so visitors still see
  // the upgrade teaser below.
  const free: Fixture[] = useMemo(
    () => upcoming.filter((f) => f.prediction !== null).slice(0, FREE_PICKS),
    [upcoming],
  );
  const freeIds = useMemo(() => new Set(free.map((f) => f.id)), [free]);
  // Locked pool: the rest — both explicitly gated (prediction null with
  // locked_pick_tier) and any overflow past the FREE_PICKS cap.
  const lockedPool = useMemo(() => {
    const withPred = upcoming.filter((f) => !freeIds.has(f.id) && f.prediction !== null);
    const withoutPred = upcoming.filter((f) => !freeIds.has(f.id) && f.prediction === null);
    return [...withPred, ...withoutPred].slice(0, LOCKED_PREVIEW);
  }, [upcoming, freeIds]);

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
      value: String(Math.max(upcoming.length - free.length, LOCKED_PREVIEW)),
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
    <>
      {/* Stats bar — NOCTURNE glass tiles */}
      <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="glass-panel flex flex-col items-center justify-center gap-1 px-3 py-4 text-center"
          >
            <Icon className="h-4 w-4" style={{ color }} />
            <span className="mt-1 text-stat text-2xl leading-none tabular-nums text-[#ededed]">
              {value}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6b7280]">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Free picks */}
      <div className="mt-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <span className="section-label">
              <Sparkles className="h-3 w-3" />
              {t("matchPred.statFree")}
            </span>
            <h2 className="text-heading mt-2 text-2xl text-[#ededed] sm:text-3xl">
              {t("matchPred.freeHeading")}
            </h2>
            <p className="mt-1 text-sm text-[#a3a9b8]">
              {t("matchPred.freeSub")}
            </p>
          </div>
          {fixturesQuery.isFetching && !isLoading && (
            <button
              type="button"
              onClick={() => fixturesQuery.refetch()}
              className="btn-glass hidden items-center gap-1.5 !text-[11px] sm:inline-flex"
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
          <div className="glass-panel flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center">
            <AlertTriangle className="h-6 w-6 shrink-0 text-amber-400" />
            <div className="flex-1">
              <p className="font-bold text-amber-300">
                {t("matchPred.errorTitle")}
              </p>
              <p className="mt-1 text-sm text-[#a3a9b8]">
                {t("matchPred.errorDesc")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => fixturesQuery.refetch()}
              className="btn-glass inline-flex items-center gap-2 !text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t("matchPred.refresh")}
            </button>
          </div>
        )}

        {!isLoading && !isError && !hasFree && (
          <div className="glass-panel flex flex-col items-center gap-4 p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#4ade80]/30 bg-[#4ade80]/[0.08]">
              <Clock className="h-6 w-6 text-[#4ade80]" />
            </div>
            <div>
              <h3 className="text-heading text-xl text-[#ededed]">
                {t("matchPred.emptyTitle")}
              </h3>
              <p className="mt-1 max-w-md text-sm text-[#a3a9b8]">
                {t("matchPred.emptyDesc")}
              </p>
            </div>
            <Link
              href={loc("/track-record")}
              className="btn-glass inline-flex items-center gap-2"
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

      {/* Locked pool */}
      <div className="mt-12">
        <div className="mb-5">
          <span className="section-label">
            <Lock className="h-3 w-3" />
            {t("matchPred.statLocked")}
          </span>
          <h2 className="text-heading mt-2 text-2xl text-[#ededed] sm:text-3xl">
            {t("matchPred.lockedHeading")}
          </h2>
          <p className="mt-1 text-sm text-[#a3a9b8]">
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
    </>
  );
}
