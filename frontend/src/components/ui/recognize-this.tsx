"use client";

/**
 * RecognizeThis, empathy-first pain-recognition section.
 *
 * Sits between the hero and the proof-oriented sections (live proof,
 * tier ladder, trust funnel). Purpose: hit the visitor with the exact
 * frustrations they've had in Telegram groups / tipster sites so they
 * think "yes, that's me" BEFORE we start pitching the solution.
 *
 * Tone rules (per product feedback):
 *   - Never accuse competitors of scamming / bedrog, describe patterns
 *     the visitor has experienced, not labels for bad actors.
 *   - Empathy first, pitch second. Lead with "we get it" not "they're bad".
 *   - Each card is a recognisable pattern, not a general industry stat.
 */

import Link from "next/link";
import { motion } from "motion/react";
import {
  HelpCircle,
  EyeOff,
  Clock3,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { HexBadge } from "@/components/noct/hex-badge";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

export function RecognizeThis() {
  const { locale } = useTranslations();
  const loc = useLocalizedHref();
  const isNl = locale === "nl";

  const pains: {
    icon: typeof HelpCircle;
    title: string;
    desc: string;
    variant: "purple" | "blue" | "green";
  }[] = [
    {
      icon: HelpCircle,
      variant: "purple",
      title: isNl ? "Tips zonder onderbouwing" : "Tips without any basis",
      desc: isNl
        ? "Een bericht met 'Leg in op Madrid, vertrouw me'. Geen winkans, geen uitleg, geen trackrecord om op te zoeken. Je moet maar hopen dat het werkt."
        : "A message saying 'Back Madrid, trust me.' No win probability, no reasoning, no track record to look up. You just hope it works.",
    },
    {
      icon: EyeOff,
      variant: "blue",
      title: isNl ? "Verliezen die 'nooit gebeurd' zijn" : "Losses that 'never happened'",
      desc: isNl
        ? "Gisteren had de groep nog 50+ berichten. Vandaag zie je alleen de winnaars. Screenshots van 95% winrate maar nergens een verloren pick te bekennen."
        : "Yesterday the group had 50+ messages. Today you only see the winners. Screenshots boasting 95% hit rates but not a single losing pick in sight.",
    },
    {
      icon: Clock3,
      variant: "green",
      title: isNl ? "Altijd te laat binnen" : "Always in too late",
      desc: isNl
        ? "De tip komt 5 minuten voor aftrap. Geen tijd om na te denken, de odds zijn al gekelderd, en de 'zekere winst' was er alleen voor wie sneller was dan jij."
        : "The tip lands 5 minutes before kickoff. No time to think, the odds have already crashed, and the 'sure thing' only paid for whoever moved faster than you.",
    },
    {
      icon: Lock,
      variant: "purple",
      title: isNl ? "Betalen voor een spreadsheet" : "Paying for a spreadsheet",
      desc: isNl
        ? "€100 per maand voor toegang tot een gedeelde sheet met picks. Geen model, geen cijfers per tier, geen manier om zelf te controleren of het klopt."
        : "€100 a month to access a shared sheet of picks. No model, no per-tier stats, no way to verify any of it yourself.",
    },
  ];

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Ambient glows, warmer tones to signal "this is the pain section" */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-10 h-[460px] w-[460px] rounded-full"
        style={{ background: "hsl(var(--accent-purple) / 0.16)", filter: "blur(140px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 bottom-10 h-[420px] w-[420px] rounded-full"
        style={{ background: "hsl(var(--accent-blue) / 0.1)", filter: "blur(140px)" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-14 max-w-3xl"
        >
          <span className="section-label">
            <Sparkles className="h-3 w-3" />
            {isNl ? "Herken je dit?" : "Sound familiar?"}
          </span>
          <h2 className="text-heading mt-4 text-balance break-words text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
            {isNl ? (
              <>
                Je hebt het{" "}
                <span className="gradient-text-purple">al eerder geprobeerd</span>
                . En het werd niet beter.
              </>
            ) : (
              <>
                You've{" "}
                <span className="gradient-text-purple">been here before</span>
                . And it didn't get better.
              </>
            )}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#a3a9b8]">
            {isNl
              ? "Telegramgroepen met een ‘gegarandeerde' winrate. Tips die pas binnenkomen als je al niks meer kunt doen. Verliezen die een dag later stilletjes uit de groep verdwijnen. We kennen het verhaal. We hoorden dezelfde klacht zo vaak dat we besloten het anders op te lossen."
              : "Telegram groups with a ‘guaranteed' win rate. Tips that drop when there's nothing left to do. Losses that quietly disappear from the chat the next day. We've heard the same story often enough to build the opposite."}
          </p>
        </motion.div>

        {/* Pain cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {pains.map((pain, i) => {
            const Icon = pain.icon;
            return (
              <motion.div
                key={pain.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className={`card-neon card-neon-${pain.variant} rounded-2xl`}
              >
                <div className="relative p-6 sm:p-7">
                  <div className="flex items-start gap-4">
                    <HexBadge variant={pain.variant} size="md">
                      <Icon className="h-5 w-5" />
                    </HexBadge>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-[#ededed] sm:text-lg">
                        {pain.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#a3a9b8]">
                        {pain.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bridge to solution */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="card-neon card-neon-green mt-10 overflow-hidden rounded-2xl halo-green"
        >
          <div className="relative grid items-center gap-4 p-6 sm:grid-cols-[1fr_auto] sm:gap-8 sm:p-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-[#4ade80]">
                {isNl ? "Daarom bouwden we BetsPlug" : "That's why we built BetsPlug"}
              </p>
              <p className="mt-3 text-base leading-relaxed text-[#ededed] sm:text-lg">
                {isNl
                  ? "Eén transparant AI-model. Elke voorspelling wordt vóór de aftrap vergrendeld met tijdstempel. Winst of verlies, alles blijft staan. Per tier kun je de nauwkeurigheid zelf controleren. Geen groepen, geen excel-sheets, geen 'vertrouw me maar'."
                  : "One transparent AI model. Every prediction is locked with a timestamp before kickoff. Win or loss, nothing gets deleted. You can check the accuracy of every tier yourself. No groups, no spreadsheets, no 'just trust me'."}
              </p>
            </div>
            <Link
              href={loc("/how-it-works")}
              className="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isNl ? "Hoe we het anders doen" : "How we do it differently"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
