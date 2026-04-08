"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Brain,
  LineChart,
  Trophy,
  Target,
  Zap,
  ShieldCheck,
  Rocket,
  Sparkles,
  CreditCard,
  Lock,
  ChevronDown,
  LifeBuoy,
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
    text: "Every AI betting prediction on BetsPlug is backed by thousands of historical matches, live form data, and expected-goals metrics — giving you the sharpest sports picks online.",
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
    text: "BetsPlug is a sports analytics platform — not a bookmaker. We deliver AI-driven sports predictions and data insights so you can make informed decisions, without ever placing a bet on our site.",
  },
];

type FaqItem = { q: string; a: string };
type FaqCategory = {
  id: string;
  label: string;
  icon: typeof Rocket;
  items: FaqItem[];
};

const faqCategories: FaqCategory[] = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: Rocket,
    items: [
      {
        q: "What is an AI sports prediction platform?",
        a: "An AI sports prediction platform uses machine learning models, historical data, and statistical engines (like Elo and Poisson) to forecast the most likely outcome of sporting events. BetsPlug is built as a pure analytics tool — we show you the numbers, probabilities and expected value, so you can decide which bets to place with a bookmaker of your choice.",
      },
      {
        q: "How do I get started with BetsPlug?",
        a: "Simply create a free account to unlock daily AI sports picks, browse upcoming match predictions, and explore our verified track record. No credit card required to try the platform — upgrade only when you need advanced features.",
      },
      {
        q: "Which sports does the AI predictor cover?",
        a: "Our AI sports predictor currently covers football (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Eredivisie, Champions League and more), basketball, and tennis. New leagues and sports are added regularly as our models are trained and validated.",
      },
    ],
  },
  {
    id: "predictions",
    label: "Predictions & Models",
    icon: Sparkles,
    items: [
      {
        q: "How accurate are AI sports betting predictions?",
        a: "Accuracy depends on the sport, the market and the model. Our AI betting predictions are continuously benchmarked against closing lines and logged in our public track record. You can see the exact hit-rate, ROI and confidence distribution of every model we run — no cherry-picking, no hidden losses.",
      },
      {
        q: "Which models power BetsPlug predictions?",
        a: "We combine Elo ratings, Poisson goal models, and machine-learning classifiers trained on hundreds of thousands of historical matches. Each prediction includes win probability, expected goals, confidence score, and edge over the current bookmaker line.",
      },
      {
        q: "Can I use AI for sports betting research?",
        a: "Absolutely. Thousands of data-driven bettors use BetsPlug as their research layer: compare our AI predictions against bookmaker odds, filter by confidence, backtest strategies, and identify value bets before the market corrects.",
      },
    ],
  },
  {
    id: "pricing",
    label: "Pricing & Billing",
    icon: CreditCard,
    items: [
      {
        q: "Do I need a subscription to see AI picks?",
        a: "We offer a free tier with daily AI sports picks so you can try the platform. For full access to live probabilities, strategy backtesting and the complete track record, check our subscription plans.",
      },
      {
        q: "Can I cancel my subscription anytime?",
        a: "Yes. All plans are month-to-month with no long-term commitment. You can cancel anytime from your account dashboard and keep access until the end of your current billing period.",
      },
      {
        q: "Do you offer refunds?",
        a: "We offer a 7-day money-back guarantee on all paid plans. If BetsPlug isn't right for you, contact support within your first week and we'll issue a full refund — no questions asked.",
      },
    ],
  },
  {
    id: "data-security",
    label: "Data & Security",
    icon: Lock,
    items: [
      {
        q: "Is BetsPlug a betting or gambling website?",
        a: "No. BetsPlug is a data analytics platform for sports fans, traders and researchers. We provide AI sports predictions, statistics and insights. You cannot gamble, deposit or place bets on BetsPlug — we exist to inform your decisions, not to take them.",
      },
      {
        q: "How is my data protected?",
        a: "Your data is encrypted in transit (TLS 1.3) and at rest (AES-256). We never sell or share personal information, and we process payments through PCI-compliant providers so we never store your card details on our servers.",
      },
      {
        q: "Where does your sports data come from?",
        a: "We aggregate data from licensed sports data providers, official league feeds, and public statistical sources. Every data point feeding our models is verified and timestamped for full reproducibility in our track record.",
      },
    ],
  },
];

// Flat list for Schema.org JSON-LD
const faqs: FaqItem[] = faqCategories.flatMap((c) => c.items);

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
            BetsPlug is the data-driven home for{" "}
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
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-xl hover:shadow-green-500/[0.08]"
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
          className="mt-20 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-transparent p-8 backdrop-blur-sm sm:p-12"
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
              , you&apos;ve landed in the right place. BetsPlug blends
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
              Behind every BetsPlug pick is a combination of{" "}
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
              A crucial note: BetsPlug is{" "}
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
        <FaqBlock />

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

// ─── FAQ Block (categorized accordion) ──────────────────────────────────────

function FaqBlock() {
  const [activeCategory, setActiveCategory] = useState<string>(
    faqCategories[0].id,
  );
  const [openQuestion, setOpenQuestion] = useState<string | null>(
    faqCategories[0].items[0].q,
  );

  const current = faqCategories.find((c) => c.id === activeCategory)!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true }}
      className="mt-20"
    >
      {/* Header */}
      <div className="mb-12 text-center">
        <span className="mb-4 inline-block rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-400">
          Frequently Asked Questions
        </span>
        <h3 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Got Questions?
        </h3>
        <h3 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
          <span className="gradient-text">We&apos;ve Got Answers</span>
        </h3>
        <p className="mx-auto mt-5 max-w-xl text-base text-slate-400">
          Everything you need to know about our AI sports prediction platform,
          from getting started to advanced integrations.
        </p>
      </div>

      {/* Grid: sidebar + accordion */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-transparent p-5 backdrop-blur-sm sm:p-8">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -left-20 top-0 h-[300px] w-[300px] rounded-full bg-green-500/[0.08] blur-[100px]" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-[300px] w-[300px] rounded-full bg-emerald-500/[0.06] blur-[100px]" />

        <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr] lg:gap-8">
          {/* Sidebar: categories + contact support */}
          <aside className="flex flex-col gap-3">
            <h4 className="mb-1 font-mono text-xs font-semibold uppercase tracking-widest text-white/60">
              Browse by Category
            </h4>

            {faqCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = cat.id === activeCategory;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setOpenQuestion(cat.items[0].q);
                  }}
                  className={`group relative flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-300 ${
                    isActive
                      ? "border-green-500/40 bg-gradient-to-r from-green-500/[0.12] to-green-500/[0.04] shadow-lg shadow-green-500/10"
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all ${
                      isActive
                        ? "bg-green-500/20 shadow-[0_0_20px_rgba(74,222,128,0.25)]"
                        : "bg-white/[0.05] group-hover:bg-white/[0.08]"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive ? "text-green-400" : "text-slate-400"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-semibold transition-colors ${
                        isActive ? "text-white" : "text-slate-300"
                      }`}
                    >
                      {cat.label}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {cat.items.length} articles
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 -rotate-90 transition-all ${
                      isActive ? "text-green-400" : "text-slate-600"
                    }`}
                  />
                </button>
              );
            })}

            {/* Contact Support card */}
            <div className="mt-4 rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/[0.08] to-emerald-500/[0.03] p-5 backdrop-blur-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-500/15">
                  <LifeBuoy className="h-4 w-4 text-green-400" />
                </div>
                <p className="text-sm font-bold text-white">
                  Still have questions?
                </p>
              </div>
              <p className="mb-4 text-xs leading-relaxed text-slate-400">
                Can&apos;t find the answer you&apos;re looking for? Our support
                team is here to help.
              </p>
              <Link
                href="/support"
                className="btn-gradient flex w-full items-center justify-center rounded-full px-4 py-2.5 text-xs font-bold shadow-lg shadow-green-500/20 transition-all hover:shadow-green-500/30"
              >
                Contact Support
              </Link>
            </div>
          </aside>

          {/* Accordion */}
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-3"
              >
                {current.items.map((item) => {
                  const isOpen = openQuestion === item.q;
                  return (
                    <div
                      key={item.q}
                      className={`overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                        isOpen
                          ? "border-green-500/30 bg-gradient-to-br from-green-500/[0.05] to-transparent shadow-lg shadow-green-500/[0.06]"
                          : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.03]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenQuestion(isOpen ? null : item.q)
                        }
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                        aria-expanded={isOpen}
                      >
                        <h4
                          className={`text-sm font-semibold transition-colors sm:text-base ${
                            isOpen ? "text-white" : "text-slate-200"
                          }`}
                        >
                          {item.q}
                        </h4>
                        <div
                          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border transition-all ${
                            isOpen
                              ? "rotate-180 border-green-500/40 bg-green-500/15 text-green-400"
                              : "border-white/10 bg-white/[0.03] text-slate-400"
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
                            transition={{
                              duration: 0.3,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-white/[0.06] px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
                              <p className="text-sm leading-relaxed text-slate-400">
                                {item.a}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
