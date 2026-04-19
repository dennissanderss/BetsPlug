"use client";

/**
 * /live-score — landing page for the pure live-score experience.
 *
 * Lists every fixture the backend knows about today, grouped by
 * league. No AI predictions, confidence badges or pick pills —
 * this is a scoreboard, not a prediction feed. Each row links to
 * /live-score/[id] for the per-match deep dive.
 */

import { useState, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Calendar,
  ChevronDown,
  ArrowRight,
  Radio,
} from "lucide-react";

import { api } from "@/lib/api";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { formatLiveMinute } from "@/components/match-predictions/shared";
import { TeamLogo } from "@/components/dashboard/TeamLogo";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import type { Fixture } from "@/types/api";

type StatusFilter = "all" | "live" | "upcoming" | "finished";

const STATUS_FILTERS: Array<{ key: StatusFilter; labelKey: string; fallback: string }> = [
  { key: "all", labelKey: "liveScore.filterAll", fallback: "All" },
  { key: "live", labelKey: "liveScore.filterLive", fallback: "Live" },
  { key: "upcoming", labelKey: "liveScore.filterUpcoming", fallback: "Upcoming" },
  { key: "finished", labelKey: "liveScore.filterFinished", fallback: "Finished" },
];

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatMatchDate(
  iso: string,
  locale: string,
  todayLabel: string,
): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return todayLabel;
    const bcp = locale === "nl" ? "nl-NL" : "en-GB";
    return d.toLocaleDateString(bcp, { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

function matchesFilter(f: Fixture, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "live") return f.status === "live";
  if (filter === "upcoming") return f.status === "scheduled";
  if (filter === "finished") return f.status === "finished";
  return true;
}

function ScoreCell({ fixture }: { fixture: Fixture }) {
  const isLive = fixture.status === "live";
  const isFinished = fixture.status === "finished";
  if (isLive || isFinished) {
    return (
      <span className="text-stat text-xs sm:text-sm text-[#ededed] tabular-nums">
        {fixture.result?.home_score ?? 0}-{fixture.result?.away_score ?? 0}
      </span>
    );
  }
  return (
    <span className="text-[10px] uppercase tracking-wider text-[#6b7280]">
      vs
    </span>
  );
}

function StatusCell({ fixture }: { fixture: Fixture }) {
  const { locale } = useTranslations();
  const todayLabel = locale === "nl" ? "Vandaag" : "Today";
  const dateLabel = formatMatchDate(fixture.scheduled_at, locale, todayLabel);

  let inner: ReactNode;
  if (fixture.status === "live") {
    inner = (
      <span className="inline-flex items-center gap-1">
        <span className="live-dot-red" />
        <span className="font-semibold uppercase text-[9px] sm:text-[10px] tracking-wider tabular-nums text-red-400">
          {formatLiveMinute(fixture.live_score) ?? "LIVE"}
        </span>
      </span>
    );
  } else if (fixture.status === "finished") {
    inner = <Pill tone="default" className="!text-[9px] sm:!text-[10px]">FT</Pill>;
  } else if (fixture.status === "postponed") {
    inner = <Pill tone="draw" className="!text-[9px] sm:!text-[10px]">POSTP.</Pill>;
  } else if (fixture.status === "cancelled") {
    inner = <Pill tone="loss" className="!text-[9px] sm:!text-[10px]">CANC.</Pill>;
  } else {
    const timeLabel = formatTime(fixture.scheduled_at);
    inner = (
      <Pill tone="default" className="!text-[9px] sm:!text-[10px]">
        {timeLabel}
      </Pill>
    );
  }

  return (
    <span className="flex flex-col items-start gap-0.5 leading-tight">
      {dateLabel && (
        <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-[#6b7280]">
          {dateLabel}
        </span>
      )}
      {inner}
    </span>
  );
}

function MatchRow({ fixture }: { fixture: Fixture }) {
  const lHref = useLocalizedHref();

  return (
    <Link
      href={lHref(`/live-score/${fixture.id}`)}
      className="group flex items-center gap-2 sm:gap-3 px-2 py-2 sm:px-3 sm:py-2.5 border-b border-white/[0.05] transition-colors hover:bg-white/[0.04] last:border-b-0 cursor-pointer focus-visible:outline-none focus-visible:bg-white/[0.05]"
    >
      <span className="w-16 sm:w-20 shrink-0 text-xs tabular-nums">
        <StatusCell fixture={fixture} />
      </span>

      <div className="flex items-center gap-2 min-w-0 flex-1">
        <TeamLogo src={fixture.home_team_logo} name={fixture.home_team_name} />
        <span className="text-xs font-semibold text-[#ededed] truncate">
          {fixture.home_team_name}
        </span>
      </div>

      <div className="w-14 sm:w-16 shrink-0 text-center">
        <ScoreCell fixture={fixture} />
      </div>

      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
        <span className="text-xs font-semibold text-[#ededed] truncate text-right">
          {fixture.away_team_name}
        </span>
        <TeamLogo src={fixture.away_team_logo} name={fixture.away_team_name} />
      </div>

      <ArrowRight className="hidden sm:block h-3 w-3 shrink-0 text-[#6b7280] transition-all group-hover:translate-x-0.5 group-hover:text-[#4ade80]" />
    </Link>
  );
}

function RowSkeleton() {
  return (
    <div className="glass-panel animate-pulse flex items-center gap-3 px-4 py-3">
      <div className="h-4 w-10 rounded bg-white/[0.06]" />
      <div className="h-4 w-4 rounded-full bg-white/[0.06]" />
      <div className="h-4 w-32 rounded bg-white/[0.06] flex-1" />
      <div className="h-4 w-12 rounded bg-white/[0.06]" />
    </div>
  );
}

export default function LiveScorePage() {
  const { t } = useTranslations();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [expanded, setExpanded] = useState(false);

  const { data: liveData, isLoading: liveLoading } = useQuery({
    queryKey: ["live-score-live"],
    queryFn: () => api.getFixturesLive(),
    refetchInterval: 45_000,
  });

  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ["live-score-today"],
    queryFn: () => api.getFixturesToday(),
    refetchInterval: 60_000,
  });

  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ["live-score-results-1"],
    queryFn: () => api.getFixtureResults(1),
  });

  // Merge live + today + yesterday-results, dedupe by id. Live's entries
  // are newest, so take those first.
  const allFixtures = useMemo(() => {
    const seen = new Map<string, Fixture>();
    for (const source of [
      liveData?.fixtures ?? [],
      todayData?.fixtures ?? [],
      resultsData?.fixtures ?? [],
    ]) {
      for (const f of source) {
        if (!seen.has(f.id)) seen.set(f.id, f);
      }
    }
    return Array.from(seen.values());
  }, [liveData, todayData, resultsData]);

  const liveCount = allFixtures.filter((f) => f.status === "live").length;

  const filtered = allFixtures.filter((f) => matchesFilter(f, filter));

  // Group by league, preserving insertion order (matches API ordering).
  const grouped = useMemo(() => {
    const out: Record<string, Fixture[]> = {};
    for (const f of filtered) {
      const key = f.league_name;
      if (!out[key]) out[key] = [];
      out[key].push(f);
    }
    return out;
  }, [filtered]);

  const leagueNames = Object.keys(grouped);
  const INITIAL_LEAGUES = 8;
  const visibleLeagues = expanded
    ? leagueNames
    : leagueNames.slice(0, INITIAL_LEAGUES);
  const hasMore = leagueNames.length > INITIAL_LEAGUES;

  const isLoading = liveLoading || todayLoading || resultsLoading;

  const headerLabel = t("liveScore.title" as any);
  const headerSubtitle = t("liveScore.subtitle" as any);
  const emptyLabel = t("liveScore.empty" as any);

  return (
    <div className="relative animate-fade-in mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8">
      <div className="relative space-y-5">
        {/* Hero */}
        <div className="card-neon card-neon-green halo-green">
          <div className="relative flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <HexBadge variant="green" size="md" noGlow>
                <Radio className="h-5 w-5" />
              </HexBadge>
              <div>
                <p className="section-label !m-0">
                  <Activity className="h-3 w-3" />
                  {headerLabel === "liveScore.title" ? "Live Score" : headerLabel}
                </p>
                <p className="mt-1 text-xs text-[#a3a9b8]">
                  {headerSubtitle === "liveScore.subtitle"
                    ? "Real-time scores, events, lineups and match info — no predictions."
                    : headerSubtitle}
                </p>
              </div>
            </div>

            {liveCount > 0 && (
              <Pill
                tone="default"
                className="inline-flex items-center gap-1.5 !text-[11px] tabular-nums"
              >
                <span className="live-dot-red" />
                {liveCount} live
              </Pill>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => {
            const active = f.key === filter;
            const label = t(f.labelKey as any);
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  setFilter(f.key);
                  setExpanded(false);
                }}
                className={
                  "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-all " +
                  (active
                    ? "border-[#4ade80]/40 bg-[#4ade80]/10 text-[#86efac] shadow-[0_0_18px_rgba(74,222,128,0.18)]"
                    : "border-white/[0.08] bg-white/[0.03] text-[#a3a9b8] hover:border-white/[0.16] hover:text-[#ededed]")
                }
              >
                {f.key === "live" && <span className="live-dot-red" />}
                {label === f.labelKey ? f.fallback : label}
              </button>
            );
          })}
        </div>

        {/* Matches */}
        <div className="card-neon">
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.05] px-5 py-3">
              <div className="flex items-center gap-3">
                <HexBadge variant="green" size="sm" noGlow>
                  <Calendar className="h-4 w-4" />
                </HexBadge>
                <span className="section-label">
                  {t("liveScore.allMatches" as any) === "liveScore.allMatches"
                    ? "Matches"
                    : t("liveScore.allMatches" as any)}
                </span>
                {filtered.length > 0 && (
                  <Pill tone="active">{filtered.length}</Pill>
                )}
              </div>
            </div>

            <div>
              {isLoading ? (
                <div className="p-3 space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <RowSkeleton key={i} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <p className="py-12 text-center text-xs text-[#6b7280]">
                  {emptyLabel === "liveScore.empty"
                    ? "No matches match this filter."
                    : emptyLabel}
                </p>
              ) : (
                <>
                  {visibleLeagues.map((league) => (
                    <div key={league}>
                      <div className="bg-white/[0.02] px-4 py-2 border-b border-white/[0.05]">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#a3a9b8]">
                          {league}
                        </span>
                      </div>
                      <div>
                        {grouped[league].map((fixture) => (
                          <MatchRow key={fixture.id} fixture={fixture} />
                        ))}
                      </div>
                    </div>
                  ))}

                  {hasMore && !expanded && (
                    <button
                      onClick={() => setExpanded(true)}
                      className="btn-ghost flex w-full items-center justify-center gap-1.5 py-3 text-xs font-medium"
                    >
                      {t("dash.showMore" as any) === "dash.showMore"
                        ? "Show more"
                        : t("dash.showMore" as any)}{" "}
                      ({leagueNames.length - INITIAL_LEAGUES})
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <p className="px-2 text-[10px] italic leading-relaxed text-[#6b7280]">
          Live scores, events and lineups are provided by third-party sports
          data APIs and may be delayed by a few seconds relative to TV
          broadcasts.
        </p>
      </div>
    </div>
  );
}
