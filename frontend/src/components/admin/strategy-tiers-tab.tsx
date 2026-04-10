"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Save, FlaskConical, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StrategyMetrics {
  winrate: number;
  roi: number;
  sample_size: number;
  has_data: boolean;
}

export default function StrategyTiersTab() {
  const { data: strategies, isLoading } = useQuery({
    queryKey: ["strategies"],
    queryFn: () => api.getStrategies(),
  });

  const [tiers, setTiers] = useState<Record<string, string>>({});
  const [metrics, setMetrics] = useState<Record<string, StrategyMetrics>>({});
  const [expandedSports, setExpandedSports] = useState<Set<string>>(new Set(["Football"]));

  useEffect(() => {
    const saved = localStorage.getItem("strategy_tiers");
    if (saved) setTiers(JSON.parse(saved));
  }, []);

  // Fetch metrics for each strategy
  useEffect(() => {
    if (!strategies) return;
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    strategies.forEach(async (s) => {
      try {
        const resp = await fetch(`${API}/strategies/${s.id}/metrics`);
        const data = await resp.json();
        setMetrics((prev) => ({ ...prev, [s.id]: data }));
      } catch {
        // ignore
      }
    });
  }, [strategies]);

  const save = () => {
    localStorage.setItem("strategy_tiers", JSON.stringify(tiers));
    alert("Tier assignments saved!");
  };

  const toggleSport = (sport: string) => {
    setExpandedSports((prev) => {
      const next = new Set(prev);
      if (next.has(sport)) next.delete(sport);
      else next.add(sport);
      return next;
    });
  };

  // Group strategies by sport (for now all are Football)
  const sportGroups: Record<string, typeof strategies> = {};
  strategies?.forEach((s) => {
    const sport = "Football"; // TODO: use s.sport when multi-sport is added
    if (!sportGroups[sport]) sportGroups[sport] = [];
    sportGroups[sport]!.push(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-blue-400" />
          <h2 className="text-base font-bold text-slate-100">Strategy Tier Assignment</h2>
        </div>
        <button
          onClick={save}
          className="btn-gradient flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold"
        >
          <Save className="h-4 w-4" /> Save
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Assign each strategy to a subscription tier. Users on that tier (or higher) can access the strategy.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : (
        Object.entries(sportGroups).map(([sport, sportStrategies]) => (
          <div key={sport} className="glass-card overflow-hidden">
            {/* Sport header — collapsible */}
            <button
              onClick={() => toggleSport(sport)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">⚽</span>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-100">{sport}</p>
                  <p className="text-[10px] text-slate-500">
                    {sportStrategies?.length} strategies · {sportStrategies?.filter((s) => s.is_active).length} active
                  </p>
                </div>
              </div>
              {expandedSports.has(sport) ? (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-500" />
              )}
            </button>

            {/* Strategy table */}
            {expandedSports.has(sport) && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Strategy
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Win Rate
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      ROI
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Sample
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Tier
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {sportStrategies?.map((s) => {
                    const m = metrics[s.id];
                    return (
                      <tr key={s.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-medium text-slate-200">{s.name}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-semibold border",
                              s.is_active
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            )}
                          >
                            {s.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">
                          {m?.has_data ? (
                            <span className={m.winrate > 0.5 ? "text-emerald-400" : "text-red-400"}>
                              {(m.winrate * 100).toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">
                          {m?.has_data ? (
                            <span className={m.roi >= 0 ? "text-emerald-400" : "text-red-400"}>
                              {m.roi >= 0 ? "+" : ""}
                              {(m.roi * 100).toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-slate-400">
                          {m?.has_data ? m.sample_size : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={tiers[s.id] || "gold"}
                            onChange={(e) => setTiers((prev) => ({ ...prev, [s.id]: e.target.value }))}
                            className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 focus:border-emerald-500/40 focus:outline-none"
                          >
                            <option value="free">Free</option>
                            <option value="silver">Silver</option>
                            <option value="gold">Gold</option>
                            <option value="platinum">Platinum</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ))
      )}
    </div>
  );
}
