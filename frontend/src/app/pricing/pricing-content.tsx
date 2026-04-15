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
      tagline: "Full-access 7-day trial",
      bestFor:
        "First-timers who want to validate BetsPlug against their own betting data before committing.",
      price: "€0,01",
      period: "7 days",
      includes: [
        "Full Gold access for 7 days",
        "Every prediction + live probability",
        "Daily Pick of the Day (66.7% accuracy)",
        "Complete track record + results feed",
        "Cancel any time, no auto-upgrade",
      ],
      notIncluded: [
        "Gold Telegram community",
        "Strategy Lab access",
        "Priority support",
      ],
      variant: "blue",
      cta: "Start €0,01 trial",
      ctaHref: (l) => `${l("/checkout")}?plan=bronze`,
    },
    {
      id: "silver",
      icon: Zap,
      name: "Silver",
      tagline: "For casual weekend bettors",
      bestFor:
        "Bettors focused on top-5 European leagues who want solid predictions without the bells and whistles.",
      price: "€9,99",
      period: "month",
      includes: [
        "All predictions — top 5 European leagues",
        "Live scores + live probability updates",
        "Weekly performance reports",
        "Full track record transparency",
        "Email support (48h response)",
      ],
      notIncluded: [
        "Coverage beyond top-5 leagues (no CL, MLS, Süper Lig…)",
        "PDF/CSV/JSON report exports",
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
      tagline: "Most popular — full access",
      bestFor:
        "Serious bettors who want every edge: all leagues, all exports, and direct access to our AI analysts.",
      price: "€14,99",
      period: "month",
      includes: [
        "Daily Pick of the Day (66.7% accuracy)",
        "All 30+ leagues worldwide (CL, UEL, MLS, Süper Lig…)",
        "PDF/CSV/JSON report exports",
        "Exclusive Gold Telegram community",
        "Priority support (12h response)",
        "Strategy Lab access (coming soon)",
        "Full transparency — every pick logged",
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
      tagline: "Founder-tier — pay once, keep forever",
      bestFor:
        "Power users who want the best long-term ROI — everything Gold offers, plus exclusive Platinum-only perks, forever.",
      price: "€199",
      period: "one-time",
      includes: [
        "Lifetime Gold access — every current & future feature",
        "Private Platinum Telegram (max 20 seats)",
        "Lifetime price lock — immune to future increases",
        "Early access to all new features",
        "Never pay again — no renewals, ever",
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
    { label: "Pick of the Day (66.7% accuracy)", bronze: "trial", silver: false, gold: true, platinum: true },
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
      title: "Best ROI for active bettors",
      desc:
        "€14,99/month for 30+ leagues, 66.7% Pick of the Day accuracy, and full exports. Silver users routinely upgrade within 30 days.",
    },
    {
      icon: Sparkles,
      title: "The only plan with Strategy Lab",
      desc:
        "Backtest your own angles against our entire historical prediction database. Ships Gold + Platinum first.",
    },
    {
      icon: Shield,
      title: "Community + priority support",
      desc:
        "Real-time Gold Telegram + 12h response SLA. Silver is email-only. Bronze is trial-scoped.",
    },
  ];

  const platinumReasons = [
    {
      icon: Crown,
      title: "Break-even in 14 months, free forever after",
      desc:
        "€199 once = the cost of 13.2 Gold months. Lifetime lock means you never pay again — while Gold and Silver prices will rise as the product matures.",
    },
    {
      icon: Lock,
      title: "Max 100 Platinum seats per year",
      desc:
        "Founder-tier access with a hard cap. Once the 100 yearly seats are gone, Platinum re-opens at a higher price point the next cycle.",
    },
    {
      icon: Star,
      title: "Private Platinum Telegram",
      desc:
        "Separate 20-seat channel with direct access to our AI analysts — deep-dive Q&A, pre-release insights, strategy review.",
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
            Pricing / Plans
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl"
          >
            Choose the plan built for{" "}
            <span className="gradient-text-green">your betting style.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#a3a9b8] sm:text-lg"
          >
            Four plans, one transparent track record behind them all. Start with a
            €0,01 Bronze trial, scale to Gold when you&apos;re ready, or lock in
            lifetime access with Platinum.
          </motion.p>

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
      <section className="relative py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-1/4 h-[400px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.1)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12">
            <span className="section-label">
              <Sparkles className="h-3 w-3" /> Plan deep dive
            </span>
            <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              What&apos;s actually{" "}
              <span className="gradient-text-green">inside each plan.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-base text-[#a3a9b8]">
              Every plan includes our full transparent track record. The difference
              is the coverage, the tools, and how much you unlock.
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
                      className="text-display mt-5 text-3xl sm:text-4xl"
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
                      className={`mt-8 inline-flex items-center justify-center gap-2 ${
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
      <section className="relative py-20 md:py-28">
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
            <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              Compare every plan at a glance.
            </h2>
          </div>

          <div className="card-neon overflow-hidden">
            <div className="relative">
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
      </section>

      {/* ═══ WHY GOLD ═══ */}
      <section className="relative py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 bottom-0 h-[400px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.15)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12">
            <span className="section-label">
              <Star className="h-3 w-3" /> Why Gold
            </span>
            <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              Most people pick{" "}
              <span className="gradient-text-green">Gold — here&apos;s why.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-base text-[#a3a9b8]">
              Silver is a great starter, but if you bet more than once a week on
              matches outside the top 5 European leagues, Gold pays for itself.
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
      <section className="relative py-20 md:py-28">
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
            <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              The best long-term deal{" "}
              <span style={{ color: "#fbbf24" }}>is Platinum.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-base text-[#a3a9b8]">
              €199 once. Gold costs €14,99/month — so Platinum breaks even at 13.2
              months and you never pay again. Plus founder-tier perks you
              can&apos;t get on any monthly plan.
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
            className="card-neon mt-8 p-8 sm:p-10"
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
      <section className="relative py-20 md:py-28">
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
          <div className="card-neon card-neon-green halo-green p-10 md:p-16">
            <div className="relative text-center">
              <span className="section-label mb-4">
                <Sparkles className="h-3 w-3" /> Ready to try it?
              </span>
              <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                Start with €0,01 —{" "}
                <span className="gradient-text-green">decide later.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#a3a9b8]">
                Full Gold access for 7 days. Cancel any time. No surprises, no
                auto-upgrade. Just our real predictions against your real bets.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={`${loc("/checkout")}?plan=bronze`}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Start €0,01 trial
                </Link>
                <Link
                  href={loc("/track-record")}
                  className="btn-ghost inline-flex items-center gap-2"
                >
                  See the track record
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

export default PricingContent;
