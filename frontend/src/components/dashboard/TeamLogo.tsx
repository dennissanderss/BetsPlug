"use client";

import Image from "next/image";

interface TeamLogoProps {
  src?: string | null;
  name: string;
  size?: number;
}

/**
 * Team logo with initials fallback. The fallback uses a soft radial
 * gradient and a subtle hair-line border in the NOCTURNE style.
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
      className="inline-flex shrink-0 items-center justify-center rounded-full text-[#ededed]"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(8, size * 0.45),
        lineHeight: 1,
        fontWeight: 700,
        background:
          "radial-gradient(circle at 30% 25%, rgba(74,222,128,0.18), rgba(14,16,22,0.9) 70%)",
        border: "1px solid hsl(0 0% 100% / 0.08)",
      }}
    >
      {initials}
    </span>
  );
}
