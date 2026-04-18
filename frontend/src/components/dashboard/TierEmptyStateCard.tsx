"use client";

/**
 * TierEmptyStateCard — shown when the signed-in user's own tier has
 * zero picks in the current v8.1 window.
 *
 * The v8.1 predictions filter restricts dashboard queries to picks
 * generated after the 2026-04-16 11:00 UTC deploy cutoff. For Free
 * users the scope is narrow (top-14 leagues, confidence 0.55–0.65)
 * so the window can legitimately be empty — in which case the
 * dashboard would otherwise render every KPI as "0" with no
 * explanation. This card replaces that silence with context + a
 * clear upgrade path.
 *
 * Auto-hides on:
 *   - Platinum users (no upgrade path, and Platinum is never empty)
 *   - Any tier that HAS picks in the current window
 *   - Admin tier-impersonation when they're previewing Platinum
 */

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, Sparkles } from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTier, type Tier } from "@/hooks/use-tier";
import { useLocalizedHref } from "@/i18n/locale-provider";

interface TierCopy {
  currentLabel: string;
  currentAccuracy: string;
  currentScope: string;
  nextLabel: string;
  nextAccuracy: string;
}

const COPY: Record<Exclude<Tier, "platinum">, TierCopy> = {
  free: {
    currentLabel: "Free",
    currentAccuracy: "45%+",
    currentScope: "top-14 leagues, confidence 55–65%",
    nextLabel: "Silver",
    nextAccuracy: "60%+",
  },
  silver: {
    currentLabel: "Silver",
    currentAccuracy: "60%+",
    currentScope: "top-14 leagues, confidence ≥65%",
    nextLabel: "Gold",
    nextAccuracy: "70%+",
  },
  gold: {
    currentLabel: "Gold",
    currentAccuracy: "70%+",
    currentScope: "top-10 leagues, confidence ≥70%",
    nextLabel: "Platinum",
    nextAccuracy: "80%+",
  },
};

export function TierEmptyStateCard() {
  const { tier, ready } = useTier();
  const { user } = useAuth();
  const loc = useLocalizedHref();

  // We reuse the exact same React Query key as TierPerformanceCard so
  // both widgets share the single /dashboard/metrics fetch — no extra
  // network cost.
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-metrics-tier"],
    queryFn: () => api.getDashboardMetrics(),
    staleTime: 5 * 60_000,
    enabled: ready && !!user,
  });

  if (!ready || !user || isLoading) return null;
  if (tier === "platinum") return null;

  // Only render when the caller's OWN tier breakdown is empty. If data
  // is still loading we render nothing (the card shouldn't flash in
  // before the per_tier payload arrives).
  const breakdown = data?.per_tier?.[tier];
  const ownTierTotal = breakdown?.total ?? null;
  if (ownTierTotal === null) return null; // per_tier not populated (flag off)
  if (ownTierTotal > 0) return null;

  const copy = COPY[tier];
  const pricingHref = loc("/pricing");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-400/20 bg-[#0a0c14]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent"
      />
      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 ring-1 ring-amber-400/30">
          <AlertCircle className="h-5 w-5 text-amber-300" strokeWidth={2.2} />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="text-sm font-bold text-white sm:text-base">
            No picks in your {copy.currentLabel} tier right now
          </h3>
          <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">
            Your {copy.currentLabel} tier shows picks with{" "}
            <span className="font-semibold text-slate-200">
              {copy.currentAccuracy} historical accuracy
            </span>{" "}
            scoped to {copy.currentScope}. There are no picks meeting
            that criteria in the current v8.1 window — check back
            after the next model run, or upgrade for a wider pick set.
          </p>
          <p className="text-[11px] text-slate-500">
            The tier comparison below shows what every tier delivers historically.
          </p>
        </div>

        <Link
          href={pricingHref}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 px-4 py-2.5 text-xs font-black tracking-tight text-[#1a1408] transition-transform hover:scale-[1.03] sm:text-sm"
        >
          <Sparkles className="h-4 w-4" />
          Upgrade to {copy.nextLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default TierEmptyStateCard;
