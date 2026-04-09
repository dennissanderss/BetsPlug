"use client";

/**
 * Horizontal probability bar with 3 (or 2) segments for the
 * 1X2 markets. The predicted outcome is highlighted; losing
 * outcomes render at reduced opacity. Draw segment is omitted
 * for sports that don't support draws (set `draw={null}`).
 */

export function ProbBar({
  home,
  draw,
  away,
  homeTeam,
  awayTeam,
}: {
  home: number;
  draw: number | null;
  away: number;
  homeTeam: string;
  awayTeam: string;
}) {
  const total = home + (draw ?? 0) + away;
  const predicted: "home" | "draw" | "away" =
    home >= away && home >= (draw ?? 0)
      ? "home"
      : (draw ?? 0) >= away
        ? "draw"
        : "away";

  const segments = [
    {
      key: "home" as const,
      label: homeTeam.split(" ").pop() || homeTeam,
      prob: home,
      color: "#3b82f6",
      width: `${(home / total) * 100}%`,
    },
    ...(draw !== null
      ? [
          {
            key: "draw" as const,
            label: "Draw",
            prob: draw,
            color: "#f59e0b",
            width: `${(draw / total) * 100}%`,
          },
        ]
      : []),
    {
      key: "away" as const,
      label: awayTeam.split(" ").pop() || awayTeam,
      prob: away,
      color: "#ef4444",
      width: `${(away / total) * 100}%`,
    },
  ];

  return (
    <div className="w-full">
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-white/[0.06]">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: seg.width,
              background: seg.color,
              opacity: predicted === seg.key ? 1 : 0.35,
              boxShadow:
                predicted === seg.key ? `0 0 10px ${seg.color}80` : "none",
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-1">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className="flex min-w-0 flex-col items-center overflow-hidden"
            style={{ width: seg.width }}
          >
            <span
              className="text-[11px] font-bold leading-none tabular-nums"
              style={{
                color: predicted === seg.key ? seg.color : "#475569",
              }}
            >
              {seg.prob}%
            </span>
            <span
              className="mt-0.5 w-full truncate text-center text-[9px] uppercase tracking-wide"
              style={{
                color: predicted === seg.key ? seg.color : "#334155",
              }}
            >
              {seg.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
