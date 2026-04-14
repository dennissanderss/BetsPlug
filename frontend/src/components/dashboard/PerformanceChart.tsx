"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "@/i18n/locale-provider";
import { api } from "@/lib/api";
import { formatPercent } from "@/lib/utils";
import type { SegmentPerformance } from "@/types/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

type Period = "backtest" | "live" | "both";

// The live tracking cutoff date
const LIVE_CUTOFF = "2026-01";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#1a2236] px-3 py-2 shadow-xl">
      <p className="mb-1 text-xs font-semibold text-slate-400">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {formatPercent(entry.value / 100)}
        </p>
      ))}
    </div>
  );
}

export function PerformanceChart() {
  const { t } = useTranslations();
  const [period, setPeriod] = useState<Period>("both");

  const { data: monthSegments, isLoading } = useQuery({
    queryKey: ["segments-month"],
    queryFn: () => api.getTrackrecordSegments("month"),
  });

  const allData = (monthSegments ?? []).map((s: SegmentPerformance) => ({
    month: s.segment_value,
    accuracy: Math.round(s.accuracy * 100),
    isLive: s.segment_value >= LIVE_CUTOFF,
  }));

  const chartData =
    period === "backtest"
      ? allData.filter((d) => !d.isLive)
      : period === "live"
        ? allData.filter((d) => d.isLive)
        : allData;

  const periods: { key: Period; label: string }[] = [
    { key: "backtest", label: t("dash.periodBacktest") },
    { key: "live", label: t("dash.periodLive") },
    { key: "both", label: t("dash.periodBoth") },
  ];

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-white/[0.05] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            {t("dash.modelPerformanceTrend")}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {t("dash.modelPerformanceTrendDesc")}
          </p>
        </div>

        {/* Period toggle */}
        <div className="flex rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
          {periods.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                period === key
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="h-[300px] animate-pulse rounded-lg bg-white/[0.04]" />
        ) : chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
            {t("dash.noMonthlyData")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="greenStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#4ade80" />
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
              {period === "both" && (
                <ReferenceLine
                  x={LIVE_CUTOFF}
                  stroke="#4ade80"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                  label={{
                    value: t("dash.liveTrackingStart"),
                    position: "top",
                    fill: "#4ade80",
                    fontSize: 11,
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="accuracy"
                name="Accuracy"
                stroke="url(#greenStroke)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#4ade80", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
