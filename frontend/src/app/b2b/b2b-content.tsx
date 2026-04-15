"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Building2,
  Handshake,
  BarChart3,
  Users,
  Mail,
  ArrowRight,
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
import { HeroMediaBg, CtaMediaBg } from "@/components/ui/media-bg";
import { PAGE_IMAGES } from "@/data/page-images";
import { getLocaleValue } from "@/lib/sanity-data";

interface B2BContentProps {
  b2bPage?: any;
}

/**
 * B2B Partnerships page — premium landing page for business collaborations.
 * Dark/green design language, motion-driven reveals, professional tone.
 */
export function B2BContent({ b2bPage }: B2BContentProps) {
  const { t, locale } = useTranslations();
  const loc = useLocalizedHref();
  const home = loc("/");

  const partnershipTypes = [
    {
      icon: Database,
      title: t("b2b.dataLicensing"),
      desc: t("b2b.dataLicensingDesc"),
    },
    {
      icon: Layers,
      title: t("b2b.whiteLabel"),
      desc: t("b2b.whiteLabelDesc"),
    },
    {
      icon: Megaphone,
      title: t("b2b.affiliate"),
      desc: t("b2b.affiliateDesc"),
    },
    {
      icon: Newspaper,
      title: t("b2b.media"),
      desc: t("b2b.mediaDesc"),
    },
  ];

  const iconMap: Record<string, typeof Brain> = { Brain, Globe, Users, ShieldCheck };
  const defaultUsps = [
    { value: "4", label: t("b2b.usp1"), icon: Brain },
    { value: "15+", label: t("b2b.usp2"), icon: Globe },
    { value: "1,500+", label: t("b2b.usp3"), icon: Users },
    { value: "100%", label: t("b2b.usp4"), icon: ShieldCheck },
  ];

  const usps = b2bPage?.usps?.length
    ? b2bPage.usps.map((u: any, i: number) => ({
        value: u.value ?? defaultUsps[i]?.value ?? "",
        label: getLocaleValue(u.label, locale) || defaultUsps[i]?.label || "",
        icon: iconMap[u.icon] ?? defaultUsps[i]?.icon ?? Brain,
      }))
    : defaultUsps;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-slate-900">
      <SiteNav />

      {/* ═══════════════════════════════════════════════════════════════════
          HERO
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="no-rhythm relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <HeroMediaBg src={PAGE_IMAGES["b2b"].hero} alt="" />

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
            className="text-display text-3xl text-white sm:text-4xl lg:text-5xl"
          >
            {t("b2b.titleA")}
            <br />
            <span className="gradient-text">{t("b2b.titleB")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg"
          >
            {t("b2b.subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-8"
          >
            <a
              href="mailto:business@betsplug.com"
              className="btn-lime"
            >
              <Mail className="h-4 w-4" />
              {String(t("b2b.contactCta")).toUpperCase()} →
            </a>
          </motion.div>

          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            aria-label="Breadcrumb"
            className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500"
          >
            <Link href={home} className="transition-colors hover:text-green-600">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600">{t("b2b.badge")}</span>
          </motion.nav>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PARTNERSHIP TYPES
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-12 sm:mb-14 flex max-w-2xl flex-col items-center text-center"
          >
            <span className="section-label mb-4">
              <Building2 className="h-3 w-3" />
              {t("b2b.partnershipsBadge")}
            </span>
            <h2 className="text-display text-3xl text-white sm:text-4xl lg:text-5xl">
              {t("b2b.partnershipsTitle")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              {t("b2b.partnershipsSubtitle")}
            </p>
          </motion.div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
            {partnershipTypes.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm transition-all hover:border-green-500/30 hover:shadow-md"
                >
                  <div className="pointer-events-none absolute -right-16 -top-16 h-[200px] w-[200px] rounded-full bg-green-50 blur-[80px] transition-all group-hover:bg-green-100" />
                  <div className="relative">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 shadow-sm ring-1 ring-green-500/30">
                      <Icon className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="mb-3 text-xl font-extrabold tracking-tight text-slate-900">
                      {p.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {p.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          WHY PARTNER WITH US — stats
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative border-y border-slate-200 bg-gradient-to-b from-white to-slate-50 py-20 md:py-28">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-12 sm:mb-14 flex flex-col items-center text-center"
          >
            <span className="section-label mb-4">
              <BarChart3 className="h-3 w-3" />
              {t("b2b.whyPartner")}
            </span>
            <h2 className="text-display text-3xl text-white sm:text-4xl lg:text-5xl">
              {t("b2b.whyPartnerTitle")}
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {usps.map((stat: { value: string; label: string; icon: typeof Brain }, i: number) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm transition-all hover:border-green-500/30 hover:shadow-md"
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 h-[120px] w-[120px] rounded-full bg-green-50 blur-[60px] transition-all group-hover:bg-green-100" />
                  <div className="relative">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 ring-1 ring-green-500/30">
                      <Icon className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-4xl font-extrabold tracking-tight text-slate-900">
                      {stat.value}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                      {stat.label}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTACT CTA — finalCta style
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="relative overflow-hidden bg-[#4ade80] p-10 md:p-16"
          >
            <CtaMediaBg src={PAGE_IMAGES["b2b"].cta} alt={PAGE_IMAGES["b2b"].alt} pattern={PAGE_IMAGES["b2b"].pattern} />
            <span className="pointer-events-none absolute left-0 top-0 z-10 h-4 w-4 border-l-2 border-t-2 border-[#050505]" />
            <span className="pointer-events-none absolute right-0 top-0 z-10 h-4 w-4 border-r-2 border-t-2 border-[#050505]" />
            <span className="pointer-events-none absolute left-0 bottom-0 z-10 h-4 w-4 border-l-2 border-b-2 border-[#050505]" />
            <span className="pointer-events-none absolute right-0 bottom-0 z-10 h-4 w-4 border-r-2 border-b-2 border-[#050505]" />

            <div className="relative">
              <span className="mb-6 inline-flex items-center gap-2 bg-[#050505] px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#4ade80]">
                <Sparkles className="h-3 w-3" />
                {t("b2b.contactTitle")}
              </span>
              <h2 className="text-display text-3xl text-[#050505] sm:text-4xl lg:text-5xl">
                {t("b2b.contactTitle")}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#050505]/80">
                {t("b2b.contactSubtitle")}
              </p>

              <div className="mt-8 inline-flex items-center gap-3 bg-[#050505] px-6 py-4">
                <Mail className="h-5 w-5 text-[#4ade80]" />
                <span className="font-mono text-sm font-bold uppercase tracking-widest text-[#4ade80] sm:text-base">
                  {t("b2b.email")}
                </span>
              </div>

              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <a
                  href="mailto:business@betsplug.com"
                  className="inline-flex items-center gap-2 bg-[#050505] px-8 py-4 text-xs font-black uppercase tracking-widest text-[#4ade80] transition-colors hover:bg-[#1a1a1a]"
                >
                  {String(t("b2b.contactCta")).toUpperCase()} →
                </a>
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
