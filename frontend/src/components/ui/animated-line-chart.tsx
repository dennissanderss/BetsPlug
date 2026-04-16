"use client";

import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface AnimatedLineChartProps {
  /** Array of numeric data points (e.g. cumulative accuracy %). */
  data?: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  gridColor?: string;
  showDot?: boolean;
  /** Animation speed multiplier. */
  speed?: number;
  /** Show subtle fill gradient under the line. */
  showFill?: boolean;
  className?: string;
}

/**
 * Animated line chart rendered via Remotion spring physics.
 * NOCTURNE-styled: transparent background, logo-green stroke,
 * subtle grid matching card-neon borders.
 */
export function AnimatedLineChart({
  data = [55, 58, 54, 60, 57, 63, 61, 66, 64],
  width = 1000,
  height = 500,
  strokeColor = "#4ade80",
  strokeWidth = 3,
  gridColor = "rgba(255,255,255,0.06)",
  showDot = true,
  speed = 1,
  showFill = true,
  className,
}: AnimatedLineChartProps) {
  const frame = useCurrentFrame() * speed;
  const { fps, durationInFrames } = useVideoConfig();

  const padding = { top: 40, right: 30, bottom: 40, left: 50 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const min = Math.min(...data) - 2;
  const max = Math.max(...data) + 2;
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = padding.left + (index / (data.length - 1)) * innerWidth;
    const y =
      padding.top + innerHeight - ((value - min) / range) * innerHeight;
    return { x, y, value };
  });

  // Analytical path length
  let pathLength = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    pathLength += Math.sqrt(dx * dx + dy * dy);
  }

  const d = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`,
    )
    .join(" ");

  // Fill area path — same line + close along bottom
  const fillD = `${d} L${points[points.length - 1].x.toFixed(2)},${(padding.top + innerHeight).toFixed(2)} L${points[0].x.toFixed(2)},${(padding.top + innerHeight).toFixed(2)} Z`;

  // Spring-driven progress — draw phase uses first 70% of frames,
  // remaining 30% holds the final state before the loop restarts.
  const drawFrames = Math.round(durationInFrames * 0.7);
  const progress = spring({
    frame: Math.min(frame, drawFrames),
    fps,
    durationInFrames: drawFrames,
    config: { damping: 200 },
  });

  const dashOffset = pathLength * (1 - progress);

  // Dot position along the path
  const targetLen = pathLength * progress;
  let traveled = 0;
  let dotX = points[0].x;
  let dotY = points[0].y;
  let dotValue = points[0].value;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    if (traveled + segLen >= targetLen) {
      const t = (targetLen - traveled) / segLen;
      dotX = points[i - 1].x + dx * t;
      dotY = points[i - 1].y + dy * t;
      dotValue =
        points[i - 1].value + (points[i].value - points[i - 1].value) * t;
      break;
    }
    traveled += segLen;
    dotX = points[i].x;
    dotY = points[i].y;
    dotValue = points[i].value;
  }

  const gridRows = 4;

  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
          <clipPath id="lineClip">
            <rect
              x={padding.left}
              y={0}
              width={innerWidth * progress}
              height={height}
            />
          </clipPath>
        </defs>

        {/* Horizontal grid lines + Y-axis labels */}
        {Array.from({ length: gridRows + 1 }).map((_, i) => {
          const y = padding.top + (i / gridRows) * innerHeight;
          const val = max - (i / gridRows) * range;
          return (
            <g key={`h-${i}`}>
              <line
                x1={padding.left}
                x2={padding.left + innerWidth}
                y1={y}
                y2={y}
                stroke={gridColor}
                strokeWidth={1}
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fill="rgba(255,255,255,0.3)"
                fontSize={11}
                fontFamily="var(--font-geist-sans), system-ui, sans-serif"
              >
                {Math.round(val)}%
              </text>
            </g>
          );
        })}

        {/* Gradient fill — clipped to reveal alongside line */}
        {showFill && (
          <path
            d={fillD}
            fill="url(#chartFill)"
            clipPath="url(#lineClip)"
          />
        )}

        {/* Animated line */}
        <path
          d={d}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength}
          strokeDashoffset={dashOffset}
          style={{
            filter: `drop-shadow(0 0 10px ${strokeColor}66)`,
          }}
        />

        {/* Trailing dot */}
        {showDot && progress > 0.01 && progress < 0.99 && (
          <g>
            {/* Outer glow */}
            <circle
              cx={dotX}
              cy={dotY}
              r={strokeWidth * 4}
              fill={strokeColor}
              opacity={0.15}
            />
            {/* Inner dot */}
            <circle
              cx={dotX}
              cy={dotY}
              r={strokeWidth * 1.8}
              fill={strokeColor}
              style={{ filter: `drop-shadow(0 0 6px ${strokeColor})` }}
            />
            {/* Value label */}
            <text
              x={dotX}
              y={dotY - strokeWidth * 5}
              textAnchor="middle"
              fill="#ededed"
              fontSize={13}
              fontWeight={600}
              fontFamily="var(--font-geist-sans), system-ui, sans-serif"
            >
              {dotValue.toFixed(1)}%
            </text>
          </g>
        )}

        {/* Final value (after animation completes) */}
        {progress >= 0.99 && (
          <g>
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r={strokeWidth * 2}
              fill={strokeColor}
              style={{ filter: `drop-shadow(0 0 8px ${strokeColor})` }}
            />
            <text
              x={points[points.length - 1].x}
              y={points[points.length - 1].y - strokeWidth * 4}
              textAnchor="middle"
              fill="#ededed"
              fontSize={14}
              fontWeight={700}
              fontFamily="var(--font-geist-sans), system-ui, sans-serif"
            >
              {points[points.length - 1].value.toFixed(1)}%
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
