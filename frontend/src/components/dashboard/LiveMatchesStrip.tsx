"use client";

import Link from "next/link";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { ArrowRight, Activity, Target } from "lucide-react";
import { TeamLogo } from "@/components/dashboard/TeamLogo";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { formatLiveMinute } from "@/components/match-predictions/shared";
import type { Fixture, FixturesResponse } from "@/types/api";

interface LiveMatchesStripProps {
  data: FixturesResponse | undefined;
  isLoading: boolean;
  nextKickoff?: string | null;
}

function LiveCardSkeleton() {
  return (
    <div className="glass-panel animate-pulse p-3">
      <div className="h-3 w-20 rounded bg-white/[0.06] mb-3" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-white/[0.06]" />
        <div className="h-4 w-full rounded bg-white/[0.06]" />
      </div>
    </div>
  );
}

function LiveMatchCard({ fixture }: { fixture: Fixture }) {
  const { t } = useTranslations();
  const lHref = useLocalizedHref();
  const pred = fixture.prediction;
  const pick = pred?.pick;
  const conf = pred ? Math.round(pred.confidence * 100) : null;

  // Short name map for the pick pill
  let pickTeam: string | null = null;
  let pickTone: "win" | "draw" = "win";
  if (pick === "HOME") pickTeam = fixture.home_team_name;
  else if (pick === "AWAY") pickTeam = fixture.away_team_name;
  else if (pick === "DRAW") {
    pickTeam = t("common.draw");
    pickTone = "draw";
  }

  return (
    <Link
      href={lHref(`/matches/${fixture.id}`)}
      className="card-neon card-neon-purple p-2.5 sm:p-3 block transition-all hover:-translate-y-0.5 hover:halo-purple focus-visible:outline-none focus-visible:halo-purple"
    >
      <div className="relative">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <HexBadge variant="purple" size="sm" noGlow>
              <Activity className="h-3.5 w-3.5" />
            </HexBadge>
            <span className="text-[10px] uppercase tracking-wider text-[#a3a9b8] truncate">
              {fixture.league_name}
            </span>
          </div>
          <Pill tone="default" className="inline-flex items-center gap-1.5 !px-2 shrink-0 tabular-nums">
            <span className="live-dot-red" />
            {formatLiveMinute(fixture.live_score) ?? "LIVE"}
          </Pill>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <TeamLogo src={fixture.home_team_logo} name={fixture.home_team_name} />
              <span className="text-xs font-semibold text-[#ededed] truncate">
                {fixture.home_team_name}
              </span>
            </div>
            <span className="text-stat text-base sm:text-lg text-[#ededed] ml-2 shrink-0 tabular-nums">
              {fixture.result?.home_score ?? 0}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <TeamLogo src={fixture.away_team_logo} name={fixture.away_team_name} />
              <span className="text-xs font-semibold text-[#ededed] truncate">
                {fixture.away_team_name}
              </span>
            </div>
            <span className="text-stat text-base sm:text-lg text-[#ededed] ml-2 shrink-0 tabular-nums">
              {fixture.result?.away_score ?? 0}
            </span>
          </div>
        </div>

        {pickTeam && (
          <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-2">
            <Pill tone={pickTone} className="!text-[10px] inline-flex items-center gap-1 max-w-[70%] truncate">
              <Target className="h-3 w-3 shrink-0" />
              <span className="truncate">{pickTeam}</span>
            </Pill>
            {conf != null && (
              <span className="text-[10px] font-semibold tabular-nums text-[#a3a9b8]">
                {conf}%
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export function LiveMatchesStrip({ data, isLoading, nextKickoff }: LiveMatchesStripProps) {
  const { t } = useTranslations();
  const lHref = useLocalizedHref();

  const liveMatches = (data?.fixtures ?? []).filter((f) => f.status === "live");
  const count = liveMatches.length;

  return (
    <div className="card-neon">
      <div className="relative">
        <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="live-dot-red" />
            <span className="section-label">{t("dash.liveNow")}</span>
            {count > 0 && <Pill tone="active">{count}</Pill>}
          </div>
          {count > 0 && (
            <Link
              href={lHref("/live")}
              className="flex items-center gap-1 text-xs text-[#a3a9b8] transition-colors hover:text-[#4ade80]"
            >
              {t("dash.viewAll")}
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <LiveCardSkeleton key={i} />)}
            </div>
          ) : count === 0 ? (
            <p className="py-4 text-center text-xs text-[#6b7280]">
              {nextKickoff
                ? `${t("dash.noLiveNextMatch")} ${nextKickoff}`
                : t("dash.noLiveMatches")}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {liveMatches.slice(0, 6).map((fixture) => (
                <LiveMatchCard key={fixture.id} fixture={fixture} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
