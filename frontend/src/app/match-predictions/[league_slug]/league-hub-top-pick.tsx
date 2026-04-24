"use client";

/**
 * League hub — "Top Pick of the Gameweek" hero.
 *
 * Surfaces the single highest-confidence upcoming fixture for this
 * league. Key SEO + conversion levers:
 *  - Specific numbers ("{X}% confidence") to capture longtails like
 *    "who wins {team a} vs {team b}".
 *  - Live countdown until lock (scarcity).
 *  - Single CTA to unlock the full pick.
 */

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useEffect, useState } from "react";
import { Lock, Sparkles, Clock, Trophy } from "lucide-react";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { api } from "@/lib/api";
import { useLocalizedHref } from "@/i18n/locale-provider";
import type { Fixture } from "@/types/api";

interface Props {
  leagueSlug: string;
  leagueName: string;
  locale: "en" | "nl";
}

function timeUntil(iso: string, locale: string): string | null {
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return null;
  const diffMs = ts - Date.now();
  if (diffMs <= 0) return null;
  const mins = Math.round(diffMs / 60_000);
  if (mins < 60) {
    return locale === "nl" ? `${mins} min` : `${mins} min`;
  }
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) {
    const remMins = mins % 60;
    return locale === "nl" ? `${hrs}u ${remMins}m` : `${hrs}h ${remMins}m`;
  }
  const days = Math.round(hrs / 24);
  return locale === "nl" ? `${days} dagen` : `${days} days`;
}

export function LeagueHubTopPick({ leagueSlug, leagueName, locale }: Props) {
  const loc = useLocalizedHref();
  const q = useQuery({
    queryKey: ["league-hub-fixtures", leagueSlug, 14],
    queryFn: () => api.getFixturesUpcoming(14, leagueSlug),
    staleTime: 60_000,
  });

  // Re-render every minute so the countdown ticks.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const top: Fixture | null = useMemo(() => {
    const now = Date.now();
    const upcoming = (q.data?.fixtures ?? [])
      .filter(
        (f) =>
          f.status === "scheduled" &&
          new Date(f.scheduled_at).getTime() > now &&
          f.prediction !== null,
      )
      .sort(
        (a, b) =>
          (b.prediction?.confidence ?? 0) - (a.prediction?.confidence ?? 0),
      );
    return upcoming[0] ?? null;
  }, [q.data]);

  const t = (en: string, nl: string) => (locale === "nl" ? nl : en);

  if (!top) return null;
  const pred = top.prediction!;
  const confPct = Math.round(pred.confidence * 100);
  const highest = Math.max(
    pred.home_win_prob,
    pred.draw_prob ?? 0,
    pred.away_win_prob,
  );
  const pickSide: "home" | "draw" | "away" =
    highest === pred.home_win_prob
      ? "home"
      : highest === pred.away_win_prob
        ? "away"
        : "draw";
  const pickName =
    pickSide === "home"
      ? top.home_team_name
      : pickSide === "away"
        ? top.away_team_name
        : t("Draw", "Gelijkspel");
  const countdown = timeUntil(top.scheduled_at, locale);

  return (
    <section className="relative py-10 md:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-[360px] w-[560px] rounded-full"
        style={{ background: "hsl(var(--accent-green) / 0.12)", filter: "blur(140px)" }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="card-neon card-neon-green halo-green overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-[320px] w-[320px] rounded-full"
            style={{
              background: "hsl(var(--accent-green) / 0.22)",
              filter: "blur(120px)",
            }}
          />
          <div className="relative grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="section-label">
                  <Trophy className="h-3 w-3" />
                  {t("Top Pick of the Gameweek", "Top Pick van de speelronde")}
                </span>
                {countdown && (
                  <Pill
                    tone="win"
                    className="inline-flex items-center gap-1 !text-[10px]"
                  >
                    <Clock className="h-3 w-3" />
                    {t("Locks in", "Vastgezet over")} {countdown}
                  </Pill>
                )}
              </div>

              <h2 className="text-heading mt-3 text-2xl text-[#ededed] sm:text-3xl lg:text-4xl">
                {t(
                  `Our highest-conviction ${leagueName} prediction this week`,
                  `Onze ${leagueName}-voorspelling met hoogste vertrouwen deze week`,
                )}
              </h2>

              <div className="mt-5 flex items-center gap-3 sm:gap-5">
                {top.home_team_logo && (
                  <Image
                    src={top.home_team_logo}
                    alt={top.home_team_name}
                    width={48}
                    height={48}
                    className="rounded-full bg-white/[0.05]"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-tight text-[#ededed] sm:text-lg">
                    {top.home_team_name}{" "}
                    <span className="font-normal text-[#6b7280]">
                      {t("vs", "tegen")}
                    </span>{" "}
                    {top.away_team_name}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-[#6b7280]">
                    {new Date(top.scheduled_at).toLocaleString(
                      locale === "nl" ? "nl-NL" : "en-GB",
                      {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                    {top.venue ? ` · ${top.venue}` : ""}
                  </p>
                </div>
                {top.away_team_logo && (
                  <Image
                    src={top.away_team_logo}
                    alt={top.away_team_name}
                    width={48}
                    height={48}
                    className="rounded-full bg-white/[0.05]"
                  />
                )}
              </div>

              <p className="mt-5 text-sm leading-relaxed text-[#cbd3e0] sm:text-base">
                {t("Our AI backs ", "Onze AI kiest voor ")}
                <strong className="text-[#86efac]">{pickName}</strong>
                {t(" with ", " met ")}
                <strong className="text-[#ededed] tabular-nums">
                  {confPct}%
                </strong>
                {t(" confidence", " zekerheid")}
                {top.odds?.home &&
                  top.odds?.away &&
                  ` · ${t("market odds", "marktquotering")} ${(
                    pickSide === "home"
                      ? top.odds.home
                      : pickSide === "away"
                        ? top.odds.away
                        : top.odds.draw ?? 0
                  ).toFixed(2)}`}
                .
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={loc("/checkout?plan=bronze")}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  {t("Create free account to unlock", "Maak gratis account om te ontgrendelen")}
                </Link>
                <Link
                  href={loc("/how-it-works")}
                  className="btn-glass inline-flex items-center gap-2"
                >
                  {t("How the model picks", "Hoe het model kiest")}
                </Link>
              </div>
            </div>

            {/* Big confidence number */}
            <div className="hidden lg:flex flex-col items-end justify-center gap-2">
              <div className="flex items-center gap-2">
                <HexBadge variant="green" size="md" noGlow>
                  <Sparkles className="h-5 w-5" />
                </HexBadge>
                <p className="text-[11px] uppercase tracking-wider text-[#a3a9b8]">
                  {t("AI confidence", "AI-vertrouwen")}
                </p>
              </div>
              <p className="text-stat text-6xl text-[#4ade80] tabular-nums leading-none">
                {confPct}
                <span className="text-2xl">%</span>
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[#6b7280]">
                {t("on", "op")} {pickName}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
