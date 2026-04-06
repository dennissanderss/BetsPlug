"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  Zap,
  Star,
  Building2,
  Users,
  Gift,
  ArrowRight,
  ExternalLink,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PricingPlan {
  id: string;
  name: string;
  badge?: string;
  regularPrice: string;
  memberPrice: string | null;
  saving: string | null;
  isCustom?: boolean;
  features: string[];
  cta: string;
  ctaVariant: "gradient" | "outline" | "ghost";
  icon: React.ElementType;
  highlight?: boolean;
}

// ─── Referral link box ────────────────────────────────────────────────────────

function ReferralLinkBox({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // fallback: no-op
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex items-stretch gap-0 overflow-hidden rounded-xl border border-white/[0.1]">
      <div className="flex-1 bg-white/[0.04] px-4 py-2.5 font-mono text-sm text-slate-300 truncate min-w-0 flex items-center">
        {link}
      </div>
      <button
        onClick={handleCopy}
        className={cn(
          "flex shrink-0 items-center gap-1.5 border-l border-white/[0.1] px-4 py-2.5 text-xs font-semibold transition-all duration-200",
          copied
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-white/[0.06] text-slate-300 hover:bg-blue-500/15 hover:text-blue-300"
        )}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy
          </>
        )}
      </button>
    </div>
  );
}

// ─── Plan feature list ────────────────────────────────────────────────────────

function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="mt-4 space-y-2">
      {features.map((f) => (
        <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          {f}
        </li>
      ))}
    </ul>
  );
}

// ─── Pricing card ─────────────────────────────────────────────────────────────

function PricingCard({ plan }: { plan: PricingPlan }) {
  const Icon = plan.icon;

  return (
    <div
      className={cn(
        "glass-card-hover relative flex flex-col p-6 transition-all duration-200",
        plan.highlight &&
          "border-blue-500/30 bg-blue-500/[0.04] glow-blue"
      )}
    >
      {/* Popular badge */}
      {plan.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/40 bg-[#0a0e1a] px-3 py-1 text-[11px] font-bold text-blue-400">
            <Star className="h-3 w-3" />
            Most Popular
          </span>
        </div>
      )}

      {/* Plan header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
          <Icon className="h-5 w-5 text-blue-400" />
        </div>
        {plan.badge && (
          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
            {plan.badge}
          </span>
        )}
      </div>

      <h3 className="mt-3 text-base font-bold text-slate-100">{plan.name}</h3>

      {/* Pricing */}
      <div className="mt-3">
        {plan.isCustom ? (
          <p className="text-2xl font-extrabold gradient-text">Custom pricing</p>
        ) : (
          <div className="flex items-end gap-2">
            <p className="text-2xl font-extrabold gradient-text">{plan.memberPrice}</p>
            <p className="mb-0.5 text-sm text-slate-500 line-through">{plan.regularPrice}</p>
          </div>
        )}
        {!plan.isCustom && (
          <p className="text-xs text-slate-500 mt-0.5">per month</p>
        )}
        {plan.saving && (
          <span className="mt-2 inline-block rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
            {plan.saving}
          </span>
        )}
      </div>

      {/* Features */}
      <FeatureList features={plan.features} />

      {/* CTA */}
      <div className="mt-6 flex-1 flex items-end">
        <button
          className={cn(
            "w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-150",
            plan.ctaVariant === "gradient" &&
              "btn-gradient text-white",
            plan.ctaVariant === "outline" &&
              "border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50",
            plan.ctaVariant === "ghost" &&
              "border border-white/[0.1] text-slate-300 hover:bg-white/[0.06] hover:text-slate-100"
          )}
        >
          {plan.cta}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Referral step ────────────────────────────────────────────────────────────

function ReferralStep({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-lg font-extrabold text-blue-400 glow-blue-sm">
        {step}
        {step < 3 && (
          <ArrowRight className="absolute -right-7 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 hidden sm:block" />
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-200">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "blue" | "green" | "amber";
}) {
  const styles = {
    blue:  "bg-blue-500/10  border-blue-500/20  text-blue-400",
    green: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  };

  return (
    <div className={cn("rounded-xl border px-5 py-4 text-center", styles[color])}>
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="mt-0.5 text-xs font-medium opacity-80">{label}</p>
    </div>
  );
}

// ─── Plans data ───────────────────────────────────────────────────────────────

const PLANS: PricingPlan[] = [
  {
    id: "annual",
    name: "SIP Pro — Annual",
    badge: "Best value",
    regularPrice: "$29.99/mo",
    memberPrice:  "$23.99/mo",
    saving:       "Save $72/year",
    features: [
      "Unlimited predictions",
      "All betting strategies",
      "Priority match alerts",
      "Full API access",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Claim Discount",
    ctaVariant: "gradient",
    icon: Zap,
    highlight: true,
  },
  {
    id: "monthly",
    name: "SIP Pro — Monthly",
    regularPrice: "$39.99/mo",
    memberPrice:  "$31.99/mo",
    saving:       "Save $8/month",
    features: [
      "Unlimited predictions",
      "All betting strategies",
      "Priority match alerts",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Claim Discount",
    ctaVariant: "outline",
    icon: Star,
    highlight: false,
  },
  {
    id: "enterprise",
    name: "SIP Enterprise",
    regularPrice: "—",
    memberPrice:  null,
    saving:       null,
    isCustom:     true,
    features: [
      "Custom ML models",
      "Dedicated account support",
      "White-label integration",
      "Bulk API access",
      "SLA guarantee",
      "Team management",
    ],
    cta: "Contact Sales",
    ctaVariant: "ghost",
    icon: Building2,
    highlight: false,
  },
];

const REFERRAL_LINK = "https://sip.io/ref/DVB_2024";

// ─── Deals page ───────────────────────────────────────────────────────────────

export default function DealsPage() {
  return (
    <div className="max-w-5xl space-y-10 animate-fade-in">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight gradient-text">Exclusive Deals</h1>
          <p className="mt-1.5 text-sm text-slate-400">Special offers for SIP members</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400">
          <Lock className="h-3 w-3" />
          Members Only
        </span>
      </div>

      {/* ── Hero banner ──────────────────────────────────────────────────────── */}
      <div
        className="glass-card relative overflow-hidden p-8 animate-slide-up"
        style={{
          borderColor: "rgba(59,130,246,0.25)",
          background:
            "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(34,211,238,0.04) 100%)",
        }}
      >
        {/* Background glow blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, rgba(34,211,238,0.5) 0%, transparent 70%)",
          }}
        />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                <Gift className="h-3 w-3" />
                Member reward
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-100 leading-tight">
              Get{" "}
              <span className="gradient-text">20% OFF</span>
              {" "}your SIP Pro subscription
            </h2>
            <p className="text-sm text-slate-400 max-w-md">
              Exclusive discount unlocked for your account. Share your referral link with
              friends and earn credits for every successful sign-up.
            </p>
          </div>

          {/* Referral link */}
          <div className="shrink-0 w-full sm:max-w-sm space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Your referral link
            </p>
            <ReferralLinkBox link={REFERRAL_LINK} />
            <p className="text-[11px] text-slate-600">
              Both you and your friend get 1 month free
            </p>
          </div>
        </div>
      </div>

      {/* ── Partner Deals ────────────────────────────────────────────────────── */}
      <div className="animate-slide-up">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-slate-100">Partner Deals</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Choose the plan that fits your workflow — all prices reflect your member discount
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>

      {/* ── Referral Program ─────────────────────────────────────────────────── */}
      <div className="glass-card p-6 animate-slide-up">
        <div className="flex items-start gap-3 border-b border-white/[0.06] pb-5 mb-6">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Referral Program</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Earn credits by inviting friends to SIP
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-5">
            How it works
          </p>
          <div className="grid gap-8 sm:grid-cols-3 relative">
            {/* Connector line (decorative) */}
            <div
              aria-hidden
              className="pointer-events-none absolute top-6 left-[calc(16.666%+16px)] right-[calc(16.666%+16px)] h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent hidden sm:block"
            />
            <ReferralStep
              step={1}
              title="Share your unique link"
              description="Copy and send your personal referral URL to friends or post on socials"
            />
            <ReferralStep
              step={2}
              title="Friend signs up and subscribes"
              description="Your friend creates an account and picks any paid SIP plan"
            />
            <ReferralStep
              step={3}
              title="Both get 1 month free"
              description="Credits are applied automatically to both accounts within 24 hours"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-3">
            Your referral stats
          </p>
          <div className="grid grid-cols-3 gap-3">
            <StatPill label="Total Referrals" value="3"      color="blue"  />
            <StatPill label="Active"           value="2"      color="green" />
            <StatPill label="Credits Earned"   value="$47.98" color="amber" />
          </div>
        </div>

        {/* Referral link in section */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Your referral link
          </p>
          <ReferralLinkBox link={REFERRAL_LINK} />
        </div>
      </div>

      {/* ── FAQ teaser ───────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5 flex items-start gap-3 animate-slide-up">
        <ExternalLink className="h-4 w-4 shrink-0 mt-0.5 text-slate-500" />
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="text-slate-400 font-medium">Disclaimer: </span>
          Affiliate links and referral programs are subject to terms and conditions. Discounts
          apply to new and renewing subscriptions only. Credits are non-transferable and may not
          be exchanged for cash. SIP reserves the right to modify or terminate the referral program
          at any time with prior notice.
        </p>
      </div>
    </div>
  );
}
