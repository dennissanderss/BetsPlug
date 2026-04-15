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
  Trophy,
  Clock,
  Zap,
  Eye,
  Star,
  Activity,
  ChevronRight,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill, DataChip } from "@/components/noct/pill";
import type { Article } from "@/data/articles";
import type { Testimonial } from "@/components/ui/testimonials-section";
import type { ComparisonRow } from "@/components/ui/comparison-table";
import { getLocaleValue } from "@/lib/sanity-data";

/* Heavy shared sections loaded dynamically */
const LeaguesTicker = dynamic(() => import("@/components/ui/leagues-ticker").then(m => m.LeaguesTicker), { ssr: true });
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

function useBotdStats() {
  const [data, setData] = useState<{ accuracy_pct: number; total_picks: number; correct: number } | null>(null);
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    fetch(`${API}/bet-of-the-day/track-record`).then(r => r.json()).then(setData).catch(() => {});
  }, []);
  return data;
}

interface HomepageStats {
  total: number;
  correct: number;
  winrate: number; // 0–1
}

/**
 * 30-day rolling winrate across all evaluated free picks.
 * Source of truth for the track-record block on the homepage.
 * Returns null until the fetch resolves → render "—" in that window.
 */
function useHomepageStats(): HomepageStats | null {
  const [stats, setStats] = useState<HomepageStats | null>(null);
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    fetch(`${API}/homepage/free-picks`)
      .then(r => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((d: any) => {
        const s = d?.stats;
        if (s && typeof s.total === "number") {
          setStats({
            total: s.total,
            correct: s.correct ?? 0,
            winrate: typeof s.winrate === "number" ? s.winrate : 0,
          });
        }
      })
      .catch(() => {});
  }, []);
  return stats;
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

/** Today's 3 free picks for the hero widget. */
function useUpcomingPicks(): UpcomingPick[] {
  const [picks, setPicks] = useState<UpcomingPick[]>([]);
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    fetch(`${API}/homepage/free-picks`)
      .then((r) => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((d: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const arr: any[] = d?.today ?? [];
        setPicks(
          arr.slice(0, 3).map((p) => ({
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
          }))
        );
      })
      .catch(() => {});
  }, []);
  return picks;
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
   HomeContent — landing page flow with NOCTURNE app-UI styling
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
  const botd = useBotdStats();
  const stats = useHomepageStats();
  const picks = useUpcomingPicks();

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
          1 · HERO — text left, premium prediction card right
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
        {/* Ambient hero glows */}
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
                className="text-display text-4xl text-[#ededed] sm:text-5xl lg:text-6xl"
              >
                {t("hero.titleLine1")}{" "}
                <span className="gradient-text-green">{t("hero.titleLine2")}</span>
                {t("hero.titleLine3") ? (
                  <>
                    <br />
                    {t("hero.titleLine3")}
                  </>
                ) : null}
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
                  { icon: Brain, title: t("hero.usp1Title"), variant: "green" as const },
                  { icon: Target, title: t("hero.usp2Title"), variant: "purple" as const },
                  { icon: CheckCircle2, title: t("hero.usp3Title"), variant: "blue" as const },
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

            {/* Prediction preview — app widget */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
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
                        {t("hero.freePrediction")}
                      </p>
                      <p className="text-sm font-semibold text-[#ededed]">
                        {t("home.freePredTitle")}
                      </p>
                    </div>
                  </div>
                  <Pill className="pill-active">
                    <span className="live-dot" />
                    Live
                  </Pill>
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

              {/* Floating mini-cards for depth */}
              <div
                className="card-neon card-neon-purple absolute -left-8 -top-6 hidden -rotate-[5deg] p-3 sm:block"
                style={{ width: 200 }}
              >
                <div className="flex items-center gap-2.5">
                  <HexBadge variant="purple" size="sm" noGlow>
                    <TrendingUp className="h-3.5 w-3.5" />
                  </HexBadge>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
                      {t("dash.pickOfDay")}
                    </p>
                    <p className="text-stat text-sm text-[#c4b5fd]">
                      {botd?.accuracy_pct != null ? `${botd.accuracy_pct}%` : "—"}
                    </p>
                  </div>
                </div>
              </div>
              <div
                className="card-neon card-neon-blue absolute -right-4 -bottom-4 hidden rotate-[4deg] p-3 sm:block"
                style={{ width: 180 }}
              >
                <div className="flex items-center gap-2.5">
                  <HexBadge variant="blue" size="sm" noGlow>
                    <Trophy className="h-3.5 w-3.5" />
                  </HexBadge>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
                      {t("home.freePredRecord")}
                    </p>
                    <p className="text-stat text-sm text-[#93c5fd]">
                      {botd?.correct ?? "—"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          2 · LEAGUES TICKER
         ══════════════════════════════════════════════════════════════ */}
      <LeaguesTicker />

      {/* ══════════════════════════════════════════════════════════════
          3 · FEATURES — 3 premium feature cards
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
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
            <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
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
          4 · HOW IT WORKS — 3 premium step cards
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full"
          style={{ background: "hsl(var(--accent-blue) / 0.1)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <span className="section-label">{t("how.badge")}</span>
            <h2 className="text-heading mx-auto max-w-2xl text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("how.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-[#a3a9b8]">{t("how.subtitle")}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              { num: "01", icon: Zap, title: t("how.step1Title"), desc: t("how.step1Desc"), variant: "green" as const },
              { num: "02", icon: Star, title: t("how.step2Title"), desc: t("how.step2Desc"), variant: "purple" as const },
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
          5 · TRACK RECORD — split section
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 bottom-0 h-[400px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.12)", filter: "blur(140px)" }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <span className="section-label">
                <TrendingUp className="h-3 w-3" />
                {t("track.label")}
              </span>
              <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                {t("track.titleA")}{" "}
                <span className="gradient-text-green">{t("track.titleHighlight")}</span>{" "}
                {t("track.titleB")}
              </h2>
              <p className="mt-4 max-w-xl text-base text-[#a3a9b8]">{t("track.accuracy")}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={loc("/track-record")} className="btn-primary inline-flex items-center gap-1.5">
                  {t("nav.trackRecord")} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={loc("/predictions")} className="btn-glass">
                  {t("home.freePredCta")}
                </Link>
              </div>
            </div>

            <div className="card-neon card-neon-green halo-green relative overflow-hidden p-6">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-12 h-[200px] w-[200px] rounded-full"
                style={{ background: "hsl(var(--accent-green) / 0.3)", filter: "blur(80px)" }}
              />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                    {t("home.freePredWinrate")}
                  </p>
                  <p className="text-stat mt-1 text-4xl text-[#ededed] sm:text-5xl">
                    {stats
                      ? `${Math.round(stats.winrate * 1000) / 10}%`
                      : "—"}
                  </p>
                  <p className="mt-1 text-xs text-[#6b7280]">
                    {stats
                      ? `Across ${stats.total.toLocaleString(locale)} picks (30d)`
                      : "Loading 30-day stats…"}
                  </p>
                </div>
                {stats && stats.total > 0 && (
                  <Pill tone="win">
                    {stats.correct}/{stats.total}
                  </Pill>
                )}
              </div>

              <div className="relative mt-6 h-36 sm:h-44">
                <svg viewBox="0 0 400 180" className="h-full w-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="homeChart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 140 L 40 120 L 80 130 L 120 90 L 160 100 L 200 70 L 240 80 L 280 50 L 320 60 L 360 30 L 400 40 L 400 180 L 0 180 Z"
                    fill="url(#homeChart)"
                  />
                  <path
                    d="M 0 140 L 40 120 L 80 130 L 120 90 L 160 100 L 200 70 L 240 80 L 280 50 L 320 60 L 360 30 L 400 40"
                    fill="none"
                    stroke="#4ade80"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: "drop-shadow(0 0 8px rgba(74,222,128,0.7))" }}
                  />
                  {[[160, 100], [280, 50], [360, 30]].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="4" fill="#4ade80" />
                  ))}
                </svg>
              </div>

              <div className="relative mt-4 grid grid-cols-3 gap-2 border-t pt-4" style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}>
                <ChartStat
                  label={t("track.metricPredictions")}
                  value={stats?.total != null ? stats.total.toLocaleString(locale) : "—"}
                />
                <ChartStat label={t("track.metricModels")} value="4" />
                <ChartStat label={t("track.metricLeagues")} value="30+" />
              </div>
            </div>
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
          7 · COMPARISON TABLE — BetsPlug vs Others
         ══════════════════════════════════════════════════════════════ */}
      <ComparisonTable rows={comparisonRows} />

      {/* ══════════════════════════════════════════════════════════════
          8 · PRICING — 3 plans + Platinum Lifetime (shared component)
         ══════════════════════════════════════════════════════════════ */}
      <PricingSection pricingConfig={pricingConfig} />

      {/* ══════════════════════════════════════════════════════════════
          9 · SEO CONTENT + FAQ
         ══════════════════════════════════════════════════════════════ */}
      <SeoSection />

      {/* ══════════════════════════════════════════════════════════════
          7 · ARTICLES
         ══════════════════════════════════════════════════════════════ */}
      {latestArticles.length > 0 && (
        <section className="relative py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="section-label">{t("articles.badge")}</span>
                <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl">
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
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="card-neon halo-green relative overflow-hidden p-10 text-center md:p-16">
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
              <h2 className="text-display mx-auto max-w-2xl text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
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
                {[t("finalCta.moneyBack"), t("finalCta.cancelAnytime"), t("finalCta.instantAccess")].map(
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

/** HeroPickRow — compact match row rendered in the hero widget. */
function HeroPickRow({ pick, locale }: { pick: UpcomingPick; locale: string }) {
  const maxProb = Math.max(pick.home_prob, pick.draw_prob, pick.away_prob);
  const predicted =
    pick.home_prob === maxProb ? "home" : pick.draw_prob === maxProb ? "draw" : "away";
  const predictedLabel =
    predicted === "home" ? pick.home_team : predicted === "away" ? pick.away_team : "Draw";
  const pickPct = Math.max(pick.home_prob, pick.draw_prob, pick.away_prob);

  return (
    <div className="relative p-4 transition-colors hover:bg-white/[0.02]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* League + kickoff */}
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
            <span className="truncate text-[#4ade80]">{pick.league}</span>
            <span className="text-[#3a3f4a]">·</span>
            <span className="flex items-center gap-1 text-[#6b7280]">
              <Clock className="h-2.5 w-2.5" />
              {formatKickoff(pick.kickoff, locale)}
            </span>
          </div>

          {/* Teams */}
          <div className="mt-1.5 flex items-center gap-2">
            {pick.home_logo && (
              <Image
                src={pick.home_logo}
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 flex-shrink-0 object-contain"
              />
            )}
            <span className="truncate text-sm font-semibold text-[#ededed]">
              {pick.home_team}
            </span>
            <span className="text-[10px] text-[#6b7280]">vs</span>
            <span className="truncate text-sm font-semibold text-[#ededed]">
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

          {/* Predicted pick label */}
          <p className="mt-1.5 text-[11px] text-[#a3a9b8]">
            Pick: <span className="font-semibold text-[#ededed]">{predictedLabel}</span>
          </p>
        </div>

        {/* Probability chip */}
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
