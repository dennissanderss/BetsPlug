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
  { name: "Eredivisie", slug: "eredivisie" },
  { name: "Champions League", slug: "champions-league" },
  { name: "Europa League", slug: "europa-league" },
  { name: "Conference League", slug: "conference-league" },
  { name: "Liga Portugal", slug: "liga-portugal" },
  { name: "Brasileirão", slug: "brazil-serie-a" },
  { name: "Allsvenskan", slug: "allsvenskan" },
  { name: "NBA", slug: "nba" },
  { name: "NFL", slug: "nfl", ext: "svg" },
  { name: "MLB", slug: "mlb" },
  { name: "NHL", slug: "nhl" },
];

export function LeaguesTicker() {
  const { t } = useTranslations();
  // Triple for a seamless infinite loop
  const tripled = [...leagues, ...leagues, ...leagues];

  return (
    <section
      className="relative overflow-hidden py-10 md:py-12"
      aria-labelledby="leagues-heading"
    >
      {/* ── Unique background ─────────────────────────────────────────── */}
      {/* Base gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#080b14] via-[#0a1018] to-[#080b14]" />

      {/* Diagonal striped pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(74,222,128,0.8) 0 1px, transparent 1px 18px)",
        }}
      />

      {/* Soft radial glows — asymmetric (different from hero) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[15%] top-0 h-[380px] w-[380px] rounded-full bg-emerald-500/[0.06] blur-[120px]" />
        <div className="absolute right-[10%] bottom-0 h-[320px] w-[320px] rounded-full bg-green-500/[0.05] blur-[110px]" />
      </div>

      {/* Thin green top/bottom accent lines */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
      <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />

      {/* Title */}
      <div className="relative z-10 mb-8 text-center">
        <span className="mb-3 inline-block rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-green-400">
          {t("leagues.badge")}
        </span>
        <h2
          id="leagues-heading"
          className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl"
        >
          {t("leagues.titleA")}{" "}
          <span className="gradient-text">{t("leagues.titleB")}</span>
        </h2>
      </div>

      {/* Ticker */}
      <div className="relative">
        {/* Gradient masks on the sides */}
        <div className="pointer-events-none absolute left-0 top-0 z-20 h-full w-16 bg-gradient-to-r from-[#0a1018] to-transparent sm:w-32" />
        <div className="pointer-events-none absolute right-0 top-0 z-20 h-full w-16 bg-gradient-to-l from-[#0a1018] to-transparent sm:w-32" />

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
                className="group flex h-10 flex-shrink-0 items-center justify-center sm:h-12 md:h-14"
                title={league.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/leagues/${league.slug}.${league.ext ?? "png"}`}
                  alt={league.name}
                  className="h-full w-auto max-w-[120px] object-contain opacity-90 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-all duration-300 group-hover:scale-110 group-hover:opacity-100 sm:max-w-[140px] md:max-w-[160px]"
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
