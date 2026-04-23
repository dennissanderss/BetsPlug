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
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { HeroMediaBg } from "@/components/ui/media-bg";
import { PAGE_IMAGES } from "@/data/page-images";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { POTD_STATS } from "@/data/potd-stats";
import { PRICING_FAQS } from "./pricing-faqs";

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

/**
 * Per-tier elegant colour treatment for the pricing cards.
 *
 * Each tier gets the same "dark tinted background + subtle radial glow
 * + coloured accents" recipe that the Platinum card already used, but
 * in its signature colour:
 *
 *   Bronze   → metallic copper
 *   Silver   → metallic silver
 *   Gold     → metallic gold (was the old amber treatment)
 *   Platinum → icy diamond blue (top-tier crown)
 *
 * Values are pulled close to (not identical to) ``TIER_THEME`` so the
 * pricing surface can tune contrast for a dark background without
 * drifting visibly from the badges used elsewhere.
 */
interface TierTreatment {
  /** Dark tinted card background. */
  bg: string;
  /** Soft top-left radial glow used via backgroundImage. */
  glow: string;
  /** Border colour (low-opacity tier hue). */
  borderColor: string;
  /** Primary accent colour for price + CTA + icons. */
  accent: string;
  /** Lighter variant for headings. */
  accentLight: string;
  /** Muted tier hue for taglines. */
  accentMuted: string;
  /** Tinted glass panel background for "best for" block. */
  panelBg: string;
  /** Tinted glass panel border. */
  panelBorder: string;
  /** Multi-stop gradient used on the CTA button. */
  ctaGradient: string;
  /** Text colour for the CTA button (dark). */
  ctaText: string;
  /** Shadow colour under the CTA button. */
  ctaShadow: string;
}

const TIER_TREATMENT: Record<"bronze" | "silver" | "gold" | "platinum", TierTreatment> = {
  bronze: {
    bg: "#0d0704",
    glow: "radial-gradient(600px 300px at 0% 0%, rgba(232, 168, 100, 0.10), transparent 55%)",
    borderColor: "rgba(232, 168, 100, 0.30)",
    accent: "#e8a864",
    accentLight: "#f7d9b0",
    accentMuted: "rgba(232, 168, 100, 0.7)",
    panelBg: "rgba(232, 168, 100, 0.04)",
    panelBorder: "rgba(232, 168, 100, 0.22)",
    ctaGradient: "linear-gradient(135deg, #f7d9b0 0%, #e8a864 25%, #b87333 60%, #6d4115 100%)",
    ctaText: "#1a0e04",
    ctaShadow: "0 0 24px rgba(232, 168, 100, 0.35)",
  },
  silver: {
    bg: "#0a0b0d",
    glow: "radial-gradient(600px 300px at 0% 0%, rgba(229, 228, 226, 0.08), transparent 55%)",
    borderColor: "rgba(229, 228, 226, 0.28)",
    accent: "#d7d9dc",
    accentLight: "#f5f5f5",
    accentMuted: "rgba(229, 228, 226, 0.7)",
    panelBg: "rgba(229, 228, 226, 0.04)",
    panelBorder: "rgba(229, 228, 226, 0.20)",
    ctaGradient: "linear-gradient(135deg, #f5f5f5 0%, #d7d9dc 25%, #8a8d91 70%, #4a4d52 100%)",
    ctaText: "#0a0b0d",
    ctaShadow: "0 0 24px rgba(229, 228, 226, 0.30)",
  },
  gold: {
    bg: "#0f0a02",
    glow: "radial-gradient(600px 300px at 0% 0%, rgba(245, 214, 122, 0.12), transparent 55%)",
    borderColor: "rgba(245, 214, 122, 0.32)",
    accent: "#f5d67a",
    accentLight: "#fde68a",
    accentMuted: "rgba(245, 214, 122, 0.7)",
    panelBg: "rgba(245, 214, 122, 0.04)",
    panelBorder: "rgba(245, 214, 122, 0.25)",
    ctaGradient: "linear-gradient(135deg, #fef3c7 0%, #f5d67a 25%, #d4af37 55%, #8a6c0b 100%)",
    ctaText: "#1a1405",
    ctaShadow: "0 0 24px rgba(245, 214, 122, 0.38)",
  },
  platinum: {
    bg: "#020a0f",
    glow: "radial-gradient(600px 300px at 0% 0%, rgba(168, 216, 234, 0.10), transparent 55%)",
    borderColor: "rgba(168, 216, 234, 0.35)",
    accent: "#a8d8ea",
    accentLight: "#d9f0ff",
    accentMuted: "rgba(168, 216, 234, 0.7)",
    panelBg: "rgba(168, 216, 234, 0.04)",
    panelBorder: "rgba(168, 216, 234, 0.25)",
    ctaGradient: "linear-gradient(135deg, #d9f0ff 0%, #a8d8ea 25%, #5eb3d9 60%, #2a6f8f 100%)",
    ctaText: "#030a0f",
    ctaShadow: "0 0 24px rgba(168, 216, 234, 0.38)",
  },
};

export function PricingContent({ pricingConfig }: PricingContentProps) {
  const loc = useLocalizedHref();
  const { t } = useTranslations();

  // All strings are i18n'd via pricingDeep.* keys (EN + NL). See
  // src/i18n/messages.ts for the full set.
  const plans: PlanDetail[] = [
    {
      id: "bronze",
      icon: Shield,
      name: "Bronze",
      tagline: t("pricingDeep.bronzeTagline" as any),
      bestFor: t("pricingDeep.bronzeBestFor" as any),
      price: "€0,01",
      period: t("pricingDeep.period.7days" as any),
      includes: [
        t("pricingDeep.bronzeInc1" as any),
        t("pricingDeep.bronzeInc2" as any),
        t("pricingDeep.bronzeInc3" as any),
        t("pricingDeep.bronzeInc4" as any),
        t("pricingDeep.bronzeInc5" as any),
        t("pricingDeep.bronzeInc6" as any),
      ],
      notIncluded: [
        t("pricingDeep.bronzeOut1" as any),
        t("pricingDeep.bronzeOut2" as any),
        t("pricingDeep.bronzeOut3" as any),
      ],
      variant: "blue",
      cta: t("pricingDeep.bronzeCta" as any),
      ctaHref: (l) => `${l("/checkout")}?plan=bronze`,
    },
    {
      id: "silver",
      icon: Zap,
      name: "Silver",
      tagline: t("pricingDeep.silverTagline" as any),
      bestFor: t("pricingDeep.silverBestFor" as any),
      price: "€9,99",
      period: t("pricingDeep.period.month" as any),
      includes: [
        t("pricingDeep.silverInc1" as any),
        t("pricingDeep.silverInc2" as any),
        t("pricingDeep.silverInc3" as any),
        t("pricingDeep.silverInc4" as any),
        t("pricingDeep.silverInc5" as any),
        t("pricingDeep.silverInc6" as any),
        t("pricingDeep.silverInc7" as any),
      ],
      notIncluded: [
        t("pricingDeep.silverOut1" as any),
        t("pricingDeep.silverOut2" as any),
        t("pricingDeep.silverOut3" as any),
        t("pricingDeep.silverOut4" as any),
        t("pricingDeep.silverOut5" as any),
      ],
      variant: "purple",
      cta: t("pricingDeep.silverCta" as any),
      ctaHref: (l) => `${l("/checkout")}?plan=silver`,
    },
    {
      id: "gold",
      icon: Star,
      name: "Gold",
      tagline: t("pricingDeep.goldTagline" as any),
      bestFor: t("pricingDeep.goldBestFor" as any),
      price: "€14,99",
      period: t("pricingDeep.period.month" as any),
      includes: [
        t("pricingDeep.goldInc1" as any),
        t("pricingDeep.goldInc2" as any),
        t("pricingDeep.goldInc3" as any),
        t("pricingDeep.goldInc4" as any),
        t("pricingDeep.goldInc5" as any),
        t("pricingDeep.goldInc6" as any),
        t("pricingDeep.goldInc7" as any),
        t("pricingDeep.goldInc8" as any),
      ],
      notIncluded: [
        t("pricingDeep.goldOut1" as any),
        t("pricingDeep.goldOut2" as any),
        t("pricingDeep.goldOut3" as any),
      ],
      variant: "green",
      popular: true,
      cta: t("pricingDeep.goldCta" as any),
      ctaHref: (l) => `${l("/checkout")}?plan=gold`,
    },
    {
      id: "platinum",
      icon: Crown,
      name: "Platinum lifetime",
      tagline: t("pricingDeep.platinumTagline" as any),
      bestFor: t("pricingDeep.platinumBestFor" as any),
      price: "€199",
      period: t("pricingDeep.period.oneTime" as any),
      includes: [
        t("pricingDeep.platinumInc1" as any),
        t("pricingDeep.platinumInc2" as any),
        t("pricingDeep.platinumInc3" as any),
        t("pricingDeep.platinumInc4" as any),
        t("pricingDeep.platinumInc5" as any),
        t("pricingDeep.platinumInc6" as any),
        t("pricingDeep.platinumInc7" as any),
        t("pricingDeep.platinumInc8" as any),
      ],
      notIncluded: [],
      variant: "amber",
      lifetime: true,
      cta: t("pricingDeep.platinumCta" as any),
      ctaHref: (l) => `${l("/checkout")}?plan=platinum`,
    },
  ];

  const trialStr = t("pricingDeep.compare.trial" as any);
  const goldVsOthers = [
    { label: t("pricingDeep.compare.row1" as any), bronze: trialStr, silver: true, gold: true, platinum: true },
    { label: t("pricingDeep.compare.row2" as any), bronze: trialStr, silver: true, gold: true, platinum: true },
    { label: t("pricingDeep.compare.row3" as any), bronze: trialStr, silver: false, gold: true, platinum: true },
    { label: t("pricingDeep.compare.row4" as any), bronze: false, silver: false, gold: false, platinum: true },
    { label: t("pricingDeep.compare.row5" as any), bronze: trialStr, silver: false, gold: true, platinum: true },
    { label: t("pricingDeep.compare.row6" as any), bronze: trialStr, silver: false, gold: true, platinum: true },
    { label: t("pricingDeep.compare.row7" as any), bronze: trialStr, silver: false, gold: true, platinum: true },
    { label: t("pricingDeep.compare.row8" as any), bronze: false, silver: false, gold: true, platinum: true },
    { label: t("pricingDeep.compare.row9" as any), bronze: false, silver: false, gold: false, platinum: true },
    { label: t("pricingDeep.compare.row10" as any), bronze: false, silver: false, gold: false, platinum: true },
    { label: t("pricingDeep.compare.row11" as any), bronze: false, silver: false, gold: false, platinum: true },
  ];

  const goldReasons = [
    {
      icon: TrendingUp,
      title: t("pricingDeep.goldReason1.title" as any),
      desc: t("pricingDeep.goldReason1.desc" as any),
    },
    {
      icon: Sparkles,
      title: t("pricingDeep.goldReason2.title" as any),
      desc: t("pricingDeep.goldReason2.desc" as any),
    },
    {
      icon: Shield,
      title: t("pricingDeep.goldReason3.title" as any),
      desc: t("pricingDeep.goldReason3.desc" as any),
    },
  ];

  const platinumReasons = [
    {
      icon: Crown,
      title: t("pricingDeep.platinumReason1.title" as any),
      desc: t("pricingDeep.platinumReason1.desc" as any),
    },
    {
      icon: Lock,
      title: t("pricingDeep.platinumReason2.title" as any),
      desc: t("pricingDeep.platinumReason2.desc" as any),
    },
    {
      icon: Star,
      title: t("pricingDeep.platinumReason3.title" as any),
      desc: t("pricingDeep.platinumReason3.desc" as any),
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
      <section className="relative overflow-hidden pt-24 pb-8 md:pt-28 md:pb-10">
        <HeroMediaBg src={PAGE_IMAGES.pricing.hero} alt="" />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-16 h-[320px] w-[700px] -translate-x-1/2 rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.12)", filter: "blur(140px)" }}
        />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            aria-label="Breadcrumb"
            className="mb-5 flex items-center justify-center gap-2 text-xs text-[#6b7280]"
          >
            <Link href={loc("/")} className="transition-colors hover:text-[#4ade80]">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#a3a9b8]">Pricing</span>
          </motion.nav>

          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="section-label mb-4 inline-flex items-center gap-2"
          >
            <Sparkles className="h-3 w-3" />
            {t("pricingDeep.hero.label" as any)}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl"
          >
            {t("pricingDeep.hero.titleA" as any)}{" "}
            <span className="gradient-text-green">
              {t("pricingDeep.hero.titleB" as any)}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#a3a9b8]"
          >
            {t("pricingDeep.hero.subtitle" as any)}
          </motion.p>

          {/* Risk-reversal trust bar */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#a3a9b8]"
          >
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#4ade80]" />
              {t("pricingDeep.trust1" as any)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#4ade80]" />
              {t("pricingDeep.trust2" as any)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#4ade80]" />
              {t("pricingDeep.trust3" as any)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#4ade80]" />
              {t("pricingDeep.trust4" as any)}
            </span>
          </motion.div>
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
              <Sparkles className="h-3 w-3" /> {t("pricingDeep.sectionLabel" as any)}
            </span>
            <h2 className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              {t("pricingDeep.sectionHeadingA" as any)}{" "}
              <span className="gradient-text-green">
                {t("pricingDeep.sectionHeadingB" as any)}
              </span>
            </h2>
            <p className="mt-4 max-w-2xl text-base text-[#a3a9b8]">
              {t("pricingDeep.sectionIntro" as any)}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const tt = TIER_TREATMENT[plan.id];
              return (
                <div
                  key={plan.id}
                  className="card-neon p-7 sm:p-8"
                  style={{
                    background: tt.bg,
                    borderColor: tt.borderColor,
                  }}
                >
                  <div className="relative">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -inset-1"
                      style={{ backgroundImage: tt.glow }}
                    />
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <HexBadge
                          variant={plan.variant as "green" | "purple" | "blue" | "amber"}
                          size="md"
                        >
                          <Icon className="h-5 w-5" strokeWidth={2} />
                        </HexBadge>
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: tt.accent }}
                        >
                          {t("pricingDeep.planPrefix" as any)} {plan.name}
                        </span>
                      </div>
                      {plan.popular && (
                        <Pill tone="active" className="gap-1 text-[10px]">
                          <Star className="h-3 w-3" />
                          {t("pricingDeep.pillPopular" as any)}
                        </Pill>
                      )}
                      {plan.lifetime && (
                        <Pill
                          tone="default"
                          className="gap-1 text-[10px]"
                          style={{
                            borderColor: tt.borderColor,
                            backgroundColor: tt.panelBg,
                            color: tt.accent,
                          }}
                        >
                          <Crown className="h-3 w-3" />
                          {t("pricingDeep.pillLifetime" as any)}
                        </Pill>
                      )}
                    </div>

                    <h3
                      className="text-display mt-5 break-words text-3xl sm:text-4xl"
                      style={{ color: tt.accentLight }}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className="mt-2 text-sm"
                      style={{ color: tt.accentMuted }}
                    >
                      {plan.tagline}
                    </p>

                    <div className="mt-5 flex items-baseline gap-2">
                      <span
                        className="text-stat text-4xl sm:text-5xl"
                        style={{ color: tt.accent }}
                      >
                        {plan.price}
                      </span>
                      <span className="text-xs text-[#6b7280]">/ {plan.period}</span>
                    </div>

                    <div
                      className="glass-panel mt-5 p-4"
                      style={{
                        borderColor: tt.panelBorder,
                        backgroundColor: tt.panelBg,
                      }}
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
                        style={{ color: tt.accent }}
                      >
                        {t("pricingDeep.included" as any)}
                      </p>
                      {plan.includes.map((item) => (
                        <div key={item} className="flex items-start gap-3 text-sm">
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 flex-shrink-0"
                            style={{ color: tt.accent }}
                            strokeWidth={2.5}
                          />
                          <span className="text-[#ededed]">{item}</span>
                        </div>
                      ))}
                    </div>

                    {plan.notIncluded.length > 0 && (
                      <div className="mt-5 space-y-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
                          {t("pricingDeep.notIncluded" as any)}
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
                      className="mt-8 inline-flex w-full items-center justify-center gap-2 sm:w-auto"
                      style={{
                        background: tt.ctaGradient,
                        color: tt.ctaText,
                        padding: "0.85rem 1.5rem",
                        borderRadius: "9999px",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        boxShadow: tt.ctaShadow,
                      }}
                    >
                      <Crown className={`h-4 w-4 ${plan.lifetime ? "" : "hidden"}`} />
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
              Green check = included. Grey cross = not in that plan. The 7-day trial
              rows show you exactly what Bronze unlocks during the trial period.
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
              If you bet more than once a week, or follow leagues outside the top-5,
              Gold pays for itself with a single well-timed pick. Here's what the
              extra €5/month actually gets you.
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
                clicks. Compare our AI football predictions with your own bets
                for a week, then decide — we'd rather you see results than trust words.
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

      {/* ═══ FAQ — objection handling + featured-snippet bait ═══
         Content lives in ./pricing-faqs.ts and is also emitted as
         FAQPage JSON-LD from page.tsx so Google can surface these
         as rich results. */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <span className="section-label mb-4">
              <Sparkles className="h-3 w-3" /> FAQ
            </span>
            <h2 className="text-heading text-balance break-words text-3xl text-[#ededed] sm:text-4xl">
              Pricing questions,{" "}
              <span className="gradient-text-green">answered.</span>
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {PRICING_FAQS.map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border p-5 transition-colors hover:border-white/[0.12]"
                style={{
                  borderColor: "hsl(0 0% 100% / 0.06)",
                  background: "hsl(230 16% 10% / 0.4)",
                }}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-sm font-semibold text-[#ededed] [&::-webkit-details-marker]:hidden">
                  <span>{faq.q}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#6b7280] transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[#a3a9b8]">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>

          <p className="mt-10 text-center text-xs text-[#6b7280]">
            Still stuck?{" "}
            <Link
              href={loc("/contact")}
              className="text-[#4ade80] transition-colors hover:text-[#86efac]"
            >
              Email support →
            </Link>
          </p>
        </div>
      </section>

      <BetsPlugFooter />
    </div>
  );
}

export default PricingContent;
