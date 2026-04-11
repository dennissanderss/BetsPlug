"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

/*
 * FloatingSports — purely decorative emoji constellation behind the hero.
 *
 * Performance note (2026-04-10): the original version also ran 8 independent
 * infinite keyframe animations (x + y + rotate), which on top of the mouse
 * parallax meant ~16 concurrent framer-motion timelines on first paint. That
 * was one of the heaviest homepage costs and the looping motion added zero
 * UX value — users don't *read* floating emojis, they register them as a
 * background texture.
 *
 * Current behaviour: each ball is placed statically and only reacts to the
 * cursor via a shared spring (desktop only, spring is cheap once warmed up
 * because it just reads two motion values). No autonomous animation.
 */

type FloatingBall = {
  emoji: string;
  size: string;
  top: string;
  left?: string;
  right?: string;
  rotate: number; // static tilt — applied once, no animation
  opacity: number;
  blur?: string;
  /** Parallax depth — higher = moves more with the mouse */
  depth: number;
};

const balls: FloatingBall[] = [
  {
    emoji: "⚽",
    size: "text-5xl sm:text-6xl",
    top: "8%",
    left: "6%",
    rotate: -8,
    opacity: 0.18,
    depth: 40,
  },
  {
    emoji: "🥅",
    size: "text-4xl sm:text-5xl",
    top: "20%",
    right: "10%",
    rotate: 12,
    opacity: 0.22,
    depth: 55,
  },
  {
    emoji: "⚽",
    size: "text-5xl sm:text-6xl",
    top: "55%",
    left: "4%",
    rotate: -4,
    opacity: 0.15,
    blur: "blur-[1px]",
    depth: 25,
  },
  {
    emoji: "🏟️",
    size: "text-4xl sm:text-5xl",
    top: "70%",
    right: "8%",
    rotate: 18,
    opacity: 0.18,
    depth: 45,
  },
  {
    emoji: "🏆",
    size: "text-3xl sm:text-4xl",
    top: "35%",
    left: "18%",
    rotate: -12,
    opacity: 0.14,
    blur: "blur-[2px]",
    depth: 15,
  },
  {
    emoji: "⚽",
    size: "text-4xl sm:text-5xl",
    top: "42%",
    right: "22%",
    rotate: 6,
    opacity: 0.16,
    blur: "blur-[1px]",
    depth: 30,
  },
  {
    emoji: "🏆",
    size: "text-3xl sm:text-4xl",
    top: "82%",
    left: "42%",
    rotate: 0,
    opacity: 0.2,
    depth: 60,
  },
  {
    emoji: "🥅",
    size: "text-3xl sm:text-4xl",
    top: "12%",
    left: "48%",
    rotate: 0,
    opacity: 0.13,
    blur: "blur-[2px]",
    depth: 20,
  },
];

export function FloatingSports() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalized mouse position from -1 to 1 relative to the hero container
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring for that natural, laggy parallax feel
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 20, mass: 0.6 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 20, mass: 0.6 });

  useEffect(() => {
    // Respect user preference: if the OS asks for reduced motion we skip
    // the mousemove listener entirely, so the parallax never runs and the
    // balls stay fixed.
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const handleMouse = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Normalize to -1..1 (center = 0)
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      mouseX.set(nx);
      mouseY.set(ny);
    };

    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {balls.map((ball, i) => (
        <ParallaxBall
          key={i}
          ball={ball}
          smoothX={smoothX}
          smoothY={smoothY}
        />
      ))}
    </div>
  );
}

// ─── Individual ball ────────────────────────────────────────────────────────

type ParallaxBallProps = {
  ball: FloatingBall;
  smoothX: ReturnType<typeof useSpring>;
  smoothY: ReturnType<typeof useSpring>;
};

function ParallaxBall({ ball, smoothX, smoothY }: ParallaxBallProps) {
  // Transform normalized mouse (-1..1) into parallax offset (in px)
  const parallaxX = useTransform(smoothX, [-1, 1], [-ball.depth, ball.depth]);
  const parallaxY = useTransform(smoothY, [-1, 1], [-ball.depth, ball.depth]);

  return (
    <motion.div
      className={`absolute ${ball.size} ${ball.blur ?? ""} select-none drop-shadow-[0_0_20px_rgba(74,222,128,0.3)]`}
      style={{
        top: ball.top,
        left: ball.left,
        right: ball.right,
        opacity: ball.opacity,
        rotate: ball.rotate,
        x: parallaxX,
        y: parallaxY,
      }}
    >
      {ball.emoji}
    </motion.div>
  );
}
