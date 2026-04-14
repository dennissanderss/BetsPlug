"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Gift,
  TrendingUp,
  XCircle,
  Trophy,
} from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import type { FreePickItem, FreePicksResponse } from "@/types/api";
import { ProbBar } from "@/components/match-predictions/prob-bar";
import { confColor, confLevel, formatKickoff } from "@/components/match-predictions/shared";

/* ── Match card — vertical timeline style ─────────────────────── */

function PredictionCard({
  pick,
  index,
  isLast,
}: {
  pick: FreePickItem;
  index: number;
  isLast: boolean;
}) {
  const { t, locale } = useTranslations();
  const hasPrediction = pick.confidence != null && pick.confidence > 0;
  const cScore = hasPrediction ? Math.round(pick.confidence! * 100) : 0;
  const level = hasPrediction ? confLevel(cScore) : "Low";
  const color = hasPrediction ? confColor(level) : "#64748b";
  const isFinished = pick.status === "finished";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex gap-4 sm:gap-6"
    >
      {/* Timeline connector */}
      <div className="relative flex flex-col items-center">
        {/* Dot */}
        <div className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-green-500 bg-white shadow-[0_0_12px_rgba(34,197,94,0.3)]">
          <div className="h-2 w-2 rounded-full bg-green-400" />
        </div>
        {/* Line */}
        {!isLast && (
          <div className="w-px flex-1 bg-gradient-to-b from-green-500/40 to-green-500/10" />
        )}
      </div>

      {/* Card */}
      <div className="group mb-5 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all hover:border-green-500/30 hover:shadow-[0_8px_40px_rgba(34,197,94,0.08)] sm:mb-6">

        {/* League banner */}
        <div className="relative flex items-center justify-center gap-3 border-b border-slate-200 bg-green-50 px-4 py-2.5">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-green-500/30" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-700">
            {pick.league}
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-green-500/30" />
        </div>

        {/* Teams — VS layout */}
        <div className="relative px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Home team */}
            <div className="min-w-0 flex-1 text-center">
              {pick.home_team_logo && (
                <div className="relative mx-auto mb-2 h-10 w-10 sm:h-12 sm:w-12">
                  <Image src={pick.home_team_logo} alt={pick.home_team} fill className="object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.1)]" sizes="48px" />
                </div>
              )}
              <p className="truncate text-sm font-extrabold uppercase leading-tight tracking-wide text-slate-900 sm:text-base">
                {pick.home_team}
              </p>
            </div>

            {/* VS badge */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-lg bg-green-500/20 blur-md" />
              <div className="relative flex h-9 w-9 -skew-x-6 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <span className="skew-x-6 text-xs font-black tracking-wider text-[#0a1018]">VS</span>
              </div>
            </div>

            {/* Away team */}
            <div className="min-w-0 flex-1 text-center">
              {pick.away_team_logo && (
                <div className="relative mx-auto mb-2 h-10 w-10 sm:h-12 sm:w-12">
                  <Image src={pick.away_team_logo} alt={pick.away_team} fill className="object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.1)]" sizes="48px" />
                </div>
              )}
              <p className="truncate text-sm font-extrabold uppercase leading-tight tracking-wide text-slate-900 sm:text-base">
                {pick.away_team}
              </p>
            </div>
          </div>

          {/* Kickoff time */}
          <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-slate-500">
            <Clock className="h-3 w-3" />
            {formatKickoff(pick.scheduled_at, locale)}
          </div>

          {/* Score (finished matches) */}
          {isFinished && pick.home_score != null && pick.away_score != null && (
            <div className="mt-3 flex items-center justify-center">
              <div className="rounded-lg bg-slate-50 px-5 py-1.5 ring-1 ring-slate-200">
                <span className="text-xl font-black tabular-nums text-slate-900">
                  {pick.home_score} — {pick.away_score}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Probability bar + Confidence */}
        <div className="border-t border-slate-200 px-5 py-3 sm:px-6">
          {hasPrediction ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
              {/* Prob bar */}
              <div className="flex-1">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {t("matchPred.winProbLabel")}
                </p>
                <ProbBar
                  home={Math.round(pick.home_win_prob! * 100)}
                  draw={pick.draw_prob != null ? Math.round(pick.draw_prob * 100) : null}
                  away={Math.round(pick.away_win_prob! * 100)}
                  homeTeam={pick.home_team}
                  awayTeam={pick.away_team}
                />
              </div>

              {/* Confidence */}
              <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-0.5">
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
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
              <Clock className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-[11px] font-semibold text-blue-600">
                {t("home.freePredPending")}
              </span>
            </div>
          )}
        </div>

        {/* Result badge (finished only) */}
        {isFinished && pick.is_correct !== null && (
          <div className="border-t border-slate-200 px-5 py-2.5 sm:px-6">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                pick.is_correct
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}
            >
              {pick.is_correct ? (
                <><CheckCircle2 className="h-3 w-3" /> Correct</>
              ) : (
                <><XCircle className="h-3 w-3" /> Incorrect</>
              )}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Skeleton card ────────────────────────────────────────────── */

function PredictionSkeleton() {
  return (
    <div className="relative flex gap-4 sm:gap-6">
      <div className="relative flex flex-col items-center">
        <div className="z-10 h-5 w-5 rounded-full border-2 border-slate-200 bg-white" />
        <div className="w-px flex-1 bg-slate-200" />
      </div>
      <div className="mb-5 flex-1 animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex justify-center border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="h-3 w-32 rounded bg-slate-100" />
        </div>
        <div className="flex items-center justify-between px-6 py-5">
          <div className="h-5 w-20 rounded bg-slate-100" />
          <div className="h-9 w-9 rounded-lg bg-slate-50" />
          <div className="h-5 w-20 rounded bg-slate-100" />
        </div>
        <div className="border-t border-slate-200 px-6 py-3 space-y-2">
          <div className="h-2.5 w-20 rounded bg-slate-50" />
          <div className="h-3 w-full rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

/* ── Picks list — vertical timeline ───────────────────────────── */

function PicksList({
  picks,
  label,
  icon: Icon,
}: {
  picks: FreePickItem[];
  label: string;
  icon: typeof Trophy;
}) {
  return (
    <div className="mb-8">
      <div className="mb-5 flex items-center gap-3">
        <Icon className="h-4 w-4 text-green-600" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-600">
          {label}
        </h3>
        <div className="h-px flex-1 bg-gradient-to-r from-green-500/20 to-transparent" />
      </div>
      <div>
        {picks.map((pick, i) => (
          <PredictionCard
            key={pick.match_id || pick.id}
            pick={pick}
            index={i}
            isLast={i === picks.length - 1}
          />
        ))}
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
        const res = await fetch(`${API}/homepage/free-picks`);
        const d: FreePicksResponse = await res.json();

        if (d.today && d.today.length > 0) {
          setData(d);
          return;
        }

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
          home_team_logo: f.home_team_logo ?? null,
          away_team_logo: f.away_team_logo ?? null,
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
                home_team_logo: f.home_team_logo ?? null,
                away_team_logo: f.away_team_logo ?? null,
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
          // Both endpoints failed
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
  const winratePct = Math.round(stats.winrate * 100);

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-green-200/30 blur-[120px]" />
      </div>
      {/* Diagonal accent stripes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 top-0 h-full w-40 rotate-[15deg] bg-gradient-to-b from-green-100/40 via-green-50/20 to-transparent" />
        <div className="absolute -right-10 top-0 h-full w-20 rotate-[15deg] bg-gradient-to-b from-green-100/30 to-transparent" />
        <div className="absolute -left-20 bottom-0 h-full w-40 rotate-[15deg] bg-gradient-to-t from-green-100/40 via-green-50/20 to-transparent" />
        <div className="absolute -left-10 bottom-0 h-full w-20 rotate-[15deg] bg-gradient-to-t from-green-100/30 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          {/* Trophy icon */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
            <Trophy className="h-7 w-7 text-[#0a1018]" strokeWidth={2.5} />
          </div>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-1.5">
            <Gift className="h-4 w-4 text-green-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-green-600">
              {t("home.freePredBadge")}
            </span>
          </div>
          <h2 className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl md:text-5xl">
            {t("home.freePredTitle")}{" "}
            <span className="gradient-text">{t("home.freePredTitleHighlight")}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-500">
            {t("home.freePredSubtitle")}
          </p>

          {/* Winrate stats */}
          {stats.total > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="mt-6 inline-flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-6 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
            >
              <div className="text-center">
                <span className="block text-2xl font-extrabold text-green-600 tabular-nums">
                  {winratePct}%
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {t("home.freePredWinrate")}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="text-center">
                <span className="block text-2xl font-extrabold text-slate-900 tabular-nums">
                  {stats.correct}/{stats.total}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {t("home.freePredRecord")}
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Picks — vertical timeline layout */}
        {loading ? (
          <div>
            <PredictionSkeleton />
            <PredictionSkeleton />
            <PredictionSkeleton />
          </div>
        ) : (
          <>
            {todayPicks.length > 0 && (
              <PicksList picks={todayPicks} label={t("home.freePredToday")} icon={Trophy} />
            )}
            {yesterdayPicks.length > 0 && (
              <PicksList picks={yesterdayPicks} label={t("home.freePredYesterday")} icon={Clock} />
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
            className="btn-gradient group inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-black shadow-lg shadow-green-500/10 transition-all hover:shadow-green-500/25"
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
