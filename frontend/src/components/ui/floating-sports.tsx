"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

type FloatingBall = {
  emoji: string;
  size: string;
  top: string;
  left?: string;
  right?: string;
  duration: number;
  delay: number;
  xRange: number;
  yRange: number;
  rotate: number;
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
    duration: 14,
    delay: 0,
    xRange: 20,
    yRange: 30,
    rotate: 360,
    opacity: 0.18,
    depth: 40,
  },
  {
    emoji: "🎾",
    size: "text-4xl sm:text-5xl",
    top: "20%",
    right: "10%",
    duration: 11,
    delay: 1.5,
    xRange: -25,
    yRange: 35,
    rotate: -360,
    opacity: 0.22,
    depth: 55,
  },
  {
    emoji: "🏀",
    size: "text-5xl sm:text-6xl",
    top: "55%",
    left: "4%",
    duration: 16,
    delay: 0.8,
    xRange: 30,
    yRange: -25,
    rotate: 360,
    opacity: 0.15,
    blur: "blur-[1px]",
    depth: 25,
  },
  {
    emoji: "🏈",
    size: "text-4xl sm:text-5xl",
    top: "70%",
    right: "8%",
    duration: 13,
    delay: 2.2,
    xRange: -20,
    yRange: -30,
    rotate: 180,
    opacity: 0.18,
    depth: 45,
  },
  {
    emoji: "⚾",
    size: "text-3xl sm:text-4xl",
    top: "35%",
    left: "18%",
    duration: 12,
    delay: 3,
    xRange: 15,
    yRange: 20,
    rotate: 360,
    opacity: 0.14,
    blur: "blur-[2px]",
    depth: 15,
  },
  {
    emoji: "🏐",
    size: "text-4xl sm:text-5xl",
    top: "42%",
    right: "22%",
    duration: 15,
    delay: 0.3,
    xRange: -18,
    yRange: 25,
    rotate: -360,
    opacity: 0.16,
    blur: "blur-[1px]",
    depth: 30,
  },
  {
    emoji: "🏆",
    size: "text-3xl sm:text-4xl",
    top: "82%",
    left: "42%",
    duration: 10,
    delay: 1.8,
    xRange: 12,
    yRange: -15,
    rotate: 20,
    opacity: 0.2,
    depth: 60,
  },
  {
    emoji: "🥅",
    size: "text-3xl sm:text-4xl",
    top: "12%",
    left: "48%",
    duration: 17,
    delay: 2.5,
    xRange: -15,
    yRange: 18,
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
  // Negative depth factor so balls drift *toward* the cursor subtly
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
        x: parallaxX,
        y: parallaxY,
      }}
    >
      {/* Inner wrapper handles the autonomous float + rotate animation */}
      <motion.div
        animate={{
          x: [0, ball.xRange, 0, -ball.xRange * 0.5, 0],
          y: [0, ball.yRange, ball.yRange * 0.5, -ball.yRange * 0.3, 0],
          rotate: [0, ball.rotate],
        }}
        transition={{
          duration: ball.duration,
          delay: ball.delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {ball.emoji}
      </motion.div>
    </motion.div>
  );
}
