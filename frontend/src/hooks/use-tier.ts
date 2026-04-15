"use client";

import { useEffect, useState, useCallback } from "react";

export type Tier = "free" | "silver" | "gold" | "platinum";

export const TIER_RANK: Record<Tier, number> = {
  free: 0,
  silver: 1,
  gold: 2,
  platinum: 3,
};

const TIER_KEY = "betsplug_tier";
const USER_KEY = "betsplug_user";
const TESTING_KEY = "betsplug_admin_testing_tier";

const API_TIER_MAP: Record<string, Tier> = {
  basic: "silver",
  standard: "silver",
  premium: "gold",
  lifetime: "platinum",
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
      if (!rawUser) return;
      const user = JSON.parse(rawUser);
      if (user.role === "admin") return;
      if (window.localStorage.getItem(TESTING_KEY)) return;

      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const resp = await fetch(
        `${API}/subscriptions/status?email=${encodeURIComponent(user.email || "")}`,
      );
      if (!resp.ok) return;
      const data = await resp.json();
      if (data.plan) {
        const mapped = API_TIER_MAP[data.plan] ?? "free";
        window.localStorage.setItem(TIER_KEY, mapped);
        setTier(mapped);
      }
    } catch {
      // network/parse error — keep whatever localStorage had
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

    // Kick off a one-shot API refresh so free-tier users get their real tier
    const stored = typeof window !== "undefined"
      ? window.localStorage.getItem(TIER_KEY)
      : null;
    if (!stored || stored === "free") {
      void refresh();
    }

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
