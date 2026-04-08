"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FlaskConical,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Database,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Info,
  BarChart3,
  TrendingUp,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { TrackrecordSummary } from "@/types/api";

// ─── Minimum predictions required before a backtest is meaningful ────────────

const BACKTEST_MINIMUM = 100;

// ─── Strategy definitions (templates — no performance numbers) ───────────────

const STRATEGY_TEMPLATES = [
  {
    id: "A",
    name: "Value Edge 1X2",
    type: "Match Result (1X2)",
    sport: "Football",
    color: "blue" as const,
    description:
      "Identifies mispriced match-result outcomes where the model's implied probability exceeds the bookmaker's implied probability by more than 5 percentage points. Relies on Poisson-based expected-goals models cross-validated on historical league data.",
    dataNeeds: [
      "Minimum 100 resolved match predictions with 1X2 outcomes",
      "At least 3 months of consecutive prediction history",
      "Odds data captured at time of prediction (for expected-value calculation)",
    ],
    howItWorks: [
      "Model outputs P(home), P(draw), P(away) for each fixture",
      "Convert bookmaker odds to implied probability (remove overround)",
      "Flag bets where model probability > implied probability + 5%",
      "Flat 1-unit stake on each flagged bet",
    ],
  },
  {
    id: "B",
    name: "Over/Under Goals",
    type: "Goals Market (O/U 2.5)",
    sport: "Football",
    color: "emerald" as const,
    description:
      "Targets goal-line market inefficiencies by modelling expected goals (xG) for each fixture independently. Combines attack/defence strength ratings with home-advantage and rest-day adjustments to estimate total goal distributions.",
    dataNeeds: [
      "Minimum 100 resolved predictions with goals outcomes",
      "xG data or score data for model training",
      "Over/Under 2.5 odds at time of prediction",
    ],
    howItWorks: [
      "Estimate xG for home and away team using Dixon-Coles variant",
      "Derive P(over 2.5 goals) from bivariate Poisson distribution",
      "Compare to market implied probability; bet where edge > 5%",
      "Flat 1-unit stake per bet signal",
    ],
  },
  {
    id: "C",
    name: "NBA Spread Edge",
    type: "Point Spread",
    sport: "Basketball",
    color: "amber" as const,
    description:
      "Regression-based spread model for NBA games that incorporates rest-day differentials, travel distance, pace, and rolling 10-game form to predict margin of victory. Bets against the spread when the model's predicted margin diverges from the bookmaker line by more than 2.5 points.",
    dataNeeds: [
      "Minimum 100 resolved NBA spread predictions",
      "Rest-day and travel data for each team",
      "Closing-line spread odds at time of prediction",
    ],
    howItWorks: [
      "Fit ridge regression on rolling team performance metrics",
      "Predict point-spread margin for each game",
      "Bet the spread when |model margin − bookmaker line| > 2.5",
      "Flat 1-unit stake; exit if model edge deteriorates mid-season",
    ],
  },
];

// ─── Demo entries (clearly synthetic) ────────────────────────────────────────

const DEMO_ENTRIES = [
  { id: 1, match: "Team A vs Team B", selection: "Home Win",  odds: 1.95, modelProb: "63.2%", result: "Won",     pnl: "+0.95u" },
  { id: 2, match: "Team C vs Team D", selection: "Over 2.5",  odds: 1.82, modelProb: "67.4%", result: "Lost",    pnl: "-1.00u" },
  { id: 3, match: "Team E vs Team F", selection: "Away Win",  odds: 2.10, modelProb: "55.1%", result: "Won",     pnl: "+1.10u" },
  { id: 4, match: "Team G vs Team H", selection: "Under 2.5", odds: 1.88, modelProb: "61.8%", result: "Won",     pnl: "+0.88u" },
  { id: 5, match: "Team I vs Team J", selection: "Home Win",  odds: 2.05, modelProb: "58.9%", result: "Lost",    pnl: "-1.00u" },
  { id: 6, match: "Team K vs Team L", selection: "Over 2.5",  odds: 1.78, modelProb: "70.2%", result: "Won",     pnl: "+0.78u" },
  { id: 7, match: "Team M vs Team N", selection: "Home Win",  odds: 1.90, modelProb: "62.5%", result: "Won",     pnl: "+0.90u" },
];

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

// ─── Strategy Template Card ───────────────────────────────────────────────────

function StrategyTemplateCard({
  strategy,
  status,
}: {
  strategy: (typeof STRATEGY_TEMPLATES)[0];
  status: ReturnType<typeof getDataStatus>;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const colors = {
    blue: {
      header: "from-blue-500/10 to-blue-500/0",
      accent: "text-blue-400",
      ring: "ring-blue-500/20",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      bar: "bg-blue-500",
    },
    emerald: {
      header: "from-emerald-500/10 to-emerald-500/0",
      accent: "text-emerald-400",
      ring: "ring-emerald-500/20",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      bar: "bg-emerald-500",
    },
    amber: {
      header: "from-amber-500/10 to-amber-500/0",
      accent: "text-amber-400",
      ring: "ring-amber-500/20",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      bar: "bg-amber-500",
    },
  };

  const c = colors[strategy.color];

  return (
    <div className="glass-card flex flex-col overflow-hidden animate-fade-in">
      {/* Header */}
      <div className={cn("bg-gradient-to-r p-5", c.header)}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
              {strategy.sport} · {strategy.type}
            </p>
            <h3 className="text-base font-bold text-slate-100">{strategy.name}</h3>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-slate-500/30 bg-slate-500/10 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
            <Clock className="h-3 w-3" />
            Not yet backtested
          </span>
        </div>
        <p className="text-xs leading-relaxed text-slate-400">{strategy.description}</p>
      </div>

      {/* Data progress */}
      <div className="px-5 py-4 border-t border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5" />
            Data collection progress
          </span>
          <span className={cn("font-semibold tabular-nums", status.ready ? "text-emerald-400" : "text-amber-400")}>
            {status.pct}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", status.ready ? "bg-emerald-500" : c.bar)}
            style={{ width: `${status.pct}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-500">{status.label}</p>
      </div>

      {/* Expandable details */}
      <div className="px-5 pb-5 flex-1 space-y-4">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Info className="h-3.5 w-3.5" />
          {expanded ? "Hide" : "Show"} strategy details
        </button>

        {expanded && (
          <div className="space-y-4 animate-fade-in">
            {/* How it works */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">How it works</p>
              <ol className="space-y-1">
                {strategy.howItWorks.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className={cn("flex-shrink-0 font-bold tabular-nums mt-px", c.accent)}>{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Data needed */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Data required to backtest</p>
              <ul className="space-y-1">
                {strategy.dataNeeds.map((need, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="flex-shrink-0 text-amber-400 mt-0.5">·</span>
                    {need}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
            "flex items-start gap-3 rounded-full border p-4",
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
            <div className="rounded-full border border-white/[0.06] bg-white/[0.02] p-3 space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Predictions</p>
              <p className="text-lg font-bold text-slate-100 tabular-nums">{status.count.toLocaleString()}</p>
            </div>
            <div className="rounded-full border border-white/[0.06] bg-white/[0.02] p-3 space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Required</p>
              <p className="text-lg font-bold text-slate-400 tabular-nums">{BACKTEST_MINIMUM}</p>
            </div>
            <div className="rounded-full border border-white/[0.06] bg-white/[0.02] p-3 space-y-0.5">
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
              "flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-all",
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
              "rounded-full border p-3 text-xs",
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

// ─── Simulated Demo Section ───────────────────────────────────────────────────

function SimulatedDemoSection() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Prominent demo label */}
      <div className="rounded-full border-2 border-dashed border-amber-500/40 bg-amber-500/[0.04] p-5 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <p className="text-sm font-bold text-amber-400 uppercase tracking-wide">
            Simulated Demo — NOT Real Results
          </p>
        </div>
        <p className="text-xs leading-relaxed text-slate-400">
          The table below is a <span className="font-semibold text-amber-300">purely synthetic example</span> showing
          what a backtested strategy log would look like once real predictions have been collected and resolved.
          Every match name, odds, and outcome below is{" "}
          <span className="font-semibold text-amber-300">fabricated for illustration purposes only</span>.
          No real bets have been placed, no real money is involved, and these numbers have no bearing on any
          financial outcome.
        </p>
      </div>

      {/* Demo table */}
      <div className="glass-card overflow-hidden">
        {/* Demo watermark header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-amber-500/[0.04] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
              Demo Data
            </span>
            <p className="text-xs text-slate-500">Example format — not real predictions</p>
          </div>
          <XCircle className="h-4 w-4 text-amber-500/40" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                {["#", "Match (DEMO)", "Selection", "Odds", "Model Prob", "Result", "P/L"].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-600"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {DEMO_ENTRIES.map((entry, idx) => (
                <tr
                  key={entry.id}
                  className={cn(
                    "opacity-60 transition-colors",
                    idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
                  )}
                >
                  <td className="px-4 py-2.5 font-mono text-slate-600">{entry.id}</td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-slate-400">{entry.match}</p>
                    <p className="text-[10px] text-slate-600">EXAMPLE ONLY</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-full bg-slate-500/10 border border-slate-500/15 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      {entry.selection}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{entry.odds.toFixed(2)}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{entry.modelProb}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn(
                      "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      entry.result === "Won"
                        ? "bg-emerald-500/10 text-emerald-500/60 border-emerald-500/15"
                        : "bg-red-500/10 text-red-500/60 border-red-500/15"
                    )}>
                      {entry.result}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono font-bold">
                    <span className={entry.pnl.startsWith("+") ? "text-emerald-500/60" : "text-red-500/60"}>
                      {entry.pnl}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-white/[0.06] bg-amber-500/[0.03] px-4 py-2">
          <p className="text-[10px] text-amber-600">
            This demo table has {DEMO_ENTRIES.length} fabricated rows. When real backtesting runs, this will be
            replaced with actual model predictions and verified outcomes from the database.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StrategyPage() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["trackrecord-summary"],
    queryFn: () => api.getTrackrecordSummary(),
  });

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
              Quantitative strategy templates. Backtesting will activate once sufficient real prediction
              data has been collected.
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
        <div className="mt-4 flex items-start gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-400 mt-0.5" />
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="font-semibold text-amber-400">No backtest results exist yet.</span>{" "}
            The strategies below are templates describing how each model works. Performance numbers
            (win rate, ROI, P/L) will only appear after real predictions have been collected and the
            backtest has been run. There are currently{" "}
            <span className="font-semibold text-slate-300">
              {summaryLoading ? "..." : dataStatus.count.toLocaleString()}
            </span>{" "}
            predictions in the database (minimum {BACKTEST_MINIMUM} required).
          </p>
        </div>
      </div>

      {/* ── Strategy Templates Section Header ─────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-5 w-5 text-blue-400" />
        <div>
          <h2 className="text-lg font-bold text-slate-100">Strategy Templates</h2>
          <p className="text-xs text-slate-500">Not yet backtested on live data</p>
        </div>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-slate-600 border border-slate-700 rounded px-2 py-0.5">
          Templates only
        </span>
      </div>

      {/* ── Strategy Template Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STRATEGY_TEMPLATES.map((s) => (
          <StrategyTemplateCard key={s.id} strategy={s} status={dataStatus} />
        ))}
      </div>

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
                <div key={stat.label} className="rounded-full border border-white/[0.06] bg-white/[0.02] p-4 space-y-1">
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

      {/* ── Simulated Demo Section ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-100">Example: What Backtested Results Look Like</h2>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
            Demo only
          </span>
        </div>
        <SimulatedDemoSection />
      </div>

      {/* ── Bottom Disclaimer ─────────────────────────────────────────────────── */}
      <div className="rounded-full border border-amber-500/20 bg-amber-500/[0.04] p-5 animate-fade-in">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Important Notice</p>
            <p className="text-xs leading-relaxed text-slate-400">
              This page shows <span className="font-semibold text-slate-300">strategy templates only</span> — no
              backtested performance results exist yet. The simulated demo at the bottom is a{" "}
              <span className="font-semibold text-amber-400">fabricated illustration</span> of the output format and
              contains no real match data, real odds, or real outcomes. Do not use any figures on this page as the
              basis for financial, investment, or wagering decisions. Backtesting will be enabled once the system has
              collected a minimum of {BACKTEST_MINIMUM} resolved predictions from real matches.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
