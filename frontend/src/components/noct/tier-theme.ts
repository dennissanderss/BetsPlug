/**
 * Single source of truth for tier colors, emblems and Roman numerals.
 *
 * Design decisions (per product feedback, 2026-04-18):
 *   - Bronze (Free)  → metallic copper           → Roman I
 *   - Silver         → metallic silver           → Roman II
 *   - Gold           → deep violet (NOT gold)    → Roman III
 *   - Platinum       → metallic gold (top tier)  → Roman IV
 *
 * The twist: Gold does NOT use gold accents because Platinum is our
 * highest tier and should carry the most prestigious visual weight.
 * Gold gets a premium violet instead; Platinum wins the gold crown.
 *
 * Every tier-aware component (pricing, ladder, trust funnel, pick
 * badges, dashboard KPIs) must import from here. Do not inline new
 * colours for tiers, extend this file instead.
 */

export type TierKey = "bronze" | "silver" | "gold" | "platinum";

export interface TierTheme {
  /** Display name, English; use i18n for localised forms. */
  name: string;
  /** Roman numeral I–IV. */
  numeral: "I" | "II" | "III" | "IV";
  /** Primary HSL color used in most contexts. */
  colorHex: string;
  /** Lighter highlight for badges / icons on dark surfaces. */
  highlightHex: string;
  /** Gradient start (darker). */
  gradientFromHex: string;
  /** Gradient end (lighter). */
  gradientToHex: string;
  /** Background tint (very subtle, for card backdrops). */
  bgTintHex: string;
  /** Ring / border color for outlined elements. */
  ringHex: string;
  /** Tailwind text color class for accents. */
  textClass: string;
  /** Tailwind border color class. */
  borderClass: string;
  /** Tailwind bg color class (very subtle). */
  bgClass: string;
  /** Confidence floor displayed on the public site. */
  confFloor: string;
  /** Marketing accuracy claim, e.g. '45%+', '80%+'. */
  accuracyClaim: string;
}

export const TIER_THEME: Record<TierKey, TierTheme> = {
  // ───────── BRONZE / FREE — metallic copper ─────────
  bronze: {
    name: "Bronze",
    numeral: "I",
    colorHex: "#b87333", // copper
    highlightHex: "#e8a864", // lighter copper
    gradientFromHex: "#8b5a2b",
    gradientToHex: "#d68a4a",
    bgTintHex: "rgba(184, 115, 51, 0.08)",
    ringHex: "rgba(232, 168, 100, 0.35)",
    textClass: "text-[#e8a864]",
    borderClass: "border-[#b87333]/30",
    bgClass: "bg-[#b87333]/[0.06]",
    confFloor: "0,55",
    accuracyClaim: "45%+",
  },

  // ───────── SILVER — metallic silver ─────────
  silver: {
    name: "Silver",
    numeral: "II",
    colorHex: "#c0c0c0",
    highlightHex: "#e5e4e2",
    gradientFromHex: "#8a8d91",
    gradientToHex: "#d7d9dc",
    bgTintHex: "rgba(192, 192, 192, 0.08)",
    ringHex: "rgba(229, 228, 226, 0.35)",
    textClass: "text-[#e5e4e2]",
    borderClass: "border-[#c0c0c0]/30",
    bgClass: "bg-[#c0c0c0]/[0.05]",
    confFloor: "0,65",
    accuracyClaim: "60%+",
  },

  // ───────── GOLD — premium violet (NOT gold) ─────────
  gold: {
    name: "Gold",
    numeral: "III",
    colorHex: "#8b5cf6", // violet 500
    highlightHex: "#c4b5fd", // violet 300
    gradientFromHex: "#6d28d9",
    gradientToHex: "#a78bfa",
    bgTintHex: "rgba(139, 92, 246, 0.08)",
    ringHex: "rgba(196, 181, 253, 0.4)",
    textClass: "text-[#c4b5fd]",
    borderClass: "border-[#8b5cf6]/30",
    bgClass: "bg-[#8b5cf6]/[0.05]",
    confFloor: "0,70",
    accuracyClaim: "70%+",
  },

  // ───────── PLATINUM — metallic gold (top tier crown) ─────────
  platinum: {
    name: "Platinum",
    numeral: "IV",
    colorHex: "#d4af37", // metallic gold
    highlightHex: "#f5d67a",
    gradientFromHex: "#b8860b",
    gradientToHex: "#fbbf24",
    bgTintHex: "rgba(212, 175, 55, 0.08)",
    ringHex: "rgba(245, 214, 122, 0.45)",
    textClass: "text-[#f5d67a]",
    borderClass: "border-[#d4af37]/35",
    bgClass: "bg-[#d4af37]/[0.06]",
    confFloor: "0,75",
    accuracyClaim: "80%+",
  },
};

/** Return all tiers in display order (Bronze → Platinum). */
export const TIER_ORDER: TierKey[] = ["bronze", "silver", "gold", "platinum"];

/** Backend-compatible aliases — the Python side uses 'free' for Bronze. */
export function backendSlugToTier(slug: string): TierKey {
  const s = slug.toLowerCase();
  if (s === "free" || s === "bronze") return "bronze";
  if (s === "silver") return "silver";
  if (s === "gold") return "gold";
  if (s === "platinum") return "platinum";
  return "bronze";
}
