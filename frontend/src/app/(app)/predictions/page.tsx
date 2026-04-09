"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  ChevronUp,
  Eye,
  AlertTriangle,
  Filter,
  ArrowUpDown,
  Clock,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Fixture, FixturePrediction } from "@/types/api";
import { PaywallOverlay } from "@/components/ui/paywall-overlay";

// ─── Types ───────────────────────────────────────────────────────────────────

type ConfidenceLevel = "High" | "Medium" | "Low";
type SortKey = "confidence" | "time" | "league";
type LeagueFilter = "All" | string;
type ConfidenceFilter = "All" | ConfidenceLevel;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMatchTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

function getConfidenceColor(level: ConfidenceLevel): string {
  if (level === "High") return "#10b981";
  if (level === "Medium") return "#f59e0b";
  return "#ef4444";
}

function getConfidenceBg(level: ConfidenceLevel): string {
  if (level === "High") return "bg-emerald-500/10 text-emerald-400";
  if (level === "Medium") return "bg-amber-500/10 text-amber-400";
  return "bg-red-500/10 text-red-400";
}

// ─── Probability Bar ─────────────────────────────────────────────────────────

interface ProbBarProps {
  homeProb: number;
  drawProb: number | null;
  awayProb: number;
  homeTeam: string;
  awayTeam: string;
}

function ProbabilityBar({ homeProb, drawProb, awayProb, homeTeam, awayTeam }: ProbBarProps) {
  const total = homeProb + (drawProb ?? 0) + awayProb;
  const predicted: "home" | "draw" | "away" =
    homeProb >= awayProb && homeProb >= (drawProb ?? 0)
      ? "home"
      : (drawProb ?? 0) >= awayProb
      ? "draw"
      : "away";

  const segments = [
    {
      key: "home" as const,
      label: homeTeam.split(" ").pop()!,
      prob: homeProb,
      color: "#3b82f6",
      glow: "rgba(59,130,246,0.5)",
      width: `${(homeProb / total) * 100}%`,
    },
    ...(drawProb !== null
      ? [
          {
            key: "draw" as const,
            label: "Draw",
            prob: drawProb,
            color: "#f59e0b",
            glow: "rgba(245,158,11,0.5)",
            width: `${(drawProb / total) * 100}%`,
          },
        ]
      : []),
    {
      key: "away" as const,
      label: awayTeam.split(" ").pop()!,
      prob: awayProb,
      color: "#ef4444",
      glow: "rgba(239,68,68,0.5)",
      width: `${(awayProb / total) * 100}%`,
    },
  ];

  return (
    <div className="w-full min-w-[200px]">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/[0.06] gap-0.5">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: seg.width,
              background: seg.color,
              opacity: predicted === seg.key ? 1 : 0.35,
              boxShadow: predicted === seg.key ? `0 0 8px ${seg.glow}` : "none",
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-1">
        {segments.map((seg) => (
          <div key={seg.key} className="flex flex-col items-center" style={{ width: seg.width }}>
            <span
              className="text-[11px] font-bold leading-none"
              style={{ color: predicted === seg.key ? seg.color : "#475569" }}
            >
              {seg.prob}%
            </span>
            <span
              className="mt-0.5 truncate text-[9px] uppercase tracking-wide"
              style={{ color: predicted === seg.key ? seg.color : "#334155", maxWidth: "48px" }}
            >
              {seg.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pending Probability placeholder ─────────────────────────────────────────

function ProbabilityPending() {
  return (
    <div className="w-full min-w-[200px]">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full w-full rounded-full bg-white/[0.04] animate-pulse" />
      </div>
      <p className="mt-2.5 text-[10px] font-medium text-slate-600 italic text-center">
        Analysis pending
      </p>
    </div>
  );
}

// ─── Match Card ───────────────────────────────────────────────────────────────

function MatchCard({ fixture }: { fixture: Fixture }) {
  const [expanded, setExpanded] = useState(false);
  const pred: FixturePrediction | null = fixture.prediction ?? null;
  const hasPrediction = pred !== null && typeof pred.confidence === "number";

  const confidenceScore = hasPrediction ? Math.round((pred.confidence ?? 0) * 100) : null;
  const confidenceLevel = confidenceScore !== null ? getConfidenceLevel(confidenceScore) : null;
  const confidenceColor = confidenceLevel ? getConfidenceColor(confidenceLevel) : "#475569";
  const confidenceBg    = confidenceLevel ? getConfidenceBg(confidenceLevel) : "bg-slate-500/10 text-slate-500";

  return (
    <div className="glass-card-hover overflow-hidden animate-slide-up">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:gap-6">

        {/* ── Left: Match info ── */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              {fixture.league_name}
            </span>
            {/* Scheduled badge */}
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{
                background: "rgba(59,130,246,0.12)",
                color: "#3b82f6",
                border: "1px solid rgba(59,130,246,0.25)",
              }}
            >
              SCH
            </span>
          </div>

          <p className="text-base font-semibold text-slate-100 leading-tight">
            {fixture.home_team_name}{" "}
            <span className="text-slate-500 font-normal">vs</span>{" "}
            {fixture.away_team_name}
          </p>

          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0" />
            {formatMatchTime(fixture.scheduled_at)}
          </p>
        </div>

        {/* ── Center: Probability ── */}
        <div className="w-full max-w-[260px] lg:mx-6">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Win Probability
          </p>
          {hasPrediction ? (
            <ProbabilityBar
              homeProb={Math.round((pred.home_win_prob ?? 0) * 100)}
              drawProb={pred.draw_prob != null ? Math.round(pred.draw_prob * 100) : null}
              awayProb={Math.round((pred.away_win_prob ?? 0) * 100)}
              homeTeam={fixture.home_team_name}
              awayTeam={fixture.away_team_name}
            />
          ) : (
            <ProbabilityPending />
          )}
        </div>

        {/* ── Right: Confidence + action ── */}
        <div className="flex shrink-0 flex-row items-center gap-4 lg:flex-col lg:items-end lg:gap-2">
          <div className="flex flex-col items-center lg:items-end">
            {hasPrediction ? (
              <>
                <span
                  className="text-4xl font-extrabold leading-none tabular-nums"
                  style={{ color: confidenceColor }}
                >
                  {confidenceScore}
                  <span className="text-xl font-semibold">%</span>
                </span>
                <span className={`mt-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${confidenceBg}`}>
                  {confidenceLevel} Confidence
                </span>
                {pred?.model_name && (
                  <span className="mt-1 text-[9px] text-slate-600 uppercase tracking-wider">
                    {pred.model_name}
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm font-medium text-slate-600 italic">Analysis pending</span>
            )}
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-300"
            aria-label={`View details for ${fixture.home_team_name} vs ${fixture.away_team_name}`}
            aria-expanded={expanded}
          >
            {expanded ? (
              <><ChevronUp className="h-3.5 w-3.5" />Hide Details</>
            ) : (
              <><Eye className="h-3.5 w-3.5" />View Details</>
            )}
          </button>
        </div>
      </div>

      {/* ── Bottom: venue / pending note ── */}
      <div className="border-t border-white/[0.05] bg-white/[0.02] px-5 py-2.5">
        {hasPrediction ? (
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              {fixture.venue && (
                <p className="text-[10px] text-slate-600 truncate">
                  <span className="font-medium text-slate-500">Venue:</span> {fixture.venue}
                </p>
              )}
              {pred?.predicted_at && (
                <p className="text-[10px] text-slate-700 truncate mt-0.5">
                  Predicted {new Date(pred.predicted_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                </p>
              )}
            </div>
            {pred?.pick && (
              <span className="shrink-0 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                {pred.pick}
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-600 italic">
            This match has not yet been processed by the prediction engine. Check back closer to kick-off.
          </p>
        )}
      </div>

      {/* ── Expanded: rich prediction detail panel ── */}
      {hasPrediction && expanded && (
        <div className="border-t border-white/[0.05] bg-white/[0.015] px-5 py-4 animate-fade-in space-y-4">

          {/* Pick badge */}
          {pred?.pick && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Model Pick</span>
              <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                {pred.pick}
              </span>
              <span className="text-[10px] text-slate-600 ml-auto">
                Confidence: {Math.round((pred.confidence ?? 0) * 100)}%
              </span>
            </div>
          )}

          {/* Probability breakdown */}
          <div className={`grid gap-3 text-center ${pred?.draw_prob != null ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Home Win</p>
              <p className="text-xl font-bold text-blue-400">{Math.round((pred?.home_win_prob ?? 0) * 100)}%</p>
              {pred?.edge?.home != null && (
                <p className={`text-[10px] font-medium mt-1 ${pred.edge.home > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {pred.edge.home > 0 ? '+' : ''}{(pred.edge.home * 100).toFixed(1)}% edge
                </p>
              )}
            </div>
            {pred?.draw_prob != null && (
              <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Draw</p>
                <p className="text-xl font-bold text-amber-400">{Math.round(pred.draw_prob * 100)}%</p>
                {pred.edge?.draw != null && (
                  <p className={`text-[10px] font-medium mt-1 ${pred.edge.draw > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {pred.edge.draw > 0 ? '+' : ''}{(pred.edge.draw * 100).toFixed(1)}% edge
                  </p>
                )}
              </div>
            )}
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">Away Win</p>
              <p className="text-xl font-bold text-red-400">{Math.round((pred?.away_win_prob ?? 0) * 100)}%</p>
              {pred?.edge?.away != null && (
                <p className={`text-[10px] font-medium mt-1 ${pred.edge.away > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {pred.edge.away > 0 ? '+' : ''}{(pred.edge.away * 100).toFixed(1)}% edge
                </p>
              )}
            </div>
          </div>

          {/* Reasoning */}
          {pred?.reasoning && (
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1.5">Model Reasoning</p>
              <p className="text-xs text-slate-300 leading-relaxed">{pred.reasoning}</p>
            </div>
          )}

          {/* Top features */}
          {pred?.top_features && pred.top_features.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2">Key Factors</p>
              <div className="space-y-1.5">
                {pred.top_features.slice(0, 5).map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="text-slate-400 truncate capitalize">{f.feature?.replace(/_/g, ' ') ?? ''}</span>
                        <span className="text-slate-300 font-medium ml-2 shrink-0">{((f.importance ?? 0) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-blue-500/70 transition-all duration-500"
                          style={{ width: `${Math.min((f.importance ?? 0) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Venue */}
          {fixture.venue && (
            <p className="text-[10px] text-slate-600 text-center pt-1 border-t border-white/[0.05]">
              <span className="font-medium text-slate-500">Venue:</span> {fixture.venue}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 rounded bg-white/[0.06]" />
          <div className="h-5 w-56 rounded bg-white/[0.06]" />
          <div className="h-3 w-24 rounded bg-white/[0.06]" />
        </div>
        <div className="w-full max-w-[260px] space-y-2">
          <div className="h-3 w-full rounded-full bg-white/[0.06]" />
          <div className="h-2 w-2/3 rounded bg-white/[0.04]" />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="h-10 w-16 rounded bg-white/[0.06]" />
          <div className="h-6 w-20 rounded-full bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

// ─── Stats Bar ───────────────────────────────────────────────────────────────

function StatsBar({ fixtures }: { fixtures: Fixture[] }) {
  const total      = fixtures.length;
  const withPred   = fixtures.filter((f) => f.prediction !== null).length;
  const pending    = total - withPred;
  const avgConf    = withPred > 0
    ? Math.round(
        fixtures
          .filter((f) => f.prediction !== null)
          .reduce((acc, f) => acc + f.prediction!.confidence, 0) / withPred * 100
      )
    : null;

  const stats = [
    { label: "Upcoming Matches", value: String(total) },
    { label: "Predictions Ready", value: String(withPred) },
    { label: "Analysis Pending",  value: String(pending) },
    { label: "Avg Confidence",    value: avgConf !== null ? `${avgConf}%` : " - " },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value }) => (
        <div
          key={label}
          className="glass-card flex flex-col items-center justify-center gap-1 py-4 px-3 text-center"
        >
          <span className="text-2xl font-extrabold gradient-text leading-none tabular-nums">
            {value}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Filter Bar ──────────────────────────────────────────────────────────────

interface FilterBarProps {
  leagueFilter: LeagueFilter;
  setLeagueFilter: (v: LeagueFilter) => void;
  confidenceFilter: ConfidenceFilter;
  setConfidenceFilter: (v: ConfidenceFilter) => void;
  sortKey: SortKey;
  setSortKey: (v: SortKey) => void;
  total: number;
  availableLeagues: string[];
}

function FilterBar({
  leagueFilter,
  setLeagueFilter,
  confidenceFilter,
  setConfidenceFilter,
  sortKey,
  setSortKey,
  total,
  availableLeagues,
}: FilterBarProps) {
  const leagueTabs: LeagueFilter[] = ["All", ...availableLeagues];
  const confOptions: ConfidenceFilter[] = ["All", "High", "Medium", "Low"];
  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "confidence", label: "Confidence" },
    { key: "time",       label: "Time" },
    { key: "league",     label: "League" },
  ];

  return (
    <div className="glass-card p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* League tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1 flex-wrap">
          {leagueTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setLeagueFilter(tab)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                leagueFilter === tab
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Confidence filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1">
            {confOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setConfidenceFilter(opt)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  confidenceFilter === opt
                    ? opt === "High"
                      ? "bg-emerald-600/80 text-white"
                      : opt === "Medium"
                      ? "bg-amber-600/80 text-white"
                      : opt === "Low"
                      ? "bg-red-600/80 text-white"
                      : "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {opt === "High"   ? "High (>75%)"
                 : opt === "Medium" ? "Med (50–75%)"
                 : opt === "Low"    ? "Low (<50%)"
                 : opt}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 ml-auto">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1">
            {sortOptions.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  sortKey === key
                    ? "bg-white/[0.08] text-slate-100"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {total} result{total !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}


// ─── Main page ───────────────────────────────────────────────────────────────

export default function PredictionsPage() {
  const [leagueFilter,     setLeagueFilter]     = useState<LeagueFilter>("All");
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("All");
  const [sortKey,          setSortKey]          = useState<SortKey>("confidence");

  // ── Fetch upcoming fixtures from DB (fast) ────────────────────────────────
  const fixturesQuery = useQuery({
    queryKey: ["fixtures-upcoming", 7],
    queryFn:  () => api.getFixturesUpcoming(7),
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 2,
  });

  const isLoading = fixturesQuery.isLoading;
  const hasError  = fixturesQuery.isError;

  // ── Only show SCHEDULED (upcoming) fixtures ───────────────────────────────
  const upcomingFixtures = useMemo<Fixture[]>(() => {
    const all = fixturesQuery.data?.fixtures ?? [];
    return all.filter((f) => f.status === "scheduled");
  }, [fixturesQuery.data]);

  // ── Derived leagues list for filter tabs ─────────────────────────────────
  const availableLeagues = useMemo(() => {
    const s = new Set<string>();
    upcomingFixtures.forEach((f) => s.add(f.league_name));
    return Array.from(s).sort();
  }, [upcomingFixtures]);

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let items = [...upcomingFixtures];

    if (leagueFilter !== "All") {
      items = items.filter((f) => f.league_name === leagueFilter);
    }

    if (confidenceFilter !== "All") {
      items = items.filter((f) => {
        if (!f.prediction) return false;
        const score = Math.round(f.prediction.confidence * 100);
        return getConfidenceLevel(score) === confidenceFilter;
      });
    }

    if (sortKey === "confidence") {
      items.sort((a, b) => {
        const ca = a.prediction ? a.prediction.confidence : -1;
        const cb = b.prediction ? b.prediction.confidence : -1;
        return cb - ca;
      });
    } else if (sortKey === "time") {
      items.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
    } else if (sortKey === "league") {
      items.sort((a, b) => a.league_name.localeCompare(b.league_name));
    }

    return items;
  }, [upcomingFixtures, leagueFilter, confidenceFilter, sortKey]);

  // ── Auto-refresh indicator ────────────────────────────────────────────────
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setLastRefresh(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 glow-blue-sm">
            <Sparkles className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight gradient-text leading-tight">
              Predictions
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              AI-powered match analysis and probability forecasting - next 7 days
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Model badge */}
          <div className="flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-semibold text-blue-300">Model: Ensemble</span>
          </div>
          {/* Last refresh */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
            <RefreshCw className="h-3 w-3" />
            <span>
              Auto-refreshes every 60s · Last:{" "}
              {lastRefresh.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats bar ── */}
      {!isLoading && <StatsBar fixtures={upcomingFixtures} />}
      {isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card h-20 rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      )}

      {/* ── Error banner ── */}
      {hasError && (
        <div
          className="rounded-xl border p-4 flex items-start gap-3"
          style={{ background: "rgba(239,68,68,0.04)", borderColor: "rgba(239,68,68,0.25)" }}
        >
          <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-400">
            Could not load fixture data from the database. Please try refreshing.
          </p>
        </div>
      )}

      {/* ── Filter bar ── */}
      <FilterBar
        leagueFilter={leagueFilter}
        setLeagueFilter={setLeagueFilter}
        confidenceFilter={confidenceFilter}
        setConfidenceFilter={setConfidenceFilter}
        sortKey={sortKey}
        setSortKey={setSortKey}
        total={filtered.length}
        availableLeagues={availableLeagues}
      />

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : upcomingFixtures.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Sparkles className="h-8 w-8 text-slate-600" />
          <p className="text-base font-medium text-slate-400">No upcoming matches in the next 7 days</p>
          <p className="text-sm text-slate-600">
            No scheduled fixtures were found in the database. Check back shortly.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Sparkles className="h-8 w-8 text-slate-600" />
          <p className="text-base font-medium text-slate-400">No predictions match your filters</p>
          <p className="text-sm text-slate-600">
            Try adjusting the league or confidence filters above.
          </p>
          <button
            onClick={() => { setLeagueFilter("All"); setConfidenceFilter("All"); }}
            className="btn-gradient mt-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((fixture) => (
            <MatchCard key={fixture.id} fixture={fixture} />
          ))}
        </div>
      )}

      {/* ── Upgrade prompt for more predictions ── */}
      {!isLoading && upcomingFixtures.length > 0 && (
        <PaywallOverlay feature="all_predictions" requiredTier="silver" variant="inline">
          <div className="glass-card p-8 text-center">
            <p className="text-slate-400">See all {upcomingFixtures.length} predictions with our Silver plan or higher.</p>
          </div>
        </PaywallOverlay>
      )}

    </div>
  );
}
