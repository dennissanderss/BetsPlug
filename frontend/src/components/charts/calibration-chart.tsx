"use client";

import * as React from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

export interface CalibrationPoint {
  predicted: number;
  actual: number;
  count?: number;
}

interface CalibrationChartProps {
  data: CalibrationPoint[];
  title?: string;
  className?: string;
}

// Perfect calibration line points
const perfectLine = [
  { x: 0, y: 0 },
  { x: 1, y: 1 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: CalibrationPoint }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">
        Predicted: {(d.predicted * 100).toFixed(1)}%
      </p>
      <p className="text-muted-foreground">
        Actual: {(d.actual * 100).toFixed(1)}%
      </p>
      {d.count !== undefined && (
        <p className="text-muted-foreground">Samples: {d.count}</p>
      )}
    </div>
  );
}

export function CalibrationChart({
  data,
  title = "Calibration Chart",
  className,
}: CalibrationChartProps) {
  // Merge scatter data + perfect-line data into one composedChart dataset
  const scatterData = data.map((d) => ({
    predicted: d.predicted,
    actual: d.actual,
    count: d.count,
  }));

  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <p className="text-sm font-medium text-foreground">{title}</p>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border"
            stroke="currentColor"
            opacity={0.4}
          />
          <XAxis
            dataKey="predicted"
            type="number"
            domain={[0, 1]}
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            label={{
              value: "Predicted Probability",
              position: "insideBottom",
              offset: -12,
              className: "fill-muted-foreground text-xs",
              fontSize: 11,
            }}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            dataKey="actual"
            type="number"
            domain={[0, 1]}
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            label={{
              value: "Actual Rate",
              angle: -90,
              position: "insideLeft",
              offset: 8,
              className: "fill-muted-foreground text-xs",
              fontSize: 11,
            }}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={28}
            iconSize={10}
            wrapperStyle={{ fontSize: 12 }}
          />

          {/* Perfect calibration diagonal */}
          <Line
            data={perfectLine}
            dataKey="y"
            name="Perfect Calibration"
            stroke="#6366f1"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            legendType="line"
          />

          {/* Actual calibration scatter */}
          <Scatter
            data={scatterData}
            name="Model Calibration"
            fill="#f59e0b"
            opacity={0.85}
            r={4}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
