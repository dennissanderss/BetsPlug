"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "@/i18n/locale-provider";
import {
  Sparkles,
  ChevronUp,
  ChevronDown,
  Eye,
  AlertTriangle,
  Filter,
  ArrowUpDown,
  Clock,
  RefreshCw,
  CalendarDays,
  Calendar,
  Trophy,
  ChevronsUpDown,
  Check,
  Search,
  ShieldCheck,
  Lock,
  Radio,
} from "lucide-react";
import { useTier } from "@/hooks/use-tier";
import { api } from "@/lib/api";
import type { Fixture, FixturePrediction } from "@/types/api";
import { UpsellBanner } from "@/components/ui/upsell-banner";
import { GlassPanel } from "@/components/noct/glass-panel";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { TierScopePill } from "@/components/noct/tier-scope-pill";
import { PickTierBadge } from "@/components/noct/pick-tier-badge";
import { PickReasoningBlock } from "@/components/predictions/PickReasoningBlock";
import { classifyPickTier, TIER_RANK } from "@/lib/pick-tier";
import { derivePickSide } from "@/lib/prediction-pick";
import type { PickTierSlug } from "@/types/api";

// ─── Per-tier scope helpers ──────────────────────────────────────────────────
// Determine whether a finished match's pick falls within a given tier's
// scope. Cumulative: a pick classified as "gold" is in scope for gold,
// silver, free; not for platinum. Returns false when the pick has no
// classified tier (confidence below 0.55 or league not whitelisted for
// any tier above free).
function tierIncludes(tier: PickTierSlug, classified: PickTierSlug | null): boolean {
  if (!classified) return false;
  return TIER_RANK[classified] >= TIER_RANK[tier];
}

const PER_TIER_ROW: { slug: PickTierSlug; letter: string; chipClass: string }[] = [
  { slug: "free",     letter: "F", chipClass: "bg-[#b87333]/15 text-[#e8a864] border-[#b87333]/30" },
  { slug: "silver",   letter: "S", chipClass: "bg-[#c0c0c0]/15 text-[#e5e4e2] border-[#c0c0c0]/30" },
  { slug: "gold",     letter: "G", chipClass: "bg-[#d4af37]/15 text-[#f5d67a] border-[#d4af37]/30" },
  { slug: "platinum", letter: "P", chipClass: "bg-[#a8d8ea]/15 text-[#d9f0ff] border-[#a8d8ea]/35" },
];

function PerTierScopeStrip({ fixture }: { fixture: Fixture }) {
  const pred = fixture.prediction;
  if (!pred) return null;

  const classified: PickTierSlug | null =
    (pred as any).pick_tier ??
    classifyPickTier({
      leagueId: (fixture as any).league_id ?? null,
      leagueName: fixture.league_name ?? null,
      confidence: pred.confidence,
    });

  // Correctness — only meaningful once the result is in.
  let outcome: "correct" | "incorrect" | "pending" = "pending";
  if (fixture.result?.winner) {
    const predicted = derivePickSide(pred);
    outcome = predicted && predicted === fixture.result.winner ? "correct" : "incorrect";
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-2 sm:px-4 pb-3 pt-1">
      <span className="text-[9px] uppercase tracking-widest text-slate-500 mr-1">
        Per tier
      </span>
      {PER_TIER_ROW.map(({ slug, letter, chipClass }) => {
        const inScope = tierIncludes(slug, classified);
        const symbol = !inScope ? "⊘" : outcome === "correct" ? "✅" : outcome === "incorrect" ? "❌" : "—";
        const opacity = inScope ? "" : "opacity-40";
        const title = !inScope
          ? `${slug} — niet in scope`
          : outcome === "pending"
            ? `${slug} — open`
            : outcome === "correct"
              ? `${slug} — correct`
              : `${slug} — incorrect`;
        return (
          <span
            key={slug}
            title={title}
            className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] tabular-nums ${chipClass} ${opacity}`}
          >
            <span className="font-bold">{letter}</span>
            <span className="text-[10px]">{symbol}</span>
          </span>
        );
      })}
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

type ConfidenceLevel = "High" | "Medium" | "Low";
type SortKey = "confidence" | "time" | "league";
type LeagueFilter = "All" | string;
type ConfidenceFilter = "All" | ConfidenceLevel;
/** v8.1: "All" = no filter, or a specific PickTierSlug to show ONLY that tier. */
type TierFilter = "All" | PickTierSlug;
// v8.6 → re-introduced "live" tab in v10:
// users were losing track of matches that had kicked off (e.g. opening
// /predictions during PSV-Bayern and finding nothing because the match
// disappeared from "Komend" once it went live). The Live tab queries
// /fixtures/live so the engine's pre-match pick stays reachable while
// the match is in play.
type ViewMode = "upcoming" | "live" | "results";
type DateRangeFilter = "all" | "today" | "thisWeek" | "thisMonth";

/** Country → leagues mapping with flags, ordered by popularity. */
const COUNTRY_LEAGUES: { country: string; flag: string; leagues: string[] }[] = [
  { country: "England",            flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", leagues: ["Premier League", "Championship"] },
  { country: "Europe (UEFA)",      flag: "🇪🇺", leagues: ["Champions League", "Europa League", "Conference League"] },
  { country: "Spain",              flag: "🇪🇸", leagues: ["La Liga", "Segunda División"] },
  { country: "Germany",            flag: "🇩🇪", leagues: ["Bundesliga", "2. Bundesliga"] },
  { country: "Italy",              flag: "🇮🇹", leagues: ["Serie A", "Serie B"] },
  { country: "France",             flag: "🇫🇷", leagues: ["Ligue 1", "Ligue 2"] },
  { country: "Netherlands",        flag: "🇳🇱", leagues: ["Eredivisie"] },
  { country: "Turkey",             flag: "🇹🇷", leagues: ["Süper Lig"] },
  { country: "Portugal",           flag: "🇵🇹", leagues: ["Primeira Liga", "Liga Portugal"] },
  { country: "Belgium",            flag: "🇧🇪", leagues: ["Jupiler Pro League"] },
  { country: "Scotland",           flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", leagues: ["Scottish Premiership"] },
  { country: "Switzerland",        flag: "🇨🇭", leagues: ["Swiss Super League"] },
  { country: "Argentina",          flag: "🇦🇷", leagues: ["Liga Profesional Argentina"] },
  { country: "Brazil",             flag: "🇧🇷", leagues: ["Brasileirão Série A"] },
  { country: "Mexico",             flag: "🇲🇽", leagues: ["Liga MX"] },
  { country: "South America",      flag: "🌎", leagues: ["Copa Libertadores"] },
  { country: "USA",                flag: "🇺🇸", leagues: ["MLS"] },
  { country: "Saudi Arabia",       flag: "🇸🇦", leagues: ["Saudi Pro League"] },
  { country: "Australia",          flag: "🇦🇺", leagues: ["A-League"] },
  { country: "Japan",              flag: "🇯🇵", leagues: ["J1 League"] },
  { country: "South Korea",        flag: "🇰🇷", leagues: ["K League 1"] },
  { country: "China",              flag: "🇨🇳", leagues: ["Chinese Super League"] },
];

/** Flat popularity ranking — determines quick-chip order (top 7 shown). */
const LEAGUE_POPULARITY: string[] = [
  "Premier League",
  "Champions League",
  "La Liga",
  "Bundesliga",
  "Serie A",
  "Ligue 1",
  "Eredivisie",
  "Europa League",
  "Conference League",
  "Süper Lig",
  "Primeira Liga",
  "Jupiler Pro League",
  "Scottish Premiership",
  "Championship",
  "Liga Portugal",
  "Copa Libertadores",
  "Liga MX",
  "Brasileirão Série A",
  "Liga Profesional Argentina",
  "MLS",
  "Swiss Super League",
  "Saudi Pro League",
  "Segunda División",
  "2. Bundesliga",
  "Serie B",
  "Ligue 2",
  "A-League",
  "J1 League",
  "K League 1",
  "Chinese Super League",
];

/** How many leagues to show as quick-filter chips. */
const QUICK_CHIPS = 7;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMatchTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
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

function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

function getConfidenceColor(level: ConfidenceLevel): string {
  if (level === "High") return "#10b981";
  if (level === "Medium") return "#f59e0b";
  return "#ef4444";
}

function getConfidenceBg(level: ConfidenceLevel): string {
  if (level === "High") return "bg-emerald-500/10 text-emerald-400";
  if (level === "Medium") return "bg-amber-500/10 text-amber-400";
  return "bg-red-500/10 text-red-400";
}

// v6.2: kept exported-ish for any deep import; silence unused-var lint.
void getConfidenceBg;

// ─── Probability Bar ─────────────────────────────────────────────────────────

interface ProbBarProps {
  homeProb: number;
  drawProb: number | null;
  awayProb: number;
  homeTeam: string;
  awayTeam: string;
}

function ProbabilityBar({ homeProb, drawProb, awayProb, homeTeam, awayTeam }: ProbBarProps) {
  const total = homeProb + (drawProb ?? 0) + awayProb;
  const predicted: "home" | "draw" | "away" =
    homeProb >= awayProb && homeProb >= (drawProb ?? 0)
      ? "home"
      : (drawProb ?? 0) >= awayProb
      ? "draw"
      : "away";

  const segments = [
    {
      key: "home" as const,
      label: homeTeam.split(" ").pop()!,
      prob: homeProb,
      color: "#3b82f6",
      glow: "rgba(59,130,246,0.5)",
      width: `${(homeProb / total) * 100}%`,
    },
    ...(drawProb !== null
      ? [
          {
            key: "draw" as const,
            label: "Draw",
            prob: drawProb,
            color: "#f59e0b",
            glow: "rgba(245,158,11,0.5)",
            width: `${(drawProb / total) * 100}%`,
          },
        ]
      : []),
    {
      key: "away" as const,
      label: awayTeam.split(" ").pop()!,
      prob: awayProb,
      color: "#ef4444",
      glow: "rgba(239,68,68,0.5)",
      width: `${(awayProb / total) * 100}%`,
    },
  ];

  return (
    <div className="w-full min-w-[200px]">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/[0.06] gap-0.5">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: seg.width,
              background: seg.color,
              opacity: predicted === seg.key ? 1 : 0.35,
              boxShadow: predicted === seg.key ? `0 0 8px ${seg.glow}` : "none",
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-1">
        {segments.map((seg) => (
          <div key={seg.key} className="flex flex-col items-center" style={{ width: seg.width }}>
            <span
              className="text-[11px] font-bold leading-none"
              style={{ color: predicted === seg.key ? seg.color : "#475569" }}
            >
              {seg.prob}%
            </span>
            <span
              className="mt-0.5 truncate text-[9px] uppercase tracking-wide"
              style={{ color: predicted === seg.key ? seg.color : "#334155", maxWidth: "48px" }}
            >
              {seg.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pending Probability placeholder ─────────────────────────────────────────

function ProbabilityPending() {
  const { t } = useTranslations();
  return (
    <div className="w-full min-w-[200px]">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full w-full rounded-full bg-white/[0.04] animate-pulse" />
      </div>
      <p className="mt-2.5 text-[10px] font-medium text-slate-600 italic text-center">
        {t("pred.analysisPending")}
      </p>
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 rounded bg-white/[0.06]" />
          <div className="h-5 w-56 rounded bg-white/[0.06]" />
          <div className="h-3 w-24 rounded bg-white/[0.06]" />
        </div>
        <div className="w-full max-w-[260px] space-y-2">
          <div className="h-3 w-full rounded-full bg-white/[0.06]" />
          <div className="h-2 w-2/3 rounded bg-white/[0.04]" />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="h-10 w-16 rounded bg-white/[0.06]" />
          <div className="h-6 w-20 rounded-full bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

// ─── Compact Match Row (v6.2 redesign) ───────────────────────────────────────
//
// One compact row per fixture, replaces the large MatchCard. Groups
// under a LeagueSection accordion. Clicking the row expands a detail
// panel with probabilities, reasoning and top features.

function formatTimeOnly(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "--:--";
  }
}

function formatDateShort(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return "";
  }
}

function CompactMatchRow({ fixture, isFree, showPerTier = false }: { fixture: Fixture; isFree: boolean; showPerTier?: boolean }) {
  const { t } = useTranslations();
  const pred: FixturePrediction | null = fixture.prediction ?? null;
  const hasPrediction = pred !== null && typeof pred.confidence === "number";
  // Backend marks a pick "locked" when the user's tier is below the pick's
  // tier — `prediction` is null but `locked_pick_tier` carries the slug.
  // The Resultaten tab (showPerTier) is intentionally transparent: every
  // tier's pick is visible regardless of subscription so users can audit
  // hit-rate themselves. Upgrade nudges only fire on Upcoming/Live.
  const lockedTier = (fixture as any).locked_pick_tier as
    | "silver" | "gold" | "platinum" | null | undefined;
  const isLocked = !showPerTier && !hasPrediction && !!lockedTier;
  const hideFreeUpsell = showPerTier;
  const lockedTierLabel = (fixture as any).locked_pick_tier_label as string | null | undefined;

  const isLive = fixture.status === "live";
  const isFinished = fixture.status === "finished";

  // Correctness check for finished matches
  let isCorrect: boolean | null = null;
  if (isFinished && fixture.result && hasPrediction) {
    const { home_score, away_score } = fixture.result;
    const actualOutcome =
      home_score > away_score ? "home" :
      away_score > home_score ? "away" : "draw";
    const probs = {
      home: pred.home_win_prob ?? 0,
      draw: pred.draw_prob ?? 0,
      away: pred.away_win_prob ?? 0,
    };
    const predicted = (Object.keys(probs) as Array<keyof typeof probs>)
      .reduce((a, b) => probs[a] >= probs[b] ? a : b);
    isCorrect = actualOutcome === predicted;
  }

  const confScore = hasPrediction ? Math.round((pred.confidence ?? 0) * 100) : null;
  const confLevel = confScore !== null ? getConfidenceLevel(confScore) : null;
  const confColor = confLevel ? getConfidenceColor(confLevel) : "#475569";

  const homeProb = pred?.home_win_prob != null ? Math.round(pred.home_win_prob * 100) : null;
  const drawProb = pred?.draw_prob != null ? Math.round(pred.draw_prob * 100) : null;
  const awayProb = pred?.away_win_prob != null ? Math.round(pred.away_win_prob * 100) : null;

  let modelPick: "home" | "draw" | "away" | null = null;
  if (hasPrediction && homeProb != null && awayProb != null) {
    const d = drawProb ?? -1;
    if (homeProb >= d && homeProb >= awayProb) modelPick = "home";
    else if (awayProb >= d && awayProb >= homeProb) modelPick = "away";
    else modelPick = "draw";
  }

  const pickLabel = modelPick === "home" ? "1" : modelPick === "draw" ? "X" : modelPick === "away" ? "2" : null;

  // v8.1: prefer the backend-classified tier from the API response
  // (/fixtures already runs the same CASE expression server-side).
  // Fall back to the frontend mirror only if the field is absent —
  // e.g. when TIER_SYSTEM_ENABLED was off at the time of the call.
  const pickTier =
    (pred as any)?.pick_tier ??
    classifyPickTier({
      leagueId: (fixture as any).league_id ?? null,
      leagueName: fixture.league_name ?? null,
      confidence: pred?.confidence ?? null,
    });

  return (
    <div className="border-b border-white/[0.04] last:border-b-0">
      <div className="grid grid-cols-11 items-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 sm:py-3.5 hover:bg-white/[0.02] transition-colors">
        {/* Time + Status */}
        <div className="col-span-2 sm:col-span-1 flex flex-col items-center min-w-0">
          <span className="text-xs sm:text-sm font-bold text-slate-100 tabular-nums">
            {formatTimeOnly(fixture.scheduled_at)}
          </span>
          {isLive ? (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[9px] font-bold text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
              {((fixture as any).live_score?.elapsed != null && (fixture as any).live_score.elapsed > 0)
                ? `${(fixture as any).live_score.elapsed}'`
                : "LIVE"}
            </span>
          ) : isFinished ? (
            <span className="mt-1 text-[9px] font-bold text-slate-500">FT</span>
          ) : (
            <span className="mt-1 text-[9px] font-medium text-blue-400/70">
              {formatDateShort(fixture.scheduled_at)}
            </span>
          )}
        </div>

        {/* Teams — col 2 */}
        <div className="col-span-5 sm:col-span-4 min-w-0 overflow-hidden">
          {/* Home team — score comes from live_score.home_goals when the
              real-time cache has it, otherwise from result.home_score
              (the DB MatchResult that the live scheduler also writes,
              and which outlives the 45s Redis cache TTL). For live mode
              we always show a number — defaulting to 0 — so "LIVE 0–0"
              before the first goal isn't a blank row. */}
          <div className="flex items-center gap-2">
            {fixture.home_team_logo && (
              <Image src={fixture.home_team_logo} alt="" width={16} height={16} className="rounded-full shrink-0" />
            )}
            <span className={`text-sm font-semibold truncate ${modelPick === "home" ? "text-emerald-300" : "text-slate-100"}`}>
              {fixture.home_team_name}
            </span>
            {(() => {
              const liveScore = (fixture as any).live_score?.home_goals;
              const resultScore = fixture.result?.home_score;
              const display = liveScore != null ? liveScore : resultScore != null ? resultScore : (isLive ? 0 : null);
              if (display == null) return null;
              return (
                <span className={`text-sm font-bold tabular-nums ${isLive ? "text-red-300" : "text-slate-400"}`}>
                  {display}
                </span>
              );
            })()}
          </div>
          {/* Away team */}
          <div className="flex items-center gap-2 mt-0.5">
            {fixture.away_team_logo && (
              <Image src={fixture.away_team_logo} alt="" width={16} height={16} className="rounded-full shrink-0" />
            )}
            <span className={`text-sm font-semibold truncate ${modelPick === "away" ? "text-emerald-300" : "text-slate-100"}`}>
              {fixture.away_team_name}
            </span>
            {(() => {
              const liveScore = (fixture as any).live_score?.away_goals;
              const resultScore = fixture.result?.away_score;
              const display = liveScore != null ? liveScore : resultScore != null ? resultScore : (isLive ? 0 : null);
              if (display == null) return null;
              return (
                <span className={`text-sm font-bold tabular-nums ${isLive ? "text-red-300" : "text-slate-400"}`}>
                  {display}
                </span>
              );
            })()}
          </div>
        </div>

        {/* Prediction pick badge — col 3 */}
        <div className="col-span-1 flex flex-col items-center gap-1 min-w-0">
          {isLocked ? (
            <span
              className="inline-flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-md sm:rounded-lg bg-white/[0.04] border border-white/[0.08]"
              title={`Upgrade to ${lockedTierLabel ?? lockedTier} to see this pick`}
            >
              <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-500" />
            </span>
          ) : pickLabel && (
            <span
              className="inline-flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold"
              style={{
                background: `${confColor}18`,
                color: confColor,
                border: `1px solid ${confColor}35`,
              }}
            >
              {pickLabel}
            </span>
          )}
          {/* Tier shield — show locked tier when locked, otherwise the
              pick's classified tier. Suppressed on the Resultaten tab
              because the per-tier strip below already shows tier
              transparency for every row, and a small shield icon next
              to the pick reads as a lock to first-time users. */}
          {!showPerTier && (isLocked ? lockedTier : pickTier) && (
            <PickTierBadge
              tier={(isLocked ? lockedTier : pickTier) as PickTierSlug}
              size="sm"
              showLabel={false}
              showAccuracy={false}
            />
          )}
        </div>

        {/* Odds — col 4 (desktop only). Locked for Free Access OR for
            tier-locked picks (probabilities aren't visible so neither
            should the implied edge they map to). */}
        <div className="hidden sm:flex col-span-3 items-center justify-center gap-1.5">
          {isLocked ? (
            <Link
              href="/pricing"
              title={`Upgrade to ${lockedTierLabel ?? lockedTier} to unlock this pick`}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/[0.04] text-slate-400 border border-white/[0.08] hover:text-amber-300 hover:border-amber-500/40 transition-colors"
            >
              <Lock className="h-3 w-3" />
              {lockedTierLabel ?? lockedTier}
            </Link>
          ) : isFree && !hideFreeUpsell ? (
            <Link
              href="/pricing"
              title="Upgrade to Silver to view pre-match odds"
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/[0.04] text-slate-400 border border-white/[0.08] hover:text-amber-300 hover:border-amber-500/40 transition-colors"
            >
              <Lock className="h-3 w-3" />
              Silver
            </Link>
          ) : (
            <>
              <OddButton label="1" value={fixture.odds?.home ?? null} highlighted={modelPick === "home"} />
              <OddButton label="X" value={fixture.odds?.draw ?? null} highlighted={modelPick === "draw"} />
              <OddButton label="2" value={fixture.odds?.away ?? null} highlighted={modelPick === "away"} />
            </>
          )}
        </div>

        {/* Confidence bar + correctness */}
        <div className="col-span-3 sm:col-span-2 flex items-center gap-2" title={t("pred.confidenceTooltip")}>
          {isLocked ? (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <span className="hidden sm:inline">Upgrade to unlock</span>
              <span className="sm:hidden">Locked</span>
            </span>
          ) : isCorrect !== null ? (
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                isCorrect
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                  : "bg-red-500/15 text-red-400 border border-red-500/25"
              }`}>
                {isCorrect ? "Correct" : "Incorrect"}
              </span>
              {confScore != null && (
                <span
                  className="text-[11px] font-bold tabular-nums shrink-0"
                  style={{ color: confColor }}
                  title={`Pre-match confidence ${confScore}%`}
                >
                  {confScore}%
                </span>
              )}
            </div>
          ) : confScore != null ? (
            <>
              <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${confScore}%`, background: confColor }}
                />
              </div>
              <span className="text-[11px] font-bold tabular-nums shrink-0" style={{ color: confColor }}>
                {confScore}%
              </span>
            </>
          ) : null}
        </div>

      </div>

      {/* v8.2 "Why this pick?" — collapsible explainability block.
          PickReasoningBlock renders nothing when drivers are null/empty
          (older rows without features_snapshot) and gates itself behind
          Gold+ internally: Free/Silver see a locked teaser. Kept
          outside the grid so the expanded drivers can span full-width
          without disturbing the row layout. */}
      {pred?.top_drivers && pred.top_drivers.length > 0 && (
        <div className="px-2 sm:px-4 pb-3">
          <PickReasoningBlock drivers={pred.top_drivers} variant="compact" />
        </div>
      )}

      {/* Per-tier scope strip — only on the Results tab. Shows whether
          this match's pick was in scope for each of the four tiers and,
          for finished matches, whether it was correct. Cumulative tier
          model: a pick classified "gold" is in scope for gold/silver/
          free, not platinum. */}
      {showPerTier && <PerTierScopeStrip fixture={fixture} />}

    </div>
  );
}

function OddButton({
  label,
  value,
  highlighted,
}: {
  label: string;
  value: number | null;
  highlighted: boolean;
}) {
  if (value == null) {
    return (
      <div className="flex h-9 w-[52px] flex-col items-center justify-center rounded-lg border border-white/[0.04] bg-white/[0.01]">
        <span className="text-[8px] uppercase text-slate-700">{label}</span>
        <span className="text-[8px] text-slate-600 italic">soon</span>
      </div>
    );
  }
  return (
    <div
      className={`flex h-9 w-[52px] flex-col items-center justify-center rounded-lg border tabular-nums transition-all ${
        highlighted
          ? "border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_8px_rgba(16,185,129,0.1)]"
          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
      }`}
    >
      <span className={`text-[8px] uppercase tracking-wide ${highlighted ? "text-emerald-300" : "text-slate-500"}`}>
        {label}
      </span>
      <span className={`text-xs font-bold ${highlighted ? "text-emerald-200" : "text-slate-200"}`}>
        {value.toFixed(2)}
      </span>
    </div>
  );
}

// ─── League Section (v6.2 accordion grouping) ────────────────────────────────

function LeagueSection({
  leagueName,
  fixtures,
  defaultOpen = true,
  isFree,
}: {
  leagueName: string;
  fixtures: Fixture[];
  defaultOpen?: boolean;
  isFree: boolean;
}) {
  const { t } = useTranslations();
  const [open, setOpen] = useState(defaultOpen);

  // Count live matches in this league
  const liveCount = fixtures.filter((f) => f.status === "live").length;

  return (
    <div className="glass-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 sm:px-5 py-3 sm:py-3.5 bg-gradient-to-r from-white/[0.03] to-transparent border-b border-white/[0.05] hover:from-white/[0.05] transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md bg-blue-500/10 shrink-0">
            <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-400" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">{leagueName}</span>
          <span className="rounded-full bg-white/[0.06] px-2 sm:px-2.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-400 shrink-0">
            {fixtures.length}
          </span>
          {liveCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-bold text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
              {liveCount} live
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>
      {open && (
        <div className="divide-y divide-white/[0.03]">
          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-11 items-center gap-2 px-4 py-2 text-[9px] uppercase tracking-widest text-slate-500">
            <span className="col-span-1 text-center">{t("pred.colTime")}</span>
            <span className="col-span-4">{t("pred.colMatch")}</span>
            <span className="col-span-1 text-center">{t("pred.colPick")}</span>
            <span className="col-span-3 text-center">{t("pred.colOdds")}</span>
            <span className="col-span-2">{t("pred.colConfidence")}</span>
          </div>
          {fixtures.map((f) => (
            <CompactMatchRow key={f.id} fixture={f} isFree={isFree} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Results-mode accordion: one panel per day, newest first. Same row
 *  renderer as the upcoming view, just grouped differently.
 */
function DateSection({
  dateIso,
  fixtures,
  defaultOpen = true,
  isFree,
}: {
  dateIso: string;
  fixtures: Fixture[];
  isFree: boolean;
  defaultOpen?: boolean;
}) {
  const { t, locale } = useTranslations();
  const [open, setOpen] = useState(defaultOpen);

  const hits = fixtures.filter((f) => {
    if (!f.prediction || !f.result?.winner) return false;
    return derivePickSide(f.prediction) === f.result.winner;
  }).length;
  const misses = fixtures.filter((f) => {
    if (!f.prediction || !f.result?.winner) return false;
    return derivePickSide(f.prediction) !== f.result.winner;
  }).length;
  const pending = fixtures.length - hits - misses;

  // Friendly day label: "Today", "Yesterday", or day-month.
  // BCP-47: pass the locale directly — Intl.DateTimeFormat accepts
  // every supported locale code and picks the regional format
  // (Polish "pn." abbreviations, German weekday-month order, etc).
  const dateLabel = (() => {
    const [y, m, d] = dateIso.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    const now = new Date();
    const isToday = dt.toDateString() === now.toDateString();
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    const isYest = dt.toDateString() === yest.toDateString();
    if (isToday) return t("date.today");
    if (isYest) return t("date.yesterday");
    return dt.toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
  })();

  return (
    <div className="glass-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 sm:px-5 py-3 sm:py-3.5 bg-gradient-to-r from-white/[0.03] to-transparent border-b border-white/[0.05] hover:from-white/[0.05] transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md bg-blue-500/10 shrink-0">
            <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-400" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
            {dateLabel}
          </span>
          <span className="rounded-full bg-white/[0.06] px-2 sm:px-2.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-400 shrink-0">
            {fixtures.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hits > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {hits}
            </span>
          )}
          {misses > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-bold text-red-300">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              {misses}
            </span>
          )}
          {pending > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5 text-[9px] font-bold text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
              {pending}
            </span>
          )}
          {open ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </div>
      </button>
      {open && (
        <div className="divide-y divide-white/[0.03]">
          <div className="hidden sm:grid grid-cols-11 items-center gap-2 px-4 py-2 text-[9px] uppercase tracking-widest text-slate-500">
            <span className="col-span-1 text-center">{t("pred.colTime")}</span>
            <span className="col-span-4">{t("pred.colMatch")}</span>
            <span className="col-span-1 text-center">{t("pred.colPick")}</span>
            <span className="col-span-3 text-center">{t("pred.colOdds")}</span>
            <span className="col-span-2">{t("pred.colConfidence")}</span>
          </div>
          {fixtures.map((f) => (
            <CompactMatchRow key={f.id} fixture={f} isFree={isFree} showPerTier />
          ))}
        </div>
      )}
    </div>
  );
}

function groupFixturesByLeague(
  fixtures: Fixture[]
): Array<{ name: string; fixtures: Fixture[] }> {
  const map = new Map<string, Fixture[]>();
  for (const f of fixtures) {
    const key = f.league_name || "Unknown league";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(f);
  }
  return Array.from(map.entries())
    .map(([name, items]) => ({
      name,
      fixtures: items.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)),
    }))
    .sort((a, b) => b.fixtures.length - a.fixtures.length || a.name.localeCompare(b.name));
}

// ─── Stats Bar ───────────────────────────────────────────────────────────────

function StatsBar({ fixtures }: { fixtures: Fixture[] }) {
  const { t } = useTranslations();
  const total      = fixtures.length;
  const withPred   = fixtures.filter((f) => f.prediction !== null).length;
  const pending    = total - withPred;
  const avgConf    = withPred > 0
    ? Math.round(
        fixtures
          .filter((f) => f.prediction !== null)
          .reduce((acc, f) => acc + f.prediction!.confidence, 0) / withPred * 100
      )
    : null;

  const stats = [
    { label: t("pred.upcomingMatches"), value: String(total) },
    { label: t("pred.predictionsReady"), value: String(withPred) },
    { label: t("pred.analysisPendingStat"),  value: String(pending) },
    { label: t("pred.avgConfidence"),    value: avgConf !== null ? `${avgConf}%` : " - " },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value }) => (
        <div
          key={label}
          className="glass-card flex flex-col items-center justify-center gap-1 py-4 px-3 text-center"
        >
          <span className="text-2xl font-extrabold gradient-text leading-none tabular-nums">
            {value}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Filter Bar ──────────────────────────────────────────────────────────────

interface FilterBarProps {
  leagueFilter: LeagueFilter;
  setLeagueFilter: (v: LeagueFilter) => void;
  confidenceFilter: ConfidenceFilter;
  setConfidenceFilter: (v: ConfidenceFilter) => void;
  // v8.1 tier filter
  tierFilter: TierFilter;
  setTierFilter: (v: TierFilter) => void;
  sortKey: SortKey;
  setSortKey: (v: SortKey) => void;
  total: number;
  availableLeagues: string[];
  /** Map league_name → country (from API fixture data). */
  leagueCountryMap: Map<string, string>;
  /** Current user's subscription tier — gates higher-tier filter buttons. */
  userTier: "free" | "silver" | "gold" | "platinum";
}

function FilterBar({
  leagueFilter,
  setLeagueFilter,
  confidenceFilter,
  setConfidenceFilter,
  tierFilter,
  setTierFilter,
  sortKey,
  setSortKey,
  total,
  availableLeagues,
  leagueCountryMap,
  userTier,
}: FilterBarProps) {
  const { t } = useTranslations();
  const USER_RANK: Record<string, number> = { free: 0, silver: 1, gold: 2, platinum: 3 };
  const userRank = USER_RANK[userTier];
  const [leagueDropdownOpen, setLeagueDropdownOpen] = useState(false);
  const [leagueSearch, setLeagueSearch] = useState("");

  // Split leagues: quick chips (top N) vs the rest in dropdown
  const quickChipLeagues = availableLeagues.slice(0, QUICK_CHIPS);

  // Build country-grouped league list dynamically from API data.
  // Uses leagueCountryMap (from fixture data) + COUNTRY_LEAGUES
  // as fallback for flag emojis and display names.
  type CountryGroup = { country: string; flag: string; leagues: string[] };

  const allGroups = useMemo<CountryGroup[]>(() => {
    // Build a country → flag lookup from COUNTRY_LEAGUES
    const countryFlags: Record<string, string> = {};
    for (const cg of COUNTRY_LEAGUES) {
      countryFlags[cg.country] = cg.flag;
    }

    // Group available leagues by country from API data
    const grouped: Record<string, string[]> = {};
    for (const league of availableLeagues) {
      // Check API data first, then COUNTRY_LEAGUES fallback
      let country = leagueCountryMap.get(league);
      if (!country) {
        const staticGroup = COUNTRY_LEAGUES.find((g) =>
          g.leagues.includes(league),
        );
        country = staticGroup?.country ?? "Other";
      }
      if (!grouped[country]) grouped[country] = [];
      grouped[country].push(league);
    }

    // Convert to sorted array, known countries first
    const knownOrder = COUNTRY_LEAGUES.map((g) => g.country);
    return Object.entries(grouped)
      .sort(([a], [b]) => {
        const ia = knownOrder.indexOf(a);
        const ib = knownOrder.indexOf(b);
        const ra = ia === -1 ? 999 : ia;
        const rb = ib === -1 ? 999 : ib;
        if (ra !== rb) return ra - rb;
        return a.localeCompare(b);
      })
      .map(([country, leagues]) => ({
        country,
        flag: countryFlags[country] ?? "🏳️",
        leagues,
      }));
  }, [availableLeagues, leagueCountryMap]);

  // Apply search filter on groups
  const filteredGroups = useMemo<CountryGroup[]>(() => {
    const q = leagueSearch.toLowerCase().trim();
    if (!q) return allGroups;

    return allGroups
      .map((group) => {
        if (group.country.toLowerCase().includes(q)) return group;
        const matched = group.leagues.filter((l) =>
          l.toLowerCase().includes(q),
        );
        if (matched.length === 0) return null;
        return { ...group, leagues: matched };
      })
      .filter(Boolean) as CountryGroup[];
  }, [leagueSearch, allGroups]);

  // Find the flag for the currently active dropdown league
  const activeLeagueFlag = useMemo(() => {
    if (leagueFilter === "All" || quickChipLeagues.includes(leagueFilter))
      return null;
    for (const g of COUNTRY_LEAGUES) {
      if (g.leagues.includes(leagueFilter)) return g.flag;
    }
    return "🌍";
  }, [leagueFilter, quickChipLeagues]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!leagueDropdownOpen) return;
    const close = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest("[data-league-dropdown]");
      if (!el) setLeagueDropdownOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [leagueDropdownOpen]);

  // Close on Escape
  useEffect(() => {
    if (!leagueDropdownOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLeagueDropdownOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [leagueDropdownOpen]);

  const confOptions: ConfidenceFilter[] = ["All", "High", "Medium", "Low"];
  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "confidence", label: t("pred.sortConfidence") },
    { key: "time",       label: t("pred.sortTime") },
    { key: "league",     label: t("pred.sortLeague") },
  ];

  // Is the current filter a league NOT in the quick chips?
  const isDropdownLeagueActive =
    leagueFilter !== "All" && !quickChipLeagues.includes(leagueFilter);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0f1729] p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* League filter: quick chips + dropdown */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1 flex-wrap">
            {/* "All" chip */}
            <button
              onClick={() => setLeagueFilter("All")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                leagueFilter === "All"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All
            </button>

            {/* Quick league chips */}
            {quickChipLeagues.map((league) => (
              <button
                key={league}
                onClick={() => setLeagueFilter(league)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  leagueFilter === league
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {league}
              </button>
            ))}
          </div>

          {/* "More leagues" dropdown with country grouping */}
          <div className="relative" data-league-dropdown>
            <button
              onClick={() => {
                setLeagueDropdownOpen((v) => !v);
                setLeagueSearch("");
              }}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                isDropdownLeagueActive
                  ? "border-blue-500/40 bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "border-white/[0.06] bg-white/[0.03] text-slate-400 hover:text-slate-200 hover:border-white/[0.12]"
              }`}
            >
              {isDropdownLeagueActive && activeLeagueFlag && (
                <span className="text-sm leading-none">{activeLeagueFlag}</span>
              )}
              {isDropdownLeagueActive ? leagueFilter : t("pred.moreLeagues")}
              <ChevronsUpDown className="h-3.5 w-3.5" />
            </button>

            {leagueDropdownOpen && (
              <div className="absolute left-0 top-full z-[60] mt-2 w-[340px] isolate rounded-xl border border-slate-600/60 bg-[#111827] shadow-2xl shadow-black/80 ring-1 ring-black/20" style={{ backdropFilter: "none", WebkitBackdropFilter: "none" }}>
                {/* Search */}
                <div className="flex items-center gap-2.5 border-b border-slate-700/80 bg-[#1a2236] px-4 py-3 rounded-t-xl">
                  <Search className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={leagueSearch}
                    onChange={(e) => setLeagueSearch(e.target.value)}
                    placeholder={t("pred.searchLeague")}
                    className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
                    autoFocus
                  />
                </div>

                {/* Grouped league list */}
                <div className="max-h-[420px] overflow-y-auto overscroll-contain py-1 scrollbar-thin">
                  {/* "All" option */}
                  <button
                    onClick={() => {
                      setLeagueFilter("All");
                      setLeagueDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors ${
                      leagueFilter === "All"
                        ? "bg-blue-500/20 text-blue-300"
                        : "text-slate-100 hover:bg-slate-700/50"
                    }`}
                  >
                    <span>All Leagues</span>
                    {leagueFilter === "All" && (
                      <Check className="h-4 w-4 text-blue-400" />
                    )}
                  </button>

                  {/* Country groups */}
                  {filteredGroups.map((group) => (
                    <div key={group.country}>
                      {/* Country header */}
                      <div className="mt-1 flex items-center gap-2.5 border-t border-slate-700/50 bg-slate-800/40 px-4 py-2">
                        <span className="text-lg leading-none">
                          {group.flag}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {group.country}
                        </span>
                      </div>

                      {/* Leagues under this country */}
                      {group.leagues.map((league) => (
                        <button
                          key={league}
                          onClick={() => {
                            setLeagueFilter(league);
                            setLeagueDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between py-2.5 pl-11 pr-4 text-[13px] transition-colors ${
                            leagueFilter === league
                              ? "bg-blue-500/20 text-blue-300 font-semibold"
                              : "text-slate-200 hover:bg-slate-700/50 font-medium"
                          }`}
                        >
                          <span>{league}</span>
                          {leagueFilter === league && (
                            <Check className="h-4 w-4 text-blue-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  ))}

                  {filteredGroups.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-slate-500">
                      {t("pred.noLeaguesFound")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* v8.1 Pick-tier filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Tier
          </span>
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1">
            {([
              { value: "All" as const, label: "All", icon: null, rank: 0 },
              { value: "platinum" as const, label: "Platinum", icon: "🟢", rank: 3 },
              { value: "gold" as const, label: "Gold", icon: "🔵", rank: 2 },
              { value: "silver" as const, label: "Silver", icon: "⚪", rank: 1 },
              { value: "free" as const, label: "Free", icon: "⬜", rank: 0 },
            ]).map((opt) => {
              const active = tierFilter === opt.value;
              // Higher tiers are always selectable — selecting "Platinum"
              // as a Silver user shows the locked Platinum picks instead
              // of disabling the chip. The lock icon stays so users
              // understand they'll see locked variants when they pick it.
              const aboveTier = opt.value !== "All" && opt.rank > userRank;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTierFilter(opt.value)}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? opt.value === "platinum"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                        : opt.value === "gold"
                        ? "bg-blue-500/20 text-blue-300 border border-blue-400/40"
                        : opt.value === "silver"
                        ? "bg-white/10 text-slate-100 border border-white/30"
                        : opt.value === "free"
                        ? "bg-slate-600/30 text-slate-200 border border-slate-500/40"
                        : "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title={
                    opt.value === "All"
                      ? "Show all tiers"
                      : aboveTier
                      ? `Show ${opt.label} picks (locked — upgrade to unlock probabilities)`
                      : `Show only ${opt.label} picks`
                  }
                >
                  {opt.icon && <span>{opt.icon}</span>}
                  <span>{opt.label}</span>
                  {aboveTier && <Lock className="h-2.5 w-2.5 text-amber-400/80" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Confidence filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1">
            {confOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setConfidenceFilter(opt)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  confidenceFilter === opt
                    ? opt === "High"
                      ? "bg-emerald-600/80 text-white"
                      : opt === "Medium"
                      ? "bg-amber-600/80 text-white"
                      : opt === "Low"
                      ? "bg-red-600/80 text-white"
                      : "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {opt === "High"   ? "High (>75%)"
                 : opt === "Medium" ? "Med (50–75%)"
                 : opt === "Low"    ? "Low (<50%)"
                 : opt}
              </button>
            ))}
          </div>
        </div>

        {/* Result count */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {total} result{total !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}


// ─── Main page ───────────────────────────────────────────────────────────────

// v6 B3 helper — local YYYY-MM-DD of today, in the browser's TZ,
// so the date picker's default matches what the user sees on their
// calendar. Using UTC here would misfire at midnight local.
function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}


export default function PredictionsPage() {
  const { t } = useTranslations();
  const { tier: userTier } = useTier();
  const isFree = userTier === "free";
  const [leagueFilter,     setLeagueFilter]     = useState<LeagueFilter>("All");
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("All");
  const [tierFilter,       setTierFilter]       = useState<TierFilter>("All");
  const [sortKey,          setSortKey]          = useState<SortKey>("confidence");

  // v6.2: view mode tabs (Upcoming / Live Now / Results)
  const [viewMode, setViewMode] = useState<ViewMode>("upcoming");

  // Results-mode range selector: defaults to this week.
  const [resultsRange, setResultsRange] = useState<7 | 14 | 30>(7);

  const today = useMemo(() => todayIsoDate(), []);
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>("today");

  const isResults = viewMode === "results";
  const isLive    = viewMode === "live";

  // ── Fetch upcoming / live / results depending on view mode + date range ──
  // Live polls more aggressively (30s) since the score and elapsed minute
  // change in real time; upcoming/results only need a 60s cadence.
  const fixturesQuery = useQuery({
    queryKey: ["predictions-view", viewMode, dateRangeFilter, resultsRange],
    queryFn: () => {
      if (isResults) return api.getFixtureResults(resultsRange);
      if (isLive)    return api.getFixturesLive();
      // Fetch enough days to cover the selected range; always ≥7 for caching.
      const days = dateRangeFilter === "thisMonth" ? 30 : 7;
      return api.getFixturesUpcoming(days);
    },
    staleTime: isLive ? 15_000 : 60_000,
    refetchInterval: isLive ? 30_000 : 60_000,
    retry: 2,
  });

  const isLoading = fixturesQuery.isLoading;
  const hasError  = fixturesQuery.isError;

  // ── Filter fixtures to the selected date range ────────────────────────────
  // Live mode bypasses the date-range filter, but we still drop "live"
  // rows whose kickoff is more than two hours in the past or still in
  // the future. The backend occasionally lags on flipping LIVE →
  // FINISHED, and without this guard those rows leak into the strip.
  const upcomingFixtures = useMemo<Fixture[]>(() => {
    const all = fixturesQuery.data?.fixtures ?? [];
    if (isLive) {
      const now = Date.now();
      const TWO_HOURS = 120 * 60 * 1000;
      return all.filter((f) => {
        const kickoff = new Date(f.scheduled_at).getTime();
        if (!Number.isFinite(kickoff)) return false;
        if (kickoff > now) return false;
        return now - kickoff <= TWO_HOURS;
      });
    }
    if (isResults || dateRangeFilter === "all") return all;

    const [ty, tm, td] = today.split("-").map(Number);
    const todayDate = new Date(ty, tm - 1, td);

    return all.filter((f) => {
      if (!f.scheduled_at) return false;
      const d = new Date(f.scheduled_at);
      const fDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      if (dateRangeFilter === "today") {
        // Live matches always belong in "Today" even if their kickoff date
        // (UTC) doesn't equal the user's local today — keep them visible
        // until the backend marks them FINISHED.
        if (f.status === "live") return true;
        return fDate.getTime() === todayDate.getTime();
      }
      if (dateRangeFilter === "thisWeek") {
        const dow = (todayDate.getDay() + 6) % 7; // 0 = Monday
        const weekStart = new Date(todayDate);
        weekStart.setDate(todayDate.getDate() - dow);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return fDate >= weekStart && fDate <= weekEnd;
      }
      if (dateRangeFilter === "thisMonth") {
        return (
          d.getFullYear() === todayDate.getFullYear() &&
          d.getMonth() === todayDate.getMonth()
        );
      }
      return true;
    });
  }, [fixturesQuery.data, dateRangeFilter, isResults, today]);

  // ── Derived leagues list for filter tabs ─────────────────────────────────
  // Sort available leagues by popularity rank; unknown leagues go to the end
  // alphabetically so the dropdown always feels intentionally ordered.
  const availableLeagues = useMemo(() => {
    // Only show leagues that have actual fixture data from the API.
    // No hardcoded padding — if the backend syncs a league, it shows up.
    const s = new Set<string>();
    upcomingFixtures.forEach((f) => s.add(f.league_name));
    return Array.from(s).sort((a, b) => {
      const ia = LEAGUE_POPULARITY.indexOf(a);
      const ib = LEAGUE_POPULARITY.indexOf(b);
      const ra = ia === -1 ? 999 : ia;
      const rb = ib === -1 ? 999 : ib;
      if (ra !== rb) return ra - rb;
      return a.localeCompare(b);
    });
  }, [upcomingFixtures]);

  // Build league_name → country map from API fixture data.
  // The backend now includes league_country in the fixture response.
  const leagueCountryMap = useMemo(() => {
    const m = new Map<string, string>();
    upcomingFixtures.forEach((f) => {
      if (f.league_country && !m.has(f.league_name)) {
        m.set(f.league_name, f.league_country);
      }
    });
    return m;
  }, [upcomingFixtures]);

  // ── Keep fixtures that EITHER have a visible prediction OR a locked
  // pick (above the user's tier). The locked variant renders with a
  // shield + upgrade hint, so users can still see *that* a higher tier
  // has a pick on this match — they just can't see the probabilities.
  const fixturesWithPrediction = useMemo(
    () =>
      upcomingFixtures.filter(
        (f) => f.prediction != null || (f as any).locked_pick_tier != null,
      ),
    [upcomingFixtures],
  );

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let items = [...fixturesWithPrediction];

    if (leagueFilter !== "All") {
      items = items.filter((f) => f.league_name === leagueFilter);
    }

    if (confidenceFilter !== "All") {
      items = items.filter((f) => {
        // Locked picks have no visible confidence — skip when a confidence
        // band is selected. They reappear under "All".
        if (!f.prediction) return false;
        const score = Math.round(f.prediction.confidence * 100);
        return getConfidenceLevel(score) === confidenceFilter;
      });
    }

    // Tier filter — also matches locked picks via locked_pick_tier so a
    // Silver user filtering "Platinum" sees the locked Platinum picks.
    if (tierFilter !== "All") {
      items = items.filter((f) => {
        const lockedTier = (f as any).locked_pick_tier as string | null | undefined;
        if (lockedTier) return lockedTier === tierFilter;
        if (!f.prediction) return false;
        const classified =
          (f.prediction as any).pick_tier ??
          classifyPickTier({
            leagueId: (f as any).league_id ?? null,
            leagueName: f.league_name ?? null,
            confidence: f.prediction.confidence,
          });
        return classified === tierFilter;
      });
    }

    if (sortKey === "confidence") {
      items.sort((a, b) => {
        const ca = a.prediction ? a.prediction.confidence : -1;
        const cb = b.prediction ? b.prediction.confidence : -1;
        return cb - ca;
      });
    } else if (sortKey === "time") {
      items.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
    } else if (sortKey === "league") {
      items.sort((a, b) => a.league_name.localeCompare(b.league_name));
    }

    return items;
  }, [fixturesWithPrediction, leagueFilter, confidenceFilter, tierFilter, sortKey]);

  // v6.2: group filtered fixtures by league for accordion rendering
  const groupedByLeague = useMemo(
    () => groupFixturesByLeague(filtered),
    [filtered]
  );

  // Results view: group by match-date (newest first) for a track-record style
  // scan across the selected range. Each day shows every graded match in one
  // panel with hit/miss indicators per row.
  const groupedByDate = useMemo(() => {
    if (!isResults) return [] as Array<{ date: string; fixtures: Fixture[] }>;
    const map = new Map<string, Fixture[]>();
    for (const f of filtered) {
      if (!f.scheduled_at) continue;
      const d = new Date(f.scheduled_at);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const key = `${y}-${m}-${dd}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    }
    const keys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    return keys.map((date) => ({
      date,
      fixtures: map.get(date)!.sort((a, b) =>
        a.scheduled_at.localeCompare(b.scheduled_at),
      ),
    }));
  }, [filtered, isResults]);

  // Results view: hit / miss / pending counts for the summary strip on top.
  const resultsSummary = useMemo(() => {
    if (!isResults) return { hits: 0, misses: 0, pending: 0, total: 0 };
    let hits = 0;
    let misses = 0;
    let pending = 0;
    for (const f of filtered) {
      if (!f.prediction || !f.result?.winner) {
        pending += 1;
        continue;
      }
      const predicted = derivePickSide(f.prediction);
      const actual = f.result.winner;
      if (predicted && predicted === actual) hits += 1;
      else misses += 1;
    }
    return { hits, misses, pending, total: filtered.length };
  }, [filtered, isResults]);

  return (
    <div className="relative mx-auto max-w-7xl px-0 sm:px-2 py-4 sm:py-6 md:py-8 animate-fade-in overflow-hidden">
      <div className="relative space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <HexBadge variant="green" size="lg">
            <Sparkles className="h-6 w-6" />
          </HexBadge>
          <div>
            <span className="section-label">All predictions</span>
            <h1 className="text-heading mt-3">{t("pred.title")}</h1>
            <p className="mt-2 text-sm text-slate-400">
              {t("pred.subtitle")}
            </p>
            <div className="mt-3">
              <TierScopePill />
            </div>
          </div>
        </div>

        <Pill tone="win" className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          {t("pred.liveUpdates")}
        </Pill>
      </div>

      {/* ── View Mode Tabs — Upcoming · Live · Results ──
           Live is in-page (queries /fixtures/live); Results still redirects
           to the dedicated /results screen. */}
      <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        <button
          type="button"
          onClick={() => setViewMode("upcoming")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
            viewMode === "upcoming"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
          aria-pressed={viewMode === "upcoming"}
        >
          <CalendarDays className="h-4 w-4" />
          <span>{t("pred.upcoming")}</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode("live")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
            viewMode === "live"
              ? "bg-red-600 text-white shadow-md shadow-red-500/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
          aria-pressed={viewMode === "live"}
        >
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${viewMode === "live" ? "bg-white animate-ping" : "bg-red-400 animate-ping"}`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${viewMode === "live" ? "bg-white" : "bg-red-400"}`} />
          </span>
          <span>{t("pred.live")}</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode("results")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
            viewMode === "results"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
          aria-pressed={viewMode === "results"}
        >
          <Trophy className="h-4 w-4" />
          <span>{t("pred.resultsTab")}</span>
        </button>
      </div>

      {/* ── Upcoming-mode guidance banner ── */}
      {!isResults && !isLive && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
          <span className="mt-0.5 text-base">💡</span>
          <p className="text-xs leading-relaxed text-slate-300">
            <span className="font-semibold text-white">{t("pred.upcomingGuidance.title")}</span>{" "}
            {t("pred.upcomingGuidance.bodyBefore")}{" "}
            <span className="font-semibold text-amber-300">{t("pred.upcomingGuidance.confidenceLabel")}</span>{t("pred.upcomingGuidance.bodyAfterConfidence")}{" "}
            <span className="font-semibold text-emerald-300">{t("pred.upcomingGuidance.recommend")}</span>{" "}
            {t("pred.upcomingGuidance.bodyAfterRecommend")}{" "}
            <span className="font-semibold text-white">Gold</span>{" "}{t("pred.upcomingGuidance.or")}{" "}
            <span className="font-semibold text-white">Platinum</span>{" "}
            {t("pred.upcomingGuidance.bodyTail")}
          </p>
        </div>
      )}

      {/* ── Live-mode banner: makes clear we show the pre-match pick, not a live recommendation ── */}
      {isLive && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <Radio className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
          <p className="text-xs leading-relaxed text-slate-300">
            <span className="font-semibold text-white">{t("pred.live.bannerTitle")}</span>{" "}
            {t("pred.live.bannerBodyBefore")}{" "}<span className="font-semibold text-white">{t("pred.live.bannerEmphasis")}</span>{" "}{t("pred.live.bannerBodyAfter")}
          </p>
        </div>
      )}

      {/* ── Trackrecord transparency notice — same picks shown here go into the tier stats ── */}
      {!isResults && !isLive && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
          <p className="text-xs leading-relaxed text-slate-300">
            <span className="font-semibold text-white">{t("pred.trackrecordNoticeTitle")}</span>{" "}
            {t("pred.trackrecordNoticeBody")}
          </p>
        </div>
      )}

      {/* ── Results-mode range selector (replaces the single-date picker) ── */}
      {isResults && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              {t("pred.rangeLabel")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {([
              { days: 7,  label: "Afgelopen week" },
              { days: 14, label: "Afgelopen 14 dagen" },
              { days: 30, label: "Afgelopen 30 dagen" },
            ] as const).map(({ days, label }) => {
              const active = resultsRange === days;
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => setResultsRange(days)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "border-blue-500/40 bg-blue-500/15 text-blue-200"
                      : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {/* Hit / miss summary */}
          {resultsSummary.total > 0 && (
            <div className="ml-auto flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {resultsSummary.hits}{" "}
                {t("pred.resultHits" as any) === "pred.resultHits"
                  ? "raak"
                  : t("pred.resultHits" as any)}
              </span>
              <span className="inline-flex items-center gap-1.5 text-red-300">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                {resultsSummary.misses}{" "}
                {t("pred.resultMisses" as any) === "pred.resultMisses"
                  ? "mis"
                  : t("pred.resultMisses" as any)}
              </span>
              {resultsSummary.pending > 0 && (
                <span className="inline-flex items-center gap-1.5 text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                  {resultsSummary.pending}{" "}
                  {t("pred.resultPending" as any) === "pred.resultPending"
                    ? "open"
                    : t("pred.resultPending" as any)}
                </span>
              )}
              {resultsSummary.hits + resultsSummary.misses > 0 && (
                <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 font-bold tabular-nums text-emerald-200">
                  {Math.round(
                    (resultsSummary.hits /
                      (resultsSummary.hits + resultsSummary.misses)) *
                      100,
                  )}
                  %
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Date range filter (upcoming only) ── */}
      {!isResults && !isLive && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <Clock className="h-4 w-4 shrink-0 text-slate-500" />
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1">
            {(
              [
                { key: "all",       label: t("pred.all") },
                { key: "today",     label: t("pred.today") },
                { key: "thisWeek",  label: t("pred.thisWeek") },
                { key: "thisMonth", label: t("pred.thisMonth") },
              ] as { key: DateRangeFilter; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setDateRangeFilter(key)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  dateRangeFilter === key
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats bar ── */}
      {/* StatsBar removed — too many boxes, users don't need these numbers */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card h-20 rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      )}

      {/* ── Error banner ── */}
      {hasError && (
        <div
          className="rounded-xl border p-4 flex items-start gap-3"
          style={{ background: "rgba(239,68,68,0.04)", borderColor: "rgba(239,68,68,0.25)" }}
        >
          <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-400">
            {t("pred.errorLoading")}
          </p>
        </div>
      )}

      {/* ── Filter bar ── */}
      <FilterBar
        leagueFilter={leagueFilter}
        setLeagueFilter={setLeagueFilter}
        confidenceFilter={confidenceFilter}
        setConfidenceFilter={setConfidenceFilter}
        tierFilter={tierFilter}
        setTierFilter={setTierFilter}
        sortKey={sortKey}
        setSortKey={setSortKey}
        total={filtered.length}
        availableLeagues={availableLeagues}
        leagueCountryMap={leagueCountryMap}
        userTier={userTier}
      />

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : upcomingFixtures.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center gap-3 py-20 text-center">
          {isLive ? (
            <Radio className="h-8 w-8 text-slate-600" />
          ) : (
            <Sparkles className="h-8 w-8 text-slate-600" />
          )}
          <p className="text-base font-medium text-slate-400">
            {isLive ? t("pred.noLiveMatches") : t("pred.noUpcomingMatches")}
          </p>
          <p className="text-sm text-slate-600 max-w-md">
            {isLive ? t("pred.noLiveMatchesDesc") : t("pred.noUpcomingMatchesDesc")}
          </p>
        </div>
      ) : fixturesWithPrediction.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Sparkles className="h-8 w-8 text-slate-600" />
          <p className="text-base font-medium text-slate-400">{t("pred.noForecastsYet")}</p>
          <p className="text-sm text-slate-600 max-w-xl">
            {t("pred.noForecastsYetDesc")}
          </p>
          <p className="text-xs text-slate-500">
            {upcomingFixtures.length === 1
              ? t("pred.matchOnThisDate")
              : t("pred.matchesOnThisDate", { count: upcomingFixtures.length })}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center gap-4 py-20 text-center">
          {tierFilter !== "All" ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 ring-1 ring-emerald-400/20">
                <ShieldCheck className="h-6 w-6 text-emerald-400" strokeWidth={2} />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-white capitalize">
                  No {tierFilter} picks right now
                </p>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-400">
                  Our engine is being selective — it only picks matches it&apos;s
                  highly confident about. This is normal and a sign that the
                  system is working correctly.
                </p>
              </div>
              {tierFilter !== "free" && (
                <p className="mx-auto max-w-sm rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs leading-relaxed text-slate-400">
                  Want to see picks now?{" "}
                  <button
                    onClick={() => setTierFilter(
                      tierFilter === "platinum" ? "gold"
                      : tierFilter === "gold" ? "silver"
                      : "free"
                    )}
                    className="font-semibold text-slate-200 underline underline-offset-2 hover:text-white"
                  >
                    Switch to a lower tier
                  </button>
                  {" "}— keep in mind accuracy may be slightly lower.
                </p>
              )}
              <button
                onClick={() => setTierFilter("All")}
                className="btn-primary mt-1"
              >
                Show all picks
              </button>
            </>
          ) : (
            <>
              <Sparkles className="h-8 w-8 text-slate-600" />
              <p className="text-base font-medium text-slate-400">{t("pred.noMatchingPredictions")}</p>
              <p className="text-sm text-slate-600">
                {t("pred.noMatchingPredictionsDesc")}
              </p>
              <p className="text-xs text-slate-500">
                {t("pred.predictionsAvailable", { count: fixturesWithPrediction.length })}
              </p>
              <button
                onClick={() => { setLeagueFilter("All"); setConfidenceFilter("All"); setTierFilter("All"); }}
                className="btn-primary mt-2"
              >
                {t("pred.clearFilters")}
              </button>
            </>
          )}
        </div>
      ) : isResults ? (
        // Results view: group by date (newest first) so users can scan
        // the weeks' picks like a track record.
        <div className="space-y-3">
          {groupedByDate.map((group, i) => (
            <DateSection
              key={group.date}
              dateIso={group.date}
              fixtures={group.fixtures}
              defaultOpen={i < 3}
              isFree={isFree}
            />
          ))}

          {/* Cross-link to the deeper /results screen (Deel 5). The
              tab here is the simple per-match overview with per-tier
              ✅/❌ — power users who want ROI/simulation drill-downs
              go through to the dedicated page. */}
          {groupedByDate.length > 0 && (
            <div className="flex justify-center pt-2">
              <Link
                href="/results"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-300 transition-colors"
              >
                {t("pred.advancedSimulationLink" as any) === "pred.advancedSimulationLink"
                  ? "View advanced simulation →"
                  : t("pred.advancedSimulationLink" as any)}
              </Link>
            </div>
          )}
        </div>
      ) : (
        // v6.2: grouped-by-league accordion view (upcoming mode)
        <div className="space-y-3">
          {groupedByLeague.map((group) => (
            <LeagueSection
              key={group.name}
              leagueName={group.name}
              fixtures={group.fixtures}
              defaultOpen
              isFree={isFree}
            />
          ))}
        </div>
      )}

      {/* ── Upsell: Gold for BOTD ── */}
      {!isLoading && upcomingFixtures.length > 0 && (
        <UpsellBanner
          targetTier="gold"
          headline={t("pred.upsellHeadline")}
          subtext={t("pred.upsellSubtext")}
          variant="card"
        />
      )}

      </div>
    </div>
  );
}
