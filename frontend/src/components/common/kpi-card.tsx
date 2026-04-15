import * as React from "react";
import { cn } from "@/lib/utils";
import { HexBadge, type HexVariant } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ElementType;
  className?: string;
  /** When true, the value is rendered with gradient text */
  highlight?: boolean;
  /** Colour variant for the hex badge + card halo. */
  variant?: HexVariant | "none";
}

const NEON_CLASS: Record<HexVariant | "none", string> = {
  green: "card-neon card-neon-green",
  purple: "card-neon card-neon-purple",
  blue: "card-neon card-neon-blue",
  none: "card-neon",
};

const GRADIENT_CLASS: Record<HexVariant | "none", string> = {
  green: "gradient-text-green",
  purple: "gradient-text-purple",
  blue: "gradient-text-cyan",
  none: "",
};

/**
 * KpiCard — NOCTURNE variant wrapped in card-neon with a coloured
 * hex badge + per-variant gradient value text and a win/loss pill.
 */
export function KpiCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  className,
  highlight = true,
  variant = "green",
}: KpiCardProps) {
  const trendPositive = change !== undefined && change > 0;
  const trendNegative = change !== undefined && change < 0;
  const trendNeutral = change !== undefined && change === 0;

  const hexVariant: HexVariant = variant === "none" ? "green" : variant;
  const gradientClass = GRADIENT_CLASS[variant];

  return (
    <div className={cn(NEON_CLASS[variant], "p-5", className)}>
      {/* ::before gradient mask requires a relative interior wrapper. */}
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a3a9b8] truncate">
            {title}
          </p>

          <p
            className={cn(
              "text-stat text-3xl leading-none text-[#ededed]",
              highlight && gradientClass
            )}
          >
            {value}
          </p>

          {change !== undefined && (
            <div className="flex items-center gap-1.5 pt-0.5">
              {trendPositive && (
                <Pill tone="win">+{change.toFixed(1)}%</Pill>
              )}
              {trendNegative && (
                <Pill tone="loss">{change.toFixed(1)}%</Pill>
              )}
              {trendNeutral && <Pill tone="draw">0.0%</Pill>}
              {changeLabel && (
                <span className="text-[10px] uppercase tracking-widest text-[#6b7280]">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <HexBadge variant={hexVariant} size="md">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </HexBadge>
        )}
      </div>
    </div>
  );
}
