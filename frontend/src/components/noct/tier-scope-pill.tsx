"use client";

/**
 * TierScopePill — small chip that makes it unambiguous *which* pick
 * tier the surrounding data is filtered to. Reads the current user's
 * tier from useTier() and renders "Showing: <emoji> <label> (<acc>)".
 *
 * Used on every dashboard surface that surfaces a list of matches
 * (Live Now, Today's Matches, /predictions, /live) so Free/Silver/Gold
 * users can tell at a glance whose picks they're looking at.
 *
 * Returns null while tier state is hydrating — the small delay is
 * preferable to a flash of the wrong tier label.
 */

import { useTier, type Tier } from "@/hooks/use-tier";

// v8.6 — Roman numerals + central-tier-theme colour tokens (Bronze /
// Silver / Gold-metallic / Platinum-diamond-blue). Replaces the earlier
// emoji + blue/green palette so every surface that renders this chip
// matches the homepage tier language.
const INFO: Record<
  Tier,
  { label: string; accuracy: string; numeral: string; accent: string }
> = {
  free: {
    label: "Free Access",
    accuracy: "45%+",
    numeral: "I",
    accent:
      "text-[#e8a864] border-[#b87333]/30 bg-[#b87333]/[0.06]",
  },
  silver: {
    label: "Silver",
    accuracy: "60%+",
    numeral: "II",
    accent:
      "text-[#e5e4e2] border-[#c0c0c0]/30 bg-[#c0c0c0]/[0.05]",
  },
  gold: {
    label: "Gold",
    accuracy: "70%+",
    numeral: "III",
    accent:
      "text-[#f5d67a] border-[#d4af37]/30 bg-[#d4af37]/[0.05]",
  },
  platinum: {
    label: "Platinum",
    accuracy: "80%+",
    numeral: "IV",
    accent:
      "text-[#d9f0ff] border-[#a8d8ea]/35 bg-[#a8d8ea]/[0.06]",
  },
};

interface TierScopePillProps {
  prefix?: string;
  className?: string;
  compact?: boolean;
}

export function TierScopePill({
  prefix = "Showing",
  className = "",
  compact = false,
}: TierScopePillProps) {
  const { tier, ready } = useTier();
  if (!ready) return null;

  const info = INFO[tier];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${info.accent} ${className}`}
      title={`Data scoped to ${info.label} tier (${info.accuracy} historical accuracy)`}
    >
      <span aria-hidden className="font-mono text-[9px] leading-none">
        {info.numeral}
      </span>
      {compact ? (
        <span>
          {info.label} {info.accuracy}
        </span>
      ) : (
        <span>
          {prefix}: {info.label} {info.accuracy}
        </span>
      )}
    </span>
  );
}

export default TierScopePill;
