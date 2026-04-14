"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "@/i18n/locale-provider";
import { api } from "@/lib/api";
import { Star, ArrowRight, Clock, Trophy } from "lucide-react";
import Link from "next/link";

function HeroSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#1a2236] to-[#111827] p-8 animate-pulse">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4 flex-1">
          <div className="h-5 w-32 rounded bg-white/[0.06]" />
          <div className="h-8 w-64 rounded bg-white/[0.06]" />
          <div className="h-6 w-48 rounded bg-white/[0.06]" />
          <div className="h-4 w-40 rounded bg-white/[0.06]" />
        </div>
        <div className="h-24 w-48 rounded-xl bg-white/[0.06]" />
      </div>
    </div>
  );
}

export function HeroFeaturedMatch() {
  const { t } = useTranslations();

  const { data: botd, isLoading } = useQuery({
    queryKey: ["bet-of-the-day-hero"],
    queryFn: () => api.getBetOfTheDay(),
  });

  if (isLoading) return <HeroSkeleton />;

  if (!botd?.available) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#1a2236] to-[#111827] p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.03] to-transparent" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
            <Star className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-200">{t("dash.tipOfTheDay")}</h3>
            <p className="mt-1 text-sm text-slate-500">{t("dash.noTipToday")}</p>
          </div>
        </div>
      </div>
    );
  }

  const outcomeLabel =
    botd.predicted_outcome === "home"
      ? t("dash.homeWin")
      : botd.predicted_outcome === "away"
        ? t("dash.awayWin")
        : t("dash.drawResult");

  const scheduledDate = botd.scheduled_at
    ? new Date(botd.scheduled_at).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#1a2236] via-[#151d30] to-[#111827] transition-all duration-300 hover:border-emerald-500/20 hover:shadow-[0_4px_24px_rgba(74,222,128,0.08)]">
      {/* Subtle green glow */}
      <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-emerald-500/[0.04] blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-emerald-500/[0.03] blur-2xl" />

      <div className="relative p-6 sm:p-8">
        {/* Top label */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
            <Star className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
            {t("dash.tipOfTheDay")}
          </span>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Match info */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                {botd.home_team}
              </h2>
              <span className="text-lg font-medium text-slate-500">vs</span>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                {botd.away_team}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              {botd.league && (
                <span className="flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5" />
                  {botd.league}
                </span>
              )}
              {scheduledDate && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {scheduledDate}
                </span>
              )}
            </div>

            {/* CTA */}
            {botd.prediction_id && (
              <Link
                href={`/predictions/${botd.prediction_id}`}
                className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
              >
                {t("dash.viewFullAnalysis")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>

          {/* Pick + Confidence */}
          <div className="flex flex-col items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.04] px-8 py-5">
            <span className="rounded-full bg-emerald-500/15 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-emerald-400">
              {outcomeLabel}
            </span>
            {botd.confidence != null && (
              <div className="text-center">
                <p className="text-3xl font-bold tabular-nums gradient-text">
                  {Math.round(botd.confidence * 100)}%
                </p>
                <p className="text-[11px] uppercase tracking-widest text-slate-500">
                  {t("dash.confidence")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
