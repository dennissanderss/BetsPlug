"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Layers,
  Lock,
  AlertTriangle,
  Sparkles,
  Trophy,
  ListChecks,
  Construction,
  ShieldCheck,
  Clock,
  Info,
} from "lucide-react";

import { api } from "@/lib/api";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import type { ComboOfTheDay, ComboStats, ComboHistoryItem } from "@/types/api";
import { useAuth } from "@/lib/auth";

function pct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}

function formatRange(start: string, end: string): string {
  try {
    const s = new Date(start).toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const e = new Date(end).toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return `${s} → ${e}`;
  } catch {
    return `${start} → ${end}`;
  }
}

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

function StatBlock({
  label,
  value,
  hint,
  accent = "slate",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "slate" | "emerald" | "amber" | "purple";
}) {
  const accentMap: Record<string, string> = {
    slate: "text-slate-100",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    purple: "text-purple-300",
  };
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold tabular-nums ${accentMap[accent]}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

function StatsCard({
  title,
  scope,
}: {
  title: string;
  scope: "backtest" | "live";
}) {
  const { data, isLoading, isError } = useQuery<ComboStats>({
    queryKey: ["combo-stats", scope],
    queryFn: () => api.getComboStats(scope),
    staleTime: 30 * 60_000,
  });

  return (
    <div className="card-neon p-6">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <p className="section-label">{title}</p>
          {data && (
            <p className="mt-1 text-[11px] text-slate-500">
              {formatRange(data.window_start, data.window_end)}
            </p>
          )}
        </div>
        {data?.sample_size_warning && (
          <Pill tone="draw" className="!text-[10px]">
            <AlertTriangle className="h-3 w-3" /> kleine sample
          </Pill>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-red-400">Kon statistieken niet laden.</p>
      )}

      {data && !isLoading && (
        <>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <StatBlock
              label="Combi's"
              value={data.total_combos.toLocaleString("nl-NL")}
              hint={`${data.evaluated_combos} geëvalueerd`}
            />
            <StatBlock
              label="Hit rate"
              value={data.evaluated_combos ? pct(data.accuracy, 1) : "—"}
              hint={
                data.evaluated_combos
                  ? `${data.hit_combos}/${data.evaluated_combos}`
                  : "geen evaluaties"
              }
              accent="emerald"
            />
            <StatBlock
              label="Gem. combined odds"
              value={
                data.total_combos
                  ? `${data.avg_combined_odds.toFixed(2)}×`
                  : "—"
              }
              accent="purple"
            />
            <StatBlock
              label="ROI per €1"
              value={
                data.evaluated_combos
                  ? `${data.roi_percentage >= 0 ? "+" : ""}${data.roi_percentage.toFixed(1)}%`
                  : "—"
              }
              hint={
                data.evaluated_combos
                  ? `${data.total_units_pnl.toFixed(2)} units P/L`
                  : undefined
              }
              accent={data.roi_percentage >= 0 ? "emerald" : "amber"}
            />
          </div>
          {data.evaluated_combos >= 1 && (
            <p className="mt-4 text-[11px] text-slate-500">
              95% Wilson interval:{" "}
              <span className="font-semibold text-slate-300 tabular-nums">
                {pct(data.wilson_ci_lower, 1)} – {pct(data.wilson_ci_upper, 1)}
              </span>
            </p>
          )}
          <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
            {data.explainer}
          </p>
        </>
      )}
    </div>
  );
}

function HistoryList() {
  const { data, isLoading, isError } = useQuery<ComboHistoryItem[]>({
    queryKey: ["combo-history"],
    queryFn: () => api.getComboHistory(20),
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="card-neon p-6 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 rounded bg-white/[0.04] animate-pulse" />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <div className="card-neon p-6">
        <p className="text-sm text-red-400">Kon historie niet laden.</p>
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="card-neon p-6 text-center text-sm text-slate-400">
        Nog geen combi's vastgelegd. Zodra de daily-cron rijen wegschrijft
        verschijnen ze hier.
      </div>
    );
  }
  return (
    <div className="card-neon overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Datum", "Combined odds", "Legs", "Outcome", "P/L"].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((c) => {
              const outcomeLabel = !c.is_evaluated
                ? "Pending"
                : c.is_correct
                ? "WIN"
                : "LOSS";
              const outcomeColor = !c.is_evaluated
                ? "text-slate-400"
                : c.is_correct
                ? "text-emerald-400"
                : "text-red-400";
              return (
                <tr
                  key={c.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3 whitespace-nowrap text-slate-200">
                    {new Date(c.bet_date).toLocaleDateString("nl-NL", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap font-bold tabular-nums text-purple-300">
                    {c.combined_odds.toFixed(2)}×
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {c.leg_summary}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className={`text-xs font-bold ${outcomeColor}`}>
                      {outcomeLabel}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap font-bold tabular-nums">
                    {c.profit_loss_units == null ? (
                      <span className="text-slate-600">—</span>
                    ) : c.profit_loss_units >= 0 ? (
                      <span className="text-emerald-400">
                        +{c.profit_loss_units.toFixed(2)}u
                      </span>
                    ) : (
                      <span className="text-red-400">
                        {c.profit_loss_units.toFixed(2)}u
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LiveComboCard({ data }: { data: ComboOfTheDay }) {
  return (
    <>
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
                <span className="text-[11px] text-slate-500">· {leg.league}</span>
              </div>
              <p className="text-base font-semibold text-slate-100 truncate">
                {leg.home_team} <span className="text-slate-500">vs</span>{" "}
                {leg.away_team}
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

      {data.disclaimer && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-4">
          <div className="flex items-start gap-2 text-[11px] leading-relaxed text-amber-300/90">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p>{data.disclaimer}</p>
          </div>
        </div>
      )}
    </>
  );
}

function ComingSoonOverlay() {
  return (
    <div className="card-neon p-6 md:p-8 border border-amber-500/30 bg-amber-500/[0.04]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
          <Construction className="h-5 w-5 text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-100">
            Combi van de Dag — coming soon
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
            We zetten deze tool nog niet open voor publiek. Eerst willen we een
            grote backtest-sample bouwen, een paar weken live meten, en de
            resultaten transparant tonen voordat de tool écht klikbaar wordt
            voor Platinum-abonnees.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill tone="info" className="!text-[10px]">
              <Lock className="h-3 w-3" /> Platinum-only bij launch
            </Pill>
            <Pill tone="default" className="!text-[10px]">
              Geen impact op Pick of the Day of Predictions
            </Pill>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComboOfTheDayPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const todayQuery = useQuery<ComboOfTheDay>({
    queryKey: ["combo-of-the-day"],
    queryFn: () => api.getComboOfTheDay(),
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
  });

  const today = todayQuery.data;
  const showLiveCombo = today?.available && today.legs.length > 0;
  const showComingSoon = today?.coming_soon;
  const showNoCombo =
    today && !today.available && !today.coming_soon && !today.locked;

  return (
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
                Drie high-confidence picks per dag, gebundeld als één combinatie.
                Hogere odds dan een enkele pick — één verliezende leg betekent
                de hele combi verloren.
              </p>
            </div>
          </div>

          {isAdmin ? (
            <Pill tone="info" className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3" />
              Admin preview
            </Pill>
          ) : (
            <Pill tone="draw" className="inline-flex items-center gap-1.5">
              <Construction className="h-3 w-3" />
              In ontwikkeling
            </Pill>
          )}
        </div>

        {/* Live combi (admins / launched) */}
        {showLiveCombo && today && <LiveComboCard data={today} />}

        {/* No combo today */}
        {showNoCombo && (
          <div className="card-neon p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04]">
              <Info className="h-5 w-5 text-slate-500" />
            </div>
            <p className="text-sm font-semibold text-slate-100">
              Vandaag geen combi beschikbaar
            </p>
            <p className="mt-2 text-xs text-slate-400 max-w-md mx-auto">
              {today?.reason ??
                "Niet genoeg kandidaat-legs vandaag — er moeten minstens drie hoge-vertrouwen Gold/Platinum picks met geschikte odds zijn."}
            </p>
          </div>
        )}

        {/* Coming soon banner — non-admins */}
        {showComingSoon && <ComingSoonOverlay />}

        {/* Comparison cards: how Combi differs from BotD / Predictions */}
        <div className="grid gap-5 md:grid-cols-3">
          <div className="card-neon p-5">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-emerald-400" />
              <p className="text-sm font-semibold text-slate-100">Pick of the Day</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">Eén</span> wedstrijd per
              dag — de hoogst-confidente Gold-tier pick. Odds typisch{" "}
              <span className="text-slate-300">1.5–2.5×</span>, beoogde winrate
              ~70%. Beschikbaar vanaf Gold.
            </p>
          </div>

          <div className="card-neon p-5">
            <div className="flex items-center gap-2 mb-2">
              <ListChecks className="h-4 w-4 text-blue-400" />
              <p className="text-sm font-semibold text-slate-100">Predictions</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Volledige lijst van <span className="font-semibold text-slate-300">alle</span>{" "}
              v8.1 voorspellingen, filterbaar per tier en competitie. Geen
              bundel — losse picks om zelf uit te kiezen.
            </p>
          </div>

          <div className="card-neon p-5 border border-purple-500/25">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-purple-300" />
              <p className="text-sm font-semibold text-slate-100">Combi van de Dag</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">Drie</span> picks gebundeld
              als één combinatie. Combined odds typisch{" "}
              <span className="text-slate-300">3–10×</span>, beoogde hit rate
              30–50%. Spectaculairder als hij hit, maar volatieler.
              Platinum-only bij launch.
            </p>
          </div>
        </div>

        {/* Engine clarification */}
        <div className="card-neon p-5 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-semibold text-slate-100">
              Geen aparte engine — zelfde v8.1 als de rest van het platform
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Combi van de Dag draait op exact{" "}
              <span className="font-semibold text-slate-300">dezelfde</span> v8.1
              prediction engine (XGBoost + gekalibreerde logistic) als Pick of
              the Day en Predictions. Wat anders is: de
              <span className="font-semibold text-slate-300"> selectie-laag</span>.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              De selector kiest per dag de top 3 picks die voldoen aan: ≥70%
              modelvertrouwen, Gold/Platinum competitie, odds tussen 1.40–4.00,
              positieve edge ten opzichte van de bookmaker, en max één pick per
              competitie. Vervolgens combineert hij die als één accumulator.
            </p>
          </div>
        </div>

        {/* Backtest stats */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Backtest — historische prestatie
          </p>
          <StatsCard title="Backtest" scope="backtest" />
        </div>

        {/* Live stats */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Live meting · sinds 2026-04-16
          </p>
          <StatsCard title="Live meting (v8.1 deploy)" scope="live" />
        </div>

        {/* History list */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Laatste combi's
          </p>
          <HistoryList />
        </div>

        {/* Honest framing */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-4">
          <div className="flex items-start gap-2 text-[11px] leading-relaxed text-amber-300/90">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p>
              <span className="font-semibold">Eerlijk over de wiskunde:</span>{" "}
              hogere odds gaan altijd gepaard met lagere winrate. Een 3-leg combi
              raakt vaker mis dan een single pick — dat is geen bug, dat is hoe
              accumulators werken. We mikken op een ROI &gt; 0% over een grote
              sample, niet op zekerheid per combi. 18+, geen gokadvies,
              statistische analyse voor educatieve doeleinden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
