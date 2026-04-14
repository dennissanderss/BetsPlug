"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "@/i18n/locale-provider";
import { api } from "@/lib/api";
import { formatPercent, formatDateTime } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import type { Prediction } from "@/types/api";

function TableSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="h-4 w-32 rounded bg-white/[0.05]" />
          <div className="h-4 w-48 rounded bg-white/[0.05] flex-1" />
          <div className="h-4 w-20 rounded bg-white/[0.05]" />
          <div className="h-4 w-16 rounded bg-white/[0.05]" />
          <div className="h-4 w-16 rounded bg-white/[0.05]" />
        </div>
      ))}
    </div>
  );
}

function ResultBadge({ prediction }: { prediction: Prediction }) {
  const { t } = useTranslations();

  if (!prediction.evaluation) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-medium text-slate-400">
        <Clock className="h-3 w-3" />
        {t("dash.pending")}
      </span>
    );
  }
  if (prediction.evaluation.is_correct) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        {t("dash.correct")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400">
      <XCircle className="h-3 w-3" />
      {t("dash.incorrect")}
    </span>
  );
}

function PickBadge({ prediction }: { prediction: Prediction }) {
  const probs = [
    { label: "H", value: prediction.home_win_prob },
    ...(prediction.draw_prob !== null
      ? [{ label: "D", value: prediction.draw_prob }]
      : []),
    { label: "A", value: prediction.away_win_prob },
  ];
  const best = probs.reduce((a, b) => (a.value > b.value ? a : b));

  return (
    <span className="inline-flex items-center gap-1.5 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400">
      {best.label} {formatPercent(best.value, 0)}
    </span>
  );
}

export function RecentPredictionsTable() {
  const { t } = useTranslations();

  const { data: predictions, isLoading } = useQuery({
    queryKey: ["predictions-recent"],
    queryFn: () => api.getPredictions({ limit: "8", page: "1" }),
  });

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            {t("dash.recentPredictions")}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {t("dash.recentPredictionsDesc")}
          </p>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : !predictions?.items?.length ? (
        <div className="flex items-center justify-center py-16 text-sm text-slate-500">
          {t("dash.noPredictions")}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                  {[
                    t("dash.thDate"),
                    t("dash.thMatch"),
                    t("dash.thPredicted"),
                    t("dash.thConfidence"),
                    t("dash.thResult"),
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {predictions.items.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                      {formatDateTime(row.predicted_at)}
                    </td>
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
                    <td className="px-4 py-3">
                      <PickBadge prediction={row} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${row.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-slate-400">
                          {formatPercent(row.confidence, 0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ResultBadge prediction={row} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card layout */}
          <div className="sm:hidden divide-y divide-white/[0.04]">
            {predictions.items.map((row) => (
              <div key={row.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm text-slate-100">
                      {row.match
                        ? `${row.match.home_team_name} vs ${row.match.away_team_name}`
                        : t("dash.matchLoading")}
                    </p>
                    {row.match?.league_name && (
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {row.match.league_name}
                      </p>
                    )}
                  </div>
                  <ResultBadge prediction={row} />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <PickBadge prediction={row} />
                  <span className="tabular-nums">{formatPercent(row.confidence, 0)}</span>
                  <span>{formatDateTime(row.predicted_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
