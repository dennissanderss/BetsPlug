"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Target,
  TrendingUp,
  BarChart3,
  Filter,
  Activity,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Database,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { api } from "@/lib/api";
import { cn, formatPercent, formatDate } from "@/lib/utils";
import type {
  TrackrecordSummary,
  SegmentPerformance,
  CalibrationBucket,
  Prediction,
  Sport,
  League,
} from "@/types/api";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CalibrationChart, type CalibrationPoint } from "@/components/charts/calibration-chart";
import {
  RollingAccuracyChart,
  type RollingAccuracyPoint,
} from "@/components/charts/rolling-accuracy-chart";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function accuracyCell(accuracy: number) {
  const pct = accuracy * 100;
  const colorClass =
    pct >= 60
      ? "text-emerald-400 font-semibold"
      : pct >= 50
      ? "text-amber-400 font-semibold"
      : "text-red-400 font-semibold";
  return <span className={colorClass}>{formatPercent(accuracy)}</span>;
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  accent?: "blue" | "green" | "amber" | "red";
}

function KpiCard({ title, value, icon: Icon, accent = "blue" }: KpiCardProps) {
  const accentMap = {
    blue: { icon: "text-blue-400", bg: "bg-blue-500/10", ring: "ring-blue-500/20" },
    green: { icon: "text-emerald-400", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20" },
    amber: { icon: "text-amber-400", bg: "bg-amber-500/10", ring: "ring-amber-500/20" },
    red: { icon: "text-red-400", bg: "bg-red-500/10", ring: "ring-red-500/20" },
  };
  const a = accentMap[accent];

  return (
    <div className="glass-card-hover p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{title}</p>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg ring-1", a.bg, a.ring)}>
          <Icon className={cn("h-4 w-4", a.icon)} />
        </div>
      </div>
      <p className="text-2xl font-bold gradient-text tabular-nums">{value}</p>
    </div>
  );
}

// ─── KPI skeletons ────────────────────────────────────────────────────────────

function KpiSkeletons() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3 w-28 rounded-md bg-white/[0.06] animate-pulse" />
            <div className="h-8 w-8 rounded-lg bg-white/[0.06] animate-pulse" />
          </div>
          <div className="h-7 w-20 rounded-md bg-white/[0.08] animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ─── Summary stats table ──────────────────────────────────────────────────────

interface StatRow {
  label: string;
  value: string;
}

function SummaryStatsTable({ summary }: { summary: TrackrecordSummary }) {
  const rows: StatRow[] = [
    { label: "Period Start", value: summary.period_start ? formatDate(summary.period_start) : "—" },
    { label: "Period End", value: summary.period_end ? formatDate(summary.period_end) : "—" },
    { label: "Total Predictions", value: summary.total_predictions.toLocaleString() },
    { label: "Accuracy", value: formatPercent(summary.accuracy) },
    { label: "Brier Score", value: summary.brier_score.toFixed(4) },
    { label: "Log Loss", value: summary.log_loss.toFixed(4) },
    { label: "Calibration Error (ECE)", value: summary.calibration_error.toFixed(4) },
    { label: "Avg Confidence", value: formatPercent(summary.avg_confidence) },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.03]">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Metric
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.label}
              className={cn(
                "border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.03]",
                idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
              )}
            >
              <td className="px-4 py-2.5 text-slate-400">{row.label}</td>
              <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-100">
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Segment table ────────────────────────────────────────────────────────────

function SegmentTable({ data, loading, emptyMessage }: {
  data: SegmentPerformance[];
  loading: boolean;
  emptyMessage: string;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-lg bg-white/[0.03]">
            <div className="h-4 w-32 rounded bg-white/[0.06] animate-pulse" />
            <div className="flex-1" />
            <div className="h-4 w-16 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-4 w-16 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-4 w-20 rounded bg-white/[0.06] animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">{emptyMessage}</div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.03]">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Segment
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Accuracy
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Brier Score
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Avg Confidence
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={`${row.segment_key}-${row.segment_value}`}
              className={cn(
                "border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.03]",
                idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
              )}
            >
              <td className="px-4 py-3 font-medium text-slate-100 capitalize">
                {String(row.segment_value)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-400">
                {Number(row.total).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {accuracyCell(Number(row.accuracy))}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-400">
                {Number(row.brier_score).toFixed(3)}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${Number(row.avg_confidence) * 100}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-slate-400 text-xs w-10 text-right">
                    {formatPercent(Number(row.avg_confidence))}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Segment section ──────────────────────────────────────────────────────────

function SegmentSection({
  title,
  groupBy,
  filterParams,
}: {
  title: string;
  groupBy: string;
  filterParams: Record<string, string>;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["trackrecord-segments", groupBy, filterParams],
    queryFn: () => api.getTrackrecordSegments(groupBy, filterParams),
  });

  return (
    <div className="space-y-3">
      <SegmentTable
        data={data ?? []}
        loading={isLoading}
        emptyMessage={`No segment data available for ${title.toLowerCase()}.`}
      />
    </div>
  );
}

// ─── Tab pill ─────────────────────────────────────────────────────────────────

function TabPill({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon?: React.ElementType;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
        active
          ? "bg-blue-600 text-white shadow-lg glow-blue-sm"
          : "bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.07]"
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

// ─── Live Performance Banner (real data) ──────────────────────────────────────

function LivePerformanceBanner({
  summary,
  loading,
}: {
  summary: TrackrecordSummary | undefined;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="glass-card p-5 animate-pulse" style={{ borderLeft: "3px solid #334155" }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-white/[0.06]" />
            <div className="space-y-1">
              <div className="h-4 w-40 rounded bg-white/[0.06]" />
              <div className="h-3 w-24 rounded bg-white/[0.04]" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center space-y-1">
                <div className="h-2 w-16 rounded bg-white/[0.04] mx-auto" />
                <div className="h-4 w-12 rounded bg-white/[0.06] mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!summary || summary.total_predictions === 0) {
    return (
      <div
        className="glass-card p-5 animate-fade-in"
        style={{ borderLeft: "3px solid #475569" }}
      >
        <div className="flex items-center gap-3">
          <Database className="h-4 w-4 text-slate-500" />
          <div>
            <h2 className="text-sm font-semibold text-slate-400">No predictions recorded yet</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Data collection is in progress. Prediction statistics will appear here once the first
              model evaluations are complete.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="glass-card p-5 animate-fade-in"
      style={{ borderLeft: "3px solid #10b981" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="live-dot" />
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Real Model Performance</h2>
            <p className="text-xs text-slate-500 mt-0.5">Live data from the database</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">Predictions</p>
            <p className="text-sm font-bold text-slate-100 tabular-nums">
              {summary.total_predictions.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">Accuracy</p>
            <p className="text-sm font-bold text-emerald-400 tabular-nums">
              {(summary.accuracy * 100).toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">Brier Score</p>
            <p className="text-sm font-bold text-blue-400 tabular-nums">
              {summary.brier_score.toFixed(3)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">Avg Confidence</p>
            <p className="text-sm font-bold text-slate-100 tabular-nums">
              {(summary.avg_confidence * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-slate-500 border-t border-white/[0.04] pt-2">
        These figures are real model outputs. Brier score measures probabilistic accuracy (lower is better). This is
        not financial or betting advice.
      </p>
    </div>
  );
}

// ─── Prediction status badges ─────────────────────────────────────────────────

function PredictionStatusBadge({ correct, evaluated }: { correct: boolean | null; evaluated: boolean }) {
  if (!evaluated) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse-slow inline-block" />
        <Clock className="h-3 w-3" />
        Pending
      </span>
    );
  }
  if (correct) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="h-3 w-3" />
        Correct
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
      <XCircle className="h-3 w-3" />
      Incorrect
    </span>
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = value * 100;
  const color =
    pct >= 65
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : pct >= 55
      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
      : "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border", color)}>
      {pct.toFixed(1)}%
    </span>
  );
}

// ─── Recent Predictions Feed (real data) ──────────────────────────────────────

function RecentPredictionsFeed() {
  const { data: response, isLoading } = useQuery({
    queryKey: ["predictions-recent"],
    queryFn: () => api.getPredictions({ limit: "15" }),
  });

  const predictions: Prediction[] = response?.items ?? [];
  const pendingCount = predictions.filter((p) => !p.evaluation).length;

  if (isLoading) {
    return (
      <div className="glass-card p-6 space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-48 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-3 w-32 rounded bg-white/[0.04] animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 w-full rounded-lg bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="glass-card p-6 space-y-3 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Recent Predictions</h2>
            <p className="text-sm text-slate-500 mt-0.5">Last 15 model calls</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <Database className="h-8 w-8 text-slate-600" />
          <p className="text-sm font-medium text-slate-500">No predictions yet</p>
          <p className="text-xs text-slate-600 max-w-sm">
            Predictions will appear here once the model has generated forecasts for upcoming matches.
            Data collection is in progress.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Recent Predictions &amp; Results</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Last {predictions.length} model calls — real data from database
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <Zap className="h-3 w-3 text-amber-400" />
          {pendingCount} pending
        </span>
      </div>

      <div className="space-y-2">
        {predictions.map((pred) => {
          const evaluated = !!pred.evaluation;
          const correct = pred.evaluation?.is_correct ?? null;
          const borderColor = !evaluated
            ? "#f59e0b"
            : correct
            ? "#10b981"
            : "#ef4444";

          const homeTeam = pred.match?.home_team_name ?? "—";
          const awayTeam = pred.match?.away_team_name ?? "—";
          const matchLabel = pred.match ? `${homeTeam} vs ${awayTeam}` : `Match ${pred.match_id}`;
          const scheduledAt = pred.match?.scheduled_at
            ? new Date(pred.match.scheduled_at).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
            : formatDate(pred.predicted_at);

          // Summarise the prediction call
          const homeProb = (pred.home_win_prob * 100).toFixed(0);
          const drawProb = pred.draw_prob !== null ? (pred.draw_prob * 100).toFixed(0) : null;
          const awayProb = (pred.away_win_prob * 100).toFixed(0);
          const callSummary = drawProb
            ? `H ${homeProb}% · D ${drawProb}% · A ${awayProb}%`
            : `H ${homeProb}% · A ${awayProb}%`;

          return (
            <div
              key={pred.id}
              className="glass-card-hover px-4 py-3 flex flex-wrap items-center gap-3"
              style={{ borderLeft: `3px solid ${borderColor}` }}
            >
              {/* Time */}
              <span className="text-xs text-slate-500 w-28 shrink-0">{scheduledAt}</span>

              {/* Match */}
              <div className="flex-1 min-w-[180px]">
                <p className="text-sm font-medium text-slate-100 leading-tight">{matchLabel}</p>
                {pred.match && (
                  <p className="text-xs text-slate-500">{pred.match.status}</p>
                )}
              </div>

              {/* Probabilities */}
              <span className="text-sm text-slate-300 font-medium min-w-[150px] font-mono text-xs">
                {callSummary}
              </span>

              {/* Confidence */}
              <div className="flex items-center gap-1.5 min-w-[90px]">
                <span className="text-[10px] text-slate-500 uppercase tracking-wide">Conf.</span>
                <ConfidenceBadge value={pred.confidence} />
              </div>

              {/* Status */}
              <div className="min-w-[90px]">
                <PredictionStatusBadge correct={correct} evaluated={evaluated} />
              </div>

              {/* Brier score if available */}
              <span className="text-xs font-mono tabular-nums w-20 text-right text-slate-500">
                {pred.evaluation?.brier_score !== undefined
                  ? `BS: ${pred.evaluation.brier_score.toFixed(3)}`
                  : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── P/L Chart — driven by real monthly segment data ──────────────────────────

const PlCustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const val = payload[0].value as number;
    return (
      <div className="glass-card border border-white/[0.10] px-3 py-2 text-sm">
        <p className="text-slate-400 text-xs mb-1">{label}</p>
        <p className={cn("font-bold tabular-nums", val >= 0.5 ? "text-emerald-400" : "text-amber-400")}>
          Accuracy: {(val * 100).toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

function ProfitabilityChart({
  monthSegments,
  loading,
}: {
  monthSegments: SegmentPerformance[] | undefined;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="glass-card p-6 space-y-4">
        <div className="h-4 w-48 rounded bg-white/[0.06] animate-pulse" />
        <div className="h-72 w-full rounded-xl bg-white/[0.03] animate-pulse" />
      </div>
    );
  }

  if (!monthSegments || monthSegments.length === 0) {
    return (
      <div className="glass-card p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Accuracy Over Time</h2>
          <p className="text-sm text-slate-500 mt-0.5">Monthly model accuracy</p>
        </div>
        <div className="flex h-72 flex-col items-center justify-center gap-3 text-center">
          <Database className="h-8 w-8 text-slate-600" />
          <p className="text-sm font-medium text-slate-500">Not enough data yet</p>
          <p className="text-xs text-slate-600 max-w-xs">
            Monthly accuracy trends will appear here once sufficient prediction data has been
            collected and resolved across multiple months.
          </p>
        </div>
      </div>
    );
  }

  // Use accuracy-over-time from real monthly segments
  const chartData = monthSegments.map((s) => ({
    date: String(s.segment_value),
    accuracy: Number(s.accuracy),
  }));

  return (
    <div className="glass-card p-6 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-100">Accuracy Over Time</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Monthly model accuracy — real data ({monthSegments.length} months)
        </p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={Math.max(0, Math.floor(chartData.length / 6) - 1)}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              width={42}
              domain={[0, 1]}
            />
            <Tooltip content={<PlCustomTooltip />} />
            <Area
              type="monotone"
              dataKey="accuracy"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#accuracyGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Sport Win Rates (real data from segments API) ────────────────────────────

function SportAccuracySection({
  filterParams,
}: {
  filterParams: Record<string, string>;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["trackrecord-segments", "sport", filterParams],
    queryFn: () => api.getTrackrecordSegments("sport", filterParams),
  });

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-4 space-y-3 animate-pulse">
            <div className="h-4 w-24 rounded bg-white/[0.06]" />
            <div className="h-1.5 w-full rounded-full bg-white/[0.06]" />
            <div className="h-5 w-12 rounded bg-white/[0.08]" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
        <Database className="h-4 w-4" />
        No sport breakdown data available yet.
      </div>
    );
  }

  const sportColors: Record<string, string> = {
    football: "#3b82f6",
    soccer: "#3b82f6",
    basketball: "#f59e0b",
    tennis: "#10b981",
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((s) => {
        const sportKey = String(s.segment_value).toLowerCase();
        const color = sportColors[sportKey] ?? "#6366f1";
        const accuracyPct = Number(s.accuracy) * 100;

        return (
          <div key={`${s.segment_key}-${s.segment_value}`} className="glass-card-hover p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-100 capitalize">{String(s.segment_value)}</p>
                <p className="text-xs text-slate-500">{Number(s.total).toLocaleString()} predictions</p>
              </div>
              <span className="text-base font-bold tabular-nums" style={{ color }}>
                {accuracyPct.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, accuracyPct)}%`, background: color }}
              />
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">
              Accuracy (correct predictions)
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrackrecordPage() {
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [sportId, setSportId] = React.useState("all");
  const [leagueId, setLeagueId] = React.useState("all");
  const [activeTab, setActiveTab] = React.useState("performance");

  // Build filter params for API calls
  const filterParams = React.useMemo(() => {
    const p: Record<string, string> = {};
    if (dateFrom) p.date_from = dateFrom;
    if (dateTo) p.date_to = dateTo;
    if (sportId !== "all") p.sport_id = sportId;
    if (leagueId !== "all") p.league_id = leagueId;
    return p;
  }, [dateFrom, dateTo, sportId, leagueId]);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["trackrecord-summary", filterParams],
    queryFn: () => api.getTrackrecordSummary(filterParams),
  });

  const { data: monthSegments, isLoading: monthLoading } = useQuery({
    queryKey: ["trackrecord-segments", "month", filterParams],
    queryFn: () => api.getTrackrecordSegments("month", filterParams),
  });

  const { data: calibrationData, isLoading: calibrationLoading } = useQuery({
    queryKey: ["trackrecord-calibration", filterParams],
    queryFn: () => api.getCalibration(filterParams),
  });

  const { data: sports } = useQuery<Sport[]>({
    queryKey: ["sports"],
    queryFn: () => api.getSports(),
  });

  const { data: leagues } = useQuery<League[]>({
    queryKey: ["leagues", sportId],
    queryFn: () => api.getLeagues(sportId !== "all" ? sportId : undefined),
  });

  // Transform monthly segments to RollingAccuracyChart format
  const rollingData: RollingAccuracyPoint[] = React.useMemo(
    () =>
      (monthSegments ?? []).map((s: SegmentPerformance) => ({
        date: s.segment_value,
        accuracy: s.accuracy,
      })),
    [monthSegments]
  );

  // Transform calibration buckets to CalibrationChart format
  const calibrationPoints: CalibrationPoint[] = React.useMemo(
    () =>
      (calibrationData ?? []).map((b: CalibrationBucket) => ({
        predicted: b.predicted_prob,
        actual: b.actual_freq,
        count: b.count,
      })),
    [calibrationData]
  );

  const tabs = [
    { key: "performance", label: "Performance", icon: TrendingUp },
    { key: "calibration", label: "Calibration", icon: Activity },
    { key: "segments", label: "Segments", icon: Layers },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="gradient-text">Track Record</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Historical model performance, calibration, and segment analysis
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse-slow inline-block" />
          Real API data
        </span>
      </div>

      {/* 1. Live Performance Banner — real data only */}
      <LivePerformanceBanner summary={summary} loading={summaryLoading} />

      {/* KPI row — real data */}
      {summaryLoading ? (
        <KpiSkeletons />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 animate-slide-up">
          <KpiCard
            title="Total Predictions"
            value={summary?.total_predictions.toLocaleString() ?? "—"}
            icon={Target}
            accent="blue"
          />
          <KpiCard
            title="Accuracy"
            value={summary ? formatPercent(summary.accuracy) : "—"}
            icon={TrendingUp}
            accent="green"
          />
          <KpiCard
            title="Brier Score"
            value={summary ? summary.brier_score.toFixed(3) : "—"}
            icon={BarChart3}
            accent="blue"
          />
          <KpiCard
            title="Log Loss"
            value={summary ? summary.log_loss.toFixed(3) : "—"}
            icon={BarChart3}
            accent="amber"
          />
          <KpiCard
            title="Calibration Error"
            value={summary ? summary.calibration_error.toFixed(3) : "—"}
            icon={Target}
            accent="blue"
          />
        </div>
      )}

      {/* No-data notice when system is new */}
      {!summaryLoading && (!summary || summary.total_predictions === 0) && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-5">
          <AlertTriangle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-blue-400">No prediction data yet</p>
            <p className="text-xs leading-relaxed text-slate-400">
              The system has not yet generated or evaluated any predictions. KPI cards, charts, and
              tables below will populate automatically as the model runs and match outcomes are
              recorded. Check back after the first batch of predictions has been processed.
            </p>
          </div>
        </div>
      )}

      {/* 2. Recent Predictions Feed — real API data */}
      <RecentPredictionsFeed />

      {/* Filter bar */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Date From */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 whitespace-nowrap">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={cn(
                  "h-8 w-36 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-slate-200",
                  "placeholder:text-slate-500",
                  "focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.06]",
                  "transition-colors [color-scheme:dark]"
                )}
              />
            </div>

            {/* Date To */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 whitespace-nowrap">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={cn(
                  "h-8 w-36 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-slate-200",
                  "placeholder:text-slate-500",
                  "focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.06]",
                  "transition-colors [color-scheme:dark]"
                )}
              />
            </div>

            {/* Sport select */}
            <Select value={sportId} onValueChange={(v) => { setSportId(v); setLeagueId("all"); }}>
              <SelectTrigger className="h-8 w-40 text-sm border-white/[0.08] bg-white/[0.04] text-slate-200 focus:border-blue-500/50">
                <SelectValue placeholder="All Sports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {(sports ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* League select */}
            <Select value={leagueId} onValueChange={setLeagueId}>
              <SelectTrigger className="h-8 w-48 text-sm border-white/[0.08] bg-white/[0.04] text-slate-200 focus:border-blue-500/50">
                <SelectValue placeholder="All Leagues" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leagues</SelectItem>
                {(leagues ?? []).map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tab pills */}
      <div className="flex gap-2">
        {tabs.map(({ key, label, icon }) => (
          <TabPill
            key={key}
            label={label}
            icon={icon}
            active={activeTab === key}
            onClick={() => setActiveTab(key)}
          />
        ))}
      </div>

      {/* ── Performance Tab ── */}
      {activeTab === "performance" && (
        <div className="space-y-6 animate-slide-up">
          {/* Accuracy over time — real data from monthSegments */}
          <ProfitabilityChart monthSegments={monthSegments} loading={monthLoading} />

          {/* Accuracy by sport — real data */}
          <div className="glass-card p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-100">Accuracy by Sport</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Prediction accuracy broken down by sport — real data
              </p>
            </div>
            <SportAccuracySection filterParams={filterParams} />
          </div>

          {/* Rolling accuracy chart */}
          <div className="glass-card p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-100">Accuracy Trend</h2>
              <p className="text-sm text-slate-500 mt-0.5">Monthly rolling accuracy over the selected period</p>
            </div>
            {monthLoading ? (
              <div className="h-72 w-full rounded-xl bg-white/[0.03] animate-pulse" />
            ) : rollingData.length === 0 ? (
              <div className="flex h-72 items-center justify-center text-sm text-slate-500">
                No monthly data available for the selected filters.
              </div>
            ) : (
              <RollingAccuracyChart
                data={rollingData}
                title=""
                windowLabel="Monthly Accuracy"
                showBaseline={false}
                targetAccuracy={0.6}
              />
            )}
          </div>

          {/* Summary stats */}
          <div className="glass-card p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-100">Summary Statistics</h2>
              <p className="text-sm text-slate-500 mt-0.5">Aggregate metrics for the selected period and filters</p>
            </div>
            {summaryLoading ? (
              <div className="space-y-1.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-9 w-full rounded-lg bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : !summary ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No summary data available.
              </p>
            ) : (
              <SummaryStatsTable summary={summary} />
            )}
          </div>
        </div>
      )}

      {/* ── Calibration Tab ── */}
      {activeTab === "calibration" && (
        <div className="space-y-6 animate-slide-up">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Chart */}
            <div className="glass-card p-6 lg:col-span-2">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-slate-100">Calibration Chart</h2>
                <p className="text-sm text-slate-500 mt-0.5">Predicted probability vs. actual frequency</p>
              </div>
              {calibrationLoading ? (
                <div className="h-80 w-full rounded-xl bg-white/[0.03] animate-pulse" />
              ) : calibrationPoints.length === 0 ? (
                <div className="flex h-80 items-center justify-center text-sm text-slate-500">
                  No calibration data available for the selected filters.
                </div>
              ) : (
                <CalibrationChart
                  data={calibrationPoints}
                  title=""
                  className="pt-2"
                />
              )}
            </div>

            {/* Explanation panel */}
            <div className="glass-card border border-blue-500/[0.12] p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-100">What is Calibration?</h2>
              <p className="text-sm text-slate-400">
                A perfectly calibrated model is one where, among all predictions
                assigned probability{" "}
                <span className="font-semibold text-slate-200">p</span>, exactly{" "}
                <span className="font-semibold text-slate-200">p × 100%</span> of events
                actually occur.
              </p>
              <p className="text-sm text-slate-400">
                The diagonal dashed line represents perfect calibration. Points{" "}
                <span className="text-amber-400 font-medium">above</span> the line mean the
                model is under-confident; points{" "}
                <span className="text-red-400 font-medium">below</span> mean the model is
                over-confident.
              </p>

              {/* Key metrics box */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Key Metrics
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">ECE</span>
                  <span className="font-mono font-semibold text-slate-100">
                    {summary ? summary.calibration_error.toFixed(4) : "—"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Lower is better. Values near 0 indicate excellent calibration.
                </p>
              </div>

              <p className="text-xs text-slate-500">
                Calibration is measured using equal-width probability buckets. Each point in
                the scatter represents one bucket of predictions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Segments Tab ── */}
      {activeTab === "segments" && (
        <div className="space-y-6 animate-slide-up">
          {/* By Sport */}
          <div className="glass-card p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-100">Performance by Sport</h2>
              <p className="text-sm text-slate-500 mt-0.5">Prediction accuracy broken down by sport</p>
            </div>
            <SegmentSection title="Sport" groupBy="sport" filterParams={filterParams} />
          </div>

          {/* By League */}
          <div className="glass-card p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-100">Performance by League</h2>
              <p className="text-sm text-slate-500 mt-0.5">Prediction accuracy broken down by league</p>
            </div>
            <SegmentSection title="League" groupBy="league" filterParams={filterParams} />
          </div>

          {/* By Confidence Bucket */}
          <div className="glass-card p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-100">Performance by Confidence Bucket</h2>
              <p className="text-sm text-slate-500 mt-0.5">How accuracy varies across model confidence levels</p>
            </div>
            <SegmentSection
              title="Confidence Bucket"
              groupBy="confidence_bucket"
              filterParams={filterParams}
            />
          </div>
        </div>
      )}
    </div>
  );
}
