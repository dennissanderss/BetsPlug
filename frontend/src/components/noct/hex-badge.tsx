import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * HexBadge — the hexagonal icon frame used site-wide for feature
 * tiles, sidebar icons and KPI accents.
 *
 * The hexagon is rendered as inline SVG so the gradient stroke and
 * drop-shadow glow render crisply at every size. The icon slot is
 * whatever you pass as children (usually a lucide icon).
 */

export type HexVariant = "green" | "purple" | "blue";
export type HexSize = "sm" | "md" | "lg" | "xl";

const SIZES: Record<HexSize, { px: number; icon: number }> = {
  sm: { px: 36, icon: 16 },
  md: { px: 48, icon: 20 },
  lg: { px: 68, icon: 28 },
  xl: { px: 96, icon: 40 },
};

const VARIANT_COLOURS: Record<
  HexVariant,
  { from: string; to: string; glow: string; icon: string; fillTop: string; fillBottom: string }
> = {
  green: {
    from: "#4ade80",
    to: "#22c55e",
    glow: "rgba(74, 222, 128, 0.55)",
    icon: "#4ade80",
    fillTop: "rgba(74, 222, 128, 0.22)",
    fillBottom: "rgba(6, 10, 16, 0.6)",
  },
  purple: {
    from: "#d946ef",
    to: "#a855f7",
    glow: "rgba(168, 85, 247, 0.55)",
    icon: "#d8b4fe",
    fillTop: "rgba(168, 85, 247, 0.28)",
    fillBottom: "rgba(6, 10, 16, 0.6)",
  },
  blue: {
    from: "#60a5fa",
    to: "#3b82f6",
    glow: "rgba(59, 130, 246, 0.5)",
    icon: "#93c5fd",
    fillTop: "rgba(59, 130, 246, 0.24)",
    fillBottom: "rgba(6, 10, 16, 0.6)",
  },
};

interface HexBadgeProps {
  variant?: HexVariant;
  size?: HexSize;
  className?: string;
  children?: React.ReactNode;
  /** Drop the outer glow (use when the badge sits on an already-glowing tile). */
  noGlow?: boolean;
}

export function HexBadge({
  variant = "green",
  size = "md",
  className,
  children,
  noGlow,
}: HexBadgeProps) {
  const { px, icon: iconPx } = SIZES[size];
  const c = VARIANT_COLOURS[variant];
  const id = React.useId();
  const strokeId = `hex-stroke-${id}`;
  const fillId = `hex-fill-${id}`;

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{
        width: px,
        height: px,
        filter: noGlow ? undefined : `drop-shadow(0 0 12px ${c.glow})`,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width={px}
        height={px}
        aria-hidden="true"
        className="absolute inset-0"
      >
        <defs>
          <linearGradient id={strokeId} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={c.from} stopOpacity="1" />
            <stop offset="100%" stopColor={c.to} stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id={fillId} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={c.fillTop} />
            <stop offset="100%" stopColor={c.fillBottom} />
          </linearGradient>
        </defs>
        {/* Regular hexagon (flat-top) — pointy corners slightly rounded */}
        <polygon
          points="50,4 93,27 93,73 50,96 7,73 7,27"
          fill={`url(#${fillId})`}
          stroke={`url(#${strokeId})`}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
      <div
        className="relative flex items-center justify-center"
        style={{ color: c.icon, width: iconPx, height: iconPx }}
      >
        {children}
      </div>
    </div>
  );
}

export default HexBadge;
