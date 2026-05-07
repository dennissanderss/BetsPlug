"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Image from "next/image";
import { TeamLogo } from "@/components/dashboard/TeamLogo";
import Link from "next/link";
import {
  ArrowLeft,
  FlaskConical,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { PaywallOverlay } from "@/components/ui/paywall-overlay";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

export default function StrategyDetailPage() {
  const params = useParams();
  const strategyId = params.id as string;

  const { data: picksData, isLoading: picksLoading } = useQuery({
    queryKey: ["strategy-picks", strategyId],
    queryFn: () => api.getStrategyPicks(strategyId, 200, 0),
    staleTime: 60_000,
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["strategy-metrics", strategyId],
    queryFn: async () => {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const resp = await fetch(`${API}/strategies/${strategyId}/metrics`);
      return resp.json();
    },
    staleTime: 60_000,
  });

  const { data: todayPicks } = useQuery({
    queryKey: ["strategy-today-picks", strategyId],
    queryFn: () => api.getStrategyTodayPicks(strategyId),
    staleTime: 300_000,
  });

  const { data: walkForward } = useQuery({
    queryKey: ["strategy-walk-forward", strategyId],
    queryFn: async () => {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const resp = await fetch(`${API}/strategies/${strategyId}/walk-forward`);
      if (!resp.ok) return null;
      return resp.json();
    },
    staleTime: 300_000,
  });

  const strategy = picksData?.strategy;
  const picks = picksData?.picks ?? [];

  // Calculate running P/L for equity curve
  const evaluatedPicks = picks.filter((p) => p.is_correct !== null && p.is_correct !== undefined);
  let runningPnl = 0;
  const equityCurve = evaluatedPicks.map((p) => {
    runningPnl += p.pnl ?? 0;
    return { date: p.scheduled_at, pnl: runningPnl };
  });

  const isLoading = picksLoading || metricsLoading;

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8 space-y-8">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-[#4ade80]/10 blur-3xl" />
        <div className="absolute top-40 right-1/4 h-72 w-72 rounded-full bg-[#60a5fa]/10 blur-3xl" />
      </div>

      <Link href="/strategy" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Strategy Lab
      </Link>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-64 rounded bg-white/[0.06]" />
          <div className="h-4 w-96 rounded bg-white/[0.06]" />
        </div>
      ) : strategy ? (
        <div className="animate-fade-in">
          <p className="section-label mb-2">Strategy detail</p>
          <div className="flex items-center gap-3 mb-3">
            <HexBadge variant="green" size="md"><FlaskConical className="h-5 w-5" /></HexBadge>
            <h1 className="text-heading"><span className="gradient-text-green">{strategy.name}</span></h1>
          </div>
          <p className="text-slate-400 text-sm max-w-2xl">{strategy.description}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {(strategy.rules as { feature: string; operator: string; value: unknown }[]).map((rule, i) => (
              <Pill key={i} tone="info">
                {rule.feature} {rule.operator} {Array.isArray(rule.value) ? `[${rule.value.join("-")}]` : String(rule.value)}
              </Pill>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-slate-400">Strategy not found.</p>
      )}

      {/* Under Investigation banner — fires when the headline winrate /
          roi were clamped because raw values cleared the leakage tripwire
          documented in API_CONTRACT.md. Without this banner the user
          sees clamped 0.0 numbers and no explanation. */}
      {metrics?.validation_status === "under_investigation" && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/[0.06] p-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-200">Under Investigation</p>
              <p className="text-xs leading-relaxed text-amber-200/85">
                {metrics.validation_notes ?? "Raw winrate or ROI cleared the plausibility ceiling — headline metrics clamped pending a fresh leakage audit."}
              </p>
              {(metrics.raw_winrate !== undefined || metrics.raw_roi !== undefined) && (
                <p className="mt-2 text-[11px] text-amber-300/70 tabular-nums">
                  Raw values: winrate {((metrics.raw_winrate ?? 0) * 100).toFixed(1)}%
                  {" · "}
                  ROI {(metrics.raw_roi ?? 0) >= 0 ? "+" : ""}{((metrics.raw_roi ?? 0) * 100).toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KPI Metrics */}
      {metrics?.has_data && (() => {
        const isUI = metrics.validation_status === "under_investigation";
        // When clamped, surface the raw numbers in amber + with "raw"
        // suffix so the disputed metrics aren't silently zeroed.
        const winrateValue = isUI ? (metrics.raw_winrate ?? 0) : metrics.winrate;
        const roiValue = isUI ? (metrics.raw_roi ?? 0) : metrics.roi;
        const winrateColor = isUI ? "text-amber-400" : (winrateValue >= 0.5 ? "text-[#4ade80]" : "text-amber-400");
        const roiColor = isUI ? "text-amber-400" : (roiValue >= 0 ? "text-[#4ade80]" : "text-red-400");
        const suffix = isUI ? <span className="text-[10px] font-normal text-amber-300/60 ml-1">raw</span> : null;
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 animate-fade-in">
            <div className="glass-panel p-4 space-y-1">
              <p className="section-label">Win Rate</p>
              <p className={cn("text-stat tabular-nums", winrateColor)}>
                {(winrateValue * 100).toFixed(1)}%{suffix}
              </p>
            </div>
            <div className="glass-panel p-4 space-y-1">
              <p className="section-label">ROI</p>
              <p className={cn("text-stat tabular-nums", roiColor)}>
                {roiValue >= 0 ? "+" : ""}{(roiValue * 100).toFixed(1)}%{suffix}
              </p>
            </div>
            <div className="glass-panel p-4 space-y-1">
              <p className="section-label">Sample Size</p>
              <p className="text-stat tabular-nums text-[#60a5fa]">{metrics.sample_size}</p>
            </div>
            <div className="glass-panel p-4 space-y-1">
              <p className="section-label">Correct</p>
              <p className="text-stat tabular-nums text-[#4ade80]">{metrics.correct}</p>
            </div>
            <div className="glass-panel p-4 space-y-1">
              <p className="section-label">Incorrect</p>
              <p className="text-stat tabular-nums text-red-400">{metrics.incorrect}</p>
            </div>
            <div className="glass-panel p-4 space-y-1">
              <p className="section-label">Max Drawdown</p>
              <p className="text-stat tabular-nums text-red-400">{metrics.max_drawdown.toFixed(1)}u</p>
            </div>
          </div>
        );
      })()}

      {/* Equity Curve (simple text-based) */}
      {equityCurve.length > 0 && (
        <div className="card-neon card-neon-green halo-green animate-fade-in">
          <div className="relative p-6 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#4ade80]" />
              <h2 className="text-base font-semibold text-white">Equity Curve</h2>
              <span className="ml-auto text-sm font-semibold tabular-nums">
                <span className={runningPnl >= 0 ? "text-[#4ade80]" : "text-red-400"}>
                  {runningPnl >= 0 ? "+" : ""}{runningPnl.toFixed(2)}u
                </span>
              </span>
            </div>
            <div className="h-24 flex items-end gap-px">
              {equityCurve.map((point, i) => {
                const max = Math.max(...equityCurve.map((p) => Math.abs(p.pnl)), 1);
                const height = Math.abs(point.pnl) / max * 100;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 rounded-t-sm min-h-[2px]",
                      point.pnl >= 0 ? "bg-[#4ade80]/60" : "bg-red-500/60"
                    )}
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${point.date?.split("T")[0] ?? ""}: ${point.pnl >= 0 ? "+" : ""}${point.pnl.toFixed(2)}u`}
                  />
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500">Each bar = 1 pick. Green = running profit, Red = running loss.</p>
          </div>
        </div>
      )}

      {/* Today's Picks */}
      {todayPicks && todayPicks.picks_count > 0 && (
        <div className="card-neon card-neon-green animate-fade-in">
          <div className="relative p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-[#4ade80]" />
            <h2 className="text-base font-semibold text-white">Today&apos;s Picks</h2>
            <Pill tone="win">{todayPicks.picks_count}</Pill>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todayPicks.picks.map((pick) => (
              <div key={pick.match_id} className="glass-panel p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-bold text-slate-100">
                      <TeamLogo src={pick.home_team_logo} name={pick.home_team ?? ""} size={18} />
                      {pick.home_team} vs
                      <TeamLogo src={pick.away_team_logo} name={pick.away_team ?? ""} size={18} />
                      {pick.away_team}
                    </p>
                    <p className="text-xs text-slate-500">
                      {pick.league} &middot;{" "}
                      {new Date(pick.kickoff).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Pill tone="win">{pick.pick}</Pill>
                </div>
                <div className="flex gap-4 text-xs text-slate-400">
                  <span>Home {(pick.home_win_prob * 100).toFixed(0)}%</span>
                  <span>Draw {(pick.draw_prob * 100).toFixed(0)}%</span>
                  <span>Away {(pick.away_win_prob * 100).toFixed(0)}%</span>
                  <span className="text-[#4ade80] font-semibold">{(pick.confidence * 100).toFixed(0)}% conf</span>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      )}

      {/* All Picks Table */}
      <PaywallOverlay feature="strategy_lab_full" requiredTier="gold">
        <div className="card-neon overflow-hidden animate-fade-in">
          <div className="relative flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[#60a5fa]" />
              <h2 className="text-base font-semibold text-white">All Picks</h2>
              <Pill>{picks.length}</Pill>
            </div>
          </div>

          {picksLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : picks.length === 0 ? (
            <div className="p-10 text-center">
              <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No picks match this strategy yet.</p>
              <p className="text-slate-500 text-xs mt-1">
                This strategy&apos;s rules may require odds data that is not yet available.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    {["Date", "Match", "League", "Pick", "Confidence", "Score", "Result", "P/L"].map((col) => (
                      <th key={col} className="px-4 py-3 text-left section-label">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {picks.map((pick, idx) => {
                    const date = pick.scheduled_at
                      ? new Date(pick.scheduled_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : " - ";

                    return (
                      <tr
                        key={String(pick.id)}
                        className={cn(
                          "transition-colors hover:bg-white/[0.02]",
                          idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
                        )}
                      >
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{date}</td>
                        <td className="px-4 py-3">
                          <p className="flex items-center gap-1.5 font-medium text-slate-200 whitespace-nowrap">
                            <TeamLogo src={pick.home_team_logo} name={pick.home_team_name ?? ""} size={16} />
                            {pick.home_team_name ?? "?"} vs
                            <TeamLogo src={pick.away_team_logo} name={pick.away_team_name ?? ""} size={16} />
                            {pick.away_team_name ?? "?"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Pill>{pick.league_name ?? " - "}</Pill>
                        </td>
                        <td className="px-4 py-3">
                          <Pill tone="info">{pick.pick ?? " - "}</Pill>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-300">
                          {(pick.confidence * 100).toFixed(0)}%
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">
                          {pick.home_score != null && pick.away_score != null
                            ? `${pick.home_score} - ${pick.away_score}`
                            : " - "}
                        </td>
                        <td className="px-4 py-3">
                          {pick.is_correct === true && (
                            <Pill tone="win"><CheckCircle2 className="h-3 w-3" /> Won</Pill>
                          )}
                          {pick.is_correct === false && (
                            <Pill tone="loss"><XCircle className="h-3 w-3" /> Lost</Pill>
                          )}
                          {pick.is_correct == null && (
                            <Pill tone="draw"><Clock className="h-3 w-3" /> Pending</Pill>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold">
                          {pick.pnl != null ? (
                            <span className={pick.pnl >= 0 ? "text-[#4ade80]" : "text-red-400"}>
                              {pick.pnl >= 0 ? "+" : ""}{pick.pnl.toFixed(2)}u
                            </span>
                          ) : (
                            <span className="text-slate-600"> - </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PaywallOverlay>

      {/* Walk-forward validation */}
      {walkForward && walkForward.folds && walkForward.folds.length > 0 && (
        <div className="card-neon card-neon-green animate-fade-in">
          <div className="relative p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-[#4ade80]" />
            <h3 className="text-sm font-semibold text-white">Walk-Forward Validation</h3>
            <Pill tone="info" className="ml-auto">Rolling out-of-sample test</Pill>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Each fold tests the static strategy on unseen data. Win rates above 58% are flagged: an honest 1X2 model rarely clears that
            ceiling without feature leakage, so green = within plausible range, amber = above ceiling (suspect), red = below break-even.
          </p>
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-2 section-label px-3 py-1">
              <span>Fold</span>
              <span className="text-center">Sample</span>
              <span className="text-center">Win Rate</span>
              <span className="text-center">ROI</span>
              <span className="text-center">Status</span>
            </div>
            {walkForward.folds.map((fold: any, i: number) => {
              // M3: align thresholds with backend _LEAKAGE_WINRATE_CEILING
              // (0.58). Plausible range = [0.50, 0.58]; above that is
              // amber (suspect), below is red. The old `>= 0.5 ? green : red`
              // gave 65% folds a green check while the backend treated
              // them as suspicious — opposite stories on one screen.
              const wr = fold.winrate ?? fold.win_rate ?? 0;
              const inPlausibleRange = wr >= 0.5 && wr <= 0.58;
              const aboveCeiling = wr > 0.58;
              const wrColor = inPlausibleRange
                ? "text-[#4ade80]"
                : aboveCeiling
                  ? "text-amber-400"
                  : "text-red-400";
              return (
                <div key={i} className="grid grid-cols-5 gap-2 items-center glass-panel px-3 py-2.5 text-xs">
                  <span className="text-slate-400">Fold {i + 1}</span>
                  <span className="text-center tabular-nums text-slate-300">{fold.sample_size ?? fold.n ?? "—"}</span>
                  <span className={cn("text-center tabular-nums font-medium", wrColor)}>
                    {(wr * 100).toFixed(1)}%
                  </span>
                  <span className={cn("text-center tabular-nums font-medium", (fold.roi ?? 0) >= 0 ? "text-[#4ade80]" : "text-red-400")}>
                    {fold.roi != null ? `${(fold.roi * 100).toFixed(1)}%` : "—"}
                  </span>
                  <span className="text-center" title={aboveCeiling ? "Above 58% leakage ceiling — suspect" : inPlausibleRange ? "Plausible range" : "Below break-even"}>
                    {inPlausibleRange ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#4ade80] mx-auto" />
                    ) : aboveCeiling ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mx-auto" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-400 mx-auto" />
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          {walkForward.summary && (
            <div className="mt-4 glass-panel px-4 py-3">
              <p className="text-xs text-[#4ade80]">
                <span className="font-semibold">Overall:</span>{" "}
                {walkForward.summary.avg_winrate != null && `Win rate ${(walkForward.summary.avg_winrate * 100).toFixed(1)}%`}
                {walkForward.summary.avg_roi != null && ` · ROI ${(walkForward.summary.avg_roi * 100).toFixed(1)}%`}
                {walkForward.summary.total_folds != null && ` · ${walkForward.summary.total_folds} folds`}
              </p>
            </div>
          )}
          </div>
        </div>
      )}

    </div>
  );
}
