"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Layers,
  Lock,
  AlertTriangle,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Info,
} from "lucide-react";
import Link from "next/link";

import { api } from "@/lib/api";
import { PaywallOverlay } from "@/components/ui/paywall-overlay";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { useLocalizedHref } from "@/i18n/locale-provider";
import type { ComboOfTheDay } from "@/types/api";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("nl-NL", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function pct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}

export default function ComboOfTheDayPage() {
  const loc = useLocalizedHref();
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<ComboOfTheDay>({
    queryKey: ["combo-of-the-day"],
    queryFn: () => api.getComboOfTheDay(),
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
  });

  return (
    <PaywallOverlay feature="combo_of_the_day" requiredTier="platinum">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8 animate-fade-in">
        <div className="relative space-y-8">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
            <div className="absolute top-40 right-1/4 h-72 w-72 rounded-full bg-[#4ade80]/10 blur-3xl" />
          </div>

          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <HexBadge variant="purple" size="lg">
                <Layers className="h-6 w-6" />
              </HexBadge>
              <div>
                <span className="section-label">Combi van de Dag</span>
                <h1 className="text-heading mt-3">
                  <span className="gradient-text-green">3-Leg Accumulator</span>
                </h1>
                <p className="mt-2 text-sm text-slate-400 max-w-2xl">
                  Drie high-confidence picks gebundeld in één combinatie. Hogere odds
                  dan een enkele pick, één verliezende leg = combinatie verloren.
                  Alleen voor Platinum.
                </p>
              </div>
            </div>

            <Pill tone="purple" className="inline-flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              Platinum exclusive
            </Pill>
          </div>

          {/* States */}
          {isLoading && (
            <div className="card-neon p-8 animate-pulse">
              <div className="h-5 w-48 rounded bg-white/[0.06] mb-4" />
              <div className="grid gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 w-full rounded bg-white/[0.04]" />
                ))}
              </div>
            </div>
          )}

          {isError && (
            <div className="card-neon p-6 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-100">
                  Combi van de Dag kon niet geladen worden
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {error instanceof Error
                    ? error.message
                    : "Onbekende fout — probeer opnieuw."}
                </p>
                <button
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] transition-colors disabled:opacity-60"
                >
                  Opnieuw proberen
                </button>
              </div>
            </div>
          )}

          {!isLoading && !isError && data && !data.available && (
            <div className="card-neon p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04]">
                <Info className="h-5 w-5 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-100">
                Vandaag geen combi beschikbaar
              </p>
              <p className="mt-2 text-xs text-slate-400 max-w-md mx-auto">
                {data.reason ??
                  "Niet genoeg kandidaat-legs vandaag — er moeten minstens drie hoge-vertrouwen Gold/Platinum picks met geschikte odds zijn."}
              </p>
              <Link
                href={loc("/predictions")}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] transition-colors"
              >
                Bekijk alle voorspellingen
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {!isLoading && !isError && data?.available && (
            <>
              {/* Summary card */}
              <div className="card-neon card-neon-green halo-green relative overflow-hidden p-6 md:p-8">
                <div className="grid gap-6 md:grid-cols-4">
                  <div>
                    <p className="section-label">Combined odds</p>
                    <p className="mt-2 text-4xl font-extrabold tabular-nums text-emerald-400">
                      {data.combined_odds.toFixed(2)}×
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      €10 inzet → €{(10 * data.combined_odds).toFixed(2)} bij hit
                    </p>
                  </div>

                  <div>
                    <p className="section-label">Model winrate</p>
                    <p className="mt-2 text-4xl font-extrabold tabular-nums text-slate-100">
                      {pct(data.combined_model_probability, 1)}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Bookmaker: {pct(data.combined_bookmaker_implied, 1)}
                    </p>
                  </div>

                  <div>
                    <p className="section-label">Edge</p>
                    <p
                      className={`mt-2 text-4xl font-extrabold tabular-nums ${
                        data.combined_edge >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {data.combined_edge >= 0 ? "+" : ""}
                      {pct(data.combined_edge, 1)}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      EV per €1 inzet: €{data.expected_value_per_unit.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className="section-label">Legs</p>
                    <p className="mt-2 text-4xl font-extrabold tabular-nums text-slate-100">
                      {data.legs.length}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      max 1 per competitie
                    </p>
                  </div>
                </div>
              </div>

              {/* Legs */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  De drie legs
                </p>
                {data.legs.map((leg, idx) => (
                  <div
                    key={leg.match_id}
                    className="card-neon p-5 grid gap-4 md:grid-cols-[60px_1fr_auto] md:items-center"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300 font-extrabold tabular-nums text-xl">
                      {idx + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Pill
                          tone={leg.prediction_tier === "platinum" ? "purple" : "draw"}
                          className="!text-[10px] uppercase"
                        >
                          {leg.prediction_tier}
                        </Pill>
                        <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(leg.scheduled_at)}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          · {leg.league}
                        </span>
                      </div>
                      <p className="text-base font-semibold text-slate-100 truncate">
                        {leg.home_team}{" "}
                        <span className="text-slate-500">vs</span> {leg.away_team}
                      </p>
                      <p className="mt-1 text-sm">
                        <span className="text-slate-400">Onze pick: </span>
                        <span className="font-semibold text-emerald-400">
                          {leg.our_pick_label}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4 md:justify-end">
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-slate-500">
                          Confidence
                        </p>
                        <p className="text-sm font-bold tabular-nums text-slate-100">
                          {pct(leg.confidence, 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-slate-500">
                          Edge
                        </p>
                        <p className="text-sm font-bold tabular-nums text-emerald-400">
                          +{pct(leg.leg_edge, 1)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-center min-w-[64px]">
                        <p className="text-[10px] uppercase tracking-widest text-slate-500">
                          Odds
                        </p>
                        <p className="text-base font-extrabold tabular-nums text-emerald-400">
                          {leg.leg_odds.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Math explainer */}
              <div className="card-neon p-5">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-4 w-4 shrink-0 text-purple-300 mt-0.5" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-sm font-semibold text-slate-100">
                      Hoe rekent de combi
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Combined odds ={" "}
                      {data.legs.map((l) => l.leg_odds.toFixed(2)).join(" × ")} ={" "}
                      <span className="font-semibold text-emerald-400">
                        {data.combined_odds.toFixed(2)}×
                      </span>
                      .
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Model winrate ={" "}
                      {data.legs.map((l) => pct(l.our_probability, 0)).join(" × ")} ={" "}
                      <span className="font-semibold text-slate-100">
                        {pct(data.combined_model_probability, 1)}
                      </span>
                      . Onafhankelijke uitkomsten worden aangenomen — als twee wedstrijden
                      sterk gecorreleerd zouden zijn, kan de werkelijke kans iets afwijken.
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Edge = model winrate × combined odds − 1 ={" "}
                      {pct(data.combined_model_probability, 2)} ×{" "}
                      {data.combined_odds.toFixed(2)} − 1 ={" "}
                      <span className="font-semibold text-emerald-400">
                        +{pct(data.combined_edge, 1)}
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              {data.disclaimer && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-4">
                  <div className="flex items-start gap-2 text-[11px] leading-relaxed text-amber-300/90">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <p>{data.disclaimer}</p>
                  </div>
                </div>
              )}

              {/* Honest framing */}
              <div className="text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
                <TrendingUp className="h-3 w-3 shrink-0 mt-0.5" />
                <p>
                  Een 3-leg combi heeft altijd een lagere winrate dan een single-pick —
                  die is verruild voor hogere odds. Verwacht ruwweg{" "}
                  <span className="font-semibold text-slate-300">~30–50% hit rate</span>{" "}
                  op deze accumulator over een grote sample, met de bijbehorende
                  volatiliteit. Speel verantwoord.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </PaywallOverlay>
  );
}
