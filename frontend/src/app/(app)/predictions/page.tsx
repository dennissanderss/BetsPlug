"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Radio,
  CalendarDays,
  Trophy,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Fixture, FixturePrediction } from "@/types/api";
import { PaywallOverlay } from "@/components/ui/paywall-overlay";
import { UpsellBanner } from "@/components/ui/upsell-banner";

// ─── Types ───────────────────────────────────────────────────────────────────

type ConfidenceLevel = "High" | "Medium" | "Low";
type SortKey = "confidence" | "time" | "league";
type LeagueFilter = "All" | string;
type ConfidenceFilter = "All" | ConfidenceLevel;
type ViewMode = "upcoming" | "live" | "results";

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

// ─── Match Card ───────────────────────────────────────────────────────────────
// NOTE: replaced in v6.2 by CompactMatchRow + LeagueSection. Kept here
// for a safe rollback window; slated for deletion in v6.3.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MatchCard({ fixture }: { fixture: Fixture }) {
  const { t } = useTranslations();
  const [expanded, setExpanded] = useState(false);
  const pred: FixturePrediction | null = fixture.prediction ?? null;
  const hasPrediction = pred !== null && typeof pred.confidence === "number";

  const confidenceScore = hasPrediction ? Math.round((pred.confidence ?? 0) * 100) : null;
  const confidenceLevel = confidenceScore !== null ? getConfidenceLevel(confidenceScore) : null;
  const confidenceColor = confidenceLevel ? getConfidenceColor(confidenceLevel) : "#475569";
  const confidenceBg    = confidenceLevel ? getConfidenceBg(confidenceLevel) : "bg-slate-500/10 text-slate-500";

  return (
    <div className="glass-card-hover overflow-hidden animate-slide-up">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:gap-6">

        {/* ── Left: Match info ── */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              {fixture.league_name}
            </span>
            {/* Scheduled badge */}
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{
                background: "rgba(59,130,246,0.12)",
                color: "#3b82f6",
                border: "1px solid rgba(59,130,246,0.25)",
              }}
            >
              SCH
            </span>
          </div>

          <p className="text-base font-semibold text-slate-100 leading-tight">
            {fixture.home_team_name}{" "}
            <span className="text-slate-500 font-normal">vs</span>{" "}
            {fixture.away_team_name}
          </p>

          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0" />
            {formatMatchTime(fixture.scheduled_at)}
          </p>
        </div>

        {/* ── Center: Probability ── */}
        <div className="w-full max-w-[260px] lg:mx-6">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            {t("pred.winProbability")}
          </p>
          {hasPrediction ? (
            <ProbabilityBar
              homeProb={Math.round((pred.home_win_prob ?? 0) * 100)}
              drawProb={pred.draw_prob != null ? Math.round(pred.draw_prob * 100) : null}
              awayProb={Math.round((pred.away_win_prob ?? 0) * 100)}
              homeTeam={fixture.home_team_name}
              awayTeam={fixture.away_team_name}
            />
          ) : (
            <ProbabilityPending />
          )}
        </div>

        {/* ── Right: Confidence + action ── */}
        <div className="flex shrink-0 flex-row items-center gap-4 lg:flex-col lg:items-end lg:gap-2">
          <div className="flex flex-col items-center lg:items-end">
            {hasPrediction ? (
              <>
                <span
                  className="text-4xl font-extrabold leading-none tabular-nums"
                  style={{ color: confidenceColor }}
                >
                  {confidenceScore}
                  <span className="text-xl font-semibold">%</span>
                </span>
                <span className={`mt-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${confidenceBg}`}>
                  {confidenceLevel} {t("pred.confidence")}
                </span>
                {pred?.model_name && (
                  <span className="mt-1 text-[9px] text-slate-600 uppercase tracking-wider">
                    {pred.model_name}
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm font-medium text-slate-600 italic">{t("pred.analysisPending")}</span>
            )}
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-300"
            aria-label={`View details for ${fixture.home_team_name} vs ${fixture.away_team_name}`}
            aria-expanded={expanded}
          >
            {expanded ? (
              <><ChevronUp className="h-3.5 w-3.5" />{t("pred.hideDetails")}</>
            ) : (
              <><Eye className="h-3.5 w-3.5" />{t("pred.viewDetails")}</>
            )}
          </button>
        </div>
      </div>

      {/* ── Bottom: venue / pending note ── */}
      <div className="border-t border-white/[0.05] bg-white/[0.02] px-5 py-2.5">
        {hasPrediction ? (
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              {fixture.venue && (
                <p className="text-[10px] text-slate-600 truncate">
                  <span className="font-medium text-slate-500">{t("pred.venue")}:</span> {fixture.venue}
                </p>
              )}
              {pred?.predicted_at && (
                <p className="text-[10px] text-slate-700 truncate mt-0.5">
                  {t("pred.predictedOn")} {new Date(pred.predicted_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                </p>
              )}
            </div>
            {pred?.pick && (
              <span className="shrink-0 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                {pred.pick}
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-600 italic">
            {t("pred.notProcessed")}
          </p>
        )}
      </div>

      {/* ── Pre-match odds row (v6 B1) — rendered ONLY when backend supplies odds ── */}
      {fixture.odds && (
        fixture.odds.home != null ||
        fixture.odds.draw != null ||
        fixture.odds.away != null ||
        fixture.odds.over_2_5 != null ||
        fixture.odds.under_2_5 != null
      ) ? (
        <div className="border-t border-white/[0.05] bg-white/[0.015] px-5 py-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-600">
              {t("pred.preMatchOdds")}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              {fixture.odds.home != null && (
                <span className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 tabular-nums text-slate-300">
                  <span className="text-slate-500 mr-1">1</span>{fixture.odds.home.toFixed(2)}
                </span>
              )}
              {fixture.odds.draw != null && (
                <span className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 tabular-nums text-slate-300">
                  <span className="text-slate-500 mr-1">X</span>{fixture.odds.draw.toFixed(2)}
                </span>
              )}
              {fixture.odds.away != null && (
                <span className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 tabular-nums text-slate-300">
                  <span className="text-slate-500 mr-1">2</span>{fixture.odds.away.toFixed(2)}
                </span>
              )}
              {(fixture.odds.over_2_5 != null || fixture.odds.under_2_5 != null) && (
                <span className="mx-1 text-slate-700">|</span>
              )}
              {fixture.odds.over_2_5 != null && (
                <span className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 tabular-nums text-slate-400">
                  <span className="text-slate-500 mr-1">O2.5</span>{fixture.odds.over_2_5.toFixed(2)}
                </span>
              )}
              {fixture.odds.under_2_5 != null && (
                <span className="rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 tabular-nums text-slate-400">
                  <span className="text-slate-500 mr-1">U2.5</span>{fixture.odds.under_2_5.toFixed(2)}
                </span>
              )}
            </div>
            {fixture.odds.bookmaker && (
              <span className="ml-auto text-[9px] text-slate-700 uppercase tracking-wider">
                {fixture.odds.bookmaker}
              </span>
            )}
          </div>
        </div>
      ) : null}

      {/* ── Expanded: rich prediction detail panel ── */}
      {hasPrediction && expanded && (
        <div className="border-t border-white/[0.05] bg-white/[0.015] px-5 py-4 animate-fade-in space-y-4">

          {/* Pick badge */}
          {pred?.pick && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">{t("pred.modelPick")}</span>
              <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                {pred.pick}
              </span>
              <span className="text-[10px] text-slate-600 ml-auto">
                {t("pred.confidence")}: {Math.round((pred.confidence ?? 0) * 100)}%
              </span>
            </div>
          )}

          {/* Probability breakdown */}
          <div className={`grid gap-3 text-center ${pred?.draw_prob != null ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">{t("pred.homeWin")}</p>
              <p className="text-xl font-bold text-blue-400">{Math.round((pred?.home_win_prob ?? 0) * 100)}%</p>
              {pred?.edge?.home != null && (
                <p className={`text-[10px] font-medium mt-1 ${pred.edge.home > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {pred.edge.home > 0 ? '+' : ''}{(pred.edge.home * 100).toFixed(1)}% edge
                </p>
              )}
            </div>
            {pred?.draw_prob != null && (
              <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">{t("pred.draw")}</p>
                <p className="text-xl font-bold text-amber-400">{Math.round(pred.draw_prob * 100)}%</p>
                {pred.edge?.draw != null && (
                  <p className={`text-[10px] font-medium mt-1 ${pred.edge.draw > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {pred.edge.draw > 0 ? '+' : ''}{(pred.edge.draw * 100).toFixed(1)}% edge
                  </p>
                )}
              </div>
            )}
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1">{t("pred.awayWin")}</p>
              <p className="text-xl font-bold text-red-400">{Math.round((pred?.away_win_prob ?? 0) * 100)}%</p>
              {pred?.edge?.away != null && (
                <p className={`text-[10px] font-medium mt-1 ${pred.edge.away > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {pred.edge.away > 0 ? '+' : ''}{(pred.edge.away * 100).toFixed(1)}% edge
                </p>
              )}
            </div>
          </div>

          {/* Reasoning */}
          {pred?.reasoning && (
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-1.5">{t("pred.modelReasoning")}</p>
              <p className="text-xs text-slate-300 leading-relaxed">{pred.reasoning}</p>
            </div>
          )}

          {/* Top features */}
          {pred?.top_features && pred.top_features.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2">{t("pred.keyFactors")}</p>
              <div className="space-y-1.5">
                {pred.top_features.slice(0, 5).map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="text-slate-400 truncate capitalize">{f.feature?.replace(/_/g, ' ') ?? ''}</span>
                        <span className="text-slate-300 font-medium ml-2 shrink-0">{((f.importance ?? 0) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-blue-500/70 transition-all duration-500"
                          style={{ width: `${Math.min((f.importance ?? 0) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Venue */}
          {fixture.venue && (
            <p className="text-[10px] text-slate-600 text-center pt-1 border-t border-white/[0.05]">
              <span className="font-medium text-slate-500">{t("pred.venue")}:</span> {fixture.venue}
            </p>
          )}
        </div>
      )}
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
  const pred: FixturePrediction | null = fixture.prediction ?? null;
  const hasPrediction = pred !== null && typeof pred.confidence === "number";

  const isLive = fixture.status === "live";
  const isFinished = fixture.status === "finished";

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

  return (
    <div className="border-b border-white/[0.04] last:border-b-0">
      <div className="grid grid-cols-11 items-center gap-2 px-4 py-3.5 hover:bg-white/[0.02] transition-colors">
        {/* Time + Status */}
        <div className="col-span-2 sm:col-span-1 flex flex-col items-center">
          <span className="text-sm font-bold text-slate-100 tabular-nums">
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
        <div className="col-span-5 sm:col-span-4 min-w-0">
          {/* Home team */}
          <div className="flex items-center gap-2">
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
        <div className="col-span-1 flex justify-center">
          {pickLabel && (
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
              style={{
                background: `${confColor}18`,
                color: confColor,
                border: `1px solid ${confColor}35`,
              }}
            >
              {pickLabel}
            </span>
          )}
        </div>

        {/* Odds — col 4 (desktop only) */}
        <div className="hidden sm:flex col-span-3 items-center justify-center gap-1.5">
          <OddButton label="1" value={fixture.odds?.home ?? null} highlighted={modelPick === "home"} />
          <OddButton label="X" value={fixture.odds?.draw ?? null} highlighted={modelPick === "draw"} />
          <OddButton label="2" value={fixture.odds?.away ?? null} highlighted={modelPick === "away"} />
        </div>

        {/* Confidence bar */}
        <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
          {confScore != null && (
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
          )}
        </div>

      </div>

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
  const [open, setOpen] = useState(defaultOpen);

  // Count live matches in this league
  const liveCount = fixtures.filter((f) => f.status === "live").length;

  return (
    <div className="glass-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-white/[0.03] to-transparent border-b border-white/[0.05] hover:from-white/[0.05] transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10">
            <Trophy className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <span className="text-sm font-bold text-slate-100">{leagueName}</span>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-400">
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
          <div className="hidden sm:grid grid-cols-11 items-center gap-2 px-4 py-2 text-[9px] uppercase tracking-widest text-slate-600">
            <span className="col-span-1 text-center">Time</span>
            <span className="col-span-4">Match</span>
            <span className="col-span-1 text-center">Pick</span>
            <span className="col-span-3 text-center">Pre-match Odds</span>
            <span className="col-span-2">Confidence</span>
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
  sortKey: SortKey;
  setSortKey: (v: SortKey) => void;
  total: number;
  availableLeagues: string[];
}

function FilterBar({
  leagueFilter,
  setLeagueFilter,
  confidenceFilter,
  setConfidenceFilter,
  sortKey,
  setSortKey,
  total,
  availableLeagues,
}: FilterBarProps) {
  const { t } = useTranslations();
  const leagueTabs: LeagueFilter[] = ["All", ...availableLeagues];
  const confOptions: ConfidenceFilter[] = ["All", "High", "Medium", "Low"];
  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "confidence", label: t("pred.sortConfidence") },
    { key: "time",       label: t("pred.sortTime") },
    { key: "league",     label: t("pred.sortLeague") },
  ];

  return (
    <div className="glass-card p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* League tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1 flex-wrap">
          {leagueTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setLeagueFilter(tab)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                leagueFilter === tab
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
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
  const [sortKey,          setSortKey]          = useState<SortKey>("confidence");

  // v6.2: view mode tabs (Upcoming / Live Now / Results)
  const [viewMode, setViewMode] = useState<ViewMode>("upcoming");

  // v6 B3: date picker state. Default = today. min = 30 days back,
  // max = 7 days ahead — same bounds Dennis specified.
  const today = useMemo(() => todayIsoDate(), []);
  const minDate = useMemo(() => addDaysIso(today, -30), [today]);
  const maxDate = useMemo(() => addDaysIso(today, 7), [today]);
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const isHistorical = viewMode === "results" || selectedDate < today;
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
    queryKey: ["predictions-view", viewMode, selectedDate],
    queryFn: () => {
      if (viewMode === "live") {
        return api.getFixturesLive();
      }
      if (viewMode === "results" || selectedDate < today) {
        return api.getFixtureResults(daysBack);
      }
      // Default "upcoming" query wants at least 7 days so the default
      // experience (user lands on today) still shows a busy list.
      return api.getFixturesUpcoming(Math.max(7, daysAhead));
    },
    staleTime: viewMode === "live" ? 30_000 : 60_000,
    refetchInterval: viewMode === "live" ? 30_000 : 60_000,
    retry: 2,
  });

  const isLoading = fixturesQuery.isLoading;
  const hasError  = fixturesQuery.isError;

  // ── Filter the returned fixtures to the exact selected date ───────────────
  // Live view skips the date filter entirely — all LIVE matches are shown.
  const upcomingFixtures = useMemo<Fixture[]>(() => {
    const all = fixturesQuery.data?.fixtures ?? [];
    if (viewMode === "live") return all;
    // For "today" and future dates we also keep the default "next 7
    // days" behaviour when the user hasn't touched the picker, so the
    // page isn't empty.
    if (selectedDate === today) {
      return all;
    }
    return all.filter((f) => {
      if (!f.scheduled_at) return false;
      // Compare YYYY-MM-DD in local time.
      const d = new Date(f.scheduled_at);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}` === selectedDate;
    });
  }, [fixturesQuery.data, selectedDate, today, viewMode]);

  // ── Derived leagues list for filter tabs ─────────────────────────────────
  const availableLeagues = useMemo(() => {
    const s = new Set<string>();
    upcomingFixtures.forEach((f) => s.add(f.league_name));
    return Array.from(s).sort();
  }, [upcomingFixtures]);

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let items = [...upcomingFixtures];

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
  }, [upcomingFixtures, leagueFilter, confidenceFilter, sortKey]);

  // v6.2: group filtered fixtures by league for accordion rendering
  const groupedByLeague = useMemo(
    () => groupFixturesByLeague(filtered),
    [filtered]
  );

  // ── Auto-refresh indicator ────────────────────────────────────────────────
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setLastRefresh(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <PaywallOverlay feature="all_predictions" requiredTier="silver">
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 glow-blue-sm">
            <Sparkles className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight gradient-text leading-tight">
              {t("pred.title")}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {t("pred.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Model badge */}
          <div className="flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-semibold text-blue-300">{t("pred.modelEnsemble")}</span>
          </div>
          {/* Last refresh */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
            <RefreshCw className="h-3 w-3" />
            <span>
              {t("pred.autoRefresh")}{" "}
              {lastRefresh.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      </div>

      {/* ── v6 C1: headline counters ── */}
      {metricsQuery.data && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="glass-card px-4 py-3 sm:px-5 sm:py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {t("pred.predicted")}
            </p>
            <p className="mt-1 text-xl font-extrabold tabular-nums text-slate-100 sm:text-2xl">
              {metricsQuery.data.total_forecasts.toLocaleString("nl-NL")}
            </p>
          </div>
          <div className="glass-card px-4 py-3 sm:px-5 sm:py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {t("pred.upcoming")}
            </p>
            <p className="mt-1 text-xl font-extrabold tabular-nums text-blue-400 sm:text-2xl">
              {metricsQuery.data.pending_count.toLocaleString("nl-NL")}
            </p>
          </div>
          <div className="glass-card px-4 py-3 sm:px-5 sm:py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {t("pred.correctSoFar")}
            </p>
            <p className="mt-1 text-xl font-extrabold tabular-nums text-emerald-400 sm:text-2xl">
              {metricsQuery.data.correct_predictions.toLocaleString("nl-NL")}
            </p>
          </div>
        </div>
      )}

      {/* ── v6.2: View Mode Tabs ── */}
      <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        {(
          [
            { key: "upcoming" as const, label: t("pred.upcoming"), icon: CalendarDays },
            { key: "live" as const, label: t("live.statusLive"), icon: Radio },
            { key: "results" as const, label: t("results.title"), icon: Trophy },
          ]
        ).map(({ key, label, icon: Icon }) => {
          const active = viewMode === key;
          const isLiveTab = key === "live";
          return (
            <button
              key={key}
              type="button"
              onClick={() => setViewMode(key)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                active
                  ? isLiveTab
                    ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                    : "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              aria-pressed={active}
            >
              <Icon className={`h-4 w-4 ${isLiveTab && active ? "animate-pulse" : ""}`} />
              <span>{label}</span>
              {isLiveTab &&
                viewMode === "live" &&
                upcomingFixtures.length > 0 && (
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] tabular-nums">
                    {upcomingFixtures.length}
                  </span>
                )}
            </button>
          );
        })}
      </div>

      {/* ── v6 B3: date picker (hidden in Live Now) ── */}
      {viewMode !== "live" && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <label htmlFor="predictions-date" className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Datum
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
              ← Vorige dag
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(today)}
              className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-300 hover:bg-blue-500/20"
            >
              Vandaag
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDaysIso(d, 1))}
              disabled={selectedDate >= maxDate}
              className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Volgende dag →
            </button>
          </div>
          {isHistorical && (
            <span className="ml-auto rounded-full border border-slate-500/25 bg-slate-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Historisch
            </span>
          )}
        </div>
      )}

      {/* ── Stats bar ── */}
      {!isLoading && <StatsBar fixtures={upcomingFixtures} />}
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
        sortKey={sortKey}
        setSortKey={setSortKey}
        total={filtered.length}
        availableLeagues={availableLeagues}
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
          <p className="text-sm text-slate-600">
            {t("pred.noUpcomingMatchesDesc")}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Sparkles className="h-8 w-8 text-slate-600" />
          <p className="text-base font-medium text-slate-400">{t("pred.noMatchingPredictions")}</p>
          <p className="text-sm text-slate-600">
            {t("pred.noMatchingPredictionsDesc")}
          </p>
          <button
            onClick={() => { setLeagueFilter("All"); setConfidenceFilter("All"); }}
            className="btn-gradient mt-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          >
            {t("pred.clearFilters")}
          </button>
        </div>
      ) : (
        // v6.2: grouped-by-league accordion view
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
          headline="Wil je alleen de beste pick? → Pick van de Dag"
          subtext="66.7% trefzekerheid op 346 picks. Onze AI kiest dagelijks de wedstrijd met de hoogste zekerheid."
          variant="card"
        />
      )}

    </div>
    </PaywallOverlay>
  );
}
