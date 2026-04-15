"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useAnimation, useInView } from "motion/react";
import { Star, Quote, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";
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

const CARD_VARIANTS = ["card-neon-purple", "card-neon-green", "card-neon-blue"] as const;

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
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-[20%] h-[480px] w-[480px] rounded-full bg-[#a855f7]/[0.08] blur-[140px]" />
        <div className="absolute right-[5%] bottom-[10%] h-[520px] w-[520px] rounded-full bg-[#4ade80]/[0.06] blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
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
              <div className="flex items-center gap-3">
                <HexBadge variant="purple" size="sm">
                  <Star className="h-4 w-4" />
                </HexBadge>
                <span className="section-label">
                  <Star className="h-3 w-3" />
                  {t("testimonials.badge")}
                </span>
              </div>

              <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
                {t("testimonials.titleA")}{" "}
                <span className="gradient-text-green">
                  {t("testimonials.titleHighlight")}
                </span>{" "}
                {t("testimonials.titleB")}
              </h2>

              <p className="mt-4 max-w-xl text-base text-[#a3a9b8]">
                {t("testimonials.subtitle")}
              </p>

              {/* Verified pill */}
              <div>
                <Pill tone="active" className="gap-1.5">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {t("testimonials.verified")}
                </Pill>
              </div>

              {/* Dots + arrows */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIndex(i)}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        activeIndex === i
                          ? "w-10 bg-[#4ade80] shadow-[0_0_12px_rgba(74,222,128,0.6)]"
                          : "w-2.5 bg-white/15 hover:bg-white/25"
                      }`}
                      aria-label={`View testimonial ${i + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={prev}
                    className="btn-glass flex h-10 w-10 items-center justify-center rounded-xl p-0"
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={next}
                    className="btn-glass flex h-10 w-10 items-center justify-center rounded-xl p-0"
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
            className="relative min-h-[380px] md:min-h-[440px]"
          >
            {/* Subtle halo blob behind cards */}
            <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-[#a855f7]/[0.05] blur-2xl" />

            {testimonials.map((testimonial, index) => {
              const variantClass = CARD_VARIANTS[index % CARD_VARIANTS.length];
              return (
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
                  <div className={`card-neon ${variantClass} h-full`}>
                    <div className="relative flex h-full flex-col p-8">
                      {/* Decorative Quote icon */}
                      <Quote
                        className="pointer-events-none absolute left-6 top-6 h-10 w-10 rotate-180 text-[#a855f7]/30"
                        aria-hidden="true"
                      />

                      {/* Stars */}
                      <div className="mb-6 flex gap-1">
                        {[...Array(5)].map((_, j) => (
                          <Star
                            key={j}
                            className="h-5 w-5 fill-current text-[#4ade80]"
                          />
                        ))}
                      </div>

                      {/* Quote */}
                      <div className="relative mb-6 flex-1">
                        <p className="relative z-10 text-lg font-medium leading-relaxed text-[#ededed]">
                          &ldquo;{testimonial.text}&rdquo;
                        </p>
                      </div>

                      {/* Divider */}
                      <div
                        className="my-4 h-px w-full"
                        style={{ background: "hsl(0 0% 100% / 0.06)" }}
                      />

                      {/* Author */}
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border border-white/10">
                          <AvatarImage
                            src={testimonial.image}
                            alt={testimonial.name}
                          />
                          <AvatarFallback className="bg-white/5 text-[#4ade80]">
                            {testimonial.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-semibold tracking-tight text-[#ededed]">
                              {testimonial.name}
                            </h3>
                            <BadgeCheck className="h-3.5 w-3.5 text-[#4ade80]" />
                          </div>
                          <p className="text-xs text-[#a3a9b8]">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
