"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useAnimation, useInView } from "motion/react";
import { Star, Quote, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "@/i18n/locale-provider";

export interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

interface TestimonialsSectionProps {
  testimonials?: Testimonial[];
}

export const TestimonialsSection = ({
  testimonials = [],
}: TestimonialsSectionProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { t } = useTranslations();

  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const controls = useAnimation();

  const prev = useCallback(() => {
    setActiveIndex((c) => (c - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  const next = useCallback(() => {
    setActiveIndex((c) => (c + 1) % testimonials.length);
  }, [testimonials.length]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  useEffect(() => {
    if (isInView) controls.start("visible");
  }, [isInView, controls]);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(next, 10000);
    return () => clearInterval(interval);
  }, [testimonials.length, next]);

  if (testimonials.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-20 md:py-28"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/[0.05] blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          initial="hidden"
          animate={controls}
          variants={containerVariants}
          className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:gap-20"
        >
          {/* Left: heading + navigation */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col justify-center"
          >
            <div className="space-y-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-400">
                <Star className="h-3.5 w-3.5 fill-green-400" />
                {t("testimonials.badge")}
              </span>

              <h2 className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
                {t("testimonials.titleA")}{" "}
                <span className="gradient-text">
                  {t("testimonials.titleHighlight")}
                </span>{" "}
                {t("testimonials.titleB")}
              </h2>

              <p className="max-w-[540px] text-base text-slate-400 md:text-lg">
                {t("testimonials.subtitle")}
              </p>

              {/* Verified buyers badge */}
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <BadgeCheck className="h-4 w-4 text-green-400" />
                <span>{t("testimonials.verified")}</span>
              </div>

              {/* Dots + arrows */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-3">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIndex(i)}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        activeIndex === i
                          ? "w-10 bg-green-500"
                          : "w-2.5 bg-white/20 hover:bg-white/40"
                      }`}
                      aria-label={`View testimonial ${i + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={prev}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:border-green-500/40 hover:bg-green-500/10 hover:text-green-400"
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={next}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:border-green-500/40 hover:bg-green-500/10 hover:text-green-400"
                    aria-label="Next testimonial"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: animated card carousel */}
          <motion.div
            variants={itemVariants}
            className="relative min-h-[340px] md:min-h-[400px]"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="absolute inset-0"
                initial={{ opacity: 0, x: 100 }}
                animate={{
                  opacity: activeIndex === index ? 1 : 0,
                  x: activeIndex === index ? 0 : 100,
                  scale: activeIndex === index ? 1 : 0.9,
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                style={{ zIndex: activeIndex === index ? 10 : 0 }}
              >
                <div className="flex h-full flex-col rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-8 shadow-xl shadow-green-500/[0.04] backdrop-blur-sm">
                  {/* Stars */}
                  <div className="mb-6 flex gap-1">
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        className="h-5 w-5 fill-green-400 text-green-400"
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <div className="relative mb-6 flex-1">
                    <Quote className="absolute -left-1 -top-1 h-8 w-8 rotate-180 text-green-500/20" />
                    <p className="relative z-10 text-lg font-medium leading-relaxed text-slate-200">
                      &ldquo;{testimonial.text}&rdquo;
                    </p>
                  </div>

                  <Separator className="my-4 bg-white/[0.08]" />

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border border-white/10">
                      <AvatarImage
                        src={testimonial.image}
                        alt={testimonial.name}
                      />
                      <AvatarFallback className="bg-green-500/20 text-green-400">
                        {testimonial.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold tracking-tight text-white">
                          {testimonial.name}
                        </h3>
                        <BadgeCheck className="h-3.5 w-3.5 text-green-400" />
                      </div>
                      <p className="text-xs text-slate-500">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Decorative corner elements */}
            <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-2xl bg-green-500/[0.04]" />
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-2xl bg-green-500/[0.04]" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
