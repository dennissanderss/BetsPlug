"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { Check, Crown, Sparkles, Zap, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";

type Billing = "monthly" | "yearly";

type PriceBreakdown = {
  main: string;
  cents?: string;
  period: string;
  /** Small line rendered below the big price (e.g. "Billed €95,90 yearly") */
  footnote?: string;
};

type Plan = {
  id: string;
  name: string;
  icon: LucideIcon;
  tagline: string;
  /** When true this plan ignores the billing toggle (e.g. Bronze free tier) */
  fixed?: boolean;
  monthly: PriceBreakdown;
  yearly: PriceBreakdown;
  highlight?: boolean;
  cta: string;
  features: string[];
};

export function PricingSection() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const pricingHref = `${loc("/")}#pricing`;
  const [billing, setBilling] = useState<Billing>("monthly");

  // Charm pricing — Silver €9,99/mo (yearly 20% off €7,99/mo)
  // Gold €14,99/mo (yearly 20% off €11,99/mo)
  const plans: Plan[] = [
    {
      id: "bronze",
      name: "Bronze",
      icon: Shield,
      tagline: t("pricing.bronzeTagline"),
      fixed: true,
      monthly: { main: "0", period: t("pricing.forever") },
      yearly: { main: "0", period: t("pricing.forever") },
      cta: t("pricing.bronzeCta"),
      features: [
        t("pricing.bronzeF1"),
        t("pricing.bronzeF2"),
        t("pricing.bronzeF3"),
        t("pricing.bronzeF4"),
        t("pricing.bronzeF5"),
      ],
    },
    {
      id: "silver",
      name: "Silver",
      icon: Zap,
      tagline: t("pricing.silverTagline"),
      monthly: {
        main: "9",
        cents: "99",
        period: t("pricing.perMonth"),
        footnote: t("pricing.billedMonthly"),
      },
      yearly: {
        main: "7",
        cents: "99",
        period: t("pricing.perMonth"),
        footnote: t("pricing.billedYearlySilver"),
      },
      cta: t("pricing.silverCta"),
      features: [
        t("pricing.silverF1"),
        t("pricing.silverF2"),
        t("pricing.silverF3"),
        t("pricing.silverF4"),
        t("pricing.silverF5"),
      ],
    },
    {
      id: "gold",
      name: "Gold",
      icon: Sparkles,
      tagline: t("pricing.goldTagline"),
      monthly: {
        main: "14",
        cents: "99",
        period: t("pricing.perMonth"),
        footnote: t("pricing.billedMonthly"),
      },
      yearly: {
        main: "11",
        cents: "99",
        period: t("pricing.perMonth"),
        footnote: t("pricing.billedYearlyGold"),
      },
      highlight: true,
      cta: t("pricing.goldCta"),
      features: [
        t("pricing.goldF1"),
        t("pricing.goldF2"),
        t("pricing.goldF3"),
        t("pricing.goldF4"),
        t("pricing.goldF5"),
        t("pricing.goldF6"),
      ],
    },
  ];

  const platinum = {
    name: "Platinum",
    icon: Crown,
    tagline: t("pricing.platTagline"),
    priceMain: "199",
    period: "one-time",
    cta: t("pricing.platCta"),
    features: [
      t("pricing.platF1"),
      t("pricing.platF2"),
      t("pricing.platF3"),
      t("pricing.platF4"),
      t("pricing.platF5"),
    ],
  };

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
            {t("pricing.badge")}
          </span>
          <h2
            id="pricing-heading"
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
          >
            <span className="gradient-text">{t("pricing.title")}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            {t("pricing.subtitle")}
          </p>
        </motion.div>

        {/* ── Billing toggle ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mb-12 flex flex-col items-center gap-3"
        >
          <div
            role="tablist"
            aria-label="Billing period"
            className="relative inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] p-1 backdrop-blur-xl"
          >
            {/* Animated slider pill */}
            <motion.div
              aria-hidden="true"
              className="absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-green-500/90 to-emerald-500/90 shadow-[0_0_25px_rgba(74,222,128,0.45)]"
              initial={false}
              animate={{
                left: billing === "monthly" ? "0.25rem" : "50%",
                right: billing === "monthly" ? "50%" : "0.25rem",
              }}
              transition={{ type: "spring", stiffness: 360, damping: 32 }}
            />
            <button
              type="button"
              role="tab"
              aria-selected={billing === "monthly"}
              onClick={() => setBilling("monthly")}
              className={`relative z-10 rounded-full px-6 py-2.5 text-sm font-bold transition-colors duration-200 sm:px-8 ${
                billing === "monthly"
                  ? "text-black"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {t("pricing.monthly")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={billing === "yearly"}
              onClick={() => setBilling("yearly")}
              className={`relative z-10 flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-colors duration-200 sm:px-8 ${
                billing === "yearly"
                  ? "text-black"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {t("pricing.yearly")}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider transition-colors duration-200 ${
                  billing === "yearly"
                    ? "bg-black/20 text-black"
                    : "bg-green-500/15 text-green-300"
                }`}
              >
                −20%
              </span>
            </button>
          </div>
          <AnimatePresence mode="wait">
            {billing === "yearly" && (
              <motion.p
                key="save-line"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="text-xs text-slate-400"
              >
                {t("pricing.savingNote")}
              </motion.p>
            )}
          </AnimatePresence>
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
                      {t("pricing.mostPopular")}
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
                {(() => {
                  const price = plan.fixed ? plan.monthly : plan[billing];
                  return (
                    <div className="relative mb-6 min-h-[92px]">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={`${plan.id}-${plan.fixed ? "fixed" : billing}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                        >
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-slate-300">
                              €
                            </span>
                            <span className="text-6xl font-extrabold tracking-tight text-white">
                              {price.main}
                            </span>
                            {price.cents && (
                              <span className="mt-2 text-xl font-bold text-slate-300">
                                ,{price.cents}
                              </span>
                            )}
                            <span className="ml-2 text-sm text-slate-500">
                              {price.period}
                            </span>
                          </div>
                          {price.footnote && (
                            <p className="mt-2 text-xs text-slate-500">
                              {price.footnote}
                            </p>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  );
                })()}

                {/* CTA */}
                <Link
                  href={pricingHref}
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
                  {t("pricing.platBadgeLifetime")}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  {t("pricing.platLimited")}
                </span>
              </div>

              <h3 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                  Platinum
                </span>{" "}
                Lifetime
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
                {platinum.tagline} {t("pricing.platPitch")}
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
                  {t("pricing.platOneTime")}
                </p>
                <div className="mt-2 flex items-baseline gap-1 lg:justify-end">
                  <span className="text-2xl font-bold text-slate-300">€</span>
                  <span className="bg-gradient-to-b from-white to-amber-200 bg-clip-text text-7xl font-extrabold tracking-tight text-transparent">
                    199
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {t("pricing.platNoSub")}
                </p>
              </div>

              <Link
                href={pricingHref}
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
            <span>{t("pricing.trust1")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-green-400" strokeWidth={3} />
            <span>{t("pricing.trust2")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-green-400" strokeWidth={3} />
            <span>{t("pricing.trust3")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
