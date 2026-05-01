"use client";

/**
 * UpgradeNudgeCard — prominent "next step" trigger on the dashboard.
 *
 * Shows a tier-accented card nudging Free or Silver users to upgrade
 * to the next tier. Gold and Platinum users see nothing — Gold is
 * the conversion ceiling we care about and Platinum is already top
 * of the funnel; both should not be pestered.
 *
 * Dismissible: a × close button writes the current timestamp to
 * localStorage; the banner stays hidden for the cooldown window
 * defined in `lib/upsell-banner.ts` (3 days by default). Reappears
 * automatically once the window passes.
 *
 * SSR-safe: the dismissed-state check runs in a useEffect after
 * mount so the server-rendered HTML doesn't include any localStorage
 * state and we avoid hydration mismatch warnings on first render.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Crown, Sparkles, X } from "lucide-react";
import { useTier, type Tier } from "@/hooks/use-tier";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { isUpsellDismissed, dismissUpsell } from "@/lib/upsell-banner";

/** Tiers we still nudge to upgrade. Per spec the banner must NEVER
 *  show for Gold or Platinum users — Gold is our conversion ceiling
 *  and Platinum is already the top tier. */
type NudgeableTier = Exclude<Tier, "gold" | "platinum">;

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

const STEPS: Record<NudgeableTier, TierStep> = {
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
  // The "gold → platinum" step that previously lived here was
  // removed deliberately: per the latest dashboard cleanup brief,
  // Gold users are not nudged toward Platinum from this surface.
};

export function UpgradeNudgeCard() {
  const { tier, ready } = useTier();
  const loc = useLocalizedHref();
  const { t } = useTranslations();

  // Mounted flag guards localStorage reads in dismissed-state. The
  // server can't read localStorage, so we render `null` on first
  // paint and only flip `mounted=true` after hydration. This avoids
  // a hydration mismatch where the server says "show" but the client
  // says "user dismissed" (or vice-versa) on the same DOM node.
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    setDismissed(isUpsellDismissed());
    setMounted(true);
  }, []);

  // Hydration safety: render nothing until tier is known AND we're
  // past first paint, so localStorage reads can't desync the DOM.
  if (!ready || !mounted) return null;
  // Gold and Platinum users are never nudged from this surface.
  if (tier === "gold" || tier === "platinum") return null;
  // User clicked × within the cooldown window.
  if (dismissed) return null;

  const step = STEPS[tier];
  const pricingHref = "https://betsplug.com/pricing";

  const handleDismiss = () => {
    dismissUpsell();
    setDismissed(true);
  };

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

      {/* Dismiss button — sits on top of the absolute hairline + the
          gradient wash. Subtle by default, fades to full opacity on
          hover. The cooldown logic in lib/upsell-banner.ts decides
          when the banner is allowed to come back. */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t("upgradeNudge.dismiss")}
        className="absolute right-3 top-3 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 opacity-60 transition-all hover:bg-white/[0.06] hover:text-white hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.4} />
      </button>

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
