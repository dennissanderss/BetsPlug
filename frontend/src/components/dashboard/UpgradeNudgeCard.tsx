"use client";

/**
 * UpgradeNudgeCard — prominent "next step" trigger on the dashboard.
 *
 * Shows a big, tier-accented card nudging the user to the NEXT tier
 * above their current one. Free → Silver, Silver → Gold, Gold →
 * Platinum. Platinum users see nothing (they're already at the top).
 *
 * Lives next to (not instead of) the existing TierPerformanceCard,
 * which acts as the transparency widget. The nudge card is the call
 * to action.
 */

import Link from "next/link";
import { ArrowRight, Crown, Sparkles } from "lucide-react";
import { useTier, type Tier } from "@/hooks/use-tier";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

type UpgradableTier = Exclude<Tier, "platinum">;

/** Static tier-step data: tier names + numeric accuracy thresholds +
 *  visual accent classes. Copy (benefit bullets, headings) lives in
 *  `messages.ts` so every locale gets a real translation through the
 *  dictionary instead of an `isNl ? "X" : "Y"` ternary that ships
 *  English to non-NL locales. */
interface TierStep {
  current: Tier;
  next: Exclude<Tier, "free">;
  currentAccuracy: string;
  nextAccuracy: string;
  nextLabel: string;
  /** Benefit-bullet message-keys (3 per tier). */
  benefitKeys: readonly [string, string, string];
  accent: {
    gradient: string;
    border: string;
    glow: string;
    ring: string;
    btn: string;
    text: string;
  };
}

const STEPS: Record<UpgradableTier, TierStep> = {
  free: {
    current: "free",
    next: "silver",
    currentAccuracy: "45%+",
    nextAccuracy: "60%+",
    nextLabel: "Silver",
    benefitKeys: [
      "upgradeNudge.free.b1",
      "upgradeNudge.free.b2",
      "upgradeNudge.free.b3",
    ] as const,
    accent: {
      gradient: "from-slate-200/20 via-slate-200/10 to-transparent",
      border: "border-slate-300/30",
      glow: "shadow-[0_0_48px_rgba(203,213,225,0.12)]",
      ring: "ring-slate-300/40",
      btn: "bg-gradient-to-r from-slate-100 via-slate-200 to-slate-300 text-slate-900",
      text: "text-slate-100",
    },
  },
  silver: {
    current: "silver",
    next: "gold",
    currentAccuracy: "60%+",
    nextAccuracy: "70%+",
    nextLabel: "Gold",
    benefitKeys: [
      "upgradeNudge.silver.b1",
      "upgradeNudge.silver.b2",
      "upgradeNudge.silver.b3",
    ] as const,
    accent: {
      gradient: "from-amber-500/25 via-amber-500/10 to-transparent",
      border: "border-amber-400/40",
      glow: "shadow-[0_0_48px_rgba(251,191,36,0.18)]",
      ring: "ring-amber-300/40",
      btn: "bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-[#1a1408]",
      text: "text-amber-100",
    },
  },
  gold: {
    current: "gold",
    next: "platinum",
    currentAccuracy: "70%+",
    nextAccuracy: "80%+",
    nextLabel: "Platinum",
    benefitKeys: [
      "upgradeNudge.gold.b1",
      "upgradeNudge.gold.b2",
      "upgradeNudge.gold.b3",
    ] as const,
    accent: {
      gradient: "from-emerald-500/25 via-cyan-400/10 to-transparent",
      border: "border-emerald-400/40",
      glow: "shadow-[0_0_48px_rgba(74,222,128,0.18)]",
      ring: "ring-emerald-300/40",
      btn: "bg-gradient-to-r from-emerald-300 via-cyan-300 to-emerald-400 text-[#062019]",
      text: "text-emerald-100",
    },
  },
};

export function UpgradeNudgeCard() {
  const { tier, ready } = useTier();
  const loc = useLocalizedHref();
  const { t } = useTranslations();

  // Hydration safety: render nothing until tier is known.
  if (!ready) return null;
  // Top-tier users don't need an upsell.
  if (tier === "platinum") return null;

  const step = STEPS[tier];
  const pricingHref = loc("/pricing");

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${step.accent.border} bg-[#080b14] ${step.accent.glow}`}
    >
      {/* Ambient gradient wash */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${step.accent.gradient}`}
      />
      {/* Top hairline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        {/* Crown emblem */}
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0e1320] ring-2 ${step.accent.ring}`}
        >
          <Crown className={`h-6 w-6 ${step.accent.text}`} strokeWidth={2.4} />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            <span className="rounded-md border border-white/[0.12] bg-white/[0.04] px-2 py-0.5 text-slate-300">
              {t("upgradeNudge.yourTier", {
                tier: step.current,
                accuracy: step.currentAccuracy,
              })}
            </span>
            <ArrowRight className="h-3 w-3 text-slate-500" />
            <span
              className={`rounded-md border px-2 py-0.5 ${step.accent.border} ${step.accent.text}`}
            >
              {t("upgradeNudge.nextTier", {
                tier: step.nextLabel,
                accuracy: step.nextAccuracy,
              })}
            </span>
          </div>
          <h3 className="text-lg font-extrabold text-white sm:text-xl">
            {t("upgradeNudge.heading", {
              tier: step.nextLabel,
              accuracy: step.nextAccuracy,
            })}
          </h3>
          <ul className="space-y-0.5 text-xs text-slate-300 sm:text-sm">
            {step.benefitKeys.map((key, i) => (
              <li key={i} className="flex items-start gap-2">
                <span
                  aria-hidden
                  className={`mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${step.accent.text.replace("text-", "bg-")}`}
                />
                <span className="leading-relaxed">
                  {t(key as "upgradeNudge.free.b1")}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Link
          href={pricingHref}
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-3 text-sm font-black tracking-tight transition-transform hover:scale-[1.03] ${step.accent.btn}`}
        >
          <Sparkles className="h-4 w-4" />
          {t("upgradeNudge.cta")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default UpgradeNudgeCard;
