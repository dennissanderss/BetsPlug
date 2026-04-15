/**
 * HeroMediaBg / CtaMediaBg
 * ─────────────────────────────────────────────────────────────
 * Reusable background layers used behind every hero and final
 * CTA section on the site. Renders, from back to front:
 *   1. low-opacity grayscale photo (src)
 *   2. lime screen tint
 *   3. diagonal stripe pattern
 *   4. dark gradient overlay for text legibility
 *
 * Photos are absolute paths under /public (served as-is). Files
 * should be WebP with SEO-friendly descriptive filenames; see
 * src/data/page-images.ts for the canonical list.
 *
 * Missing image files fail open — the overlays still render so
 * the section stays on-brand even before photos are uploaded.
 */

interface MediaBgProps {
  src: string;
  alt?: string;
  /** Photo opacity (0..1). Default 0.18 for hero, 0.22 for CTA. */
  opacity?: number;
  /** Dark gradient strength at the bottom of the frame. */
  dark?: number;
  /** Extra tailwind on the outer wrapper. */
  className?: string;
}

export function HeroMediaBg({
  src,
  alt = "",
  opacity = 0.18,
  className = "",
}: MediaBgProps) {
  return (
    <>
      {/* 1 · Photo */}
      <div
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        className={`pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat ${className}`}
        style={{
          backgroundImage: `url('${src}')`,
          filter: "grayscale(1) contrast(1.15) brightness(0.55)",
          opacity,
        }}
      />
      {/* 2 · Lime screen tint */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(74, 222, 128, 0.08) 0%, transparent 40%, rgba(74, 222, 128, 0.05) 100%)",
          mixBlendMode: "screen",
        }}
      />
      {/* 3 · Diagonal stripe pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(74,222,128,0.4) 0 1px, transparent 1px 22px)",
        }}
      />
      {/* 4 · Dark gradient for readability */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-[#050505]/75 to-[#050505]" />
    </>
  );
}

export function CtaMediaBg({
  src,
  alt = "",
  opacity = 0.14,
  className = "",
}: MediaBgProps) {
  return (
    <>
      {/* 1 · Photo — low opacity grayscale */}
      <div
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        className={`pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat ${className}`}
        style={{
          backgroundImage: `url('${src}')`,
          filter: "grayscale(1) contrast(1.2) brightness(0.55)",
          opacity,
        }}
      />
      {/* 2 · Lime gradient — matches site-wide accent language */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #4ade80 0%, #22c55e 55%, #16a34a 100%)",
          mixBlendMode: "multiply",
        }}
      />
      {/* 3 · Deep-dark corner wash for contrast */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top left, rgba(5, 5, 5, 0.25) 0%, transparent 55%), radial-gradient(ellipse at bottom right, rgba(5, 5, 5, 0.3) 0%, transparent 60%)",
        }}
      />
    </>
  );
}
