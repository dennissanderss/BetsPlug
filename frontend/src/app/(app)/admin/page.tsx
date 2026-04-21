"use client";

import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Database,
  AlertTriangle,
  Clock,
  Settings,
  Zap,
  RefreshCw,
  CheckCircle2,
  FileText,
  Users,
  Search,
  BarChart3,
  ClipboardList,
  FlaskConical,
  DollarSign,
  Mail,
  Globe,
  Eye,
  RotateCcw,
  Gauge,
  ArrowUpRight,
  Send,
  BookOpen,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn, formatDateTime } from "@/lib/utils";
import type { DataSourceHealth, IngestionRun } from "@/types/api";

import { Skeleton } from "@/components/ui/skeleton";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

import BlogManager from "@/components/admin/blog-manager";
import UserManager from "@/components/admin/user-manager";
import FinanceTab from "@/components/admin/finance-tab";
import SeoDashboard from "@/components/admin/seo-dashboard";
import AnalyticsSettings from "@/components/admin/analytics-settings";
import GoalsNotesTab from "@/components/admin/goals-notes-tab";
import StrategyTiersTab from "@/components/admin/strategy-tiers-tab";
import EmailDiagnosticsTab from "@/components/admin/email-diagnostics-tab";
import SeoMetaEditor from "@/components/admin/seo-meta-editor";
import TelegramManager from "@/components/admin/telegram-manager";
import SystemInfoTab from "@/components/admin/system-info";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminError {
  id?: string;
  error_type: string;
  message: string;
  run_id?: string;
  created_at?: string;
  [key: string]: unknown;
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const toneMap: Record<string, "win" | "info" | "draw" | "loss" | "default"> = {
    completed: "win", success: "win", healthy: "win", active: "win",
    running: "info", pending: "info",
    degraded: "draw", warning: "draw", unknown: "default",
    failed: "loss", error: "loss",
  };
  const tone = toneMap[s] ?? "default";
  return <Pill tone={tone} className="capitalize">{status}</Pill>;
}

// ─── Tab system ───────────────────────────────────────────────────────────────

interface TabDef {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  badgeColor?: string;
}

interface TabsProps {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}

function TabPills({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="glass-panel flex flex-wrap gap-1 p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              isActive
                ? "bg-[#4ade80]/15 text-[#4ade80] ring-1 ring-[#4ade80]/40"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span
                className={cn(
                  "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white",
                  tab.badgeColor ?? "bg-red-500"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Data Sources Tab ─────────────────────────────────────────────────────────

function SourceStatusDot({ status }: { status: string }) {
  const s = status.toLowerCase();
  const colorMap: Record<string, string> = {
    healthy:  "bg-green-400 shadow-green-400/50",
    degraded: "bg-amber-400 shadow-amber-400/50",
    unknown:  "bg-slate-400",
    failed:   "bg-red-400 shadow-red-400/50",
  };
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full shadow-sm",
        colorMap[s] ?? "bg-slate-400"
      )}
    />
  );
}

function DataSourcesTab() {
  const { data: sources, isLoading } = useQuery<DataSourceHealth[]>({
    queryKey: ["data-sources"],
    queryFn: () => api.getDataSources(),
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-neon p-5 space-y-3">
            <Skeleton className="h-5 w-3/4 bg-white/[0.06]" />
            <Skeleton className="h-4 w-1/2 bg-white/[0.04]" />
            <Skeleton className="h-2 w-full rounded-full bg-white/[0.04]" />
            <Skeleton className="h-4 w-2/3 bg-white/[0.04]" />
          </div>
        ))}
      </div>
    );
  }

  if (!sources || sources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04]">
          <Database className="h-6 w-6 text-slate-500" />
        </div>
        <p className="text-sm text-slate-400">No data sources configured.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sources.map((src) => {
        const reliability = src.reliability_score ?? 0;
        const reliabilityPct = Math.round(reliability * 100);
        const barColor =
          reliability >= 0.8
            ? "bg-green-500"
            : reliability >= 0.5
            ? "bg-amber-500"
            : "bg-red-500";

        return (
          <div
            key={src.id}
            className={cn(
              "card-neon p-5 space-y-4 transition-all",
              !src.is_active && "opacity-50"
            )}
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                  <Database className="h-4 w-4 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">{src.name}</p>
                  <p className="truncate text-xs capitalize text-slate-500">{src.adapter_type}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <SourceStatusDot status={src.status} />
                <StatusPill status={src.status} />
              </div>
            </div>

            {/* Reliability bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Reliability</span>
                <span className="font-medium tabular-nums text-slate-300">
                  {src.reliability_score !== null ? `${reliabilityPct}%` : " - "}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={cn("h-full rounded-full transition-all", barColor)}
                  style={{ width: `${reliabilityPct}%` }}
                />
              </div>
            </div>

            {/* Last sync */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {src.last_sync_at
                ? `Last synced ${formatDateTime(src.last_sync_at)}`
                : "Never synced"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Ingestion Tab ────────────────────────────────────────────────────────────

function IngestionTab() {
  const { data: runs, isLoading } = useQuery<IngestionRun[]>({
    queryKey: ["ingestion-runs"],
    queryFn: () => api.getIngestionRuns(50),
    refetchInterval: 15_000,
  });

  return (
    <div className="card-neon overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Recent Ingestion Runs</h3>
          <p className="text-xs text-slate-500">Last 50 data ingestion jobs</p>
        </div>
        {!isLoading && runs && (
          <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-medium tabular-nums text-slate-300">
            {runs.length} runs
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Source", "Job Type", "Status", "Fetched", "Inserted", "Duration", "Started"].map((h) => (
                <th
                  key={h}
                  className={cn(
                    "px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500",
                    ["Fetched", "Inserted", "Duration"].includes(h) ? "text-right" : "text-left"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <Skeleton className="h-4 w-full bg-white/[0.04]" />
                      </td>
                    ))}
                  </tr>
                ))
              : (runs ?? []).length === 0
              ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                      No ingestion runs recorded yet.
                    </td>
                  </tr>
                )
              : (runs ?? []).map((run) => (
                  <tr
                    key={run.id}
                    className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">
                      {String(run.data_source_id).slice(0, 8)}…
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-md border border-white/[0.06] bg-white/[0.04] px-2 py-0.5 text-xs capitalize text-slate-300">
                        {run.job_type}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={run.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs tabular-nums text-slate-400">
                      {Number(run.records_fetched).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs tabular-nums text-slate-400">
                      {Number(run.records_inserted).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs tabular-nums text-slate-400">
                      {run.duration_seconds != null ? `${Number(run.duration_seconds).toFixed(1)}s` : " - "}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        {formatDateTime(String(run.started_at))}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Errors Tab ───────────────────────────────────────────────────────────────

function ErrorMessageCell({ message }: { message: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const TRUNCATE_LEN = 80;
  const isTruncatable = message.length > TRUNCATE_LEN;

  return (
    <div className="max-w-sm">
      <p className={cn("font-mono text-xs text-slate-400", !expanded && "line-clamp-2")}>
        {expanded || !isTruncatable ? message : message.slice(0, TRUNCATE_LEN) + "…"}
      </p>
      {isTruncatable && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-0.5 text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

function ErrorsTab() {
  const { data: errors, isLoading } = useQuery<AdminError[]>({
    queryKey: ["admin-errors"],
    queryFn: () =>
      api.getAdminErrors(50).then((rows) => rows as AdminError[]),
    refetchInterval: 30_000,
  });

  const errorCount = errors?.length ?? 0;

  return (
    <div className="card-neon overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-100">Recent Errors</h3>
          {!isLoading && errorCount > 0 && (
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          )}
          <p className="ml-1 text-xs text-slate-500">Last 50 system errors</p>
        </div>
        {!isLoading && errorCount > 0 && (
          <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold tabular-nums text-red-400">
            {errorCount} error{errorCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Error Type", "Message", "Run ID", "Timestamp"].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <Skeleton className="h-4 w-full bg-white/[0.04]" />
                      </td>
                    ))}
                  </tr>
                ))
              : errorCount === 0
              ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-500">
                      No errors recorded. System is healthy.
                    </td>
                  </tr>
                )
              : (errors ?? []).map((err, idx) => (
                  <tr
                    key={err.id ?? idx}
                    className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-400">
                        {err.error_type}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <ErrorMessageCell message={err.message} />
                    </td>
                    <td className="px-5 py-3">
                      {err.run_id ? (
                        <span className="font-mono text-xs text-slate-500">
                          {String(err.run_id).slice(0, 8)}…
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600"> - </span>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {err.created_at ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {formatDateTime(String(err.created_at))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600"> - </span>
                      )}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Action button with state ─────────────────────────────────────────────────

interface ActionButtonProps {
  label: string;
  loadingLabel: string;
  successMessage: string;
  icon: React.ElementType;
  onExecute: () => Promise<unknown>;
  variant?: "gradient" | "outline";
}

function ActionButton({
  label,
  loadingLabel,
  successMessage,
  icon: Icon,
  onExecute,
  variant = "gradient",
}: ActionButtonProps) {
  const mutation = useMutation({ mutationFn: onExecute });

  return (
    <div className="space-y-2">
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed",
          variant === "gradient"
            ? "btn-primary"
            : "border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:border-white/20"
        )}
      >
        {mutation.isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {loadingLabel}
          </>
        ) : (
          <>
            <Icon className="h-4 w-4" />
            {label}
          </>
        )}
      </button>
      {mutation.isSuccess && (
        <p className="text-xs text-green-400">{successMessage}</p>
      )}
      {mutation.isError && (
        <p className="text-xs text-red-400">
          {mutation.error instanceof Error ? mutation.error.message : "Action failed."}
        </p>
      )}
    </div>
  );
}

// ─── Actions Tab ──────────────────────────────────────────────────────────────

const darkSelectCls =
  "h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-200 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors";

function PipelineHealthCard() {
  const healthQuery = useQuery({
    queryKey: ["admin-pipeline-health"],
    queryFn: () => api.getPipelineHealth(),
    refetchInterval: 60_000,
    // Retry for 2 min so Railway redeploy windows don't flash a red
    // error on the admin tab — "Failed to fetch" during deploy is
    // not a real error, it's a 5-second gap while the new image boots.
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
  });

  const runMutation = useMutation({
    mutationFn: () => api.runGeneratePredictions(7),
    onSuccess: () => healthQuery.refetch(),
  });

  const health = healthQuery.data;
  const tone = health
    ? health.diagnosis === "healthy"
      ? "win"
      : health.diagnosis === "no_model" || health.diagnosis === "stale"
        ? "loss"
        : health.diagnosis === "partial"
          ? "draw"
          : "default"
    : "default";

  return (
    <div className="card-neon p-6 space-y-4 lg:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Pipeline Health</h3>
            <p className="text-xs text-slate-400">
              Live snapshot of the forecasting pipeline — models, recent output, coverage.
            </p>
          </div>
        </div>
        {health && <StatusPill status={health.diagnosis} />}
      </div>

      {healthQuery.isLoading && (
        <Skeleton className="h-24 w-full rounded-lg" />
      )}

      {healthQuery.isError && (
        <p className="text-xs text-red-400">
          Kon pipeline-health niet ophalen.
        </p>
      )}

      {health && (
        <>
          <p className="text-sm text-slate-300">{health.message}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-panel p-3 space-y-0.5">
              <p className="section-label">Active models</p>
              <p className="text-stat tabular-nums text-[#60a5fa]">
                {health.active_model_versions}
              </p>
            </div>
            <div className="glass-panel p-3 space-y-0.5">
              <p className="section-label">Preds last 24h</p>
              <p className="text-stat tabular-nums text-[#4ade80]">
                {health.predictions_last_24h}
              </p>
              <p className="text-[10px] text-slate-500">
                {health.pre_kickoff_24h} pre-kickoff / {health.post_kickoff_24h} post-kickoff
              </p>
            </div>
            <div className="glass-panel p-3 space-y-0.5">
              <p className="section-label">Upcoming (7d)</p>
              <p className="text-stat tabular-nums text-slate-100">
                {health.upcoming_visible}
                <span className="text-sm text-slate-500"> / {health.upcoming_matches_7d}</span>
              </p>
              <p className="text-[10px] text-slate-500">
                user-visible / total ({health.upcoming_with_prediction} in DB)
              </p>
            </div>
            <div className="glass-panel p-3 space-y-0.5">
              <p className="section-label">Finished (2d)</p>
              <p className="text-stat tabular-nums text-slate-100">
                {health.recent_finished_visible}
                <span className="text-sm text-slate-500"> / {health.recent_finished_2d}</span>
              </p>
              <p className="text-[10px] text-slate-500">
                user-visible / total ({health.recent_finished_with_prediction} in DB)
              </p>
            </div>
          </div>

          {Object.keys(health.source_breakdown_24h).length > 0 && (
            <div className="glass-panel p-3 space-y-1.5">
              <p className="section-label">Prediction sources (last 24h)</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(health.source_breakdown_24h).map(([src, n]) => {
                  const allowed = ["live", "backtest", "batch_local_fill"].includes(src);
                  return (
                    <span
                      key={src}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-mono",
                        allowed
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                          : "bg-red-500/10 border border-red-500/30 text-red-300",
                      )}
                      title={allowed ? "Allowed by trackrecord_filter" : "REJECTED by trackrecord_filter"}
                    >
                      {src === "__null__" ? "(null)" : src}
                      <span className="tabular-nums">{n}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {health.latest_predicted_at && (
            <p className="text-xs text-slate-500">
              Latest predicted_at:{" "}
              <span className="text-slate-300 font-mono">
                {formatDateTime(health.latest_predicted_at)}
              </span>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runMutation.isPending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Genereren...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Run pipeline now (7d)
                </>
              )}
            </button>
            <button
              onClick={() => healthQuery.refetch()}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.08]"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
            {runMutation.isSuccess && runMutation.data && (
              <p className="text-xs text-green-400">
                {runMutation.data.predictions_generated} nieuwe voorspellingen, {runMutation.data.errors} errors (scope: {runMutation.data.total_matches} wedstrijden).
              </p>
            )}
            {runMutation.isError && (
              <p className="text-xs text-red-400">
                {runMutation.error instanceof Error ? runMutation.error.message : "Run failed."}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function CapacityPlanCard() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-capacity-plan"],
    queryFn: () => api.getCapacityPlan(),
    refetchInterval: 120_000,
    retry: false,
  });

  const verdictColor = (s: string) =>
    s === "safe"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : s === "watch"
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : s === "tight"
      ? "bg-orange-500/15 text-orange-300 border-orange-500/30"
      : "bg-red-500/15 text-red-300 border-red-500/30";

  const verdictLabel = (s: string) =>
    ({ safe: "Safe", watch: "Watch", tight: "Tight", over: "Over limit" }[s] ??
      s);

  return (
    <div className="card-neon p-6 space-y-4 lg:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
            <Gauge className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              API Capacity (API-Football)
            </h3>
            <p className="text-xs text-slate-400">
              Measured usage vs plan limit, per-endpoint breakdown, and
              projections against user-count scenarios.
            </p>
          </div>
        </div>
        {data && (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide",
              verdictColor(data.verdict),
            )}
          >
            {verdictLabel(data.verdict)}
          </span>
        )}
      </div>

      {isLoading && <Skeleton className="h-24 w-full rounded-lg" />}
      {isError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 space-y-2">
          <p className="text-xs font-semibold text-red-300">
            Kon capacity-plan niet ophalen
          </p>
          <pre className="overflow-x-auto whitespace-pre-wrap break-all text-[10px] font-mono text-red-300/80">
            {error instanceof Error
              ? `${error.name}: ${error.message}`
              : String(error ?? "Unknown error")}
          </pre>
          <p className="text-[11px] text-red-200/80">
            <strong>Waarschijnlijke oorzaak:</strong> Railway backend is even
            niet bereikbaar (deploy-window) of je admin-sessie is verlopen.
            Wacht 1-2 min en klik Retry. Als het blijft falen: Railway →
            Deployments → check deploy status.
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-200 hover:bg-red-500/20"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {data && (
        <>
          {/* Today headline + 7d sparkline */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="glass-panel p-3 space-y-0.5 sm:col-span-2">
              <p className="section-label">Today so far</p>
              <p className="text-stat tabular-nums text-[#a855f7]">
                {data.usage.today_calls.toLocaleString()}
                <span className="text-sm text-slate-500">
                  {" "}
                  / {data.plan.daily_limit.toLocaleString()}
                </span>
              </p>
              <p className="text-[11px] text-slate-500">
                {data.usage.pct_of_limit_today}% of {data.plan.name} plan used
              </p>
              {/* Progress bar */}
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    data.verdict === "safe"
                      ? "bg-emerald-400"
                      : data.verdict === "watch"
                      ? "bg-amber-400"
                      : data.verdict === "tight"
                      ? "bg-orange-400"
                      : "bg-red-500",
                  )}
                  style={{
                    width: `${Math.min(100, data.usage.pct_of_limit_today)}%`,
                  }}
                />
              </div>
            </div>
            <div className="glass-panel p-3 space-y-0.5">
              <p className="section-label">Avg per day (7d)</p>
              <p className="text-stat tabular-nums text-slate-100">
                {Math.round(data.usage.avg_daily_last_7d).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500">
                {data.usage.last_7d_calls.toLocaleString()} total last 7d
              </p>
            </div>
            <div className="glass-panel p-3 space-y-0.5">
              <p className="section-label">Calls / user / day</p>
              <p className="text-stat tabular-nums text-slate-100">
                {data.user_base.calls_per_user_per_day.toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-500">
                {data.user_base.effective} active users (7d)
              </p>
            </div>
          </div>

          {/* 7-day sparkline bars */}
          <div className="glass-panel p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="section-label">Last 7 days</p>
              <p className="text-[10px] text-slate-500">
                daily limit ≈ {data.plan.daily_limit.toLocaleString()}
              </p>
            </div>
            <div className="flex items-end gap-1 h-12">
              {data.usage.series_7d.map((d) => {
                const pct = Math.min(
                  100,
                  (d.calls / Math.max(1, data.plan.daily_limit)) * 100,
                );
                return (
                  <div
                    key={d.day}
                    className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative"
                    title={`${d.day}: ${d.calls.toLocaleString()} calls`}
                  >
                    <div
                      className={cn(
                        "w-full rounded-sm transition-all",
                        pct >= 80
                          ? "bg-red-500/60"
                          : pct >= 50
                          ? "bg-amber-400/60"
                          : "bg-emerald-400/50",
                      )}
                      style={{ height: `${Math.max(4, pct)}%` }}
                    />
                    <span className="text-[9px] tabular-nums text-slate-500">
                      {d.day.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User-count scenarios */}
          <div className="space-y-2">
            <p className="section-label">Scaling scenarios</p>
            <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
              <table className="w-full min-w-[480px] text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-2 text-left font-semibold">
                      Active users
                    </th>
                    <th className="px-3 py-2 text-right font-semibold">
                      Projected / day
                    </th>
                    <th className="px-3 py-2 text-right font-semibold">
                      % of {data.plan.name}
                    </th>
                    <th className="px-3 py-2 text-right font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.scenarios.map((s) => (
                    <tr
                      key={s.users}
                      className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-3 py-2 font-semibold tabular-nums text-slate-100">
                        {s.users.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-300">
                        {s.projected_daily_calls.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-300">
                        {s.pct_of_limit}%
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={cn(
                            "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase",
                            verdictColor(s.status),
                          )}
                        >
                          {verdictLabel(s.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.projection.break_even_users !== null && (
              <p className="text-[11px] text-slate-500">
                Break-even (100% of daily limit) reached around{" "}
                <span className="font-semibold text-slate-300 tabular-nums">
                  ~{data.projection.break_even_users.toLocaleString()}
                </span>{" "}
                active users
                {data.projection.headroom_users !== null && (
                  <>
                    {" · "}
                    room to grow{" "}
                    <span className="font-semibold text-slate-300 tabular-nums">
                      +{data.projection.headroom_users.toLocaleString()}
                    </span>{" "}
                    before hitting 80%
                  </>
                )}
                {data.plan.upgrade_target && (
                  <>
                    {" · next tier "}
                    <span className="font-semibold text-slate-300">
                      {data.plan.upgrade_target.name}
                    </span>{" "}
                    (${data.plan.upgrade_target.price_usd_month}/mo,{" "}
                    {data.plan.upgrade_target.daily_limit.toLocaleString()}
                    /day)
                  </>
                )}
              </p>
            )}
          </div>

          {/* Top endpoints */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="glass-panel p-3 space-y-1.5">
              <p className="section-label">Top endpoints (24h)</p>
              {data.top_endpoints_24h.length === 0 ? (
                <p className="text-[11px] italic text-slate-500">
                  No calls logged in the last 24h.
                </p>
              ) : (
                <ul className="space-y-1 text-xs font-mono">
                  {data.top_endpoints_24h.map((row) => (
                    <li
                      key={row.endpoint}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="truncate text-slate-300">
                        /{row.endpoint}
                      </span>
                      <span className="tabular-nums text-slate-500">
                        {row.calls}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="glass-panel p-3 space-y-1.5">
              <p className="section-label">Top endpoints (7d)</p>
              {data.top_endpoints_7d.length === 0 ? (
                <p className="text-[11px] italic text-slate-500">
                  No calls logged in the last 7 days.
                </p>
              ) : (
                <ul className="space-y-1 text-xs font-mono">
                  {data.top_endpoints_7d.map((row) => (
                    <li
                      key={row.endpoint}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="truncate text-slate-300">
                        /{row.endpoint}
                      </span>
                      <span className="tabular-nums text-slate-500">
                        {row.calls}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.08]"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
            <p className="text-[10px] italic text-slate-500">
              Projection is linear (pessimistic — cache-efficiency not
              modelled). For capacity-planning, not realtime alerting.
            </p>
            {data.plan.upgrade_target && (
              <a
                href="https://dashboard.api-football.com/profile?access=subscriptions"
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-300 hover:text-purple-200"
              >
                Upgrade to {data.plan.upgrade_target.name}
                <ArrowUpRight className="h-3 w-3" />
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ActionsHelpPanel() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="card-neon lg:col-span-2 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
            <BookOpen className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Wat doen deze blokken? Welke knoppen zijn veilig?
            </h3>
            <p className="text-xs text-slate-400">
              Klik om uit te klappen — plain-Dutch uitleg per card.
            </p>
          </div>
        </div>
        <span className="text-xs text-slate-400">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-white/[0.06] px-5 py-4 text-sm text-[#cbd3e0]">
          <div>
            <p className="mb-1 text-[13px] font-semibold text-blue-300">
              🔵 Pipeline Health
            </p>
            <p className="text-xs leading-relaxed text-slate-400">
              Live status van de <em>voorspellings-motor</em>: draait het AI
              model, is er output in de laatste 24 uur, hebben upcoming
              wedstrijden een voorspelling. "Active models" = hoeveel model-
              versies staan aan. "Preds last 24h" = hoeveel nieuwe
              voorspellingen de pipeline in 24u produceerde. "Upcoming (7d)"
              = aankomende wedstrijden met/zonder voorspelling. "Finished
              (2d)" = afgelopen wedstrijden waar uitslagen op binnenkwamen.
              <br />
              <strong className="text-amber-300">
                ⚠️ "Run pipeline now (7d)" knop = veilig maar duurt ~1 min
                en stookt rekenkracht op Railway. Alleen gebruiken als
                "Preds last 24h" op 0 staat of veel lager dan normaal.
              </strong>
            </p>
          </div>

          <div>
            <p className="mb-1 text-[13px] font-semibold text-[#4ade80]">
              🟢 Sync Data
            </p>
            <p className="text-xs leading-relaxed text-slate-400">
              Haalt handmatig nieuwe wedstrijd-data op van de ingestion
              sources (API-Football, football-data.org, etc.). Loopt
              normaal elke 6 uur automatisch. Knop gebruiken als je ziet
              dat een wedstrijd van vandaag nog niet in de DB staat.
              <strong className="text-emerald-300"> Safe — kost een paar API-Football calls.</strong>
            </p>
          </div>

          <div>
            <p className="mb-1 text-[13px] font-semibold text-red-300">
              🔴 Retrain Models
            </p>
            <p className="text-xs leading-relaxed text-slate-400">
              Traint de AI modellen opnieuw op de meest recente historische
              wedstrijden. Dit is een <strong>duur en zwaar</strong> proces —
              neemt 30-60 min op Railway en kan tijdelijk voorspellingen
              traag maken.
              <strong className="text-red-300">
                {" "}⚠️ Alleen klikken na grote data-updates of als je met
                opzet nieuwe model-performance wilt testen. Niet zomaar elke
                dag.
              </strong>
            </p>
          </div>

          <div>
            <p className="mb-1 text-[13px] font-semibold text-slate-300">
              ⚪ Scheduler Status
            </p>
            <p className="text-xs leading-relaxed text-slate-400">
              Alleen info-tabel. Toont welke achtergrond-taken automatisch
              draaien en op welke frequentie. "Active" = taak is ingepland
              en draait op de aangegeven cadans.
              <strong className="text-emerald-300"> Geen knoppen — niks aan te klikken.</strong>
            </p>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-3">
            <p className="text-xs text-amber-200">
              <strong>"Kon capacity-plan niet ophalen" error?</strong> Dit is
              bijna altijd een tijdelijke Railway-deploy window. Wacht 1-2
              min en klik Retry. Als het blijft falen: Railway dashboard →
              Deployments → check of er een crash is.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionsTab({ sources }: { sources: DataSourceHealth[] }) {
  const [modelType, setModelType] = React.useState("all");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ActionsHelpPanel />
      <PipelineHealthCard />
      {/* Sync data */}
      <SyncDataCard sources={sources} />

      {/* Diagnose one league (surface raw API-Football error) */}
      <DiagnoseIngestionCard />

      {/* Per-day match status breakdown (which day stopped FINISHED-ing?) */}
      <MatchStatusBreakdownCard />

      {/* Test prediction generation (find the real error) */}
      <PredictionGenerationTestCard />

      {/* BOTD backfill — hernoem gemiste scheduler-picks (18-20 apr 2026) */}
      <BotdBackfillCard />

      {/* Retrain models */}
      <div className="card-neon p-6 space-y-4 border border-red-500/15">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
            <Zap className="h-4 w-4 text-red-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-100">Retrain Models</h3>
              <span className="inline-flex items-center rounded-md border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-300">
                🔴 Duur
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Hertrain de AI-modellen op historische data. 30-60 minuten
              op Railway, kan voorspellingen tijdelijk traag maken.
              Alleen na grote data-updates of bewust model-testen.
            </p>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Model Type (optional)</label>
          <select
            value={modelType}
            onChange={(e) => setModelType(e.target.value)}
            className={darkSelectCls}
          >
            <option value="all" className="bg-[#111827]">All Models</option>
            <option value="poisson" className="bg-[#111827]">Poisson Regression</option>
            <option value="xgboost" className="bg-[#111827]">XGBoost</option>
            <option value="ensemble" className="bg-[#111827]">Ensemble</option>
          </select>
        </div>
        <ActionButton
          label="Retrain Models"
          loadingLabel="Queuing…"
          successMessage="Retraining job queued successfully."
          icon={Zap}
          onExecute={() =>
            api.triggerRetrain(modelType !== "all" ? modelType : undefined)
          }
        />
      </div>

      {/* Scheduler status — LIVE data from APScheduler */}
      <SchedulerStatusCard />
    </div>
  );
}

// ─── Sync Data (with real backend message) ───────────────────────────────────

function SyncDataCard({ sources }: { sources: DataSourceHealth[] }) {
  const [syncSourceId, setSyncSourceId] = React.useState("all");
  const mutation = useMutation({
    mutationFn: () =>
      api.triggerSync(syncSourceId !== "all" ? syncSourceId : undefined),
  });

  const resp = mutation.data as { accepted?: boolean; message?: string } | undefined;
  const accepted = resp?.accepted ?? true;
  const message = resp?.message;

  return (
    <div className="card-neon p-6 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
          <RefreshCw className="h-4 w-4 text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-100">Sync Data</h3>
            <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
              🟢 Veilig
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Haalt nieuwe wedstrijd-data op (fixtures, results, standings)
            voor één league uit de rotatie. Toont nu het echte resultaat
            inclusief errors van API-Football — dus als er iets mis is met
            je key/plan/quota zie je precies wat.
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400">Data Source (optional)</label>
        <select
          value={syncSourceId}
          onChange={(e) => setSyncSourceId(e.target.value)}
          className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-200 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors"
        >
          <option value="all" className="bg-[#111827]">All Sources</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id} className="bg-[#111827]">
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="inline-flex items-center gap-2 rounded-lg btn-primary px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
      >
        {mutation.isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Syncing…
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Sync Data
          </>
        )}
      </button>
      {mutation.isSuccess && message && (
        <div
          className={cn(
            "rounded-lg border p-3 text-xs",
            accepted
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
              : "border-red-500/30 bg-red-500/5 text-red-200",
          )}
        >
          <p className="font-semibold mb-1">
            {accepted ? "✓ Sync ok" : "✗ Sync failed"}
          </p>
          <p className="font-mono text-[11px] leading-relaxed">{message}</p>
        </div>
      )}
      {mutation.isError && (
        <p className="text-xs text-red-400">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Sync call failed."}
        </p>
      )}
    </div>
  );
}

// ─── Diagnose single-league ingestion (surface raw API-Football errors) ──────

const DIAGNOSE_LEAGUES = [
  "premier-league", "la-liga", "bundesliga", "serie-a", "ligue-1",
  "eredivisie", "primeira-liga", "super-lig", "jupiler-pro-league",
  "saudi-pro-league", "mls", "brasileirao-serie-a", "liga-mx",
  "j1-league", "k-league-1",
];

function DiagnoseIngestionCard() {
  const [league, setLeague] = React.useState("premier-league");
  const mutation = useMutation({
    mutationFn: () => api.diagnoseIngestion(league),
  });

  const data = mutation.data;

  return (
    <div className="card-neon p-6 space-y-4 border border-amber-500/20">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-100">
              Diagnose ingestion (1 league)
            </h3>
            <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
              🟡 Diagnostiek
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Sync één specifieke league synchroon en toont de ruwe
            API-Football foutmelding. Gebruik deze als "Sync Data" groen
            is maar de resultaten-pagina geen nieuwe wedstrijden toont.
            Kost 1 API-Football call.
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400">League</label>
        <select
          value={league}
          onChange={(e) => setLeague(e.target.value)}
          className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-200 outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors"
        >
          {DIAGNOSE_LEAGUES.map((slug) => (
            <option key={slug} value={slug} className="bg-[#111827]">
              {slug}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
      >
        {mutation.isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Diagnoseren…
          </>
        ) : (
          <>
            <AlertTriangle className="h-4 w-4" />
            Diagnose nu
          </>
        )}
      </button>
      {data && (
        <div
          className={cn(
            "rounded-lg border p-3 space-y-2",
            data.ok
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-red-500/30 bg-red-500/5",
          )}
        >
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>
              <p className="text-slate-500">API returned</p>
              <p className="tabular-nums text-slate-100 text-sm">
                {data.matches_returned_by_api}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Created</p>
              <p className="tabular-nums text-emerald-300 text-sm">
                {data.created}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Updated</p>
              <p className="tabular-nums text-blue-300 text-sm">
                {data.updated}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Errors</p>
              <p
                className={cn(
                  "tabular-nums text-sm",
                  data.errors > 0 ? "text-red-300" : "text-slate-400",
                )}
              >
                {data.errors}
              </p>
            </div>
          </div>
          {data.error_message && (
            <div className="border-t border-red-500/20 pt-2 space-y-1">
              <p className="text-[11px] font-semibold text-red-300">
                {data.error_type ?? "Error"}
              </p>
              <pre className="overflow-x-auto whitespace-pre-wrap break-all text-[11px] font-mono text-red-200/90">
                {data.error_message}
              </pre>
            </div>
          )}
          {data.ok && data.matches_returned_by_api === 0 && (
            <p className="text-[11px] italic text-slate-500">
              Geen wedstrijden in de komende 14 dagen voor deze league. Dit
              kan normaal zijn (eind van seizoen, zomerstop) of wijzen op
              een stille plan/season-mismatch. Probeer een andere league.
            </p>
          )}
        </div>
      )}
      {mutation.isError && (
        <p className="text-xs text-red-400">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Diagnose failed."}
        </p>
      )}
    </div>
  );
}

// ─── Match Status Breakdown (per-day, per-status) ─────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-slate-500/15 text-slate-200 border-slate-500/30",
  live: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  finished: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  postponed: "bg-blue-500/15 text-blue-200 border-blue-500/30",
  cancelled: "bg-red-500/15 text-red-200 border-red-500/30",
};

function MatchStatusBreakdownCard() {
  const [days, setDays] = React.useState(14);
  const query = useQuery({
    queryKey: ["admin-match-status-breakdown", days],
    queryFn: () => api.getMatchStatusBreakdown(days),
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
  });

  const data = query.data;

  const perDayGroups = React.useMemo(() => {
    if (!data) return [] as { day: string; buckets: Record<string, number>; total: number }[];
    const byDay = new Map<string, Record<string, number>>();
    for (const row of data.rows) {
      if (!byDay.has(row.day)) byDay.set(row.day, {});
      byDay.get(row.day)![row.status] = row.count;
    }
    return Array.from(byDay.entries())
      .map(([day, buckets]) => ({
        day,
        buckets,
        total: Object.values(buckets).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => (a.day < b.day ? 1 : -1));
  }, [data]);

  return (
    <div className="card-neon p-6 space-y-4 lg:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
            <BarChart3 className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Match Status Breakdown (per dag)
            </h3>
            <p className="text-xs text-slate-400">
              Toont per dag hoeveel wedstrijden elke status hebben. Als
              je een dag ziet met 20 SCHEDULED en 0 FINISHED terwijl de
              aftrap al gepasseerd is: sync_recent_results doet voor die
              dag zijn werk niet. Directe wijzer naar welke league vast
              staat.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-8 rounded-md border border-white/10 bg-white/[0.04] px-2 text-xs text-slate-200"
          >
            {[7, 14, 30, 60].map((d) => (
              <option key={d} value={d} className="bg-[#111827]">
                {d}d
              </option>
            ))}
          </select>
          <button
            onClick={() => query.refetch()}
            className="inline-flex items-center gap-1.5 rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-slate-300 hover:bg-white/[0.08]"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>
      </div>

      {query.isLoading && <Skeleton className="h-32 w-full rounded-lg" />}

      {query.isError && (
        <p className="text-xs text-red-400">
          Kon match-status-breakdown niet ophalen.
        </p>
      )}

      {data && (
        <>
          {/* Red flag banner */}
          {data.stuck_scheduled_past_kickoff > 0 && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3">
              <p className="text-xs font-semibold text-red-200">
                ⚠️ {data.stuck_scheduled_past_kickoff} wedstrijden staan op
                SCHEDULED maar aftrap is meer dan 3u geleden.
              </p>
              <p className="mt-1 text-[11px] text-red-200/80">
                Dit is waarschijnlijk je data-gat: sync_recent_results of
                sync_live_fixtures heeft deze niet naar FINISHED getild.
                Klik hieronder per dag om te zien welke leagues vastzitten.
              </p>
            </div>
          )}

          {/* Totals */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.totals_by_status).map(([status, n]) => (
              <span
                key={status}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold capitalize",
                  STATUS_COLORS[status] ?? "bg-white/[0.04] text-slate-300 border-white/10",
                )}
              >
                {status}
                <span className="tabular-nums opacity-70">{n}</span>
              </span>
            ))}
            {data.last_finished_match_day && (
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-slate-400">
                Laatste FINISHED:{" "}
                <span className="font-mono text-slate-200">
                  {data.last_finished_match_day}
                </span>
              </span>
            )}
          </div>

          {/* Per-day rows */}
          <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2 text-left font-semibold">Datum</th>
                  <th className="px-3 py-2 text-right font-semibold">Scheduled</th>
                  <th className="px-3 py-2 text-right font-semibold">Live</th>
                  <th className="px-3 py-2 text-right font-semibold">Finished</th>
                  <th className="px-3 py-2 text-right font-semibold">Postponed</th>
                  <th className="px-3 py-2 text-right font-semibold">Cancelled</th>
                  <th className="px-3 py-2 text-right font-semibold">Totaal</th>
                </tr>
              </thead>
              <tbody>
                {perDayGroups.map((row) => {
                  const scheduled = row.buckets.scheduled ?? 0;
                  const live = row.buckets.live ?? 0;
                  const finished = row.buckets.finished ?? 0;
                  const postponed = row.buckets.postponed ?? 0;
                  const cancelled = row.buckets.cancelled ?? 0;
                  const dayDate = new Date(row.day + "T12:00:00Z");
                  const now = new Date();
                  const isPast = dayDate.getTime() < now.getTime() - 3 * 3600 * 1000;
                  const stuckFlag = isPast && scheduled > 0 && finished === 0;
                  return (
                    <tr
                      key={row.day}
                      className={cn(
                        "border-b border-white/[0.04] last:border-b-0",
                        stuckFlag && "bg-red-500/[0.04]",
                      )}
                    >
                      <td className="px-3 py-2 font-mono text-xs text-slate-200">
                        {row.day}
                        {stuckFlag && (
                          <span className="ml-2 text-[10px] font-semibold text-red-300">
                            ⚠️ stuck
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-300">
                        {scheduled || "·"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-amber-300">
                        {live || "·"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-emerald-300">
                        {finished || "·"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-blue-300">
                        {postponed || "·"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-red-300">
                        {cancelled || "·"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-100">
                        {row.total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Prediction Generation Test (find the real forecast-pipeline error) ─────

function PredictionGenerationTestCard() {
  const mutation = useMutation({
    mutationFn: () => api.testPredictionGeneration(),
  });

  const data = mutation.data;

  return (
    <div className="card-neon p-6 space-y-4 lg:col-span-2 border border-red-500/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Test prediction generation
              <span className="ml-2 inline-flex items-center rounded-md border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-300">
                🔴 Kritiek
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              <strong>Dit is de diagnose die het data-gat ontleedt.</strong>
              Pakt één upcoming match zonder live-prediction en probeert
              synchroon een forecast te genereren. Als job_generate_predictions
              (elke 10 min) silent faalt — wat nu het geval is — zie je hier
              de echte exception + traceback. Eén klik, binnen seconden
              antwoord.
            </p>
          </div>
        </div>
      </div>
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-50"
      >
        {mutation.isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Genereren…
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" />
            Genereer 1 prediction nu
          </>
        )}
      </button>
      {data && (
        <div
          className={cn(
            "rounded-lg border p-3 space-y-2",
            data.ok
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-red-500/30 bg-red-500/5",
          )}
        >
          {data.match_id && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-500">Match</p>
                <p className="text-slate-200">
                  {data.home_team} vs {data.away_team}
                </p>
                <p className="text-[11px] text-slate-500">
                  {data.league} · {data.scheduled_at}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Resultaat</p>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    data.ok ? "text-emerald-300" : "text-red-300",
                  )}
                >
                  {data.ok ? "✓ Succesvol gegenereerd" : "✗ Gefaald"}
                </p>
                {data.confidence != null && (
                  <p className="text-[11px] text-slate-500">
                    confidence: {(data.confidence * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          )}
          {data.error_message && (
            <div className="border-t border-red-500/20 pt-2 space-y-1">
              <p className="text-[11px] font-semibold text-red-300">
                {data.error_type ?? "Error"}
              </p>
              <pre className="overflow-x-auto whitespace-pre-wrap break-all text-[11px] font-mono text-red-200/90">
                {data.error_message}
              </pre>
              {data.traceback && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-[11px] font-semibold text-red-300/80 hover:text-red-200">
                    Show traceback
                  </summary>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded bg-black/40 p-2 text-[10px] font-mono text-red-200/80">
                    {data.traceback}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      )}
      {mutation.isError && (
        <p className="text-xs text-red-400">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Test call failed."}
        </p>
      )}
    </div>
  );
}

// ─── BOTD Backfill — Gemiste picks (apr 18-20 2026) ──────────────────────────

function BotdBackfillCard() {
  const mutation = useMutation({
    mutationFn: () => api.botdBackfillMissed(),
  });

  const data = mutation.data;

  return (
    <div className="card-neon p-6 space-y-4 border border-blue-500/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <RefreshCw className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              BOTD Backfill — Gemiste picks
              <span className="ml-2 inline-flex items-center rounded-md border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300">
                🟢 Veilig
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Vult de days in waar de scheduler kapot was (18-20 apr 2026).
              Hernoemt de beste pre-match pick per dag naar &apos;live&apos;. Veilig om meerdere keren uit te voeren.
            </p>
          </div>
        </div>
      </div>
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-200 hover:bg-blue-500/20 disabled:opacity-50"
      >
        {mutation.isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Bezig…
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Backfill gemiste BOTD picks
          </>
        )}
      </button>
      {mutation.isSuccess && data && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <p className="text-xs font-semibold text-emerald-200">
              {data.backfilled} dag{data.backfilled !== 1 ? "en" : ""} ingevuld
            </p>
          </div>
          {data.details.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {data.details.map((d) => (
                <span
                  key={d.date}
                  className="inline-flex items-center rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-mono text-[11px] text-emerald-300"
                  title={`${d.action} · ${d.confidence}% · ${d.original_source}`}
                >
                  {d.date}
                </span>
              ))}
            </div>
          )}
          {data.backfilled === 0 && (
            <p className="text-[11px] text-slate-400">
              Niets te doen — alle dagen zijn al ingevuld of er zijn geen geschikte picks gevonden.
            </p>
          )}
        </div>
      )}
      {mutation.isError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Backfill call mislukt."}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Scheduler Status (live) ──────────────────────────────────────────────────

const JOB_DESCRIPTIONS: Record<string, string> = {
  sync_data:
    "Haalt fixtures + results op van API-Football. Zonder deze taak komen er geen nieuwe wedstrijden binnen.",
  generate_predictions:
    "Genereert AI-voorspellingen voor upcoming matches zonder prediction.",
  evaluate_predictions:
    "Scoort afgelopen voorspellingen nadat een wedstrijd klaar is.",
  historical_predictions:
    "Backfill voorspellingen voor historische wedstrijden (backtest).",
  sync_live_fixtures:
    "Checkt elke minuut tijdens speeluren of een match afgelopen is.",
};

const TRIGGERABLE_JOBS = new Set([
  "sync_data",
  "generate_predictions",
  "evaluate_predictions",
  "historical_predictions",
]);

function SchedulerStatusCard() {
  const statusQuery = useQuery({
    queryKey: ["admin-scheduler-status"],
    queryFn: () => api.getSchedulerStatus(),
    refetchInterval: 30_000,
    retry: false,
  });

  const [lastTrigger, setLastTrigger] = React.useState<{
    job: string;
    ok: boolean;
    detail?: string | null;
  } | null>(null);

  const triggerMutation = useMutation({
    mutationFn: (jobId: string) => api.triggerSchedulerJob(jobId),
    onSuccess: (data) => {
      setLastTrigger({ job: data.triggered, ok: data.ok, detail: data.detail });
      statusQuery.refetch();
    },
    onError: (err, jobId) => {
      setLastTrigger({
        job: jobId,
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      });
    },
  });

  const status = statusQuery.data;

  return (
    <div className="card-neon overflow-hidden lg:col-span-2">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <Clock className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Scheduler Status
              <span className="ml-2 inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                🟢 Live
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Echte APScheduler-status. Als "Running" uit staat draaien er ZERO
              automatische taken (geen nieuwe wedstrijden, geen voorspellingen).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status && (
            <StatusPill status={status.running ? "running" : "failed"} />
          )}
          <button
            onClick={() => statusQuery.refetch()}
            className="inline-flex items-center gap-1.5 rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-slate-300 hover:bg-white/[0.08]"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>
      </div>

      {statusQuery.isLoading && (
        <div className="p-6">
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      )}

      {statusQuery.isError && (
        <div className="p-6 space-y-2">
          <p className="text-xs font-semibold text-red-300">
            Kon scheduler-status niet ophalen
          </p>
          <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded border border-red-500/30 bg-red-500/5 p-2 text-[10px] font-mono text-red-300/80">
            {statusQuery.error instanceof Error
              ? `${statusQuery.error.name}: ${statusQuery.error.message}`
              : String(statusQuery.error ?? "Unknown error")}
          </pre>
          <p className="text-[11px] text-red-200/80">
            <strong>Waarschijnlijke oorzaak:</strong> backend onbereikbaar of
            scheduler-module niet geladen. Check Railway logs.
          </p>
        </div>
      )}

      {status && !status.running && (
        <div className="mx-6 mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3">
          <p className="text-xs font-semibold text-red-200">
            ⚠️ APScheduler draait NIET op Railway.
          </p>
          <p className="mt-1 text-[11px] text-red-200/80">
            Dit is de meest waarschijnlijke oorzaak van een data-gat. Redeploy
            de backend op Railway of check de crashlog — start_scheduler() in
            backend/app/main.py:276 werd niet succesvol aangeroepen.
          </p>
        </div>
      )}

      {status && status.running && status.jobs.length === 0 && (
        <div className="mx-6 mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
          <p className="text-xs font-semibold text-amber-200">
            ⚠️ Scheduler draait, maar geen jobs geregistreerd.
          </p>
          <p className="mt-1 text-[11px] text-amber-200/80">
            start_scheduler() registreert geen add_job() calls. Check
            backend/app/services/scheduler.py:930.
          </p>
        </div>
      )}

      {status && status.jobs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Job", "Trigger", "Volgende run", "Actie"].map((h, i) => (
                  <th
                    key={h}
                    className={cn(
                      "px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500",
                      i === 3 ? "text-right" : "text-left"
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {status.jobs.map((job, idx, arr) => {
                const canTrigger = TRIGGERABLE_JOBS.has(job.id);
                const isTriggering =
                  triggerMutation.isPending &&
                  triggerMutation.variables === job.id;
                const nextRun = job.next_run_time
                  ? formatDateTime(job.next_run_time)
                  : "— (paused)";
                return (
                  <tr
                    key={job.id}
                    className={cn(
                      "transition-colors hover:bg-white/[0.02]",
                      idx < arr.length - 1 && "border-b border-white/[0.04]"
                    )}
                  >
                    <td className="px-5 py-3 space-y-0.5">
                      <p className="font-mono text-xs text-slate-200">
                        {job.name || job.id}
                      </p>
                      {JOB_DESCRIPTIONS[job.id] && (
                        <p className="text-[11px] text-slate-500">
                          {JOB_DESCRIPTIONS[job.id]}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-slate-400">
                      {job.trigger}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-400">
                      {nextRun}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {canTrigger ? (
                        <button
                          onClick={() => triggerMutation.mutate(job.id)}
                          disabled={triggerMutation.isPending}
                          className="inline-flex items-center gap-1.5 rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-200 hover:bg-blue-500/20 disabled:opacity-50"
                        >
                          {isTriggering ? (
                            <>
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Bezig…
                            </>
                          ) : (
                            <>
                              <Zap className="h-3 w-3" />
                              Run nu
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {lastTrigger && (
        <div
          className={cn(
            "mx-6 my-4 rounded-lg border p-3 text-xs",
            lastTrigger.ok
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
              : "border-red-500/30 bg-red-500/5 text-red-200"
          )}
        >
          <p className="font-semibold">
            {lastTrigger.ok ? "✓" : "✗"} {lastTrigger.job}
          </p>
          {lastTrigger.detail && (
            <p className="mt-1 font-mono text-[11px] opacity-80">
              {lastTrigger.detail}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tier Switcher ───────────────────────────────────────────────────────────

const TIERS = ["free", "silver", "gold", "platinum"] as const;

const TIER_COLORS: Record<string, { active: string; idle: string }> = {
  free:     { active: "bg-slate-600 text-white ring-2 ring-slate-400/50", idle: "text-slate-400 hover:bg-white/[0.06]" },
  silver:   { active: "bg-gradient-to-r from-slate-300 to-slate-500 text-[#14181f] ring-2 ring-slate-300/50", idle: "text-slate-300 hover:bg-white/[0.06]" },
  gold:     { active: "bg-gradient-to-r from-amber-400 to-yellow-500 text-[#1a1408] ring-2 ring-amber-300/50", idle: "text-amber-300/70 hover:bg-white/[0.06]" },
  platinum: { active: "bg-gradient-to-r from-cyan-300 to-indigo-400 text-[#0b1220] ring-2 ring-cyan-300/50", idle: "text-cyan-300/70 hover:bg-white/[0.06]" },
};

function TierSwitcher() {
  const [activeTier, setActiveTier] = React.useState<string | null>(null);

  React.useEffect(() => {
    const testing = localStorage.getItem("betsplug_admin_testing_tier");
    setActiveTier(testing);
  }, []);

  const handleTierClick = (tier: string) => {
    localStorage.setItem("betsplug_tier", tier);
    localStorage.setItem("betsplug_admin_testing_tier", tier);
    setActiveTier(tier);
    window.location.reload();
  };

  const handleReset = () => {
    localStorage.removeItem("betsplug_admin_testing_tier");
    localStorage.setItem("betsplug_tier", "platinum");
    setActiveTier(null);
    window.location.reload();
  };

  return (
    <div className="card-neon p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <Eye className="h-4 w-4 text-blue-400" />
          <span>Test as Tier</span>
        </div>

        <div className="flex items-center gap-1.5">
          {TIERS.map((tier) => {
            const isActive = activeTier === tier;
            const colors = TIER_COLORS[tier];
            return (
              <button
                key={tier}
                onClick={() => handleTierClick(tier)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all",
                  isActive ? colors.active : colors.idle
                )}
              >
                {tier}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleReset}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
            activeTier === null
              ? "bg-green-500/15 text-green-400 ring-1 ring-green-500/30"
              : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
          )}
        >
          <RotateCcw className="h-3 w-3" />
          {activeTier === null ? "Admin (default)" : "Reset to Admin"}
        </button>

        {activeTier && (
          <span className="text-xs text-amber-400/80">
            Paywalls active — viewing as {activeTier} user
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab, setActiveTab] = React.useState("actions");
  const router = useRouter();
  const { user, ready } = useAuth();

  // Client-side role gate. Non-admins get bounced to the dashboard
  // before any admin data query fires, so this isn't just cosmetic.
  // Backend-enforced checks on the individual /admin/* endpoints
  // remain the source of truth; this is a UX guard-rail.
  const isAdmin = user?.role === "admin";
  React.useEffect(() => {
    if (!ready) return;
    if (!user || !isAdmin) {
      router.replace("/dashboard");
    }
  }, [ready, user, isAdmin, router]);

  // Set tier to platinum only if admin is NOT actively testing a specific tier
  React.useEffect(() => {
    if (!isAdmin) return;
    const testing = localStorage.getItem("betsplug_admin_testing_tier");
    if (!testing) {
      localStorage.setItem("betsplug_tier", "platinum");
    }
  }, [isAdmin]);

  // Hooks must run in the same order every render, so call useQuery
  // BEFORE the role-gate early return. Queries are disabled until we
  // know the user is an admin to avoid unauthenticated calls.
  const { data: sources = [] } = useQuery<DataSourceHealth[]>({
    queryKey: ["data-sources"],
    queryFn: () => api.getDataSources(),
    enabled: ready && isAdmin,
  });

  const { data: errors = [] } = useQuery<AdminError[]>({
    queryKey: ["admin-errors"],
    queryFn: () => api.getAdminErrors(50).then((rows) => rows as AdminError[]),
    enabled: ready && isAdmin,
  });

  // Render nothing while we verify role — prevents a flash of admin UI
  // for regular users before the redirect effect runs.
  if (!ready || !isAdmin) {
    return null;
  }

  const errorCount = errors.length;
  const degradedCount = sources.filter(
    (s) => s.status === "degraded" || s.status === "unknown"
  ).length;

  const tabs: TabDef[] = [
    {
      id: "actions",
      label: "Actions",
      icon: Zap,
    },
    {
      id: "users",
      label: "Users",
      icon: Users,
    },
    {
      id: "finance",
      label: "Finance",
      icon: DollarSign,
    },
    {
      id: "goals",
      label: "Goals & Notes",
      icon: ClipboardList,
    },
    {
      id: "strategy-tiers",
      label: "Strategy Tiers",
      icon: FlaskConical,
    },
    {
      id: "email-diagnostics",
      label: "Email Diagnostics",
      icon: Mail,
    },
    {
      id: "telegram",
      label: "Telegram",
      icon: Send,
    },
    {
      id: "system-info",
      label: "Stack & Specs",
      icon: BookOpen,
    },
  ];

  return (
    <div className="relative mx-auto max-w-7xl px-0 sm:px-2 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-[#4ade80]/10 blur-3xl" />
        <div className="absolute top-40 right-1/4 h-72 w-72 rounded-full bg-[#60a5fa]/10 blur-3xl" />
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between animate-fade-in">
        <div>
          <p className="section-label">Admin</p>
          <div className="flex items-center gap-3 mt-1">
            <HexBadge variant="green" size="sm"><Settings className="h-4 w-4" /></HexBadge>
            <h1 className="text-heading"><span className="gradient-text-green">Admin dashboard</span></h1>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Data sources, ingestion runs, error log, and system actions
          </p>
        </div>

        {/* System status */}
        <div className="flex items-center gap-2">
          {degradedCount > 0 && (
            <Pill tone="draw"><AlertTriangle className="h-3 w-3" /> {degradedCount} degraded</Pill>
          )}
          {errorCount > 0 && (
            <Pill tone="loss">{errorCount} error{errorCount !== 1 ? "s" : ""}</Pill>
          )}
          {degradedCount === 0 && errorCount === 0 && (
            <Pill tone="win"><CheckCircle2 className="h-3.5 w-3.5" /> All systems operational</Pill>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Data sources", value: sources.length, color: "text-[#60a5fa]" },
          { label: "Degraded", value: degradedCount, color: "text-amber-400" },
          { label: "Errors (50)", value: errorCount, color: "text-red-400" },
          { label: "Healthy", value: sources.filter(s => s.status === "healthy").length, color: "text-[#4ade80]" },
        ].map((k) => (
          <div key={k.label} className="glass-panel p-4 space-y-1">
            <p className="section-label">{k.label}</p>
            <p className={`text-stat tabular-nums ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tier switcher for testing paywalls */}
      <div className="animate-slide-up">
        <TierSwitcher />
      </div>

      {/* Tab pills */}
      <div className="animate-slide-up">
        <TabPills tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {activeTab === "actions" && <ActionsTab sources={sources} />}
        {activeTab === "users" && <UserManager />}
        {activeTab === "finance" && <FinanceTab />}
        {activeTab === "goals" && <GoalsNotesTab />}
        {activeTab === "strategy-tiers" && <StrategyTiersTab />}
        {activeTab === "email-diagnostics" && <EmailDiagnosticsTab />}
        {activeTab === "telegram" && <TelegramManager />}
        {activeTab === "system-info" && <SystemInfoTab />}
      </div>
    </div>
  );
}
