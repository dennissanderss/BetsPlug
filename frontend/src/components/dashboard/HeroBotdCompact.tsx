"use client";

import Link from "next/link";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { Star, ArrowRight } from "lucide-react";
import { confLevel, confColor } from "@/components/match-predictions/shared";

interface BotdData {
  available: boolean;
  home_team?: string | null;
  away_team?: string | null;
  league?: string | null;
  confidence?: number | null;
  predicted_outcome?: string | null;
  prediction_id?: string | null;
  match_id?: string | null;
}

interface HeroBotdCompactProps {
  botd: BotdData | undefined;
  isLoading: boolean;
}

export function HeroBotdCompact({ botd, isLoading }: HeroBotdCompactProps) {
  const { t } = useTranslations();
  const lHref = useLocalizedHref();

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl border-l-4 border-emerald-500/30 bg-white/[0.04] p-4">
        <div className="flex items-center gap-4">
          <div className="h-5 w-32 rounded bg-white/[0.06]" />
          <div className="h-5 w-48 rounded bg-white/[0.06]" />
        </div>
      </div>
    );
  }

  if (!botd?.available) {
    return (
      <div className="flex items-center gap-3 rounded-xl border-l-4 border-slate-700 bg-white/[0.04] px-4 py-3">
        <Star className="h-4 w-4 text-slate-500" />
        <span className="text-sm text-slate-500">{t("dash.noTipToday")}</span>
      </div>
    );
  }

  const conf = botd.confidence != null ? Math.round(botd.confidence * 100) : null;
  const level = conf != null ? confLevel(conf) : null;
  const color = level != null ? confColor(level) : "#94a3b8";

  return (
    <Link
      href={lHref(botd.match_id ? `/matches/${botd.match_id}` : "/bet-of-the-day")}
      className="group flex items-center gap-2 sm:gap-4 rounded-xl border-l-4 border-emerald-500 bg-white/[0.04] px-3 py-3 sm:px-4 transition-all hover:bg-white/[0.08]"
    >
      <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
        <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
      </div>

      <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-widest text-emerald-400 shrink-0">
        {t("botd.title")}
      </span>

      <div className="hidden sm:block h-4 w-px bg-white/[0.1]" />

      <span className="text-xs sm:text-sm font-medium text-slate-200 truncate min-w-0 flex-1">
        {botd.home_team} vs {botd.away_team}
      </span>

      {botd.league && (
        <span className="hidden md:inline text-xs text-slate-500 truncate shrink-0">
          {botd.league}
        </span>
      )}

      <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
        {conf != null && (
          <span
            className="rounded-full px-2 sm:px-2.5 py-0.5 text-[11px] sm:text-xs font-bold tabular-nums"
            style={{ background: `${color}18`, color }}
          >
            {conf}%
          </span>
        )}
        <ArrowRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400" />
      </div>
    </Link>
  );
}
