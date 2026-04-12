"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import {
  Trophy,
  Sparkles,
  FlaskConical,
  MapPin,
  ChevronRight,
  BarChart3,
  CalendarCheck,
  Lock,
  Target,
  Flame,
} from "lucide-react";
import { api } from "@/lib/api";

export default function JouwRoutePage() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  const { data: botdStats } = useQuery({
    queryKey: ["botd-track-record-route"],
    queryFn: async () => {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const resp = await fetch(`${API}/bet-of-the-day/track-record`);
      if (!resp.ok) return null;
      return resp.json();
    },
    staleTime: 5 * 60_000,
  });

  const { data: metrics } = useQuery({
    queryKey: ["dashboard-metrics-route"],
    queryFn: () => api.getDashboardMetrics(),
    staleTime: 5 * 60_000,
  });

  const botdAccuracy = botdStats?.accuracy_pct ?? null;
  const botdPicks = botdStats?.total_picks ?? null;
  const botdStreak = botdStats?.current_streak ?? 0;
  const totalPredictions = metrics?.total_forecasts ?? null;
  const overallAccuracy = metrics?.accuracy ? Math.round(metrics.accuracy * 100) : null;

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-3">
          <MapPin className="h-7 w-7 text-emerald-400" />
          <h1 className="text-3xl font-extrabold tracking-tight gradient-text">
            {t("route.title")}
          </h1>
        </div>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          {t("route.subtitle")}
        </p>
      </div>

      {/* #1 Pick van de Dag */}
      <Link href={loc("/bet-of-the-day")} className="group block mb-6">
        <div className="glass-card overflow-hidden transition-all duration-300 group-hover:border-amber-500/30 animate-fade-in">
          <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-amber-600" />
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15">
                <Trophy className="h-7 w-7 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-xl font-extrabold text-slate-100">
                    {t("route.botdTitle")}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    <Target className="h-3 w-3" />
                    {t("route.botdBadge")}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  {t("route.botdDesc")}
                </p>
                {botdAccuracy !== null && (
                  <div className="flex flex-wrap gap-3">
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-center min-w-[80px]">
                      <p className="text-[9px] uppercase tracking-widest text-slate-500">{t("route.botdAccuracy")}</p>
                      <p className="text-lg font-extrabold tabular-nums text-amber-400">{botdAccuracy}%</p>
                    </div>
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-center min-w-[80px]">
                      <p className="text-[9px] uppercase tracking-widest text-slate-500">{t("route.botdPicks")}</p>
                      <p className="text-lg font-extrabold tabular-nums text-slate-100">{botdPicks}</p>
                    </div>
                    {botdStreak > 0 && (
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-center min-w-[80px]">
                        <p className="text-[9px] uppercase tracking-widest text-slate-500">{t("route.botdStreak")}</p>
                        <p className="text-lg font-extrabold tabular-nums text-emerald-400">
                          <Flame className="inline h-4 w-4 -mt-0.5 mr-0.5" />{botdStreak}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <ChevronRight className="h-6 w-6 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0 mt-2" />
            </div>
          </div>
        </div>
      </Link>

      {/* Alle Voorspellingen */}
      <Link href={loc("/predictions")} className="group block mb-6">
        <div className="glass-card overflow-hidden transition-all duration-300 group-hover:border-blue-500/30 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-blue-600" />
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15">
                <Sparkles className="h-7 w-7 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-xl font-extrabold text-slate-100">
                    {t("route.predictionsTitle")}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                    {t("route.predictionsBadge")}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  {t("route.predictionsDesc")}
                </p>
                {totalPredictions !== null && (
                  <div className="flex flex-wrap gap-3">
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-center min-w-[80px]">
                      <p className="text-[9px] uppercase tracking-widest text-slate-500">{t("route.predictionsPredicted")}</p>
                      <p className="text-lg font-extrabold tabular-nums text-blue-400">{totalPredictions?.toLocaleString("nl-NL")}</p>
                    </div>
                    {overallAccuracy !== null && (
                      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-center min-w-[80px]">
                        <p className="text-[9px] uppercase tracking-widest text-slate-500">{t("route.predictionsAccuracy")}</p>
                        <p className="text-lg font-extrabold tabular-nums text-slate-100">{overallAccuracy}%</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <ChevronRight className="h-6 w-6 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0 mt-2" />
            </div>
          </div>
        </div>
      </Link>

      {/* Strategy Lab — Coming Soon */}
      <div className="glass-card overflow-hidden opacity-50 cursor-not-allowed mb-12 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="h-1 w-full bg-gradient-to-r from-slate-600 to-slate-700" />
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-500/10">
              <FlaskConical className="h-7 w-7 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-xl font-extrabold text-slate-400">
                  {t("route.strategyLabTitle")}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 border border-slate-600/30 px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <Lock className="h-3 w-3" />
                  {t("route.strategyLabBadge")}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                {t("route.strategyLabDesc")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Common links */}
      <div className="animate-fade-in" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            {t("route.performanceTitle")}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: t("route.commonResults"), desc: t("route.commonResultsDesc"), href: "/results", icon: Trophy },
            { title: t("route.commonWeeklyReport"), desc: t("route.commonWeeklyReportDesc"), href: "/weekly-report", icon: CalendarCheck },
            { title: t("route.commonTrackrecord"), desc: t("route.commonTrackrecordDesc"), href: "/trackrecord", icon: BarChart3 },
          ].map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={loc(link.href)} className="group">
                <div className="glass-card p-5 group-hover:border-emerald-500/20 transition-all duration-300 h-full">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                      <Icon className="h-4 w-4 text-emerald-400" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-200">{link.title}</h4>
                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all ml-auto shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{link.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
}
