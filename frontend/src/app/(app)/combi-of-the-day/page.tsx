"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  Lock,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trophy,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { useTier } from "@/hooks/use-tier";
import type {
  ComboOfTheDay,
  ComboStats,
  ComboHistoryItem,
  ComboLeg,
} from "@/types/api";

/**
 * Combi van de Dag — high-odds, edge-filtered 3-leg combo built from
 * the live pre-match odds we collect since 2026-04-16.
 *
 * Source endpoints (all already wired backend-side):
 *   GET /value-bets/combo-today   — today's combo (or unavailable)
 *   GET /value-bets/combo-stats   — backtest + live cumulative ROI / acc
 *   GET /value-bets/combo-history — last 20 evaluated combos
 *
 * Selection rules live in backend/app/services/combo_bet_service.py:
 *   - 3 legs, one per league (no duplicate competitions)
 *   - Min confidence 70% (Gold or Platinum tier only)
 *   - Leg odds in [1.40, 4.00]
 *   - Leg edge > 0 (model_p > vig-removed implied_p)
 *   - Top-3 by score = confidence × tier_bonus × (1 + edge)
 */
export default function CombiOfTheDayPage() {
  const { isAdmin } = useTier();

  const [statsScope, setStatsScope] = useState<"backtest" | "live">("backtest");

  const todayQ = useQuery({
    queryKey: ["combo-today"],
    queryFn: () => api.getComboOfTheDay(),
    staleTime: 5 * 60_000,
  });

  const statsQ = useQuery({
    queryKey: ["combo-stats", statsScope],
    queryFn: () => api.getComboStats(statsScope),
    staleTime: 5 * 60_000,
  });

  const historyQ = useQuery({
    queryKey: ["combo-history", 30],
    queryFn: () => api.getComboHistory(30),
    staleTime: 5 * 60_000,
  });

  const today = todayQ.data;
  const stats = statsQ.data;
  const history = historyQ.data ?? [];

  return (
    <div className="relative mx-auto max-w-6xl px-3 sm:px-4 py-5 md:py-7 animate-fade-in">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Engine
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Combi of the Day
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              3 legs · edge-filtered · live pre-match odds since 16 Apr 2026
            </p>
          </div>
          {isAdmin && (
            <AdminGenerateButton onDone={() => todayQ.refetch()} />
          )}
        </div>

        {/* Today's combo */}
        <TodayComboCard data={today} loading={todayQ.isLoading} />

        {/* Stats — backtest vs live toggle */}
        <StatsBlock
          scope={statsScope}
          setScope={setStatsScope}
          stats={stats}
          loading={statsQ.isLoading}
        />

        {/* Recent history */}
        <HistoryBlock items={history} loading={historyQ.isLoading} />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Today's combo
// ────────────────────────────────────────────────────────────────────────────
function TodayComboCard({
  data,
  loading,
}: {
  data: ComboOfTheDay | undefined;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="glass-card animate-pulse p-6 sm:p-8">
        <div className="h-6 w-48 rounded bg-white/[0.06]" />
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded bg-white/[0.04]" />
          ))}
        </div>
      </div>
    );
  }
  if (!data || !data.available) {
    return (
      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">No combo today</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              {data?.reason ??
                "Engine couldn't find 3 legs with positive edge in qualifying leagues today. We don't force a combo when the math says no — empty days are honest days."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const expectedROIPct = data.expected_value_per_unit * 100;
  const modelHitPct = data.combined_model_probability * 100;
  const impliedHitPct = data.combined_bookmaker_implied * 100;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-6 sm:p-8"
      style={{
        borderColor: "rgba(74, 222, 128, 0.30)",
        background:
          "radial-gradient(circle at 0% 0%, rgba(74,222,128,0.10), transparent 55%), hsl(230 22% 9% / 0.7)",
        boxShadow: "0 0 0 1px rgba(74,222,128,0.15), 0 16px 40px rgba(74,222,128,0.10)",
      }}
    >
      {/* Top row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
            <Sparkles className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Today &middot; {data.bet_date ?? "—"}
            </p>
            <h2 className="text-base font-semibold text-white sm:text-lg">
              {data.legs.length}-leg edge combo
            </h2>
          </div>
        </div>
        {data.locked ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-amber-500/[0.08] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300">
            <Lock className="h-3 w-3" />
            Platinum only
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/[0.10] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            Unlocked
          </span>
        )}
      </div>

      {/* Headline numbers */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Combined odds"
          value={data.combined_odds.toFixed(2)}
          tone="white"
        />
        <Stat
          label="Model hit-rate"
          value={`${modelHitPct.toFixed(1)}%`}
          tone="emerald"
        />
        <Stat
          label="Bookmaker implied"
          value={`${impliedHitPct.toFixed(1)}%`}
          tone="slate"
        />
        <Stat
          label="Expected ROI / unit"
          value={`${expectedROIPct >= 0 ? "+" : ""}${expectedROIPct.toFixed(1)}%`}
          tone={expectedROIPct >= 0 ? "emerald" : "red"}
        />
      </div>

      {/* Legs */}
      <div className="mt-5 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Legs
        </p>
        {data.legs.map((leg, i) => (
          <LegRow key={leg.match_id} leg={leg} index={i + 1} />
        ))}
      </div>

      {data.disclaimer && (
        <p className="mt-4 text-[10px] leading-relaxed text-slate-500">
          {data.disclaimer}
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "white" | "emerald" | "slate" | "red";
}) {
  const color = {
    white: "text-white",
    emerald: "text-emerald-400",
    slate: "text-slate-300",
    red: "text-red-400",
  }[tone];
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-xl font-extrabold tabular-nums ${color}`}>
        {value}
      </p>
    </div>
  );
}

function LegRow({ leg, index }: { leg: ComboLeg; index: number }) {
  const tierAccent =
    leg.prediction_tier === "platinum" ? "#d9f0ff" : "#f5d67a";
  const edgePct = leg.leg_edge * 100;
  const kickoff = (() => {
    try {
      return new Date(leg.scheduled_at).toLocaleString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return leg.scheduled_at;
    }
  })();
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
      <div className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-extrabold tabular-nums text-slate-300"
           style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {index}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: tierAccent }}>
            {leg.prediction_tier}
          </span>
          <span className="text-[9px] uppercase tracking-widest text-slate-500 truncate">
            {leg.league}
          </span>
          <span className="text-[9px] tabular-nums text-slate-600">{kickoff}</span>
        </div>
        <p className="mt-0.5 text-sm font-semibold text-white truncate">
          {leg.home_team} <span className="text-slate-500">vs</span> {leg.away_team}
        </p>
        <p className="text-[11px] text-slate-400">
          Pick: <span className="font-semibold text-slate-200">{leg.our_pick_label}</span>
          <span className="ml-2 text-slate-500">model {(leg.our_probability * 100).toFixed(0)}% · book {(leg.bookmaker_implied * 100).toFixed(0)}%</span>
        </p>
      </div>
      <div className="text-right">
        <p className="text-base font-extrabold tabular-nums text-white">{leg.leg_odds.toFixed(2)}</p>
        <p className="text-[10px] tabular-nums text-emerald-400">
          +{edgePct.toFixed(1)}% edge
        </p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Stats block
// ────────────────────────────────────────────────────────────────────────────
function StatsBlock({
  scope,
  setScope,
  stats,
  loading,
}: {
  scope: "backtest" | "live";
  setScope: (s: "backtest" | "live") => void;
  stats: ComboStats | undefined;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Combo track record
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {stats?.window_start ?? "—"} → {stats?.window_end ?? "—"}
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5 text-[10px]">
          {(["backtest", "live"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={`rounded-md px-2.5 py-1 font-semibold uppercase tracking-widest transition-colors ${
                scope === s
                  ? s === "live"
                    ? "bg-emerald-600/80 text-white"
                    : "bg-amber-500/80 text-[#1a1408]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {s === "live" ? "Live" : "Backtest"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-white/[0.04]" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label="Combos"
              value={`${stats.evaluated_combos}/${stats.total_combos}`}
              tone="white"
            />
            <Stat
              label="Hit rate"
              value={`${(stats.accuracy * 100).toFixed(1)}%`}
              tone="emerald"
            />
            <Stat
              label="Avg combined odds"
              value={stats.avg_combined_odds.toFixed(2)}
              tone="slate"
            />
            <Stat
              label="ROI"
              value={`${stats.roi_percentage >= 0 ? "+" : ""}${stats.roi_percentage.toFixed(1)}%`}
              tone={stats.roi_percentage >= 0 ? "emerald" : "red"}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
            <span>
              Total P/L:{" "}
              <span
                className={`font-semibold tabular-nums ${
                  stats.total_units_pnl >= 0 ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {stats.total_units_pnl >= 0 ? "+" : ""}
                {stats.total_units_pnl.toFixed(2)}u
              </span>
            </span>
            <span>
              95% CI:{" "}
              <span className="tabular-nums text-slate-400">
                {(stats.wilson_ci_lower * 100).toFixed(1)}% – {(stats.wilson_ci_upper * 100).toFixed(1)}%
              </span>
            </span>
            {stats.sample_size_warning && (
              <span className="inline-flex items-center gap-1 text-amber-300">
                <AlertTriangle className="h-3 w-3" />
                Small sample — wait for more data
              </span>
            )}
          </div>
          {stats.explainer && (
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              {stats.explainer}
            </p>
          )}
        </>
      ) : (
        <p className="mt-4 text-sm text-slate-500">No stats available yet.</p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// History block
// ────────────────────────────────────────────────────────────────────────────
function HistoryBlock({
  items,
  loading,
}: {
  items: ComboHistoryItem[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="h-4 w-32 animate-pulse rounded bg-white/[0.06]" />
        <div className="mt-3 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-white/[0.04]" />
          ))}
        </div>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Recent combos
        </p>
        <p className="mt-2 text-sm text-slate-500">
          No evaluated combos yet. Once today's combo finishes we'll log it here.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Recent combos
        </p>
        <span className="text-[10px] tabular-nums text-slate-500">{items.length} shown</span>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {items.map((item) => (
          <HistoryRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function HistoryRow({ item }: { item: ComboHistoryItem }) {
  const won = item.is_correct === true;
  const lost = item.is_correct === false;
  const pending = !item.is_evaluated;
  const pnl = item.profit_loss_units ?? 0;
  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-2.5 text-[11px]">
      <div className="flex w-16 shrink-0 flex-col gap-0.5">
        <span className="text-[10px] font-semibold tabular-nums text-slate-300">
          {item.bet_date}
        </span>
        <span
          className={`text-[9px] uppercase tracking-widest ${
            item.is_live ? "text-emerald-400" : "text-amber-400"
          }`}
        >
          {item.is_live ? "Live" : "Backtest"}
        </span>
      </div>
      <p className="min-w-0 truncate text-slate-300">{item.leg_summary}</p>
      <span className="tabular-nums font-semibold text-white">
        {item.combined_odds.toFixed(2)}
      </span>
      <span className="flex w-16 shrink-0 items-center justify-end gap-1.5">
        {won && (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span className="tabular-nums font-bold text-emerald-300">
              +{pnl.toFixed(2)}u
            </span>
          </>
        )}
        {lost && (
          <>
            <XCircle className="h-3.5 w-3.5 text-red-400" />
            <span className="tabular-nums font-bold text-red-300">
              {pnl.toFixed(2)}u
            </span>
          </>
        )}
        {pending && (
          <>
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-[10px] uppercase tracking-widest text-slate-500">
              Pending
            </span>
          </>
        )}
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Admin: force-generate today's combo
// ────────────────────────────────────────────────────────────────────────────
function AdminGenerateButton({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-[11px] text-slate-400">{msg}</span>}
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMsg(null);
          try {
            const r = await api.adminGenerateCombo();
            setMsg(r.status);
            onDone();
          } catch (e) {
            setMsg("error");
          } finally {
            setBusy(false);
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/[0.08] px-3 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/[0.15] disabled:opacity-50"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {busy ? "Generating…" : "Force generate today"}
      </button>
    </div>
  );
}
