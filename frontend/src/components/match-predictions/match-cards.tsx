"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Clock, Lock } from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import type { Fixture } from "@/types/api";
import { ProbBar } from "./prob-bar";
import { confColor, confLevel, formatKickoff } from "./shared";

/* ── Free (unlocked) match card ────────────────────────────── */

export function FreeMatchCard({ fixture }: { fixture: Fixture }) {
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
          <span className="truncate text-[11px] font-semibold uppercase tracking-widest text-green-600">
            {fixture.league_name}
          </span>
          <p className="flex flex-wrap items-center gap-x-1.5 text-base font-extrabold leading-tight text-slate-900 sm:text-lg">
            {fixture.home_team_logo && (
              <Image src={fixture.home_team_logo} alt="" width={22} height={22} className="inline-block rounded-full" />
            )}
            <span className="break-words">{fixture.home_team_name}</span>
            <span className="font-normal text-slate-500">vs</span>
            {fixture.away_team_logo && (
              <Image src={fixture.away_team_logo} alt="" width={22} height={22} className="inline-block rounded-full" />
            )}
            <span className="break-words">{fixture.away_team_name}</span>
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
            <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
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
            <span className="text-xs italic text-slate-500"> - </span>
          )}
        </div>
      </div>

      {/* v6: pre-match odds row. Rendered only when backend returned
          an `odds` object. No placeholder when null — we'd rather
          hide the row than show fake data. */}
      {fixture.odds &&
        (fixture.odds.home != null ||
          fixture.odds.draw != null ||
          fixture.odds.away != null) && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2 sm:px-5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Pre-match odds
            </span>
            {fixture.odds.home != null && (
              <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-700">
                1 {fixture.odds.home.toFixed(2)}
              </span>
            )}
            {fixture.odds.draw != null && (
              <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-700">
                X {fixture.odds.draw.toFixed(2)}
              </span>
            )}
            {fixture.odds.away != null && (
              <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-700">
                2 {fixture.odds.away.toFixed(2)}
              </span>
            )}
            {fixture.odds.over_2_5 != null && fixture.odds.under_2_5 != null && (
              <span className="ml-auto text-[10px] text-slate-500">
                O/U 2.5: {fixture.odds.over_2_5.toFixed(2)} /{" "}
                {fixture.odds.under_2_5.toFixed(2)}
              </span>
            )}
          </div>
        )}
    </motion.div>
  );
}

/* ── Locked (blurred) match card ───────────────────────────── */

export function LockedMatchCard({ fixture }: { fixture: Fixture }) {
  const { t, locale } = useTranslations();
  const loc = useLocalizedHref();

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* Blurred content underneath */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none p-4 blur-[6px] sm:p-5"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="truncate text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              {fixture.league_name}
            </span>
            <p className="flex flex-wrap items-center gap-x-1.5 text-base font-semibold leading-tight text-slate-900">
              {fixture.home_team_logo && (
                <Image src={fixture.home_team_logo} alt="" width={22} height={22} className="inline-block rounded-full" />
              )}
              <span className="break-words">{fixture.home_team_name}</span>
              <span className="font-normal text-slate-600">vs</span>
              {fixture.away_team_logo && (
                <Image src={fixture.away_team_logo} alt="" width={22} height={22} className="inline-block rounded-full" />
              )}
              <span className="break-words">{fixture.away_team_name}</span>
            </p>
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {formatKickoff(fixture.scheduled_at, locale)}
              </span>
            </p>
          </div>
          <div className="w-full min-w-0 lg:max-w-[260px]">
            <div className="mb-2 h-2.5 rounded bg-slate-100" />
            <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100">
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
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/70 via-white/50 to-white/80 backdrop-blur-[2px]">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-green-200 bg-green-50 shadow-sm ring-1 ring-green-200">
            <Lock className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-green-700">
            {t("matchPred.lockedLabel")}
          </p>
          <Link
            href={loc("/checkout")}
            className="btn-gradient rounded-full px-4 py-1.5 text-[11px] font-extrabold text-white shadow-lg shadow-green-500/30 transition-all hover:shadow-green-500/50"
          >
            {t("matchPred.unlockThis")}
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Locked skeleton (for when we don't have enough real fixtures) ── */

export function LockedSkeleton() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div aria-hidden="true" className="p-5 blur-[6px]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 rounded bg-slate-100" />
            <div className="h-5 w-56 rounded bg-slate-100" />
            <div className="h-3 w-24 rounded bg-slate-100" />
          </div>
          <div className="w-full max-w-[260px] space-y-2">
            <div className="h-3 w-full rounded-full bg-slate-100" />
            <div className="h-2 w-2/3 rounded bg-slate-50" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="h-10 w-16 rounded bg-slate-100" />
            <div className="h-6 w-20 rounded-full bg-slate-50" />
          </div>
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/70 via-white/50 to-white/80 backdrop-blur-[2px]">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-green-200 bg-green-50 ring-1 ring-green-200">
            <Lock className="h-4 w-4 text-green-600" />
          </div>
          <Link
            href={loc("/checkout")}
            className="btn-gradient rounded-full px-4 py-1.5 text-[11px] font-extrabold text-white shadow-lg shadow-green-500/30"
          >
            {t("matchPred.unlockThis")}
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Free skeleton ────────────────────────────────────────── */

export function FreeSkeleton() {
  return (
    <div className="glass-card animate-pulse overflow-hidden p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 rounded bg-slate-100" />
          <div className="h-5 w-56 rounded bg-slate-100" />
          <div className="h-3 w-24 rounded bg-slate-100" />
        </div>
        <div className="w-full max-w-[260px] space-y-2">
          <div className="h-3 w-full rounded-full bg-slate-100" />
          <div className="h-2 w-2/3 rounded bg-slate-50" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="h-10 w-16 rounded bg-slate-100" />
          <div className="h-6 w-20 rounded-full bg-slate-50" />
        </div>
      </div>
    </div>
  );
}
