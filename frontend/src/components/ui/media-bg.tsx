/**
 * HeroMediaBg / CtaMediaBg
 * ─────────────────────────────────────────────────────────────
 * HeroMediaBg renders a sporty geometric pattern overlay with
 * concentric arcs and colour washes — no photo dependency.
 * Matches the atmospheric NOCTURNE body glow but adds a unique
 * per-section geometric texture.
 *
 * CtaMediaBg renders a green gradient with optional per-page
 * pattern overlay for CTA blocks.
 */

import type { CtaPattern } from "@/data/page-images";

interface MediaBgProps {
  /** Legacy — still accepted but ignored (no photo rendered). */
  src?: string;
  alt?: string;
  opacity?: number;
  dark?: number;
  className?: string;
}

interface CtaMediaBgProps extends MediaBgProps {
  pattern?: CtaPattern;
}

/**
 * HeroMediaBg — sporty geometric pattern overlay.
 * Renders concentric arc rings + colour gradient washes.
 * Props are backwards-compatible (src/alt accepted but ignored).
 */
/** Generate a sine-wave SVG path string. */
function wavePath(
  width: number,
  baseY: number,
  amplitude: number,
  frequency: number,
  phase: number,
): string {
  const points: string[] = [];
  const step = 4;
  for (let x = 0; x <= width; x += step) {
    const y = baseY + Math.sin((x / width) * Math.PI * frequency + phase) * amplitude;
    points.push(`${x},${y.toFixed(1)}`);
  }
  return `M${points.join(" L")}`;
}

/** Set of wave configs for the particle-wave visualization. */
const WAVES = [
  { baseY: 60, amp: 28, freq: 3.2, phase: 0, color: "#4ade80", opacity: 0.7, dash: "2 6" },
  { baseY: 68, amp: 24, freq: 3.0, phase: 0.8, color: "#4ade80", opacity: 0.5, dash: "1.5 8" },
  { baseY: 76, amp: 22, freq: 3.5, phase: 1.5, color: "#22d3ee", opacity: 0.45, dash: "2 7" },
  { baseY: 82, amp: 20, freq: 2.8, phase: 2.2, color: "#a855f7", opacity: 0.55, dash: "2 5" },
  { baseY: 88, amp: 18, freq: 3.3, phase: 3.0, color: "#d946ef", opacity: 0.6, dash: "1.5 6" },
  { baseY: 93, amp: 15, freq: 3.6, phase: 3.8, color: "#d946ef", opacity: 0.45, dash: "2 8" },
  { baseY: 72, amp: 26, freq: 2.6, phase: 4.5, color: "#a855f7", opacity: 0.35, dash: "1 10" },
  { baseY: 85, amp: 16, freq: 4.0, phase: 5.2, color: "#4ade80", opacity: 0.3, dash: "1.5 9" },
  { baseY: 78, amp: 20, freq: 3.1, phase: 6.0, color: "#22d3ee", opacity: 0.3, dash: "2 10" },
  { baseY: 95, amp: 12, freq: 3.8, phase: 1.0, color: "#d946ef", opacity: 0.5, dash: "1 7" },
];

export function HeroMediaBg({
  className = "",
}: MediaBgProps) {
  const svgW = 1440;
  const svgH = 120;

  return (
    <>
      {/* 1 · Subtle colour wash */}
      <div
        className={`pointer-events-none absolute inset-0 ${className}`}
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--accent-green) / 0.08) 0%, transparent 40%, hsl(var(--accent-purple) / 0.06) 100%)",
        }}
      />

      {/* 2 · Scattered background particles (tiny dots) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--accent-green) / 0.6) 1px, transparent 1px), radial-gradient(circle, hsl(var(--accent-purple) / 0.5) 1px, transparent 1px)",
          backgroundSize: "80px 80px, 120px 120px",
          backgroundPosition: "0 0, 40px 40px",
        }}
      />

      {/* 3 · Flowing particle waves — bottom half */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] overflow-hidden">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          {WAVES.map((w, i) => (
            <path
              key={i}
              d={wavePath(svgW, w.baseY, w.amp, w.freq, w.phase)}
              fill="none"
              stroke={w.color}
              strokeWidth="1.5"
              strokeDasharray={w.dash}
              strokeLinecap="round"
              opacity={w.opacity}
            />
          ))}
        </svg>

        {/* Glow bloom behind the wave cluster */}
        <div
          className="absolute bottom-0 left-1/2 h-[70%] w-[80%] -translate-x-1/2"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, hsl(var(--accent-purple) / 0.2) 0%, hsl(var(--accent-green) / 0.08) 40%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      {/* 4 · Top readability: subtle darken so hero text pops */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, hsl(var(--bg-base) / 0.5) 0%, hsl(var(--bg-base) / 0.15) 45%, transparent 70%)",
        }}
      />
    </>
  );
}

/**
 * CtaMediaBg — sporty geometric pattern for CTA blocks.
 * No photos — concentric arc rings in lime/green on a green
 * gradient base. Props kept backwards-compatible (src ignored).
 */
/** CTA wave configs — fewer, bolder lines. */
const CTA_WAVES = [
  { baseY: 30, amp: 20, freq: 2.5, phase: 0, color: "#4ade80", opacity: 0.5, dash: "2 7" },
  { baseY: 42, amp: 18, freq: 3.0, phase: 1.2, color: "#22d3ee", opacity: 0.4, dash: "2 8" },
  { baseY: 54, amp: 16, freq: 2.8, phase: 2.4, color: "#a855f7", opacity: 0.45, dash: "1.5 6" },
  { baseY: 65, amp: 14, freq: 3.4, phase: 3.5, color: "#d946ef", opacity: 0.5, dash: "2 7" },
  { baseY: 76, amp: 12, freq: 3.1, phase: 4.8, color: "#4ade80", opacity: 0.35, dash: "1.5 9" },
  { baseY: 85, amp: 10, freq: 3.6, phase: 5.5, color: "#d946ef", opacity: 0.4, dash: "1 8" },
];

export function CtaMediaBg({
  className = "",
}: CtaMediaBgProps) {
  const svgW = 1200;
  const svgH = 100;

  return (
    <>
      {/* 1 · Gradient base */}
      <div
        className={`pointer-events-none absolute inset-0 ${className}`}
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--accent-green) / 0.18) 0%, hsl(230 22% 9% / 0.75) 50%, hsl(var(--accent-purple) / 0.12) 100%)",
        }}
      />

      {/* 2 · Particle waves — full height */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          {CTA_WAVES.map((w, i) => (
            <path
              key={i}
              d={wavePath(svgW, w.baseY, w.amp, w.freq, w.phase)}
              fill="none"
              stroke={w.color}
              strokeWidth="1.5"
              strokeDasharray={w.dash}
              strokeLinecap="round"
              opacity={w.opacity}
            />
          ))}
        </svg>

        {/* Glow behind waves */}
        <div
          className="absolute bottom-0 left-1/2 h-[60%] w-[70%] -translate-x-1/2"
          style={{
            background:
              "radial-gradient(ellipse at 50% 80%, hsl(var(--accent-green) / 0.15) 0%, hsl(var(--accent-purple) / 0.08) 50%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      {/* 3 · Center readability */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, hsl(var(--bg-base) / 0.5) 0%, transparent 65%)",
        }}
      />
    </>
  );
}
