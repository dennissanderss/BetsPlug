"use client";

import { motion } from "motion/react";
import { useTranslations } from "@/i18n/locale-provider";

type League = {
  name: string;
  slug: string;
  ext?: "png" | "svg";
};

const leagues: League[] = [
  { name: "Premier League", slug: "premier-league" },
  { name: "La Liga", slug: "laliga" },
  { name: "Bundesliga", slug: "bundesliga" },
  { name: "Serie A", slug: "serie-a" },
  { name: "Ligue 1", slug: "ligue-1" },
  { name: "Champions League", slug: "champions-league" },
  { name: "Eredivisie", slug: "eredivisie" },
];

const BG = "#080b14";

export function LeaguesTicker() {
  const { t } = useTranslations();
  const tripled = [...leagues, ...leagues, ...leagues];

  return (
    <section
      className="relative overflow-hidden py-10 md:py-14"
      aria-labelledby="leagues-heading"
      style={{ background: BG }}
    >
      {/* ── Unique background ── */}
      {/* Honeycomb / hex dot pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(74,222,128,0.9) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
          backgroundPosition: "0 0, 14px 14px",
        }}
      />
      {/* Diagonal accent lines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(74,222,128,0.8) 0 1px, transparent 1px 24px)",
        }}
      />
      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/[0.04] blur-[120px]" />
      </div>
      {/* Top/bottom accent lines */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/25 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/25 to-transparent" />

      {/* Title */}
      <div className="relative z-10 mb-8 text-center md:mb-10">
        <span className="mb-3 inline-block rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-green-400">
          {t("leagues.badge")}
        </span>
        <h2
          id="leagues-heading"
          className="text-balance break-words text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl"
        >
          {t("leagues.titleA")}{" "}
          <span className="gradient-text">{t("leagues.titleB")}</span>
        </h2>
      </div>

      {/* Marquee — flat on mobile, 3D perspective on md+ */}
      <div
        className="perspective-marquee relative flex items-center justify-center overflow-hidden"
      >
        {/* Track — no tilt on mobile, tilted on desktop */}
        <div className="marquee-track flex w-full items-center justify-start">
          {/* Scrolling row */}
          <motion.div
            className="flex items-center whitespace-nowrap"
            animate={{ x: ["0%", "-33.3333%"] }}
            transition={{
              duration: 30,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {tripled.map((league, i) => (
              <div
                key={`${league.slug}-${i}`}
                className="flex flex-shrink-0 items-center justify-center px-5 sm:px-8 md:px-12"
                title={league.name}
              >
                <div className="rounded-xl bg-white/[0.12] p-2.5 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white/[0.18] sm:rounded-2xl sm:p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/leagues/${league.slug}.${league.ext ?? "png"}`}
                    alt={league.name}
                    className="h-8 w-auto max-w-[80px] object-contain brightness-125 drop-shadow-[0_0_12px_rgba(255,255,255,0.15)] sm:h-10 sm:max-w-[100px] md:h-11 md:max-w-[120px]"
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Side fades */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${BG} 0%, transparent 10%, transparent 90%, ${BG} 100%)`,
          }}
        />

        {/* Vertical fade — only on md+ for the 3D effect */}
        <div
          className="pointer-events-none absolute inset-0 hidden md:block"
          style={{
            background: `linear-gradient(180deg, ${BG} 0%, transparent 18%, transparent 82%, ${BG} 100%)`,
          }}
        />
      </div>

      <style jsx>{`
        .perspective-marquee {
          height: 70px;
        }
        .marquee-track {
          transform: none;
        }
        @media (min-width: 768px) {
          .perspective-marquee {
            perspective: 1200px;
            height: 160px;
          }
          .marquee-track {
            transform: rotateX(6deg) rotateY(-24deg);
            transform-style: preserve-3d;
          }
        }
      `}</style>
    </section>
  );
}
