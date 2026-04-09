"use client";

import { motion } from "motion/react";
import { TestimonialsColumn, type Testimonial } from "@/components/ui/testimonials-columns";
import { useTranslations } from "@/i18n/locale-provider";

const testimonials: Testimonial[] = [
  {
    text: "BetsPlug completely changed how I approach football predictions. The Elo and Poisson models give me an edge I never had before. I've tripled my hit-rate in three months.",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "Lucas van Dijk",
    role: "Semi-pro Bettor",
  },
  {
    text: "The transparency of their track record is what sold me. Every prediction is logged and verifiable — no cherry-picking like other tipster sites. I finally trust the numbers.",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "Sophie Hendriks",
    role: "Data Analyst",
  },
  {
    text: "As a data nerd, I love that BetsPlug shows the math behind every pick. Confidence scores, Elo deltas, edge percentages — it's like having a quant desk in my pocket.",
    image: "https://randomuser.me/api/portraits/men/52.jpg",
    name: "Mark Jansen",
    role: "Sports Trader",
  },
  {
    text: "I was skeptical at first, but the Bet of the Day feature alone paid for my subscription ten times over. The AI picks consistently outperform my own gut calls.",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    name: "Emma Dekker",
    role: "Casual Bettor",
  },
  {
    text: "Running my own tipping community used to take hours of research. BetsPlug gives me data-backed insights in seconds. My subscribers have never been happier.",
    image: "https://randomuser.me/api/portraits/men/23.jpg",
    name: "Daniel Kowalski",
    role: "Tipster & Content Creator",
  },
  {
    text: "The live probabilities update during matches is a game-changer. I can spot value shifts in real-time and make informed in-play decisions. Nothing else comes close.",
    image: "https://randomuser.me/api/portraits/women/17.jpg",
    name: "Isabella Rossi",
    role: "Live Bettor",
  },
  {
    text: "Strategy backtesting saved me from a losing system I was convinced worked. Turns out my edge was just variance. Now I only deploy strategies that pass backtest.",
    image: "https://randomuser.me/api/portraits/men/78.jpg",
    name: "Ahmed Malik",
    role: "Quant Bettor",
  },
  {
    text: "The Telegram tips are pure gold. Clean, concise, and the hit-rate speaks for itself. Best decision I made this season was signing up for BetsPlug.",
    image: "https://randomuser.me/api/portraits/women/29.jpg",
    name: "Chloe Dubois",
    role: "Subscriber",
  },
  {
    text: "Finally a predictions platform that treats sports betting like the science it should be. Every claim is backed by data, and the results are on the board for everyone to see.",
    image: "https://randomuser.me/api/portraits/men/41.jpg",
    name: "Thomas Bergström",
    role: "Professional Handicapper",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export const TestimonialsSection = () => {
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
