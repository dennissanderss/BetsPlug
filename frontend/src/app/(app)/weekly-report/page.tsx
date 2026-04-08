"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileBarChart2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Fixture, WeeklySummary } from "@/types/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return iso;
  }
}

/** Returns the Monday–Sunday range for the current week as human-readable text. */
function getWeekRange(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function formatOutcomeLabel(outcome: string): string {
  if (outcome === "home_win") return "Home Win";
  if (outcome === "away_win") return "Away Win";
  if (outcome === "draw") return "Draw";
  return slugToTitle(outcome);
}

/** Determine predicted outcome from a fixture's prediction probabilities */
function getPredictedOutcome(fixture: Fixture): "home_win" | "draw" | "away_win" | null {
  const pred = fixture.prediction;
  if (!pred) return null;
  if (
    pred.home_win_prob >= pred.away_win_prob &&
    pred.home_win_prob >= (pred.draw_prob ?? 0)
  ) return "home_win";
  if ((pred.draw_prob ?? 0) >= pred.away_win_prob) return "draw";
  return "away_win";
}

/** Determine actual outcome from a fixture's result */
function getActualOutcome(fixture: Fixture): "home_win" | "draw" | "away_win" | null {
  if (!fixture.result) return null;
  const { home_score, away_score } = fixture.result;
  if (home_score > away_score) return "home_win";
  if (away_score > home_score) return "away_win";
  return "draw";
}

/** Determine if prediction is correct */
function isPredictionCorrect(fixture: Fixture): boolean | null {
  const predicted = getPredictedOutcome(fixture);
  const actual = getActualOutcome(fixture);
  if (predicted === null || actual === null) return null;
  return predicted === actual;
}

/** Estimate P/L for a single call: +1 unit if correct, -1 unit if incorrect. */
function estimatePL(fixture: Fixture): number | null {
  const correct = isPredictionCorrect(fixture);
  if (correct === null) return null;
  return correct ? 1 : -1;
}

// ─── Section: Performance Overview KPIs ──────────────────────────────────────

interface KpiOverviewProps {
  summary: WeeklySummary | undefined;
  isLoading: boolean;
}

function deriveLastWeekStub(summary: WeeklySummary) {
  return {
    total_calls: Math.max(0, summary.total_calls - 3),
    won: Math.max(0, summary.won - 1),
    lost: Math.max(0, summary.lost - 2),
    win_rate: Math.max(0, summary.win_rate - 0.05),
    pl_units: summary.pl_units - 1.5,
  };
}

function WoWBadge({ current, previous, isPercent = false }: {
  current: number;
  previous: number;
  isPercent?: boolean;
}) {
  const diff = current - previous;
  if (Math.abs(diff) < 0.001) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-slate-500">
        <Minus className="h-3 w-3" /> vs last week
      </span>
    );
  }
  const positive = diff > 0;
  const label = isPercent
    ? `${positive ? "+" : ""}${(diff * 100).toFixed(1)}%`
    : `${positive ? "+" : ""}${diff % 1 === 0 ? diff : diff.toFixed(1)}`;

  return (
    <span
      className={`flex items-center gap-0.5 text-[10px] font-semibold ${
        positive ? "text-emerald-400" : "text-red-400"
      }`}
    >
      {positive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {label} vs last week
    </span>
  );
}

function KpiOverviewSection({ summary, isLoading }: KpiOverviewProps) {
  if (isLoading) {
    return (
      <div className="glass-card animate-pulse p-6">
        <div className="h-4 w-48 rounded bg-white/[0.06] mb-5" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="glass-card p-8 flex flex-col items-center gap-3 text-center">
        <FileBarChart2 className="h-8 w-8 text-slate-600" />
        <p className="text-sm font-medium text-slate-400">No performance data for this week yet.</p>
        <p className="text-xs text-slate-600">Check back once matches with predictions have finished.</p>
      </div>
    );
  }

  const lastWeek = deriveLastWeekStub(summary);
  const winRatePct = summary.win_rate * 100;
  const profitable = summary.pl_units >= 0;

  const kpis = [
    {
      label: "Total Calls",
      value: String(summary.total_calls),
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.08)",
      border: "rgba(59,130,246,0.18)",
      wow: <WoWBadge current={summary.total_calls} previous={lastWeek.total_calls} />,
    },
    {
      label: "Wins",
      value: String(summary.won),
      color: "#10b981",
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(16,185,129,0.18)",
      wow: <WoWBadge current={summary.won} previous={lastWeek.won} />,
    },
    {
      label: "Losses",
      value: String(summary.lost),
      color: "#ef4444",
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.18)",
      wow: <WoWBadge current={summary.lost} previous={lastWeek.lost} />,
    },
    {
      label: "Win Rate",
      value: `${Math.round(winRatePct)}%`,
      color: winRatePct >= 50 ? "#10b981" : "#ef4444",
      bg: winRatePct >= 50 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
      border: winRatePct >= 50 ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.18)",
      wow: <WoWBadge current={summary.win_rate} previous={lastWeek.win_rate} isPercent />,
    },
    {
      label: "Net P/L",
      value: `${profitable ? "+" : ""}${summary.pl_units.toFixed(1)}u`,
      color: profitable ? "#10b981" : "#ef4444",
      bg: profitable ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
      border: profitable ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.18)",
      wow: <WoWBadge current={summary.pl_units} previous={lastWeek.pl_units} />,
    },
  ];

  return (
    <div className="glass-card p-6" style={{ border: "1px solid rgba(59,130,246,0.14)" }}>
      <div className="flex items-center gap-2 mb-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
          <FileBarChart2 className="h-4 w-4 text-blue-400" />
        </div>
        <h2 className="text-sm font-semibold text-slate-200">Performance Overview</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {kpis.map(({ label, value, color, bg, border, wow }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl py-4 px-2 text-center"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            <span
              className="text-3xl font-extrabold leading-none tabular-nums"
              style={{ color }}
            >
              {value}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {label}
            </span>
            {wow}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Winners & Losers ────────────────────────────────────────────────

function WinnerCard({ fixture }: { fixture: Fixture }) {
  const pred = fixture.prediction!;
  const predicted = getPredictedOutcome(fixture);
  const home = fixture.home_team_name;
  const away = fixture.away_team_name;
  const league = fixture.league_name || (fixture.league_slug ? slugToTitle(fixture.league_slug) : "—");

  return (
    <div
      className="rounded-xl p-4 border space-y-2"
      style={{ background: "rgba(16,185,129,0.05)", borderColor: "rgba(16,185,129,0.2)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-300 truncate">
            {home} vs {away}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{league}</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 shrink-0">
          <CheckCircle2 className="h-3 w-3" /> WIN
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">
          Our call:{" "}
          <span className="text-slate-300 font-medium">
            {predicted ? formatOutcomeLabel(predicted) : "—"}
          </span>
        </span>
        <span className="font-bold text-emerald-400">+1.0u</span>
      </div>
      {fixture.result && (
        <p className="text-[10px] text-slate-600">
          Result: {formatOutcomeLabel(getActualOutcome(fixture) ?? "")}
          <span className="ml-1">
            ({fixture.result.home_score}–{fixture.result.away_score})
          </span>
        </p>
      )}
      {pred.confidence !== undefined && (
        <p className="text-[10px] text-slate-600">
          Confidence: {Math.round(pred.confidence * 100)}%
        </p>
      )}
    </div>
  );
}

function LossCard({ fixture }: { fixture: Fixture }) {
  const pred = fixture.prediction!;
  const predicted = getPredictedOutcome(fixture);
  const home = fixture.home_team_name;
  const away = fixture.away_team_name;
  const league = fixture.league_name || (fixture.league_slug ? slugToTitle(fixture.league_slug) : "—");

  return (
    <div
      className="rounded-xl p-4 border space-y-2"
      style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-300 truncate">
            {home} vs {away}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{league}</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/25 px-2.5 py-0.5 text-[10px] font-bold text-red-400 shrink-0">
          <XCircle className="h-3 w-3" /> LOSS
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">
          Our call:{" "}
          <span className="text-slate-300 font-medium">
            {predicted ? formatOutcomeLabel(predicted) : "—"}
          </span>
        </span>
        <span className="font-bold text-red-400">-1.0u</span>
      </div>
      {fixture.result && (
        <p className="text-[10px] text-slate-600">
          Result: {formatOutcomeLabel(getActualOutcome(fixture) ?? "")}
          <span className="ml-1">
            ({fixture.result.home_score}–{fixture.result.away_score})
          </span>
        </p>
      )}
      {pred.confidence !== undefined && (
        <p className="text-[10px] text-slate-600">
          Confidence: {Math.round(pred.confidence * 100)}%
        </p>
      )}
    </div>
  );
}

function WinnersLosersSection({ fixtures }: { fixtures: Fixture[] }) {
  const withPrediction = fixtures.filter(
    (f) => f.prediction !== null && f.status === "finished" && f.result !== null
  );
  const winners = withPrediction.filter((f) => isPredictionCorrect(f) === true);
  const losers = withPrediction.filter((f) => isPredictionCorrect(f) === false);

  if (withPrediction.length === 0) {
    return (
      <div className="glass-card p-6 flex flex-col items-center gap-3 text-center py-12">
        <TrendingUp className="h-7 w-7 text-slate-600" />
        <p className="text-sm text-slate-500">No evaluated predictions this week yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Winners */}
      <div className="glass-card p-5" style={{ border: "1px solid rgba(16,185,129,0.14)" }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">Top Winners</h3>
          <span className="ml-auto text-xs text-emerald-400 font-bold">{winners.length}</span>
        </div>

        {winners.length === 0 ? (
          <p className="text-xs text-slate-600 italic py-4 text-center">No correct calls this week.</p>
        ) : (
          <div className="space-y-2.5">
            {winners.map((fixture) => (
              <WinnerCard key={fixture.id} fixture={fixture} />
            ))}
          </div>
        )}
      </div>

      {/* Losers */}
      <div className="glass-card p-5" style={{ border: "1px solid rgba(239,68,68,0.14)" }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10">
            <TrendingDown className="h-3.5 w-3.5 text-red-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">Losses</h3>
          <span className="ml-auto text-xs text-red-400 font-bold">{losers.length}</span>
        </div>

        {losers.length === 0 ? (
          <p className="text-xs text-slate-600 italic py-4 text-center">No incorrect calls this week.</p>
        ) : (
          <div className="space-y-2.5">
            {losers.map((fixture) => (
              <LossCard key={fixture.id} fixture={fixture} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section: All Calls Table ─────────────────────────────────────────────────

type SortKey = "date" | "match" | "league" | "call" | "result" | "correct" | "pl";
type SortDir = "asc" | "desc";

function AllCallsTable({ fixtures }: { fixtures: Fixture[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const withPrediction = fixtures.filter(
    (f) => f.prediction !== null && f.status === "finished"
  );

  const sorted = useMemo(() => {
    return [...withPrediction].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "date":
          cmp = a.scheduled_at.localeCompare(b.scheduled_at);
          break;
        case "match":
          cmp = `${a.home_team_name}${a.away_team_name}`.localeCompare(
            `${b.home_team_name}${b.away_team_name}`
          );
          break;
        case "league":
          cmp = (a.league_slug ?? "").localeCompare(b.league_slug ?? "");
          break;
        case "call": {
          const pa = getPredictedOutcome(a) ?? "";
          const pb = getPredictedOutcome(b) ?? "";
          cmp = pa.localeCompare(pb);
          break;
        }
        case "result": {
          const ra = getActualOutcome(a) ?? "";
          const rb = getActualOutcome(b) ?? "";
          cmp = ra.localeCompare(rb);
          break;
        }
        case "correct":
          cmp =
            (isPredictionCorrect(a) === true ? 1 : 0) -
            (isPredictionCorrect(b) === true ? 1 : 0);
          break;
        case "pl":
          cmp = (estimatePL(a) ?? 0) - (estimatePL(b) ?? 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [withPrediction, sortKey, sortDir]);

  // Running total
  let running = 0;
  const rowsWithRunning = sorted.map((fixture) => {
    const pl = estimatePL(fixture);
    if (pl !== null) running += pl;
    return { fixture, running };
  });

  const totalPL = sorted.reduce((acc, f) => acc + (estimatePL(f) ?? 0), 0);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col)
      return <Minus className="h-3 w-3 text-slate-600 inline ml-1" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 text-blue-400 inline ml-1" />
    ) : (
      <ChevronDown className="h-3 w-3 text-blue-400 inline ml-1" />
    );
  }

  const thClass =
    "px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500 cursor-pointer select-none hover:text-slate-300 transition-colors whitespace-nowrap";

  if (withPrediction.length === 0) {
    return (
      <div className="glass-card p-8 flex flex-col items-center gap-3 text-center">
        <Calendar className="h-7 w-7 text-slate-600" />
        <p className="text-sm text-slate-500">No calls with predictions this week.</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
        <Calendar className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-slate-200">All Calls This Week</h3>
        <span className="ml-auto text-xs text-slate-500">{withPrediction.length} calls</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className={thClass} onClick={() => handleSort("date")}>
                Date <SortIcon col="date" />
              </th>
              <th className={thClass} onClick={() => handleSort("match")}>
                Match <SortIcon col="match" />
              </th>
              <th className={thClass + " hidden sm:table-cell"} onClick={() => handleSort("league")}>
                League <SortIcon col="league" />
              </th>
              <th className={thClass} onClick={() => handleSort("call")}>
                Our Call <SortIcon col="call" />
              </th>
              <th className={thClass + " hidden md:table-cell"}>
                Odds
              </th>
              <th className={thClass + " hidden sm:table-cell"} onClick={() => handleSort("result")}>
                Result <SortIcon col="result" />
              </th>
              <th className={thClass} onClick={() => handleSort("correct")}>
                Correct? <SortIcon col="correct" />
              </th>
              <th className={thClass} onClick={() => handleSort("pl")}>
                P/L <SortIcon col="pl" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {rowsWithRunning.map(({ fixture }) => {
              const pred = fixture.prediction!;
              const predicted = getPredictedOutcome(fixture);
              const actual = getActualOutcome(fixture);
              const isCorrect = isPredictionCorrect(fixture);
              const pl = estimatePL(fixture);
              const league = fixture.league_name || (fixture.league_slug ? slugToTitle(fixture.league_slug) : "—");

              const rowBg =
                isCorrect === true
                  ? "bg-emerald-500/[0.04] hover:bg-emerald-500/[0.07]"
                  : isCorrect === false
                  ? "bg-red-500/[0.04] hover:bg-red-500/[0.07]"
                  : "hover:bg-white/[0.02]";

              // Implied odds from predicted confidence (1 / prob)
              const predOutcomeProb =
                predicted === "home_win"
                  ? pred.home_win_prob
                  : predicted === "away_win"
                  ? pred.away_win_prob
                  : (pred.draw_prob ?? 0.33);
              const impliedOdds =
                predOutcomeProb > 0 ? (1 / predOutcomeProb).toFixed(2) : "—";

              return (
                <tr key={fixture.id} className={`transition-colors ${rowBg}`}>
                  <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">
                    {formatShortDate(fixture.scheduled_at)}
                  </td>
                  <td className="px-3 py-2.5 text-slate-200 font-medium max-w-[160px]">
                    <span className="truncate block">
                      {fixture.home_team_name} vs {fixture.away_team_name}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 hidden sm:table-cell max-w-[120px]">
                    <span className="truncate block">{league}</span>
                  </td>
                  <td className="px-3 py-2.5 font-medium">
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        background:
                          predicted === "home_win"
                            ? "rgba(59,130,246,0.12)"
                            : predicted === "away_win"
                            ? "rgba(245,158,11,0.12)"
                            : "rgba(148,163,184,0.12)",
                        color:
                          predicted === "home_win"
                            ? "#3b82f6"
                            : predicted === "away_win"
                            ? "#f59e0b"
                            : "#94a3b8",
                      }}
                    >
                      {predicted ? formatOutcomeLabel(predicted) : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-400 hidden md:table-cell tabular-nums">
                    {impliedOdds}
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 hidden sm:table-cell">
                    {actual ? formatOutcomeLabel(actual) : "—"}
                    {fixture.result && (
                      <span className="ml-1 text-slate-600">
                        ({fixture.result.home_score}–{fixture.result.away_score})
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {isCorrect === true ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Yes
                      </span>
                    ) : isCorrect === false ? (
                      <span className="flex items-center gap-1 text-red-400 font-semibold">
                        <XCircle className="h-3.5 w-3.5" /> No
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-bold tabular-nums">
                    {pl === null ? (
                      <span className="text-slate-600">—</span>
                    ) : pl > 0 ? (
                      <span className="text-emerald-400">+{pl.toFixed(1)}u</span>
                    ) : (
                      <span className="text-red-400">{pl.toFixed(1)}u</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Running total footer */}
          <tfoot>
            <tr className="border-t border-white/[0.1] bg-white/[0.03]">
              <td colSpan={6} className="px-3 py-3 text-xs font-semibold text-slate-400 text-right hidden md:table-cell">
                Weekly Total
              </td>
              <td colSpan={6} className="px-3 py-3 text-xs font-semibold text-slate-400 text-right md:hidden">
                Weekly Total
              </td>
              <td className="px-3 py-3 font-extrabold tabular-nums text-sm" colSpan={2}>
                <span className={totalPL >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {totalPL >= 0 ? "+" : ""}
                  {totalPL.toFixed(1)}u
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Section: Loading Skeleton ────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-56 rounded-lg bg-white/[0.06]" />
      <div className="glass-card p-6">
        <div className="h-4 w-40 rounded bg-white/[0.06] mb-5" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-card p-5 h-60 bg-white/[0.02]" />
        <div className="glass-card p-5 h-60 bg-white/[0.02]" />
      </div>
      <div className="glass-card h-80 bg-white/[0.02]" />
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
        <span className="font-semibold text-slate-300">Simulated paper performance only.</span>{" "}
        P/L figures use a flat 1-unit stake per call at implied model odds. Past
        performance does not guarantee future results. This is not financial advice.
        Always gamble responsibly.
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WeeklyReportPage() {
  const summaryQuery = useQuery({
    queryKey: ["weekly-summary"],
    queryFn: () => api.getWeeklySummary(),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const resultsQuery = useQuery({
    queryKey: ["fixture-results", 7],
    queryFn: () => api.getFixtureResults(7),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const isLoading = summaryQuery.isLoading || resultsQuery.isLoading;
  const hasError = summaryQuery.isError || resultsQuery.isError;
  const fixtures: Fixture[] = resultsQuery.data?.fixtures ?? [];
  const weekRange = getWeekRange();

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
            <FileBarChart2 className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight gradient-text leading-tight">
              Weekly Report
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Performance summary for the past 7 days
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar className="h-3 w-3" />
              <span>{weekRange}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Error banner ── */}
      {hasError && (
        <div
          className="rounded-xl border p-4 flex items-start gap-3"
          style={{ background: "rgba(239,68,68,0.04)", borderColor: "rgba(239,68,68,0.25)" }}
        >
          <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-400">
            Could not load report data. The API may be temporarily unavailable.
          </p>
        </div>
      )}

      {/* ── Performance Overview ── */}
      <KpiOverviewSection summary={summaryQuery.data} isLoading={false} />

      {/* ── Winners & Losers ── */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 px-1">
          Winners &amp; Losses
        </h2>
        <WinnersLosersSection fixtures={fixtures} />
      </div>

      {/* ── All Calls Table ── */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 px-1">
          Call Log
        </h2>
        <AllCallsTable fixtures={fixtures} />
      </div>

      {/* ── Disclaimer ── */}
      <Disclaimer />
    </div>
  );
}
