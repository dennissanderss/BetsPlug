"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useQueries } from "@tanstack/react-query";
import {
  FlaskConical,
  ShieldCheck,
  AlertTriangle,
  Clock,
  PlayCircle,
  CheckCircle2,
  Info,
  BarChart3,
  TrendingUp,
  Target,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { TrackrecordSummary, StrategyResponse } from "@/types/api";

// ─── Minimum predictions required before a backtest is meaningful ────────────

const BACKTEST_MINIMUM = 100;


// ─── Status helpers ───────────────────────────────────────────────────────────

function getDataStatus(summary: TrackrecordSummary | undefined): {
  count: number;
  label: string;
  ready: boolean;
  pct: number;
} {
  const count = summary?.total_predictions ?? 0;
  const ready = count >= BACKTEST_MINIMUM;
  const pct = Math.min(100, Math.round((count / BACKTEST_MINIMUM) * 100));
  const label = ready
    ? `${count.toLocaleString()} predictions — ready to backtest`
    : `${count.toLocaleString()} / ${BACKTEST_MINIMUM} predictions needed`;
  return { count, label, ready, pct };
}


// ─── Backtest Panel ───────────────────────────────────────────────────────────

function BacktestPanel({
  summary,
  loading,
}: {
  summary: TrackrecordSummary | undefined;
  loading: boolean;
}) {
  const [running, setRunning] = React.useState(false);
  const [runResult, setRunResult] = React.useState<string | null>(null);
  const status = getDataStatus(summary);

  async function handleRunBacktest() {
    setRunning(true);
    setRunResult(null);
    try {
      await api.runBacktest({ strategy: "all", min_predictions: BACKTEST_MINIMUM });
      setRunResult("Backtest job queued successfully. Results will appear in the Track Record page once complete.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setRunResult(`Error: ${msg}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="glass-card p-6 space-y-5 animate-fade-in">
      <div className="flex items-center gap-2">
        <PlayCircle className="h-5 w-5 text-blue-400" />
        <h2 className="text-base font-bold text-slate-100">Backtest Status</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-4 w-48 rounded bg-white/[0.06] animate-pulse" />
          <div className="h-4 w-32 rounded bg-white/[0.06] animate-pulse" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status indicator */}
          <div className={cn(
            "flex items-start gap-3 rounded-lg border p-4",
            status.ready
              ? "border-emerald-500/20 bg-emerald-500/[0.05]"
              : "border-amber-500/20 bg-amber-500/[0.05]"
          )}>
            {status.ready ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Clock className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className={cn("text-sm font-semibold", status.ready ? "text-emerald-400" : "text-amber-400")}>
                {status.ready ? "Ready to backtest" : "Awaiting sufficient historical data"}
              </p>
              <p className="text-xs text-slate-400">{status.label}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Predictions</p>
              <p className="text-lg font-bold text-slate-100 tabular-nums">{status.count.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Required</p>
              <p className="text-lg font-bold text-slate-400 tabular-nums">{BACKTEST_MINIMUM}</p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Remaining</p>
              <p className={cn("text-lg font-bold tabular-nums", status.ready ? "text-emerald-400" : "text-amber-400")}>
                {status.ready ? "0" : (BACKTEST_MINIMUM - status.count).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Run button */}
          <button
            onClick={handleRunBacktest}
            disabled={!status.ready || running}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all",
              status.ready && !running
                ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg"
                : "bg-white/[0.04] border border-white/[0.06] text-slate-500 cursor-not-allowed"
            )}
          >
            {running ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Running backtest...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                {status.ready ? "Run Backtest Now" : `Collect ${BACKTEST_MINIMUM - status.count} more predictions first`}
              </>
            )}
          </button>

          {runResult && (
            <div className={cn(
              "rounded-lg border p-3 text-xs",
              runResult.startsWith("Error")
                ? "border-red-500/20 bg-red-500/[0.05] text-red-400"
                : "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-400"
            )}>
              {runResult}
            </div>
          )}

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Once run, backtest results will populate the Track Record page with real performance
            metrics. The system requires a minimum of {BACKTEST_MINIMUM} resolved predictions to
            produce statistically meaningful results.
          </p>
        </div>
      )}
    </div>
  );
}


// ─── Main Page ────────────────────────────────────────────────────────────────

// ─── Strategy Metrics Card (real data from backend) ─────────────────────────

// ─── Human-readable rule translations ───────────────────────────────────────

const RULE_LABELS: Record<string, string> = {
  home_win_prob: "Home win probability",
  away_win_prob: "Away win probability",
  draw_prob: "Draw probability",
  confidence: "Model confidence",
  edge_home: "Home edge vs bookmaker",
  edge_away: "Away edge vs bookmaker",
  edge_pick: "Pick edge vs bookmaker",
  odds_home: "Home odds",
  odds_away: "Away odds",
  odds_pick: "Pick odds",
  form_diff: "Form difference",
};

const OP_LABELS: Record<string, string> = {
  ">": "higher than",
  "<": "lower than",
  ">=": "at least",
  "<=": "at most",
  "==": "exactly",
  "between": "between",
};

function humanizeRule(rule: { feature: string; operator: string; value: unknown }): string {
  const feat = RULE_LABELS[rule.feature] || rule.feature;
  const op = OP_LABELS[rule.operator] || rule.operator;
  if (rule.operator === "between" && Array.isArray(rule.value)) {
    return `${feat} ${rule.value[0]} – ${rule.value[1]}`;
  }
  const val = typeof rule.value === "number" && rule.value < 1 ? `${(rule.value as number * 100).toFixed(0)}%` : String(rule.value);
  return `${feat} ${op} ${val}`;
}

// Color based on ROI
function getStrategyColor(roi: number | undefined) {
  if (roi === undefined) return { accent: "text-blue-400", header: "from-blue-500/10 to-blue-500/0" };
  if (roi > 0.05) return { accent: "text-emerald-400", header: "from-emerald-500/10 to-emerald-500/0" };
  if (roi > -0.02) return { accent: "text-amber-400", header: "from-amber-500/10 to-amber-500/0" };
  return { accent: "text-red-400", header: "from-red-500/10 to-red-500/0" };
}

function RealStrategyCard({ strategy }: { strategy: StrategyResponse }) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["strategy-metrics", strategy.id],
    queryFn: async () => {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/strategies/${strategy.id}/metrics`
      );
      return resp.json();
    },
    staleTime: 60_000,
  });

  // Hide strategies with 0 picks
  if (!isLoading && (!metrics?.has_data || metrics?.sample_size === 0)) {
    return null;
  }

  const c = getStrategyColor(metrics?.roi);

  return (
    <div className="glass-card flex flex-col overflow-hidden animate-fade-in">
      <div className={cn("bg-gradient-to-r p-5", c.header)}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Football · Match Result</p>
            <h3 className="text-base font-bold text-slate-100">{strategy.name}</h3>
          </div>
          {metrics?.roi !== undefined && metrics?.roi > 0 ? (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
              <TrendingUp className="h-3 w-3" /> Profitable
            </span>
          ) : metrics?.has_data ? (
            <span className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-400">
              <TrendingUp className="h-3 w-3 rotate-180" /> Unprofitable
            </span>
          ) : isLoading ? (
            <span className="flex items-center gap-1.5 rounded-full border border-slate-500/30 bg-slate-500/10 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
              <Clock className="h-3 w-3" /> Loading...
            </span>
          ) : null}
        </div>
        <p className="text-xs leading-relaxed text-slate-400">{strategy.description}</p>
      </div>

      {/* Metrics */}
      {metrics?.has_data && (
        <div className="px-5 py-4 border-t border-white/[0.06]">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Win Rate</p>
              <p className={cn("text-lg font-bold tabular-nums", c.accent)}>{(metrics.winrate * 100).toFixed(1)}%</p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">ROI</p>
              <p className={cn("text-lg font-bold tabular-nums", metrics.roi >= 0 ? "text-emerald-400" : "text-red-400")}>
                {metrics.roi >= 0 ? "+" : ""}{(metrics.roi * 100).toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Sample Size</p>
              <p className="text-lg font-bold tabular-nums text-slate-100">{metrics.sample_size}</p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Max Drawdown</p>
              <p className="text-lg font-bold tabular-nums text-red-400">{metrics.max_drawdown.toFixed(1)}u</p>
            </div>
          </div>
        </div>
      )}

      {/* Rules — human readable */}
      <div className="px-5 pb-5 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 mt-3">How it works</p>
        <ul className="space-y-1.5">
          {(strategy.rules as { feature: string; operator: string; value: unknown }[]).map((rule, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
              <CheckCircle2 className={cn("h-3.5 w-3.5 flex-shrink-0 mt-0.5", c.accent)} />
              {humanizeRule(rule)}
            </li>
          ))}
        </ul>
        {metrics?.has_data && (
          <Link
            href={`/strategy/${strategy.id}`}
            className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 transition-all"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            View All Picks & Results
          </Link>
        )}
      </div>
    </div>
  );
}

export default function StrategyPage() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["trackrecord-summary"],
    queryFn: () => api.getTrackrecordSummary(),
  });

  const { data: realStrategies } = useQuery({
    queryKey: ["strategies"],
    queryFn: () => api.getStrategies(),
    staleTime: 60_000,
  });

  // Fetch metrics for all strategies to split profitable / archived
  const metricsQueries = useQueries({
    queries: (realStrategies ?? []).map((s) => ({
      queryKey: ["strategy-metrics", s.id],
      queryFn: async () => {
        const resp = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/strategies/${s.id}/metrics`
        );
        return resp.json();
      },
      staleTime: 60_000,
      enabled: !!realStrategies,
    })),
  });

  // Build a map of strategy id -> metrics
  const metricsMap = React.useMemo(() => {
    const map = new Map<string, { roi: number; has_data: boolean; sample_size: number }>();
    (realStrategies ?? []).forEach((s, i) => {
      const q = metricsQueries[i];
      if (q?.data) map.set(s.id, q.data);
    });
    return map;
  }, [realStrategies, metricsQueries]);

  // Split strategies into profitable and archived
  const profitableStrategies = React.useMemo(
    () => (realStrategies ?? []).filter((s) => {
      const m = metricsMap.get(s.id);
      return m?.has_data && m.sample_size > 0 && m.roi > 0;
    }),
    [realStrategies, metricsMap]
  );

  const archivedStrategies = React.useMemo(
    () => (realStrategies ?? []).filter((s) => {
      const m = metricsMap.get(s.id);
      return m?.has_data && m.sample_size > 0 && m.roi <= 0;
    }),
    [realStrategies, metricsMap]
  );

  const [showArchived, setShowArchived] = React.useState(false);

  const dataStatus = getDataStatus(summary);

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 max-w-[1600px] mx-auto space-y-8">

      {/* ── Hero Header ───────────────────────────────────────────────────────── */}
      <div className="animate-fade-in">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-6 w-6 text-blue-400" />
              <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Strategy Lab</h1>
            </div>
            <p className="text-slate-400 text-sm max-w-xl">
              Explore and compare quantitative betting strategies powered by our AI model.
            </p>
          </div>

          {/* Status badge */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
              dataStatus.ready
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                : "border-amber-500/25 bg-amber-500/10 text-amber-400"
            )}>
              {dataStatus.ready ? (
                <><ShieldCheck className="h-3.5 w-3.5" /> Ready to backtest</>
              ) : (
                <><Clock className="h-3.5 w-3.5" /> Awaiting data</>
              )}
            </span>
          </div>
        </div>

        {/* Disclaimer bar */}
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-400 mt-0.5" />
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="font-semibold text-amber-400">Past performance is not a guarantee of future results.</span>{" "}
            Strategy metrics are calculated from real historical predictions. There are currently{" "}
            <span className="font-semibold text-slate-300">
              {summaryLoading ? "..." : dataStatus.count.toLocaleString()}
            </span>{" "}
            predictions in the database (minimum {BACKTEST_MINIMUM} required for backtesting).
          </p>
        </div>
      </div>

      {/* ── Model vs Strategy explanation ─────────────────────────────────────── */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-5 w-5 text-blue-400" />
          <h2 className="text-base font-bold text-slate-100">How it works: Model vs Strategy</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/[0.05] p-4">
            <p className="text-sm font-bold text-blue-400 mb-2">The Model</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our AI model analyzes thousands of data points per match — team form, head-to-head records,
              Elo ratings — to calculate win probabilities. It's the brain that powers all predictions.
            </p>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
            <p className="text-sm font-bold text-emerald-400 mb-2">The Strategy</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              A strategy is a filter on top of the model. It decides WHICH predictions to follow based on
              rules like "only follow picks where the model is very confident" or "only back strong home teams".
              Different strategies suit different risk appetites.
            </p>
          </div>
        </div>
      </div>

      {/* ── Profitable Strategies ─────────────────────────────────────────── */}
      {profitableStrategies.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <div>
              <h2 className="text-lg font-bold text-slate-100">Profitable Strategies</h2>
              <p className="text-xs text-slate-500">Strategies with a positive ROI based on live data</p>
            </div>
            <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-emerald-600 border border-emerald-700 rounded px-2 py-0.5">
              Live data
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {profitableStrategies.map((s) => (
              <RealStrategyCard key={s.id} strategy={s} />
            ))}
          </div>
        </>
      )}

      {/* ── Archived — Not Profitable ─────────────────────────────────────── */}
      {archivedStrategies.length > 0 && (
        <div className="space-y-4">
          <button
            onClick={() => setShowArchived(v => !v)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", showArchived && "rotate-90")} />
            Archived — Not Profitable ({archivedStrategies.length})
          </button>
          {showArchived && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {archivedStrategies.map(s => <RealStrategyCard key={s.id} strategy={s} />)}
            </div>
          )}
        </div>
      )}


      {/* ── Backtest Panel + Data metrics ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">

        {/* Left: What happens next */}
        <div className="glass-card p-6 space-y-5 animate-fade-in">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <h2 className="text-base font-bold text-slate-100">What Happens Next</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                step: "1",
                title: "Data collection continues",
                desc: "The system generates predictions for each upcoming match. Every resolved match is recorded with the actual outcome.",
                done: dataStatus.count > 0,
              },
              {
                step: "2",
                title: `Reach ${BACKTEST_MINIMUM} resolved predictions`,
                desc: `Once ${BACKTEST_MINIMUM} predictions have been evaluated against real outcomes, the backtest threshold is met.`,
                done: dataStatus.ready,
              },
              {
                step: "3",
                title: "Run the backtest",
                desc: "Click 'Run Backtest' to evaluate each strategy template against historical predictions. Metrics are computed from real data only.",
                done: false,
              },
              {
                step: "4",
                title: "Results appear on Track Record",
                desc: "Real win rates, ROI, P/L curves and calibration data will populate the Track Record page.",
                done: false,
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className={cn(
                  "flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5",
                  item.done
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-white/[0.06] text-slate-500"
                )}>
                  {item.done ? <CheckCircle2 className="h-4 w-4" /> : item.step}
                </div>
                <div>
                  <p className={cn("text-sm font-semibold", item.done ? "text-emerald-400" : "text-slate-300")}>
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Backtest panel */}
        <BacktestPanel summary={summary} loading={summaryLoading} />
      </div>

      {/* ── Real prediction stats (from API) ─────────────────────────────────── */}
      {!summaryLoading && summary && summary.total_predictions > 0 && (
        <div className="glass-card p-6 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-400" />
            <h2 className="text-base font-bold text-slate-100">Real Prediction Data (from database)</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Predictions", value: summary.total_predictions.toLocaleString(), accent: "blue" as const },
              { label: "Accuracy", value: `${(summary.accuracy * 100).toFixed(1)}%`, accent: "green" as const },
              { label: "Brier Score", value: summary.brier_score.toFixed(3), accent: "blue" as const },
              { label: "Avg Confidence", value: `${(summary.avg_confidence * 100).toFixed(1)}%`, accent: "amber" as const },
            ].map((stat) => {
              const colorMap = {
                blue: "text-blue-400",
                green: "text-emerald-400",
                amber: "text-amber-400",
                red: "text-red-400",
              };
              return (
                <div key={stat.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">{stat.label}</p>
                  <p className={cn("text-xl font-bold tabular-nums", colorMap[stat.accent])}>{stat.value}</p>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500">
            These figures are real model outputs from the database. They reflect prediction accuracy
            metrics only — not betting P/L, which requires backtest analysis.
          </p>
        </div>
      )}


      {/* ── Bottom Disclaimer ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-5 animate-fade-in">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Important Notice</p>
            <p className="text-xs leading-relaxed text-slate-400">
              Strategy performance metrics are based on historical backtested data and{" "}
              <span className="font-semibold text-amber-400">do not guarantee future results</span>.
              Do not use any figures on this page as the basis for financial, investment, or wagering decisions.
              Past performance is not indicative of future outcomes.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
