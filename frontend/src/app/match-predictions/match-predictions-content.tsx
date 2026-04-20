"use client";

import React from "react";
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
  ArrowRight,
  TrendingUp,
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
import {
  FreeMatchCard,
  LockedMatchCard,
  LockedSkeleton,
  FreeSkeleton,
} from "@/components/match-predictions/match-cards";
import { UnlockBanner } from "@/components/match-predictions/unlock-banner";
import {
  FREE_PICKS,
  LOCKED_PREVIEW,
} from "@/components/match-predictions/shared";
import { useFreeMatchIds } from "@/components/match-predictions/use-free-match-ids";
import { HeroMediaBg, CtaMediaBg } from "@/components/ui/media-bg";
import { PAGE_IMAGES } from "@/data/page-images";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import Image from "next/image";
import { ALL_LEAGUES, getLeagueName } from "@/data/league-catalog";
import { LEAGUE_LOGO_PATH } from "@/data/league-logos";

/* ──────────────────────────────────────────────────────────────
 * Match Predictions, NOCTURNE rebuild
 * ────────────────────────────────────────────────────────────── */

export function MatchPredictionsContent({ faqSlot }: { faqSlot?: React.ReactNode }) {
  const { t, locale } = useTranslations();
  const loc = useLocalizedHref();
  const isNl = locale === "nl";

  const { freeMatchIds, freePickMap, isLoadingFreeIds } = useFreeMatchIds();

  const fixturesQuery = useQuery({
    queryKey: ["match-predictions-public", 7],
    queryFn: () => api.getFixturesUpcoming(7),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    retry: 2,
  });

  const fixtures = fixturesQuery.data?.fixtures ?? [];

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
          new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
      );
  }, [fixtures]);

  // Build free fixtures; if the fixtures endpoint returned prediction:null
  // (tier-scope mismatch with /homepage/free-picks) synthesize a minimal
  // prediction object from the free-picks response so the FreeMatchCard
  // always renders win-probs + confidence instead of an empty bar.
  const free: Fixture[] = useMemo(() => {
    return upcoming
      .filter((f) => freeMatchIds.has(f.id))
      .map((f) => {
        if (f.prediction) return f;
        const pick = freePickMap.get(f.id);
        if (
          !pick ||
          pick.home_win_prob == null ||
          pick.away_win_prob == null ||
          pick.confidence == null
        ) {
          return f;
        }
        return {
          ...f,
          prediction: {
            home_win_prob: pick.home_win_prob,
            draw_prob: pick.draw_prob,
            away_win_prob: pick.away_win_prob,
            confidence: pick.confidence,
            model_name: null,
            pick: pick.pick,
          },
        } as Fixture;
      });
  }, [upcoming, freeMatchIds, freePickMap]);
  const lockedPool = useMemo(() => {
    const withPred = upcoming.filter((f) => !freeMatchIds.has(f.id) && f.prediction !== null);
    const withoutPred = upcoming.filter((f) => !freeMatchIds.has(f.id) && f.prediction === null);
    return [...withPred, ...withoutPred].slice(0, LOCKED_PREVIEW);
  }, [upcoming, freeMatchIds]);

  const isLoading = fixturesQuery.isLoading || isLoadingFreeIds;
  const isError = fixturesQuery.isError;
  const hasFree = free.length > 0;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-[#ededed]">
      <SiteNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <HeroMediaBg src={PAGE_IMAGES["match-predictions"].hero} alt={PAGE_IMAGES["match-predictions"].alt} />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-10 h-[420px] w-[min(780px,100vw)] -translate-x-1/2 rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.12)", filter: "blur(140px)" }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="section-label mx-auto"
          >
            <Sparkles className="h-3 w-3" />
            {t("matchPred.eyebrow")}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-heading mt-5 text-2xl text-[#ededed] sm:text-3xl lg:text-5xl"
          >
            {t("matchPred.title")}{" "}
            <span className="gradient-text-green">live</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-[#a3a9b8] sm:text-lg"
          >
            {t("matchPred.subtitle")}
          </motion.p>

          {/* Trust pills */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-2"
          >
            <Pill tone="default" className="inline-flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-[#4ade80]" />
              {t("matchPred.trust1")}
            </Pill>
            <Pill tone="default" className="inline-flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-[#60a5fa]" />
              {t("matchPred.trust2")}
            </Pill>
            <Pill tone="default" className="inline-flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-[#4ade80]" />
              {t("matchPred.trust3")}
            </Pill>
          </motion.div>

          {/* Stats block removed — user feedback said the 4-container
              summary felt repetitive across pages. Tier ladder on the
              homepage already carries that story. */}
        </div>
      </section>

      {/* ── Free picks ── */}
      <section className="relative py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-[360px] w-[min(520px,90vw)] rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.1)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          {/* Tier context banner, makes it unmistakeable that these 3
              picks are the FREE slice and that higher tiers unlock more. */}
          <div className="mb-10 flex flex-col gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4 sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-lg ring-1 ring-emerald-400/30">
                🆓
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                  {isNl ? "Free tier · 3 picks per dag" : "Free tier · 3 picks per day"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[#ededed] sm:text-base">
                  {isNl
                    ? "Je kijkt nu naar de 3 gratis voorspellingen van vandaag. Silver (≥ 65% betrouwbaarheid), Gold (≥ 70%) en Platinum (≥ 75%) ontgrendelen alle overige wedstrijden plus hogere nauwkeurigheid per tier."
                    : "You're viewing today's 3 free predictions. Silver (≥ 65% confidence), Gold (≥ 70%) and Platinum (≥ 75%) unlock every other fixture plus higher accuracy per tier."}
                </p>
              </div>
            </div>
            <Link
              href={loc("/checkout")}
              className="btn-primary inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap"
            >
              {isNl ? "Upgrade naar Premium" : "Upgrade to Premium"}
              <Lock className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mb-12 sm:mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="section-label">
                <Sparkles className="h-3 w-3" />
                {t("matchPred.statFree")}
              </span>
              <h2 className="text-heading mt-4 text-2xl text-[#ededed] sm:text-3xl lg:text-5xl">
                {t("matchPred.freeHeading")}
              </h2>
              <p className="mt-3 max-w-xl text-base text-[#a3a9b8]">
                {t("matchPred.freeSub")}
              </p>
            </div>
            {fixturesQuery.isFetching && !isLoading && (
              <button
                type="button"
                onClick={() => fixturesQuery.refetch()}
                className="btn-glass hidden items-center gap-1.5 sm:inline-flex"
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
            <div className="card-neon card-neon-purple relative overflow-hidden p-6">
              <div className="relative flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <HexBadge variant="purple" size="md">
                  <AlertTriangle className="h-5 w-5" />
                </HexBadge>
                <div className="flex-1">
                  <p className="text-heading text-lg text-[#ededed]">
                    {t("matchPred.errorTitle")}
                  </p>
                  <p className="mt-1 text-sm text-[#a3a9b8]">
                    {t("matchPred.errorDesc")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fixturesQuery.refetch()}
                  className="btn-glass inline-flex items-center gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {t("matchPred.refresh")}
                </button>
              </div>
            </div>
          )}

          {!isLoading && !isError && !hasFree && (
            <div className="card-neon card-neon-green relative overflow-hidden p-10 text-center">
              <div className="relative flex flex-col items-center gap-4">
                <HexBadge variant="green" size="lg">
                  <Clock className="h-7 w-7" />
                </HexBadge>
                <div>
                  <h3 className="text-heading text-xl text-[#ededed]">
                    {t("matchPred.emptyTitle")}
                  </h3>
                  <p className="mt-2 max-w-md text-sm text-[#a3a9b8]">
                    {t("matchPred.emptyDesc")}
                  </p>
                </div>
                <Link
                  href={loc("/track-record")}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {t("matchPred.emptyCta")}
                </Link>
              </div>
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
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <UnlockBanner />
        </div>
      </section>

      {/* ── Locked pool ── */}
      <section className="relative py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-10 h-[360px] w-[min(520px,90vw)] rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.1)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 sm:mb-14">
            <span className="section-label">
              <Lock className="h-3 w-3" />
              {t("matchPred.statLocked")}
            </span>
            <h2 className="text-heading mt-4 text-2xl text-[#ededed] sm:text-3xl lg:text-5xl">
              {t("matchPred.lockedHeading")}
            </h2>
            <p className="mt-3 max-w-xl text-base text-[#a3a9b8]">
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

      {/* ── Browse by league, SEO hub ── */}
      <section className="relative py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/4 top-10 h-[340px] w-[520px] rounded-full"
          style={{ background: "hsl(var(--accent-blue) / 0.08)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <span className="section-label mx-auto">
              <Shield className="h-3 w-3" />
              {isNl ? "Alle competities" : "All leagues"}
            </span>
            <h2 className="text-heading mt-3 text-2xl text-[#ededed] sm:text-3xl lg:text-4xl">
              {isNl
                ? "AI-voorspellingen per competitie"
                : "AI predictions by league"}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-[#a3a9b8] sm:text-base">
              {isNl
                ? "30 competities wereldwijd. Zelfde AI-motor, zelfde openbare trackrecord, klik een competitie voor de gratis picks van deze week."
                : "30 competitions worldwide. Same AI engine, same public track record, click any league for this week's free picks."}
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_LEAGUES.map((league) => {
              const logo = LEAGUE_LOGO_PATH[league.slug] ?? null;
              const name = getLeagueName(league, isNl ? "nl" : "en");
              return (
                <Link
                  key={league.slug}
                  href={loc(`/match-predictions/${league.slug}`)}
                  className="glass-panel-lifted group flex items-center gap-3 px-4 py-3 transition-all"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
                    {logo ? (
                      <Image
                        src={logo}
                        alt=""
                        width={30}
                        height={30}
                        className="object-contain"
                      />
                    ) : (
                      <span className="text-lg" aria-hidden="true">
                        {league.flag}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#ededed] transition-colors group-hover:text-[#4ade80]">
                      {name}
                    </p>
                    <p className="text-[11px] uppercase tracking-wider text-[#6b7280]">
                      {isNl ? "Bekijk voorspellingen" : "View predictions"}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#6b7280] transition-all group-hover:translate-x-0.5 group-hover:text-[#4ade80]" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {faqSlot}

      {/* ── Final CTA ── */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="card-neon card-neon-green halo-green relative overflow-hidden p-6 sm:p-10 md:p-16">
            <CtaMediaBg
              src={PAGE_IMAGES["match-predictions"].cta}
              alt={PAGE_IMAGES["match-predictions"].alt}
              pattern={PAGE_IMAGES["match-predictions"].pattern}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-[260px] w-[260px] rounded-full"
              style={{ background: "hsl(var(--accent-green) / 0.28)", filter: "blur(80px)" }}
            />
            <div className="relative text-center">
              <HexBadge variant="green" size="lg" className="mx-auto mb-5">
                <Sparkles className="h-7 w-7" />
              </HexBadge>
              <h2 className="text-heading text-2xl text-[#ededed] sm:text-3xl lg:text-5xl">
                {t("matchPred.ctaFinalTitle")}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#a3a9b8]">
                {t("matchPred.ctaFinalDesc")}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href={loc("/checkout")}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {t("matchPred.ctaFinalButton")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={loc("/checkout")}
                  className="btn-ghost inline-flex items-center gap-2"
                >
                  {t("matchPred.ctaFinalSecondary")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BetsPlugFooter />
    </div>
  );
}
