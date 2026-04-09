"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { UserPlus, Search, Trophy, ArrowRight } from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

export function HowItWorks() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const steps = [
    {
      number: "01",
      icon: UserPlus,
      title: t("how.step1Title"),
      description: t("how.step1Desc"),
    },
    {
      number: "02",
      icon: Search,
      title: t("how.step2Title"),
      description: t("how.step2Desc"),
    },
    {
      number: "03",
      icon: Trophy,
      title: t("how.step3Title"),
      description: t("how.step3Desc"),
    },
  ];
  return (
    <section
      id="how-it-works-process"
      className="relative overflow-hidden py-20 md:py-28"
      aria-labelledby="how-it-works-heading"
    >
      {/* Unique background: dual radial + subtle diagonal lines */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#080b14] via-[#0b1220] to-[#080b14]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(74,222,128,0.6) 0 1px, transparent 1px 22px)",
        }}
      />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-green-500/[0.06] blur-[130px]" />
        <div className="absolute right-1/4 bottom-10 h-[380px] w-[380px] translate-x-1/2 rounded-full bg-emerald-500/[0.05] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-400">
            {t("how.badge")}
          </span>
          <h2
            id="how-it-works-heading"
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
          >
            <span className="gradient-text">{t("how.title")}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            {t("how.subtitle")}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical connecting line (desktop: horizontal, mobile: vertical) */}
          <div
            className="pointer-events-none absolute left-8 top-10 bottom-10 w-px bg-gradient-to-b from-transparent via-green-500/30 to-transparent md:left-0 md:right-0 md:top-10 md:bottom-auto md:h-px md:w-auto md:bg-gradient-to-r"
            aria-hidden="true"
          />

          <div className="grid gap-8 md:grid-cols-3 md:gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.7,
                    delay: i * 0.15,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  viewport={{ once: true }}
                  className="group relative"
                >
                  {/* Numbered circle */}
                  <div className="relative mb-6 flex md:justify-center">
                    <div className="relative">
                      {/* Outer glow */}
                      <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl transition-all duration-500 group-hover:bg-green-500/30" />
                      {/* Circle */}
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-green-500/40 bg-gradient-to-br from-green-500/20 to-emerald-500/10 shadow-[0_0_30px_rgba(74,222,128,0.2)] backdrop-blur-sm transition-all duration-500 group-hover:scale-110 group-hover:border-green-500/60 group-hover:shadow-[0_0_40px_rgba(74,222,128,0.35)]">
                        <Icon className="h-6 w-6 text-green-400 transition-transform duration-500 group-hover:rotate-[-8deg]" />
                      </div>
                      {/* Step number badge */}
                      <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-green-500/40 bg-[#0a1018] font-mono text-xs font-bold text-green-400 shadow-lg">
                        {step.number}
                      </div>
                    </div>
                  </div>

                  {/* Card content */}
                  <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 backdrop-blur-sm transition-all duration-300 group-hover:border-green-500/30 group-hover:shadow-xl group-hover:shadow-green-500/[0.08] md:text-center">
                    <h3 className="mb-3 text-xl font-bold text-white">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-400">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Deep-dive CTA — links to the full dedicated page */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-14 flex justify-center"
        >
          <Link
            href={loc("/how-it-works")}
            className="group inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/[0.06] px-6 py-3 text-sm font-bold text-green-300 backdrop-blur-sm transition-all hover:border-green-500/50 hover:bg-green-500/[0.12] hover:text-green-200"
          >
            {t("how.deepDive")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
