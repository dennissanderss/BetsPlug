"use client";

import { motion } from "motion/react";
import { TestimonialsColumn, type Testimonial } from "@/components/ui/testimonials-columns";
import { useTranslations } from "@/i18n/locale-provider";

interface TestimonialsSectionProps {
  testimonials?: Testimonial[];
}

export const TestimonialsSection = ({ testimonials = [] }: TestimonialsSectionProps) => {
  const firstColumn = testimonials.slice(0, 3);
  const secondColumn = testimonials.slice(3, 6);
  const thirdColumn = testimonials.slice(6, 9);
  const { t } = useTranslations();
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/[0.05] blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mx-auto flex max-w-2xl flex-col items-center justify-center text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-400">
            {t("testimonials.badge")}
          </span>

          <h2 className="text-balance break-words text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            {t("testimonials.titleA")}{" "}
            <span className="gradient-text">{t("testimonials.titleHighlight")}</span>{" "}
            {t("testimonials.titleB")}
          </h2>
          <p className="mt-5 text-base text-slate-400">
            {t("testimonials.subtitle")}
          </p>
        </motion.div>

        {/* Columns */}
        <div className="mt-14 flex max-h-[740px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
          <TestimonialsColumn testimonials={firstColumn} duration={18} />
          <TestimonialsColumn
            testimonials={secondColumn}
            className="hidden md:block"
            duration={22}
          />
          <TestimonialsColumn
            testimonials={thirdColumn}
            className="hidden lg:block"
            duration={20}
          />
        </div>
      </div>
    </section>
  );
};
