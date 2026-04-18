/**
 * Single source of truth for tier colors, emblems and Roman numerals.
 *
 * Design decisions (per product feedback, 2026-04-18):
 *   - Bronze (Free)  → metallic copper           → Roman I
 *   - Silver         → metallic silver           → Roman II
 *   - Gold           → metallic gold             → Roman III
 *   - Platinum       → icy diamond blue          → Roman IV
 *
 * Platinum sits above Gold, so it uses an icy diamond-blue palette
 * (lighter and cooler than Silver) to read as "the tier above gold"
 * without colliding with the metallic silver below.
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

  // ───────── GOLD — metallic gold ─────────
  gold: {
    name: "Gold",
    numeral: "III",
    colorHex: "#d4af37", // metallic gold
    highlightHex: "#f5d67a",
    gradientFromHex: "#b8860b",
    gradientToHex: "#fbbf24",
    bgTintHex: "rgba(212, 175, 55, 0.08)",
    ringHex: "rgba(245, 214, 122, 0.4)",
    textClass: "text-[#f5d67a]",
    borderClass: "border-[#d4af37]/30",
    bgClass: "bg-[#d4af37]/[0.05]",
    confFloor: "0,70",
    accuracyClaim: "70%+",
  },

  // ───────── PLATINUM — icy diamond blue (top tier crown) ─────────
  platinum: {
    name: "Platinum",
    numeral: "IV",
    colorHex: "#a8d8ea", // diamond blue
    highlightHex: "#d9f0ff",
    gradientFromHex: "#5eb3d9",
    gradientToHex: "#e0f4ff",
    bgTintHex: "rgba(168, 216, 234, 0.08)",
    ringHex: "rgba(217, 240, 255, 0.5)",
    textClass: "text-[#d9f0ff]",
    borderClass: "border-[#a8d8ea]/35",
    bgClass: "bg-[#a8d8ea]/[0.06]",
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
