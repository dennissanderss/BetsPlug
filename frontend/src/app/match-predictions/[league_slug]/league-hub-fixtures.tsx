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
import { useFreeMatchIds } from "@/components/match-predictions/use-free-match-ids";

/**
 * League-scoped fixtures block for the /match-predictions/[league_slug]
 * hubs. Mirrors the public teaser layout: 4 stats, 3 free picks
 * (preferred from picks that have an actual model output) and a
 * locked-pool preview. Data is fetched client-side via TanStack
 * Query so the surrounding server component stays cacheable.
 */
export function LeagueHubFixtures({ leagueSlug }: { leagueSlug: string }) {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  // Global free-pick IDs — single source of truth across all pages
  const { freeMatchIds, isLoadingFreeIds } = useFreeMatchIds();

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

  // Free picks: only fixtures whose match ID is in the global free set
  const free: Fixture[] = useMemo(
    () => upcoming.filter((f) => freeMatchIds.has(f.id)),
    [upcoming, freeMatchIds],
  );
  // Locked pool: everything else
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
      {/* Stats bar */}
      <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
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
      </div>

      {/* Free 3 predictions */}
      <div className="mt-12">
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

      {/* Locked pool */}
      <div className="mt-12">
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
    </>
  );
}
