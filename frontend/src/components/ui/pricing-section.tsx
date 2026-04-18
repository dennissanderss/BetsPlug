"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { Check, Crown, Sparkles, Zap, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { usePotdNumbers } from "@/hooks/use-potd-numbers";

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
  accent: "green" | "purple" | "blue";
};

interface PricingSectionProps {
  /** Optional pricing config from Sanity pricingConfig singleton */
  pricingConfig?: any;
}

export function PricingSection({ pricingConfig }: PricingSectionProps = {}) {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const potd = usePotdNumbers();
  const [billing, setBilling] = useState<Billing>("monthly");
  const [loading, setLoading] = useState<string | null>(null);

  const checkoutHref = (planId: string) =>
    `${loc("/checkout")}?plan=${planId}&billing=${billing}`;

  const handleStripeCheckout = async (planId: string) => {
    setLoading(planId);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const successUrl = `${window.location.origin}/welcome?plan=${planId}&success=true`;
      const cancelUrl = `${window.location.origin}/checkout?plan=${planId}&cancelled=true`;
      const resp = await fetch(`${API}/subscriptions/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, success_url: successUrl, cancel_url: cancelUrl }),
      });
      const data = await resp.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        // Fallback to checkout page
        window.location.href = checkoutHref(planId);
      }
    } catch {
      window.location.href = checkoutHref(planId);
    } finally {
      setLoading(null);
    }
  };

  // Helper to split a price like 9.99 into { main: "9", cents: "99" }
  const splitPrice = (price: number): { main: string; cents: string } => {
    const str = price.toFixed(2);
    const [main, cents] = str.split(".");
    return { main, cents };
  };

  // Resolve Sanity pricing config plans (if available)
  const sanityPlans = pricingConfig?.plans as any[] | undefined;
  const getSanityPlan = (id: string) => sanityPlans?.find((p: any) => p.planId === id);

  const bronzeSanity = getSanityPlan("bronze");
  const silverSanity = getSanityPlan("silver");
  const goldSanity = getSanityPlan("gold");
  const platSanity = getSanityPlan("platinum");

  const bronzePrice = bronzeSanity?.monthlyPrice != null ? splitPrice(bronzeSanity.monthlyPrice) : { main: "0", cents: "01" };
  const silverMonthly = silverSanity?.monthlyPrice != null ? splitPrice(silverSanity.monthlyPrice) : { main: "9", cents: "99" };
  const silverYearly = silverSanity?.yearlyPrice != null ? splitPrice(silverSanity.yearlyPrice) : { main: "7", cents: "99" };
  const goldMonthly = goldSanity?.monthlyPrice != null ? splitPrice(goldSanity.monthlyPrice) : { main: "14", cents: "99" };
  const goldYearly = goldSanity?.yearlyPrice != null ? splitPrice(goldSanity.yearlyPrice) : { main: "11", cents: "99" };
  const platPrice = platSanity?.oneTimePrice != null ? String(Math.floor(platSanity.oneTimePrice)) : "199";

  const plans: Plan[] = [
    {
      id: "bronze",
      name: "Bronze",
      icon: Shield,
      tagline: t("pricing.bronzeTagline"),
      fixed: true,
      monthly: { main: bronzePrice.main, cents: bronzePrice.cents, period: t("pricing.forever") },
      yearly: { main: bronzePrice.main, cents: bronzePrice.cents, period: t("pricing.forever") },
      cta: t("pricing.bronzeCta"),
      accent: "blue",
      features: [
        t("pricing.bronzeF1"),
        t("pricing.bronzeF2"),
        t("pricing.bronzeF3", potd),
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
        main: silverMonthly.main,
        cents: silverMonthly.cents,
        period: t("pricing.perMonth"),
        footnote: t("pricing.billedMonthly"),
      },
      yearly: {
        main: silverYearly.main,
        cents: silverYearly.cents,
        period: t("pricing.perMonth"),
        footnote: t("pricing.billedYearlySilver"),
      },
      cta: t("pricing.silverCta"),
      accent: "purple",
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
        main: goldMonthly.main,
        cents: goldMonthly.cents,
        period: t("pricing.perMonth"),
        footnote: t("pricing.billedMonthly"),
      },
      yearly: {
        main: goldYearly.main,
        cents: goldYearly.cents,
        period: t("pricing.perMonth"),
        footnote: t("pricing.billedYearlyGold"),
      },
      highlight: true,
      cta: t("pricing.goldCta"),
      accent: "green",
      features: [
        t("pricing.goldF1", potd),
        t("pricing.goldF2"),
        t("pricing.goldF3"),
        t("pricing.goldF4"),
        t("pricing.goldF5"),
        t("pricing.goldF6"),
        t("pricing.goldF7"),
      ],
    },
  ];

  const platinum = {
    name: "Platinum",
    icon: Crown,
    tagline: t("pricing.platTagline"),
    priceMain: platPrice,
    period: "one-time",
    cta: t("pricing.platCta"),
    features: [
      t("pricing.platF1"),
      t("pricing.platF2"),
      t("pricing.platF3"),
      t("pricing.platF4"),
      t("pricing.platF5"),
      t("pricing.platF6"),
    ],
  };

  return (
    <section
      id="pricing"
      className="relative overflow-hidden py-20 md:py-28"
      aria-labelledby="pricing-heading"
    >
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[#4ade80]/[0.06] blur-[150px]" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[10%] h-[420px] w-[620px] rounded-full bg-[#a855f7]/[0.05] blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mb-14 max-w-3xl"
        >
          <span className="section-label">
            <Crown className="h-3 w-3" /> {t("pricing.title") ? "Pricing" : "Pricing"}
          </span>
          <h2
            id="pricing-heading"
            className="text-heading mt-4 text-3xl text-[#ededed] sm:text-4xl lg:text-5xl"
          >
            {t("pricing.title")}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#a3a9b8]">
            {t("pricing.subtitle")}
          </p>
        </motion.div>

        {/* Billing toggle */}
        <div className="mb-12 flex flex-col items-center gap-3">
          <div
            role="tablist"
            aria-label="Billing period"
            className="glass-panel-lifted relative inline-flex items-center rounded-full p-1"
            style={{ borderColor: "hsl(0 0% 100% / 0.1)" }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={billing === "monthly"}
              onClick={() => setBilling("monthly")}
              className={`relative z-10 rounded-full px-5 py-2 text-sm transition-colors duration-200 sm:px-7 ${
                billing === "monthly"
                  ? "font-semibold text-[#05130b]"
                  : "text-[#a3a9b8] hover:text-[#ededed]"
              }`}
              style={
                billing === "monthly"
                  ? {
                      background: "linear-gradient(180deg, #4ade80, #22c55e)",
                      boxShadow: "0 6px 18px -6px rgba(74, 222, 128, 0.55)",
                    }
                  : undefined
              }
            >
              {t("pricing.monthly")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={billing === "yearly"}
              onClick={() => setBilling("yearly")}
              className={`relative z-10 flex items-center gap-2 rounded-full px-5 py-2 text-sm transition-colors duration-200 sm:px-7 ${
                billing === "yearly"
                  ? "font-semibold text-[#05130b]"
                  : "text-[#a3a9b8] hover:text-[#ededed]"
              }`}
              style={
                billing === "yearly"
                  ? {
                      background: "linear-gradient(180deg, #4ade80, #22c55e)",
                      boxShadow: "0 6px 18px -6px rgba(74, 222, 128, 0.55)",
                    }
                  : undefined
              }
            >
              {t("pricing.yearly")}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  billing === "yearly"
                    ? "bg-[#050505] text-[#4ade80]"
                    : "bg-white/[0.05] text-[#4ade80]"
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
                className="text-xs text-[#6b7280]"
              >
                {t("pricing.savingNote")}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* 3-plan grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isHighlight = plan.highlight;
            const accent = plan.accent;
            const cardClass =
              accent === "green"
                ? "card-neon card-neon-green"
                : accent === "purple"
                  ? "card-neon card-neon-purple"
                  : "card-neon card-neon-blue";
            return (
              <div
                key={plan.id}
                className={`${cardClass} relative flex flex-col p-8 ${
                  isHighlight ? "halo-green md:-translate-y-4" : ""
                }`}
              >
                {/* Background glow blob for popular */}
                {isHighlight && (
                  <div className="pointer-events-none absolute -right-16 -top-16 h-[280px] w-[280px] rounded-full bg-[#4ade80]/[0.08] blur-[100px]" />
                )}

                <div className="relative flex flex-1 flex-col">
                  {isHighlight && (
                    <Pill tone="active" className="absolute right-0 top-0">
                      <Sparkles className="h-3 w-3" /> Popular
                    </Pill>
                  )}

                  {/* Plan icon badge */}
                  <HexBadge variant={accent} size="md" className="mb-5">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </HexBadge>

                  {/* Name */}
                  <h3 className="text-heading text-2xl text-[#ededed]">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-[#a3a9b8]">{plan.tagline}</p>

                  {/* Price */}
                  {(() => {
                    const price = plan.fixed ? plan.monthly : plan[billing];
                    return (
                      <div className="relative my-6 min-h-[92px]">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={`${plan.id}-${plan.fixed ? "fixed" : billing}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                          >
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl text-[#6b7280]">€</span>
                              <span className="text-stat text-5xl text-[#ededed]">
                                {price.main}
                              </span>
                              {price.cents && (
                                <span className="text-lg text-[#6b7280]">
                                  ,{price.cents}
                                </span>
                              )}
                              <span className="ml-2 text-xs text-[#6b7280]">
                                {price.period}
                              </span>
                            </div>
                            {price.footnote && (
                              <p className="mt-2 text-xs text-[#6b7280]">
                                {price.footnote}
                              </p>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    );
                  })()}

                  {/* CTA */}
                  <button
                    onClick={() => handleStripeCheckout(plan.id)}
                    disabled={loading === plan.id}
                    className={`${isHighlight ? "btn-primary" : "btn-glass"} mb-6 w-full justify-center ${
                      loading === plan.id ? "cursor-wait opacity-50" : ""
                    }`}
                  >
                    {loading === plan.id ? "Redirecting…" : plan.cta}
                  </button>

                  {/* Features */}
                  <ul className="flex flex-col gap-3">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-3 text-sm text-[#ededed]"
                      >
                        <Check
                          className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#4ade80]"
                          strokeWidth={3}
                        />
                        <span className="text-[#cfd3dc]">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Model-validation provenance footer */}
                  <p className="mt-5 text-[10px] leading-relaxed text-[#6b7280]">
                    {t("pricing.dataProvenanceFooter")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Platinum lifetime card */}
        <div
          className="card-neon relative mt-10 overflow-hidden"
          style={{
            boxShadow:
              "0 20px 50px -15px rgba(251, 191, 36, 0.35), 0 0 0 1px rgba(252, 211, 77, 0.15) inset",
          }}
        >
          <div
            className="relative p-8 md:p-10"
            style={{
              background:
                "linear-gradient(135deg, hsl(45 80% 15%) 0%, hsl(40 70% 10%) 50%, hsl(30 80% 12%) 100%)",
            }}
          >
            {/* Ambient amber blobs */}
            <div className="pointer-events-none absolute -right-32 -top-32 h-[460px] w-[460px] rounded-full bg-amber-300/[0.12] blur-[140px]" />
            <div className="pointer-events-none absolute -left-32 -bottom-32 h-[440px] w-[440px] rounded-full bg-yellow-500/[0.1] blur-[140px]" />

            <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
              {/* Left */}
              <div>
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <HexBadge variant="green" size="md">
                    <Crown className="h-5 w-5" strokeWidth={2} />
                  </HexBadge>
                  <span
                    className="section-label"
                    style={{
                      color: "#fcd34d",
                      borderColor: "rgba(252, 211, 77, 0.3)",
                      background: "rgba(252, 211, 77, 0.06)",
                    }}
                  >
                    <Crown className="h-3 w-3" /> {t("pricing.platBadgeLifetime")}
                  </span>
                </div>

                <h3 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, #fde68a 0%, #fbbf24 40%, #f59e0b 70%, #fde68a 100%)",
                    }}
                  >
                    Platinum
                  </span>{" "}
                  Lifetime
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-amber-100/80 sm:text-base">
                  {platinum.tagline} {t("pricing.platPitch")}
                </p>

                <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {platinum.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm text-amber-50/90"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                        strokeWidth={3}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <p className="mt-4 text-[10px] leading-relaxed text-amber-100/60">
                  {t("pricing.dataProvenanceFooter")}
                </p>
              </div>

              {/* Right */}
              <div className="flex flex-col items-start gap-5 lg:items-end lg:text-right">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                    {t("pricing.platOneTime")}
                  </p>
                  <div className="mt-2 flex items-baseline gap-1 lg:justify-end">
                    <span className="text-xl font-bold text-amber-200/70">€</span>
                    <span
                      className="text-stat bg-clip-text text-6xl text-transparent sm:text-7xl"
                      style={{
                        backgroundImage:
                          "linear-gradient(180deg, #fef3c7 0%, #fde68a 30%, #fbbf24 65%, #d97706 100%)",
                        filter: "drop-shadow(0 2px 12px rgba(251, 191, 36, 0.35))",
                      }}
                    >
                      {platinum.priceMain}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-amber-100/60">
                    {t("pricing.platNoSub")}
                  </p>
                </div>

                <Link
                  href={checkoutHref("platinum")}
                  className="btn-primary inline-flex w-full justify-center sm:w-auto"
                  style={{
                    background:
                      "linear-gradient(180deg, #fcd34d, #d97706)",
                    color: "#05130b",
                    boxShadow:
                      "0 0 0 1px rgba(255, 255, 255, 0.12) inset, 0 8px 28px rgba(251, 191, 36, 0.4)",
                  }}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  {platinum.cta}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Trust row */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Pill>
            <Check className="h-3 w-3 text-[#4ade80]" strokeWidth={3} />
            {t("pricing.trust1")}
          </Pill>
          <Pill>
            <Check className="h-3 w-3 text-[#4ade80]" strokeWidth={3} />
            {t("pricing.trust2")}
          </Pill>
          <Pill>
            <Check className="h-3 w-3 text-[#4ade80]" strokeWidth={3} />
            {t("pricing.trust3")}
          </Pill>
        </div>
      </div>
    </section>
  );
}
