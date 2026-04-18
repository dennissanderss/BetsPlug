"use client";

import { TIER_THEME, type TierKey } from "./tier-theme";

/**
 * TierEmblem, Roman-numeral disc in the tier's signature color.
 *
 * Visual anchor for Bronze/Silver/Gold/Platinum across the site.
 * Use anywhere you previously had a hex-badge + tier label:
 *
 *     <TierEmblem tier="platinum" size="md" />
 *     <TierEmblem tier="gold" size="sm" showName />
 */

export type TierEmblemSize = "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<TierEmblemSize, {
  box: string;       // outer circle
  text: string;      // numeral font size
  ring: string;      // ring offset class
}> = {
  sm: { box: "h-8 w-8", text: "text-[11px]", ring: "ring-1" },
  md: { box: "h-11 w-11", text: "text-sm", ring: "ring-1" },
  lg: { box: "h-14 w-14", text: "text-lg", ring: "ring-2" },
  xl: { box: "h-20 w-20", text: "text-2xl", ring: "ring-2" },
};

export function TierEmblem({
  tier,
  size = "md",
  showName = false,
  className = "",
}: {
  tier: TierKey;
  size?: TierEmblemSize;
  showName?: boolean;
  className?: string;
}) {
  const theme = TIER_THEME[tier];
  const sz = SIZE_MAP[size];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`relative ${sz.box} ${sz.ring} flex items-center justify-center rounded-full`}
        style={{
          background: `linear-gradient(135deg, ${theme.gradientFromHex}, ${theme.gradientToHex})`,
          boxShadow: `0 0 20px ${theme.ringHex}, inset 0 1px 0 rgba(255,255,255,0.2)`,
          // @ts-expect-error — tailwind ring-color via CSS var
          "--tw-ring-color": theme.ringHex,
        }}
      >
        {/* Inner darker disc for contrast */}
        <div
          className="absolute inset-[3px] rounded-full"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${theme.gradientToHex}33, ${theme.gradientFromHex})`,
          }}
        />
        <span
          className={`relative ${sz.text} font-black tracking-wider text-white`}
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
        >
          {theme.numeral}
        </span>
      </div>
      {showName && (
        <span className={`text-xs font-bold uppercase tracking-widest ${theme.textClass}`}>
          {theme.name}
        </span>
      )}
    </div>
  );
}
