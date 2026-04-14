"use client";

import Image from "next/image";

interface TeamLogoProps {
  src?: string | null;
  name: string;
  size?: number;
}

/**
 * Team logo with initials fallback when no logo URL is available.
 */
export function TeamLogo({ src, name, size = 18 }: TeamLogoProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className="rounded-full shrink-0"
      />
    );
  }

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-slate-400"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(8, size * 0.45),
        lineHeight: 1,
        fontWeight: 700,
      }}
    >
      {initials}
    </span>
  );
}
