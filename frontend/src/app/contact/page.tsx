"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  MessageCircle,
  Mail,
  Send,
  Search,
  ChevronDown,
  Clock,
  Shield,
  BookOpen,
  CreditCard,
  Users,
} from "lucide-react";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { SiteNav } from "@/components/ui/site-nav";
import { AiAssistant } from "@/components/ui/ai-assistant";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";

type FaqItem = { q: string; a: string };
type FaqGroup = { label: string; icon: typeof BookOpen; items: FaqItem[] };

export default function ContactPage() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();
  const [chatOpen, setChatOpen] = useState(false);
  const [openQ, setOpenQ] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const helpOptions = [
    {
      id: "chat",
      icon: Sparkles,
      title: t("contact.card1Title"),
      desc: t("contact.card1Desc"),
      cta: t("contact.card1Cta"),
      onClick: () => setChatOpen(true),
      highlight: true,
    },
    {
      id: "telegram",
      icon: MessageCircle,
      title: t("contact.card2Title"),
      desc: t("contact.card2Desc"),
      cta: t("contact.card2Cta"),
      href: "https://t.me/betsplug",
      external: true,
    },
    {
      id: "email",
      icon: Mail,
      title: t("contact.card3Title"),
      desc: t("contact.card3Desc"),
      cta: t("contact.card3Cta"),
      href: "mailto:support@betsplug.com",
    },
  ];

  const faqGroups: FaqGroup[] = [
    {
      label: t("contact.faqGroup1"),
      icon: BookOpen,
      items: [
        { q: t("contact.faq1Q"), a: t("contact.faq1A") },
        { q: t("contact.faq2Q"), a: t("contact.faq2A") },
        { q: t("contact.faq3Q"), a: t("contact.faq3A") },
      ],
    },
    {
      label: t("contact.faqGroup2"),
      icon: CreditCard,
      items: [
        { q: t("contact.faq4Q"), a: t("contact.faq4A") },
        { q: t("contact.faq5Q"), a: t("contact.faq5A") },
        { q: t("contact.faq6Q"), a: t("contact.faq6A") },
      ],
    },
  ];

  // Simple fuzzy filter for the search box
  const normalized = query.trim().toLowerCase();
  const filteredGroups = normalized
    ? faqGroups
        .map((g) => ({
          ...g,
          items: g.items.filter(
            (it) =>
              it.q.toLowerCase().includes(normalized) ||
              it.a.toLowerCase().includes(normalized),
          ),
        }))
        .filter((g) => g.items.length > 0)
    : faqGroups;

  return (
    <div className="min-h-screen bg-[#080b14] text-white">
      {/* Shared site navigation (same as landing) */}
      <SiteNav />

      {/* ───── HERO ───── */}
      <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-20">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-green-500/[0.08] blur-[140px]" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(74,222,128,0.8) 0 1px, transparent 1px 22px)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-400"
          >
            <Sparkles className="h-3 w-3" />
            {t("contact.badge")}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            {t("contact.titleA")}{" "}
            <span className="gradient-text">{t("contact.titleB")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg"
          >
            {t("contact.subtitle")}
          </motion.p>

          {/* Chatbot CTA "search-style" bar */}
          <motion.button
            type="button"
            onClick={() => setChatOpen(true)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18 }}
            className="group relative mx-auto mt-10 flex w-full max-w-xl items-center gap-3 overflow-hidden rounded-full border border-green-500/30 bg-white/[0.03] p-2 pl-6 text-left shadow-xl shadow-green-500/[0.08] transition-all hover:border-green-500/50 hover:bg-white/[0.05] hover:shadow-green-500/20"
          >
            <Sparkles className="h-5 w-5 flex-shrink-0 text-green-400" />
            <span className="flex-1 truncate text-sm text-slate-400 sm:text-base">
              {t("contact.chatPlaceholder")}
            </span>
            <span className="btn-gradient flex items-center gap-2 rounded-full px-5 py-3 text-xs font-extrabold tracking-tight text-black shadow-lg shadow-green-500/30 transition-all group-hover:shadow-green-500/50 sm:text-sm">
              {t("contact.chatStart")}
              <Send className="h-3.5 w-3.5" />
            </span>
          </motion.button>

          <p className="mt-4 text-xs text-slate-500">
            {t("contact.chatHint")}
          </p>
        </div>
      </section>

      {/* ───── Help options grid ───── */}
      <section className="relative px-6 pb-16">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
          {helpOptions.map((opt, i) => {
            const Icon = opt.icon;
            const Inner = (
              <>
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${
                    opt.highlight
                      ? "bg-gradient-to-br from-green-500/25 to-emerald-500/10 shadow-[0_0_30px_rgba(74,222,128,0.25)] ring-1 ring-green-500/30"
                      : "bg-white/[0.05] ring-1 ring-white/[0.08]"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      opt.highlight ? "text-green-400" : "text-slate-300"
                    }`}
                  />
                </div>
                <h3 className="mb-2 text-lg font-extrabold tracking-tight text-white">
                  {opt.title}
                </h3>
                <p className="mb-5 flex-1 text-sm leading-relaxed text-slate-400">
                  {opt.desc}
                </p>
                <div
                  className={`inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest ${
                    opt.highlight ? "text-green-400" : "text-slate-300"
                  }`}
                >
                  {opt.cta}
                  <Send className="h-3 w-3" />
                </div>
              </>
            );

            const cardClass = `group relative flex h-full flex-col overflow-hidden rounded-3xl border p-6 text-left backdrop-blur-sm transition-all duration-300 sm:p-7 ${
              opt.highlight
                ? "border-green-500/30 bg-gradient-to-br from-green-500/[0.08] to-white/[0.02] hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/[0.12]"
                : "border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] hover:border-white/20 hover:bg-white/[0.05]"
            }`;

            return (
              <motion.div
                key={opt.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                {opt.onClick ? (
                  <button
                    type="button"
                    onClick={opt.onClick}
                    className={`${cardClass} w-full`}
                  >
                    {Inner}
                  </button>
                ) : (
                  <a
                    href={opt.href}
                    target={opt.external ? "_blank" : undefined}
                    rel={opt.external ? "noopener noreferrer" : undefined}
                    className={cardClass}
                  >
                    {Inner}
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ───── FAQ Search + Accordions ───── */}
      <section className="relative px-6 pb-20">
        <div className="mx-auto max-w-4xl">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-10 text-center"
          >
            <span className="mb-4 inline-block rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green-400">
              {t("contact.faqBadge")}
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
              {t("contact.faqTitleA")}{" "}
              <span className="gradient-text">{t("contact.faqTitleB")}</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400 sm:text-base">
              {t("contact.faqSubtitle")}
            </p>
          </motion.div>

          {/* Search box */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative mb-10"
          >
            <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("contact.faqSearch")}
              className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] py-4 pl-12 pr-5 text-sm text-white placeholder:text-slate-500 backdrop-blur-sm transition-all focus:border-green-500/40 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
          </motion.div>

          {/* Accordion groups */}
          <div className="flex flex-col gap-10">
            {filteredGroups.length === 0 ? (
              <p className="text-center text-sm text-slate-500">
                {t("contact.faqEmpty")}
              </p>
            ) : (
              filteredGroups.map((group) => {
                const GIcon = group.icon;
                return (
                  <div key={group.label}>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/15 ring-1 ring-green-500/30">
                        <GIcon className="h-4 w-4 text-green-400" />
                      </div>
                      <h3 className="text-sm font-extrabold uppercase tracking-widest text-white">
                        {group.label}
                      </h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      {group.items.map((item) => {
                        const isOpen = openQ === item.q;
                        return (
                          <div
                            key={item.q}
                            className={`overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                              isOpen
                                ? "border-green-500/30 bg-gradient-to-br from-green-500/[0.06] to-transparent shadow-lg shadow-green-500/[0.06]"
                                : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setOpenQ(isOpen ? null : item.q)}
                              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                              aria-expanded={isOpen}
                            >
                              <span
                                className={`text-sm font-semibold transition-colors sm:text-base ${
                                  isOpen ? "text-white" : "text-slate-200"
                                }`}
                              >
                                {item.q}
                              </span>
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
                                  <div className="border-t border-white/[0.06] px-5 pb-5 pt-4 text-sm leading-relaxed text-slate-400 sm:px-6 sm:pb-6">
                                    {item.a}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ───── Still need help strip ───── */}
      <section className="relative px-6 pb-24">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl border border-green-500/20 bg-gradient-to-br from-green-500/[0.08] via-white/[0.02] to-transparent p-8 text-center backdrop-blur-sm sm:p-12"
          >
            <div className="pointer-events-none absolute -left-20 -top-20 h-[280px] w-[280px] rounded-full bg-green-500/[0.12] blur-[120px]" />
            <div className="pointer-events-none absolute -right-20 -bottom-20 h-[280px] w-[280px] rounded-full bg-emerald-500/[0.10] blur-[120px]" />

            <div className="relative">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-500/10 shadow-[0_0_40px_rgba(74,222,128,0.3)] ring-1 ring-green-500/40">
                <Sparkles className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {t("contact.stillNeedTitle")}
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
                {t("contact.stillNeedDesc")}
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setChatOpen(true)}
                  className="btn-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold tracking-tight text-black shadow-lg shadow-green-500/30 transition-all hover:shadow-green-500/50"
                >
                  <Sparkles className="h-4 w-4" />
                  {t("contact.chatStart")}
                </button>
                <a
                  href="mailto:support@betsplug.com"
                  className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-6 py-3 text-sm font-semibold text-slate-300 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                >
                  <Mail className="h-4 w-4" />
                  support@betsplug.com
                </a>
              </div>

              {/* Trust row */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-green-400" />
                  <span>{t("contact.trust1")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3 w-3 text-green-400" />
                  <span>{t("contact.trust2")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3 w-3 text-green-400" />
                  <span>{t("contact.trust3")}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <BetsPlugFooter />

      {/* Chatbot modal */}
      <AiAssistant isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
