"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Lock, TrendingUp, Sparkles, LogIn } from "lucide-react";
import Link from "next/link";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PickTierBadge } from "@/components/noct/pick-tier-badge";
import { useTier } from "@/hooks/use-tier";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import type { PickTierSlug, TierBreakdown } from "@/types/api";

/**
 * TierPerformanceCard — v8.1 dashboard widget.
 *
 * Shows historical accuracy per pick_tier, filtered to the user's access
 * scope. Tiers above the user's access are rendered as locked rows with
 * an upgrade-CTA so the user sees what unlocks at the next subscription
 * level.
 *
 * Data source: GET /api/dashboard/metrics.per_tier (populated only when
 * TIER_SYSTEM_ENABLED on the backend). Falls back to a hidden state if
 * the feature flag is off.
 */

const TIER_ORDER: { slug: PickTierSlug; rank: number }[] = [
  { slug: "platinum", rank: 3 },
  { slug: "gold", rank: 2 },
  { slug: "silver", rank: 1 },
  { slug: "free", rank: 0 },
];

function TierRow({
  tier,
  breakdown,
  accessible,
  isUserTier,
  onUpgradeHref,
}: {
  tier: PickTierSlug;
  breakdown: TierBreakdown | undefined;
  accessible: boolean;
  isUserTier: boolean;
  onUpgradeHref: string;
}) {
  const { t } = useTranslations();
  const total = breakdown?.total ?? 0;
  const correct = breakdown?.correct ?? 0;
  const accuracy = breakdown?.accuracy ?? 0;
  const hasData = total > 0;
  const accuracyPct = Math.round(accuracy * 1000) / 10;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
        isUserTier
          ? "border-white/15 bg-white/[0.04]"
          : "border-white/[0.06] bg-black/20"
      }`}
    >
      {/* Left: badge + label */}
      <div className="flex items-center gap-2.5 min-w-0">
        <PickTierBadge
          tier={tier}
          size="sm"
          showLabel={false}
          locked={!accessible}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white capitalize">
              {tier}
            </span>
            {isUserTier && (
              <span className="rounded-full bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                Your tier
              </span>
            )}
          </div>
          {hasData && accessible ? (
            <div className="text-[11px] text-slate-400">
              {correct.toLocaleString()} / {total.toLocaleString()} correct
            </div>
          ) : !accessible ? (
            <div className="text-[11px] text-slate-500">
              Upgrade to unlock
            </div>
          ) : (
            <div className="text-[11px] text-slate-500">{t("common.noDataYet")}</div>
          )}
        </div>
      </div>

      {/* Right: accuracy or upgrade CTA */}
      {accessible ? (
        <div className="flex flex-col items-end leading-none">
          <div className="text-lg font-extrabold text-white tabular-nums">
            {hasData ? `${accuracyPct.toFixed(1)}%` : "—"}
          </div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            accuracy
          </div>
        </div>
      ) : (
        <Link
          href={onUpgradeHref}
          className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition-colors hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-emerald-300"
        >
          <Lock className="h-3 w-3" />
          Upgrade
        </Link>
      )}
    </div>
  );
}

export function TierPerformanceCard() {
  const loc = useLocalizedHref();
  const { tier: userTierSlug, rank: userRank, ready: tierReady } = useTier();
  const { user } = useAuth();
  const isGuest = !user;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-metrics-tier"],
    queryFn: () => api.getDashboardMetrics(),
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });

  // When the backend feature flag is off, per_tier is null/undefined —
  // hide the whole card to avoid rendering an empty block.
  const perTier = data?.per_tier;
  const hasTierData = useMemo(
    () => !!perTier && Object.keys(perTier).length > 0,
    [perTier],
  );

  // Render nothing while initial data loads to prevent layout jump.
  if (!tierReady || isLoading) {
    return (
      <div className="glass-card px-5 py-4">
        <div className="h-5 w-48 animate-pulse rounded bg-white/10" />
        <div className="mt-4 space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  // Only hide entirely on hard errors (network down). If the tier-system
  // flag is off, perTier will be absent — still show the card with the
  // static default accuracy claims so users understand the tier concept.
  if (isError) {
    return null;
  }

  const pricingHref = loc("/pricing");
  const loginHref = loc("/login");

  return (
    <div className="glass-card px-5 py-4">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              {isGuest ? "Pick quality tiers" : "Your tier performance"}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {isGuest
              ? "Every BetsPlug pick is ranked into one of four quality tiers, each with its own historical accuracy. Log in to see which ones you have access to."
              : "Historical accuracy per pick quality tier. Based on the v8.1 engine's evaluated picks since Apr\u00a016."}
          </p>
        </div>
      </div>

      {/* Rows (Platinum → Free) */}
      <div className="space-y-2">
        {TIER_ORDER.map(({ slug, rank }) => (
          <TierRow
            key={slug}
            tier={slug}
            breakdown={perTier?.[slug]}
            // Guest sees all tiers as locked (except Free, which is the
            // public tier — showing its accuracy is legitimate marketing).
            accessible={isGuest ? slug === "free" : rank <= userRank}
            isUserTier={!isGuest && slug === userTierSlug}
            onUpgradeHref={isGuest ? loginHref : pricingHref}
          />
        ))}
      </div>

      {/* Bottom CTA — different copy for guest vs authenticated sub-tier */}
      {isGuest ? (
        <Link
          href={loginHref}
          className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2.5 transition-colors hover:border-emerald-400/40 hover:bg-emerald-400/10"
        >
          <div className="flex items-center gap-2">
            <LogIn className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">
              Log in to see your personal tier performance
            </span>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
            Log in &rarr;
          </span>
        </Link>
      ) : userRank < 3 ? (
        <Link
          href={pricingHref}
          className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2.5 transition-colors hover:border-emerald-400/40 hover:bg-emerald-400/10"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">
              Upgrade for higher-accuracy picks
            </span>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
            See pricing &rarr;
          </span>
        </Link>
      ) : null}
    </div>
  );
}

export default TierPerformanceCard;
