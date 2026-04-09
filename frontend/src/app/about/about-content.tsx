"use client";

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
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

/**
 * About Us page — BetsPlug's story, mission, principles and founders.
 * Dark/green design language, motion-driven reveals, SEO-optimized copy.
 */
export function AboutContent() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const home = loc("/");

  const stats = [
    { value: t("about.stat1Value"), label: t("about.stat1Label"), icon: Zap },
    { value: t("about.stat2Value"), label: t("about.stat2Label"), icon: Target },
    { value: t("about.stat3Value"), label: t("about.stat3Label"), icon: LineChart },
    { value: t("about.stat4Value"), label: t("about.stat4Label"), icon: Users },
  ];

  const values = [
    {
      icon: Brain,
      title: t("about.value1Title"),
      desc: t("about.value1Desc"),
    },
    {
      icon: Eye,
      title: t("about.value2Title"),
      desc: t("about.value2Desc"),
    },
    {
      icon: RefreshCw,
      title: t("about.value3Title"),
      desc: t("about.value3Desc"),
    },
    {
      icon: Scale,
      title: t("about.value4Title"),
      desc: t("about.value4Desc"),
    },
  ];

  const founders = [
    {
      name: t("about.founder1Name"),
      role: t("about.founder1Role"),
      bio: t("about.founder1Bio"),
      initial: "D",
    },
    {
      name: t("about.founder2Name"),
      role: t("about.founder2Role"),
      bio: t("about.founder2Bio"),
      initial: "A",
    },
  ];

  return (
    <div className="min-h-screen bg-[#080b14] text-white">
      {/* Shared site navigation */}
      <SiteNav />

      {/* ═══════════════════════════════════════════════════════════════════
          HERO
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-20">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-green-500/[0.08] blur-[140px]" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(74,222,128,0.8) 0 1px, transparent 1px 22px)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-400"
          >
            <Sparkles className="h-3 w-3" />
            {t("about.heroBadge")}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            {t("about.heroTitleA")}
            <br />
            <span className="gradient-text">{t("about.heroTitleB")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg"
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
            <Link href={home} className="transition-colors hover:text-green-400">
              {t("about.breadcrumbHome")}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-300">{t("about.breadcrumbAbout")}</span>
          </motion.nav>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          MISSION — two column
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-24">
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left: visual card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-3xl border border-green-500/20 bg-gradient-to-br from-[#0d1624] via-[#0a1220] to-[#060912] p-8 shadow-2xl shadow-green-500/[0.08]">
                {/* Ambient glow */}
                <div className="pointer-events-none absolute -left-20 -top-20 h-[250px] w-[250px] rounded-full bg-green-500/[0.12] blur-[100px]" />
                <div className="pointer-events-none absolute -bottom-20 -right-20 h-[250px] w-[250px] rounded-full bg-emerald-500/[0.10] blur-[100px]" />

                {/* Grid overlay */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.05]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(74,222,128,1) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,1) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                />

                {/* Content inside the card — "model output" mock */}
                <div className="relative">
                  <div className="mb-6 flex items-center gap-2">
                    <span className="live-dot" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">
                      Model Output · Live
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">
                          Man City vs Liverpool
                        </span>
                        <span className="font-mono text-green-400">+EV 12.4%</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>Home 54%</span>
                        <span>·</span>
                        <span>Draw 22%</span>
                        <span>·</span>
                        <span>Away 24%</span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full w-[54%] rounded-full bg-gradient-to-r from-green-500 to-emerald-400" />
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">
                          Lakers vs Celtics
                        </span>
                        <span className="font-mono text-green-400">+EV 8.1%</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>LAL 47%</span>
                        <span>·</span>
                        <span>BOS 53%</span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full w-[53%] rounded-full bg-gradient-to-r from-green-500 to-emerald-400" />
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">
                          Djokovic vs Alcaraz
                        </span>
                        <span className="font-mono text-green-400">+EV 6.7%</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>DJO 51%</span>
                        <span>·</span>
                        <span>ALC 49%</span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full w-[51%] rounded-full bg-gradient-to-r from-green-500 to-emerald-400" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">
                      Updated 12s ago
                    </span>
                    <Trophy className="h-4 w-4 text-green-400" />
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
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-400">
                {t("about.missionBadge")}
              </span>
              <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
                {t("about.missionTitle")}
              </h2>
              <p className="mt-6 text-base leading-relaxed text-slate-400 sm:text-lg">
                {t("about.missionBody1")}
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">
                {t("about.missionBody2")}
              </p>

              <Link
                href={`${home}#how-it-works`}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-6 py-3 text-sm font-extrabold tracking-tight text-white ring-1 ring-white/[0.1] transition-all hover:bg-white/[0.08] hover:ring-green-500/40"
              >
                {t("about.missionCta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative border-y border-white/[0.06] bg-gradient-to-b from-transparent via-white/[0.02] to-transparent py-20">
        <div className="relative mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-400">
              {t("about.statsBadge")}
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {t("about.statsTitle")}
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition-all hover:border-green-500/30 hover:bg-green-500/[0.04]"
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 h-[120px] w-[120px] rounded-full bg-green-500/[0.06] blur-[60px] transition-all group-hover:bg-green-500/[0.12]" />
                  <div className="relative">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/15 ring-1 ring-green-500/30">
                      <Icon className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="text-4xl font-extrabold tracking-tight text-white">
                      {stat.value}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">
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
      <section className="relative py-20 md:py-24">
        <div className="relative mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 max-w-2xl text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-400">
              {t("about.valuesBadge")}
            </span>
            <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
              {t("about.valuesTitle")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-400 sm:text-lg">
              {t("about.valuesSubtitle")}
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 transition-all hover:border-green-500/30 hover:bg-green-500/[0.04]"
                >
                  <div className="pointer-events-none absolute -right-16 -top-16 h-[200px] w-[200px] rounded-full bg-green-500/[0.06] blur-[80px] transition-all group-hover:bg-green-500/[0.12]" />
                  <div className="relative">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/15 shadow-[0_0_20px_rgba(74,222,128,0.2)] ring-1 ring-green-500/30">
                      <Icon className="h-5 w-5 text-green-400" />
                    </div>
                    <h3 className="mb-3 text-xl font-extrabold tracking-tight text-white">
                      {v.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-400">
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
      <section className="relative border-t border-white/[0.06] py-20 md:py-24">
        <div className="relative mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 max-w-2xl text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-400">
              {t("about.teamBadge")}
            </span>
            <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
              {t("about.teamTitle")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-400 sm:text-lg">
              {t("about.teamSubtitle")}
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            {founders.map((f, i) => (
              <motion.div
                key={f.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent p-8 transition-all hover:border-green-500/30"
              >
                <div className="pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full bg-green-500/[0.06] blur-[100px] transition-all group-hover:bg-green-500/[0.14]" />

                <div className="relative">
                  {/* Avatar */}
                  <div className="mb-6 flex items-center gap-4">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/25 to-emerald-500/10 shadow-[0_0_30px_rgba(74,222,128,0.25)] ring-1 ring-green-500/30">
                      <span className="text-2xl font-extrabold text-green-400">
                        {f.initial}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-extrabold tracking-tight text-white">
                        {f.name}
                      </h3>
                      <p className="text-xs font-semibold uppercase tracking-widest text-green-400">
                        {f.role}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-400 sm:text-base">
                    {f.bio}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA BANNER
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative pb-24 pt-4">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="relative overflow-hidden rounded-3xl border border-green-500/30 bg-gradient-to-br from-[#0d2319] via-[#0a1a13] to-[#050f09] p-10 text-center shadow-2xl shadow-green-500/[0.15] sm:p-14"
          >
            {/* Ambient glow */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-[360px] w-[360px] rounded-full bg-green-500/[0.18] blur-[120px]" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-[360px] w-[360px] rounded-full bg-emerald-500/[0.14] blur-[120px]" />

            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-500/40 bg-green-500/15 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-green-300">
                <Sparkles className="h-3 w-3" />
                {t("nav.getStarted")}
              </div>
              <h2 className="mx-auto max-w-2xl text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
                {t("about.ctaTitle")}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                {t("about.ctaSubtitle")}
              </p>

              <Link
                href={`${home}#pricing`}
                className="btn-gradient mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-extrabold tracking-tight shadow-lg shadow-green-500/30 transition-all hover:shadow-green-500/50 sm:text-base"
              >
                {t("about.ctaButton")}
                <ArrowRight className="h-4 w-4" />
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
