"use client";

import Link from "next/link";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { Trophy, Sparkles, ArrowRight, Brain, TrendingUp, Shield, FlaskConical, BarChart3 } from "lucide-react";

export default function YourRoutePage() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  return (
    <div className="mx-auto max-w-3xl space-y-10 animate-fade-in py-4">

      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {t("route.title")}
        </h1>
        <p className="text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
          {t("route.subtitle")}
        </p>
      </div>

      {/* How it works — 3 simple steps */}
      <div className="glass-card p-6 space-y-5">
        <h2 className="text-lg font-bold text-white">{t("route.howTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <Brain className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{t("route.step1Title")}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t("route.step1Desc")}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{t("route.step2Title")}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t("route.step2Desc")}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <Shield className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{t("route.step3Title")}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t("route.step3Desc")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two paths */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Pick of the Day */}
        <Link
          href={loc("/bet-of-the-day")}
          className="glass-card-hover group p-6 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Trophy className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{t("route.botdTitle")}</h3>
              <p className="text-xs text-emerald-400 font-semibold">{t("route.botdBadge")}</p>
            </div>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            {t("route.botdDesc")}
          </p>
          <div className="flex items-center gap-1 text-sm font-semibold text-emerald-400 group-hover:gap-2 transition-all">
            {t("route.botdCta")} <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        {/* All Predictions */}
        <Link
          href={loc("/predictions")}
          className="glass-card-hover group p-6 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Sparkles className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{t("route.allTitle")}</h3>
              <p className="text-xs text-blue-400 font-semibold">{t("route.allBadge")}</p>
            </div>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            {t("route.allDesc")}
          </p>
          <div className="flex items-center gap-1 text-sm font-semibold text-blue-400 group-hover:gap-2 transition-all">
            {t("route.allCta")} <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      </div>

      {/* Also explore */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href={loc("/strategy")}
          className="glass-card-hover group flex items-center gap-3 p-4"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
            <FlaskConical className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">{t("route.strategyTitle")}</p>
            <p className="text-[10px] text-slate-400">{t("route.strategyDesc")}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-600 shrink-0 group-hover:text-emerald-400 transition-colors" />
        </Link>
        <Link
          href={loc("/results")}
          className="glass-card-hover group flex items-center gap-3 p-4"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <BarChart3 className="h-4 w-4 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">{t("route.resultsTitle")}</p>
            <p className="text-[10px] text-slate-400">{t("route.resultsDesc")}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-600 shrink-0 group-hover:text-emerald-400 transition-colors" />
        </Link>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-[11px] text-slate-600">
        {t("route.disclaimer")}
      </p>
    </div>
  );
}
