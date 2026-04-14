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

const BG = "#050505";

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
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />
      <div className="pointer-events-none absolute top-0 left-0 right-0 divider-dashed" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 divider-dashed" />

      {/* Title */}
      <div className="relative z-10 mx-auto max-w-7xl mb-10 px-6 md:mb-14">
        <span className="section-tag mb-4">
          {t("leagues.badge")}
        </span>
        <h2
          id="leagues-heading"
          className="text-display text-3xl text-white sm:text-4xl lg:text-5xl"
        >
          {t("leagues.titleA")}{" "}
          <span className="text-[#4ade80]">{t("leagues.titleB")}</span>
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

/* ── Logo card — hard edges ── */
function LeagueCard({ league }: { league: League }) {
  return (
    <div className="mx-1.5 flex-shrink-0 sm:mx-2" title={league.name}>
      <div className="group flex h-14 w-24 items-center justify-center border border-white/10 bg-[#0a0a0a] p-3 transition-all duration-200 hover:border-[#4ade80]/50 hover:bg-[#111] sm:h-16 sm:w-28 md:h-[72px] md:w-32 md:p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/leagues/${league.slug}.${league.ext ?? "png"}`}
          alt={league.name}
          className="h-full w-auto max-w-full object-contain transition-transform duration-200 group-hover:scale-110"
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
