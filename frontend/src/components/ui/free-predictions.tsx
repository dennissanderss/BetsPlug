"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Gift,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import type { FreePickItem, FreePicksResponse } from "@/types/api";
import { ProbBar } from "@/components/match-predictions/prob-bar";
import { confColor, confLevel, formatKickoff } from "@/components/match-predictions/shared";

/* ── Mini prediction card (homepage variant) ─────────────────── */

function PredictionCard({
  pick,
  index,
}: {
  pick: FreePickItem;
  index: number;
}) {
  const { t, locale } = useTranslations();
  const hasPrediction = pick.confidence != null && pick.confidence > 0;
  const cScore = hasPrediction ? Math.round(pick.confidence! * 100) : 0;
  const level = hasPrediction ? confLevel(cScore) : "Low";
  const color = hasPrediction ? confColor(level) : "#64748b";
  const isFinished = pick.status === "finished";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-green-500/20 bg-white/[0.02] backdrop-blur-sm transition-all hover:border-green-500/40 hover:bg-white/[0.04]"
    >
      {/* Top bar: league + kickoff */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
        <span className="truncate text-[11px] font-semibold uppercase tracking-widest text-green-400/80">
          {pick.league}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[11px] text-slate-500">
          <Clock className="h-3 w-3" />
          {formatKickoff(pick.scheduled_at, locale)}
        </span>
      </div>

      {/* Teams + Score */}
      <div className="px-5 pt-4 pb-1">
        <p className="text-lg font-extrabold leading-tight text-white">
          {pick.home_team}{" "}
          <span className="font-normal text-slate-500">vs</span>{" "}
          {pick.away_team}
        </p>
        {isFinished && pick.home_score != null && pick.away_score != null && (
          <p className="mt-1.5 text-sm font-bold tabular-nums text-slate-300">
            {pick.home_score} - {pick.away_score}
          </p>
        )}
      </div>

      {/* Probability bar OR "analysis pending" */}
      <div className="px-5 pt-3 pb-4">
        {hasPrediction ? (
          <>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {t("matchPred.winProbLabel")}
            </p>
            <ProbBar
              home={Math.round(pick.home_win_prob! * 100)}
              draw={pick.draw_prob != null ? Math.round(pick.draw_prob * 100) : null}
              away={Math.round(pick.away_win_prob! * 100)}
              homeTeam={pick.home_team}
              awayTeam={pick.away_team}
            />
          </>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/[0.06] px-3 py-2.5">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[11px] font-semibold text-blue-300">
              {t("home.freePredPending")}
            </span>
          </div>
        )}
      </div>

      {/* Bottom: confidence + correctness badge */}
      <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
        {isFinished && pick.is_correct !== null ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              pick.is_correct
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                : "bg-red-500/15 text-red-400 border border-red-500/25"
            }`}
          >
            {pick.is_correct ? (
              <><CheckCircle2 className="h-3 w-3" /> Correct</>
            ) : (
              <><XCircle className="h-3 w-3" /> Incorrect</>
            )}
          </span>
        ) : (
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            {hasPrediction ? t("matchPred.confidenceLabel") : ""}
          </span>
        )}
        {hasPrediction ? (
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: `${color}1a`, color }}
            >
              {level}
            </span>
            <span
              className="text-2xl font-extrabold tabular-nums leading-none"
              style={{ color }}
            >
              {cScore}
              <span className="text-sm font-semibold">%</span>
            </span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/25 bg-slate-500/10 px-2.5 py-0.5 text-[11px] font-bold text-slate-400">
            <Clock className="h-3 w-3" /> Pending
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ── Skeleton card ────────────────────────────────────────────── */

function PredictionSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
        <div className="h-3 w-28 rounded bg-white/[0.06]" />
        <div className="h-3 w-20 rounded bg-white/[0.06]" />
      </div>
      <div className="px-5 pt-4 pb-1">
        <div className="h-5 w-48 rounded bg-white/[0.06]" />
      </div>
      <div className="px-5 pt-3 pb-4 space-y-2">
        <div className="h-2.5 w-20 rounded bg-white/[0.04]" />
        <div className="h-3 w-full rounded-full bg-white/[0.06]" />
      </div>
      <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
        <div className="h-3 w-20 rounded bg-white/[0.04]" />
        <div className="h-7 w-14 rounded bg-white/[0.06]" />
      </div>
    </div>
  );
}

/* ── Main section ─────────────────────────────────────────────── */

export function FreePredictions() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  const [data, setData] = useState<FreePicksResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

    async function loadPicks() {
      try {
        // 1. Try the dedicated free-picks endpoint
        const res = await fetch(`${API}/homepage/free-picks`);
        const d: FreePicksResponse = await res.json();

        if (d.today && d.today.length > 0) {
          setData(d);
          return;
        }

        // 2. Fallback: fetch upcoming fixtures directly and convert
        const fixRes = await fetch(`${API}/fixtures/upcoming?days=14`);
        const fixJson = await fixRes.json();
        const fixtures: Array<Record<string, unknown>> = fixJson.fixtures ?? [];

        const now = Date.now();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const upcoming = fixtures
          .filter((f: any) => {
            if (f.status !== "scheduled") return false;
            const ts = new Date(f.scheduled_at as string).getTime();
            return Number.isFinite(ts) && ts > now;
          })
          .sort(
            (a: any, b: any) =>
              new Date(a.scheduled_at as string).getTime() -
              new Date(b.scheduled_at as string).getTime(),
          )
          .slice(0, 3);

        const fallbackPicks: FreePickItem[] = upcoming.map((f: any) => ({
          id: f.id ?? "",
          match_id: f.id ?? "",
          home_team: f.home_team_name ?? "TBD",
          away_team: f.away_team_name ?? "TBD",
          league: f.league_name ?? "",
          scheduled_at: f.scheduled_at ?? "",
          pick: f.prediction?.pick ?? null,
          home_win_prob: f.prediction?.home_win_prob ?? null,
          draw_prob: f.prediction?.draw_prob ?? null,
          away_win_prob: f.prediction?.away_win_prob ?? null,
          confidence: f.prediction?.confidence ?? null,
          status: f.status ?? "scheduled",
          home_score: null,
          away_score: null,
          is_correct: null,
        }));

        setData({
          today: fallbackPicks,
          yesterday: d.yesterday ?? [],
          stats: d.stats ?? { total: 0, correct: 0, winrate: 0 },
        });
      } catch {
        // Last resort: try fixtures only
        try {
          const fixRes = await fetch(`${API}/fixtures/upcoming?days=14`);
          const fixJson = await fixRes.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fixtures: any[] = fixJson.fixtures ?? [];
          const now = Date.now();
          const upcoming = fixtures
            .filter((f) => f.status === "scheduled" && new Date(f.scheduled_at).getTime() > now)
            .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
            .slice(0, 3);

          if (upcoming.length > 0) {
            setData({
              today: upcoming.map((f: any) => ({
                id: f.id ?? "",
                match_id: f.id ?? "",
                home_team: f.home_team_name ?? "TBD",
                away_team: f.away_team_name ?? "TBD",
                league: f.league_name ?? "",
                scheduled_at: f.scheduled_at ?? "",
                pick: f.prediction?.pick ?? null,
                home_win_prob: f.prediction?.home_win_prob ?? null,
                draw_prob: f.prediction?.draw_prob ?? null,
                away_win_prob: f.prediction?.away_win_prob ?? null,
                confidence: f.prediction?.confidence ?? null,
                status: "scheduled",
                home_score: null,
                away_score: null,
                is_correct: null,
              })),
              yesterday: [],
              stats: { total: 0, correct: 0, winrate: 0 },
            });
          }
        } catch {
          // Both endpoints failed — leave empty
        }
      } finally {
        setLoading(false);
      }
    }

    loadPicks();
  }, []);

  const todayPicks = data?.today ?? [];
  const yesterdayPicks = data?.yesterday ?? [];
  const stats = data?.stats ?? { total: 0, correct: 0, winrate: 0 };
  const hasPicks = todayPicks.length > 0 || yesterdayPicks.length > 0;

  // Always render section — show skeleton/empty state when no data
  const winratePct = Math.round(stats.winrate * 100);

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-green-500/[0.04] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1.5">
            <Gift className="h-4 w-4 text-green-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-green-400">
              {t("home.freePredBadge")}
            </span>
          </div>
          <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
            {t("home.freePredTitle")}{" "}
            <span className="gradient-text">{t("home.freePredTitleHighlight")}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
            {t("home.freePredSubtitle")}
          </p>

          {/* Running winrate stats */}
          {stats.total > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="mt-6 inline-flex items-center gap-4 rounded-xl border border-green-500/15 bg-white/[0.02] px-6 py-3"
            >
              <div className="text-center">
                <span className="block text-2xl font-extrabold text-green-400 tabular-nums">
                  {winratePct}%
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {t("home.freePredWinrate")}
                </span>
              </div>
              <div className="h-8 w-px bg-white/[0.08]" />
              <div className="text-center">
                <span className="block text-2xl font-extrabold text-white tabular-nums">
                  {stats.correct}/{stats.total}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {t("home.freePredRecord")}
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Upcoming picks — always 3 cards */}
        {loading ? (
          <div className="grid gap-5 md:grid-cols-3">
            <PredictionSkeleton />
            <PredictionSkeleton />
            <PredictionSkeleton />
          </div>
        ) : (
          <>
            {todayPicks.length > 0 && (
              <div className="mb-10">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">
                  {t("home.freePredToday")}
                </h3>
                <div className="grid gap-5 md:grid-cols-3">
                  {todayPicks.map((pick, i) => (
                    <PredictionCard key={pick.match_id || pick.id} pick={pick} index={i} />
                  ))}
                </div>
              </div>
            )}

            {yesterdayPicks.length > 0 && (
              <div className="mb-10">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">
                  {t("home.freePredYesterday")}
                </h3>
                <div className="grid gap-5 md:grid-cols-3">
                  {yesterdayPicks.map((pick, i) => (
                    <PredictionCard key={pick.match_id || pick.id} pick={pick} index={i} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-10 flex flex-col items-center gap-4"
        >
          <Link
            href={loc("/match-predictions")}
            className="btn-gradient group inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-black shadow-lg shadow-green-500/20 transition-all hover:shadow-green-500/40"
          >
            <TrendingUp className="h-4 w-4" />
            {t("home.freePredCta")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="text-xs text-slate-500">
            {t("home.freePredCtaSub")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
