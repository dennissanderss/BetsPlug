"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Sparkles,
  Crown,
  Zap,
  Shield,
  Star,
  ChevronRight,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Lock,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref } from "@/i18n/locale-provider";
import { HeroMediaBg } from "@/components/ui/media-bg";
import { PAGE_IMAGES } from "@/data/page-images";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { POTD_STATS } from "@/data/potd-stats";

const PricingSection = dynamic(
  () => import("@/components/ui/pricing-section").then((m) => m.PricingSection),
  { ssr: true },
);

interface PricingContentProps {
  pricingConfig?: any;
}

type PlanVariant = "green" | "purple" | "blue" | "amber";

interface PlanDetail {
  id: "bronze" | "silver" | "gold" | "platinum";
  icon: typeof Shield;
  name: string;
  tagline: string;
  bestFor: string;
  price: string;
  period: string;
  includes: string[];
  notIncluded: string[];
  variant: PlanVariant;
  popular?: boolean;
  lifetime?: boolean;
  cta: string;
  ctaHref: (loc: (s: string) => string) => string;
}

const AMBER_GLOW_BG =
  "radial-gradient(600px 300px at 0% 0%, rgba(253, 224, 71, 0.12), transparent 55%)";

export function PricingContent({ pricingConfig }: PricingContentProps) {
  const loc = useLocalizedHref();

  const plans: PlanDetail[] = [
    {
      id: "bronze",
      icon: Shield,
      name: "Bronze",
      tagline: "The €0,01 test drive",
      bestFor:
        "If you've been burned by a tipster before: run our AI football predictions against your own bets for 7 days before you spend a cent more.",
      price: "€0,01",
      period: "7 days",
      includes: [
        "Full Gold access for 7 days — every feature",
        "Every match prediction + live probabilities",
        `Daily Pick of the Day (${POTD_STATS.accuracy}% hit rate)`,
        "Complete public track record",
        "Cancel in two clicks — no auto-upgrade",
      ],
      notIncluded: [
        "Gold Telegram community",
        "Strategy Lab access",
        "Priority support queue",
      ],
      variant: "blue",
      cta: "Start €0,01 trial",
      ctaHref: (l) => `${l("/checkout")}?plan=bronze`,
    },
    {
      id: "silver",
      icon: Zap,
      name: "Silver",
      tagline: "The weekend-bettor plan",
      bestFor:
        "You bet the big matches in Premier League, La Liga, Bundesliga, Serie A or Ligue 1 — and nothing else. Silver covers those five without paying for leagues you ignore.",
      price: "€9,99",
      period: "month",
      includes: [
        "AI predictions for top-5 European leagues",
        "Live scores + live probability updates",
        "Weekly performance report in your inbox",
        "Full public track record — every loss included",
        "Email support (48-hour SLA)",
      ],
      notIncluded: [
        "Leagues beyond top-5 (no Champions League, MLS, Süper Lig…)",
        "PDF / CSV / JSON report exports",
        "Gold Telegram community",
        "Strategy Lab access",
      ],
      variant: "purple",
      cta: "Start Silver",
      ctaHref: (l) => `${l("/checkout")}?plan=silver`,
    },
    {
      id: "gold",
      icon: Star,
      name: "Gold",
      tagline: "The full-access plan most users pick",
      bestFor:
        "Serious bettors who want every edge: all 30+ leagues, downloadable data, the Gold Telegram, and priority support when a prediction question can't wait 48 hours.",
      price: "€14,99",
      period: "month",
      includes: [
        `Daily Pick of the Day (${POTD_STATS.accuracy}% hit rate)`,
        "All 30+ football leagues worldwide (CL, UEL, MLS, Süper Lig…)",
        "PDF / CSV / JSON exports of every prediction",
        "Exclusive Gold Telegram community",
        "Priority support (12-hour SLA)",
        "Strategy Lab access (launching soon)",
        "Full transparency — every pick publicly logged",
      ],
      notIncluded: ["Lifetime pricing lock", "Founder-tier perks"],
      variant: "green",
      popular: true,
      cta: "Start Gold",
      ctaHref: (l) => `${l("/checkout")}?plan=gold`,
    },
    {
      id: "platinum",
      icon: Crown,
      name: "Platinum lifetime",
      tagline: "Pay once. Keep it forever.",
      bestFor:
        "You're already planning to stick with BetsPlug long-term. Platinum locks in today's price for life, plus founder-tier perks you can't get on any monthly plan.",
      price: "€199",
      period: "one-time",
      includes: [
        "Lifetime Gold access — every current & future feature",
        "Private Platinum Telegram (max 20 seats)",
        "Lifetime price lock — immune to every future increase",
        "Early access to every new feature",
        "Never pay again — zero renewals, zero upsells",
        "Exclusive Strategy Lab access at launch",
      ],
      notIncluded: [],
      variant: "amber",
      lifetime: true,
      cta: "Claim lifetime",
      ctaHref: (l) => `${l("/checkout")}?plan=platinum`,
    },
  ];

  const goldVsOthers = [
    { label: "All 30+ leagues worldwide", bronze: "trial", silver: false, gold: true, platinum: true },
    { label: `Pick of the Day (${POTD_STATS.accuracy}% accuracy)`, bronze: "trial", silver: false, gold: true, platinum: true },
    { label: "CSV / JSON / PDF exports", bronze: "trial", silver: false, gold: true, platinum: true },
    { label: "Gold Telegram community", bronze: "trial", silver: false, gold: true, platinum: true },
    { label: "Priority 12h support", bronze: false, silver: false, gold: true, platinum: true },
    { label: "Strategy Lab (launching soon)", bronze: false, silver: false, gold: true, platinum: true },
    { label: "Private Platinum Telegram (20 seats)", bronze: false, silver: false, gold: false, platinum: true },
    { label: "Lifetime price lock", bronze: false, silver: false, gold: false, platinum: true },
    { label: "Pay once — no renewals", bronze: false, silver: false, gold: false, platinum: true },
  ];

  const goldReasons = [
    {
      icon: TrendingUp,
      title: "The break-even math is brutal",
      desc:
        `€14,99/month is less than a single placed-and-lost bet on a gut feeling. For that, you get 30+ leagues, ${POTD_STATS.accuracy}% Pick-of-the-Day hit rate, and every prediction exportable as CSV.`,
    },
    {
      icon: Sparkles,
      title: "Strategy Lab ships to Gold first",
      desc:
        "Backtest your own angles against our entire historical AI prediction database the moment Strategy Lab launches. Gold and Platinum users get it before anyone else.",
    },
    {
      icon: Shield,
      title: "Community and priority access",
      desc:
        "Gold unlocks our closed Telegram channel for pick discussion and a 12-hour support SLA. Silver is email-only (48h). Bronze is trial-scoped.",
    },
  ];

  const platinumReasons = [
    {
      icon: Crown,
      title: "Breaks even at month 14, free forever after",
      desc:
        "€199 once is 13.2 months of Gold. Every month after that is pure savings — and our Gold price is already scheduled to rise as coverage expands.",
    },
    {
      icon: Lock,
      title: "100 Platinum seats per year. Hard cap.",
      desc:
        "Once this year's 100 founder seats are claimed, the tier closes until next cycle — at a higher price. If you see Platinum available, the window is still open.",
    },
    {
      icon: Star,
      title: "Private Platinum Telegram (20 seats)",
      desc:
        "A separate founder channel with direct access to our model team — deep-dive Q&A, pre-release insights, and strategy review before launch.",
    },
  ];

  const headerCells: { label: string; variant: "green" | "purple" | "blue" | "amber"; color: string }[] = [
    { label: "Bronze", variant: "blue", color: "#93c5fd" },
    { label: "Silver", variant: "purple", color: "#d8b4fe" },
    { label: "Gold", variant: "green", color: "#4ade80" },
    { label: "Platinum", variant: "amber", color: "#fbbf24" },
  ];

  return (
    <div className="min-h-screen">
      <SiteNav />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <HeroMediaBg src={PAGE_IMAGES.pricing.hero} alt="" />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-20 h-[400px] w-[800px] -translate-x-1/2 rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.12)", filter: "blur(140px)" }}
        />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="section-label mb-5 inline-flex items-center gap-2"
          >
            <Sparkles className="h-3 w-3" />
            Less than one bad bet per month
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl"
          >
            The BetsPlug plan built for{" "}
            <span className="gradient-text-green">your betting style.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#a3a9b8] sm:text-lg"
          >
            Every plan unlocks the same AI football predictions and the same public
            track record. The only difference is league coverage and the tooling
            around it. Start with a €0,01 trial, upgrade when the numbers convince
            you, or lock in lifetime pricing before it rises.
          </motion.p>

          {/* Risk-reversal trust bar */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#a3a9b8]"
          >
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#4ade80]" />
              7-day Gold trial for €0,01
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#4ade80]" />
              No auto-upgrade after trial
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#4ade80]" />
              Cancel in two clicks
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#4ade80]" />
              Stripe-secured checkout
            </span>
          </motion.div>

          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            aria-label="Breadcrumb"
            className="mt-8 flex items-center justify-center gap-2 text-xs text-[#6b7280]"
          >
            <Link href={loc("/")} className="transition-colors hover:text-[#4ade80]">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#a3a9b8]">Pricing</span>
          </motion.nav>
        </div>
      </section>

      <PricingSection pricingConfig={pricingConfig} />

      {/* ═══ PLAN DEEP-DIVES ═══ */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-1/4 h-[400px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.1)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12">
            <span className="section-label">
              <Sparkles className="h-3 w-3" /> What you get, plan by plan
            </span>
            <h2 className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              Every plan unlocks the same AI football{" "}
              <span className="gradient-text-green">predictions & track record.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-base text-[#a3a9b8]">
              The difference is which leagues you get, how deeply you can export the
              data, and how fast our team responds when something breaks. Pick the
              one that matches how you actually bet.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isAmber = plan.variant === "amber";
              const cardClass = isAmber ? "card-neon" : `card-neon card-neon-${plan.variant}`;
              return (
                <div
                  key={plan.id}
                  className={`${cardClass} p-7 sm:p-8`}
                  style={
                    isAmber
                      ? {
                          background: "#0f0a02",
                          borderColor: "rgba(251, 191, 36, 0.3)",
                        }
                      : undefined
                  }
                >
                  <div className="relative">
                    {isAmber && (
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -inset-1"
                        style={{ backgroundImage: AMBER_GLOW_BG }}
                      />
                    )}
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <HexBadge
                          variant={isAmber ? "green" : (plan.variant as "green" | "purple" | "blue")}
                          size="md"
                        >
                          <Icon className="h-5 w-5" strokeWidth={2} />
                        </HexBadge>
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: isAmber ? "#fbbf24" : undefined }}
                        >
                          Plan · {plan.name}
                        </span>
                      </div>
                      {plan.popular && (
                        <Pill tone="active" className="gap-1 text-[10px]">
                          <Star className="h-3 w-3" />
                          Popular
                        </Pill>
                      )}
                      {plan.lifetime && (
                        <Pill
                          tone="default"
                          className="gap-1 text-[10px]"
                          style={{
                            borderColor: "rgba(251, 191, 36, 0.5)",
                            backgroundColor: "rgba(251, 191, 36, 0.1)",
                            color: "#fbbf24",
                          }}
                        >
                          <Crown className="h-3 w-3" />
                          Lifetime
                        </Pill>
                      )}
                    </div>

                    <h3
                      className="text-display mt-5 break-words text-3xl sm:text-4xl"
                      style={{ color: isAmber ? "#fde68a" : "#ededed" }}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className="mt-2 text-sm"
                      style={{ color: isAmber ? "rgba(253, 230, 138, 0.7)" : "#a3a9b8" }}
                    >
                      {plan.tagline}
                    </p>

                    <div className="mt-5 flex items-baseline gap-2">
                      <span
                        className="text-stat text-4xl sm:text-5xl"
                        style={{ color: isAmber ? "#fbbf24" : "#ededed" }}
                      >
                        {plan.price}
                      </span>
                      <span className="text-xs text-[#6b7280]">/ {plan.period}</span>
                    </div>

                    <div
                      className="glass-panel mt-5 p-4"
                      style={
                        isAmber
                          ? {
                              borderColor: "rgba(251, 191, 36, 0.25)",
                              backgroundColor: "rgba(251, 191, 36, 0.04)",
                            }
                          : undefined
                      }
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
                        Best for
                      </span>
                      <p className="mt-1 text-sm leading-relaxed text-[#c4cad6]">
                        {plan.bestFor}
                      </p>
                    </div>

                    <div className="mt-6 space-y-2.5">
                      <p
                        className="text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: isAmber ? "#fbbf24" : "#4ade80" }}
                      >
                        Included
                      </p>
                      {plan.includes.map((item) => (
                        <div key={item} className="flex items-start gap-3 text-sm">
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 flex-shrink-0"
                            style={{ color: isAmber ? "#fbbf24" : "#4ade80" }}
                            strokeWidth={2.5}
                          />
                          <span className="text-[#ededed]">{item}</span>
                        </div>
                      ))}
                    </div>

                    {plan.notIncluded.length > 0 && (
                      <div className="mt-5 space-y-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
                          Not included
                        </p>
                        {plan.notIncluded.map((item) => (
                          <div
                            key={item}
                            className="flex items-start gap-3 text-sm text-[#6b7280]"
                          >
                            <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={2} />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <Link
                      href={plan.ctaHref(loc)}
                      className={`mt-8 inline-flex w-full items-center justify-center gap-2 sm:w-auto ${
                        isAmber ? "" : "btn-primary"
                      }`}
                      style={
                        isAmber
                          ? {
                              background:
                                "linear-gradient(135deg, #fef3c7 0%, #fde68a 25%, #fbbf24 55%, #d97706 100%)",
                              color: "#1a1405",
                              padding: "0.85rem 1.5rem",
                              borderRadius: "9999px",
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              boxShadow: "0 0 24px rgba(251, 191, 36, 0.4)",
                            }
                          : undefined
                      }
                    >
                      <Crown className={`h-4 w-4 ${isAmber ? "" : "hidden"}`} />
                      {plan.cta}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ COMPARISON MATRIX ═══ */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-1/4 h-[400px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-blue) / 0.1)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12">
            <span className="section-label">
              <Sparkles className="h-3 w-3" /> Side by side
            </span>
            <h2 className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              Every plan, every feature,{" "}
              <span className="gradient-text-green">in one matrix.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-base text-[#a3a9b8]">
              Green check = unlocked. Grey cross = out of scope for that tier. The
              7-day trial rows show you exactly what Bronze unlocks during the
              probation window.
            </p>
          </div>

          <div className="card-neon overflow-hidden">
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="relative min-w-[640px]">
              {/* Header */}
              <div className="grid grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))] items-stretch border-b border-white/10">
                <div className="px-4 py-5 sm:px-6">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
                    Feature
                  </span>
                </div>
                {headerCells.map((h) => (
                  <div
                    key={h.label}
                    className="flex items-center justify-center gap-2 border-l border-white/10 py-5"
                  >
                    {h.variant === "amber" ? (
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full"
                        style={{
                          background:
                            "linear-gradient(135deg, #fde68a, #fbbf24)",
                          boxShadow: "0 0 16px rgba(251, 191, 36, 0.5)",
                        }}
                      >
                        <Crown className="h-4 w-4 text-[#1a1405]" strokeWidth={2.5} />
                      </span>
                    ) : (
                      <HexBadge variant={h.variant} size="sm" noGlow>
                        {h.label === "Gold" ? (
                          <Star className="h-3.5 w-3.5" />
                        ) : h.label === "Silver" ? (
                          <Zap className="h-3.5 w-3.5" />
                        ) : (
                          <Shield className="h-3.5 w-3.5" />
                        )}
                      </HexBadge>
                    )}
                    <span
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: h.color }}
                    >
                      {h.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {goldVsOthers.map((row, idx) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))] items-stretch ${
                    idx > 0 ? "border-t border-white/[0.06]" : ""
                  }`}
                >
                  <div className="px-4 py-4 sm:px-6">
                    <span className="text-sm text-[#ededed]">{row.label}</span>
                  </div>
                  {[
                    { v: row.bronze, isPlat: false, isGold: false },
                    { v: row.silver, isPlat: false, isGold: false },
                    { v: row.gold, isPlat: false, isGold: true },
                    { v: row.platinum, isPlat: true, isGold: false },
                  ].map((cell, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-center border-l border-white/[0.06] py-4 ${
                        cell.isGold ? "bg-[#4ade80]/[0.04]" : ""
                      }`}
                      style={
                        cell.isPlat
                          ? { backgroundColor: "rgba(251, 191, 36, 0.04)" }
                          : undefined
                      }
                    >
                      {cell.v === true ? (
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full"
                          style={{
                            background: cell.isPlat
                              ? "linear-gradient(135deg, #fde68a, #fbbf24)"
                              : "linear-gradient(135deg, #4ade80, #22c55e)",
                            boxShadow: cell.isPlat
                              ? "0 0 12px rgba(251, 191, 36, 0.45)"
                              : "0 0 12px rgba(74, 222, 128, 0.45)",
                          }}
                        >
                          <CheckCircle2
                            className="h-3.5 w-3.5"
                            style={{ color: cell.isPlat ? "#1a1405" : "#050b0e" }}
                            strokeWidth={3}
                          />
                        </span>
                      ) : cell.v === "trial" ? (
                        <Pill tone="info" className="text-[9px]">
                          7-day trial
                        </Pill>
                      ) : (
                        <XCircle className="h-4 w-4 text-[#3a4250]" strokeWidth={2} />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHY GOLD ═══ */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 bottom-0 h-[400px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.15)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12">
            <span className="section-label">
              <Star className="h-3 w-3" /> Why most users pick Gold
            </span>
            <h2 className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              Silver is a starter. Gold is{" "}
              <span className="gradient-text-green">the serious tool.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-base text-[#a3a9b8]">
              If you bet more than once a week, or on matches outside the top-5
              European leagues, Gold pays for itself inside a single correctly-timed
              pick. Here's what the extra €5/month actually buys.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {goldReasons.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.title} className="card-neon card-neon-green p-6 sm:p-7">
                  <div className="relative">
                    <HexBadge variant="green" size="md">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </HexBadge>
                    <h3 className="text-heading mt-5 text-lg text-[#ededed] sm:text-xl">
                      {r.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#a3a9b8]">
                      {r.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={`${loc("/checkout")}?plan=gold`}
              className="btn-primary inline-flex items-center gap-2"
            >
              Start Gold
            </Link>
            <Link
              href={`${loc("/checkout")}?plan=bronze`}
              className="btn-glass inline-flex items-center gap-2"
            >
              Or try €0,01 first
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ WHY PLATINUM ═══ */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 h-[500px] w-[600px] rounded-full"
          style={{ background: "rgba(251, 191, 36, 0.12)", filter: "blur(160px)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12">
            <span
              className="section-label"
              style={{
                borderColor: "rgba(252, 211, 77, 0.5)",
                color: "#fbbf24",
                backgroundColor: "rgba(251, 191, 36, 0.08)",
              }}
            >
              <Crown className="h-3 w-3" />
              Why Platinum lifetime
            </span>
            <h2 className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              The math that makes{" "}
              <span style={{ color: "#fbbf24" }}>Platinum unbeatable.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-base text-[#a3a9b8]">
              €199 once. Gold is €14,99/month — Platinum breaks even at month 14 and
              every month after is pure savings. While Silver and Gold prices keep
              rising with coverage, your Platinum price is frozen the second you
              claim a seat.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {platinumReasons.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.title}
                  className="card-neon p-6 sm:p-7"
                  style={{
                    background: "#0f0a02",
                    borderColor: "rgba(251, 191, 36, 0.3)",
                  }}
                >
                  <div className="relative">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -inset-1"
                      style={{ backgroundImage: AMBER_GLOW_BG }}
                    />
                    <div className="relative">
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-xl"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(254, 243, 199, 0.2), rgba(251, 191, 36, 0.35))",
                          border: "1px solid rgba(251, 191, 36, 0.5)",
                          boxShadow: "0 0 20px rgba(251, 191, 36, 0.35)",
                        }}
                      >
                        <Icon className="h-5 w-5" style={{ color: "#fbbf24" }} strokeWidth={2} />
                      </span>
                      <h3
                        className="text-heading mt-5 text-lg sm:text-xl"
                        style={{ color: "#fde68a" }}
                      >
                        {r.title}
                      </h3>
                      <p
                        className="mt-3 text-sm leading-relaxed"
                        style={{ color: "rgba(253, 230, 138, 0.75)" }}
                      >
                        {r.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Value breakdown */}
          <div
            className="card-neon mt-8 p-5 sm:p-8 md:p-10"
            style={{
              background: "#0f0a02",
              borderColor: "rgba(251, 191, 36, 0.4)",
            }}
          >
            <div className="relative">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-1"
                style={{ backgroundImage: AMBER_GLOW_BG }}
              />
              <div className="relative grid gap-6 md:grid-cols-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#fbbf24" }}>
                    Platinum pays off after
                  </p>
                  <p className="text-stat mt-2 text-4xl sm:text-5xl" style={{ color: "#fbbf24" }}>
                    13.2 months
                  </p>
                  <p className="mt-1 text-sm" style={{ color: "rgba(253, 230, 138, 0.7)" }}>
                    Every month after is 100% savings.
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#fbbf24" }}>
                    5-year cost (Gold)
                  </p>
                  <p className="text-stat mt-2 text-4xl text-[#ededed] sm:text-5xl">€899</p>
                  <p className="mt-1 text-sm" style={{ color: "rgba(253, 230, 138, 0.7)" }}>
                    At today&apos;s price. Prices are rising as we grow.
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#fbbf24" }}>
                    5-year cost (Platinum)
                  </p>
                  <p className="text-stat mt-2 text-4xl sm:text-5xl" style={{ color: "#fbbf24" }}>
                    €199
                  </p>
                  <p className="mt-1 text-sm" style={{ color: "rgba(253, 230, 138, 0.7)" }}>
                    One-time. Frozen. Forever.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href={`${loc("/checkout")}?plan=platinum`}
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold transition-colors"
              style={{
                background:
                  "linear-gradient(135deg, #fef3c7 0%, #fde68a 25%, #fbbf24 55%, #d97706 100%)",
                color: "#1a1405",
                boxShadow: "0 0 24px rgba(251, 191, 36, 0.45)",
              }}
            >
              <Crown className="h-4 w-4" />
              Claim lifetime access
            </Link>
            <span className="text-xs" style={{ color: "rgba(253, 230, 138, 0.7)" }}>
              Max 100 seats / year · Lifetime price lock
            </span>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/4 top-0 h-[400px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.2)", filter: "blur(140px)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-1/4 bottom-0 h-[400px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.15)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <div className="card-neon card-neon-green halo-green p-6 sm:p-10 md:p-16">
            <div className="relative text-center">
              <span className="section-label mb-4">
                <Sparkles className="h-3 w-3" /> Test the AI against your own bets
              </span>
              <h2 className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                Start for €0,01.{" "}
                <span className="gradient-text-green">Decide once the numbers land.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#a3a9b8]">
                Seven days of full Gold access. No auto-upgrade. Cancel in two
                clicks. Run our AI football predictions next to your own betting
                log for a week, then decide — we'd rather you verify than trust.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={`${loc("/checkout")}?plan=bronze`}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Claim €0,01 trial
                </Link>
                <Link
                  href={loc("/track-record")}
                  className="btn-ghost inline-flex items-center gap-2"
                >
                  See the full track record
                </Link>
              </div>
              <p className="mt-5 text-xs text-[#6b7280]">
                Secured by Stripe · No hidden fees · Winners &amp; losers published on the track record
              </p>
            </div>
          </div>
        </div>
      </section>

      <BetsPlugFooter />
    </div>
  );
}

export default PricingContent;
