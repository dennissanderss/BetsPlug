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
  Target,
  TrendingUp,
  XCircle,
  Trophy,
  Sparkles,
} from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import type { FreePickItem, FreePicksResponse } from "@/types/api";
import { ProbBar } from "@/components/match-predictions/prob-bar";
import { confLevel, formatKickoff } from "@/components/match-predictions/shared";
import { GlassPanel } from "@/components/noct/glass-panel";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill, DataChip } from "@/components/noct/pill";

/* Map confidence level to NOCTURNE tones. */
function levelToPillTone(level: "Low" | "Medium" | "High"): "default" | "info" | "win" {
  if (level === "High") return "win";
  if (level === "Medium") return "info";
  return "default";
}

function levelToHexVariant(level: "Low" | "Medium" | "High"): "green" | "purple" | "blue" {
  if (level === "High") return "green";
  if (level === "Medium") return "blue";
  return "purple";
}

/* Cycle card accents for visual rhythm. */
const CARD_VARIANTS = ["card-neon-green", "card-neon-green", "card-neon-purple"] as const;

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
  const isFinished = pick.status === "finished";
  const cardVariant = CARD_VARIANTS[index % CARD_VARIANTS.length];
  const hexVariant = levelToHexVariant(level);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex gap-4 sm:gap-5"
    >
      {/* Timeline connector — soft NOCTURNE */}
      <div className="relative flex flex-col items-center">
        <div className="relative z-10 flex h-4 w-4 items-center justify-center">
          <span
            className="h-3 w-3 rounded-full"
            style={{
              background:
                "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
              boxShadow: "0 0 10px rgba(74, 222, 128, 0.6)",
            }}
          />
        </div>
        {!isLast && (
          <div
            className="w-px flex-1"
            style={{
              background:
                "linear-gradient(to bottom, rgba(74,222,128,0.5), rgba(74,222,128,0))",
            }}
          />
        )}
      </div>

      {/* Card */}
      <div className={`${cardVariant} mb-5 flex-1 rounded-2xl sm:mb-6`}>
        <div className="relative">
          {/* League banner */}
          <div className="flex items-center justify-between px-5 pt-4 sm:px-6">
            <Pill tone="default" className="!text-[10px]">
              {pick.league}
            </Pill>
            <Pill tone="default" className="!text-[10px]">
              <Clock className="h-3 w-3" />
              {formatKickoff(pick.scheduled_at, locale)}
            </Pill>
          </div>

          {/* Teams */}
          <div className="relative px-5 py-5 sm:px-6">
            <div className="flex items-center gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {pick.home_team_logo && (
                  <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-white/5 sm:h-10 sm:w-10">
                    <Image
                      src={pick.home_team_logo}
                      alt={pick.home_team}
                      fill
                      className="object-contain p-1"
                      sizes="40px"
                    />
                  </div>
                )}
                <p className="truncate text-sm font-semibold text-[#ededed] sm:text-base">
                  {pick.home_team}
                </p>
              </div>

              <span className="font-mono text-[11px] font-medium text-[#6b7280]">
                vs
              </span>

              <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
                <p className="truncate text-right text-sm font-semibold text-[#ededed] sm:text-base">
                  {pick.away_team}
                </p>
                {pick.away_team_logo && (
                  <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-white/5 sm:h-10 sm:w-10">
                    <Image
                      src={pick.away_team_logo}
                      alt={pick.away_team}
                      fill
                      className="object-contain p-1"
                      sizes="40px"
                    />
                  </div>
                )}
              </div>
            </div>

            {isFinished && pick.home_score != null && pick.away_score != null && (
              <div className="mt-4 flex items-center justify-center">
                <DataChip tone="default" className="!px-5 !py-1.5">
                  <span className="text-stat text-xl text-[#ededed]">
                    {pick.home_score} — {pick.away_score}
                  </span>
                </DataChip>
              </div>
            )}
          </div>

          {/* Probability bar + Confidence */}
          <div className="border-t border-white/[0.06] px-5 py-4 sm:px-6">
            {hasPrediction ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
                <div className="flex-1">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#8a8a8a]">
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

                <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
                  <HexBadge variant={hexVariant} size="sm">
                    <Target className="h-4 w-4" />
                  </HexBadge>
                  <div className="flex flex-col items-start sm:items-end">
                    <span className="text-stat text-2xl leading-none text-[#ededed]">
                      {cScore}
                      <span className="text-sm text-[#a3a9b8]">%</span>
                    </span>
                    <Pill tone={levelToPillTone(level)} className="mt-1 !text-[9px]">
                      {level}
                    </Pill>
                  </div>
                </div>
              </div>
            ) : (
              <Pill tone="default" className="!text-[10px]">
                <Clock className="h-3 w-3" />
                {t("home.freePredPending")}
              </Pill>
            )}
          </div>

          {isFinished && pick.is_correct !== null && (
            <div className="border-t border-white/[0.06] px-5 py-3 sm:px-6">
              {pick.is_correct ? (
                <Pill tone="win">
                  <CheckCircle2 className="h-3 w-3" /> Correct
                </Pill>
              ) : (
                <Pill tone="loss">
                  <XCircle className="h-3 w-3" /> Incorrect
                </Pill>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Skeleton card ────────────────────────────────────────────── */

function PredictionSkeleton() {
  return (
    <div className="relative flex gap-4 sm:gap-5">
      <div className="relative flex flex-col items-center">
        <div className="z-10 h-3 w-3 rounded-full bg-white/10" />
        <div className="w-px flex-1 bg-white/10" />
      </div>
      <GlassPanel className="mb-5 flex-1 animate-pulse rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 rounded-full bg-white/10" />
          <div className="h-4 w-20 rounded-full bg-white/10" />
        </div>
        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="h-5 w-24 rounded bg-white/10" />
          <div className="h-9 w-9 rounded-full bg-white/10" />
          <div className="h-5 w-24 rounded bg-white/10" />
        </div>
        <div className="mt-5 space-y-2 border-t border-white/[0.06] pt-4">
          <div className="h-2.5 w-24 rounded bg-white/10" />
          <div className="h-2 w-full rounded bg-white/10" />
        </div>
      </GlassPanel>
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
        <HexBadge variant="green" size="sm" noGlow>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </HexBadge>
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a3a9b8]">
          {label}
        </h3>
        <div
          className="h-px flex-1"
          style={{
            background:
              "linear-gradient(to right, rgba(74,222,128,0.3), rgba(74,222,128,0))",
          }}
        />
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
      {/* Ambient glow blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-20 h-[440px] w-[440px] rounded-full"
        style={{ background: "hsl(var(--accent-green) / 0.12)", filter: "blur(150px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-10 h-[440px] w-[440px] rounded-full"
        style={{ background: "hsl(var(--accent-purple) / 0.1)", filter: "blur(150px)" }}
      />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <span className="section-label mb-5">
            <Gift className="h-3 w-3" />
            {t("home.freePredBadge")}
          </span>
          <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
            {t("home.freePredTitle")}{" "}
            <span className="gradient-text-green">{t("home.freePredTitleHighlight")}</span>
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#a3a9b8]">
            {t("home.freePredSubtitle")}
          </p>

          {/* Winrate stats */}
          {stats.total > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="mt-6"
            >
              <GlassPanel
                variant="lifted"
                className="inline-flex items-center gap-6 rounded-2xl px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <HexBadge variant="green" size="sm">
                    <TrendingUp className="h-4 w-4" />
                  </HexBadge>
                  <div className="flex flex-col">
                    <span className="text-stat text-2xl leading-none text-[#ededed]">
                      {winratePct}%
                    </span>
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
                      {t("home.freePredWinrate")}
                    </span>
                  </div>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div className="flex items-center gap-3">
                  <HexBadge variant="purple" size="sm">
                    <Trophy className="h-4 w-4" />
                  </HexBadge>
                  <div className="flex flex-col">
                    <span className="text-stat text-2xl leading-none text-[#ededed]">
                      {stats.correct}/{stats.total}
                    </span>
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
                      {t("home.freePredRecord")}
                    </span>
                  </div>
                </div>
              </GlassPanel>
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
          <Link href={loc("/match-predictions")} className="btn-primary group">
            <Sparkles className="h-4 w-4" />
            {t("home.freePredCta")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#a3a9b8]">
            {t("home.freePredCtaSub")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
