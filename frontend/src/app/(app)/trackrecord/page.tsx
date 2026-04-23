"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Target,
  TrendingUp,
  BarChart3,
  Filter,
  Activity,
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
import { TrustFunnel } from "@/components/ui/trust-funnel";
import { BotdTrackRecordSection } from "@/components/ui/botd-track-record-section";
import { BotdLiveTrackingSection } from "@/components/ui/botd-live-tracking-section";
import { LiveMeasurementSection } from "@/components/ui/live-measurement-section";
import { AccuracyPlusPreview } from "@/components/noct/accuracy-plus-preview";
import { Pill } from "@/components/noct/pill";
import { PickTierBadge } from "@/components/noct/pick-tier-badge";
import type { PickTierSlug } from "@/types/api";
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

// ─── Per-tier breakdown (v8.1) ───────────────────────────────────────────────

/** Shield-row breakdown of accuracy per pick_tier — renders below the
 * SummaryStatsTable when the backend returned per_tier data. */
function PerTierBreakdownTable({ summary }: { summary: TrackrecordSummary }) {
  const perTier = summary.per_tier;
  if (!perTier || Object.keys(perTier).length === 0) {
    return null;
  }

  // Fixed display order (highest tier first)
  const ORDER: PickTierSlug[] = ["platinum", "gold", "silver", "free"];

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06]">
      <div className="border-b border-white/[0.06] bg-white/[0.03] px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-100">
          Accuracy per pick-tier
        </h3>
        <p className="text-xs text-slate-500">
          How each quality tier performed historically. Higher tier = more selective,
          higher accuracy.
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.02]">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tier
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Correct
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Accuracy
            </th>
          </tr>
        </thead>
        <tbody>
          {ORDER.map((slug, idx) => {
            const row = perTier[slug];
            if (!row) return null;
            return (
              <tr
                key={slug}
                className={cn(
                  "border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.03]",
                  idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]",
                )}
              >
                <td className="px-4 py-3">
                  <PickTierBadge tier={slug} size="sm" showAccuracy={false} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-400">
                  {Number(row.total).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-400">
                  {Number(row.correct).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {accuracyCell(Number(row.accuracy))}
                </td>
              </tr>
            );
          })}
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
  pickTier,
}: {
  summary: TrackrecordSummary | undefined;
  loading: boolean;
  pickTier?: string;
}) {
  const total = summary?.total_predictions ?? null;
  const periodStart = summary?.period_start ? new Date(summary.period_start) : null;
  const periodEnd = summary?.period_end ? new Date(summary.period_end) : null;
  const fmtDate = (d: Date | null) =>
    d
      ? d.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })
      : "—";

  const exportUrl = api.getTrackrecordExportUrl(
    undefined,
    pickTier && pickTier !== "all" ? pickTier : undefined,
  );

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

        {/* Right: download buttons — two CSVs zodat iemand die alleen
             de BOTD historie wil kopiëren niet door 3.000+ predictions
             hoeft te filteren. De groene knop = alle predictions van
             de huidige tier-scope; de paarse = 1 rij per BOTD-dag. */}
        <div className="flex flex-wrap shrink-0 gap-2 sm:ml-4">
          <a
            href={exportUrl}
            download
            className="inline-flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-200 hover:bg-blue-500/20 hover:border-blue-500/50 transition-colors"
            aria-label="Download alle voorspellingen als CSV"
            title="Alle evaluated predictions van de actieve tier-scope"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </a>
          <BotdCsvDownloadButton />
        </div>
      </div>
    </div>
  );
}

// ─── SectionPhaseBanner — grote visuele scheiding tussen de twee
//      hoofd-fases (Backtest bovenin, Live meting daaronder) + een
//      derde voor de drilldown-sectie. User flagde de oude tab-layout
//      als "onoverzichtelijk"; deze banners geven elke sectie een
//      eigen header zodat "een normaal mens" meteen snapt wat volgt.

function SectionPhaseBanner({
  kicker,
  title,
  subtitle,
  accent,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  accent: "emerald" | "blue" | "slate";
}) {
  const tint =
    accent === "emerald"
      ? "var(--accent-green)"
      : accent === "blue"
        ? "var(--accent-blue)"
        : "230 4% 40%";
  const kickerClass =
    accent === "emerald"
      ? "text-emerald-300"
      : accent === "blue"
        ? "text-blue-300"
        : "text-slate-400";
  return (
    <section className="relative py-8 md:py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
        style={{
          background: `linear-gradient(90deg, transparent 0%, hsl(${tint} / 0.35) 50%, transparent 100%)`,
        }}
      />
      <div className="relative">
        <div
          className="relative overflow-hidden rounded-2xl p-5 text-center sm:p-7"
          style={{
            background: `linear-gradient(135deg, hsl(${tint} / 0.12) 0%, hsl(230 22% 9% / 0.9) 55%, hsl(${tint} / 0.14) 100%)`,
            border: `1px solid hsl(${tint} / 0.28)`,
            boxShadow: `0 0 0 1px hsl(${tint} / 0.08) inset, 0 10px 40px rgba(0,0,0,0.35)`,
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 -top-20 h-[220px] w-[220px] rounded-full"
            style={{ background: `hsl(${tint} / 0.22)`, filter: "blur(100px)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -bottom-20 h-[220px] w-[220px] rounded-full"
            style={{ background: `hsl(${tint} / 0.18)`, filter: "blur(100px)" }}
          />
          <div className="relative">
            <span
              className={`text-[11px] font-bold uppercase tracking-[0.22em] ${kickerClass}`}
            >
              {kicker}
            </span>
            <h2 className="text-heading mt-2 text-balance break-words text-xl text-[#ededed] sm:text-2xl lg:text-3xl">
              {title}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#a3a9b8]">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── BOTD tier gate — voor BOTD en BOTD-Live tabs. Gold en Platinum
//      zien de onderliggende sectie; Free en Silver krijgen een
//      upgrade-teaser. We lezen tier uit localStorage zodat de admin
//      tier-switcher in /admin ("Test as Tier") ook hier doorwerkt en
//      je kunt valideren hoe de paywall eruit ziet zonder echt account.

function BotdTierGate({ children }: { children: React.ReactNode }) {
  const [userTier, setUserTier] = React.useState<string | null>(null);
  React.useEffect(() => {
    try {
      setUserTier(window.localStorage.getItem("betsplug_tier"));
    } catch {
      setUserTier(null);
    }
  }, []);

  const hasAccess = userTier === "gold" || userTier === "platinum";
  if (hasAccess) return <>{children}</>;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-6 sm:p-10"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--accent-green) / 0.14) 0%, hsl(230 22% 9% / 0.9) 55%, hsl(var(--accent-purple) / 0.18) 100%)",
        borderColor: "hsl(var(--accent-purple) / 0.3)",
        boxShadow:
          "0 0 0 1px hsl(var(--accent-purple) / 0.08) inset, 0 10px 40px rgba(0,0,0,0.4)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-[280px] w-[280px] rounded-full"
        style={{
          background: "hsl(var(--accent-purple) / 0.25)",
          filter: "blur(100px)",
        }}
      />
      <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 ring-1 ring-purple-400/30">
          <Trophy className="h-6 w-6 text-purple-300" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold text-[#ededed] sm:text-2xl">
            Alleen voor Gold & Platinum abonnees
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#c8cdd6]">
            De Pick of the Day zit op <strong className="text-[#fde68a]">Gold</strong>{" "}
            en <strong className="text-[#93c5fd]">Platinum</strong> — onze enige
            dagelijkse pick met de hoogste modelconfidence. Free en Silver hebben geen
            BOTD-toegang omdat we het volume laag en de signaal-kwaliteit hoog willen
            houden. Upgrade naar Gold (of Platinum voor top-5 competities) om deze
            track record en de dagelijkse pick vrij te spelen. Gold en Platinum zien
            beide dezelfde BOTD stream — dezelfde picks.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href="/pricing"
              className="btn-primary inline-flex items-center gap-2"
            >
              Upgrade naar Gold
            </Link>
            <Link
              href="/bet-of-the-day"
              className="btn-glass inline-flex items-center gap-2"
            >
              Bekijk BOTD-voorbeeld
            </Link>
          </div>
          <p className="mt-3 text-[11px] text-[#6b7280]">
            Admin aan het testen? Open <code className="rounded bg-white/[0.06] px-1">/admin</code>{" "}
            → "Test as Tier" → Gold / Platinum om deze sectie vrij te spelen.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── BOTD CSV download — aparte knop want users vroegen om een CSV
//      met alleen de Pick-of-the-Day historie, niet het hele prediction
//      corpus. Bearer-token pattern zodat de admin-gated backend
//      endpoint accepts dezelfde auth als de rest van deze pagina.

function BotdCsvDownloadButton() {
  const [busy, setBusy] = React.useState(false);
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  async function downloadBotd() {
    setBusy(true);
    try {
      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("betsplug_token")
          : null;
      const resp = await fetch(`${api}/bet-of-the-day/export.csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!resp.ok) {
        window.alert(
          resp.status === 401 || resp.status === 403
            ? "Log opnieuw in om de BOTD CSV te downloaden."
            : `BOTD CSV download mislukt (${resp.status}).`,
        );
        return;
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "betsplug-pick-of-the-day.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      window.alert("BOTD CSV download mislukt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={downloadBotd}
      title="Alleen Pick-of-the-Day historie als CSV"
      className="inline-flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm font-semibold text-purple-200 hover:bg-purple-500/20 hover:border-purple-500/50 transition-colors disabled:opacity-50"
    >
      <Trophy className="h-4 w-4" />
      {busy ? "Bezig…" : "BOTD CSV"}
    </button>
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
                className="w-full px-3 sm:px-4 py-3 grid grid-cols-1 sm:grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 sm:gap-3 items-center text-left"
                aria-expanded={isExpanded}
                aria-label={`${matchLabel} — klik voor details`}
              >
                {/* Time */}
                <span className="text-xs text-slate-500 w-full sm:w-24 md:w-28 shrink-0 truncate">{scheduledAt}</span>

                {/* Match */}
                <div className="min-w-0 overflow-hidden">
                  <p className="text-sm font-medium text-slate-100 leading-tight truncate">{matchLabel}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {pred.match && (
                      <p className="text-[10px] text-slate-500 truncate">{pred.match.status}</p>
                    )}
                    {modelLabel && (
                      <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-300 uppercase tracking-wide">
                        {modelLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Probabilities (hidden on phone — visible from md) */}
                <span className="hidden md:inline text-slate-300 font-medium font-mono text-xs whitespace-nowrap">
                  {callSummary}
                </span>

                {/* Confidence */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="hidden sm:inline text-[10px] text-slate-500 uppercase tracking-wide">{t("trackrecord.conf")}</span>
                  <ConfidenceBadge value={pred.confidence} />
                </div>

                {/* Status */}
                <div className="shrink-0">
                  <PredictionStatusBadge correct={correct} evaluated={evaluated} />
                </div>

                {/* Prediction quality score (hidden on phone) */}
                <span className="hidden md:inline text-xs font-mono tabular-nums w-16 text-right text-slate-500 shrink-0">
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

// ─── Tier tabs (v8.3 public filter) ────────────────────────────────────────

type TierTabKey = "all" | "free" | "silver" | "gold" | "platinum";

const TIER_TABS: {
  key: TierTabKey;
  label: string;
  emoji: string;
  activeClass: string;
}[] = [
  { key: "all", label: "All tiers", emoji: "◯", activeClass: "border-white/30 bg-white/[0.08] text-slate-100" },
  { key: "free", label: "Free · 45%+", emoji: "⬜", activeClass: "border-slate-300/30 bg-slate-300/[0.10] text-slate-200" },
  { key: "silver", label: "Silver · 60%+", emoji: "⚪", activeClass: "border-slate-100/40 bg-slate-100/[0.10] text-slate-100" },
  { key: "gold", label: "Gold · 70%+", emoji: "🔵", activeClass: "border-blue-400/40 bg-blue-500/[0.12] text-blue-100" },
  { key: "platinum", label: "Platinum · 80%+", emoji: "🟢", activeClass: "border-emerald-400/40 bg-emerald-500/[0.12] text-emerald-100" },
];

function TierTabsStrip({
  value,
  onChange,
}: {
  value: TierTabKey;
  onChange: (v: TierTabKey) => void;
}) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="border-b border-white/[0.05] px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Tier scope — click any tier to audit its track record
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 p-3">
        {TIER_TABS.map((tab) => {
          const active = tab.key === value;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? tab.activeClass
                  : "border-white/[0.08] bg-transparent text-slate-400 hover:border-white/[0.15] hover:text-slate-200"
              }`}
              aria-pressed={active}
            >
              <span aria-hidden>{tab.emoji}</span>
              {tab.label}
            </button>
          );
        })}
      </div>
      {/* B2.4 — inline explainer so users understand how each tier is
          defined. Tiers combine a league-scope filter with a confidence
          threshold, then the per-tier accuracy is the historical result
          of the v8.1 engine on that slice. Keeping this as copy (not a
          popover) so screen-reader users and first-time visitors see it
          without discovery. */}
      <div className="border-t border-white/[0.05] px-4 py-2 text-[11px] text-slate-500 leading-relaxed">
        Each tier filters picks by league scope + model confidence:
        {" "}
        <span className="text-slate-400">Platinum</span> = top-5 elite leagues + conf ≥75%,{" "}
        <span className="text-slate-400">Gold</span> = top-10 + ≥70%,{" "}
        <span className="text-slate-400">Silver</span> = top-14 + ≥65%,{" "}
        <span className="text-slate-400">Free</span> = top-14 + ≥55%.
        Accuracy is recomputed live from evaluated matches — no cache, no cherry-picking.
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrackrecordPage() {
  const { t, locale } = useTranslations();
  const isNl = locale === "nl";
  const [mainTab, setMainTab] = React.useState<"live" | "backtest">("live");
  const [pickTier, setPickTier] = React.useState<
    "all" | "free" | "silver" | "gold" | "platinum"
  >("all");

  const filterParams = React.useMemo(() => {
    const p: Record<string, string> = {};
    if (pickTier !== "all") p.pick_tier = pickTier;
    return p;
  }, [pickTier]);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["trackrecord-summary", filterParams],
    queryFn: () => api.getTrackrecordSummary(filterParams),
  });

  return (
    <div className="relative mx-auto max-w-7xl px-0 sm:px-2 py-4 sm:py-6 md:py-8 animate-fade-in overflow-hidden">
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

      {/* ─── Main tab navigation ─── */}
      <div className="glass-card overflow-hidden">
        <div className="flex border-b border-white/[0.06]">
          {([
            { key: "live", label: isNl ? "Live meting" : "Live measurement", icon: Activity, accent: "blue" },
            { key: "backtest", label: "Backtest", icon: BarChart3, accent: "emerald" },
          ] as const).map(({ key, label, icon: Icon, accent }) => {
            const active = mainTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setMainTab(key)}
                className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold transition-colors border-b-2 ${
                  active
                    ? accent === "blue"
                      ? "border-blue-400 bg-blue-500/[0.08] text-blue-300"
                      : "border-emerald-400 bg-emerald-500/[0.08] text-emerald-300"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20"
                }`}
                aria-selected={active}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ──────────────── BACKTEST TAB CONTENT ──────────────── */}
      {mainTab === "backtest" && (<>

      <div className="space-y-6 animate-slide-up">

        {/* ── Container 1: Tier stats dashboard ── */}
        <div className="glass-card overflow-hidden">
          <div className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">Prestaties per tier</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kies een tier — de statistieken hieronder updaten automatisch.
              </p>
            </div>
            <a
              href={api.getTrackrecordExportUrl(
                undefined,
                pickTier !== "all" ? pickTier : undefined,
              )}
              download
              className="flex shrink-0 items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download CSV
            </a>
          </div>

          {/* Tier buttons */}
          <div className="flex flex-wrap gap-2 px-5 py-4 border-b border-white/[0.05]">
            {TIER_TABS.map((tab) => {
              const active = tab.key === pickTier;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setPickTier(tab.key)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? tab.activeClass
                      : "border-white/[0.08] bg-transparent text-slate-400 hover:border-white/[0.15] hover:text-slate-200"
                  }`}
                  aria-pressed={active}
                >
                  <span aria-hidden>{tab.emoji}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Dynamic stats */}
          {summaryLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : summary ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 p-6">
              <KpiCard
                title="Voorspellingen"
                value={summary.total_predictions > 0 ? summary.total_predictions.toLocaleString() : "—"}
                subtitle="Geëvalueerde wedstrijdvoorspellingen"
                icon={Target}
                accent="blue"
              />
              <KpiCard
                title="Nauwkeurigheid"
                value={summary.total_predictions > 0 ? formatPercent(summary.accuracy) : "—"}
                subtitle="Op alle 3-uitkomst voorspellingen"
                icon={TrendingUp}
                accent="green"
              />
              <KpiCard
                title="Voorspellingskwaliteit"
                value={fmt(summary.brier_score, 4)}
                subtitle="Brier score (lager = beter)"
                icon={BarChart3}
                accent="amber"
              />
              <KpiCard
                title="Gem. Betrouwbaarheid"
                value={summary.total_predictions > 0 ? formatPercent(summary.avg_confidence) : "—"}
                subtitle="Modelconfidentie gemiddeld"
                icon={Activity}
                accent="blue"
              />
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">Geen data beschikbaar.</p>
          )}
        </div>

        {/* ── Container 2: Bet of the Day ── */}
        <div className="glass-card overflow-hidden border border-purple-500/20">
          <div className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 ring-1 ring-purple-500/20">
                <Trophy className="h-5 w-5 text-purple-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-semibold text-slate-100">
                    Pick of the Day — backtest
                  </h2>
                  <span className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-semibold text-yellow-300">
                    Gold &amp; Platinum
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Dagelijkse pick met hoogste confidence, gesimuleerd op historische data.
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <BotdTierGate>
              <BotdTrackRecordSection />
            </BotdTierGate>
          </div>
        </div>

      </div>

      </>)}
      {/* ─── End backtest tab ─── */}

      {/* ──────────────── LIVE METING TAB CONTENT ──────────────── */}
      {mainTab === "live" && (<>

      <SectionPhaseBanner
        accent="blue"
        kicker="2 · Live meting · vanaf 18 apr 2026"
        title="Pre-match meting die dagelijks groeit"
        subtitle={
          "Hieronder tellen alleen picks die strikt vóór de aftrap zijn vastgelegd. " +
          "De teller begint op 0 en groeit met elke afgelopen wedstrijd — de eerlijke " +
          "track record zonder cherry-picking."
        }
      />

      <div className="space-y-6 animate-slide-up">
        {/* Per-tier live meting */}
        <div className="glass-card p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-100">
              Per tier — live accuraatheid
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Strikt pre-match picks sinds 18 april 2026, per tier uitgesplitst.
              Zolang een tier onder 10 beoordeelde picks zit tonen we "wachten op
              data" — kleine samples zijn geen conclusie.
            </p>
          </div>
          <LiveMeasurementSection />
        </div>

        {/* Pick of the Day — live (Gold+ only) */}
        <div className="glass-card p-6 border border-purple-500/20">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-purple-300" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Pick of the Day — live meting
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Dagelijkse BOTD pre-match vastgelegd. Gold en Platinum zien dezelfde stream.
              </p>
            </div>
          </div>
          <BotdTierGate>
            <BotdLiveTrackingSection />
          </BotdTierGate>
        </div>

        {/* Spoor 2 — Accuracy Pro Engine v2 preview (gelockt tot 100 picks) */}
        <AccuracyPlusPreview />
      </div>

      </>)}
      {/* ─── End live tab ─── */}

      </div>
    </div>
  );
}
