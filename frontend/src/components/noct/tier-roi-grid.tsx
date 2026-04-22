"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Euro, AlertTriangle, RefreshCw, Info } from "lucide-react";
import { TierEmblem } from "@/components/noct/tier-emblem";

interface TierROIStats {
  total_picks: number;
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

interface TierROIResponse {
  stake_per_pick: number;
  tiers: Record<string, TierROIStats>;
  all: TierROIStats;
}

const PRESETS = [5, 10, 25, 50, 100] as const;

const TIER_CONFIG = [
  { slug: "free",     label: "Free",     color: "text-slate-300",   ring: "ring-slate-500/30",  bg: "bg-slate-500/10" },
  { slug: "silver",   label: "Silver",   color: "text-slate-200",   ring: "ring-slate-400/30",  bg: "bg-slate-400/10" },
  { slug: "gold",     label: "Gold",     color: "text-amber-300",   ring: "ring-amber-500/30",  bg: "bg-amber-500/10" },
  { slug: "platinum", label: "Platinum", color: "text-sky-300",     ring: "ring-sky-500/30",    bg: "bg-sky-500/10"   },
] as const;

interface TierROIGridProps {
  source?: "all" | "live" | "backtest";
  days?: number;
  title?: string;
}

export function TierROIGrid({
  source = "all",
  days,
  title = "Rendement per tier",
}: TierROIGridProps) {
  const [stake, setStake] = useState(10);
  const [customInput, setCustomInput] = useState("");
  const [showInfo, setShowInfo] = useState(false);

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

  const { data, isLoading, isError, refetch } = useQuery<TierROIResponse>({
    queryKey: ["roi-tiers", stake, source, days],
    queryFn: async () => {
      const p = new URLSearchParams({ stake: String(stake), source });
      if (days) p.append("days", String(days));
      const res = await fetch(`${API}/trackrecord/roi/tiers?${p}`);
      if (!res.ok) throw new Error(`ROI tiers fetch failed: ${res.status}`);
      return res.json();
    },
    staleTime: 10 * 60_000,
    retry: 1,
  });

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
            <p className="text-[11px] text-slate-500">Gesimuleerd rendement per abonnementstier</p>
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

      {/* Tier cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TIER_CONFIG.map((t) => (
            <div key={t.slug} className="h-36 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-5 text-center space-y-2">
          <p className="text-sm font-semibold text-red-300">Kan geen data ophalen</p>
          <p className="text-xs text-slate-500">De backend server is niet bereikbaar of de endpoint bestaat nog niet. Probeer het later opnieuw.</p>
          <button onClick={() => refetch()} className="mt-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition-colors">
            Opnieuw proberen
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TIER_CONFIG.map((t) => {
              const stats = data?.tiers[t.slug];
              const hasData = stats && stats.total_picks > 0;
              const isProfit = (stats?.net_profit ?? 0) >= 0;

              return (
                <div
                  key={t.slug}
                  className={`rounded-xl ring-1 p-4 flex flex-col gap-3 ${t.bg} ${t.ring}`}
                >
                  {/* Tier label */}
                  <div className="flex items-center gap-2">
                    <TierEmblem tier={t.slug as any} size="sm" />
                    <span className={`text-xs font-bold ${t.color}`}>{t.label}</span>
                  </div>

                  {!hasData ? (
                    <p className="text-[11px] text-slate-400">Geen geëvalueerde picks</p>
                  ) : (
                    <>
                      {/* ROI — big number */}
                      <div className="flex items-center gap-1">
                        {isProfit ? (
                          <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-400 shrink-0" />
                        )}
                        <span className={`text-xl font-black ${isProfit ? "text-emerald-300" : "text-red-300"}`}>
                          {isProfit ? "+" : ""}{stats.roi_pct}%
                        </span>
                      </div>

                      {/* Secondary stats */}
                      <div className="space-y-0.5 text-[10px] text-slate-500">
                        <p>
                          <span className="text-slate-300 font-semibold">{stats.total_picks}</span> picks
                          {" · "}
                          <span className="text-slate-300 font-semibold">{Math.round(stats.accuracy * 100)}%</span> raak
                        </p>
                        <p>
                          Netto:{" "}
                          <span className={`font-semibold ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                            {isProfit ? "+" : ""}€{fmt(stats.net_profit)}
                          </span>
                        </p>
                        <p>Gem. odds: <span className="text-slate-300 font-semibold">{stats.avg_odds}x</span></p>
                      </div>

                      {/* Odds source badge */}
                      {stats.implied_odds_count > 0 && (
                        <p className="text-[10px] text-amber-400/80">
                          {stats.real_odds_count > 0
                            ? `${stats.real_odds_count} echt · ${stats.implied_odds_count} geschat`
                            : `${stats.implied_odds_count} geschat (modelkans)`}
                        </p>
                      )}
                      {stats.implied_odds_count === 0 && stats.real_odds_count > 0 && (
                        <p className="text-[10px] text-emerald-400/80">Alle odds echt (API)</p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Odds transparency info */}
          <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
            <button
              onClick={() => setShowInfo((v) => !v)}
              className="mt-0.5 shrink-0 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
            <div>
              <p className="text-[11px] text-slate-400">
                <span className="text-emerald-300 font-semibold">Echte odds</span> komen uit onze betaalde data-API.{" "}
                <span className="text-amber-300 font-semibold">Geschatte odds</span> zijn berekend via 1 ÷ modelkans × 0,95 — een benadering, geen echte marktprijs.
                {!showInfo && (
                  <button onClick={() => setShowInfo(true)} className="ml-1 underline text-blue-400 hover:text-blue-300">Meer info</button>
                )}
              </p>
              {showInfo && (
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 border-t border-white/10 pt-2">
                  Voor wedstrijden waarbij geen bookmaker-odds beschikbaar zijn in onze database, berekenen we een geschatte odd op basis van de modelkans. Voorbeeld: modelkans 70% → geschatte odd = 1 ÷ 0,70 × 0,95 = 1,36. Dit simuleert wat een gemiddelde bookmaker zou aanbieden. De berekening is eerlijk en herhaalbaar, maar is <strong>geen echte marktprijs</strong>.
                </p>
              )}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <p className="text-[11px] leading-relaxed text-slate-400">
              Gesimuleerd op historische data. Toekomstige resultaten kunnen afwijken. Geen financieel advies.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
