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
import {
  homeFaqCategories,
  type HomeFaqCategoryId,
} from "@/data/home-faq";

// Category-icon mapping lives in the view layer (data module stays pure).
const CATEGORY_ICONS: Record<HomeFaqCategoryId, typeof Rocket> = {
  "getting-started": Rocket,
  predictions: Sparkles,
  pricing: CreditCard,
  "data-security": Lock,
};

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
              outputs; the decision to make a pick (and with whom) is entirely
              yours. Learn more{" "}
              <Link href="/about-us" className={linkCls}>
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

        {/* FAQ Section — accordion; Schema.org JSON-LD emitted once by page.tsx */}
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
    </section>
  );
}

// ─── FAQ Block (categorized accordion) ──────────────────────────────────────

function FaqBlock() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const [activeCategory, setActiveCategory] = useState<HomeFaqCategoryId>(
    homeFaqCategories[0].id,
  );
  // Track the OPEN item by its stable translation key, not the
  // rendered (locale-dependent) question text.
  const [openKey, setOpenKey] = useState<string | null>(
    homeFaqCategories[0].items[0].questionKey,
  );

  const current = homeFaqCategories.find((c) => c.id === activeCategory)!;

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

              {homeFaqCategories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.id];
                const isActive = cat.id === activeCategory;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setOpenKey(cat.items[0].questionKey);
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
                        {t(cat.labelKey)}
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
                    const isOpen = openKey === item.questionKey;
                    return (
                      <div
                        key={item.questionKey}
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
                              setOpenKey(isOpen ? null : item.questionKey)
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
                              {t(item.questionKey)}
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
                                    {t(item.answerKey)}
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
