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
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";

/* ─── Page ─────────────────────────────────────────────────────────────── */

export default function JouwRoutePage() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  // Fetch BOTD track record for live stats
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

  // Fetch dashboard metrics for predictions stats
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
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-3">
          <MapPin className="h-7 w-7 text-emerald-400" />
          <h1 className="text-3xl font-extrabold tracking-tight gradient-text">
            {t("route.title")}
          </h1>
        </div>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          BetsPlug Pulse analyseert elke wedstrijd. Kies hoe je de resultaten wilt gebruiken.
        </p>
      </div>

      {/* ── #1 Pick van de Dag — Hero Card ──────────────────────────── */}
      <Link href={loc("/bet-of-the-day")} className="group block mb-6">
        <div className="glass-card overflow-hidden transition-all duration-300 group-hover:border-amber-500/30 animate-fade-in">
          <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-amber-600" />
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15">
                <Trophy className="h-7 w-7 text-amber-400" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-xl font-extrabold text-slate-100">
                    Pick van de Dag
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    <Target className="h-3 w-3" />
                    #1 Aanbeveling
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  Elke dag selecteert Pulse automatisch de wedstrijd waar het model het meest zeker van is.
                  Eén pick, maximale overtuiging.
                </p>

                {/* Live stats row */}
                {botdAccuracy !== null && (
                  <div className="flex flex-wrap gap-3">
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-center min-w-[80px]">
                      <p className="text-[9px] uppercase tracking-widest text-slate-500">Trefzekerheid</p>
                      <p className="text-lg font-extrabold tabular-nums text-amber-400">{botdAccuracy}%</p>
                    </div>
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-center min-w-[80px]">
                      <p className="text-[9px] uppercase tracking-widest text-slate-500">Picks</p>
                      <p className="text-lg font-extrabold tabular-nums text-slate-100">{botdPicks}</p>
                    </div>
                    {botdStreak > 0 && (
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-center min-w-[80px]">
                        <p className="text-[9px] uppercase tracking-widest text-slate-500">Streak</p>
                        <p className="text-lg font-extrabold tabular-nums text-emerald-400">
                          <Flame className="inline h-4 w-4 -mt-0.5 mr-0.5" />{botdStreak}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Arrow */}
              <ChevronRight className="h-6 w-6 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0 mt-2" />
            </div>
          </div>
        </div>
      </Link>

      {/* ── Alle Voorspellingen ─────────────────────────────────────── */}
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
                    Alle Voorspellingen
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                    Live + Upcoming
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  Bekijk alle wedstrijden met AI-analyse, live scores, odds en kansberekeningen. Filter per competitie en sorteer op zekerheid.
                </p>

                {totalPredictions !== null && (
                  <div className="flex flex-wrap gap-3">
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-center min-w-[80px]">
                      <p className="text-[9px] uppercase tracking-widest text-slate-500">Voorspeld</p>
                      <p className="text-lg font-extrabold tabular-nums text-blue-400">{totalPredictions?.toLocaleString("nl-NL")}</p>
                    </div>
                    {overallAccuracy !== null && (
                      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-center min-w-[80px]">
                        <p className="text-[9px] uppercase tracking-widest text-slate-500">Nauwkeurigheid</p>
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

      {/* ── Strategy Lab — Coming Soon ──────────────────────────────── */}
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
                  Strategy Lab
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 border border-slate-600/30 px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <Lock className="h-3 w-3" />
                  Coming Soon
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Bouw je eigen strategie met filters op zekerheid, competitie en markt. We verzamelen data om dit eerlijk en transparant te valideren.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Common links ───────────────────────────────────────────── */}
      <div className="animate-fade-in" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Prestaties & Overzicht
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: "Resultaten", desc: "Bekijk uitslagen van alle voorspellingen", href: "/results", icon: Trophy },
            { title: "Weekrapport", desc: "Prestatie-overzicht per week", href: "/weekly-report", icon: CalendarCheck },
            { title: "Trackrecord", desc: "Langetermijn nauwkeurigheidsdata", href: "/trackrecord", icon: BarChart3 },
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
