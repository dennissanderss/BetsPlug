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
      className="relative flex gap-4 sm:gap-5"
    >
      {/* Timeline connector */}
      <div className="relative flex flex-col items-center">
        <div className="relative z-10 flex h-4 w-4 items-center justify-center border-2 border-[#4ade80] bg-[#050505]">
          <div className="h-1.5 w-1.5 bg-[#4ade80]" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-[#4ade80]/30" />}
      </div>

      {/* Card — hard edge */}
      <div className="group relative mb-5 flex-1 overflow-hidden border border-white/10 bg-[#0a0a0a] transition-all hover:border-[#4ade80]/40 hover:bg-[#111] sm:mb-6">
        {/* Corner brackets */}
        <span className="pointer-events-none absolute left-[-1px] top-[-1px] h-3 w-3 border-l-2 border-t-2 border-[#4ade80]" />
        <span className="pointer-events-none absolute right-[-1px] bottom-[-1px] h-3 w-3 border-r-2 border-b-2 border-[#4ade80]" />

        {/* League banner */}
        <div className="flex items-center justify-center gap-3 border-b border-white/[0.08] px-4 py-2.5">
          <div className="h-px flex-1 bg-[#4ade80]/30" />
          <span className="mono-label-lime">{pick.league}</span>
          <div className="h-px flex-1 bg-[#4ade80]/30" />
        </div>

        {/* Teams — VS layout */}
        <div className="relative px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1 text-center">
              {pick.home_team_logo && (
                <div className="relative mx-auto mb-2 h-10 w-10 sm:h-12 sm:w-12">
                  <Image src={pick.home_team_logo} alt={pick.home_team} fill className="object-contain" sizes="48px" />
                </div>
              )}
              <p className="truncate text-display text-sm text-white sm:text-base">
                {pick.home_team}
              </p>
            </div>

            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center bg-[#4ade80]">
              <span className="font-mono text-[10px] font-black tracking-widest text-[#050505]">VS</span>
            </div>

            <div className="min-w-0 flex-1 text-center">
              {pick.away_team_logo && (
                <div className="relative mx-auto mb-2 h-10 w-10 sm:h-12 sm:w-12">
                  <Image src={pick.away_team_logo} alt={pick.away_team} fill className="object-contain" sizes="48px" />
                </div>
              )}
              <p className="truncate text-display text-sm text-white sm:text-base">
                {pick.away_team}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[#707070]">
            <Clock className="h-3 w-3" />
            {formatKickoff(pick.scheduled_at, locale)}
          </div>

          {isFinished && pick.home_score != null && pick.away_score != null && (
            <div className="mt-3 flex items-center justify-center">
              <div className="border border-white/10 px-5 py-1.5">
                <span className="text-stat text-xl text-white">
                  {pick.home_score} — {pick.away_score}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Probability bar + Confidence */}
        <div className="border-t border-white/[0.08] px-5 py-4 sm:px-6">
          {hasPrediction ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
              <div className="flex-1">
                <p className="mono-label mb-2">
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

              <div className="flex items-center gap-3 border-l border-white/[0.08] pl-4 sm:flex-col sm:items-end sm:gap-1 sm:border-l-0 sm:border-t-0 sm:pl-0">
                <span
                  className="border px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-widest"
                  style={{ borderColor: color, color }}
                >
                  {level}
                </span>
                <span
                  className="text-stat text-3xl leading-none"
                  style={{ color }}
                >
                  {cScore}
                  <span className="text-base">%</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 border border-white/10 px-3 py-2">
              <Clock className="h-3.5 w-3.5 text-[#4ade80]" />
              <span className="mono-label-lime">
                {t("home.freePredPending")}
              </span>
            </div>
          )}
        </div>

        {isFinished && pick.is_correct !== null && (
          <div className="border-t border-white/[0.08] px-5 py-2.5 sm:px-6">
            <span
              className={`inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest ${
                pick.is_correct
                  ? "border-[#4ade80] text-[#4ade80]"
                  : "border-[#ef4444] text-[#ef4444]"
              }`}
            >
              {pick.is_correct ? (
                <><CheckCircle2 className="h-3 w-3" /> CORRECT</>
              ) : (
                <><XCircle className="h-3 w-3" /> INCORRECT</>
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
    <div className="relative flex gap-4 sm:gap-5">
      <div className="relative flex flex-col items-center">
        <div className="z-10 h-4 w-4 border-2 border-white/10 bg-[#050505]" />
        <div className="w-px flex-1 bg-white/10" />
      </div>
      <div className="mb-5 flex-1 animate-pulse border border-white/10 bg-[#0a0a0a]">
        <div className="flex justify-center border-b border-white/[0.08] px-4 py-2.5">
          <div className="h-3 w-32 bg-white/[0.06]" />
        </div>
        <div className="flex items-center justify-between px-6 py-5">
          <div className="h-5 w-20 bg-white/[0.06]" />
          <div className="h-9 w-9 bg-white/[0.06]" />
          <div className="h-5 w-20 bg-white/[0.06]" />
        </div>
        <div className="space-y-2 border-t border-white/[0.08] px-6 py-3">
          <div className="h-2.5 w-20 bg-white/[0.06]" />
          <div className="h-2 w-full bg-white/[0.06]" />
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
        <Icon className="h-4 w-4 text-[#4ade80]" strokeWidth={2} />
        <h3 className="mono-label-lime">
          {label}
        </h3>
        <div className="h-px flex-1 divider-dashed" />
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
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />

      <div className="relative mx-auto max-w-3xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <span className="section-tag mb-5">
            <Gift className="h-3 w-3" />
            {t("home.freePredBadge")}
          </span>
          <h2 className="text-display text-3xl text-white sm:text-4xl lg:text-5xl">
            {t("home.freePredTitle")}{" "}
            <span className="text-[#4ade80]">{t("home.freePredTitleHighlight")}</span>
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#a3a3a3]">
            {t("home.freePredSubtitle")}
          </p>

          {/* Winrate stats */}
          {stats.total > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="mt-6 inline-flex items-stretch border border-white/10 bg-[#0a0a0a]"
            >
              <div className="px-5 py-3 text-left">
                <span className="text-stat block text-2xl text-[#4ade80]">
                  {winratePct}%
                </span>
                <span className="mono-label">{t("home.freePredWinrate")}</span>
              </div>
              <div className="w-px bg-white/10" />
              <div className="px-5 py-3 text-left">
                <span className="text-stat block text-2xl text-white">
                  {stats.correct}/{stats.total}
                </span>
                <span className="mono-label">{t("home.freePredRecord")}</span>
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
            className="btn-lime group"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            {String(t("home.freePredCta")).toUpperCase()} →
          </Link>
          <p className="mono-label">{t("home.freePredCtaSub")}</p>
        </motion.div>
      </div>
    </section>
  );
}
