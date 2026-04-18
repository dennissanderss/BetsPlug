"use client";

import Link from "next/link";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { UpsellBanner } from "@/components/ui/upsell-banner";
import {
  TrendingUp,
  Target,
  ClipboardList,
  FileBarChart2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  BarChart3,
} from "lucide-react";
import type { WeeklySummary } from "@/types/api";
import type { PickTierSlug } from "@/types/api";

interface SportsHubSidebarProps {
  summary: WeeklySummary | undefined;
  isLoading: boolean;
  userTierSlug?: PickTierSlug | null;
}

export function SportsHubSidebar({ summary, isLoading, userTierSlug }: SportsHubSidebarProps) {
  const { t, locale } = useTranslations();
  const lHref = useLocalizedHref();
  const isNl = locale === "nl";
  const tierLabel = userTierSlug
    ? userTierSlug.charAt(0).toUpperCase() + userTierSlug.slice(1)
    : null;

  const quickLinks = [
    { label: t("dash.nav.predictions"), href: "/predictions", icon: Target },
    { label: t("dash.nav.trackRecord"), href: "/trackrecord", icon: ClipboardList },
    { label: t("dash.nav.reports"), href: "/reports", icon: FileBarChart2 },
  ];

  return (
    <div className="space-y-4">
      {/* This Week stats */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/[0.05] px-4 py-3">
          <BarChart3 className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200">{t("dash.thisWeek")}</h3>
          <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-500">
            {tierLabel
              ? `${tierLabel} · ${isNl ? "7 dagen" : "7 days"}`
              : isNl
              ? "Alle tiers · 7 dagen"
              : "All tiers · 7 days"}
          </span>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-white/[0.04]" />
              ))}
            </div>
          ) : !summary ? (
            <p className="text-xs text-slate-500">{t("dash.noWeeklyData")}</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-white/[0.04] p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span className="text-lg font-bold tabular-nums text-emerald-400">
                    {summary.won}
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                  {t("dash.wonLabel")}
                </span>
              </div>
              <div className="rounded-lg bg-white/[0.04] p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <XCircle className="h-3 w-3 text-red-400" />
                  <span className="text-lg font-bold tabular-nums text-red-400">
                    {summary.lost}
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                  {t("dash.lostLabel")}
                </span>
              </div>
              <div className="rounded-lg bg-white/[0.04] p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3 text-blue-400" />
                  <span className="text-lg font-bold tabular-nums text-blue-400">
                    {Math.round(summary.win_rate * 100)}%
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                  {t("dash.winRateLabel")}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/[0.05] px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-200">{t("dash.quickLinks")}</h3>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {quickLinks.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={lHref(href)}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04]"
            >
              <Icon className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-sm text-slate-300 flex-1">{label}</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-600" />
            </Link>
          ))}
        </div>
      </div>

      {/* Upsell */}
      <UpsellBanner
        targetTier="gold"
        headline={t("dash.upsellHeadline")}
        subtext={t("dash.upsellSubtext")}
        variant="card"
      />
    </div>
  );
}
