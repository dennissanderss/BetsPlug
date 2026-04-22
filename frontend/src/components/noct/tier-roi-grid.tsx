"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Euro,
  AlertTriangle,
  RefreshCw,
  Info,
  Sparkles,
} from "lucide-react";
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
  { slug: "free",     label: "Free",     color: "text-slate-300",  ring: "ring-slate-500/30", bg: "bg-slate-500/10" },
  { slug: "silver",   label: "Silver",   color: "text-slate-200",  ring: "ring-slate-400/30", bg: "bg-slate-400/10" },
  { slug: "gold",     label: "Gold",     color: "text-amber-300",  ring: "ring-amber-500/30", bg: "bg-amber-500/10" },
  { slug: "platinum", label: "Platinum", color: "text-sky-300",    ring: "ring-sky-500/30",   bg: "bg-sky-500/10"   },
] as const;

interface TierROIGridProps {
  source?: "all" | "live" | "backtest";
  days?: number;
  title?: string;
  subtitle?: string;
}

export function TierROIGrid({
  source = "all",
  days,
  title = "Rendement per tier",
  subtitle = "Wat had je verdiend als je elke pick had gespeeld?",
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

  const all = data?.all;
  const allProfit = (all?.net_profit ?? 0) >= 0;
  const realPct = all && all.total_picks > 0
    ? Math.round((all.real_odds_count / all.total_picks) * 100)
    : 0;

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

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-xl bg-white/5" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TIER_CONFIG.map((t) => (
              <div key={t.slug} className="h-36 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-5 text-center space-y-2">
          <p className="text-sm font-semibold text-red-300">Kan data niet ophalen</p>
          <p className="text-xs text-slate-500">
            De server is tijdelijk niet bereikbaar. Probeer het zo nog eens.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition-colors"
          >
            Opnieuw proberen
          </button>
        </div>
      ) : !all || all.total_picks === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center">
          <p className="text-sm text-slate-400">Nog geen geëvalueerde picks beschikbaar.</p>
          <p className="mt-1 text-xs text-slate-600">
            Zodra wedstrijden afgelopen zijn verschijnen de resultaten hier.
          </p>
        </div>
      ) : (
        <>
          {/* ── Alle tiers samen — hero row ─────────────────── */}
          <div className={`rounded-xl ring-1 p-4 ${allProfit ? "bg-emerald-500/5 ring-emerald-500/20" : "bg-red-500/5 ring-red-500/20"}`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkles className={`h-4 w-4 ${allProfit ? "text-emerald-400" : "text-red-400"}`} />
                <span className="text-xs font-bold text-white">Alle tiers samen</span>
                <span className="text-[10px] text-slate-500">
                  {all.total_picks} picks · {Math.round(all.accuracy * 100)}% raak
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] text-slate-500">Nettowinst</p>
                  <p className={`text-sm font-bold ${allProfit ? "text-emerald-300" : "text-red-300"}`}>
                    {allProfit ? "+" : ""}€{fmt(all.net_profit)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500">Rendement</p>
                  <p className={`text-lg font-black flex items-center justify-end gap-1 ${allProfit ? "text-emerald-300" : "text-red-300"}`}>
                    {allProfit ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {allProfit ? "+" : ""}{all.roi_pct}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Per tier grid ────────────────────────────── */}
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
                  <div className="flex items-center gap-2">
                    <TierEmblem tier={t.slug as any} size="sm" />
                    <span className={`text-xs font-bold ${t.color}`}>{t.label}</span>
                  </div>

                  {!hasData ? (
                    <p className="text-[11px] text-slate-400">Nog geen data</p>
                  ) : (
                    <>
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
                      <p className="text-[9px] uppercase tracking-wider text-slate-500 -mt-1">
                        Rendement
                      </p>

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

                      {stats.implied_odds_count > 0 && stats.real_odds_count > 0 && (
                        <p className="text-[10px] text-slate-500">
                          <span className="text-emerald-400">{stats.real_odds_count}</span>
                          {" echt · "}
                          <span className="text-amber-400">{stats.implied_odds_count}</span>
                          {" berekend"}
                        </p>
                      )}
                      {stats.implied_odds_count === 0 && stats.real_odds_count > 0 && (
                        <p className="text-[10px] text-emerald-400/80">Alle odds echt</p>
                      )}
                      {stats.real_odds_count === 0 && stats.implied_odds_count > 0 && (
                        <p className="text-[10px] text-amber-400/80">Alle odds berekend</p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Oddsbron transparantie ──────────────────── */}
          <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
            <button
              onClick={() => setShowInfo((v) => !v)}
              className="mt-0.5 shrink-0 text-blue-400 hover:text-blue-300 transition-colors"
              aria-label="Uitleg oddsbron"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
            <div className="flex-1">
              <p className="text-[11px] leading-relaxed text-slate-400">
                <span className="text-emerald-300 font-semibold">{all.real_odds_count} picks</span>
                {" gebruiken echte bookmaker-odds uit onze data-API"}
                {all.implied_odds_count > 0 && (
                  <>
                    {", "}
                    <span className="text-amber-300 font-semibold">{all.implied_odds_count} picks</span>
                    {" een berekende odd op basis van de winkans"}
                  </>
                )}
                {"."}{" "}
                {!showInfo && (
                  <button onClick={() => setShowInfo(true)} className="underline text-blue-400 hover:text-blue-300">
                    Waarom?
                  </button>
                )}
              </p>
              {showInfo && (
                <div className="mt-2 space-y-2 text-[11px] leading-relaxed text-slate-500 border-t border-white/10 pt-2">
                  <p>
                    <span className="text-emerald-300 font-semibold">Echte odds</span> komen uit onze betaalde data-API.
                    We nemen het gemiddelde over alle bookmakers — dat is de prijs die een gewone speler realistisch krijgt.
                  </p>
                  {all.implied_odds_count > 0 && (
                    <p>
                      <span className="text-amber-300 font-semibold">Berekende odds</span> gebruiken we alleen als er voor een wedstrijd geen marktdata beschikbaar is. De odd wordt dan ingeschat via de winkans van de engine (bijvoorbeeld: 70% winkans → ongeveer 1,36). Dit is een benadering, niet de echte marktprijs.
                    </p>
                  )}
                  <p className="text-slate-600">
                    Transparantie is voor ons essentieel — je ziet altijd welk percentage op echte marktprijzen is gebaseerd.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Context over wat het getal betekent ──────── */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
            <p className="text-[11px] leading-relaxed text-slate-400">
              <strong className={allProfit ? "text-emerald-300" : "text-amber-300"}>
                {allProfit
                  ? `Positief rendement (+${all.roi_pct}%)`
                  : `${all.roi_pct >= -5 ? "Breakeven" : "Negatief"} rendement (${all.roi_pct}%)`}
              </strong>
              {" — "}
              {allProfit
                ? "het model presteert beter dan de markt prijst. Dat betekent een historische edge op deze dataset."
                : all.roi_pct >= -5
                ? "het model is netjes gekalibreerd: winkansen komen overeen met werkelijke uitkomsten."
                : "het model was op dit sample minder nauwkeurig dan de marktprijzen suggereren."}
            </p>
          </div>

          {/* ── Disclaimer ──────────────────────────────── */}
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <p className="text-[11px] leading-relaxed text-slate-400">
              Berekend op historische data. Verleden resultaten zijn geen garantie voor de toekomst. Uitsluitend ter informatie, geen financieel advies.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
