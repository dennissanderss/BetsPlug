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
import { HeroMediaBg, CtaMediaBg } from "@/components/ui/media-bg";
import { PAGE_IMAGES } from "@/data/page-images";

const PricingSection = dynamic(
  () => import("@/components/ui/pricing-section").then((m) => m.PricingSection),
  { ssr: true }
);

interface PricingContentProps {
  pricingConfig?: any;
}

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
  accent: "lime" | "gold";
  popular?: boolean;
  cta: string;
  ctaHref: (loc: (s: string) => string) => string;
}

export function PricingContent({ pricingConfig }: PricingContentProps) {
  const loc = useLocalizedHref();

  const plans: PlanDetail[] = [
    {
      id: "bronze",
      icon: Shield,
      name: "Bronze",
      tagline: "Full-access 7-day trial",
      bestFor: "First-timers who want to validate BetsPlug against their own betting data before committing.",
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
      accent: "lime",
      cta: "Start €0,01 Trial",
      ctaHref: (l) => `${l("/checkout")}?plan=bronze`,
    },
    {
      id: "silver",
      icon: Zap,
      name: "Silver",
      tagline: "For casual weekend bettors",
      bestFor: "Bettors focused on top-5 European leagues who want solid predictions without the bells and whistles.",
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
      accent: "lime",
      cta: "Start Silver",
      ctaHref: (l) => `${l("/checkout")}?plan=silver`,
    },
    {
      id: "gold",
      icon: Star,
      name: "Gold",
      tagline: "Most Popular — Full access",
      bestFor: "Serious bettors who want every edge: all leagues, all exports, and direct access to our AI analysts.",
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
      notIncluded: [
        "Lifetime pricing lock",
        "Founder-tier perks",
      ],
      accent: "lime",
      popular: true,
      cta: "Start Gold",
      ctaHref: (l) => `${l("/checkout")}?plan=gold`,
    },
    {
      id: "platinum",
      icon: Crown,
      name: "Platinum Lifetime",
      tagline: "Founder-tier · Pay once, keep forever",
      bestFor: "Power users who want the best long-term ROI — everything Gold offers, plus exclusive Platinum-only perks, forever.",
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
      accent: "gold",
      cta: "Claim Lifetime",
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
      desc: "€14,99/month for 30+ leagues, 66.7% Pick of the Day accuracy, and full exports. Silver users routinely upgrade within 30 days.",
    },
    {
      icon: Sparkles,
      title: "The only plan with Strategy Lab",
      desc: "Backtest your own angles against our entire historical prediction database. Ships Gold + Platinum first.",
    },
    {
      icon: Shield,
      title: "Community + priority support",
      desc: "Real-time Gold Telegram + 12h response SLA. Silver is email-only. Bronze is trial-scoped.",
    },
  ];

  const platinumReasons = [
    {
      icon: Crown,
      title: "Break-even in 14 months, free forever after",
      desc: "€199 once = the cost of 13.2 Gold months. Lifetime lock means you never pay again — while Gold and Silver prices will rise as the product matures.",
    },
    {
      icon: Lock,
      title: "Max 100 Platinum seats per year",
      desc: "Founder-tier access with a hard cap. Once the 100 yearly seats are gone, Platinum re-opens at a higher price point the next cycle.",
    },
    {
      icon: Star,
      title: "Private Platinum Telegram",
      desc: "Separate 20-seat channel with direct access to our AI analysts — deep-dive Q&A, pre-release insights, strategy review.",
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050505] text-[#ededed]">
      <SiteNav />

      {/* ═══════════════════════════════════════════════════════════════════
          HERO
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="no-rhythm relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <HeroMediaBg src={PAGE_IMAGES.pricing.hero} alt="" />

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
            className="text-display text-3xl text-white sm:text-4xl lg:text-5xl"
          >
            Choose the plan built for{" "}
            <span className="text-[#4ade80]">your betting style.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#a3a3a3] sm:text-lg"
          >
            Four plans, one transparent track record behind them all. Start with a €0,01 Bronze trial, scale to Gold when you're ready, or lock in lifetime access with Platinum.
          </motion.p>

          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            aria-label="Breadcrumb"
            className="mt-8 flex items-center justify-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#707070]"
          >
            <Link href={loc("/")} className="transition-colors hover:text-[#4ade80]">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#a3a3a3]">Pricing</span>
          </motion.nav>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PRICING GRID — reused from homepage
         ═══════════════════════════════════════════════════════════════════ */}
      <PricingSection pricingConfig={pricingConfig} />

      {/* ═══════════════════════════════════════════════════════════════════
          PLAN DEEP-DIVES — each plan explained in detail
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 sm:mb-14">
            <span className="section-label">Plan Deep Dive</span>
            <h2 className="text-display text-3xl text-white sm:text-4xl lg:text-5xl">
              What's actually{" "}
              <span className="text-[#4ade80]">inside each plan.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#a3a3a3]">
              Every plan includes our full transparent track record. The difference is the coverage, the tools, and how much you unlock.
            </p>
          </div>

          <div className="grid gap-[1px] bg-white/[0.08] lg:grid-cols-2">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isGold = plan.accent === "gold";
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col p-6 sm:p-8 ${
                    isGold
                      ? "bg-[#120c02]"
                      : plan.popular
                      ? "bg-[#4ade80]/[0.06]"
                      : "bg-[#0a0a0a]"
                  }`}
                >
                  {/* Corner brackets */}
                  <span
                    className={`pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 ${
                      isGold ? "border-amber-300" : "border-[#4ade80]"
                    }`}
                  />
                  <span
                    className={`pointer-events-none absolute right-0 bottom-0 h-3 w-3 border-r-2 border-b-2 ${
                      isGold ? "border-amber-300" : "border-[#4ade80]"
                    }`}
                  />

                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-5 w-5 ${
                          isGold ? "text-amber-300" : "text-[#4ade80]"
                        }`}
                        strokeWidth={2}
                      />
                      <span
                        className={`font-mono text-[10px] font-black uppercase tracking-widest ${
                          isGold ? "text-amber-300" : "text-[#4ade80]"
                        }`}
                      >
                        Plan / {plan.name}
                      </span>
                    </div>
                    {plan.popular && (
                      <span className="bg-[#050505] px-2 py-1 font-mono text-[9px] font-black tracking-widest text-[#4ade80]">
                        ★ POPULAR
                      </span>
                    )}
                    {isGold && (
                      <span className="bg-[#050505] px-2 py-1 font-mono text-[9px] font-black tracking-widest text-amber-300">
                        ★ LIFETIME
                      </span>
                    )}
                  </div>

                  <h3
                    className={`text-display text-3xl sm:text-4xl ${
                      isGold ? "text-amber-100" : "text-white"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`mt-2 text-sm ${
                      isGold ? "text-amber-100/70" : "text-[#a3a3a3]"
                    }`}
                  >
                    {plan.tagline}
                  </p>

                  <div className="mt-5 flex items-baseline gap-2">
                    <span
                      className={`text-stat text-4xl sm:text-5xl ${
                        isGold ? "text-amber-300" : "text-white"
                      }`}
                    >
                      {plan.price}
                    </span>
                    <span
                      className={`font-mono text-[11px] uppercase tracking-widest ${
                        isGold ? "text-amber-100/60" : "text-[#707070]"
                      }`}
                    >
                      / {plan.period}
                    </span>
                  </div>

                  <p
                    className={`mt-5 border-l-2 py-2 pl-4 text-sm leading-relaxed ${
                      isGold
                        ? "border-amber-300 text-amber-100/80"
                        : "border-[#4ade80] text-[#ededed]"
                    }`}
                  >
                    <span className="mono-label-lime mb-1 block">Best for</span>
                    {plan.bestFor}
                  </p>

                  <div className="mt-6 space-y-2.5">
                    <p
                      className={`font-mono text-[10px] font-black uppercase tracking-widest ${
                        isGold ? "text-amber-300" : "text-[#4ade80]"
                      }`}
                    >
                      Included
                    </p>
                    {plan.includes.map((item) => (
                      <div key={item} className="flex items-start gap-3 text-sm">
                        <CheckCircle2
                          className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                            isGold ? "text-amber-300" : "text-[#4ade80]"
                          }`}
                          strokeWidth={2.5}
                        />
                        <span className={isGold ? "text-amber-100/90" : "text-[#ededed]"}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>

                  {plan.notIncluded.length > 0 && (
                    <div className="mt-5 space-y-2.5">
                      <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#707070]">
                        Not included
                      </p>
                      {plan.notIncluded.map((item) => (
                        <div
                          key={item}
                          className="flex items-start gap-3 text-sm text-[#707070]"
                        >
                          <XCircle
                            className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#707070]"
                            strokeWidth={2}
                          />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Link
                    href={plan.ctaHref(loc)}
                    className={`mt-8 inline-flex items-center justify-center px-6 py-3.5 text-xs font-black uppercase tracking-widest transition-colors ${
                      isGold
                        ? "bg-amber-300 text-[#120c02] hover:bg-amber-200"
                        : plan.popular
                        ? "bg-[#4ade80] text-[#050505] hover:bg-[#86efac]"
                        : "border border-[#4ade80] text-[#4ade80] hover:bg-[#4ade80] hover:text-[#050505]"
                    }`}
                  >
                    {plan.cta.toUpperCase()} →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          COMPARISON MATRIX — at-a-glance feature grid
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 sm:mb-14">
            <span className="section-label">Side By Side</span>
            <h2 className="text-display text-3xl text-white sm:text-4xl lg:text-5xl">
              Compare every plan at a glance.
            </h2>
          </div>

          <div className="relative border border-white/10 bg-[#0a0a0a]">
            <span className="pointer-events-none absolute left-[-1px] top-[-1px] h-3 w-3 border-l-2 border-t-2 border-[#4ade80]" />
            <span className="pointer-events-none absolute right-[-1px] top-[-1px] h-3 w-3 border-r-2 border-t-2 border-[#4ade80]" />
            <span className="pointer-events-none absolute left-[-1px] bottom-[-1px] h-3 w-3 border-l-2 border-b-2 border-[#4ade80]" />
            <span className="pointer-events-none absolute right-[-1px] bottom-[-1px] h-3 w-3 border-r-2 border-b-2 border-[#4ade80]" />

            {/* Header row */}
            <div className="grid grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))] items-stretch border-b border-white/10">
              <div className="px-4 py-5 sm:px-6">
                <span className="mono-label">Feature</span>
              </div>
              {[
                { label: "Bronze", cls: "text-[#a3a3a3]" },
                { label: "Silver", cls: "text-[#a3a3a3]" },
                { label: "Gold", cls: "text-[#4ade80]" },
                { label: "Platinum", cls: "text-amber-300" },
              ].map((h) => (
                <div key={h.label} className="border-l border-white/10 px-2 py-5 text-center">
                  <span
                    className={`font-mono text-[10px] font-black uppercase tracking-widest ${h.cls}`}
                  >
                    {h.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Rows */}
            {goldVsOthers.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))] items-stretch border-t border-white/[0.08]"
              >
                <div className="px-4 py-4 sm:px-6">
                  <span className="text-sm text-white">{row.label}</span>
                </div>
                {[
                  { v: row.bronze, isPlat: false, isGold: false },
                  { v: row.silver, isPlat: false, isGold: false },
                  { v: row.gold, isPlat: false, isGold: true },
                  { v: row.platinum, isPlat: true, isGold: false },
                ].map((cell, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-center border-l border-white/[0.08] py-4 ${
                      cell.isGold ? "bg-[#4ade80]/[0.05]" : ""
                    } ${cell.isPlat ? "bg-amber-300/[0.04]" : ""}`}
                  >
                    {cell.v === true ? (
                      <CheckCircle2
                        className={`h-4 w-4 ${
                          cell.isPlat ? "text-amber-300" : "text-[#4ade80]"
                        }`}
                        strokeWidth={3}
                      />
                    ) : cell.v === "trial" ? (
                      <span className="font-mono text-[9px] font-black uppercase tracking-widest text-[#a3a3a3]">
                        7-DAY TRIAL
                      </span>
                    ) : (
                      <XCircle className="h-4 w-4 text-[#707070]" strokeWidth={2} />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          WHY GOLD
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 sm:mb-14">
            <span className="section-label">Why Gold</span>
            <h2 className="text-display text-3xl text-white sm:text-4xl lg:text-5xl">
              Most people pick{" "}
              <span className="text-[#4ade80]">Gold — here's why.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#a3a3a3]">
              Silver is a great starter, but if you bet more than once a week on matches outside the top 5 European leagues, Gold pays for itself.
            </p>
          </div>

          <div className="grid gap-[1px] bg-white/[0.08] md:grid-cols-3">
            {goldReasons.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.title}
                  className="relative flex flex-col bg-[#0a0a0a] p-6 sm:p-8"
                >
                  <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-[#4ade80]" />
                  <span className="pointer-events-none absolute right-0 bottom-0 h-3 w-3 border-r-2 border-b-2 border-[#4ade80]" />
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center border border-[#4ade80]/50 bg-[#4ade80]/[0.08]">
                    <Icon className="h-5 w-5 text-[#4ade80]" strokeWidth={2} />
                  </div>
                  <h3 className="text-display text-xl text-white sm:text-2xl">
                    {r.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#a3a3a3]">
                    {r.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href={`${loc("/checkout")}?plan=gold`} className="btn-lime">
              START GOLD →
            </Link>
            <Link href={`${loc("/checkout")}?plan=bronze`} className="btn-outline">
              OR TRY €0,01 FIRST →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          WHY PLATINUM LIFETIME
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 sm:mb-14">
            <span
              className="section-label"
              style={{
                borderColor: "rgba(252, 211, 77, 0.5)",
                color: "#fbbf24",
                backgroundColor: "rgba(251, 191, 36, 0.06)",
              }}
            >
              <Crown className="h-3 w-3" />
              Why Platinum Lifetime
            </span>
            <h2 className="text-display text-3xl text-white sm:text-4xl lg:text-5xl">
              The best long-term deal{" "}
              <span style={{ color: "#fbbf24" }}>is Platinum.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#a3a3a3]">
              €199 once. Gold costs €14,99/month — so Platinum breaks even at 13.2 months and you never pay again. Plus founder-tier perks you can't get on any monthly plan.
            </p>
          </div>

          <div className="grid gap-[1px] bg-amber-300/20 md:grid-cols-3">
            {platinumReasons.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.title}
                  className="relative flex flex-col bg-[#0a0703] p-6 sm:p-8"
                  style={{
                    backgroundImage:
                      "radial-gradient(800px 400px at 0% 0%, rgba(253, 224, 71, 0.06), transparent 55%)",
                  }}
                >
                  <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-amber-300" />
                  <span className="pointer-events-none absolute right-0 bottom-0 h-3 w-3 border-r-2 border-b-2 border-amber-300" />
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center border border-amber-300/50 bg-amber-300/[0.08]">
                    <Icon className="h-5 w-5 text-amber-300" strokeWidth={2} />
                  </div>
                  <h3 className="text-display text-xl text-amber-100 sm:text-2xl">
                    {r.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-amber-100/70">
                    {r.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Value breakdown */}
          <div className="relative mt-10 border border-amber-300/40 bg-[#0a0703] p-6 sm:p-8">
            <span className="pointer-events-none absolute left-[-1px] top-[-1px] h-4 w-4 border-l-2 border-t-2 border-amber-300" />
            <span className="pointer-events-none absolute right-[-1px] top-[-1px] h-4 w-4 border-r-2 border-t-2 border-amber-300" />
            <span className="pointer-events-none absolute left-[-1px] bottom-[-1px] h-4 w-4 border-l-2 border-b-2 border-amber-300" />
            <span className="pointer-events-none absolute right-[-1px] bottom-[-1px] h-4 w-4 border-r-2 border-b-2 border-amber-300" />

            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-amber-300">
                  Platinum pays off after
                </p>
                <p className="text-stat mt-2 text-4xl text-amber-300 sm:text-5xl">
                  13.2 months
                </p>
                <p className="mt-1 text-sm text-amber-100/70">
                  Every month after is 100% savings.
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-amber-300">
                  5-year cost (Gold)
                </p>
                <p className="text-stat mt-2 text-4xl text-white sm:text-5xl">
                  €899
                </p>
                <p className="mt-1 text-sm text-amber-100/70">
                  At today's price. Prices are rising as we grow.
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-amber-300">
                  5-year cost (Platinum)
                </p>
                <p className="text-stat mt-2 text-4xl text-amber-300 sm:text-5xl">
                  €199
                </p>
                <p className="mt-1 text-sm text-amber-100/70">
                  One-time. Frozen. Forever.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href={`${loc("/checkout")}?plan=platinum`}
              className="inline-flex items-center gap-2 px-8 py-4 text-xs font-black uppercase tracking-widest transition-colors"
              style={{
                background:
                  "linear-gradient(135deg, #fef3c7 0%, #fde68a 25%, #fbbf24 55%, #d97706 100%)",
                color: "#1a1405",
                border: "1px solid rgba(253, 224, 71, 0.9)",
              }}
            >
              <Crown className="h-4 w-4" />
              CLAIM LIFETIME ACCESS →
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-widest text-amber-100/60">
              Max 100 seats / year · Lifetime price lock
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FINAL CTA
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="relative overflow-hidden bg-[#4ade80] p-10 md:p-16">
            <CtaMediaBg
              src={PAGE_IMAGES.pricing.cta}
              alt={PAGE_IMAGES.pricing.alt}
              pattern={PAGE_IMAGES.pricing.pattern}
            />
            <span className="pointer-events-none absolute left-0 top-0 z-10 h-4 w-4 border-l-2 border-t-2 border-[#050505]" />
            <span className="pointer-events-none absolute right-0 top-0 z-10 h-4 w-4 border-r-2 border-t-2 border-[#050505]" />
            <span className="pointer-events-none absolute left-0 bottom-0 z-10 h-4 w-4 border-l-2 border-b-2 border-[#050505]" />
            <span className="pointer-events-none absolute right-0 bottom-0 z-10 h-4 w-4 border-r-2 border-b-2 border-[#050505]" />

            <div className="relative">
              <span className="mb-6 inline-flex items-center gap-2 bg-[#050505] px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#4ade80]">
                <Sparkles className="h-3 w-3" />
                Ready To Try It?
              </span>
              <h2 className="text-display text-3xl text-[#050505] sm:text-4xl lg:text-5xl">
                Start with €0,01 — decide later.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#050505]/80">
                Full Gold access for 7 days. Cancel any time. No surprises, no auto-upgrade. Just our real predictions against your real bets.
              </p>

              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link
                  href={`${loc("/checkout")}?plan=bronze`}
                  className="inline-flex items-center gap-2 bg-[#050505] px-8 py-4 text-xs font-black uppercase tracking-widest text-[#4ade80] transition-colors hover:bg-[#1a1a1a]"
                >
                  START €0,01 TRIAL →
                </Link>
                <Link
                  href={loc("/track-record")}
                  className="inline-flex items-center gap-2 border-b-2 border-[#050505] pb-1 text-xs font-black uppercase tracking-widest text-[#050505] transition-colors hover:border-white hover:text-white"
                >
                  SEE THE TRACK RECORD →
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
