"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp, AlertTriangle, Trophy, Sparkles, Star, Crown } from "lucide-react";

interface PerTierStats {
  n: number;
  hit_pct: number | null;
  roi_pct: number | null;
  pnl_units: number;
  avg_odds: number | null;
}

interface PerTierEntry {
  lifetime: PerTierStats;
  last_30d: PerTierStats;
  last_14d: PerTierStats;
  live_only: PerTierStats;
  recipe: {
    min_confidence: number;
    min_edge_pct: number | null;
    min_odds: number | null;
    max_odds: number | null;
  };
}

interface DailyPoint {
  date: string;
  n: number;
  won: number;
  roi_pct: number | null;
  cumulative_n: number;
  cumulative_roi_pct: number | null;
}

interface MilestoneEntry {
  n_live: number;
  roi_live_pct: number | null;
  n_required: number;
  roi_required_pct: number;
  unlocked: boolean;
}

interface PerTierResponse {
  per_tier: {
    free: PerTierEntry;
    silver: PerTierEntry;
    gold: PerTierEntry;
    platinum: PerTierEntry;
  };
  daily_breakdown_14d?: Record<string, DailyPoint[]>;
  marketing_claim_milestones?: Record<string, MilestoneEntry>;
  generated_at: string;
  disclaimer: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function fetchPerTierRoi(): Promise<PerTierResponse> {
  const r = await fetch(`${API}/trackrecord/per-tier-roi`);
  if (!r.ok) throw new Error("per-tier-roi fetch failed");
  return r.json();
}

const TIER_META: Record<string, { label: string; color: string; icon: typeof Trophy; gradient: string }> = {
  free: {
    label: "Free",
    color: "#94a3b8",
    icon: Sparkles,
    gradient: "from-slate-500/8 to-slate-900/2",
  },
  silver: {
    label: "Silver",
    color: "#cbd5e1",
    icon: Star,
    gradient: "from-slate-300/8 to-slate-700/3",
  },
  gold: {
    label: "Gold",
    color: "#facc15",
    icon: Trophy,
    gradient: "from-yellow-500/10 to-amber-900/3",
  },
  platinum: {
    label: "Platinum",
    color: "#a5b4fc",
    icon: Crown,
    gradient: "from-indigo-500/10 to-violet-900/3",
  },
};

function fmtRoi(v: number | null): { text: string; color: string } {
  if (v == null) return { text: "—", color: "#64748b" };
  const sign = v >= 0 ? "+" : "";
  const color = v >= 5 ? "#4ade80" : v >= 0 ? "#facc15" : "#fb7185";
  return { text: `${sign}${v.toFixed(2)}%`, color };
}

export function PerTierPerformanceSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["per-tier-roi"],
    queryFn: fetchPerTierRoi,
    refetchInterval: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="h-48 animate-pulse rounded-lg bg-white/[0.04]" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="glass-card p-6 flex items-center gap-2 text-amber-300">
        <AlertTriangle className="h-4 w-4" />
        <span>Kon prestatie-cijfers niet laden.</span>
      </div>
    );
  }

  const tiers: Array<keyof typeof data.per_tier> = ["free", "silver", "gold", "platinum"];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {tiers.map((tier) => {
          const meta = TIER_META[tier];
          const t = data.per_tier[tier];
          const Icon = meta.icon;

          return (
            <div
              key={tier}
              className={`glass-card overflow-hidden bg-gradient-to-br ${meta.gradient}`}
              style={{ borderColor: `${meta.color}33` }}
            >
              <div className="flex items-start gap-3 border-b border-white/[0.06] px-5 py-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${meta.color}20`, color: meta.color }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-[#ededed]">{meta.label}</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Filter: conf ≥ {(t.recipe.min_confidence * 100).toFixed(0)}%
                    {t.recipe.min_edge_pct != null && ` · edge ≥ ${t.recipe.min_edge_pct}%`}
                    {t.recipe.min_odds != null && ` · odds ≥ ${t.recipe.min_odds.toFixed(2)}`}
                    {t.recipe.max_odds != null && ` · odds ≤ ${t.recipe.max_odds.toFixed(2)}`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-white/[0.05]">
                {([
                  { label: "14 dagen", v: t.last_14d },
                  { label: "30 dagen", v: t.last_30d },
                  { label: "Lifetime", v: t.lifetime },
                ] as const).map(({ label, v }) => {
                  const roi = fmtRoi(v.roi_pct);
                  return (
                    <div key={label} className="px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {label}
                      </p>
                      <p
                        className="mt-1 text-xl font-bold tabular-nums"
                        style={{ color: roi.color }}
                      >
                        {roi.text}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {v.n === 0 ? "—" : `${v.n} picks · ${v.hit_pct?.toFixed(0) ?? "—"}% hit`}
                      </p>
                    </div>
                  );
                })}
              </div>

              {t.live_only.n > 0 && (
                <div className="border-t border-white/[0.05] bg-white/[0.02] px-5 py-2 text-[11px] flex items-center justify-between">
                  <span className="text-slate-500">Alleen live (sinds 16 apr)</span>
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: fmtRoi(t.live_only.roi_pct).color }}
                  >
                    {fmtRoi(t.live_only.roi_pct).text}
                    <span className="text-slate-600"> · n={t.live_only.n}</span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {data.marketing_claim_milestones && (
        <div className="glass-card p-5">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-slate-100">Marketing-claim milestones</h3>
            <p className="mt-1 text-xs text-slate-500">
              Per tier: live n ≥ 100 picks AND live ROI ≥ +5% nodig voordat we de tier-claim als headline mogen pushen. Phase 9 monitoring.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => {
              const m = data.marketing_claim_milestones?.[tier];
              if (!m) return null;
              const meta = TIER_META[tier];
              const nProgress = Math.min(100, (m.n_live / m.n_required) * 100);
              const roi = fmtRoi(m.roi_live_pct);
              return (
                <div
                  key={tier}
                  className="rounded-xl border p-3"
                  style={{
                    borderColor: m.unlocked ? "#4ade8055" : "rgba(255,255,255,0.06)",
                    background: m.unlocked ? "rgba(74,222,128,0.04)" : undefined,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold" style={{ color: meta.color }}>
                      {meta.label}
                    </p>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: m.unlocked ? "#4ade80" : "#94a3b8" }}
                    >
                      {m.unlocked ? "✓ unlocked" : "building"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between text-xs">
                    <span className="text-slate-400">Picks</span>
                    <span className="font-semibold tabular-nums text-slate-200">
                      {m.n_live} / {m.n_required}
                    </span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${nProgress}%`, background: meta.color }}
                    />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between text-xs">
                    <span className="text-slate-400">Live ROI</span>
                    <span className="font-semibold tabular-nums" style={{ color: roi.color }}>
                      {roi.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.daily_breakdown_14d && (
        <details className="glass-card overflow-hidden">
          <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/[0.02]">
            Daily breakdown (14 dagen) ▾
          </summary>
          <div className="space-y-4 p-5">
            {tiers.map((tier) => {
              const days = data.daily_breakdown_14d?.[tier] ?? [];
              if (days.length === 0) return null;
              const meta = TIER_META[tier];
              return (
                <div key={tier}>
                  <p className="mb-2 text-xs font-semibold" style={{ color: meta.color }}>
                    {meta.label}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs tabular-nums">
                      <thead>
                        <tr className="text-slate-500">
                          <th className="px-2 py-1 text-left">Datum</th>
                          <th className="px-2 py-1 text-right">Picks</th>
                          <th className="px-2 py-1 text-right">Won</th>
                          <th className="px-2 py-1 text-right">Daily ROI</th>
                          <th className="px-2 py-1 text-right">Cum n</th>
                          <th className="px-2 py-1 text-right">Cum ROI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {days.map((d) => {
                          const roi = fmtRoi(d.roi_pct);
                          const cum = fmtRoi(d.cumulative_roi_pct);
                          return (
                            <tr key={d.date} className="border-t border-white/[0.04]">
                              <td className="px-2 py-1 font-mono text-[11px] text-slate-400">{d.date}</td>
                              <td className="px-2 py-1 text-right text-slate-300">{d.n || "—"}</td>
                              <td className="px-2 py-1 text-right text-slate-300">{d.n ? d.won : "—"}</td>
                              <td className="px-2 py-1 text-right" style={{ color: roi.color }}>{roi.text}</td>
                              <td className="px-2 py-1 text-right text-slate-300">{d.cumulative_n}</td>
                              <td className="px-2 py-1 text-right" style={{ color: cum.color }}>{cum.text}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      )}

      <p className="text-[11px] text-slate-500 leading-relaxed">
        {data.disclaimer}
      </p>
    </div>
  );
}
