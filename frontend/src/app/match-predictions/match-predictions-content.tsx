"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Sparkles,
  Lock,
  Clock,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Trophy,
  Activity,
  Eye,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { api } from "@/lib/api";
import type { Fixture } from "@/types/api";

/* ──────────────────────────────────────────────────────────────
 * Match Predictions — public marketing teaser
 * ────────────────────────────────────────────────────────────── */

const FREE_PICKS = 3;
const LOCKED_PREVIEW = 6;

type ConfLevel = "High" | "Medium" | "Low";

function formatKickoff(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(locale === "en" ? "en-GB" : locale, {
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

function confLevel(score: number): ConfLevel {
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

function confColor(level: ConfLevel): string {
  if (level === "High") return "#10b981";
  if (level === "Medium") return "#f59e0b";
  return "#ef4444";
}

/* ── Probability bar ───────────────────────────────────────── */

function ProbBar({
  home,
  draw,
  away,
  homeTeam,
  awayTeam,
}: {
  home: number;
  draw: number | null;
  away: number;
  homeTeam: string;
  awayTeam: string;
}) {
  const total = home + (draw ?? 0) + away;
  const predicted: "home" | "draw" | "away" =
    home >= away && home >= (draw ?? 0)
      ? "home"
      : (draw ?? 0) >= away
        ? "draw"
        : "away";

  const segments = [
    {
      key: "home" as const,
      label: homeTeam.split(" ").pop() || homeTeam,
      prob: home,
      color: "#3b82f6",
      width: `${(home / total) * 100}%`,
    },
    ...(draw !== null
      ? [
          {
            key: "draw" as const,
            label: "Draw",
            prob: draw,
            color: "#f59e0b",
            width: `${(draw / total) * 100}%`,
          },
        ]
      : []),
    {
      key: "away" as const,
      label: awayTeam.split(" ").pop() || awayTeam,
      prob: away,
      color: "#ef4444",
      width: `${(away / total) * 100}%`,
    },
  ];

  return (
    <div className="w-full">
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-white/[0.06]">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: seg.width,
              background: seg.color,
              opacity: predicted === seg.key ? 1 : 0.35,
              boxShadow:
                predicted === seg.key ? `0 0 10px ${seg.color}80` : "none",
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-1">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className="flex min-w-0 flex-col items-center overflow-hidden"
            style={{ width: seg.width }}
          >
            <span
              className="text-[11px] font-bold leading-none tabular-nums"
              style={{
                color: predicted === seg.key ? seg.color : "#475569",
              }}
            >
              {seg.prob}%
            </span>
            <span
              className="mt-0.5 w-full truncate text-center text-[9px] uppercase tracking-wide"
              style={{
                color: predicted === seg.key ? seg.color : "#334155",
              }}
            >
              {seg.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Free (unlocked) match card ────────────────────────────── */

function FreeMatchCard({ fixture }: { fixture: Fixture }) {
  const { t, locale } = useTranslations();
  const pred = fixture.prediction;
  const hasPred = pred !== null;

  const confScore = hasPred ? Math.round(pred!.confidence * 100) : null;
  const level = confScore !== null ? confLevel(confScore) : null;
  const color = level ? confColor(level) : "#475569";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card-hover relative overflow-hidden border-green-500/20"
    >
      {/* Free ribbon */}
      <div className="pointer-events-none absolute -right-9 top-4 rotate-45 bg-gradient-to-r from-green-500 to-emerald-500 px-10 py-1 text-[10px] font-extrabold uppercase tracking-widest text-black shadow-lg shadow-green-500/30">
        Free
      </div>

      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="truncate text-[11px] font-semibold uppercase tracking-widest text-green-400/80">
            {fixture.league_name}
          </span>
          <p className="break-words text-base font-extrabold leading-tight text-white sm:text-lg">
            {fixture.home_team_name}{" "}
            <span className="font-normal text-slate-500">vs</span>{" "}
            {fixture.away_team_name}
          </p>
          <p className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {formatKickoff(fixture.scheduled_at, locale)}
            </span>
          </p>
        </div>

        <div className="w-full min-w-0 lg:max-w-[280px] lg:mx-4">
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

        <div className="flex shrink-0 flex-row items-center gap-3 lg:flex-col lg:items-end lg:gap-1">
          {hasPred && confScore !== null ? (
            <>
              <span
                className="text-4xl font-extrabold leading-none tabular-nums"
                style={{ color }}
              >
                {confScore}
                <span className="text-xl font-semibold">%</span>
              </span>
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: `${color}1a`,
                  color,
                }}
              >
                {t("matchPred.confidenceLabel")}
              </span>
            </>
          ) : (
            <span className="text-xs italic text-slate-500">—</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Locked (blurred) match card ───────────────────────────── */

function LockedMatchCard({ fixture }: { fixture: Fixture }) {
  const { t, locale } = useTranslations();
  const loc = useLocalizedHref();

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
      {/* Blurred content underneath */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none p-4 blur-[6px] sm:p-5"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="truncate text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              {fixture.league_name}
            </span>
            <p className="break-words text-base font-semibold leading-tight text-white">
              {fixture.home_team_name}{" "}
              <span className="font-normal text-slate-600">vs</span>{" "}
              {fixture.away_team_name}
            </p>
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {formatKickoff(fixture.scheduled_at, locale)}
              </span>
            </p>
          </div>
          <div className="w-full min-w-0 lg:max-w-[260px]">
            <div className="mb-2 h-2.5 rounded bg-white/[0.06]" />
            <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-[45%] rounded-full bg-blue-500/60" />
              <div className="h-full w-[25%] rounded-full bg-amber-500/40" />
              <div className="h-full w-[30%] rounded-full bg-red-500/40" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-4xl font-extrabold leading-none text-emerald-400/70">
              82<span className="text-xl">%</span>
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400/70">
              Confidence
            </span>
          </div>
        </div>
      </div>

      {/* Foreground lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0a1220]/60 via-[#0a1220]/40 to-[#0a1220]/70 backdrop-blur-[2px]">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-green-500/30 bg-green-500/15 shadow-[0_0_20px_rgba(74,222,128,0.25)] ring-1 ring-green-500/20">
            <Lock className="h-4 w-4 text-green-400" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-green-300">
            {t("matchPred.lockedLabel")}
          </p>
          <Link
            href={loc("/checkout")}
            className="btn-gradient rounded-full px-4 py-1.5 text-[11px] font-extrabold text-black shadow-lg shadow-green-500/30 transition-all hover:shadow-green-500/50"
          >
            {t("matchPred.unlockThis")}
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Locked skeleton (for when we don't have enough real fixtures) ── */

function LockedSkeleton() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
      <div aria-hidden="true" className="p-5 blur-[6px]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 rounded bg-white/[0.06]" />
            <div className="h-5 w-56 rounded bg-white/[0.06]" />
            <div className="h-3 w-24 rounded bg-white/[0.06]" />
          </div>
          <div className="w-full max-w-[260px] space-y-2">
            <div className="h-3 w-full rounded-full bg-white/[0.06]" />
            <div className="h-2 w-2/3 rounded bg-white/[0.04]" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="h-10 w-16 rounded bg-white/[0.06]" />
            <div className="h-6 w-20 rounded-full bg-white/[0.04]" />
          </div>
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0a1220]/60 via-[#0a1220]/40 to-[#0a1220]/70 backdrop-blur-[2px]">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-green-500/30 bg-green-500/15 ring-1 ring-green-500/20">
            <Lock className="h-4 w-4 text-green-400" />
          </div>
          <Link
            href={loc("/checkout")}
            className="btn-gradient rounded-full px-4 py-1.5 text-[11px] font-extrabold text-black shadow-lg shadow-green-500/30"
          >
            {t("matchPred.unlockThis")}
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Free skeleton ────────────────────────────────────────── */

function FreeSkeleton() {
  return (
    <div className="glass-card animate-pulse overflow-hidden p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 rounded bg-white/[0.06]" />
          <div className="h-5 w-56 rounded bg-white/[0.06]" />
          <div className="h-3 w-24 rounded bg-white/[0.06]" />
        </div>
        <div className="w-full max-w-[260px] space-y-2">
          <div className="h-3 w-full rounded-full bg-white/[0.06]" />
          <div className="h-2 w-2/3 rounded bg-white/[0.04]" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="h-10 w-16 rounded bg-white/[0.06]" />
          <div className="h-6 w-20 rounded-full bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

/* ── Unlock banner (primary CTA) ───────────────────────────── */

function UnlockBanner() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  const bullets = [
    t("matchPred.bannerBullet1"),
    t("matchPred.bannerBullet2"),
    t("matchPred.bannerBullet3"),
    t("matchPred.bannerBullet4"),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl border border-green-500/25 bg-gradient-to-br from-green-500/[0.12] via-emerald-500/[0.08] to-[#0a1220] p-6 shadow-2xl shadow-green-500/10 sm:p-10"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-[320px] w-[320px] rounded-full bg-green-500/[0.18] blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-[320px] w-[320px] rounded-full bg-emerald-500/[0.12] blur-[120px]" />

      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-green-300">
            <Lock className="h-3 w-3" />
            {t("matchPred.bannerBadge")}
          </div>
          <h2 className="text-balance break-words text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
            {t("matchPred.bannerTitle")}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300">
            {t("matchPred.bannerDesc")}
          </p>

          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-2 text-sm text-slate-200"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={loc("/checkout")}
              className="btn-gradient group inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-extrabold text-black shadow-xl shadow-green-500/30 transition-all hover:shadow-green-500/50"
            >
              {t("matchPred.bannerCta")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={loc("/checkout")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-7 py-3.5 text-sm font-bold text-white transition-all hover:border-green-500/40 hover:bg-green-500/[0.08]"
            >
              {t("matchPred.bannerCtaSecondary")}
            </Link>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {t("matchPred.bannerNote")}
          </p>
        </div>

        {/* Visual side — stacked stat cards */}
        <div className="relative hidden lg:block">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-xs">
            <div className="absolute left-0 top-0 w-[85%] rotate-[-4deg] rounded-2xl border border-white/[0.1] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Track record
                </span>
              </div>
              <p className="mt-2 text-3xl font-extrabold tabular-nums text-white">
                72.4<span className="text-lg text-slate-400">%</span>
              </p>
              <p className="text-[10px] text-slate-500">
                Rolling 30-day accuracy
              </p>
            </div>

            <div className="absolute right-0 top-[30%] w-[85%] rotate-[3deg] rounded-2xl border border-green-500/25 bg-gradient-to-br from-green-500/[0.14] to-emerald-500/[0.05] p-4 shadow-lg shadow-green-500/10 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-300">
                  Ensemble
                </span>
              </div>
              <p className="mt-2 text-3xl font-extrabold tabular-nums text-white">
                4<span className="text-lg text-slate-400"> models</span>
              </p>
              <p className="text-[10px] text-slate-400">
                Elo · Poisson · Logistic · XGBoost
              </p>
            </div>

            <div className="absolute bottom-0 left-[6%] w-[85%] rotate-[-2deg] rounded-2xl border border-white/[0.1] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Live edge
                </span>
              </div>
              <p className="mt-2 text-3xl font-extrabold tabular-nums text-white">
                +8.2<span className="text-lg text-slate-400">%</span>
              </p>
              <p className="text-[10px] text-slate-500">
                Avg vs closing line
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main page content ─────────────────────────────────────── */

export function MatchPredictionsContent() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  const fixturesQuery = useQuery({
    queryKey: ["match-predictions-public", 7],
    queryFn: () => api.getFixturesUpcoming(7),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    retry: 2,
  });

  const fixtures = fixturesQuery.data?.fixtures ?? [];

  // Only upcoming scheduled matches, sorted by kickoff ASC
  const upcoming = useMemo(() => {
    const now = Date.now();
    return fixtures
      .filter((f) => {
        if (f.status !== "scheduled") return false;
        const t = new Date(f.scheduled_at).getTime();
        return Number.isFinite(t) && t > now;
      })
      .sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime(),
      );
  }, [fixtures]);

  // Prefer matches that actually have predictions for the free 3
  const withPred = useMemo(
    () => upcoming.filter((f) => f.prediction !== null),
    [upcoming],
  );
  const withoutPred = useMemo(
    () => upcoming.filter((f) => f.prediction === null),
    [upcoming],
  );

  const free: Fixture[] = withPred.slice(0, FREE_PICKS);
  // Lock the next matches (prefer ones with predictions for realism)
  const lockedPool = [
    ...withPred.slice(FREE_PICKS),
    ...withoutPred,
  ].slice(0, LOCKED_PREVIEW);

  const isLoading = fixturesQuery.isLoading;
  const isError = fixturesQuery.isError;
  const hasFree = free.length > 0;

  const avgConf = useMemo(() => {
    if (free.length === 0) return null;
    const sum = free.reduce(
      (acc, f) => acc + (f.prediction?.confidence ?? 0),
      0,
    );
    return Math.round((sum / free.length) * 100);
  }, [free]);

  const stats = [
    {
      label: t("matchPred.statFree"),
      value: String(free.length || FREE_PICKS),
      icon: Sparkles,
      color: "#4ade80",
    },
    {
      label: t("matchPred.statUpcoming"),
      value: String(upcoming.length),
      icon: Clock,
      color: "#38bdf8",
    },
    {
      label: t("matchPred.statLocked"),
      value: String(
        Math.max(upcoming.length - free.length, LOCKED_PREVIEW),
      ),
      icon: Lock,
      color: "#f59e0b",
    },
    {
      label: t("matchPred.statAvgConf"),
      value: avgConf !== null ? `${avgConf}%` : "—",
      icon: TrendingUp,
      color: "#a855f7",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a1220] text-slate-100">
      <SiteNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pb-10 pt-28 sm:pt-32">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-green-500/[0.12] blur-[140px]" />
        <div className="pointer-events-none absolute -right-40 -top-20 h-[420px] w-[420px] rounded-full bg-emerald-500/[0.10] blur-[140px]" />

        <div className="relative mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-green-300"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t("matchPred.eyebrow")}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-5 text-balance break-words text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            {t("matchPred.title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-slate-300 sm:text-lg"
          >
            {t("matchPred.subtitle")}
          </motion.p>

          {/* Trust pills */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-slate-400"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
              <Zap className="h-3 w-3 text-green-400" />
              {t("matchPred.trust1")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
              <Activity className="h-3 w-3 text-blue-400" />
              {t("matchPred.trust2")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
              <Shield className="h-3 w-3 text-emerald-400" />
              {t("matchPred.trust3")}
            </span>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {stats.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="glass-card flex flex-col items-center justify-center gap-1 px-3 py-4 text-center"
              >
                <Icon className="h-4 w-4" style={{ color }} />
                <span className="mt-1 text-2xl font-extrabold leading-none tabular-nums text-white">
                  {value}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Free 3 predictions ── */}
      <section className="relative px-4 pb-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {t("matchPred.freeHeading")}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {t("matchPred.freeSub")}
              </p>
            </div>
            {fixturesQuery.isFetching && !isLoading && (
              <button
                type="button"
                onClick={() => fixturesQuery.refetch()}
                className="hidden items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition hover:border-green-500/40 hover:text-green-300 sm:inline-flex"
              >
                <RefreshCw className="h-3 w-3 animate-spin" />
                {t("matchPred.refresh")}
              </button>
            )}
          </div>

          {isLoading && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: FREE_PICKS }).map((_, i) => (
                <FreeSkeleton key={i} />
              ))}
            </div>
          )}

          {!isLoading && isError && (
            <div className="glass-card flex flex-col items-start gap-3 border-amber-500/30 bg-amber-500/[0.06] p-6 sm:flex-row sm:items-center">
              <AlertTriangle className="h-6 w-6 shrink-0 text-amber-400" />
              <div className="flex-1">
                <p className="font-bold text-amber-300">
                  {t("matchPred.errorTitle")}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {t("matchPred.errorDesc")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => fixturesQuery.refetch()}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t("matchPred.refresh")}
              </button>
            </div>
          )}

          {!isLoading && !isError && !hasFree && (
            <div className="glass-card flex flex-col items-center gap-4 p-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-green-500/25 bg-green-500/10">
                <Clock className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">
                  {t("matchPred.emptyTitle")}
                </h3>
                <p className="mt-1 max-w-md text-sm text-slate-400">
                  {t("matchPred.emptyDesc")}
                </p>
              </div>
              <Link
                href={loc("/track-record")}
                className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/[0.08] px-5 py-2.5 text-xs font-bold text-green-300 transition hover:border-green-500/50 hover:bg-green-500/[0.15]"
              >
                <Eye className="h-3.5 w-3.5" />
                {t("matchPred.emptyCta")}
              </Link>
            </div>
          )}

          {!isLoading && hasFree && (
            <div className="flex flex-col gap-3">
              {free.map((f) => (
                <FreeMatchCard key={f.id} fixture={f} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Unlock banner ── */}
      <section className="relative px-4 pb-12">
        <div className="mx-auto max-w-5xl">
          <UnlockBanner />
        </div>
      </section>

      {/* ── Locked pool ── */}
      <section className="relative px-4 pb-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5">
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {t("matchPred.lockedHeading")}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {t("matchPred.lockedSub")}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {lockedPool.length > 0
              ? lockedPool.map((f) => (
                  <LockedMatchCard key={f.id} fixture={f} />
                ))
              : Array.from({ length: LOCKED_PREVIEW }).map((_, i) => (
                  <LockedSkeleton key={i} />
                ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-8 text-center shadow-2xl sm:p-12"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-green-500/[0.08] via-transparent to-emerald-500/[0.06]" />
          <div className="relative z-10">
            <h2 className="text-balance break-words text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {t("matchPred.ctaFinalTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
              {t("matchPred.ctaFinalDesc")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={loc("/checkout")}
                className="btn-gradient group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-extrabold text-black shadow-xl shadow-green-500/30 transition-all hover:shadow-green-500/50"
              >
                {t("matchPred.ctaFinalButton")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={loc("/checkout")}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-8 py-4 text-sm font-bold text-white transition-all hover:border-green-500/40 hover:bg-green-500/[0.08]"
              >
                {t("matchPred.ctaFinalSecondary")}
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <BetsPlugFooter />
    </div>
  );
}
