"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "@/i18n/locale-provider";
import { api } from "@/lib/api";
import { formatPercent } from "@/lib/utils";
import { Activity, Target, TrendingUp, CalendarDays, Info } from "lucide-react";

function MetricSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card p-6 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="h-3 w-24 rounded bg-white/[0.06]" />
              <div className="h-8 w-20 rounded bg-white/[0.06]" />
              <div className="h-3 w-16 rounded bg-white/[0.06]" />
            </div>
            <div className="h-10 w-10 rounded-lg bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MetricCardsRow() {
  const { t } = useTranslations();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["trackrecord-summary"],
    queryFn: () => api.getTrackrecordSummary(),
  });

  const { data: botdStats } = useQuery({
    queryKey: ["botd-track-record-dash"],
    queryFn: async () => {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const resp = await fetch(`${API}/bet-of-the-day/track-record`);
      if (!resp.ok) return null;
      return resp.json() as Promise<{
        accuracy_pct: number;
        total_picks: number;
        correct: number;
        current_streak: number;
      }>;
    },
  });

  const { data: todayFixtures } = useQuery({
    queryKey: ["fixtures-today-dash"],
    queryFn: () => api.getFixturesToday(),
  });

  if (summaryLoading) return <MetricSkeleton />;

  const metrics = [
    {
      label: t("dash.totalForecasts"),
      value: summary?.total_predictions.toLocaleString() ?? "-",
      sub: t("dash.allTime"),
      tooltip: t("dash.totalForecastsTooltip"),
      icon: Activity,
    },
    {
      label: t("dash.overallAccuracy"),
      value: summary ? formatPercent(summary.accuracy) : "-",
      sub: t("dash.vsLastPeriod"),
      tooltip: t("dash.overallAccuracyTooltip"),
      icon: Target,
    },
    {
      label: t("dash.pickOfDay"),
      value: botdStats?.accuracy_pct != null ? `${botdStats.accuracy_pct}%` : "-",
      sub: botdStats?.total_picks
        ? `${botdStats.total_picks} ${t("dash.picks")}`
        : t("dash.pickOfDaySub"),
      tooltip: t("dash.pickOfDayTooltip"),
      icon: TrendingUp,
    },
    {
      label: t("dash.liveToday"),
      value: todayFixtures?.count?.toString() ?? "-",
      sub: t("dash.matchesToday"),
      tooltip: t("dash.liveTodayTooltip"),
      icon: CalendarDays,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, value, sub, tooltip, icon: Icon }) => (
        <div key={label} className="glass-card-hover p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  {label}
                </p>
                <span title={tooltip} className="cursor-help">
                  <Info className="h-3 w-3 text-slate-600 transition-colors hover:text-slate-400" />
                </span>
              </div>
              <p className="text-3xl font-bold tabular-nums gradient-text leading-none">
                {value}
              </p>
              <span className="text-xs text-slate-500">{sub}</span>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <Icon className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
