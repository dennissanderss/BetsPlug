"use client";

/**
 * Subscription page — NOCTURNE rebuild
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
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { MySubscription } from "@/types/api";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

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

const PLAN_HEX: Record<PlanKey, "green" | "purple" | "blue"> = {
  bronze: "purple",
  silver: "blue",
  gold: "green",
  platinum: "purple",
};

const PLAN_LABEL: Record<PlanKey, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

// ─── Status pill ────────────────────────────────────────────────────────────

function statusPill(status: string | null): { label: string; tone: any } {
  const s = (status ?? "").toLowerCase();
  if (s === "active") return { label: "Active", tone: "win" };
  if (s === "trialing") return { label: "Trialing", tone: "info" };
  if (s === "cancelled" || s === "canceled")
    return { label: "Cancelled", tone: "default" };
  if (s === "expired") return { label: "Expired", tone: "loss" };
  if (s === "past_due" || s === "past due")
    return { label: "Past due", tone: "purple" };
  return { label: status ?? "Unknown", tone: "default" };
}

// ─── Cancel modal ───────────────────────────────────────────────────────────

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
        className="glass-panel-raised w-full max-w-md rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <HexBadge variant="purple" size="md">
            <AlertTriangle className="h-5 w-5" />
          </HexBadge>
          <div>
            <h3 className="text-heading text-base text-[#ededed]">
              Cancel your subscription?
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#a3a9b8]">
              You&apos;ll keep full access until{" "}
              <span className="font-semibold text-[#ededed]">
                {periodEnd ? formatDate(periodEnd) : "the end of your current period"}
              </span>
              . After that your plan will not renew.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn-glass">
            Keep subscription
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="btn-ghost disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-3.5 w-3.5" />
            {loading ? "Cancelling..." : "Yes, cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── KPI tile ──────────────────────────────────────────────────────────────

function KpiTile({
  label,
  value,
  variant,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  variant: "green" | "purple" | "blue";
  icon: React.ReactNode;
}) {
  return (
    <div className="card-neon rounded-2xl">
      <div className="relative flex items-center gap-4 p-5">
        <HexBadge variant={variant} size="md">
          {icon}
        </HexBadge>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
            {label}
          </p>
          <p className="text-stat mt-1 text-xl text-[#ededed]">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Info row ──────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-panel flex items-start gap-3 rounded-xl px-4 py-3">
      <div className="mt-0.5 shrink-0 text-[#a3a9b8]">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
          {label}
        </p>
        <div className="mt-1 text-sm font-medium text-[#ededed]">
          {children}
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
  const planLabel = planKey ? PLAN_LABEL[planKey] : data?.plan ?? "Unknown";
  const planVariant = planKey ? PLAN_HEX[planKey] : "green";
  const status = statusPill(data?.status ?? null);

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-10 h-[400px] w-[400px] rounded-full"
        style={{
          background: "hsl(var(--accent-green) / 0.1)",
          filter: "blur(140px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-60 h-[400px] w-[400px] rounded-full"
        style={{
          background: "hsl(var(--accent-purple) / 0.08)",
          filter: "blur(140px)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <span className="section-label mb-3">
              <Crown className="h-3 w-3" />
              Subscription
            </span>
            <h1 className="text-heading text-3xl text-[#ededed] sm:text-4xl">
              Subscription
            </h1>
            <p className="mt-2 text-sm text-[#a3a9b8]">
              View and manage your BetsPlug membership.
            </p>
          </div>
          {hasSubscription && planKey && (
            <Pill
              tone={
                planKey === "platinum"
                  ? "purple"
                  : planKey === "gold"
                  ? "win"
                  : "info"
              }
            >
              <Crown className="h-3 w-3" />
              {planLabel}
            </Pill>
          )}
        </div>

        {isLoading ? (
          <LoadingState />
        ) : error || !data ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !hasSubscription ? (
          <NoSubscriptionState
            onSubscribe={() => router.push("/checkout?plan=gold")}
          />
        ) : (
          <div className="space-y-6">
            {/* Hero plan card */}
            <div className="card-neon-green halo-green rounded-2xl">
              <div className="relative p-7">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <HexBadge variant={planVariant} size="lg">
                        <Crown className="h-7 w-7" />
                      </HexBadge>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
                          Your plan
                        </p>
                        <h2 className="text-heading text-3xl text-[#ededed]">
                          {planLabel}
                        </h2>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={status.tone}>
                        <Check className="h-3 w-3" />
                        {status.label}
                      </Pill>
                      {data.is_lifetime && (
                        <Pill tone="purple">
                          <InfinityIcon className="h-3 w-3" />
                          Lifetime
                        </Pill>
                      )}
                      {data.cancel_at_period_end && !data.is_lifetime && (
                        <Pill tone="loss">
                          <AlertTriangle className="h-3 w-3" />
                          Cancelling
                        </Pill>
                      )}
                    </div>

                    {/* Price + renewal */}
                    <p className="text-stat text-2xl text-[#ededed]">
                      {data.is_lifetime ? "Lifetime" : "—"}
                    </p>

                    <p className="text-sm text-[#a3a9b8]">
                      {data.is_lifetime ? (
                        <>Lifetime access — no renewal needed. Enjoy BetsPlug forever.</>
                      ) : data.cancel_at_period_end ? (
                        <>
                          Cancels on{" "}
                          <span className="font-semibold text-[#ededed]">
                            {data.current_period_end
                              ? formatDate(data.current_period_end)
                              : "end of period"}
                          </span>
                        </>
                      ) : data.current_period_end ? (
                        <>
                          Renews on{" "}
                          <span className="font-semibold text-[#ededed]">
                            {formatDate(data.current_period_end)}
                          </span>
                        </>
                      ) : (
                        <>Active subscription</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/[0.08] pt-5">
                  {!data.is_lifetime && planKey !== "platinum" && (
                    <button
                      onClick={() => router.push("/checkout?plan=platinum")}
                      className="btn-primary"
                    >
                      <Sparkles className="h-4 w-4" />
                      Upgrade to Platinum
                    </button>
                  )}
                  {!data.is_lifetime && !data.cancel_at_period_end && (
                    <button
                      onClick={() => setCancelOpen(true)}
                      className="btn-glass"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel subscription
                    </button>
                  )}
                  {data.cancel_at_period_end && !data.is_lifetime && (
                    <button
                      onClick={() => router.push("/checkout?plan=gold")}
                      className="btn-primary"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Reactivate
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Usage stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              <KpiTile
                label="Plan tier"
                value={planLabel}
                variant={planVariant}
                icon={<Crown className="h-5 w-5" />}
              />
              <KpiTile
                label="Status"
                value={status.label}
                variant="green"
                icon={<ShieldCheck className="h-5 w-5" />}
              />
              <KpiTile
                label={data.cancel_at_period_end ? "Cancels" : "Renewal"}
                value={
                  data.is_lifetime
                    ? "Never"
                    : data.current_period_end
                    ? formatDate(data.current_period_end)
                    : "—"
                }
                variant="purple"
                icon={<Calendar className="h-5 w-5" />}
              />
            </div>

            {/* Billing history */}
            <div className="card-neon rounded-2xl">
              <div className="relative p-6">
                <div className="mb-5 flex items-center gap-3">
                  <HexBadge variant="blue" size="sm">
                    <CreditCard className="h-4 w-4" />
                  </HexBadge>
                  <h2 className="text-heading text-base text-[#ededed]">
                    Billing history
                  </h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow
                    icon={<Calendar className="h-3.5 w-3.5" />}
                    label={
                      data.cancel_at_period_end ? "Cancels on" : "Next renewal"
                    }
                  >
                    {data.is_lifetime ? (
                      <span className="text-[#a3a9b8]">Never — lifetime plan</span>
                    ) : data.current_period_end ? (
                      formatDate(data.current_period_end)
                    ) : (
                      "—"
                    )}
                  </InfoRow>
                  <InfoRow
                    icon={<ShieldCheck className="h-3.5 w-3.5" />}
                    label="Status"
                  >
                    <Pill tone={status.tone}>{status.label}</Pill>
                  </InfoRow>
                  <InfoRow
                    icon={<Crown className="h-3.5 w-3.5" />}
                    label="Plan"
                  >
                    {planLabel}
                  </InfoRow>
                  <InfoRow
                    icon={<CreditCard className="h-3.5 w-3.5" />}
                    label="Billing"
                  >
                    {data.is_lifetime
                      ? "Lifetime (paid)"
                      : data.cancel_at_period_end
                      ? "No future renewals"
                      : "Recurring"}
                  </InfoRow>
                </div>
              </div>
            </div>

            {/* Support info */}
            {data.stripe_customer_id && (
              <div className="card-neon rounded-2xl">
                <div className="relative p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a3a9b8]">
                        Support reference
                      </p>
                      <p className="mt-1 break-all font-mono text-xs text-[#ededed]">
                        {data.stripe_customer_id}
                      </p>
                      <p className="mt-1 text-[11px] text-[#a3a9b8]">
                        Share this ID with support so they can find your account
                        faster.
                      </p>
                    </div>
                    <button
                      onClick={copyCustomerId}
                      className="btn-glass !px-3 !py-1.5 !text-xs"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#4ade80]" />
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
              </div>
            )}

            {/* Cancel / pause actions */}
            {!data.is_lifetime && (
              <div className="flex items-center justify-end gap-2">
                {!data.cancel_at_period_end && (
                  <button
                    onClick={() => setCancelOpen(true)}
                    className="btn-ghost"
                  >
                    Pause or cancel
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <CancelModal
          open={cancelOpen}
          onClose={() => setCancelOpen(false)}
          onConfirm={() => cancelMutation.mutate()}
          loading={cancelMutation.isPending}
          periodEnd={data?.current_period_end ?? null}
        />
      </div>
    </div>
  );
}

// ─── No subscription ────────────────────────────────────────────────────────

function NoSubscriptionState({ onSubscribe }: { onSubscribe: () => void }) {
  return (
    <div className="card-neon-green halo-green rounded-2xl">
      <div className="relative flex flex-col items-center p-10 text-center">
        <div className="relative">
          <HexBadge variant="green" size="xl">
            <Crown className="h-9 w-9" />
          </HexBadge>
          <div className="absolute -right-1 -top-1">
            <HexBadge variant="purple" size="sm">
              <Sparkles className="h-3 w-3" />
            </HexBadge>
          </div>
        </div>
        <h2 className="mt-5 text-heading text-2xl text-[#ededed]">
          You don&apos;t have an active subscription
        </h2>
        <p className="mt-2 max-w-md text-sm text-[#a3a9b8]">
          Unlock BetsPlug&apos;s full intelligence suite — unlimited
          predictions, bet of the day, premium strategies and weekly reports.
        </p>
        <button onClick={onSubscribe} className="btn-primary mt-6">
          Subscribe now
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="mt-4 text-[11px] text-[#a3a9b8]">
          Cancel anytime. No hidden fees.
        </p>
      </div>
    </div>
  );
}

// ─── Loading ────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="card-neon rounded-2xl">
        <div className="relative p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-10 w-40 bg-white/[0.04]" />
              <Skeleton className="h-4 w-56 bg-white/[0.04]" />
              <Skeleton className="h-3 w-48 bg-white/[0.04]" />
            </div>
            <Skeleton className="h-24 w-24 rounded-2xl bg-white/[0.04]" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-20 rounded-xl bg-white/[0.04]" />
        <Skeleton className="h-20 rounded-xl bg-white/[0.04]" />
        <Skeleton className="h-20 rounded-xl bg-white/[0.04]" />
      </div>
    </div>
  );
}

// ─── Error ──────────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="card-neon rounded-2xl">
      <div className="relative flex flex-col items-center p-8 text-center">
        <HexBadge variant="purple" size="lg">
          <AlertTriangle className="h-6 w-6" />
        </HexBadge>
        <h2 className="mt-4 text-heading text-lg text-[#ededed]">
          We couldn&apos;t load your subscription
        </h2>
        <p className="mt-2 max-w-md text-sm text-[#a3a9b8]">
          Please try again in a moment. If the problem keeps happening, drop us
          a line at support.
        </p>
        <button onClick={onRetry} className="btn-glass mt-4">
          Try again
        </button>
      </div>
    </div>
  );
}
