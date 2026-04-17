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

const INFO: Record<
  Tier,
  { label: string; accuracy: string; emoji: string; accent: string }
> = {
  free: {
    label: "Free",
    accuracy: "45%+",
    emoji: "⬜",
    accent: "text-slate-300 border-slate-400/20 bg-slate-400/[0.08]",
  },
  silver: {
    label: "Silver",
    accuracy: "60%+",
    emoji: "⚪",
    accent: "text-slate-200 border-slate-300/30 bg-slate-300/[0.08]",
  },
  gold: {
    label: "Gold",
    accuracy: "70%+",
    emoji: "🔵",
    accent: "text-blue-200 border-blue-400/30 bg-blue-500/[0.08]",
  },
  platinum: {
    label: "Platinum",
    accuracy: "85%+",
    emoji: "🟢",
    accent: "text-emerald-200 border-emerald-400/30 bg-emerald-500/[0.08]",
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
      <span aria-hidden>{info.emoji}</span>
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
