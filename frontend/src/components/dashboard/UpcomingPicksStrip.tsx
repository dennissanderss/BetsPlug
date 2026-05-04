"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { CalendarDays, ArrowRight, Clock } from "lucide-react";
import { TeamLogo } from "@/components/dashboard/TeamLogo";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
import { PickTierBadge } from "@/components/noct/pick-tier-badge";
import { classifyPickTier, TIER_RANK } from "@/lib/pick-tier";
import type { Fixture, FixturesResponse, PickTierSlug } from "@/types/api";
import type { Tier } from "@/hooks/use-tier";

interface UpcomingPicksStripProps {
  data: FixturesResponse | undefined;
  isLoading: boolean;
  /** User's active tier — drives the in-scope filter. */
  userTier: Tier | null;
}

/** Best-effort tier rank for the user's tier. Free → 0, Platinum → 3. */
function userTierRank(t: Tier | null): number {
  if (!t || t === "free") return TIER_RANK.free;
  return TIER_RANK[t as PickTierSlug] ?? 0;
}

function formatKickoff(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

function PickCard({ fixture }: { fixture: Fixture }) {
  const { t } = useTranslations();
  const lHref = useLocalizedHref();
  const pred = fixture.prediction;
  const conf = pred ? Math.round(pred.confidence * 100) : null;

  const tier: PickTierSlug | null =
    (pred as any)?.pick_tier ??
    classifyPickTier({
      leagueId: (fixture as any).league_id ?? null,
      leagueName: fixture.league_name ?? null,
      confidence: pred?.confidence ?? null,
    });

  let pickTeam: string | null = null;
  if (pred?.pick === "HOME") pickTeam = fixture.home_team_name;
  else if (pred?.pick === "AWAY") pickTeam = fixture.away_team_name;
  else if (pred?.pick === "DRAW") pickTeam = t("common.draw");

  return (
    <Link
      href={lHref(`/predictions`)}
      className="card-neon p-4 block transition-all hover:-translate-y-0.5 hover:halo-green focus-visible:outline-none"
    >
      <div className="relative space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-widest text-[#6b7280] truncate">
            {fixture.league_name}
          </span>
          {tier && (
            <PickTierBadge
              tier={tier}
              size="sm"
              showLabel={false}
              showAccuracy={false}
            />
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <TeamLogo src={fixture.home_team_logo} name={fixture.home_team_name} size={18} />
            <span className="text-sm font-semibold text-[#ededed] truncate">
              {fixture.home_team_name}
            </span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <TeamLogo src={fixture.away_team_logo} name={fixture.away_team_name} size={18} />
            <span className="text-sm font-semibold text-[#ededed] truncate">
              {fixture.away_team_name}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.05] pt-3 gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] text-[#a3a9b8] tabular-nums">
            <Clock className="h-3 w-3" />
            {formatKickoff(fixture.scheduled_at)}
          </span>
          <div className="flex items-center gap-2">
            {pickTeam && (
              <Pill tone="win" className="!text-[10px] truncate max-w-[90px]">
                {pickTeam}
              </Pill>
            )}
            {conf != null && (
              <span className="text-xs font-bold tabular-nums text-emerald-400">
                {conf}%
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="glass-panel animate-pulse h-36 rounded-xl" />
  );
}

export function UpcomingPicksStrip({ data, isLoading, userTier }: UpcomingPicksStripProps) {
  const { t } = useTranslations();
  const lHref = useLocalizedHref();

  const userRank = userTierRank(userTier);

  // Take fixtures that haven't kicked off, have a prediction, are in
  // scope for the user's tier, and rank by confidence so the
  // dashboard shows the four sharpest calls — not just the four
  // earliest kickoffs.
  const now = Date.now();
  const inScope = React.useMemo(() => {
    const all = data?.fixtures ?? [];
    return all
      .filter((f) => {
        if (!f.prediction) return false;
        if (f.status !== "scheduled") return false;
        const k = new Date(f.scheduled_at).getTime();
        if (!Number.isFinite(k) || k <= now) return false;
        const tier: PickTierSlug | null =
          (f.prediction as any).pick_tier ??
          classifyPickTier({
            leagueId: (f as any).league_id ?? null,
            leagueName: f.league_name ?? null,
            confidence: f.prediction.confidence,
          });
        if (!tier) return false;
        // Cumulative tier model: a pick classified at tier X is
        // visible to users at tier X AND LOWER. Free (0) sees only
        // Free picks; Platinum (3) sees everything. Filter:
        // pickRank <= userRank.
        return TIER_RANK[tier] <= userRank;
      })
      .sort((a, b) => (b.prediction!.confidence) - (a.prediction!.confidence));
  }, [data, now, userRank]);

  // Split: picks AT the user's tier vs picks BELOW the user's tier.
  // For a Platinum user (rank 3), "atTier" = Platinum-classified
  // picks (rank 3); "belowTier" = Gold/Silver/Free (rank < 3). For
  // Free this distinction doesn't matter because picks below Free
  // don't exist.
  const atTier = inScope.filter((f) => {
    const tier: PickTierSlug | null =
      (f.prediction as any).pick_tier ??
      classifyPickTier({
        leagueId: (f as any).league_id ?? null,
        leagueName: f.league_name ?? null,
        confidence: f.prediction!.confidence,
      });
    return tier ? TIER_RANK[tier] === userRank : false;
  });

  const picks = inScope.slice(0, 4);
  const showLowerTierFallbackBanner =
    userRank > 0 && atTier.length === 0 && inScope.length > 0;

  return (
    <div className="card-neon">
      <div className="relative">
        <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
          <div className="flex items-center gap-2.5">
            <HexBadge variant="green" size="sm" noGlow>
              <CalendarDays className="h-3.5 w-3.5" />
            </HexBadge>
            <span className="section-label">
              {(() => {
                const v = t("dashHero.upcomingTitle" as any);
                return v === "dashHero.upcomingTitle" ? "Top picks for the days ahead" : v;
              })()}
            </span>
          </div>
          <Link
            href={lHref("/predictions")}
            className="flex items-center gap-1 text-xs text-[#a3a9b8] transition-colors hover:text-[#4ade80]"
          >
            {(() => {
              const v = t("dashHero.viewAll" as any);
              return v === "dashHero.viewAll" ? "View all" : v;
            })()}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Fallback notice — fires when the user's own tier has 0
            picks but there ARE alternatives at lower tiers in their
            cumulative scope. Tells a Platinum user "no Platinum picks
            today, but here are X Gold/Silver/Free options the
            engine is still confident about". */}
        {!isLoading && showLowerTierFallbackBanner && (
          <div className="mx-4 mt-3 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-[11px] leading-relaxed text-amber-200/90">
            <span className="font-semibold text-amber-200">
              No {(userTier ?? "free").charAt(0).toUpperCase() + (userTier ?? "free").slice(1)} picks for the days ahead.
            </span>{" "}
            Engine is being selective at this confidence floor — but{" "}
            <span className="font-semibold tabular-nums text-amber-100">
              {inScope.length} alternative{inScope.length === 1 ? "" : "s"}
            </span>{" "}
            from lower tiers passed your scope. Shown below.
          </div>
        )}

        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          ) : picks.length === 0 ? (
            <div className="col-span-full py-6 text-center text-xs text-[#6b7280]">
              {(() => {
                const v = t("dashHero.upcomingEmpty" as any);
                return v === "dashHero.upcomingEmpty"
                  ? "No upcoming picks in your tier yet."
                  : v;
              })()}
            </div>
          ) : (
            picks.map((f) => <PickCard key={f.id} fixture={f} />)
          )}
        </div>
      </div>
    </div>
  );
}
