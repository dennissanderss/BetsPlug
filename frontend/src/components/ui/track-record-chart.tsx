"use client";

import { Player } from "@remotion/player";
import { AnimatedLineChart } from "./animated-line-chart";

/** Realistic fallback when the API hasn't returned data yet. */
const FALLBACK_DATA = [
  54.2, 55.8, 53.6, 56.1, 57.4, 55.9, 58.3, 60.1, 59.2, 61.5, 60.8, 62.3,
  61.7, 63.0, 62.5, 64.1, 63.4, 65.0, 64.6, 66.2,
];

export interface TrackRecordChartProps {
  /** Cumulative accuracy series from useBotdHistory (null = loading/empty). */
  data?: number[] | null;
  /** Homepage stats — optional, used only to determine loading state. */
  stats?: { total: number; correct: number; winrate: number } | null;
}

/**
 * Remotion Player wrapper that renders AnimatedLineChart with
 * live BOTD cumulative accuracy data. Fully NOCTURNE-styled.
 *
 * Falls back to realistic demo data when the API hasn't returned
 * data yet so the chart area is never blank.
 */
export function TrackRecordChart({ data, stats }: TrackRecordChartProps) {
  const series = data && data.length >= 2 ? data : FALLBACK_DATA;
  const isLive = data !== null && data !== undefined && data.length >= 2;

  return (
    <div className="relative h-full w-full">
      <Player
        component={AnimatedLineChart}
        inputProps={{
          data: series,
          strokeColor: "#4ade80",
          strokeWidth: 3,
          gridColor: "rgba(255,255,255,0.06)",
          showDot: true,
          speed: 1,
          showFill: true,
        }}
        durationInFrames={120}
        fps={30}
        compositionWidth={1000}
        compositionHeight={560}
        autoPlay
        loop={false}
        style={{
          width: "100%",
          height: "100%",
        }}
        controls={false}
        showPosterWhenUnplayed
        clickToPlay={false}
      />

      {/* Live-data indicator badge */}
      {isLive && (
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-[#4ade80]/20 bg-[#0a0a0a]/70 px-2.5 py-1 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ade80] opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4ade80]" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4ade80]">
            Live
          </span>
        </div>
      )}
    </div>
  );
}
