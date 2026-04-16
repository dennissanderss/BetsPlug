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

const leaguesReversed = [...leagues].reverse();

export function LeaguesTicker() {
  const { t } = useTranslations();
  const row1 = [...leagues, ...leagues, ...leagues];
  const row2 = [...leaguesReversed, ...leaguesReversed, ...leaguesReversed];

  return (
    <section
      className="relative overflow-hidden py-16 md:py-24"
      aria-labelledby="leagues-heading"
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "hsl(var(--accent-green) / 0.06)", filter: "blur(160px)" }}
      />

      {/* Title — centered */}
      <div className="relative z-10 mx-auto mb-12 flex max-w-7xl flex-col items-center px-4 text-center sm:px-6 md:mb-16">
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

      {/* Scrolling rows */}
      <div className="relative z-10 space-y-4">
        {/* Row 1 — scrolls left */}
        <div className="relative overflow-hidden">
          <motion.div
            className="flex w-max items-center"
            animate={{ x: ["0%", "-33.3333%"] }}
            transition={{ duration: 40, ease: "linear", repeat: Infinity }}
          >
            {row1.map((league, i) => (
              <LeagueLogo key={`r1-${league.slug}-${i}`} league={league} />
            ))}
          </motion.div>
          <EdgeFades />
        </div>

        {/* Row 2 — scrolls right */}
        <div className="relative overflow-hidden">
          <motion.div
            className="flex w-max items-center"
            animate={{ x: ["-33.3333%", "0%"] }}
            transition={{ duration: 45, ease: "linear", repeat: Infinity }}
          >
            {row2.map((league, i) => (
              <LeagueLogo key={`r2-${league.slug}-${i}`} league={league} />
            ))}
          </motion.div>
          <EdgeFades />
        </div>
      </div>
    </section>
  );
}

function LeagueLogo({ league }: { league: League }) {
  return (
    <div className="mx-3 flex-shrink-0 sm:mx-4" title={league.name}>
      <div
        className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl p-3 transition-all duration-300 hover:scale-110 sm:h-20 sm:w-20 sm:p-4"
        style={{
          background: "hsl(var(--glass-1))",
          border: "1px solid hsl(0 0% 100% / 0.06)",
        }}
      >
        {/* Hover glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: "radial-gradient(circle at center, hsl(var(--accent-green) / 0.15), transparent 70%)",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/leagues/${league.slug}.${league.ext ?? "png"}`}
          alt={league.name}
          className="relative h-full w-auto max-w-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
    </div>
  );
}

function EdgeFades() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "linear-gradient(90deg, hsl(var(--bg-base)) 0%, transparent 10%, transparent 90%, hsl(var(--bg-base)) 100%)",
      }}
    />
  );
}
