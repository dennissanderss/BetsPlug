import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ElementType;
  className?: string;
  /** When true, the value is rendered with gradient text */
  highlight?: boolean;
}

export function KpiCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  className,
  highlight = true,
}: KpiCardProps) {
  const trendPositive = change !== undefined && change > 0;
  const trendNegative = change !== undefined && change < 0;
  const trendNeutral  = change !== undefined && change === 0;

  return (
    <div className={cn("panel-lime scanline group relative overflow-hidden p-5", className)}>
      {/* Corner brackets */}
      <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-[#4ade80]" />
      <span className="pointer-events-none absolute right-0 bottom-0 h-3 w-3 border-r-2 border-b-2 border-[#4ade80]" />

      <div className="flex items-start justify-between gap-3">
        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <p className="mono-label truncate">{title}</p>

          <p
            className={cn(
              "text-stat leading-none",
              highlight ? "text-[#4ade80] text-4xl" : "text-white text-4xl"
            )}
          >
            {value}
          </p>

          {change !== undefined && (
            <div className="flex items-center gap-1.5 pt-0.5">
              {trendPositive && (
                <div className="flex items-center gap-1 text-[#4ade80]">
                  <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                  <span className="font-mono text-[11px] font-black tracking-wider">
                    +{change.toFixed(1)}%
                  </span>
                </div>
              )}
              {trendNegative && (
                <div className="flex items-center gap-1 text-[#ef4444]">
                  <TrendingDown className="h-3.5 w-3.5" strokeWidth={2.5} />
                  <span className="font-mono text-[11px] font-black tracking-wider">
                    {change.toFixed(1)}%
                  </span>
                </div>
              )}
              {trendNeutral && (
                <div className="flex items-center gap-1 text-[#707070]">
                  <Minus className="h-3.5 w-3.5" />
                  <span className="font-mono text-[11px] font-black tracking-wider">0.0%</span>
                </div>
              )}
              {changeLabel && (
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#707070]">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#4ade80]/50 bg-[#4ade80]/[0.08]">
            <Icon className="h-5 w-5 text-[#4ade80]" strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
}
