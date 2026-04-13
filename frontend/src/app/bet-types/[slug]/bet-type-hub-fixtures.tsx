"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  RefreshCw,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { api } from "@/lib/api";
import type { Fixture } from "@/types/api";
import {
  FreeMatchCard,
  FreeSkeleton,
} from "@/components/match-predictions/match-cards";
import { FREE_PICKS } from "@/components/match-predictions/shared";
import { useFreeMatchIds } from "@/components/match-predictions/use-free-match-ids";

/**
 * Bet-type hub fixtures block — shows the top 3 upcoming matches
 * with the highest 1X2 confidence as a shortlist for bet-type
 * research. Purely a readability aid: no market-specific probs.
 */
export function BetTypeHubFixtures({
  heading,
  sub,
}: {
  heading: string;
  sub: string;
}) {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  // Global free-pick IDs — single source of truth across all pages
  const { freeMatchIds, isLoadingFreeIds } = useFreeMatchIds();

  const fixturesQuery = useQuery({
    queryKey: ["bet-type-hub-fixtures", 7],
    queryFn: () => api.getFixturesUpcoming(7),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    retry: 2,
  });

  const fixtures = fixturesQuery.data?.fixtures ?? [];

  // Only show fixtures whose match ID is in the global free set
  const topConfident = useMemo(() => {
    const now = Date.now();
    return fixtures
      .filter((f) => {
        if (f.status !== "scheduled") return false;
        if (f.prediction === null) return false;
        const ts = new Date(f.scheduled_at).getTime();
        return Number.isFinite(ts) && ts > now && freeMatchIds.has(f.id);
      })
      .sort(
        (a, b) =>
          (b.prediction?.confidence ?? 0) - (a.prediction?.confidence ?? 0),
      )
      .slice(0, FREE_PICKS) as Fixture[];
  }, [fixtures, freeMatchIds]);

  const isLoading = fixturesQuery.isLoading || isLoadingFreeIds;
  const isError = fixturesQuery.isError;
  const hasMatches = topConfident.length > 0;

  return (
    <div className="mt-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {heading}
          </h2>
          <p className="mt-1 text-sm text-slate-400">{sub}</p>
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

      {!isLoading && !isError && !hasMatches && (
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

      {!isLoading && hasMatches && (
        <div className="flex flex-col gap-3">
          {topConfident.map((f) => (
            <FreeMatchCard key={f.id} fixture={f} />
          ))}
        </div>
      )}
    </div>
  );
}
