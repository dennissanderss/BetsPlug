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
} from "lucide-react";

import { api } from "@/lib/api";
import { cn, formatDateTime } from "@/lib/utils";
import type { DataSourceHealth, IngestionRun } from "@/types/api";

import { Skeleton } from "@/components/ui/skeleton";

import BlogManager from "@/components/admin/blog-manager";
import UserManager from "@/components/admin/user-manager";
import SeoDashboard from "@/components/admin/seo-dashboard";
import AnalyticsSettings from "@/components/admin/analytics-settings";
import GoalsNotesTab from "@/components/admin/goals-notes-tab";
import StrategyTiersTab from "@/components/admin/strategy-tiers-tab";

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
  const colorMap: Record<string, string> = {
    completed: "bg-green-500/15 text-green-400",
    success:   "bg-green-500/15 text-green-400",
    healthy:   "bg-green-500/15 text-green-400",
    active:    "bg-green-500/15 text-green-400",
    running:   "bg-blue-500/15 text-blue-400",
    pending:   "bg-blue-500/15 text-blue-400",
    degraded:  "bg-amber-500/15 text-amber-400",
    warning:   "bg-amber-500/15 text-amber-400",
    unknown:   "bg-slate-500/15 text-slate-400",
    failed:    "bg-red-500/15 text-red-400",
    error:     "bg-red-500/15 text-red-400",
  };
  const cls = colorMap[s] ?? "bg-slate-500/15 text-slate-400";

  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", cls)}>
      {status}
    </span>
  );
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
    <div className="flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
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
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
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
          <div key={i} className="glass-card rounded-xl p-5 space-y-3">
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
              "glass-card-hover rounded-xl p-5 space-y-4 transition-all",
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
                  {src.reliability_score !== null ? `${reliabilityPct}%` : "—"}
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
    <div className="glass-card rounded-xl overflow-hidden">
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
                      {run.duration_seconds != null ? `${Number(run.duration_seconds).toFixed(1)}s` : "—"}
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
    <div className="glass-card rounded-xl overflow-hidden">
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
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {err.created_at ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {formatDateTime(String(err.created_at))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
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
            ? "btn-gradient text-white shadow-lg shadow-blue-500/20"
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

function ActionsTab({ sources }: { sources: DataSourceHealth[] }) {
  const [syncSourceId, setSyncSourceId] = React.useState("all");
  const [modelType, setModelType] = React.useState("all");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Sync data */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <RefreshCw className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Sync Data</h3>
            <p className="text-xs text-slate-400">
              Trigger a manual ingestion run for one or all sources.
            </p>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Data Source (optional)</label>
          <select
            value={syncSourceId}
            onChange={(e) => setSyncSourceId(e.target.value)}
            className={darkSelectCls}
          >
            <option value="all" className="bg-[#111827]">All Sources</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#111827]">
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <ActionButton
          label="Sync Data"
          loadingLabel="Syncing…"
          successMessage="Sync job queued successfully."
          icon={RefreshCw}
          onExecute={() =>
            api.triggerSync(syncSourceId !== "all" ? syncSourceId : undefined)
          }
        />
      </div>

      {/* Retrain models */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <Zap className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Retrain Models</h3>
            <p className="text-xs text-slate-400">
              Trigger a model retraining pipeline run.
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

      {/* Scheduler status */}
      <div className="glass-card rounded-xl overflow-hidden lg:col-span-2">
        <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <Clock className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Scheduler Status</h3>
            <p className="text-xs text-slate-400">Celery beat schedule — background task cadence</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Task", "Schedule", "Description", "Status"].map((h, i) => (
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
              {[
                {
                  task: "ingest_all_sources",
                  schedule: "Every 6 hours",
                  description: "Fetch latest fixture and result data",
                  status: "active",
                },
                {
                  task: "run_predictions",
                  schedule: "Every 4 hours",
                  description: "Generate forecasts for upcoming matches",
                  status: "active",
                },
                {
                  task: "evaluate_predictions",
                  schedule: "Every 2 hours",
                  description: "Score completed match predictions",
                  status: "active",
                },
                {
                  task: "retrain_models",
                  schedule: "Weekly (Sun 02:00)",
                  description: "Full model retraining on latest data",
                  status: "active",
                },
                {
                  task: "generate_weekly_report",
                  schedule: "Weekly (Mon 07:00)",
                  description: "Create weekly simulation performance report",
                  status: "active",
                },
              ].map((row, idx, arr) => (
                <tr
                  key={row.task}
                  className={cn(
                    "transition-colors hover:bg-white/[0.02]",
                    idx < arr.length - 1 && "border-b border-white/[0.04]"
                  )}
                >
                  <td className="px-5 py-3 font-mono text-xs text-slate-300">{row.task}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-400">{row.schedule}</td>
                  <td className="px-5 py-3 text-xs text-slate-400">{row.description}</td>
                  <td className="px-5 py-3 text-right">
                    <StatusPill status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab, setActiveTab] = React.useState("datasources");

  // Grant admin tier so paywall is bypassed when browsing from admin
  React.useEffect(() => {
    localStorage.setItem("betsplug_tier", "platinum");
  }, []);

  const { data: sources = [] } = useQuery<DataSourceHealth[]>({
    queryKey: ["data-sources"],
    queryFn: () => api.getDataSources(),
  });

  const { data: errors = [] } = useQuery<AdminError[]>({
    queryKey: ["admin-errors"],
    queryFn: () => api.getAdminErrors(50).then((rows) => rows as AdminError[]),
  });

  const errorCount = errors.length;
  const degradedCount = sources.filter(
    (s) => s.status === "degraded" || s.status === "unknown"
  ).length;

  const tabs: TabDef[] = [
    {
      id: "datasources",
      label: "Data Sources",
      icon: Database,
      badge: degradedCount,
      badgeColor: "bg-amber-500",
    },
    {
      id: "ingestion",
      label: "Ingestion",
      icon: RefreshCw,
    },
    {
      id: "errors",
      label: "Errors",
      icon: AlertTriangle,
      badge: errorCount,
      badgeColor: "bg-red-500",
    },
    {
      id: "actions",
      label: "Actions",
      icon: Zap,
    },
    {
      id: "blog",
      label: "Blog",
      icon: FileText,
    },
    {
      id: "users",
      label: "Users",
      icon: Users,
    },
    {
      id: "seo",
      label: "SEO",
      icon: Search,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
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
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-2.5">
            <Settings className="h-5 w-5 text-slate-400" />
            <h1 className="gradient-text text-2xl font-bold tracking-tight">Admin</h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Data sources, ingestion runs, error log, and system actions
          </p>
        </div>

        {/* System status badge */}
        <div className="flex items-center gap-2">
          {degradedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              {degradedCount} degraded
            </span>
          )}
          {errorCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold tabular-nums text-red-400">
              {errorCount} error{errorCount !== 1 ? "s" : ""}
            </span>
          )}
          {degradedCount === 0 && errorCount === 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              All systems operational
            </span>
          )}
        </div>
      </div>

      {/* Tab pills */}
      <div className="animate-slide-up">
        <TabPills tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {activeTab === "datasources" && <DataSourcesTab />}
        {activeTab === "ingestion" && <IngestionTab />}
        {activeTab === "errors" && <ErrorsTab />}
        {activeTab === "actions" && <ActionsTab sources={sources} />}
        {activeTab === "blog" && <BlogManager />}
        {activeTab === "users" && <UserManager />}
        {activeTab === "seo" && <SeoDashboard />}
        {activeTab === "analytics" && <AnalyticsSettings />}
        {activeTab === "goals" && <GoalsNotesTab />}
        {activeTab === "strategy-tiers" && <StrategyTiersTab />}
      </div>
    </div>
  );
}
