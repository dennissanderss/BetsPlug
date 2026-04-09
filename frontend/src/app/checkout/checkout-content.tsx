"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  Crown,
  FileText,
  Flame,
  Gift,
  Headphones,
  Info,
  Lock,
  PauseCircle,
  Shield,
  Sparkles,
  Tag,
  TrendingDown,
  User,
  MapPin,
  Wallet,
  ShieldCheck,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { CheckoutHeader } from "@/components/checkout/checkout-header";
import { CheckoutFooter } from "@/components/checkout/checkout-footer";
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
    oneTime: 299,
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
export function CheckoutContent() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const params = useSearchParams();
  const router = useRouter();

  // Plan from URL (default Gold, the popular plan)
  const planParam = (params?.get("plan") ?? "gold").toLowerCase() as PlanId;
  const initialPlan =
    PLANS.find((p) => p.id === planParam) ?? PLANS[2]; // default Gold

  const billingParam = (params?.get("billing") ?? "monthly") as Billing;
  const initialBilling: Billing =
    billingParam === "yearly" ? "yearly" : "monthly";

  const [plan, setPlan] = useState<PlanDef>(initialPlan);
  const [billing, setBilling] = useState<Billing>(initialBilling);
  // Add-ons are opt-in on Silver/Gold — users start with nothing
  // pre-selected and can tick whichever extras they want.
  // (Tip of the Day is still shown as "Included" on Platinum.)
  const [selectedUpsells, setSelectedUpsells] = useState<UpsellId[]>([]);
  // Trial is the default path (maximises free-trial conversions),
  // but users who already trust us can pick "Subscribe now".
  const [startWithTrial, setStartWithTrial] = useState<boolean>(true);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] =
    useState<"card" | "paypal">("card");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [agreed, setAgreed] = useState(false);

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
  const [card, setCard] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
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

  const setAccountField = <K extends keyof typeof account>(
    k: K,
    v: string
  ) => setAccount((p) => ({ ...p, [k]: v }));
  const setAddressField = <K extends keyof typeof address>(
    k: K,
    v: string
  ) => setAddress((p) => ({ ...p, [k]: v }));
  const setCardField = <K extends keyof typeof card>(k: K, v: string) =>
    setCard((p) => ({ ...p, [k]: v }));

  const toggleUpsell = (id: UpsellId) =>
    setSelectedUpsells((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  /* ── Per-step validation ──────────────────────────────────── */
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const accountErrors = useMemo(() => {
    const e: Partial<Record<keyof typeof account, string>> = {};
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
  }, [account]);

  const addressErrors = useMemo(() => {
    const e: Partial<Record<keyof typeof address, string>> = {};
    if (!address.country) e.country = "required";
    if (!address.street.trim()) e.street = "required";
    if (!address.city.trim()) e.city = "required";
    if (!address.postalCode.trim()) e.postalCode = "required";
    return e;
  }, [address]);

  const paymentErrors = useMemo(() => {
    const e: Partial<Record<keyof typeof card | "terms", string>> = {};
    if (paymentMethod === "card") {
      if (!card.number.trim()) e.number = "required";
      if (!card.expiry.trim()) e.expiry = "required";
      if (!card.cvc.trim()) e.cvc = "required";
      if (!card.name.trim()) e.name = "required";
    }
    if (!agreed) e.terms = "required";
    return e;
  }, [card, paymentMethod, agreed]);

  const step1Valid = Object.keys(accountErrors).length === 0;
  const step2Valid = Object.keys(addressErrors).length === 0;
  const step3Valid = Object.keys(paymentErrors).length === 0;

  // Which upsells are actually chargeable for this plan.
  // "Tip of the Day" is bundled into Platinum, so it's displayed
  // as "Included" and removed from the billable list.
  const isPlatinum = plan.id === "platinum";
  const chargeableUpsellIds = selectedUpsells.filter(
    (id) => !(isPlatinum && id === "tipOfDay")
  );

  // Free trial is only offered on recurring plans (not Bronze/free,
  // not Platinum lifetime).
  // Trial is only offered on real paid plans — Bronze (€0,01) is
  // effectively free and already skips most of the pricing friction.
  const trialAvailable =
    plan.monthly > 0.5 && plan.oneTime == null;
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
      // When the trial is active we still take a symbolic €0.01 charge
      // today via Stripe so we can verify the card is real. This is the
      // same fraud-protection mechanism as the Bronze tier — it stops
      // people from farming free trials with throwaway / fake cards.
      dueToday: trialActive ? 0.01 : recurring,
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
    if (step < 3) setStep(((step + 1) as 1 | 2 | 3));
  };
  const back = () => {
    if (step > 1) setStep(((step - 1) as 1 | 2 | 3));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTriedAdvance((prev) => ({ ...prev, 3: true }));
    if (!step3Valid) return;
    setSubmitting(true);
    // Simulate processing, then redirect to the welcome page.
    // The welcome page is the post-purchase "thank you" experience
    // and handles its own CTA back into the app.
    setTimeout(() => {
      const params = new URLSearchParams({
        plan: plan.id,
        billing,
        trial: trialActive ? "1" : "0",
      });
      router.push(`${loc("/welcome")}?${params.toString()}`);
    }, 1200);
  };

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#060912] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-40 h-[500px] w-[500px] rounded-full bg-green-500/[0.06] blur-[160px]" />
        <div className="absolute -right-40 bottom-40 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.05] blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(74,222,128,0.6) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <CheckoutHeader />

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10 md:py-14">
        {/* Page heading */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-green-400">
            <Lock className="h-3 w-3" />
            {t("checkout.demoBadge")}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            {t("checkout.pageTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
            {t("checkout.pageSubtitle")}
          </p>
        </div>

        {submitted ? (
          <SuccessState />
        ) : (
          <div className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            {/* ── Left column: stepper + form ───────────────── */}
            <div className="order-2 lg:order-1">
              {/* Trial picker — only on step 1 and only when
                  the selected plan actually supports a trial */}
              {step === 1 && trialAvailable && (
                <TrialPicker
                  startWithTrial={startWithTrial}
                  onChange={setStartWithTrial}
                  trialEndLabel={trialEndLabel}
                  recurring={pricing.recurring}
                />
              )}

              {/* Stepper */}
              <Stepper step={step} />

              <form
                onSubmit={handleSubmit}
                className="mt-6 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 backdrop-blur-xl sm:p-8"
              >
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
                      <p className="mt-5 text-xs text-slate-500">
                        {t("checkout.alreadyHaveAccount")}{" "}
                        <Link
                          href={loc("/login")}
                          className="font-semibold text-green-400 hover:text-green-300"
                        >
                          {t("checkout.signIn")}
                        </Link>
                      </p>

                      {/* Payment reassurance — white pill badges
                          matching the footer so the trust signals
                          look consistent across the site. */}
                      <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-4 sm:flex-row sm:gap-4">
                        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
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
                        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-green-500/30 bg-green-500/[0.06] p-4">
                          <Gift className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-green-300">
                              {t("checkout.trialBadge")}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-300">
                              {t("checkout.trialPaymentNote").replace(
                                "{date}",
                                trialEndLabel
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Demo notice */}
                      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] p-4">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                            {t("checkout.demoBadge")}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-300">
                            {t("checkout.demoNote")}
                          </p>
                        </div>
                      </div>

                      {/* Method selector */}
                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <PaymentOption
                          active={paymentMethod === "card"}
                          onClick={() => setPaymentMethod("card")}
                          title={t("checkout.payCard")}
                          desc={t("checkout.payCardDesc")}
                          icon={<CardBrandRow />}
                        />
                        <PaymentOption
                          active={paymentMethod === "paypal"}
                          onClick={() => setPaymentMethod("paypal")}
                          title={t("checkout.payPaypal")}
                          desc={t("checkout.payPaypalDesc")}
                          icon={<PayPalMark />}
                        />
                      </div>

                      {/* Card form */}
                      {paymentMethod === "card" && (
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                          <Field
                            label={t("checkout.cardNumber")}
                            className="sm:col-span-2"
                            error={
                              triedAdvance[3] && paymentErrors.number
                                ? true
                                : false
                            }
                          >
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder={t("checkout.cardNumberPh")}
                                value={card.number}
                                onChange={(e) =>
                                  setCardField("number", e.target.value)
                                }
                                className={`${inputClsFor(
                                  triedAdvance[3] && !!paymentErrors.number
                                )} pr-12`}
                              />
                              <CreditCard className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            </div>
                          </Field>
                          <Field
                            label={t("checkout.cardExpiry")}
                            error={
                              triedAdvance[3] && paymentErrors.expiry
                                ? true
                                : false
                            }
                          >
                            <input
                              type="text"
                              placeholder={t("checkout.cardExpiryPh")}
                              value={card.expiry}
                              onChange={(e) =>
                                setCardField("expiry", e.target.value)
                              }
                              className={inputClsFor(
                                triedAdvance[3] && !!paymentErrors.expiry
                              )}
                            />
                          </Field>
                          <Field
                            label={t("checkout.cardCvc")}
                            error={
                              triedAdvance[3] && paymentErrors.cvc
                                ? true
                                : false
                            }
                          >
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder={t("checkout.cardCvcPh")}
                              value={card.cvc}
                              onChange={(e) =>
                                setCardField("cvc", e.target.value)
                              }
                              className={inputClsFor(
                                triedAdvance[3] && !!paymentErrors.cvc
                              )}
                            />
                          </Field>
                          <Field
                            label={t("checkout.cardName")}
                            className="sm:col-span-2"
                            error={
                              triedAdvance[3] && paymentErrors.name
                                ? true
                                : false
                            }
                          >
                            <input
                              type="text"
                              placeholder={t("checkout.cardNamePh")}
                              value={card.name}
                              onChange={(e) =>
                                setCardField("name", e.target.value)
                              }
                              className={inputClsFor(
                                triedAdvance[3] && !!paymentErrors.name
                              )}
                            />
                          </Field>
                        </div>
                      )}

                      {paymentMethod === "paypal" && (
                        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                          <PayPalMark />
                          <p className="text-sm text-slate-300">
                            {t("checkout.paypalNote")}
                          </p>
                        </div>
                      )}

                      {/* Terms */}
                      <label
                        className={`mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border bg-white/[0.02] p-4 transition-colors ${
                          triedAdvance[3] && paymentErrors.terms
                            ? "border-red-500/60 bg-red-500/[0.05]"
                            : "border-white/[0.06]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent text-green-500 focus:ring-green-500"
                        />
                        <span className="text-xs leading-relaxed text-slate-400">
                          {t("checkout.agreeTerms")}{" "}
                          <Link
                            href={loc("/")}
                            className="font-semibold text-green-400 hover:text-green-300"
                          >
                            {t("checkout.termsLink")}
                          </Link>{" "}
                          {t("checkout.and")}{" "}
                          <Link
                            href={loc("/")}
                            className="font-semibold text-green-400 hover:text-green-300"
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
                <div className="mt-8 flex items-center justify-between gap-4 border-t border-white/[0.06] pt-6">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={back}
                      className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-300 transition-all hover:border-white/[0.2] hover:text-white"
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
                          className="btn-gradient flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold tracking-tight text-black shadow-lg shadow-green-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
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
                      className="btn-gradient flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold tracking-tight text-black shadow-lg shadow-green-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
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
                />

                {/* Trust strip */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-400" />
                    <span>{t("checkout.footer.guarantee")}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-green-400" />
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
  "w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-green-500/40 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-colors";

const inputClsError =
  "w-full rounded-xl border border-red-500/60 bg-red-500/[0.05] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-red-500/80 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-colors";

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
          error ? "text-red-400" : "text-slate-500"
        }`}
      >
        {label}
      </span>
      {children}
      {hint && !error && (
        <span className="text-[11px] text-slate-600">{hint}</span>
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
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/[0.08]">
        <Icon className="h-5 w-5 text-green-400" />
      </div>
      <div>
        <h2 className="text-xl font-extrabold text-white sm:text-2xl">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
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
    <ol className="flex items-center gap-3">
      {items.map((it, idx) => {
        const done = step > it.id;
        const active = step === it.id;
        return (
          <li
            key={it.id}
            className="flex flex-1 items-center gap-3 first:flex-none"
          >
            <div
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                done
                  ? "border-green-500/60 bg-green-500/20 text-green-300"
                  : active
                  ? "border-green-500/60 bg-green-500 text-black shadow-[0_0_20px_rgba(74,222,128,0.35)]"
                  : "border-white/[0.1] bg-white/[0.03] text-slate-500"
              }`}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : it.id}
            </div>
            <span
              className={`text-sm font-semibold transition-colors ${
                active || done ? "text-white" : "text-slate-500"
              }`}
            >
              {it.label}
            </span>
            {idx < items.length - 1 && (
              <span
                className={`mx-2 h-px flex-1 ${
                  done ? "bg-green-500/40" : "bg-white/[0.06]"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ── Payment method option tile ─────────────────────────────── */
function PaymentOption({
  active,
  onClick,
  title,
  desc,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
        active
          ? "border-green-500/60 bg-green-500/[0.08] shadow-[0_0_30px_rgba(74,222,128,0.15)]"
          : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.2]"
      }`}
    >
      <div className="flex h-10 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold text-white">{title}</div>
        <div className="text-xs text-slate-400">{desc}</div>
      </div>
      <div
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-all ${
          active
            ? "border-green-400 bg-green-500"
            : "border-white/20 bg-transparent"
        }`}
      >
        {active && <Check className="h-3 w-3 text-black" strokeWidth={4} />}
      </div>
    </button>
  );
}

function CardBrandRow() {
  return (
    <div className="flex items-center gap-0.5">
      <span className="rounded bg-white px-1 py-0.5 text-[8px] font-extrabold italic text-blue-700">
        VISA
      </span>
      <span className="flex gap-0.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500 opacity-90" />
        <span className="-ml-1.5 h-2.5 w-2.5 rounded-full bg-amber-400 opacity-90" />
      </span>
    </div>
  );
}

function PayPalMark() {
  return (
    <span className="text-[10px] font-extrabold">
      <span className="text-[#003087]">Pay</span>
      <span className="text-[#009cde]">Pal</span>
    </span>
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
}) {
  const { t } = useTranslations();
  const Icon = plan.icon;
  const isOneTime = plan.oneTime != null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-6 backdrop-blur-xl">
      {/* glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-[240px] w-[240px] rounded-full bg-green-500/[0.12] blur-[90px]" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
            {t("checkout.summaryTitle")}
          </h3>
          <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-green-400">
            <Lock className="h-3 w-3" />
            SSL
          </span>
        </div>

        {/* Plan row */}
        <div className="mt-5 flex items-start gap-3">
          <div
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
              plan.highlight
                ? "bg-green-500/20 shadow-[0_0_20px_rgba(74,222,128,0.3)]"
                : "bg-green-500/10"
            }`}
          >
            <Icon className="h-5 w-5 text-green-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <h4 className="text-lg font-extrabold text-white">
                {plan.name}
              </h4>
              {isOneTime ? (
                <span className="text-xl font-extrabold text-white">
                  {formatEUR(plan.oneTime ?? 0)}
                </span>
              ) : (
                <span className="text-xl font-extrabold text-white">
                  {formatEUR(
                    billing === "yearly" ? plan.monthly * 0.8 : plan.monthly
                  )}
                  <span className="text-xs font-semibold text-slate-500">
                    {t("checkout.perMonth")}
                  </span>
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-400">{t(plan.tagline)}</p>
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
                    ? "border-green-500/60 bg-green-500/15 text-green-300"
                    : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/[0.16] hover:text-white"
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
                ? "border-amber-400/60 bg-amber-400/15 text-amber-300"
                : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-amber-400/30 hover:text-amber-200"
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
                  ? "border-green-500/30 bg-green-500/[0.06]"
                  : "border-white/[0.06] bg-white/[0.02]"
              }`}
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t("checkout.billingLabel")}
                  <span className="inline-flex items-center rounded-full border border-green-500/40 bg-green-500/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-green-300">
                    {t("checkout.yearlySaveBadge")}
                  </span>
                </div>
                <div className="text-sm font-bold text-white">
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
                    ? "border-green-500/60 bg-green-500/20"
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
                className="mt-2 flex w-full items-start gap-2 rounded-xl border border-green-500/25 bg-green-500/[0.06] px-3 py-2.5 text-left transition-all hover:border-green-500/50 hover:bg-green-500/[0.1]"
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
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-green-500/25 bg-green-500/[0.06] px-3 py-2.5">
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
          <div className="flex items-center justify-between text-slate-400">
            <span>{t("checkout.subtotal")}</span>
            <span className="font-semibold text-slate-200">
              {formatEUR(pricing.planTotal)}
            </span>
          </div>
          {pricing.addons > 0 && (
            <div className="flex items-center justify-between text-slate-400">
              <span>
                {t("checkout.addons")}{" "}
                <span className="text-[10px] text-slate-600">
                  ({selectedUpsells.length})
                </span>
              </span>
              <span className="font-semibold text-slate-200">
                {formatEUR(pricing.addons)}
              </span>
            </div>
          )}

          {/* When trial is active, show both the €0 due today and
              the next charge to set expectations clearly. */}
          {trialActive ? (
            <>
              <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-sm text-slate-400">
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
                  {formatEUR(0.01)}
                </span>
              </div>
              <div className="mt-2 flex items-start gap-2 rounded-xl border border-green-500/25 bg-green-500/[0.06] p-3">
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
              <div className="mt-2 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <PauseCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                <span className="text-[11px] leading-snug text-slate-400">
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
          <p className="text-[10px] text-slate-600">
            {t("checkout.vatIncluded")}
          </p>
        </div>

        {/* Coupon */}
        <div className="mt-5 flex items-stretch gap-2">
          <div className="relative flex-1">
            <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder={t("checkout.couponPlaceholder")}
              className="h-10 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] pl-9 pr-3 text-sm text-white placeholder:text-slate-600 focus:border-green-500/40 focus:outline-none"
            />
          </div>
          <button
            type="button"
            className="rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 text-xs font-bold uppercase tracking-wider text-white transition-all hover:border-green-500/40 hover:bg-green-500/[0.08]"
          >
            {t("checkout.couponApply")}
          </button>
        </div>

        {/* Trial note */}
        <p className="mt-4 rounded-xl border border-green-500/20 bg-green-500/[0.06] p-3 text-[11px] leading-relaxed text-slate-300">
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
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/[0.08]">
          <Gift className="h-5 w-5 text-green-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-extrabold text-white sm:text-xl">
            {t("checkout.trialSectionTitle")}
          </h3>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
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
              ? "border-green-500/60 bg-green-500/[0.08] shadow-[0_0_30px_rgba(74,222,128,0.15)]"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.2]"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-all ${
                  startWithTrial
                    ? "border-green-400 bg-green-500"
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
            <span className="inline-flex items-center rounded-full border border-green-500/40 bg-green-500/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-green-300">
              {t("checkout.trialOption1Badge")}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
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
              ? "border-green-500/60 bg-green-500/[0.08] shadow-[0_0_30px_rgba(74,222,128,0.15)]"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.2]"
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-all ${
                !startWithTrial
                  ? "border-green-400 bg-green-500"
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
          <p className="text-xs leading-relaxed text-slate-400">
            {t("checkout.trialOption2Desc")}
          </p>
          <div className="mt-1 text-xs font-bold text-white">
            {formatEUR(recurring)} today
          </div>
        </button>
      </div>

      {/* Side note — cancelling during trial pauses the account */}
      {startWithTrial && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <PauseCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
          <span className="text-[11px] leading-snug text-slate-400">
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
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/[0.08]">
          <Sparkles className="h-5 w-5 text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-white sm:text-xl">
            {t("checkout.upsellsTitle")}
          </h3>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            {t("checkout.upsellsSubtitle")}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {UPSELLS.map((u) => {
          const Icon = u.icon;
          const included = isPlatinum && u.id === "tipOfDay";
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
                  ? "border-green-500/60 bg-green-500/[0.08] shadow-[0_0_30px_rgba(74,222,128,0.12)]"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04]"
              }`}
            >
              {/* Checkbox */}
              <div
                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-all ${
                  disabled
                    ? "border-amber-400 bg-amber-400/80"
                    : active
                    ? "border-green-400 bg-green-500"
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
                    ? "bg-green-500/20"
                    : "bg-white/[0.04] group-hover:bg-white/[0.08]"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    disabled
                      ? "text-amber-300"
                      : active
                      ? "text-green-400"
                      : "text-slate-400"
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
                      <span className="inline-flex items-center rounded-full border border-green-500/40 bg-green-500/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-green-300">
                        {t(u.badgeKey)}
                      </span>
                    )
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
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
                    <div className="text-[10px] text-slate-500">
                      {t("checkout.upsellPerMonth")}
                    </div>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] text-slate-600">
        {billing === "yearly"
          ? t("checkout.vatIncluded")
          : t("checkout.vatIncluded")}
      </p>
    </div>
  );
}

/* ── Success state ──────────────────────────────────────────── */
function SuccessState() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto mt-14 max-w-2xl rounded-3xl border border-green-500/30 bg-gradient-to-br from-green-500/[0.12] via-emerald-500/[0.05] to-transparent p-10 text-center backdrop-blur-xl"
    >
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 shadow-[0_0_40px_rgba(74,222,128,0.35)]">
        <CheckCircle2 className="h-8 w-8 text-green-400" />
      </div>
      <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
        {t("checkout.successTitle")}
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-300">
        {t("checkout.successBody")}
      </p>
      <Link
        href={loc("/dashboard")}
        className="btn-gradient mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold tracking-tight text-black shadow-lg shadow-green-500/20"
      >
        {t("checkout.successCta")}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}

export default CheckoutContent;
