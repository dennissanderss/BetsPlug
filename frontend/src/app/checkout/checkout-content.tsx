"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  Crown,
  Lock,
  Shield,
  Sparkles,
  Tag,
  User,
  MapPin,
  Wallet,
  ShieldCheck,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { CheckoutHeader } from "@/components/checkout/checkout-header";
import { CheckoutFooter } from "@/components/checkout/checkout-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import type { TranslationKey } from "@/i18n/messages";

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

const PLANS: PlanDef[] = [
  {
    id: "bronze",
    name: "Bronze",
    tagline: "pricing.bronzeTagline",
    icon: Shield,
    monthly: 0,
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
export function CheckoutContent() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const params = useSearchParams();

  // Plan from URL (default Gold, the popular plan)
  const planParam = (params?.get("plan") ?? "gold").toLowerCase() as PlanId;
  const initialPlan =
    PLANS.find((p) => p.id === planParam) ?? PLANS[2]; // default Gold

  const billingParam = (params?.get("billing") ?? "monthly") as Billing;
  const initialBilling: Billing =
    billingParam === "yearly" ? "yearly" : "monthly";

  const [plan, setPlan] = useState<PlanDef>(initialPlan);
  const [billing, setBilling] = useState<Billing>(initialBilling);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] =
    useState<"card" | "paypal">("card");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [agreed, setAgreed] = useState(false);

  /* ── Price derivation ─────────────────────────────────────── */
  const pricing = useMemo(() => {
    if (plan.oneTime != null) {
      const sub = plan.oneTime;
      const vat = sub * 0.21;
      return { sub, vat, total: sub + vat, period: "one-time" as const };
    }
    const baseMonthly = plan.monthly;
    const monthlyAfterDiscount =
      billing === "yearly" ? baseMonthly * 0.8 : baseMonthly;
    const sub =
      billing === "yearly" ? monthlyAfterDiscount * 12 : monthlyAfterDiscount;
    const vat = sub * 0.21;
    return {
      sub,
      vat,
      total: sub + vat,
      period: billing,
    };
  }, [plan, billing]);

  const isFreePlan = plan.monthly === 0 && plan.oneTime == null;

  /* ── Step navigation ──────────────────────────────────────── */
  const next = () => {
    if (step < 3) setStep(((step + 1) as 1 | 2 | 3));
  };
  const back = () => {
    if (step > 1) setStep(((step - 1) as 1 | 2 | 3));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    setSubmitting(true);
    // Simulate processing
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1400);
  };

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="relative min-h-screen bg-[#060912] text-white">
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
                        <Field label={t("checkout.firstName")}>
                          <input
                            required
                            type="text"
                            placeholder={t("checkout.firstNamePh")}
                            className={inputCls}
                          />
                        </Field>
                        <Field label={t("checkout.lastName")}>
                          <input
                            required
                            type="text"
                            placeholder={t("checkout.lastNamePh")}
                            className={inputCls}
                          />
                        </Field>
                        <Field
                          label={t("checkout.email")}
                          className="sm:col-span-2"
                        >
                          <input
                            required
                            type="email"
                            placeholder={t("checkout.emailPh")}
                            className={inputCls}
                          />
                        </Field>
                        <Field
                          label={t("checkout.password")}
                          hint={t("checkout.passwordHint")}
                        >
                          <input
                            required
                            type="password"
                            minLength={8}
                            placeholder={t("checkout.passwordPh")}
                            className={inputCls}
                          />
                        </Field>
                        <Field label={t("checkout.confirmPassword")}>
                          <input
                            required
                            type="password"
                            minLength={8}
                            placeholder={t("checkout.passwordPh")}
                            className={inputCls}
                          />
                        </Field>
                      </div>
                      <p className="mt-5 text-xs text-slate-500">
                        {t("checkout.alreadyHaveAccount")}{" "}
                        <Link
                          href={loc("/dashboard")}
                          className="font-semibold text-green-400 hover:text-green-300"
                        >
                          {t("checkout.signIn")}
                        </Link>
                      </p>
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
                        >
                          <select
                            required
                            className={inputCls}
                            defaultValue=""
                          >
                            <option value="" disabled>
                              {t("checkout.countryPh")}
                            </option>
                            <option value="NL">Netherlands</option>
                            <option value="BE">Belgium</option>
                            <option value="DE">Germany</option>
                            <option value="FR">France</option>
                            <option value="ES">Spain</option>
                            <option value="IT">Italy</option>
                            <option value="GB">United Kingdom</option>
                            <option value="US">United States</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </Field>
                        <Field
                          label={t("checkout.address")}
                          className="sm:col-span-2"
                        >
                          <input
                            required
                            type="text"
                            placeholder={t("checkout.addressPh")}
                            className={inputCls}
                          />
                        </Field>
                        <Field label={t("checkout.city")}>
                          <input
                            required
                            type="text"
                            placeholder={t("checkout.cityPh")}
                            className={inputCls}
                          />
                        </Field>
                        <Field label={t("checkout.postalCode")}>
                          <input
                            required
                            type="text"
                            placeholder={t("checkout.postalCodePh")}
                            className={inputCls}
                          />
                        </Field>
                        <Field
                          label={t("checkout.state")}
                          className="sm:col-span-2"
                        >
                          <input type="text" className={inputCls} />
                        </Field>
                        <Field label={t("checkout.company")}>
                          <input type="text" className={inputCls} />
                        </Field>
                        <Field label={t("checkout.vatId")}>
                          <input type="text" className={inputCls} />
                        </Field>
                      </div>
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

                      {/* Demo notice */}
                      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/[0.06] p-4">
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
                          >
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder={t("checkout.cardNumberPh")}
                                className={`${inputCls} pr-12`}
                              />
                              <CreditCard className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            </div>
                          </Field>
                          <Field label={t("checkout.cardExpiry")}>
                            <input
                              type="text"
                              placeholder={t("checkout.cardExpiryPh")}
                              className={inputCls}
                            />
                          </Field>
                          <Field label={t("checkout.cardCvc")}>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder={t("checkout.cardCvcPh")}
                              className={inputCls}
                            />
                          </Field>
                          <Field
                            label={t("checkout.cardName")}
                            className="sm:col-span-2"
                          >
                            <input
                              type="text"
                              placeholder={t("checkout.cardNamePh")}
                              className={inputCls}
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
                      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
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
                    <button
                      type="button"
                      onClick={next}
                      className="btn-gradient flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold tracking-tight text-black shadow-lg shadow-green-500/20"
                    >
                      {t("checkout.next")}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!agreed || submitting}
                      className="btn-gradient flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold tracking-tight text-black shadow-lg shadow-green-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting
                        ? t("checkout.processing")
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

function Field({
  label,
  hint,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      {children}
      {hint && <span className="text-[11px] text-slate-600">{hint}</span>}
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
}: {
  plan: PlanDef;
  billing: Billing;
  onToggleBilling: () => void;
  onChangePlan: (id: PlanId) => void;
  pricing: { sub: number; vat: number; total: number; period: string };
  isFreePlan: boolean;
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
        <div className="mt-4 grid grid-cols-3 gap-1.5">
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
            className={`col-span-3 rounded-xl border px-2 py-2 text-[11px] font-bold uppercase tracking-wider transition-all ${
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
          <div className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t("checkout.billingLabel")}
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
              className="relative inline-flex h-6 w-11 items-center rounded-full border border-white/[0.1] bg-white/[0.04] transition-colors"
              aria-label="Toggle billing period"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.6)] transition-transform ${
                  billing === "yearly" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        )}

        {/* Total breakdown */}
        <div className="mt-5 space-y-2 border-t border-white/[0.06] pt-5 text-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span>{t("checkout.subtotal")}</span>
            <span className="font-semibold text-slate-200">
              {formatEUR(pricing.sub)}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>{t("checkout.vat")}</span>
            <span className="font-semibold text-slate-200">
              {formatEUR(pricing.vat)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-base">
            <span className="font-bold text-white">{t("checkout.total")}</span>
            <span className="text-xl font-extrabold text-white">
              {formatEUR(pricing.total)}
            </span>
          </div>
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
