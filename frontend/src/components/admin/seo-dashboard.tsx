"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, CheckCircle2, AlertTriangle, XCircle, FileCheck, Bot } from "lucide-react";
import type { PageSeoScore } from "@/types/api";

// ─── Score color helpers ─────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-500/15";
  if (score >= 60) return "bg-amber-500/15";
  return "bg-red-500/15";
}

function ScoreDot({ status }: { status: "good" | "needs_improvement" | "poor" }) {
  const colorMap: Record<string, string> = {
    good: "bg-green-400 shadow-green-400/50",
    needs_improvement: "bg-amber-400 shadow-amber-400/50",
    poor: "bg-red-400 shadow-red-400/50",
  };
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full shadow-sm",
        colorMap[status] ?? "bg-slate-400"
      )}
    />
  );
}

function BoolDot({ value }: { value: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full shadow-sm",
        value ? "bg-green-400 shadow-green-400/50" : "bg-red-400 shadow-red-400/50"
      )}
    />
  );
}

// ─── SEO Dashboard ───────────────────────────────────────────────────────────

export default function SeoDashboard() {
  const { data: pages, isLoading } = useQuery<PageSeoScore[]>({
    queryKey: ["admin-seo-audit"],
    queryFn: () => api.getAdminSeoAudit(),
  });

  // Calculate overall site score
  const overallScore =
    pages && pages.length > 0
      ? Math.round(pages.reduce((sum, p) => sum + p.overall_score, 0) / pages.length)
      : null;

  return (
    <div className="space-y-6">
      {/* Top row: Overall score + Sitemap/Robots status */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Overall SEO Score */}
        <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center text-center">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="mx-auto h-16 w-16 rounded-full bg-white/[0.06]" />
              <Skeleton className="mx-auto h-4 w-24 bg-white/[0.04]" />
            </div>
          ) : overallScore !== null ? (
            <>
              <div
                className={cn(
                  "flex h-20 w-20 items-center justify-center rounded-full",
                  getScoreBgColor(overallScore)
                )}
              >
                <span className={cn("text-3xl font-bold tabular-nums", getScoreColor(overallScore))}>
                  {overallScore}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-100">Overall SEO Score</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Across {pages?.length ?? 0} page{(pages?.length ?? 0) !== 1 ? "s" : ""}
              </p>
            </>
          ) : (
            <>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04]">
                <Search className="h-6 w-6 text-slate-500" />
              </div>
              <p className="text-sm text-slate-400">No SEO data available.</p>
            </>
          )}
        </div>

        {/* Sitemap status */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <FileCheck className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">Sitemap</p>
              <p className="text-xs text-slate-500">/sitemap.xml</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-400 shadow-sm shadow-green-400/50" />
            <span className="text-xs font-medium text-green-400">Present</span>
          </div>
        </div>

        {/* Robots.txt status */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <Bot className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">Robots.txt</p>
              <p className="text-xs text-slate-500">/robots.txt</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-400 shadow-sm shadow-green-400/50" />
            <span className="text-xs font-medium text-green-400">Present</span>
          </div>
        </div>
      </div>

      {/* Per-page SEO table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Page SEO Scores</h3>
            <p className="text-xs text-slate-500">Per-page audit breakdown</p>
          </div>
          {!isLoading && pages && (
            <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-medium tabular-nums text-slate-300">
              {pages.length} page{pages.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Path", "Title Score", "Meta Score", "OG Tags", "Schema", "Overall"].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      "px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500",
                      ["OG Tags", "Schema", "Overall"].includes(h) ? "text-center" : "text-left"
                    )}
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
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-5 py-3">
                          <Skeleton className="h-4 w-full bg-white/[0.04]" />
                        </td>
                      ))}
                    </tr>
                  ))
                : (pages ?? []).length === 0
                ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">
                        No pages audited yet.
                      </td>
                    </tr>
                  )
                : (pages ?? []).map((page, idx) => (
                    <tr
                      key={page.path}
                      className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-3">
                        <p className="font-mono text-xs text-slate-300">{page.path}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500 max-w-xs">
                          {page.title}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <ScoreDot status={page.title_score} />
                          <span className="text-xs capitalize text-slate-400">
                            {page.title_score.replace("_", " ")}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <ScoreDot status={page.meta_score} />
                          <span className="text-xs capitalize text-slate-400">
                            {page.meta_score.replace("_", " ")}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center">
                          <BoolDot value={page.has_og_tags} />
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center">
                          <BoolDot value={page.has_schema} />
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
                            getScoreBgColor(page.overall_score),
                            getScoreColor(page.overall_score)
                          )}
                        >
                          {page.overall_score}
                        </span>
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
