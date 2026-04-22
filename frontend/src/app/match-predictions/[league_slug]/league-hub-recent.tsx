"use client";

/**
 * League hub — recent results strip.
 *
 * Pulls the last 7 days of finished fixtures for this league and
 * shows the 8 most recent with score + whether the model's pick
 * was correct. Functions as both a trust signal (public track
 * record) and a freshness signal (updates every matchday).
 */

import Image from "next/image";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Minus, TrendingUp } from "lucide-react";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { api } from "@/lib/api";
import { derivePickSide } from "@/lib/prediction-pick";
import type { Fixture } from "@/types/api";
import { useLocalizedHref } from "@/i18n/locale-provider";

function fmtDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale === "nl" ? "nl-NL" : "en-GB", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return "";
  }
}

function computeOutcome(f: Fixture): "correct" | "wrong" | "na" {
  const r = f.result;
  if (!f.prediction || !r || !r.winner) return "na";
  const modelPick = derivePickSide(f.prediction);
  if (!modelPick) return "na";
  return modelPick === r.winner ? "correct" : "wrong";
}

interface Props {
  leagueSlug: string;
  locale: "en" | "nl";
}

export function LeagueHubRecent({ leagueSlug, locale }: Props) {
  const loc = useLocalizedHref();
  const q = useQuery({
    queryKey: ["league-hub-recent", leagueSlug, 7],
    queryFn: () => api.getFixtureResults(7, leagueSlug),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const fixtures = q.data?.fixtures ?? [];
  const recent = useMemo(() => {
    return [...fixtures]
      .filter((f) => f.result !== null)
      .sort(
        (a, b) =>
          new Date(b.scheduled_at).getTime() -
          new Date(a.scheduled_at).getTime(),
      )
      .slice(0, 8);
  }, [fixtures]);

  const stats = useMemo(() => {
    let correct = 0;
    let total = 0;
    for (const f of recent) {
      const o = computeOutcome(f);
      if (o === "correct") correct++;
      if (o === "correct" || o === "wrong") total++;
    }
    return { correct, total, hitRate: total ? Math.round((correct / total) * 100) : null };
  }, [recent]);

  const t = (en: string, nl: string) => (locale === "nl" ? nl : en);

  if (!q.isLoading && recent.length === 0) return null;

  return (
    <section className="relative py-16 md:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-10 h-[340px] w-[480px] rounded-full"
        style={{ background: "hsl(var(--accent-purple) / 0.08)", filter: "blur(140px)" }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="section-label">
              <TrendingUp className="h-3 w-3" />
              {t("Verified", "Geverifieerd")}
            </span>
            <h2 className="text-heading mt-3 text-2xl text-[#ededed] sm:text-3xl">
              {t("Recent results — proof the model delivers",
                 "Recente resultaten — bewijs dat het model werkt")}
            </h2>
            <p className="mt-2 text-sm text-[#a3a9b8]">
              {t(
                "Last 7 days of finished fixtures. Every pick was locked before kick-off. No hindsight edits.",
                "Finales van de laatste 7 dagen. Elke pick stond vast vóór de aftrap. Geen correcties achteraf.",
              )}
            </p>
          </div>
          {stats.hitRate !== null && (
            <div className="flex items-center gap-3 rounded-2xl border border-[#4ade80]/30 bg-[#4ade80]/[0.08] px-5 py-3">
              <HexBadge variant="green" size="sm" noGlow>
                <CheckCircle2 className="h-4 w-4" />
              </HexBadge>
              <div>
                <p className="text-stat text-2xl text-[#86efac] tabular-nums leading-none">
                  {stats.hitRate}%
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-[#a3a9b8]">
                  {stats.correct} / {stats.total} {t("correct", "correct")}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
          <ul className="divide-y divide-white/[0.04]">
            {recent.map((f) => {
              const outcome = computeOutcome(f);
              return (
                <li
                  key={f.id}
                  className="flex items-center gap-2 px-3 py-3 sm:gap-4 sm:px-5"
                >
                  <span className="w-10 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[#6b7280] sm:w-14 sm:text-xs">
                    {fmtDate(f.scheduled_at, locale)}
                  </span>

                  <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
                    {f.home_team_logo && (
                      <Image
                        src={f.home_team_logo}
                        alt=""
                        width={18}
                        height={18}
                        className="rounded-full bg-white/[0.04]"
                      />
                    )}
                    <span className="truncate text-xs font-semibold text-[#ededed] sm:text-sm">
                      {f.home_team_name}
                    </span>
                  </div>

                  <span className="text-stat shrink-0 text-sm tabular-nums text-[#ededed] sm:text-base">
                    {f.result?.home_score ?? "–"}-{f.result?.away_score ?? "–"}
                  </span>

                  <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2">
                    <span className="truncate text-xs font-semibold text-[#ededed] sm:text-sm">
                      {f.away_team_name}
                    </span>
                    {f.away_team_logo && (
                      <Image
                        src={f.away_team_logo}
                        alt=""
                        width={18}
                        height={18}
                        className="rounded-full bg-white/[0.04]"
                      />
                    )}
                  </div>

                  <span className="w-6 shrink-0 text-center sm:w-8">
                    {outcome === "correct" && (
                      <CheckCircle2 className="inline h-4 w-4 text-[#4ade80]" />
                    )}
                    {outcome === "wrong" && (
                      <XCircle className="inline h-4 w-4 text-[#f87171]" />
                    )}
                    {outcome === "na" && (
                      <Minus className="inline h-3.5 w-3.5 text-[#6b7280]" />
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="mt-3 text-center text-[11px] text-[#6b7280]">
          {t(
            "All predictions timestamped before kickoff. Check our ",
            "Alle voorspellingen tijdstempeld vóór de aftrap. Bekijk ons ",
          )}
          <a
            href={loc("/track-record")}
            className="underline underline-offset-2 transition hover:text-[#4ade80]"
          >
            {t("full track record", "volledige trackrecord")}
          </a>
          .
        </p>

        <Pill tone="default" className="sr-only" aria-hidden="true">
          fresh
        </Pill>
      </div>
    </section>
  );
}
