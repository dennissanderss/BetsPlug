"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Rocket,
  Sparkles,
  CreditCard,
  Lock,
  ChevronDown,
  LifeBuoy,
} from "lucide-react";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";

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
        q: "What is an AI football prediction platform?",
        a: "An AI football prediction platform uses machine learning models, historical data, and statistical engines (like Elo and Poisson) to forecast the most likely outcome of football matches. BetsPlug is built as a pure analytics tool - we show you the numbers, probabilities and expected value, so you can decide which bets to place with a bookmaker of your choice.",
      },
      {
        q: "How do I get started with BetsPlug?",
        a: "Start with our Bronze plan - a symbolic €0.01 trial that unlocks 7 days of full Gold-level access: daily AI football picks, upcoming match predictions, our verified track record and every model output. We charge one cent through Stripe so we can verify the card is real (this is how we keep the platform fraud-free). Upgrade to Silver, Gold or Platinum when you're ready.",
      },
      {
        q: "Which football leagues does the AI predictor cover?",
        a: "Our AI predictor is focused exclusively on football, covering the Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Eredivisie, Champions League and more. New football leagues are added regularly as our models are trained and validated.",
      },
    ],
  },
  {
    id: "predictions",
    label: "Predictions & Models",
    icon: Sparkles,
    items: [
      {
        q: "How accurate are AI football betting predictions?",
        a: "Accuracy depends on the league, the market and the model. Our AI betting predictions are continuously benchmarked against closing lines and logged in our public track record. You can see the exact hit-rate, ROI and confidence distribution of every model we run - no cherry-picking, no hidden losses.",
      },
      {
        q: "Which models power BetsPlug predictions?",
        a: "We combine Elo ratings, Poisson goal models, and machine-learning classifiers trained on hundreds of thousands of historical matches. Each prediction includes win probability, expected goals, confidence score, and edge over the current bookmaker line.",
      },
      {
        q: "Can I use AI for football betting research?",
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
        a: "We offer a free tier with daily AI football picks so you can try the platform. For full access to live probabilities, strategy backtesting and the complete track record, check our subscription plans.",
      },
      {
        q: "Can I cancel my subscription anytime?",
        a: "Yes. All plans are month-to-month with no long-term commitment. You can cancel anytime from your account dashboard and keep access until the end of your current billing period.",
      },
      {
        q: "Do you offer refunds?",
        a: "We offer a 14-day money-back guarantee on all paid plans under EU consumer law. If BetsPlug isn't right for you, contact support within the first 14 days and we'll issue a full refund - no questions asked. Platinum Lifetime is final-sale after the 14-day window.",
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
        a: "No. BetsPlug is a data analytics platform for football fans, traders and researchers. We provide AI football predictions, statistics and insights. You cannot gamble, deposit or place bets on BetsPlug - we exist to inform your decisions, not to take them.",
      },
      {
        q: "How is my data protected?",
        a: "Your data is encrypted in transit (TLS 1.3) and at rest (AES-256). We never sell or share personal information, and we process payments through PCI-compliant providers so we never store your card details on our servers.",
      },
      {
        q: "Where does your football data come from?",
        a: "We aggregate data from licensed football data providers, official league feeds, and public statistical sources. Every data point feeding our models is verified and timestamped for full reproducibility in our track record.",
      },
    ],
  },
];

// Flat list for Schema.org JSON-LD
const faqs: FaqItem[] = faqCategories.flatMap((c) => c.items);

export function SeoSection() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const pricingHref = `${loc("/")}#pricing`;
  return (
    <section
      className="relative overflow-hidden bg-[#0b0f1a] py-20 md:py-28"
      aria-labelledby="seo-heading"
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-green-200/20 blur-[140px]" />
        <div className="absolute right-1/4 bottom-1/3 h-[400px] w-[600px] translate-x-1/2 rounded-full bg-green-200/20 blur-[120px]" />
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
          <span className="mb-4 inline-block rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-700">
            {t("seo.badge")}
          </span>
          <h2
            id="seo-heading"
            className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl"
          >
            {t("seo.titleA")}{" "}
            <span className="gradient-text">{t("seo.titleB")}</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-500 sm:text-lg">
            {t("seo.subtitle")}
          </p>
        </motion.div>

        {/* Long-form content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mt-20 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12"
        >
          <div className="prose max-w-none">
            <h3 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              The Best AI Football Prediction Website for Data-Driven Bettors
            </h3>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              If you&apos;ve been searching for the{" "}
              <strong className="text-slate-900">
                best football prediction website
              </strong>
              , you&apos;ve landed in the right place. BetsPlug blends
              artificial intelligence, machine learning and decades of
              statistical modeling into a single platform that tells you which
              bets carry real value - and which ones are traps set by the
              bookmakers. Our AI football betting predictions are transparent,
              mathematically grounded and updated live, so you can stop
              guessing and start researching like a professional.
            </p>

            <h4 className="mt-8 text-xl font-bold text-slate-900">
              AI Betting Predictions Powered by Real Math
            </h4>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Behind every BetsPlug pick is a combination of{" "}
              <strong className="text-slate-900">Elo ratings</strong>,{" "}
              <strong className="text-slate-900">Poisson goal models</strong>{" "}
              and{" "}
              <strong className="text-slate-900">
                machine-learning classifiers
              </strong>{" "}
              trained on hundreds of thousands of historical matches. The
              result: AI betting predictions that quantify win probability,
              draw probability, expected goals and edge over the bookmaker line
 - all in a single dashboard. Dive into our{" "}
              <Link
                href="/predictions"
                className="font-semibold text-green-600 underline decoration-green-300 underline-offset-4 transition-colors hover:text-green-700"
              >
                AI predictions hub
              </Link>{" "}
              to see every upcoming match our models have processed.
            </p>

            <h4 className="mt-8 text-xl font-bold text-slate-900">
              Free AI Football Picks, Live Probabilities &amp; Pick of the Day
            </h4>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Looking for{" "}
              <strong className="text-slate-900">free AI football picks</strong>?
              Every day we publish a highest-confidence{" "}
              <Link
                href="/bet-of-the-day"
                className="font-semibold text-green-600 underline decoration-green-300 underline-offset-4 transition-colors hover:text-green-700"
              >
                Pick of the Day
              </Link>{" "}
 - a single curated AI pick our algorithm rates as the best value
              across all monitored leagues. Want to go deeper? Our{" "}
              <Link
                href="/live"
                className="font-semibold text-green-600 underline decoration-green-300 underline-offset-4 transition-colors hover:text-green-700"
              >
                live match tracker
              </Link>{" "}
              shows real-time AI probabilities as they shift during a game,
              perfect for spotting in-play value seconds before the market
              adjusts.
            </p>

            <h4 className="mt-8 text-xl font-bold text-slate-900">
              Transparent Track Record - Verify Every AI Pick
            </h4>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Most football prediction websites hide their losses. We don&apos;t.
              Every AI football pick, every Pick of the Day, every confidence
              score is logged publicly in our{" "}
              <Link
                href="/trackrecord"
                className="font-semibold text-green-600 underline decoration-green-300 underline-offset-4 transition-colors hover:text-green-700"
              >
                verified track record
              </Link>
              . You can filter by league, market, confidence tier and date
              range to see exactly how the models have performed - no edits,
              no deletions, no cherry-picking.
            </p>

            <h4 className="mt-8 text-xl font-bold text-slate-900">
              Data Insights, Not Gambling Advice
            </h4>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              A crucial note: BetsPlug is{" "}
              <strong className="text-slate-900">
                not a bookmaker and not a gambling site
              </strong>
              . We do not accept wagers, handle money, or promote irresponsible
              play. We&apos;re a pure{" "}
              <strong className="text-slate-900">
                football analytics and AI prediction platform
              </strong>{" "}
 - think of us as the quant desk you can rent by the month. Our
              job is to give you the data, probabilities and machine-learning
              outputs; the decision to place a bet (and with whom) is entirely
              yours. Learn more{" "}
              <Link
                href="/about"
                className="font-semibold text-green-600 underline decoration-green-300 underline-offset-4 transition-colors hover:text-green-700"
              >
                about our mission
              </Link>{" "}
              or browse{" "}
              <Link
                href={pricingHref}
                className="font-semibold text-green-600 underline decoration-green-300 underline-offset-4 transition-colors hover:text-green-700"
              >
                pricing plans
              </Link>{" "}
              to unlock the full AI football predictor.
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
            { href: "/bet-of-the-day", label: "Pick of the Day" },
            { href: "/live", label: "Live Probabilities" },
            { href: "/trackrecord", label: "Track Record" },
            { href: pricingHref, label: "Pricing" },
            { href: "/deals", label: "Exclusive Deals" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-600 transition-all hover:border-green-300 hover:bg-green-50 hover:text-green-700"
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
  const { t } = useTranslations();
  const loc = useLocalizedHref();
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
      <div className="mb-12 flex flex-col items-center text-center">
        <span className="section-label">{t("faq.badge")}</span>
        <h3 className="text-display text-3xl text-white sm:text-4xl lg:text-5xl">
          {t("faq.titleA")} <span className="text-[#4ade80]">{t("faq.titleB")}</span>
        </h3>
        <p className="mx-auto mt-5 max-w-xl text-base text-[#a3a3a3]">
          {t("faq.subtitle")}
        </p>
      </div>

      {/* Grid: sidebar + accordion */}
      <div className="relative overflow-hidden border border-white/10 bg-[#0a0a0a] p-5 sm:p-8">
        <span className="pointer-events-none absolute left-[-1px] top-[-1px] h-3 w-3 border-l-2 border-t-2 border-[#4ade80]" />
        <span className="pointer-events-none absolute right-[-1px] bottom-[-1px] h-3 w-3 border-r-2 border-b-2 border-[#4ade80]" />

        <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr] lg:gap-8">
          {/* Sidebar: categories + contact support */}
          <aside className="flex flex-col gap-2">
            <h4 className="mb-2 mono-label">
              {t("faq.browseBy")}
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
                  className={`group relative flex items-center gap-3 border-l-2 px-4 py-3.5 text-left transition-all duration-200 ${
                    isActive
                      ? "border-l-[#4ade80] bg-[#4ade80]/[0.08]"
                      : "border-l-transparent bg-[#181818] hover:bg-[#1f1f1f]"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center border transition-all ${
                      isActive
                        ? "border-[#4ade80]/50 bg-[#4ade80]/[0.1]"
                        : "border-white/10 bg-[#0a0a0a]"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive ? "text-[#4ade80]" : "text-[#a3a3a3]"
                      }`}
                      strokeWidth={2}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-bold transition-colors ${
                        isActive ? "text-white" : "text-[#ededed]"
                      }`}
                    >
                      {cat.label}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[#707070]">
                      {cat.items.length} {t("faq.articles")}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 -rotate-90 transition-all ${
                      isActive ? "text-[#4ade80]" : "text-[#707070]"
                    }`}
                  />
                </button>
              );
            })}

            {/* Contact Support card */}
            <div className="relative mt-4 border border-[#4ade80]/30 bg-[#4ade80]/[0.05] p-5">
              <span className="pointer-events-none absolute left-[-1px] top-[-1px] h-3 w-3 border-l-2 border-t-2 border-[#4ade80]" />
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center border border-[#4ade80]/50 bg-[#4ade80]/[0.1]">
                  <LifeBuoy className="h-4 w-4 text-[#4ade80]" strokeWidth={2} />
                </div>
                <p className="text-sm font-bold text-white">
                  {t("faq.stillQuestions")}
                </p>
              </div>
              <p className="mb-4 text-xs leading-relaxed text-[#a3a3a3]">
                {t("faq.supportBlurb")}
              </p>
              <Link href={loc("/contact")} className="btn-lime w-full">
                {String(t("faq.contactSupport")).toUpperCase()} →
              </Link>
            </div>
          </aside>

          {/* Accordion */}
          <div className="flex flex-col gap-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-2"
              >
                {current.items.map((item) => {
                  const isOpen = openQuestion === item.q;
                  return (
                    <div
                      key={item.q}
                      className={`overflow-hidden border-l-2 transition-all duration-200 ${
                        isOpen
                          ? "border-l-[#4ade80] bg-[#4ade80]/[0.05]"
                          : "border-l-transparent bg-[#181818] hover:bg-[#1f1f1f]"
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
                          className={`text-sm font-bold transition-colors sm:text-base ${
                            isOpen ? "text-white" : "text-[#ededed]"
                          }`}
                        >
                          {item.q}
                        </h4>
                        <div
                          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center border transition-all ${
                            isOpen
                              ? "rotate-180 border-[#4ade80] bg-[#4ade80]/[0.1] text-[#4ade80]"
                              : "border-white/10 bg-[#0a0a0a] text-[#707070]"
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
                            <div className="border-t border-white/[0.08] px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
                              <p className="text-sm leading-relaxed text-[#cfcfcf]">
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
