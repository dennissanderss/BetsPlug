"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "@/i18n/locale-provider";
import { UpsellBanner } from "@/components/ui/upsell-banner";
import {
  Activity,
  TrendingUp,
  Star,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { api } from "@/lib/api";
import { formatPercent, formatDateTime } from "@/lib/utils";
import type { Prediction, SegmentPerformance } from "@/types/api";

// ─── Custom chart tooltip ───────────────────────────────────────────────────

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#111827] px-3 py-2 shadow-xl">
      <p className="mb-1 text-xs font-semibold text-slate-400">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {formatPercent(entry.value / 100)}
        </p>
      ))}
    </div>
  );
}

// ─── KPI Skeleton ───────────────────────────────────────────────────────────

function KpiSkeletonRow() {
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

// ─── Table Skeleton ─────────────────────────────────────────────────────────

function TableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: 5 }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 rounded bg-white/[0.05]" style={{ width: `${60 + Math.random() * 40}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Predictions table ───────────────────────────────────────────────────────

function PredictionsTable({
  predictions,
  loading,
}: {
  predictions: Prediction[];
  loading: boolean;
}) {
  const { t } = useTranslations();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.05] bg-white/[0.03]">
            {[t("dash.thMatch"), t("dash.thDate"), t("dash.thPredicted"), t("dash.thConfidence"), t("dash.thResult")].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeletonRows />
          ) : predictions.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                {t("dash.noPredictions")}
              </td>
            </tr>
          ) : (
            predictions.map((row) => {
              const probs: { label: string; value: number; color: string }[] = [
                { label: "H", value: row.home_win_prob, color: "#3b82f6" },
                ...(row.draw_prob !== null
                  ? [{ label: "D", value: row.draw_prob, color: "#f59e0b" }]
                  : []),
                { label: "A", value: row.away_win_prob, color: "#ef4444" },
              ];
              const best = probs.reduce((a, b) => (a.value > b.value ? a : b));
              const conf = row.confidence;

              return (
                <tr
                  key={row.id}
                  className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]"
                >
                  {/* Match */}
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-100">
                      {row.match
                        ? `${row.match.home_team_name} vs ${row.match.away_team_name}`
                        : t("dash.matchLoading")}
                    </span>
                    {row.match?.league_name && (
                      <span className="block text-[10px] text-slate-500 mt-0.5">
                        {row.match.league_name}
                      </span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                    {formatDateTime(row.predicted_at)}
                  </td>

                  {/* Predicted — probabilities with colored bars */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded px-1.5 py-0.5 text-xs font-bold"
                        style={{
                          background: `${best.color}18`,
                          color: best.color,
                        }}
                      >
                        {best.label}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        {probs.map((p) => (
                          <div key={p.label} className="flex items-center gap-1">
                            <div
                              className="h-1 rounded-full"
                              style={{
                                width: `${p.value * 48}px`,
                                background: p.color,
                                opacity: p.label === best.label ? 1 : 0.4,
                              }}
                            />
                            <span
                              className="text-[10px]"
                              style={{ color: p.label === best.label ? p.color : "#64748b" }}
                            >
                              {formatPercent(p.value, 0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>

                  {/* Confidence */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-20 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${conf * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">{formatPercent(conf, 0)}</span>
                    </div>
                  </td>

                  {/* Result */}
                  <td className="px-4 py-3">
                    {!row.evaluation ? (
                      <span className="text-xs italic text-slate-500">{t("dash.pending")}</span>
                    ) : row.evaluation.is_correct ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                        {t("dash.correct")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                        {t("dash.incorrect")}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Dashboard page ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t } = useTranslations();
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["trackrecord-summary"],
    queryFn: () => api.getTrackrecordSummary(),
  });

  const { data: predictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ["predictions-recent"],
    queryFn: () => api.getPredictions({ limit: "10", page: "1" }),
  });

  // v6.2 Bug #3 fix: the chart is labelled "Accuracy by League" so the
  // segmentation should be "league", not "sport". Previously this
  // returned a single bar ("Football") because there's only one sport.
  const { data: sportSegments, isLoading: sportLoading } = useQuery({
    queryKey: ["segments-league"],
    queryFn: () => api.getTrackrecordSegments("league"),
  });

  const { data: monthSegments, isLoading: monthLoading } = useQuery({
    queryKey: ["segments-month"],
    queryFn: () => api.getTrackrecordSegments("month"),
  });

  const { data: botdStats } = useQuery({
    queryKey: ["botd-track-record-dash"],
    queryFn: async () => {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const resp = await fetch(`${API}/bet-of-the-day/track-record`);
      if (!resp.ok) return null;
      return resp.json() as Promise<{ accuracy_pct: number; total_picks: number; correct: number; current_streak: number }>;
    },
  });

  // Chart data
  const sportChartData = (sportSegments ?? []).map((s: SegmentPerformance) => ({
    sport: s.segment_value,
    accuracy: Math.round(s.accuracy * 100),
  }));

  const monthChartData = (monthSegments ?? []).map((s: SegmentPerformance) => ({
    month: s.segment_value,
    accuracy: Math.round(s.accuracy * 100),
  }));

  // KPI definitions
  const kpis = [
    {
      label: t("dash.totalForecasts"),
      value: summaryLoading ? null : (summary?.total_predictions.toLocaleString() ?? " - "),
      icon: Activity,
      trend: null as null | "up" | "down",
      sub: t("dash.allTime"),
      tooltip: t("dash.totalForecastsTooltip"),
    },
    {
      label: t("dash.overallAccuracy"),
      value: summaryLoading ? null : (summary ? formatPercent(summary.accuracy) : " - "),
      icon: Target,
      trend: "up" as const,
      sub: t("dash.vsLastPeriod"),
      tooltip: t("dash.overallAccuracyTooltip"),
    },
    {
      label: "Pick of the Day",
      value: botdStats?.accuracy_pct != null ? `${botdStats.accuracy_pct}%` : " - ",
      icon: Star,
      trend: "up" as const,
      sub: "Daily top pick accuracy",
      tooltip: "Accuracy of the AI-selected best pick each day",
    },
    {
      label: t("dash.avgConfidence"),
      value: summaryLoading ? null : (summary ? formatPercent(summary.avg_confidence) : " - "),
      icon: TrendingUp,
      trend: null,
      sub: t("dash.modelCertainty"),
      tooltip: t("dash.avgConfidenceTooltip"),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Hero section ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight gradient-text">{t("dash.title")}</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            {t("dash.subtitle")}
          </p>
        </div>

        {/* Live badge */}
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-300 backdrop-blur-sm">
          <span className="live-dot" />
          <span>{t("dash.liveData")}</span>
        </div>
      </div>

      {/* ── KPI row ──────────────────────────────────────────────────────── */}
      {summaryLoading ? (
        <KpiSkeletonRow />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map(({ label, value, icon: Icon, trend, sub, tooltip }) => (
            <div key={label} className="glass-card-hover p-6" title={tooltip}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                    {label}
                  </p>
                  <p className="text-3xl font-bold gradient-text leading-none">
                    {value ?? " - "}
                  </p>
                  <div className="flex items-center gap-1">
                    {trend === "up" && (
                      <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                    )}
                    {trend === "down" && (
                      <ArrowDownRight className="h-3 w-3 text-emerald-400" />
                    )}
                    <span className="text-xs text-slate-500">{sub}</span>
                  </div>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 glow-blue-sm">
                  <Icon className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Upsell: Gold for BOTD ─────────────────────────────────────────── */}
      <UpsellBanner
        targetTier="gold"
        headline="Pick van de Dag — 66.7% trefzekerheid"
        subtext="Onze AI selecteert dagelijks de wedstrijd met de hoogste zekerheid. Alleen voor Gold members."
        variant="banner"
      />

      {/* ── Recent Predictions ───────────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between border-b border-white/[0.05] px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">{t("dash.recentPredictions")}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{t("dash.recentPredictionsDesc")}</p>
          </div>
          <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-400">
            {t("dash.lastTen")}
          </span>
        </div>

        <PredictionsTable
          predictions={predictions?.items ?? []}
          loading={predictionsLoading}
        />
      </div>

      {/* ── Two-column charts ────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Accuracy by League */}
        <div className="glass-card p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-100">{t("dash.accuracyByLeague")}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{t("dash.accuracyByLeagueDesc")}</p>
          </div>

          {sportLoading ? (
            <div className="h-[220px] animate-pulse rounded-lg bg-white/[0.04]" />
          ) : sportChartData.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-slate-500">
              {t("dash.noSegmentData")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={sportChartData}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="sport"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Bar
                  dataKey="accuracy"
                  name="Accuracy"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Model Performance Trend */}
        <div className="glass-card p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-100">{t("dash.modelPerformanceTrend")}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{t("dash.modelPerformanceTrendDesc")}</p>
          </div>

          {monthLoading ? (
            <div className="h-[220px] animate-pulse rounded-lg bg-white/[0.04]" />
          ) : monthChartData.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-slate-500">
              {t("dash.noMonthlyData")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={monthChartData}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="blueStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  name="Accuracy"
                  stroke="url(#blueStroke)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#60a5fa", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}
