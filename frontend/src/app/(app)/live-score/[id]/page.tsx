"use client";

/**
 * /live-score/[id] — pure live-score match detail.
 *
 * Deliberately prediction-free: no AI probabilities, no confidence,
 * no predicted scoreline. Shows everything the API integrations
 * already give us about a match: score + minute, events, lineups,
 * recent form and head-to-head.
 *
 * Uses the same NOCTURNE design primitives as /matches/[id] so the
 * chrome stays consistent, but strips the prediction blocks + the
 * "Overview" (AI) tab.
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
  Shield,
  Activity,
  CheckCircle2,
  XCircle,
  Sparkles,
  Users,
  ListOrdered,
  Goal,
  Square,
  RefreshCw,
  UserRound,
} from "lucide-react";

import { api } from "@/lib/api";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import type {
  Fixture,
  FixtureAnalysis,
  FixtureEvent,
  LineupPlayer,
  TeamLineup,
  TeamForm,
} from "@/types/api";

import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { formatLiveMinute } from "@/components/match-predictions/shared";

/* ─── Helpers ───────────────────────────────────────────────── */

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

/* ─── Team logo with initials fallback ──────────────────────── */

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

/* ─── W/D/L letter ──────────────────────────────────────────── */

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

/* ─── Header card ──────────────────────────────────────────── */

function MatchHeader({ match, locale }: { match: Fixture; locale: string }) {
  const isFinished = match.status === "finished";
  const isLive = match.status === "live";
  const scheduled = isLive || isFinished;
  const winner = match.result?.winner ?? null;

  return (
    <div className="card-neon card-neon-green halo-green">
      <div className="relative p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="section-label">
            <Sparkles className="h-3 w-3" />
            {match.league_name ?? "Match"}
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
            <Pill
              tone="default"
              className="inline-flex items-center gap-1.5 !text-[10px] tabular-nums"
            >
              <span className="live-dot-red" />
              {formatLiveMinute(match.live_score) ?? "LIVE"}
            </Pill>
          )}
          {isFinished && (
            <Pill tone="default" className="!text-[10px]">
              Full Time
            </Pill>
          )}
          {match.status === "scheduled" && (
            <Pill tone="default" className="!text-[10px]">
              {formatTime(match.scheduled_at, locale)}
            </Pill>
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6">
          <div className="flex flex-col items-center gap-2 text-center sm:gap-3 sm:flex-row sm:justify-end sm:text-right">
            <TeamLogoBlock
              src={match.home_team_logo}
              name={match.home_team_name}
              size={48}
            />
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight text-[#ededed] sm:text-xl break-words">
                {match.home_team_name}
              </p>
              <p className="mt-0.5 text-[9px] uppercase tracking-wider text-[#6b7280] sm:text-[10px]">
                Home
              </p>
              {winner === "home" && (
                <Pill
                  tone="win"
                  className="mt-1.5 !text-[10px] inline-flex items-center gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Winner
                </Pill>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center px-1">
            {scheduled && match.result ? (
              <>
                <div className="flex items-center gap-2 sm:gap-5">
                  <span className="text-stat text-3xl text-[#ededed] sm:text-6xl tabular-nums">
                    {match.result.home_score}
                  </span>
                  <span className="text-base font-semibold text-[#6b7280] sm:text-lg">
                    -
                  </span>
                  <span className="text-stat text-3xl text-[#ededed] sm:text-6xl tabular-nums">
                    {match.result.away_score}
                  </span>
                </div>
                {isLive ? (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red-400 tabular-nums">
                    <span className="live-dot-red" />
                    {formatLiveMinute(match.live_score) ?? "Live"}
                  </p>
                ) : match.result.home_score_ht != null &&
                  match.result.away_score_ht != null ? (
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-[#6b7280]">
                    HT {match.result.home_score_ht}-{match.result.away_score_ht}
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <span className="text-[10px] sm:text-sm font-semibold uppercase tracking-widest text-[#6b7280]">
                  VS
                </span>
                <span className="mt-1 text-stat text-base sm:text-2xl text-[#ededed] tabular-nums">
                  {formatTime(match.scheduled_at, locale)}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 text-center sm:gap-3 sm:flex-row sm:text-left">
            <TeamLogoBlock
              src={match.away_team_logo}
              name={match.away_team_name}
              size={48}
            />
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight text-[#ededed] sm:text-xl break-words">
                {match.away_team_name}
              </p>
              <p className="mt-0.5 text-[9px] uppercase tracking-wider text-[#6b7280] sm:text-[10px]">
                Away
              </p>
              {winner === "away" && (
                <Pill
                  tone="win"
                  className="mt-1.5 !text-[10px] inline-flex items-center gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Winner
                </Pill>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-white/[0.06] pt-4">
          <Pill
            tone="default"
            className="inline-flex items-center gap-1.5 !text-[11px]"
          >
            <Calendar className="h-3 w-3" />
            {formatDate(match.scheduled_at, locale)}
          </Pill>
          <Pill
            tone="default"
            className="inline-flex items-center gap-1.5 !text-[11px]"
          >
            <Clock className="h-3 w-3" />
            {formatTime(match.scheduled_at, locale)}
          </Pill>
          {match.venue && (
            <Pill
              tone="default"
              className="inline-flex items-center gap-1.5 !text-[11px]"
            >
              <MapPin className="h-3 w-3" />
              {match.venue}
            </Pill>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Team form ─────────────────────────────────────────────── */

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
            <p className="text-sm font-bold text-[#ededed] truncate">
              {teamName}
            </p>
          </div>
        </div>

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

        <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2">
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

/* ─── H2H ───────────────────────────────────────────────────── */

function H2HCard({
  h2h,
  homeName,
  awayName,
}: {
  h2h: FixtureAnalysis["head_to_head"];
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
            <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 sm:p-3 text-center">
                <p className="text-stat text-xl sm:text-2xl text-[#4ade80] tabular-nums">
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

/* ─── Lineup ────────────────────────────────────────────────── */

function positionLabel(code: string): string {
  if (code === "G") return "Goalkeeper";
  if (code === "D") return "Defender";
  if (code === "M") return "Midfielder";
  if (code === "F") return "Forward";
  return code;
}

function PlayerRow({
  p,
  sideVariant,
}: {
  p: LineupPlayer;
  sideVariant: "green" | "purple";
}) {
  const numberColor =
    sideVariant === "green"
      ? "bg-[#4ade80]/15 text-[#86efac] ring-[#4ade80]/30"
      : "bg-[#a855f7]/15 text-[#d8b4fe] ring-[#a855f7]/30";
  return (
    <li className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
      <span
        className={
          "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ring-1 " +
          numberColor
        }
      >
        {p.number ?? "—"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-[#ededed]">
          {p.name}
        </p>
        {p.position && (
          <p className="text-[10px] uppercase tracking-wider text-[#6b7280]">
            {positionLabel(p.position)}
          </p>
        )}
      </div>
    </li>
  );
}

function TeamLineupCard({
  side,
  variant,
}: {
  side: TeamLineup;
  variant: "green" | "purple";
}) {
  return (
    <div className={`card-neon card-neon-${variant} p-5`}>
      <div className="relative">
        <div className="flex items-center gap-2.5">
          <HexBadge variant={variant} size="sm" noGlow>
            <Users className="h-4 w-4" />
          </HexBadge>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-[#a3a9b8]">
              {variant === "green" ? "Home" : "Away"}
            </p>
            <p className="text-sm font-bold text-[#ededed] truncate">
              {side.team_name ?? "—"}
            </p>
          </div>
          {side.formation && (
            <Pill tone="default" className="ml-auto !text-[10px] tabular-nums">
              {side.formation}
            </Pill>
          )}
        </div>

        <div className="mt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#a3a9b8]">
            Starting XI
          </p>
          {side.starting_xi.length === 0 ? (
            <p className="text-xs italic text-[#6b7280]">
              No starting XI yet.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {side.starting_xi.map((p, i) => (
                <PlayerRow
                  key={(p.id ?? i) + p.name}
                  p={p}
                  sideVariant={variant}
                />
              ))}
            </ul>
          )}
        </div>

        {side.substitutes.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#a3a9b8]">
              Substitutes
            </p>
            <ul className="space-y-1.5">
              {side.substitutes.map((p, i) => (
                <PlayerRow
                  key={(p.id ?? i) + p.name + "-sub"}
                  p={p}
                  sideVariant={variant}
                />
              ))}
            </ul>
          </div>
        )}

        {side.coach?.name && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
            <HexBadge variant="blue" size="sm" noGlow>
              <UserRound className="h-3.5 w-3.5" />
            </HexBadge>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#6b7280]">
                Coach
              </p>
              <p className="text-xs font-semibold text-[#ededed]">
                {side.coach.name}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Events ────────────────────────────────────────────────── */

function eventVisual(ev: FixtureEvent): {
  icon: typeof Goal;
  color: string;
  label: string;
  tone: "win" | "loss" | "draw" | "default";
} {
  const detail = (ev.detail ?? "").toLowerCase();
  const type = (ev.type ?? "").toLowerCase();

  if (type === "goal") {
    if (detail.includes("own goal")) {
      return { icon: Goal, color: "#f87171", label: "Own goal", tone: "loss" };
    }
    if (detail.includes("missed")) {
      return {
        icon: XCircle,
        color: "#a3a9b8",
        label: "Missed penalty",
        tone: "default",
      };
    }
    if (detail.includes("penalty")) {
      return {
        icon: Goal,
        color: "#4ade80",
        label: "Penalty goal",
        tone: "win",
      };
    }
    return { icon: Goal, color: "#4ade80", label: "Goal", tone: "win" };
  }
  if (type === "card") {
    if (detail.includes("red")) {
      return { icon: Square, color: "#ef4444", label: "Red card", tone: "loss" };
    }
    return {
      icon: Square,
      color: "#fbbf24",
      label: "Yellow card",
      tone: "draw",
    };
  }
  if (type === "subst") {
    return {
      icon: RefreshCw,
      color: "#a855f7",
      label: "Substitution",
      tone: "default",
    };
  }
  if (type === "var") {
    return { icon: Activity, color: "#60a5fa", label: "VAR", tone: "default" };
  }
  return {
    icon: Activity,
    color: "#a3a9b8",
    label: ev.type ?? "Event",
    tone: "default",
  };
}

function EventRow({ ev }: { ev: FixtureEvent }) {
  const v = eventVisual(ev);
  const Icon = v.icon;
  const minuteLabel =
    ev.minute != null
      ? ev.extra_minute
        ? `${ev.minute}+${ev.extra_minute}'`
        : `${ev.minute}'`
      : "—";

  const isAway = ev.team_side === "away";
  const isSub = (ev.type ?? "").toLowerCase() === "subst";

  return (
    <li
      className={
        "flex items-stretch gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 " +
        (isAway ? "flex-row-reverse text-right" : "")
      }
    >
      <div className="flex w-10 shrink-0 items-center justify-center">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.05] text-[10px] font-bold tabular-nums text-[#ededed] ring-1 ring-white/[0.08]">
          {minuteLabel}
        </span>
      </div>

      <div className="flex shrink-0 items-center">
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full ring-1"
          style={{
            background: `${v.color}1a`,
            color: v.color,
            boxShadow: `0 0 12px ${v.color}33`,
            borderColor: `${v.color}55`,
          }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div
          className={
            "flex flex-wrap items-center gap-1.5 " +
            (isAway ? "justify-end" : "")
          }
        >
          <span className="text-xs font-semibold text-[#ededed]">
            {ev.player_name ?? v.label}
          </span>
          {ev.team_name && (
            <Pill tone={v.tone} className="!text-[9px] inline-flex items-center">
              {ev.team_name}
            </Pill>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-[#a3a9b8]">
          {isSub && ev.assist_name ? (
            <>
              In:{" "}
              <span className="font-semibold text-[#86efac]">
                {ev.player_name}
              </span>
              {" · "}
              Out:{" "}
              <span className="font-semibold text-[#f87171]">
                {ev.assist_name}
              </span>
            </>
          ) : ev.assist_name ? (
            <>
              assist by{" "}
              <span className="text-[#ededed]">{ev.assist_name}</span>
            </>
          ) : (
            <>
              {v.label}
              {ev.detail ? ` — ${ev.detail}` : ""}
            </>
          )}
        </p>
      </div>
    </li>
  );
}

function EventsList({ events }: { events: FixtureEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-6 text-center text-xs text-[#a3a9b8]">
        No events yet.
      </p>
    );
  }
  const firstHalf = events.filter((e) => (e.minute ?? 0) <= 45);
  const secondHalf = events.filter((e) => (e.minute ?? 0) > 45);

  return (
    <div className="space-y-4">
      {firstHalf.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#a3a9b8]">
            First half
          </p>
          <ul className="space-y-2">
            {firstHalf.map((ev, i) => (
              <EventRow key={i} ev={ev} />
            ))}
          </ul>
        </div>
      )}
      {secondHalf.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#a3a9b8]">
            Second half
          </p>
          <ul className="space-y-2">
            {secondHalf.map((ev, i) => (
              <EventRow key={i + 100} ev={ev} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── Tabs (no "Overview" — that was the prediction tab) ───── */

type TabKey = "events" | "lineup" | "form" | "h2h";

function TabStrip({
  value,
  onChange,
}: {
  value: TabKey;
  onChange: (k: TabKey) => void;
}) {
  const tabs: Array<{
    key: TabKey;
    label: string;
    icon: typeof ListOrdered;
  }> = [
    { key: "events", label: "Events", icon: ListOrdered },
    { key: "lineup", label: "Lineup", icon: Users },
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
          </button>
        );
      })}
    </div>
  );
}

/* ─── Skeletons ─────────────────────────────────────────────── */

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

/* ─── Page ─────────────────────────────────────────────────── */

export default function LiveScoreDetailPage() {
  const params = useParams();
  const matchId = (params?.id as string) || "";
  const { locale } = useTranslations();
  const lHref = useLocalizedHref();

  // Default to the Events tab — that's the live-score "hero" content.
  const [tab, setTab] = useState<TabKey>("events");

  const {
    data: fixture,
    isLoading: fixtureLoading,
    error: fixtureError,
  } = useQuery({
    queryKey: ["live-score-detail", matchId],
    queryFn: () => api.getFixtureDetail(matchId),
    enabled: Boolean(matchId),
    refetchInterval: (query) =>
      (query.state.data as Fixture | undefined)?.status === "live"
        ? 30_000
        : false,
  });

  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: ["live-score-analysis", matchId],
    queryFn: () => api.getFixtureAnalysis(matchId),
    enabled: Boolean(matchId) && (tab === "form" || tab === "h2h"),
  });

  const displayMatch = fixture ?? analysis?.match;
  const isLive = displayMatch?.status === "live";

  const { data: lineup, isLoading: lineupLoading } = useQuery({
    queryKey: ["live-score-lineup", matchId],
    queryFn: () => api.getFixtureLineup(matchId),
    enabled: Boolean(matchId) && tab === "lineup",
    retry: false,
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["live-score-events", matchId],
    queryFn: () => api.getFixtureEvents(matchId),
    enabled: Boolean(matchId) && tab === "events",
    refetchInterval: isLive ? 45_000 : false,
    retry: false,
  });

  if (fixtureError) {
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
              {fixtureError instanceof Error
                ? fixtureError.message
                : "Unknown error"}
            </p>
            <Link
              href={lHref("/live-score")}
              className="btn-glass mt-4 inline-flex items-center gap-1.5 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Live Score
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8">
      <div className="relative space-y-6">
        <Link
          href={lHref("/live-score")}
          className="btn-ghost inline-flex items-center gap-1.5 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Live Score
        </Link>

        {fixtureLoading && !displayMatch ? (
          <HeaderSkeleton />
        ) : displayMatch ? (
          <MatchHeader match={displayMatch} locale={locale} />
        ) : null}

        <TabStrip value={tab} onChange={setTab} />

        {/* Events */}
        {tab === "events" && (
          <div className="space-y-5">
            {eventsLoading ? (
              <BlockSkeleton />
            ) : events?.available ? (
              <div className="card-neon p-5">
                <div className="relative">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <HexBadge variant="purple" size="sm" noGlow>
                        <ListOrdered className="h-4 w-4" />
                      </HexBadge>
                      <p className="text-[10px] uppercase tracking-wider text-[#a3a9b8]">
                        Match Events
                      </p>
                    </div>
                    {isLive && (
                      <Pill
                        tone="default"
                        className="inline-flex items-center gap-1.5 !text-[10px]"
                      >
                        <span className="live-dot-red" />
                        Auto-updating
                      </Pill>
                    )}
                  </div>
                  <EventsList events={events.events} />
                </div>
              </div>
            ) : (
              <div className="card-neon p-8">
                <div className="relative text-center">
                  <HexBadge variant="blue" size="md" noGlow>
                    <ListOrdered className="h-5 w-5" />
                  </HexBadge>
                  <p className="mt-4 text-sm font-semibold text-[#ededed]">
                    No events available
                  </p>
                  <p className="mt-1 text-xs text-[#a3a9b8]">
                    {events?.note ??
                      "Events appear live once the match kicks off."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lineup */}
        {tab === "lineup" && (
          <div className="space-y-5">
            {lineupLoading ? (
              <>
                <BlockSkeleton />
                <BlockSkeleton />
              </>
            ) : lineup?.available && (lineup.home || lineup.away) ? (
              <div className="grid gap-5 md:grid-cols-2">
                {lineup.home && (
                  <TeamLineupCard side={lineup.home} variant="green" />
                )}
                {lineup.away && (
                  <TeamLineupCard side={lineup.away} variant="purple" />
                )}
              </div>
            ) : (
              <div className="card-neon p-8">
                <div className="relative text-center">
                  <HexBadge variant="blue" size="md" noGlow>
                    <Users className="h-5 w-5" />
                  </HexBadge>
                  <p className="mt-4 text-sm font-semibold text-[#ededed]">
                    Lineup not published yet
                  </p>
                  <p className="mt-1 text-xs text-[#a3a9b8]">
                    {lineup?.note ??
                      "Starting XIs are usually confirmed around an hour before kick-off."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form */}
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

        {/* H2H */}
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
