"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useQueries } from "@tanstack/react-query";
import {
  FlaskConical,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Info,
  BarChart3,
  TrendingUp,
  Target,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { PaywallOverlay } from "@/components/ui/paywall-overlay";
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
    ? `${count.toLocaleString()} predictions - ready to backtest`
    : `${count.toLocaleString()} / ${BACKTEST_MINIMUM} predictions needed`;
  return { count, label, ready, pct };
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
              <p className="text-[10px] uppercase tracking-wider text-slate-500" title="Percentage of picks that were correct">Win Rate</p>
              <p className={cn("text-lg font-bold tabular-nums", c.accent)}>{(metrics.winrate * 100).toFixed(1)}%</p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500" title="Return on Investment - profit/loss as percentage of total staked">ROI</p>
              <p className={cn("text-lg font-bold tabular-nums", metrics.roi >= 0 ? "text-emerald-400" : "text-red-400")}>
                {metrics.roi >= 0 ? "+" : ""}{(metrics.roi * 100).toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500" title="Total number of evaluated picks for this strategy">Sample Size</p>
              <p className="text-lg font-bold tabular-nums text-slate-100">{metrics.sample_size}</p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500" title="Largest peak-to-trough loss in units (1 unit = 1 stake). E.g., 4.3u means at worst you'd be down 4.3 stakes">Max Drawdown</p>
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
          <div className="mt-4">
            <PaywallOverlay
              feature="strategy_lab_full"
              requiredTier="gold"
              variant="inline"
            >
              <Link
                href={`/strategy/${strategy.id}`}
                className="flex items-center justify-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 transition-all"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                View All Picks & Results
              </Link>
            </PaywallOverlay>
          </div>
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

      </div>

      {/* ── How Our System Works — 3-step explanation ────────────────────────── */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-5 w-5 text-blue-400" />
          <h2 className="text-base font-bold text-slate-100">How Our System Works</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Step 1: The AI Model */}
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/[0.05] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-bold text-sm">1</div>
              <p className="text-sm font-bold text-blue-400">Our AI Model Analyzes</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our ensemble combines 3 proven models - <span className="text-slate-200 font-medium">Elo ratings</span> (team strength),
              <span className="text-slate-200 font-medium"> Poisson distribution</span> (goal prediction), and
              <span className="text-slate-200 font-medium"> Logistic regression</span> (pattern recognition) - to calculate
              win/draw/loss probabilities for every upcoming match.
            </p>
          </div>

          {/* Step 2: Strategy Filters */}
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-sm">2</div>
              <p className="text-sm font-bold text-emerald-400">A Strategy Filters</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              A strategy is a set of rules that selects only the <span className="text-slate-200 font-medium">best opportunities</span> from the model{"'"}s output.
              For example: {"\""}only follow picks where the home team has {">"} 60% predicted win probability{"\""}
              or {"\""}only back matches with low draw probability{"\""}.  Each strategy has a different risk/reward profile.
            </p>
          </div>

          {/* Step 3: You Follow */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.05] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-sm">3</div>
              <p className="text-sm font-bold text-amber-400">You Follow the Picks</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="text-slate-200 font-medium">Pick a strategy below</span>, then click
              <span className="text-slate-200 font-medium"> {"\""}View All Picks & Results{"\""}</span> to see which upcoming matches
              it recommends. Each strategy shows its <span className="text-slate-200 font-medium">historical win rate and ROI</span> so you can
              choose based on real backtested data.
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
            Archived - Not Profitable ({archivedStrategies.length})
          </button>
          {showArchived && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {archivedStrategies.map(s => <RealStrategyCard key={s.id} strategy={s} />)}
            </div>
          )}
        </div>
      )}



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
            metrics only - not betting P/L, which requires backtest analysis.
          </p>
        </div>
      )}


    </div>
  );
}
