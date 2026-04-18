import * as React from "react";
import { cn } from "@/lib/utils";
import type { PickTierSlug } from "@/types/api";

/**
 * PickTierBadge — v8.1 quality-tier indicator for a single prediction.
 *
 * Each prediction is classified into one of four tiers (platinum/gold/
 * silver/free) based on league quality and confidence. The badge is a
 * premium SVG shield with tier-specific gradient + indicator glyph so
 * it looks consistent cross-platform (no emoji rendering issues) and
 * carries a visual hint of rank without needing to read the label.
 *
 * Design language matches NOCTURNE:
 *   - Platinum: green gradient, 3-star indicator, strongest glow
 *   - Gold:     blue gradient, 2-star indicator, medium glow
 *   - Silver:   grey-white gradient, 1-dot indicator, subtle glow
 *   - Free:     dashed outline, minimal treatment
 *
 * Usage:
 *   <PickTierBadge tier="platinum" accuracy="80%+" size="md" />
 *   <PickTierBadge tier="gold" accuracy="70%+" locked />
 *   <PickTierBadge tier="silver" label="Silver Pick" showLabel />
 */

// ─── Display metadata (default if API doesn't provide label/accuracy) ───────
const TIER_DISPLAY: Record<
  PickTierSlug,
  { label: string; accuracy: string; order: number }
> = {
  platinum: { label: "Platinum", accuracy: "80%+", order: 3 },
  gold: { label: "Gold", accuracy: "70%+", order: 2 },
  silver: { label: "Silver", accuracy: "60%+", order: 1 },
  free: { label: "Free", accuracy: "45%+", order: 0 },
};

// ─── Tier-specific visual tokens ─────────────────────────────────────────────
interface TierVisuals {
  /** SVG linear-gradient stops (top → bottom). */
  from: string;
  to: string;
  /** Drop-shadow color for glow. */
  glow: string;
  /** Inner fill top (translucent tint). */
  fillTop: string;
  /** Inner fill bottom (dark). */
  fillBottom: string;
  /** Indicator fill (stars / dots / slash). */
  indicator: string;
  /** Stroke width override for Free's dashed style. */
  dashArray?: string;
  /** Text color for the label/accuracy pill. */
  textColor: string;
  /** Background of the label pill. */
  pillBg: string;
}

// v8.6 — palette derived from the central tier-theme tokens used by the
// homepage (Bronze=copper, Silver=metallic, Gold=metallic-gold,
// Platinum=icy diamond). Keeps the dashboard badges visually aligned
// with pricing + TierLadder so users don't see a different tier colour
// per page.
const VISUALS: Record<PickTierSlug, TierVisuals> = {
  platinum: {
    from: "#d9f0ff",
    to: "#5eb3d9",
    glow: "rgba(168, 216, 234, 0.55)",
    fillTop: "rgba(168, 216, 234, 0.32)",
    fillBottom: "rgba(8, 18, 30, 0.78)",
    indicator: "#e0f4ff",
    textColor: "#d9f0ff",
    pillBg: "rgba(168, 216, 234, 0.12)",
  },
  gold: {
    from: "#fbbf24",
    to: "#b8860b",
    glow: "rgba(212, 175, 55, 0.55)",
    fillTop: "rgba(212, 175, 55, 0.32)",
    fillBottom: "rgba(18, 12, 4, 0.78)",
    indicator: "#fef3c7",
    textColor: "#f5d67a",
    pillBg: "rgba(212, 175, 55, 0.12)",
  },
  silver: {
    from: "#e5e4e2",
    to: "#8a8d91",
    glow: "rgba(192, 192, 192, 0.22)",
    fillTop: "rgba(192, 192, 192, 0.18)",
    fillBottom: "rgba(12, 16, 22, 0.75)",
    indicator: "#e5e4e2",
    textColor: "#e5e4e2",
    pillBg: "rgba(192, 192, 192, 0.08)",
  },
  free: {
    from: "#d68a4a",
    to: "#8b5a2b",
    glow: "rgba(184, 115, 51, 0.35)",
    fillTop: "rgba(184, 115, 51, 0.18)",
    fillBottom: "rgba(14, 10, 6, 0.72)",
    indicator: "#e8a864",
    textColor: "#e8a864",
    pillBg: "rgba(184, 115, 51, 0.10)",
  },
};

// ─── Size tokens ─────────────────────────────────────────────────────────────
type BadgeSize = "sm" | "md" | "lg";
const SIZES: Record<BadgeSize, { shield: number; label: string; pill: string }> = {
  sm: { shield: 20, label: "text-[10px]", pill: "px-1.5 py-0.5 gap-1" },
  md: { shield: 28, label: "text-xs", pill: "px-2 py-1 gap-1.5" },
  lg: { shield: 40, label: "text-sm", pill: "px-2.5 py-1.5 gap-2" },
};

// ─── Indicator SVGs per tier ─────────────────────────────────────────────────
// Rendered inside the shield at its center. Simple path geometry so they
// scale cleanly from 20px → 40px without raster artefacts.
function TierIndicator({ tier, color }: { tier: PickTierSlug; color: string }) {
  if (tier === "platinum") {
    // 3 stacked chevrons — strongest visual weight
    return (
      <>
        <path d="M 30 42 L 50 32 L 70 42" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 30 56 L 50 46 L 70 56" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 30 70 L 50 60 L 70 70" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    );
  }
  if (tier === "gold") {
    // 2 chevrons
    return (
      <>
        <path d="M 30 46 L 50 36 L 70 46" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 30 64 L 50 54 L 70 64" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    );
  }
  if (tier === "silver") {
    // 1 chevron
    return (
      <path
        d="M 28 55 L 50 40 L 72 55"
        stroke={color}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }
  // free: small horizontal dash
  return (
    <line
      x1="38"
      y1="50"
      x2="62"
      y2="50"
      stroke={color}
      strokeWidth="5"
      strokeLinecap="round"
    />
  );
}

// ─── Lock icon (shown in locked state) ───────────────────────────────────────
function LockOverlay({ color }: { color: string }) {
  return (
    <g>
      <rect x="38" y="50" width="24" height="22" rx="3" fill={color} fillOpacity="0.9" />
      <path
        d="M 42 50 L 42 42 C 42 37 46 33 50 33 C 54 33 58 37 58 42 L 58 50"
        stroke={color}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

// ─── Shield SVG wrapper ──────────────────────────────────────────────────────
interface ShieldProps {
  tier: PickTierSlug;
  size: number;
  locked?: boolean;
}

function TierShield({ tier, size, locked }: ShieldProps) {
  const v = VISUALS[tier];
  const id = React.useId();
  const strokeGradient = `pt-stroke-${id}`;
  const fillGradient = `pt-fill-${id}`;

  const indicatorColor = locked ? "rgba(148,163,184,0.85)" : v.indicator;
  const strokeFrom = locked ? "#475569" : v.from;
  const strokeTo = locked ? "#334155" : v.to;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      className="shrink-0"
      style={{
        filter: !locked && v.glow !== "rgba(0, 0, 0, 0)"
          ? `drop-shadow(0 0 8px ${v.glow})`
          : undefined,
      }}
    >
      <defs>
        <linearGradient id={strokeGradient} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor={strokeFrom} stopOpacity="1" />
          <stop offset="100%" stopColor={strokeTo} stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={fillGradient} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor={locked ? "rgba(71,85,105,0.12)" : v.fillTop} />
          <stop offset="100%" stopColor={locked ? "rgba(6,10,16,0.7)" : v.fillBottom} />
        </linearGradient>
      </defs>
      {/* Shield shape: flat top, pointed bottom, slightly curved flanks */}
      <path
        d="M 50 6
           L 88 18
           L 88 52
           Q 88 74 70 86
           Q 60 94 50 96
           Q 40 94 30 86
           Q 12 74 12 52
           L 12 18
           Z"
        fill={`url(#${fillGradient})`}
        stroke={`url(#${strokeGradient})`}
        strokeWidth="3"
        strokeLinejoin="round"
        strokeDasharray={v.dashArray}
      />
      {locked ? (
        <LockOverlay color={indicatorColor} />
      ) : (
        <TierIndicator tier={tier} color={indicatorColor} />
      )}
    </svg>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export interface PickTierBadgeProps {
  /** Tier slug from API. */
  tier: PickTierSlug;
  /** Override accuracy claim from API; falls back to static default. */
  accuracy?: string | null;
  /** Override visible label; falls back to static default ("Platinum" etc). */
  label?: string | null;
  /** Compact (shield only) vs full (shield + label pill). */
  size?: BadgeSize;
  /**
   * Whether to show the text label next to the shield.
   * Default: true for md/lg, false for sm (shield-only).
   */
  showLabel?: boolean;
  /**
   * Whether to show the accuracy claim next to the label.
   * Default: true when showLabel is true.
   */
  showAccuracy?: boolean;
  /** Locked state: grays out + lock icon, used when user's tier is below pick's tier. */
  locked?: boolean;
  /** Optional click handler — e.g. open UpgradeLockModal when locked. */
  onClick?: () => void;
  className?: string;
  /** Optional native title tooltip fallback for non-rich contexts. */
  title?: string;
}

export function PickTierBadge({
  tier,
  accuracy,
  label,
  size = "md",
  showLabel,
  showAccuracy,
  locked = false,
  onClick,
  className,
  title,
}: PickTierBadgeProps) {
  const v = VISUALS[tier];
  const defaults = TIER_DISPLAY[tier];
  const s = SIZES[size];

  const effectiveShowLabel = showLabel ?? size !== "sm";
  const effectiveShowAccuracy = showAccuracy ?? effectiveShowLabel;
  const resolvedLabel = label ?? defaults.label;
  const resolvedAccuracy = accuracy ?? defaults.accuracy;

  const nativeTooltip =
    title ??
    (locked
      ? `${resolvedLabel} tier — upgrade to unlock`
      : `${resolvedLabel} pick · historical accuracy ${resolvedAccuracy}`);

  const content = (
    <span
      className={cn(
        "inline-flex items-center rounded-full border transition-opacity",
        s.pill,
        locked ? "opacity-60" : "opacity-100",
        className,
      )}
      style={{
        background: v.pillBg,
        borderColor: locked ? "rgba(100,116,139,0.25)" : `${v.from}3a`,
        color: locked ? "#94a3b8" : v.textColor,
      }}
      title={nativeTooltip}
    >
      <TierShield tier={tier} size={s.shield} locked={locked} />
      {effectiveShowLabel && (
        <span className={cn("font-semibold tracking-tight", s.label)}>
          {resolvedLabel}
        </span>
      )}
      {effectiveShowAccuracy && (
        <span
          className={cn("font-medium opacity-75", s.label)}
          aria-label={`Historical accuracy ${resolvedAccuracy}`}
        >
          {resolvedAccuracy}
        </span>
      )}
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group inline-flex cursor-pointer bg-transparent p-0 hover:opacity-90"
        aria-label={nativeTooltip}
      >
        {content}
      </button>
    );
  }

  return content;
}

export default PickTierBadge;
