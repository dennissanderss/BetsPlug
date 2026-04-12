"use client";

import Link from "next/link";
import { useLocalizedHref } from "@/i18n/locale-provider";
import { Sparkles, ArrowRight, Trophy, Lock } from "lucide-react";

interface UpsellBannerProps {
  /** Which tier to promote */
  targetTier: "silver" | "gold" | "platinum";
  /** Main hook — what they're missing */
  headline: string;
  /** Supporting stat or description */
  subtext?: string;
  /** Visual variant */
  variant?: "inline" | "banner" | "card";
}

const TIER_STYLES = {
  silver: {
    gradient: "from-slate-400 to-slate-500",
    bg: "bg-slate-500/5",
    border: "border-slate-500/20",
    text: "text-slate-300",
    btn: "bg-gradient-to-r from-slate-400 to-slate-500",
    label: "Silver",
  },
  gold: {
    gradient: "from-amber-400 to-amber-600",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    text: "text-amber-300",
    btn: "bg-gradient-to-r from-amber-400 to-amber-600",
    label: "Gold",
  },
  platinum: {
    gradient: "from-violet-400 to-violet-600",
    bg: "bg-violet-500/5",
    border: "border-violet-500/20",
    text: "text-violet-300",
    btn: "bg-gradient-to-r from-violet-400 to-violet-600",
    label: "Platinum",
  },
};

export function UpsellBanner({
  targetTier,
  headline,
  subtext,
  variant = "banner",
}: UpsellBannerProps) {
  const loc = useLocalizedHref();
  const style = TIER_STYLES[targetTier];

  if (variant === "inline") {
    return (
      <Link href={loc("/pricing")} className="group block">
        <div className={`flex items-center gap-3 rounded-xl border ${style.border} ${style.bg} px-4 py-3 transition-all hover:border-opacity-50`}>
          <Lock className={`h-4 w-4 shrink-0 ${style.text}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200">{headline}</p>
            {subtext && <p className="text-xs text-slate-500 mt-0.5">{subtext}</p>}
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg ${style.btn} px-3 py-1.5 text-xs font-bold text-white shadow-lg group-hover:shadow-xl transition-shadow`}>
            {style.label} <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </Link>
    );
  }

  if (variant === "card") {
    return (
      <Link href={loc("/pricing")} className="group block">
        <div className={`glass-card overflow-hidden transition-all group-hover:${style.border}`}>
          <div className={`h-1 w-full bg-gradient-to-r ${style.gradient}`} />
          <div className="p-5 sm:p-6 flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.bg}`}>
              <Trophy className={`h-6 w-6 ${style.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-slate-100">{headline}</p>
              {subtext && <p className="text-sm text-slate-400 mt-1">{subtext}</p>}
              <span className={`mt-3 inline-flex items-center gap-1.5 rounded-lg ${style.btn} px-4 py-2 text-sm font-bold text-white shadow-lg group-hover:shadow-xl transition-shadow`}>
                Upgrade naar {style.label} <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Default: banner variant
  return (
    <Link href={loc("/pricing")} className="group block">
      <div className={`relative overflow-hidden rounded-xl border ${style.border} ${style.bg} px-5 py-4 transition-all group-hover:border-opacity-60`}>
        {/* Subtle glow */}
        <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${style.gradient} opacity-10 blur-2xl`} />

        <div className="relative flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.bg} ring-1 ring-white/[0.06]`}>
            <Sparkles className={`h-5 w-5 ${style.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-100">{headline}</p>
            {subtext && <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>}
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg ${style.btn} px-4 py-2 text-xs font-bold text-white shadow-lg group-hover:shadow-xl transition-shadow`}>
            {style.label} <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
