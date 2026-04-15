"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTier } from "@/hooks/use-tier";
import { UpgradeLockModal } from "@/components/noct/upgrade-lock-modal";

/**
 * Tier-guard for the Data Analyst section.
 *
 * Default rule: Gold or higher.
 *
 * Exception: /analyst/matches/[id] is the Silver teaser route. Silver
 * users see a read-only preview of the Match Deep Dive (gated within the
 * page itself with PaywallOverlay sections), so we let them through here.
 *
 * Free users are always blocked. They land on this layout via direct URL
 * (the sidebar already shows the lock modal on click), so we surface the
 * upgrade modal here too with the right benefits and bounce them to
 * /subscription if they dismiss it.
 */
export default function AnalystLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { tier, hasAccess, ready } = useTier();
  const [showLock, setShowLock] = React.useState(false);

  const isMatchDeepDive =
    pathname.startsWith("/analyst/matches/") ||
    pathname.startsWith("/analyst/matches");

  const requiredTier: "silver" | "gold" = isMatchDeepDive ? "silver" : "gold";
  const allowed = ready && hasAccess(requiredTier);

  React.useEffect(() => {
    if (!ready) return;
    if (!allowed) setShowLock(true);
  }, [ready, allowed]);

  if (!ready) {
    // Avoid flashing the children for paid users while tier hydrates
    return null;
  }

  if (!allowed) {
    return (
      <>
        <div className="flex h-full items-center justify-center p-8 text-center text-[#a3a9b8]">
          <div>
            <p className="text-sm">
              This area is reserved for {requiredTier === "silver" ? "Silver" : "Gold"} members and higher.
            </p>
          </div>
        </div>

        <UpgradeLockModal
          open={showLock}
          onOpenChange={(open) => {
            setShowLock(open);
            if (!open) router.push("/subscription");
          }}
          feature="Data Analyst"
          requiredTier={requiredTier === "silver" ? "silver" : "gold"}
          blurb={
            requiredTier === "silver"
              ? "The Match Deep Dive preview is part of Silver and higher."
              : "The Data Analyst section is part of Gold and higher."
          }
          benefits={
            requiredTier === "gold"
              ? [
                  "Predictions Explorer with filters + CSV export",
                  "Match Deep Dive — Elo, submodels, feature importance",
                  "Engine Performance — calibration + per-league accuracy",
                ]
              : [
                  "Read-only Match Deep Dive preview",
                  "Daily Bet of the Day pick",
                  "Full results history with detail",
                ]
          }
        />
      </>
    );
  }

  // Pass through — the page handles its own tier-aware content
  // (e.g. Silver sees teaser sections, Gold sees full content).
  void tier;
  return <>{children}</>;
}
