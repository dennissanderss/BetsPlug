"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { ArrowRight } from "lucide-react";
import type { Fixture, FixturesResponse } from "@/types/api";

interface LiveMatchesStripProps {
  data: FixturesResponse | undefined;
  isLoading: boolean;
  nextKickoff?: string | null;
}

function LiveCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.04] p-3">
      <div className="h-3 w-20 rounded bg-white/[0.06] mb-3" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-white/[0.06]" />
        <div className="h-4 w-full rounded bg-white/[0.06]" />
      </div>
    </div>
  );
}

function LiveMatchCard({ fixture }: { fixture: Fixture }) {
  return (
    <div className="rounded-xl border border-white/[0.06] border-l-4 border-l-blue-500 bg-white/[0.04] p-3 transition-all hover:bg-white/[0.06]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 truncate">
          {fixture.league_name}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="live-dot" />
          <span className="text-[10px] font-semibold uppercase text-emerald-400">LIVE</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {/* Home */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {fixture.home_team_logo && (
              <Image src={fixture.home_team_logo} alt="" width={18} height={18} className="rounded-full shrink-0" />
            )}
            <span className="text-xs font-medium text-slate-200 truncate">
              {fixture.home_team_name}
            </span>
          </div>
          <span className="text-sm font-bold tabular-nums text-white ml-2">
            {fixture.result?.home_score ?? 0}
          </span>
        </div>

        {/* Away */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {fixture.away_team_logo && (
              <Image src={fixture.away_team_logo} alt="" width={18} height={18} className="rounded-full shrink-0" />
            )}
            <span className="text-xs font-medium text-slate-200 truncate">
              {fixture.away_team_name}
            </span>
          </div>
          <span className="text-sm font-bold tabular-nums text-white ml-2">
            {fixture.result?.away_score ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}

export function LiveMatchesStrip({ data, isLoading, nextKickoff }: LiveMatchesStripProps) {
  const { t } = useTranslations();
  const lHref = useLocalizedHref();

  const liveMatches = (data?.fixtures ?? []).filter((f) => f.status === "live");
  const count = liveMatches.length;

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <h2 className="text-sm font-semibold text-slate-100">{t("dash.liveNow")}</h2>
          {count > 0 && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold tabular-nums text-emerald-400">
              {count}
            </span>
          )}
        </div>
        {count > 0 && (
          <Link
            href={lHref("/live")}
            className="flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-emerald-400"
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
          <p className="py-4 text-center text-xs text-slate-500">
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
  );
}
