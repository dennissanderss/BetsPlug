"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";

interface PaywallOverlayProps {
  feature: string;
  requiredTier: "silver" | "gold" | "platinum";
  children: React.ReactNode;
}

const TIER_RANK: Record<string, number> = { free: 0, silver: 1, gold: 2, platinum: 3 };

export function PaywallOverlay({ feature, requiredTier, children }: PaywallOverlayProps) {
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const storedTier = typeof window !== "undefined"
      ? (localStorage.getItem("betsplug_tier") || "free")
      : "free";
    const userRank = TIER_RANK[storedTier] ?? 0;
    const requiredRank = TIER_RANK[requiredTier] ?? 0;
    if (userRank >= requiredRank) setHasAccess(true);
  }, [requiredTier]);

  if (hasAccess) {
    return <>{children}</>;
  }

  const tierLabels = {
    silver: "Silver",
    gold: "Gold",
    platinum: "Platinum",
  };

  return (
    <div className="relative">
      {/* Blurred content preview */}
      <div className="pointer-events-none select-none blur-sm opacity-50">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-[#080b14]/60 backdrop-blur-sm rounded-xl">
        <div className="text-center space-y-4 max-w-sm px-6">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
              <Lock className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <div>
            <p className="text-lg font-bold text-white">Upgrade to {tierLabels[requiredTier]}</p>
            <p className="text-sm text-slate-400 mt-1">
              This feature requires a {tierLabels[requiredTier]} subscription or higher.
            </p>
          </div>
          <Link
            href="/checkout"
            className="btn-gradient inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold"
          >
            <Sparkles className="h-4 w-4" /> Upgrade Now
          </Link>
        </div>
      </div>
    </div>
  );
}
