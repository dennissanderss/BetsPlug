"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Clock, Gift, TrendingUp } from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import type { Fixture } from "@/types/api";
import { ProbBar } from "@/components/match-predictions/prob-bar";
import { confColor, confLevel, formatKickoff } from "@/components/match-predictions/shared";

/* ── Mini prediction card (homepage variant) ─────────────────── */

function PredictionCard({
  fixture,
  index,
}: {
  fixture: Fixture;
  index: number;
}) {
  const { t, locale } = useTranslations();
  const pred = fixture.prediction;
  const hasPred = pred !== null;

  const confScore = hasPred ? Math.round(pred!.confidence * 100) : null;
  const level = confScore !== null ? confLevel(confScore) : null;
  const color = level ? confColor(level) : "#475569";

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
          {fixture.league_name}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[11px] text-slate-500">
          <Clock className="h-3 w-3" />
          {formatKickoff(fixture.scheduled_at, locale)}
        </span>
      </div>

      {/* Teams */}
      <div className="px-5 pt-4 pb-1">
        <p className="text-lg font-extrabold leading-tight text-white">
          {fixture.home_team_name}{" "}
          <span className="font-normal text-slate-500">vs</span>{" "}
          {fixture.away_team_name}
        </p>
      </div>

      {/* Probability bar */}
      <div className="px-5 pt-3 pb-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          {t("matchPred.winProbLabel")}
        </p>
        {hasPred ? (
          <ProbBar
            home={Math.round(pred!.home_win_prob * 100)}
            draw={
              pred!.draw_prob !== null
                ? Math.round(pred!.draw_prob * 100)
                : null
            }
            away={Math.round(pred!.away_win_prob * 100)}
            homeTeam={fixture.home_team_name}
            awayTeam={fixture.away_team_name}
          />
        ) : (
          <div className="h-3 w-full animate-pulse rounded-full bg-white/[0.06]" />
        )}
      </div>

      {/* Bottom: confidence */}
      {hasPred && confScore !== null && (
        <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            {t("matchPred.confidenceLabel")}
          </span>
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
              {confScore}
              <span className="text-sm font-semibold">%</span>
            </span>
          </div>
        </div>
      )}
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

  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    fetch(`${API}/fixtures/upcoming?days=3`)
      .then((r) => r.json())
      .then((data) => {
        setFixtures(data.fixtures || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const freePicks = useMemo(
    () =>
      fixtures
        .filter((f) => f.status === "scheduled" && f.prediction !== null)
        .slice(0, 3),
    [fixtures]
  );

  // Don't render section if no predictions available and done loading
  if (!loading && freePicks.length === 0) return null;

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
        </motion.div>

        {/* Prediction cards grid */}
        <div className="grid gap-5 md:grid-cols-3">
          {loading ? (
            <>
              <PredictionSkeleton />
              <PredictionSkeleton />
              <PredictionSkeleton />
            </>
          ) : (
            freePicks.map((fixture, i) => (
              <PredictionCard key={fixture.id} fixture={fixture} index={i} />
            ))
          )}
        </div>

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
