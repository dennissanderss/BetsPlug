"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Building2,
  Handshake,
  BarChart3,
  Users,
  Mail,
  ChevronRight,
  Sparkles,
  Database,
  Layers,
  Megaphone,
  Newspaper,
  Brain,
  Globe,
  ShieldCheck,
} from "lucide-react";
import { SiteNav } from "@/components/ui/site-nav";
import { BetsPlugFooter } from "@/components/ui/betsplug-footer";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { HeroMediaBg } from "@/components/ui/media-bg";
import { PAGE_IMAGES } from "@/data/page-images";
import { getLocaleValue } from "@/lib/sanity-data";
import { HexBadge } from "@/components/noct/hex-badge";
import { Pill } from "@/components/noct/pill";

interface B2BContentProps {
  b2bPage?: any;
}

export function B2BContent({ b2bPage }: B2BContentProps) {
  const { t, locale } = useTranslations();
  const loc = useLocalizedHref();
  const home = loc("/");

  const partnershipTypes = [
    {
      icon: Database,
      variant: "green" as const,
      title: t("b2b.dataLicensing"),
      desc: t("b2b.dataLicensingDesc"),
    },
    {
      icon: Layers,
      variant: "purple" as const,
      title: t("b2b.whiteLabel"),
      desc: t("b2b.whiteLabelDesc"),
    },
    {
      icon: Megaphone,
      variant: "blue" as const,
      title: t("b2b.affiliate"),
      desc: t("b2b.affiliateDesc"),
    },
    {
      icon: Newspaper,
      variant: "green" as const,
      title: t("b2b.media"),
      desc: t("b2b.mediaDesc"),
    },
  ];

  const iconMap: Record<string, typeof Brain> = { Brain, Globe, Users, ShieldCheck };
  const defaultUsps = [
    { value: "4", label: t("b2b.usp1"), icon: Brain, variant: "green" as const },
    { value: "15+", label: t("b2b.usp2"), icon: Globe, variant: "purple" as const },
    { value: "1,500+", label: t("b2b.usp3"), icon: Users, variant: "blue" as const },
    { value: "100%", label: t("b2b.usp4"), icon: ShieldCheck, variant: "green" as const },
  ];

  const usps = b2bPage?.usps?.length
    ? b2bPage.usps.map((u: any, i: number) => ({
        value: u.value ?? defaultUsps[i]?.value ?? "",
        label: getLocaleValue(u.label, locale) || defaultUsps[i]?.label || "",
        icon: iconMap[u.icon] ?? defaultUsps[i]?.icon ?? Brain,
        variant: defaultUsps[i]?.variant ?? ("green" as const),
      }))
    : defaultUsps;

  const logoRow = ["Acme Bets", "Oddsline", "PitchPro", "ScoreWire", "MetaKick"];

  return (
    <div className="min-h-screen overflow-x-hidden">
      <SiteNav />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <HeroMediaBg src={PAGE_IMAGES["b2b"].hero} alt="" />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-20 h-[400px] w-[800px] -translate-x-1/2 rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.12)", filter: "blur(140px)" }}
        />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="section-label mb-5"
          >
            <Handshake className="h-3 w-3" />
            {t("b2b.badge")}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-display text-2xl text-[#ededed] text-balance break-words sm:text-4xl lg:text-5xl"
          >
            {t("b2b.titleA")}
            <br />
            <span className="gradient-text-green">{t("b2b.titleB")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#a3a9b8] sm:text-lg"
          >
            {t("b2b.subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <a
              href="mailto:business@betsplug.com"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              {t("b2b.contactCta")}
            </a>
            <Link href={home} className="btn-glass inline-flex items-center gap-2">
              Back to homepage
            </Link>
          </motion.div>

          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            aria-label="Breadcrumb"
            className="mt-8 flex items-center justify-center gap-2 text-xs text-[#6b7280]"
          >
            <Link href={home} className="transition-colors hover:text-[#4ade80]">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#a3a9b8]">{t("b2b.badge")}</span>
          </motion.nav>
        </div>
      </section>

      {/* ═══ PARTNERSHIP TYPES ═══ */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-1/4 h-[400px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.1)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 flex max-w-2xl flex-col"
          >
            <span className="section-label mb-4">
              <Building2 className="h-3 w-3" />
              {t("b2b.partnershipsBadge")}
            </span>
            <h2 className="text-heading text-2xl text-[#ededed] text-balance break-words sm:text-3xl lg:text-4xl">
              {t("b2b.partnershipsTitle")}
            </h2>
            <p className="mt-4 text-base text-[#a3a9b8]">
              {t("b2b.partnershipsSubtitle")}
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2">
            {partnershipTypes.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className={`card-neon card-neon-${p.variant} p-6 sm:p-8`}
                >
                  <div className="relative flex items-start gap-5">
                    <HexBadge variant={p.variant} size="md">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </HexBadge>
                    <div className="flex-1">
                      <h3 className="text-heading text-xl text-[#ededed]">
                        {p.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-[#a3a9b8]">
                        {p.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-1/3 h-[400px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.12)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 flex flex-col items-center text-center"
          >
            <span className="section-label mb-4">
              <BarChart3 className="h-3 w-3" />
              {t("b2b.whyPartner")}
            </span>
            <h2 className="text-heading text-2xl text-[#ededed] text-balance break-words sm:text-3xl lg:text-4xl">
              {t("b2b.whyPartnerTitle")}
            </h2>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {usps.map(
              (
                stat: {
                  value: string;
                  label: string;
                  icon: typeof Brain;
                  variant: "green" | "purple" | "blue";
                },
                i: number,
              ) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className={`card-neon card-neon-${stat.variant} p-6`}
                  >
                    <div className="relative">
                      <HexBadge variant={stat.variant} size="md">
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      </HexBadge>
                      <div className="text-stat mt-5 text-3xl text-[#ededed] sm:text-4xl">
                        {stat.value}
                      </div>
                      <p className="mt-2 text-sm text-[#a3a9b8]">{stat.label}</p>
                    </div>
                  </motion.div>
                );
              },
            )}
          </div>
        </div>
      </section>

      {/* ═══ Partners / client row ═══ */}
      <section className="relative py-16 md:py-20">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="glass-panel p-8">
            <div className="flex flex-col items-center gap-6">
              <span className="section-label">
                <Sparkles className="h-3 w-3" /> Trusted by teams
              </span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {logoRow.map((name) => (
                  <Pill key={name} tone="default" className="px-4 py-2 text-xs">
                    {name}
                  </Pill>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CONTACT CTA ═══ */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/4 top-0 h-[400px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.2)", filter: "blur(140px)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-1/4 bottom-0 h-[400px] w-[500px] rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.15)", filter: "blur(140px)" }}
        />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="card-neon card-neon-green halo-green p-6 sm:p-8 md:p-16"
          >
            <div className="relative">
              <span className="section-label mb-4">
                <Sparkles className="h-3 w-3" />
                {t("b2b.contactTitle")}
              </span>
              <h2 className="text-heading text-2xl text-[#ededed] text-balance break-words sm:text-3xl lg:text-4xl">
                {t("b2b.contactTitle")}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[#a3a9b8]">
                {t("b2b.contactSubtitle")}
              </p>

              <div className="mt-8 inline-flex items-center gap-3">
                <Pill tone="active" className="gap-2 px-4 py-2 text-sm">
                  <Mail className="h-4 w-4" />
                  {t("b2b.email")}
                </Pill>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="mailto:business@betsplug.com"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {t("b2b.contactCta")}
                </a>
                <Link href={home} className="btn-ghost inline-flex items-center gap-2">
                  Back to homepage
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <BetsPlugFooter />
    </div>
  );
}

export default B2BContent;
