import { Telescope, Activity, LineChart, Clock } from "lucide-react";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

export const metadata = {
  title: "Data Analyst — BetsPlug",
  robots: { index: false, follow: false },
};

/**
 * Analyst sub-routes (`/analyst/predictions`, `/analyst/engine-performance`)
 * are part of Fase 2 of the v10 build and are not yet shipped. The dynamic
 * `/analyst/matches/[id]` route exists for Match Deep Dive but needs a list
 * entry point before it can be linked here.
 *
 * Rendering these as inert "Coming soon" cards (no href) instead of <Link>
 * prevents the 404 path that Gold+ users were hitting when they clicked
 * through from the hub.
 */
const cards = [
  {
    icon: Telescope,
    variant: "green" as const,
    title: "Predictions Explorer",
    desc: "Filter every pick by tier, market, league and export to CSV.",
  },
  {
    icon: Activity,
    variant: "purple" as const,
    title: "Match Deep Dive",
    desc: "Submodel breakdown, Elo progression and feature importance per match.",
  },
  {
    icon: LineChart,
    variant: "blue" as const,
    title: "Engine Performance",
    desc: "Calibration, Brier score and per-league accuracy.",
  },
];

export default function AnalystHubPage() {
  return (
    <section className="relative">
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-10 max-w-2xl">
          <span className="section-label">
            <Telescope className="h-3 w-3" /> Data Analyst
          </span>
          <h1 className="text-heading mt-3 text-3xl text-[#ededed] sm:text-4xl">
            Your <span className="gradient-text-green">analyst desk</span>.
          </h1>
          <p className="mt-3 text-base text-[#a3a9b8]">
            Three workbenches built on top of the v8 engine — explore every pick, drill into a single match, and verify the engine&apos;s calibration over time.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                aria-disabled="true"
                className={`card-neon card-neon-${card.variant} relative block p-6 opacity-70 cursor-not-allowed sm:p-7`}
                title="Coming soon — Fase 2 of the v10 build"
              >
                <div className="absolute right-4 top-4">
                  <Pill tone="default" className="inline-flex items-center gap-1 text-[10px]">
                    <Clock className="h-3 w-3" />
                    Coming soon
                  </Pill>
                </div>
                <div className="relative">
                  <HexBadge variant={card.variant} size="md">
                    <Icon className="h-5 w-5" />
                  </HexBadge>
                  <h3 className="text-heading mt-4 text-xl text-[#ededed]">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm text-[#a3a9b8]">{card.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-xs text-[#6b7280]">
          Predictions Explorer, Match Deep Dive and Engine Performance go live in Fase 2 of the v10 build.
        </p>
      </div>
    </section>
  );
}
