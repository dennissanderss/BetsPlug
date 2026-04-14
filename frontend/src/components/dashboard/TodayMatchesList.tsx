"use client";

import { useState } from "react";
import { useTranslations } from "@/i18n/locale-provider";
import { Calendar, ChevronDown } from "lucide-react";
import { confLevel, confColor } from "@/components/match-predictions/shared";
import { TeamLogo } from "@/components/dashboard/TeamLogo";
import type { Fixture, FixturesResponse } from "@/types/api";

interface TodayMatchesListProps {
  data: FixturesResponse | undefined;
  isLoading: boolean;
}

function MatchRowSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-3 px-4 py-3">
      <div className="h-4 w-10 rounded bg-white/[0.06]" />
      <div className="h-4 w-4 rounded-full bg-white/[0.06]" />
      <div className="h-4 w-32 rounded bg-white/[0.06] flex-1" />
      <div className="h-4 w-12 rounded bg-white/[0.06]" />
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function MatchRow({ fixture }: { fixture: Fixture }) {
  const { t } = useTranslations();
  const pred = fixture.prediction;
  const conf = pred ? Math.round(pred.confidence * 100) : null;
  const level = conf != null ? confLevel(conf) : null;
  const color = level != null ? confColor(level) : undefined;

  const isFinished = fixture.status === "finished";
  const isLive = fixture.status === "live";

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.04]">
      {/* Time */}
      <span className="w-12 shrink-0 text-xs tabular-nums text-slate-500">
        {isLive ? (
          <span className="flex items-center gap-1">
            <span className="live-dot" />
            <span className="text-emerald-400 font-medium">LIVE</span>
          </span>
        ) : isFinished ? (
          <span className="text-slate-600">FT</span>
        ) : (
          formatTime(fixture.scheduled_at)
        )}
      </span>

      {/* Home team */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <TeamLogo src={fixture.home_team_logo} name={fixture.home_team_name} />
        <span className="text-xs font-medium text-slate-200 truncate">
          {fixture.home_team_name}
        </span>
      </div>

      {/* Score or VS */}
      <div className="w-16 shrink-0 text-center">
        {isFinished || isLive ? (
          <span className="text-sm font-bold tabular-nums text-white">
            {fixture.result?.home_score ?? 0} - {fixture.result?.away_score ?? 0}
          </span>
        ) : (
          <span className="text-xs text-slate-600">vs</span>
        )}
      </div>

      {/* Away team */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
        <span className="text-xs font-medium text-slate-200 truncate text-right">
          {fixture.away_team_name}
        </span>
        <TeamLogo src={fixture.away_team_logo} name={fixture.away_team_name} />
      </div>

      {/* Confidence */}
      <div className="w-14 shrink-0 text-right">
        {conf != null ? (
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
            style={{ background: `${color}18`, color }}
          >
            {conf}%
          </span>
        ) : (
          <span className="text-[10px] italic text-slate-600">{t("dash.analyzing")}</span>
        )}
      </div>
    </div>
  );
}

export function TodayMatchesList({ data, isLoading }: TodayMatchesListProps) {
  const { t } = useTranslations();
  const [expanded, setExpanded] = useState(false);

  const fixtures = data?.fixtures ?? [];
  const count = fixtures.length;

  // Group by league
  const grouped = fixtures.reduce<Record<string, Fixture[]>>((acc, f) => {
    const key = f.league_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  const leagueNames = Object.keys(grouped);
  const INITIAL_LEAGUES = 4;
  const visibleLeagues = expanded ? leagueNames : leagueNames.slice(0, INITIAL_LEAGUES);
  const hasMore = leagueNames.length > INITIAL_LEAGUES;

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-slate-100">{t("dash.todayMatches")}</h2>
          {count > 0 && (
            <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-400">
              {count}
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {isLoading ? (
          <div className="py-2">
            {Array.from({ length: 5 }).map((_, i) => <MatchRowSkeleton key={i} />)}
          </div>
        ) : count === 0 ? (
          <p className="py-8 text-center text-xs text-slate-500">
            {t("dash.noMatchesToday")}
          </p>
        ) : (
          <>
            {visibleLeagues.map((league) => (
              <div key={league}>
                <div className="bg-white/[0.02] px-4 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    {league}
                  </span>
                </div>
                <div className="py-1">
                  {grouped[league].map((fixture) => (
                    <MatchRow key={fixture.id} fixture={fixture} />
                  ))}
                </div>
              </div>
            ))}

            {hasMore && !expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="flex w-full items-center justify-center gap-1.5 py-3 text-xs font-medium text-slate-400 transition-colors hover:text-emerald-400"
              >
                {t("dash.showMore")} ({leagueNames.length - INITIAL_LEAGUES})
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
