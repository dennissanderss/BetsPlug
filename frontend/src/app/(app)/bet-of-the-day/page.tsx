"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useTranslations } from "@/i18n/locale-provider";
import { PaywallOverlay } from "@/components/ui/paywall-overlay";
import {
  Trophy,
  Zap,
  TrendingUp,
  Clock,
  Shield,
  Star,
  AlertTriangle,
  Target,
  Flame,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

// ─── BOTD Track Record Card (v6.3) ──────────────────────────────────────────

function BOTDTrackRecordCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["botd-track-record"],
    queryFn: async () => {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const token = typeof window !== "undefined" ? localStorage.getItem("betsplug_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const resp = await fetch(`${API}/bet-of-the-day/track-record`, { headers });
      if (!resp.ok) return null;
      return resp.json();
    },
    staleTime: 5 * 60_000,
  });

  if (isLoading || !data || data.total_picks === 0) return null;

  const accColor =
    data.accuracy_pct >= 55
      ? "text-emerald-400"
      : data.accuracy_pct >= 45
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-blue-400" />
        <h3 className="text-sm font-bold text-slate-100">Pick of the Day — Track Record</h3>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Accuracy */}
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
          <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Accuracy</p>
          <p className={`text-2xl font-extrabold tabular-nums ${accColor}`}>
            {data.accuracy_pct}%
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {data.correct} / {data.evaluated} correct
          </p>
        </div>

        {/* Total Picks */}
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
          <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Total Picks</p>
          <p className="text-2xl font-extrabold tabular-nums text-blue-400">
            {data.total_picks}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {data.evaluated} evaluated
          </p>
        </div>

        {/* Current Streak — visually prominent */}
        {data.current_streak > 0 ? (
          <div className="rounded-lg border border-emerald-500/30 p-3 text-center relative overflow-hidden"
            style={{
              background: "radial-gradient(ellipse at center, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.03) 70%, transparent 100%)",
              boxShadow: "0 0 24px rgba(16,185,129,0.15), inset 0 0 24px rgba(16,185,129,0.05)",
            }}
          >
            <p className="text-[9px] uppercase tracking-widest text-emerald-400/80 mb-1">Streak</p>
            <p className="text-3xl font-extrabold tabular-nums text-emerald-300">
              <Flame className="inline h-7 w-7 mr-1 -mt-1 text-orange-400 drop-shadow-[0_0_6px_rgba(251,146,60,0.5)]" />
              {data.current_streak}
            </p>
            <p className="text-[10px] text-emerald-400/70 mt-0.5 font-semibold">
              consecutive wins
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
            <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Streak</p>
            <p className="text-2xl font-extrabold tabular-nums text-slate-600">
              —
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5">
              building...
            </p>
          </div>
        )}

        {/* Avg Confidence */}
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
          <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Avg Confidence</p>
          <p className="text-2xl font-extrabold tabular-nums text-slate-100">
            {data.avg_confidence}%
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            best streak: {data.best_streak}
          </p>
        </div>
      </div>
    </div>
  );
}

import { CheckCircle2, XCircle, Clock as ClockIcon, BarChart3, ArrowRight } from "lucide-react";
import type { SegmentPerformance, CalibrationReport } from "@/types/api";

// ─── BOTD Performance Insights (backtest statistics) ────────────────────────

function BOTDPerformanceInsights() {
  const { t } = useTranslations();

  const { data: leagueSegments } = useQuery({
    queryKey: ["trackrecord-segments-league-botd"],
    queryFn: () => api.getTrackrecordSegments("league"),
    staleTime: 10 * 60_000,
  });

  const { data: calibration } = useQuery({
    queryKey: ["trackrecord-calibration-botd"],
    queryFn: () => api.getCalibration(),
    staleTime: 10 * 60_000,
  });

  const { data: summary } = useQuery({
    queryKey: ["trackrecord-summary-botd"],
    queryFn: () => api.getTrackrecordSummary(),
    staleTime: 10 * 60_000,
  });

  const topLeagues = (leagueSegments ?? [])
    .filter((s: SegmentPerformance) => s.total >= 10)
    .sort((a: SegmentPerformance, b: SegmentPerformance) => b.accuracy - a.accuracy)
    .slice(0, 8);

  const calBuckets = (calibration as CalibrationReport)?.buckets ?? [];

  if (!summary && topLeagues.length === 0) return null;

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-100">{t("botd.performanceInsights")}</h3>
        </div>
        <Link
          href="/trackrecord"
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
        >
          {t("botd.fullTrackRecord")}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overall Model Quality */}
        {summary && (
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">
              {t("botd.modelQuality")}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                <p className="text-[9px] uppercase tracking-wider text-slate-500">{t("botd.brierScore")}</p>
                <p className="text-lg font-bold tabular-nums text-slate-100">
                  {summary.brier_score?.toFixed(3) ?? "—"}
                </p>
                <p className="text-[9px] text-slate-600">{t("botd.brierScoreDesc")}</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                <p className="text-[9px] uppercase tracking-wider text-slate-500">{t("botd.calibrationError")}</p>
                <p className="text-lg font-bold tabular-nums text-slate-100">
                  {summary.calibration_error?.toFixed(3) ?? "—"}
                </p>
                <p className="text-[9px] text-slate-600">{t("botd.calibrationErrorDesc")}</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                <p className="text-[9px] uppercase tracking-wider text-slate-500">{t("botd.totalPredictions")}</p>
                <p className="text-lg font-bold tabular-nums text-emerald-400">
                  {summary.total_predictions?.toLocaleString() ?? "—"}
                </p>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                <p className="text-[9px] uppercase tracking-wider text-slate-500">{t("botd.overallAccuracy")}</p>
                <p className="text-lg font-bold tabular-nums text-emerald-400">
                  {summary.accuracy != null ? `${Math.round(summary.accuracy * 100)}%` : "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Confidence Calibration */}
        {calBuckets.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">
              {t("botd.confidenceCalibration")}
            </h4>
            <p className="text-[10px] text-slate-600 mb-2">{t("botd.confidenceCalibrationDesc")}</p>
            <div className="space-y-1.5">
              {calBuckets.filter((b) => b.count > 0).map((bucket) => {
                const predicted = Math.round(bucket.predicted_avg * 100);
                const observed = Math.round(bucket.observed_freq * 100);
                const gap = Math.abs(predicted - observed);
                const isGood = gap <= 5;
                return (
                  <div key={bucket.bucket_index} className="flex items-center gap-2 text-xs">
                    <span className="w-20 text-slate-500 tabular-nums">
                      {Math.round(bucket.lower_bound * 100)}-{Math.round(bucket.upper_bound * 100)}%
                    </span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${observed}%`,
                            background: isGood ? "#10b981" : "#f59e0b",
                          }}
                        />
                      </div>
                      <span className="w-10 text-right tabular-nums text-slate-400">{observed}%</span>
                    </div>
                    <span className="w-12 text-right tabular-nums text-slate-600">
                      n={bucket.count}
                    </span>
                  </div>
                );
              })}
            </div>
            {(calibration as CalibrationReport)?.overall_ece != null && (
              <p className="mt-2 text-[10px] text-slate-600">
                ECE: {((calibration as CalibrationReport).overall_ece * 100).toFixed(1)}%
              </p>
            )}
          </div>
        )}
      </div>

      {/* Accuracy by League */}
      {topLeagues.length > 0 && (
        <div className="mt-6">
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">
            {t("botd.accuracyByLeague")}
          </h4>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {topLeagues.map((seg: SegmentPerformance) => {
              const accPct = Math.round(seg.accuracy * 100);
              const accColor = accPct >= 55 ? "#10b981" : accPct >= 45 ? "#f59e0b" : "#ef4444";
              return (
                <div
                  key={seg.segment_value}
                  className="flex items-center gap-2 rounded-lg bg-white/[0.02] px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-slate-300 truncate block">
                      {seg.segment_value}
                    </span>
                  </div>
                  <span className="text-[10px] tabular-nums text-slate-500">{seg.total} picks</span>
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                    style={{ background: `${accColor}18`, color: accColor }}
                  >
                    {accPct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BOTD History List ──────────────────────────────────────────────────────

function BOTDHistoryList() {
  const { data: history, isLoading } = useQuery({
    queryKey: ["botd-history"],
    queryFn: async () => {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const token = typeof window !== "undefined" ? localStorage.getItem("betsplug_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const resp = await fetch(`${API}/bet-of-the-day/history?limit=50`, { headers });
      if (!resp.ok) return [];
      return resp.json();
    },
    staleTime: 5 * 60_000,
  });

  if (isLoading || !history || history.length === 0) return null;

  return (
    <div className="glass-card p-5 sm:p-6">
      <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
        <ClockIcon className="h-4 w-4 text-blue-400" />
        Recent Picks
      </h3>
      <div className="space-y-1">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] uppercase tracking-widest text-slate-600 border-b border-white/[0.05]">
          <span className="col-span-2">Date</span>
          <span className="col-span-4">Match</span>
          <span className="col-span-2 text-center">Pick</span>
          <span className="col-span-2 text-center">Score</span>
          <span className="col-span-2 text-center">Result</span>
        </div>
        {/* Rows */}
        {history.map((item: any, idx: number) => (
          <div
            key={idx}
            className="grid grid-cols-12 gap-2 px-3 py-2.5 text-xs items-center hover:bg-white/[0.02] rounded-md transition-colors"
            style={{
              borderLeft: `3px solid ${item.correct === true ? "#10b981" : item.correct === false ? "#ef4444" : "#64748b"}`,
            }}
          >
            <span className="col-span-2 text-slate-500 tabular-nums">
              {new Date(item.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
            </span>
            <span className="col-span-4 text-slate-200 font-medium truncate">
              {item.home_team} vs {item.away_team}
            </span>
            <span className="col-span-2 text-center">
              <span className="inline-flex items-center rounded-md bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300">
                {item.prediction} {item.confidence}%
              </span>
            </span>
            <span className="col-span-2 text-center tabular-nums text-slate-300 font-medium">
              {item.home_score != null ? `${item.home_score} - ${item.away_score}` : "—"}
            </span>
            <span className="col-span-2 text-center">
              {item.correct === true ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                </span>
              ) : item.correct === false ? (
                <span className="inline-flex items-center gap-1 text-red-400 text-[10px] font-semibold">
                  <XCircle className="h-3.5 w-3.5" /> Wrong
                </span>
              ) : (
                <span className="text-slate-500 text-[10px]">Pending</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface BetOfTheDayOddsShape {
  home?: number | null;
  draw?: number | null;
  away?: number | null;
  over_2_5?: number | null;
  under_2_5?: number | null;
  bookmaker?: string | null;
  fetched_at?: string | null;
}

interface BetOfTheDay {
  available: boolean;
  match_id?: string;
  home_team?: string;
  away_team?: string;
  home_team_logo?: string | null;
  away_team_logo?: string | null;
  league?: string;
  scheduled_at?: string;
  home_win_prob?: number;
  draw_prob?: number;
  away_win_prob?: number;
  confidence?: number;
  predicted_outcome?: string;
  explanation_summary?: string;
  prediction_id?: string;
  // v6.2 — optional pre-match odds (null when no odds row on file)
  odds?: BetOfTheDayOddsShape | null;
}

// ─── Large Probability Display ──────────────────────────────────────────────

function ProbCircle({
  label,
  prob,
  isHighest,
  color,
}: {
  label: string;
  prob: number;
  isHighest: boolean;
  color: string;
}) {
  const { t } = useTranslations();
  const pct = Math.round(prob * 100);
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative flex h-24 w-24 items-center justify-center rounded-full border-4 transition-all ${
          isHighest ? "scale-110" : "opacity-50"
        }`}
        style={{
          borderColor: isHighest ? color : "rgba(255,255,255,0.1)",
          boxShadow: isHighest ? `0 0 30px ${color}40` : "none",
        }}
      >
        <span
          className="text-3xl font-extrabold"
          style={{ color: isHighest ? color : "#475569" }}
        >
          {pct}%
        </span>
      </div>
      <span
        className={`text-sm font-semibold ${isHighest ? "text-white" : "text-slate-500"}`}
      >
        {label}
      </span>
      {isHighest && (
        <span
          className="flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase"
          style={{ background: `${color}20`, color }}
        >
          <Star className="h-3 w-3" /> {t("botd.predicted")}
        </span>
      )}
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function BotdSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="h-12 w-64 animate-pulse rounded-lg bg-white/[0.06]" />
      <div className="glass-card p-12">
        <div className="flex flex-col items-center gap-6">
          <div className="h-24 w-24 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="h-8 w-80 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-4 w-48 animate-pulse rounded bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

/** Try today, then the next 3 days, returning the first day with a pick. */
async function fetchBotdWithFallback(): Promise<BetOfTheDay & { target_date?: string }> {
  const dates: string[] = [];
  for (let i = 0; i < 4; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
  }

  for (const date of dates) {
    const result = await api.getBetOfTheDay(date);
    if (result.available && result.home_team) {
      return { ...result, target_date: date };
    }
  }

  // Nothing found for any of the 4 days — return the last response
  return api.getBetOfTheDay();
}

export default function BetOfTheDayPage() {
  const { t } = useTranslations();
  const { data, isLoading, isError } = useQuery<BetOfTheDay & { target_date?: string }>({
    queryKey: ["bet-of-the-day"],
    queryFn: fetchBotdWithFallback,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });

  if (isLoading) return <BotdSkeleton />;

  if (isError) {
    return (
      <div className="glass-card flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <h2 className="text-xl font-bold text-slate-300">{t("botd.failedToLoad")}</h2>
        <p className="max-w-md text-sm text-slate-500">
          {t("botd.failedToLoadDesc")}
        </p>
      </div>
    );
  }

  const botd = data;
  const hasData = botd?.available && botd.home_team;

  // Determine if the pick is for a future date (not today)
  const today = new Date().toISOString().slice(0, 10);
  const pickDate = botd?.target_date;
  const isFutureDate = pickDate && pickDate !== today;

  const homeProb = botd?.home_win_prob ?? 0;
  const drawProb = botd?.draw_prob ?? 0;
  const awayProb = botd?.away_win_prob ?? 0;
  const confidence = botd?.confidence ?? 0;

  const formatDateTime = (iso?: string) => {
    if (!iso) return "--:--";
    try {
      const d = new Date(iso);
      const dateStr = d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });
      const timeStr = d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${dateStr}, ${timeStr}`;
    } catch {
      return "--:--";
    }
  };

  return (
    <PaywallOverlay feature="pick_of_the_day" requiredTier="gold">
    <div className="space-y-8 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 shadow-lg shadow-amber-500/10">
            <Trophy className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight gradient-text">
              {t("botd.title")}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {isFutureDate ? t("botd.subtitleFuture") : t("botd.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-300">{t("botd.premiumFeature")}</span>
        </div>
      </div>

      {/* ── Main Card ── */}
      {!hasData ? (
        <div className="glass-card flex flex-col items-center justify-center gap-4 py-20 text-center">
          <Trophy className="h-12 w-12 text-slate-600" />
          <h2 className="text-xl font-bold text-slate-300">
            {t("botd.noPickAvailable")}
          </h2>
          <p className="max-w-md text-sm text-slate-500">
            {t("botd.noPickAvailableDesc")}
          </p>
        </div>
      ) : (
        <>
          {/* Future-date banner */}
          {isFutureDate && (
            <div className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] px-4 py-3">
              <Clock className="h-4 w-4 text-blue-400 shrink-0" />
              <p className="text-sm text-blue-300">
                {t("botd.futureDateBanner")}{" "}
                <span className="font-semibold text-blue-200">
                  {new Date(pickDate + "T12:00:00").toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </p>
            </div>
          )}

          {/* The Pick */}
          <div className="glass-card relative overflow-hidden">
            {/* Background glow */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] via-transparent to-blue-500/[0.04]" />

            <div className="relative p-8 sm:p-12">
              {/* League + Time */}
              <div className="mb-6 flex items-center justify-center gap-4">
                {botd.league && (
                  <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    {botd.league.replace(/-/g, " ")}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock className="h-4 w-4" />
                  {formatDateTime(botd.scheduled_at)}
                </span>
              </div>

              {/* Match Title */}
              <h2 className="mb-8 flex flex-wrap items-center justify-center gap-3 text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-2xl md:text-3xl">
                {botd.home_team_logo && (
                  <Image src={botd.home_team_logo} alt="" width={36} height={36} className="rounded-full" />
                )}
                {botd.home_team}
                <span className="text-slate-500 font-normal">vs</span>
                {botd.away_team_logo && (
                  <Image src={botd.away_team_logo} alt="" width={36} height={36} className="rounded-full" />
                )}
                {botd.away_team}
              </h2>

              {/* Probability Circles */}
              <div className="mb-8 flex items-center justify-center gap-8 sm:gap-16">
                <ProbCircle
                  label={botd.home_team ?? "Home"}
                  prob={homeProb}
                  isHighest={homeProb >= drawProb && homeProb >= awayProb}
                  color="#3b82f6"
                />
                <ProbCircle
                  label={t("botd.draw")}
                  prob={drawProb}
                  isHighest={drawProb > homeProb && drawProb >= awayProb}
                  color="#f59e0b"
                />
                <ProbCircle
                  label={botd.away_team ?? "Away"}
                  prob={awayProb}
                  isHighest={awayProb > homeProb && awayProb > drawProb}
                  color="#ef4444"
                />
              </div>

              {/* Confidence meter */}
              <div className="mx-auto max-w-sm">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">{t("botd.modelConfidence")}</span>
                  <span
                    className={`text-lg font-extrabold ${
                      confidence >= 0.8
                        ? "text-emerald-400"
                        : confidence >= 0.65
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {Math.round(confidence * 100)}%
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${confidence * 100}%`,
                      background:
                        confidence >= 0.8
                          ? "#10b981"
                          : confidence >= 0.65
                          ? "#f59e0b"
                          : "#ef4444",
                      boxShadow:
                        confidence >= 0.8
                          ? "0 0 12px rgba(16,185,129,0.5)"
                          : confidence >= 0.65
                          ? "0 0 12px rgba(245,158,11,0.5)"
                          : "0 0 12px rgba(239,68,68,0.5)",
                    }}
                  />
                </div>
              </div>

              {/* Predicted outcome badge */}
              <div className="mt-8 flex justify-center">
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-6 py-3">
                  <p className="text-center text-xs font-semibold uppercase tracking-widest text-emerald-400">
                    {t("botd.predictedOutcome")}
                  </p>
                  <p className="mt-1 text-center text-xl font-extrabold text-emerald-300">
                    {botd.predicted_outcome ?? " - "}
                  </p>
                </div>
              </div>

              {/* Explanation / reasoning */}
              {botd.explanation_summary && (
                <div className="mt-8 mx-auto max-w-lg rounded-xl bg-white/[0.04] border border-white/[0.06] px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2">
                    {t("botd.modelReasoning")}
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {botd.explanation_summary}
                  </p>
                </div>
              )}

              {/* v6.2: Pre-match odds (only when backend supplied them) */}
              {botd.odds && (
                botd.odds.home != null ||
                botd.odds.draw != null ||
                botd.odds.away != null ||
                botd.odds.over_2_5 != null ||
                botd.odds.under_2_5 != null
              ) ? (
                <div className="mt-6 mx-auto max-w-lg rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                      Pre-match odds
                    </p>
                    {botd.odds.bookmaker && (
                      <span className="text-[9px] text-slate-700 uppercase tracking-wider">
                        {botd.odds.bookmaker}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {botd.odds.home != null && (
                      <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-center min-w-[56px]">
                        <p className="text-[9px] text-slate-500 uppercase">1</p>
                        <p className="text-sm font-bold tabular-nums text-slate-100">
                          {botd.odds.home.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {botd.odds.draw != null && (
                      <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-center min-w-[56px]">
                        <p className="text-[9px] text-slate-500 uppercase">X</p>
                        <p className="text-sm font-bold tabular-nums text-slate-100">
                          {botd.odds.draw.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {botd.odds.away != null && (
                      <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-center min-w-[56px]">
                        <p className="text-[9px] text-slate-500 uppercase">2</p>
                        <p className="text-sm font-bold tabular-nums text-slate-100">
                          {botd.odds.away.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {(botd.odds.over_2_5 != null || botd.odds.under_2_5 != null) && (
                      <span className="text-slate-700 mx-1">|</span>
                    )}
                    {botd.odds.over_2_5 != null && (
                      <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-center min-w-[56px]">
                        <p className="text-[9px] text-slate-500 uppercase">O 2.5</p>
                        <p className="text-sm font-bold tabular-nums text-slate-100">
                          {botd.odds.over_2_5.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {botd.odds.under_2_5 != null && (
                      <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-center min-w-[56px]">
                        <p className="text-[9px] text-slate-500 uppercase">U 2.5</p>
                        <p className="text-sm font-bold tabular-nums text-slate-100">
                          {botd.odds.under_2_5.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* ── BOTD Track Record (v6.3) ── */}
          <BOTDTrackRecordCard />

          {/* ── BOTD History List ── */}
          <BOTDHistoryList />

          {/* ── Performance Insights (backtest stats) ── */}
          <BOTDPerformanceInsights />

          {/* ── Info Cards ── */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass-card p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-sm font-bold text-white">{t("botd.valueDetection")}</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                {t("botd.valueDetectionDesc")}
              </p>
            </div>

            <div className="glass-card p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Shield className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-white">{t("botd.modelsAgree")}</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                {t("botd.modelsAgreeDesc")}
              </p>
            </div>

            <div className="glass-card p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Star className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="text-sm font-bold text-white">{t("botd.dailySelection")}</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                {t("botd.dailySelectionDesc")}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
    </PaywallOverlay>
  );
}
