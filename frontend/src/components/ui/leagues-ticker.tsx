"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
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

/* Reversed order for the second row */
const leaguesReversed = [...leagues].reverse();

const TILE_VARIANTS = ["card-neon-green", "card-neon-purple", "card-neon-blue"] as const;

export function LeaguesTicker() {
  const { t } = useTranslations();
  const row1 = [...leagues, ...leagues, ...leagues];
  const row2 = [...leaguesReversed, ...leaguesReversed, ...leaguesReversed];

  return (
    <section
      className="relative overflow-hidden py-14 md:py-20"
      aria-labelledby="leagues-heading"
    >
      {/* Ambient glow blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-10 h-[420px] w-[420px] rounded-full"
        style={{ background: "hsl(var(--accent-green) / 0.14)", filter: "blur(150px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full"
        style={{ background: "hsl(var(--accent-purple) / 0.12)", filter: "blur(150px)" }}
      />

      {/* Title — centered */}
      <div className="relative z-10 mx-auto mb-10 flex max-w-7xl flex-col items-center px-4 text-center sm:px-6 md:mb-14">
        <span className="section-label mb-4">
          <Sparkles className="h-3 w-3" />
          {t("leagues.badge")}
        </span>
        <h2
          id="leagues-heading"
          className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl"
        >
          {t("leagues.titleA")}{" "}
          <span className="gradient-text-green">{t("leagues.titleB")}</span>
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
                <LeagueCard key={`r1-${league.slug}-${i}`} league={league} index={i} />
              ))}
            </motion.div>
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
                <LeagueCard key={`r2-${league.slug}-${i}`} league={league} index={i + 1} />
              ))}
            </motion.div>
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

/* ── Logo card — NOCTURNE neon ── */
function LeagueCard({ league, index }: { league: League; index: number }) {
  const variant = TILE_VARIANTS[index % TILE_VARIANTS.length];
  return (
    <div className="mx-1.5 flex-shrink-0 sm:mx-2" title={league.name}>
      <div
        className={`${variant} group flex h-14 w-24 items-center justify-center rounded-[14px] p-3 transition-transform duration-300 hover:-translate-y-0.5 sm:h-16 sm:w-28 md:h-[72px] md:w-32 md:p-4`}
      >
        <div className="relative flex h-full w-full items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/leagues/${league.slug}.${league.ext ?? "png"}`}
            alt={league.name}
            className="h-full w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}

/* ── Side gradient fades — NOCTURNE body ── */
function SideFades() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "linear-gradient(90deg, hsl(230 20% 6%) 0%, transparent 8%, transparent 92%, hsl(230 20% 6%) 100%)",
      }}
    />
  );
}
