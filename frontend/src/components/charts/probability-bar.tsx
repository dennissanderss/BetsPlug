import * as React from "react";
import { cn } from "@/lib/utils";

interface ProbabilityBarProps {
  home: number;
  draw: number;
  away: number;
  homeLabel?: string;
  awayLabel?: string;
  showLabels?: boolean;
  className?: string;
}

function formatPct(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

export function ProbabilityBar({
  home,
  draw,
  away,
  homeLabel = "Home",
  awayLabel = "Away",
  showLabels = true,
  className,
}: ProbabilityBarProps) {
  // Normalise so segments always sum to 100%
  const total = home + draw + away || 1;
  const homePct = (home / total) * 100;
  const drawPct = (draw / total) * 100;
  const awayPct = (away / total) * 100;

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Outcome labels above */}
      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground font-medium">
          <span>{homeLabel}</span>
          <span>Draw</span>
          <span>{awayLabel}</span>
        </div>
      )}

      {/* Stacked bar */}
      <div className="flex h-7 w-full overflow-hidden rounded-md">
        {/* Home - blue */}
        <div
          className="flex items-center justify-center bg-blue-500 text-white text-xs font-semibold transition-all duration-300"
          style={{ width: `${homePct}%` }}
          title={`${homeLabel}: ${formatPct(home)}`}
        >
          {homePct >= 10 && formatPct(home)}
        </div>

        {/* Draw - slate */}
        <div
          className="flex items-center justify-center bg-slate-400 text-white text-xs font-semibold transition-all duration-300"
          style={{ width: `${drawPct}%` }}
          title={`Draw: ${formatPct(draw)}`}
        >
          {drawPct >= 10 && formatPct(draw)}
        </div>

        {/* Away - orange */}
        <div
          className="flex items-center justify-center bg-orange-500 text-white text-xs font-semibold transition-all duration-300"
          style={{ width: `${awayPct}%` }}
          title={`${awayLabel}: ${formatPct(away)}`}
        >
          {awayPct >= 10 && formatPct(away)}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
          {homeLabel} {formatPct(home)}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-400" />
          Draw {formatPct(draw)}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-orange-500" />
          {awayLabel} {formatPct(away)}
        </span>
      </div>
    </div>
  );
}
