"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PerTierStats {
  n: number;
  hit_pct: number | null;
  roi_pct: number | null;
}

interface PerTierEntry {
  lifetime: PerTierStats;
  last_30d: PerTierStats;
  last_14d: PerTierStats;
  live_only: PerTierStats;
}

interface PerTierResponse {
  per_tier: Record<"free" | "silver" | "gold" | "platinum", PerTierEntry>;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function fetchPerTierRoi(): Promise<PerTierResponse> {
  const r = await fetch(`${API}/trackrecord/per-tier-roi`);
  if (!r.ok) throw new Error("per-tier-roi fetch failed");
  return r.json();
}

interface Props {
  tier: "free" | "silver" | "gold" | "platinum";
}

export function TierRoiHeadline({ tier }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["per-tier-roi-headline"],
    queryFn: fetchPerTierRoi,
    refetchInterval: 5 * 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="glass-card p-4 h-[88px] animate-pulse rounded-xl bg-white/[0.04]" />
    );
  }

  const t = data.per_tier[tier];
  const last14 = t.last_14d;
  const lifetime = t.lifetime;

  const fmtRoi = (v: number | null) => {
    if (v == null) return { text: "—", color: "#64748b", icon: Minus };
    const sign = v >= 0 ? "+" : "";
    if (v >= 5) return { text: `${sign}${v.toFixed(1)}%`, color: "#4ade80", icon: TrendingUp };
    if (v >= 0) return { text: `${sign}${v.toFixed(1)}%`, color: "#facc15", icon: TrendingUp };
    return { text: `${sign}${v.toFixed(1)}%`, color: "#fb7185", icon: TrendingDown };
  };

  const r14 = fmtRoi(last14.roi_pct);
  const rLife = fmtRoi(lifetime.roi_pct);
  const Icon14 = r14.icon;

  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            {tierLabel} tier — laatste 14 dagen
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <Icon14 className="h-5 w-5" style={{ color: r14.color }} />
            <p
              className="text-3xl font-extrabold tabular-nums leading-none"
              style={{ color: r14.color }}
            >
              {r14.text}
            </p>
            <span className="text-xs text-slate-500">
              ROI op {last14.n} {last14.n === 1 ? "pick" : "picks"}
              {last14.hit_pct != null && ` · ${last14.hit_pct.toFixed(0)}% hit`}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Lifetime
          </p>
          <p
            className="mt-1 text-lg font-bold tabular-nums"
            style={{ color: rLife.color }}
          >
            {rLife.text}
          </p>
          <p className="text-[10px] text-slate-600">
            {lifetime.n} picks · sinds 16 apr
          </p>
        </div>
      </div>
    </div>
  );
}
