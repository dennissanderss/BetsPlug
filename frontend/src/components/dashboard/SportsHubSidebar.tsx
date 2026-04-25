"use client";

import { useEffect, useState } from "react";
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
  Activity,
  FlaskConical,
} from "lucide-react";
import type { WeeklySummary, TrackrecordSummary } from "@/types/api";
import type { PickTierSlug } from "@/types/api";

interface LiveTierBucket {
  total: number;
  correct: number;
  accuracy: number;
}

interface LiveMeasurementResponse {
  start_date: string;
  total: number;
  correct: number;
  accuracy: number;
  per_tier: Record<string, LiveTierBucket>;
}

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
  const tierLabel = userTierSlug
    ? userTierSlug.charAt(0).toUpperCase() + userTierSlug.slice(1)
    : null;

  // Backtest (model-validation) — cumulative all-time for this tier.
  // tierSummary is fetched with source="backtest" upstream so this row
  // genuinely reflects the historical validation dataset, not a mix.
  const cumulativePct =
    tierSummary?.accuracy != null
      ? Math.round(tierSummary.accuracy * 1000) / 10
      : null;
  const cumulativeTotal = tierSummary?.total_predictions ?? null;
  const cumulativeCorrect =
    tierSummary?.accuracy != null && tierSummary?.total_predictions != null
      ? Math.round(tierSummary.accuracy * tierSummary.total_predictions)
      : null;

  // Live meting — strict pre-match predictions since the v8.1 cut-off
  // (2026-04-16). Own endpoint so we never mix with the backtest above.
  const [liveData, setLiveData] = useState<LiveMeasurementResponse | null>(
    null,
  );
  const [liveLoaded, setLiveLoaded] = useState(false);
  useEffect(() => {
    const API =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    fetch(`${API}/trackrecord/live-measurement`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setLiveData(d);
        setLiveLoaded(true);
      })
      .catch(() => setLiveLoaded(true));
  }, []);

  const liveBucket = userTierSlug
    ? liveData?.per_tier?.[userTierSlug]
    : undefined;
  const livePct =
    liveBucket && liveBucket.total > 0
      ? Math.round(liveBucket.accuracy * 1000) / 10
      : null;

  const backtestHref = lHref("/trackrecord") + "#model-validation";
  const liveHref = lHref("/trackrecord") + "#live-measurement";
  // Locale-aware decimal separator — NL/DE/PL/RU/etc. use comma,
  // EN/SW/ID use point. `toLocaleString` picks the right one per BCP-47.
  const fmtPct = (p: number) =>
    p.toLocaleString(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  const quickLinks = [
    { label: t("dash.nav.predictions"), href: "/predictions", icon: Target },
    { label: t("dash.nav.trackRecord"), href: "/trackrecord", icon: ClipboardList },
  ];

  return (
    <div className="space-y-4">
      {/* Tier accuracy — split into Backtest (historical model validation)
          and Live meting (strict pre-match, since v8.1 cut-off). Each row
          links to its section on /trackrecord so users can verify the
          numbers themselves. */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/[0.05] px-4 py-3">
          <BarChart3 className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            {t("sidebar.tierAccuracy")}
          </h3>
          <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-500">
            {tierLabel ? tierLabel : t("tier.allTiers")}
          </span>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {/* ── Backtest row ───────────────────────────────────────── */}
          <Link
            href={backtestHref}
            className="group block p-4 transition-colors hover:bg-white/[0.03]"
          >
            <div className="mb-2 flex items-center gap-1.5">
              <FlaskConical className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                {t("sidebar.modelValidation")}
              </span>
              <span className="text-[10px] text-slate-500">
                {t("sidebar.allV81Picks")}
              </span>
              <ArrowRight className="ml-auto h-3 w-3 text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-300" />
            </div>
            {tierSummaryLoading ? (
              <div className="h-10 animate-pulse rounded-lg bg-white/[0.04]" />
            ) : cumulativePct == null ? (
              <p className="text-xs text-slate-500">
                {t("sidebar.noTierData")}
              </p>
            ) : (
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-2xl font-extrabold tabular-nums text-emerald-400">
                    {fmtPct(cumulativePct)}%
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                    {t("sidebar.accuracy")}
                  </p>
                </div>
                {cumulativeTotal != null && cumulativeCorrect != null && (
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-slate-200">
                      {cumulativeCorrect.toLocaleString(locale)} /{" "}
                      {cumulativeTotal.toLocaleString(locale)}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                      {t("sidebar.correctTotal")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Link>

          {/* ── Live meting row ────────────────────────────────────── */}
          <Link
            href={liveHref}
            className="group block p-4 transition-colors hover:bg-white/[0.03]"
          >
            <div className="mb-2 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-sky-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                {t("sidebar.liveTracking")}
              </span>
              <span className="text-[10px] text-slate-500">
                {t("sidebar.sinceApr16")}
              </span>
              <ArrowRight className="ml-auto h-3 w-3 text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-sky-300" />
            </div>
            {!liveLoaded ? (
              <div className="h-10 animate-pulse rounded-lg bg-white/[0.04]" />
            ) : !liveBucket || liveBucket.total === 0 ? (
              <p className="text-xs text-slate-500">
                {t("sidebar.noLiveMeasured")}
              </p>
            ) : (
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-2xl font-extrabold tabular-nums text-sky-400">
                    {livePct != null ? `${fmtPct(livePct)}%` : "—"}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                    {t("sidebar.accuracy")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-slate-200">
                    {liveBucket.correct.toLocaleString(locale)} /{" "}
                    {liveBucket.total.toLocaleString(locale)}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                    {t("sidebar.correctTotal")}
                  </p>
                </div>
              </div>
            )}
          </Link>

          {/* ── Last 7 days footer ─────────────────────────────────── */}
          {!isLoading && summary && (
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">
                {t("sidebar.last7Days")}
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
