"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Check,
  Star,
  Zap,
  Crown,
  ArrowLeft,
  Shield,
  ChevronRight,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type PlanId = "1month" | "3months" | "6months" | "lifetime";

interface Plan {
  id: PlanId;
  name: string;
  duration: string;
  badge?: string;
  badgeColor?: string;
  type: string;
  pricePerMonth: string;
  totalPrice: string;
  save?: string;
  access: string;
  technology: string;
  winRate: string;
  features: string[];
  highlighted?: boolean;
}

// ─── Plan Data ──────────────────────────────────────────────────────────────

const plans: Plan[] = [
  {
    id: "1month",
    name: "Basic",
    duration: "1 Month",
    type: "Basic",
    pricePerMonth: "15.99",
    totalPrice: "15.99",
    access: "Full Access",
    technology: "NT Apex",
    winRate: "75%",
    features: [
      "All daily predictions",
      "Win probability analysis",
      "Basic match insights",
      "Email support",
    ],
  },
  {
    id: "3months",
    name: "Standard",
    duration: "3 Months",
    badge: "Most Popular",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    type: "Standard",
    pricePerMonth: "11.99",
    totalPrice: "35.97",
    save: "12",
    access: "Full Access",
    technology: "NT Apex",
    winRate: "75%",
    highlighted: true,
    features: [
      "All daily predictions",
      "Win probability analysis",
      "Bet of the Day highlights",
      "Strategy backtesting",
      "Priority email support",
    ],
  },
  {
    id: "6months",
    name: "Premium",
    duration: "6 Months",
    badge: "Best Deal",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    type: "Premium",
    pricePerMonth: "9.49",
    totalPrice: "56.94",
    save: "39",
    access: "Full Access",
    technology: "NT Apex",
    winRate: "75%",
    features: [
      "All daily predictions",
      "Win probability analysis",
      "Bet of the Day highlights",
      "Strategy backtesting",
      "Advanced analytics & API",
      "Priority support",
    ],
  },
];

const lifetimePlan = {
  id: "lifetime" as PlanId,
  name: "Club Member",
  price: "199.99",
  features: [
    "One-Time Payment",
    "Lifetime Access",
    "Dedicated Support",
    "Early Access to New Features",
  ],
};

// ─── Plan Card ──────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`glass-card-hover relative cursor-pointer p-6 transition-all ${
        selected
          ? "border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
          : plan.highlighted
          ? "border-emerald-500/30"
          : ""
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-6">
          <span
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${plan.badgeColor}`}
          >
            {plan.badge === "Most Popular" ? (
              <Zap className="h-3 w-3" />
            ) : (
              <Star className="h-3 w-3" />
            )}
            {plan.badge}
          </span>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">{plan.duration}</h3>
        <div
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
            selected
              ? "border-blue-500 bg-blue-500"
              : "border-white/20"
          }`}
        >
          {selected && <div className="h-2 w-2 rounded-full bg-white" />}
        </div>
      </div>

      <div className="mb-4 border-t border-dashed border-white/[0.1] pt-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-emerald-400 font-semibold">Access</span>
            <p className="mt-1 font-medium text-white">{plan.access}</p>
          </div>
          <div>
            <span className="text-emerald-400 font-semibold">Technology</span>
            <p className="mt-1 font-medium text-white">{plan.technology}</p>
          </div>
          <div>
            <span className="text-emerald-400 font-semibold">Save</span>
            <p className="mt-1 font-medium text-white">
              {plan.save ? (
                <>
                  {plan.save}&euro;{" "}
                  <span className="text-amber-400">&#x1F4B0;</span>
                </>
              ) : (
                "-"
              )}
            </p>
          </div>
          <div>
            <span className="text-emerald-400 font-semibold">Win Rate</span>
            <p className="mt-1 font-medium text-white">{plan.winRate}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.06] pt-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-400 font-semibold">Type</span>
            <p className="text-sm font-medium text-white">{plan.type}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-emerald-400 font-semibold">Price/Month</span>
            <p className="text-2xl font-extrabold text-white">
              {plan.pricePerMonth}&euro;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("3months");

  const currentPlan =
    selectedPlan === "lifetime"
      ? null
      : plans.find((p) => p.id === selectedPlan)!;

  const checkoutTotal =
    selectedPlan === "lifetime"
      ? lifetimePlan.price
      : currentPlan?.totalPrice ?? "0";

  const checkoutType =
    selectedPlan === "lifetime"
      ? "Lifetime"
      : currentPlan?.duration ?? "";

  const checkoutName =
    selectedPlan === "lifetime"
      ? lifetimePlan.name
      : currentPlan?.type ?? "";

  return (
    <div className="min-h-screen">
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0e1a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              Sport<span className="text-blue-400">Bet</span>Tool
            </span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 pt-28 pb-20">
        {/* ── Header ── */}
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block rounded-full bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400">
            Choose Your Plan
          </span>
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
            Unlock Premium <span className="gradient-text">Predictions</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Get access to all our AI-powered predictions, strategy tools, and analytics.
            Choose the plan that works best for you.
          </p>
        </div>

        {/* ── Plan Cards ── */}
        <div className="mb-8 grid gap-5 sm:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={selectedPlan === plan.id}
              onSelect={() => setSelectedPlan(plan.id)}
            />
          ))}
        </div>

        {/* ── Lifetime Option ── */}
        <div
          onClick={() => setSelectedPlan("lifetime")}
          className={`glass-card-hover mb-8 cursor-pointer p-6 transition-all ${
            selectedPlan === "lifetime"
              ? "border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
              : ""
          }`}
        >
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  Lifetime
                </span>
                <Crown className="h-4 w-4 text-amber-400" />
              </div>
              <h3 className="mt-1 text-xl font-bold text-white">{lifetimePlan.name}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {lifetimePlan.features.map((f) => (
                  <span
                    key={f}
                    className="flex items-center gap-1.5 text-xs text-slate-400"
                  >
                    <Check className="h-3 w-3 text-emerald-400" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-3xl font-extrabold text-white">&euro;{lifetimePlan.price}</p>
                <p className="text-xs text-slate-500">One-Time Payment</p>
              </div>
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                  selectedPlan === "lifetime"
                    ? "border-blue-500 bg-blue-500"
                    : "border-white/20"
                }`}
              >
                {selectedPlan === "lifetime" && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Checkout Details ── */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.05] px-6 py-4">
            <h2 className="text-lg font-bold text-white">Checkout Details</h2>
            <span className="text-sm font-semibold text-emerald-400">
              3-Day Money-Back Guarantee
            </span>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div>
                <span className="text-xs font-semibold text-emerald-400">Package Name</span>
                <p className="mt-1 text-sm font-medium text-white">{checkoutName}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-400">Access</span>
                <p className="mt-1 text-sm font-medium text-white">Full Access</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-400">Type</span>
                <p className="mt-1 text-sm font-medium text-white">{checkoutType}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-400">Total Checkout</span>
                <p className="mt-1 text-2xl font-extrabold text-white">{checkoutTotal}&euro;</p>
              </div>
            </div>

            <button
              onClick={async () => {
                try {
                  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
                  const res = await fetch(`${API_BASE}/subscriptions/create-checkout`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      plan: selectedPlan === "lifetime" ? "lifetime" : plans.find(p => p.id === selectedPlan)?.id,
                      success_url: `${window.location.origin}/subscriptions?success=true`,
                      cancel_url: `${window.location.origin}/subscriptions?cancelled=true`,
                    }),
                  });
                  const data = await res.json();
                  if (data.checkout_url) {
                    window.location.href = data.checkout_url;
                  }
                } catch (err) {
                  console.error("Checkout error:", err);
                }
              }}
              className="btn-gradient mt-6 flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-bold text-white shadow-lg shadow-blue-500/25"
            >
              Proceed to Payment
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-emerald-500" />
                Secure Payment
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                Instant Access
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                Cancel Anytime
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} BetsPlug. All rights reserved.
            Predictions are for informational purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}
