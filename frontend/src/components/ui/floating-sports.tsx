"use client";

import { motion } from "motion/react";

type FloatingBall = {
  emoji: string;
  size: string; // tailwind text size
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
  },
];

export function FloatingSports() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {balls.map((ball, i) => (
        <motion.div
          key={i}
          className={`absolute ${ball.size} ${ball.blur ?? ""} select-none drop-shadow-[0_0_20px_rgba(74,222,128,0.3)]`}
          style={{
            top: ball.top,
            left: ball.left,
            right: ball.right,
            opacity: ball.opacity,
          }}
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
      ))}
    </div>
  );
}
