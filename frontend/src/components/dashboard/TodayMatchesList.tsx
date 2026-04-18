"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { Calendar, ChevronDown, ArrowRight } from "lucide-react";
import { confLevel, confColor, formatLiveMinute } from "@/components/match-predictions/shared";
import { TeamLogo } from "@/components/dashboard/TeamLogo";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill, DataChip } from "@/components/noct/pill";
import { TierScopePill } from "@/components/noct/tier-scope-pill";
import type { Fixture, FixturesResponse } from "@/types/api";

/**
 * Convert backend `pick` (HOME/DRAW/AWAY) → display label + tone.
 * Uses team short-name when we predict a winner, localised "Draw"
 * for the draw case.
 */
function pickLabel(
  pick: string | null | undefined,
  homeName: string,
  awayName: string,
  drawText: string,
): { label: string; tone: "win" | "draw" } | null {
  if (!pick) return null;
  if (pick === "HOME") return { label: homeName, tone: "win" };
  if (pick === "AWAY") return { label: awayName, tone: "win" };
  if (pick === "DRAW") return { label: drawText, tone: "draw" };
  return null;
}

/** Best-effort short team name for tight row layouts. */
function shortTeamName(name: string): string {
  if (name.length <= 14) return name;
  // Drop common suffixes that inflate length.
  const trimmed = name
    .replace(/\sFC$/i, "")
    .replace(/\sCF$/i, "")
    .replace(/\sAFC$/i, "")
    .replace(/^FC\s/i, "")
    .replace(/\sSC$/i, "")
    .replace(/^1\.?\s*FC\s+/i, "")
    .trim();
  return trimmed.length <= 14 ? trimmed : trimmed.slice(0, 13) + "…";
}

interface TodayMatchesListProps {
  data: FixturesResponse | undefined;
  isLoading: boolean;
}

function MatchRowSkeleton() {
  return (
    <div className="glass-panel animate-pulse flex items-center gap-3 px-4 py-3">
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
  const lHref = useLocalizedHref();
  const pred = fixture.prediction;
  const conf = pred ? Math.round(pred.confidence * 100) : null;
  const level = conf != null ? confLevel(conf) : null;
  const color = level != null ? confColor(level) : undefined;

  const isFinished = fixture.status === "finished";
  const isLive = fixture.status === "live";

  const pick = pickLabel(
    pred?.pick,
    fixture.home_team_name,
    fixture.away_team_name,
    t("common.draw"),
  );

  return (
    <Link
      href={lHref(`/live-score/${fixture.id}`)}
      className="group flex items-center gap-2 sm:gap-3 px-2 py-2 sm:px-3 sm:py-2.5 border-b border-white/[0.05] transition-colors hover:bg-white/[0.04] last:border-b-0 cursor-pointer focus-visible:outline-none focus-visible:bg-white/[0.05]"
    >
      {/* Time / Live minute */}
      <span className="w-11 sm:w-16 shrink-0 text-xs tabular-nums">
        {isLive ? (
          <span className="inline-flex items-center gap-1">
            <span className="live-dot-red" />
            <span className="text-red-400 font-semibold uppercase text-[9px] sm:text-[10px] tracking-wider">
              {formatLiveMinute(fixture.live_score) ?? "LIVE"}
            </span>
          </span>
        ) : isFinished ? (
          <Pill tone="default" className="!text-[9px] sm:!text-[10px]">FT</Pill>
        ) : (
          <Pill tone="default" className="!text-[9px] sm:!text-[10px]">{formatTime(fixture.scheduled_at)}</Pill>
        )}
      </span>

      {/* Home team */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <TeamLogo src={fixture.home_team_logo} name={fixture.home_team_name} />
        <span className="text-xs font-semibold text-[#ededed] truncate">
          {fixture.home_team_name}
        </span>
      </div>

      {/* Score or VS */}
      <div className="w-10 sm:w-16 shrink-0 text-center">
        {isFinished || isLive ? (
          <span className="text-stat text-xs sm:text-sm text-[#ededed] tabular-nums">
            {fixture.result?.home_score ?? 0}-{fixture.result?.away_score ?? 0}
          </span>
        ) : (
          <span className="text-[10px] uppercase tracking-wider text-[#6b7280]">vs</span>
        )}
      </div>

      {/* Away team */}
      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
        <span className="text-xs font-semibold text-[#ededed] truncate text-right">
          {fixture.away_team_name}
        </span>
        <TeamLogo src={fixture.away_team_logo} name={fixture.away_team_name} />
      </div>

      {/* Pick + Confidence */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        {pick ? (
          <Pill
            tone={pick.tone}
            className="!text-[9px] sm:!text-[10px] hidden md:inline-flex max-w-[110px] truncate"
          >
            <span className="truncate">{shortTeamName(pick.label)}</span>
          </Pill>
        ) : null}
        <div className="w-11 sm:w-14 text-right">
          {conf != null ? (
            <DataChip
              tone="win"
              style={color ? { color, borderColor: `${color}66` } : undefined}
              className="!text-[10px] sm:!text-xs"
            >
              {conf}%
            </DataChip>
          ) : (
            <span className="text-[9px] italic text-[#6b7280]">{t("dash.analyzing")}</span>
          )}
        </div>
        <ArrowRight className="hidden sm:block h-3 w-3 shrink-0 text-[#6b7280] transition-all group-hover:translate-x-0.5 group-hover:text-[#4ade80]" />
      </div>
    </Link>
  );
}

export function TodayMatchesList({ data, isLoading }: TodayMatchesListProps) {
  const { t } = useTranslations();
  const [expanded, setExpanded] = useState(false);

  const fixtures = data?.fixtures ?? [];
  const count = fixtures.length;

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
    <div className="card-neon card-neon-green">
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.05] px-5 py-3">
          <div className="flex items-center gap-3">
            <HexBadge variant="green" size="sm" noGlow>
              <Calendar className="h-4 w-4" />
            </HexBadge>
            <span className="section-label">{t("dash.todayMatches")}</span>
            {count > 0 && <Pill tone="active">{count}</Pill>}
          </div>
          <TierScopePill compact />
        </div>

        <div>
          {isLoading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <MatchRowSkeleton key={i} />)}
            </div>
          ) : count === 0 ? (
            <p className="py-8 text-center text-xs text-[#6b7280]">
              {t("dash.noMatchesToday")}
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
                  {t("dash.showMore")} ({leagueNames.length - INITIAL_LEAGUES})
                  <ChevronDown className="h-3 w-3" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
