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

/**
 * B2B Partnerships page — premium landing page for business collaborations.
 * Dark/green design language, motion-driven reveals, professional tone.
 */
export function B2BContent() {
  const { t } = useTranslations();
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

  const usps = [
    {
      value: "4",
      label: t("b2b.usp1"),
      icon: Brain,
    },
    {
      value: "15+",
      label: t("b2b.usp2"),
      icon: Globe,
    },
    {
      value: "1,500+",
      label: t("b2b.usp3"),
      icon: Users,
    },
    {
      value: "100%",
      label: t("b2b.usp4"),
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#080b14] text-white">
      <SiteNav />

      {/* ═══════════════════════════════════════════════════════════════════
          HERO
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-20">
        {/* Ambient background */}
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
            <Handshake className="h-3 w-3" />
            {t("b2b.badge")}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-balance break-words text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            {t("b2b.titleA")}
            <br />
            <span className="gradient-text">{t("b2b.titleB")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg"
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
              className="btn-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-extrabold tracking-tight shadow-lg shadow-green-500/30 transition-all hover:shadow-green-500/50 sm:text-base"
            >
              <Mail className="h-4 w-4" />
              {t("b2b.contactCta")}
              <ArrowRight className="h-4 w-4" />
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
            <Link href={home} className="transition-colors hover:text-green-400">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-300">{t("b2b.badge")}</span>
          </motion.nav>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PARTNERSHIP TYPES
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-24">
        <div className="relative mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 max-w-2xl text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-400">
              <Building2 className="h-3 w-3" />
              {t("b2b.partnershipsBadge")}
            </span>
            <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
              {t("b2b.partnershipsTitle")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-400 sm:text-lg">
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
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 transition-all hover:border-green-500/30 hover:bg-green-500/[0.04]"
                >
                  <div className="pointer-events-none absolute -right-16 -top-16 h-[200px] w-[200px] rounded-full bg-green-500/[0.06] blur-[80px] transition-all group-hover:bg-green-500/[0.12]" />
                  <div className="relative">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/15 shadow-[0_0_20px_rgba(74,222,128,0.2)] ring-1 ring-green-500/30">
                      <Icon className="h-5 w-5 text-green-400" />
                    </div>
                    <h3 className="mb-3 text-xl font-extrabold tracking-tight text-white">
                      {p.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-400">
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
      <section className="relative border-y border-white/[0.06] bg-gradient-to-b from-transparent via-white/[0.02] to-transparent py-20">
        <div className="relative mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-400">
              <BarChart3 className="h-3 w-3" />
              {t("b2b.whyPartner")}
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {t("b2b.whyPartnerTitle")}
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {usps.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition-all hover:border-green-500/30 hover:bg-green-500/[0.04]"
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 h-[120px] w-[120px] rounded-full bg-green-500/[0.06] blur-[60px] transition-all group-hover:bg-green-500/[0.12]" />
                  <div className="relative">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/15 ring-1 ring-green-500/30">
                      <Icon className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="text-4xl font-extrabold tracking-tight text-white">
                      {stat.value}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">
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
          CONTACT CTA
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative pb-24 pt-20">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="relative overflow-hidden rounded-3xl border border-green-500/30 bg-gradient-to-br from-[#0d2319] via-[#0a1a13] to-[#050f09] p-10 text-center shadow-2xl shadow-green-500/[0.15] sm:p-14"
          >
            {/* Ambient glow */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-[360px] w-[360px] rounded-full bg-green-500/[0.18] blur-[120px]" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-[360px] w-[360px] rounded-full bg-emerald-500/[0.14] blur-[120px]" />

            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-500/40 bg-green-500/15 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-green-300">
                <Sparkles className="h-3 w-3" />
                {t("b2b.contactTitle")}
              </div>
              <h2 className="mx-auto max-w-2xl text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
                {t("b2b.contactTitle")}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                {t("b2b.contactSubtitle")}
              </p>

              {/* Email display */}
              <div className="mx-auto mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-6 py-4 backdrop-blur">
                <Mail className="h-5 w-5 text-green-400" />
                <span className="text-base font-semibold text-white sm:text-lg">
                  {t("b2b.email")}
                </span>
              </div>

              <div className="mt-8">
                <a
                  href="mailto:business@betsplug.com"
                  className="btn-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-extrabold tracking-tight shadow-lg shadow-green-500/30 transition-all hover:shadow-green-500/50 sm:text-base"
                >
                  {t("b2b.contactCta")}
                  <ArrowRight className="h-4 w-4" />
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
