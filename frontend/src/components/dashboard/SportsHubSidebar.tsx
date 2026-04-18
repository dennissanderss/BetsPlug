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
import type { WeeklySummary, TrackrecordSummary } from "@/types/api";
import type { PickTierSlug } from "@/types/api";

interface SportsHubSidebarProps {
  summary: WeeklySummary | undefined;
  isLoading: boolean;
  userTierSlug?: PickTierSlug | null;
  tierSummary?: TrackrecordSummary | undefined;
  tierSummaryLoading?: boolean;
}

export function SportsHubSidebar({
  summary,
  isLoading,
  userTierSlug,
  tierSummary,
  tierSummaryLoading,
}: SportsHubSidebarProps) {
  const { t, locale } = useTranslations();
  const lHref = useLocalizedHref();
  const isNl = locale === "nl";
  const tierLabel = userTierSlug
    ? userTierSlug.charAt(0).toUpperCase() + userTierSlug.slice(1)
    : null;

  // Cumulative all-time for this tier. "accuracy" comes back as 0..1.
  // correct_predictions isn't on the shared TS type yet (backend returns
  // it), so derive it from total × accuracy — rounded to avoid floating-
  // point noise like 1163.99.
  const cumulativePct =
    tierSummary?.accuracy != null
      ? Math.round(tierSummary.accuracy * 1000) / 10
      : null;
  const cumulativeTotal = tierSummary?.total_predictions ?? null;
  const cumulativeCorrect =
    tierSummary?.accuracy != null && tierSummary?.total_predictions != null
      ? Math.round(tierSummary.accuracy * tierSummary.total_predictions)
      : null;

  const quickLinks = [
    { label: t("dash.nav.predictions"), href: "/predictions", icon: Target },
    { label: t("dash.nav.trackRecord"), href: "/trackrecord", icon: ClipboardList },
    { label: t("dash.nav.reports"), href: "/reports", icon: FileBarChart2 },
  ];

  return (
    <div className="space-y-4">
      {/* Tier accuracy — cumulative all-time. Week is shown as a small
          secondary line so the primary number stays stable week-to-week
          and matches the homepage tier-accuracy claim. */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/[0.05] px-4 py-3">
          <BarChart3 className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            {isNl ? "Jouw tier-nauwkeurigheid" : "Your tier accuracy"}
          </h3>
          <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-500">
            {tierLabel
              ? `${tierLabel} · ${isNl ? "all-time" : "all-time"}`
              : isNl
              ? "Alle tiers · all-time"
              : "All tiers · all-time"}
          </span>
        </div>
        <div className="p-4">
          {tierSummaryLoading ? (
            <div className="h-16 animate-pulse rounded-lg bg-white/[0.04]" />
          ) : cumulativePct == null ? (
            <p className="text-xs text-slate-500">
              {isNl
                ? "Nog geen data voor deze tier"
                : "No data for this tier yet"}
            </p>
          ) : (
            <>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-extrabold tabular-nums text-emerald-400">
                    {cumulativePct.toFixed(1).replace(".", isNl ? "," : ".")}%
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                    {isNl ? "Nauwkeurigheid" : "Accuracy"}
                  </p>
                </div>
                {cumulativeTotal != null && cumulativeCorrect != null && (
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-slate-200">
                      {cumulativeCorrect.toLocaleString(locale)} /{" "}
                      {cumulativeTotal.toLocaleString(locale)}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                      {isNl ? "correct / totaal" : "correct / total"}
                    </p>
                  </div>
                )}
              </div>
              {/* Secondary: small week-recent line so users keep a sense
                  of recent activity without the number becoming the
                  headline. */}
              {!isLoading && summary && (
                <div className="mt-3 flex items-center gap-3 border-t border-white/[0.05] pt-3">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">
                    {isNl ? "Laatste 7 dagen" : "Last 7 days"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] tabular-nums text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    {summary.won}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] tabular-nums text-red-300">
                    <XCircle className="h-3 w-3" />
                    {summary.lost}
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] tabular-nums text-slate-400">
                    <TrendingUp className="h-3 w-3" />
                    {Math.round(summary.win_rate * 100)}%
                  </span>
                </div>
              )}
            </>
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

      {/* Upsell — only render when the signed-in user isn't already on
          Gold or higher. A Platinum user would otherwise see a
          "Upgrade naar Gold" CTA (a downgrade), and a Gold user would
          see "upgrade naar gold" prompting their own tier. The main
          content already carries an "Upgrade to Platinum" nudge for
          Gold users, and Platinum needs no further CTA. */}
      {userTierSlug !== "gold" && userTierSlug !== "platinum" && (
        <UpsellBanner
          targetTier="gold"
          headline={t("dash.upsellHeadline")}
          subtext={t("dash.upsellSubtext")}
          variant="card"
        />
      )}
    </div>
  );
}
