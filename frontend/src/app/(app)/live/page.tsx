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
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useTranslations } from "@/i18n/locale-provider";
import type { Fixture } from "@/types/api";
import { GlassPanel } from "@/components/noct/glass-panel";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { TierScopePill } from "@/components/noct/tier-scope-pill";

// ─── Types ───────────────────────────────────────────────────────────────────

type StatusFilter = "All" | "Live" | "Upcoming" | "Finished";

const STATUS_FILTERS: StatusFilter[] = ["All", "Live", "Upcoming", "Finished"];

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
      <Pill tone="purple" className="flex items-center gap-1.5">
        <span className="live-dot-red" style={{ width: 6, height: 6 }} />
        Live
      </Pill>
    );
  }
  if (fixture.status === "scheduled") {
    return (
      <Pill className="flex items-center gap-1.5">
        <Clock className="h-3 w-3" />
        {formatTime(fixture.scheduled_at)}
      </Pill>
    );
  }
  if (fixture.status === "finished") {
    return (
      <Pill tone="win" className="flex items-center gap-1.5">
        <CheckCircle2 className="h-3 w-3" />
        FT
      </Pill>
    );
  }
  if (fixture.status === "postponed") {
    return <Pill tone="draw">{t("live.postponed")}</Pill>;
  }
  return <Pill tone="loss">{t("live.cancelled")}</Pill>;
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
        <TrendingUp className="h-3 w-3 text-blue-400" />
        <span className="text-[10px] font-semibold text-slate-400">
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
      <div className="flex justify-between text-[10px] font-semibold">
        <span className={homeP >= awayP ? "text-blue-400" : "text-slate-500"}>
          {homeP}% H
        </span>
        {drawP !== null && (
          <span className="text-slate-500">{drawP}% D</span>
        )}
        <span className={awayP > homeP ? "text-red-400" : "text-slate-500"}>
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

  const neonVariant =
    isLive ? "card-neon card-neon-purple halo-purple"
    : isFinished ? "card-neon card-neon-green"
    : "card-neon card-neon-blue";

  return (
    <div
      className={cn(neonVariant, "animate-slide-up")}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative flex flex-col">
        {/* ── Card top ── */}
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <HexBadge variant={isLive ? "purple" : isFinished ? "green" : "blue"} size="sm" noGlow>
              <Activity className="h-3.5 w-3.5" />
            </HexBadge>
            <Pill className="truncate">{fixture.league_name}</Pill>
          </div>
          <div className="shrink-0">
            <StatusBadge fixture={fixture} />
          </div>
        </div>

        {/* ── Scoreboard ── */}
        <div className="flex-1 px-4 py-4">
          {/* Home team */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-100 leading-tight">
              {fixture.home_team_logo && (
                <Image src={fixture.home_team_logo} alt="" width={20} height={20} className="rounded-full shrink-0" />
              )}
              {fixture.home_team_name}
            </span>
            {(isLive || isFinished) && (
              <span className="text-stat text-2xl tabular-nums leading-none">
                {fixture.result ? fixture.result.home_score : " - "}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="my-2 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.05]" />
            <span className="text-[10px] font-medium text-slate-500">
              {isScheduled ? "vs" : isLive ? "Live" : "FT"}
            </span>
            <div className="h-px flex-1 bg-white/[0.05]" />
          </div>

          {/* Away team */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-100 leading-tight">
              {fixture.away_team_logo && (
                <Image src={fixture.away_team_logo} alt="" width={20} height={20} className="rounded-full shrink-0" />
              )}
              {fixture.away_team_name}
            </span>
            {(isLive || isFinished) && (
              <span className="text-stat text-2xl tabular-nums leading-none">
                {fixture.result ? fixture.result.away_score : " - "}
              </span>
            )}
          </div>

          {/* Scheduled: kick-off block */}
          {isScheduled && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <Pill className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {t("live.kickOff")} {formatTime(fixture.scheduled_at)} · {formatDate(fixture.scheduled_at)}
              </Pill>
            </div>
          )}

          {/* Venue */}
          {fixture.venue && (
            <p className="mt-2 truncate text-center text-[10px] text-slate-500">
              {fixture.venue}
            </p>
          )}
        </div>

        {/* ── Analytics bottom ── */}
        <div className="space-y-3 border-t border-white/[0.06] px-4 py-3">
          <ProbabilitySection fixture={fixture} />

          <Link
            href={`/matches/${fixture.id}`}
            className="btn-glass group flex w-full items-center justify-center gap-1.5"
          >
            {t("live.viewAnalysis")}
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}>
      <Pill tone={active ? "active" : "default"}>{label}</Pill>
    </button>
  );
}

function StatStrip({ fixtures }: { fixtures: Fixture[] }) {
  const { t } = useTranslations();
  const liveCount     = fixtures.filter((f) => f.status === "live").length;
  const upcomingCount = fixtures.filter((f) => f.status === "scheduled").length;
  const finishedCount = fixtures.filter((f) => f.status === "finished").length;

  return (
    <GlassPanel className="flex items-center gap-3 px-4 py-2.5">
      <div className="flex items-center gap-1.5">
        <span className="live-dot-red" style={{ width: 6, height: 6 }} />
        <span className="text-xs font-semibold text-purple-300">{liveCount} {t("live.statusLive")}</span>
      </div>
      <div className="h-3 w-px bg-white/[0.08]" />
      <div className="flex items-center gap-1.5">
        <Clock className="h-3 w-3 text-slate-500" />
        <span className="text-xs text-slate-400">{upcomingCount} {t("live.statusUpcoming")}</span>
      </div>
      <div className="h-3 w-px bg-white/[0.08]" />
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
        <span className="text-xs text-slate-400">{finishedCount} {t("live.statusFinished")}</span>
      </div>
    </GlassPanel>
  );
}

function MatchGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <GlassPanel key={i} variant="lifted" className="flex flex-col animate-pulse">
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
        </GlassPanel>
      ))}
    </div>
  );
}

function EmptyState({ message, onClearFilters, clearLabel }: { message: string; onClearFilters?: () => void; clearLabel?: string }) {
  return (
    <div className="card-neon">
      <div className="relative flex flex-col items-center justify-center gap-3 py-20">
        <HexBadge variant="purple" size="lg">
          <Activity className="h-6 w-6" />
        </HexBadge>
        <p className="text-sm font-medium text-slate-400">{message}</p>
        {onClearFilters && (
          <button onClick={onClearFilters} className="btn-ghost mt-1 text-xs">
            {clearLabel ?? "Clear filters"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LiveMatchesPage() {
  const { t } = useTranslations();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const todayQuery = useQuery({
    queryKey: ["fixtures", "today"],
    queryFn: () => api.getFixturesToday(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const upcomingQuery = useQuery({
    queryKey: ["fixtures", "upcoming", 3],
    queryFn: () => api.getFixturesUpcoming(3),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const isLoading = todayQuery.isLoading || upcomingQuery.isLoading;
  const hasError  = todayQuery.isError  || upcomingQuery.isError;

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

  const filtered: Fixture[] = useMemo(() => {
    return allFixtures.filter((f) => {
      if (statusFilter === "All")      return true;
      if (statusFilter === "Live")     return f.status === "live";
      if (statusFilter === "Upcoming") return f.status === "scheduled";
      if (statusFilter === "Finished") return f.status === "finished";
      return true;
    });
  }, [allFixtures, statusFilter]);

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

  const dataUpdatedAt =
    Math.max(todayQuery.dataUpdatedAt ?? 0, upcomingQuery.dataUpdatedAt ?? 0) || null;

  const isRefetching = todayQuery.isFetching || upcomingQuery.isFetching;

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  void tick;

  const todayCount  = todayQuery.data?.fixtures?.length ?? 0;
  const noTodayMsg  = todayCount === 0 && !isLoading && !hasError;

  const liveCount = allFixtures.filter((f) => f.status === "live").length;

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8 animate-fade-in">
      {/* Ambient glows */}
      <div className="relative space-y-8">
        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="section-label inline-flex items-center gap-2">
              <span className="live-dot-red" /> Live now
            </span>
            <h1 className="text-heading mt-3">{t("live.title")}</h1>
            <p className="mt-2 text-sm text-slate-400">{t("live.subtitle")}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Pill tone="purple">{liveCount} live</Pill>
              <TierScopePill />
              <div className="flex items-center gap-1.5">
                <RefreshCw className={cn("h-3 w-3 text-slate-500", isRefetching && "animate-spin")} />
                <span className="text-[11px] text-slate-500">
                  {dataUpdatedAt
                    ? `${t("live.lastUpdated")}: ${lastUpdatedLabel(dataUpdatedAt)}`
                    : t("live.fetchingData")}
                </span>
              </div>
            </div>
          </div>

          {!isLoading && !hasError && <StatStrip fixtures={allFixtures} />}
        </div>

        {/* ── Error banner ── */}
        {hasError && (
          <GlassPanel className="flex items-center gap-3 px-4 py-3 border-red-500/30">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <p className="text-sm text-red-400">{t("live.errorBackend")}</p>
          </GlassPanel>
        )}

        {/* ── No games today notice ── */}
        {noTodayMsg && allFixtures.length > 0 && (
          <GlassPanel className="flex items-center gap-3 px-4 py-3">
            <Clock className="h-4 w-4 shrink-0 text-slate-500" />
            <p className="text-sm text-slate-400">{t("live.noMatchesToday")}</p>
          </GlassPanel>
        )}

        {/* ── Filter bar ── */}
        {!isLoading && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">
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
            onClearFilters={statusFilter !== "All" ? () => setStatusFilter("All") : undefined}
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
    </div>
  );
}
