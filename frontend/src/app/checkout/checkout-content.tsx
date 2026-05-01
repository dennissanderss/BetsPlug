"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Crown,
  Flame,
  Gift,
  LogIn,
  Lock,
  Mail,
  PauseCircle,
  Shield,
  Sparkles,
  Tag,
  TrendingDown,
  User,
  UserPlus,
  MapPin,
  Wallet,
  ShieldCheck,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { CheckoutHeader } from "@/components/checkout/checkout-header";
import { CheckoutFooter } from "@/components/checkout/checkout-footer";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  VisaBadge,
  MastercardBadge,
  AmexBadge,
  PayPalBadge,
  ApplePayBadge,
} from "@/components/ui/payment-badges";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import type { TranslationKey } from "@/i18n/messages";
import {
  detectCountryCode,
  getOrderedCountries,
  POPULAR_COUNTRY_CODES,
} from "@/lib/countries";
import { HeroMediaBg } from "@/components/ui/media-bg";
import { trackTikTok, getPlanValueEur } from "@/lib/tiktok-pixel";

/* ── Abandoned checkout tracking ─────────────────────────────
   Fire-and-forget API calls that never block the checkout UX.
   If the backend is unreachable the checkout still works fine. */
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function trackCheckoutSession(data: {
  email: string;
  first_name: string | null;
  plan_id: string;
  billing_cycle: string;
  with_trial: boolean;
  locale: string | null;
}): Promise<{ session_id: string; recovery_token: string } | null> {
  try {
    const res = await fetch(`${API}/checkout-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) return res.json();
  } catch { /* silent */ }
  return null;
}

async function trackCheckoutStep(sessionId: string, step: number) {
  try {
    await fetch(`${API}/checkout-sessions/${sessionId}/step`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step }),
    });
  } catch { /* silent */ }
}

async function trackCheckoutComplete(sessionId: string) {
  try {
    await fetch(`${API}/checkout-sessions/${sessionId}/complete`, {
      method: "POST",
    });
  } catch { /* silent */ }
}

/* ── Plan catalog (mirrors pricing-section.tsx) ─────────────── */
type PlanId = "bronze" | "silver" | "gold" | "platinum";
type Billing = "monthly" | "yearly";

type PlanDef = {
  id: PlanId;
  name: string;
  tagline: TranslationKey;
  icon: typeof Shield;
  /** Monthly EUR price (yearly column gets 20% off) */
  monthly: number;
  /** Fixed-price one-time plans set this */
  oneTime?: number;
  featuresKey: TranslationKey[];
  highlight?: boolean;
};

/* ── Upsell catalog ─────────────────────────────────────────── */
type UpsellId = "telegram" | "tipOfDay";

type UpsellDef = {
  id: UpsellId;
  icon: typeof Bell;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  badgeKey?: TranslationKey;
  /** Price per month — VAT included */
  monthly: number;
};

const UPSELLS: UpsellDef[] = [
  {
    id: "telegram",
    icon: Bell,
    titleKey: "checkout.upsell1Title",
    descKey: "checkout.upsell1Desc",
    badgeKey: "checkout.upsell1Badge",
    monthly: 4.99,
  },
  {
    id: "tipOfDay",
    icon: Flame,
    titleKey: "checkout.upsell4Title",
    descKey: "checkout.upsell4Desc",
    monthly: 1.99,
  },
];

const PLANS: PlanDef[] = [
  {
    id: "bronze",
    name: "Bronze",
    tagline: "pricing.bronzeTagline",
    icon: Shield,
    // Symbolic €0,01 trial: the user MUST provide a real payment
    // method and is charged one cent. This is deliberate fraud
    // protection — a fake card will be rejected by Stripe, which
    // stops people from farming free trials with throwaway cards.
    // Checkout renders all steps including payment.
    monthly: 0.01,
    featuresKey: [
      "pricing.bronzeF1",
      "pricing.bronzeF2",
      "pricing.bronzeF3",
      "pricing.bronzeF4",
      "pricing.bronzeF5",
    ],
  },
  {
    id: "silver",
    name: "Silver",
    tagline: "pricing.silverTagline",
    icon: Zap,
    monthly: 9.99,
    featuresKey: [
      "pricing.silverF1",
      "pricing.silverF2",
      "pricing.silverF3",
      "pricing.silverF4",
      "pricing.silverF5",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    tagline: "pricing.goldTagline",
    icon: Sparkles,
    monthly: 14.99,
    highlight: true,
    featuresKey: [
      "pricing.goldF1",
      "pricing.goldF2",
      "pricing.goldF3",
      "pricing.goldF4",
      "pricing.goldF5",
      "pricing.goldF6",
    ],
  },
  {
    id: "platinum",
    name: "Platinum",
    tagline: "pricing.platTagline",
    icon: Crown,
    monthly: 0,
    oneTime: 199,
    featuresKey: [
      "pricing.platF1",
      "pricing.platF2",
      "pricing.platF3",
      "pricing.platF4",
      "pricing.platF5",
    ],
  },
];

const formatEUR = (n: number) =>
  n.toLocaleString("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* ── Main content ───────────────────────────────────────────── */
interface CheckoutContentProps {
  checkoutPage?: any;
}

export function CheckoutContent({ checkoutPage }: CheckoutContentProps = {}) {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const params = useSearchParams();
  // Auth state — gate anonymous users before they can fill the form.
  // Once the backend starts requiring a bearer token on
  // /subscriptions/checkout, anonymous POSTs will 401 — we want
  // people to log in BEFORE typing any payment info.
  const { user, ready: authReady } = useAuth();

  // Subscription check — if the logged-in user already has an
  // active subscription we show a friendly "you already have a
  // plan" notice instead of the form. Only runs when there's an
  // auth token so anonymous visitors don't fire a useless request.
  const mySub = useQuery({
    queryKey: ["my-subscription", "checkout-gate"],
    queryFn: () => api.getMySubscription(),
    enabled: authReady && !!user,
    staleTime: 10_000,
    retry: false,
  });

  // Plan from URL (default Gold, the popular plan)
  const planParam = (params?.get("plan") ?? "gold").toLowerCase() as PlanId;
  // Free Access has no Stripe checkout — redirect any direct hits on
  // /checkout?plan=bronze straight to /register so the user lands in
  // the no-card signup flow instead of an empty Stripe form.
  const router = useRouter();
  useEffect(() => {
    if (planParam === "bronze") {
      router.replace("/register");
    }
  }, [planParam, router]);
  const initialPlan =
    PLANS.find((p) => p.id === planParam) ?? PLANS[2]; // default Gold

  const billingParam = (params?.get("billing") ?? "monthly") as Billing;
  const initialBilling: Billing =
    billingParam === "yearly" ? "yearly" : "monthly";

  useEffect(() => {
    if (planParam === "bronze") return;
    trackTikTok("InitiateCheckout", {
      value: getPlanValueEur(planParam, billingParam, false),
      currency: "EUR",
      content_id: planParam,
      content_name: `${planParam} ${billingParam}`,
      content_type: "product",
    });
  }, [planParam, billingParam]);

  const [plan, setPlan] = useState<PlanDef>(initialPlan);
  const [billing, setBilling] = useState<Billing>(initialBilling);
  // Add-ons are opt-in on Silver/Gold — users start with nothing
  // pre-selected and can tick whichever extras they want.
  // (Pick of the Day is still shown as "Included" on Platinum.)
  const [selectedUpsells, setSelectedUpsells] = useState<UpsellId[]>([]);
  // The 7-day free trial concept retired in favour of Free Access:
  // anyone who wants a no-cost taste creates a Free Access account
  // instead. Anyone reaching the paid checkout subscribes outright,
  // so the trial toggle now defaults to OFF and the entire
  // toggle/copy block is hidden — the value is wired only so the
  // backend payload stays compatible (`with_trial: false`).
  const [startWithTrial, setStartWithTrial] = useState<boolean>(false);
  // Already-logged-in visitors skip the Account step entirely —
  // they land straight on Billing. Anonymous visitors start at
  // step 1 as before (though they'll see LoginGate instead of the
  // form, because of the `authReady && !user` branch above).
  const [step, setStep] = useState<1 | 2 | 3>(user ? 2 : 1);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Abandoned checkout tracking
  const checkoutSessionId = useRef<string | null>(null);
  const recoveryParam = params?.get("recovery");
  const couponParam = params?.get("coupon");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_percent: number;
  } | null>(null);

  // Tracks whether the user has tried to advance past each step.
  // We only highlight validation errors after they've tried to move
  // forward, so the form doesn't feel aggressive on first render.
  const [triedAdvance, setTriedAdvance] = useState<Record<1 | 2 | 3, boolean>>({
    1: false,
    2: false,
    3: false,
  });

  /* ── Controlled form state ────────────────────────────────── */
  const [account, setAccount] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [address, setAddress] = useState({
    country: "",
    street: "",
    city: "",
    postalCode: "",
    state: "",
    company: "",
    vatId: "",
  });

  // Ordered country list (popular on top) — memoized once.
  const countryOptions = useMemo(() => getOrderedCountries(), []);
  const popularCount = POPULAR_COUNTRY_CODES.length;

  // Auto-detect the visitor's country once on mount and pre-fill
  // the select. If the user already picked something manually we
  // don't overwrite it.
  useEffect(() => {
    let cancelled = false;
    detectCountryCode().then((code) => {
      if (cancelled || !code) return;
      setAddress((prev) => (prev.country ? prev : { ...prev, country: code }));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // If the user finishes logging in after the component mounted
  // (e.g. they arrived anonymous, then came back from /login) and
  // we're still sitting on the Account step, skip straight to
  // Billing — the Account step is only meaningful for anonymous
  // visitors and we'd otherwise render an empty shell.
  useEffect(() => {
    if (authReady && user && step === 1) {
      setStep(2);
    }
  }, [authReady, user, step]);

  // Recovery flow: validate recovery token + auto-apply coupon from URL
  useEffect(() => {
    if (!couponParam) return;
    fetch(`${API}/checkout-sessions/coupon/${encodeURIComponent(couponParam)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.is_valid) {
          setAppliedCoupon({ code: data.code, discount_percent: data.discount_percent });
        }
      })
      .catch(() => {});
  }, [couponParam]);

  useEffect(() => {
    if (!recoveryParam) return;
    fetch(`${API}/checkout-sessions/recover/${encodeURIComponent(recoveryParam)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          if (data.first_name) {
            setAccount((prev) => ({ ...prev, firstName: data.first_name }));
          }
        }
      })
      .catch(() => {});
  }, [recoveryParam]);

  const setAccountField = <K extends keyof typeof account>(
    k: K,
    v: string
  ) => setAccount((p) => ({ ...p, [k]: v }));
  const setAddressField = <K extends keyof typeof address>(
    k: K,
    v: string
  ) => setAddress((p) => ({ ...p, [k]: v }));
  const toggleUpsell = (id: UpsellId) =>
    setSelectedUpsells((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  /* ── Per-step validation ──────────────────────────────────── */
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const accountErrors = useMemo(() => {
    const e: Partial<Record<keyof typeof account, string>> = {};
    // When the user is already logged in the Account step has
    // nothing to validate — they don't need to (re)create an
    // account. Returning an empty error object keeps step1Valid
    // true so the Continue button advances straight to Billing.
    if (user) return e;
    if (!account.firstName.trim()) e.firstName = "required";
    if (!account.lastName.trim()) e.lastName = "required";
    if (!account.email.trim()) e.email = "required";
    else if (!emailRe.test(account.email.trim())) e.email = "invalid";
    if (!account.password) e.password = "required";
    else if (account.password.length < 8) e.password = "short";
    if (!account.confirmPassword) e.confirmPassword = "required";
    else if (account.confirmPassword !== account.password)
      e.confirmPassword = "mismatch";
    return e;
  }, [account, user]);

  const addressErrors = useMemo(() => {
    const e: Partial<Record<keyof typeof address, string>> = {};
    if (!address.country) e.country = "required";
    if (!address.street.trim()) e.street = "required";
    if (!address.city.trim()) e.city = "required";
    if (!address.postalCode.trim()) e.postalCode = "required";
    return e;
  }, [address]);

  const paymentErrors = useMemo(() => {
    const e: Partial<Record<"terms", string>> = {};
    if (!agreed) e.terms = "required";
    return e;
  }, [agreed]);

  const step1Valid = Object.keys(accountErrors).length === 0;
  const step2Valid = Object.keys(addressErrors).length === 0;
  const step3Valid = Object.keys(paymentErrors).length === 0;

  // Which upsells are actually chargeable for this plan.
  // Platinum is the lifetime "everything included" tier — both
  // Telegram Alerts and Pick of the Day are bundled in for free,
  // so they're shown as "Included" and removed from the billable list.
  // Stripe also can't mix one-time (Platinum) with recurring (addons)
  // in a single checkout, which makes "all included" the cleanest path.
  const isPlatinum = plan.id === "platinum";
  const chargeableUpsellIds = isPlatinum
    ? []
    : selectedUpsells;

  // 7-day free trial retired — Free Access is the no-cost entry
  // point now. The paid checkout always charges immediately on the
  // first day. trialAvailable=false hides the trial UI everywhere.
  const trialAvailable = false;
  const trialActive = trialAvailable && startWithTrial;

  /* ── Price derivation (all figures are VAT-inclusive) ─────── */
  const pricing = useMemo(() => {
    // Add-ons: billed at the same cadence as the plan
    const addonsMonthly = UPSELLS.filter((u) =>
      chargeableUpsellIds.includes(u.id)
    ).reduce((sum, u) => sum + u.monthly, 0);
    const addons =
      billing === "yearly" ? addonsMonthly * 12 : addonsMonthly;

    if (plan.oneTime != null) {
      const planTotal = plan.oneTime;
      const recurring = planTotal + addons;
      return {
        planTotal,
        addons,
        recurring,
        dueToday: recurring,
        yearlySavings: 0,
        period: "one-time" as const,
      };
    }
    const baseMonthly = plan.monthly;
    const effectiveMonthly =
      billing === "yearly" ? baseMonthly * 0.8 : baseMonthly;
    const planTotal =
      billing === "yearly" ? effectiveMonthly * 12 : effectiveMonthly;
    const recurring = planTotal + addons;
    // How much the user saves by picking yearly vs 12 monthly payments
    const yearlySavings = baseMonthly * 12 * 0.2;
    return {
      planTotal,
      addons,
      recurring,
      // Trial flow uses Stripe's native `trial_period_days`, so the
      // customer is charged €0,00 today and the full plan price kicks
      // in on day 8. Stripe still verifies the card via SetupIntent so
      // fake / declined cards are rejected up-front.
      dueToday: trialActive ? 0 : recurring,
      yearlySavings,
      period: billing,
    };
  }, [plan, billing, chargeableUpsellIds, trialActive]);

  // Trial end date (7 days from now), for copy like "first charge on X"
  const trialEndDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  }, []);
  const trialEndLabel = trialEndDate.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isFreePlan = plan.monthly === 0 && plan.oneTime == null;

  /* ── Step navigation ──────────────────────────────────────── */
  const next = () => {
    // Mark the current step as "tried" so validation errors become
    // visible, then only advance if the step is valid.
    setTriedAdvance((prev) => ({ ...prev, [step]: true }));
    if (step === 1 && !step1Valid) return;
    if (step === 2 && !step2Valid) return;

    const nextStep = (step + 1) as 1 | 2 | 3;

    // Track: create checkout session when advancing past step 1
    // (email is captured at this point). Fire-and-forget.
    if (step === 1 && account.email) {
      trackCheckoutSession({
        email: account.email,
        first_name: account.firstName || null,
        plan_id: plan.id,
        billing_cycle: billing,
        with_trial: startWithTrial,
        locale: null,
      }).then((result) => {
        if (result) checkoutSessionId.current = result.session_id;
      });
    }

    // Track step progress for existing sessions
    if (checkoutSessionId.current && step >= 2) {
      trackCheckoutStep(checkoutSessionId.current, nextStep);
    }

    if (step < 3) setStep(nextStep);
  };
  const back = () => {
    if (step > 1) setStep(((step - 1) as 1 | 2 | 3));
  };

  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  // ── Email-verification gate state ─────────────────────────
  // The backend returns HTTP 403 with ``detail = "email_not_verified"``
  // when an unverified user tries to pay. We flip this flag so the UI
  // can swap the plain error banner for a richer "verify your email"
  // call-to-action with an inline "resend" button.
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState<
    "idle" | "sent" | "error"
  >("idle");

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setResendingVerification(true);
    setResendStatus("idle");
    try {
      await api.resendVerification(user.email);
      setResendStatus("sent");
    } catch (err) {
      console.error("Resend verification failed:", err);
      setResendStatus("error");
    } finally {
      setResendingVerification(false);
    }
  };

  const handleStripeCheckout = async () => {
    if (!agreed) return;
    // Sanity: gate also guarantees this, but belt & braces.
    if (!user) {
      setCheckoutError("Please log in before completing your subscription.");
      return;
    }
    setSubmitting(true);
    setCheckoutError(null);
    setNeedsVerification(false);
    setResendStatus("idle");
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      // Pull the bearer token from localStorage — same mechanism
      // that the rest of the app uses via `api.request`. We call
      // fetch directly here (instead of api.createCheckout) because
      // the checkout endpoint takes a richer payload (billing +
      // addons) that the shared helper does not expose.
      let token: string | null = null;
      try {
        token = window.localStorage.getItem("betsplug_token");
      } catch {
        // localStorage unavailable (private mode); fall through and
        // let the backend reject with 401 so we surface a clear error.
      }
      const resp = await fetch(`${API}/subscriptions/create-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          // Always send the real plan id. The 7-day trial is now wrapped
          // around the real subscription via Stripe's native
          // `trial_period_days`, so the customer is charged €0,00 today
          // and the full plan price kicks in on day 8.
          plan: plan.id,
          billing,
          // Add-ons are not bundled into the trial flow — keeping the
          // trial scope to "just the base plan" matches the old UX and
          // means the post-trial charge is exactly the plan price the
          // user agreed to, with no surprise add-ons on day 8.
          addons: trialActive ? [] : chargeableUpsellIds,
          with_trial: trialActive,
          // Post-purchase landing page. Stripe will interpolate the
          // session id into {CHECKOUT_SESSION_ID} so the thank-you
          // page can poll /subscriptions/me until the webhook has
          // marked the subscription as active.
          success_url: `${window.location.origin}${loc("/thank-you")}?plan=${plan.id}&billing=${billing}&trial=${trialActive ? "1" : "0"}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}${loc("/checkout")}?plan=${plan.id}&billing=${billing}&cancelled=true`,
        }),
      });
      if (resp.status === 401) {
        setCheckoutError(
          "Your session expired. Please log in again to continue."
        );
        setSubmitting(false);
        return;
      }
      // Email verification gate — backend replies 403 with
      // detail="email_not_verified" when the user hasn't clicked
      // the verification link yet. Show a friendly CTA so they
      // can resend the email without leaving the checkout flow.
      if (resp.status === 403) {
        const data = await resp.json().catch(() => ({}));
        if (data?.detail === "email_not_verified") {
          setNeedsVerification(true);
          setSubmitting(false);
          return;
        }
        setCheckoutError(
          data?.detail || "You do not have permission to complete this checkout."
        );
        setSubmitting(false);
        return;
      }
      const data = await resp.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setCheckoutError(data.detail || "Failed to create checkout session.");
        setSubmitting(false);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setCheckoutError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTriedAdvance((prev) => ({ ...prev, 3: true }));
    if (!step3Valid) return;
    // Mark the checkout session as completed so no
    // abandoned-checkout email gets sent.
    if (checkoutSessionId.current) {
      trackCheckoutComplete(checkoutSessionId.current);
    }

    handleStripeCheckout();
  };

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-[#ededed]">
      <HeroMediaBg />
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-40 h-[540px] w-[540px] rounded-full bg-[#4ade80]/[0.08] blur-[160px]" />
        <div className="absolute -right-40 bottom-40 h-[540px] w-[540px] rounded-full bg-[#a855f7]/[0.07] blur-[160px]" />
        <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-[#60a5fa]/[0.05] blur-[140px]" />
      </div>

      <CheckoutHeader />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-14">
        {/* Page heading */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 flex justify-center">
            <span className="section-label">
              <Lock className="h-3 w-3" />
              {t("checkout.footer.secure")}
            </span>
          </div>
          <h1 className="text-display text-balance break-words text-3xl text-[#ededed] sm:text-4xl md:text-5xl">
            {t("checkout.pageTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#a3a9b8] sm:text-base">
            {t("checkout.pageSubtitle")}
          </p>
        </div>

        {/* ── Login gate ─────────────────────────────────────────
            Anonymous users see a "log in first" panel before any
            payment fields are rendered. The backend enforces this
            too (JWT required on /subscriptions/create-checkout),
            but gating on the client gives a much nicer flow than
            a 401 after the user filled in their details. */}
        {!authReady && (
          <div className="mt-12">
            <CheckoutGateSkeleton />
          </div>
        )}
        {authReady && !user && (
          <div className="mt-12">
            <LoginGate
              plan={plan.id}
              billing={billing}
              loc={loc}
            />
          </div>
        )}
        {authReady && user && mySub.data?.has_subscription && (
          <div className="mt-12">
            <ActiveSubscriptionNotice
              planName={mySub.data.plan ?? ""}
              targetPlan={planParam}
              loc={loc}
            />
          </div>
        )}

        {authReady && user && !mySub.data?.has_subscription && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            {/* Mobile-first TrialPicker — must appear above the order
                summary on mobile. On desktop it's hidden here and
                rendered inside the left column further below so the
                existing two-column layout stays untouched. */}
            {step === 1 && trialAvailable && (
              <div className="order-first lg:hidden">
                <TrialPicker
                  startWithTrial={startWithTrial}
                  onChange={setStartWithTrial}
                  trialEndLabel={trialEndLabel}
                  recurring={pricing.recurring}
                />
              </div>
            )}

            {/* ── Left column: stepper + form ───────────────── */}
            <div className="order-2 lg:order-1">
              {/* Desktop-only TrialPicker — keeps the current lg layout
                  where the picker sits at the top of the left column */}
              {step === 1 && trialAvailable && (
                <div className="hidden lg:block">
                  <TrialPicker
                    startWithTrial={startWithTrial}
                    onChange={setStartWithTrial}
                    trialEndLabel={trialEndLabel}
                    recurring={pricing.recurring}
                  />
                </div>
              )}

              {/* Stepper */}
              <Stepper step={step} />

              <form
                onSubmit={handleSubmit}
                className="mt-6 rounded-3xl border border-white/[0.1] bg-[hsl(230_16%_10%/0.88)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8"
              >
                {/* Logged-in badge — confirms the session is attached so
                    the user knows this subscription will end up on the
                    right account. */}
                {user && (
                  <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#4ade80]/30 bg-[#4ade80]/[0.08] px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-green-500/30 bg-green-100">
                      <CheckCircle2 className="h-4 w-4 text-[#4ade80]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#4ade80]">
                        Logged in
                      </p>
                      <p className="truncate text-sm font-semibold text-[#ededed]">
                        {user.email}
                      </p>
                    </div>
                  </div>
                )}
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                    >
                      <StepHeading
                        icon={User}
                        title={t("checkout.accountTitle")}
                        subtitle={t("checkout.accountSubtitle")}
                      />
                      {/* Create-account form — only shown to anonymous
                          visitors. When the user is already logged in
                          the LOGGED IN badge above is the only thing
                          the Account step needs, and the Continue
                          button advances straight to Billing. The
                          outer `{authReady && user && !mySub.data?.has_subscription}`
                          branch means we will effectively never land
                          here while logged in (the useEffect auto-
                          bumps to step 2), but we still guard the
                          form so a stale render never leaks the
                          registration fields. */}
                      {!user && (
                        <>
                          <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <Field
                              label={t("checkout.firstName")}
                              error={
                                triedAdvance[1] && accountErrors.firstName
                                  ? true
                                  : false
                              }
                            >
                              <input
                                type="text"
                                placeholder={t("checkout.firstNamePh")}
                                value={account.firstName}
                                onChange={(e) =>
                                  setAccountField("firstName", e.target.value)
                                }
                                className={inputClsFor(
                                  triedAdvance[1] && !!accountErrors.firstName
                                )}
                              />
                            </Field>
                            <Field
                              label={t("checkout.lastName")}
                              error={
                                triedAdvance[1] && accountErrors.lastName
                                  ? true
                                  : false
                              }
                            >
                              <input
                                type="text"
                                placeholder={t("checkout.lastNamePh")}
                                value={account.lastName}
                                onChange={(e) =>
                                  setAccountField("lastName", e.target.value)
                                }
                                className={inputClsFor(
                                  triedAdvance[1] && !!accountErrors.lastName
                                )}
                              />
                            </Field>
                            <Field
                              label={t("checkout.email")}
                              className="sm:col-span-2"
                              error={
                                triedAdvance[1] && accountErrors.email
                                  ? true
                                  : false
                              }
                            >
                              <input
                                type="email"
                                placeholder={t("checkout.emailPh")}
                                value={account.email}
                                onChange={(e) =>
                                  setAccountField("email", e.target.value)
                                }
                                className={inputClsFor(
                                  triedAdvance[1] && !!accountErrors.email
                                )}
                              />
                            </Field>
                            <Field
                              label={t("checkout.password")}
                              hint={t("checkout.passwordHint")}
                              error={
                                triedAdvance[1] && accountErrors.password
                                  ? true
                                  : false
                              }
                            >
                              <input
                                type="password"
                                placeholder={t("checkout.passwordPh")}
                                value={account.password}
                                onChange={(e) =>
                                  setAccountField("password", e.target.value)
                                }
                                className={inputClsFor(
                                  triedAdvance[1] && !!accountErrors.password
                                )}
                              />
                            </Field>
                            <Field
                              label={t("checkout.confirmPassword")}
                              error={
                                triedAdvance[1] && accountErrors.confirmPassword
                                  ? true
                                  : false
                              }
                            >
                              <input
                                type="password"
                                placeholder={t("checkout.passwordPh")}
                                value={account.confirmPassword}
                                onChange={(e) =>
                                  setAccountField(
                                    "confirmPassword",
                                    e.target.value
                                  )
                                }
                                className={inputClsFor(
                                  triedAdvance[1] &&
                                    !!accountErrors.confirmPassword
                                )}
                              />
                            </Field>
                          </div>
                          <p className="mt-5 text-xs text-[#8a93a6]">
                            {t("checkout.alreadyHaveAccount")}{" "}
                            <Link
                              href={loc("/login")}
                              className="font-semibold text-[#4ade80] hover:text-[#4ade80]"
                            >
                              {t("checkout.signIn")}
                            </Link>
                          </p>
                        </>
                      )}

                      {/* Payment reassurance — white pill badges
                          matching the footer so the trust signals
                          look consistent across the site. */}
                      <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04]/[0.03] px-4 py-4 sm:flex-row sm:gap-4">
                        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[#8a93a6]">
                          <Lock className="h-3.5 w-3.5 text-green-400" />
                          {t("checkout.weAccept")}
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <VisaBadge />
                          <MastercardBadge />
                          <AmexBadge />
                          <PayPalBadge />
                          <ApplePayBadge />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                    >
                      <StepHeading
                        icon={MapPin}
                        title={t("checkout.billingTitle")}
                        subtitle={t("checkout.billingSubtitle")}
                      />
                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <Field
                          label={t("checkout.country")}
                          className="sm:col-span-2"
                          error={
                            triedAdvance[2] && addressErrors.country
                              ? true
                              : false
                          }
                        >
                          <select
                            value={address.country}
                            onChange={(e) =>
                              setAddressField("country", e.target.value)
                            }
                            className={inputClsFor(
                              triedAdvance[2] && !!addressErrors.country
                            )}
                          >
                            <option value="" disabled>
                              {t("checkout.countryPh")}
                            </option>
                            <optgroup label="★ Popular">
                              {countryOptions
                                .slice(0, popularCount)
                                .map((c) => (
                                  <option key={c.code} value={c.code}>
                                    {c.flag} {c.name}
                                  </option>
                                ))}
                            </optgroup>
                            <optgroup label="All countries">
                              {countryOptions
                                .slice(popularCount)
                                .map((c) => (
                                  <option key={c.code} value={c.code}>
                                    {c.flag} {c.name}
                                  </option>
                                ))}
                            </optgroup>
                          </select>
                        </Field>
                        <Field
                          label={t("checkout.address")}
                          className="sm:col-span-2"
                          error={
                            triedAdvance[2] && addressErrors.street
                              ? true
                              : false
                          }
                        >
                          <input
                            type="text"
                            placeholder={t("checkout.addressPh")}
                            value={address.street}
                            onChange={(e) =>
                              setAddressField("street", e.target.value)
                            }
                            className={inputClsFor(
                              triedAdvance[2] && !!addressErrors.street
                            )}
                          />
                        </Field>
                        <Field
                          label={t("checkout.city")}
                          error={
                            triedAdvance[2] && addressErrors.city
                              ? true
                              : false
                          }
                        >
                          <input
                            type="text"
                            placeholder={t("checkout.cityPh")}
                            value={address.city}
                            onChange={(e) =>
                              setAddressField("city", e.target.value)
                            }
                            className={inputClsFor(
                              triedAdvance[2] && !!addressErrors.city
                            )}
                          />
                        </Field>
                        <Field
                          label={t("checkout.postalCode")}
                          error={
                            triedAdvance[2] && addressErrors.postalCode
                              ? true
                              : false
                          }
                        >
                          <input
                            type="text"
                            placeholder={t("checkout.postalCodePh")}
                            value={address.postalCode}
                            onChange={(e) =>
                              setAddressField("postalCode", e.target.value)
                            }
                            className={inputClsFor(
                              triedAdvance[2] && !!addressErrors.postalCode
                            )}
                          />
                        </Field>
                        <Field
                          label={t("checkout.state")}
                          className="sm:col-span-2"
                        >
                          <input
                            type="text"
                            value={address.state}
                            onChange={(e) =>
                              setAddressField("state", e.target.value)
                            }
                            className={inputCls}
                          />
                        </Field>
                        <Field label={t("checkout.company")}>
                          <input
                            type="text"
                            value={address.company}
                            onChange={(e) =>
                              setAddressField("company", e.target.value)
                            }
                            className={inputCls}
                          />
                        </Field>
                        <Field label={t("checkout.vatId")}>
                          <input
                            type="text"
                            value={address.vatId}
                            onChange={(e) =>
                              setAddressField("vatId", e.target.value)
                            }
                            className={inputCls}
                          />
                        </Field>
                      </div>

                      {/* ── Upsells ─────────────────────────── */}
                      <UpsellsBlock
                        selected={selectedUpsells}
                        onToggle={toggleUpsell}
                        billing={billing}
                        isPlatinum={isPlatinum}
                      />
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                    >
                      <StepHeading
                        icon={Wallet}
                        title={t("checkout.paymentTitle")}
                        subtitle={t("checkout.paymentSubtitle")}
                      />

                      {/* Trial reassurance — payment is still
                          required but no charge today */}
                      {trialActive && (
                        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#4ade80]/30 bg-[#4ade80]/[0.08] p-4">
                          <Gift className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#4ade80]" />
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[#4ade80]">
                              {t("checkout.trialBadge")}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-[#a3a9b8]">
                              {t("checkout.trialPaymentNote").replace(
                                "{date}",
                                trialEndLabel
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Stripe redirect info */}
                      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04]/[0.03] p-5">
                        <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#4ade80]" />
                        <div>
                          <p className="text-sm font-semibold text-[#ededed]">
                            {t("checkout.stripeRedirectTitle")}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-[#8a93a6]">
                            {t("checkout.stripeRedirectDesc")}
                          </p>
                        </div>
                      </div>

                      {/* Payment method badges */}
                      <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04]/[0.03] px-4 py-4 sm:flex-row sm:gap-4">
                        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[#8a93a6]">
                          <Lock className="h-3.5 w-3.5 text-green-400" />
                          {t("checkout.weAccept")}
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <VisaBadge />
                          <MastercardBadge />
                          <AmexBadge />
                          <PayPalBadge />
                          <ApplePayBadge />
                        </div>
                      </div>

                      {/* Email verification required banner */}
                      {needsVerification && (
                        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/[0.08] p-4">
                          <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-amber-200">
                              Verify your email to continue
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-amber-300">
                              We sent a verification link to{" "}
                              <span className="font-semibold text-amber-800">
                                {user?.email}
                              </span>
                              . Please click the link in that email to activate
                              your account before subscribing.
                            </p>
                            {resendStatus === "sent" ? (
                              <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#4ade80]/[0.08] px-3 py-1.5 text-xs font-semibold text-[#4ade80]">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Verification email sent. Check your inbox.
                              </p>
                            ) : resendStatus === "error" ? (
                              <p className="mt-3 text-xs text-red-300">
                                Could not resend the email. Please try again in
                                a moment or contact support.
                              </p>
                            ) : null}
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={handleResendVerification}
                                disabled={
                                  resendingVerification ||
                                  resendStatus === "sent"
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-500/[0.08] px-3 py-1.5 text-xs font-bold text-amber-200 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {resendingVerification
                                  ? "Sending…"
                                  : resendStatus === "sent"
                                  ? "Sent"
                                  : "Resend verification email"}
                              </button>
                              <a
                                href={`mailto:${user?.email ?? ""}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-[#a3a9b8] transition-colors hover:border-white/[0.12] hover:text-[#ededed]"
                              >
                                Open inbox
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Checkout error */}
                      {checkoutError && !needsVerification && (
                        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/[0.08] p-4">
                          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                          <p className="text-xs leading-relaxed text-red-300">
                            {checkoutError}
                          </p>
                        </div>
                      )}

                      {/* Terms */}
                      <label
                        className={`mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border bg-white/[0.04] p-4 transition-colors ${
                          triedAdvance[3] && paymentErrors.terms
                            ? "border-red-500/60 bg-red-500/[0.08]"
                            : "border-white/[0.08]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-white/[0.12] bg-white/[0.04] text-[#4ade80] focus:ring-green-500"
                        />
                        <span className="text-xs leading-relaxed text-[#8a93a6]">
                          {t("checkout.agreeTerms")}{" "}
                          <Link
                            href="https://betsplug.com/terms"
                            target="_blank"
                            className="font-semibold text-[#4ade80] hover:text-[#4ade80]"
                          >
                            {t("checkout.termsLink")}
                          </Link>{" "}
                          {t("checkout.and")}{" "}
                          <Link
                            href="https://betsplug.com/privacy"
                            target="_blank"
                            className="font-semibold text-[#4ade80] hover:text-[#4ade80]"
                          >
                            {t("checkout.privacyLink")}
                          </Link>
                          .
                        </span>
                      </label>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Step actions ─────────────────────────── */}
                <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={back}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 py-3 text-sm font-semibold text-[#a3a9b8] shadow-sm transition-all hover:border-white/[0.12] hover:text-[#ededed] sm:w-auto"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t("checkout.back")}
                    </button>
                  ) : (
                    <span />
                  )}

                  {step < 3 ? (
                    (() => {
                      const currentValid =
                        step === 1 ? step1Valid : step2Valid;
                      return (
                        <button
                          type="button"
                          onClick={next}
                          disabled={!currentValid}
                          className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold tracking-tight text-black shadow-lg shadow-green-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:w-auto"
                        >
                          {t("checkout.next")}
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      );
                    })()
                  ) : (
                    <button
                      type="submit"
                      disabled={!step3Valid || submitting}
                      className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold tracking-tight text-black shadow-lg shadow-green-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:w-auto"
                    >
                      {submitting
                        ? t("checkout.processing")
                        : trialActive
                        ? t("checkout.submitTrial")
                        : t("checkout.submit")}
                      {!submitting && <ChevronRight className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* ── Right column: Order summary ──────────────── */}
            <aside className="order-1 lg:order-2">
              <div className="sticky top-28 space-y-4">
                <OrderSummary
                  plan={plan}
                  billing={billing}
                  onToggleBilling={() =>
                    setBilling(billing === "monthly" ? "yearly" : "monthly")
                  }
                  onChangePlan={(id) => {
                    const p = PLANS.find((x) => x.id === id);
                    if (p) setPlan(p);
                  }}
                  pricing={pricing}
                  isFreePlan={isFreePlan}
                  selectedUpsells={chargeableUpsellIds}
                  trialActive={trialActive}
                  trialEndLabel={trialEndLabel}
                  appliedCoupon={appliedCoupon}
                />

                {/* Trust strip — "guarantee" row dropped (see
                    checkout-footer.tsx for rationale). */}
                <div className="rounded-2xl border border-white/[0.1] bg-[hsl(230_16%_10%/0.88)] p-4 text-xs text-[#8a93a6] shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-[#4ade80]" />
                    <span>{t("checkout.footer.secure")}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <CheckoutFooter />
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

const inputCls =
  "w-full rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 py-3 text-sm text-[#ededed] placeholder:text-[#6b7280] focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-colors";

const inputClsError =
  "w-full rounded-xl border border-red-500/60 bg-red-500/[0.08] px-4 py-3 text-sm text-[#ededed] placeholder:text-[#6b7280] focus:border-red-500/80 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-colors";

const inputClsFor = (hasError: boolean) =>
  hasError ? inputClsError : inputCls;

function Field({
  label,
  hint,
  className = "",
  error = false,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span
        className={`text-xs font-semibold uppercase tracking-wider ${
          error ? "text-red-400" : "text-[#8a93a6]"
        }`}
      >
        {label}
      </span>
      {children}
      {hint && !error && (
        <span className="text-[11px] text-[#8a93a6]">{hint}</span>
      )}
      {error && (
        <span className="text-[11px] font-semibold text-red-400">
          {error === true ? "This field is required" : error}
        </span>
      )}
    </label>
  );
}

function StepHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof User;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-[#4ade80]/20 bg-[#4ade80]/[0.08]">
        <Icon className="h-5 w-5 text-[#4ade80]" />
      </div>
      <div>
        <h2 className="text-xl font-extrabold text-[#ededed] sm:text-2xl">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[#8a93a6]">{subtitle}</p>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const { t } = useTranslations();
  const items = [
    { id: 1, label: t("checkout.step1") },
    { id: 2, label: t("checkout.step2") },
    { id: 3, label: t("checkout.step3") },
  ];
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {items.map((it, idx) => {
        const done = step > it.id;
        const active = step === it.id;
        return (
          <li
            key={it.id}
            className="flex flex-1 items-center gap-2 first:flex-none sm:gap-3"
          >
            <div
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors sm:h-9 sm:w-9 ${
                done
                  ? "border-green-500/60 bg-[#4ade80]/[0.08] text-[#4ade80]"
                  : active
                  ? "border-green-500/60 bg-[#4ade80]/[0.08]0 text-white shadow-[0_0_20px_rgba(74,222,128,0.25)]"
                  : "border-white/[0.08] bg-white/[0.04]/[0.03] text-[#8a93a6]"
              }`}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : it.id}
            </div>
            <span
              className={`hidden text-sm font-semibold transition-colors sm:inline ${
                active || done ? "text-[#ededed]" : "text-[#8a93a6]"
              }`}
            >
              {it.label}
            </span>
            {idx < items.length - 1 && (
              <span
                className={`mx-1 h-px flex-1 sm:mx-2 ${
                  done ? "bg-[#4ade80]/[0.08]0/40" : "bg-slate-200"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ── Order summary card ─────────────────────────────────────── */
function OrderSummary({
  plan,
  billing,
  onToggleBilling,
  onChangePlan,
  pricing,
  isFreePlan,
  selectedUpsells,
  trialActive,
  trialEndLabel,
  appliedCoupon,
}: {
  plan: PlanDef;
  billing: Billing;
  onToggleBilling: () => void;
  onChangePlan: (id: PlanId) => void;
  pricing: {
    planTotal: number;
    addons: number;
    recurring: number;
    dueToday: number;
    yearlySavings: number;
    period: string;
  };
  isFreePlan: boolean;
  selectedUpsells: UpsellId[];
  trialActive: boolean;
  trialEndLabel: string;
  appliedCoupon?: { code: string; discount_percent: number } | null;
}) {
  const { t } = useTranslations();
  const Icon = plan.icon;
  const isOneTime = plan.oneTime != null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-[hsl(230_16%_10%/0.88)] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6">
      {/* glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-[240px] w-[240px] rounded-full bg-[#4ade80]/[0.08]0/[0.04] blur-[90px]" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#8a93a6]">
            {t("checkout.summaryTitle")}
          </h3>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#4ade80]/30 bg-[#4ade80]/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#4ade80]">
            <Lock className="h-3 w-3" />
            SSL
          </span>
        </div>

        {/* Plan row */}
        <div className="mt-5 flex items-start gap-3">
          <div
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
              plan.highlight
                ? "bg-[#4ade80]/[0.08] shadow-[0_0_20px_rgba(74,222,128,0.15)]"
                : "bg-[#4ade80]/[0.08]"
            }`}
          >
            <Icon className="h-5 w-5 text-[#4ade80]" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <h4 className="text-lg font-extrabold text-[#ededed]">
                {plan.name}
              </h4>
              {isOneTime ? (
                <span className="text-xl font-extrabold text-[#ededed]">
                  {formatEUR(plan.oneTime ?? 0)}
                </span>
              ) : (
                <span className="text-xl font-extrabold text-[#ededed]">
                  {formatEUR(
                    billing === "yearly" ? plan.monthly * 0.8 : plan.monthly
                  )}
                  <span className="text-xs font-semibold text-[#8a93a6]">
                    {t("checkout.perMonth")}
                  </span>
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-[#8a93a6]">{t(plan.tagline)}</p>
          </div>
        </div>

        {/* Plan quick-switch */}
        <div className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
          {PLANS.filter((p) => p.id !== "bronze" && p.id !== "platinum").map(
            (p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onChangePlan(p.id)}
                className={`rounded-xl border px-2 py-2 text-[11px] font-bold uppercase tracking-wider transition-all ${
                  plan.id === p.id
                    ? "border-green-500/60 bg-[#4ade80]/[0.08] text-[#4ade80]"
                    : "border-white/[0.08] bg-white/[0.04]/[0.03] text-[#8a93a6] hover:border-white/[0.12] hover:text-[#ededed]"
                }`}
              >
                {p.name}
              </button>
            )
          )}
          <button
            type="button"
            onClick={() => onChangePlan("platinum")}
            className={`col-span-1 rounded-xl border px-2 py-2 text-[11px] font-bold uppercase tracking-wider transition-all sm:col-span-3 ${
              plan.id === "platinum"
                ? "border-amber-400/60 bg-amber-500/[0.08] text-amber-300"
                : "border-white/[0.08] bg-white/[0.04]/[0.03] text-[#8a93a6] hover:border-amber-400/30 hover:text-amber-300"
            }`}
          >
            <Crown className="mr-1 inline h-3 w-3" />
            Platinum Lifetime
          </button>
        </div>

        {/* Billing toggle (hide for one-time / free) */}
        {!isOneTime && !isFreePlan && (
          <div className="mt-5">
            <div
              className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                billing === "yearly"
                  ? "border-[#4ade80]/30 bg-[#4ade80]/[0.08]"
                  : "border-white/[0.08] bg-white/[0.04]/[0.03]"
              }`}
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6b7280]">
                  {t("checkout.billingLabel")}
                  <span className="inline-flex items-center rounded-full border border-green-500/40 bg-[#4ade80]/[0.08]0/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-green-300">
                    {t("checkout.yearlySaveBadge")}
                  </span>
                </div>
                <div className="text-sm font-bold text-[#ededed]">
                  {billing === "yearly"
                    ? t("checkout.yearly")
                    : t("checkout.monthly")}
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleBilling}
                className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
                  billing === "yearly"
                    ? "border-green-500/60 bg-[#4ade80]/[0.08]0/20"
                    : "border-white/[0.1] bg-white/[0.04]"
                }`}
                aria-label="Toggle billing period"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.6)] transition-transform ${
                    billing === "yearly" ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Savings callout */}
            {billing === "monthly" ? (
              <button
                type="button"
                onClick={onToggleBilling}
                className="mt-2 flex w-full items-start gap-2 rounded-xl border border-green-500/25 bg-[#4ade80]/[0.08]0/[0.06] px-3 py-2.5 text-left transition-all hover:border-green-500/50 hover:bg-[#4ade80]/[0.08]0/[0.1]"
              >
                <TrendingDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                <span className="text-[11px] leading-snug text-slate-300">
                  {t("checkout.yearlySaveCallout").replace(
                    "{amount}",
                    formatEUR(pricing.yearlySavings)
                  )}
                </span>
              </button>
            ) : (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-green-500/25 bg-[#4ade80]/[0.08]0/[0.06] px-3 py-2.5">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-400" />
                <span className="text-[11px] font-semibold leading-snug text-green-300">
                  {t("checkout.yearlySaving").replace(
                    "{amount}",
                    formatEUR(pricing.yearlySavings)
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Total breakdown */}
        <div className="mt-5 space-y-2 border-t border-white/[0.06] pt-5 text-sm">
          <div className="flex items-center justify-between text-[#6b7280]">
            <span>{t("checkout.subtotal")}</span>
            <span className="font-semibold text-slate-200">
              {formatEUR(pricing.planTotal)}
            </span>
          </div>
          {pricing.addons > 0 && (
            <div className="flex items-center justify-between text-[#6b7280]">
              <span>
                {t("checkout.addons")}{" "}
                <span className="text-[10px] text-[#a3a9b8]">
                  ({selectedUpsells.length})
                </span>
              </span>
              <span className="font-semibold text-slate-200">
                {formatEUR(pricing.addons)}
              </span>
            </div>
          )}

          {/* Applied coupon */}
          {appliedCoupon && (
            <div className="flex items-center justify-between rounded-xl border border-amber-400/30 bg-amber-500/[0.08]0/[0.06] p-2.5">
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">
                  {appliedCoupon.code}
                </span>
              </div>
              <span className="text-xs font-bold text-amber-400">
                -{appliedCoupon.discount_percent}%
              </span>
            </div>
          )}

          {/* When trial is active, show both the €0 due today and
              the next charge to set expectations clearly. */}
          {trialActive ? (
            <>
              <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-sm text-[#6b7280]">
                <span>After trial ({trialEndLabel})</span>
                <span className="font-semibold text-slate-200 line-through decoration-slate-600">
                  {formatEUR(pricing.recurring)}
                </span>
              </div>
              <div className="flex items-center justify-between text-base">
                <span className="font-bold text-white">
                  {t("checkout.total")}
                </span>
                <span className="text-2xl font-extrabold text-green-400">
                  {formatEUR(0)}
                </span>
              </div>
              <div className="mt-2 flex items-start gap-2 rounded-xl border border-green-500/25 bg-[#4ade80]/[0.08]0/[0.06] p-3">
                <CalendarClock className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                <span className="text-[11px] leading-snug text-green-200">
                  {t("checkout.trialBadge")}.{" "}
                  {t("checkout.trialFirstCharge").replace(
                    "{date}",
                    trialEndLabel
                  )}{" "}
                  · {formatEUR(pricing.recurring)}.
                </span>
              </div>
              <div className="mt-2 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.04]/[0.02] p-3">
                <PauseCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#6b7280]" />
                <span className="text-[11px] leading-snug text-[#6b7280]">
                  {t("checkout.trialPausedNote")}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-base">
              <span className="font-bold text-white">
                {t("checkout.total")}
              </span>
              <span className="text-xl font-extrabold text-white">
                {formatEUR(pricing.dueToday)}
              </span>
            </div>
          )}
          <p className="text-[10px] text-[#a3a9b8]">
            {t("checkout.vatIncluded")}
          </p>
        </div>

        {/* Coupon */}
        <div className="mt-5 flex items-stretch gap-2">
          <div className="relative flex-1">
            <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a93a6]" />
            <input
              type="text"
              placeholder={t("checkout.couponPlaceholder")}
              className="h-10 w-full rounded-xl border border-white/[0.1] bg-white/[0.04]/[0.03] pl-9 pr-3 text-sm text-white placeholder:text-[#a3a9b8] focus:border-green-500/40 focus:outline-none"
            />
          </div>
          <button
            type="button"
            className="rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 text-xs font-bold uppercase tracking-wider text-white transition-all hover:border-green-500/40 hover:bg-[#4ade80]/[0.08]0/[0.08]"
          >
            {t("checkout.couponApply")}
          </button>
        </div>

        {/* Trial note */}
        <p className="mt-4 rounded-xl border border-[#4ade80]/20 bg-[#4ade80]/[0.08]0/[0.06] p-3 text-[11px] leading-relaxed text-slate-300">
          <CheckCircle2 className="mr-1 inline h-3 w-3 text-green-400" />
          {t("checkout.trialNote")}
        </p>
      </div>
    </div>
  );
}

/* ── Trial picker ───────────────────────────────────────────── */
function TrialPicker({
  startWithTrial,
  onChange,
  trialEndLabel,
  recurring,
}: {
  startWithTrial: boolean;
  onChange: (v: boolean) => void;
  trialEndLabel: string;
  recurring: number;
}) {
  const { t } = useTranslations();

  return (
    <div className="mb-6 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 backdrop-blur-xl">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-[#4ade80]/20 bg-[#4ade80]/[0.08]0/[0.08]">
          <Gift className="h-5 w-5 text-green-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-extrabold text-white sm:text-xl">
            {t("checkout.trialSectionTitle")}
          </h3>
          <p className="mt-1 text-xs text-[#6b7280] sm:text-sm">
            {t("checkout.trialSectionSubtitle")}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {/* Option 1 — Free trial (recommended) */}
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`group relative flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all ${
            startWithTrial
              ? "border-green-500/60 bg-[#4ade80]/[0.08]0/[0.08] shadow-[0_0_30px_rgba(74,222,128,0.15)]"
              : "border-white/[0.08] bg-white/[0.04]/[0.02] hover:border-white/[0.2]"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-all ${
                  startWithTrial
                    ? "border-green-400 bg-[#4ade80]/[0.08]0"
                    : "border-white/25"
                }`}
              >
                {startWithTrial && (
                  <Check className="h-3 w-3 text-black" strokeWidth={4} />
                )}
              </div>
              <h4 className="text-sm font-extrabold text-white">
                {t("checkout.trialOption1Title")}
              </h4>
            </div>
            <span className="inline-flex items-center rounded-full border border-green-500/40 bg-[#4ade80]/[0.08]0/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-green-300">
              {t("checkout.trialOption1Badge")}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-[#6b7280]">
            {t("checkout.trialOption1Desc").replace("{date}", trialEndLabel)}
          </p>
          <div className="mt-1 text-xs font-bold text-green-400">
            {t("checkout.trialDueToday")}
          </div>
        </button>

        {/* Option 2 — Subscribe now */}
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`group relative flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all ${
            !startWithTrial
              ? "border-green-500/60 bg-[#4ade80]/[0.08]0/[0.08] shadow-[0_0_30px_rgba(74,222,128,0.15)]"
              : "border-white/[0.08] bg-white/[0.04]/[0.02] hover:border-white/[0.2]"
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-all ${
                !startWithTrial
                  ? "border-green-400 bg-[#4ade80]/[0.08]0"
                  : "border-white/25"
              }`}
            >
              {!startWithTrial && (
                <Check className="h-3 w-3 text-black" strokeWidth={4} />
              )}
            </div>
            <h4 className="text-sm font-extrabold text-white">
              {t("checkout.trialOption2Title")}
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-[#6b7280]">
            {t("checkout.trialOption2Desc")}
          </p>
          <div className="mt-1 text-xs font-bold text-white">
            {formatEUR(recurring)} today
          </div>
        </button>
      </div>

      {/* Side note — cancelling during trial pauses the account */}
      {startWithTrial && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.04]/[0.02] p-3">
          <PauseCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#6b7280]" />
          <span className="text-[11px] leading-snug text-[#6b7280]">
            {t("checkout.trialPausedNote")}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Upsells block ──────────────────────────────────────────── */
function UpsellsBlock({
  selected,
  onToggle,
  billing,
  isPlatinum,
}: {
  selected: UpsellId[];
  onToggle: (id: UpsellId) => void;
  billing: Billing;
  isPlatinum: boolean;
}) {
  const { t } = useTranslations();
  return (
    <div className="mt-8 border-t border-white/[0.06] pt-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-[#4ade80]/20 bg-[#4ade80]/[0.08]0/[0.08]">
          <Sparkles className="h-5 w-5 text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-white sm:text-xl">
            {t("checkout.upsellsTitle")}
          </h3>
          <p className="mt-1 text-xs text-[#6b7280] sm:text-sm">
            {t("checkout.upsellsSubtitle")}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {UPSELLS.map((u) => {
          const Icon = u.icon;
          // On Platinum every add-on is bundled in for free.
          const included = isPlatinum;
          const active = included || selected.includes(u.id);
          const disabled = included;
          return (
            <button
              key={u.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (!disabled) onToggle(u.id);
              }}
              className={`group relative flex items-start gap-4 rounded-2xl border p-4 text-left transition-all ${
                disabled
                  ? "cursor-default border-amber-400/30 bg-amber-400/[0.05]"
                  : active
                  ? "border-green-500/60 bg-[#4ade80]/[0.08]0/[0.08] shadow-[0_0_30px_rgba(74,222,128,0.12)]"
                  : "border-white/[0.08] bg-white/[0.04]/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04]"
              }`}
            >
              {/* Checkbox */}
              <div
                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-all ${
                  disabled
                    ? "border-amber-400 bg-amber-400/80"
                    : active
                    ? "border-green-400 bg-[#4ade80]/[0.08]0"
                    : "border-white/25 bg-transparent group-hover:border-white/50"
                }`}
              >
                {active && (
                  <Check className="h-3 w-3 text-black" strokeWidth={4} />
                )}
              </div>

              {/* Icon */}
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${
                  disabled
                    ? "bg-amber-400/15"
                    : active
                    ? "bg-[#4ade80]/[0.08]0/20"
                    : "bg-white/[0.04] group-hover:bg-white/[0.04]/[0.08]"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    disabled
                      ? "text-amber-300"
                      : active
                      ? "text-green-400"
                      : "text-[#6b7280]"
                  }`}
                />
              </div>

              {/* Copy */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-extrabold text-white">
                    {t(u.titleKey)}
                  </h4>
                  {disabled ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-300">
                      <Crown className="h-2.5 w-2.5" />
                      {t("checkout.upsellIncluded")}
                    </span>
                  ) : (
                    u.badgeKey && (
                      <span className="inline-flex items-center rounded-full border border-green-500/40 bg-[#4ade80]/[0.08]0/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-green-300">
                        {t(u.badgeKey)}
                      </span>
                    )
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#6b7280]">
                  {t(u.descKey)}
                </p>
              </div>

              {/* Price */}
              <div className="flex-shrink-0 text-right">
                {disabled ? (
                  <div className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                    Free
                  </div>
                ) : (
                  <>
                    <div className="text-sm font-extrabold text-white">
                      +{formatEUR(u.monthly)}
                    </div>
                    <div className="text-[10px] text-[#8a93a6]">
                      {t("checkout.upsellPerMonth")}
                    </div>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] text-[#a3a9b8]">
        {billing === "yearly"
          ? t("checkout.vatIncluded")
          : t("checkout.vatIncluded")}
      </p>
    </div>
  );
}

/* ── Login gate ─────────────────────────────────────────────── */
/**
 * Loading skeleton shown while the auth context is still
 * hydrating from localStorage. Matches the gradient/glass look
 * of the real checkout card so the layout doesn't jump.
 */
function CheckoutGateSkeleton() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-8 backdrop-blur-xl">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-white/[0.04]/[0.06]" />
      <div className="mx-auto mt-6 h-6 w-3/4 rounded-full bg-white/[0.04]/[0.06]" />
      <div className="mx-auto mt-3 h-4 w-2/3 rounded-full bg-white/[0.04]" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="h-12 rounded-xl bg-white/[0.04]/[0.05]" />
        <div className="h-12 rounded-xl bg-white/[0.04]/[0.05]" />
      </div>
    </div>
  );
}

/**
 * LoginGate — blocks anonymous users from reaching the checkout
 * form. Pushes them to /login or /register with a `next` param
 * that round-trips the current plan/billing selection so they
 * land back on the same checkout config after signing in.
 */
function LoginGate({
  plan,
  billing,
  loc,
}: {
  plan: PlanId;
  billing: Billing;
  loc: (path: string) => string;
}) {
  const [whyOpen, setWhyOpen] = useState(false);

  // Preserve the current plan + billing through the auth flow so
  // users aren't forced to re-pick after logging in.
  const nextPath = `/checkout?plan=${plan}&billing=${billing}`;
  const loginHref = `${loc("/login")}?next=${encodeURIComponent(nextPath)}`;
  const registerHref = `${loc("/register")}?next=${encodeURIComponent(
    nextPath
  )}`;

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-6 backdrop-blur-xl sm:p-10"
      >
        {/* Glow */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-[260px] w-[260px] rounded-full bg-[#4ade80]/[0.08]0/[0.12] blur-[110px]" />
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-[260px] w-[260px] rounded-full bg-[#22c55e]/[0.08]0/[0.1] blur-[110px]" />

        <div className="relative">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#4ade80]/30 bg-[#4ade80]/[0.08]0/[0.1]">
            <Lock className="h-6 w-6 text-green-400" />
          </div>

          <h2 className="mt-6 text-balance break-words text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Almost there —{" "}
            <span className="bg-gradient-to-br from-green-300 via-green-400 to-emerald-500 bg-clip-text text-transparent">
              log in to complete your subscription
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-[#6b7280] sm:text-base">
            For your safety, we require an account before processing
            payment. It takes less than a minute.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href={loginHref}
              className="btn-primary group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-extrabold tracking-tight text-black shadow-lg shadow-green-500/20 transition-all hover:shadow-green-500/40"
            >
              <LogIn className="h-4 w-4" />
              Log in
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={registerHref}
              className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] px-6 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all hover:border-green-500/40 hover:bg-white/[0.04]/[0.08]"
            >
              <UserPlus className="h-4 w-4 text-green-400" />
              Create account
              <ChevronRight className="h-4 w-4 text-[#6b7280] transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* "Why?" expandable note */}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setWhyOpen((v) => !v)}
              className="mx-auto flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04]/[0.03] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] transition-all hover:border-white/[0.18] hover:text-white"
              aria-expanded={whyOpen}
            >
              Why do I need an account?
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  whyOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {whyOpen && (
                <motion.div
                  key="why"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="mx-auto mt-4 max-w-md text-center text-xs leading-relaxed text-[#6b7280]">
                    This lets us tie your subscription to your account,
                    send you receipts, and give you access to your
                    dashboard.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Trust strip */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.04]/[0.02] px-4 py-4 sm:gap-6">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#6b7280]">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-green-400" />
              14-day money-back guarantee
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#6b7280]">
              <Lock className="h-3.5 w-3.5 shrink-0 text-green-400" />
              SSL-encrypted checkout
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#6b7280]">
              <Mail className="h-3.5 w-3.5 shrink-0 text-green-400" />
              Receipts by email
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * ActiveSubscriptionNotice — shown when a logged-in user lands
 * on /checkout but already has an active subscription. Gives them
 * a direct path to the subscription management page instead of
 * letting them accidentally stack plans.
 */
function ActiveSubscriptionNotice({
  planName,
  targetPlan,
  loc,
}: {
  planName: string;
  targetPlan: string;
  loc: (path: string) => string;
}) {
  const prettyPlan = planName
    ? planName.charAt(0).toUpperCase() + planName.slice(1)
    : "";
  const isPlatinumUpgrade = targetPlan === "platinum";

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-3xl border border-green-500/25 bg-gradient-to-br from-green-500/[0.08] via-[#0f1420]/[0.02] to-white/[0.01] p-8 backdrop-blur-xl sm:p-10"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-[260px] w-[260px] rounded-full bg-[#4ade80]/[0.08]0/[0.14] blur-[110px]" />
        <div className="relative text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#4ade80]/30 bg-[#4ade80]/[0.08]0/[0.12]">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
          </div>

          {isPlatinumUpgrade ? (
            <>
              <h2 className="mt-6 text-balance break-words text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Switching to{" "}
                <span className="bg-gradient-to-br from-green-300 via-green-400 to-emerald-500 bg-clip-text text-transparent">
                  Platinum
                </span>
                ?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#6b7280]">
                Platinum is a one-time lifetime purchase, not a monthly
                plan — Stripe can&apos;t auto-switch a recurring{" "}
                {prettyPlan || "subscription"} to it. To upgrade, please
                cancel your current {prettyPlan || "subscription"} from
                your subscription page first, then come back here to buy
                Platinum.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={loc("/subscription")}
                  className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold tracking-tight text-black shadow-lg shadow-green-500/20 transition-all hover:shadow-green-500/40 sm:w-auto"
                >
                  Cancel current subscription
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href={loc("/dashboard")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] px-6 py-3 text-sm font-bold text-white transition-all hover:border-white/[0.25] hover:bg-white/[0.04]/[0.08] sm:w-auto"
                >
                  Back to dashboard
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-6 text-balance break-words text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                You already have an active{" "}
                {prettyPlan && (
                  <span className="bg-gradient-to-br from-green-300 via-green-400 to-emerald-500 bg-clip-text text-transparent">
                    {prettyPlan}
                  </span>
                )}{" "}
                subscription
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#6b7280]">
                Manage it — change plan, update payment, or cancel — from
                your subscription page.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={loc("/subscription")}
                  className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold tracking-tight text-black shadow-lg shadow-green-500/20 transition-all hover:shadow-green-500/40 sm:w-auto"
                >
                  Go to my subscription
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href={loc("/dashboard")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] px-6 py-3 text-sm font-bold text-white transition-all hover:border-white/[0.25] hover:bg-white/[0.04]/[0.08] sm:w-auto"
                >
                  Open dashboard
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default CheckoutContent;
