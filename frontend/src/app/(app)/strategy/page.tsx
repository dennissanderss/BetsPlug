"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useTranslations } from "@/i18n/locale-provider";
import {
  FlaskConical,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Info,
  BarChart3,
  TrendingUp,
  Target,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { PaywallOverlay } from "@/components/ui/paywall-overlay";
import { RelatedLinks } from "@/components/ui/related-links";
import { Trophy, Sparkles, ClipboardList } from "lucide-react";
import type { TrackrecordSummary, StrategyResponse } from "@/types/api";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

const CARD_VARIANTS = ["card-neon-green", "card-neon-purple", "card-neon-blue"] as const;
const HEX_VARIANTS = ["green", "purple", "blue"] as const;

// ─── Minimum predictions required before a backtest is meaningful ────────────

const BACKTEST_MINIMUM = 100;


// ─── Status helpers ───────────────────────────────────────────────────────────

function getDataStatus(summary: TrackrecordSummary | undefined): {
  count: number;
  label: string;
  ready: boolean;
  pct: number;
} {
  const count = summary?.total_predictions ?? 0;
  const ready = count >= BACKTEST_MINIMUM;
  const pct = Math.min(100, Math.round((count / BACKTEST_MINIMUM) * 100));
  const label = ready
    ? `${count.toLocaleString()} predictions - ready to backtest`
    : `${count.toLocaleString()} / ${BACKTEST_MINIMUM} predictions needed`;
  return { count, label, ready, pct };
}




// ─── Main Page ────────────────────────────────────────────────────────────────

// ─── Strategy Metrics Card (real data from backend) ─────────────────────────

// ─── Human-readable rule translations ───────────────────────────────────────

const RULE_LABELS: Record<string, string> = {
  home_win_prob: "Home win probability",
  away_win_prob: "Away win probability",
  draw_prob: "Draw probability",
  confidence: "Model confidence",
  edge_home: "Home edge vs bookmaker",
  edge_away: "Away edge vs bookmaker",
  edge_pick: "Pick edge vs bookmaker",
  odds_home: "Home odds",
  odds_away: "Away odds",
  odds_pick: "Pick odds",
  form_diff: "Form difference",
};

const OP_LABELS: Record<string, string> = {
  ">": "higher than",
  "<": "lower than",
  ">=": "at least",
  "<=": "at most",
  "==": "exactly",
  "between": "between",
};

function humanizeRule(rule: { feature: string; operator: string; value: unknown }): string {
  const feat = RULE_LABELS[rule.feature] || rule.feature;
  const op = OP_LABELS[rule.operator] || rule.operator;
  if (rule.operator === "between" && Array.isArray(rule.value)) {
    return `${feat} ${rule.value[0]} – ${rule.value[1]}`;
  }
  const val = typeof rule.value === "number" && rule.value < 1 ? `${(rule.value as number * 100).toFixed(0)}%` : String(rule.value);
  return `${feat} ${op} ${val}`;
}

// validation_status enum from backend/API_CONTRACT.md.
// "under_investigation" means the displayed winrate / roi were clamped
// to 0 because raw values cleared the leakage tripwire — frontend MUST
// not render a "Profitable" / "Unprofitable" verdict on those.
type ValidationStatus =
  | "validated"
  | "under_investigation"
  | "rejected"
  | "break_even"
  | "insufficient_data";

interface StrategyMetrics {
  has_data?: boolean;
  sample_size?: number;
  winrate?: number;
  roi?: number;
  raw_winrate?: number;
  raw_roi?: number;
  validation_status?: ValidationStatus;
  validation_notes?: string;
  max_drawdown?: number;
  odds_coverage_pct?: number;
}

// Color based on ROI + validation status. Under-investigation ALWAYS
// renders amber even if the clamped roi is 0 (which would otherwise
// fall through to "break-even").
function getStrategyColor(metrics: StrategyMetrics | undefined) {
  if (!metrics) return { accent: "text-[#60a5fa]" };
  if (metrics.validation_status === "under_investigation") {
    return { accent: "text-amber-400" };
  }
  const roi = metrics.roi;
  if (roi === undefined) return { accent: "text-[#60a5fa]" };
  if (roi > 0.05) return { accent: "text-[#4ade80]" };
  if (roi > -0.02) return { accent: "text-amber-400" };
  return { accent: "text-red-400" };
}

function RealStrategyCard({ strategy, index }: { strategy: StrategyResponse; index: number }) {
  const { t } = useTranslations();
  const { data: metrics, isLoading } = useQuery<StrategyMetrics>({
    queryKey: ["strategy-metrics", strategy.id],
    queryFn: async () => {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/strategies/${strategy.id}/metrics`
      );
      return resp.json();
    },
    staleTime: 60_000,
  });

  // Hide strategies with 0 picks
  if (!isLoading && (!metrics?.has_data || metrics?.sample_size === 0)) {
    return null;
  }

  const c = getStrategyColor(metrics);
  const cardVariant = CARD_VARIANTS[index % CARD_VARIANTS.length];
  const hexVariant = HEX_VARIANTS[index % HEX_VARIANTS.length];
  const isUnderInvestigation = metrics?.validation_status === "under_investigation";

  return (
    <div className={cn("card-neon flex flex-col overflow-hidden animate-fade-in", cardVariant)}>
      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <HexBadge variant={hexVariant} size="sm">
              <FlaskConical className="h-4 w-4" />
            </HexBadge>
            <div className="min-w-0">
              <p className="section-label mb-1">{t("strategy.cardCategory")}</p>
              <h3 className="text-base font-semibold text-white truncate">{strategy.name}</h3>
            </div>
          </div>
          {/* Badge precedence: validation_status (the documented contract)
              wins over the roi-sign heuristic. Without this, strategies
              clamped to roi=0.0 by the leakage tripwire silently fell
              through to "Unprofitable" — wrong story, wrong colour. */}
          {isLoading ? (
            <Pill tone="draw"><Clock className="h-3 w-3" /> {t("strategy.loading")}</Pill>
          ) : isUnderInvestigation ? (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/[0.10] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-200"
              title={metrics?.validation_notes ?? "Under Investigation"}
            >
              <AlertTriangle className="h-3 w-3" />
              Under Investigation
            </span>
          ) : metrics?.validation_status === "validated" ? (
            <Pill tone="win"><TrendingUp className="h-3 w-3" /> {t("strategy.profitable")}</Pill>
          ) : metrics?.validation_status === "break_even" ? (
            <Pill tone="draw">Break-Even</Pill>
          ) : metrics?.validation_status === "rejected" ? (
            <Pill tone="loss"><TrendingUp className="h-3 w-3 rotate-180" /> {t("strategy.unprofitable")}</Pill>
          ) : metrics?.has_data && metrics.roi !== undefined && metrics.roi > 0 ? (
            <Pill tone="win"><TrendingUp className="h-3 w-3" /> {t("strategy.profitable")}</Pill>
          ) : metrics?.has_data ? (
            <Pill tone="loss"><TrendingUp className="h-3 w-3 rotate-180" /> {t("strategy.unprofitable")}</Pill>
          ) : null}
        </div>
        <p className="text-xs leading-relaxed text-slate-400">{strategy.description}</p>
        {isUnderInvestigation && metrics?.validation_notes && (
          <p className="mt-2 text-[11px] leading-relaxed text-amber-300/80">
            {metrics.validation_notes}
          </p>
        )}
      </div>

      {/* Metrics */}
      {metrics?.has_data && (
        <div className="relative px-5 py-4 border-t border-white/[0.06]">
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-panel p-3 space-y-0.5">
              <p className="section-label" title={t("strategy.winRateTooltip")}>{t("strategy.winRate")}</p>
              {isUnderInvestigation ? (
                <p className="text-stat tabular-nums text-amber-400" title="Raw winrate clamped — see Under Investigation note">
                  {((metrics.raw_winrate ?? 0) * 100).toFixed(1)}%<span className="text-[10px] font-normal text-amber-300/60 ml-1">raw</span>
                </p>
              ) : (
                <p className={cn("text-stat tabular-nums", c.accent)}>{((metrics.winrate ?? 0) * 100).toFixed(1)}%</p>
              )}
            </div>
            <div className="glass-panel p-3 space-y-0.5">
              <p className="section-label" title={t("strategy.roiTooltip")}>ROI</p>
              {isUnderInvestigation ? (
                <p className="text-stat tabular-nums text-amber-400" title="Raw ROI clamped — see Under Investigation note">
                  {(metrics.raw_roi ?? 0) >= 0 ? "+" : ""}{((metrics.raw_roi ?? 0) * 100).toFixed(1)}%<span className="text-[10px] font-normal text-amber-300/60 ml-1">raw</span>
                </p>
              ) : (
                <p className={cn("text-stat tabular-nums", (metrics.roi ?? 0) >= 0 ? "text-[#4ade80]" : "text-red-400")}>
                  {(metrics.roi ?? 0) >= 0 ? "+" : ""}{((metrics.roi ?? 0) * 100).toFixed(1)}%
                </p>
              )}
            </div>
            <div className="glass-panel p-3 space-y-0.5">
              <p className="section-label" title={t("strategy.sampleSizeTooltip")}>{t("strategy.sampleSize")}</p>
              <p className="text-stat tabular-nums text-white">{metrics.sample_size}</p>
            </div>
            <div className="glass-panel p-3 space-y-0.5">
              <p className="section-label" title={t("strategy.maxDrawdownTooltip")}>{t("strategy.maxDrawdown")}</p>
              <p className="text-stat tabular-nums text-red-400">{(metrics.max_drawdown ?? 0).toFixed(1)}u</p>
            </div>
          </div>
        </div>
      )}

      {/* Rules */}
      <div className="relative px-5 pb-5 flex-1">
        <p className="section-label mb-2 mt-3">{t("strategy.howItWorksCard")}</p>
        <ul className="space-y-1.5">
          {(strategy.rules as { feature: string; operator: string; value: unknown }[]).map((rule, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
              <CheckCircle2 className={cn("h-3.5 w-3.5 flex-shrink-0 mt-0.5", c.accent)} />
              {humanizeRule(rule)}
            </li>
          ))}
        </ul>
        {metrics?.has_data && (
          <div className="mt-4">
            <PaywallOverlay feature="strategy_lab_full" requiredTier="gold" variant="inline">
              <Link href={`/strategy/${strategy.id}`} className="btn-glass w-full inline-flex items-center justify-center gap-2">
                <BarChart3 className="h-3.5 w-3.5" />
                {t("strategy.viewAllPicks")}
              </Link>
            </PaywallOverlay>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StrategyPage() {
  const { t } = useTranslations();
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["trackrecord-summary"],
    queryFn: () => api.getTrackrecordSummary(),
  });

  const { data: realStrategies } = useQuery({
    queryKey: ["strategies"],
    queryFn: () => api.getStrategies(),
    staleTime: 60_000,
  });

  // Fetch metrics for all strategies to split profitable / archived
  const metricsQueries = useQueries({
    queries: (realStrategies ?? []).map((s) => ({
      queryKey: ["strategy-metrics", s.id],
      queryFn: async () => {
        const resp = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/strategies/${s.id}/metrics`
        );
        return resp.json();
      },
      staleTime: 60_000,
      enabled: !!realStrategies,
    })),
  });

  // Build a map of strategy id -> metrics
  const metricsMap = React.useMemo(() => {
    const map = new Map<string, StrategyMetrics>();
    (realStrategies ?? []).forEach((s, i) => {
      const q = metricsQueries[i];
      if (q?.data) map.set(s.id, q.data);
    });
    return map;
  }, [realStrategies, metricsQueries]);

  // Bucket strategies by validation_status. The previous implementation
  // split on roi sign, which routed every "under_investigation" strategy
  // (clamped roi=0) into Archived. Now they get their own visible
  // section so users see the "raw numbers tripped a leakage gate"
  // story instead of seeing them disappear.
  const profitableStrategies = React.useMemo(
    () => (realStrategies ?? []).filter((s) => {
      const m = metricsMap.get(s.id);
      if (!m?.has_data || (m.sample_size ?? 0) === 0) return false;
      if (m.validation_status === "validated") return true;
      // Backwards-compat: when validation_status is missing (older
      // backend builds), fall back to the old roi-sign rule.
      if (!m.validation_status && (m.roi ?? 0) > 0) return true;
      return false;
    }),
    [realStrategies, metricsMap]
  );

  const investigationStrategies = React.useMemo(
    () => (realStrategies ?? []).filter((s) => {
      const m = metricsMap.get(s.id);
      return (
        m?.has_data &&
        (m.sample_size ?? 0) > 0 &&
        m.validation_status === "under_investigation"
      );
    }),
    [realStrategies, metricsMap]
  );

  const archivedStrategies = React.useMemo(
    () => (realStrategies ?? []).filter((s) => {
      const m = metricsMap.get(s.id);
      if (!m?.has_data || (m.sample_size ?? 0) === 0) return false;
      if (
        m.validation_status === "rejected" ||
        m.validation_status === "break_even"
      ) return true;
      // Backwards-compat fallback for older backend builds.
      if (!m.validation_status && (m.roi ?? 0) <= 0) return true;
      return false;
    }),
    [realStrategies, metricsMap]
  );

  const [showArchived, setShowArchived] = React.useState(false);

  const dataStatus = getDataStatus(summary);

  return (
    <div className="relative mx-auto max-w-7xl px-0 sm:px-2 py-4 sm:py-6 md:py-8 space-y-5 sm:space-y-8 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-[#4ade80]/10 blur-3xl" />
        <div className="absolute top-40 right-1/4 h-72 w-72 rounded-full bg-[#60a5fa]/10 blur-3xl" />
      </div>

      {/* Hero */}
      <div className="animate-fade-in">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="section-label">Strategy Lab</p>
            <div className="flex items-center gap-3">
              <HexBadge variant="green" size="md"><FlaskConical className="h-5 w-5" /></HexBadge>
              <h1 className="text-heading"><span className="gradient-text-green">{t("strategy.title")}</span></h1>
            </div>
            <p className="text-slate-400 text-sm max-w-xl">{t("strategy.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {dataStatus.ready ? (
              <Pill tone="win"><ShieldCheck className="h-3.5 w-3.5" /> {t("strategy.readyToBacktest")}</Pill>
            ) : (
              <Pill tone="draw"><Clock className="h-3.5 w-3.5" /> {t("strategy.awaitingData")}</Pill>
            )}
          </div>
        </div>
      </div>

      {/* How Our System Works */}
      <div className="card-neon">
        <div className="relative p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-5 w-5 text-[#60a5fa]" />
            <h2 className="text-base font-semibold text-white">{t("strategy.howItWorks")}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { v: "blue" as const, n: 1, title: t("strategy.step1Title"), desc: t("strategy.step1Desc") },
              { v: "green" as const, n: 2, title: t("strategy.step2Title"), desc: t("strategy.step2Desc") },
              { v: "purple" as const, n: 3, title: t("strategy.step3Title"), desc: t("strategy.step3Desc") },
            ].map((s) => (
              <div key={s.n} className="glass-panel p-5">
                <div className="flex items-center gap-3 mb-3">
                  <HexBadge variant={s.v} size="sm">
                    <span className="text-sm font-semibold">{s.n}</span>
                  </HexBadge>
                  <p className="text-sm font-semibold text-white">{s.title}</p>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Profitable Strategies ─────────────────────────────────────────── */}
      {profitableStrategies.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-[#4ade80]" />
            <div>
              <h2 className="text-lg font-semibold text-white">{t("strategy.profitableStrategies")}</h2>
              <p className="text-xs text-slate-500">{t("strategy.profitableStrategiesDesc")}</p>
            </div>
            <Pill tone="win" className="ml-auto">{t("strategy.liveData")}</Pill>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {profitableStrategies.map((s, i) => (
              <RealStrategyCard key={s.id} strategy={s} index={i} />
            ))}
          </div>
        </>
      )}

      {/* ── Under Investigation ──────────────────────────────────────────── */}
      {investigationStrategies.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Under Investigation</h2>
              <p className="text-xs text-slate-500">
                Raw numbers tripped a leakage tripwire (winrate &gt; 58% or ROI &gt; 8%). Headline metrics clamped pending review.
              </p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/[0.10] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-200">
              <AlertTriangle className="h-3 w-3" />
              Disputed
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {investigationStrategies.map((s, i) => (
              <RealStrategyCard key={s.id} strategy={s} index={i} />
            ))}
          </div>
        </>
      )}

      {/* ── Archived — Not Profitable ─────────────────────────────────────── */}
      {archivedStrategies.length > 0 && (
        <div className="space-y-4">
          <button
            onClick={() => setShowArchived(v => !v)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", showArchived && "rotate-90")} />
            {t("strategy.archivedNotProfitable")} ({archivedStrategies.length})
          </button>
          {showArchived && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {archivedStrategies.map((s, i) => <RealStrategyCard key={s.id} strategy={s} index={i} />)}
            </div>
          )}
        </div>
      )}



      {/* Real prediction stats */}
      {!summaryLoading && summary && summary.total_predictions > 0 && (
        <div className="card-neon card-neon-blue animate-fade-in">
          <div className="relative p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[#60a5fa]" />
              <h2 className="text-base font-semibold text-white">{t("strategy.realPredictionData")}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: t("strategy.totalPredictions"), value: summary.total_predictions.toLocaleString(), accent: "blue" as const },
                { label: t("strategy.accuracy"), value: `${(summary.accuracy * 100).toFixed(1)}%`, accent: "green" as const },
                { label: t("strategy.brierScore"), value: summary.brier_score.toFixed(3), accent: "blue" as const },
                { label: t("strategy.avgConfidence"), value: `${(summary.avg_confidence * 100).toFixed(1)}%`, accent: "amber" as const },
              ].map((stat) => {
                const colorMap = {
                  blue: "text-[#60a5fa]",
                  green: "text-[#4ade80]",
                  amber: "text-amber-400",
                  red: "text-red-400",
                };
                return (
                  <div key={stat.label} className="glass-panel p-4 space-y-1">
                    <p className="section-label">{stat.label}</p>
                    <p className={cn("text-stat tabular-nums", colorMap[stat.accent])}>{stat.value}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-500">{t("strategy.realPredictionDisclaimer")}</p>
          </div>
        </div>
      )}

      {/* Related pages */}
      <RelatedLinks
        title={t("related.title")}
        links={[
          { label: t("related.trackRecord"), href: "/trackrecord", description: t("related.trackRecordDesc"), icon: ClipboardList },
          { label: t("related.results"), href: "/results", description: t("related.resultsDesc"), icon: Trophy },
          { label: t("related.predictions"), href: "/predictions", description: t("related.predictionsDesc"), icon: Sparkles },
        ]}
      />

    </div>
  );
}
