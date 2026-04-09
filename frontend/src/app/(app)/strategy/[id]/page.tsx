"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
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
    <div className="min-h-screen px-4 py-8 md:px-8 max-w-[1600px] mx-auto space-y-8">
      {/* Back link */}
      <Link
        href="/strategy"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Strategy Lab
      </Link>

      {/* Header */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-64 rounded bg-white/[0.06]" />
          <div className="h-4 w-96 rounded bg-white/[0.06]" />
        </div>
      ) : strategy ? (
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <FlaskConical className="h-6 w-6 text-blue-400" />
            <h1 className="text-3xl font-extrabold tracking-tight gradient-text">{strategy.name}</h1>
          </div>
          <p className="text-slate-400 text-sm max-w-2xl">{strategy.description}</p>

          {/* Rules */}
          <div className="mt-4 flex flex-wrap gap-2">
            {(strategy.rules as { feature: string; operator: string; value: unknown }[]).map((rule, i) => (
              <span
                key={i}
                className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400"
              >
                {rule.feature} {rule.operator} {Array.isArray(rule.value) ? `[${rule.value.join("-")}]` : String(rule.value)}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-slate-400">Strategy not found.</p>
      )}

      {/* KPI Metrics */}
      {metrics?.has_data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 animate-fade-in">
          {[
            { label: "Win Rate", value: `${(metrics.winrate * 100).toFixed(1)}%`, color: metrics.winrate >= 0.5 ? "text-emerald-400" : "text-amber-400" },
            { label: "ROI", value: `${metrics.roi >= 0 ? "+" : ""}${(metrics.roi * 100).toFixed(1)}%`, color: metrics.roi >= 0 ? "text-emerald-400" : "text-red-400" },
            { label: "Sample Size", value: String(metrics.sample_size), color: "text-blue-400" },
            { label: "Correct", value: String(metrics.correct), color: "text-emerald-400" },
            { label: "Incorrect", value: String(metrics.incorrect), color: "text-red-400" },
            { label: "Max Drawdown", value: `${metrics.max_drawdown.toFixed(1)}u`, color: "text-red-400" },
          ].map((kpi) => (
            <div key={kpi.label} className="glass-card p-4 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">{kpi.label}</p>
              <p className={cn("text-xl font-bold tabular-nums", kpi.color)}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Equity Curve (simple text-based) */}
      {equityCurve.length > 0 && (
        <div className="glass-card p-6 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <h2 className="text-base font-bold text-slate-100">Equity Curve</h2>
            <span className="ml-auto text-sm font-bold tabular-nums">
              <span className={runningPnl >= 0 ? "text-emerald-400" : "text-red-400"}>
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
                    point.pnl >= 0 ? "bg-emerald-500/60" : "bg-red-500/60"
                  )}
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`${point.date?.split("T")[0] ?? ""}: ${point.pnl >= 0 ? "+" : ""}${point.pnl.toFixed(2)}u`}
                />
              );
            })}
          </div>
          <p className="text-[10px] text-slate-500">Each bar = 1 pick. Green = running profit, Red = running loss.</p>
        </div>
      )}

      {/* Today's Picks */}
      {todayPicks && todayPicks.picks_count > 0 && (
        <div className="glass-card p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">Today&apos;s Picks</h2>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
              {todayPicks.picks_count}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todayPicks.picks.map((pick) => (
              <div key={pick.match_id} className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-100">{pick.home_team} vs {pick.away_team}</p>
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
                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400">
                    {pick.pick}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-slate-400">
                  <span>Home {(pick.home_win_prob * 100).toFixed(0)}%</span>
                  <span>Draw {(pick.draw_prob * 100).toFixed(0)}%</span>
                  <span>Away {(pick.away_win_prob * 100).toFixed(0)}%</span>
                  <span className="text-emerald-400 font-bold">{(pick.confidence * 100).toFixed(0)}% conf</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Picks Table */}
      <PaywallOverlay feature="strategy_lab_full" requiredTier="gold">
        <div className="glass-card overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-400" />
              <h2 className="text-base font-bold text-slate-100">All Picks</h2>
              <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs font-semibold text-slate-400">
                {picks.length}
              </span>
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
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                      >
                        {col}
                      </th>
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
                      : "—";

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
                          <p className="font-medium text-slate-200 whitespace-nowrap">
                            {pick.home_team_name ?? "?"} vs {pick.away_team_name ?? "?"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[11px] text-slate-400">
                            {pick.league_name ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[11px] font-semibold text-blue-400">
                            {pick.pick ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-300">
                          {(pick.confidence * 100).toFixed(0)}%
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">
                          {pick.home_score != null && pick.away_score != null
                            ? `${pick.home_score} - ${pick.away_score}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {pick.is_correct === true && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" /> Won
                            </span>
                          )}
                          {pick.is_correct === false && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[11px] font-semibold text-red-400">
                              <XCircle className="h-3 w-3" /> Lost
                            </span>
                          )}
                          {pick.is_correct == null && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 border border-slate-500/20 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                              <Clock className="h-3 w-3" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold">
                          {pick.pnl != null ? (
                            <span className={pick.pnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                              {pick.pnl >= 0 ? "+" : ""}{pick.pnl.toFixed(2)}u
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
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

      {/* Disclaimer */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-5 animate-fade-in">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-400 mt-0.5" />
          <p className="text-xs leading-relaxed text-slate-400">
            <span className="font-semibold text-amber-400">Simulation / Educational Use Only.</span>{" "}
            All predictions and strategy results shown are generated by statistical models for research
            and educational purposes. They do NOT constitute financial, betting, or investment advice.
            P/L is calculated using flat 1-unit stakes at estimated average odds. No real money is involved.
          </p>
        </div>
      </div>
    </div>
  );
}
