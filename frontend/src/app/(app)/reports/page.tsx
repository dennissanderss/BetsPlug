"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Play, AlertTriangle, Clock } from "lucide-react";

import { api } from "@/lib/api";
import { cn, formatDateTime } from "@/lib/utils";
import type { GeneratedReport } from "@/types/api";

import { Skeleton } from "@/components/ui/skeleton";

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
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04]">
        <FileText className="h-6 w-6 text-slate-500" />
      </div>
      <p className="text-sm font-medium text-slate-400">No reports generated yet</p>
      <p className="mt-1 text-xs text-slate-500">
        Use the form above to generate your first simulation report.
      </p>
    </div>
  );
}

// ─── Generate form ────────────────────────────────────────────────────────────

interface GenerateFormState {
  report_type: string;
  format: string;
}

function GenerateReportCard() {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState<GenerateFormState>({
    report_type: "weekly",
    format: "pdf",
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.generateReport({
        report_type: form.report_type,
        format: form.format,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const handleGenerate = () => {
    mutation.reset();
    mutation.mutate();
  };

  return (
    <div className="glass-card rounded-xl p-6 animate-fade-in">
      {/* Card header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
          <Play className="h-4 w-4 text-blue-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Generate Report</h2>
          <p className="text-xs text-slate-400">
            Produce a new simulation export —{" "}
            <span className="font-semibold text-amber-400">SIMULATION ONLY</span>
            , all outputs are hypothetical.
          </p>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Report type */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Report Type</label>
          <select
            value={form.report_type}
            onChange={(e) => setForm((f) => ({ ...f, report_type: e.target.value }))}
            className="h-9 w-44 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-200 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors"
          >
            <option value="weekly" className="bg-[#111827]">Weekly Summary</option>
            <option value="monthly" className="bg-[#111827]">Monthly Summary</option>
            <option value="custom" className="bg-[#111827]">Custom Range</option>
          </select>
        </div>

        {/* Format */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Format</label>
          <select
            value={form.format}
            onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))}
            className="h-9 w-36 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-200 outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors"
          >
            <option value="pdf" className="bg-[#111827]">PDF</option>
            <option value="csv" className="bg-[#111827]">CSV</option>
            <option value="json" className="bg-[#111827]">JSON</option>
          </select>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={mutation.isPending}
          className="btn-gradient inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
        >
          {mutation.isPending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Generating…
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Generate Report
            </>
          )}
        </button>
      </div>

      {/* Status feedback */}
      {mutation.isSuccess && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm animate-fade-in">
          <span className="h-2 w-2 shrink-0 rounded-full bg-green-400" />
          <p className="text-green-300">
            Report job queued successfully. The report will appear in the list below once ready.
          </p>
        </div>
      )}
      {mutation.isError && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm animate-fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <p className="text-red-300">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Failed to generate report. Please try again."}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Reports list ─────────────────────────────────────────────────────────────

function ReportRow({ report }: { report: GeneratedReport }) {
  return (
    <div className="glass-card-hover flex items-center gap-4 rounded-xl px-5 py-4 transition-all">
      {/* Icon + title */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
          <FileText className="h-4 w-4 text-blue-400" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-100">{report.title}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            <Clock className="mr-1 inline h-3 w-3" />
            {formatDateTime(report.created_at)}
          </p>
        </div>
      </div>

      {/* Type badge */}
      <span className="hidden shrink-0 rounded-md border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-xs font-medium capitalize text-slate-300 sm:inline-block">
        {formatTypeLabel(report.file_format)}
      </span>

      {/* Format chip */}
      <span className="hidden shrink-0 rounded bg-white/[0.06] px-2 py-0.5 font-mono text-xs uppercase text-slate-400 sm:inline-block">
        {report.file_format}
      </span>

      {/* Size */}
      <span className="hidden shrink-0 text-right text-xs tabular-nums text-slate-500 md:block">
        {formatBytes(report.file_size_bytes)}
      </span>

      {/* Status pill */}
      <span className="shrink-0 rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-semibold text-green-400">
        Ready
      </span>

      {/* Download */}
      <a
        href={api.getReportDownloadUrl(report.id)}
        download
        target="_blank"
        rel="noreferrer"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400 transition-colors hover:border-blue-400/50 hover:bg-blue-500/20 hover:text-blue-300"
      >
        <Download className="h-3.5 w-3.5" />
        Download
      </a>
    </div>
  );
}

function ReportsList({ reports, isLoading }: { reports?: GeneratedReport[]; isLoading: boolean }) {
  return (
    <div className="glass-card rounded-xl p-6 animate-slide-up">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Generated Reports</h2>
          <p className="text-xs text-slate-400">
            All available simulation reports —{" "}
            <span className="font-medium text-amber-400">SIMULATION ONLY</span>
          </p>
        </div>
        {!isLoading && reports && reports.length > 0 && (
          <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-medium tabular-nums text-slate-300">
            {reports.length} {reports.length === 1 ? "report" : "reports"}
          </span>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      ) : !reports || reports.length === 0 ? (
        <EmptyReports />
      ) : (
        <div className="space-y-2">
          {reports.map((report) => (
            <ReportRow key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { data: reports, isLoading } = useQuery<GeneratedReport[]>({
    queryKey: ["reports"],
    queryFn: () => api.getReports(),
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between animate-fade-in">
        <div>
          <h1 className="gradient-text text-2xl font-bold tracking-tight">
            Reports &amp; Exports
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Generate and download simulation performance reports
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          Simulation Only
        </span>
      </div>

      {/* Disclaimer banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-5 py-4 animate-fade-in">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <p className="text-xs leading-relaxed text-slate-300">
          <span className="font-semibold text-amber-400">SIMULATION ONLY</span> — All reports and
          exports are based on historical model simulations. Not financial or betting advice.
        </p>
      </div>

      {/* Generate form */}
      <GenerateReportCard />

      {/* Reports list */}
      <ReportsList reports={reports} isLoading={isLoading} />
    </div>
  );
}
