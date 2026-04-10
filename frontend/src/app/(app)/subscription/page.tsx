"use client";

/**
 * Subscription page
 * ─────────────────
 * Shows the current plan, renewal status and management actions for the
 * logged-in user. Uses React Query so that mutations can invalidate the
 * cached subscription record.
 *
 * The backend is wired through `api.getMySubscription()` and
 * `api.cancelMySubscription()` — both provided by the Auth Core agent
 * running in parallel on `@/lib/api`.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Crown,
  Calendar,
  CreditCard,
  X,
  Check,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Infinity as InfinityIcon,
  Copy,
  ShieldCheck,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { MySubscription } from "@/types/api";

// ─── Plan visuals ───────────────────────────────────────────────────────────

type PlanKey = "bronze" | "silver" | "gold" | "platinum";

function normalizePlan(plan: string | null): PlanKey | null {
  if (!plan) return null;
  const p = plan.toLowerCase();
  if (p.includes("platinum")) return "platinum";
  if (p.includes("gold")) return "gold";
  if (p.includes("silver")) return "silver";
  if (p.includes("bronze")) return "bronze";
  return null;
}

const PLAN_VISUALS: Record<
  PlanKey,
  {
    label: string;
    gradient: string;
    ring: string;
    text: string;
    glow: string;
    chip: string;
  }
> = {
  bronze: {
    label: "Bronze",
    gradient: "from-orange-500/40 to-amber-700/30",
    ring: "border-amber-500/30",
    text: "text-amber-200",
    glow: "shadow-[0_0_30px_rgba(217,119,6,0.25)]",
    chip: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  },
  silver: {
    label: "Silver",
    gradient: "from-slate-300/30 to-slate-500/20",
    ring: "border-slate-300/25",
    text: "text-slate-100",
    glow: "shadow-[0_0_30px_rgba(148,163,184,0.25)]",
    chip: "bg-slate-500/10 text-slate-200 border-slate-300/30",
  },
  gold: {
    label: "Gold",
    gradient: "from-yellow-400/40 to-amber-500/25",
    ring: "border-yellow-400/30",
    text: "text-yellow-200",
    glow: "shadow-[0_0_35px_rgba(250,204,21,0.3)]",
    chip: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
  },
  platinum: {
    label: "Platinum",
    gradient: "from-cyan-300/35 via-fuchsia-400/25 to-purple-500/30",
    ring: "border-cyan-300/30",
    text: "text-cyan-100",
    glow: "shadow-[0_0_40px_rgba(103,232,249,0.3)]",
    chip: "bg-cyan-500/10 text-cyan-200 border-cyan-400/30",
  },
};

// ─── Status pill ────────────────────────────────────────────────────────────

function statusStyle(status: string | null): {
  label: string;
  className: string;
} {
  const s = (status ?? "").toLowerCase();
  if (s === "active")
    return {
      label: "Active",
      className:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    };
  if (s === "trialing")
    return {
      label: "Trialing",
      className: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    };
  if (s === "cancelled" || s === "canceled")
    return {
      label: "Cancelled",
      className: "border-slate-500/30 bg-slate-500/10 text-slate-300",
    };
  if (s === "expired")
    return {
      label: "Expired",
      className: "border-red-500/30 bg-red-500/10 text-red-300",
    };
  if (s === "past_due" || s === "past due")
    return {
      label: "Past due",
      className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    };
  return {
    label: status ?? "Unknown",
    className: "border-slate-500/20 bg-slate-500/5 text-slate-400",
  };
}

// ─── Cancel confirmation modal ─────────────────────────────────────────────

function CancelModal({
  open,
  onClose,
  onConfirm,
  loading,
  periodEnd,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  periodEnd: string | null;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-amber-500/30 p-6 shadow-2xl"
        style={{
          background: "rgba(17, 24, 39, 0.98)",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(245,158,11,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              Cancel your subscription?
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
              You&apos;ll keep full access until{" "}
              <span className="font-semibold text-slate-200">
                {periodEnd ? formatDate(periodEnd) : "the end of your current period"}
              </span>
              . After that your plan will not renew.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-slate-100"
          >
            Keep subscription
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-3.5 w-3.5" />
            {loading ? "Cancelling..." : "Yes, cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Info row ──────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
      <div className="flex min-w-0 items-start gap-2.5">
        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            {label}
          </p>
          <div className="mt-1 text-sm font-medium text-slate-200">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const { data, isLoading, error, refetch } = useQuery<MySubscription>({
    queryKey: ["my-subscription"],
    queryFn: () => api.getMySubscription(),
    retry: false,
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.cancelMySubscription(),
    onSuccess: (updated) => {
      queryClient.setQueryData(["my-subscription"], updated);
      setCancelOpen(false);
      refetch();
    },
  });

  const copyCustomerId = () => {
    if (!data?.stripe_customer_id) return;
    try {
      navigator.clipboard.writeText(data.stripe_customer_id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const hasSubscription = !!data?.has_subscription;
  const planKey = normalizePlan(data?.plan ?? null);
  const planVisuals = planKey ? PLAN_VISUALS[planKey] : null;
  const status = statusStyle(data?.status ?? null);

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-fade-in pb-16">
      {/* Page header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-100">
          <span className="gradient-text">Subscription</span>
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          View and manage your BetsPlug membership.
        </p>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error || !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !hasSubscription ? (
        <NoSubscriptionState onSubscribe={() => router.push("/checkout?plan=gold")} />
      ) : (
        <div className="space-y-6">
          {/* ── Hero plan card ───────────────────────────────────────────── */}
          <div
            className={cn(
              "glass-card relative overflow-hidden p-7 animate-slide-up",
              planVisuals?.ring,
              planVisuals?.glow
            )}
          >
            {/* Decorative gradient background */}
            <div
              className={cn(
                "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60",
                planVisuals?.gradient ?? "from-blue-500/10 to-purple-500/5"
              )}
            />
            <div className="relative">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl border",
                        planVisuals?.ring,
                        "bg-white/[0.05]"
                      )}
                    >
                      <Crown
                        className={cn(
                          "h-5 w-5",
                          planVisuals?.text ?? "text-slate-200"
                        )}
                      />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                        Your plan
                      </p>
                      <h2
                        className={cn(
                          "text-3xl font-bold tracking-tight",
                          planVisuals?.text ?? "text-slate-100"
                        )}
                      >
                        {planVisuals?.label ?? data.plan ?? "Unknown"}
                      </h2>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                        status.className
                      )}
                    >
                      <Check className="h-3 w-3" />
                      {status.label}
                    </span>
                    {data.is_lifetime && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-fuchsia-300">
                        <InfinityIcon className="h-3 w-3" />
                        Lifetime
                      </span>
                    )}
                    {data.cancel_at_period_end && !data.is_lifetime && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                        <AlertTriangle className="h-3 w-3" />
                        Cancelling
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-300">
                    {data.is_lifetime ? (
                      <>Lifetime access — no renewal needed. Enjoy BetsPlug forever.</>
                    ) : data.cancel_at_period_end ? (
                      <>
                        Cancels on{" "}
                        <span className="font-semibold text-amber-300">
                          {data.current_period_end
                            ? formatDate(data.current_period_end)
                            : "end of period"}
                        </span>
                      </>
                    ) : data.current_period_end ? (
                      <>
                        Renews on{" "}
                        <span className="font-semibold text-slate-100">
                          {formatDate(data.current_period_end)}
                        </span>
                      </>
                    ) : (
                      <>Active subscription</>
                    )}
                  </p>
                </div>

                {/* Plan badge (mirror) */}
                <div
                  className={cn(
                    "relative hidden h-24 w-24 shrink-0 items-center justify-center rounded-2xl border sm:flex",
                    planVisuals?.ring ?? "border-white/10",
                    "bg-white/[0.03]"
                  )}
                >
                  <Crown
                    className={cn(
                      "h-10 w-10",
                      planVisuals?.text ?? "text-slate-200"
                    )}
                  />
                  {planKey === "platinum" && (
                    <Sparkles className="absolute -right-1.5 -top-1.5 h-5 w-5 text-cyan-200" />
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/[0.08] pt-5">
                {!data.is_lifetime && planKey !== "platinum" && (
                  <button
                    onClick={() => router.push("/checkout?plan=platinum")}
                    className="btn-gradient inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg"
                  >
                    <Sparkles className="h-4 w-4" />
                    Upgrade to Platinum
                  </button>
                )}
                {!data.is_lifetime && !data.cancel_at_period_end && (
                  <button
                    onClick={() => setCancelOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-red-500/30 hover:bg-red-500/[0.08] hover:text-red-300"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel subscription
                  </button>
                )}
                {data.cancel_at_period_end && !data.is_lifetime && (
                  <button
                    onClick={() => router.push("/checkout?plan=gold")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/15"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Reactivate
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Details grid ─────────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow
              icon={Calendar}
              label={data.cancel_at_period_end ? "Cancels on" : "Next renewal"}
            >
              {data.is_lifetime ? (
                <span className="text-slate-300">Never — lifetime plan</span>
              ) : data.current_period_end ? (
                formatDate(data.current_period_end)
              ) : (
                "—"
              )}
            </InfoRow>
            <InfoRow icon={ShieldCheck} label="Status">
              {status.label}
            </InfoRow>
            <InfoRow icon={Crown} label="Plan">
              {planVisuals?.label ?? data.plan ?? "Unknown"}
            </InfoRow>
            <InfoRow icon={CreditCard} label="Billing">
              {data.is_lifetime
                ? "Lifetime (paid)"
                : data.cancel_at_period_end
                  ? "No future renewals"
                  : "Recurring"}
            </InfoRow>
          </div>

          {/* ── Support info (copyable customer id) ──────────────────────── */}
          {data.stripe_customer_id && (
            <div className="glass-card p-5 animate-slide-up">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                    Support reference
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-300 break-all">
                    {data.stripe_customer_id}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Share this ID with support so they can find your account
                    faster.
                  </p>
                </div>
                <button
                  onClick={copyCustomerId}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-slate-100"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cancel confirmation modal */}
      <CancelModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => cancelMutation.mutate()}
        loading={cancelMutation.isPending}
        periodEnd={data?.current_period_end ?? null}
      />
    </div>
  );
}

// ─── No subscription state ─────────────────────────────────────────────────

function NoSubscriptionState({ onSubscribe }: { onSubscribe: () => void }) {
  return (
    <div className="glass-card relative overflow-hidden p-10 animate-slide-up">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-purple-500/10" />
      <div className="relative flex flex-col items-center text-center">
        <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/10 glow-green">
          <Crown className="h-9 w-9 text-emerald-300" strokeWidth={1.5} />
          <Sparkles className="absolute -right-2 -top-2 h-5 w-5 text-amber-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">
          You don&apos;t have an active subscription
        </h2>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Unlock BetsPlug&apos;s full intelligence suite — unlimited
          predictions, bet of the day, premium strategies and weekly reports.
        </p>
        <button
          onClick={onSubscribe}
          className="btn-gradient mt-6 inline-flex items-center gap-1.5 rounded-lg px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg"
        >
          Subscribe now
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="mt-4 text-[11px] text-slate-500">
          Cancel anytime. No hidden fees.
        </p>
      </div>
    </div>
  );
}

// ─── Loading state ─────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-7 animate-slide-up">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-10 w-40 bg-white/[0.04]" />
            <Skeleton className="h-4 w-56 bg-white/[0.04]" />
            <Skeleton className="h-3 w-48 bg-white/[0.04]" />
          </div>
          <Skeleton className="h-24 w-24 rounded-2xl bg-white/[0.04]" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-20 rounded-xl bg-white/[0.04]" />
        <Skeleton className="h-20 rounded-xl bg-white/[0.04]" />
        <Skeleton className="h-20 rounded-xl bg-white/[0.04]" />
        <Skeleton className="h-20 rounded-xl bg-white/[0.04]" />
      </div>
    </div>
  );
}

// ─── Error state ───────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="glass-card p-8 animate-slide-up">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-100">
          We couldn&apos;t load your subscription
        </h2>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Please try again in a moment. If the problem keeps happening, drop
          us a line at support.
        </p>
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-slate-100"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
