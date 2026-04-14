"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Zap, Star, Eye, ArrowRight } from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

export function HowItWorks() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
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
      description: t("how.step2Desc"),
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
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-[#0f1420] to-background" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(34,197,94,0.15) 0 1px, transparent 1px 22px)",
        }}
      />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-green-200/30 blur-[130px]" />
        <div className="absolute right-1/4 bottom-10 h-[380px] w-[380px] translate-x-1/2 rounded-full bg-teal-200/20 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-green-300 bg-green-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-600">
            {t("how.badge")}
          </span>
          <h2
            id="how-it-works-heading"
            className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl"
          >
            <span className="gradient-text">{t("how.title")}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg">
            {t("how.subtitle")}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="group relative"
                style={{ transform: i === 1 ? "translateY(-8px)" : undefined }}
              >
                  {/* Card */}
                  <div className="relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-500 hover:border-green-500/30 hover:shadow-[0_8px_40px_rgba(34,197,94,0.1)] sm:p-8">
                    {/* Top gradient accent line */}
                    <div
                      className={`absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r ${step.gradient} opacity-40 transition-opacity duration-500 group-hover:opacity-100`}
                    />

                    {/* Corner glow on hover */}
                    <div
                      className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ${step.glow} opacity-0 blur-[60px] transition-opacity duration-500 group-hover:opacity-100`}
                    />

                    {/* Step number — large watermark */}
                    <span className="pointer-events-none absolute right-5 top-4 font-mono text-6xl font-black text-white/[0.06] transition-colors duration-500 group-hover:text-green-400/25 sm:text-7xl">
                      {step.number}
                    </span>

                    {/* Icon */}
                    <div className="relative mb-5">
                      <div className="relative inline-flex">
                        <div
                          className={`absolute inset-0 rounded-xl ${step.glow} blur-lg transition-all duration-500 group-hover:blur-xl group-hover:scale-125`}
                        />
                        <div
                          className={`relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${step.gradient} shadow-lg transition-transform duration-500 group-hover:scale-110`}
                        >
                          <Icon className="h-5 w-5 text-[#0a1018]" strokeWidth={2.5} />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="relative mb-3 text-lg font-bold text-slate-900 sm:text-xl">
                      {step.title}
                    </h3>
                    <p className="relative text-sm leading-relaxed text-slate-500">
                      {step.description}
                    </p>

                    {/* Bottom decorative dots */}
                    <div className="mt-6 flex gap-1.5">
                      {[...Array(3)].map((_, j) => (
                        <div
                          key={j}
                          className={`h-1 rounded-full transition-all duration-500 ${
                            j === i
                              ? `w-6 bg-gradient-to-r ${step.gradient}`
                              : "w-1 bg-white/10 group-hover:bg-white/20"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-14 flex justify-center">
          <Link
            href={loc("/how-it-works")}
            className="group inline-flex items-center gap-2 rounded-full border border-green-300 bg-green-50 px-6 py-3 text-sm font-bold text-green-700 backdrop-blur-sm transition-all hover:border-green-400 hover:bg-green-100 hover:text-green-800"
          >
            {t("how.deepDive")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
