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
      {/* 1 · Colour gradient wash */}
      <div
        className={`pointer-events-none absolute inset-0 ${className}`}
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--accent-green) / 0.14) 0%, transparent 40%, hsl(var(--accent-purple) / 0.1) 70%, hsl(var(--accent-blue) / 0.08) 100%)",
        }}
      />

      {/* 2 · Perspective mesh grid — connected nodes net */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-50"
        style={{ perspective: "800px" }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-50%",
            transformOrigin: "60% 40%",
            transform: "rotateX(55deg) rotateZ(-30deg)",
          }}
        >
          {/* Grid lines */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                `linear-gradient(0deg, hsl(var(--accent-green) / 0.18) 1px, transparent 1px),
                 linear-gradient(90deg, hsl(var(--accent-green) / 0.18) 1px, transparent 1px)`,
              backgroundSize: "56px 56px",
            }}
          />
          {/* Diamond dots at intersections */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle, hsl(var(--accent-green) / 0.45) 2.5px, transparent 2.5px)",
              backgroundSize: "56px 56px",
              backgroundPosition: "0 0",
            }}
          />
        </div>
      </div>

      {/* 3 · Second smaller mesh (purple tint, offset) for depth */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-20"
        style={{ perspective: "600px" }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-40%",
            transformOrigin: "30% 70%",
            transform: "rotateX(60deg) rotateZ(-25deg)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                `linear-gradient(0deg, hsl(var(--accent-purple) / 0.12) 1px, transparent 1px),
                 linear-gradient(90deg, hsl(var(--accent-purple) / 0.12) 1px, transparent 1px)`,
              backgroundSize: "44px 44px",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle, hsl(var(--accent-purple) / 0.3) 2px, transparent 2px)",
              backgroundSize: "44px 44px",
            }}
          />
        </div>
      </div>

      {/* 4 · Fade mask: transparent center, visible edges */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 45%, hsl(var(--bg-base) / 0.7) 0%, hsl(var(--bg-base) / 0.3) 60%, transparent 100%)",
        }}
      />

      {/* 5 · Bottom readability gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, hsl(var(--bg-base) / 0.4) 50%, hsl(var(--bg-base) / 0.85) 100%)",
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
      {/* 1 · Gradient base */}
      <div
        className={`pointer-events-none absolute inset-0 ${className}`}
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--accent-green) / 0.25) 0%, hsl(230 22% 9% / 0.8) 50%, hsl(var(--accent-green) / 0.18) 100%)",
        }}
      />

      {/* 2 · Perspective mesh grid (same language as hero) */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-50"
        style={{ perspective: "700px" }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-40%",
            transformOrigin: "70% 30%",
            transform: "rotateX(50deg) rotateZ(-35deg)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                `linear-gradient(0deg, hsl(var(--accent-green) / 0.2) 1px, transparent 1px),
                 linear-gradient(90deg, hsl(var(--accent-green) / 0.2) 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle, hsl(var(--accent-green) / 0.5) 2px, transparent 2px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>
      </div>

      {/* 3 · Center fade for text readability */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, hsl(var(--bg-base) / 0.6) 0%, transparent 70%)",
        }}
      />
    </>
  );
}
