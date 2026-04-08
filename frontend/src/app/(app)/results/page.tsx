"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  ChevronDown,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Fixture, WeeklySummary } from "@/types/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type PeriodFilter = 7 | 14 | 30;
type ResultFilter = "All" | "Correct" | "Incorrect";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatMatchDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function getConfidenceColor(conf: number): string {
  if (conf >= 0.75) return "#10b981";
  if (conf >= 0.5) return "#f59e0b";
  return "#ef4444";
}

function getConfidenceBg(conf: number): string {
  if (conf >= 0.75) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (conf >= 0.5) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return "bg-red-500/10 text-red-400 border-red-500/20";
}

function formatPredictedOutcome(
  outcome: string,
  homeProb: number,
  drawProb: number | null,
  awayProb: number
): string {
  const label = outcome === "home_win"
    ? "Home Win"
    : outcome === "away_win"
    ? "Away Win"
    : outcome === "draw"
    ? "Draw"
    : slugToTitle(outcome);

  const prob = outcome === "home_win"
    ? homeProb
    : outcome === "away_win"
    ? awayProb
    : (drawProb ?? 0);

  return `${label} @ ${Math.round(prob * 100)}%`;
}

// ─── Weekly Summary Card ──────────────────────────────────────────────────────

function WeeklySummaryCard({ data, isLoading, isError }: {
  data: WeeklySummary | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return (
      <div
        className="glass-card animate-pulse p-6"
        style={{ borderColor: "rgba(16,185,129,0.18)", border: "1px solid" }}
      >
        <div className="h-5 w-48 rounded bg-white/[0.06] mb-4" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded bg-white/[0.06]" />
          ))}
        </div>
        <div className="h-4 w-full rounded bg-white/[0.04]" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div
        className="glass-card p-6"
        style={{ border: "1px solid rgba(16,185,129,0.18)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-slate-200">This Week&apos;s Performance</h2>
        </div>
        <p className="text-sm text-slate-500 italic">No results this week yet.</p>
      </div>
    );
  }

  const winRatePct = Math.round(data.win_rate * 100);
  const plSign = data.pl_units >= 0 ? "+" : "";

  const statItems = [
    { label: "Total Calls", value: String(data.total_calls), color: "#3b82f6" },
    { label: "Won", value: String(data.won), color: "#10b981" },
    { label: "Lost", value: String(data.lost), color: "#ef4444" },
    { label: "Win Rate", value: `${winRatePct}%`, color: winRatePct >= 50 ? "#10b981" : "#ef4444" },
    {
      label: "P/L Units",
      value: `${plSign}${data.pl_units.toFixed(1)}u`,
      color: data.pl_units >= 0 ? "#10b981" : "#ef4444",
    },
  ];

  return (
    <div
      className="glass-card p-6"
      style={{ border: "1px solid rgba(16,185,129,0.18)" }}
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
          <Trophy className="h-4 w-4 text-emerald-400" />
        </div>
        <h2 className="text-sm font-semibold text-slate-200">This Week&apos;s Performance</h2>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-5">
        {statItems.map(({ label, value, color }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center gap-1 rounded-lg bg-white/[0.03] border border-white/[0.06] py-3 px-2 text-center"
          >
            <span
              className="text-2xl font-extrabold leading-none tabular-nums"
              style={{ color }}
            >
              {value}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Performers */}
      {(data.best_performers?.length > 0 || data.worst_performers?.length > 0) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.best_performers?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-500">
                  Best Performers
                </span>
              </div>
              <div className="space-y-1.5">
                {data.best_performers.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between rounded-lg bg-emerald-500/5 border border-emerald-500/10 px-3 py-1.5"
                  >
                    <span className="text-xs text-slate-300 truncate">{p.name}</span>
                    <span className="text-xs font-bold text-emerald-400 shrink-0 ml-2">
                      {Math.round(p.accuracy * 100)}% ({p.total})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.worst_performers?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-red-500">
                  Worst Performers
                </span>
              </div>
              <div className="space-y-1.5">
                {data.worst_performers.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between rounded-lg bg-red-500/5 border border-red-500/10 px-3 py-1.5"
                  >
                    <span className="text-xs text-slate-300 truncate">{p.name}</span>
                    <span className="text-xs font-bold text-red-400 shrink-0 ml-2">
                      {Math.round(p.accuracy * 100)}% ({p.total})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  period: PeriodFilter;
  setPeriod: (v: PeriodFilter) => void;
  resultFilter: ResultFilter;
  setResultFilter: (v: ResultFilter) => void;
  leagueFilter: string;
  setLeagueFilter: (v: string) => void;
  leagues: string[];
  total: number;
}

function ResultsFilterBar({
  period,
  setPeriod,
  resultFilter,
  setResultFilter,
  leagueFilter,
  setLeagueFilter,
  leagues,
  total,
}: FilterBarProps) {
  const periods: { value: PeriodFilter; label: string }[] = [
    { value: 7,  label: "Last 7 days" },
    { value: 14, label: "Last 14 days" },
    { value: 30, label: "Last 30 days" },
  ];

  const resultOptions: ResultFilter[] = ["All", "Correct", "Incorrect"];

  return (
    <div className="glass-card p-4">
      <div className="flex flex-wrap items-center gap-3">

        {/* Period */}
        <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1">
          {periods.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                period === value
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Result filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1">
            {resultOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setResultFilter(opt)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  resultFilter === opt
                    ? opt === "Correct"
                      ? "bg-emerald-600/80 text-white"
                      : opt === "Incorrect"
                      ? "bg-red-600/80 text-white"
                      : "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* League dropdown */}
        {leagues.length > 0 && (
          <div className="relative flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <div className="relative">
              <select
                value={leagueFilter}
                onChange={(e) => setLeagueFilter(e.target.value)}
                className="appearance-none rounded-lg border border-white/[0.06] bg-white/[0.03] pl-3 pr-7 py-1.5 text-xs font-semibold text-slate-300 focus:outline-none focus:border-blue-500/40 cursor-pointer"
              >
                <option value="">All Leagues</option>
                {leagues.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
            </div>
          </div>
        )}

        {/* Count */}
        <span className="ml-auto text-xs text-slate-500 whitespace-nowrap">
          {total} result{total !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────

function ResultCard({ fixture }: { fixture: Fixture }) {
  const pred = fixture.prediction;
  const hasPrediction = pred !== null;

  // Determine correctness from result vs prediction
  let isCorrect: boolean | null = null;
  if (hasPrediction && fixture.result) {
    const { home_score, away_score } = fixture.result;
    const actualOutcome =
      home_score > away_score ? "home_win" :
      away_score > home_score ? "away_win" : "draw";
    const predicted =
      pred!.home_win_prob >= pred!.away_win_prob &&
      pred!.home_win_prob >= (pred!.draw_prob ?? 0)
        ? "home_win"
        : (pred!.draw_prob ?? 0) >= pred!.away_win_prob
        ? "draw"
        : "away_win";
    isCorrect = actualOutcome === predicted;
  }

  const homeScore = fixture.result?.home_score ?? null;
  const awayScore = fixture.result?.away_score ?? null;

  return (
    <div className="glass-card-hover overflow-hidden animate-slide-up">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:gap-6">

        {/* ── Left: League + date ── */}
        <div className="flex min-w-0 shrink-0 flex-col gap-1 lg:w-44">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 truncate">
            {fixture.league_name}
          </span>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Calendar className="h-3 w-3 shrink-0" />
            {formatMatchDate(fixture.scheduled_at)}
          </span>
        </div>

        {/* ── Center: Score ── */}
        <div className="flex flex-1 items-center justify-center gap-3 min-w-0">
          <span className="text-base font-semibold text-slate-200 text-right flex-1 truncate">
            {fixture.home_team_name}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className="text-2xl font-extrabold tabular-nums leading-none"
              style={{ color: "#e2e8f0" }}
            >
              {homeScore ?? "–"}
            </span>
            <span className="text-lg font-bold text-slate-500">–</span>
            <span
              className="text-2xl font-extrabold tabular-nums leading-none"
              style={{ color: "#e2e8f0" }}
            >
              {awayScore ?? "–"}
            </span>
          </div>
          <span className="text-base font-semibold text-slate-200 text-left flex-1 truncate">
            {fixture.away_team_name}
          </span>
        </div>

        {/* ── Right: Prediction info + badges ── */}
        <div className="flex shrink-0 flex-col items-end gap-2 lg:w-52">
          {hasPrediction ? (
            <>
              {/* Predicted outcome */}
              <p className="text-xs text-slate-400 text-right">
                <span className="text-slate-500">Prediction: </span>
                {formatPredictedOutcome(
                  pred!.home_win_prob >= pred!.away_win_prob &&
                  pred!.home_win_prob >= (pred!.draw_prob ?? 0)
                    ? "home_win"
                    : (pred!.draw_prob ?? 0) >= pred!.away_win_prob
                    ? "draw"
                    : "away_win",
                  pred!.home_win_prob,
                  pred!.draw_prob,
                  pred!.away_win_prob
                )}
              </p>

              {/* Result badge */}
              {isCorrect === true && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  CORRECT
                </span>
              )}
              {isCorrect === false && (
                <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/25 px-3 py-1 text-xs font-bold text-red-400">
                  <XCircle className="h-3.5 w-3.5" />
                  INCORRECT
                </span>
              )}
              {isCorrect === null && (
                <span className="rounded-full bg-slate-500/10 border border-slate-500/20 px-3 py-1 text-xs font-medium text-slate-500">
                  Pending eval
                </span>
              )}

              {/* Confidence badge */}
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getConfidenceBg(pred!.confidence)}`}
              >
                {Math.round(pred!.confidence * 100)}% confidence
              </span>
            </>
          ) : (
            <span className="text-xs text-slate-600 italic">No prediction made</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex-shrink-0 lg:w-44 space-y-2">
          <div className="h-3 w-24 rounded bg-white/[0.06]" />
          <div className="h-3 w-32 rounded bg-white/[0.04]" />
        </div>
        <div className="flex-1 flex items-center justify-center gap-4">
          <div className="h-4 flex-1 max-w-[120px] rounded bg-white/[0.06]" />
          <div className="h-8 w-16 rounded bg-white/[0.06]" />
          <div className="h-4 flex-1 max-w-[120px] rounded bg-white/[0.06]" />
        </div>
        <div className="flex-shrink-0 lg:w-52 flex flex-col items-end gap-2">
          <div className="h-3 w-32 rounded bg-white/[0.06]" />
          <div className="h-6 w-24 rounded-full bg-white/[0.06]" />
          <div className="h-5 w-28 rounded-full bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

// ─── Disclaimer ───────────────────────────────────────────────────────────────

function Disclaimer() {
  return (
    <div
      className="rounded-xl border p-4 flex items-start gap-3"
      style={{
        background: "rgba(245,158,11,0.04)",
        borderColor: "rgba(245,158,11,0.22)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
      </div>
      <p className="text-xs leading-relaxed text-slate-400">
        All predictions shown are{" "}
        <span className="font-semibold text-slate-300">historical model outputs</span> for educational
        purposes only. Past accuracy does not guarantee future performance.
        This is not financial advice. Always gamble responsibly.
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const [period, setPeriod] = useState<PeriodFilter>(7);
  const [resultFilter, setResultFilter] = useState<ResultFilter>("All");
  const [leagueFilter, setLeagueFilter] = useState<string>("");

  // ── Queries ────────────────────────────────────────────────────────────────
  const resultsQuery = useQuery({
    queryKey: ["fixture-results", period, leagueFilter],
    queryFn: () => api.getFixtureResults(period, leagueFilter || undefined),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const summaryQuery = useQuery({
    queryKey: ["weekly-summary"],
    queryFn: () => api.getWeeklySummary(),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  // Unwrap the fixtures array from the response
  const allResults: Fixture[] = resultsQuery.data?.fixtures ?? [];

  // ── Derived league list ────────────────────────────────────────────────────
  const leagues = useMemo(() => {
    const seen = new Set<string>();
    for (const f of allResults) {
      if (f.league_name) seen.add(f.league_name);
    }
    return Array.from(seen).sort();
  }, [allResults]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let items = [...allResults];

    // Only show finished fixtures on the results page
    items = items.filter((f) => f.status === "finished");

    if (leagueFilter) {
      items = items.filter((f) => f.league_name === leagueFilter);
    }

    if (resultFilter !== "All") {
      items = items.filter((f) => {
        const pred = f.prediction;
        if (!pred || !f.result) return false;
        const { home_score, away_score } = f.result;
        const actualOutcome =
          home_score > away_score ? "home_win" :
          away_score > home_score ? "away_win" : "draw";
        const predicted =
          pred.home_win_prob >= pred.away_win_prob &&
          pred.home_win_prob >= (pred.draw_prob ?? 0)
            ? "home_win"
            : (pred.draw_prob ?? 0) >= pred.away_win_prob
            ? "draw"
            : "away_win";
        const correct = actualOutcome === predicted;
        return resultFilter === "Correct" ? correct : !correct;
      });
    }

    // Sort by date descending (most recent first)
    items.sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));

    return items;
  }, [allResults, resultFilter, leagueFilter]);

  const isLoading = resultsQuery.isLoading;
  const hasError = resultsQuery.isError;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
            <Trophy className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight gradient-text leading-tight">
              Results &amp; Outcomes
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Match results and prediction accuracy
            </p>
          </div>
        </div>
      </div>

      {/* ── Weekly Summary ── */}
      <WeeklySummaryCard
        data={summaryQuery.data}
        isLoading={summaryQuery.isLoading}
        isError={summaryQuery.isError}
      />

      {/* ── Filter bar ── */}
      <ResultsFilterBar
        period={period}
        setPeriod={setPeriod}
        resultFilter={resultFilter}
        setResultFilter={setResultFilter}
        leagueFilter={leagueFilter}
        setLeagueFilter={setLeagueFilter}
        leagues={leagues}
        total={filtered.length}
      />

      {/* ── Error banner ── */}
      {hasError && (
        <div
          className="rounded-xl border p-4 flex items-start gap-3"
          style={{ background: "rgba(239,68,68,0.04)", borderColor: "rgba(239,68,68,0.25)" }}
        >
          <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-400">
            Could not load results data. The API may be temporarily unavailable.
          </p>
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : allResults.filter((f) => f.status === "finished").length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Trophy className="h-8 w-8 text-slate-600" />
          <p className="text-base font-medium text-slate-400">No results found</p>
          <p className="text-sm text-slate-600">
            No finished matches with results in the selected period. Try a wider date range.
          </p>
          {period < 30 && (
            <button
              onClick={() => setPeriod(30)}
              className="btn-gradient mt-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            >
              Expand to 30 days
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Trophy className="h-8 w-8 text-slate-600" />
          <p className="text-base font-medium text-slate-400">No results match your filters</p>
          <p className="text-sm text-slate-600">
            Try adjusting the period or result filter above.
          </p>
          <button
            onClick={() => { setResultFilter("All"); setLeagueFilter(""); }}
            className="btn-gradient mt-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((fixture) => (
            <ResultCard key={fixture.id} fixture={fixture} />
          ))}
        </div>
      )}

      {/* ── Disclaimer ── */}
      <Disclaimer />
    </div>
  );
}
