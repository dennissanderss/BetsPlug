"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  BarChart3,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";

import { api } from "@/lib/api";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { PickTierBadge } from "@/components/noct/pick-tier-badge";
import type { BacktestProof, ValueBetStats, ValueBetToday } from "@/types/api";
import { useTranslations } from "@/i18n/locale-provider";

// Live tracking starts when daily-live pipeline lands. Backfill rows are
// everything before this date. Kept in sync with backend
// LIVE_TRACKING_START in app/api/routes/value_bets.py.
const LIVE_TRACKING_START = "2026-04-22";
const LIVE_SAMPLE_MIN = 30;

// ─── Sub-components ─────────────────────────────────────────────────────────

function ProbDelta({
  label,
  ours,
  implied,
  variant = "compact",
}: {
  label: string;
  ours: number;
  implied: number;
  variant?: "compact" | "large";
}) {
  const diff = ours - implied;
  const positive = diff >= 0;
  const size = variant === "large" ? "text-4xl" : "text-2xl";
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <div className="flex items-baseline gap-3">
        <span className={`${size} font-extrabold tabular-nums text-[#4ade80]`}>
          {(ours * 100).toFixed(1)}%
        </span>
        <span className="text-xs text-slate-500">
          vs bookmaker {(implied * 100).toFixed(1)}%
        </span>
      </div>
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
          positive
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}
      >
        {positive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {positive ? "+" : ""}{(diff * 100).toFixed(1)}% edge
      </span>
    </div>
  );
}

function StatCell({
  label,
  value,
  accent = false,
  danger = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  danger?: boolean;
}) {
  const color = danger
    ? "text-red-400"
    : accent
    ? "text-[#4ade80]"
    : "text-slate-200";
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-lg font-extrabold tabular-nums ${color}`}>
        {value}
      </p>
    </div>
  );
}

function StatsCard({
  title,
  subtitle,
  stats,
  isLoading,
  scope,
}: {
  title: string;
  subtitle: string;
  stats?: ValueBetStats;
  isLoading: boolean;
  scope: "backtest" | "live";
}) {
  if (isLoading) {
    return (
      <div className="card-neon p-5 animate-pulse">
        <div className="h-4 w-40 rounded bg-white/[0.06] mb-2" />
        <div className="h-3 w-56 rounded bg-white/[0.04] mb-4" />
        <div className="grid grid-cols-2 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 rounded bg-white/[0.04]" />
          ))}
        </div>
      </div>
    );
  }

  const insufficient =
    scope === "live" && (!stats || stats.evaluated_picks < LIVE_SAMPLE_MIN);

  return (
    <div className="card-neon p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-200">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        {insufficient && (
          <Pill tone="draw" className="text-[10px]">
            meting loopt
          </Pill>
        )}
      </div>

      {stats && stats.total_picks > 0 ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <StatCell
              label="picks"
              value={String(stats.total_picks)}
            />
            <StatCell
              label="geëvalueerd"
              value={String(stats.evaluated_picks)}
            />
            <StatCell
              label="accuracy"
              value={
                stats.evaluated_picks > 0
                  ? `${(stats.accuracy * 100).toFixed(1)}%`
                  : "—"
              }
              accent={stats.accuracy > 0.5}
            />
            <StatCell
              label="avg edge"
              value={`${(stats.avg_edge * 100).toFixed(1)}%`}
            />
            <StatCell
              label="avg odds"
              value={stats.avg_odds.toFixed(2)}
            />
            <StatCell
              label="ROI"
              value={
                stats.evaluated_picks > 0
                  ? `${stats.roi_percentage >= 0 ? "+" : ""}${stats.roi_percentage.toFixed(1)}%`
                  : "—"
              }
              accent={stats.roi_percentage > 0}
              danger={stats.roi_percentage < 0}
            />
            <StatCell
              label="P/L units"
              value={
                stats.evaluated_picks > 0
                  ? `${stats.total_units_pnl >= 0 ? "+" : ""}${stats.total_units_pnl.toFixed(1)}u`
                  : "—"
              }
              accent={stats.total_units_pnl > 0}
              danger={stats.total_units_pnl < 0}
            />
            <StatCell
              label="max drawdown"
              value={
                stats.evaluated_picks > 0
                  ? `${stats.max_drawdown_units.toFixed(1)}u`
                  : "—"
              }
              danger={stats.max_drawdown_units < 0}
            />
            <StatCell
              label="Sharpe"
              value={
                stats.sharpe_ratio !== null && stats.sharpe_ratio !== undefined
                  ? stats.sharpe_ratio.toFixed(2)
                  : "—"
              }
            />
          </div>
          {stats.evaluated_picks > 0 && (
            <p className="mt-3 text-[11px] text-slate-500">
              95% Wilson CI voor accuracy:{" "}
              <span className="tabular-nums text-slate-400">
                {(stats.wilson_ci_lower * 100).toFixed(1)}% –{" "}
                {(stats.wilson_ci_upper * 100).toFixed(1)}%
              </span>
            </p>
          )}
        </>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-white/10 p-4 text-center">
          <p className="text-xs text-slate-500">
            {scope === "live"
              ? "Eerste live value bet verschijnt na evaluatie"
              : "Nog geen historische value bets beschikbaar"}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Sample Funnel Explainer ────────────────────────────────────────────────

function SampleFunnelBox({ proof }: { proof: BacktestProof }) {
  const { t } = useTranslations();
  const f = proof.funnel;
  const dropOdds = f.live_predictions_evaluated - f.live_evaluated_with_odds;
  return (
    <div className="rounded-lg border border-blue-500/20 bg-blue-500/[0.04] p-4">
      <div className="flex items-start gap-2 mb-2">
        <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-blue-300">
            Waarom maar n={f.live_evaluated_with_odds}?
          </p>
          <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
            Onze odds-pijplijn is live sinds{" "}
            <span className="text-slate-300">{f.odds_pipeline_start}</span>.
            Elke predictie daarvóór heeft geen vastgelegde bookmaker-odds →
            kan niet in een ROI-backtest. Om leakage te voorkomen gebruiken
            we uitsluitend live-gelockte predictions (geen retroactieve
            backtest-picks).
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 text-center">
        <div className="rounded bg-white/[0.03] p-2">
          <p className="text-[9px] uppercase tracking-widest text-slate-500">
            live preds
          </p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-200">
            {f.total_live_predictions}
          </p>
        </div>
        <div className="rounded bg-white/[0.03] p-2">
          <p className="text-[9px] uppercase tracking-widest text-slate-500">
            evaluated
          </p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-200">
            {f.live_predictions_evaluated}
          </p>
        </div>
        <div className="rounded bg-white/[0.03] p-2">
          <p className="text-[9px] uppercase tracking-widest text-slate-500">
            met odds
          </p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-200">
            {f.live_predictions_with_odds_snapshot}
          </p>
        </div>
        <div className="rounded bg-emerald-500/10 border border-emerald-500/20 p-2">
          <p className="text-[9px] uppercase tracking-widest text-emerald-500/80">
            ROI-pool
          </p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-emerald-400">
            {f.live_evaluated_with_odds}
          </p>
        </div>
      </div>
      {proof.accuracy_only_slice.n > 0 && (
        <p className="mt-3 text-[11px] text-slate-400">
          <span className="text-slate-300 font-semibold">{t("vbet.extraEvidence")}</span>{" "}
          accuracy-only test op alle{" "}
          <span className="text-slate-200 tabular-nums">
            {proof.accuracy_only_slice.n}
          </span>{" "}
          live+evaluated predictions (zonder odds-filter) →{" "}
          <span className="text-emerald-400 font-semibold tabular-nums">
            {(proof.accuracy_only_slice.accuracy * 100).toFixed(1)}%
          </span>{" "}
          accuracy, CI{" "}
          {(proof.accuracy_only_slice.wilson_ci_lower * 100).toFixed(0)}%–
          {(proof.accuracy_only_slice.wilson_ci_upper * 100).toFixed(0)}%.
        </p>
      )}
    </div>
  );
}

// ─── Matches Table ──────────────────────────────────────────────────────────

function BacktestMatchesTable({ matches }: { matches: BacktestProof["matches"] }) {
  const { t } = useTranslations();
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? matches : matches.slice(0, 5);
  const pickLabel = { home: "1", draw: "X", away: "2" } as const;

  if (matches.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div>
          <p className="text-xs font-semibold text-slate-200">
            Gebruikte wedstrijden
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Alle {matches.length} picks in de @3%-edge backtest
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200"
        >
          {expanded ? (
            <>
              Toon minder <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              Toon alle {matches.length} <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      </div>

      <div className="divide-y divide-white/[0.04]">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[9px] uppercase tracking-widest text-slate-600 bg-white/[0.02]">
          <span className="col-span-2">{t("vbet.col.date")}</span>
          <span className="col-span-4">{t("vbet.col.match")}</span>
          <span className="col-span-2">{t("vbet.col.league")}</span>
          <span className="col-span-1 text-center">{t("vbet.col.pick")}</span>
          <span className="col-span-1 text-right">{t("vbet.col.odds")}</span>
          <span className="col-span-1 text-right">Edge</span>
          <span className="col-span-1 text-right">P/L</span>
        </div>
        {visible.map((m, i) => (
          <div
            key={i}
            className="grid grid-cols-12 items-center gap-2 px-4 py-2 text-[11px] hover:bg-white/[0.02]"
            style={{
              borderLeft: `3px solid ${m.is_correct ? "#10b981" : "#ef4444"}`,
            }}
          >
            <span className="col-span-2 tabular-nums text-slate-500">
              {m.scheduled_at
                ? new Date(m.scheduled_at).toLocaleDateString("nl-NL", {
                    day: "2-digit",
                    month: "short",
                  })
                : "—"}
            </span>
            <span className="col-span-4 truncate text-slate-300">
              {m.home_team} <span className="text-slate-600">vs</span>{" "}
              {m.away_team}
            </span>
            <span className="col-span-2 truncate text-slate-500">{m.league}</span>
            <span className="col-span-1 text-center font-bold tabular-nums text-slate-200">
              {pickLabel[m.pick]}
            </span>
            <span className="col-span-1 text-right tabular-nums text-slate-300">
              {m.best_odds.toFixed(2)}
            </span>
            <span className="col-span-1 text-right tabular-nums text-emerald-400">
              +{(m.edge * 100).toFixed(1)}%
            </span>
            <span
              className={`col-span-1 text-right font-semibold tabular-nums flex items-center justify-end gap-1 ${
                m.is_correct ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {m.is_correct ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              {m.profit_loss_units >= 0 ? "+" : ""}
              {m.profit_loss_units.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Backtest Proof Card ────────────────────────────────────────────────────

function BacktestProofCard({ proof, isLoading }: {
  proof?: BacktestProof;
  isLoading: boolean;
}) {
  const { t } = useTranslations();
  if (isLoading) {
    return (
      <div className="card-neon p-5 animate-pulse">
        <div className="h-4 w-48 rounded bg-white/[0.06] mb-3" />
        <div className="h-20 w-full rounded bg-white/[0.04]" />
      </div>
    );
  }
  if (!proof || proof.slices.length === 0) return null;

  // Primary slice — "method @ 3% all tiers" — this is our public claim
  const primary =
    proof.slices.find((s) => s.label.startsWith("method - edge >= 3%")) ??
    proof.slices[0];
  const production =
    proof.slices.find((s) => s.label.startsWith("production filter"));

  return (
    <div className="card-neon p-5 md:p-6 relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-10 h-64 w-64 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.35), transparent 70%)",
        }}
      />
      <div className="relative flex items-start gap-3">
        <HexBadge variant="green" size="md">
          <BarChart3 className="h-5 w-5" />
        </HexBadge>
        <div className="flex-1">
          <span className="section-label">{t("vbet.methodEvidence")}</span>
          <h3 className="text-heading mt-2 text-lg">
            Historische test op {proof.total_live_evaluated_with_odds} live
            predictions
          </h3>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Uitsluitend op predictions die vóór kickoff zijn vastgelegd
            (geen team_seeds post-hoc bias). Leakage-vrije backtest van
            dezelfde value-bet logica die in de live pipeline draait.
          </p>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-widest text-emerald-500/80">
            ROI
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-emerald-400">
            {primary.roi_percentage >= 0 ? "+" : ""}
            {primary.roi_percentage.toFixed(1)}%
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            over {primary.n} picks
          </p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">
            Accuracy
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-200">
            {(primary.accuracy * 100).toFixed(1)}%
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            CI {(primary.wilson_ci_lower * 100).toFixed(0)}%–
            {(primary.wilson_ci_upper * 100).toFixed(0)}%
          </p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">
            Sharpe
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-200">
            {primary.sharpe_ratio !== null
              ? primary.sharpe_ratio.toFixed(2)
              : "—"}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            risk-adj return
          </p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">
            Max drawdown
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-red-400">
            {primary.max_drawdown_units.toFixed(1)}u
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            worst run
          </p>
        </div>
      </div>

      {production && production.n > 0 && (
        <div className="relative mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
            Productie-filter (gold + platinum scope)
          </p>
          <p className="text-xs text-slate-300">
            <span className="font-semibold">{production.n} picks</span>,{" "}
            accuracy {(production.accuracy * 100).toFixed(1)}%, ROI{" "}
            <span
              className={
                production.roi_percentage >= 0
                  ? "text-emerald-400 font-bold"
                  : "text-red-400 font-bold"
              }
            >
              {production.roi_percentage >= 0 ? "+" : ""}
              {production.roi_percentage.toFixed(1)}%
            </span>
            {production.n < 30 && (
              <span className="text-slate-500 italic">
                {" "}— sample klein, breder bewijs hierboven
              </span>
            )}
          </p>
        </div>
      )}

      {/* Sample funnel + why-n explainer */}
      <div className="relative mt-4">
        <SampleFunnelBox proof={proof} />
      </div>

      {/* Individual matches table — full transparency */}
      <div className="relative">
        <BacktestMatchesTable matches={proof.matches} />
      </div>

      <p className="relative mt-3 text-[11px] text-slate-500 italic">
        {proof.disclaimer}
      </p>
    </div>
  );
}

// ─── Main Panel ─────────────────────────────────────────────────────────────

export function ValueBetPanel() {
  const { t } = useTranslations();
  const todayQuery = useQuery<ValueBetToday>({
    queryKey: ["value-bet-today"],
    queryFn: () => api.getValueBetToday(),
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
  });

  const backtestStatsQuery = useQuery<ValueBetStats>({
    queryKey: ["value-bet-stats", "backtest"],
    queryFn: () => api.getValueBetStats("backtest"),
    staleTime: 60 * 60_000,
  });

  const liveStatsQuery = useQuery<ValueBetStats>({
    queryKey: ["value-bet-stats", "live"],
    queryFn: () => api.getValueBetStats("live"),
    staleTime: 60 * 60_000,
  });

  const proofQuery = useQuery<BacktestProof>({
    queryKey: ["value-bet-backtest-proof"],
    queryFn: () => api.getValueBetBacktestProof(),
    staleTime: 60 * 60_000,
  });

  const today = todayQuery.data;
  const pickLabelMap = {
    home: "Thuis wint",
    draw: "Gelijkspel",
    away: "Uit wint",
  } as const;

  return (
    <div className="space-y-6">
      {/* ── Today's Value Bet ── */}
      {todayQuery.isLoading ? (
        <div className="card-neon p-8 animate-pulse">
          <div className="h-5 w-40 rounded bg-white/[0.06] mb-4" />
          <div className="h-12 w-80 rounded bg-white/[0.06] mb-4" />
          <div className="h-20 w-full rounded bg-white/[0.04]" />
        </div>
      ) : todayQuery.isError ? (
        <div className="card-neon p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
          <p className="mt-3 text-sm text-slate-400">
            Kon value bet niet laden. Probeer later opnieuw.
          </p>
        </div>
      ) : today && today.available ? (
        <div className="card-neon p-6 md:p-8 relative overflow-hidden">
          {/* Ambient glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 -right-10 h-64 w-64 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(74,222,128,0.35), transparent 70%)",
            }}
          />

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <HexBadge variant="green" size="md">
                <Sparkles className="h-5 w-5" />
              </HexBadge>
              <div>
                <span className="section-label">{t("vbet.title")}</span>
                <h2 className="text-heading mt-2 text-2xl">
                  {today.home_team}{" "}
                  <span className="text-slate-500 text-lg">vs</span>{" "}
                  {today.away_team}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="font-medium">{today.league}</span>
                  {today.scheduled_at && (
                    <>
                      <span className="text-slate-700">•</span>
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span>
                        {new Date(today.scheduled_at).toLocaleString("nl-NL", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {today.prediction_tier && (
              <PickTierBadge
                tier={today.prediction_tier}
                label={today.prediction_tier_label ?? undefined}
                size="md"
              />
            )}
          </div>

          {/* Pick + prob delta */}
          <div className="relative mt-6 grid gap-6 md:grid-cols-[1fr_1fr]">
            <div>
              <Pill tone="active" className="text-xs">
                <ArrowUpRight className="h-3 w-3" />
                Onze pick: {pickLabelMap[today.our_pick ?? "home"]}
              </Pill>
              <div className="mt-4">
                <ProbDelta
                  label={t("vbet.ourProbability")}
                  ours={today.our_probability ?? 0}
                  implied={today.bookmaker_implied ?? 0}
                  variant="large"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 content-start">
              <StatCell
                label="beste odds"
                value={(today.best_odds ?? 0).toFixed(2)}
                accent
              />
              <StatCell
                label="bookmaker"
                value={today.odds_source ?? "—"}
              />
              <StatCell
                label="expected value"
                value={`${(today.expected_value ?? 0) >= 0 ? "+" : ""}${(
                  (today.expected_value ?? 0) * 100
                ).toFixed(1)}%`}
                accent={(today.expected_value ?? 0) >= 0}
                danger={(today.expected_value ?? 0) < 0}
              />
              <StatCell
                label="model-conf"
                value={`${((today.our_confidence ?? 0) * 100).toFixed(0)}%`}
              />
            </div>
          </div>

          <p className="relative mt-6 text-[11px] text-slate-500 italic">
            {today.disclaimer ??
              "Statistische analyse, geen gokadvies. 18+. Odds vastgelegd op voorspelmoment, niet op slotkoers."}
          </p>
        </div>
      ) : (
        <div className="card-neon p-8 text-center">
          <BarChart3 className="mx-auto h-8 w-8 text-slate-500" />
          <h3 className="mt-3 text-sm font-bold text-slate-300">
            Geen value bet vandaag
          </h3>
          <p className="mt-2 max-w-md mx-auto text-xs text-slate-500">
            {today?.reason ??
              "Geen kwalificerende edge ≥ 3% gevonden in Gold/Platinum scope. Nieuwe kandidaten verschijnen zodra er pre-match odds beschikbaar zijn."}
          </p>
        </div>
      )}

      {/* ── Methode-bewijs (leakage-free backtest) ── */}
      <BacktestProofCard
        proof={proofQuery.data}
        isLoading={proofQuery.isLoading}
      />

      {/* ── Stats: backtest + live ── */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatsCard
          title={t("vbet.histSelection")}
          subtitle={`Exacte productie-filter: edge≥3%, odds 1.50-5.00, tier∈{gold,platinum}`}
          stats={backtestStatsQuery.data}
          isLoading={backtestStatsQuery.isLoading}
          scope="backtest"
        />
        <StatsCard
          title={t("vbet.liveMeasurement")}
          subtitle={`Live gemeten vanaf ${LIVE_TRACKING_START}`}
          stats={liveStatsQuery.data}
          isLoading={liveStatsQuery.isLoading}
          scope="live"
        />
      </div>

      <p className="text-[11px] text-slate-500 italic text-center">
        Methode: proportional vig-removal • edge-drempel 3% • odds 1.50–5.00 •
        tier-filter Gold/Platinum. Zie{" "}
        <span className="text-slate-400">docs/value_bet_data_analysis.md</span>{" "}
        voor volledige kalibratie-meting.
      </p>
    </div>
  );
}
