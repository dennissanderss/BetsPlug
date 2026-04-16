"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Sparkles,
  Brain,
  LineChart,
  Eye,
  RefreshCw,
  Scale,
  ChevronRight,
  Target,
  Trophy,
  Zap,
  Users,
  type LucideIcon,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill, DataChip } from "@/components/noct/pill";
import { HeroMediaBg } from "@/components/ui/media-bg";

/** Map Lucide icon string names from Sanity to actual components. */
const ICON_MAP: Record<string, LucideIcon> = {
  Brain, Eye, RefreshCw, Scale, Sparkles, Zap, Target, LineChart, Users, Trophy,
};

function resolveIcon(name: string | undefined, fallback: LucideIcon): LucideIcon {
  if (!name) return fallback;
  return ICON_MAP[name] ?? fallback;
}

interface SanityAboutData {
  founders: { name: string; initial: string; role: string; bio: string }[];
  stats: { value: string; label: string }[];
  values: { title: string; description: string; icon: string }[];
}

interface AboutContentProps {
  faqSlot?: React.ReactNode;
  sanityAbout?: SanityAboutData;
}

type Accent = "green" | "purple" | "blue";
const VALUE_VARIANTS: Accent[] = ["green", "purple", "blue", "green"];
const STAT_VARIANTS: Accent[] = ["green", "purple", "blue", "green"];

/**
 * About Us — NOCTURNE rebuild.
 */
export function AboutContent({ faqSlot, sanityAbout }: AboutContentProps) {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const home = loc("/");

  const defaultStatIcons: LucideIcon[] = [Zap, Target, LineChart, Users];
  const stats = sanityAbout?.stats?.length
    ? sanityAbout.stats.map((s, i) => ({
        value: s.value,
        label: s.label,
        icon: defaultStatIcons[i] ?? Zap,
      }))
    : [
        { value: t("about.stat1Value"), label: t("about.stat1Label"), icon: Zap },
        { value: t("about.stat2Value"), label: t("about.stat2Label"), icon: Target },
        { value: t("about.stat3Value"), label: t("about.stat3Label"), icon: LineChart },
        { value: t("about.stat4Value"), label: t("about.stat4Label"), icon: Users },
      ];

  const defaultValueIcons: LucideIcon[] = [Brain, Eye, RefreshCw, Scale];
  const values = sanityAbout?.values?.length
    ? sanityAbout.values.map((v, i) => ({
        icon: resolveIcon(v.icon, defaultValueIcons[i] ?? Brain),
        title: v.title,
        desc: v.description,
      }))
    : [
        { icon: Brain, title: t("about.value1Title"), desc: t("about.value1Desc") },
        { icon: Eye, title: t("about.value2Title"), desc: t("about.value2Desc") },
        { icon: RefreshCw, title: t("about.value3Title"), desc: t("about.value3Desc") },
        { icon: Scale, title: t("about.value4Title"), desc: t("about.value4Desc") },
      ];

  const founders = sanityAbout?.founders?.length
    ? sanityAbout.founders.map((f) => ({
        name: f.name,
        role: f.role,
        bio: f.bio,
        initial: f.initial || f.name.charAt(0).toUpperCase(),
      }))
    : [
        { name: t("about.founder1Name"), role: t("about.founder1Role"), bio: t("about.founder1Bio"), initial: "C" },
        { name: t("about.founder2Name"), role: t("about.founder2Role"), bio: t("about.founder2Bio"), initial: "D" },
      ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      <SiteNav />

      {/* ───────────── HERO ───────────── */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <HeroMediaBg />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 top-20 h-[500px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.14)", filter: "blur(160px)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-40 h-[460px] w-[460px] rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.12)", filter: "blur(160px)" }}
        />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="section-label mb-6 inline-flex items-center gap-2"
          >
            <Sparkles className="h-3 w-3" />
            {t("about.heroBadge")}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-display text-2xl text-[#ededed] text-balance break-words sm:text-4xl lg:text-5xl"
          >
            {t("about.heroTitleA")}{" "}
            <span className="gradient-text-green">{t("about.heroTitleB")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#a3a9b8] sm:text-lg"
          >
            {t("about.heroSubtitle")}
          </motion.p>

          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            aria-label="Breadcrumb"
            className="mt-8 flex items-center justify-center gap-2 text-xs text-[#a3a9b8]"
          >
            <Link href={home} className="transition-colors hover:text-[#4ade80]">
              {t("about.breadcrumbHome")}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#ededed]">{t("about.breadcrumbAbout")}</span>
          </motion.nav>
        </div>
      </section>

      {/* ───────────── MISSION ───────────── */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 top-20 h-[500px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.12)", filter: "blur(160px)" }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left: Pulse mock card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="card-neon card-neon-green halo-green rounded-3xl">
                <div className="relative p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="live-dot" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#4ade80]">
                        BetsPlug Pulse · Live
                      </span>
                    </div>
                    <HexBadge variant="green" size="sm">
                      <Trophy className="h-4 w-4" />
                    </HexBadge>
                  </div>

                  <div className="space-y-4">
                    <MockRow
                      title="Man City vs Liverpool"
                      ev="+EV 12.4%"
                      probs={[
                        { label: "Home", value: "54%" },
                        { label: "Draw", value: "22%" },
                        { label: "Away", value: "24%" },
                      ]}
                      barWidth="54%"
                    />
                    <MockRow
                      title="Lakers vs Celtics"
                      ev="+EV 8.1%"
                      probs={[
                        { label: "LAL", value: "47%" },
                        { label: "BOS", value: "53%" },
                      ]}
                      barWidth="53%"
                    />
                    <MockRow
                      title="Djokovic vs Alcaraz"
                      ev="+EV 6.7%"
                      probs={[
                        { label: "DJO", value: "51%" },
                        { label: "ALC", value: "49%" },
                      ]}
                      barWidth="51%"
                    />
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4">
                    <span className="text-[10px] uppercase tracking-wider text-[#a3a9b8]">
                      Updated 12s ago
                    </span>
                    <Pill tone="active" className="!text-[10px]">
                      3 signals
                    </Pill>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Copy */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7 }}
            >
              <span className="section-label mb-4 inline-flex items-center gap-2">
                <Target className="h-3 w-3" />
                {t("about.missionBadge")}
              </span>
              <h2 className="text-heading text-2xl text-[#ededed] text-balance break-words sm:text-3xl lg:text-4xl">
                {t("about.missionTitle")}
              </h2>
              <p className="mt-6 text-base leading-relaxed text-[#a3a9b8] sm:text-lg">
                {t("about.missionBody1")}
              </p>
              <p className="mt-4 text-base leading-relaxed text-[#a3a9b8] sm:text-lg">
                {t("about.missionBody2")}
              </p>

              <Link href={`${home}#how-it-works`} className="btn-glass mt-8 inline-flex">
                {t("about.missionCta")}
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───────────── STATS ───────────── */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full"
          style={{ background: "hsl(var(--accent-blue) / 0.1)", filter: "blur(160px)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 flex flex-col items-center text-center"
          >
            <span className="section-label mb-4 inline-flex items-center gap-2">
              <LineChart className="h-3 w-3" />
              {t("about.statsBadge")}
            </span>
            <h2 className="text-heading text-2xl text-[#ededed] text-balance break-words sm:text-3xl lg:text-4xl">
              {t("about.statsTitle")}
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              const variant = STAT_VARIANTS[i % STAT_VARIANTS.length];
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className={`card-neon card-neon-${variant} rounded-2xl`}
                >
                  <div className="relative p-6 sm:p-8">
                    <HexBadge variant={variant} size="md" className="mb-4">
                      <Icon className="h-5 w-5" />
                    </HexBadge>
                    <div className="text-stat text-3xl text-[#ededed] sm:text-4xl">
                      {stat.value}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#a3a9b8]">
                      {stat.label}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────── VALUES ───────────── */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-20 h-[480px] w-[480px] rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.12)", filter: "blur(160px)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 flex max-w-2xl flex-col items-center text-center"
          >
            <span className="section-label mb-4 inline-flex items-center gap-2">
              <Scale className="h-3 w-3" />
              {t("about.valuesBadge")}
            </span>
            <h2 className="text-heading text-2xl text-[#ededed] text-balance break-words sm:text-3xl lg:text-4xl">
              {t("about.valuesTitle")}
            </h2>
            <p className="mt-4 text-base text-[#a3a9b8]">
              {t("about.valuesSubtitle")}
            </p>
          </motion.div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
            {values.map((v, i) => {
              const Icon = v.icon;
              const variant = VALUE_VARIANTS[i % VALUE_VARIANTS.length];
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className={`card-neon card-neon-${variant} rounded-2xl`}
                >
                  <div className="relative p-6 sm:p-8">
                    <HexBadge variant={variant} size="md" className="mb-5">
                      <Icon className="h-5 w-5" />
                    </HexBadge>
                    <h3 className="mb-3 text-xl font-semibold text-[#ededed]">
                      {v.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#a3a9b8]">
                      {v.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────── FOUNDERS ───────────── */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 top-20 h-[500px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.14)", filter: "blur(160px)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 flex max-w-2xl flex-col items-center text-center"
          >
            <span className="section-label mb-4 inline-flex items-center gap-2">
              <Users className="h-3 w-3" />
              {t("about.teamBadge")}
            </span>
            <h2 className="text-heading text-2xl text-[#ededed] text-balance break-words sm:text-3xl lg:text-4xl">
              {t("about.teamTitle")}
            </h2>
            <p className="mt-4 text-base text-[#a3a9b8]">
              {t("about.teamSubtitle")}
            </p>
          </motion.div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
            {founders.map((f, i) => (
              <motion.div
                key={f.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="card-neon card-neon-purple rounded-3xl"
              >
                <div className="relative p-6 sm:p-8">
                  <div className="mb-6 flex items-center gap-4">
                    <HexBadge variant="purple" size="xl">
                      <span className="text-2xl font-bold">{f.initial}</span>
                    </HexBadge>
                    <div>
                      <h3 className="text-2xl font-semibold text-[#ededed]">
                        {f.name}
                      </h3>
                      <Pill tone="purple" className="!text-[10px] mt-1">
                        {f.role}
                      </Pill>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-[#a3a9b8] sm:text-base">
                    {f.bio}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {faqSlot}

      {/* ───────────── CTA ───────────── */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="card-neon card-neon-green relative overflow-hidden rounded-3xl"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -left-20 -top-20 h-[400px] w-[400px] rounded-full"
              style={{ background: "hsl(var(--accent-green) / 0.25)", filter: "blur(140px)" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -bottom-20 h-[400px] w-[400px] rounded-full"
              style={{ background: "hsl(var(--accent-purple) / 0.2)", filter: "blur(140px)" }}
            />

            <div className="relative p-6 sm:p-8 md:p-16">
              <span className="section-label mb-6 inline-flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                {t("nav.getStarted")}
              </span>
              <h2 className="text-display text-2xl text-[#ededed] text-balance break-words sm:text-3xl lg:text-4xl">
                {t("about.ctaTitle")}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#a3a9b8]">
                {t("about.ctaSubtitle")}
              </p>
              <Link href={`${home}#pricing`} className="btn-primary mt-10 inline-flex">
                {t("about.ctaButton")}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <BetsPlugFooter />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Small mock row for the Pulse card
   ────────────────────────────────────────────────────────────── */
function MockRow({
  title,
  ev,
  probs,
  barWidth,
}: {
  title: string;
  ev: string;
  probs: { label: string; value: string }[];
  barWidth: string;
}) {
  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-[#ededed]">{title}</span>
        <DataChip tone="win">{ev}</DataChip>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-[#a3a9b8]">
        {probs.map((p, i) => (
          <React.Fragment key={p.label}>
            <span>
              {p.label} {p.value}
            </span>
            {i < probs.length - 1 && <span>·</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full"
          style={{
            width: barWidth,
            background: "linear-gradient(to right, #4ade80, #22c55e)",
          }}
        />
      </div>
    </div>
  );
}

export default AboutContent;
