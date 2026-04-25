/**
 * League hub — methodology + trust section.
 *
 * Server-rendered E-E-A-T block. Explains what goes into a single
 * league prediction, answers the "is this just a tipster?" question
 * Google scoring loves, and builds topical authority with specific
 * concrete nouns (xG, Elo, form, H2H). SEO target: informational
 * longtails like "how does ai predict {league} matches", "most
 * accurate {league} predictions".
 */

import { BarChart3, Database, Cpu, ShieldCheck } from "lucide-react";
import { HexBadge } from "@/components/noct/hex-badge";

interface Props {
  leagueName: string;
  locale: import("@/i18n/config").Locale;
}

export function LeagueHubMethodology({ leagueName, locale }: Props) {
  const t = (en: string, nl: string) => (locale === "nl" ? nl : en);

  const steps = [
    {
      icon: Database,
      variant: "green" as const,
      title: t("40+ stats per match", "40+ statistieken per wedstrijd"),
      desc: t(
        `For every ${leagueName} fixture our data pipeline pulls form over the last 5 and 10 matches, home/away splits, head-to-head from the last 5 meetings, goals for/against, clean-sheet rates, rest days and league-position gap — all timestamped before kick-off.`,
        `Voor elke ${leagueName}-wedstrijd haalt onze pipeline de vorm van de laatste 5 en 10 duels op, thuis/uit-splits, onderlinge resultaten van de afgelopen 5 ontmoetingen, gemaakte/tegendoelpunten, clean-sheet percentages, rustdagen en het gat in de stand — allemaal tijdstempeld vóór de aftrap.`,
      ),
    },
    {
      icon: Cpu,
      variant: "purple" as const,
      title: t("Three models, one probability", "Drie modellen, één kans"),
      desc: t(
        `Team-strength ratings (Elo), a scoreline predictor (Poisson-style) and a pattern-recognition model each produce their own home/draw/away probability. We weight and combine them so one model can't dominate a bad call — you see the blended output.`,
        `Teamsterkte-ratings (Elo), een scoreline-voorspeller (Poisson-stijl) en een patroonherkenner berekenen ieder hun eigen thuis/gelijk/uit kans. We wegen ze en combineren ze zodat één model niet één slechte call kan doordrukken — je ziet de gecombineerde output.`,
      ),
    },
    {
      icon: BarChart3,
      variant: "blue" as const,
      title: t("Calibrated against 5+ seasons", "Gekalibreerd op 5+ seizoenen"),
      desc: t(
        `Every model is back-tested against the last five ${leagueName} seasons, including cup-derby anomalies and mid-season manager changes. Calibration means a "72% pick" was right ~72 out of 100 times historically, not over-confident hot air.`,
        `Elk model is backtest op de laatste vijf ${leagueName}-seizoenen, inclusief cup-derby anomalieën en managerwissels halverwege. Kalibratie betekent dat een "72% pick" historisch gezien ~72 van de 100 keer klopte, geen overschatting.`,
      ),
    },
    {
      icon: ShieldCheck,
      variant: "green" as const,
      title: t("Locked before kickoff, public after", "Vastgezet vóór aftrap, openbaar erna"),
      desc: t(
        `Every prediction is timestamped and frozen before the whistle. After full time, the result is auto-graded — win, loss or push — and folded back into the public track record. No quietly-edited picks. No cherry-picking.`,
        `Elke voorspelling wordt getijdstempeld en bevroren vóór het fluitsignaal. Na het eindsignaal wordt de uitslag automatisch beoordeeld — winst, verlies of gelijkspel — en opgenomen in het openbare trackrecord. Geen stille bewerkingen. Geen cherry-picking.`,
      ),
    },
  ];

  return (
    <section id="methodology" className="relative py-16 md:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/4 top-10 h-[340px] w-[520px] rounded-full"
        style={{ background: "hsl(var(--accent-green) / 0.08)", filter: "blur(140px)" }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <span className="section-label">
            {t("How the model works", "Hoe het model werkt")}
          </span>
          <h2 className="text-heading mt-3 text-2xl text-[#ededed] sm:text-3xl lg:text-4xl">
            {t(
              `How our AI predicts ${leagueName} matches`,
              `Hoe onze AI ${leagueName}-wedstrijden voorspelt`,
            )}
          </h2>
          <p className="mt-3 text-sm text-[#a3a9b8] sm:text-base">
            {t(
              "We're not a tipster. We're a data pipeline with a public track record. Here's what goes into every probability on this page.",
              "We zijn geen tipster. We zijn een datapijplijn met een openbaar trackrecord. Dit is wat er in elke kans op deze pagina gaat.",
            )}
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {steps.map((step) => (
            <div
              key={step.title}
              className={`card-neon card-neon-${step.variant} p-5 sm:p-6`}
            >
              <div className="relative">
                <HexBadge variant={step.variant} size="md">
                  <step.icon className="h-5 w-5" />
                </HexBadge>
                <h3 className="text-heading mt-4 text-lg text-[#ededed] sm:text-xl">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#a3a9b8]">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
