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
      {/* Title */}
      <div className="relative z-10 mb-10 text-center">
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

      {/* 3D Perspective marquee */}
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          perspective: "1200px",
          height: "180px",
        }}
      >
        {/* Tilted track */}
        <div
          className="flex w-full items-center justify-start"
          style={{
            transform: "rotateX(6deg) rotateY(-24deg)",
            transformStyle: "preserve-3d",
          }}
        >
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
                className="flex flex-shrink-0 items-center justify-center px-6 sm:px-10 md:px-14"
                title={league.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/leagues/${league.slug}.${league.ext ?? "png"}`}
                  alt={league.name}
                  className="h-14 w-auto max-w-[140px] object-contain opacity-80 drop-shadow-[0_4px_16px_rgba(74,222,128,0.15)] transition-all duration-300 hover:scale-110 hover:opacity-100 sm:h-16 md:h-20 md:max-w-[180px]"
                  loading="lazy"
                />
              </div>
            ))}
          </motion.div>
        </div>

        {/* Horizontal fade */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${BG} 0%, transparent 20%, transparent 80%, ${BG} 100%)`,
          }}
        />
        {/* Vertical fade */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${BG} 0%, transparent 30%, transparent 70%, ${BG} 100%)`,
          }}
        />
      </div>
    </section>
  );
}
