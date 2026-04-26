"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

export type Tier = "free" | "silver" | "gold" | "platinum";

export const TIER_RANK: Record<Tier, number> = {
  free: 0,
  silver: 1,
  gold: 2,
  platinum: 3,
};

const TIER_KEY = "betsplug_tier";
const TOKEN_KEY = "betsplug_token";
const USER_KEY = "betsplug_user";
const TESTING_KEY = "betsplug_admin_testing_tier";

// Maps the `plan` string returned by /subscriptions/me to the tier slug
// used in the UI. The API returns legacy enum values (basic/standard/premium/
// lifetime) but the pricing promise for each tier is:
//   basic   <- bronze checkout   -> Gold access (7-day trial)
//   standard<- silver checkout   -> Silver access
//   premium <- gold   checkout   -> Gold access
//   lifetime<- platinum checkout -> Platinum access
// Also accept the new-naming slugs in case the API ever returns them directly.
const API_TIER_MAP: Record<string, Tier> = {
  basic: "gold",
  bronze: "gold",
  standard: "silver",
  silver: "silver",
  premium: "gold",
  gold: "gold",
  lifetime: "platinum",
  platinum: "platinum",
};

function readTierFromStorage(): { tier: Tier; isAdmin: boolean } {
  try {
    const rawUser = window.localStorage.getItem(USER_KEY);
    const user = rawUser ? JSON.parse(rawUser) : null;
    const isAdmin = user?.role === "admin";

    const testing = window.localStorage.getItem(TESTING_KEY) as Tier | null;
    if (isAdmin && !testing) return { tier: "platinum", isAdmin: true };

    const stored = window.localStorage.getItem(TIER_KEY) as Tier | null;
    if (stored && stored in TIER_RANK) return { tier: stored, isAdmin };
    return { tier: "free", isAdmin };
  } catch {
    return { tier: "free", isAdmin: false };
  }
}

export interface UseTierResult {
  tier: Tier;
  rank: number;
  isAdmin: boolean;
  ready: boolean;
  hasAccess: (required: Tier) => boolean;
  refresh: () => Promise<void>;
}

export function useTier(): UseTierResult {
  const [tier, setTier] = useState<Tier>("free");
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  const hydrate = useCallback(() => {
    const snap = readTierFromStorage();
    setTier(snap.tier);
    setIsAdmin(snap.isAdmin);
  }, []);

  const refresh = useCallback(async () => {
    hydrate();
    try {
      const rawUser = window.localStorage.getItem(USER_KEY);
      const token = window.localStorage.getItem(TOKEN_KEY);
      if (!rawUser || !token) return;
      const user = JSON.parse(rawUser);
      if (user.role === "admin") return;
      if (window.localStorage.getItem(TESTING_KEY)) return;

      // Authenticated /subscriptions/me is the source of truth — looking up
      // by email could miss the row entirely (email mismatch, guest checkout)
      // and would also accept a "plan" value from cancelled/expired rows.
      // /me's `has_subscription` flag already excludes expired rows.
      const sub = await api.getMySubscription();
      const effective: Tier =
        sub.has_subscription && sub.plan
          ? (API_TIER_MAP[sub.plan.toLowerCase()] ?? "free")
          : "free";
      window.localStorage.setItem(TIER_KEY, effective);
      setTier(effective);
    } catch {
      // network/parse/401 — keep whatever localStorage had so the UI
      // doesn't downgrade a paid user during a transient outage.
    }
  }, [hydrate]);

  useEffect(() => {
    hydrate();
    setReady(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === TIER_KEY || e.key === USER_KEY || e.key === TESTING_KEY) {
        hydrate();
      }
    };
    window.addEventListener("storage", onStorage);

    const onTierChange = () => hydrate();
    window.addEventListener("betsplug:tier-changed", onTierChange);

    // Always refresh on mount so a stale "free" cached after a fresh
    // signup, or a stale "silver" after a downgrade, gets corrected
    // against the authenticated server view.
    void refresh();

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("betsplug:tier-changed", onTierChange);
    };
  }, [hydrate, refresh]);

  const rank = TIER_RANK[tier];
  const hasAccess = useCallback(
    (required: Tier) => rank >= TIER_RANK[required],
    [rank],
  );

  return { tier, rank, isAdmin, ready, hasAccess, refresh };
}
