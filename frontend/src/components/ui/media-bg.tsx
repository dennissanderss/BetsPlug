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
export function HeroMediaBg({
  className = "",
}: MediaBgProps) {
  return (
    <>
      {/* 1 · Colour gradient base — green→purple diagonal wash */}
      <div
        className={`pointer-events-none absolute inset-0 ${className}`}
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--accent-green) / 0.18) 0%, transparent 35%, hsl(var(--accent-purple) / 0.14) 65%, hsl(var(--accent-blue) / 0.1) 100%)",
        }}
      />

      {/* 2 · Concentric arc rings — top-right */}
      <div
        className="pointer-events-none absolute -right-[15%] -top-[30%] h-[600px] w-[600px] opacity-[0.12]"
        style={{
          background:
            "repeating-radial-gradient(circle at 50% 50%, transparent 0px, transparent 38px, hsl(var(--accent-green) / 0.6) 40px, transparent 42px)",
        }}
      />

      {/* 3 · Concentric arc rings — bottom-left */}
      <div
        className="pointer-events-none absolute -bottom-[25%] -left-[10%] h-[500px] w-[500px] opacity-[0.1]"
        style={{
          background:
            "repeating-radial-gradient(circle at 50% 50%, transparent 0px, transparent 32px, hsl(var(--accent-purple) / 0.5) 34px, transparent 36px)",
        }}
      />

      {/* 4 · Smaller arc cluster — center-left */}
      <div
        className="pointer-events-none absolute left-[5%] top-[20%] h-[300px] w-[300px] opacity-[0.08]"
        style={{
          background:
            "repeating-radial-gradient(circle at 50% 50%, transparent 0px, transparent 24px, hsl(var(--accent-blue) / 0.5) 26px, transparent 28px)",
        }}
      />

      {/* 5 · Subtle grid dots for texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, hsl(0 0% 100% / 0.8) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* 6 · Dark gradient overlay for text readability */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, hsl(var(--bg-base) / 0.3) 0%, hsl(var(--bg-base) / 0.5) 50%, hsl(var(--bg-base) / 0.8) 100%)",
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
export function CtaMediaBg({
  className = "",
}: CtaMediaBgProps) {
  return (
    <>
      {/* 1 · Green gradient base */}
      <div
        className={`pointer-events-none absolute inset-0 ${className}`}
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--accent-green) / 0.3) 0%, hsl(230 22% 9% / 0.85) 45%, hsl(var(--accent-green) / 0.2) 100%)",
        }}
      />

      {/* 2 · Concentric arc rings — top-right (lime) */}
      <div
        className="pointer-events-none absolute -right-[10%] -top-[20%] h-[450px] w-[450px] opacity-[0.15]"
        style={{
          background:
            "repeating-radial-gradient(circle at 50% 50%, transparent 0px, transparent 30px, hsl(var(--accent-green) / 0.7) 32px, transparent 34px)",
        }}
      />

      {/* 3 · Concentric arc rings — bottom-left (green-blue) */}
      <div
        className="pointer-events-none absolute -bottom-[15%] -left-[8%] h-[380px] w-[380px] opacity-[0.12]"
        style={{
          background:
            "repeating-radial-gradient(circle at 50% 50%, transparent 0px, transparent 26px, hsl(var(--accent-blue) / 0.5) 28px, transparent 30px)",
        }}
      />

      {/* 4 · Dot grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, hsl(0 0% 100% / 0.9) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* 5 · Dark gradient for text readability */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top left, hsl(var(--bg-base) / 0.2) 0%, transparent 55%), radial-gradient(ellipse at bottom right, hsl(var(--bg-base) / 0.3) 0%, transparent 60%)",
        }}
      />
    </>
  );
}
