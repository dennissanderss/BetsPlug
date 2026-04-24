"use client";

import { useQuery } from "@tanstack/react-query";
import { Lock, Sparkles, TrendingUp, Info } from "lucide-react";

interface TierStats {
  total: number;
  correct: number;
  accuracy: number;
}

interface AccuracyPlusData {
  title: string;
  subtitle: string;
  status: "locked" | "unlocked";
  unlock_threshold: number;
  start_date: string;
  current_picks: number;
  correct_picks: number;
  accuracy: number;
  progress_pct: number;
  per_tier: Record<string, TierStats>;
}

const TIER_LABELS = [
  { slug: "free",     label: "Free",     ring: "ring-slate-500/30",  bg: "bg-slate-500/5"  },
  { slug: "silver",   label: "Silver",   ring: "ring-slate-400/30",  bg: "bg-slate-400/5"  },
  { slug: "gold",     label: "Gold",     ring: "ring-amber-500/30",  bg: "bg-amber-500/5"  },
  { slug: "platinum", label: "Platinum", ring: "ring-sky-500/30",    bg: "bg-sky-500/5"    },
] as const;

export function AccuracyPlusPreview() {
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

  const { data, isLoading, isError } = useQuery<AccuracyPlusData>({
    queryKey: ["accuracy-plus"],
    queryFn: async () => {
      const res = await fetch(`${API}/trackrecord/accuracy-plus`);
      if (!res.ok) throw new Error(`accuracy-plus failed: ${res.status}`);
      return res.json();
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return (
    <div className="card-neon rounded-2xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-500/30">
            <Sparkles className="h-4 w-4 text-violet-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white">Accuracy Pro Engine v2</h3>
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
                <Lock className="h-2.5 w-2.5" />
                In ontwikkeling
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Verbeterde versie van de Accuracy Engine met pre-match bookmaker-odds validatie
            </p>
          </div>
        </div>
      </div>

      {/* Explainer banner */}
      <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
        <p className="text-[11px] leading-relaxed text-slate-400">
          Naast accuracy willen we ook de <strong className="text-slate-200">markt-context</strong> meten:
          kloppen onze picks met wat bookmakers aangeven? Deze meetlaag loopt sinds 16 april 2026 en
          gebruikt echte pre-match odds uit onze betaalde data-API. De resultaten zijn
          zichtbaar zodra we voldoende picks hebben verzameld voor een betrouwbaar oordeel.
        </p>
      </div>

      {/* Progress state */}
      {isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-white/5" />
      ) : isError || !data ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-5 text-center">
          <p className="text-sm text-slate-400">Kan status niet ophalen.</p>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-violet-300" />
                <span className="text-xs font-semibold text-white">Voortgang dataset</span>
              </div>
              <span className="text-[11px] text-slate-500">
                start: {new Date(data.start_date).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-2xl font-black text-white">
                  {data.current_picks}
                </span>
                <span className="text-xs text-slate-500">
                  van <span className="text-slate-300 font-semibold">{data.unlock_threshold}</span> picks
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-300 transition-all duration-500"
                  style={{ width: `${Math.min(100, data.progress_pct)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-slate-500">
                <span>{data.progress_pct.toFixed(0)}% verzameld</span>
                <span>
                  {data.status === "unlocked"
                    ? "Drempel bereikt — resultaten zichtbaar"
                    : "Ontgrendelt zodra de drempel bereikt is"}
                </span>
              </div>
            </div>
          </div>

          {/* Per tier — locked or unlocked */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TIER_LABELS.map((t) => {
              const stats = data.per_tier[t.slug];
              const hasEnough = data.status === "unlocked" && stats && stats.total >= 10;

              return (
                <div
                  key={t.slug}
                  className={`rounded-xl ring-1 p-3 flex flex-col gap-2 ${t.bg} ${t.ring} ${!hasEnough ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{t.label}</span>
                    {!hasEnough && (
                      <Lock className="h-3 w-3 text-slate-500" />
                    )}
                  </div>

                  {hasEnough ? (
                    <>
                      <span className="text-xl font-black text-violet-200">
                        {Math.round(stats.accuracy * 100)}%
                      </span>
                      <p className="text-[10px] text-slate-500">
                        {stats.correct}/{stats.total} raak
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-black text-slate-600 blur-[2px] select-none">
                        ??.?%
                      </span>
                      <p className="text-[10px] text-slate-600">
                        {stats?.total ?? 0} picks verzameld
                      </p>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Context footer */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-[11px] leading-relaxed text-slate-500">
            <p>
              <strong className="text-slate-300">Wat meten we hier precies?</strong> Voor elke pick die
              het model vanaf {new Date(data.start_date).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })} produceert, slaan we de pre-match
              bookmaker-odds op. Zodra de wedstrijd is afgelopen wordt de pick beoordeeld
              <em> samen met</em> de odds-context. Zo zie je straks niet alleen hoe vaak het model raak
              heeft, maar ook of dat zich onderscheidt van wat de markt al inzag.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
