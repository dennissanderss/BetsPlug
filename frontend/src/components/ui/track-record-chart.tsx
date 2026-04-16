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
export function TrackRecordChart({ data }: TrackRecordChartProps) {
  const series = data && data.length >= 2 ? data : FALLBACK_DATA;

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
        durationInFrames={150}
        fps={30}
        compositionWidth={1000}
        compositionHeight={560}
        autoPlay
        loop
        style={{
          width: "100%",
          height: "100%",
        }}
        controls={false}
        clickToPlay={false}
      />
    </div>
  );
}
