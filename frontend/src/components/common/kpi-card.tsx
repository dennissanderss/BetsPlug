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
    <div
      className={cn("glass-card-hover group relative overflow-hidden p-5", className)}
    >
      {/* Subtle top-left glow on hover */}
      <div
        className="pointer-events-none absolute -top-8 -left-8 h-24 w-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="flex items-start justify-between gap-3">
        {/* Content */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase truncate">
            {title}
          </p>

          <p
            className={cn(
              "text-3xl font-bold tracking-tight leading-none",
              highlight ? "gradient-text" : "text-slate-100"
            )}
          >
            {value}
          </p>

          {change !== undefined && (
            <div className="flex items-center gap-1.5 pt-0.5">
              {trendPositive && (
                <div className="flex items-center gap-1 text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">
                    +{change.toFixed(1)}%
                  </span>
                </div>
              )}
              {trendNegative && (
                <div className="flex items-center gap-1 text-red-400">
                  <TrendingDown className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">
                    {change.toFixed(1)}%
                  </span>
                </div>
              )}
              {trendNeutral && (
                <div className="flex items-center gap-1 text-slate-500">
                  <Minus className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">0.0%</span>
                </div>
              )}
              {changeLabel && (
                <span className="text-xs text-slate-600 font-normal">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-200 group-hover:scale-110"
            style={{
              background: "rgba(59, 130, 246, 0.12)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
            }}
          >
            <Icon
              className="h-5 w-5 text-blue-400"
              style={{ filter: "drop-shadow(0 0 4px rgba(59,130,246,0.6))" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
