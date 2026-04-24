"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { Check, Crown, Sparkles, Zap, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { TierEmblem } from "@/components/noct/tier-emblem";
import type { TierKey } from "@/components/noct/tier-theme";
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
  /** Tier key for the authentic metallic emblem rendered on the card.
   *  Replaces the previous accent-hued HexBadge+icon combo, so Bronze
   *  shows copper, Silver metallic-silver, Gold metallic-gold and
   *  Platinum diamond-blue — matching every other tier surface on the
   *  site (tier-ladder, dashboard, trackrecord). */
  tier: TierKey;
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

/**
 * Per-tier shiny treatment for the homepage pricing cards.
 *
 * Gives Bronze/Silver/Gold the same elegant "tinted gradient
 * background + ambient coloured glow blobs + accent ring" recipe
 * that the Platinum Lifetime card uses further down the page, but
 * in each tier's signature metallic colour.
 */
interface HomeTierTreatment {
  bg: string;
  glowA: string;
  glowB: string;
  borderColor: string;
  innerShadow: string;
  checkColor: string;
  checkDrop: string;
}

const HOME_TIER_TREATMENT: Record<TierKey, HomeTierTreatment> = {
  bronze: {
    bg: "linear-gradient(135deg, hsl(26 55% 10%) 0%, hsl(22 45% 6%) 50%, hsl(28 55% 9%) 100%)",
    glowA: "bg-[#e8a864]/[0.14]",
    glowB: "bg-[#b87333]/[0.10]",
    borderColor: "rgba(232, 168, 100, 0.28)",
    innerShadow:
      "0 20px 50px -15px rgba(232, 168, 100, 0.30), 0 0 0 1px rgba(232, 168, 100, 0.18) inset",
    checkColor: "#e8a864",
    checkDrop: "drop-shadow(0 0 6px rgba(232, 168, 100, 0.55))",
  },
  silver: {
    bg: "linear-gradient(135deg, hsl(220 8% 12%) 0%, hsl(220 6% 7%) 50%, hsl(220 8% 11%) 100%)",
    glowA: "bg-[#e5e4e2]/[0.10]",
    glowB: "bg-[#8a8d91]/[0.08]",
    borderColor: "rgba(229, 228, 226, 0.26)",
    innerShadow:
      "0 20px 50px -15px rgba(229, 228, 226, 0.22), 0 0 0 1px rgba(229, 228, 226, 0.18) inset",
    checkColor: "#e5e4e2",
    checkDrop: "drop-shadow(0 0 6px rgba(229, 228, 226, 0.55))",
  },
  gold: {
    bg: "linear-gradient(135deg, hsl(42 60% 12%) 0%, hsl(38 55% 7%) 50%, hsl(42 60% 11%) 100%)",
    glowA: "bg-[#f5d67a]/[0.16]",
    glowB: "bg-[#b8860b]/[0.10]",
    borderColor: "rgba(245, 214, 122, 0.30)",
    innerShadow:
      "0 20px 50px -15px rgba(245, 214, 122, 0.35), 0 0 0 1px rgba(245, 214, 122, 0.20) inset",
    checkColor: "#f5d67a",
    checkDrop: "drop-shadow(0 0 6px rgba(245, 214, 122, 0.60))",
  },
  platinum: {
    bg: "linear-gradient(135deg, hsl(200 55% 14%) 0%, hsl(205 45% 9%) 50%, hsl(210 55% 12%) 100%)",
    glowA: "bg-sky-300/[0.16]",
    glowB: "bg-cyan-400/[0.12]",
    borderColor: "rgba(168, 216, 234, 0.30)",
    innerShadow:
      "0 20px 50px -15px rgba(94, 179, 217, 0.38), 0 0 0 1px rgba(217, 240, 255, 0.20) inset",
    checkColor: "#a8d8ea",
    checkDrop: "drop-shadow(0 0 6px rgba(168, 216, 234, 0.55))",
  },
};

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

  // Free Access is always €0 — Sanity CMS still carries the legacy
  // €0.01 trial value, which would otherwise surface as "€ 0,01 forever".
  // Hardcode the display so the promise on the site can't drift.
  const bronzePrice = { main: "0", cents: "00" };
  const silverMonthly = silverSanity?.monthlyPrice != null ? splitPrice(silverSanity.monthlyPrice) : { main: "9", cents: "99" };
  const silverYearly = silverSanity?.yearlyPrice != null ? splitPrice(silverSanity.yearlyPrice) : { main: "7", cents: "99" };
  const goldMonthly = goldSanity?.monthlyPrice != null ? splitPrice(goldSanity.monthlyPrice) : { main: "14", cents: "99" };
  const goldYearly = goldSanity?.yearlyPrice != null ? splitPrice(goldSanity.yearlyPrice) : { main: "11", cents: "99" };
  const platPrice = platSanity?.oneTimePrice != null ? String(Math.floor(platSanity.oneTimePrice)) : "199";

  const plans: Plan[] = [
    {
      id: "bronze",
      name: "Free Access",
      icon: Shield,
      tier: "bronze",
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
      tier: "silver",
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
      highlight: true,
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
      tier: "gold",
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
            const tt = HOME_TIER_TREATMENT[plan.tier];
            return (
              <div
                key={plan.id}
                className={`card-neon relative flex flex-col p-8 ${
                  isHighlight ? "md:-translate-y-4" : ""
                }`}
                style={{
                  background: tt.bg,
                  borderColor: tt.borderColor,
                  boxShadow: tt.innerShadow,
                }}
              >
                {/* Most-chosen ribbon — big, centred, half-outside the card
                    top edge so it jumps out of the grid. Uses emerald
                    gradient so it reads as a primary-action accent
                    regardless of the Silver card's cooler palette. */}
                {isHighlight && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-white whitespace-nowrap"
                      style={{
                        background:
                          "linear-gradient(135deg, #10b981 0%, #34d399 50%, #10b981 100%)",
                        border: "1px solid rgba(134, 239, 172, 0.6)",
                        boxShadow:
                          "0 10px 30px -5px rgba(16, 185, 129, 0.55), 0 0 0 3px rgba(16, 185, 129, 0.15)",
                      }}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {t("pricing.mostChosen")}
                    </span>
                  </div>
                )}

                {/* Tier-coloured ambient glow blobs — top-right + bottom-left */}
                <div
                  className={`pointer-events-none absolute -right-20 -top-20 h-[320px] w-[320px] rounded-full blur-[120px] ${tt.glowA}`}
                />
                <div
                  className={`pointer-events-none absolute -left-24 -bottom-24 h-[280px] w-[280px] rounded-full blur-[120px] ${tt.glowB}`}
                />

                <div className="relative flex flex-1 flex-col">

                  {/* Plan icon — TierEmblem renders the Roman numeral
                      in the authentic metallic tier colour (bronze =
                      copper, silver = metallic, gold = metallic gold,
                      platinum = diamond blue). Previously a generic
                      HexBadge in the card's accent variant (blue /
                      purple / green) was shown, which made Bronze
                      render blue, Silver purple and Gold green —
                      inconsistent with every other tier surface on
                      the site (tier-ladder, dashboard, trackrecord)
                      and confusing to visitors trying to learn which
                      colour means which tier. */}
                  <div className="mb-5">
                    <TierEmblem tier={plan.tier} size="md" />
                  </div>

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
                          className="mt-0.5 h-4 w-4 flex-shrink-0"
                          strokeWidth={3}
                          style={{
                            color: tt.checkColor,
                            filter: tt.checkDrop,
                          }}
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

        {/* Platinum lifetime card — recoloured from amber/gold to
            diamond-blue so the background palette matches the TierEmblem
            (Roman IV, icy blue) rendered in its top-left and every other
            Platinum surface across the site. The previous amber gradient
            was a hold-over from an earlier design that used Crown/gold
            as the Platinum visual language; now both signals agree. */}
        <div
          className="card-neon relative mt-10 overflow-hidden"
          style={{
            boxShadow:
              "0 20px 50px -15px rgba(94, 179, 217, 0.38), 0 0 0 1px rgba(217, 240, 255, 0.2) inset",
          }}
        >
          <div
            className="relative p-8 md:p-10"
            style={{
              background:
                "linear-gradient(135deg, hsl(200 55% 14%) 0%, hsl(205 45% 9%) 50%, hsl(210 55% 12%) 100%)",
            }}
          >
            {/* Ambient diamond-blue blobs */}
            <div className="pointer-events-none absolute -right-32 -top-32 h-[460px] w-[460px] rounded-full bg-sky-300/[0.16] blur-[140px]" />
            <div className="pointer-events-none absolute -left-32 -bottom-32 h-[440px] w-[440px] rounded-full bg-cyan-400/[0.12] blur-[140px]" />

            <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
              {/* Left */}
              <div>
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  {/* Platinum Lifetime emblem — diamond-blue Roman IV.
                      The old render combined a green HexBadge with a
                      Crown icon on an amber background, giving the
                      card three conflicting tier colours at once and
                      visually clashing with Platinum's diamond-blue
                      identity used everywhere else on the site. */}
                  <TierEmblem tier="platinum" size="md" />
                  <span
                    className="section-label"
                    style={{
                      color: "#d9f0ff",
                      borderColor: "rgba(168, 216, 234, 0.35)",
                      background: "rgba(168, 216, 234, 0.08)",
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
                        "linear-gradient(135deg, #e0f4ff 0%, #a8d8ea 40%, #5eb3d9 70%, #d9f0ff 100%)",
                    }}
                  >
                    Platinum
                  </span>{" "}
                  Lifetime
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-sky-100/80 sm:text-base">
                  {platinum.tagline} {t("pricing.platPitch")}
                </p>

                <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {platinum.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm text-sky-50/90"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-200 drop-shadow-[0_0_6px_rgba(168,216,234,0.55)]"
                        strokeWidth={3}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <p className="mt-4 text-[10px] leading-relaxed text-sky-100/60">
                  {t("pricing.dataProvenanceFooter")}
                </p>
              </div>

              {/* Right */}
              <div className="flex flex-col items-start gap-5 lg:items-end lg:text-right">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-sky-200">
                    {t("pricing.platOneTime")}
                  </p>
                  <div className="mt-2 flex items-baseline gap-1 lg:justify-end">
                    <span className="text-xl font-bold text-sky-200/70">€</span>
                    <span
                      className="text-stat bg-clip-text text-6xl text-transparent sm:text-7xl"
                      style={{
                        backgroundImage:
                          "linear-gradient(180deg, #e0f4ff 0%, #a8d8ea 30%, #5eb3d9 65%, #38b2d9 100%)",
                        filter: "drop-shadow(0 2px 12px rgba(168, 216, 234, 0.4))",
                      }}
                    >
                      {platinum.priceMain}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-sky-100/60">
                    {t("pricing.platNoSub")}
                  </p>
                </div>

                <Link
                  href={checkoutHref("platinum")}
                  className="btn-primary inline-flex w-full justify-center sm:w-auto"
                  style={{
                    background:
                      "linear-gradient(180deg, #a8d8ea, #5eb3d9)",
                    color: "#05130b",
                    boxShadow:
                      "0 0 0 1px rgba(255, 255, 255, 0.15) inset, 0 8px 28px rgba(168, 216, 234, 0.45)",
                  }}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  {platinum.cta}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Trust row — the "14-day money-back guarantee" pill was
            dropped. The service is a probability model, not a
            deterministic product, so a "money-back if not satisfied"
            framing invites refund requests from users unhappy with
            individual match outcomes (which the product never
            promised). The statutory right of withdrawal under EU/NL
            consumer law is still honoured via the FAQ + contact
            flow, which is the correct place for a statutory right
            — not a marketing badge. */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
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
