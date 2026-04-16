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
 * CtaMediaBg — lime gradient + optional pattern for CTA blocks.
 */
export function CtaMediaBg({
  src,
  alt = "",
  opacity = 0.14,
  className = "",
  pattern,
}: CtaMediaBgProps) {
  return (
    <>
      {/* 1 · Photo if provided (low opacity grayscale) */}
      {src && (
        <div
          role={alt ? "img" : undefined}
          aria-label={alt || undefined}
          className={`pointer-events-none absolute inset-0 overflow-hidden bg-cover bg-center bg-no-repeat ${className}`}
          style={{
            backgroundImage: `url('${src}')`,
            filter: "grayscale(1) contrast(1.2) brightness(0.55)",
            opacity,
          }}
        />
      )}
      {/* 2 · Lime gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #4ade80 0%, #22c55e 55%, #16a34a 100%)",
          mixBlendMode: "multiply",
        }}
      />
      {/* 3 · Per-page pattern */}
      {pattern && (
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 cta-pattern-${pattern}`}
        />
      )}
      {/* 4 · Dark corner wash */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top left, rgba(5,5,5,0.25) 0%, transparent 55%), radial-gradient(ellipse at bottom right, rgba(5,5,5,0.3) 0%, transparent 60%)",
        }}
      />
    </>
  );
}
