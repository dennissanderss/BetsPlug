"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

export interface RollingAccuracyPoint {
  date: string;
  accuracy: number;
  baseline?: number;
}

interface RollingAccuracyChartProps {
  data: RollingAccuracyPoint[];
  title?: string;
  windowLabel?: string;
  baselineLabel?: string;
  showBaseline?: boolean;
  targetAccuracy?: number;
  className?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{ name: string; value: number; color: string }>;
}

function CustomTooltip({ active, label, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-full border border-border bg-popover px-3 py-2 text-sm shadow-md space-y-1">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="text-xs">
          {entry.name}: {(entry.value * 100).toFixed(1)}%
        </p>
      ))}
    </div>
  );
}

export function RollingAccuracyChart({
  data,
  title = "Rolling Accuracy",
  windowLabel = "Rolling Accuracy",
  baselineLabel = "Baseline",
  showBaseline = true,
  targetAccuracy,
  className,
}: RollingAccuracyChartProps) {
  const hasBaseline = showBaseline && data.some((d) => d.baseline !== undefined);

  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <p className="text-sm font-medium text-foreground">{title}</p>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 16, bottom: 24, left: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            opacity={0.2}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            label={{
              value: "Date",
              position: "insideBottom",
              offset: -12,
              fontSize: 11,
            }}
          />
          <YAxis
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            domain={[0, 1]}
            tick={{ fontSize: 11 }}
            label={{
              value: "Accuracy",
              angle: -90,
              position: "insideLeft",
              offset: 8,
              fontSize: 11,
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={28}
            iconSize={10}
            wrapperStyle={{ fontSize: 12 }}
          />

          {/* Target accuracy reference line */}
          {targetAccuracy !== undefined && (
            <ReferenceLine
              y={targetAccuracy}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Target ${(targetAccuracy * 100).toFixed(0)}%`,
                position: "insideTopRight",
                fontSize: 10,
                fill: "#10b981",
              }}
            />
          )}

          {/* Baseline line */}
          {hasBaseline && (
            <Line
              type="monotone"
              dataKey="baseline"
              name={baselineLabel}
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
              activeDot={false}
            />
          )}

          {/* Rolling accuracy line */}
          <Line
            type="monotone"
            dataKey="accuracy"
            name={windowLabel}
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ r: 2, fill: "#6366f1" }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
