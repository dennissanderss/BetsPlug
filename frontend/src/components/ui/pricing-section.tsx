"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Check, Crown, Sparkles, Zap, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  icon: LucideIcon;
  tagline: string;
  priceMain: string;
  priceCents?: string;
  period: string;
  highlight?: boolean;
  cta: string;
  features: string[];
};

// Monthly plans — charm pricing applied (9 & 14 end in "value" digits)
const plans: Plan[] = [
  {
    id: "bronze",
    name: "Bronze",
    icon: Shield,
    tagline: "Start exploring, free forever",
    priceMain: "0",
    period: "/ forever",
    cta: "Get Started Free",
    features: [
      "1 Bet of the Day (free pick)",
      "3 daily AI predictions",
      "Access to public track record",
      "Community insights",
      "Email support",
    ],
  },
  {
    id: "silver",
    name: "Silver",
    icon: Zap,
    tagline: "For serious analysts",
    priceMain: "9",
    priceCents: "99",
    period: "/ month",
    cta: "Start Silver",
    features: [
      "Unlimited AI predictions",
      "All 4 AI models (Ensemble)",
      "Live probability tracking",
      "Strategy backtesting",
      "Priority email support",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    icon: Sparkles,
    tagline: "Most popular choice",
    priceMain: "14",
    priceCents: "99",
    period: "/ month",
    highlight: true,
    cta: "Start Gold",
    features: [
      "Everything in Silver, plus:",
      "Exclusive Gold Telegram channel",
      "Early access to Bet of the Day",
      "Personal AI strategy advisor",
      "VIP leaderboard & analytics",
      "24/7 priority support",
    ],
  },
];

const platinum: Plan = {
  id: "platinum",
  name: "Platinum",
  icon: Crown,
  tagline: "One-time payment. Lifetime access.",
  priceMain: "199",
  period: "one-time",
  cta: "Claim Lifetime Access",
  features: [
    "Lifetime access to every feature",
    "All future releases included forever",
    "Direct line to our analyst team",
    "Founder-tier leaderboard badge",
    "Limited to 100 members per year",
  ],
};

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden py-20 md:py-28"
      aria-labelledby="pricing-heading"
    >
      {/* ── Unique background ────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#070a12] via-[#0b1220] to-[#070a12]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(74,222,128,0.6) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-green-500/[0.07] blur-[150px]" />
        <div className="absolute left-[8%] bottom-20 h-[320px] w-[320px] rounded-full bg-emerald-500/[0.05] blur-[120px]" />
        <div className="absolute right-[8%] top-40 h-[320px] w-[320px] rounded-full bg-green-500/[0.05] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-400">
            Pricing
          </span>
          <h2
            id="pricing-heading"
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
          >
            Simple, honest{" "}
            <span className="gradient-text">pricing</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Start free, upgrade whenever you&apos;re ready. No hidden fees, no
            lock-in contracts — cancel anytime.
          </p>
        </motion.div>

        {/* 3-plan grid */}
        <div className="grid gap-6 md:grid-cols-3 md:gap-5 lg:gap-6">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const isHighlight = plan.highlight;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                viewport={{ once: true }}
                className={`group relative flex flex-col overflow-hidden rounded-3xl p-8 backdrop-blur-xl transition-all duration-300 ${
                  isHighlight
                    ? "border-2 border-green-500/50 bg-gradient-to-br from-green-500/[0.12] via-emerald-500/[0.05] to-transparent shadow-[0_0_60px_rgba(74,222,128,0.18)] md:-translate-y-4 md:scale-[1.03]"
                    : "border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] hover:border-green-500/30"
                }`}
              >
                {/* Highlight glow */}
                {isHighlight && (
                  <>
                    <div className="pointer-events-none absolute -left-20 -top-20 h-[280px] w-[280px] rounded-full bg-green-500/[0.18] blur-[100px]" />
                    <div className="pointer-events-none absolute -right-20 -bottom-20 h-[280px] w-[280px] rounded-full bg-emerald-500/[0.12] blur-[100px]" />
                    <span className="absolute right-6 top-6 rounded-full border border-green-500/40 bg-green-500/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-green-300 shadow-[0_0_20px_rgba(74,222,128,0.3)]">
                      Most Popular
                    </span>
                  </>
                )}

                {/* Icon + Name */}
                <div className="relative mb-6">
                  <div
                    className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${
                      isHighlight
                        ? "bg-green-500/20 shadow-[0_0_30px_rgba(74,222,128,0.35)]"
                        : "bg-green-500/10"
                    }`}
                  >
                    <Icon className="h-6 w-6 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">{plan.tagline}</p>
                </div>

                {/* Price */}
                <div className="relative mb-6 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-slate-300">€</span>
                  <span className="text-6xl font-extrabold tracking-tight text-white">
                    {plan.priceMain}
                  </span>
                  {plan.priceCents && (
                    <span className="mt-2 text-xl font-bold text-slate-300">
                      ,{plan.priceCents}
                    </span>
                  )}
                  <span className="ml-2 text-sm text-slate-500">
                    {plan.period}
                  </span>
                </div>

                {/* CTA */}
                <Link
                  href="/subscriptions"
                  className={`relative mb-6 flex w-full items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-bold transition-all duration-300 ${
                    isHighlight
                      ? "btn-gradient text-black shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
                      : "border border-white/[0.12] bg-white/[0.04] text-white hover:border-green-500/40 hover:bg-green-500/[0.08]"
                  }`}
                >
                  {plan.cta}
                </Link>

                {/* Features */}
                <ul className="relative flex flex-col gap-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-sm text-slate-300"
                    >
                      <Check
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                          isHighlight ? "text-green-400" : "text-green-500/80"
                        }`}
                        strokeWidth={3}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* ── Platinum lifetime card (wide, below) ───────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="relative mt-10 overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.08] via-yellow-500/[0.03] to-transparent p-8 backdrop-blur-xl md:p-10"
        >
          {/* Ambient gold glow */}
          <div className="pointer-events-none absolute -right-32 -top-32 h-[400px] w-[400px] rounded-full bg-amber-400/[0.15] blur-[130px]" />
          <div className="pointer-events-none absolute -left-32 -bottom-32 h-[400px] w-[400px] rounded-full bg-yellow-500/[0.1] blur-[130px]" />

          {/* Diagonal shimmer lines */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(251,191,36,0.8) 0 1px, transparent 1px 22px)",
            }}
          />

          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            {/* Left: branding + features */}
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-amber-300 shadow-[0_0_25px_rgba(251,191,36,0.25)]">
                  <Crown className="h-3 w-3" />
                  Lifetime Deal
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Limited to 100/year
                </span>
              </div>

              <h3 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                  Platinum
                </span>{" "}
                Lifetime
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
                {platinum.tagline} Pay once, own your edge forever — every
                current feature and every future upgrade, included.
              </p>

              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {platinum.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-slate-300"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400"
                      strokeWidth={3}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: price + CTA */}
            <div className="flex flex-col items-start gap-5 lg:items-end lg:text-right">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-300/80">
                  One-time payment
                </p>
                <div className="mt-2 flex items-baseline gap-1 lg:justify-end">
                  <span className="text-2xl font-bold text-slate-300">€</span>
                  <span className="bg-gradient-to-b from-white to-amber-200 bg-clip-text text-7xl font-extrabold tracking-tight text-transparent">
                    199
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  No subscription. No renewals. Ever.
                </p>
              </div>

              <Link
                href="/subscriptions"
                className="group/btn relative inline-flex w-full items-center justify-center overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 px-8 py-4 text-sm font-extrabold uppercase tracking-wider text-black shadow-[0_0_40px_rgba(251,191,36,0.35)] transition-all duration-300 hover:shadow-[0_0_60px_rgba(251,191,36,0.55)] sm:w-auto"
              >
                <Crown className="mr-2 h-4 w-4" />
                {platinum.cta}
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Trust row */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-green-400" strokeWidth={3} />
            <span>3-Day Money-Back Guarantee</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-green-400" strokeWidth={3} />
            <span>Cancel Anytime</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-green-400" strokeWidth={3} />
            <span>Secure payment by Stripe</span>
          </div>
        </div>
      </div>
    </section>
  );
}
