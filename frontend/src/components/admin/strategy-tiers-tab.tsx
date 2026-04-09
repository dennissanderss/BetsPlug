"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Save, FlaskConical } from "lucide-react";

export default function StrategyTiersTab() {
  const { data: strategies } = useQuery({
    queryKey: ["strategies"],
    queryFn: () => api.getStrategies(),
  });

  const [tiers, setTiers] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem("strategy_tiers");
    if (saved) setTiers(JSON.parse(saved));
  }, []);

  const save = () => {
    localStorage.setItem("strategy_tiers", JSON.stringify(tiers));
    alert("Saved!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-blue-400" />
          <h2 className="text-base font-bold text-slate-100">Strategy Tier Assignment</h2>
        </div>
        <button onClick={save} className="btn-gradient flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold">
          <Save className="h-4 w-4" /> Save
        </button>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Strategy</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {strategies?.map((s) => (
              <tr key={s.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-medium text-slate-200">{s.name}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {s.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={tiers[s.id] || "gold"}
                    onChange={(e) => setTiers(prev => ({...prev, [s.id]: e.target.value}))}
                    className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 focus:border-emerald-500/40 focus:outline-none"
                  >
                    <option value="free">Free</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="platinum">Platinum</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
