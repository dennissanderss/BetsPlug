"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Brain,
  LineChart,
  Trophy,
  Target,
  Zap,
  ShieldCheck,
} from "lucide-react";

const pillars = [
  {
    icon: Brain,
    title: "AI Sports Prediction Engine",
    text: "Our AI sports prediction engine combines Elo ratings, Poisson goal models, and machine learning to forecast match outcomes across football, basketball, and tennis with data-driven accuracy.",
  },
  {
    icon: LineChart,
    title: "Data-Backed Betting Predictions",
    text: "Every AI betting prediction on Betsplug is backed by thousands of historical matches, live form data, and expected-goals metrics — giving you the sharpest sports picks online.",
  },
  {
    icon: Trophy,
    title: "Verified Track Record",
    text: "Transparency first. Explore our public track record to see every AI sports pick we've ever published, with full ROI, hit-rate and confidence scores logged and timestamped.",
  },
  {
    icon: Target,
    title: "Bet of the Day",
    text: "Short on time? Our daily AI-powered Bet of the Day highlights the single highest-confidence value pick across all leagues — hand-picked by our algorithm, not by feeling.",
  },
  {
    icon: Zap,
    title: "Live AI Probabilities",
    text: "Watch probabilities shift in real-time as matches unfold. Our live AI sports predictor recalculates win probabilities every second so you can spot value the moment it appears.",
  },
  {
    icon: ShieldCheck,
    title: "Analytics, Not Gambling",
    text: "Betsplug is a sports analytics platform — not a bookmaker. We deliver AI-driven sports predictions and data insights so you can make informed decisions, without ever placing a bet on our site.",
  },
];

const faqs = [
  {
    q: "What is an AI sports prediction platform?",
    a: "An AI sports prediction platform uses machine learning models, historical data, and statistical engines (like Elo and Poisson) to forecast the most likely outcome of sporting events. Betsplug is built as a pure analytics tool — we show you the numbers, probabilities and expected value, so you can decide which bets to place with a bookmaker of your choice.",
  },
  {
    q: "How accurate are AI sports betting predictions?",
    a: "Accuracy depends on the sport, the market and the model. Our AI betting predictions are continuously benchmarked against closing lines and logged in our public track record. You can see the exact hit-rate, ROI and confidence distribution of every model we run — no cherry-picking, no hidden losses.",
  },
  {
    q: "Is Betsplug a betting or gambling website?",
    a: "No. Betsplug is a data analytics platform for sports fans, traders and researchers. We provide AI sports predictions, statistics and insights. You cannot gamble, deposit or place bets on Betsplug — we exist to inform your decisions, not to take them.",
  },
  {
    q: "Can I use AI for sports betting research?",
    a: "Absolutely. Thousands of data-driven bettors use Betsplug as their research layer: compare our AI predictions against bookmaker odds, filter by confidence, backtest strategies, and identify value bets before the market corrects.",
  },
  {
    q: "Which sports does the AI predictor cover?",
    a: "Our AI sports predictor currently covers football (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Eredivisie, Champions League and more), basketball, and tennis. New leagues and sports are added regularly as our models are trained and validated.",
  },
  {
    q: "Do I need a subscription to see AI picks?",
    a: "We offer a free tier with daily AI sports picks so you can try the platform. For full access to live probabilities, strategy backtesting and the complete track record, check our subscription plans.",
  },
];

export function SeoSection() {
  return (
    <section
      className="relative overflow-hidden py-20 md:py-28"
      aria-labelledby="seo-heading"
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-green-500/[0.05] blur-[140px]" />
        <div className="absolute right-1/4 bottom-1/3 h-[400px] w-[600px] translate-x-1/2 rounded-full bg-emerald-500/[0.04] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-400">
            The Smart Way to Research Bets
          </span>
          <h2
            id="seo-heading"
            className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl"
          >
            AI Sports Predictions &{" "}
            <span className="gradient-text">Data-Driven Betting Picks</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-400 sm:text-lg">
            Betsplug is the data-driven home for{" "}
            <strong className="text-slate-200">AI sports predictions</strong>,
            machine-learning betting picks and statistical match forecasts.
            Whether you&apos;re researching your next football accumulator,
            hunting value in NBA player props, or backtesting a new strategy —
            our AI sports predictor gives you the edge you need to beat the
            closing line.
          </p>
        </motion.div>

        {/* Pillars grid */}
        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.article
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-xl hover:shadow-green-500/[0.08]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/15 shadow-[0_0_20px_rgba(74,222,128,0.15)] transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">{p.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  {p.text}
                </p>
              </motion.article>
            );
          })}
        </div>

        {/* Long-form content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mt-20 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-transparent p-8 backdrop-blur-sm sm:p-12"
        >
          <div className="prose prose-invert max-w-none">
            <h3 className="text-2xl font-extrabold text-white sm:text-3xl">
              The Best AI Sports Prediction Website for Data-Driven Bettors
            </h3>
            <p className="mt-4 text-base leading-relaxed text-slate-400">
              If you&apos;ve been searching for the{" "}
              <strong className="text-slate-200">
                best sports prediction website
              </strong>
              , you&apos;ve landed in the right place. Betsplug blends
              artificial intelligence, machine learning and decades of
              statistical modeling into a single platform that tells you which
              bets carry real value — and which ones are traps set by the
              bookmakers. Our AI sports betting predictions are transparent,
              mathematically grounded and updated live, so you can stop
              guessing and start researching like a professional.
            </p>

            <h4 className="mt-8 text-xl font-bold text-white">
              AI Betting Predictions Powered by Real Math
            </h4>
            <p className="mt-3 text-base leading-relaxed text-slate-400">
              Behind every Betsplug pick is a combination of{" "}
              <strong className="text-slate-200">Elo ratings</strong>,{" "}
              <strong className="text-slate-200">Poisson goal models</strong>{" "}
              and{" "}
              <strong className="text-slate-200">
                machine-learning classifiers
              </strong>{" "}
              trained on hundreds of thousands of historical matches. The
              result: AI betting predictions that quantify win probability,
              draw probability, expected goals and edge over the bookmaker line
              — all in a single dashboard. Dive into our{" "}
              <Link
                href="/predictions"
                className="font-semibold text-green-400 underline decoration-green-500/30 underline-offset-4 transition-colors hover:text-green-300"
              >
                AI predictions hub
              </Link>{" "}
              to see every upcoming match our models have processed.
            </p>

            <h4 className="mt-8 text-xl font-bold text-white">
              Free AI Sports Picks, Live Probabilities &amp; Bet of the Day
            </h4>
            <p className="mt-3 text-base leading-relaxed text-slate-400">
              Looking for{" "}
              <strong className="text-slate-200">free AI sports picks</strong>?
              Every day we publish a highest-confidence{" "}
              <Link
                href="/bet-of-the-day"
                className="font-semibold text-green-400 underline decoration-green-500/30 underline-offset-4 transition-colors hover:text-green-300"
              >
                Bet of the Day
              </Link>{" "}
              — a single curated AI pick our algorithm rates as the best value
              bet across all monitored leagues. Want to go deeper? Our{" "}
              <Link
                href="/live"
                className="font-semibold text-green-400 underline decoration-green-500/30 underline-offset-4 transition-colors hover:text-green-300"
              >
                live match tracker
              </Link>{" "}
              shows real-time AI probabilities as they shift during a game,
              perfect for spotting in-play value seconds before the market
              adjusts.
            </p>

            <h4 className="mt-8 text-xl font-bold text-white">
              Transparent Track Record — Verify Every AI Pick
            </h4>
            <p className="mt-3 text-base leading-relaxed text-slate-400">
              Most sports prediction websites hide their losses. We don&apos;t.
              Every AI sports pick, every Bet of the Day, every confidence
              score is logged publicly in our{" "}
              <Link
                href="/trackrecord"
                className="font-semibold text-green-400 underline decoration-green-500/30 underline-offset-4 transition-colors hover:text-green-300"
              >
                verified track record
              </Link>
              . You can filter by league, market, confidence tier and date
              range to see exactly how the models have performed — no edits,
              no deletions, no cherry-picking.
            </p>

            <h4 className="mt-8 text-xl font-bold text-white">
              Data Insights, Not Gambling Advice
            </h4>
            <p className="mt-3 text-base leading-relaxed text-slate-400">
              A crucial note: Betsplug is{" "}
              <strong className="text-slate-200">
                not a bookmaker and not a gambling site
              </strong>
              . We do not accept wagers, handle money, or promote irresponsible
              play. We&apos;re a pure{" "}
              <strong className="text-slate-200">
                sports analytics and AI prediction platform
              </strong>{" "}
              — think of us as the quant desk you can rent by the month. Our
              job is to give you the data, probabilities and machine-learning
              outputs; the decision to place a bet (and with whom) is entirely
              yours. Learn more{" "}
              <Link
                href="/about"
                className="font-semibold text-green-400 underline decoration-green-500/30 underline-offset-4 transition-colors hover:text-green-300"
              >
                about our mission
              </Link>{" "}
              or browse{" "}
              <Link
                href="/subscriptions"
                className="font-semibold text-green-400 underline decoration-green-500/30 underline-offset-4 transition-colors hover:text-green-300"
              >
                pricing plans
              </Link>{" "}
              to unlock the full AI sports predictor.
            </p>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="mb-10 text-center">
            <span className="mb-4 inline-block rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-400">
              FAQ
            </span>
            <h3 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Frequently Asked Questions About{" "}
              <span className="gradient-text">AI Sports Predictions</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {faqs.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                viewport={{ once: true }}
                className="group rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-transparent p-6 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30"
              >
                <h4 className="mb-3 text-base font-bold text-white">
                  {faq.q}
                </h4>
                <p className="text-sm leading-relaxed text-slate-400">
                  {faq.a}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Final internal-link CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mt-16 flex flex-wrap items-center justify-center gap-3 text-sm"
        >
          {[
            { href: "/predictions", label: "AI Predictions" },
            { href: "/bet-of-the-day", label: "Bet of the Day" },
            { href: "/live", label: "Live Probabilities" },
            { href: "/trackrecord", label: "Track Record" },
            { href: "/subscriptions", label: "Pricing" },
            { href: "/deals", label: "Exclusive Deals" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-slate-400 backdrop-blur-sm transition-all hover:border-green-500/40 hover:bg-green-500/[0.06] hover:text-green-400"
            >
              {link.label}
            </Link>
          ))}
        </motion.div>
      </div>

      {/* FAQ Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: f.a,
              },
            })),
          }),
        }}
      />
    </section>
  );
}
