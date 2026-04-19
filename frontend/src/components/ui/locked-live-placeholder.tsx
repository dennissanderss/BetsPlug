"use client";

/**
 * LockedLivePlaceholder — public-page stand-in for the two "live
 * measurement" surfaces (tier live + BOTD live). The live datasets
 * are intentionally hidden behind a login gate while they grow from
 * zero — showing 0/0 per tier to anonymous visitors would read as
 * "the product doesn't work" instead of "we haven't publicly opened
 * this surface yet". Logged-in users see the real numbers on the
 * authed /trackrecord dashboard.
 */

import Link from "next/link";
import { motion } from "motion/react";
import { Lock, Activity, ArrowRight } from "lucide-react";
import { HexBadge } from "@/components/noct/hex-badge";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";

interface LockedLivePlaceholderProps {
  /** Visible section number (e.g. "2" or "4"). */
  number: "2" | "4";
  /** Which data surface this placeholder replaces. */
  variant: "tier" | "botd";
  /** HTML anchor id for TOC links. */
  id: string;
}

export function LockedLivePlaceholder({
  number,
  variant,
  id,
}: LockedLivePlaceholderProps) {
  const { locale } = useTranslations();
  const isNl = locale === "nl";
  const loc = useLocalizedHref();

  const title =
    variant === "tier"
      ? isNl
        ? `${number} · Live meting per tier`
        : `${number} · Live measurement per tier`
      : isNl
        ? `${number} · Pick van de Dag — live meting`
        : `${number} · Pick of the Day — live measurement`;

  const headline =
    variant === "tier"
      ? isNl
        ? "Alleen zichtbaar voor ingelogde gebruikers"
        : "Visible to signed-in users only"
      : isNl
        ? "Alleen zichtbaar voor ingelogde gebruikers"
        : "Visible to signed-in users only";

  const body =
    variant === "tier"
      ? isNl
        ? "De live meting per tier is de strikt pre-match dataset die dagelijks groeit vanaf 16 april 2026. We bouwen deze zichtbaar op in het dashboard zodat je per dag kunt volgen hoe elke tier presteert. Omdat dit in de opbouwfase zit, is hij afgeschermd: zo zie je niet per ongeluk een half-gevulde grafiek. Log in om de actuele stand te bekijken op je dashboard."
        : "The live measurement per tier is the strict pre-match dataset growing daily from April 16 2026. We build this up visibly inside the dashboard so you can track each tier's progress day by day. Because it is in its warm-up phase, it is gated: you won't accidentally read a half-filled chart. Sign in to see today's live numbers on your dashboard."
      : isNl
        ? "De live meting voor de Pick van de Dag toont alleen picks die daadwerkelijk voor de aftrap werden vastgezet, sinds 18 april 2026. Hij start klein en groeit elke dag dat een BOTD-wedstrijd wordt gespeeld. Zolang de steekproef nog niet statistisch betekenisvol is, staat deze meting achter een inlog — zo interpreteer je nooit een te klein getal als 'eindbeoordeling'. Log in om de stand van vandaag te zien."
        : "The BOTD live measurement only includes picks locked before kickoff, since April 18 2026. It starts small and grows each day a BOTD fixture is played. While the sample is too small to read as a final verdict, this measurement is gated behind a login — so you never misread a tiny sample as a conclusion. Sign in to see today's number.";

  const loginHref = loc("/login");
  const dashboardHref = loc("/trackrecord");

  return (
    <section
      id={id}
      className="relative overflow-hidden py-20 md:py-28 scroll-mt-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-10 h-[440px] w-[440px] rounded-full"
        style={{
          background: "hsl(var(--accent-blue) / 0.08)",
          filter: "blur(140px)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 max-w-2xl"
        >
          <span className="section-label">
            <Activity className="h-3 w-3" />
            {title}
          </span>
        </motion.div>

        {/* The locked card itself */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="card-neon card-neon-blue relative overflow-hidden rounded-3xl"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 -top-20 h-[360px] w-[360px] rounded-full"
            style={{
              background: "hsl(var(--accent-blue) / 0.18)",
              filter: "blur(120px)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -bottom-20 h-[320px] w-[320px] rounded-full"
            style={{
              background: "hsl(var(--accent-green) / 0.12)",
              filter: "blur(120px)",
            }}
          />

          <div className="relative p-6 sm:p-10 md:p-14">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-10">
              <div className="shrink-0">
                <HexBadge variant="blue" size="lg">
                  <Lock className="h-6 w-6" />
                </HexBadge>
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-heading text-balance break-words text-2xl text-[#ededed] sm:text-3xl">
                  {headline}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-[#a3a9b8] sm:text-base">
                  {body}
                </p>

                <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <Link
                    href={loginHref}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    {isNl ? "Log in om te bekijken" : "Sign in to view"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={dashboardHref}
                    className="btn-glass inline-flex items-center gap-2"
                  >
                    {isNl ? "Ga naar dashboard" : "Go to dashboard"}
                  </Link>
                </div>

                <p className="mt-6 text-[11px] leading-relaxed text-[#6b7280]">
                  {isNl
                    ? "Geen account? De backtest-cijfers hierboven (sectie 1 en 3) zijn volledig openbaar — daarvoor hoef je niet in te loggen."
                    : "No account? The backtest numbers above (sections 1 and 3) are fully public — no sign-in needed for those."}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default LockedLivePlaceholder;
