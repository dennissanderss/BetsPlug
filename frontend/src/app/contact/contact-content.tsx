"use client";

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
  LifeBuoy,
} from "lucide-react";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { SiteNav } from "@/components/ui/site-nav";
import { useTranslations } from "@/i18n/locale-provider";
import { HeroMediaBg } from "@/components/ui/media-bg";
import { PAGE_IMAGES } from "@/data/page-images";
import { getLocaleValue } from "@/lib/sanity-data";
import { HexBadge } from "@/components/noct/hex-badge";

type FaqItem = { q: string; a: string };
type FaqGroup = { label: string; icon: typeof BookOpen; items: FaqItem[] };

interface ContactContentProps {
  contactPage?: any;
}

export function ContactContent({ contactPage }: ContactContentProps) {
  const { t, locale } = useTranslations();
  const [openQ, setOpenQ] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const helpOptions = [
    {
      id: "telegram",
      icon: MessageCircle,
      title: t("contact.card2Title"),
      desc: t("contact.card2Desc"),
      cta: t("contact.card2Cta"),
      href: "https://t.me/betsplug",
      external: true,
      variant: "green" as const,
    },
    {
      id: "email",
      icon: Mail,
      title: t("contact.card3Title"),
      desc: t("contact.card3Desc"),
      cta: t("contact.card3Cta"),
      href: "mailto:support@betsplug.com",
      external: false,
      variant: "purple" as const,
    },
  ];

  const defaultFaqGroups: FaqGroup[] = [
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

  const faqIconMap: Record<string, typeof BookOpen> = { BookOpen, CreditCard };
  const faqGroups: FaqGroup[] = contactPage?.faqGroups?.length
    ? contactPage.faqGroups.map((g: any, i: number) => ({
        label: getLocaleValue(g.label, locale) || defaultFaqGroups[i]?.label || "",
        icon: faqIconMap[g.icon] ?? defaultFaqGroups[i]?.icon ?? BookOpen,
        items: g.items?.length
          ? g.items.map((item: any) => ({
              q: getLocaleValue(item.question, locale) || "",
              a: getLocaleValue(item.answer, locale) || "",
            }))
          : defaultFaqGroups[i]?.items ?? [],
      }))
    : defaultFaqGroups;

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
    : activeGroup
    ? faqGroups.filter((g) => g.label === activeGroup)
    : faqGroups;

  return (
    <div className="min-h-screen overflow-x-hidden">
      <SiteNav />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <HeroMediaBg src={PAGE_IMAGES.contact.hero} alt="" />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-20 h-[400px] w-[800px] -translate-x-1/2 rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.1)", filter: "blur(140px)" }}
        />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="section-label mb-5"
          >
            <Sparkles className="h-3 w-3" />
            {t("contact.badge")}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-heading text-2xl text-[#ededed] text-balance break-words sm:text-3xl lg:text-4xl"
          >
            {t("contact.titleA")}{" "}
            <span className="gradient-text-green">{t("contact.titleB")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#a3a9b8] sm:text-lg"
          >
            {t("contact.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* ─── Help options grid ─── */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.1)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
            {helpOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <motion.a
                  key={opt.id}
                  href={opt.href}
                  target={opt.external ? "_blank" : undefined}
                  rel={opt.external ? "noopener noreferrer" : undefined}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className={`card-neon card-neon-${opt.variant} group relative block p-7 sm:p-8 transition-transform duration-300 hover:-translate-y-1`}
                >
                  <div className="relative flex h-full flex-col">
                    <HexBadge variant={opt.variant} size="md">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </HexBadge>
                    <h3 className="text-heading mt-5 text-xl text-[#ededed]">
                      {opt.title}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-[#a3a9b8]">
                      {opt.desc}
                    </p>
                    <span
                      className={`mt-6 inline-flex items-center gap-2 ${
                        opt.variant === "green" ? "btn-primary" : "btn-glass"
                      }`}
                    >
                      {opt.cta}
                      <Send className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FAQ Search + Accordions ─── */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-[400px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.1)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 flex flex-col items-center text-center"
          >
            <span className="section-label mb-4">
              <BookOpen className="h-3 w-3" />
              {t("contact.faqBadge")}
            </span>
            <h2 className="text-heading text-2xl text-[#ededed] text-balance break-words sm:text-3xl lg:text-4xl">
              {t("contact.faqTitleA")}{" "}
              <span className="gradient-text-green">{t("contact.faqTitleB")}</span>
            </h2>
            <p className="mt-4 max-w-xl text-base text-[#a3a9b8]">
              {t("contact.faqSubtitle")}
            </p>
          </motion.div>

          <div className="card-neon p-6 sm:p-8">
            <div className="relative grid gap-6 sm:gap-8 lg:grid-cols-[240px_1fr]">
              {/* Sidebar categories */}
              <aside className="flex flex-row flex-wrap gap-2 lg:flex-col lg:gap-3">
                <button
                  type="button"
                  onClick={() => setActiveGroup(null)}
                  className={`${
                    activeGroup === null ? "glass-panel-lifted" : "glass-panel"
                  } flex items-center gap-3 p-3 text-left text-sm text-[#ededed] transition hover:-translate-y-0.5`}
                >
                  <HexBadge variant="green" size="sm" noGlow>
                    <Sparkles className="h-3.5 w-3.5" />
                  </HexBadge>
                  <span>All</span>
                </button>
                {faqGroups.map((g) => {
                  const GIcon = g.icon;
                  const isActive = activeGroup === g.label;
                  return (
                    <button
                      key={g.label}
                      type="button"
                      onClick={() => setActiveGroup(isActive ? null : g.label)}
                      className={`${
                        isActive ? "glass-panel-lifted" : "glass-panel"
                      } flex items-center gap-3 p-3 text-left text-sm text-[#ededed] transition hover:-translate-y-0.5`}
                    >
                      <HexBadge variant={isActive ? "green" : "blue"} size="sm" noGlow>
                        <GIcon className="h-3.5 w-3.5" />
                      </HexBadge>
                      <span>{g.label}</span>
                    </button>
                  );
                })}
              </aside>

              <div className="flex flex-col gap-6">
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("contact.faqSearch")}
                    className="w-full rounded-2xl border border-white/10 bg-[#0a0f1a]/80 py-4 pl-12 pr-5 text-sm text-[#ededed] placeholder:text-[#6b7280] transition-all focus:border-[#4ade80]/50 focus:outline-none focus:ring-2 focus:ring-[#4ade80]/20"
                  />
                </div>

                <div className="flex flex-col gap-6">
                  {filteredGroups.length === 0 ? (
                    <p className="text-center text-sm text-[#6b7280]">
                      {t("contact.faqEmpty")}
                    </p>
                  ) : (
                    filteredGroups.map((group) => {
                      const GIcon = group.icon;
                      return (
                        <div key={group.label}>
                          <div className="mb-3 flex items-center gap-3">
                            <HexBadge variant="green" size="sm" noGlow>
                              <GIcon className="h-3.5 w-3.5" />
                            </HexBadge>
                            <h3 className="text-heading text-sm text-[#ededed]">
                              {group.label}
                            </h3>
                          </div>
                          <div className="flex flex-col gap-3">
                            {group.items.map((item) => {
                              const isOpen = openQ === item.q;
                              return (
                                <div
                                  key={item.q}
                                  className={`${
                                    isOpen ? "card-neon card-neon-green" : "glass-panel-lifted"
                                  } overflow-hidden transition-all duration-300`}
                                >
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setOpenQ(isOpen ? null : item.q)
                                      }
                                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                                      aria-expanded={isOpen}
                                    >
                                      <span
                                        className={`text-sm font-semibold sm:text-base ${
                                          isOpen ? "text-[#ededed]" : "text-[#c4cad6]"
                                        }`}
                                      >
                                        {item.q}
                                      </span>
                                      <ChevronDown
                                        className={`h-4 w-4 flex-shrink-0 transition-transform ${
                                          isOpen
                                            ? "rotate-180 text-[#4ade80]"
                                            : "text-[#6b7280]"
                                        }`}
                                      />
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
                                          <div className="border-t border-white/10 px-5 pb-5 pt-4 text-sm leading-relaxed text-[#a3a9b8] sm:px-6 sm:pb-6">
                                            {item.a}
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
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Still need help — finalCta ─── */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/4 top-0 h-[400px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.18)", filter: "blur(140px)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-1/4 bottom-0 h-[400px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.15)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="card-neon card-neon-green halo-green p-6 sm:p-8 md:p-16"
          >
            <div className="relative">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <HexBadge variant="green" size="lg">
                  <LifeBuoy className="h-7 w-7" strokeWidth={2} />
                </HexBadge>
                <div className="flex-1 min-w-0">
                  <span className="section-label mb-4">
                    <Sparkles className="h-3 w-3" />
                    {t("contact.stillNeedTitle")}
                  </span>
                  <h2 className="text-heading text-2xl text-[#ededed] text-balance break-words sm:text-3xl lg:text-4xl">
                    {t("contact.stillNeedTitle")}
                  </h2>
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-[#a3a9b8]">
                    {t("contact.stillNeedDesc")}
                  </p>

                  <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                    <a
                      href="mailto:support@betsplug.com"
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      support@betsplug.com
                    </a>
                    <a
                      href="https://t.me/betsplug"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost inline-flex items-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Telegram support
                    </a>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-[#a3a9b8]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#4ade80]" />
                      <span>{t("contact.trust1")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-[#4ade80]" />
                      <span>{t("contact.trust2")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-[#4ade80]" />
                      <span>{t("contact.trust3")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <BetsPlugFooter />
    </div>
  );
}
