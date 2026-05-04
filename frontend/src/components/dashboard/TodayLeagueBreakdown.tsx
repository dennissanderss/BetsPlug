"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { useLocalizedHref } from "@/i18n/locale-provider";
import { classifyPickTier, TIER_RANK } from "@/lib/pick-tier";
import type { Fixture, PickTierSlug } from "@/types/api";
import type { Tier } from "@/hooks/use-tier";

interface TodayLeagueBreakdownProps {
  /** User's active tier — drives the in-scope filter (cumulative). */
  userTier: Tier | null;
}

/**
 * Today's picks broken down by competition for the user's tier.
 * Tier-aware: shows competitions where the user actually has access
 * to a pick today. Hidden when there's nothing — keeps the surface
 * quiet rather than rendering "0 picks".
 *
 * Editorial / data-led: a flat list of "Premier League · 3 picks ·
 * avg conf 72%" rows, no card chrome, fits below the upcoming grid.
 */
export function TodayLeagueBreakdown({ userTier }: TodayLeagueBreakdownProps) {
  const lHref = useLocalizedHref();
  const userRank = userTier ? TIER_RANK[userTier as PickTierSlug] ?? 0 : 0;

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-today-league-breakdown", userTier ?? "all"],
    queryFn: () => api.getFixturesToday(),
    staleTime: 5 * 60_000,
  });

  // Group today's in-tier scheduled picks by league.
  const byLeague = new Map<
    string,
    { count: number; confSum: number; topConf: number }
  >();

  for (const f of data?.fixtures ?? []) {
    if (!f.prediction || f.status !== "scheduled") continue;
    const tier: PickTierSlug | null =
      (f.prediction as any).pick_tier ??
      classifyPickTier({
        leagueId: (f as any).league_id ?? null,
        leagueName: f.league_name ?? null,
        confidence: f.prediction.confidence,
      });
    // Cumulative downwards: pick visible if pick.rank <= user.rank.
    // Free (0) sees only Free-classified picks; Platinum sees all.
    if (!tier || TIER_RANK[tier] > userRank) continue;

    const league = f.league_name ?? "Unknown";
    const conf = f.prediction.confidence;
    const prev = byLeague.get(league);
    if (prev) {
      prev.count += 1;
      prev.confSum += conf;
      prev.topConf = Math.max(prev.topConf, conf);
    } else {
      byLeague.set(league, { count: 1, confSum: conf, topConf: conf });
    }
  }

  const rows = Array.from(byLeague.entries())
    .map(([league, agg]) => ({
      league,
      count: agg.count,
      avgConf: (agg.confSum / agg.count) * 100,
      topConf: agg.topConf * 100,
    }))
    .sort((a, b) => b.count - a.count || b.topConf - a.topConf)
    .slice(0, 6);

  // Hide the whole strip when there's nothing useful to show — the
  // upcoming-picks card already says "no picks in your tier yet".
  if (!isLoading && rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[hsl(230_22%_9%/0.4)]">
      <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-2.5">
        <div className="flex items-baseline gap-3">
          <Trophy className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Today's leagues in your scope
          </span>
        </div>
        <Link
          href={lHref("/predictions")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 transition-colors hover:text-emerald-400"
        >
          All predictions
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-4 py-2.5">
                <div className="h-4 w-full animate-pulse rounded bg-white/[0.04]" />
              </div>
            ))
          : rows.map(({ league, count, avgConf, topConf }) => (
              <div
                key={league}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-2.5 text-[12px]"
              >
                <span className="truncate font-medium text-slate-200">
                  {league}
                </span>
                <span className="text-slate-500 tabular-nums">
                  {count} {count === 1 ? "pick" : "picks"}
                </span>
                <span className="inline-flex items-center gap-2 text-[11px] tabular-nums">
                  <span className="text-slate-500">avg</span>
                  <span className="font-semibold text-slate-300">
                    {avgConf.toFixed(0)}%
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-500">top</span>
                  <span className="font-semibold text-emerald-400">
                    {topConf.toFixed(0)}%
                  </span>
                </span>
              </div>
            ))}
      </div>
    </div>
  );
}
