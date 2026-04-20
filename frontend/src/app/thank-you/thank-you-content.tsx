"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  LayoutDashboard,
  Loader2,
  Mail,
  Rocket,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref } from "@/i18n/locale-provider";
import { api } from "@/lib/api";
import { HeroMediaBg, CtaMediaBg } from "@/components/ui/media-bg";
import { PAGE_IMAGES } from "@/data/page-images";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

/**
 * /thank-you — post-purchase landing page
 * ────────────────────────────────────────────────────────────
 * This is where Stripe redirects the user after a successful
 * payment. It does three things:
 *
 *   1. Celebrate — big headline, confetti, plan-specific feature
 *      cards that validate the user's decision.
 *   2. Verify — polls /subscriptions/me every 2 seconds until
 *      the webhook flips `has_subscription` to true. This covers
 *      the race between Stripe redirect and webhook delivery.
 *   3. Route — surfaces two clear CTAs (dashboard + subscription
 *      page) so the user has one obvious next step.
 *
 * Query params:
 *   plan        — bronze | silver | gold | platinum
 *   billing     — monthly | yearly
 *   trial       — "1" if the user started a 7-day trial
 *   session_id  — Stripe checkout session id (for support/debug)
 */

type PlanKey = "bronze" | "silver" | "gold" | "platinum";

type PlanFeature = {
  icon: typeof Sparkles;
  title: string;
  body: string;
};

type PlanFeatures = {
  label: string;
  accent: string;
  icon: typeof Sparkles;
  features: PlanFeature[];
};

/**
 * Hard-coded per-plan highlights. Kept here instead of the i18n
 * bundle because the thank-you page is post-purchase and we want
 * to celebrate the exact benefits the user just unlocked — the
 * copy should feel emotional and specific, not translated template.
 */
const PLAN_FEATURES: Record<PlanKey, PlanFeatures> = {
  bronze: {
    label: "Bronze",
    accent: "from-amber-400 via-orange-500 to-amber-600",
    icon: Shield,
    features: [
      {
        icon: Target,
        title: "Daily free picks",
        body:
          "Get our top 3 value picks each morning, hand-picked by our AI.",
      },
      {
        icon: Sparkles,
        title: "Community access",
        body:
          "Join thousands of members discussing picks and swapping insights in real time.",
      },
      {
        icon: Mail,
        title: "Weekly digest",
        body:
          "A clear summary of last week's results and best picks — straight to your inbox.",
      },
    ],
  },
  silver: {
    label: "Silver",
    accent: "from-slate-300 via-slate-100 to-slate-400",
    icon: Zap,
    features: [
      {
        icon: Rocket,
        title: "Full prediction feed",
        body:
          "Unlimited access to every tip, across every league — updated multiple times per day.",
      },
      {
        icon: LayoutDashboard,
        title: "ROI dashboard",
        body:
          "Track your profits, bankroll and results per league in one simple dashboard.",
      },
      {
        icon: ShieldCheck,
        title: "Value alerts",
        body:
          "Get notified the moment a high-value pick drops so you can grab the best odds.",
      },
    ],
  },
  gold: {
    label: "Gold",
    accent: "from-yellow-300 via-amber-400 to-yellow-600",
    icon: Sparkles,
    features: [
      {
        icon: Trophy,
        title: "Premium picks",
        body:
          "Our highest-confidence plays — smaller list, bigger edge. Every pick is backed by AI.",
      },
      {
        icon: LayoutDashboard,
        title: "Full analytics suite",
        body:
          "Full stats breakdown, profit tracking, bankroll planning and historical results. Nothing locked.",
      },
      {
        icon: Zap,
        title: "Priority support",
        body:
          "Direct line to the team, plus early access to new features and betting tools.",
      },
    ],
  },
  platinum: {
    label: "Platinum Lifetime",
    accent: "from-fuchsia-400 via-purple-500 to-indigo-600",
    icon: Crown,
    features: [
      {
        icon: Crown,
        title: "Lifetime access",
        body:
          "Pay once, win forever. Every current and future BetsPlug feature included, always.",
      },
      {
        icon: Rocket,
        title: "Every add-on included",
        body:
          "Telegram alerts, Pick of the Day, premium reports — nothing to upgrade, ever.",
      },
      {
        icon: Trophy,
        title: "Founding member perks",
        body:
          "Name on the wall of legends, private community channel and direct line to the founders.",
      },
    ],
  },
};

/** Sanity plan features (locale-resolved by the server). */
export interface SanityPlanFeature {
  planId: string;
  features: { title: string; body: string }[];
}

/* ── Page wrapper (Suspense boundary for useSearchParams) ── */

export default function ThankYouPage({
  sanityPlanFeatures,
}: {
  sanityPlanFeatures?: SanityPlanFeature[];
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ThankYouContent sanityPlanFeatures={sanityPlanFeatures} />
    </Suspense>
  );
}

/* ── Main content ────────────────────────────────────────── */

function ThankYouContent({
  sanityPlanFeatures,
}: {
  sanityPlanFeatures?: SanityPlanFeature[];
}) {
  const params = useSearchParams();
  const loc = useLocalizedHref();

  const planParamRaw = (params?.get("plan") ?? "gold").toLowerCase();
  const planKey: PlanKey = (["bronze", "silver", "gold", "platinum"].includes(
    planParamRaw
  )
    ? planParamRaw
    : "gold") as PlanKey;
  const billing = (params?.get("billing") ?? "monthly").toLowerCase();
  const isTrial = (params?.get("trial") ?? "0") === "1";
  const sessionId = params?.get("session_id") ?? null;

  // Merge Sanity features with hardcoded defaults
  const planCopy = useMemo(() => {
    const base = PLAN_FEATURES[planKey];
    if (!sanityPlanFeatures?.length) return base;

    const sanityPlan = sanityPlanFeatures.find(
      (p) => p.planId?.toLowerCase() === planKey
    );
    if (!sanityPlan?.features?.length) return base;

    // Map Sanity features, keeping the icons from the hardcoded defaults
    const mergedFeatures = sanityPlan.features.map((sf, i) => ({
      icon: base.features[i]?.icon ?? Sparkles,
      title: sf.title || base.features[i]?.title || "",
      body: sf.body || base.features[i]?.body || "",
    }));

    return { ...base, features: mergedFeatures };
  }, [planKey, sanityPlanFeatures]);

  const PlanIcon = planCopy.icon;

  // Confetti burst — CSS only. `canvas-confetti` isn't installed,
  // so we render a fixed layer of absolutely-positioned particles
  // that fade up and out over ~2.4s, then unmount. Matches the
  // existing welcome page burst so the brand feels consistent.
  const [burst, setBurst] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setBurst(false), 2400);
    return () => window.clearTimeout(t);
  }, []);

  /**
   * Subscription verification loop.
   *
   * After Stripe redirects the user here the webhook might not
   * have landed yet, so `/subscriptions/me` may still show
   * `has_subscription: false` for a few seconds. We poll every
   * 2 seconds up to 30 times (≈60s) and stop as soon as the
   * server confirms the subscription is live.
   */
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 30;

  const subQuery = useQuery({
    queryKey: ["my-subscription", "thank-you", planKey],
    queryFn: async () => {
      setAttempts((a) => a + 1);
      return api.getMySubscription();
    },
    refetchInterval: (query) => {
      const state = query.state.data;
      if (state?.has_subscription) return false;
      if (attempts >= MAX_ATTEMPTS) return false;
      return 2000;
    },
    // Stop refetching once activated — belt-and-braces with the
    // refetchInterval check above.
    enabled: attempts < MAX_ATTEMPTS,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const activated = subQuery.data?.has_subscription === true;
  const pollTimedOut = !activated && attempts >= MAX_ATTEMPTS;

  // Persist the tier so the existing paywall code in the rest of
  // the app (which checks localStorage.getItem("betsplug_tier"))
  // immediately starts unlocking premium views.
  useEffect(() => {
    if (!activated) return;
    try {
      // Bronze is effectively the "Silver" tier in the paywall
      // (free entry point); every other plan maps 1-to-1.
      const tierMap: Record<PlanKey, string> = {
        bronze: "silver",
        silver: "silver",
        gold: "gold",
        platinum: "platinum",
      };
      window.localStorage.setItem(
        "betsplug_tier",
        tierMap[planKey] ?? "gold"
      );
    } catch {
      // Private mode or storage disabled — silently ignore.
    }
  }, [activated, planKey]);

  const headlineSuffix = useMemo(() => {
    if (isTrial) return `${planCopy.label} trial`;
    if (billing === "yearly") return `${planCopy.label} (yearly)`;
    return planCopy.label;
  }, [isTrial, billing, planCopy.label]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-[#ededed]">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-40 h-[520px] w-[520px] rounded-full bg-[#4ade80]/[0.09] blur-[160px]" />
        <div className="absolute -right-40 bottom-40 h-[520px] w-[520px] rounded-full bg-[#a855f7]/[0.07] blur-[160px]" />
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[#4ade80]/[0.06] blur-[140px]" />
      </div>

      <SiteNav />

      {/* ── Confetti burst ── */}
      {burst && (
        <div
          className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
          aria-hidden
        >
          {Array.from({ length: 34 }).map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 0.5;
            const duration = 1.6 + Math.random() * 1.0;
            const size = 6 + Math.round(Math.random() * 7);
            const colors = [
              "#4ade80",
              "#22c55e",
              "#a7f3d0",
              "#facc15",
              "#ffffff",
              "#86efac",
            ];
            const color = colors[i % colors.length];
            return (
              <span
                key={i}
                className="absolute block rounded-sm"
                style={{
                  left: `${left}%`,
                  top: "55%",
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: color,
                  boxShadow: `0 0 14px ${color}`,
                  animation: `thankyou-burst ${duration}s ease-out ${delay}s forwards`,
                }}
              />
            );
          })}
          <style>{`
            @keyframes thankyou-burst {
              0%   { transform: translateY(0) rotate(0deg) scale(0.8); opacity: 0; }
              10%  { opacity: 1; }
              100% { transform: translateY(-75vh) rotate(720deg) scale(1); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      <main className="relative z-10">
        {/* Hero */}
        <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-24 text-center">
          <HeroMediaBg src={PAGE_IMAGES["thank-you"].hero} alt={PAGE_IMAGES["thank-you"].alt} />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-8 flex justify-center"
          >
            <HexBadge variant="green" size="xl">
              <CheckCircle2 className="h-10 w-10" />
            </HexBadge>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mb-5 flex items-center justify-center"
          >
            <span className="section-label">
              <CheckCircle2 className="h-3 w-3" />
              {isTrial ? "€0,01 trial charged · Welcome aboard" : "Payment confirmed · Welcome aboard"}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-display mx-auto max-w-4xl text-balance break-words text-[2rem] text-[#ededed] sm:text-5xl md:text-6xl"
          >
            The{" "}
            <span className="gradient-text-green">AI football predictions</span>
            {" "}are yours now — {headlineSuffix}.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-[#a3a9b8] sm:text-lg"
          >
            Your AI football predictions subscription is live across 30 leagues. Here&apos;s exactly what you just unlocked — and where to go first.
          </motion.p>

          {/* Plan badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-10 max-w-xl"
          >
            <div className="card-neon-green p-5">
              <div className="relative flex items-center gap-4">
                <HexBadge variant="green" size="md">
                  <PlanIcon className="h-5 w-5" />
                </HexBadge>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a93a6]">
                    Active plan
                  </p>
                  <p className="truncate text-lg font-bold text-[#ededed]">
                    {planCopy.label}
                  </p>
                </div>
                {activated ? (
                  <Pill tone="win">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </Pill>
                ) : (
                  <Pill tone="draw">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Activating
                  </Pill>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link href={loc("/dashboard")} className="btn-primary group w-full sm:w-auto">
              <LayoutDashboard className="h-4 w-4" />
              Go to Dashboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href={loc("/subscription")} className="btn-glass w-full sm:w-auto">
              View my subscription
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 inline-flex items-center gap-2 text-xs text-[#8a93a6]"
          >
            <Mail className="h-3.5 w-3.5 text-[#4ade80]/80" />
            Receipt and account details are on their way to your inbox.
          </motion.p>
          </div>
        </section>

        {/* Plan features */}
        <section className="relative py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mb-12 sm:mb-14 text-center"
          >
            <div className="flex justify-center">
              <span className="section-label">
                <Sparkles className="h-3.5 w-3.5" />
                What you unlocked
              </span>
            </div>
            <h2 className="text-display mt-4 text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
              Your {planCopy.label} benefits are live
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {planCopy.features.map((feature, i) => {
              const Icon = feature.icon;
              const variants = ["green", "purple", "blue"] as const;
              const variant = variants[i % variants.length];
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className={`card-neon-${variant} p-6 sm:p-8 transition-all hover:-translate-y-0.5`}
                >
                  <div className="relative">
                    <HexBadge variant={variant} size="md" className="mb-4">
                      <Icon className="h-5 w-5" />
                    </HexBadge>
                    <h3 className="text-heading mb-2 text-base text-[#ededed]">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#a3a9b8]">
                      {feature.body}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
          </div>
        </section>

        {/* Verification status */}
        <section className="relative py-12 md:py-16">
          <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="card-neon-purple p-5 text-center"
          >
            <div className="relative">
              {activated ? (
                <div className="flex items-center justify-center gap-3">
                  <HexBadge variant="green" size="sm" noGlow>
                    <CheckCircle2 className="h-4 w-4" />
                  </HexBadge>
                  <p className="text-sm font-semibold text-[#ededed]">
                    Your subscription is fully activated. Enjoy!
                  </p>
                </div>
              ) : pollTimedOut ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-amber-300">
                    Your payment was received — activation may take a few
                    more minutes.
                  </p>
                  <p className="text-xs text-[#a3a9b8]">
                    Check your email for the receipt. If you don&apos;t see
                    the subscription in your dashboard shortly, please
                    contact support.
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <HexBadge variant="purple" size="sm" noGlow>
                    <Mail className="h-4 w-4" />
                  </HexBadge>
                  <p className="text-sm font-medium text-[#a3a9b8]">
                    <Loader2 className="mr-1 inline h-3 w-3 animate-spin text-[#4ade80]" />
                    Finalizing your subscription…
                  </p>
                </div>
              )}
              {sessionId && (
                <p className="mt-3 font-mono text-[10px] text-[#8a93a6]">
                  ref: {sessionId.slice(0, 24)}…
                </p>
              )}
            </div>
          </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="card-neon-green halo-green overflow-hidden p-6 sm:p-10 md:p-16">
              <div className="relative">
                <CtaMediaBg
                  src={PAGE_IMAGES["thank-you"].cta}
                  alt={PAGE_IMAGES["thank-you"].alt}
                  pattern={PAGE_IMAGES["thank-you"].pattern}
                />
                <div className="relative text-center">
                  <h2 className="text-display text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                    Ready to place your first pick?
                  </h2>
                  <p className="mx-auto mt-4 max-w-xl text-base text-[#a3a9b8]">
                    Your dashboard is live. Check your first predictions now.
                  </p>
                  <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Link href={loc("/dashboard")} className="btn-primary group w-full sm:w-auto">
                      <LayoutDashboard className="h-4 w-4" />
                      Go to dashboard
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link href={loc("/subscription")} className="btn-glass w-full sm:w-auto">
                      View subscription
                    </Link>
                  </div>
                  <p className="mt-8 inline-flex flex-wrap items-center justify-center gap-2 text-center text-xs text-[#8a93a6]">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#4ade80]" />
                    SSL-encrypted · 14-day money-back · Cancel any time
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BetsPlugFooter />
    </div>
  );
}
