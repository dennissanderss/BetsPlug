"use client";

import { motion } from "motion/react";

type League = {
  name: string;
  slug: string;
};

const leagues: League[] = [
  { name: "Premier League", slug: "premier-league" },
  { name: "La Liga", slug: "laliga" },
  { name: "Bundesliga", slug: "bundesliga" },
  { name: "Serie A", slug: "serie-a" },
  { name: "Ligue 1", slug: "ligue-1" },
  { name: "Eredivisie", slug: "eredivisie" },
  { name: "Champions League", slug: "champions-league" },
  { name: "Europa League", slug: "europa-league" },
  { name: "Conference League", slug: "conference-league" },
  { name: "Liga Portugal", slug: "liga-portugal" },
  { name: "Brasileirão", slug: "brazil-serie-a" },
  { name: "Allsvenskan", slug: "allsvenskan" },
  { name: "NBA", slug: "nba" },
  { name: "NFL", slug: "nfl" },
  { name: "MLB", slug: "mlb" },
  { name: "NHL", slug: "nhl" },
];

export function LeaguesTicker() {
  // Triple for a seamless infinite loop
  const tripled = [...leagues, ...leagues, ...leagues];

  return (
    <section
      className="relative overflow-hidden border-y border-white/[0.06] py-14 md:py-16"
      aria-labelledby="leagues-heading"
    >
      {/* Background ambience */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[260px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/[0.04] blur-[100px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />

      {/* Title */}
      <div className="relative z-10 mb-10 text-center">
        <span
          id="leagues-heading"
          className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-slate-500"
        >
          Leagues We Cover
        </span>
      </div>

      {/* Ticker */}
      <div className="relative">
        {/* Gradient masks on the sides */}
        <div className="pointer-events-none absolute left-0 top-0 z-20 h-full w-16 bg-gradient-to-r from-[#0d1220] to-transparent sm:w-32" />
        <div className="pointer-events-none absolute right-0 top-0 z-20 h-full w-16 bg-gradient-to-l from-[#0d1220] to-transparent sm:w-32" />

        <div className="overflow-hidden">
          <motion.div
            className="flex items-center gap-8 sm:gap-12 md:gap-16"
            animate={{ x: ["0%", "-33.3333%"] }}
            transition={{
              duration: 45,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {tripled.map((league, i) => (
              <div
                key={`${league.slug}-${i}`}
                className="group flex h-14 flex-shrink-0 items-center justify-center sm:h-16 md:h-20"
                title={league.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/leagues/${league.slug}.png`}
                  alt={league.name}
                  className="h-full w-auto max-w-[120px] object-contain opacity-70 grayscale transition-all duration-300 group-hover:scale-110 group-hover:opacity-100 group-hover:grayscale-0 sm:max-w-[140px] md:max-w-[160px]"
                  loading="lazy"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
