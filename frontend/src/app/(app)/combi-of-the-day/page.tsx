"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
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
import { PaywallOverlay } from "@/components/ui/paywall-overlay";
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
type PeriodFilter = "1d" | "7d" | "30d" | "90d" | "all";

const PERIOD_LABELS: Record<PeriodFilter, { short: string; full: string; days: number | null }> = {
  "1d": { short: "Today", full: "Last 24 hours of data", days: 1 },
  "7d": { short: "Weekly", full: "Last 7 days of data", days: 7 },
  "30d": { short: "Monthly", full: "Last 30 days of data", days: 30 },
  "90d": { short: "Quarterly", full: "Last 90 days of data", days: 90 },
  "all": { short: "All time", full: "Full window (Live: since 16 Apr 2026 · Backtest: since 1 Aug 2024)", days: null },
};

export default function CombiOfTheDayPage() {
  const { isAdmin } = useTier();

  const [statsScope, setStatsScope] = useState<"backtest" | "live">("backtest");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("7d");

  const todayQ = useQuery({
    queryKey: ["combo-today"],
    queryFn: () => api.getComboOfTheDay(),
    staleTime: 5 * 60_000,
  });

  // Backend cap raised to 1000. Pull all so backtest + live can both
  // be displayed in full. With ~250 combos today the response is small.
  const historyQ = useQuery({
    queryKey: ["combo-history", 500],
    queryFn: () => api.getComboHistory(500),
    staleTime: 60_000,
  });

  const today = todayQ.data;
  const allHistory = historyQ.data ?? [];

  // Filter by scope (live vs backtest) AND by period (1d / 7d / 30d / 90d / all).
  // Stats card numbers are computed client-side from this filtered set so the
  // toggle is instant and consistent with the visible history list.
  //
  // Period anchor:
  //   - LIVE scope: anchor = today (real wall-clock).
  //   - BACKTEST scope: anchor = the LATEST bet_date in backtest data
  //     (typically 15 Apr 2026, the day before live measurement opened).
  //     This makes "Weekly" mean "last 7 days OF backtest data" instead
  //     of "last 7 calendar days" (which is empty for historical data).
  const filteredHistory = useMemo(() => {
    const scopeMatched = allHistory.filter((h) => h.is_live === (statsScope === "live"));
    const days = PERIOD_LABELS[periodFilter].days;
    if (days === null) return scopeMatched;

    // Determine anchor timestamp
    let anchorMs: number;
    if (statsScope === "live") {
      anchorMs = Date.now();
    } else {
      // Backtest: pick the latest bet_date in scope
      let latest = 0;
      for (const h of scopeMatched) {
        const t = new Date(h.bet_date + "T00:00:00Z").getTime();
        if (Number.isFinite(t) && t > latest) latest = t;
      }
      // Day-after the latest so "Today" includes the final backtest day
      anchorMs = latest > 0 ? latest + 24 * 60 * 60 * 1000 : Date.now();
    }
    const cutoffMs = anchorMs - days * 24 * 60 * 60 * 1000;
    return scopeMatched.filter((h) => {
      const t = new Date(h.bet_date + "T00:00:00Z").getTime();
      return Number.isFinite(t) && t >= cutoffMs && t < anchorMs;
    });
  }, [allHistory, statsScope, periodFilter]);

  // Aggregate stats from the filtered history. Replaces the /combo-stats
  // endpoint call so the numbers always reflect what's visible below.
  const computedStats = useMemo(() => computeAggregateStats(filteredHistory, statsScope, periodFilter), [filteredHistory, statsScope, periodFilter]);

  return (
    <PaywallOverlay feature="combi_of_the_day" requiredTier="gold">
    <div className="relative mx-auto max-w-6xl px-3 sm:px-4 py-5 md:py-7 animate-fade-in">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Combo van de Dag
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Onze 2 picks gecombineerd in één weddenschap voor vandaag
            </p>
          </div>
          {isAdmin && (
            <AdminGenerateButton onDone={() => todayQ.refetch()} />
          )}
        </div>

        {/* Card 1 — Vandaag's combo */}
        <SimpleTodayCombo data={today} loading={todayQ.isLoading} />

        {/* Card 2 — Hoe deden we het (lifetime BT + Live) */}
        <SimpleTrackRecord history={allHistory} loading={historyQ.isLoading} />

        {/* Card 3 — Geschiedenis (laatste 10) */}
        <SimpleHistory
          items={allHistory.slice(0, 10)}
          loading={historyQ.isLoading}
        />

        <p className="pt-2 text-center text-[10px] text-slate-600">
          Statistische analyse · 18+ · geen gokadvies
        </p>
      </div>
    </div>
    </PaywallOverlay>
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
  period,
  setPeriod,
  stats,
  loading,
}: {
  scope: "backtest" | "live";
  setScope: (s: "backtest" | "live") => void;
  period: PeriodFilter;
  setPeriod: (p: PeriodFilter) => void;
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
            {PERIOD_LABELS[period].full}
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

      {/* Period filter — Daily / Weekly / Monthly / Quarterly / All */}
      <div className="mt-3 inline-flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5 text-[10px]">
        {(["1d", "7d", "30d", "90d", "all"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`rounded-md px-2.5 py-1 font-semibold uppercase tracking-widest transition-colors ${
              period === p
                ? "bg-blue-600/80 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {PERIOD_LABELS[p].short}
          </button>
        ))}
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
  scope,
  period,
}: {
  items: ComboHistoryItem[];
  loading: boolean;
  scope: "backtest" | "live";
  period: PeriodFilter;
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
          Recent combos · {scope}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          {scope === "live"
            ? "No live combos yet — the engine starts logging from 16 Apr 2026 onwards."
            : "No backtest combos in the current window."}
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Recent combos · <span className={scope === "live" ? "text-emerald-300" : "text-amber-300"}>{scope}</span> · <span className="text-blue-300">{PERIOD_LABELS[period].short.toLowerCase()}</span>
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

// ────────────────────────────────────────────────────────────────────────────
// Client-side aggregation — computes the same shape as ComboStats from the
// filtered history list. Lets us scope by Daily/Weekly/Monthly without
// extra backend calls; the toggle is instant.
// ────────────────────────────────────────────────────────────────────────────
function computeAggregateStats(
  items: ComboHistoryItem[],
  scope: "backtest" | "live",
  period: PeriodFilter,
): ComboStats {
  const evaluated = items.filter((h) => h.is_evaluated);
  const wins = evaluated.filter((h) => h.is_correct === true).length;
  const total = evaluated.length;
  const accuracy = total > 0 ? wins / total : 0;
  const totalPnl = evaluated.reduce((sum, h) => sum + (h.profit_loss_units ?? 0), 0);
  const avgOdds = total > 0
    ? evaluated.reduce((sum, h) => sum + h.combined_odds, 0) / total
    : 0;
  const avgLegs = total > 0
    ? evaluated.reduce((sum, h) => sum + h.leg_count, 0) / total
    : 0;
  // Wilson 95% CI for the binomial proportion
  const z = 1.96;
  let lower = 0;
  let upper = 0;
  if (total > 0) {
    const p = accuracy;
    const denom = 1 + (z * z) / total;
    const center = (p + (z * z) / (2 * total)) / denom;
    const margin = (z / denom) * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total));
    lower = Math.max(0, center - margin);
    upper = Math.min(1, center + margin);
  }
  // ROI as percentage on flat 1-unit stake
  const roiPct = total > 0 ? (totalPnl / total) * 100 : 0;

  // Window labels — pulled from the filtered set itself if not empty
  const sorted = [...items].sort((a, b) => a.bet_date.localeCompare(b.bet_date));
  const windowStart = sorted[0]?.bet_date ?? "—";
  const windowEnd = sorted[sorted.length - 1]?.bet_date ?? "—";

  return {
    scope,
    window_start: windowStart,
    window_end: windowEnd,
    total_combos: items.length,
    evaluated_combos: total,
    hit_combos: wins,
    accuracy,
    avg_combined_odds: avgOdds,
    avg_legs_per_combo: avgLegs,
    total_units_pnl: totalPnl,
    roi_percentage: roiPct,
    wilson_ci_lower: lower,
    wilson_ci_upper: upper,
    sample_size_warning: total < 30,
    explainer:
      total === 0
        ? `Geen ${scope === "live" ? "live" : "backtest"} combos in deze periode (${PERIOD_LABELS[period].full}).`
        : `${PERIOD_LABELS[period].full} · ${scope === "live" ? "Live measurement" : "Backtest replay"} · ${total} geëvalueerde combo${total === 1 ? "" : "s"}.`,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// SIMPLE UI (post-UX-rewrite 2026-05-07)
// Strips the 4-KPI grid + edge labels + period tabs + technical disclaimer.
// ────────────────────────────────────────────────────────────────────────────

function SimpleTodayCombo({
  data,
  loading,
}: {
  data: ComboOfTheDay | undefined;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="glass-card animate-pulse p-6">
        <div className="h-5 w-40 rounded bg-white/[0.06]" />
        <div className="mt-4 h-16 rounded bg-white/[0.04]" />
        <div className="mt-2 h-16 rounded bg-white/[0.04]" />
      </div>
    );
  }
  if (!data || !data.available) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-white">Vandaag nog geen combo</h2>
        <p className="mt-1 text-sm text-slate-400">
          Onze AI vindt vandaag geen 2 picks waar we genoeg vertrouwen in hebben. Kom morgen terug.
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-6 sm:p-8"
      style={{
        borderColor: "rgba(74, 222, 128, 0.30)",
        background: "radial-gradient(circle at 0% 0%, rgba(74,222,128,0.08), transparent 55%), hsl(230 22% 9% / 0.7)",
        boxShadow: "0 0 0 1px rgba(74,222,128,0.15)",
      }}
    >
      <h2 className="text-lg font-extrabold text-white">Vandaag&apos;s Combo</h2>
      <div className="mt-5 space-y-4">
        {data.legs.map((leg, i) => (
          <div key={leg.match_id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-500">
              Wedstrijd {i + 1} · {leg.league}
            </p>
            <p className="mt-1 text-base font-bold text-white">
              {leg.home_team} <span className="text-slate-500">vs</span> {leg.away_team}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Onze pick: <span className="font-semibold text-emerald-300">{leg.our_pick_label}</span>
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Odds: <span className="font-semibold tabular-nums text-slate-200">{leg.leg_odds.toFixed(2)}</span>
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
        <p className="text-xs uppercase tracking-widest text-emerald-300">Totaal</p>
        <p className="mt-1 text-2xl font-extrabold tabular-nums text-white">
          {data.combined_odds.toFixed(2)} keer je inzet
        </p>
        <p className="mt-1 text-sm text-slate-300">
          Bij €10 inzet:{" "}
          <span className="font-semibold text-emerald-300">€{(10 * data.combined_odds).toFixed(2)}</span>{" "}
          winst als beide kloppen
        </p>
      </div>
    </div>
  );
}

function SimpleTrackRecord({
  history,
  loading,
}: {
  history: ComboHistoryItem[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="glass-card h-32 animate-pulse" />
        <div className="glass-card h-32 animate-pulse" />
      </div>
    );
  }
  const evaluated = history.filter((h) => h.is_evaluated);
  const bt = evaluated.filter((h) => !h.is_live);
  const live = evaluated.filter((h) => h.is_live);

  const stat = (rows: ComboHistoryItem[]) => {
    const won = rows.filter((r) => r.is_correct === true).length;
    const total = rows.length;
    const pnl = rows.reduce((acc, r) => acc + (r.profit_loss_units ?? 0), 0);
    const roi = total > 0 ? (pnl / total) * 100 : 0;
    return { won, total, roi };
  };
  const btS = stat(bt);
  const lvS = stat(live);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-slate-100">Hoe deden we het?</h2>
        <p className="mt-1 text-xs text-slate-500">Resultaten van alle combo&apos;s die we tot nu toe hebben gespeeld.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="glass-card p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Historisch (alle data)</p>
          <p className="mt-1 text-xl font-bold text-white">{btS.total} combo&apos;s gespeeld</p>
          <p className="mt-1 text-sm text-slate-400">
            Gewonnen: <span className="font-semibold text-slate-200">{btS.won} van {btS.total}</span>
          </p>
          <p className="mt-2 text-2xl font-extrabold tabular-nums">
            <span className={btS.roi >= 0 ? "text-emerald-300" : "text-rose-400"}>
              {btS.roi >= 0 ? "+" : ""}{btS.roi.toFixed(1)}%
            </span>
            <span className="ml-1 text-xs font-normal text-slate-500">rendement</span>
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Live meting sinds 16 april</p>
          <p className="mt-1 text-xl font-bold text-white">{lvS.total} combo&apos;s gespeeld</p>
          <p className="mt-1 text-sm text-slate-400">
            Gewonnen: <span className="font-semibold text-slate-200">{lvS.won} van {lvS.total}</span>
          </p>
          <p className="mt-2 text-2xl font-extrabold tabular-nums">
            <span className={lvS.roi >= 0 ? "text-emerald-300" : "text-rose-400"}>
              {lvS.roi >= 0 ? "+" : ""}{lvS.roi.toFixed(1)}%
            </span>
            <span className="ml-1 text-xs font-normal text-slate-500">rendement</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function SimpleHistory({
  items,
  loading,
}: {
  items: ComboHistoryItem[];
  loading: boolean;
}) {
  if (loading || items.length === 0) return null;
  return (
    <div className="glass-card overflow-hidden">
      <div className="border-b border-white/[0.06] px-5 py-3">
        <h2 className="text-base font-semibold text-slate-100">Geschiedenis</h2>
        <p className="mt-0.5 text-xs text-slate-500">Laatste 10 combo&apos;s</p>
      </div>
      <ul className="divide-y divide-white/[0.04]">
        {items.map((c) => {
          const date = (() => {
            try {
              return new Date(c.bet_date + "T00:00:00").toLocaleDateString("nl-NL", { day: "2-digit", month: "short" });
            } catch {
              return c.bet_date;
            }
          })();
          const status = c.is_correct === true
            ? { icon: "✅", label: "Gewonnen", color: "text-emerald-300" }
            : c.is_correct === false
            ? { icon: "❌", label: "Verloren", color: "text-rose-400" }
            : { icon: "⏳", label: "In afwachting", color: "text-slate-400" };
          return (
            <li key={c.id} className="flex items-center gap-3 px-5 py-3 text-sm">
              <span className="w-16 shrink-0 text-[11px] font-mono text-slate-500">{date}</span>
              <span className="flex-1 truncate text-slate-200">{c.leg_summary}</span>
              <span className={`shrink-0 text-xs font-semibold ${status.color}`}>
                {status.icon} {status.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
