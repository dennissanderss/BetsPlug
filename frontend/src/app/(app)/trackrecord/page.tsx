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
  Cpu,
  Sparkles,
  Download,
  Star,
  Calendar,
  Trophy,
  FlaskConical,
} from "lucide-react";
import Link from "next/link";
import { RelatedLinks } from "@/components/ui/related-links";
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
import { useTranslations } from "@/i18n/locale-provider";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import type {
  TrackrecordSummary,
  SegmentPerformance,
  Prediction,
  Sport,
  League,
  ModelOverview,
} from "@/types/api";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
// CalibrationChart removed — too technical for user-facing page
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
  subtitle?: string;
  icon: React.ElementType;
  accent?: "blue" | "green" | "amber" | "red" | "gold";
  highlight?: boolean;
}

function KpiCard({ title, value, subtitle, icon: Icon, accent = "blue", highlight = false }: KpiCardProps) {
  const accentMap = {
    blue: { icon: "text-blue-400", bg: "bg-blue-500/10", ring: "ring-blue-500/20" },
    green: { icon: "text-emerald-400", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20" },
    amber: { icon: "text-amber-400", bg: "bg-amber-500/10", ring: "ring-amber-500/20" },
    red: { icon: "text-red-400", bg: "bg-red-500/10", ring: "ring-red-500/20" },
    gold: { icon: "text-yellow-400", bg: "bg-yellow-500/10", ring: "ring-yellow-500/20" },
  };
  const a = accentMap[accent];

  return (
    <div className={cn(
      "glass-card-hover p-5 space-y-3",
      highlight && "ring-1 ring-yellow-500/30 border-yellow-500/20"
    )}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{title}</p>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg ring-1", a.bg, a.ring)}>
          <Icon className={cn("h-4 w-4", a.icon)} />
        </div>
      </div>
      <p className="text-2xl font-bold gradient-text tabular-nums">{value}</p>
      {subtitle && (
        <p className="text-[11px] text-slate-500 leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}

// ─── KPI skeletons ────────────────────────────────────────────────────────────

function KpiSkeletons() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
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

// v6.1: small helper so every `.toFixed` call in the trackrecord
// page is null-safe. The backend returns `null` for log_loss /
// calibration_error when there isn't enough data yet; the old code
// crashed the whole page with "Cannot read properties of null
// (reading 'toFixed')".
function fmt(n: number | null | undefined, digits: number): string {
  if (n == null || Number.isNaN(n)) return " - ";
  return n.toFixed(digits);
}

function SummaryStatsTable({ summary }: { summary: TrackrecordSummary }) {
  const { t } = useTranslations();
  const rows: StatRow[] = [
    { label: t("trackrecord.periodStart"), value: summary.period_start ? formatDate(summary.period_start) : " - " },
    { label: t("trackrecord.periodEnd"), value: summary.period_end ? formatDate(summary.period_end) : " - " },
    { label: t("trackrecord.totalPredictions"), value: summary.total_predictions.toLocaleString() },
    { label: t("trackrecord.accuracy"), value: formatPercent(summary.accuracy) },
    { label: t("trackrecord.brierScore"), value: fmt(summary.brier_score, 4) },
    { label: t("trackrecord.logLoss"), value: fmt(summary.log_loss, 4) },
    { label: t("trackrecord.calibrationErrorECE"), value: fmt(summary.calibration_error, 4) },
    { label: t("trackrecord.avgConfidence"), value: formatPercent(summary.avg_confidence) },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.03]">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("trackrecord.metric")}
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("trackrecord.value")}
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
  const { t } = useTranslations();
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
              {t("trackrecord.segment")}
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("trackrecord.total")}
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("trackrecord.accuracy")}
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("trackrecord.brierScore")}
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t("trackrecord.avgConfidence")}
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
                {fmt(
                  row.brier_score == null ? null : Number(row.brier_score),
                  3
                )}
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
  const { t } = useTranslations();
  const { data, isLoading } = useQuery({
    queryKey: ["trackrecord-segments", groupBy, filterParams],
    queryFn: () => api.getTrackrecordSegments(groupBy, filterParams),
  });

  return (
    <div className="space-y-3">
      <SegmentTable
        data={data ?? []}
        loading={isLoading}
        emptyMessage={t("trackrecord.noSegmentData").replace("{segment}", title.toLowerCase())}
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
  const { t } = useTranslations();
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
            <h2 className="text-sm font-semibold text-slate-400">{t("trackrecord.noPredictionsYet")}</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {t("trackrecord.noPredictionsYetDesc")}
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
            <h2 className="text-sm font-semibold text-slate-100">{t("trackrecord.realModelPerformance")}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{t("trackrecord.liveDataFromDb")}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">{t("trackrecord.predictions")}</p>
            <p className="text-sm font-bold text-slate-100 tabular-nums">
              {summary.total_predictions.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">{t("trackrecord.accuracy")}</p>
            <p className="text-sm font-bold text-emerald-400 tabular-nums">
              {(summary.accuracy * 100).toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">{t("trackrecord.brierScore")}</p>
            <p className="text-sm font-bold text-blue-400 tabular-nums">
              {fmt(summary.brier_score, 3)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">{t("trackrecord.avgConfidence")}</p>
            <p className="text-sm font-bold text-slate-100 tabular-nums">
              {(summary.avg_confidence * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-slate-500 border-t border-white/[0.04] pt-2">
        {t("trackrecord.disclaimer")}
      </p>
    </div>
  );
}

// ─── Prediction status badges ─────────────────────────────────────────────────

function PredictionStatusBadge({ correct, evaluated }: { correct: boolean | null; evaluated: boolean }) {
  const { t } = useTranslations();
  if (!evaluated) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse-slow inline-block" />
        <Clock className="h-3 w-3" />
        {t("trackrecord.pending")}
      </span>
    );
  }
  if (correct) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="h-3 w-3" />
        {t("trackrecord.correct")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
      <XCircle className="h-3 w-3" />
      {t("trackrecord.incorrect")}
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

// ─── Models Overview Panel (v6.2 transparency) ───────────────────────────────
//
// Shows which models are currently powering predictions on the platform.
// Keeps the payload light — only public fields are rendered, raw
// hyperparameter VALUES stay server-side (only the keys are shown).

const MODEL_TYPE_ICON: Record<string, React.ElementType> = {
  elo: Activity,
  poisson: BarChart3,
  logistic: TrendingUp,
  ensemble: Sparkles,
};

function ModelsOverviewPanel() {
  const { data: models, isLoading } = useQuery({
    queryKey: ["models-overview"],
    queryFn: () => api.getModels(true),
    staleTime: 5 * 60 * 1000, // 5 min — cached server-side too
  });

  if (isLoading) {
    return (
      <div className="glass-card p-6 space-y-4 animate-slide-up">
        <div className="h-4 w-48 rounded bg-white/[0.06] animate-pulse" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 w-full rounded-xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const list: ModelOverview[] = models ?? [];
  if (list.length === 0) return null;

  return (
    <div className="glass-card p-6 space-y-4 animate-slide-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-blue-400" />
            Active Models
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {list.length} model{list.length !== 1 ? "s" : ""} currently powering predictions on the platform
          </p>
        </div>
        <Link
          href="/about#methodology"
          className="text-[11px] text-blue-400 hover:text-blue-300 underline-offset-2 hover:underline"
        >
          How these models work →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {list.map((m) => {
          const Icon = MODEL_TYPE_ICON[m.model_type] ?? Cpu;
          return (
            <div
              key={m.id}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2 hover:border-blue-500/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20">
                    <Icon className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100 truncate">
                      {m.name}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                      v{m.version} · {m.model_type}
                    </p>
                  </div>
                </div>
                {m.is_active && (
                  <span className="shrink-0 inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400 uppercase tracking-wider">
                    Active
                  </span>
                )}
              </div>

              {m.description && (
                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                  {m.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.04]">
                <div>
                  <p className="text-[9px] text-slate-600 uppercase tracking-wider">Accuracy</p>
                  <p className="text-sm font-bold tabular-nums text-slate-100">
                    {m.accuracy != null ? `${(m.accuracy * 100).toFixed(1)}%` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-600 uppercase tracking-wider">Brier</p>
                  <p className="text-sm font-bold tabular-nums text-slate-100">
                    {m.brier_score != null ? m.brier_score.toFixed(3) : "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-600 pt-1">
                <span>
                  {m.sample_size != null ? `${m.sample_size.toLocaleString()} samples` : ""}
                </span>
                <span>
                  Trained {new Date(m.trained_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Data Transparency Card (v6.2.1) ─────────────────────────────────────────
//
// Replaces the earlier "Hoe interpreteer ik deze cijfers?" banner. Dennis
// asked for REAL data transparency — not an explanation of Brier scores,
// but a way for users to see exactly WHICH predictions the trackrecord is
// computed on, and to download the full dataset themselves. This card
// shows the live count + period coverage and offers a CSV download.

function DataTransparencyCard({
  summary,
  loading,
}: {
  summary: TrackrecordSummary | undefined;
  loading: boolean;
}) {
  const total = summary?.total_predictions ?? null;
  const periodStart = summary?.period_start ? new Date(summary.period_start) : null;
  const periodEnd = summary?.period_end ? new Date(summary.period_end) : null;
  const fmtDate = (d: Date | null) =>
    d
      ? d.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })
      : "—";

  const exportUrl = api.getTrackrecordExportUrl();

  return (
    <div className="glass-card p-5 sm:p-6 animate-slide-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: live counts */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20">
            <Database className="h-5 w-5 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-semibold text-slate-100">
                BetsPlug Pulse — Track Record
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Our accuracy on 3-way predictions (home / draw / away) is
              competitive — predicting football is one of the hardest
              challenges in sports analytics. Even the best models in the
              world hover around 50% on three-outcome markets. What matters
              more is <strong className="text-slate-200">how we pick</strong>: our{" "}
              <strong className="text-yellow-400">Pick of the Day</strong> selects
              only the highest-confidence match, achieving significantly
              higher accuracy.
            </p>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              All figures are calculated on{" "}
              <strong className="tabular-nums text-slate-200">
                {loading || total == null ? "..." : total.toLocaleString("nl-NL")}
              </strong>{" "}
              evaluated predictions from{" "}
              <strong className="text-slate-200">
                {fmtDate(periodStart)} – {fmtDate(periodEnd)}
              </strong>
              . The track record updates automatically as matches finish
              — no manual intervention needed.
            </p>
            <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
              Want to verify the numbers yourself? Download the full dataset as CSV.{" "}
              <Link
                href="/about#methodology"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
              >
                How the model works →
              </Link>
            </p>
          </div>
        </div>

        {/* Right: download button */}
        <div className="flex shrink-0 sm:ml-4">
          <a
            href={exportUrl}
            download
            className="inline-flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-200 hover:bg-blue-500/20 hover:border-blue-500/50 transition-colors"
            aria-label="Download alle voorspellingen als CSV"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Recent Predictions Feed (real data) ──────────────────────────────────────

function RecentPredictionsFeed() {
  const { t } = useTranslations();
  const { data: response, isLoading } = useQuery({
    queryKey: ["predictions-recent"],
    queryFn: () => api.getPredictions({ limit: "15" }),
  });

  const predictions: Prediction[] = response?.items ?? [];
  const pendingCount = predictions.filter((p) => !p.evaluation).length;

  // v6.2: click-to-expand for transparency ("Why this pick")
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

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
            <h2 className="text-base font-semibold text-slate-100">{t("trackrecord.recentPredictions")}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{t("trackrecord.last15ModelCalls")}</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <Database className="h-8 w-8 text-slate-600" />
          <p className="text-sm font-medium text-slate-500">{t("trackrecord.noPredictionsYet")}</p>
          <p className="text-xs text-slate-600 max-w-sm">
            {t("trackrecord.noPredictionsEmptyDesc")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-100">{t("trackrecord.recentPredictionsResults")}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {t("trackrecord.lastNModelCalls").replace("{n}", String(predictions.length))}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <Zap className="h-3 w-3 text-amber-400" />
          {pendingCount} {t("trackrecord.pending")}
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

          const homeTeam = pred.match?.home_team_name ?? " - ";
          const awayTeam = pred.match?.away_team_name ?? " - ";
          const matchLabel = pred.match ? `${homeTeam} ${t("trackrecord.vs")} ${awayTeam}` : `${t("trackrecord.match")} ${pred.match_id}`;
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

          const isExpanded = expandedId === pred.id;
          const modelLabel = pred.model_info ? `${pred.model_info.name} ${pred.model_info.version}` : null;
          const reasoning = pred.reasoning ?? pred.explanation?.summary ?? null;

          const factorsFor = pred.explanation?.top_factors_for
            ? Object.entries(pred.explanation.top_factors_for as Record<string, number>)
                .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                .slice(0, 3)
            : [];
          const factorsAgainst = pred.explanation?.top_factors_against
            ? Object.entries(pred.explanation.top_factors_against as Record<string, number>)
                .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                .slice(0, 3)
            : [];

          return (
            <div
              key={pred.id}
              className="glass-card-hover overflow-hidden"
              style={{ borderLeft: `3px solid ${borderColor}` }}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : pred.id)}
                className="w-full px-4 py-3 flex flex-wrap items-center gap-3 text-left"
                aria-expanded={isExpanded}
                aria-label={`${matchLabel} — klik voor details`}
              >
                {/* Time */}
                <span className="text-xs text-slate-500 w-28 shrink-0">{scheduledAt}</span>

                {/* Match */}
                <div className="flex-1 min-w-[180px]">
                  <p className="text-sm font-medium text-slate-100 leading-tight">{matchLabel}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {pred.match && (
                      <p className="text-[10px] text-slate-500">{pred.match.status}</p>
                    )}
                    {modelLabel && (
                      <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-300 uppercase tracking-wide">
                        {modelLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Probabilities */}
                <span className="text-slate-300 font-medium min-w-[150px] font-mono text-xs">
                  {callSummary}
                </span>

                {/* Confidence */}
                <div className="flex items-center gap-1.5 min-w-[90px]">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide">{t("trackrecord.conf")}</span>
                  <ConfidenceBadge value={pred.confidence} />
                </div>

                {/* Status */}
                <div className="min-w-[90px]">
                  <PredictionStatusBadge correct={correct} evaluated={evaluated} />
                </div>

                {/* Prediction quality score */}
                <span className="text-xs font-mono tabular-nums w-20 text-right text-slate-500">
                  {pred.evaluation?.brier_score != null
                    ? `PQ: ${fmt(pred.evaluation.brier_score, 3)}`
                    : " - "}
                </span>
              </button>

              {/* v6.2: Expanded "Why this pick" panel */}
              {isExpanded && (
                <div className="border-t border-white/[0.05] bg-white/[0.015] px-4 py-4 space-y-3 animate-fade-in">
                  {/* Probability bars */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      Win probabilities
                    </p>
                    {[
                      { label: "Home", value: pred.home_win_prob, color: "#3b82f6" },
                      ...(pred.draw_prob != null
                        ? [{ label: "Draw", value: pred.draw_prob, color: "#f59e0b" }]
                        : []),
                      { label: "Away", value: pred.away_win_prob, color: "#ef4444" },
                    ].map((p) => (
                      <div key={p.label} className="flex items-center gap-2 text-xs">
                        <span className="w-12 text-slate-400">{p.label}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${(p.value ?? 0) * 100}%`, background: p.color }}
                          />
                        </div>
                        <span className="w-12 text-right tabular-nums text-slate-300 font-medium">
                          {((p.value ?? 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Reasoning */}
                  {reasoning && (
                    <div className="rounded-md border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
                        Model reasoning
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">{reasoning}</p>
                    </div>
                  )}

                  {/* Top factors for / against */}
                  {(factorsFor.length > 0 || factorsAgainst.length > 0) && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {factorsFor.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400 mb-1.5">
                            Supporting factors
                          </p>
                          <ul className="space-y-1">
                            {factorsFor.map(([feature, weight]) => (
                              <li
                                key={`for-${feature}`}
                                className="flex items-center justify-between text-[11px] text-slate-300"
                              >
                                <span className="capitalize truncate">
                                  {feature.replace(/_/g, " ")}
                                </span>
                                <span className="font-mono tabular-nums text-emerald-400 ml-2 shrink-0">
                                  +{(Math.abs(weight) * 100).toFixed(0)}%
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {factorsAgainst.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-red-400 mb-1.5">
                            Opposing factors
                          </p>
                          <ul className="space-y-1">
                            {factorsAgainst.map(([feature, weight]) => (
                              <li
                                key={`against-${feature}`}
                                className="flex items-center justify-between text-[11px] text-slate-300"
                              >
                                <span className="capitalize truncate">
                                  {feature.replace(/_/g, " ")}
                                </span>
                                <span className="font-mono tabular-nums text-red-400 ml-2 shrink-0">
                                  -{(Math.abs(weight) * 100).toFixed(0)}%
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fallback when nothing is populated */}
                  {!reasoning && factorsFor.length === 0 && factorsAgainst.length === 0 && (
                    <p className="text-xs text-slate-500 italic text-center py-2">
                      Geen expliciete verklaring beschikbaar voor deze pick.
                    </p>
                  )}
                </div>
              )}
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
  const { t } = useTranslations();
  if (active && payload && payload.length) {
    const val = payload[0].value as number;
    return (
      <div className="glass-card border border-white/[0.10] px-3 py-2 text-sm">
        <p className="text-slate-400 text-xs mb-1">{label}</p>
        <p className={cn("font-bold tabular-nums", val >= 0.5 ? "text-emerald-400" : "text-amber-400")}>
          {t("trackrecord.accuracy")}: {(val * 100).toFixed(1)}%
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
  const { t } = useTranslations();
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
          <h2 className="text-base font-semibold text-slate-100">{t("trackrecord.accuracyOverTime")}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t("trackrecord.monthlyModelAccuracy")}</p>
        </div>
        <div className="flex h-72 flex-col items-center justify-center gap-3 text-center">
          <Database className="h-8 w-8 text-slate-600" />
          <p className="text-sm font-medium text-slate-500">{t("trackrecord.notEnoughData")}</p>
          <p className="text-xs text-slate-600 max-w-xs">
            {t("trackrecord.notEnoughDataDesc")}
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
        <h2 className="text-base font-semibold text-slate-100">{t("trackrecord.accuracyOverTime")}</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {t("trackrecord.monthlyModelAccuracyReal").replace("{n}", String(monthSegments.length))}
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
  const { t } = useTranslations();
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
        {t("trackrecord.noLeagueBreakdownData")}
      </div>
    );
  }

  const sportColors: Record<string, string> = {
    football: "#3b82f6",
    soccer: "#3b82f6",
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
                <p className="text-xs text-slate-500">{Number(s.total).toLocaleString()} {t("trackrecord.predictions")}</p>
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
              {t("trackrecord.accuracyCorrectPredictions")}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrackrecordPage() {
  const { t } = useTranslations();
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

  const { data: sports } = useQuery<Sport[]>({
    queryKey: ["sports"],
    queryFn: () => api.getSports(),
  });

  const { data: leagues } = useQuery<League[]>({
    queryKey: ["leagues", sportId],
    queryFn: () => api.getLeagues(sportId !== "all" ? sportId : undefined),
  });

  // BOTD (Pick of the Day) track record — hero stat
  const { data: botdStats } = useQuery({
    queryKey: ["botd-track-record-trackrecord"],
    queryFn: async () => {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const resp = await fetch(`${API}/bet-of-the-day/track-record`);
      if (!resp.ok) return null;
      return resp.json() as Promise<{
        accuracy_pct: number;
        total_picks: number;
        correct: number;
        current_streak: number;
        avg_confidence: number;
      }>;
    },
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

  const tabs = [
    { key: "performance", label: t("trackrecord.performance"), icon: TrendingUp },
    { key: "segments", label: t("trackrecord.segments"), icon: Layers },
  ];

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8 animate-fade-in">
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-emerald-500/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-40 -right-24 h-[360px] w-[360px] rounded-full bg-blue-500/10 blur-3xl" />
      <div className="relative space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <HexBadge variant="green" size="lg">
            <TrendingUp className="h-6 w-6" />
          </HexBadge>
          <div>
            <span className="section-label">Track record</span>
            <h1 className="text-heading mt-3 gradient-text-green">
              {t("trackrecord.title")}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {t("trackrecord.subtitle")}
            </p>
          </div>
        </div>
        <Pill tone="info" className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse-slow inline-block" />
          {t("trackrecord.realApiData")}
        </Pill>
      </div>

      {/* v6.2.1: Data transparency card (replaces the old methodology banner) */}
      <DataTransparencyCard summary={summary} loading={summaryLoading} />

      {/* 1. Live Performance Banner — real data only */}
      <LivePerformanceBanner summary={summary} loading={summaryLoading} />

      {/* KPI row — simplified, user-friendly */}
      {summaryLoading ? (
        <KpiSkeletons />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-slide-up">
          <KpiCard
            title="Total Predictions"
            value={summary?.total_predictions.toLocaleString() ?? " - "}
            subtitle="Verified match predictions"
            icon={Target}
            accent="blue"
          />
          <KpiCard
            title="Accuracy"
            value={summary ? formatPercent(summary.accuracy) : " - "}
            subtitle="On all 3-way predictions"
            icon={TrendingUp}
            accent="green"
          />
          <KpiCard
            title="Pick of the Day"
            value={botdStats ? `${botdStats.accuracy_pct}%` : " - "}
            subtitle={botdStats ? `${botdStats.total_picks} picks, ${botdStats.correct} correct` : "Loading..."}
            icon={Star}
            accent="gold"
            highlight
          />
          <KpiCard
            title="Matches Analysed"
            value={summary?.period_start ? "Aug 2024 - Present" : " - "}
            subtitle="Continuous AI analysis every matchday"
            icon={Calendar}
            accent="blue"
          />
        </div>
      )}

      {/* BOTD Highlight Section — hero USP */}
      {botdStats && botdStats.total_picks > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-r from-yellow-500/[0.08] via-amber-500/[0.05] to-transparent p-6 sm:p-8 animate-slide-up">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-500/15 ring-1 ring-yellow-500/30">
              <Trophy className="h-7 w-7 text-yellow-400" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
                  Pick of the Day:{" "}
                  <span className="text-yellow-400">{botdStats.accuracy_pct}% accuracy</span>
                </h2>
                {botdStats.current_streak > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                    <Zap className="h-3 w-3" />
                    {botdStats.current_streak} streak
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
                {botdStats.correct} correct out of {botdStats.total_picks} picks.
                Every day, our AI selects the single match it is most confident about.
                High-confidence picks only — that is our edge.
              </p>
            </div>
            <Link
              href="/bet-of-the-day"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-yellow-500/15 border border-yellow-500/30 px-5 py-2.5 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/25 hover:border-yellow-500/40 transition-colors"
            >
              <Star className="h-4 w-4" />
              View Today&apos;s Pick
            </Link>
          </div>
        </div>
      )}

      {/* No-data notice when system is new */}
      {!summaryLoading && (!summary || summary.total_predictions === 0) && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-5">
          <AlertTriangle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-blue-400">{t("trackrecord.noPredictionDataYet")}</p>
            <p className="text-xs leading-relaxed text-slate-400">
              {t("trackrecord.noPredictionDataYetDesc")}
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
            <span className="text-sm font-medium">{t("trackrecord.filters")}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Date From */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 whitespace-nowrap">{t("trackrecord.from")}</label>
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
              <label className="text-xs text-slate-500 whitespace-nowrap">{t("trackrecord.to")}</label>
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
                <SelectValue placeholder={t("trackrecord.allLeagues")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("trackrecord.allLeagues")}</SelectItem>
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
                <SelectValue placeholder={t("trackrecord.allLeagues")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("trackrecord.allLeagues")}</SelectItem>
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

          {/* Accuracy by league — real data */}
          <div className="glass-card p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-100">{t("trackrecord.accuracyByLeague")}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {t("trackrecord.accuracyByLeagueDesc")}
              </p>
            </div>
            <SportAccuracySection filterParams={filterParams} />
          </div>

          {/* Rolling accuracy chart */}
          <div className="glass-card p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-100">{t("trackrecord.accuracyTrend")}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{t("trackrecord.accuracyTrendDesc")}</p>
            </div>
            {monthLoading ? (
              <div className="h-72 w-full rounded-xl bg-white/[0.03] animate-pulse" />
            ) : rollingData.length === 0 ? (
              <div className="flex h-72 items-center justify-center text-sm text-slate-500">
                {t("trackrecord.noMonthlyData")}
              </div>
            ) : (
              <RollingAccuracyChart
                data={rollingData}
                title=""
                windowLabel={t("trackrecord.monthlyAccuracy")}
                showBaseline={false}
                targetAccuracy={0.6}
              />
            )}
          </div>

          {/* Summary stats */}
          <div className="glass-card p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-100">{t("trackrecord.summaryStatistics")}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{t("trackrecord.summaryStatisticsDesc")}</p>
            </div>
            {summaryLoading ? (
              <div className="space-y-1.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-9 w-full rounded-lg bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : !summary ? (
              <p className="py-8 text-center text-sm text-slate-500">
                {t("trackrecord.noSummaryData")}
              </p>
            ) : (
              <SummaryStatsTable summary={summary} />
            )}
          </div>
        </div>
      )}

      {/* ── Segments Tab ── */}
      {activeTab === "segments" && (
        <div className="space-y-6 animate-slide-up">
          {/* By League */}
          <div className="glass-card p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-100">{t("trackrecord.performanceByLeague")}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{t("trackrecord.performanceByLeagueDesc")}</p>
            </div>
            <SegmentSection title={t("trackrecord.league")} groupBy="sport" filterParams={filterParams} />
          </div>

          {/* By League */}
          <div className="glass-card p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-100">{t("trackrecord.performanceByLeague")}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{t("trackrecord.performanceByLeagueDesc")}</p>
            </div>
            <SegmentSection title={t("trackrecord.league")} groupBy="league" filterParams={filterParams} />
          </div>

          {/* By Confidence Bucket */}
          <div className="glass-card p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-100">{t("trackrecord.performanceByConfidence")}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{t("trackrecord.performanceByConfidenceDesc")}</p>
            </div>
            <SegmentSection
              title={t("trackrecord.confidenceBucket")}
              groupBy="confidence_bucket"
              filterParams={filterParams}
            />
          </div>

          {/* CSV Export */}
          <div className="glass-card p-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">{t("trackrecord.exportTitle")}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t("trackrecord.exportDesc")}</p>
            </div>
            <a
              href={api.getTrackrecordExportUrl()}
              download
              className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20"
            >
              <Download className="h-4 w-4" />
              {t("trackrecord.exportCta")}
            </a>
          </div>

          {/* Related pages */}
          <RelatedLinks
            title={t("related.title")}
            links={[
              { label: t("related.strategyLab"), href: "/strategy", description: t("related.strategyLabDesc"), icon: FlaskConical },
              { label: t("related.results"), href: "/results", description: t("related.resultsDesc"), icon: Trophy },
              { label: t("related.predictions"), href: "/predictions", description: t("related.predictionsDesc"), icon: Sparkles },
            ]}
          />
        </div>
      )}
      </div>
    </div>
  );
}
