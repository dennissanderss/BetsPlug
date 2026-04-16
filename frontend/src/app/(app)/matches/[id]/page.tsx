"use client";

/**
 * /matches/[id] — rich match detail page (NOCTURNE styled).
 *
 * Three API calls:
 *   GET /api/matches/{id}              → Match (header data)
 *   GET /api/matches/{id}/analysis     → MatchAnalysis (form, H2H, stats)
 *   GET /api/matches/{id}/forecast     → ForecastOutput (AI forecast)
 *
 * Everything is rendered in the NOCTURNE design language: card-neon
 * gradient-border panels, HexBadge icon frames, Pills/DataChips for
 * data, ambient glow blobs, logo-green as the primary accent.
 */

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Target,
  TrendingUp,
  Shield,
  Activity,
  BarChart2,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";

import { api } from "@/lib/api";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import type {
  Match,
  MatchAnalysis,
  ForecastOutput,
  TeamForm,
} from "@/types/api";

import { HexBadge } from "@/components/noct/hex-badge";
import { Pill, DataChip, TrustScore } from "@/components/noct/pill";

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */

function formatKickoff(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleString(locale || "en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatTime(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleTimeString(locale || "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale || "en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function formatPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function confColor(conf: number): string {
  // 0-0.55 red, 0.55-0.65 amber, 0.65+ green
  if (conf >= 0.65) return "#4ade80";
  if (conf >= 0.55) return "#fbbf24";
  return "#f87171";
}

/* ─────────────────────────────────────────────────────────────
   Team-logo fallback (initials badge)
   ───────────────────────────────────────────────────────────── */

function TeamLogoBlock({
  src,
  name,
  size = 56,
}: {
  src: string | null | undefined;
  name: string;
  size?: number;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full bg-white/[0.05] object-contain"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-sm font-bold text-[#a3a9b8]"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Form letter badge (W/D/L) — NOCTURNE Pills
   ───────────────────────────────────────────────────────────── */

function FormLetter({ r }: { r: string }) {
  const tone: "win" | "draw" | "loss" | "default" =
    r === "W" ? "win" : r === "D" ? "draw" : r === "L" ? "loss" : "default";
  return (
    <span
      className={
        "inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold " +
        (tone === "win"
          ? "bg-[#4ade80]/15 text-[#86efac] ring-1 ring-[#4ade80]/30"
          : tone === "draw"
          ? "bg-[#fbbf24]/15 text-[#fbbf24] ring-1 ring-[#fbbf24]/30"
          : tone === "loss"
          ? "bg-[#f87171]/15 text-[#f87171] ring-1 ring-[#f87171]/30"
          : "bg-white/[0.05] text-[#6b7280]")
      }
    >
      {r}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   Header card — teams + score/VS + kickoff + venue + league
   ───────────────────────────────────────────────────────────── */

function MatchHeader({ match, locale }: { match: Match; locale: string }) {
  const isFinished = match.status === "finished";
  const isLive = match.status === "live";
  const scheduled = isLive || isFinished;

  const winner = match.result?.winner ?? null;

  return (
    <div className="card-neon card-neon-green halo-green">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-[320px] w-[320px] rounded-full"
        style={{ background: "hsl(var(--accent-green) / 0.18)", filter: "blur(130px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -bottom-24 h-[280px] w-[280px] rounded-full"
        style={{ background: "hsl(var(--accent-purple) / 0.14)", filter: "blur(120px)" }}
      />

      <div className="relative p-5 sm:p-7">
        {/* Top row: league / status / matchday */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="section-label">
            <Sparkles className="h-3 w-3" />
            Match Preview
          </span>
          {match.round_name && (
            <Pill tone="default" className="!text-[10px]">
              {match.round_name}
            </Pill>
          )}
          {match.matchday && (
            <Pill tone="default" className="!text-[10px]">
              MD {match.matchday}
            </Pill>
          )}
          {isLive && (
            <Pill tone="default" className="inline-flex items-center gap-1.5 !text-[10px]">
              <span className="live-dot-red" />
              LIVE
            </Pill>
          )}
          {isFinished && (
            <Pill tone="default" className="!text-[10px]">
              Full Time
            </Pill>
          )}
        </div>

        {/* Teams row */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
          {/* Home */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-end sm:text-right">
            <TeamLogoBlock
              src={match.home_team_logo}
              name={match.home_team_name}
              size={64}
            />
            <div className="min-w-0">
              <p className="text-base font-bold leading-tight text-[#ededed] sm:text-xl">
                {match.home_team_name}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[#6b7280]">
                Home
              </p>
              {winner === "home" && (
                <Pill tone="win" className="mt-1.5 !text-[10px] inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Winner
                </Pill>
              )}
            </div>
          </div>

          {/* Center — score or kickoff */}
          <div className="flex flex-col items-center">
            {scheduled && match.result ? (
              <>
                <div className="flex items-center gap-3 sm:gap-5">
                  <span className="text-stat text-5xl text-[#ededed] sm:text-6xl tabular-nums">
                    {match.result.home_score}
                  </span>
                  <span className="text-lg font-semibold text-[#6b7280]">-</span>
                  <span className="text-stat text-5xl text-[#ededed] sm:text-6xl tabular-nums">
                    {match.result.away_score}
                  </span>
                </div>
                {match.result.home_score_ht != null &&
                  match.result.away_score_ht != null && (
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-[#6b7280]">
                      HT {match.result.home_score_ht}-{match.result.away_score_ht}
                    </p>
                  )}
              </>
            ) : (
              <>
                <span className="text-sm font-semibold uppercase tracking-widest text-[#6b7280]">
                  VS
                </span>
                <span className="mt-1 text-stat text-2xl text-[#ededed]">
                  {formatTime(match.scheduled_at, locale)}
                </span>
              </>
            )}
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:text-left">
            <TeamLogoBlock
              src={match.away_team_logo}
              name={match.away_team_name}
              size={64}
            />
            <div className="min-w-0">
              <p className="text-base font-bold leading-tight text-[#ededed] sm:text-xl">
                {match.away_team_name}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[#6b7280]">
                Away
              </p>
              {winner === "away" && (
                <Pill tone="win" className="mt-1.5 !text-[10px] inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Winner
                </Pill>
              )}
            </div>
          </div>
        </div>

        {/* Meta row: date + venue */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-white/[0.06] pt-4">
          <Pill tone="default" className="inline-flex items-center gap-1.5 !text-[11px]">
            <Calendar className="h-3 w-3" />
            {formatDate(match.scheduled_at, locale)}
          </Pill>
          <Pill tone="default" className="inline-flex items-center gap-1.5 !text-[11px]">
            <Clock className="h-3 w-3" />
            {formatTime(match.scheduled_at, locale)}
          </Pill>
          {match.venue && (
            <Pill tone="default" className="inline-flex items-center gap-1.5 !text-[11px]">
              <MapPin className="h-3 w-3" />
              {match.venue}
            </Pill>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Probability bar — NOCTURNE variant, highlighted pick
   ───────────────────────────────────────────────────────────── */

function ProbBar({
  home,
  draw,
  away,
  homeName,
  awayName,
}: {
  home: number;
  draw: number | null;
  away: number;
  homeName: string;
  awayName: string;
}) {
  const total = home + (draw ?? 0) + away || 1;
  const hp = (home / total) * 100;
  const dp = ((draw ?? 0) / total) * 100;
  const ap = (away / total) * 100;

  const highest = Math.max(home, draw ?? 0, away);
  const pickSide: "home" | "draw" | "away" =
    highest === home ? "home" : highest === away ? "away" : "draw";

  return (
    <div>
      {/* Segmented bar */}
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className="h-full rounded-l-full transition-all"
          style={{
            width: `${hp}%`,
            background:
              pickSide === "home"
                ? "linear-gradient(90deg, #22c55e, #4ade80)"
                : "rgba(74,222,128,0.40)",
            boxShadow: pickSide === "home" ? "0 0 14px rgba(74,222,128,0.4)" : undefined,
          }}
        />
        {draw != null && dp > 0 && (
          <div
            className="h-full transition-all"
            style={{
              width: `${dp}%`,
              background:
                pickSide === "draw"
                  ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                  : "rgba(251,191,36,0.35)",
              boxShadow: pickSide === "draw" ? "0 0 14px rgba(251,191,36,0.35)" : undefined,
            }}
          />
        )}
        <div
          className="h-full rounded-r-full transition-all"
          style={{
            width: `${ap}%`,
            background:
              pickSide === "away"
                ? "linear-gradient(90deg, #a855f7, #d946ef)"
                : "rgba(168,85,247,0.35)",
            boxShadow: pickSide === "away" ? "0 0 14px rgba(168,85,247,0.35)" : undefined,
          }}
        />
      </div>

      {/* Legend */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <DataChip tone={pickSide === "home" ? "win" : "default"}>
            {Math.round(home * 100)}%
          </DataChip>
          <p className="mt-1 truncate text-[10px] uppercase tracking-wider text-[#a3a9b8]">
            {homeName}
          </p>
        </div>
        <div>
          {draw != null ? (
            <>
              <DataChip tone={pickSide === "draw" ? "win" : "default"}>
                {Math.round(draw * 100)}%
              </DataChip>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-[#a3a9b8]">
                Draw
              </p>
            </>
          ) : (
            <>
              <DataChip tone="default">—</DataChip>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-[#6b7280]">
                No draw
              </p>
            </>
          )}
        </div>
        <div>
          <DataChip tone={pickSide === "away" ? "win" : "default"}>
            {Math.round(away * 100)}%
          </DataChip>
          <p className="mt-1 truncate text-[10px] uppercase tracking-wider text-[#a3a9b8]">
            {awayName}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Team form card — last 5 + simple stats
   ───────────────────────────────────────────────────────────── */

function TeamFormCard({
  teamName,
  form,
  variant,
}: {
  teamName: string;
  form: TeamForm;
  variant: "green" | "purple";
}) {
  return (
    <div className={`card-neon card-neon-${variant} p-5`}>
      <div className="relative">
        <div className="flex items-center gap-2.5">
          <HexBadge variant={variant} size="sm" noGlow>
            <Activity className="h-4 w-4" />
          </HexBadge>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-[#a3a9b8]">
              Recent Form
            </p>
            <p className="text-sm font-bold text-[#ededed] truncate">{teamName}</p>
          </div>
        </div>

        {/* Last-5 strip */}
        <div className="mt-4">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-[#6b7280]">
            Last 5
          </p>
          <div className="flex items-center gap-1.5">
            {form.last_5.length === 0 ? (
              <span className="text-xs italic text-[#6b7280]">No data</span>
            ) : (
              form.last_5.slice(0, 5).map((r, i) => <FormLetter key={i} r={r} />)
            )}
          </div>
        </div>

        {/* W/D/L + goals — 3-up */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-2 text-center">
            <p className="text-stat text-lg text-[#ededed] tabular-nums">
              {form.wins}-{form.draws}-{form.losses}
            </p>
            <p className="mt-0.5 text-[9px] uppercase tracking-wider text-[#6b7280]">
              W-D-L
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-2 text-center">
            <p className="text-stat text-lg text-[#4ade80] tabular-nums">
              {form.goals_scored}
            </p>
            <p className="mt-0.5 text-[9px] uppercase tracking-wider text-[#6b7280]">
              Scored
            </p>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-2 text-center">
            <p className="text-stat text-lg text-[#f87171] tabular-nums">
              {form.goals_conceded}
            </p>
            <p className="mt-0.5 text-[9px] uppercase tracking-wider text-[#6b7280]">
              Conceded
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   H2H card — aggregate wins/draws/losses + summary
   ───────────────────────────────────────────────────────────── */

function H2HCard({
  h2h,
  homeName,
  awayName,
}: {
  h2h: MatchAnalysis["head_to_head"];
  homeName: string;
  awayName: string;
}) {
  const total = h2h.total || 0;
  const homeWinPct = total ? Math.round((h2h.home_wins / total) * 100) : 0;
  const drawPct = total ? Math.round((h2h.draws / total) * 100) : 0;
  const awayWinPct = total ? Math.round((h2h.away_wins / total) * 100) : 0;

  return (
    <div className="card-neon card-neon-blue p-5">
      <div className="relative">
        <div className="flex items-center gap-2.5">
          <HexBadge variant="blue" size="sm" noGlow>
            <Shield className="h-4 w-4" />
          </HexBadge>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#a3a9b8]">
              Head-to-Head
            </p>
            <p className="text-sm font-bold text-[#ededed]">
              {total > 0 ? `Last ${total} meetings` : "No history"}
            </p>
          </div>
        </div>

        {total > 0 ? (
          <>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                <p className="text-stat text-2xl text-[#4ade80] tabular-nums">
                  {h2h.home_wins}
                </p>
                <p className="mt-1 text-[9px] uppercase tracking-wider text-[#6b7280] truncate">
                  {homeName} wins
                </p>
                <p className="mt-0.5 text-[10px] text-[#a3a9b8] tabular-nums">
                  {homeWinPct}%
                </p>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                <p className="text-stat text-2xl text-[#fbbf24] tabular-nums">
                  {h2h.draws}
                </p>
                <p className="mt-1 text-[9px] uppercase tracking-wider text-[#6b7280]">
                  Draws
                </p>
                <p className="mt-0.5 text-[10px] text-[#a3a9b8] tabular-nums">
                  {drawPct}%
                </p>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                <p className="text-stat text-2xl text-[#d946ef] tabular-nums">
                  {h2h.away_wins}
                </p>
                <p className="mt-1 text-[9px] uppercase tracking-wider text-[#6b7280] truncate">
                  {awayName} wins
                </p>
                <p className="mt-0.5 text-[10px] text-[#a3a9b8] tabular-nums">
                  {awayWinPct}%
                </p>
              </div>
            </div>

            {h2h.summary && (
              <p className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs leading-relaxed text-[#a3a9b8]">
                {h2h.summary}
              </p>
            )}
          </>
        ) : (
          <p className="mt-4 text-xs italic text-[#6b7280]">
            The teams haven&apos;t met in our recorded history.
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Confidence meter — large NOCTURNE stat
   ───────────────────────────────────────────────────────────── */

function ConfidenceBlock({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = confColor(confidence);
  const trust = Math.max(1, Math.min(10, Math.round(confidence * 10)));

  return (
    <div className="card-neon card-neon-green p-5">
      <div className="relative flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <HexBadge variant="green" size="sm" noGlow>
              <Target className="h-4 w-4" />
            </HexBadge>
            <p className="text-[10px] uppercase tracking-wider text-[#a3a9b8]">
              Confidence
            </p>
          </div>
          <p
            className="mt-2 text-stat text-4xl tabular-nums leading-none"
            style={{ color }}
          >
            {pct}
            <span className="text-lg font-semibold">%</span>
          </p>
          <p className="mt-1 text-[11px] text-[#6b7280]">
            How sure our AI is about this pick
          </p>
        </div>
        <TrustScore value={trust} max={10} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Predicted score — from ForecastOutput
   ───────────────────────────────────────────────────────────── */

function PredictedScoreBlock({
  forecast,
  homeName,
  awayName,
}: {
  forecast: ForecastOutput;
  homeName: string;
  awayName: string;
}) {
  const h = forecast.predicted_home_score;
  const a = forecast.predicted_away_score;
  if (h == null || a == null) return null;

  return (
    <div className="card-neon card-neon-purple p-5">
      <div className="relative">
        <div className="flex items-center gap-2">
          <HexBadge variant="purple" size="sm" noGlow>
            <BarChart2 className="h-4 w-4" />
          </HexBadge>
          <p className="text-[10px] uppercase tracking-wider text-[#a3a9b8]">
            Predicted Scoreline
          </p>
        </div>
        <div className="mt-3 flex items-center justify-center gap-4">
          <div className="min-w-0 text-right">
            <p className="text-[10px] uppercase tracking-wider text-[#6b7280] truncate">
              {homeName}
            </p>
            <p className="text-stat text-4xl text-[#ededed] tabular-nums">
              {h.toFixed(1)}
            </p>
          </div>
          <span className="text-sm text-[#6b7280]">-</span>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-[#6b7280] truncate">
              {awayName}
            </p>
            <p className="text-stat text-4xl text-[#ededed] tabular-nums">
              {a.toFixed(1)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Key factors — from forecast explanation
   ───────────────────────────────────────────────────────────── */

function FactorsBlock({ forecast }: { forecast: ForecastOutput }) {
  const ex = forecast.explanation;
  if (!ex) return null;

  const positives = Object.entries(ex.top_factors_for ?? {}).slice(0, 5);
  const negatives = Object.entries(ex.top_factors_against ?? {}).slice(0, 5);

  if (positives.length === 0 && negatives.length === 0) return null;

  return (
    <div className="card-neon p-5">
      <div className="relative">
        <div className="flex items-center gap-2">
          <HexBadge variant="blue" size="sm" noGlow>
            <TrendingUp className="h-4 w-4" />
          </HexBadge>
          <p className="text-[10px] uppercase tracking-wider text-[#a3a9b8]">
            Why the AI picks this
          </p>
        </div>

        {ex.summary && (
          <p className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs leading-relaxed text-[#cbd3e0]">
            {ex.summary}
          </p>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {positives.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#86efac]">
                Supporting factors
              </p>
              <ul className="space-y-1.5">
                {positives.map(([k, v]) => (
                  <li
                    key={k}
                    className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-1.5"
                  >
                    <span className="text-xs text-[#cbd3e0] truncate">{k}</span>
                    <Pill tone="win" className="!text-[10px] tabular-nums">
                      +{formatPct(Math.abs(v))}
                    </Pill>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {negatives.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#fca5a5]">
                Opposing factors
              </p>
              <ul className="space-y-1.5">
                {negatives.map(([k, v]) => (
                  <li
                    key={k}
                    className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-1.5"
                  >
                    <span className="text-xs text-[#cbd3e0] truncate">{k}</span>
                    <Pill tone="loss" className="!text-[10px] tabular-nums">
                      −{formatPct(Math.abs(v))}
                    </Pill>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Pill-style tabs (NOCTURNE)
   ───────────────────────────────────────────────────────────── */

type TabKey = "overview" | "form" | "h2h";

function TabStrip({
  value,
  onChange,
  hasForecast,
}: {
  value: TabKey;
  onChange: (k: TabKey) => void;
  hasForecast: boolean;
}) {
  const tabs: Array<{ key: TabKey; label: string; icon: typeof TrendingUp }> = [
    { key: "overview", label: "Overview", icon: TrendingUp },
    { key: "form", label: "Form", icon: Activity },
    { key: "h2h", label: "Head-to-Head", icon: Shield },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={
              "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-all " +
              (active
                ? "border-[#4ade80]/40 bg-[#4ade80]/10 text-[#86efac] shadow-[0_0_18px_rgba(74,222,128,0.18)]"
                : "border-white/[0.08] bg-white/[0.03] text-[#a3a9b8] hover:border-white/[0.16] hover:text-[#ededed]")
            }
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {tab.key === "overview" && hasForecast && (
              <span className="ml-0.5 rounded-full bg-[#4ade80]/20 px-1.5 text-[9px] font-bold text-[#86efac]">
                AI
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Skeletons
   ───────────────────────────────────────────────────────────── */

function HeaderSkeleton() {
  return (
    <div className="card-neon animate-pulse p-5 sm:p-7">
      <div className="relative space-y-4">
        <div className="h-4 w-32 rounded bg-white/[0.05]" />
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex items-center justify-end gap-3">
            <div className="h-16 w-16 rounded-full bg-white/[0.05]" />
            <div className="h-5 w-24 rounded bg-white/[0.05]" />
          </div>
          <div className="h-10 w-16 rounded bg-white/[0.05]" />
          <div className="flex items-center gap-3">
            <div className="h-5 w-24 rounded bg-white/[0.05]" />
            <div className="h-16 w-16 rounded-full bg-white/[0.05]" />
          </div>
        </div>
        <div className="flex justify-center gap-2">
          <div className="h-5 w-24 rounded-full bg-white/[0.05]" />
          <div className="h-5 w-24 rounded-full bg-white/[0.05]" />
        </div>
      </div>
    </div>
  );
}

function BlockSkeleton() {
  return (
    <div className="card-neon animate-pulse p-5">
      <div className="relative space-y-3">
        <div className="h-4 w-32 rounded bg-white/[0.05]" />
        <div className="h-8 w-full rounded bg-white/[0.05]" />
        <div className="h-16 w-full rounded bg-white/[0.05]" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────── */

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = (params?.id as string) || "";
  const { locale } = useTranslations();
  const lHref = useLocalizedHref();

  const [tab, setTab] = useState<TabKey>("overview");

  const { data: match, isLoading: matchLoading, error: matchError } = useQuery({
    queryKey: ["match", matchId],
    queryFn: () => api.getMatch(matchId),
    enabled: Boolean(matchId),
  });

  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: ["match-analysis", matchId],
    queryFn: () => api.getMatchAnalysis(matchId),
    enabled: Boolean(matchId),
  });

  const { data: forecast, isLoading: forecastLoading } = useQuery({
    queryKey: ["match-forecast", matchId],
    queryFn: () => api.getMatchForecast(matchId),
    enabled: Boolean(matchId),
    retry: false,
  });

  const hasForecast = !forecastLoading && forecast !== undefined;
  const displayMatch = analysis?.match ?? match;

  if (matchError) {
    return (
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8">
        <div className="card-neon p-8">
          <div className="relative text-center">
            <HexBadge variant="purple" size="md" noGlow>
              <XCircle className="h-5 w-5" />
            </HexBadge>
            <p className="mt-4 text-sm font-semibold text-[#ededed]">
              Failed to load match data
            </p>
            <p className="mt-1 text-xs text-[#a3a9b8]">
              {matchError instanceof Error ? matchError.message : "Unknown error"}
            </p>
            <Link
              href={lHref("/dashboard")}
              className="btn-glass mt-4 inline-flex items-center gap-1.5 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full"
        style={{ background: "hsl(var(--accent-green) / 0.15)", filter: "blur(140px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-40 -right-24 h-[360px] w-[360px] rounded-full"
        style={{ background: "hsl(var(--accent-purple) / 0.12)", filter: "blur(140px)" }}
      />

      <div className="relative space-y-6">
        {/* Back link */}
        <Link
          href={lHref("/dashboard")}
          className="btn-ghost inline-flex items-center gap-1.5 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>

        {/* Header */}
        {matchLoading && !displayMatch ? (
          <HeaderSkeleton />
        ) : displayMatch ? (
          <MatchHeader match={displayMatch} locale={locale} />
        ) : null}

        {/* Tabs */}
        <TabStrip value={tab} onChange={setTab} hasForecast={hasForecast} />

        {/* ── Overview tab ── */}
        {tab === "overview" && (
          <div className="space-y-5">
            {forecast ? (
              <div className="card-neon p-5">
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <HexBadge variant="green" size="sm" noGlow>
                      <Target className="h-4 w-4" />
                    </HexBadge>
                    <p className="text-[10px] uppercase tracking-wider text-[#a3a9b8]">
                      Win Probabilities
                    </p>
                  </div>
                  <div className="mt-4">
                    <ProbBar
                      home={forecast.home_win_prob}
                      draw={forecast.draw_prob}
                      away={forecast.away_win_prob}
                      homeName={displayMatch?.home_team_name ?? "Home"}
                      awayName={displayMatch?.away_team_name ?? "Away"}
                    />
                  </div>
                </div>
              </div>
            ) : forecastLoading ? (
              <BlockSkeleton />
            ) : null}

            <div className="grid gap-5 md:grid-cols-2">
              {forecast ? (
                <ConfidenceBlock confidence={forecast.confidence} />
              ) : forecastLoading ? (
                <BlockSkeleton />
              ) : null}
              {forecast && displayMatch ? (
                <PredictedScoreBlock
                  forecast={forecast}
                  homeName={displayMatch.home_team_name}
                  awayName={displayMatch.away_team_name}
                />
              ) : null}
            </div>

            {forecast && <FactorsBlock forecast={forecast} />}

            {!forecast && !forecastLoading && (
              <div className="card-neon p-8">
                <div className="relative text-center">
                  <HexBadge variant="blue" size="md" noGlow>
                    <BarChart2 className="h-5 w-5" />
                  </HexBadge>
                  <p className="mt-4 text-sm font-semibold text-[#ededed]">
                    No forecast yet
                  </p>
                  <p className="mt-1 text-xs text-[#a3a9b8]">
                    Our AI hasn&apos;t published a forecast for this fixture. Check back closer to kick-off.
                  </p>
                </div>
              </div>
            )}

            {forecast?.disclaimer && (
              <p className="px-2 text-[10px] italic leading-relaxed text-[#6b7280]">
                {forecast.disclaimer}
              </p>
            )}
          </div>
        )}

        {/* ── Form tab ── */}
        {tab === "form" && (
          <div className="space-y-5">
            {analysisLoading ? (
              <>
                <BlockSkeleton />
                <BlockSkeleton />
              </>
            ) : analysis ? (
              <div className="grid gap-5 md:grid-cols-2">
                <TeamFormCard
                  teamName={analysis.match.home_team_name}
                  form={analysis.home_team_form}
                  variant="green"
                />
                <TeamFormCard
                  teamName={analysis.match.away_team_name}
                  form={analysis.away_team_form}
                  variant="purple"
                />
              </div>
            ) : (
              <div className="card-neon p-8">
                <div className="relative text-center text-xs text-[#a3a9b8]">
                  No form data available for this match.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── H2H tab ── */}
        {tab === "h2h" && (
          <div className="space-y-5">
            {analysisLoading ? (
              <BlockSkeleton />
            ) : analysis ? (
              <H2HCard
                h2h={analysis.head_to_head}
                homeName={analysis.match.home_team_name}
                awayName={analysis.match.away_team_name}
              />
            ) : (
              <div className="card-neon p-8">
                <div className="relative text-center text-xs text-[#a3a9b8]">
                  No head-to-head data available.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
