"use client";

/**
 * FaqSection — NOCTURNE styled FAQ accordion.
 * ────────────────────────────────────────────────────────────
 * Renders an accessible, collapsible FAQ block with Schema.org
 * JSON-LD for Google rich results. Used site-wide via `faqSlot`
 * on about, track-record, match-predictions, how-it-works etc.
 *
 * Design matches the homepage SeoSection FAQ: card-neon wrapper,
 * glass-panel-lifted items that turn card-neon-green when open,
 * rounded chevron indicator.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Sparkles } from "lucide-react";
import { FaqJsonLd, type FaqItem } from "./json-ld";
import { HexBadge } from "@/components/noct/hex-badge";

interface FaqSectionProps {
  title?: string;
  subtitle?: string;
  items: FaqItem[];
  className?: string;
}

export function FaqSection({
  title = "Frequently Asked Questions",
  subtitle,
  items,
  className = "",
}: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className={`relative py-16 md:py-20 ${className}`}>
      <FaqJsonLd items={items} />

      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full"
        style={{ background: "hsl(var(--accent-green) / 0.06)", filter: "blur(160px)" }}
      />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center text-center">
          <span className="section-label mb-4">
            <Sparkles className="h-3 w-3" />
            FAQ
          </span>
          <h2 className="text-heading text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-3 max-w-xl text-base text-[#a3a9b8]">{subtitle}</p>
          )}
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {items.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`overflow-hidden transition-all duration-200 ${
                  isOpen
                    ? "card-neon card-neon-green"
                    : "glass-panel-lifted"
                }`}
              >
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span
                      className={`text-base font-semibold transition-colors sm:text-lg ${
                        isOpen ? "text-[#ededed]" : "text-[#a3a9b8]"
                      }`}
                    >
                      {faq.question}
                    </span>
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all ${
                        isOpen
                          ? "rotate-180 bg-[#4ade80]/15 text-[#4ade80]"
                          : "bg-white/[0.05] text-[#6b7280]"
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div
                          className="border-t px-6 pb-6 pt-4 text-sm leading-relaxed text-[#a3a9b8] sm:text-base"
                          style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
                        >
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
