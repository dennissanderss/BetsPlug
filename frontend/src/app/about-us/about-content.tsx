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
  ArrowRight,
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
import { HeroMediaBg, CtaMediaBg } from "@/components/ui/media-bg";
import { PAGE_IMAGES } from "@/data/page-images";

/** Map Lucide icon string names from Sanity to actual components. */
const ICON_MAP: Record<string, LucideIcon> = {
  Brain, Eye, RefreshCw, Scale, Sparkles, Zap, Target, LineChart, Users, Trophy,
};

/** Resolve an icon name from Sanity to a Lucide component, with a fallback. */
function resolveIcon(name: string | undefined, fallback: LucideIcon): LucideIcon {
  if (!name) return fallback;
  return ICON_MAP[name] ?? fallback;
}

/** Serializable about data passed from the server component. */
interface SanityAboutData {
  founders: { name: string; initial: string; role: string; bio: string }[];
  stats: { value: string; label: string }[];
  values: { title: string; description: string; icon: string }[];
}

interface AboutContentProps {
  faqSlot?: React.ReactNode;
  sanityAbout?: SanityAboutData;
}

/**
 * About Us page — BetsPlug's story, mission, principles and founders.
 * Dark/green design language, motion-driven reveals, SEO-optimized copy.
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
    <div className="min-h-screen overflow-x-hidden bg-background text-slate-900">
      {/* Shared site navigation */}
      <SiteNav />

      {/* ═══════════════════════════════════════════════════════════════════
          HERO
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="no-rhythm relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <HeroMediaBg src={PAGE_IMAGES.about.hero} alt="" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="section-label mb-5"
          >
            <Sparkles className="h-3 w-3" />
            {t("about.heroBadge")}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-display text-3xl text-white sm:text-4xl lg:text-5xl"
          >
            {t("about.heroTitleA")}
            <br />
            <span className="gradient-text">{t("about.heroTitleB")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg"
          >
            {t("about.heroSubtitle")}
          </motion.p>

          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            aria-label="Breadcrumb"
            className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500"
          >
            <Link href={home} className="transition-colors hover:text-green-600">
              {t("about.breadcrumbHome")}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600">{t("about.breadcrumbAbout")}</span>
          </motion.nav>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          MISSION — two column
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left: visual card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60">
                {/* Ambient glow */}
                <div className="pointer-events-none absolute -left-20 -top-20 h-[250px] w-[250px] rounded-full bg-green-50 blur-[100px]" />
                <div className="pointer-events-none absolute -bottom-20 -right-20 h-[250px] w-[250px] rounded-full bg-emerald-50 blur-[100px]" />

                {/* Grid overlay */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(74,222,128,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.4) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                />

                {/* Content inside the card — "model output" mock */}
                <div className="relative">
                  <div className="mb-6 flex items-center gap-2">
                    <span className="live-dot" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-green-600">
                      Model Output · Live
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">
                          Man City vs Liverpool
                        </span>
                        <span className="font-mono text-green-600">+EV 12.4%</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>Home 54%</span>
                        <span>·</span>
                        <span>Draw 22%</span>
                        <span>·</span>
                        <span>Away 24%</span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full w-[54%] rounded-full bg-gradient-to-r from-green-500 to-emerald-400" />
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">
                          Lakers vs Celtics
                        </span>
                        <span className="font-mono text-green-600">+EV 8.1%</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>LAL 47%</span>
                        <span>·</span>
                        <span>BOS 53%</span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full w-[53%] rounded-full bg-gradient-to-r from-green-500 to-emerald-400" />
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">
                          Djokovic vs Alcaraz
                        </span>
                        <span className="font-mono text-green-600">+EV 6.7%</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>DJO 51%</span>
                        <span>·</span>
                        <span>ALC 49%</span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full w-[51%] rounded-full bg-gradient-to-r from-green-500 to-emerald-400" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">
                      Updated 12s ago
                    </span>
                    <Trophy className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: copy */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7 }}
            >
              <span className="section-label mb-4">
                {t("about.missionBadge")}
              </span>
              <h2 className="text-display text-3xl text-white sm:text-4xl lg:text-5xl">
                {t("about.missionTitle")}
              </h2>
              <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">
                {t("about.missionBody1")}
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                {t("about.missionBody2")}
              </p>

              <Link
                href={`${home}#how-it-works`}
                className="btn-outline mt-8"
              >
                {String(t("about.missionCta")).toUpperCase()} →
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative border-y border-slate-200 bg-gradient-to-b from-white to-slate-50 py-20 md:py-28">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-12 sm:mb-14 flex flex-col items-center text-center"
          >
            <span className="section-label mb-4">
              {t("about.statsBadge")}
            </span>
            <h2 className="text-display text-3xl text-white sm:text-4xl lg:text-5xl">
              {t("about.statsTitle")}
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5 }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm transition-all hover:border-green-500/30 hover:shadow-md"
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 h-[120px] w-[120px] rounded-full bg-green-50 blur-[60px] transition-all group-hover:bg-green-100" />
                  <div className="relative">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 ring-1 ring-green-500/30">
                      <Icon className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-4xl font-extrabold tracking-tight text-slate-900">
                      {stat.value}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                      {stat.label}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          VALUES
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-12 sm:mb-14 flex max-w-2xl flex-col items-center text-center"
          >
            <span className="section-label mb-4">
              {t("about.valuesBadge")}
            </span>
            <h2 className="text-display text-3xl text-white sm:text-4xl lg:text-5xl">
              {t("about.valuesTitle")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              {t("about.valuesSubtitle")}
            </p>
          </motion.div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5 }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm transition-all hover:border-green-500/30 hover:shadow-md"
                >
                  <div className="pointer-events-none absolute -right-16 -top-16 h-[200px] w-[200px] rounded-full bg-green-50 blur-[80px] transition-all group-hover:bg-green-100" />
                  <div className="relative">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 shadow-sm ring-1 ring-green-500/30">
                      <Icon className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="mb-3 text-xl font-extrabold tracking-tight text-slate-900">
                      {v.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {v.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOUNDERS
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative border-t border-slate-200 py-20 md:py-28">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-12 sm:mb-14 flex max-w-2xl flex-col items-center text-center"
          >
            <span className="section-label mb-4">
              {t("about.teamBadge")}
            </span>
            <h2 className="text-display text-3xl text-white sm:text-4xl lg:text-5xl">
              {t("about.teamTitle")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              {t("about.teamSubtitle")}
            </p>
          </motion.div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
            {founders.map((f) => (
              <motion.div
                key={f.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6 }}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm transition-all hover:border-green-500/30 hover:shadow-md"
              >
                <div className="pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full bg-green-50 blur-[100px] transition-all group-hover:bg-green-100" />

                <div className="relative">
                  {/* Avatar */}
                  <div className="mb-6 flex items-center gap-4">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-emerald-50 shadow-sm ring-1 ring-green-500/30">
                      <span className="text-2xl font-extrabold text-green-600">
                        {f.initial}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        {f.name}
                      </h3>
                      <p className="text-xs font-semibold uppercase tracking-widest text-green-600">
                        {f.role}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                    {f.bio}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {faqSlot}

      {/* ═══════════════════════════════════════════════════════════════════
          CTA BANNER
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="relative overflow-hidden bg-[#4ade80] p-10 md:p-16"
          >
            <CtaMediaBg src={PAGE_IMAGES.about.cta} alt={PAGE_IMAGES.about.alt} pattern={PAGE_IMAGES.about.pattern} />
            <span className="pointer-events-none absolute left-0 top-0 z-10 h-4 w-4 border-l-2 border-t-2 border-[#050505]" />
            <span className="pointer-events-none absolute right-0 top-0 z-10 h-4 w-4 border-r-2 border-t-2 border-[#050505]" />
            <span className="pointer-events-none absolute left-0 bottom-0 z-10 h-4 w-4 border-l-2 border-b-2 border-[#050505]" />
            <span className="pointer-events-none absolute right-0 bottom-0 z-10 h-4 w-4 border-r-2 border-b-2 border-[#050505]" />

            <div className="relative">
              <span className="mb-6 inline-flex items-center gap-2 bg-[#050505] px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#4ade80]">
                <Sparkles className="h-3 w-3" />
                {t("nav.getStarted")}
              </span>
              <h2 className="text-display text-3xl text-[#050505] sm:text-4xl lg:text-5xl">
                {t("about.ctaTitle")}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#050505]/80">
                {t("about.ctaSubtitle")}
              </p>

              <Link
                href={`${home}#pricing`}
                className="mt-10 inline-flex items-center gap-2 bg-[#050505] px-8 py-4 text-xs font-black uppercase tracking-widest text-[#4ade80] transition-colors hover:bg-[#1a1a1a]"
              >
                {String(t("about.ctaButton")).toUpperCase()} →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <BetsPlugFooter />
    </div>
  );
}

export default AboutContent;
