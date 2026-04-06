"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Clock,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  Zap,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { LiveMatch } from "@/types/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type MatchStatus = "scheduled" | "live" | "finished" | "postponed" | "cancelled";
type StatusFilter = "All" | "Live" | "Upcoming" | "Finished";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Replace hyphens with spaces and capitalise each word. */
function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Convert league slug to a friendly display name. */
const LEAGUE_DISPLAY: Record<string, string> = {
  "premier-league": "Premier League",
  "la-liga": "La Liga",
  "bundesliga": "Bundesliga",
  "serie-a": "Serie A",
  "ligue-1": "Ligue 1",
  "eredivisie": "Eredivisie",
  "champions-league": "Champions League",
};

function leagueName(slug: string): string {
  return LEAGUE_DISPLAY[slug] ?? slugToName(slug);
}

/** Format an ISO datetime string as a local time "HH:MM". */
function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--:--";
  }
}

/** Format an ISO datetime string as "Apr 07" style. */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString([], {
      month: "short",
      day: "2-digit",
    });
  } catch {
    return "";
  }
}

/** "Last updated" relative time — shows "just now" or "X min ago". */
function lastUpdatedLabel(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 10) return "just now";
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

const STATUS_FILTERS: StatusFilter[] = ["All", "Live", "Upcoming", "Finished"];

const STATUS_BORDER: Record<string, string> = {
  live:       "border-l-blue-500",
  scheduled:  "border-l-slate-600",
  finished:   "border-l-emerald-500",
  postponed:  "border-l-amber-500",
  cancelled:  "border-l-red-800",
};

const STATUS_GLOW: Record<string, string> = {
  live:      "shadow-[inset_4px_0_8px_rgba(59,130,246,0.15)]",
  scheduled: "shadow-none",
  finished:  "shadow-[inset_4px_0_8px_rgba(16,185,129,0.10)]",
  postponed: "shadow-none",
  cancelled: "shadow-none",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ match }: { match: LiveMatch }) {
  if (match.status === "live") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-400 ring-1 ring-blue-500/30">
        <span className="live-dot-red" style={{ width: 6, height: 6 }} />
        LIVE
      </span>
    );
  }
  if (match.status === "scheduled") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-slate-700/50 px-2.5 py-0.5 text-[11px] font-medium text-slate-400">
        <Clock className="h-3 w-3" />
        {formatTime(match.scheduled_at)}
      </span>
    );
  }
  if (match.status === "finished") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        FT
      </span>
    );
  }
  if (match.status === "postponed") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
        Postponed
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-red-900/20 px-2.5 py-0.5 text-[11px] font-semibold text-red-400">
      Cancelled
    </span>
  );
}

/** Probability section — shown as pending when no model data exists. */
function ProbabilityPending() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <TrendingUp className="h-3 w-3 text-slate-600" />
        <span className="text-[10px] font-medium text-slate-600">
          Probability calculation pending — requires historical data
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
        <div className="h-full w-0" />
      </div>
    </div>
  );
}

function MatchCard({ match, index }: { match: LiveMatch; index: number }) {
  const isLive     = match.status === "live";
  const isFinished = match.status === "finished";
  const isScheduled = match.status === "scheduled";

  const homeTeam = slugToName(match.home_team_slug);
  const awayTeam = slugToName(match.away_team_slug);
  const league   = leagueName(match.league_slug);

  return (
    <div
      className={cn(
        "glass-card-hover flex flex-col border-l-4 animate-slide-up",
        STATUS_BORDER[match.status] ?? "border-l-slate-600",
        STATUS_GLOW[match.status]  ?? "shadow-none"
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* ── Card top ── */}
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-xs font-semibold text-slate-300">
            {league}
          </span>
          {match.matchday != null && (
            <span className="shrink-0 rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-slate-500">
              MD {match.matchday}
            </span>
          )}
        </div>
        <div className="shrink-0">
          <StatusBadge match={match} />
        </div>
      </div>

      {/* ── Scoreboard ── */}
      <div className="flex-1 px-4 py-4">
        {/* Home team */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-100 leading-tight">
            {homeTeam}
          </span>
          {(isLive || isFinished) && (
            <span
              className={cn(
                "text-2xl font-black tabular-nums leading-none",
                isLive ? "gradient-text" : "text-slate-200"
              )}
            >
              {match.home_score ?? 0}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="my-2 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.05]" />
          <span className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">
            {isScheduled ? "vs" : isLive ? "LIVE" : "FT"}
          </span>
          <div className="h-px flex-1 bg-white/[0.05]" />
        </div>

        {/* Away team */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-100 leading-tight">
            {awayTeam}
          </span>
          {(isLive || isFinished) && (
            <span
              className={cn(
                "text-2xl font-black tabular-nums leading-none",
                isLive ? "gradient-text" : "text-slate-200"
              )}
            >
              {match.away_score ?? 0}
            </span>
          )}
        </div>

        {/* Scheduled: kick-off block */}
        {isScheduled && (
          <div className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.03] py-2">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs font-medium text-slate-400">
              Kick-off {formatTime(match.scheduled_at)} · {formatDate(match.scheduled_at)}
            </span>
          </div>
        )}

        {/* Venue */}
        {match.venue && (
          <p className="mt-2 truncate text-center text-[10px] text-slate-600">
            {match.venue}
          </p>
        )}
      </div>

      {/* ── Analytics bottom ── */}
      <div className="space-y-3 border-t border-white/[0.06] px-4 py-3">
        <ProbabilityPending />

        {/* View Analysis button */}
        <Link
          href={`/matches/${match.external_id}`}
          className="group flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-400 transition-all hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400"
        >
          View Analysis
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
        active
          ? "btn-gradient glow-blue-sm text-white"
          : "border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-slate-200"
      )}
    >
      {label}
    </button>
  );
}

function StatStrip({ matches }: { matches: LiveMatch[] }) {
  const liveCount     = matches.filter((m) => m.status === "live").length;
  const upcomingCount = matches.filter((m) => m.status === "scheduled").length;
  const finishedCount = matches.filter((m) => m.status === "finished").length;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
      <div className="flex items-center gap-1.5">
        <span className="live-dot-red" style={{ width: 6, height: 6 }} />
        <span className="text-xs font-semibold text-blue-400">{liveCount} Live</span>
      </div>
      <div className="h-3 w-px bg-white/[0.08]" />
      <div className="flex items-center gap-1.5">
        <Clock className="h-3 w-3 text-slate-500" />
        <span className="text-xs text-slate-400">{upcomingCount} Upcoming</span>
      </div>
      <div className="h-3 w-px bg-white/[0.08]" />
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
        <span className="text-xs text-slate-400">{finishedCount} Finished</span>
      </div>
    </div>
  );
}

/** Loading skeleton for the match grid. */
function MatchGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="glass-card-hover flex flex-col border-l-4 border-l-slate-700 animate-pulse"
        >
          <div className="border-b border-white/[0.06] px-4 py-3">
            <div className="h-3 w-28 rounded bg-white/[0.06]" />
          </div>
          <div className="flex-1 space-y-3 px-4 py-4">
            <div className="h-4 w-36 rounded bg-white/[0.06]" />
            <div className="h-px w-full bg-white/[0.04]" />
            <div className="h-4 w-32 rounded bg-white/[0.06]" />
          </div>
          <div className="border-t border-white/[0.06] px-4 py-3">
            <div className="h-2 w-full rounded-full bg-white/[0.04]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Empty / error state. */
function EmptyState({
  message,
  onClearFilters,
}: {
  message: string;
  onClearFilters?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-20">
      <Activity className="h-10 w-10 text-slate-700" />
      <p className="text-sm font-medium text-slate-500">{message}</p>
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="mt-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LiveMatchesPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  // ── Today's live / finished matches (auto-refresh every 60 s) ──
  const todayQuery = useQuery({
    queryKey: ["live", "today"],
    queryFn: () => api.getLiveToday(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // ── Upcoming matches for the next 3 days ──
  const upcomingQuery = useQuery({
    queryKey: ["live", "upcoming", 3],
    queryFn: () => api.getLiveUpcoming(3),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const isLoading = todayQuery.isLoading || upcomingQuery.isLoading;
  const hasError  = todayQuery.isError  || upcomingQuery.isError;

  // Merge + deduplicate by external_id
  const allMatches: LiveMatch[] = useMemo(() => {
    const seen = new Set<string>();
    const combined: LiveMatch[] = [
      ...((todayQuery.data?.matches)    ?? []),
      ...((upcomingQuery.data?.matches) ?? []),
    ];
    return combined.filter((m) => {
      if (seen.has(m.external_id)) return false;
      seen.add(m.external_id);
      return true;
    });
  }, [todayQuery.data, upcomingQuery.data]);

  // Apply status filter
  const filtered: LiveMatch[] = useMemo(() => {
    return allMatches.filter((m) => {
      if (statusFilter === "All")      return true;
      if (statusFilter === "Live")     return m.status === "live";
      if (statusFilter === "Upcoming") return m.status === "scheduled";
      if (statusFilter === "Finished") return m.status === "finished";
      return true;
    });
  }, [allMatches, statusFilter]);

  // Sort: live first, then scheduled (by time), then finished
  const sorted: LiveMatch[] = useMemo(() => {
    const order: Record<MatchStatus, number> = {
      live:       0,
      scheduled:  1,
      finished:   2,
      postponed:  3,
      cancelled:  4,
    };
    return [...filtered].sort((a, b) => {
      const byStatus = (order[a.status] ?? 9) - (order[b.status] ?? 9);
      if (byStatus !== 0) return byStatus;
      return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
    });
  }, [filtered]);

  // Last updated timestamp
  const dataUpdatedAt =
    Math.max(todayQuery.dataUpdatedAt ?? 0, upcomingQuery.dataUpdatedAt ?? 0) || null;

  const isRefetching = todayQuery.isFetching || upcomingQuery.isFetching;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight gradient-text">
              Live Matches
            </h1>
            <div className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 ring-1 ring-red-500/30">
              <span className="live-dot-red" />
              <span className="text-xs font-bold uppercase tracking-widest text-red-400">
                Live
              </span>
            </div>
          </div>
          <p className="mt-1.5 text-sm text-slate-400">
            Real-time match tracking and analysis
          </p>
          {/* Last updated */}
          <div className="mt-2 flex items-center gap-1.5">
            <RefreshCw
              className={cn(
                "h-3 w-3 text-slate-600",
                isRefetching && "animate-spin"
              )}
            />
            <span className="text-[11px] text-slate-600">
              {dataUpdatedAt
                ? `Last updated: ${lastUpdatedLabel(dataUpdatedAt)}`
                : "Fetching data…"}
            </span>
          </div>
        </div>

        {/* Stat strip */}
        {!isLoading && !hasError && (
          <StatStrip matches={allMatches} />
        )}
      </div>

      {/* ── Error banner ── */}
      {hasError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <p className="text-sm text-red-400">
            Could not reach the backend API. Showing cached data if available — retrying automatically.
          </p>
        </div>
      )}

      {/* ── Filter bar ── */}
      {!isLoading && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-600 mr-1">
            Status
          </span>
          {STATUS_FILTERS.map((s) => (
            <FilterPill
              key={s}
              label={s}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
            />
          ))}
        </div>
      )}

      {/* ── Match grid ── */}
      {isLoading ? (
        <MatchGridSkeleton />
      ) : sorted.length === 0 ? (
        <EmptyState
          message={
            hasError
              ? "No live data available — backend unreachable."
              : allMatches.length === 0
              ? "No live data available. Check back when matches are scheduled."
              : "No matches found for the selected filter."
          }
          onClearFilters={
            statusFilter !== "All"
              ? () => setStatusFilter("All")
              : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((match, i) => (
            <MatchCard key={match.external_id} match={match} index={i} />
          ))}
        </div>
      )}

      {/* ── Disclaimer ── */}
      <div className="flex items-start gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
        <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" />
        <p className="text-[11px] leading-relaxed text-slate-600">
          Match data is fetched live from the backend API and refreshed every 60 seconds.
          Probability calculations are model-generated simulations for analytical purposes
          only and require historical training data to activate. Predictions do not
          constitute betting advice. Match times are shown in your local timezone.
        </p>
      </div>
    </div>
  );
}
