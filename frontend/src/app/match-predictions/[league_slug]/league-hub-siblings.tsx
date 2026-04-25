/**
 * League hub — sibling leagues cross-link block.
 *
 * Server-rendered: links the current league page to every other
 * league we cover, each with its logo. This strengthens the
 * internal-link graph inside the "match predictions" cluster and
 * gives Google a clear topic hub, while also giving users a fast
 * way to jump to another league after converting or bouncing.
 */

import Image from "next/image";
import Link from "next/link";
import { HexBadge } from "@/components/noct/hex-badge";
import { Globe } from "lucide-react";
import { LEAGUE_LOGO_PATH } from "@/data/league-logos";
import { localizePath } from "@/i18n/routes";
import type { Locale } from "@/i18n/config";

type SlimLeague = { slug: string; name: string; flag?: string };

interface Props {
  currentSlug: string;
  leagues: SlimLeague[];
  /** Editorial locale — drives EN/NL copy swap only. */
  locale: import("@/i18n/config").Locale;
  /** UI locale — drives URL localization. Defaults to "en" so
   *  existing call-sites keep working; pass the real UI locale
   *  (e.g. "de", "fr") from the server page to ensure sibling
   *  links stay on the visitor's current locale. */
  uiLocale?: Locale;
}

export function LeagueHubSiblings({
  currentSlug,
  leagues,
  locale,
  uiLocale = "en",
}: Props) {
  const siblings = leagues.filter((l) => l.slug !== currentSlug);
  if (siblings.length === 0) return null;

  const t = (en: string, nl: string) => (locale === "nl" ? nl : en);

  return (
    <section className="relative py-16 md:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/3 top-0 h-[280px] w-[480px] rounded-full"
        style={{ background: "hsl(var(--accent-blue) / 0.08)", filter: "blur(140px)" }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <HexBadge variant="blue" size="md" className="mx-auto">
            <Globe className="h-5 w-5" />
          </HexBadge>
          <span className="section-label mt-4">
            {t("All leagues", "Alle competities")}
          </span>
          <h2 className="text-heading mt-3 text-2xl text-[#ededed] sm:text-3xl lg:text-4xl">
            {t(
              "AI predictions for every league we cover",
              "AI-voorspellingen voor elke competitie die we volgen",
            )}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[#a3a9b8] sm:text-base">
            {t(
              "Same AI engine, same public track record — pick any competition to see this week's free picks.",
              "Dezelfde AI-motor, hetzelfde openbare trackrecord — kies elke competitie voor de gratis picks van deze week.",
            )}
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {siblings.map((league) => {
            const logo = LEAGUE_LOGO_PATH[league.slug] ?? null;
            return (
              <Link
                key={league.slug}
                href={localizePath(`/match-predictions/${league.slug}`, uiLocale)}
                className="glass-panel-lifted group flex items-center gap-3 px-4 py-3 transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
                  {logo ? (
                    <Image
                      src={logo}
                      alt=""
                      width={28}
                      height={28}
                      className="object-contain"
                    />
                  ) : (
                    <span className="text-base" aria-hidden="true">
                      {league.flag ?? "⚽"}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#ededed] group-hover:text-[#4ade80] transition-colors">
                    {league.name}
                  </p>
                  <p className="text-[11px] uppercase tracking-wider text-[#6b7280]">
                    {t("View predictions", "Bekijk voorspellingen")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
