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
  BookOpen,
} from "lucide-react";
import { useTranslations, useLocalizedHref } from "@/i18n/locale-provider";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

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
  const linkCls =
    "font-medium text-[#4ade80] underline decoration-[#4ade80]/40 underline-offset-4 transition-colors hover:text-[#86efac]";

  return (
    <section
      className="relative overflow-hidden py-20 md:py-28"
      aria-labelledby="seo-heading"
    >
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[#4ade80]/[0.06] blur-[140px]" />
        <div className="absolute right-1/4 bottom-1/3 h-[400px] w-[600px] translate-x-1/2 rounded-full bg-[#3b82f6]/[0.05] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="section-label">
            <BookOpen className="h-3 w-3" /> {t("seo.badge")}
          </span>
          <h2
            id="seo-heading"
            className="text-heading mt-4 text-3xl text-[#ededed] sm:text-4xl lg:text-5xl"
          >
            {t("seo.titleA")}{" "}
            <span className="gradient-text-green">{t("seo.titleB")}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#a3a9b8]">
            {t("seo.subtitle")}
          </p>
        </motion.div>

        {/* Long-form content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="card-neon relative mt-16"
        >
          <div className="relative p-8 md:p-12">
            <h3 className="text-heading text-2xl text-[#ededed] sm:text-3xl">
              The Best AI Football Prediction Website for Data-Driven Bettors
            </h3>
            <p className="mt-4 text-base leading-relaxed text-[#a3a9b8]">
              If you&apos;ve been searching for the{" "}
              <strong className="font-semibold text-[#ededed]">
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

            <h4 className="text-heading mt-8 text-xl text-[#ededed]">
              AI Betting Predictions Powered by Real Math
            </h4>
            <p className="mt-3 text-base leading-relaxed text-[#a3a9b8]">
              Behind every BetsPlug pick is a combination of{" "}
              <strong className="font-semibold text-[#ededed]">Elo ratings</strong>,{" "}
              <strong className="font-semibold text-[#ededed]">Poisson goal models</strong>{" "}
              and{" "}
              <strong className="font-semibold text-[#ededed]">
                machine-learning classifiers
              </strong>{" "}
              trained on hundreds of thousands of historical matches. The
              result: AI betting predictions that quantify win probability,
              draw probability, expected goals and edge over the bookmaker line
              - all in a single dashboard. Dive into our{" "}
              <Link href="/predictions" className={linkCls}>
                AI predictions hub
              </Link>{" "}
              to see every upcoming match our models have processed.
            </p>

            <h4 className="text-heading mt-8 text-xl text-[#ededed]">
              Free AI Football Picks, Live Probabilities &amp; Pick of the Day
            </h4>
            <p className="mt-3 text-base leading-relaxed text-[#a3a9b8]">
              Looking for{" "}
              <strong className="font-semibold text-[#ededed]">free AI football picks</strong>?
              Every day we publish a highest-confidence{" "}
              <Link href="/bet-of-the-day" className={linkCls}>
                Pick of the Day
              </Link>{" "}
              - a single curated AI pick our algorithm rates as the best value
              across all monitored leagues. Want to go deeper? Our{" "}
              <Link href="/live" className={linkCls}>
                live match tracker
              </Link>{" "}
              shows real-time AI probabilities as they shift during a game,
              perfect for spotting in-play value seconds before the market
              adjusts.
            </p>

            <h4 className="text-heading mt-8 text-xl text-[#ededed]">
              Transparent Track Record - Verify Every AI Pick
            </h4>
            <p className="mt-3 text-base leading-relaxed text-[#a3a9b8]">
              Most football prediction websites hide their losses. We don&apos;t.
              Every AI football pick, every Pick of the Day, every confidence
              score is logged publicly in our{" "}
              <Link href="/trackrecord" className={linkCls}>
                verified track record
              </Link>
              . You can filter by league, market, confidence tier and date
              range to see exactly how the models have performed - no edits,
              no deletions, no cherry-picking.
            </p>

            <h4 className="text-heading mt-8 text-xl text-[#ededed]">
              Data Insights, Not Gambling Advice
            </h4>
            <p className="mt-3 text-base leading-relaxed text-[#a3a9b8]">
              A crucial note: BetsPlug is{" "}
              <strong className="font-semibold text-[#ededed]">
                not a bookmaker and not a gambling site
              </strong>
              . We do not accept wagers, handle money, or promote irresponsible
              play. We&apos;re a pure{" "}
              <strong className="font-semibold text-[#ededed]">
                football analytics and AI prediction platform
              </strong>{" "}
              - think of us as the quant desk you can rent by the month. Our
              job is to give you the data, probabilities and machine-learning
              outputs; the decision to place a bet (and with whom) is entirely
              yours. Learn more{" "}
              <Link href="/about" className={linkCls}>
                about our mission
              </Link>{" "}
              or browse{" "}
              <Link href={pricingHref} className={linkCls}>
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
          className="mt-16 flex flex-wrap items-center justify-center gap-3"
        >
          {[
            { href: "/predictions", label: "AI Predictions" },
            { href: "/bet-of-the-day", label: "Pick of the Day" },
            { href: "/live", label: "Live Probabilities" },
            { href: "/trackrecord", label: "Track Record" },
            { href: pricingHref, label: "Pricing" },
            { href: "/deals", label: "Exclusive Deals" },
          ].map((link) => (
            <Link key={link.href} href={link.href}>
              <Pill>{link.label}</Pill>
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
        <span className="section-label">
          <Sparkles className="h-3 w-3" /> {t("faq.badge")}
        </span>
        <h3 className="text-heading mt-4 text-3xl text-[#ededed] sm:text-4xl lg:text-5xl">
          {t("faq.titleA")}{" "}
          <span className="gradient-text-green">{t("faq.titleB")}</span>
        </h3>
        <p className="mx-auto mt-4 max-w-xl text-base text-[#a3a9b8]">
          {t("faq.subtitle")}
        </p>
      </div>

      {/* Outer card */}
      <div className="card-neon relative">
        <div className="relative overflow-hidden p-5 sm:p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr] lg:gap-8">
            {/* Sidebar */}
            <aside className="flex flex-col gap-2">
              <h4 className="mono-label mb-2 text-[#6b7280]">
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
                    className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                      isActive
                        ? "glass-panel-lifted"
                        : "glass-panel hover:bg-white/[0.04]"
                    }`}
                    style={
                      isActive
                        ? {
                            background:
                              "linear-gradient(180deg, rgba(74, 222, 128, 0.08), rgba(74, 222, 128, 0.02))",
                          }
                        : undefined
                    }
                  >
                    <HexBadge
                      variant={isActive ? "green" : "blue"}
                      size="sm"
                      noGlow={!isActive}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </HexBadge>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm transition-colors ${
                          isActive
                            ? "font-semibold text-[#ededed]"
                            : "text-[#cfd3dc]"
                        }`}
                      >
                        {cat.label}
                      </p>
                      <p className="text-[11px] text-[#6b7280]">
                        {cat.items.length} {t("faq.articles")}
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 -rotate-90 transition-all ${
                        isActive ? "text-[#4ade80]" : "text-[#6b7280]"
                      }`}
                    />
                  </button>
                );
              })}

              {/* Contact Support card */}
              <div className="card-neon card-neon-green relative mt-4">
                <div className="relative p-5">
                  <div className="mb-3 flex items-center gap-2.5">
                    <HexBadge variant="green" size="sm">
                      <LifeBuoy className="h-4 w-4" strokeWidth={2} />
                    </HexBadge>
                    <p className="text-sm font-semibold text-[#ededed]">
                      {t("faq.stillQuestions")}
                    </p>
                  </div>
                  <p className="mb-4 text-xs leading-relaxed text-[#a3a9b8]">
                    {t("faq.supportBlurb")}
                  </p>
                  <Link
                    href={loc("/contact")}
                    className="btn-primary w-full justify-center"
                  >
                    {t("faq.contactSupport")}
                  </Link>
                </div>
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
                        className={`${
                          isOpen
                            ? "card-neon card-neon-green"
                            : "glass-panel-lifted"
                        } relative overflow-hidden rounded-xl transition-all duration-200`}
                      >
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenQuestion(isOpen ? null : item.q)
                            }
                            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                            aria-expanded={isOpen}
                          >
                            <h4
                              className={`text-sm font-medium transition-colors sm:text-base ${
                                isOpen
                                  ? "text-[#ededed]"
                                  : "text-[#ededed] hover:text-[#4ade80]"
                              }`}
                            >
                              {item.q}
                            </h4>
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
                                transition={{
                                  duration: 0.3,
                                  ease: [0.16, 1, 0.3, 1],
                                }}
                                className="overflow-hidden"
                              >
                                <div className="border-t border-white/[0.06] px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
                                  <p className="text-sm leading-relaxed text-[#a3a9b8]">
                                    {item.a}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
