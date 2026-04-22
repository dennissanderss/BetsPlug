"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, ChevronDown } from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTier, type Tier } from "@/hooks/use-tier";
import { useLocalizedHref } from "@/i18n/locale-provider";

interface TierCopy {
  heading: string;
  body: string;
  lowerTierLabel: string;
  lowerTierHref: string;
  upgradeLabel?: string;
}

const COPY: Record<Tier, TierCopy> = {
  platinum: {
    heading: "No Platinum picks right now",
    body: "Our engine is selective by design — it only flags matches it's highly confident about. There are currently no matches meeting the Platinum standard. This is normal and means your subscription is working as intended.",
    lowerTierLabel: "Browse Gold picks (slightly lower accuracy)",
    lowerTierHref: "/predictions?tier=gold",
  },
  gold: {
    heading: "No Gold picks right now",
    body: "Our engine is selective by design — it only flags matches it's highly confident about. There are currently no matches meeting the Gold standard. This is normal and means your subscription is working as intended.",
    lowerTierLabel: "Browse Silver picks (slightly lower accuracy)",
    lowerTierHref: "/predictions?tier=silver",
    upgradeLabel: "Upgrade to Platinum",
  },
  silver: {
    heading: "No Silver picks right now",
    body: "Our engine is selective by design — it only flags matches it's highly confident about. There are currently no matches meeting the Silver standard. This is normal and means your subscription is working as intended.",
    lowerTierLabel: "Browse Free picks (slightly lower accuracy)",
    lowerTierHref: "/predictions?tier=free",
    upgradeLabel: "Upgrade to Gold",
  },
  free: {
    heading: "No picks available right now",
    body: "Our engine is selective by design — it only flags matches it's highly confident about. There are currently no matches meeting our confidence threshold. Check back tomorrow.",
    lowerTierLabel: "",
    lowerTierHref: "",
    upgradeLabel: "Upgrade to Silver for better picks",
  },
};

export function TierEmptyStateCard() {
  const { tier, ready } = useTier();
  const { user } = useAuth();
  const loc = useLocalizedHref();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-metrics-tier"],
    queryFn: () => api.getDashboardMetrics(),
    staleTime: 5 * 60_000,
    enabled: ready && !!user,
  });

  if (!ready || !user || isLoading) return null;

  const breakdown = data?.per_tier?.[tier];
  const ownTierTotal = breakdown?.total ?? null;
  if (ownTierTotal === null) return null;
  if (ownTierTotal > 0) return null;

  const copy = COPY[tier];
  const pricingHref = loc("/pricing");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-[#0a0c14]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-emerald-400/4 to-transparent"
      />
      <div className="relative flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/30">
            <ShieldCheck className="h-5 w-5 text-emerald-300" strokeWidth={2.2} />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <h3 className="text-sm font-bold text-white sm:text-base">
              {copy.heading}
            </h3>
            <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">
              {copy.body}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pl-0 sm:pl-14">
          {copy.lowerTierLabel && (
            <Link
              href={loc(copy.lowerTierHref)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              {copy.lowerTierLabel}
            </Link>
          )}

          {copy.upgradeLabel && (
            <Link
              href={pricingHref}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 px-4 py-2 text-xs font-black tracking-tight text-[#1a1408] transition-transform hover:scale-[1.03]"
            >
              {copy.upgradeLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default TierEmptyStateCard;
