"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
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
} from "lucide-react";
import { api } from "@/lib/api";
import type { Fixture, FixturePrediction } from "@/types/api";
import { UpsellBanner } from "@/components/ui/upsell-banner";
import { GlassPanel } from "@/components/noct/glass-panel";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { TierScopePill } from "@/components/noct/tier-scope-pill";
import { PickTierBadge } from "@/components/noct/pick-tier-badge";
import { PickReasoningBlock } from "@/components/predictions/PickReasoningBlock";
import { classifyPickTier } from "@/lib/pick-tier";
import { derivePickSide } from "@/lib/prediction-pick";
import type { PickTierSlug } from "@/types/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type ConfidenceLevel = "High" | "Medium" | "Low";
type SortKey = "confidence" | "time" | "league";
type LeagueFilter = "All" | string;
type ConfidenceFilter = "All" | ConfidenceLevel;
/** v8.1: "All" = no filter, or a specific PickTierSlug to show ONLY that tier. */
type TierFilter = "All" | PickTierSlug;
// v8.6 — "live" tab removed: the engine publishes pre-match predictions,
// so a live-scores-only view was off-strategy and produced nearly-empty
// pages. Live scores still surface inside match detail and the dashboard
// LiveMatchesStrip; the Predictions page now only switches between
// Upcoming and Results.
type ViewMode = "upcoming" | "results";

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

function CompactMatchRow({ fixture }: { fixture: Fixture }) {
  const { t } = useTranslations();
  const pred: FixturePrediction | null = fixture.prediction ?? null;
  const hasPrediction = pred !== null && typeof pred.confidence === "number";

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
              {(fixture as any).live_score?.elapsed ? `${(fixture as any).live_score.elapsed}'` : "LIVE"}
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
          {/* Home team */}
          <div className="flex items-center gap-2">
            {fixture.home_team_logo && (
              <Image src={fixture.home_team_logo} alt="" width={16} height={16} className="rounded-full shrink-0" />
            )}
            <span className={`text-sm font-semibold truncate ${modelPick === "home" ? "text-emerald-300" : "text-slate-100"}`}>
              {fixture.home_team_name}
            </span>
            {isLive && (fixture as any).live_score?.home_goals != null && (
              <span className="text-sm font-bold tabular-nums text-red-300">{(fixture as any).live_score.home_goals}</span>
            )}
            {isFinished && fixture.result && (
              <span className="text-sm font-bold tabular-nums text-slate-400">{fixture.result.home_score}</span>
            )}
          </div>
          {/* Away team */}
          <div className="flex items-center gap-2 mt-0.5">
            {fixture.away_team_logo && (
              <Image src={fixture.away_team_logo} alt="" width={16} height={16} className="rounded-full shrink-0" />
            )}
            <span className={`text-sm font-semibold truncate ${modelPick === "away" ? "text-emerald-300" : "text-slate-100"}`}>
              {fixture.away_team_name}
            </span>
            {isLive && (fixture as any).live_score?.away_goals != null && (
              <span className="text-sm font-bold tabular-nums text-red-300">{(fixture as any).live_score.away_goals}</span>
            )}
            {isFinished && fixture.result && (
              <span className="text-sm font-bold tabular-nums text-slate-400">{fixture.result.away_score}</span>
            )}
          </div>
        </div>

        {/* Prediction pick badge — col 3 */}
        <div className="col-span-1 flex flex-col items-center gap-1 min-w-0">
          {pickLabel && (
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
          {/* v8.1 tier shield — shows at a glance which tier this pick belongs
              to. Shield-only (no label) to fit the dense row layout. */}
          {pickTier && (
            <PickTierBadge
              tier={pickTier}
              size="sm"
              showLabel={false}
              showAccuracy={false}
            />
          )}
        </div>

        {/* Odds — col 4 (desktop only) */}
        <div className="hidden sm:flex col-span-3 items-center justify-center gap-1.5">
          <OddButton label="1" value={fixture.odds?.home ?? null} highlighted={modelPick === "home"} />
          <OddButton label="X" value={fixture.odds?.draw ?? null} highlighted={modelPick === "draw"} />
          <OddButton label="2" value={fixture.odds?.away ?? null} highlighted={modelPick === "away"} />
        </div>

        {/* Confidence bar + correctness */}
        <div className="col-span-3 sm:col-span-2 flex items-center gap-2" title={t("pred.confidenceTooltip")}>
          {isCorrect !== null ? (
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              isCorrect
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                : "bg-red-500/15 text-red-400 border border-red-500/25"
            }`}>
              {isCorrect ? "Correct" : "Incorrect"}
            </span>
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
}: {
  leagueName: string;
  fixtures: Fixture[];
  defaultOpen?: boolean;
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
            <CompactMatchRow key={f.id} fixture={f} />
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
}: {
  dateIso: string;
  fixtures: Fixture[];
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
  const dateLabel = (() => {
    const [y, m, d] = dateIso.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    const now = new Date();
    const isToday = dt.toDateString() === now.toDateString();
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    const isYest = dt.toDateString() === yest.toDateString();
    const bcp = locale === "nl" ? "nl-NL" : "en-GB";
    if (isToday) return locale === "nl" ? "Vandaag" : "Today";
    if (isYest) return locale === "nl" ? "Gisteren" : "Yesterday";
    return dt.toLocaleDateString(bcp, {
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
            <CompactMatchRow key={f.id} fixture={f} />
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
}: FilterBarProps) {
  const { t } = useTranslations();
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
              { value: "All" as const, label: "All", icon: null },
              { value: "platinum" as const, label: "Platinum", icon: "🟢" },
              { value: "gold" as const, label: "Gold", icon: "🔵" },
              { value: "silver" as const, label: "Silver", icon: "⚪" },
              { value: "free" as const, label: "Free", icon: "⬜" },
            ]).map((opt) => {
              const active = tierFilter === opt.value;
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
                  title={opt.value === "All" ? "Show all tiers" : `Show only ${opt.label} picks`}
                >
                  {opt.icon && <span>{opt.icon}</span>}
                  <span>{opt.label}</span>
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

        {/* Sort */}
        <div className="flex items-center gap-2 ml-auto">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1">
            {sortOptions.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  sortKey === key
                    ? "bg-white/[0.08] text-slate-100"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
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

function addDaysIso(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function daysBetweenIso(from: string, to: string): number {
  const [yF, mF, dF] = from.split("-").map(Number);
  const [yT, mT, dT] = to.split("-").map(Number);
  const fromMs = Date.UTC(yF, mF - 1, dF);
  const toMs = Date.UTC(yT, mT - 1, dT);
  return Math.round((toMs - fromMs) / (24 * 60 * 60 * 1000));
}

export default function PredictionsPage() {
  const { t } = useTranslations();
  const [leagueFilter,     setLeagueFilter]     = useState<LeagueFilter>("All");
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("All");
  const [tierFilter,       setTierFilter]       = useState<TierFilter>("All");
  const [sortKey,          setSortKey]          = useState<SortKey>("confidence");

  // v6.2: view mode tabs (Upcoming / Live Now / Results)
  const [viewMode, setViewMode] = useState<ViewMode>("upcoming");

  // Results-mode range selector: defaults to this week.
  const [resultsRange, setResultsRange] = useState<7 | 14 | 30>(7);

  // v6 B3: date picker state. Default = today. min = 30 days back,
  // max = 7 days ahead — same bounds Dennis specified.
  const today = useMemo(() => todayIsoDate(), []);
  const minDate = useMemo(() => addDaysIso(today, -30), [today]);
  const maxDate = useMemo(() => addDaysIso(today, 7), [today]);
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const isResults = viewMode === "results";
  const isHistorical = isResults || selectedDate < today;
  const daysAhead = Math.max(1, daysBetweenIso(today, selectedDate) + 1);
  const daysBack = Math.max(1, daysBetweenIso(selectedDate, today) + 1);

  // v6 C1: headline counters — reuse existing dashboard metrics
  // endpoint. Cached separately so it doesn't re-fire on date change.
  const metricsQuery = useQuery({
    queryKey: ["dashboard-metrics-headline"],
    queryFn: () => api.getDashboardMetrics(),
    staleTime: 5 * 60_000,
  });

  // ── Fetch upcoming / live / results depending on view mode + date ─────────
  const fixturesQuery = useQuery({
    queryKey: ["predictions-view", viewMode, selectedDate, resultsRange],
    queryFn: () => {
      if (isResults) {
        // Results tab: fetch the full range (7/14/30 days). Date picker
        // is hidden in this view; the range selector drives the window.
        return api.getFixtureResults(resultsRange);
      }
      if (selectedDate < today) {
        return api.getFixtureResults(daysBack);
      }
      // Default "upcoming" query wants at least 7 days so the default
      // experience (user lands on today) still shows a busy list.
      return api.getFixturesUpcoming(Math.max(7, daysAhead));
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 2,
  });

  const isLoading = fixturesQuery.isLoading;
  const hasError  = fixturesQuery.isError;

  // ── Filter the returned fixtures to the exact selected date ───────────────
  // Live view skips the date filter entirely — all LIVE matches are shown.
  // Results view also skips the date filter — the range selector controls
  // the window and we show every graded match inside it.
  //
  // v8.4 — removed the earlier "selectedDate === today → return all" escape
  // hatch. It preloaded 7 days forward when the user explicitly chose
  // "Vandaag", so the header correctly said "Today" but the list contained
  // tomorrow+later matches. Now "Vandaag" means only today's matches; the
  // upcoming fetch still grabs 7 days ahead for caching but the display
  // is filtered to the exact selected calendar day in local browser time.
  const upcomingFixtures = useMemo<Fixture[]>(() => {
    const all = fixturesQuery.data?.fixtures ?? [];
    if (isResults) {
      return all;
    }
    return all.filter((f) => {
      if (!f.scheduled_at) return false;
      const d = new Date(f.scheduled_at);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}` === selectedDate;
    });
  }, [fixturesQuery.data, selectedDate, isResults]);

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

  // ── Split into with/without prediction so the empty state can be honest ─
  const fixturesWithPrediction = useMemo(
    () => upcomingFixtures.filter((f) => f.prediction != null),
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
        if (!f.prediction) return false;
        const score = Math.round(f.prediction.confidence * 100);
        return getConfidenceLevel(score) === confidenceFilter;
      });
    }

    // v8.1: tier filter — prefers the backend-classified tier from the API
    // response, falls back to frontend mirror only when absent.
    if (tierFilter !== "All") {
      items = items.filter((f) => {
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

  // ── Auto-refresh indicator ────────────────────────────────────────────────
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setLastRefresh(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

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

      {/* ── v8.6: View Mode Tabs — Upcoming / Results only ── */}
      <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        {(
          [
            { key: "upcoming" as const, label: t("pred.upcoming"), icon: CalendarDays },
            { key: "results" as const, label: t("results.title"), icon: Trophy },
          ]
        ).map(({ key, label, icon: Icon }) => {
          const active = viewMode === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setViewMode(key)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              aria-pressed={active}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Results-mode range selector (replaces the single-date picker) ── */}
      {isResults && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              {t("pred.rangeLabel" as any) === "pred.rangeLabel"
                ? "Periode"
                : t("pred.rangeLabel" as any)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {([7, 14, 30] as const).map((days) => {
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
                  {days} {t("pred.rangeDays" as any) === "pred.rangeDays"
                    ? "dagen"
                    : t("pred.rangeDays" as any)}
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

      {/* ── v6 B3: date picker (upcoming/single-day browsing only) ── */}
      {!isResults && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <label htmlFor="predictions-date" className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              {t("pred.date")}
            </label>
          </div>
          <input
            id="predictions-date"
            type="date"
            value={selectedDate}
            min={minDate}
            max={maxDate}
            onChange={(e) => setSelectedDate(e.target.value || today)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm text-slate-100 focus:border-blue-500/50 focus:outline-none"
          />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDaysIso(d, -1))}
              disabled={selectedDate <= minDate}
              className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← {t("pred.previousDay")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(today)}
              className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-300 hover:bg-blue-500/20"
            >
              {t("pred.today")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDaysIso(d, 1))}
              disabled={selectedDate >= maxDate}
              className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("pred.nextDay")} →
            </button>
          </div>
          {isHistorical && (
            <span className="ml-auto rounded-full border border-slate-500/25 bg-slate-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {t("pred.historical")}
            </span>
          )}
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
      />

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : upcomingFixtures.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Sparkles className="h-8 w-8 text-slate-600" />
          <p className="text-base font-medium text-slate-400">{t("pred.noUpcomingMatches")}</p>
          <p className="text-sm text-slate-600 max-w-md">
            {t("pred.noUpcomingMatchesDesc")}
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
        <div className="glass-card flex flex-col items-center justify-center gap-3 py-20 text-center">
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
            />
          ))}
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
