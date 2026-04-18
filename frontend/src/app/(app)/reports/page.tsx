"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Play, AlertTriangle, Clock, Sparkles } from "lucide-react";

import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { useTranslations } from "@/i18n/locale-provider";
import { PaywallOverlay } from "@/components/ui/paywall-overlay";
import type { GeneratedReport, PickTierSlug } from "@/types/api";
import { useTier } from "@/hooks/use-tier";

import { Skeleton } from "@/components/ui/skeleton";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTypeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyReports() {
  const { t } = useTranslations();
  return (
    <div className="card-neon rounded-2xl">
      <div className="relative flex flex-col items-center justify-center py-14 text-center">
        <HexBadge variant="purple" size="lg">
          <FileText className="h-6 w-6" />
        </HexBadge>
        <p className="mt-4 text-sm font-medium text-[#ededed]">
          {t("reports.noReportsYet")}
        </p>
        <p className="mt-1 text-xs text-[#a3a9b8]">{t("reports.noReportsHint")}</p>
      </div>
    </div>
  );
}

// ─── Generate form ────────────────────────────────────────────────────────────

interface GenerateFormState {
  report_type: string;
  format: string;
  pick_tier: PickTierSlug;
}

// Tier options available to each subscription level. A user can always
// inspect their own tier and everything below it (the same access
// semantics as /predictions and /trackrecord).
const TIER_RANK: Record<PickTierSlug, number> = {
  free: 0,
  silver: 1,
  gold: 2,
  platinum: 3,
};

function GenerateReportCard() {
  const { t } = useTranslations();
  const queryClient = useQueryClient();
  const { tier: userTierSlug, rank: userRank } = useTier();
  const [form, setForm] = React.useState<GenerateFormState>({
    report_type: "weekly",
    format: "pdf",
    pick_tier: userTierSlug,
  });

  // Keep the default tier in sync if useTier() hydrates after mount.
  React.useEffect(() => {
    setForm((f) =>
      f.pick_tier === "free" && userTierSlug !== "free"
        ? { ...f, pick_tier: userTierSlug }
        : f,
    );
  }, [userTierSlug]);

  const tierOptions: PickTierSlug[] = (
    ["free", "silver", "gold", "platinum"] as const
  ).filter((t) => TIER_RANK[t] <= userRank);

  const mutation = useMutation({
    mutationFn: () =>
      api.generateReport({
        report_type: form.report_type,
        format: form.format,
        config: { pick_tier: form.pick_tier },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const handleGenerate = () => {
    mutation.reset();
    mutation.mutate();
  };

  const selectClass =
    "h-10 rounded-lg glass-panel px-3 text-sm text-[#ededed] outline-none transition-colors focus:border-[#4ade80]/60";

  return (
    <div className="card-neon rounded-2xl">
      <div className="relative p-6">
        <div className="mb-5 flex items-center gap-3">
          <HexBadge variant="green" size="md">
            <Play className="h-4 w-4" />
          </HexBadge>
          <div>
            <h2 className="text-heading text-base text-[#ededed]">
              {t("reports.generateReport")}
            </h2>
            <p className="mt-0.5 text-xs text-[#a3a9b8]">
              {t("reports.generateReportDescription")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#a3a9b8]">
              {t("reports.reportType")}
            </label>
            <select
              value={form.report_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, report_type: e.target.value }))
              }
              className={`${selectClass} w-44`}
              style={{ border: "1px solid hsl(0 0% 100% / 0.1)" }}
            >
              <option value="weekly">{t("reports.weeklySummary")}</option>
              <option value="monthly">{t("reports.monthlySummary")}</option>
              <option value="custom">{t("reports.customRange")}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#a3a9b8]">
              {t("reports.format")}
            </label>
            <select
              value={form.format}
              onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))}
              className={`${selectClass} w-36`}
              style={{ border: "1px solid hsl(0 0% 100% / 0.1)" }}
            >
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#a3a9b8]">
              Tier
            </label>
            <select
              value={form.pick_tier}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  pick_tier: e.target.value as PickTierSlug,
                }))
              }
              className={`${selectClass} w-40`}
              style={{ border: "1px solid hsl(0 0% 100% / 0.1)" }}
            >
              {tierOptions.includes("free") && (
                <option value="free">Bronze · 45%+</option>
              )}
              {tierOptions.includes("silver") && (
                <option value="silver">Silver · 60%+</option>
              )}
              {tierOptions.includes("gold") && (
                <option value="gold">Gold · 70%+</option>
              )}
              {tierOptions.includes("platinum") && (
                <option value="platinum">Platinum · 80%+</option>
              )}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={mutation.isPending}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t("reports.generating")}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {t("reports.generateReport")}
              </>
            )}
          </button>
        </div>

        {mutation.isSuccess && (
          <div className="mt-4 flex items-center gap-2">
            <Pill tone="win">
              <span className="live-dot" />
              {t("reports.reportQueued")}
            </Pill>
          </div>
        )}
        {mutation.isError && (
          <div className="mt-4 flex items-center gap-2">
            <Pill tone="loss">
              <AlertTriangle className="h-3 w-3" />
              {mutation.error instanceof Error
                ? mutation.error.message
                : t("reports.generateFailed")}
            </Pill>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Reports list ─────────────────────────────────────────────────────────────

function ReportRow({ report }: { report: GeneratedReport }) {
  const { t } = useTranslations();
  return (
    <div className="card-neon rounded-xl">
      <div className="relative flex items-center gap-4 px-5 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <HexBadge variant="blue" size="sm">
            <FileText className="h-4 w-4" />
          </HexBadge>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#ededed]">
              {report.title}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-[#a3a9b8]">
              <Clock className="h-3 w-3" />
              {formatDateTime(report.created_at)}
            </p>
          </div>
        </div>

        <Pill tone="default" className="hidden !text-[10px] sm:inline-flex">
          {formatTypeLabel(report.file_format)}
        </Pill>

        <span className="hidden shrink-0 text-right text-xs tabular-nums text-[#a3a9b8] md:block">
          {formatBytes(report.file_size_bytes)}
        </span>

        <Pill tone="win">{t("reports.ready")}</Pill>

        <a
          href={api.getReportDownloadUrl(report.id)}
          download
          target="_blank"
          rel="noreferrer"
          className="btn-glass !py-1.5 !px-3 !text-xs"
        >
          <Download className="h-3.5 w-3.5" />
          {t("reports.download")}
        </a>
      </div>
    </div>
  );
}

function ReportsList({
  reports,
  isLoading,
}: {
  reports?: GeneratedReport[];
  isLoading: boolean;
}) {
  const { t } = useTranslations();
  return (
    <div className="card-neon rounded-2xl">
      <div className="relative p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-heading text-base text-[#ededed]">
              {t("reports.generatedReports")}
            </h2>
            <p className="mt-0.5 text-xs text-[#a3a9b8]">
              {t("reports.allAvailableReports")}
            </p>
          </div>
          {!isLoading && reports && reports.length > 0 && (
            <Pill tone="default">
              {reports.length}{" "}
              {reports.length === 1
                ? t("reports.reportSingular")
                : t("reports.reportPlural")}
            </Pill>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl bg-white/[0.04]" />
            ))}
          </div>
        ) : !reports || reports.length === 0 ? (
          <EmptyReports />
        ) : (
          <div className="space-y-2.5">
            {reports.map((report) => (
              <ReportRow key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── KPI tiles ────────────────────────────────────────────────────────────────

function KpiTile({
  label,
  value,
  variant,
  icon,
  title,
}: {
  label: string;
  value: React.ReactNode;
  variant: "green" | "purple" | "blue";
  icon: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="card-neon rounded-2xl" title={title}>
      <div className="relative flex items-center gap-4 p-5">
        <HexBadge variant={variant} size="md">
          {icon}
        </HexBadge>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
            {label}
          </p>
          <p className="text-stat mt-1 text-2xl text-[#ededed]">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  return (
    <PaywallOverlay feature="reports_exports" requiredTier="gold">
      <ReportsPageContent />
    </PaywallOverlay>
  );
}

function ReportsPageContent() {
  const { t } = useTranslations();
  const { data: reports, isLoading } = useQuery<GeneratedReport[]>({
    queryKey: ["reports"],
    queryFn: () => api.getReports(),
  });

  // B2.1 — Win rate KPI sourced from the dashboard metrics endpoint
  // (tier-scoped via access_filter on the backend; admin tier override
  // is auto-propagated by api.ts). ROI + Streak aren't computed on this
  // endpoint yet — they stay "—" until a dedicated metrics source ships,
  // with a tooltip so the dash isn't mistaken for zero.
  const { data: metrics } = useQuery({
    queryKey: ["dashboard-metrics-tier"],
    queryFn: () => api.getDashboardMetrics(),
    staleTime: 5 * 60_000,
  });

  const total = reports?.length ?? 0;
  const winRateValue =
    metrics && metrics.evaluated_count > 0
      ? `${(metrics.accuracy * 100).toFixed(1)}%`
      : "—";

  return (
    <div className="relative">
      {/* Ambient glow blobs */}
      <div className="relative mx-auto max-w-7xl px-0 sm:px-2 py-4 sm:py-6 md:py-8 space-y-5 sm:space-y-8 overflow-hidden">
        {/* Page header */}
        <div>
          <span className="section-label mb-3">
            <FileText className="h-3 w-3" />
            {t("reports.title")}
          </span>
          <h1 className="text-heading text-3xl text-[#ededed] sm:text-4xl">
            {t("reports.title")}
          </h1>
          <p className="mt-2 text-sm text-[#a3a9b8]">{t("reports.subtitle")}</p>
        </div>

        {/* KPI strip */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile
            label="Total reports"
            value={total}
            variant="green"
            icon={<FileText className="h-5 w-5" />}
          />
          <KpiTile
            label="Win rate"
            value={winRateValue}
            variant="purple"
            icon={<Sparkles className="h-5 w-5" />}
            title="Historical accuracy across your tier's evaluated picks (live, tier-scoped)."
          />
          <KpiTile
            label="ROI"
            value="—"
            variant="blue"
            icon={<Sparkles className="h-5 w-5" />}
            title="ROI isn't tier-scoped yet — arrives once the honest-ROI pipeline splits by tier."
          />
          <KpiTile
            label="Streak"
            value="—"
            variant="green"
            icon={<Sparkles className="h-5 w-5" />}
            title="Longest consecutive correct-pick streak — pending a tier-aware aggregation."
          />
        </div>

        <GenerateReportCard />
        <ReportsList reports={reports} isLoading={isLoading} />
      </div>
    </div>
  );
}
