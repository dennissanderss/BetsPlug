"use client";

import { motion } from "motion/react";

type League = {
  name: string;
  short: string; // short badge label
  sport: "football" | "basketball" | "americanfootball" | "baseball" | "hockey";
};

const leagues: League[] = [
  { name: "Premier League", short: "EPL", sport: "football" },
  { name: "La Liga", short: "LaLiga", sport: "football" },
  { name: "Bundesliga", short: "BL", sport: "football" },
  { name: "Serie A", short: "Serie A", sport: "football" },
  { name: "Ligue 1", short: "L1", sport: "football" },
  { name: "Eredivisie", short: "ED", sport: "football" },
  { name: "Champions League", short: "UCL", sport: "football" },
  { name: "Europa League", short: "UEL", sport: "football" },
  { name: "Conference League", short: "UECL", sport: "football" },
  { name: "Liga Portugal", short: "LP", sport: "football" },
  { name: "Brazil Série A", short: "BRA", sport: "football" },
  { name: "Allsvenskan", short: "SWE", sport: "football" },
  { name: "NBA", short: "NBA", sport: "basketball" },
  { name: "NFL", short: "NFL", sport: "americanfootball" },
  { name: "MLB", short: "MLB", sport: "baseball" },
  { name: "NHL", short: "NHL", sport: "hockey" },
];

const sportIcons: Record<League["sport"], string> = {
  football: "⚽",
  basketball: "🏀",
  americanfootball: "🏈",
  baseball: "⚾",
  hockey: "🏒",
};

export function LeaguesTicker() {
  // Triple the list for a seamless infinite loop
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
            className="flex gap-3 sm:gap-4"
            animate={{
              x: ["0%", "-33.3333%"],
            }}
            transition={{
              duration: 40,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {tripled.map((league, i) => (
              <div
                key={`${league.name}-${i}`}
                className="group flex flex-shrink-0 items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 backdrop-blur-sm transition-all duration-300 hover:border-green-500/40 hover:bg-green-500/[0.06] hover:shadow-[0_0_20px_rgba(74,222,128,0.15)] sm:gap-3 sm:px-5 sm:py-3"
              >
                <span
                  className="text-lg sm:text-xl"
                  aria-hidden="true"
                >
                  {sportIcons[league.sport]}
                </span>
                <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors group-hover:text-white sm:text-sm">
                  {league.name}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
