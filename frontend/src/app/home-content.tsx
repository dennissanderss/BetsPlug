"use client";

import Image from "next/image";
import Link from "next/link";
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
  RefreshCw,
  Star,
  ChevronRight,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { HexBadge } from "@/components/noct/hex-badge";
import { GlassPanel } from "@/components/noct/glass-panel";
import { Pill, DataChip, TrustScore } from "@/components/noct/pill";
import type { Article } from "@/data/articles";
import type { Testimonial } from "@/components/ui/testimonials-section";

/* ─── Data hooks ─────────────────────────────────────────────── */

interface FeaturedMatch {
  available: boolean;
  home_team: string | null;
  away_team: string | null;
  league: string | null;
  kickoff: string | null;
  home_win_prob: number | null;
  draw_prob: number | null;
  away_win_prob: number | null;
  confidence: number | null;
}

function useFeaturedMatch() {
  const [data, setData] = useState<FeaturedMatch | null>(null);
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    fetch(`${API}/homepage/featured-match`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null));
  }, []);
  return data;
}

function useBotdStats() {
  const [data, setData] = useState<{
    accuracy_pct: number;
    total_picks: number;
    correct: number;
  } | null>(null);
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    fetch(`${API}/bet-of-the-day/track-record`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);
  return data;
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

function useUpcomingPicks(): UpcomingPick[] {
  const [picks, setPicks] = useState<UpcomingPick[]>([]);
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    fetch(`${API}/homepage/free-picks`)
      .then((r) => r.json())
      .then((d) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: any[] = d?.today ?? [];
        setPicks(
          items.slice(0, 3).map((p) => ({
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
          })),
        );
      })
      .catch(() => {});
  }, []);
  return picks;
}

/* ─── Animated counter ───────────────────────────────────────── */
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
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

/* ─── Helpers ────────────────────────────────────────────────── */
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

/* ═══════════════════════════════════════════════════════════════
   HomeContent — NOCTURNE homepage.
   Flow: Hero → Stats strip → Features → Live picks → How it works
         → Track record → Pricing preview → Articles → Final CTA.
   ═══════════════════════════════════════════════════════════════ */

interface HomeContentProps {
  articles: Article[];
  /** Legacy props retained for server/page compatibility; not used here. */
  testimonials?: Testimonial[];
  homepage?: unknown;
  pricingConfig?: unknown;
}

export function HomeContent({ articles }: HomeContentProps) {
  const { t, locale } = useTranslations();
  const loc = useLocalizedHref();
  const featured = useFeaturedMatch();
  const botd = useBotdStats();
  const picks = useUpcomingPicks();

  const latestArticles = [...(articles ?? [])]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen">
      <SiteNav />

      {/* ═══════════════════════════════════════════════════════════
          HERO
         ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
            {/* Copy */}
            <div>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
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
                transition={{ duration: 0.7, delay: 0.3 }}
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

            {/* Prediction preview panel */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:block"
            >
              <GlassPanel variant="raised" glow="green" className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <span className="pill" style={{ borderColor: "hsl(var(--accent-green)/0.3)" }}>
                    <span className="live-dot" />
                    {t("hero.freePrediction") || "Free prediction"}
                  </span>
                  <Pill tone="purple">
                    <Sparkles className="h-3 w-3" /> {t("hero.hot")}
                  </Pill>
                </div>

                <p className="text-xs text-[#6b7280]">{t("track.label") || "Match"}</p>
                <p className="mt-1 text-xl font-semibold text-[#ededed]">
                  {featured?.available
                    ? `${featured.home_team} vs ${featured.away_team}`
                    : "Arsenal vs Chelsea"}
                </p>

                <div
                  className="mt-5 rounded-xl p-4"
                  style={{
                    background: "hsl(230 20% 6% / 0.6)",
                    border: "1px solid hsl(0 0% 100% / 0.06)",
                  }}
                >
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-sm text-[#a3a9b8]">{t("hero.homeWin")}</span>
                    <span className="text-stat text-3xl text-[#4ade80]">
                      {featured?.available
                        ? `${Math.round((featured.home_win_prob ?? 0.52) * 100)}%`
                        : "52%"}
                    </span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full"
                    style={{ background: "hsl(0 0% 100% / 0.06)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${
                          featured?.available
                            ? Math.round((featured.home_win_prob ?? 0.52) * 100)
                            : 52
                        }%`,
                        background: "linear-gradient(90deg, #22c55e, #4ade80)",
                        boxShadow: "0 0 10px hsl(var(--accent-green)/0.6)",
                      }}
                    />
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-[#6b7280]">
                    <span>
                      {t("hero.draw")}{" "}
                      {featured?.available
                        ? `${Math.round((featured.draw_prob ?? 0.24) * 100)}%`
                        : "24%"}
                    </span>
                    <span>
                      {t("hero.away")}{" "}
                      {featured?.available
                        ? `${Math.round((featured.away_win_prob ?? 0.24) * 100)}%`
                        : "24%"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <StatCell
                    label={t("hero.confidence")}
                    value={
                      featured?.available
                        ? `${Math.round((featured.confidence ?? 0.78) * 100)}%`
                        : "78%"
                    }
                  />
                  <StatCell label="Accuracy" value={`${botd?.accuracy_pct ?? 66.5}%`} />
                  <StatCell label="Picks" value="5+" />
                </div>

                <Link href={loc("/predictions")} className="btn-primary mt-5 flex w-full items-center justify-center gap-2">
                  {t("hero.joinNow")} <ArrowRight className="h-4 w-4" />
                </Link>
              </GlassPanel>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          STATS STRIP
         ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile label="Accuracy" value={`${botd?.accuracy_pct ?? 66.5}%`} variant="green" />
            <StatTile label="Picks tracked" value={botd?.total_picks?.toLocaleString() ?? "346"} variant="purple" />
            <StatTile label="Leagues" value="30+" variant="blue" />
            <StatTile label="Active users" value="1,500+" variant="green" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FEATURES — 3 hex-badge tiles (Nerdytips language)
         ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <span className="section-label">{t("trusted.titleHighlight") || "Why BetsPlug"}</span>
            <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("trusted.titleA")}{" "}
              <span className="gradient-text-green">{t("trusted.titleHighlight")}</span>{" "}
              {t("trusted.titleB")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-[#a3a9b8]">
              {t("trusted.subtitle")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <GlassPanel variant="lifted" featureTile="green" className="p-8 text-center">
              <div className="relative flex flex-col items-center">
                <HexBadge variant="green" size="lg" className="mb-6">
                  <Shield className="h-6 w-6" strokeWidth={2} />
                </HexBadge>
                <h3 className="text-heading text-xl text-[#ededed] sm:text-2xl">
                  {t("trusted.card1Title")}
                </h3>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#a3a9b8]">
                  {t("trusted.card1Desc")}
                </p>
              </div>
            </GlassPanel>
            <GlassPanel variant="lifted" featureTile="purple" className="p-8 text-center">
              <div className="relative flex flex-col items-center">
                <HexBadge variant="purple" size="lg" className="mb-6">
                  <Brain className="h-6 w-6" strokeWidth={2} />
                </HexBadge>
                <h3 className="text-heading text-xl text-[#ededed] sm:text-2xl">
                  {t("trusted.card2Title")}
                </h3>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#a3a9b8]">
                  {t("trusted.card2Desc")}
                </p>
                <Link
                  href={loc("/track-record")}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#d8b4fe] transition-colors hover:text-[#e9d5ff]"
                >
                  {t("trusted.learnMore")} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </GlassPanel>
            <GlassPanel variant="lifted" featureTile="blue" className="p-8 text-center">
              <div className="relative flex flex-col items-center">
                <HexBadge variant="blue" size="lg" className="mb-6">
                  <CheckCircle2 className="h-6 w-6" strokeWidth={2} />
                </HexBadge>
                <h3 className="text-heading text-xl text-[#ededed] sm:text-2xl">
                  {t("trusted.card3Title")}
                </h3>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#a3a9b8]">
                  {t("trusted.card3Desc")}
                </p>
              </div>
            </GlassPanel>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          LIVE PICKS — 3 glass data-rows
         ═══════════════════════════════════════════════════════════ */}
      {picks.length > 0 && (
        <section className="relative py-20 md:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="mb-10 flex items-center justify-between gap-4">
              <div>
                <span className="section-label">
                  <Zap className="h-3 w-3" />
                  {t("home.freePredBadge") || "Free picks"}
                </span>
                <h2 className="text-heading text-2xl text-[#ededed] sm:text-3xl">
                  {t("home.freePredTitle") || "Today's free picks"}
                </h2>
              </div>
              <Link href={loc("/match-predictions")} className="btn-glass hidden sm:inline-flex">
                {t("home.freePredCta") || "See all"} <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              {picks.map((p, i) => (
                <MatchRow key={i} pick={p} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          HOW IT WORKS — 3 steps
         ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <span className="section-label">{t("how.badge") || "Process"}</span>
            <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("how.title") || "Three steps. Full transparency."}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-[#a3a9b8]">
              {t("how.subtitle")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { num: "01", icon: Zap, title: t("how.step1Title"), desc: t("how.step1Desc"), variant: "green" as const },
              { num: "02", icon: Star, title: t("how.step2Title"), desc: t("how.step2Desc"), variant: "purple" as const },
              { num: "03", icon: Eye, title: t("how.step3Title"), desc: t("how.step3Desc"), variant: "blue" as const },
            ].map(({ num, icon: Icon, title, desc, variant }) => (
              <GlassPanel key={num} variant="lifted" className="p-8">
                <div className="flex items-start gap-4">
                  <HexBadge variant={variant} size="md">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </HexBadge>
                  <div>
                    <span className="text-xs font-semibold text-[#6b7280]">STEP {num}</span>
                    <h3 className="mt-1 text-heading text-lg text-[#ededed]">{title}</h3>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-[#a3a9b8]">{desc}</p>
              </GlassPanel>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          TRACK RECORD SNAPSHOT
         ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <span className="section-label">
                <TrendingUp className="h-3 w-3" />
                {t("track.label") || "Track record"}
              </span>
              <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                {t("trusted.titleC") || "See our real results — nothing hidden."}
              </h2>
              <p className="mt-4 max-w-xl text-base text-[#a3a9b8]">
                {t("track.accuracy")}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={loc("/track-record")} className="btn-primary inline-flex items-center gap-1.5">
                  {t("nav.trackRecord")} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={loc("/predictions")} className="btn-glass">
                  {t("home.freePredCta") || "Browse predictions"}
                </Link>
              </div>
            </div>

            <GlassPanel variant="lifted" glow="green" className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                    {t("track.label") || "Accuracy"}
                  </p>
                  <p className="text-stat mt-1 text-4xl text-[#ededed]">
                    {botd?.accuracy_pct ?? 75.4}%
                  </p>
                  <p className="mt-1 text-xs text-[#6b7280]">
                    Across {botd?.total_picks ?? 1284} picks
                  </p>
                </div>
                <Pill tone="win">▲ +5.45%</Pill>
              </div>

              <div className="mt-6 relative h-44">
                <svg viewBox="0 0 400 180" className="h-full w-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 140 L 40 120 L 80 130 L 120 90 L 160 100 L 200 70 L 240 80 L 280 50 L 320 60 L 360 30 L 400 40 L 400 180 L 0 180 Z"
                    fill="url(#chartGrad)"
                  />
                  <path
                    d="M 0 140 L 40 120 L 80 130 L 120 90 L 160 100 L 200 70 L 240 80 L 280 50 L 320 60 L 360 30 L 400 40"
                    fill="none"
                    stroke="#4ade80"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: "drop-shadow(0 0 6px rgba(74,222,128,0.5))" }}
                  />
                </svg>
              </div>

              <div
                className="mt-4 grid grid-cols-3 gap-2 border-t pt-4"
                style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
              >
                <StatCell label="Predictions" value={botd?.total_picks?.toLocaleString() ?? "1,284"} />
                <StatCell label="Models" value="4" />
                <StatCell label="Leagues" value="30+" />
              </div>
            </GlassPanel>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PRICING PREVIEW
         ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <span className="section-label">{t("pricing.badge") || "Pricing"}</span>
            <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("pricing.title") || "Pick the plan that fits"}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-[#a3a9b8]">{t("pricing.subtitle")}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <PlanCard
              name="Bronze"
              tagline="7-day full access trial"
              price="€0,01"
              period="7 days"
              icon={Shield}
              variant="blue"
              features={["Full Gold access", "All predictions", "Pick of the Day", "Cancel anytime"]}
              ctaHref={`${loc("/checkout")}?plan=bronze`}
              ctaLabel={t("hero.ctaPrimary") || "Start trial"}
            />
            <PlanCard
              name="Gold"
              tagline="Most popular — full access"
              price="€14,99"
              period="month"
              icon={Star}
              variant="green"
              popular
              features={[
                "All 30+ leagues worldwide",
                "Daily Pick of the Day",
                "Report exports (CSV/JSON/PDF)",
                "Gold Telegram community",
              ]}
              ctaHref={`${loc("/checkout")}?plan=gold`}
              ctaLabel="Start Gold"
            />
            <PlanCard
              name="Platinum Lifetime"
              tagline="Founder-tier · Pay once"
              price="€199"
              period="one-time"
              icon={Trophy}
              variant="purple"
              features={[
                "Lifetime Gold access",
                "Private Platinum Telegram",
                "Lifetime price lock",
                "Early access to new features",
              ]}
              ctaHref={`${loc("/checkout")}?plan=platinum`}
              ctaLabel="Claim lifetime"
            />
          </div>

          <div className="mt-10 flex justify-center">
            <Link href={loc("/pricing")} className="btn-glass inline-flex items-center gap-1.5">
              Compare all plans <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          ARTICLES
         ═══════════════════════════════════════════════════════════ */}
      {latestArticles.length > 0 && (
        <section className="relative py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="section-label">{t("articles.badge") || "Learn"}</span>
                <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl">
                  {t("articles.title") || "Latest analysis"}
                </h2>
                <p className="mt-3 max-w-xl text-sm text-[#a3a9b8]">{t("articles.subtitle")}</p>
              </div>
              <Link href={loc("/articles")} className="btn-glass inline-flex items-center gap-1.5">
                {t("articles.checkAll") || "Check all"} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestArticles.map((a) => (
                <Link
                  key={a.slug}
                  href={loc(`/articles/${a.slug}`)}
                  className="group block"
                >
                  <GlassPanel variant="lifted" className="overflow-hidden">
                    <div
                      className="relative aspect-[16/9]"
                      style={{
                        background: "linear-gradient(135deg, hsl(var(--accent-green)/0.2), hsl(var(--accent-purple)/0.15))",
                      }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage:
                            "radial-gradient(circle at 50% 50%, hsl(var(--accent-green)/0.15) 2px, transparent 2px)",
                          backgroundSize: "20px 20px",
                        }}
                      />
                    </div>
                    <div className="p-6">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4ade80]">
                        {a.sport}
                      </span>
                      <h3 className="mt-2 text-heading text-lg text-[#ededed] transition-colors group-hover:text-[#4ade80]">
                        {a.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-[#a3a9b8]">{a.excerpt}</p>
                      <div
                        className="mt-4 flex items-center gap-3 border-t pt-3 text-xs text-[#6b7280]"
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
                  </GlassPanel>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          FINAL CTA
         ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <GlassPanel variant="raised" glow="green" className="relative overflow-hidden p-10 text-center md:p-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-[280px] w-[280px] rounded-full"
              style={{ background: "hsl(var(--accent-green) / 0.2)", filter: "blur(100px)" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -left-20 -bottom-20 h-[240px] w-[240px] rounded-full"
              style={{ background: "hsl(var(--accent-purple) / 0.18)", filter: "blur(100px)" }}
            />

            <div className="relative">
              <span className="section-label mx-auto">
                <Sparkles className="h-3 w-3" />
                {t("finalCta.badge") || "Ready to try it?"}
              </span>
              <h2 className="text-display text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
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
                {[
                  t("finalCta.moneyBack"),
                  t("finalCta.cancelAnytime"),
                  t("finalCta.instantAccess"),
                ].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#4ade80]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassPanel>
        </div>
      </section>

      <BetsPlugFooter />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Local sub-components
   ═══════════════════════════════════════════════════════════════ */

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg p-2 text-center"
      style={{
        background: "hsl(230 20% 6% / 0.5)",
        border: "1px solid hsl(0 0% 100% / 0.06)",
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#ededed]">{value}</p>
    </div>
  );
}

function StatTile({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: "green" | "purple" | "blue";
}) {
  const iconMap = { green: TrendingUp, purple: Brain, blue: Target };
  const Icon = iconMap[variant];
  return (
    <GlassPanel variant="default" className="flex items-center gap-3 p-4 sm:p-5">
      <HexBadge variant={variant} size="sm">
        <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
      </HexBadge>
      <div className="min-w-0">
        <p className="text-stat text-lg leading-tight text-[#ededed] sm:text-xl">{value}</p>
        <p className="truncate text-[11px] text-[#6b7280]">{label}</p>
      </div>
    </GlassPanel>
  );
}

function MatchRow({ pick, locale }: { pick: UpcomingPick; locale: string }) {
  const maxProb = Math.max(pick.home_prob, pick.draw_prob, pick.away_prob);
  const predicted =
    pick.home_prob === maxProb ? "home" : pick.draw_prob === maxProb ? "draw" : "away";
  return (
    <div
      className="group grid items-center gap-3 rounded-xl border p-4 transition-all hover:-translate-y-[1px] sm:grid-cols-[minmax(0,0.7fr)_minmax(0,2fr)_minmax(0,1.6fr)_auto]"
      style={{
        background: "hsl(230 20% 8% / 0.5)",
        borderColor: "hsl(0 0% 100% / 0.06)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Meta */}
      <div>
        <p className="text-xs font-semibold text-[#4ade80]">{pick.league}</p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#6b7280]">
          <Clock className="h-3 w-3" />
          {formatKickoff(pick.kickoff, locale)}
        </p>
      </div>

      {/* Teams */}
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {pick.home_logo && (
            <Image
              src={pick.home_logo}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          )}
          <p className="truncate text-sm font-semibold text-[#ededed]">{pick.home_team}</p>
        </div>
        <span className="text-[11px] font-medium text-[#6b7280]">vs</span>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <p className="truncate text-right text-sm font-semibold text-[#ededed]">{pick.away_team}</p>
          {pick.away_logo && (
            <Image
              src={pick.away_logo}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          )}
        </div>
      </div>

      {/* Probabilities */}
      <div className="flex items-center gap-2">
        <DataChip tone={predicted === "home" ? "win" : "default"}>{pick.home_prob}%</DataChip>
        <DataChip>{pick.draw_prob}%</DataChip>
        <DataChip tone={predicted === "away" ? "win" : "default"}>{pick.away_prob}%</DataChip>
      </div>

      {/* Confidence */}
      <TrustScore value={Math.round(pick.confidence / 10)} max={10} />
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
    <GlassPanel
      variant="lifted"
      featureTile={popular ? "green" : "none"}
      className="relative flex flex-col p-6 sm:p-8"
    >
      <div className="relative flex-1">
        {popular && (
          <span className="absolute right-0 top-0 rounded-full bg-[#4ade80] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#05130b]">
            Popular
          </span>
        )}

        <HexBadge variant={variant} size="md">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </HexBadge>

        <h3 className="mt-5 text-heading text-2xl text-[#ededed]">{name}</h3>
        <p className="mt-1 text-sm text-[#a3a9b8]">{tagline}</p>

        <div className="mt-6 flex items-baseline gap-2">
          <span className="text-stat text-4xl text-[#ededed]">{price}</span>
          <span className="text-xs text-[#6b7280]">/ {period}</span>
        </div>

        <ul className="mt-6 space-y-2.5">
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
        className={`mt-6 inline-flex w-full items-center justify-center gap-1.5 ${
          popular ? "btn-primary" : "btn-glass"
        }`}
      >
        {ctaLabel} <ArrowRight className="h-4 w-4" />
      </Link>
    </GlassPanel>
  );
}

export default HomeContent;
