"use client";

import { useQuery } from "@tanstack/react-query";
import { Target, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

interface WeeklyBucket {
  iso_week: string;
  n: number;
  won: number;
  hit_rate_pct: number;
  pnl_units: number;
  roi_pct: number;
}

interface CumulativePoint {
  n: number;
  scheduled_at: string;
  cumulative_pnl_units: number;
  cumulative_roi_pct: number;
}

interface EdgeVerifiedLiveResponse {
  recipe: {
    confidence_min: number;
    edge_min_pct: number;
    explainer?: string;
  };
  n_total: number;
  won?: number;
  lost?: number;
  hit_rate_pct: number | null;
  wilson_ci_low?: number;
  wilson_ci_high?: number;
  roi_pct: number | null;
  pnl_units: number;
  avg_odds: number | null;
  avg_edge_pct: number | null;
  weekly: WeeklyBucket[];
  cumulative?: CumulativePoint[];
  milestone_n_for_headline_claim: number;
  headline_claim_unlocked: boolean;
  first_pick_at?: string;
  last_pick_at?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function fetchEdgeVerifiedLive(): Promise<EdgeVerifiedLiveResponse> {
  const r = await fetch(`${API}/trackrecord/edge-verified-live`);
  if (!r.ok) throw new Error("edge-verified-live fetch failed");
  return r.json();
}

export function EdgeVerifiedLiveSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["edge-verified-live"],
    queryFn: fetchEdgeVerifiedLive,
    refetchInterval: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="h-32 animate-pulse rounded-lg bg-white/[0.04]" />
      </div>
    );
  }
  if (isError || !data) {
    return null;
  }

  const milestoneProgress = Math.min(
    100,
    (data.n_total / data.milestone_n_for_headline_claim) * 100,
  );

  const roiColor =
    (data.roi_pct ?? 0) >= 5
      ? "text-emerald-300"
      : (data.roi_pct ?? 0) >= 0
        ? "text-amber-300"
        : "text-rose-400";
  const roiBg =
    (data.roi_pct ?? 0) >= 5
      ? "from-emerald-500/15 to-emerald-900/5"
      : (data.roi_pct ?? 0) >= 0
        ? "from-amber-500/10 to-amber-900/5"
        : "from-rose-500/10 to-rose-900/5";

  return (
    <div className="glass-card overflow-hidden border border-emerald-500/20">
      <div className="border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
            <Target className="h-5 w-5 text-emerald-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-slate-100">
                Edge-verified live measurement
              </h2>
              <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                conf ≥ {(data.recipe.confidence_min * 100).toFixed(0)}% · edge ≥ {data.recipe.edge_min_pct.toFixed(0)}%
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {data.recipe.explainer ??
                "Live picks where the model's probability is at least 10% above the bookmaker's vig-removed fair price."}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Headline KPIs */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className={`rounded-xl border border-white/[0.06] bg-gradient-to-br ${roiBg} p-4`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Live ROI</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${roiColor}`}>
              {data.roi_pct == null ? "—" : `${data.roi_pct >= 0 ? "+" : ""}${data.roi_pct.toFixed(2)}%`}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {data.pnl_units >= 0 ? "+" : ""}
              {data.pnl_units.toFixed(2)}u net
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Hit rate</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-100">
              {data.hit_rate_pct == null ? "—" : `${data.hit_rate_pct.toFixed(1)}%`}
            </p>
            {data.wilson_ci_low != null && data.wilson_ci_high != null && (
              <p className="mt-1 text-[11px] text-slate-500">
                95% CI {(data.wilson_ci_low * 100).toFixed(1)}–{(data.wilson_ci_high * 100).toFixed(1)}%
              </p>
            )}
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Picks</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-100">
              {data.n_total}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {data.won ?? 0} won · {data.lost ?? 0} lost
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Avg odds / edge</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-100">
              {data.avg_odds == null ? "—" : data.avg_odds.toFixed(2)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {data.avg_edge_pct == null ? "" : `${data.avg_edge_pct.toFixed(1)}% avg edge`}
            </p>
          </div>
        </div>

        {/* Milestone progress */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-300">
                {data.headline_claim_unlocked ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Sample milestone reached
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-slate-300">
                    <TrendingUp className="h-3.5 w-3.5 text-amber-300" />
                    Building sample for headline claim
                  </span>
                )}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                {data.headline_claim_unlocked
                  ? `Live n=${data.n_total} on this recipe with ROI ≥ +5% — the marketing claim is sample-defensible.`
                  : `Need n ≥ ${data.milestone_n_for_headline_claim} live picks AND ROI ≥ +5% before promoting Edge-verified to the headline. Currently n=${data.n_total}.`}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xl font-bold tabular-nums text-slate-100">
                {data.n_total} / {data.milestone_n_for_headline_claim}
              </p>
              <p className="text-[10px] text-slate-500">picks toward milestone</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all"
              style={{ width: `${milestoneProgress}%` }}
            />
          </div>
        </div>

        {/* Weekly table */}
        {data.weekly.length > 0 ? (
          <div>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Per ISO-week
            </h3>
            <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2">Week</th>
                    <th className="px-4 py-2 text-right">Picks</th>
                    <th className="px-4 py-2 text-right">Hit</th>
                    <th className="px-4 py-2 text-right">P/L</th>
                    <th className="px-4 py-2 text-right">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {data.weekly.map((w) => (
                    <tr key={w.iso_week} className="border-t border-white/[0.04]">
                      <td className="px-4 py-2 font-mono text-[11px] text-slate-400">{w.iso_week}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-200">{w.n}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-200">
                        {w.hit_rate_pct.toFixed(0)}%
                      </td>
                      <td
                        className={`px-4 py-2 text-right tabular-nums ${
                          w.pnl_units >= 0 ? "text-emerald-300" : "text-rose-400"
                        }`}
                      >
                        {w.pnl_units >= 0 ? "+" : ""}
                        {w.pnl_units.toFixed(2)}u
                      </td>
                      <td
                        className={`px-4 py-2 text-right tabular-nums font-semibold ${
                          w.roi_pct >= 0 ? "text-emerald-300" : "text-rose-400"
                        }`}
                      >
                        {w.roi_pct >= 0 ? "+" : ""}
                        {w.roi_pct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p>
              Geen live picks geboekt op deze recipe. Sample groeit naarmate de cron
              live picks ingest die confidence ≥ 62% en edge ≥ 10% halen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
