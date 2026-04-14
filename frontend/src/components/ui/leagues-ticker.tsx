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
  { name: "Europa League", slug: "europa-league" },
  { name: "Conference League", slug: "conference-league" },
  { name: "Liga Portugal", slug: "liga-portugal" },
  { name: "Allsvenskan", slug: "allsvenskan" },
  { name: "Brasileirão Serie A", slug: "brazil-serie-a" },
  { name: "Süper Lig", slug: "super-lig" },
  { name: "Jupiler Pro League", slug: "jupiler-pro-league" },
  { name: "Scottish Premiership", slug: "scottish-premiership" },
  { name: "Swiss Super League", slug: "swiss-super-league" },
  { name: "Liga Profesional Argentina", slug: "liga-profesional-argentina" },
  { name: "Liga MX", slug: "liga-mx" },
  { name: "Copa Libertadores", slug: "copa-libertadores" },
  { name: "MLS", slug: "mls" },
  { name: "Saudi Pro League", slug: "saudi-pro-league" },
  { name: "Championship", slug: "championship" },
];

const BG = "#070a12";

/* Reversed order for the second row */
const leaguesReversed = [...leagues].reverse();

export function LeaguesTicker() {
  const { t } = useTranslations();
  const row1 = [...leagues, ...leagues, ...leagues];
  const row2 = [...leaguesReversed, ...leaguesReversed, ...leaguesReversed];

  return (
    <section
      className="relative overflow-hidden py-14 md:py-20"
      aria-labelledby="leagues-heading"
      style={{ background: BG }}
    >
      {/* ── Background ── */}
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,197,94,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.15) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Center glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-200/30 blur-[150px]" />
      </div>
      {/* Edge lines */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />

      {/* Title */}
      <div className="relative z-10 mb-10 text-center md:mb-14">
        <span className="mb-3 inline-block rounded-full border border-green-300 bg-green-50 px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-green-600">
          {t("leagues.badge")}
        </span>
        <h2
          id="leagues-heading"
          className="text-balance break-words text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-4xl"
        >
          {t("leagues.titleA")}{" "}
          <span className="gradient-text">{t("leagues.titleB")}</span>
        </h2>
      </div>

      {/* 3D Marquee container */}
      <div className="leagues-stage relative z-10">
        <div className="leagues-rotator space-y-4 md:space-y-5">
          {/* ── Row 1: scrolls left ── */}
          <div className="relative overflow-hidden">
            <motion.div
              className="flex w-max items-center"
              animate={{ x: ["0%", "-33.3333%"] }}
              transition={{ duration: 35, ease: "linear", repeat: Infinity }}
            >
              {row1.map((league, i) => (
                <LeagueCard key={`r1-${league.slug}-${i}`} league={league} />
              ))}
            </motion.div>

            {/* Side fades */}
            <SideFades />
          </div>

          {/* ── Row 2: scrolls right ── */}
          <div className="relative overflow-hidden">
            <motion.div
              className="flex w-max items-center"
              animate={{ x: ["-33.3333%", "0%"] }}
              transition={{ duration: 40, ease: "linear", repeat: Infinity }}
            >
              {row2.map((league, i) => (
                <LeagueCard key={`r2-${league.slug}-${i}`} league={league} />
              ))}
            </motion.div>

            {/* Side fades */}
            <SideFades />
          </div>
        </div>
      </div>

      <style jsx>{`
        .leagues-stage {
          perspective: 900px;
          perspective-origin: 50% 50%;
        }
        .leagues-rotator {
          transform: rotateX(16deg) rotateZ(-1deg);
          transform-style: preserve-3d;
        }
      `}</style>
    </section>
  );
}

/* ── Logo card ── */
function LeagueCard({ league }: { league: League }) {
  return (
    <div className="mx-2 flex-shrink-0 sm:mx-3" title={league.name}>
      <div className="group flex h-14 w-24 items-center justify-center rounded-xl border border-slate-200 bg-white p-3 shadow-[0_4px_20px_rgba(0,0,0,0.06)] backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:bg-white hover:shadow-[0_4px_30px_rgba(34,197,94,0.12)] sm:h-16 sm:w-28 sm:rounded-2xl md:h-[72px] md:w-32 md:p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/leagues/${league.slug}.${league.ext ?? "png"}`}
          alt={league.name}
          className="h-full w-auto max-w-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
      </div>
    </div>
  );
}

/* ── Side gradient fades ── */
function SideFades() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background: `linear-gradient(90deg, ${BG} 0%, transparent 8%, transparent 92%, ${BG} 100%)`,
      }}
    />
  );
}
