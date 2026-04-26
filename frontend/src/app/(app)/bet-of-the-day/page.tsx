"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useTranslations } from "@/i18n/locale-provider";
import { PaywallOverlay } from "@/components/ui/paywall-overlay";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { PickTierBadge } from "@/components/noct/pick-tier-badge";
import { PickReasoningBlock } from "@/components/predictions/PickReasoningBlock";
import type { PickTierSlug, PredictionDriver } from "@/types/api";
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
  CheckCircle2,
  XCircle,
  Clock as ClockIcon,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { SegmentPerformance, CalibrationReport } from "@/types/api";

// ─── BOTD Picks Section (Modelvalidatie + Live meting) ──────────────────────

interface BotdSectionPick {
  date: string;
  home_team: string;
  away_team: string;
  league: string;
  prediction: string;
  confidence: number;
  correct: boolean | null;
  home_score: number | null;
  away_score: number | null;
  odds_used: number | null;
}

interface BotdSectionResponse {
  summary: {
    total_picks: number;
    evaluated: number;
    correct: number;
    accuracy_pct: number;
    avg_confidence: number;
    current_streak: number;
    best_streak: number;
  };
  picks: BotdSectionPick[];
}

function BotdPicksSection({
  endpoint,
  title,
  description,
  accentColor,
  emptyCopy,
  lowSampleThreshold,
  lowSampleCopy,
}: {
  endpoint: "model-validation" | "live-tracking";
  title: string;
  description: string;
  accentColor: string;
  emptyCopy: string;
  lowSampleThreshold?: number;
  lowSampleCopy?: string;
}) {
  const { t } = useTranslations();
  const { data, isLoading } = useQuery<BotdSectionResponse>({
    queryKey: [`botd-${endpoint}`],
    queryFn: async () => {
      const API =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("betsplug_token")
          : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const resp = await fetch(`${API}/bet-of-the-day/${endpoint}?limit=30`, {
        headers,
      });
      if (!resp.ok)
        return { summary: { total_picks: 0, evaluated: 0, correct: 0, accuracy_pct: 0, avg_confidence: 0, current_streak: 0, best_streak: 0 }, picks: [] };
      return resp.json();
    },
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="glass-card p-5 sm:p-6">
        <div className="h-5 w-48 animate-pulse rounded bg-white/[0.06]" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-white/[0.04]"
            />
          ))}
        </div>
      </div>
    );
  }

  const s = data?.summary ?? null;
  const picks = data?.picks ?? [];
  const hasEvaluations = s && s.evaluated > 0;
  const lowSample =
    lowSampleThreshold != null && s != null && s.total_picks < lowSampleThreshold;

  const accColor = !hasEvaluations
    ? "text-slate-500"
    : s!.accuracy_pct >= 55
      ? "text-emerald-400"
      : s!.accuracy_pct >= 45
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="glass-card p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Target className={`h-5 w-5 ${accentColor}`} />
        <h3 className="text-sm font-bold text-slate-100">{title}</h3>
      </div>
      <p className="text-xs leading-relaxed text-slate-400">{description}</p>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
          <p className="mb-1 text-[9px] uppercase tracking-widest text-slate-500">
            {t("botd.accuracy")}
          </p>
          <p className={`text-2xl font-extrabold tabular-nums ${accColor}`}>
            {hasEvaluations ? `${s!.accuracy_pct}%` : "—"}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">
            {hasEvaluations
              ? `${s!.correct} / ${s!.evaluated} ${t("botd.correctSuffix")}`
              : t("botd.waitingResults")}
          </p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
          <p className="mb-1 text-[9px] uppercase tracking-widest text-slate-500">
            {t("botd.picks")}
          </p>
          <p className="text-2xl font-extrabold tabular-nums text-blue-400">
            {s?.total_picks ?? 0}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">
            {s?.evaluated ?? 0} {t("botd.evaluated")}
          </p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
          <p className="mb-1 text-[9px] uppercase tracking-widest text-slate-500">
            {t("botd.streak")}
          </p>
          <p className="text-2xl font-extrabold tabular-nums text-slate-100">
            {s?.current_streak ?? 0}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">
            {t("botd.bestPrefix")} {s?.best_streak ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
          <p className="mb-1 text-[9px] uppercase tracking-widest text-slate-500">
            {t("botd.avgConf")}
          </p>
          <p className="text-2xl font-extrabold tabular-nums text-slate-100">
            {s?.avg_confidence ?? 0}%
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">
            {t("botd.modelScore")}
          </p>
        </div>
      </div>

      {lowSample && lowSampleCopy && (
        <p className="rounded-md border border-amber-500/25 bg-amber-500/[0.05] px-3 py-2 text-[11px] text-amber-300">
          {lowSampleCopy}
        </p>
      )}

      {/* Table */}
      {picks.length === 0 ? (
        <p className="rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-6 text-center text-xs text-slate-500">
          {emptyCopy}
        </p>
      ) : (
        <div className="space-y-1">
          <div className="grid grid-cols-12 gap-2 border-b border-white/[0.05] px-3 py-2 text-[10px] uppercase tracking-widest text-slate-600">
            <span className="col-span-2">{t("botd.dateColumn")}</span>
            <span className="col-span-4">{t("botd.matchColumn")}</span>
            <span className="col-span-2 text-center">{t("botd.pickColumn")}</span>
            <span className="col-span-2 text-center">{t("botd.scoreColumn")}</span>
            <span className="col-span-2 text-center">{t("botd.resultColumn")}</span>
          </div>
          {picks.map((p, i) => (
            <div
              key={i}
              className="grid grid-cols-12 items-center gap-2 rounded-md px-3 py-2.5 text-xs transition-colors hover:bg-white/[0.02]"
              style={{
                borderLeft: `3px solid ${p.correct === true ? "#10b981" : p.correct === false ? "#ef4444" : "#64748b"}`,
              }}
            >
              <span className="col-span-2 tabular-nums text-slate-500">
                {new Date(p.date).toLocaleDateString("nl-NL", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
              <span className="col-span-4 truncate font-medium text-slate-200">
                {p.home_team} vs {p.away_team}
              </span>
              <span className="col-span-2 text-center">
                <span className="inline-flex items-center rounded-md border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-300">
                  {p.prediction} {p.confidence}%
                </span>
              </span>
              <span className="col-span-2 text-center font-medium tabular-nums text-slate-300">
                {p.home_score != null
                  ? `${p.home_score} - ${p.away_score}`
                  : "—"}
              </span>
              <span className="col-span-2 text-center">
                {p.correct === true ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {t("botd.correctLabel")}
                  </span>
                ) : p.correct === false ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-400">
                    <XCircle className="h-3.5 w-3.5" /> {t("botd.incorrectLabel")}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">{t("botd.pendingLabel")}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── BOTD Performance Insights (backtest statistics) ────────────────────────

function BOTDPerformanceInsights() {
  const { t } = useTranslations();

  // PotD is always a Gold-tier pick, so every KPI in this block must be
  // scoped to Gold. Without the filter we returned the unscoped aggregate
  // (Free+Silver+Gold+Platinum mixed), producing a misleading ~48% total
  // accuracy directly beneath a "Gold · 70%+" claim.
  const tierParams = { pick_tier: "gold" };

  const { data: leagueSegments } = useQuery({
    queryKey: ["trackrecord-segments-league-botd", "gold"],
    queryFn: () => api.getTrackrecordSegments("league", tierParams),
    staleTime: 10 * 60_000,
  });

  const { data: calibration } = useQuery({
    queryKey: ["trackrecord-calibration-botd", "gold"],
    queryFn: () => api.getCalibration(tierParams),
    staleTime: 10 * 60_000,
  });

  const { data: summary } = useQuery({
    queryKey: ["trackrecord-summary-botd", "gold"],
    queryFn: () => api.getTrackrecordSummary(tierParams),
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
  // v8.1 — pick-tier classification (null when flag is off)
  pick_tier?: PickTierSlug | null;
  pick_tier_label?: string | null;
  pick_tier_accuracy?: string | null;
  // v8.2 — top-3 drivers for the "Why this pick?" block
  top_drivers?: PredictionDriver[] | null;
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
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8 animate-fade-in">
      <div className="relative space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <HexBadge variant="green" size="lg">
            <Trophy className="h-6 w-6" />
          </HexBadge>
          <div>
            <span className="section-label">Pick of the Day</span>
            <h1 className="text-heading mt-3">
              <span className="gradient-text-green">{t("botd.title")}</span>
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {isFutureDate ? t("botd.subtitleFuture") : t("botd.subtitle")}
            </p>
          </div>
        </div>

        {/* v8.1: show pick-tier badge when available, falling back to the
            generic "Premium Feature" pill when the flag is off. The badge
            communicates the actual quality tier of today's pick, which is
            stronger marketing than a static "Premium" label. */}
        {botd?.pick_tier ? (
          <PickTierBadge
            tier={botd.pick_tier}
            label={botd.pick_tier_label?.replace(/^[^\w]+\s*/, "") ?? undefined}
            accuracy={botd.pick_tier_accuracy ?? undefined}
            size="lg"
          />
        ) : (
          <Pill tone="purple" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            {t("botd.premiumFeature")}
          </Pill>
        )}
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
          <div className="card-neon card-neon-green halo-green">
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

              {/* v8.2 — inline "Why this pick?" (Gold+ unlock) */}
              {botd.top_drivers && botd.top_drivers.length > 0 && (
                <div className="mt-4 mx-auto max-w-lg">
                  <PickReasoningBlock
                    drivers={botd.top_drivers}
                    variant="wide"
                    defaultOpen
                  />
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

          {/* ── Live meting explainer — clarifies waarom mensen leeg
              kunnen zien terwijl er WEL een BotD van vandaag boven
              staat en terwijl er picks in het @BetsPluggs Telegram
              kanaal staan. User had dit misverstand; één infokaart
              lost 't op. */}
          <div
            className="rounded-2xl border p-4 text-sm sm:p-5"
            style={{
              borderColor: "hsl(var(--accent-blue) / 0.22)",
              background:
                "linear-gradient(135deg, hsl(var(--accent-blue) / 0.08) 0%, hsl(230 22% 9% / 0.6) 100%)",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-100">
                  {t("botd.liveMeasurementTitle")}
                </p>
                <ul className="mt-2 space-y-1 text-xs leading-relaxed text-[#cbd3e0]">
                  <li>
                    <span className="text-emerald-300">{t("botd.includedPrefix")}</span>{" "}
                    {t("botd.includedBody")}
                  </li>
                  <li>
                    <span className="text-amber-300">{t("botd.notYetPrefix")}</span>{" "}
                    {t("botd.notYetBody")}
                  </li>
                  <li>
                    <span className="text-slate-400">{t("botd.notHerePrefix")}</span>{" "}
                    {t("botd.notHereBody")}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── Live meting — strict pre-match picks vanaf 18 april 2026 ──
              The model-validation (verzamelde data) surface now lives on
              /trackrecord so all historical track records are in one place.
              This page is the canonical home of the live BOTD stream. */}
          <BotdPicksSection
            endpoint="live-tracking"
            title={t("botd.liveSectionTitle")}
            description={t("botd.liveSectionDesc")}
            accentColor="text-emerald-400"
            emptyCopy={t("botd.liveSectionEmpty")}
            lowSampleThreshold={10}
            lowSampleCopy={t("botd.liveSectionLowSample")}
          />

          <div className="glass-card p-4 text-sm text-slate-400">
            <p>
              {t("botd.historicalLinkLead")}{" "}
              <Link href="/trackrecord" className="text-emerald-400 hover:underline">
                {t("botd.historicalLinkCta")}
              </Link>
            </p>
          </div>

          {/* ── Simulation CTA — full calculator lives on /results?stream=botd ── */}
          <Link
            href="/results?stream=botd&period=30"
            className="group glass-card flex items-center justify-between gap-4 p-5 sm:p-6 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <BarChart3 className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  {t("botd.simulationCtaTitle")}
                </h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-2xl">
                  {t("botd.simulationCtaDesc")}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0" />
          </Link>
        </>
      )}
      </div>
    </div>
    </PaywallOverlay>
  );
}
