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
import Image from "next/image";
import { api } from "@/lib/api";
import { useTranslations } from "@/i18n/locale-provider";
import { PaywallOverlay } from "@/components/ui/paywall-overlay";
import { UpsellBanner } from "@/components/ui/upsell-banner";
import { RelatedLinks } from "@/components/ui/related-links";
import { Sparkles, FlaskConical, ClipboardList } from "lucide-react";
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
  awayProb: number,
  t: (key: any) => string
): string {
  const label = outcome === "home_win"
    ? t("results.outcomeHomeWin")
    : outcome === "away_win"
    ? t("results.outcomeAwayWin")
    : outcome === "draw"
    ? t("results.outcomeDraw")
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
  const { t } = useTranslations();
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
          <h2 className="text-sm font-semibold text-slate-200">{t("results.thisWeekPerformance")}</h2>
        </div>
        <p className="text-sm text-slate-500 italic">{t("results.noResultsThisWeek")}</p>
      </div>
    );
  }

  const winRatePct = Math.round(data.win_rate * 100);
  const plSign = data.pl_units >= 0 ? "+" : "";

  const statItems = [
    { label: t("results.statTotalCalls"), value: String(data.total_calls), color: "#3b82f6" },
    { label: t("results.statWon"), value: String(data.won), color: "#10b981" },
    { label: t("results.statLost"), value: String(data.lost), color: "#ef4444" },
    { label: t("results.statWinRate"), value: `${winRatePct}%`, color: winRatePct >= 50 ? "#10b981" : "#ef4444" },
    {
      label: t("results.statPLUnits"),
      value: `${plSign}${data.pl_units.toFixed(1)}`,
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
        <h2 className="text-sm font-semibold text-slate-200">{t("results.thisWeekPerformance")}</h2>
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
                  {t("results.bestPerformers")}
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
                  {t("results.worstPerformers")}
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
  const { t } = useTranslations();
  const periods: { value: PeriodFilter; label: string }[] = [
    { value: 7,  label: t("results.last7Days") },
    { value: 14, label: t("results.last14Days") },
    { value: 30, label: t("results.last30Days") },
  ];

  const resultOptions: { value: ResultFilter; label: string }[] = [
    { value: "All", label: t("results.filterAll") },
    { value: "Correct", label: t("results.filterCorrect") },
    { value: "Incorrect", label: t("results.filterIncorrect") },
  ];

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
                key={opt.value}
                onClick={() => setResultFilter(opt.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  resultFilter === opt.value
                    ? opt.value === "Correct"
                      ? "bg-emerald-600/80 text-white"
                      : opt.value === "Incorrect"
                      ? "bg-red-600/80 text-white"
                      : "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {opt.label}
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
                <option value="">{t("results.allLeagues")}</option>
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
          {total} {total !== 1 ? t("results.resultsPlural") : t("results.resultSingular")}
        </span>
      </div>
    </div>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────

function ResultCard({ fixture }: { fixture: Fixture }) {
  const { t } = useTranslations();
  const pred = fixture.prediction;
  const hasPrediction = pred !== null;

  // Determine correctness from result vs prediction
  let isCorrect: boolean | null = null;
  let predictedSide: "home" | "draw" | "away" | null = null;
  if (hasPrediction && fixture.result) {
    const { home_score, away_score } = fixture.result;
    const actualOutcome =
      home_score > away_score ? "home_win" :
      away_score > home_score ? "away_win" : "draw";
    if (
      pred!.home_win_prob >= pred!.away_win_prob &&
      pred!.home_win_prob >= (pred!.draw_prob ?? 0)
    ) {
      predictedSide = "home";
    } else if ((pred!.draw_prob ?? 0) >= pred!.away_win_prob) {
      predictedSide = "draw";
    } else {
      predictedSide = "away";
    }
    const predicted =
      predictedSide === "home"
        ? "home_win"
        : predictedSide === "away"
        ? "away_win"
        : "draw";
    isCorrect = actualOutcome === predicted;
  }

  // v6 B2: compute realised P/L for this pick using the pre-match
  // odds from fixture.odds when available. Falls back to a flat 1.90
  // assumption ONLY if we have no odds row at all — matches the
  // backend ROI calculator's fallback behaviour.
  let realisedPnl: number | null = null;
  let pnlSource: "real" | "estimated" | null = null;
  if (isCorrect !== null && predictedSide !== null) {
    const odds = fixture.odds;
    let oddsUsed: number | null = null;
    if (odds && predictedSide === "home" && odds.home != null) {
      oddsUsed = odds.home;
    } else if (odds && predictedSide === "draw" && odds.draw != null) {
      oddsUsed = odds.draw;
    } else if (odds && predictedSide === "away" && odds.away != null) {
      oddsUsed = odds.away;
    }
    if (oddsUsed != null && oddsUsed > 1) {
      pnlSource = "real";
    } else {
      oddsUsed = 1.9;
      pnlSource = "estimated";
    }
    realisedPnl = isCorrect ? oddsUsed - 1 : -1;
  }

  const homeScore = fixture.result?.home_score ?? null;
  const awayScore = fixture.result?.away_score ?? null;

  // Compact pick label
  let pickLabel = "—";
  if (hasPrediction) {
    if (pred!.home_win_prob >= pred!.away_win_prob && pred!.home_win_prob >= (pred!.draw_prob ?? 0)) pickLabel = "1";
    else if ((pred!.draw_prob ?? 0) >= pred!.away_win_prob) pickLabel = "X";
    else pickLabel = "2";
  }

  const borderColor = isCorrect === true ? "#10b981" : isCorrect === false ? "#ef4444" : "#334155";

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      {/* Date */}
      <span className="w-16 shrink-0 text-xs text-slate-500 tabular-nums">
        {new Date(fixture.scheduled_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
      </span>

      {/* Home team */}
      <span className={`flex-1 flex items-center gap-1.5 text-sm font-medium truncate ${isCorrect === true && pickLabel === "1" ? "text-emerald-300" : "text-slate-200"}`}>
        {fixture.home_team_logo && (
          <Image src={fixture.home_team_logo} alt="" width={18} height={18} className="rounded-full shrink-0" />
        )}
        {fixture.home_team_name}
      </span>

      {/* Score */}
      <span className="w-14 text-center text-sm font-bold tabular-nums text-slate-100">
        {homeScore ?? "–"} - {awayScore ?? "–"}
      </span>

      {/* Away team */}
      <span className={`flex-1 flex items-center gap-1.5 text-sm font-medium truncate ${isCorrect === true && pickLabel === "2" ? "text-emerald-300" : "text-slate-200"}`}>
        {fixture.away_team_logo && (
          <Image src={fixture.away_team_logo} alt="" width={18} height={18} className="rounded-full shrink-0" />
        )}
        {fixture.away_team_name}
      </span>

      {/* Pick */}
      <span
        className="w-8 text-center text-xs font-bold rounded"
        style={{ color: isCorrect === true ? "#10b981" : isCorrect === false ? "#ef4444" : "#64748b" }}
      >
        {pickLabel}
      </span>

      {/* Result icon */}
      <span className="w-8 text-center">
        {isCorrect === true ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400 inline" />
        ) : isCorrect === false ? (
          <XCircle className="h-4 w-4 text-red-400 inline" />
        ) : (
          <span className="text-xs text-slate-600">—</span>
        )}
      </span>
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


// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  return (
    <PaywallOverlay feature="results" requiredTier="silver">
      <ResultsPageContent />
    </PaywallOverlay>
  );
}

function ResultsPageContent() {
  const { t } = useTranslations();
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
    queryKey: ["weekly-summary", period],
    queryFn: () => api.getWeeklySummary(period),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  // Unwrap the fixtures array from the response
  const allResults: Fixture[] = resultsQuery.data?.fixtures ?? [];

  // ── Derived league list — only show leagues that have at least 1 finished fixture with a result ──
  const leagues = useMemo(() => {
    const seen = new Set<string>();
    for (const f of allResults) {
      if (f.league_name && f.status === "finished" && f.result) {
        seen.add(f.league_name);
      }
    }
    return Array.from(seen).sort();
  }, [allResults]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let items = [...allResults];

    // Only show finished fixtures that have actual result data
    items = items.filter((f) => f.status === "finished" && f.result);

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
              {t("results.title")}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {t("results.subtitle")}
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

      {/* ── Streak Stats ── */}
      {filtered.length > 0 && (() => {
        // Compute streaks from the visible results
        const evaluated = filtered.filter(f => f.prediction && f.result);
        let currentStreak = 0;
        let maxWinStreak = 0;
        let maxLoseStreak = 0;
        let tempWin = 0;
        let tempLose = 0;
        for (const f of evaluated) {
          const pred = f.prediction!;
          const probs = { home: pred.home_win_prob, draw: pred.draw_prob ?? 0, away: pred.away_win_prob };
          const pick = Object.entries(probs).sort((a, b) => b[1] - a[1])[0][0];
          const winner = f.result!.home_score > f.result!.away_score ? "home" : f.result!.home_score < f.result!.away_score ? "away" : "draw";
          const correct = pick === winner;
          if (correct) { tempWin++; tempLose = 0; maxWinStreak = Math.max(maxWinStreak, tempWin); }
          else { tempLose++; tempWin = 0; maxLoseStreak = Math.max(maxLoseStreak, tempLose); }
        }
        // Current streak from most recent match (index 0 = newest)
        currentStreak = 0;
        for (let i = 0; i < evaluated.length; i++) {
          const f = evaluated[i];
          const pred = f.prediction!;
          const probs = { home: pred.home_win_prob, draw: pred.draw_prob ?? 0, away: pred.away_win_prob };
          const pick = Object.entries(probs).sort((a, b) => b[1] - a[1])[0][0];
          const winner = f.result!.home_score > f.result!.away_score ? "home" : f.result!.home_score < f.result!.away_score ? "away" : "draw";
          if (pick === winner) currentStreak++;
          else break;
        }
        return (
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card p-3 text-center">
              <p className="text-[9px] uppercase tracking-widest text-slate-500">{t("results.currentStreak")}</p>
              <p className={`text-xl font-extrabold tabular-nums ${currentStreak > 0 ? "text-emerald-400" : "text-slate-400"}`}>
                {currentStreak > 0 ? `🔥 ${currentStreak}` : "0"}
              </p>
            </div>
            <div className="glass-card p-3 text-center">
              <p className="text-[9px] uppercase tracking-widest text-slate-500">{t("results.bestStreak")}</p>
              <p className="text-xl font-extrabold tabular-nums text-emerald-400">{maxWinStreak}</p>
            </div>
            <div className="glass-card p-3 text-center">
              <p className="text-[9px] uppercase tracking-widest text-slate-500">{t("results.maxLoseStreak")}</p>
              <p className="text-xl font-extrabold tabular-nums text-red-400">{maxLoseStreak}</p>
            </div>
          </div>
        );
      })()}

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
            {t("results.errorLoading")}
          </p>
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : allResults.filter((f) => f.status === "finished" && f.result).length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Trophy className="h-8 w-8 text-slate-600" />
          <p className="text-base font-medium text-slate-400">{t("results.noResults")}</p>
          <p className="text-sm text-slate-600">
            {t("results.noResultsHint")}
          </p>
          {period < 30 && (
            <button
              onClick={() => setPeriod(30)}
              className="btn-gradient mt-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            >
              {t("results.expandTo30Days")}
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Trophy className="h-8 w-8 text-slate-600" />
          <p className="text-base font-medium text-slate-400">{t("results.noResultsMatchFilters")}</p>
          <p className="text-sm text-slate-600">
            {t("results.noResultsMatchFiltersHint")}
          </p>
          <button
            onClick={() => { setResultFilter("All"); setLeagueFilter(""); }}
            className="btn-gradient mt-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          >
            {t("results.clearFilters")}
          </button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          {/* Column headers */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.05] text-[9px] uppercase tracking-widest text-slate-600">
            <span className="w-16 shrink-0">Date</span>
            <span className="flex-1">Home</span>
            <span className="w-14 text-center">Score</span>
            <span className="flex-1">Away</span>
            <span className="w-8 text-center">Pick</span>
            <span className="w-8 text-center">Result</span>
          </div>
          {/* Rows */}
          <div className="divide-y divide-white/[0.03]">
            {filtered.map((fixture) => (
              <ResultCard key={fixture.id} fixture={fixture} />
            ))}
          </div>
        </div>
      )}

      {/* Upsell: Platinum lifetime */}
      <UpsellBanner
        targetTier="platinum"
        headline={t("results.upsellHeadline")}
        subtext={t("results.upsellSubtext")}
        variant="inline"
      />

      {/* Related pages */}
      <RelatedLinks
        title={t("related.title")}
        links={[
          { label: t("related.predictions"), href: "/predictions", description: t("related.predictionsDesc"), icon: Sparkles },
          { label: t("related.strategyLab"), href: "/strategy", description: t("related.strategyLabDesc"), icon: FlaskConical },
          { label: t("related.trackRecord"), href: "/trackrecord", description: t("related.trackRecordDesc"), icon: ClipboardList },
        ]}
      />

    </div>
  );
}
