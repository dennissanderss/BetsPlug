/**
 * Canonical tier-metadata constants for the frontend.
 *
 * Mirrors ``backend/app/core/tier_system.py::TIER_METADATA`` and
 * ``CONF_THRESHOLD``. When the backend changes tier accuracy claims or
 * confidence floors, update this file in the SAME PR — otherwise the
 * badge, pricing, and dashboard fallbacks drift.
 *
 * Prefer reading tier labels from the API response (`/api/pricing/
 * comparison`, `/api/dashboard/metrics.per_tier`) where possible. Use
 * these constants only as the default when the network request hasn't
 * landed yet, or for fully static surfaces (e.g. sidebar upgrade lock).
 */

import type { PickTierSlug } from "@/types/api";

export interface TierMetadataEntry {
  /** Slug used in API responses and URL segments. */
  slug: PickTierSlug;
  /** Short display label, e.g. "Platinum" (no roman numeral prefix). */
  label: string;
  /** Marketing accuracy claim, e.g. "80%+". */
  accuracyClaim: string;
  /** Confidence floor used by the backend CASE classifier. */
  confidenceThreshold: number;
  /** Integer rank for "user_tier >= pick_tier" comparisons. */
  rank: number;
}

export const TIER_METADATA: Record<PickTierSlug, TierMetadataEntry> = {
  platinum: {
    slug: "platinum",
    label: "Platinum",
    accuracyClaim: "80%+",
    confidenceThreshold: 0.75,
    rank: 3,
  },
  gold: {
    slug: "gold",
    label: "Gold",
    accuracyClaim: "70%+",
    confidenceThreshold: 0.7,
    rank: 2,
  },
  silver: {
    slug: "silver",
    label: "Silver",
    accuracyClaim: "60%+",
    confidenceThreshold: 0.65,
    rank: 1,
  },
  free: {
    slug: "free",
    label: "Free",
    accuracyClaim: "45%+",
    confidenceThreshold: 0.55,
    rank: 0,
  },
};

export const TIER_ORDER_ASC: PickTierSlug[] = ["free", "silver", "gold", "platinum"];
export const TIER_ORDER_DESC: PickTierSlug[] = ["platinum", "gold", "silver", "free"];

export function tierByRank(rank: number): PickTierSlug {
  return (TIER_ORDER_ASC[rank] ?? "free") as PickTierSlug;
}
