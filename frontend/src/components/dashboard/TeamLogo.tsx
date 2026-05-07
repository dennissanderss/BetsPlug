"use client";

import Image from "next/image";
import { useState } from "react";

interface TeamLogoProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}

/**
 * Team logo with initials fallback. The fallback uses a soft radial
 * gradient and a subtle hair-line border in the NOCTURNE style.
 *
 * Falls back to initials when src is missing OR when the image fails
 * to load (broken URL, Vercel image-optimizer hiccup, CDN outage, etc.)
 */
export function TeamLogo({ src, name, size = 18, className }: TeamLogoProps) {
  const [errored, setErrored] = useState(false);

  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src && !errored) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className={`rounded-full shrink-0 ${className ?? ""}`}
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-[#ededed] ${className ?? ""}`}
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
