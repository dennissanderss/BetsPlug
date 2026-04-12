"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Clock,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useTranslations } from "@/i18n/locale-provider";
import type { Fixture } from "@/types/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type StatusFilter = "All" | "Live" | "Upcoming" | "Finished";

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--:--";
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString([], { month: "short", day: "2-digit" });
  } catch {
    return "";
  }
}

function lastUpdatedLabel(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 10) return "just now";
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ fixture }: { fixture: Fixture }) {
  const { t } = useTranslations();
  if (fixture.status === "live") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-400 ring-1 ring-blue-500/30">
        <span className="live-dot-red" style={{ width: 6, height: 6 }} />
        LIVE
      </span>
    );
  }
  if (fixture.status === "scheduled") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-slate-700/50 px-2.5 py-0.5 text-[11px] font-medium text-slate-400">
        <Clock className="h-3 w-3" />
        {formatTime(fixture.scheduled_at)}
      </span>
    );
  }
  if (fixture.status === "finished") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        FT
      </span>
    );
  }
  if (fixture.status === "postponed") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
        {t("live.postponed")}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-red-900/20 px-2.5 py-0.5 text-[11px] font-semibold text-red-400">
      {t("live.cancelled")}
    </span>
  );
}

function ProbabilitySection({ fixture }: { fixture: Fixture }) {
  const { t } = useTranslations();
  const pred = fixture.prediction;

  if (!pred) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3 text-slate-600" />
          <span className="text-[10px] font-medium text-slate-600">
            {t("live.analysisPending")}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
          <div className="h-full w-0" />
        </div>
      </div>
    );
  }

  const homeP = Math.round(pred.home_win_prob * 100);
  const awayP = Math.round(pred.away_win_prob * 100);
  const drawP = pred.draw_prob !== null ? Math.round(pred.draw_prob * 100) : null;
  const total = homeP + (drawP ?? 0) + awayP;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <TrendingUp className="h-3 w-3 text-blue-500" />
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          {t("live.winProbability")}
        </span>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/[0.06] gap-0.5">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${(homeP / total) * 100}%`, opacity: homeP >= awayP ? 1 : 0.4 }}
        />
        {drawP !== null && (
          <div
            className="h-full rounded-full bg-amber-500 transition-all"
            style={{ width: `${(drawP / total) * 100}%`, opacity: 0.5 }}
          />
        )}
        <div
          className="h-full rounded-full bg-red-500 transition-all"
          style={{ width: `${(awayP / total) * 100}%`, opacity: awayP > homeP ? 1 : 0.4 }}
        />
      </div>
      <div className="flex justify-between text-[9px] font-semibold uppercase tracking-wider">
        <span className={homeP >= awayP ? "text-blue-400" : "text-slate-600"}>
          {homeP}% H
        </span>
        {drawP !== null && (
          <span className="text-slate-600">{drawP}% D</span>
        )}
        <span className={awayP > homeP ? "text-red-400" : "text-slate-600"}>
          {awayP}% A
        </span>
      </div>
    </div>
  );
}

function MatchCard({ fixture, index }: { fixture: Fixture; index: number }) {
  const { t } = useTranslations();
  const isLive      = fixture.status === "live";
  const isFinished  = fixture.status === "finished";
  const isScheduled = fixture.status === "scheduled";

  return (
    <div
      className={cn(
        "glass-card-hover flex flex-col border-l-4 animate-slide-up",
        STATUS_BORDER[fixture.status] ?? "border-l-slate-600",
        STATUS_GLOW[fixture.status]  ?? "shadow-none"
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* ── Card top ── */}
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-xs font-semibold text-slate-300">
            {fixture.league_name}
          </span>
        </div>
        <div className="shrink-0">
          <StatusBadge fixture={fixture} />
        </div>
      </div>

      {/* ── Scoreboard ── */}
      <div className="flex-1 px-4 py-4">
        {/* Home team */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-100 leading-tight">
            {fixture.home_team_name}
          </span>
          {(isLive || isFinished) && (
            <span
              className={cn(
                "text-2xl font-black tabular-nums leading-none",
                isLive ? "gradient-text" : "text-slate-200"
              )}
            >
              {fixture.result ? fixture.result.home_score : " - "}
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
            {fixture.away_team_name}
          </span>
          {(isLive || isFinished) && (
            <span
              className={cn(
                "text-2xl font-black tabular-nums leading-none",
                isLive ? "gradient-text" : "text-slate-200"
              )}
            >
              {fixture.result ? fixture.result.away_score : " - "}
            </span>
          )}
        </div>

        {/* Scheduled: kick-off block */}
        {isScheduled && (
          <div className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.03] py-2">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs font-medium text-slate-400">
              {t("live.kickOff")} {formatTime(fixture.scheduled_at)} · {formatDate(fixture.scheduled_at)}
            </span>
          </div>
        )}

        {/* Venue */}
        {fixture.venue && (
          <p className="mt-2 truncate text-center text-[10px] text-slate-600">
            {fixture.venue}
          </p>
        )}
      </div>

      {/* ── Analytics bottom ── */}
      <div className="space-y-3 border-t border-white/[0.06] px-4 py-3">
        <ProbabilitySection fixture={fixture} />

        {/* View Analysis button */}
        <Link
          href={`/matches/${fixture.id}`}
          className="group flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-400 transition-all hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400"
        >
          {t("live.viewAnalysis")}
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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

function StatStrip({ fixtures }: { fixtures: Fixture[] }) {
  const { t } = useTranslations();
  const liveCount     = fixtures.filter((f) => f.status === "live").length;
  const upcomingCount = fixtures.filter((f) => f.status === "scheduled").length;
  const finishedCount = fixtures.filter((f) => f.status === "finished").length;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
      <div className="flex items-center gap-1.5">
        <span className="live-dot-red" style={{ width: 6, height: 6 }} />
        <span className="text-xs font-semibold text-blue-400">{liveCount} {t("live.statusLive")}</span>
      </div>
      <div className="h-3 w-px bg-white/[0.08]" />
      <div className="flex items-center gap-1.5">
        <Clock className="h-3 w-3 text-slate-500" />
        <span className="text-xs text-slate-400">{upcomingCount} {t("live.statusUpcoming")}</span>
      </div>
      <div className="h-3 w-px bg-white/[0.08]" />
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
        <span className="text-xs text-slate-400">{finishedCount} {t("live.statusFinished")}</span>
      </div>
    </div>
  );
}

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

function EmptyState({ message, onClearFilters, clearLabel }: { message: string; onClearFilters?: () => void; clearLabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-20">
      <Activity className="h-10 w-10 text-slate-700" />
      <p className="text-sm font-medium text-slate-500">{message}</p>
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="mt-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          {clearLabel ?? "Clear filters"}
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LiveMatchesPage() {
  const { t } = useTranslations();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  // ── Today's matches (DB-only, instant) ──
  const todayQuery = useQuery({
    queryKey: ["fixtures", "today"],
    queryFn: () => api.getFixturesToday(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // ── Upcoming matches for the next 3 days (DB-only, instant) ──
  const upcomingQuery = useQuery({
    queryKey: ["fixtures", "upcoming", 3],
    queryFn: () => api.getFixturesUpcoming(3),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const isLoading = todayQuery.isLoading || upcomingQuery.isLoading;
  const hasError  = todayQuery.isError  || upcomingQuery.isError;

  // Merge + deduplicate by id
  const allFixtures: Fixture[] = useMemo(() => {
    const seen = new Set<string>();
    const combined: Fixture[] = [
      ...((todayQuery.data?.fixtures)    ?? []),
      ...((upcomingQuery.data?.fixtures) ?? []),
    ];
    return combined.filter((f) => {
      if (seen.has(f.id)) return false;
      seen.add(f.id);
      return true;
    });
  }, [todayQuery.data, upcomingQuery.data]);

  // Apply status filter
  const filtered: Fixture[] = useMemo(() => {
    return allFixtures.filter((f) => {
      if (statusFilter === "All")      return true;
      if (statusFilter === "Live")     return f.status === "live";
      if (statusFilter === "Upcoming") return f.status === "scheduled";
      if (statusFilter === "Finished") return f.status === "finished";
      return true;
    });
  }, [allFixtures, statusFilter]);

  // Sort: live first, then scheduled (by time), then finished
  const sorted: Fixture[] = useMemo(() => {
    const order: Record<string, number> = {
      live: 0, scheduled: 1, finished: 2, postponed: 3, cancelled: 4,
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

  // Auto-refresh countdown indicator
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  void tick; // used only to force re-render for lastUpdatedLabel

  // Determine empty-state message
  const todayCount  = todayQuery.data?.fixtures?.length ?? 0;
  const noTodayMsg  = todayCount === 0 && !isLoading && !hasError;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight gradient-text">
              {t("live.title")}
            </h1>
            <div className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 ring-1 ring-red-500/30">
              <span className="live-dot-red" />
              <span className="text-xs font-bold uppercase tracking-widest text-red-400">
                {t("live.statusLive")}
              </span>
            </div>
          </div>
          <p className="mt-1.5 text-sm text-slate-400">
            {t("live.subtitle")}
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
                ? `${t("live.lastUpdated")}: ${lastUpdatedLabel(dataUpdatedAt)}`
                : t("live.fetchingData")}
            </span>
          </div>
        </div>

        {/* Stat strip */}
        {!isLoading && !hasError && (
          <StatStrip fixtures={allFixtures} />
        )}
      </div>

      {/* ── Error banner ── */}
      {hasError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <p className="text-sm text-red-400">
            {t("live.errorBackend")}
          </p>
        </div>
      )}

      {/* ── No games today notice ── */}
      {noTodayMsg && allFixtures.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <Clock className="h-4 w-4 shrink-0 text-slate-500" />
          <p className="text-sm text-slate-400">
            {t("live.noMatchesToday")}
          </p>
        </div>
      )}

      {/* ── Filter bar ── */}
      {!isLoading && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-600 mr-1">
            {t("live.status")}
          </span>
          {STATUS_FILTERS.map((s) => {
            const filterLabels: Record<StatusFilter, string> = {
              All: t("live.filterAll"),
              Live: t("live.filterLive"),
              Upcoming: t("live.filterUpcoming"),
              Finished: t("live.filterFinished"),
            };
            return (
              <FilterPill
                key={s}
                label={filterLabels[s]}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s)}
              />
            );
          })}
        </div>
      )}

      {/* ── Match grid ── */}
      {isLoading ? (
        <MatchGridSkeleton />
      ) : sorted.length === 0 ? (
        <EmptyState
          message={
            hasError
              ? t("live.noDataBackendUnreachable")
              : allFixtures.length === 0
              ? t("live.noMatchesFound")
              : t("live.noMatchesForFilter")
          }
          onClearFilters={
            statusFilter !== "All"
              ? () => setStatusFilter("All")
              : undefined
          }
          clearLabel={t("live.clearFilters")}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((fixture, i) => (
            <MatchCard key={fixture.id} fixture={fixture} index={i} />
          ))}
        </div>
      )}

    </div>
  );
}
