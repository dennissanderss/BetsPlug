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
          "Get our top 3 value picks each morning, hand-picked and graded by our models.",
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
          "A clean summary of last week's ROI, hit rate and best segments — straight to your inbox.",
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
          "Track your profit curve, bankroll and per-league performance with pro-grade analytics.",
      },
      {
        icon: ShieldCheck,
        title: "Value alerts",
        body:
          "Get notified the moment a pick with +EV drops so you can lock in the best odds.",
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
          "Our highest-confidence plays — smaller list, bigger edge. Every pick is model-backed.",
      },
      {
        icon: LayoutDashboard,
        title: "Full analytics suite",
        body:
          "Deep calibration, segment ROI, bankroll planning and backtests. No feature locked.",
      },
      {
        icon: Zap,
        title: "Priority support",
        body:
          "Direct line to the team, plus early access to new models and betting tools.",
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
          "Telegram alerts, Tip of the Day, premium reports — nothing to upgrade, ever.",
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
    <Suspense fallback={<div className="min-h-screen bg-[#060912]" />}>
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
    <div className="relative min-h-screen overflow-x-hidden bg-[#060912] text-white">
      {/* ── Ambient background ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-40 h-[500px] w-[500px] rounded-full bg-green-500/[0.08] blur-[160px]" />
        <div className="absolute -right-40 bottom-40 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.06] blur-[160px]" />
        <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-green-500/[0.05] blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(74,222,128,0.6) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
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

      <main className="relative z-10 pt-36 pb-20 sm:pt-44">
        {/* ── Hero ── */}
        <section className="mx-auto max-w-5xl px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/[0.08] px-4 py-2 backdrop-blur-sm"
          >
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-green-300">
              {isTrial ? "Trial started" : "Payment confirmed"}
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto max-w-4xl text-balance break-words text-[2rem] font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl"
          >
            Welcome to BetsPlug{" "}
            <span
              className={`bg-gradient-to-br ${planCopy.accent} bg-clip-text text-transparent`}
            >
              {headlineSuffix}!
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-slate-400 sm:text-lg"
          >
            Your subscription is set up. Here&apos;s everything you just
            unlocked — and where to head next.
          </motion.p>

          {/* Plan badge card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-10 max-w-xl"
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-5 backdrop-blur-xl">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-green-500/[0.1] blur-[60px]" />
              <div className="relative flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${planCopy.accent} shadow-lg shadow-black/30 ring-1 ring-white/20`}
                >
                  <PlanIcon className="h-5 w-5 text-[#060912]" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-green-300">
                    Active plan
                  </p>
                  <p className="truncate text-lg font-extrabold text-white">
                    {planCopy.label}
                  </p>
                </div>
                {activated ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/[0.12] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-green-300">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/[0.1] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Activating
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href={loc("/dashboard")}
              className="btn-gradient group inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-extrabold tracking-tight shadow-lg shadow-green-500/30 transition-all hover:shadow-green-500/50 sm:w-auto sm:text-base"
            >
              <LayoutDashboard className="h-4 w-4" />
              Go to Dashboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href={loc("/subscription")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-6 py-4 text-sm font-semibold text-slate-300 backdrop-blur-sm transition-all hover:border-white/[0.25] hover:bg-white/[0.06] hover:text-white sm:w-auto"
            >
              View my subscription
            </Link>
          </motion.div>

          {/* Email hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 inline-flex items-center gap-2 text-xs text-slate-500"
          >
            <Mail className="h-3.5 w-3.5 text-green-400/70" />
            Receipt and account details are on their way to your inbox.
          </motion.p>
        </section>

        {/* ── Plan features ── */}
        <section className="mx-auto mt-24 max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mb-10 text-center"
          >
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/[0.08] px-3 py-1.5 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-green-400" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-green-300">
                What you unlocked
              </span>
            </div>
            <h2 className="mx-auto max-w-3xl text-balance text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl md:text-4xl">
              Your {planCopy.label} benefits are live
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {planCopy.features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-sm transition-all hover:border-green-500/25 hover:bg-white/[0.04]"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-green-500/[0.06] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/[0.08]">
                      <Icon className="h-5 w-5 text-green-400" />
                    </div>
                    <h3 className="mb-2 text-base font-bold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-400">
                      {feature.body}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── Verification status ── */}
        <section className="mx-auto mt-20 max-w-2xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center backdrop-blur-sm"
          >
            {activated ? (
              <div className="flex items-center justify-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <p className="text-sm font-semibold text-slate-200">
                  Your subscription is fully activated. Enjoy!
                </p>
              </div>
            ) : pollTimedOut ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-amber-300">
                  Your payment was received — activation may take a few
                  more minutes.
                </p>
                <p className="text-xs text-slate-500">
                  Check your email for the receipt. If you don&apos;t see
                  the subscription in your dashboard shortly, please
                  contact support.
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-green-400" />
                <p className="text-sm font-medium text-slate-400">
                  Finalizing your subscription…
                </p>
              </div>
            )}
            {sessionId && (
              <p className="mt-3 font-mono text-[10px] text-slate-600">
                ref: {sessionId.slice(0, 24)}…
              </p>
            )}
          </motion.div>
        </section>

        {/* ── Bottom trust strip ── */}
        <section className="mx-auto mt-16 max-w-3xl px-6 text-center">
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-green-400/70" />
            SSL-encrypted · 14-day money-back guarantee · Cancel any time
          </p>
        </section>
      </main>

      <BetsPlugFooter />
    </div>
  );
}
