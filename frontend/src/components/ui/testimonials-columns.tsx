"use client";

import React from "react";
import { motion } from "motion/react";
import { Star } from "lucide-react";

export interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

interface TestimonialsColumnProps {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}

export const TestimonialsColumn = ({
  className,
  testimonials,
  duration = 10,
}: TestimonialsColumnProps) => {
  return (
    <div className={className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[...Array(2)].map((_, index) => (
          <React.Fragment key={index}>
            {testimonials.map(({ text, image, name, role }, i) => (
              <div
                key={i}
                className="group relative w-full max-w-xs rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-8 shadow-xl shadow-green-500/[0.04] backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-green-500/[0.15]"
              >
                {/* Stars */}
                <div className="mb-4 flex gap-0.5">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className="h-3.5 w-3.5 fill-green-400 text-green-400"
                    />
                  ))}
                </div>

                {/* Text */}
                <p className="text-sm leading-relaxed text-slate-300">
                  &ldquo;{text}&rdquo;
                </p>

                {/* Author */}
                <div className="mt-6 flex items-center gap-3">
                  <img
                    width={40}
                    height={40}
                    src={image}
                    alt={name}
                    className="h-10 w-10 rounded-full border border-white/10 object-cover"
                  />
                  <div className="flex flex-col">
                    <div className="text-sm font-semibold leading-5 tracking-tight text-white">
                      {name}
                    </div>
                    <div className="text-xs leading-5 tracking-tight text-slate-500">
                      {role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};
