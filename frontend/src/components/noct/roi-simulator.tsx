"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Euro, AlertTriangle, RefreshCw, Info } from "lucide-react";

export interface ROIData {
  stake_per_pick: number;
  total_picks: number;
  picks_with_odds: number;
  real_odds_count: number;
  implied_odds_count: number;
  correct_picks: number;
  accuracy: number;
  avg_odds: number;
  total_staked: number;
  total_return: number;
  net_profit: number;
  roi_pct: number;
}

const PRESETS = [5, 10, 25, 50, 100] as const;

interface ROISimulatorProps {
  pickTier?: string;
  source?: "all" | "live" | "backtest";
  days?: number;
  title?: string;
  subtitle?: string;
}

export function ROISimulator({
  pickTier,
  source = "all",
  days,
  title = "ROI Simulator",
  subtitle = "Hoeveel had je verdiend met deze picks?",
}: ROISimulatorProps) {
  const [stake, setStake] = useState(10);
  const [customInput, setCustomInput] = useState("");
  const [showOddsInfo, setShowOddsInfo] = useState(false);

  const handlePreset = useCallback((p: number) => {
    setStake(p);
    setCustomInput("");
  }, []);

  const handleCustom = useCallback((v: string) => {
    setCustomInput(v);
    const n = parseFloat(v);
    if (n >= 1 && n <= 10_000) setStake(n);
  }, []);

  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

  const { data, isLoading, refetch } = useQuery<ROIData>({
    queryKey: ["roi-simulation", stake, pickTier, source, days],
    queryFn: async () => {
      const p = new URLSearchParams({ stake: String(stake), source });
      if (pickTier && pickTier !== "all") p.append("pick_tier", pickTier);
      if (days) p.append("days", String(days));
      const res = await fetch(`${API}/trackrecord/roi?${p}`);
      if (!res.ok) throw new Error("ROI fetch failed");
      return res.json();
    },
    staleTime: 10 * 60_000,
  });

  const isProfit = (data?.net_profit ?? 0) >= 0;
  const hasPicks = data && data.total_picks > 0;
  const realPct = data && data.total_picks > 0
    ? Math.round((data.real_odds_count / data.total_picks) * 100)
    : 0;

  const fmt = (v: number) =>
    v.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="card-neon rounded-2xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
            <Euro className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className="text-[11px] text-slate-500">{subtitle}</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="rounded-lg p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
          title="Vernieuwen"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Stake selector */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Inzet per pick
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => handlePreset(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                stake === p && !customInput
                  ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              €{p}
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={10000}
            placeholder="Eigen bedrag"
            value={customInput}
            onChange={(e) => handleCustom(e.target.value)}
            className="w-28 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
          />
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : !hasPicks ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center">
          <p className="text-sm text-slate-400">Geen geëvalueerde picks beschikbaar.</p>
        </div>
      ) : (
        <>
          {/* Summary line */}
          <p className="text-[11px] text-slate-500">
            <span className="font-semibold text-slate-300">{data.total_picks} picks</span>
            {" · "}gem. odds{" "}
            <span className="font-semibold text-slate-300">{data.avg_odds}x</span>
            {" · "}nauwkeurigheid{" "}
            <span className="font-semibold text-slate-300">
              {Math.round(data.accuracy * 100)}%
            </span>
          </p>

          {/* Odds source breakdown — transparency badge */}
          <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
            <button
              onClick={() => setShowOddsInfo((v) => !v)}
              className="mt-0.5 shrink-0 text-blue-400 hover:text-blue-300 transition-colors"
              title="Meer info over oddsbronnen"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap gap-3 text-[11px]">
                <span>
                  <span className="font-semibold text-emerald-300">{data.real_odds_count}</span>
                  <span className="text-slate-400"> echte marktodds (API)</span>
                </span>
                {data.implied_odds_count > 0 && (
                  <span>
                    <span className="font-semibold text-amber-300">{data.implied_odds_count}</span>
                    <span className="text-slate-400"> berekend uit modelkans</span>
                  </span>
                )}
              </div>
              {showOddsInfo && (
                <p className="text-[11px] leading-relaxed text-slate-400 border-t border-white/10 pt-2 mt-2">
                  Voor <strong className="text-emerald-300">{data.real_odds_count} wedstrijden</strong> zijn echte bookmaker-odds gebruikt uit onze betaalde data-API.
                  {data.implied_odds_count > 0 && (
                    <> Voor de overige <strong className="text-amber-300">{data.implied_odds_count} picks</strong> waren geen marktodds beschikbaar — hier is een geschatte odd berekend op basis van de modelkans (1 ÷ kans × 0,95). Dit is een benadering, geen echte marktprijs.</>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCell label="Totaal ingezet" value={`€${fmt(data.total_staked)}`} />
            <StatCell label="Teruggekregen" value={`€${fmt(data.total_return)}`} />
            <StatCell
              label="Nettowinst"
              value={`${isProfit ? "+" : ""}€${fmt(data.net_profit)}`}
              highlight={isProfit ? "green" : "red"}
            />
            <StatCell
              label="ROI"
              value={
                <span className={`flex items-center gap-1 ${isProfit ? "text-emerald-300" : "text-red-300"}`}>
                  {isProfit ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {isProfit ? "+" : ""}
                  {data.roi_pct}%
                </span>
              }
              highlight={isProfit ? "green" : "red"}
            />
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <p className="text-[11px] leading-relaxed text-slate-400">
              Gesimuleerd op historische data. Toekomstige resultaten kunnen afwijken.
              {realPct < 100 && data.implied_odds_count > 0 && (
                <> {realPct}% van de picks gebruikt echte marktodds — de rest is een modelschatting.</>
              )}
              {" "}Geen financieel advies.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function StatCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: "green" | "red";
}) {
  const bg =
    highlight === "green"
      ? "bg-emerald-500/10"
      : highlight === "red"
      ? "bg-red-500/10"
      : "bg-white/5";
  const text =
    highlight === "green"
      ? "text-emerald-300"
      : highlight === "red"
      ? "text-red-300"
      : "text-white";
  return (
    <div className={`rounded-xl p-3 ${bg}`}>
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-bold ${text}`}>{value}</p>
    </div>
  );
}
