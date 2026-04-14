"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "@/i18n/locale-provider";
import { api } from "@/lib/api";
import { Zap, BarChart3, TrendingUp } from "lucide-react";
import type { Fixture } from "@/types/api";

function SidebarSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/[0.05] px-4 py-3">
        <Icon className="h-4 w-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function LiveMatchItem({ fixture }: { fixture: Fixture }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-slate-200">
          {fixture.home_team_name} vs {fixture.away_team_name}
        </p>
        <p className="text-[10px] text-slate-500">{fixture.league_name}</p>
      </div>
      {fixture.result && (
        <div className="ml-2 flex items-center gap-1">
          <span className="text-sm font-bold tabular-nums text-slate-100">
            {fixture.result.home_score} - {fixture.result.away_score}
          </span>
          <span className="live-dot ml-1" />
        </div>
      )}
    </div>
  );
}

export function RightSidebar() {
  const { t } = useTranslations();

  const { data: todayFixtures } = useQuery({
    queryKey: ["fixtures-today-dash"],
    queryFn: () => api.getFixturesToday(),
  });

  const { data: liveFixtures } = useQuery({
    queryKey: ["fixtures-live-dash"],
    queryFn: () => api.getFixturesLive(),
    refetchInterval: 60_000,
  });

  const { data: strategies } = useQuery({
    queryKey: ["strategies-dash"],
    queryFn: () => api.getStrategies(),
  });

  const { data: summary } = useQuery({
    queryKey: ["trackrecord-summary"],
    queryFn: () => api.getTrackrecordSummary(),
  });

  // Live matches
  const liveMatches = (liveFixtures?.fixtures ?? []).filter(
    (f: Fixture) => f.status === "live"
  );

  // Top strategies by accuracy (simple proxy since no ROI field on strategy)
  const topStrategies = [...(strategies ?? [])]
    .slice(0, 3);

  // Today stats
  const todayCount = todayFixtures?.count ?? 0;
  const todayWithPredictions = (todayFixtures?.fixtures ?? []).filter(
    (f: Fixture) => f.prediction != null
  ).length;

  return (
    <div className="space-y-4">
      {/* Today in numbers */}
      <SidebarSection title={t("dash.todayInNumbers")} icon={BarChart3}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{t("dash.matchesToday")}</span>
            <span className="text-sm font-bold tabular-nums text-slate-100">
              {todayCount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{t("dash.withPredictions")}</span>
            <span className="text-sm font-bold tabular-nums text-emerald-400">
              {todayWithPredictions}
            </span>
          </div>
          {summary && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{t("dash.totalForecasts")}</span>
              <span className="text-sm font-bold tabular-nums text-slate-100">
                {summary.total_predictions.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </SidebarSection>

      {/* Live now */}
      <SidebarSection title={t("dash.liveNow")} icon={Zap}>
        {liveMatches.length === 0 ? (
          <p className="text-xs text-slate-500">{t("dash.noLiveMatches")}</p>
        ) : (
          <div className="space-y-2">
            {liveMatches.slice(0, 5).map((match: Fixture) => (
              <LiveMatchItem key={match.id} fixture={match} />
            ))}
          </div>
        )}
      </SidebarSection>

      {/* Top Strategies */}
      {topStrategies.length > 0 && (
        <SidebarSection title={t("dash.topStrategies")} icon={TrendingUp}>
          <div className="space-y-2">
            {topStrategies.map((strategy) => (
              <div
                key={strategy.id}
                className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-200">
                    {strategy.name}
                  </p>
                  {strategy.description && (
                    <p className="truncate text-[10px] text-slate-500">
                      {strategy.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SidebarSection>
      )}
    </div>
  );
}
