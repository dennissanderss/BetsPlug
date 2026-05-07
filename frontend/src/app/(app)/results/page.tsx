"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Calculator,
  Info,
  Lock,
} from "lucide-react";
import { useTier, TIER_RANK as USER_TIER_RANK, type Tier } from "@/hooks/use-tier";
import Image from "next/image";
import { TeamLogo } from "@/components/dashboard/TeamLogo";
import { api } from "@/lib/api";
import { useTranslations } from "@/i18n/locale-provider";
import { PaywallOverlay } from "@/components/ui/paywall-overlay";
import { UpsellBanner } from "@/components/ui/upsell-banner";
import { RelatedLinks } from "@/components/ui/related-links";
import { Sparkles, ClipboardList } from "lucide-react";
import type { Fixture, WeeklySummary } from "@/types/api";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { derivePickSide } from "@/lib/prediction-pick";

// ─── Types ────────────────────────────────────────────────────────────────────

// Now a plain integer — the user can freely dial how far back to
// look (presets: 7 / 14 / 30; custom: any value within the backend
// cap). The calculator is Live-only by design, since backtest
// fixtures don't carry reliable pre-match odds and simulated
// returns against model-implied odds would overstate performance.
type PeriodFilter = number;
type ResultFilter = "All" | "Correct" | "Incorrect";

// Backend currently caps /fixtures/results at 365 days. Anything beyond
// needs a dedicated historical endpoint (planned).
const PERIOD_MIN = 1;
const PERIOD_MAX = 365;
const PERIOD_PRESETS: number[] = [7, 14, 30, 90];

// Launch instant of the strict pre-match live measurement. MUST mirror
// backend/app/core/prediction_filters.py V81_DEPLOYMENT_CUTOFF
// (datetime(2026, 4, 16, 11, 0, 0, UTC)) and trackrecord_filter()'s
// boundary semantics (predicted_at <= scheduled_at, inclusive). Without
// this alignment the Results-page Live winrate disagreed with
// /trackrecord/summary by ~11 hours of edge cases on 16 Apr 2026:
// picks made between 00:00–11:00 UTC were counted live by the FE but
// rejected by the backend filter.
const LIVE_START_MS = Date.UTC(2026, 3, 16, 11, 0, 0); // 11:00 UTC, matches V81_DEPLOYMENT_CUTOFF
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function isLivePick(f: Fixture): boolean {
  const pred = f.prediction;
  if (!pred || !pred.predicted_at) return false;
  const predMs = new Date(pred.predicted_at).getTime();
  const schedMs = new Date(f.scheduled_at).getTime();
  if (!Number.isFinite(predMs) || !Number.isFinite(schedMs)) return false;
  // Inclusive on both sides: predicted_at <= scheduled_at matches the
  // backend's trackrecord_filter (predicted_at <= scheduled_at is the
  // majority of v8.1 batch-simulation picks where predicted_at is
  // stamped at exactly the kickoff timestamp — they are pre-match
  // by design).
  return predMs <= schedMs && predMs >= LIVE_START_MS;
}

/** Whole days elapsed since the live-measurement launched. */
function daysOfLiveData(now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - LIVE_START_MS) / ONE_DAY_MS));
}

// Calculator + table both draw from the strict pre-match Live
// measurement universe. Backtest mode (model-implied odds for picks
// that lacked real bookmaker data) was removed because it produced
// near-zero ROI by construction, regardless of model quality. Type
// kept as a discriminated union for forward-compat in case Backtest
// returns once we have real historical odds, but the only legal
// runtime value is now "live".
type DataSource = "live" | "backtest";

// Which pick-stream the calculator / table should show. "botd" = the
// Bet of the Day stream: highest-confidence Gold-tier pick per day.
type StreamMode = "all" | "botd";

/**
 * Reduce a fixture list to the Bet of the Day stream: for each
 * calendar day, keep only the Gold-tier pick with the highest
 * confidence. Mirrors the backend `/betoftheday` selection rule
 * (Gold floor 0.70, top Gold-tier leagues, one per day).
 */
function filterBotdStream(fixtures: Fixture[]): Fixture[] {
  const bestByDate = new Map<string, Fixture>();
  for (const f of fixtures) {
    if (!f.prediction || !f.result) continue;
    if (f.prediction.pick_tier !== "gold") continue;
    const dateKey = f.scheduled_at.slice(0, 10); // YYYY-MM-DD
    const prev = bestByDate.get(dateKey);
    const prevConf = prev?.prediction?.confidence ?? -1;
    const thisConf = f.prediction.confidence ?? 0;
    if (thisConf > prevConf) bestByDate.set(dateKey, f);
  }
  return Array.from(bestByDate.values());
}
// v8.6 — "all" tab removed: each tier is a different product (scope +
// confidence floor), so adding their totals together produced a
// number users couldn't interpret. Force the view to pick a specific
// tier; default to Gold (the flagship).
type TierFilter = "free" | "silver" | "gold" | "platinum";

const TIER_TABS: { key: TierFilter; label: string }[] = [
  { key: "free", label: "Free Access · 45%+" },
  { key: "silver", label: "Silver · 60%+" },
  { key: "gold", label: "Gold · 70%+" },
  { key: "platinum", label: "Platinum · 80%+" },
];

// Live v8.1 tracking started at the deploy cutoff — see
// backend/app/core/prediction_filters.py V81_DEPLOYMENT_CUTOFF.
// Kept as a literal so the page doesn't need an extra API round-trip
// and the number lines up with the homepage copy.
const LIVE_TRACKING_START = "2026-04-16";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatMatchDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function getConfidenceColor(conf: number): string {
  if (conf >= 0.75) return "#10b981";
  if (conf >= 0.5) return "#f59e0b";
  return "#ef4444";
}

function getConfidenceBg(conf: number): string {
  if (conf >= 0.75) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (conf >= 0.5) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return "bg-red-500/10 text-red-400 border-red-500/20";
}

function formatPredictedOutcome(
  outcome: string,
  homeProb: number,
  drawProb: number | null,
  awayProb: number,
  t: (key: any) => string
): string {
  const label = outcome === "home_win"
    ? t("results.outcomeHomeWin")
    : outcome === "away_win"
    ? t("results.outcomeAwayWin")
    : outcome === "draw"
    ? t("results.outcomeDraw")
    : slugToTitle(outcome);

  const prob = outcome === "home_win"
    ? homeProb
    : outcome === "away_win"
    ? awayProb
    : (drawProb ?? 0);

  return `${label} @ ${Math.round(prob * 100)}%`;
}

// ─── Weekly Summary Card ──────────────────────────────────────────────────────

function WeeklySummaryCard({ data, isLoading, isError, isFree, scopeLabel }: {
  data: WeeklySummary | undefined;
  isLoading: boolean;
  isError: boolean;
  isFree: boolean;
  /** Dynamic scope ("365 days · Silver tier") so the card's title
   *  matches the calculator's actual filter. The legacy "This Week's
   *  Performance" string was hardcoded but the data is filtered by
   *  whatever period the user picked, so the title lied on anything
   *  other than 7d. */
  scopeLabel: string;
}) {
  const { t } = useTranslations();
  if (isLoading) {
    return (
      <div
        className="glass-card animate-pulse p-6"
        style={{ borderColor: "rgba(16,185,129,0.18)", border: "1px solid" }}
      >
        <div className="h-5 w-48 rounded bg-white/[0.06] mb-4" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded bg-white/[0.06]" />
          ))}
        </div>
        <div className="h-4 w-full rounded bg-white/[0.04]" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div
        className="glass-card p-6"
        style={{ border: "1px solid rgba(16,185,129,0.18)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-slate-200">Performance · <span className="font-normal text-slate-400">{scopeLabel}</span></h2>
        </div>
        <p className="text-sm text-slate-500 italic">{t("results.noResultsThisWeek")}</p>
      </div>
    );
  }

  const winRatePct = Math.round(data.win_rate * 100);
  const plSign = data.pl_units >= 0 ? "+" : "";

  const statItems = [
    { label: t("results.statTotalCalls"), value: String(data.total_calls), color: "#3b82f6" },
    { label: t("results.statWon"), value: String(data.won), color: "#10b981" },
    { label: t("results.statLost"), value: String(data.lost), color: "#ef4444" },
    { label: t("results.statWinRate"), value: `${winRatePct}%`, color: winRatePct >= 50 ? "#10b981" : "#ef4444" },
    {
      label: t("results.statPLUnits"),
      value: `${plSign}${data.pl_units.toFixed(1)}`,
      color: data.pl_units >= 0 ? "#10b981" : "#ef4444",
    },
  ];

  return (
    <div
      className="glass-card p-6"
      style={{ border: "1px solid rgba(16,185,129,0.18)" }}
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
          <Trophy className="h-4 w-4 text-emerald-400" />
        </div>
        <h2 className="text-sm font-semibold text-slate-200">{t("results.thisWeekPerformance")}</h2>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-5">
        {statItems.map(({ label, value, color }) => {
          // Free Access: lock the Net P/L tile since it's a monetary
          // simulation output. Total calls, wins, losses, win rate stay
          // open so the track record itself is still visible.
          const isPLTile = label === t("results.statPLUnits");
          const lockedTile = isFree && isPLTile;
          return (
          <div
            key={label}
            className="flex flex-col items-center justify-center gap-1 rounded-lg bg-white/[0.03] border border-white/[0.06] py-3 px-2 text-center"
          >
            {lockedTile ? (
              <LockPill requiredTier="silver" />
            ) : (
            <span
              className="text-2xl font-extrabold leading-none tabular-nums"
              style={{ color }}
            >
              {value}
            </span>
            )}
            <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
              {label}
            </span>
          </div>
          );
        })}
      </div>

      {/* Performers */}
      {(data.best_performers?.length > 0 || data.worst_performers?.length > 0) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.best_performers?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-500">
                  {t("results.bestPerformers")}
                </span>
              </div>
              <div className="space-y-1.5">
                {data.best_performers.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between rounded-lg bg-emerald-500/5 border border-emerald-500/10 px-3 py-1.5"
                  >
                    <span className="text-xs text-slate-300 truncate">{p.name}</span>
                    <span className="text-xs font-bold text-emerald-400 shrink-0 ml-2">
                      {Math.round(p.accuracy * 100)}% ({p.total})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.worst_performers?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-red-500">
                  {t("results.worstPerformers")}
                </span>
              </div>
              <div className="space-y-1.5">
                {data.worst_performers.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between rounded-lg bg-red-500/5 border border-red-500/10 px-3 py-1.5"
                  >
                    <span className="text-xs text-slate-300 truncate">{p.name}</span>
                    <span className="text-xs font-bold text-red-400 shrink-0 ml-2">
                      {Math.round(p.accuracy * 100)}% ({p.total})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ROI Calculator ───────────────────────────────────────────────────────────
//
// "What would you have made?" — turns each evaluated pick into a concrete
// euro return at a user-chosen stake, using the actual pre-match 1X2 odds
// stored for that fixture. Missing odds fall back to a flat 1.90 and are
// flagged as estimated so the headline number remains honest.
//
// The component is fed the full 30-day fixture list (regardless of the
// active table filters) so its own tier/period tabs remain independent.

type CalcTier = TierFilter;
type CalcPeriod = PeriodFilter;

const CALC_TIERS: { key: CalcTier; label: string; accent: string }[] = [
  { key: "free", label: "Free Access", accent: "#b07a3a" },
  { key: "silver", label: "Silver", accent: "#9aa3b2" },
  { key: "gold", label: "Gold", accent: "#d4a017" },
  { key: "platinum", label: "Platinum", accent: "#10b981" },
];

const STAKE_STORAGE_KEY = "betsplug.roiCalc.stake";
const STAKE_OPTIONS = [5, 10, 25, 50, 100];

interface PickAggregate {
  matches: number;
  wins: number;
  losses: number;
  realStake: number;   // stake backed by real pre-match odds
  modelStake: number;  // stake backed by model-implied odds (1/prob)
  returned: number;    // gross returned (stake × odds on wins, 0 on losses)
  profit: number;      // returned - totalStake
  modelCount: number;  // rows where odds were derived from the model, not the book
  oddsSum: number;     // sum of odds used across all picks (for avg)
}

function emptyAggregate(): PickAggregate {
  return {
    matches: 0,
    wins: 0,
    losses: 0,
    realStake: 0,
    modelStake: 0,
    returned: 0,
    profit: 0,
    modelCount: 0,
    oddsSum: 0,
  };
}

/** Wilson 95% CI half-interval on a Bernoulli proportion. */
function wilsonCi(correct: number, total: number): { lower: number; upper: number } | null {
  if (total <= 0) return null;
  const z = 1.96;
  const p = correct / total;
  const denom = 1 + (z * z) / total;
  const centre = p + (z * z) / (2 * total);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);
  return {
    lower: Math.max(0, (centre - margin) / denom),
    upper: Math.min(1, (centre + margin) / denom),
  };
}

/**
 * Pick the odds used for a given fixture + pick side. Returns real
 * pre-match 1X2 odds when available, otherwise derives a fair odd
 * from the prediction's own probability (implied = 1 / prob). Flat
 * 1.90 is only used when neither is available — which in practice
 * should never fire because every counted fixture has a prediction.
 */
function oddsForPick(fixture: Fixture, side: "home" | "draw" | "away"): {
  odds: number;
  source: "real" | "model" | "flat";
} {
  const o = fixture.odds;
  const real =
    side === "home" ? o?.home :
    side === "away" ? o?.away :
    o?.draw;
  if (real != null && real > 1) return { odds: real, source: "real" };

  const p = fixture.prediction;
  const prob =
    p == null ? null :
    side === "home" ? p.home_win_prob :
    side === "away" ? p.away_win_prob :
    (p.draw_prob ?? null);
  if (prob != null && prob > 0 && prob < 1) {
    return { odds: 1 / prob, source: "model" };
  }
  return { odds: 1.9, source: "flat" };
}

// Tier comparison mode: "band" partitions picks into disjoint tier bands
// (Free 45-59% confidence, Silver 60-69%, Gold 70-84%, Platinum 85%+).
// "subscriber" simulates what a subscriber AT THAT TIER actually
// experiences — the cumulative scope: a Silver subscriber sees Silver
// picks PLUS the lower-tier (Free) picks, because their tier funnel
// includes everything below their floor.
type CompareMode = "band" | "subscriber";

// v8.6 — display filter mode for the simulator. "filtered" applies the
// same per-tier recipe the Predictions tool uses (default; matches
// Trackrecord 'Onze prestatie' tab). "all" includes every prediction
// the model produced regardless of recipe (matches Trackrecord
// 'Modelvalidatie' tab).
type DisplayFilterMode = "filtered" | "all";

const TIER_RANK_MAP: Record<CalcTier, number> = {
  free: 0,
  silver: 1,
  gold: 2,
  platinum: 3,
};

// Mirrors backend/app/core/predictions_display_filter.py recipes.
// Keep these in sync when the recipes change.
function passesDisplayRecipe(
  tier: CalcTier,
  pred: { confidence?: number | null; edge_pct?: number | null; bookmaker_odds_pick?: number | null } | null | undefined,
): boolean {
  if (!pred) return false;
  const conf = pred.confidence ?? 0;
  const edge = pred.edge_pct ?? null;
  const odds = pred.bookmaker_odds_pick ?? null;
  if (tier === "free") {
    return conf >= 0.60;
  }
  if (tier === "silver") {
    return conf >= 0.62 && edge !== null && edge >= 0.0 && odds !== null && odds >= 1.60;
  }
  if (tier === "gold") {
    return conf >= 0.65 && edge !== null && edge >= 0.06 && odds !== null && odds >= 1.80;
  }
  if (tier === "platinum") {
    return conf >= 0.78 && edge !== null && edge >= 0.08 && odds !== null && odds >= 1.50 && odds <= 3.00;
  }
  return false;
}

function aggregateFixtures(
  fixtures: Fixture[],
  stake: number,
  tier: CalcTier,
  periodDays: CalcPeriod,
  now: Date,
  dataSource: DataSource = "live",
  mode: CompareMode = "band",
  displayFilter: DisplayFilterMode = "filtered",
): PickAggregate {
  const cutoffMs = now.getTime() - periodDays * 24 * 60 * 60 * 1000;
  const agg = emptyAggregate();
  const targetRank = TIER_RANK_MAP[tier];

  for (const f of fixtures) {
    if (f.status !== "finished" || !f.result || !f.prediction) continue;
    // "band" → exclusive tier match (the engine's classification of
    // each pick). "subscriber" → cumulative downward (every pick the
    // subscriber's tier funnel admits). The dashboard's
    // UpcomingPicksStrip uses the same `pickRank <= userRank` rule.
    const pickRank = TIER_RANK_MAP[f.prediction.pick_tier as CalcTier];
    if (mode === "band") {
      if (f.prediction.pick_tier !== tier) continue;
    } else {
      if (pickRank == null || pickRank > targetRank) continue;
    }
    // v8.6 — display filter: when "filtered" (default), only count
    // picks meeting the per-tier display recipe used by /predictions.
    // When "all", count every prediction the model produced.
    if (displayFilter === "filtered" && !passesDisplayRecipe(tier, f.prediction)) {
      continue;
    }
    // In live mode only count picks that were locked pre-kickoff
    // since LIVE_START_MS. Backtest mode drops that constraint and
    // simulates against the full model-validation history.
    if (dataSource === "live" && !isLivePick(f)) continue;
    const scheduled = new Date(f.scheduled_at).getTime();
    if (!Number.isFinite(scheduled) || scheduled < cutoffMs) continue;

    const side = derivePickSide(f.prediction);
    if (side === null) continue;

    const { home_score, away_score } = f.result;
    const actual =
      home_score > away_score ? "home" : away_score > home_score ? "away" : "draw";
    const won = actual === side;

    const { odds: oddsUsed, source: oddsSrc } = oddsForPick(f, side);
    if (oddsSrc === "real") {
      agg.realStake += stake;
    } else {
      agg.modelStake += stake;
      agg.modelCount++;
    }

    agg.matches++;
    agg.oddsSum += oddsUsed;
    if (won) {
      agg.wins++;
      agg.returned += stake * oddsUsed;
    } else {
      agg.losses++;
    }
  }
  const totalStake = agg.realStake + agg.modelStake;
  agg.profit = agg.returned - totalStake;
  return agg;
}

function formatEuro(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  const abs = Math.abs(n);
  return `${sign}€${abs.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatRoiPct(profit: number, totalStake: number): string {
  if (totalStake <= 0) return "—";
  const pct = (profit / totalStake) * 100;
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "";
  return `${sign}${Math.abs(pct).toFixed(1)}%`;
}

function RoiCalculatorCard({
  fixtures,
  isLoading,
  stake,
  setStake,
  calcTier,
  setCalcTier,
  calcPeriod,
  setCalcPeriod,
  stream,
  setStream,
  dataSource,
  setDataSource,
  userTier,
  isAdmin,
}: {
  fixtures: Fixture[];
  isLoading: boolean;
  stake: number;
  setStake: (v: number) => void;
  calcTier: CalcTier;
  setCalcTier: (v: CalcTier) => void;
  calcPeriod: CalcPeriod;
  setCalcPeriod: (v: CalcPeriod) => void;
  stream: StreamMode;
  setStream: (v: StreamMode) => void;
  dataSource: DataSource;
  setDataSource: (v: DataSource) => void;
  userTier: Tier;
  isAdmin: boolean;
}) {
  const { t } = useTranslations();
  const botdMode = stream === "botd";
  const isFree = userTier === "free";
  const userRank = USER_TIER_RANK[userTier];
  const canSelectTier = (target: CalcTier): boolean =>
    USER_TIER_RANK[target as Tier] <= userRank;

  // The simulator uses tier-band mode so labels align with Track Record:
  // "Platinum" on this page = picks the engine classified as Platinum
  // (the same 298-pick set Track Record reports as Platinum-tier). The
  // cumulative subscriber view was technically more accurate to the
  // product funnel, but having two pages disagree on what "Platinum"
  // means broke trust — Track Record showed 298 / 85.2% and Result
  // Simulation showed 1741 / 65% under the same label. Now both pages
  // mean the same thing when they say "Platinum".
  const compareMode: CompareMode = "band";

  // v8.6 — default ON: only count picks that meet the per-tier display
  // recipe used by /predictions. Power users can flip to "all" to get
  // the full model-validation picture.
  const [displayFilter, setDisplayFilter] = useState<DisplayFilterMode>("filtered");

  // Aggregate the SELECTED tier at the SELECTED period for the headline card.
  const headline = useMemo(() => {
    return aggregateFixtures(fixtures, stake, calcTier, calcPeriod, new Date(), dataSource, compareMode, displayFilter);
  }, [fixtures, stake, calcTier, calcPeriod, dataSource, compareMode, displayFilter]);

  // Breakdown across all four tiers at the selected period, so the user can
  // compare what each tier would have paid out.
  const perTier = useMemo(() => {
    const now = new Date();
    const result: Record<CalcTier, PickAggregate> = {
      free: aggregateFixtures(fixtures, stake, "free", calcPeriod, now, dataSource, compareMode, displayFilter),
      silver: aggregateFixtures(fixtures, stake, "silver", calcPeriod, now, dataSource, compareMode, displayFilter),
      gold: aggregateFixtures(fixtures, stake, "gold", calcPeriod, now, dataSource, compareMode, displayFilter),
      platinum: aggregateFixtures(fixtures, stake, "platinum", calcPeriod, now, dataSource, compareMode, displayFilter),
    };
    return result;
  }, [fixtures, stake, calcPeriod, dataSource, compareMode]);

  // Window-aware messaging for the live-data cap. When the user has
  // dialled the period beyond what live measurement can actually
  // serve, we show a banner and (optionally) a one-click switch to
  // backtest so the picks line and table aren't silently capped.
  const liveDays = daysOfLiveData();
  const overshootingLiveWindow = dataSource === "live" && calcPeriod > liveDays;

  const headlineTotalStake = headline.realStake + headline.modelStake;
  const profitColor = headline.profit >= 0 ? "#10b981" : "#ef4444";

  if (isLoading) {
    return (
      <div className="glass-card p-6 animate-pulse" style={{ border: "1px solid rgba(16,185,129,0.18)" }}>
        <div className="h-5 w-56 rounded bg-white/[0.06] mb-4" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded bg-white/[0.06]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="glass-card p-5 sm:p-6"
      style={{ border: "1px solid rgba(16,185,129,0.18)" }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
          <Calculator className="h-4 w-4 text-emerald-400" />
        </div>
        <h2 className="text-sm font-semibold text-slate-200">
          {t("results.roiCalcTitle")}
        </h2>
        <span className="text-[10px] uppercase tracking-widest text-slate-500 ml-auto">
          {t("results.roiCalcSimulation")}
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-5">{t("results.roiCalcIntro")}</p>

      {/* Live-only data source. Backtest was removed because reconstructed
          1/prob odds gave zero-EV by construction — see commit history. */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live measurement
          </span>
          <span className="text-[11px] text-slate-300">
            Real pre-match 1X2 odds, started <span className="font-semibold tabular-nums">16 Apr 2026</span>
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 tabular-nums">
          <span className="text-[10px] uppercase tracking-widest text-slate-500">Day</span>
          <span className="text-base font-extrabold text-emerald-300">{liveDays}</span>
          <span className="text-[10px] text-slate-500">/ 90 before ROI claims open</span>
        </div>
      </div>

      {/* ── Stream toggle — All predictions vs Bet of the Day ── */}
      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 w-fit">
        {([
          { key: "all" as const, label: t("results.streamAll"), locked: false },
          { key: "botd" as const, label: t("results.streamBotd"), locked: isFree },
        ]).map((opt) => {
          const active = stream === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              disabled={opt.locked}
              onClick={() => !opt.locked && setStream(opt.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                opt.locked
                  ? "text-slate-600 cursor-not-allowed"
                  : active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              aria-pressed={active}
            >
              {opt.label}
              {opt.locked && <LockPill requiredTier="gold" className="pointer-events-none" />}
            </button>
          );
        })}
      </div>

      {/* v8.6 — Display filter toggle. Default ON: only count picks
          that pass the per-tier display recipe (matches /predictions
          + /trackrecord 'Onze prestatie'). Off: full model picture
          (matches /trackrecord 'Modelvalidatie'). */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2 text-xs text-slate-400">
        <div>
          {displayFilter === "filtered"
            ? "Tellen alleen picks die de tier-filter halen (zoals op /predictions)."
            : "Tellen alle predictions die het model heeft gemaakt — volledig model-beeld."}
        </div>
        <button
          type="button"
          onClick={() => setDisplayFilter(displayFilter === "filtered" ? "all" : "filtered")}
          className="inline-flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-200 hover:border-white/[0.15]"
        >
          {displayFilter === "filtered" ? "Toon ook ongefilterde picks" : "Terug naar gefilterd (default)"}
        </button>
      </div>

      {/* ── Step 1 — Choose tier (locked to Gold in BOTD mode, upper tiers gated by user's own tier) ── */}
      <Step number={1} label={t("results.roiCalcStep1")} hint={botdMode ? t("results.roiCalcStep1LockedHint") : t("results.roiCalcStep1Hint")}>
        <div className="flex flex-wrap items-center gap-2">
          {CALC_TIERS.map(({ key, label, accent }) => {
            const active = key === calcTier;
            const tierLocked = !canSelectTier(key);
            const disabled = (botdMode && key !== "gold") || tierLocked;
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setCalcTier(key)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors border flex items-center gap-1.5 ${
                  active
                    ? "text-white border-white/[0.2]"
                    : disabled
                    ? "text-slate-600 bg-white/[0.01] border-white/[0.04] cursor-not-allowed"
                    : "text-slate-400 bg-white/[0.02] border-white/[0.06] hover:text-slate-200"
                }`}
                style={active ? { background: accent } : undefined}
              >
                {label}
                {tierLocked && <LockPill requiredTier={key as Tier} className="pointer-events-none" />}
              </button>
            );
          })}
          {botdMode && (
            <span className="text-[10px] uppercase tracking-widest text-slate-500 ml-1">
              {t("results.roiCalcStep1Locked")}
            </span>
          )}
        </div>
      </Step>

      {/* ── Step 2 — Stake per pick (locked for Free Access) ── */}
      <Step number={2} label={t("results.roiCalcStep2")} hint={t("results.roiCalcStep2Hint")}>
        {isFree ? (
          <LockedSection requiredTier="silver" title="Upgrade to Silver to set a stake and simulate returns">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5">
                <span className="text-sm text-slate-400">€</span>
                <span className="w-16 text-sm font-semibold text-slate-100 tabular-nums">{stake}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {STAKE_OPTIONS.map((v) => (
                  <span key={v} className="rounded-md px-2.5 py-1.5 text-[11px] font-semibold bg-white/[0.03] text-slate-400">€{v}</span>
                ))}
              </div>
            </div>
          </LockedSection>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5">
              <span className="text-sm text-slate-400">€</span>
              <input
                type="number"
                inputMode="decimal"
                min={1}
                max={10000}
                step={1}
                value={stake}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v) && v >= 0) setStake(v);
                }}
                className="w-16 bg-transparent text-sm font-semibold text-slate-100 tabular-nums focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {STAKE_OPTIONS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setStake(v)}
                  className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                    stake === v
                      ? "bg-emerald-600/80 text-white"
                      : "bg-white/[0.03] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  €{v}
                </button>
              ))}
            </div>
          </div>
        )}
      </Step>

      {/* ── Step 3 — Pick period ─────────────────────────────── */}
      <Step number={3} label={t("results.roiCalcStep3")} hint={t("results.roiCalcStep3Hint")}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1">
            {PERIOD_PRESETS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCalcPeriod(value)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  calcPeriod === value
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {value}d
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5">
            <label className="text-[10px] uppercase tracking-widest text-slate-500">
              {t("results.roiCalcCustomDays")}
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={PERIOD_MIN}
              max={PERIOD_MAX}
              step={1}
              value={calcPeriod}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isFinite(v)) return;
                const clamped = Math.max(PERIOD_MIN, Math.min(PERIOD_MAX, Math.round(v)));
                setCalcPeriod(clamped);
              }}
              className="w-14 bg-transparent text-sm font-semibold text-slate-100 tabular-nums focus:outline-none"
            />
            <span className="text-[10px] text-slate-500">{t("results.roiCalcDaysUnit")}</span>
          </div>
          <span className="text-[10px] text-slate-500">
            {t("results.roiCalcMaxHint", { max: PERIOD_MAX })}
          </span>
        </div>
        {overshootingLiveWindow ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 text-[11px] leading-relaxed text-amber-200">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
            <span>
              {t("results.roiCalcLiveCapNote", {
                requested: calcPeriod,
                live: liveDays,
              })}
            </span>
          </div>
        ) : (
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            {t("results.roiCalcLiveStartNote")}
          </p>
        )}
      </Step>

      {/* ── Step 4 — Your return (locked for Free Access) ── */}
      <Step number={4} label={t("results.roiCalcStep4")} hint={t("results.roiCalcStep4Hint")}>
        {isFree ? (
          <LockedSection
            requiredTier="silver"
            title="Upgrade to Silver to see simulated payouts and ROI"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center justify-center gap-1 rounded-lg bg-white/[0.03] border border-white/[0.06] py-3 px-2 text-center h-[74px]">
                  <span className="text-2xl font-extrabold leading-none tabular-nums text-slate-600">—</span>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-slate-600">
                    {i === 1 ? t("results.roiCalcPicks") : i === 2 ? t("results.roiCalcStaked") : i === 3 ? t("results.roiCalcPayout") : t("results.roiCalcNetResult")}
                  </span>
                </div>
              ))}
            </div>
          </LockedSection>
        ) : null}
        {!isFree && !canSelectTier(calcTier) && (
          <LockedSection
            requiredTier={calcTier}
            title={`Upgrade to ${calcTier.charAt(0).toUpperCase() + calcTier.slice(1)} to simulate this tier`}
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center justify-center gap-1 rounded-lg bg-white/[0.03] border border-white/[0.06] py-3 px-2 text-center h-[74px]">
                  <span className="text-2xl font-extrabold leading-none tabular-nums text-slate-600">—</span>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-slate-600">
                    {i === 1 ? t("results.roiCalcPicks") : i === 2 ? t("results.roiCalcStaked") : i === 3 ? t("results.roiCalcPayout") : t("results.roiCalcNetResult")}
                  </span>
                </div>
              ))}
            </div>
          </LockedSection>
        )}
        {!isFree && canSelectTier(calcTier) && (<>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-3">
          <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-white/[0.03] border border-white/[0.06] py-3 px-2 text-center">
            <span className="text-2xl font-extrabold leading-none tabular-nums text-slate-100">
              {headline.matches}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
              {t("results.roiCalcPicks")}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-white/[0.03] border border-white/[0.06] py-3 px-2 text-center">
            <span className="text-2xl font-extrabold leading-none tabular-nums text-slate-100">
              €{headlineTotalStake.toLocaleString("en-GB", { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
              {t("results.roiCalcStaked")}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-white/[0.03] border border-white/[0.06] py-3 px-2 text-center">
            <span className="text-2xl font-extrabold leading-none tabular-nums text-slate-100">
              €{headline.returned.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
              {t("results.roiCalcPayout")}
            </span>
          </div>
          <div
            className="flex flex-col items-center justify-center gap-1 rounded-lg border py-3 px-2 text-center"
            style={{
              background: headline.profit >= 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
              borderColor: headline.profit >= 0 ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)",
            }}
          >
            <span className="text-2xl font-extrabold leading-none tabular-nums" style={{ color: profitColor }}>
              {formatEuro(headline.profit)}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: profitColor }}>
              {t("results.roiCalcNetResult")} · {formatRoiPct(headline.profit, headlineTotalStake)}
            </span>
          </div>
        </div>

        {/* Math-transparency band — plain stats + sample warning */}
        {headline.matches > 0 && (() => {
          const avgOdds = headline.oddsSum / headline.matches;
          const breakEven = avgOdds > 1 ? 1 / avgOdds : null;
          const winRate = headline.wins / headline.matches;
          const smallSample = headline.matches < 30;
          return (
            <div className="mb-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="grid grid-cols-3 gap-3 text-center mb-2">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-0.5">
                    {t("results.roiCalcWinRate")}
                  </p>
                  <p className="text-sm font-bold tabular-nums text-slate-100">
                    {Math.round(winRate * 100)}%
                  </p>
                </div>
                <div title={t("results.roiCalcAvgOddsTooltip")}>
                  <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-0.5">
                    {t("results.roiCalcAvgOdds")}
                  </p>
                  <p className="text-sm font-bold tabular-nums text-slate-100 cursor-help underline decoration-dotted decoration-slate-600 underline-offset-2">
                    {avgOdds.toFixed(2)}
                  </p>
                </div>
                <div title={t("results.roiCalcBreakEvenTooltip")}>
                  <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-0.5">
                    {t("results.roiCalcBreakEven")}
                  </p>
                  <p
                    className="text-sm font-bold tabular-nums cursor-help underline decoration-dotted decoration-slate-600 underline-offset-2"
                    style={{
                      color:
                        breakEven == null ? "#94a3b8" :
                        winRate >= breakEven ? "#10b981" : "#f59e0b",
                    }}
                  >
                    {breakEven != null ? `${Math.round(breakEven * 100)}%` : "—"}
                  </p>
                </div>
              </div>
              {smallSample && (
                <p className="text-[10px] leading-relaxed text-amber-400/90">
                  <span className="font-semibold">⚠ {t("results.roiCalcSmallSampleTitle")}: </span>
                  {t("results.roiCalcSmallSampleHint", { n: headline.matches })}
                </p>
              )}
            </div>
          );
        })()}

        {/* Per-tier comparison — tap any card to make it the active tier */}
        <p className="mb-1 text-[10px] uppercase tracking-widest text-slate-500">
          {t("results.roiCalcCompareAllTiers")}
        </p>
        <p className="mb-2 text-[10px] leading-relaxed text-slate-500">
          Each row shows the picks the engine classified into that tier band — same set Track Record reports under the same label.
          Higher tier = stricter confidence floor and a smaller sample.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {CALC_TIERS.map(({ key, label, accent }) => {
            const row = perTier[key];
            const totalStake = row.realStake + row.modelStake;
            const active = key === calcTier;
            const tierGated = !canSelectTier(key);
            if (tierGated) {
              return (
                <Link
                  key={key}
                  href="/pricing"
                  className="text-left rounded-lg p-3 border border-amber-500/30 bg-amber-500/[0.04] hover:bg-amber-500/[0.08] transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: accent }}>
                      {label}
                    </span>
                    <Lock className="h-3 w-3 text-amber-400" />
                  </div>
                  <div className="text-sm font-semibold text-amber-300">
                    {`Upgrade to ${label.split(" ")[0]}`}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {t("results.roiCalcLockedHint" as any)}
                  </div>
                </Link>
              );
            }
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCalcTier(key)}
                className={`text-left rounded-lg p-3 border transition-colors ${
                  active
                    ? "bg-white/[0.06] border-white/[0.14]"
                    : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: accent }}>
                    {label}
                  </span>
                  <span className="text-[10px] text-slate-500 tabular-nums">
                    {row.matches} {row.matches === 1 ? t("results.roiCalcPickSingular") : t("results.roiCalcPickPlural")}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className="text-lg font-extrabold tabular-nums"
                    style={{ color: row.profit >= 0 ? "#10b981" : row.matches === 0 ? "#64748b" : "#ef4444" }}
                  >
                    {row.matches === 0 ? "—" : formatEuro(row.profit)}
                  </span>
                  <span
                    className="text-[11px] font-semibold tabular-nums"
                    style={{ color: row.profit >= 0 ? "#10b981" : row.matches === 0 ? "#64748b" : "#ef4444" }}
                  >
                    {row.matches === 0 ? "" : formatRoiPct(row.profit, totalStake)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 tabular-nums">
                  {row.wins}W · {row.losses}L
                  {row.modelCount > 0 && (
                    <span
                      className="ml-1 text-sky-400"
                      title={`${row.modelCount} pick${row.modelCount === 1 ? "" : "s"} priced with model-implied odds (no bookmaker odds on file).`}
                    >
                      · {row.modelCount} model
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        </>)}
      </Step>

      {/* Footnote / disclaimer */}
      <div className="mt-4 flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
        <Info className="h-3.5 w-3.5 text-slate-500 mt-0.5 shrink-0" />
        <p>
          {t("results.roiCalcDisclaimer")}
          {headline.modelCount > 0 && (
            <span className="text-sky-400">
              {" "}
              {t("results.roiCalcModelNote", {
                count: headline.modelCount,
                total: headline.matches,
              })}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

// Numbered-step wrapper — uniform visual for each config row.
function Step({
  number,
  label,
  hint,
  children,
}: {
  number: number;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 pb-4 border-b border-white/[0.04] last:mb-0 last:pb-0 last:border-b-0">
      <div className="flex items-center gap-2 mb-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-400 tabular-nums">
          {number}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-300">
          {label}
        </span>
        {hint && (
          <span className="text-[11px] text-slate-500 hidden sm:inline">— {hint}</span>
        )}
      </div>
      {hint && (
        <p className="text-[11px] text-slate-500 sm:hidden mb-2">{hint}</p>
      )}
      {children}
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  period: PeriodFilter;
  setPeriod: (v: PeriodFilter) => void;
  resultFilter: ResultFilter;
  setResultFilter: (v: ResultFilter) => void;
  leagueFilter: string;
  setLeagueFilter: (v: string) => void;
  leagues: string[];
  total: number;
  dataSource: DataSource;
}

function ResultsFilterBar({
  period,
  setPeriod,
  resultFilter,
  setResultFilter,
  leagueFilter,
  setLeagueFilter,
  leagues,
  total,
  dataSource,
}: FilterBarProps) {
  const { t } = useTranslations();

  const resultOptions: { value: ResultFilter; label: string }[] = [
    { value: "All", label: t("results.filterAll") },
    { value: "Correct", label: t("results.filterCorrect") },
    { value: "Incorrect", label: t("results.filterIncorrect") },
  ];

  // Real-world cutoff so users can verify the period filter is honest
  // (avoids the "I asked for 4 days but I see older matches" question).
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  const cutoffDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);
  const todayDate = new Date();

  return (
    <div className="glass-card p-4">
      <div className="flex flex-wrap items-center gap-3">

        {/* Period badge — the period control itself lives in Step 3 of the calculator */}
        <div className="flex flex-col gap-0.5 mr-1">
          <span className="text-[10px] uppercase tracking-widest text-slate-500">
            {t("results.filterShowingRange", {
              from: fmtDate(cutoffDate),
              to: fmtDate(todayDate),
            })}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">
            {t("results.sourceLive")}
          </span>
        </div>

        {/* Result filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1">
            {resultOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setResultFilter(opt.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  resultFilter === opt.value
                    ? opt.value === "Correct"
                      ? "bg-emerald-600/80 text-white"
                      : opt.value === "Incorrect"
                      ? "bg-red-600/80 text-white"
                      : "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* League dropdown */}
        {leagues.length > 0 && (
          <div className="relative flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <div className="relative">
              <select
                value={leagueFilter}
                onChange={(e) => setLeagueFilter(e.target.value)}
                className="appearance-none rounded-lg border border-white/[0.06] bg-white/[0.03] pl-3 pr-7 py-1.5 text-xs font-semibold text-slate-300 focus:outline-none focus:border-blue-500/40 cursor-pointer"
              >
                <option value="">{t("results.allLeagues")}</option>
                {leagues.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
            </div>
          </div>
        )}

        {/* Count */}
        <span className="ml-auto text-xs text-slate-500 whitespace-nowrap">
          {total} {total !== 1 ? t("results.resultsPlural") : t("results.resultSingular")}
        </span>
      </div>
    </div>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────

function ResultCard({ fixture, stake, isFree }: { fixture: Fixture; stake: number; isFree: boolean }) {
  const pred = fixture.prediction;
  const hasPrediction = pred !== null;

  // Determine correctness from result vs prediction
  let isCorrect: boolean | null = null;
  let predictedSide: "home" | "draw" | "away" | null = null;
  if (hasPrediction && fixture.result) {
    const { home_score, away_score } = fixture.result;
    const actualOutcome =
      home_score > away_score ? "home_win" :
      away_score > home_score ? "away_win" : "draw";
    predictedSide = derivePickSide(pred);
    const predicted =
      predictedSide === "home"
        ? "home_win"
        : predictedSide === "away"
        ? "away_win"
        : "draw";
    isCorrect = actualOutcome === predicted;
  }

  // Compute odds used for the pick: real pre-match 1X2 odds if on file,
  // else model-implied fair odds (1 / prob), else flat 1.90 as a last
  // resort. Return is concrete euros at the user's selected stake so
  // the table always agrees with the headline calculator.
  let oddsUsed: number | null = null;
  let oddsSource: "real" | "model" | "flat" | null = null;
  let returnEuro: number | null = null;
  if (isCorrect !== null && predictedSide !== null) {
    const picked = oddsForPick(fixture, predictedSide);
    oddsUsed = picked.odds;
    oddsSource = picked.source;
    returnEuro = isCorrect ? stake * oddsUsed - stake : -stake;
  }

  const homeScore = fixture.result?.home_score ?? null;
  const awayScore = fixture.result?.away_score ?? null;

  // Compact pick label
  const pickLabel =
    predictedSide === "home" ? "1" :
    predictedSide === "draw" ? "X" :
    predictedSide === "away" ? "2" : "—";

  const borderColor = isCorrect === true ? "#10b981" : isCorrect === false ? "#ef4444" : "#334155";

  // Human-readable formula shown on hover — makes the return verifiable.
  const formulaTitle =
    oddsUsed != null && returnEuro != null
      ? isCorrect
        ? `€${stake.toFixed(2)} × ${oddsUsed.toFixed(2)} − €${stake.toFixed(2)} = €${returnEuro.toFixed(2)} profit`
        : `Lost €${stake.toFixed(2)} stake (odds ${oddsUsed.toFixed(2)} not realised)`
      : undefined;

  const returnColor =
    returnEuro == null ? "#64748b" : returnEuro > 0 ? "#10b981" : returnEuro < 0 ? "#ef4444" : "#94a3b8";
  const returnPrefix = returnEuro == null ? "" : returnEuro > 0 ? "+" : returnEuro < 0 ? "−" : "";
  const returnAbs = returnEuro == null ? 0 : Math.abs(returnEuro);

  return (
    <div
      className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2.5 sm:py-3 hover:bg-white/[0.02] transition-colors"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      {/* Date */}
      <span className="w-12 sm:w-16 shrink-0 text-[10px] sm:text-xs text-slate-500 tabular-nums">
        {new Date(fixture.scheduled_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
      </span>

      {/* Home team */}
      <span className={`flex-1 min-w-0 flex items-center gap-1.5 text-xs sm:text-sm font-medium truncate ${isCorrect === true && pickLabel === "1" ? "text-emerald-300" : "text-slate-200"}`}>
        <TeamLogo src={fixture.home_team_logo} name={fixture.home_team_name} size={16} className="sm:w-[18px] sm:h-[18px]" />
        <span className="truncate">{fixture.home_team_name}</span>
      </span>

      {/* Score */}
      <span className="w-10 sm:w-14 text-center text-xs sm:text-sm font-bold tabular-nums text-slate-100 shrink-0">
        {homeScore ?? "–"}-{awayScore ?? "–"}
      </span>

      {/* Away team */}
      <span className={`flex-1 min-w-0 flex items-center gap-1.5 text-xs sm:text-sm font-medium truncate ${isCorrect === true && pickLabel === "2" ? "text-emerald-300" : "text-slate-200"}`}>
        <TeamLogo src={fixture.away_team_logo} name={fixture.away_team_name} size={16} className="sm:w-[18px] sm:h-[18px]" />
        <span className="truncate">{fixture.away_team_name}</span>
      </span>

      {/* Pick (hidden on narrow phone) */}
      <span
        className="hidden sm:inline w-8 text-center text-xs font-bold rounded shrink-0"
        style={{ color: isCorrect === true ? "#10b981" : isCorrect === false ? "#ef4444" : "#64748b" }}
      >
        {pickLabel}
      </span>

      {/* Odds used (hidden on narrow phone, locked for Free Access) */}
      <span className="hidden sm:flex w-20 shrink-0 items-center justify-center gap-1">
        {isFree ? (
          <LockPill requiredTier="silver" />
        ) : oddsUsed != null ? (
          <>
            <span className="text-xs font-semibold tabular-nums text-slate-300">
              {oddsUsed.toFixed(2)}
            </span>
            {oddsSource === "real" ? (
              <span
                title="Pre-match 1X2 odds from the bookmaker snapshot stored for this fixture."
                className="text-[8px] font-bold uppercase rounded px-1 py-[1px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              >
                REAL
              </span>
            ) : oddsSource === "model" ? (
              <span
                title="No bookmaker odds on file — fair odds implied by the model's probability (1 / prob)."
                className="text-[8px] font-bold uppercase rounded px-1 py-[1px] bg-sky-500/15 text-sky-400 border border-sky-500/30"
              >
                MODEL
              </span>
            ) : (
              <span
                title="Neither bookmaker nor model odds available — flat 1.90 fallback."
                className="text-[8px] font-bold uppercase rounded px-1 py-[1px] bg-amber-500/15 text-amber-400 border border-amber-500/30"
              >
                FLAT
              </span>
            )}
          </>
        ) : (
          <span className="text-xs text-slate-600">—</span>
        )}
      </span>

      {/* Return in euro (hidden on narrow phone, locked for Free Access) */}
      <span
        title={isFree ? undefined : formulaTitle}
        className="hidden sm:inline w-20 text-right text-xs font-bold tabular-nums shrink-0"
        style={{ color: returnColor }}
      >
        {isFree ? (
          <LockPill requiredTier="silver" />
        ) : returnEuro != null
          ? `${returnPrefix}€${returnAbs.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : "—"}
      </span>

      {/* Result icon */}
      <span className="w-6 sm:w-8 text-center shrink-0">
        {isCorrect === true ? (
          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 inline" />
        ) : isCorrect === false ? (
          <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400 inline" />
        ) : (
          <span className="text-xs text-slate-600">—</span>
        )}
      </span>
    </div>
  );
}

// ─── Table footer: per-row return totals (verifies headline calculator) ─────

function ResultsTableFooter({ fixtures, stake, isFree }: { fixtures: Fixture[]; stake: number; isFree: boolean }) {
  const { t } = useTranslations();
  let totalStake = 0;
  let totalPayout = 0;
  let wins = 0;
  let losses = 0;
  let realCount = 0;
  let modelCount = 0;
  for (const f of fixtures) {
    if (!f.prediction || !f.result) continue;
    const side = derivePickSide(f.prediction);
    if (side === null) continue;
    const { home_score, away_score } = f.result;
    const actual = home_score > away_score ? "home" : away_score > home_score ? "away" : "draw";
    const won = actual === side;
    const { odds, source } = oddsForPick(f, side);
    if (source === "real") realCount++;
    else modelCount++;
    totalStake += stake;
    if (won) { wins++; totalPayout += stake * odds; }
    else losses++;
  }
  const totalReturn = totalPayout - totalStake;
  const color = totalReturn > 0 ? "#10b981" : totalReturn < 0 ? "#ef4444" : "#94a3b8";
  const prefix = totalReturn > 0 ? "+" : totalReturn < 0 ? "−" : "";
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.02] border-t border-white/[0.05] text-[10px] uppercase tracking-widest">
      <span className="w-12 sm:w-16 shrink-0 text-slate-500">{t("results.totalLabel")}</span>
      <span className="flex-1 text-slate-500 tabular-nums">
        <span className="text-emerald-400">{wins}W</span>
        {" · "}
        <span className="text-red-400">{losses}L</span>
        {!isFree && (
          <>
            {" · staked €"}{totalStake.toFixed(2)}
            {realCount > 0 && (
              <span className="text-emerald-500 ml-1">· {realCount} real</span>
            )}
            {modelCount > 0 && (
              <span className="text-sky-400 ml-1">· {modelCount} model</span>
            )}
          </>
        )}
      </span>
      <span className="hidden sm:inline w-20 text-right font-bold tabular-nums" style={{ color }}>
        {isFree
          ? <LockPill requiredTier="silver" />
          : `${prefix}€${Math.abs(totalReturn).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      </span>
      <span className="w-6 sm:w-8" />
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex-shrink-0 lg:w-44 space-y-2">
          <div className="h-3 w-24 rounded bg-white/[0.06]" />
          <div className="h-3 w-32 rounded bg-white/[0.04]" />
        </div>
        <div className="flex-1 flex items-center justify-center gap-4">
          <div className="h-4 flex-1 max-w-[120px] rounded bg-white/[0.06]" />
          <div className="h-8 w-16 rounded bg-white/[0.06]" />
          <div className="h-4 flex-1 max-w-[120px] rounded bg-white/[0.06]" />
        </div>
        <div className="flex-shrink-0 lg:w-52 flex flex-col items-end gap-2">
          <div className="h-3 w-32 rounded bg-white/[0.06]" />
          <div className="h-6 w-24 rounded-full bg-white/[0.06]" />
          <div className="h-5 w-28 rounded-full bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}


// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  return (
    <Suspense fallback={null}>
      <ResultsPageContent />
    </Suspense>
  );
}

const VALID_TIERS: readonly TierFilter[] = ["free", "silver", "gold", "platinum"] as const;

// ─── Shared lock UI ──────────────────────────────────────────────────────
// Small inline chip rendered next to a control that's gated. On hover it
// explains why the control is disabled and where to upgrade.
function LockPill({
  requiredTier,
  className = "",
}: { requiredTier: Tier; className?: string }) {
  const label =
    requiredTier === "silver" ? "Silver" :
    requiredTier === "gold" ? "Gold" :
    requiredTier === "platinum" ? "Platinum" :
    "Upgrade";
  return (
    <Link
      href="/pricing"
      title={`Upgrade to ${label} to unlock`}
      className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-white/[0.06] text-slate-400 border border-white/[0.08] hover:text-amber-300 hover:border-amber-500/40 transition-colors ${className}`}
    >
      <Lock className="h-2.5 w-2.5" />
      {label}
    </Link>
  );
}

// Full-panel overlay: blurs children and renders an upgrade CTA on top.
function LockedSection({
  requiredTier,
  children,
  title,
}: { requiredTier: Tier; children: React.ReactNode; title?: string }) {
  const label =
    requiredTier === "silver" ? "Silver" :
    requiredTier === "gold" ? "Gold" :
    requiredTier === "platinum" ? "Platinum" : "Upgrade";
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <Link
          href="/pricing"
          className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/15 hover:border-amber-500/60 transition-colors"
        >
          <Lock className="h-3.5 w-3.5" />
          <span>{title ?? `Upgrade to ${label} to unlock`}</span>
        </Link>
      </div>
    </div>
  );
}

function ResultsPageContent() {
  const { t } = useTranslations();
  const { tier: userTier, isAdmin, isTestingTier } = useTier();
  // Treat admins-in-tier-preview as non-admin for the live-measurement
  // lock so they can verify the locked experience matches what real
  // users will see. Switching the admin testing tier toggles the lock
  // immediately because useTier hydrates on the storage event.
  const adminUnlocked = isAdmin && !isTestingTier;
  // Free users keep access but several controls / columns are gated.
  const isFree = userTier === "free";
  // Which tiers is the user allowed to actually select in Step 1?
  // Anything above their own tier is locked.
  const canSelectTier = (target: CalcTier): boolean => {
    const userRank = USER_TIER_RANK[userTier];
    const targetRank = USER_TIER_RANK[target];
    return targetRank <= userRank;
  };
  // Required tier to unlock a given CalcTier button.
  const unlockTierFor = (target: CalcTier): Tier => target;
  // Deep-link support: /results?tier=silver&period=30 lets the track-record
  // tier cards jump directly to the right slice of data.
  const searchParams = useSearchParams();
  const initialTier = (() => {
    const q = (searchParams?.get("tier") ?? "").toLowerCase();
    if ((VALID_TIERS as readonly string[]).includes(q)) return q as TierFilter;
    // Default to the user's own tier so a Free Access visitor lands on
    // a tier they can actually see — instead of an unreachable Gold
    // selection that's locked to them anyway.
    if (userTier === "free") return "free";
    if (userTier === "silver") return "silver";
    if (userTier === "platinum") return "platinum";
    return "gold";
  })();
  const initialPeriod = (() => {
    const q = Number(searchParams?.get("period"));
    if (!Number.isFinite(q) || q <= 0) return 30;
    return Math.max(1, Math.min(365, Math.round(q)));
  })();
  const initialStream: StreamMode = searchParams?.get("stream") === "botd" ? "botd" : "all";

  const [resultFilter, setResultFilter] = useState<ResultFilter>("All");
  const [leagueFilter, setLeagueFilter] = useState<string>("");
  // Tier + period for the ROI calculator are the single source of
  // truth — the results table below reuses them so selecting e.g.
  // "Platinum" in the calculator also scopes the table.
  const [tierFilter, setTierFilter] = useState<TierFilter>(initialTier);
  const [calcPeriod, setCalcPeriod] = useState<CalcPeriod>(initialPeriod);
  const [stream, setStream] = useState<StreamMode>(initialStream);
  // Result Simulation runs Live-only — Backtest mode was removed
  // because reconstructing odds via 1/prob made ROI mathematically
  // meaningless. dataSource is hardcoded so existing filter / headline
  // / table code keeps working without per-mode branches.
  const dataSource: DataSource = "live";
  const setDataSource = (_: DataSource) => {};
  // useTier() starts as "free" before localStorage hydrates, then
  // settles on the real subscription tier asynchronously after
  // /subscriptions/me resolves. Earlier we snapped tierFilter once
  // on first effect run (via a useRef "hydrated" flag), but that
  // ran with userTier === "free" at first paint and then refused to
  // re-snap when the API responded with "silver" — so paid users
  // landed on Free Access with their own tier locked. Now the
  // snap re-runs whenever the server-confirmed tier changes, and
  // only stops once the user has manually clicked a tier button
  // (or arrived with an explicit ?tier= deep-link).
  const explicitTierFromUrl = (searchParams?.get("tier") ?? "").toLowerCase();
  const [manualTierOverride, setManualTierOverride] = useState(
    Boolean(explicitTierFromUrl),
  );
  useEffect(() => {
    if (manualTierOverride) return;
    const target: TierFilter =
      userTier === "free" ? "free" :
      userTier === "silver" ? "silver" :
      userTier === "platinum" ? "platinum" :
      "gold";
    if (target !== tierFilter) setTierFilter(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userTier, manualTierOverride]);
  // BOTD stream is by definition Gold-tier — lock the tier selector
  // when the user flips to BOTD so numbers don't drift.
  useEffect(() => {
    if (stream === "botd" && tierFilter !== "gold") setTierFilter("gold");
  }, [stream, tierFilter]);
  // Alias — the table's period is driven entirely by the calculator so
  // both surfaces never disagree.
  const period = calcPeriod;
  const setPeriod = setCalcPeriod;
  // Stake is shared between the ROI calculator header and each table
  // row so the numbers always agree. Persisted to localStorage.
  const [stake, setStake] = useState<number>(10);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(STAKE_STORAGE_KEY);
      if (saved) {
        const n = Number(saved);
        if (Number.isFinite(n) && n > 0) setStake(n);
      }
    } catch {}
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STAKE_STORAGE_KEY, String(stake));
    } catch {}
  }, [stake]);

  // ── Queries ────────────────────────────────────────────────────────────────
  // Always fetch a full 365 days so the ROI calculator can support a
  // custom days-back filter up to the backend cap. Shorter windows
  // filter the same cached dataset client-side.
  const resultsQuery = useQuery({
    queryKey: ["fixture-results", 365, leagueFilter],
    queryFn: () => api.getFixtureResults(365, leagueFilter || undefined),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  // Unwrap the fixtures array from the response
  const rawResults: Fixture[] = resultsQuery.data?.fixtures ?? [];
  // Scope to the active pick stream — either every prediction or just
  // the Bet of the Day (highest-confidence Gold-tier pick per day).
  const allResults: Fixture[] = useMemo(
    () => (stream === "botd" ? filterBotdStream(rawResults) : rawResults),
    [rawResults, stream],
  );

  // ── Derived league list — only show leagues that have at least 1 finished fixture with a result ──
  const leagues = useMemo(() => {
    const seen = new Set<string>();
    for (const f of allResults) {
      if (f.league_name && f.status === "finished" && f.result) {
        seen.add(f.league_name);
      }
    }
    return Array.from(seen).sort();
  }, [allResults]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let items = [...allResults];

    // Require a finished match with a score AND a prediction AND a
    // tier classification — otherwise "Pick" and "Result" columns
    // render as "—" on every row and users can't tell whether the
    // empty cells mean "we got it wrong" or "we never forecast this".
    items = items.filter(
      (f) => f.status === "finished" && f.result && f.prediction,
    );

    // Period window — client-side since we always fetch 365 days.
    const cutoffMs = Date.now() - period * 24 * 60 * 60 * 1000;
    items = items.filter((f) => new Date(f.scheduled_at).getTime() >= cutoffMs);

    // Live mode = strict pre-kickoff picks since LIVE_START_MS.
    // Backtest mode = the full model-validation history (no live-pick
    // constraint), so users can explore long lookbacks even when live
    // tracking is only a few days old.
    if (dataSource === "live") {
      items = items.filter((f) => isLivePick(f));
    }

    // Tier-band match: each pick is in exactly one tier (the one the
    // engine classified it under). Mirrors aggregateFixtures(...
    // mode="band") + Track Record's per-tier rows so the same label
    // means the same picks across both pages.
    items = items.filter((f) => f.prediction?.pick_tier === tierFilter);

    if (leagueFilter) {
      items = items.filter((f) => f.league_name === leagueFilter);
    }

    if (resultFilter !== "All") {
      items = items.filter((f) => {
        const pred = f.prediction;
        if (!pred || !f.result) return false;
        const { home_score, away_score } = f.result;
        const actualOutcome =
          home_score > away_score ? "home" :
          away_score > home_score ? "away" : "draw";
        const predictedSide = derivePickSide(pred);
        const correct = actualOutcome === predictedSide;
        return resultFilter === "Correct" ? correct : !correct;
      });
    }

    // Sort by date descending (most recent first)
    items.sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));

    return items;
  }, [allResults, resultFilter, leagueFilter, tierFilter, period, dataSource]);

  // ── Summary computed from filtered so stats always match the table ─────────
  // P/L formula MUST mirror RoiCalculatorCard.aggregateFixtures so the
  // headline "Your Return" and the "This Week's Performance" tile can
  // never disagree on the same picks. Earlier this card hardcoded a
  // flat 2.0 odds assumption when no real odds were on file (winners
  // got +1u, losers -1u), while the calculator used 1/prob (model-fair
  // odds). Same picks, two formulas → two stories on one screen.
  const computedSummary = useMemo<WeeklySummary | null>(() => {
    if (filtered.length === 0) return null;
    let won = 0;
    let plUnits = 0;
    const leagueStats: Record<string, { total: number; won: number }> = {};
    for (const f of filtered) {
      if (!f.prediction || !f.result) continue;
      const predictedSide = derivePickSide(f.prediction);
      if (predictedSide === null) continue;
      const { home_score, away_score } = f.result;
      const actualOutcome =
        home_score > away_score ? "home" : away_score > home_score ? "away" : "draw";
      const correct = actualOutcome === predictedSide;
      const { odds: oddsUsed } = oddsForPick(f, predictedSide);
      if (correct) {
        won++;
        plUnits += oddsUsed - 1;
      } else {
        plUnits -= 1;
      }
      const league = f.league_name || "Unknown";
      if (!leagueStats[league]) leagueStats[league] = { total: 0, won: 0 };
      leagueStats[league].total++;
      if (correct) leagueStats[league].won++;
    }
    const performers = Object.entries(leagueStats)
      .map(([name, s]) => ({ name, accuracy: s.won / s.total, total: s.total }))
      .sort((a, b) => b.accuracy - a.accuracy || b.total - a.total);
    return {
      total_calls: filtered.length,
      won,
      lost: filtered.length - won,
      win_rate: won / filtered.length,
      pl_units: plUnits,
      best_performers: performers.slice(0, 3),
      worst_performers: [...performers].reverse().slice(0, 3),
    };
  }, [filtered]);

  const isLoading = resultsQuery.isLoading;
  const hasError = resultsQuery.isError;

  // Per-tier KPI data — fetched from the same /trackrecord/live-measurement
  // endpoint Track Record uses, so the four tiles on Results show exactly
  // the same numbers users see on /trackrecord. Without this, the Results
  // page would compute its own per-tier numbers from a different filter
  // chain (different prediction_source set, different boundary semantics)
  // and end up disagreeing with Track Record on the same label — Free
  // 56% on TR vs Free 31% on Results was the giveaway.
  const liveMeasurementQuery = useQuery({
    queryKey: ["live-measurement-tiers"],
    queryFn: async () => {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const r = await fetch(`${API}/trackrecord/live-measurement`);
      if (!r.ok) throw new Error("live-measurement fetch failed");
      return (await r.json()) as {
        per_tier: Record<string, { total: number; correct: number; accuracy: number }>;
        start_date: string;
      };
    },
    staleTime: 5 * 60_000,
  });

  const tierKpis = useMemo(() => {
    const t = liveMeasurementQuery.data?.per_tier ?? {};
    const empty = { total: 0, correct: 0, accuracy: 0 };
    return {
      free: t.free ?? empty,
      silver: t.silver ?? empty,
      gold: t.gold ?? empty,
      platinum: t.platinum ?? empty,
    };
  }, [liveMeasurementQuery.data]);

  const liveDays = daysOfLiveData();
  const progressPct = Math.min(100, Math.round((liveDays / 90) * 100));

  const TIER_META: Record<CalcTier, {
    label: string;
    accent: string;
    floor: string;
    roman: string;
    glow: string;
    border: string;
    pillBg: string;
    pillText: string;
  }> = {
    free: {
      label: "Free Access",
      accent: "#e8a864",
      floor: "45-59%",
      roman: "I",
      glow: "rgba(232, 168, 100, 0.18)",
      border: "rgba(232, 168, 100, 0.30)",
      pillBg: "rgba(232, 168, 100, 0.12)",
      pillText: "#e8a864",
    },
    silver: {
      label: "Silver",
      accent: "#d7d9dc",
      floor: "60-69%",
      roman: "II",
      glow: "rgba(215, 217, 220, 0.10)",
      border: "rgba(215, 217, 220, 0.22)",
      pillBg: "rgba(215, 217, 220, 0.08)",
      pillText: "#d7d9dc",
    },
    gold: {
      label: "Gold",
      accent: "#f5d67a",
      floor: "70-84%",
      roman: "III",
      glow: "rgba(245, 214, 122, 0.18)",
      border: "rgba(245, 214, 122, 0.30)",
      pillBg: "rgba(245, 214, 122, 0.12)",
      pillText: "#f5d67a",
    },
    platinum: {
      label: "Platinum",
      accent: "#d9f0ff",
      floor: "85%+",
      roman: "IV",
      glow: "rgba(217, 240, 255, 0.18)",
      border: "rgba(217, 240, 255, 0.30)",
      pillBg: "rgba(217, 240, 255, 0.10)",
      pillText: "#d9f0ff",
    },
  };

  return (
    <div className="relative mx-auto max-w-6xl px-3 sm:px-4 py-5 md:py-7 animate-fade-in">
      <div className="space-y-5">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Hoe deden we het
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Resultaten van onze voorspellingen voor jouw {TIER_META[tierFilter].label} tier
          </p>
        </div>

        {/* ── 2 grote stat cards ── */}
        <div className="grid gap-3 sm:grid-cols-2">
          {(() => {
            const total = computedSummary?.total_calls ?? 0;
            const won = computedSummary?.won ?? 0;
            const accPct = total > 0 ? (won / total) * 100 : 0;
            const plEur = (computedSummary?.pl_units ?? 0) * 10;
            const plColor = plEur > 0 ? "text-emerald-300" : plEur < 0 ? "text-rose-400" : "text-slate-300";
            const plSign = plEur >= 0 ? "+" : "−";
            return (
              <>
                <div className="glass-card p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                    Laatste {period} dagen
                  </p>
                  <p className="mt-1 text-3xl font-extrabold tabular-nums text-white sm:text-4xl">
                    {total > 0 ? `${accPct.toFixed(1)}% correct` : "—"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {total > 0
                      ? `${won} van ${total} wedstrijden goed voorspeld`
                      : "Nog geen resultaten in deze periode"}
                  </p>
                </div>
                <div className="glass-card p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                    Bij €10 inzet per wedstrijd
                  </p>
                  <p className={`mt-1 text-3xl font-extrabold tabular-nums sm:text-4xl ${plColor}`}>
                    {total > 0 ? `${plSign}€${Math.abs(plEur).toFixed(2)}` : "—"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {total > 0
                      ? "Wat je verdiend / verloren zou hebben"
                      : "Wacht op gespeelde wedstrijden"}
                  </p>
                </div>
              </>
            );
          })()}
        </div>

        {/* (4-tier KPI grid removed for UX simplification — user is
            already on their own tier; the 2 stat cards above show what
            matters.) */}
        {false && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {(["free", "silver", "gold", "platinum"] as const).map((tier) => {
            const kpi = tierKpis[tier];
            const wr = kpi.total > 0 ? kpi.accuracy * 100 : null;
            const lost = kpi.total - kpi.correct;
            const meta = TIER_META[tier];
            const active = tierFilter === tier;
            const locked = !canAccessTier(tier, userTier);
            return (
              <button
                key={tier}
                type="button"
                onClick={() => {
                  setManualTierOverride(true);
                  setTierFilter(tier);
                }}
                className="group relative overflow-hidden rounded-xl border p-3.5 text-left transition-all"
                style={{
                  borderColor: active ? meta.accent : meta.border,
                  background: `radial-gradient(circle at 50% 0%, ${meta.glow}, transparent 70%), hsl(230 22% 9% / 0.6)`,
                  boxShadow: active ? `0 0 0 1px ${meta.accent}, 0 8px 24px ${meta.glow}` : undefined,
                }}
              >
                {/* Top-row: Roman badge + tier label + lock */}
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold tabular-nums"
                      style={{
                        background: meta.pillBg,
                        color: meta.accent,
                        border: `1px solid ${meta.border}`,
                      }}
                    >
                      {meta.roman}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: meta.accent }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  {locked && <Lock className="h-3 w-3 text-slate-600" />}
                </div>

                {/* Big WR % */}
                <p className="text-3xl font-extrabold leading-none tabular-nums text-white sm:text-4xl">
                  {wr !== null ? `${wr.toFixed(1)}%` : "—"}
                </p>

                {/* PLAYED / WON / LOST pills */}
                <div className="mt-3 flex items-center gap-1.5">
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider tabular-nums"
                    style={{
                      background: meta.pillBg,
                      color: meta.pillText,
                      border: `1px solid ${meta.border}`,
                    }}
                  >
                    {kpi.total} played
                  </span>
                  <span
                    className="rounded-md border border-emerald-500/25 bg-emerald-500/[0.10] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider tabular-nums text-emerald-300"
                  >
                    {kpi.correct} won
                  </span>
                  <span
                    className="rounded-md border border-red-500/25 bg-red-500/[0.08] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider tabular-nums text-red-300"
                  >
                    {lost} lost
                  </span>
                </div>

                {/* Footer */}
                <p className="mt-2 text-[10px] uppercase tracking-widest text-slate-500">
                  Floor {meta.floor}
                  {kpi.total < 10 && kpi.total > 0 && (
                    <span className="ml-1 text-amber-400">· small sample</span>
                  )}
                </p>
              </button>
            );
          })}
        </div>
        )}

        {/* ── Periode dropdown (simpel) ── */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500" htmlFor="period-select">
            Periode:
          </label>
          <select
            id="period-select"
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value) as PeriodFilter)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm font-medium text-slate-200 hover:border-white/[0.15]"
          >
            <option value={7}>Laatste 7 dagen</option>
            <option value={30}>Laatste 30 dagen</option>
            <option value={90}>Laatste 90 dagen</option>
          </select>
          <span className="ml-auto text-xs text-slate-500 tabular-nums">
            {filtered.length} {filtered.length === 1 ? "wedstrijd" : "wedstrijden"}
          </span>
        </div>

        {/* ── Error banner ── */}
        {hasError && (
          <div
            className="rounded-xl border p-3 flex items-start gap-3"
            style={{ background: "rgba(239,68,68,0.04)", borderColor: "rgba(239,68,68,0.25)" }}
          >
            <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-400">{t("results.errorLoading")}</p>
          </div>
        )}

        {/* ── Recent picks table ── */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Trophy className="h-8 w-8 text-slate-600" />
            <p className="text-base font-medium text-slate-400">
              No picks match your filters
            </p>
            <p className="text-sm text-slate-600">
              {tierKpis[tierFilter].total === 0
                ? `No ${TIER_META[tierFilter].label} picks in the last ${period} days yet.`
                : "Try a wider period or different result filter."}
            </p>
            {period < 30 && (
              <button onClick={() => setPeriod(30)} className="btn-primary mt-2">
                Try 30 days
              </button>
            )}
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/[0.05] bg-white/[0.03] px-4 py-2.5 text-[9px] uppercase tracking-widest text-slate-600">
              <span className="w-12 sm:w-16 shrink-0">{t("results.dateColumn")}</span>
              <span className="flex-1">{t("results.homeColumn")}</span>
              <span className="w-10 sm:w-14 text-center">{t("results.scoreColumn")}</span>
              <span className="flex-1">{t("results.awayColumn")}</span>
              <span className="hidden w-8 text-center sm:inline">{t("results.pickColumn")}</span>
              <span className="hidden w-20 text-center sm:inline">
                {t("results.oddsColumn")}
                {isFree && <LockPill requiredTier="silver" className="ml-1" />}
              </span>
              <span className="hidden w-20 text-right sm:inline">
                {isFree ? (
                  <>
                    {t("results.returnColumn")} <LockPill requiredTier="silver" className="ml-1" />
                  </>
                ) : (
                  `${t("results.returnColumn")} · €${stake.toFixed(0)}`
                )}
              </span>
              <span className="w-6 sm:w-8 text-center">{t("results.resultColumn")}</span>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {filtered.slice(0, 50).map((fixture) => (
                <ResultCard
                  key={fixture.id}
                  fixture={fixture}
                  stake={stake}
                  isFree={isFree}
                />
              ))}
            </div>
            {filtered.length > 50 && (
              <div className="border-t border-white/[0.05] bg-white/[0.02] px-4 py-2.5 text-center text-[10px] uppercase tracking-widest text-slate-500">
                Showing first 50 of {filtered.length} — open Advanced simulation for full table
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// Helper — checks whether the user's subscription tier covers a target
// CalcTier band, mirroring USER_TIER_RANK semantics.
function canAccessTier(target: CalcTier, userTier: Tier): boolean {
  const rank: Record<string, number> = { free: 0, silver: 1, gold: 2, platinum: 3 };
  return rank[target] <= rank[userTier];
}
