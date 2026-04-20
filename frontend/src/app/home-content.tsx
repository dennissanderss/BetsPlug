"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Brain,
  Target,
  CheckCircle2,
  Shield,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Eye,
  Star,
  Activity,
  ChevronRight,
  AlertTriangle,
  BarChart3,
  Smartphone,
  Calculator,
  Database,
  RotateCcw,
  XCircle,
  CreditCard,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { HeroMediaBg } from "@/components/ui/media-bg";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill, DataChip } from "@/components/noct/pill";
import type { Article } from "@/data/articles";
import type { Testimonial } from "@/components/ui/testimonials-section";
import type { ComparisonRow } from "@/components/ui/comparison-table";
import { getLocaleValue } from "@/lib/sanity-data";
import { useBotdTrackRecord } from "@/hooks/use-botd-track-record";
import { usePotdNumbers } from "@/hooks/use-potd-numbers";
import { useBotdHistory } from "@/hooks/use-botd-history";
import { PRIMARY_LEAGUES, getLeagueName } from "@/data/league-catalog";
import { LEAGUE_LOGO_PATH } from "@/data/league-logos";

/* Heavy shared sections loaded dynamically */
const TrackRecordChart = dynamic(() => import("@/components/ui/track-record-chart").then(m => m.TrackRecordChart), { ssr: false });
const LeaguesTicker = dynamic(() => import("@/components/ui/leagues-ticker").then(m => m.LeaguesTicker), { ssr: true });
const TrustFunnel = dynamic(() => import("@/components/ui/trust-funnel").then(m => m.TrustFunnel), { ssr: false });
const RecognizeThis = dynamic(() => import("@/components/ui/recognize-this").then(m => m.RecognizeThis), { ssr: true });
const TestimonialsSection = dynamic(() => import("@/components/ui/testimonials-section").then(m => m.TestimonialsSection), { ssr: false });
const ComparisonTable = dynamic(() => import("@/components/ui/comparison-table").then(m => m.ComparisonTable), { ssr: true });
const PricingSection = dynamic(() => import("@/components/ui/pricing-section").then(m => m.PricingSection), { ssr: true });
const SeoSection = dynamic(() => import("@/components/ui/seo-section").then(m => m.SeoSection), { ssr: true });
const SocialProofPopup = dynamic(() => import("@/components/ui/social-proof-popup").then(m => m.SocialProofPopup), { ssr: false });

/* ═══════════════════════════════════════════════════════════════
   Data hooks
   ═══════════════════════════════════════════════════════════════ */

interface FeaturedMatch {
  available: boolean;
  home_team: string | null;
  away_team: string | null;
  league: string | null;
  home_win_prob: number | null;
  draw_prob: number | null;
  away_win_prob: number | null;
  confidence: number | null;
}

function useFeaturedMatch(): FeaturedMatch | null {
  const [data, setData] = useState<FeaturedMatch | null>(null);
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    fetch(`${API}/homepage/featured-match`).then(r => r.json()).then(setData).catch(() => {});
  }, []);
  return data;
}

interface HomepageStats {
  total: number;
  correct: number;
  winrate: number; // 0-1
}

interface UpcomingPick {
  home_team: string;
  away_team: string;
  home_logo?: string | null;
  away_logo?: string | null;
  league: string;
  kickoff: string;
  home_prob: number;
  draw_prob: number;
  away_prob: number;
  confidence: number;
}

interface FreePicksPayload {
  stats: HomepageStats | null;
  picks: UpcomingPick[];
}

/**
 * Single fetch of `/homepage/free-picks`, the payload contains both
 * the 30-day rolling winrate block (feeds the track-record card) and
 * today's 3 free picks (feeds the hero widget). Previously both were
 * fetched in two independent useEffects → one extra round trip per
 * homepage load. Consumers call the shallow selectors below.
 *
 * Returns `{ stats: null, picks: [] }` until the fetch resolves.
 */
function useHomepageFreePicks(): FreePicksPayload {
  const [payload, setPayload] = useState<FreePicksPayload>({
    stats: null,
    picks: [],
  });
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    fetch(`${API}/homepage/free-picks`)
      .then((r) => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((d: any) => {
        const s = d?.stats;
        const nextStats: HomepageStats | null =
          s && typeof s.total === "number"
            ? {
                total: s.total,
                correct: s.correct ?? 0,
                winrate: typeof s.winrate === "number" ? s.winrate : 0,
              }
            : null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const arr: any[] = d?.today ?? [];
        // Sort today's matches by model confidence DESC before slicing
        // to 3 so the homepage hero shows the strongest picks of the
        // day instead of whatever the backend happened to order first.
        // Visitors came here because the headline promises "top AI
        // predictions" — leading with lowest-confidence coin-flips
        // (42%/44%/50%) would undermine that promise immediately.
        const nextPicks: UpcomingPick[] = [...arr]
          .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
          .slice(0, 3)
          .map((p) => ({
            home_team: p.home_team,
            away_team: p.away_team,
            home_logo: p.home_team_logo ?? null,
            away_logo: p.away_team_logo ?? null,
            league: p.league,
            kickoff: p.scheduled_at,
            home_prob: Math.round((p.home_win_prob ?? 0) * 100),
            draw_prob: Math.round((p.draw_prob ?? 0) * 100),
            away_prob: Math.round((p.away_win_prob ?? 0) * 100),
            confidence: Math.round((p.confidence ?? 0) * 100),
          }));
        setPayload({ stats: nextStats, picks: nextPicks });
      })
      .catch(() => {});
  }, []);
  return payload;
}

function formatKickoff(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleString(locale, {
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

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const steps = 60;
    const inc = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += inc;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 2000 / steps);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString()}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════════════
   HomeContent, landing page flow with NOCTURNE app-UI styling
   ═══════════════════════════════════════════════════════════════ */

interface HomeContentProps {
  articles: Article[];
  testimonials?: Testimonial[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  homepage?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pricingConfig?: any;
}

export function HomeContent({
  articles,
  testimonials = [],
  homepage,
  pricingConfig,
}: HomeContentProps) {
  const { t, locale } = useTranslations();
  const loc = useLocalizedHref();
  const featured = useFeaturedMatch();
  const botd = useBotdTrackRecord();
  const potd = usePotdNumbers();
  const historySeries = useBotdHistory();
  const { stats, picks } = useHomepageFreePicks();

  // Comparison rows resolved from Sanity (locale-aware)
  const comparisonRows: ComparisonRow[] | undefined = homepage?.comparisonRows?.length
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? homepage.comparisonRows.map((r: any) => ({
        feature: getLocaleValue(r.feature, locale),
        betsplug: r.betsplug ?? true,
        freeTools: r.freeTools ?? false,
        bookmakers: r.bookmakers ?? false,
        note: getLocaleValue(r.note, locale) || undefined,
      }))
    : undefined;

  const latestArticles = [...(articles ?? [])]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 3);

  const homeProb = featured?.available ? Math.round((featured.home_win_prob ?? 0.52) * 100) : 52;
  const drawProb = featured?.available ? Math.round((featured.draw_prob ?? 0.24) * 100) : 24;
  const awayProb = featured?.available ? Math.round((featured.away_win_prob ?? 0.24) * 100) : 24;
  const confidence = featured?.available ? Math.round((featured.confidence ?? 0.78) * 100) : 78;

  return (
    <div className="min-h-screen">
      <SiteNav />

      {/* ══════════════════════════════════════════════════════════════
          1 · HERO, text left, premium prediction card right
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-40 pb-16 md:pt-52 md:pb-24">
        <HeroMediaBg />
        {/* Ambient hero glows (on top of pattern) */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 top-10 h-[460px] w-[460px] rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.22)", filter: "blur(140px)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-40 h-[500px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.22)", filter: "blur(150px)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/2 h-[320px] w-[600px] -translate-x-1/2 rounded-full"
          style={{ background: "hsl(var(--accent-blue) / 0.12)", filter: "blur(120px)" }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
            {/* Copy */}
            <div>
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="section-label"
              >
                <span className="live-dot" />
                {t("hero.badge")}
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.05 }}
                className="mt-5 text-display max-w-2xl text-balance text-[#ededed]"
              >
                {t("hero.titleLine1") ? <>{t("hero.titleLine1")}{" "}</> : null}
                <span className="gradient-text-green">{t("hero.titleLine2")}</span>
                {t("hero.titleLine3") ? <>{" "}{t("hero.titleLine3")}</> : null}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.12 }}
                className="mt-6 max-w-xl text-base leading-relaxed text-[#a3a9b8] sm:text-lg"
              >
                {t("hero.subtitle")}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.18 }}
                className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4"
              >
                {[
                  { icon: Activity, title: t("hero.usp1Title"), variant: "green" as const },
                  { icon: Clock, title: t("hero.usp2Title"), variant: "purple" as const },
                  { icon: Eye, title: t("hero.usp3Title"), variant: "blue" as const },
                ].map(({ icon: Icon, title, variant }) => (
                  <div key={title} className="flex items-center gap-2.5">
                    <HexBadge variant={variant} size="sm">
                      <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                    </HexBadge>
                    <span className="text-sm font-medium text-[#ededed]">{title}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.24 }}
                className="mt-10 flex flex-wrap items-center gap-3"
              >
                <Link
                  href={`${loc("/checkout")}?plan=bronze`}
                  className="btn-primary inline-flex items-center gap-1.5"
                >
                  {t("hero.ctaPrimary")} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={loc("/how-it-works")} className="btn-glass">
                  {t("hero.ctaSecondary")}
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.32 }}
                className="mt-10 flex items-center gap-5"
              >
                <div className="flex -space-x-3">
                  {[
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=faces",
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces",
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces",
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=faces",
                  ].map((src, i) => (
                    <Image
                      key={i}
                      src={src}
                      alt=""
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-full border-2 border-[#0a0b11] object-cover"
                    />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#ededed]">
                    <AnimatedNumber target={1500} suffix="+" />
                  </p>
                  <p className="text-xs text-[#6b7280]">{t("hero.activeUsers")}</p>
                </div>
              </motion.div>
            </div>

            {/* Prediction preview, app widget */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative overflow-hidden sm:overflow-visible"
            >
              <div className="card-neon card-neon-green halo-green relative overflow-hidden">
                {/* Widget header */}
                <div
                  className="relative flex items-center justify-between gap-3 border-b px-5 pt-5 pb-4"
                  style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
                >
                  <div className="flex items-center gap-2.5">
                    <HexBadge variant="green" size="sm" noGlow>
                      <Activity className="h-3.5 w-3.5" />
                    </HexBadge>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
                        {locale === "nl"
                          ? "Top premium picks"
                          : "Top premium picks"}
                      </p>
                      <p className="text-sm font-semibold text-[#ededed]">
                        {locale === "nl"
                          ? "Top-3 voor de komende weken"
                          : "Top-3 for the coming weeks"}
                      </p>
                    </div>
                  </div>
                  <Pill className="pill-active">
                    <span className="live-dot" />
                    Live
                  </Pill>
                </div>

                {/* Column header strip — tells the visitor what the green
                    percentage chip to the right of each row actually
                    represents. Without this label the number reads as
                    "accuracy" (which it isn't — it's the model's estimated
                    win-probability for its pick). */}
                <div
                  className="flex items-center justify-between gap-2 border-b px-5 py-2"
                  style={{
                    borderColor: "hsl(0 0% 100% / 0.05)",
                    background: "rgba(255,255,255,0.015)",
                  }}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6b7280]">
                    {locale === "nl" ? "Competitie · wedstrijd" : "League · match"}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#4ade80]">
                    {locale === "nl" ? "Win-kans model" : "Model win probability"}
                  </span>
                </div>

                {/* 3 pick rows */}
                <div className="relative divide-y" style={{ borderColor: "hsl(0 0% 100% / 0.05)" }}>
                  {picks.slice(0, 3).map((p, i) => (
                    <HeroPickRow key={i} pick={p} locale={locale} />
                  ))}
                  {picks.length === 0 &&
                    [0, 1, 2].map((i) => (
                      <div key={i} className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="h-3 w-24 animate-pulse rounded bg-white/[0.05]" />
                          <div className="h-3 w-16 animate-pulse rounded bg-white/[0.05]" />
                        </div>
                        <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-white/[0.05]" />
                      </div>
                    ))}
                </div>

                {/* Footer CTA */}
                <div
                  className="relative border-t p-4"
                  style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
                >
                  <Link
                    href={loc("/match-predictions")}
                    className="btn-primary flex w-full items-center justify-center gap-2"
                  >
                    {t("home.freePredCta")} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          1a2 · RECOGNIZE-THIS, empathy-first pain section. Shows the
          Telegram-tipster frustrations the visitor has already lived
          through, so they feel understood before we pitch the solution.
          Placed right after the hero so the flow is:
             Hero (promise) → Pain ("yes that's me") → Proof → Ladder → ...
         ══════════════════════════════════════════════════════════════ */}
      <RecognizeThis />

      {/* 1b · LIVE PROOF STRIP + standalone TierLadder removed — the
          TrustFunnel below now carries the per-tier accuracy breakdown
          (incl. Bronze), so the ladder would be duplicate content. */}

      {/* ══════════════════════════════════════════════════════════════
          1c · TRUST FUNNEL, "from 55k matches to 1.65k honest picks",
          plain-language explanation of why the advertised volume looks
          smaller than the raw database count. Turns the "why only 8k?"
          visitor question into a conversion-oriented honesty story.
         ══════════════════════════════════════════════════════════════ */}
      <TrustFunnel />

      {/* ══════════════════════════════════════════════════════════════
          2 · LEAGUES TICKER
         ══════════════════════════════════════════════════════════════ */}
      <LeaguesTicker />

      {/* ══════════════════════════════════════════════════════════════
          2b · PAS, problem/agitate/solve block
          Frame the real pain (sports fans lose) BEFORE we present
          BetsPlug as the answer. Numbers are industry-standard and
          intentionally non-BetsPlug so the claim is credible.
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20 md:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-1/2 h-[360px] w-[360px] -translate-y-1/2 rounded-full"
          style={{ background: "hsl(var(--accent-red, 0 72% 60%) / 0.12)", filter: "blur(140px)" }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 max-w-3xl">
            <span className="section-label">
              <AlertTriangle className="h-3 w-3" />
              {t("pas.badge")}
            </span>
            <h2 className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("pas.titleA")}{" "}
              <span className="gradient-text-green">{t("pas.titleB")}</span>
            </h2>
            <p className="mt-4 text-base text-[#a3a9b8]">{t("pas.subtitle")}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <PasStatCard
              icon={TrendingDown}
              value={t("pas.stat1Value")}
              label={t("pas.stat1Label")}
              desc={t("pas.stat1Desc")}
            />
            <PasStatCard
              icon={BarChart3}
              value={t("pas.stat2Value")}
              label={t("pas.stat2Label")}
              desc={t("pas.stat2Desc")}
            />
            <PasStatCard
              icon={AlertTriangle}
              value={t("pas.stat3Value")}
              label={t("pas.stat3Label")}
              desc={t("pas.stat3Desc")}
            />
          </div>

          <div className="mt-10 grid items-center gap-5 rounded-2xl border p-6 md:grid-cols-[1fr_auto] md:p-8"
            style={{ borderColor: "hsl(0 0% 100% / 0.06)", background: "hsl(0 0% 100% / 0.02)" }}>
            <p className="text-base leading-relaxed text-[#ededed]">
              {t("pas.solve")}
            </p>
            <Link
              href={loc("/how-it-works")}
              className="btn-primary inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              {t("pas.cta")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          3 · FEATURES, 3 premium feature cards
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.1)", filter: "blur(140px)" }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 max-w-3xl">
            <span className="section-label">
              <Sparkles className="h-3 w-3" /> {t("trusted.titleHighlight")}
            </span>
            <h2 className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("trusted.titleA")}{" "}
              <span className="gradient-text-green">{t("trusted.titleHighlight")}</span>{" "}
              {t("trusted.titleB")}
            </h2>
            <p className="mt-4 text-base text-[#a3a9b8]">{t("trusted.subtitle")}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <BigFeatureCard
              variant="green"
              icon={Shield}
              tag={t("trusted.card1Title") ? "Trust" : "Trust"}
              title={t("trusted.card1Title")}
              desc={t("trusted.card1Desc")}
            />
            <BigFeatureCard
              variant="purple"
              icon={Brain}
              tag="AI Core"
              title={t("trusted.card2Title")}
              desc={t("trusted.card2Desc")}
              href={loc("/track-record")}
              cta={t("trusted.learnMore")}
            />
            <BigFeatureCard
              variant="blue"
              icon={CheckCircle2}
              tag="Proof"
              title={t("trusted.card3Title")}
              desc={t("trusted.card3Desc")}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          4 · HOW IT WORKS, 3 premium step cards
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full"
          style={{ background: "hsl(var(--accent-blue) / 0.1)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <span className="section-label">{t("how.badge")}</span>
            <h2 className="text-heading mx-auto max-w-2xl text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("how.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-[#a3a9b8]">{t("how.subtitle")}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              { num: "01", icon: Zap, title: t("how.step1Title"), desc: t("how.step1Desc"), variant: "green" as const },
              { num: "02", icon: Star, title: t("how.step2Title"), desc: t("how.step2Desc", potd), variant: "purple" as const },
              { num: "03", icon: Eye, title: t("how.step3Title"), desc: t("how.step3Desc"), variant: "blue" as const },
            ].map(({ num, icon: Icon, title, desc, variant }) => (
              <div key={num} className={`card-neon card-neon-${variant} relative overflow-hidden p-6 sm:p-7`}>
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-14 left-1/2 h-[160px] w-[70%] -translate-x-1/2 rounded-full opacity-70"
                  style={{
                    background:
                      variant === "green"
                        ? "radial-gradient(ellipse, hsl(var(--accent-green)/0.28), transparent 60%)"
                        : variant === "purple"
                        ? "radial-gradient(ellipse, hsl(var(--accent-purple)/0.32), transparent 60%)"
                        : "radial-gradient(ellipse, hsl(var(--accent-blue)/0.28), transparent 60%)",
                    filter: "blur(40px)",
                  }}
                />
                <div className="relative flex items-start gap-4">
                  <HexBadge variant={variant} size="md">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </HexBadge>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
                      Step {num}
                    </span>
                    <h3 className="text-heading mt-1 text-lg text-[#ededed]">{title}</h3>
                  </div>
                </div>
                <p className="relative mt-4 text-sm leading-relaxed text-[#a3a9b8]">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link href={loc("/how-it-works")} className="btn-glass inline-flex items-center gap-1.5">
              {t("how.deepDive")} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          5 · TRACK RECORD, animated chart + stats
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 bottom-0 h-[400px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.12)", filter: "blur(140px)" }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.15fr]">
            {/* Left, copy + stats strip + CTAs */}
            <div>
              <span className="section-label">
                <Shield className="h-3 w-3" />
                {t("track.badge")}
              </span>
              <h2 className="text-heading text-balance break-words text-2xl text-[#ededed] sm:text-3xl lg:text-5xl">
                {t("track.titleA")}{" "}
                <span className="gradient-text-green">{t("track.titleHighlight")}</span>{" "}
                {t("track.titleB")}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[#a3a9b8]">
                {t("track.desc1")}
              </p>

              {/* Mini stat strip */}
              {(() => {
                const hasLive = stats && stats.total > 0 && stats.winrate > 0;
                const displayAcc = hasLive ? `${Math.round(stats.winrate * 1000) / 10}%` : ",";
                const displayTotal = hasLive ? stats.total.toLocaleString(locale) : ",";
                return (
                  <div className="mt-8 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-stat text-2xl text-[#ededed] sm:text-3xl">{displayAcc}</p>
                      <p className="mt-1 text-xs text-[#6b7280]">{t("track.accuracy")}</p>
                    </div>
                    <div>
                      <p className="text-stat text-2xl text-[#ededed] sm:text-3xl">{displayTotal}</p>
                      <p className="mt-1 text-xs text-[#6b7280]">{t("track.metricPredictions")}</p>
                    </div>
                    <div>
                      <p className="text-stat text-2xl text-[#ededed] sm:text-3xl">30</p>
                      <p className="mt-1 text-xs text-[#6b7280]">{t("track.metricLeagues")}</p>
                    </div>
                  </div>
                );
              })()}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={loc("/track-record")} className="btn-primary inline-flex items-center gap-1.5">
                  {t("track.cta")} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={loc("/predictions")} className="btn-glass">
                  {t("home.freePredCta")}
                </Link>
              </div>
            </div>

            {/* Right, animated line chart + floating badges */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8 }}
              className="relative overflow-hidden sm:overflow-visible"
            >
              <div className="card-neon card-neon-green halo-green relative overflow-hidden">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-12 -top-12 h-[200px] w-[200px] rounded-full"
                  style={{ background: "hsl(var(--accent-green) / 0.2)", filter: "blur(80px)" }}
                />
                <div className="relative aspect-[16/10] sm:aspect-[16/9]">
                  <TrackRecordChart data={historySeries} stats={stats} />
                </div>
              </div>

              {/* Floating badge, top-left: accuracy */}
              <div
                className="card-neon card-neon-green absolute -left-6 -top-5 hidden -rotate-[4deg] p-3 sm:block"
                style={{ width: 190 }}
              >
                <div className="flex items-center gap-2.5">
                  <HexBadge variant="green" size="sm" noGlow>
                    <Target className="h-3.5 w-3.5" />
                  </HexBadge>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
                      {t("track.accuracy")}
                    </p>
                    <p className="text-stat text-sm text-[#4ade80]">
                      {stats && stats.winrate > 0 ? `${Math.round(stats.winrate * 1000) / 10}%` : ","}
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating badge, bottom-right: total predictions */}
              <div
                className="card-neon card-neon-purple absolute -bottom-4 -right-4 hidden rotate-[4deg] p-3 sm:block"
                style={{ width: 190 }}
              >
                <div className="flex items-center gap-2.5">
                  <HexBadge variant="purple" size="sm" noGlow>
                    <BarChart3 className="h-3.5 w-3.5" />
                  </HexBadge>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
                      {t("track.metricPredictions")}
                    </p>
                    <p className="text-stat text-sm text-[#c4b5fd]">
                      {stats && stats.total > 0 ? stats.total.toLocaleString(locale) : ","}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          5b · PERSONA SEGMENTATION, 'who BetsPlug is for'
          Three persona cards. Same platform, different habits.
          Each card has its own CTA that routes to the most relevant
          entry point for that persona, reducing friction vs a single
          one-size-fits-all CTA.
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute right-1/2 top-10 h-[420px] w-[420px] translate-x-1/2 rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.14)", filter: "blur(150px)" }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 max-w-3xl">
            <span className="section-label">
              <Sparkles className="h-3 w-3" />
              {t("persona.badge")}
            </span>
            <h2 className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("persona.titleA")}{" "}
              <span className="gradient-text-green">{t("persona.titleB")}</span>
            </h2>
            <p className="mt-4 text-base text-[#a3a9b8]">{t("persona.subtitle")}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <PersonaCard
              variant="green"
              icon={Smartphone}
              title={t("persona.casualTitle")}
              pitch={t("persona.casualPitch")}
              features={[
                t("persona.casualFeature1"),
                t("persona.casualFeature2"),
                t("persona.casualFeature3"),
              ]}
              ctaLabel={t("persona.casualCta")}
              ctaHref={loc("/match-predictions")}
            />
            <PersonaCard
              variant="purple"
              icon={Calculator}
              title={t("persona.seriousTitle")}
              pitch={t("persona.seriousPitch")}
              features={[
                t("persona.seriousFeature1"),
                t("persona.seriousFeature2"),
                t("persona.seriousFeature3"),
              ]}
              ctaLabel={t("persona.seriousCta")}
              ctaHref={`${loc("/checkout")}?plan=gold`}
              highlight
            />
            <PersonaCard
              variant="blue"
              icon={Database}
              title={t("persona.quantTitle")}
              pitch={t("persona.quantPitch")}
              features={[
                t("persona.quantFeature1"),
                t("persona.quantFeature2"),
                t("persona.quantFeature3"),
              ]}
              ctaLabel={t("persona.quantCta")}
              ctaHref={loc("/track-record")}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          5b · POPULAR LEAGUES, SEO hub + conversion gateway
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-10 h-[360px] w-[560px] rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.1)", filter: "blur(140px)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 bottom-10 h-[340px] w-[520px] rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.08)", filter: "blur(140px)" }}
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <span className="section-label mx-auto">
              <Sparkles className="h-3 w-3" />
              {t("homeLeagues.eyebrow" as any)}
            </span>
            <h2 className="text-heading mt-3 text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("homeLeagues.title" as any)}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-balance text-base leading-relaxed text-[#a3a9b8] sm:text-lg">
              {t("homeLeagues.subtitle" as any)}
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {PRIMARY_LEAGUES.map((league) => {
              const logo = LEAGUE_LOGO_PATH[league.slug] ?? null;
              const name = getLeagueName(league, locale === "nl" ? "nl" : "en");
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
                    <p className="text-[10px] uppercase tracking-wider text-[#6b7280]">
                      {t("homeLeagues.cardHint" as any)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#6b7280] transition-all group-hover:translate-x-0.5 group-hover:text-[#4ade80]" />
                </Link>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Link
              href={loc("/match-predictions")}
              className="btn-glass inline-flex items-center gap-2"
            >
              {t("homeLeagues.ctaAll" as any)}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          6 · TESTIMONIALS
         ══════════════════════════════════════════════════════════════ */}
      {testimonials.length > 0 && (
        <TestimonialsSection testimonials={testimonials} />
      )}

      {/* ══════════════════════════════════════════════════════════════
          7 · COMPARISON TABLE, BetsPlug vs Others
         ══════════════════════════════════════════════════════════════ */}
      <ComparisonTable rows={comparisonRows} />

      {/* ══════════════════════════════════════════════════════════════
          8 · PRICING, 3 plans + Platinum Lifetime (shared component)
         ══════════════════════════════════════════════════════════════ */}
      <PricingSection pricingConfig={pricingConfig} />

      {/* ══════════════════════════════════════════════════════════════
          8b · RISK REVERSAL, sits right after Pricing to absorb
          the 'what if this doesn't work?' objection that kills
          conversion at the pricing step.
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20 md:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-[360px] w-[480px] rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.12)", filter: "blur(140px)" }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 max-w-3xl">
            <span className="section-label">
              <Shield className="h-3 w-3" />
              {t("riskReversal.badge")}
            </span>
            <h2 className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("riskReversal.titleA")}{" "}
              <span className="gradient-text-green">{t("riskReversal.titleB")}</span>
            </h2>
            <p className="mt-4 text-base text-[#a3a9b8]">{t("riskReversal.subtitle")}</p>
          </div>

          {/* "14 dagen geld-terug-garantie" card dropped here too —
              probability-model deliverables do not match the
              "satisfaction guarantee" framing (users unhappy with a
              losing match will claim the refund even though no
              outcome was ever promised). The statutory withdrawal
              right is handled via FAQ + contact, not a marketing
              badge. The two remaining cards (cancel any time + no
              card required for the Bronze trial) are factual
              operational promises, not outcome guarantees. */}
          <div className="grid gap-5 md:grid-cols-2">
            <RiskCard
              variant="purple"
              icon={XCircle}
              title={t("riskReversal.cancelTitle")}
              desc={t("riskReversal.cancelDesc")}
            />
            <RiskCard
              variant="blue"
              icon={CreditCard}
              title={t("riskReversal.noCardTitle")}
              desc={t("riskReversal.noCardDesc")}
            />
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href={`${loc("/checkout")}?plan=bronze`}
              className="btn-primary inline-flex items-center gap-1.5"
            >
              {t("riskReversal.cta")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          9 · SEO CONTENT + FAQ
         ══════════════════════════════════════════════════════════════ */}
      <SeoSection />

      {/* ══════════════════════════════════════════════════════════════
          7 · ARTICLES
         ══════════════════════════════════════════════════════════════ */}
      {latestArticles.length > 0 && (
        <section className="relative overflow-hidden py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="section-label">{t("articles.badge")}</span>
                <h2 className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl">
                  {t("articles.title")}
                </h2>
                <p className="mt-3 max-w-xl text-sm text-[#a3a9b8]">{t("articles.subtitle")}</p>
              </div>
              <Link href={loc("/articles")} className="btn-glass inline-flex items-center gap-1.5">
                {t("articles.checkAll")} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {latestArticles.map((a, idx) => {
                const variant = (["green", "purple", "blue"][idx % 3]) as "green" | "purple" | "blue";
                return (
                  <Link key={a.slug} href={loc(`/articles/${a.slug}`)} className="group block">
                    <div className={`card-neon card-neon-${variant} overflow-hidden`}>
                      <div
                        className="relative aspect-[16/9]"
                        style={{
                          background:
                            variant === "green"
                              ? "linear-gradient(135deg, hsl(var(--accent-green)/0.4), hsl(var(--accent-green)/0.05))"
                              : variant === "purple"
                              ? "linear-gradient(135deg, hsl(var(--accent-purple)/0.45), hsl(var(--accent-purple)/0.08))"
                              : "linear-gradient(135deg, hsl(var(--accent-blue)/0.35), hsl(var(--accent-blue)/0.05))",
                        }}
                      >
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage:
                              "radial-gradient(circle at 50% 50%, hsl(0 0% 100%/0.05) 2px, transparent 2px)",
                            backgroundSize: "22px 22px",
                          }}
                        />
                      </div>
                      <div className="p-5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4ade80]">
                          {a.sport}
                        </span>
                        <h3 className="text-heading mt-2 text-base text-[#ededed] transition-colors group-hover:text-[#4ade80]">
                          {a.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-xs text-[#a3a9b8]">{a.excerpt}</p>
                        <div
                          className="mt-3 flex items-center gap-3 border-t pt-3 text-[11px] text-[#6b7280]"
                          style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
                        >
                          <span>{new Date(a.publishedAt).toLocaleDateString(locale)}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {a.readingMinutes} min
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          8 · FINAL CTA
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="card-neon halo-green relative overflow-hidden p-6 text-center sm:p-10 md:p-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-[320px] w-[320px] rounded-full"
              style={{ background: "hsl(var(--accent-green) / 0.28)", filter: "blur(110px)" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -left-20 -bottom-20 h-[280px] w-[280px] rounded-full"
              style={{ background: "hsl(var(--accent-purple) / 0.24)", filter: "blur(110px)" }}
            />

            <div className="relative">
              <span className="section-label mx-auto">
                <Sparkles className="h-3 w-3" />
                {t("finalCta.badge")}
              </span>
              <h2 className="text-display mx-auto max-w-2xl text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                {t("finalCta.titleA")}{" "}
                <span className="gradient-text-green">{t("finalCta.titleHighlight")}</span>{" "}
                {t("finalCta.titleB")}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base text-[#a3a9b8]">
                {t("finalCta.subtitle")}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={`${loc("/checkout")}?plan=bronze`}
                  className="btn-primary inline-flex items-center gap-1.5"
                >
                  {t("finalCta.primary")} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={loc("/how-it-works")} className="btn-ghost">
                  {t("finalCta.secondary")}
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#6b7280]">
                {/* "14-day money-back guarantee" chip dropped — see the
                    risk-reversal section above for the rationale. The two
                    remaining chips are factual operational commitments. */}
                {[t("finalCta.cancelAnytime"), t("finalCta.instantAccess")].map(
                  (item) => (
                    <div key={item} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#4ade80]" />
                      <span>{item}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <BetsPlugFooter />

      {/* Floating social proof */}
      <SocialProofPopup />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Local sub-components
   ═══════════════════════════════════════════════════════════════ */

/** HeroPickRow — compact match row rendered in the hero widget.
 *
 * The team names and kickoff time are intentionally blurred on the
 * public homepage: the value proposition is "the AI has strong picks
 * for today" — not "here are three free picks you can bet on right
 * now". Blurring forces the qualified visitor to sign in / upgrade
 * to see the actual match, while the league, pick direction and
 * confidence remain legible so the preview still feels substantive.
 * Only the public marketing surface uses this row; logged-in users
 * see full match details on /predictions and /bet-of-the-day. */
function HeroPickRow({ pick, locale }: { pick: UpcomingPick; locale: string }) {
  const maxProb = Math.max(pick.home_prob, pick.draw_prob, pick.away_prob);
  const predicted =
    pick.home_prob === maxProb ? "home" : pick.draw_prob === maxProb ? "draw" : "away";
  const predictedSideLabel =
    predicted === "home"
      ? locale === "nl" ? "Thuis" : "Home"
      : predicted === "away"
        ? locale === "nl" ? "Uit" : "Away"
        : locale === "nl" ? "Gelijkspel" : "Draw";
  const pickPct = Math.max(pick.home_prob, pick.draw_prob, pick.away_prob);

  // Blurred style applied to the match-identifying content. CSS blur
  // keeps the layout intact (same width / height) so the widget
  // doesn't jump after login.
  const blurStyle: React.CSSProperties = {
    filter: "blur(6px)",
    userSelect: "none",
  };

  return (
    <div className="relative p-4 transition-colors hover:bg-white/[0.02]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* League + kickoff — both blurred so visitors can't cross-
              reference a specific league + date to identify the match
              on another fixture site. Only the pick direction and the
              win-probability chip stay legible. */}
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
            <span
              className="truncate text-[#4ade80]"
              style={blurStyle}
              aria-hidden
            >
              {pick.league}
            </span>
            <span className="text-[#3a3f4a]">·</span>
            <span
              className="flex items-center gap-1 text-[#6b7280]"
              style={blurStyle}
              aria-hidden
            >
              <Clock className="h-2.5 w-2.5" />
              {formatKickoff(pick.kickoff, locale)}
            </span>
          </div>

          {/* Teams — blurred to hide the match until sign-in */}
          <div
            className="mt-1.5 flex min-w-0 items-center gap-2"
            style={blurStyle}
            aria-hidden
          >
            {pick.home_logo && (
              <Image
                src={pick.home_logo}
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 flex-shrink-0 object-contain"
              />
            )}
            <span className="min-w-0 truncate text-sm font-semibold text-[#ededed]">
              {pick.home_team}
            </span>
            <span className="flex-shrink-0 text-[10px] text-[#6b7280]">vs</span>
            <span className="min-w-0 truncate text-sm font-semibold text-[#ededed]">
              {pick.away_team}
            </span>
            {pick.away_logo && (
              <Image
                src={pick.away_logo}
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 flex-shrink-0 object-contain"
              />
            )}
          </div>

          {/* Predicted pick label — side only (Home/Draw/Away), not team name */}
          <p className="mt-1.5 text-[11px] text-[#a3a9b8]">
            {locale === "nl" ? "Keuze" : "Pick"}:{" "}
            <span className="font-semibold text-[#ededed]">
              {predictedSideLabel}
            </span>
          </p>
        </div>

        {/* Probability chip — stays visible, this is the value we sell */}
        <DataChip tone="win" className="flex-shrink-0">
          {pickPct}%
        </DataChip>
      </div>
    </div>
  );
}

function ChartStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">{label}</p>
      <p className="text-stat mt-0.5 text-base text-[#ededed] sm:text-lg">{value}</p>
    </div>
  );
}

/** PasStatCard, one of the three pain-stat cards in the PAS block. */
function PasStatCard({
  icon: Icon,
  value,
  label,
  desc,
}: {
  icon: typeof Shield;
  value: string;
  label: string;
  desc: string;
}) {
  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-2xl border p-6 sm:p-7"
      style={{
        borderColor: "hsl(0 0% 100% / 0.06)",
        background: "hsl(0 0% 100% / 0.025)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{
            background: "hsl(0 72% 60% / 0.12)",
            color: "hsl(0 72% 66%)",
          }}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
          Industry average
        </span>
      </div>
      <p className="text-stat mt-5 text-4xl text-[#ededed] sm:text-5xl">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[#ededed]">{label}</p>
      <p className="mt-3 text-sm leading-relaxed text-[#a3a9b8]">{desc}</p>
    </div>
  );
}

/** PersonaCard, one of the three persona cards in the segmentation block. */
function PersonaCard({
  variant,
  icon: Icon,
  title,
  pitch,
  features,
  ctaLabel,
  ctaHref,
  highlight,
}: {
  variant: "green" | "purple" | "blue";
  icon: typeof Shield;
  title: string;
  pitch: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`card-neon card-neon-${variant} relative flex flex-col overflow-hidden p-6 sm:p-7`}
    >
      {highlight && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 h-[240px] w-[80%] -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse, hsl(var(--accent-purple) / 0.38), transparent 65%)",
            filter: "blur(40px)",
          }}
        />
      )}

      <div className="relative flex flex-col">
        <div className="flex items-center justify-between">
          <HexBadge variant={variant} size="lg">
            <Icon className="h-6 w-6" strokeWidth={2} />
          </HexBadge>
          {highlight && (
            <span className="rounded-full bg-[hsl(var(--accent-purple))] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              Most users
            </span>
          )}
        </div>

        <h3 className="text-heading mt-5 text-xl text-[#ededed] sm:text-2xl">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-[#a3a9b8]">{pitch}</p>

        <ul className="mt-5 space-y-2">
          {features.map((f) => (
            <li
              key={f}
              className="flex items-start gap-2.5 text-sm text-[#a3a9b8]"
            >
              <CheckCircle2
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#4ade80]"
                strokeWidth={2.25}
              />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href={ctaHref}
        className={`relative mt-6 inline-flex w-full items-center justify-center gap-1.5 ${
          highlight ? "btn-primary" : "btn-glass"
        }`}
      >
        {ctaLabel} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

/** RiskCard, one of the three risk-reversal cards. */
function RiskCard({
  variant,
  icon: Icon,
  title,
  desc,
}: {
  variant: "green" | "purple" | "blue";
  icon: typeof Shield;
  title: string;
  desc: string;
}) {
  return (
    <div
      className={`card-neon card-neon-${variant} relative flex flex-col overflow-hidden p-6 sm:p-7`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-14 left-1/2 h-[160px] w-[70%] -translate-x-1/2 rounded-full opacity-70"
        style={{
          background:
            variant === "green"
              ? "radial-gradient(ellipse, hsl(var(--accent-green) / 0.28), transparent 60%)"
              : variant === "purple"
              ? "radial-gradient(ellipse, hsl(var(--accent-purple) / 0.30), transparent 60%)"
              : "radial-gradient(ellipse, hsl(var(--accent-blue) / 0.26), transparent 60%)",
          filter: "blur(40px)",
        }}
      />
      <div className="relative flex items-start gap-4">
        <HexBadge variant={variant} size="md">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </HexBadge>
        <div className="min-w-0 flex-1">
          <h3 className="text-heading text-lg text-[#ededed]">{title}</h3>
        </div>
      </div>
      <p className="relative mt-4 text-sm leading-relaxed text-[#a3a9b8]">{desc}</p>
    </div>
  );
}

function BigFeatureCard({
  variant,
  icon: Icon,
  tag,
  title,
  desc,
  href,
  cta,
}: {
  variant: "green" | "purple" | "blue";
  icon: typeof Shield;
  tag: string;
  title: string;
  desc: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className={`card-neon card-neon-${variant} relative flex flex-col overflow-hidden p-6 sm:p-7`}>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 left-1/2 h-[200px] w-[75%] -translate-x-1/2 rounded-full opacity-70"
        style={{
          background:
            variant === "green"
              ? "radial-gradient(ellipse, hsl(var(--accent-green) / 0.38), transparent 60%)"
              : variant === "purple"
              ? "radial-gradient(ellipse, hsl(var(--accent-purple) / 0.42), transparent 60%)"
              : "radial-gradient(ellipse, hsl(var(--accent-blue) / 0.35), transparent 60%)",
          filter: "blur(40px)",
        }}
      />
      <div className="relative flex flex-col">
        <div className="mb-5 flex items-center justify-between">
          <HexBadge variant={variant} size="lg">
            <Icon className="h-6 w-6" strokeWidth={2} />
          </HexBadge>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">{tag}</span>
        </div>
        <h3 className="text-heading text-xl text-[#ededed] sm:text-2xl">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-[#a3a9b8]">{desc}</p>
        {href && cta && (
          <Link
            href={href}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#4ade80] transition-colors hover:text-[#86efac]"
          >
            {cta} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

function PlanCard({
  name,
  tagline,
  price,
  period,
  icon: Icon,
  variant,
  popular,
  features,
  ctaHref,
  ctaLabel,
}: {
  name: string;
  tagline: string;
  price: string;
  period: string;
  icon: typeof Shield;
  variant: "green" | "purple" | "blue";
  popular?: boolean;
  features: string[];
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className={`card-neon card-neon-${variant} relative flex flex-col overflow-hidden p-6 sm:p-7`}>
      {popular && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 h-[250px] w-[80%] -translate-x-1/2 rounded-full"
          style={{
            background: "radial-gradient(ellipse, hsl(var(--accent-green) / 0.32), transparent 65%)",
            filter: "blur(40px)",
          }}
        />
      )}

      <div className="relative flex-1">
        <div className="flex items-start justify-between">
          <HexBadge variant={variant} size="md">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </HexBadge>
          {popular && (
            <span className="rounded-full bg-[#4ade80] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#05130b]">
              Popular
            </span>
          )}
        </div>

        <h3 className="text-heading mt-5 text-xl text-[#ededed] sm:text-2xl">{name}</h3>
        <p className="mt-1 text-sm text-[#a3a9b8]">{tagline}</p>

        <div className="mt-5 flex items-baseline gap-2">
          <span className="text-stat text-3xl text-[#ededed] sm:text-4xl">{price}</span>
          <span className="text-xs text-[#6b7280]">/ {period}</span>
        </div>

        <ul className="mt-5 space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-[#a3a9b8]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#4ade80]" strokeWidth={2.25} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href={ctaHref}
        className={`mt-5 inline-flex w-full items-center justify-center gap-1.5 ${
          popular ? "btn-primary" : "btn-glass"
        }`}
      >
        {ctaLabel} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default HomeContent;
