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

interface PricingSectionProps {
  /** Optional pricing config from Sanity pricingConfig singleton */
  pricingConfig?: any;
}

export function PricingSection({ pricingConfig }: PricingSectionProps = {}) {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
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

  // Charm pricing — Silver €9,99/mo (yearly 20% off €7,99/mo)
  // Gold €14,99/mo (yearly 20% off €11,99/mo)
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
    priceMain: platPrice,
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
      {/* ── Background ── */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-25" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[#4ade80]/[0.04] blur-[150px]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mb-14 max-w-3xl"
        >
          <span className="section-tag mb-6">[ PRICING / PLANS ]</span>
          <h2
            id="pricing-heading"
            className="text-display text-4xl text-white sm:text-5xl lg:text-6xl"
          >
            {t("pricing.title")}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#a3a3a3] sm:text-lg">
            {t("pricing.subtitle")}
          </p>
        </motion.div>

        {/* ── Billing toggle ───────────────────────────────────────
            Entrance animation dropped — the toggle is a purely
            interactive control and the section heading just above
            already handles the reveal. Removing this motion wrapper
            removes one more IntersectionObserver + reflow on scroll. */}
        <div className="mb-12 flex flex-col items-center gap-3">
          <div
            role="tablist"
            aria-label="Billing period"
            className="relative inline-flex items-center border border-white/[0.1] bg-[#0a0a0a] p-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={billing === "monthly"}
              onClick={() => setBilling("monthly")}
              className={`relative z-10 px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-colors duration-200 sm:px-8 ${
                billing === "monthly"
                  ? "bg-[#4ade80] text-[#050505]"
                  : "text-[#a3a3a3] hover:text-white"
              }`}
            >
              {t("pricing.monthly")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={billing === "yearly"}
              onClick={() => setBilling("yearly")}
              className={`relative z-10 flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-colors duration-200 sm:px-8 ${
                billing === "yearly"
                  ? "bg-[#4ade80] text-[#050505]"
                  : "text-[#a3a3a3] hover:text-white"
              }`}
            >
              {t("pricing.yearly")}
              <span
                className={`px-1.5 py-0.5 text-[9px] font-black tracking-widest ${
                  billing === "yearly"
                    ? "bg-[#050505] text-[#4ade80]"
                    : "bg-[#4ade80]/15 text-[#4ade80]"
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
                className="text-xs text-slate-500"
              >
                {t("pricing.savingNote")}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* 3-plan grid — individual card reveal animations dropped.
            Three cards fading in staggered was a ~300ms decorative
            delay with no UX value; the grid now just renders. */}
        <div className="grid gap-[1px] bg-white/[0.08] md:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isHighlight = plan.highlight;
            return (
              <div
                key={plan.id}
                className={`group relative flex flex-col p-8 transition-all duration-200 ${
                  isHighlight
                    ? "bg-[#4ade80] text-[#050505] md:-translate-y-2"
                    : "bg-[#0a0a0a] scanline hover:bg-[#111]"
                }`}
              >
                {/* Corner brackets */}
                {!isHighlight && (
                  <>
                    <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-[#4ade80]" />
                    <span className="pointer-events-none absolute right-0 bottom-0 h-3 w-3 border-r-2 border-b-2 border-[#4ade80]" />
                  </>
                )}

                {isHighlight && (
                  <span className="absolute right-4 top-4 bg-[#050505] px-2 py-1 font-mono text-[9px] font-black tracking-widest text-[#4ade80]">
                    ★ POPULAR
                  </span>
                )}

                {/* Plan tag */}
                <div className="mb-6 flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${isHighlight ? "text-[#050505]" : "text-[#4ade80]"}`} strokeWidth={2} />
                  <span className={`font-mono text-[10px] font-black uppercase tracking-widest ${isHighlight ? "text-[#050505]" : "text-[#4ade80]"}`}>
                    PLAN / {plan.name.toUpperCase()}
                  </span>
                </div>

                {/* Name */}
                <h3 className={`text-display text-3xl ${isHighlight ? "text-[#050505]" : "text-white"} sm:text-4xl`}>
                  {plan.name}
                </h3>
                <p className={`mt-2 text-sm ${isHighlight ? "text-[#050505]/75" : "text-[#a3a3a3]"}`}>
                  {plan.tagline}
                </p>

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
                            <span className={`text-lg font-bold ${isHighlight ? "text-[#050505]/70" : "text-[#707070]"}`}>
                              €
                            </span>
                            <span className={`text-stat text-5xl sm:text-6xl md:text-7xl ${isHighlight ? "text-[#050505]" : "text-white"}`}>
                              {price.main}
                            </span>
                            {price.cents && (
                              <span className={`mt-2 text-lg font-bold ${isHighlight ? "text-[#050505]/70" : "text-[#707070]"}`}>
                                ,{price.cents}
                              </span>
                            )}
                            <span className={`ml-2 text-xs uppercase tracking-wider ${isHighlight ? "text-[#050505]/75" : "text-[#707070]"}`}>
                              {price.period}
                            </span>
                          </div>
                          {price.footnote && (
                            <p className={`mt-2 text-xs ${isHighlight ? "text-[#050505]/70" : "text-[#707070]"}`}>
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
                  className={`relative mb-6 flex w-full items-center justify-center px-6 py-3.5 text-xs font-black uppercase tracking-widest transition-all duration-200 ${
                    isHighlight
                      ? "bg-[#050505] text-[#4ade80] hover:bg-[#1a1a1a]"
                      : "border border-[#4ade80] bg-transparent text-[#4ade80] hover:bg-[#4ade80] hover:text-[#050505]"
                  } ${loading === plan.id ? "opacity-50 cursor-wait" : ""}`}
                >
                  {loading === plan.id ? "Redirecting…" : `${plan.cta} →`}
                </button>

                {/* Features */}
                <ul className="relative flex flex-col gap-2.5">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-start gap-3 text-sm ${isHighlight ? "text-[#050505]/90" : "text-[#ededed]"}`}
                    >
                      <Check
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${isHighlight ? "text-[#050505]" : "text-[#4ade80]"}`}
                        strokeWidth={3}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* ── Platinum lifetime card (wide, below) ───────────────── */}
        <div
          className="relative mt-10 overflow-hidden p-8 md:p-10"
          style={{
            background:
              "radial-gradient(1200px 500px at 0% 0%, rgba(253, 224, 71, 0.08), transparent 55%), radial-gradient(900px 500px at 100% 100%, rgba(234, 179, 8, 0.07), transparent 55%), linear-gradient(135deg, #120c02 0%, #0a0602 35%, #050301 65%, #0a0602 100%)",
            border: "1px solid rgba(252, 211, 77, 0.4)",
            boxShadow:
              "0 0 0 1px rgba(252, 211, 77, 0.08) inset",
          }}
        >
          {/* Corner brackets — gold */}
          <span className="pointer-events-none absolute left-[-1px] top-[-1px] h-4 w-4 border-l-2 border-t-2 border-amber-300" />
          <span className="pointer-events-none absolute right-[-1px] top-[-1px] h-4 w-4 border-r-2 border-t-2 border-amber-300" />
          <span className="pointer-events-none absolute left-[-1px] bottom-[-1px] h-4 w-4 border-l-2 border-b-2 border-amber-300" />
          <span className="pointer-events-none absolute right-[-1px] bottom-[-1px] h-4 w-4 border-r-2 border-b-2 border-amber-300" />
          {/* Ambient gold glow */}
          <div className="pointer-events-none absolute -right-32 -top-32 h-[460px] w-[460px] rounded-full bg-amber-300/12 blur-[140px]" />
          <div className="pointer-events-none absolute -left-32 -bottom-32 h-[440px] w-[440px] rounded-full bg-yellow-500/10 blur-[140px]" />

          {/* Metallic brushed sheen — diagonal highlight band */}
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "linear-gradient(115deg, transparent 32%, rgba(253, 224, 71, 0.04) 47%, rgba(255, 239, 177, 0.07) 50%, rgba(253, 224, 71, 0.04) 53%, transparent 68%)",
            }}
          />

          {/* Diagonal shimmer lines */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(253, 224, 71, 0.35) 0 1px, transparent 1px 22px)",
            }}
          />

          {/* Top inner hairline for bevel */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(253, 224, 71, 0.6) 50%, transparent 100%)",
            }}
          />

          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            {/* Left: branding + features */}
            <div>
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 border border-amber-300/70 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-amber-300">
                  <Crown className="h-3 w-3" />
                  {t("pricing.platBadgeLifetime")}
                </span>
                <span className="border border-amber-300/30 bg-amber-300/5 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-amber-200/80">
                  {t("pricing.platLimited")}
                </span>
              </div>

              <h3 className="text-display text-4xl text-white sm:text-5xl lg:text-6xl">
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
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-amber-100/70 sm:text-base">
                {platinum.tagline} {t("pricing.platPitch")}
              </p>

              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {platinum.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-amber-50/85"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
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
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-amber-300">
                  {t("pricing.platOneTime")}
                </p>
                <div className="mt-2 flex items-baseline gap-1 lg:justify-end">
                  <span className="text-xl font-bold text-amber-200/70">€</span>
                  <span
                    className="text-stat bg-clip-text text-7xl sm:text-8xl text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(180deg, #fef3c7 0%, #fde68a 30%, #fbbf24 65%, #d97706 100%)",
                      filter: "drop-shadow(0 2px 12px rgba(251, 191, 36, 0.35))",
                    }}
                  >
                    199
                  </span>
                </div>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-amber-100/60">
                  {t("pricing.platNoSub")}
                </p>
              </div>

              <Link
                href={checkoutHref("platinum")}
                className="group/btn relative inline-flex w-full items-center justify-center overflow-hidden px-8 py-4 text-xs font-black uppercase tracking-widest text-[#1a1405] transition-all duration-200 sm:w-auto"
                style={{
                  background:
                    "linear-gradient(135deg, #fef3c7 0%, #fde68a 25%, #fbbf24 55%, #d97706 100%)",
                  border: "1px solid rgba(253, 224, 71, 0.9)",
                  boxShadow:
                    "0 0 0 1px rgba(255, 255, 255, 0.12) inset, 0 8px 28px rgba(251, 191, 36, 0.35)",
                }}
              >
                <Crown className="mr-2 h-4 w-4" />
                {platinum.cta}
              </Link>
            </div>
          </div>
        </div>

        {/* Trust row */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-green-600" strokeWidth={3} />
            <span>{t("pricing.trust1")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-green-600" strokeWidth={3} />
            <span>{t("pricing.trust2")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-green-600" strokeWidth={3} />
            <span>{t("pricing.trust3")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
