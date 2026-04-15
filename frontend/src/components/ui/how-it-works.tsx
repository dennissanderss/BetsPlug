"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Zap, Star, Eye, ArrowRight } from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { usePotdNumbers } from "@/hooks/use-potd-numbers";

export function HowItWorks() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const potd = usePotdNumbers();
  const steps = [
    {
      number: "01",
      icon: Zap,
      title: t("how.step1Title"),
      description: t("how.step1Desc"),
      gradient: "from-green-400 to-emerald-500",
      glow: "bg-green-500/20",
    },
    {
      number: "02",
      icon: Star,
      title: t("how.step2Title"),
      description: t("how.step2Desc", potd),
      gradient: "from-emerald-400 to-teal-500",
      glow: "bg-emerald-500/20",
    },
    {
      number: "03",
      icon: Eye,
      title: t("how.step3Title"),
      description: t("how.step3Desc"),
      gradient: "from-teal-400 to-cyan-500",
      glow: "bg-teal-500/20",
    },
  ];

  return (
    <section
      id="how-it-works-process"
      className="relative overflow-hidden py-20 md:py-28"
      aria-labelledby="how-it-works-heading"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mx-auto mb-14 max-w-3xl"
        >
          <span className="section-tag mb-6">[ PROCESS / HOW IT WORKS ]</span>
          <h2
            id="how-it-works-heading"
            className="text-display text-4xl text-white sm:text-5xl lg:text-6xl"
          >
            {t("how.title")}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#a3a3a3] sm:text-lg">
            {t("how.subtitle")}
          </p>
        </motion.div>

        {/* Steps — schematic with connector lines */}
        <div className="relative">
          {/* Horizontal dashed connector line (desktop) */}
          <div className="pointer-events-none absolute left-[16.6%] right-[16.6%] top-[52px] hidden h-px md:block divider-dashed" />

          <div className="grid gap-6 md:grid-cols-3 md:gap-[1px] md:bg-white/[0.08]">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="group relative scanline bg-[#0a0a0a] p-6 transition-all duration-300 hover:bg-[#101010] sm:p-8"
                >
                  {/* Corner brackets */}
                  <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-[#4ade80]" />
                  <span className="pointer-events-none absolute right-0 bottom-0 h-3 w-3 border-r-2 border-b-2 border-[#4ade80]" />

                  {/* Step number pin (on connector line) */}
                  <div className="mb-8 flex items-center gap-3">
                    <span className="flex h-[28px] w-[28px] items-center justify-center border-2 border-[#4ade80] bg-[#050505] font-mono text-[11px] font-black text-[#4ade80]">
                      {step.number}
                    </span>
                    <span className="mono-label">STEP {step.number}</span>
                  </div>

                  {/* Icon block */}
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center border border-[#4ade80]/50 bg-[#4ade80]/[0.08]">
                    <Icon className="h-5 w-5 text-[#4ade80]" strokeWidth={2.25} />
                  </div>

                  {/* Content */}
                  <h3 className="text-display text-xl text-white sm:text-2xl">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#a3a3a3]">
                    {step.description}
                  </p>

                  {/* Bottom tick indicator */}
                  <div className="mt-6 flex gap-1">
                    {[...Array(3)].map((_, j) => (
                      <div
                        key={j}
                        className={`h-[3px] transition-all duration-300 ${
                          j === i ? "w-8 bg-[#4ade80]" : "w-2 bg-white/15"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 flex justify-center">
          <Link
            href={loc("/how-it-works")}
            className="btn-outline"
          >
            {t("how.deepDive")} →
          </Link>
        </div>
      </div>
    </section>
  );
}
