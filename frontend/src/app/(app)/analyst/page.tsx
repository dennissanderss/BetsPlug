import Link from "next/link";
import { Telescope, Activity, LineChart, ArrowRight } from "lucide-react";
import { HexBadge } from "@/components/noct/hex-badge";

export const metadata = {
  title: "Data Analyst — BetsPlug",
  robots: { index: false, follow: false },
};

const cards = [
  {
    href: "/analyst/predictions",
    icon: Telescope,
    variant: "green" as const,
    title: "Predictions Explorer",
    desc: "Filter every pick by tier, market, league and export to CSV.",
  },
  {
    href: "/analyst/matches",
    icon: Activity,
    variant: "purple" as const,
    title: "Match Deep Dive",
    desc: "Submodel breakdown, Elo progression and feature importance per match.",
  },
  {
    href: "/analyst/engine-performance",
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
              <Link
                key={card.href}
                href={card.href}
                className={`card-neon card-neon-${card.variant} group block p-6 sm:p-7`}
              >
                <div className="relative">
                  <HexBadge variant={card.variant} size="md">
                    <Icon className="h-5 w-5" />
                  </HexBadge>
                  <h3 className="text-heading mt-4 text-xl text-[#ededed]">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm text-[#a3a9b8]">{card.desc}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-xs text-[#4ade80] opacity-0 transition-opacity group-hover:opacity-100">
                    Open <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
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
