"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, ChevronDown } from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTier, type Tier } from "@/hooks/use-tier";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

/** Static-only fields (URLs don't translate). Copy lives in messages.ts
 *  so every locale gets a real translation through the dictionary,
 *  not an `isNl ? "X" : "Y"` ternary that ships English to PL/RU/etc. */
const TIER_HREF: Record<Tier, { lowerTierHref: string }> = {
  platinum: { lowerTierHref: "/predictions?tier=gold" },
  gold: { lowerTierHref: "/predictions?tier=silver" },
  silver: { lowerTierHref: "/predictions?tier=free" },
  free: { lowerTierHref: "" },
};

export function TierEmptyStateCard() {
  const { tier, ready } = useTier();
  const { user } = useAuth();
  const loc = useLocalizedHref();
  const { t } = useTranslations();

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

  const lowerTierHref = TIER_HREF[tier].lowerTierHref;
  const heading = t(`tierEmpty.${tier}.heading` as "tierEmpty.gold.heading");
  const body = t(`tierEmpty.${tier}.body` as "tierEmpty.gold.body");
  // free has no lower tier; platinum has no upgrade target.
  const lowerLabel =
    tier === "free"
      ? ""
      : t(`tierEmpty.${tier}.lowerLabel` as "tierEmpty.gold.lowerLabel");
  const upgradeLabel =
    tier === "platinum"
      ? ""
      : t(`tierEmpty.${tier}.upgradeLabel` as "tierEmpty.gold.upgradeLabel");

  const pricingHref = "https://betsplug.com/pricing";

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
              {heading}
            </h3>
            <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">
              {body}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pl-0 sm:pl-14">
          {lowerLabel && lowerTierHref && (
            <Link
              href={loc(lowerTierHref)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              {lowerLabel}
            </Link>
          )}

          {upgradeLabel && (
            <Link
              href={pricingHref}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 px-4 py-2 text-xs font-black tracking-tight text-[#1a1408] transition-transform hover:scale-[1.03]"
            >
              {upgradeLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default TierEmptyStateCard;
