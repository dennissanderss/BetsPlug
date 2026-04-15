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
  Star,
  Activity,
  Flame,
  ChevronRight,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill, DataChip, TrustScore } from "@/components/noct/pill";
import type { Article } from "@/data/articles";
import type { Testimonial } from "@/components/ui/testimonials-section";

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
      .then(r => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((d: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const arr: any[] = d?.today ?? [];
        setPicks(arr.slice(0, 4).map((p) => ({
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
        })));
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

/* ═══════════════════════════════════════════════════════════════
   HomeContent — dashboard scene homepage
   ═══════════════════════════════════════════════════════════════ */

interface HomeContentProps {
  articles: Article[];
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

  const homeProb =
    featured?.available ? Math.round((featured.home_win_prob ?? 0.52) * 100) : 52;
  const drawProb =
    featured?.available ? Math.round((featured.draw_prob ?? 0.24) * 100) : 24;
  const awayProb =
    featured?.available ? Math.round((featured.away_win_prob ?? 0.24) * 100) : 24;
  const confidence =
    featured?.available ? Math.round((featured.confidence ?? 0.78) * 100) : 78;
  const matchLabel = featured?.available
    ? `${featured.home_team} vs ${featured.away_team}`
    : "Arsenal vs Chelsea";
  const leagueLabel = featured?.league || "Premier League";

  return (
    <div className="min-h-screen">
      <SiteNav />

      {/* ══════════════════════════════════════════════════════════════
          HERO — dashboard scene, layered floating cards
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          {/* Top eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-6 flex flex-wrap items-center justify-center gap-3 text-center"
          >
            <Pill className="pill-active">
              <span className="live-dot" />
              Live predictions engine
            </Pill>
            <span className="hidden text-sm text-[#a3a9b8] sm:inline">
              Accuracy today{" "}
              <span className="font-semibold text-[#ededed]">{botd?.accuracy_pct ?? 66.7}%</span>
            </span>
          </motion.div>

          {/* Compact headline */}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-display mx-auto max-w-4xl text-center text-4xl text-[#ededed] sm:text-5xl lg:text-6xl"
          >
            Every match, every edge.
            <br />
            <span className="gradient-text-green">Inside one control room.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-5 max-w-2xl text-center text-base text-[#a3a9b8] sm:text-lg"
          >
            {t("hero.subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href={`${loc("/checkout")}?plan=bronze`}
              className="btn-primary inline-flex items-center gap-1.5"
            >
              {t("hero.ctaPrimary")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={loc("/predictions")} className="btn-glass">
              Open predictions
            </Link>
          </motion.div>

          {/* ─── Dashboard scene ─── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative mt-14 md:mt-20"
          >
            {/* Ambient glows behind scene */}
            <div
              aria-hidden
              className="pointer-events-none absolute -left-20 top-10 h-[340px] w-[340px] rounded-full"
              style={{ background: "hsl(var(--accent-green) / 0.28)", filter: "blur(120px)" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 bottom-10 h-[340px] w-[340px] rounded-full"
              style={{ background: "hsl(var(--accent-purple) / 0.3)", filter: "blur(120px)" }}
            />

            {/* Main dashboard grid */}
            <div className="relative grid gap-4 md:grid-cols-12 md:gap-5">
              {/* ── Big predictions card (left, 7 cols) ── */}
              <div className="md:col-span-7">
                <div className="card-neon card-neon-green halo-green relative p-5 sm:p-6">
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Pill className="pill-active">
                        <Activity className="h-3 w-3" />
                        Match of the day
                      </Pill>
                      <span className="hidden text-xs font-semibold text-[#4ade80] sm:inline">
                        {leagueLabel}
                      </span>
                    </div>
                    <Pill tone="purple">
                      <Flame className="h-3 w-3" /> HOT
                    </Pill>
                  </div>

                  <div className="relative mt-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <HexBadge variant="green" size="md" noGlow>
                        <Shield className="h-4 w-4" />
                      </HexBadge>
                      <div>
                        <p className="text-xs text-[#6b7280]">Home</p>
                        <p className="text-sm font-semibold text-[#ededed] sm:text-base">
                          {featured?.home_team ?? "Arsenal"}
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
                        vs
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="text-right">
                        <p className="text-xs text-[#6b7280]">Away</p>
                        <p className="text-sm font-semibold text-[#ededed] sm:text-base">
                          {featured?.away_team ?? "Chelsea"}
                        </p>
                      </div>
                      <HexBadge variant="purple" size="md" noGlow>
                        <Shield className="h-4 w-4" />
                      </HexBadge>
                    </div>
                  </div>

                  <div className="relative mt-6">
                    <div className="mb-2 flex items-baseline justify-between">
                      <span className="text-sm text-[#a3a9b8]">
                        Home win probability
                      </span>
                      <span className="text-stat text-3xl text-[#4ade80] sm:text-4xl">
                        {homeProb}%
                      </span>
                    </div>
                    <div
                      className="h-2 w-full overflow-hidden rounded-full"
                      style={{ background: "hsl(0 0% 100% / 0.06)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${homeProb}%`,
                          background: "linear-gradient(90deg, #22c55e, #4ade80)",
                          boxShadow: "0 0 14px hsl(var(--accent-green) / 0.8)",
                        }}
                      />
                    </div>
                    <div className="mt-3 flex justify-between text-xs text-[#6b7280]">
                      <span>Draw {drawProb}%</span>
                      <span>Away win {awayProb}%</span>
                    </div>
                  </div>

                  <div className="relative mt-5 grid grid-cols-3 gap-2">
                    <MiniStat label="Confidence" value={`${confidence}%`} tone="green" />
                    <MiniStat label="Model edge" value="+12.4%" tone="purple" />
                    <MiniStat label="Accuracy" value={`${botd?.accuracy_pct ?? 66.7}%`} tone="blue" />
                  </div>
                </div>
              </div>

              {/* ── Right column: 3 stat cards stacked ── */}
              <div className="grid gap-4 md:col-span-5 md:grid-cols-1 md:gap-5">
                <FeatureMiniCard
                  variant="green"
                  icon={Brain}
                  title="AI does the research"
                  desc="Elo + Poisson + Logistic + XGBoost. Four models vote on every match."
                />
                <FeatureMiniCard
                  variant="purple"
                  icon={Target}
                  title="Only the best picks"
                  desc="One highest-confidence Pick of the Day, logged publicly with confidence."
                />
                <FeatureMiniCard
                  variant="blue"
                  icon={CheckCircle2}
                  title="100% transparent"
                  desc="Every pick, every model score, every result — live and downloadable."
                />
              </div>

              {/* ── Accuracy chart widget (full width below) ── */}
              <div className="md:col-span-12">
                <div className="card-neon halo-blue relative overflow-hidden p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <HexBadge variant="blue" size="md" noGlow>
                        <TrendingUp className="h-4 w-4" />
                      </HexBadge>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                          Track record · last 12 months
                        </p>
                        <p className="mt-0.5 text-lg font-semibold text-[#ededed]">
                          BetsPlug Pulse accuracy
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="win">▲ +5.45%</Pill>
                      <span className="text-stat text-3xl text-[#ededed]">
                        {botd?.accuracy_pct ?? 66.7}%
                      </span>
                    </div>
                  </div>

                  <div className="relative mt-4 h-28 sm:h-36">
                    <svg viewBox="0 0 400 120" className="h-full w-full" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="heroChartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4ade80" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0 95 L 30 85 L 60 92 L 100 70 L 140 75 L 180 55 L 220 62 L 260 38 L 300 45 L 340 22 L 400 28 L 400 120 L 0 120 Z"
                        fill="url(#heroChartGrad)"
                      />
                      <path
                        d="M 0 95 L 30 85 L 60 92 L 100 70 L 140 75 L 180 55 L 220 62 L 260 38 L 300 45 L 340 22 L 400 28"
                        fill="none"
                        stroke="#4ade80"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ filter: "drop-shadow(0 0 8px rgba(74,222,128,0.7))" }}
                      />
                      {[
                        [140, 75],
                        [260, 38],
                        [340, 22],
                      ].map(([x, y], i) => (
                        <circle key={i} cx={x} cy={y} r="3.5" fill="#4ade80" />
                      ))}
                    </svg>
                  </div>

                  <div
                    className="mt-3 grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-4"
                    style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
                  >
                    <ChartStat
                      label="Predictions"
                      value={botd?.total_picks?.toLocaleString() ?? "1,284"}
                    />
                    <ChartStat label="Win rate" value={`${botd?.accuracy_pct ?? 66.7}%`} />
                    <ChartStat label="Leagues" value="30+" />
                    <ChartStat label="Models" value="4" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          LIVE PICKS WIDGET
         ══════════════════════════════════════════════════════════════ */}
      {picks.length > 0 && (
        <section className="relative py-14 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="card-neon relative overflow-hidden">
              <div
                className="flex items-center justify-between gap-3 border-b p-5"
                style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
              >
                <div className="flex items-center gap-3">
                  <HexBadge variant="green" size="sm" noGlow>
                    <Zap className="h-3.5 w-3.5" />
                  </HexBadge>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                      Free feed
                    </p>
                    <p className="text-sm font-semibold text-[#ededed] sm:text-base">
                      Today's open picks
                    </p>
                  </div>
                </div>
                <Link
                  href={loc("/match-predictions")}
                  className="btn-ghost inline-flex items-center gap-1 text-xs"
                >
                  Open all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="divide-y" style={{ borderColor: "hsl(0 0% 100% / 0.05)" }}>
                {picks.map((p, i) => (
                  <MatchRow key={i} pick={p} locale={locale} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          FEATURES GRID — 3 hex feature cards + gradient borders
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="section-label">
                <Sparkles className="h-3 w-3" />
                Why BetsPlug
              </span>
              <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                Built like a{" "}
                <span className="gradient-text-purple">trading desk</span>
                <br className="hidden sm:block" /> for football markets.
              </h2>
            </div>
            <p className="max-w-sm text-sm text-[#a3a9b8]">
              {t("trusted.subtitle")}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <BigFeatureCard
              variant="green"
              icon={Shield}
              tag="Trust"
              title="Every pick logged, every result public"
              desc={t("trusted.card1Desc")}
            />
            <BigFeatureCard
              variant="purple"
              icon={Brain}
              tag="AI Core"
              title="Four models vote on every match"
              desc={t("trusted.card2Desc")}
              href={loc("/track-record")}
              cta={t("trusted.learnMore")}
            />
            <BigFeatureCard
              variant="blue"
              icon={CheckCircle2}
              tag="Proof"
              title="Calibrated across 1,200+ graded picks"
              desc={t("trusted.card3Desc")}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          HOW IT WORKS — 3-step horizontal flow
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10">
            <span className="section-label">Process</span>
            <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl">
              Three steps. <span className="gradient-text-green">Full transparency.</span>
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                num: "01",
                icon: Zap,
                title: t("how.step1Title"),
                desc: t("how.step1Desc"),
                variant: "green" as const,
              },
              {
                num: "02",
                icon: Star,
                title: t("how.step2Title"),
                desc: t("how.step2Desc"),
                variant: "purple" as const,
              },
              {
                num: "03",
                icon: Eye,
                title: t("how.step3Title"),
                desc: t("how.step3Desc"),
                variant: "blue" as const,
              },
            ].map(({ num, icon: Icon, title, desc, variant }) => (
              <div key={num} className={`card-neon card-neon-${variant} p-6 sm:p-7`}>
                <div className="flex items-start gap-4">
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
                <p className="mt-4 text-sm leading-relaxed text-[#a3a9b8]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PLAN CARDS
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="section-label">Plans</span>
              <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl">
                Pick your access level.
              </h2>
            </div>
            <Link href={loc("/pricing")} className="btn-glass inline-flex items-center gap-1.5">
              Compare all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <PlanCard
              name="Bronze"
              tagline="Full-access trial"
              price="€0,01"
              period="7 days"
              icon={Shield}
              variant="blue"
              features={["Full Gold access", "Pick of the Day", "All predictions", "Cancel anytime"]}
              ctaHref={`${loc("/checkout")}?plan=bronze`}
              ctaLabel="Start trial"
            />
            <PlanCard
              name="Gold"
              tagline="Most popular"
              price="€14,99"
              period="month"
              icon={Star}
              variant="green"
              popular
              features={[
                "30+ leagues worldwide",
                "Daily Pick of the Day",
                "CSV / JSON / PDF exports",
                "Gold Telegram community",
              ]}
              ctaHref={`${loc("/checkout")}?plan=gold`}
              ctaLabel="Start Gold"
            />
            <PlanCard
              name="Platinum Lifetime"
              tagline="Founder-tier"
              price="€199"
              period="one-time"
              icon={Trophy}
              variant="purple"
              features={[
                "Lifetime Gold access",
                "Private Platinum Telegram",
                "Lifetime price lock",
                "Early access everywhere",
              ]}
              ctaHref={`${loc("/checkout")}?plan=platinum`}
              ctaLabel="Claim lifetime"
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          ARTICLES WIDGET
         ══════════════════════════════════════════════════════════════ */}
      {latestArticles.length > 0 && (
        <section className="relative py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="section-label">Research</span>
                <h2 className="text-heading text-2xl text-[#ededed] sm:text-3xl">
                  Latest analysis.
                </h2>
              </div>
              <Link href={loc("/articles")} className="btn-glass inline-flex items-center gap-1.5 text-sm">
                All articles <ChevronRight className="h-4 w-4" />
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
                              ? "linear-gradient(135deg, hsl(var(--accent-green)/0.35), hsl(var(--accent-green)/0.05))"
                              : variant === "purple"
                              ? "linear-gradient(135deg, hsl(var(--accent-purple)/0.4), hsl(var(--accent-purple)/0.08))"
                              : "linear-gradient(135deg, hsl(var(--accent-blue)/0.3), hsl(var(--accent-blue)/0.05))",
                        }}
                      >
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage:
                              "radial-gradient(circle at 50% 50%, hsl(0 0% 100%/0.04) 2px, transparent 2px)",
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
          FINAL CTA BAND — subtle card, not marketing block
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="card-neon halo-green relative overflow-hidden p-8 sm:p-10 md:p-12">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-[320px] w-[320px] rounded-full"
              style={{ background: "hsl(var(--accent-green) / 0.28)", filter: "blur(110px)" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -left-24 -bottom-24 h-[280px] w-[280px] rounded-full"
              style={{ background: "hsl(var(--accent-purple) / 0.22)", filter: "blur(110px)" }}
            />

            <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <span className="section-label">
                  <Sparkles className="h-3 w-3" />
                  Ready to try?
                </span>
                <h2 className="text-display text-3xl text-[#ededed] sm:text-4xl">
                  {t("finalCta.titleA")}{" "}
                  <span className="gradient-text-green">{t("finalCta.titleHighlight")}</span>
                </h2>
                <p className="mt-3 max-w-xl text-sm text-[#a3a9b8] sm:text-base">
                  {t("finalCta.subtitle")}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-2.5 text-xs text-[#6b7280]">
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
              <div className="flex shrink-0 flex-col gap-2.5">
                <Link
                  href={`${loc("/checkout")}?plan=bronze`}
                  className="btn-primary inline-flex items-center justify-center gap-1.5"
                >
                  {t("finalCta.primary")} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={loc("/how-it-works")}
                  className="btn-ghost inline-flex items-center justify-center gap-1"
                >
                  {t("finalCta.secondary")}
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

/* ═══════════════════════════════════════════════════════════════
   Local sub-components
   ═══════════════════════════════════════════════════════════════ */

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "purple" | "blue";
}) {
  const color =
    tone === "green" ? "#4ade80" : tone === "purple" ? "#c4b5fd" : "#60a5fa";
  return (
    <div
      className="rounded-lg p-2.5"
      style={{
        background: "hsl(230 22% 6% / 0.55)",
        border: "1px solid hsl(0 0% 100% / 0.06)",
      }}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wider text-[#6b7280]">{label}</p>
      <p className="text-stat mt-0.5 text-sm" style={{ color }}>
        {value}
      </p>
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

function FeatureMiniCard({
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
    <div className={`card-neon card-neon-${variant} relative flex items-start gap-3 p-4 sm:p-5`}>
      <HexBadge variant={variant} size="sm">
        <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
      </HexBadge>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#ededed]">{title}</p>
        <p className="mt-1 text-xs text-[#a3a9b8]">{desc}</p>
      </div>
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
        className="pointer-events-none absolute -top-16 left-1/2 h-[200px] w-[75%] -translate-x-1/2 rounded-full opacity-60"
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
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
            {tag}
          </span>
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

function MatchRow({ pick, locale }: { pick: UpcomingPick; locale: string }) {
  const maxProb = Math.max(pick.home_prob, pick.draw_prob, pick.away_prob);
  const predicted = pick.home_prob === maxProb ? "home" : pick.draw_prob === maxProb ? "draw" : "away";
  return (
    <div className="grid items-center gap-3 p-4 transition-colors hover:bg-white/[0.02] sm:grid-cols-[minmax(0,0.75fr)_minmax(0,2fr)_minmax(0,1.5fr)_auto]">
      <div>
        <p className="text-xs font-semibold text-[#4ade80]">{pick.league}</p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#6b7280]">
          <Clock className="h-3 w-3" />
          {formatKickoff(pick.kickoff, locale)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {pick.home_logo && (
            <Image src={pick.home_logo} alt="" width={26} height={26} className="h-6 w-6 object-contain" />
          )}
          <p className="truncate text-sm font-semibold text-[#ededed]">{pick.home_team}</p>
        </div>
        <span className="text-[11px] font-medium text-[#6b7280]">vs</span>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <p className="truncate text-right text-sm font-semibold text-[#ededed]">{pick.away_team}</p>
          {pick.away_logo && (
            <Image src={pick.away_logo} alt="" width={26} height={26} className="h-6 w-6 object-contain" />
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DataChip tone={predicted === "home" ? "win" : "default"}>{pick.home_prob}%</DataChip>
        <DataChip>{pick.draw_prob}%</DataChip>
        <DataChip tone={predicted === "away" ? "win" : "default"}>{pick.away_prob}%</DataChip>
      </div>
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
