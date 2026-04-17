"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "@/i18n/locale-provider";

/**
 * LeaguesTicker — dual-row horizontal ticker of league crests.
 *
 * Perf notes (this component was a mobile hotspot):
 *   • Animation is CSS-only (`@keyframes bp-ticker-l/r`). Running on
 *     the compositor thread means zero JS main-thread cost per frame
 *     on low-end Android. Previously used framer-motion which runs
 *     rAF on JS thread → janked on mobile.
 *   • Uses 2 copies of the list (minimum for seamless loop at -50%)
 *     instead of 3 — ~33% fewer DOM nodes + image decodes.
 *   • `content-visibility: auto` skips render when off-screen.
 *   • `prefers-reduced-motion` disables animation entirely.
 *   • Ambient glow is a static, small-blur radial gradient instead
 *     of a 160px blur filter (which forces an offscreen buffer and
 *     repaints whenever anything composites above it).
 *   • Hover effects are gated behind `@media (hover: hover)` so
 *     touch devices skip the transitions altogether.
 */

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
  // Two copies is the minimum for a seamless -50% loop.
  const row1 = [...leagues, ...leagues];
  const row2 = [...leaguesReversed, ...leaguesReversed];

  return (
    <section
      className="bp-ticker-section relative overflow-hidden py-16 md:py-24"
      aria-labelledby="leagues-heading"
    >
      {/* Static, cheap ambient background — no blur filter. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, hsl(var(--accent-green) / 0.08), transparent 70%)",
        }}
      />

      {/* Title */}
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
        <div className="relative overflow-hidden">
          <div className="bp-ticker-track bp-ticker-track--l flex w-max items-center">
            {row1.map((league, i) => (
              <LeagueLogo
                key={`r1-${league.slug}-${i}`}
                league={league}
                // The second copy is a visual duplicate used purely
                // to make the loop seamless. Hide it from a11y tree.
                ariaHidden={i >= leagues.length}
              />
            ))}
          </div>
          <EdgeFades />
        </div>

        <div className="relative overflow-hidden">
          <div className="bp-ticker-track bp-ticker-track--r flex w-max items-center">
            {row2.map((league, i) => (
              <LeagueLogo
                key={`r2-${league.slug}-${i}`}
                league={league}
                ariaHidden={i >= leaguesReversed.length}
              />
            ))}
          </div>
          <EdgeFades />
        </div>
      </div>

      {/* Scoped styles — CSS-only animation runs on the compositor. */}
      <style jsx>{`
        .bp-ticker-section {
          /* Skip painting when off-screen; reserve height to avoid jumps. */
          content-visibility: auto;
          contain-intrinsic-size: 0 560px;
        }

        .bp-ticker-track {
          will-change: transform;
          transform: translate3d(0, 0, 0);
          backface-visibility: hidden;
        }

        .bp-ticker-track--l {
          animation: bp-ticker-l 60s linear infinite;
        }

        .bp-ticker-track--r {
          animation: bp-ticker-r 70s linear infinite;
        }

        @keyframes bp-ticker-l {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }

        @keyframes bp-ticker-r {
          from {
            transform: translate3d(-50%, 0, 0);
          }
          to {
            transform: translate3d(0, 0, 0);
          }
        }

        /* Respect reduced motion — freeze the ticker. */
        @media (prefers-reduced-motion: reduce) {
          .bp-ticker-track--l,
          .bp-ticker-track--r {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}

function LeagueLogo({
  league,
  ariaHidden = false,
}: {
  league: League;
  ariaHidden?: boolean;
}) {
  return (
    <div
      className="bp-ticker-item mx-3 flex-shrink-0 sm:mx-4"
      title={league.name}
      aria-hidden={ariaHidden || undefined}
    >
      <div
        className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl p-3 sm:h-20 sm:w-20 sm:p-4"
        style={{
          background: "hsl(var(--glass-1))",
          border: "1px solid hsl(0 0% 100% / 0.06)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/leagues/${league.slug}.${league.ext ?? "png"}`}
          alt={ariaHidden ? "" : league.name}
          width={80}
          height={80}
          className="relative h-full w-auto max-w-full object-contain"
          loading="lazy"
          decoding="async"
          // @ts-expect-error -- fetchpriority is valid HTML but missing from React types in older versions
          fetchpriority="low"
          draggable={false}
        />
      </div>

      <style jsx>{`
        /* Hover effects only on actual pointer devices — skips touch. */
        @media (hover: hover) and (pointer: fine) {
          .bp-ticker-item > div {
            transition: transform 0.3s ease;
          }
          .bp-ticker-item:hover > div {
            transform: scale(1.08);
          }
        }
      `}</style>
    </div>
  );
}

function EdgeFades() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "linear-gradient(90deg, hsl(var(--bg-base)) 0%, transparent 10%, transparent 90%, hsl(var(--bg-base)) 100%)",
      }}
    />
  );
}
