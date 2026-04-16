"use client";

import React from "react";
import type { ComponentProps, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  Send,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  MapPin,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { Pill } from "@/components/noct/pill";
import {
  VisaBadge,
  MastercardBadge,
  AmexBadge,
  PayPalBadge,
  ApplePayBadge,
} from "./payment-badges";

/**
 * BetsPlugFooter — NOCTURNE footer (centered, glow-highlighted top).
 *
 * Layout mirrors the reference footer pattern: centered max-w-6xl shell
 * with a top hairline highlight, 4-column grid (brand + 3 link columns),
 * animated-on-view containers. Keeps the full BetsPlug data set: product
 * / company / legal / socials, payment-method icons, security strip and
 * PCI compliance pill.
 */

interface FooterLink {
  text: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  external?: boolean;
}

interface FooterSection {
  label: string;
  links: FooterLink[];
}

export function BetsPlugFooter() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  const footerSections: FooterSection[] = [
    {
      label: t("footer.product"),
      links: [
        { text: t("nav.predictions"), href: loc("/match-predictions") },
        { text: t("nav.trackRecord"), href: loc("/track-record") },
        { text: t("nav.howItWorks"), href: loc("/how-it-works") },
        { text: t("nav.pricing"), href: loc("/pricing") },
      ],
    },
    {
      label: t("footer.company"),
      links: [
        { text: t("footer.aboutUs"), href: loc("/about-us") },
        { text: t("footer.ourModels"), href: loc("/about-us") + "#models" },
        { text: t("nav.articles"), href: loc("/articles") },
        { text: t("footer.contact"), href: loc("/contact") },
        { text: t("b2b.badge"), href: loc("/b2b") },
      ],
    },
    {
      label: t("footer.legal"),
      links: [
        { text: t("footer.termsOfService"), href: loc("/terms") },
        { text: t("footer.privacyPolicy"), href: loc("/privacy") },
        { text: t("footer.cookiePolicy"), href: loc("/cookies") },
        { text: t("footer.responsibleGambling"), href: loc("/responsible-gambling") },
      ],
    },
    {
      label: "Follow",
      links: [
        { text: "Twitter", href: "https://twitter.com/betsplug", icon: Twitter, external: true },
        {
          text: "Instagram",
          href: "https://www.instagram.com/betsplug_com",
          icon: Instagram,
          external: true,
        },
        { text: "YouTube", href: "https://youtube.com/@betsplug", icon: Youtube, external: true },
        { text: "Telegram", href: "https://t.me/betsplug", icon: Send, external: true },
      ],
    },
  ];

  const bottomLinks = [
    { key: "footer.bottomPrivacy", href: "/privacy" },
    { key: "footer.bottomTerms", href: "/terms" },
    { key: "footer.bottomCookies", href: "/cookies" },
  ] as const;

  return (
    <footer
      className="relative mx-auto flex w-full max-w-6xl flex-col items-center justify-center overflow-hidden rounded-t-[2rem] border-t px-4 py-10 sm:px-6 sm:py-12 md:rounded-t-[3rem] lg:py-16"
      style={{
        borderColor: "hsl(0 0% 100% / 0.08)",
        background:
          "radial-gradient(55% 180px at 50% 0%, hsl(var(--accent-green) / 0.08), transparent 70%), linear-gradient(180deg, hsl(230 22% 7% / 0.5) 0%, hsl(234 25% 4%) 100%)",
      }}
    >
      {/* Top glow hairline highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur"
        style={{ background: "hsl(var(--accent-green) / 0.55)" }}
      />
      {/* Ambient corner glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 bottom-0 h-[260px] w-[260px] rounded-full"
        style={{ background: "hsl(var(--accent-green) / 0.08)", filter: "blur(120px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-10 h-[220px] w-[220px] rounded-full"
        style={{ background: "hsl(var(--accent-purple) / 0.08)", filter: "blur(120px)" }}
      />

      {/* Main grid */}
      <div className="grid w-full gap-8 md:grid-cols-2 xl:grid-cols-3 xl:gap-8">
        {/* Brand column */}
        <AnimatedContainer className="space-y-4">
          <Link href={loc("/")} className="inline-flex items-center">
            <Image
              src="/logo.webp"
              alt="BetsPlug"
              width={120}
              height={48}
              className="h-10 w-auto"
            />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#a3a9b8]">
            {t("footer.brandTagline")}
          </p>

          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex min-w-0 items-center gap-2 text-[#a3a9b8]">
              <Mail className="h-4 w-4 shrink-0 text-[#4ade80]" />
              <a
                href="mailto:support@betsplug.com"
                className="min-w-0 truncate transition-colors hover:text-[#ededed]"
              >
                support@betsplug.com
              </a>
            </li>
            <li className="flex items-center gap-2 text-[#a3a9b8]">
              <MapPin className="h-4 w-4 text-[#4ade80]" />
              <span>Netherlands</span>
            </li>
          </ul>

          <p className="text-muted-foreground mt-6 text-xs text-[#6b7280] md:mt-8">
            © {new Date().getFullYear()} BetsPlug. {t("footer.copyright")}
          </p>
        </AnimatedContainer>

        {/* Link columns */}
        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 sm:gap-8 md:mt-0 md:grid-cols-2 xl:col-span-2 xl:grid-cols-4">
          {footerSections.map((section, index) => (
            <AnimatedContainer key={section.label} delay={0.1 + index * 0.08}>
              <div className="mb-8 md:mb-0">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
                  {section.label}
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {section.links.map((link) => {
                    const className =
                      "inline-flex items-center gap-1.5 text-[#a3a9b8] transition-colors hover:text-[#4ade80]";
                    const inner = (
                      <>
                        {link.icon && <link.icon className="h-4 w-4" />}
                        <span>{link.text}</span>
                      </>
                    );
                    return (
                      <li key={link.text}>
                        {link.external ? (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={className}
                          >
                            {inner}
                          </a>
                        ) : (
                          <Link href={link.href} className={className}>
                            {inner}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>

      {/* Payment + security strip */}
      <AnimatedContainer
        delay={0.5}
        className="relative mt-10 flex w-full flex-col items-center gap-5 rounded-2xl border px-4 py-5 sm:px-5 lg:flex-row lg:justify-between"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background: "hsl(230 16% 10% / 0.55)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderColor: "hsl(0 0% 100% / 0.08)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] border"
          style={{ borderColor: "hsl(0 0% 100% / 0.08)" }}
        />

        <div className="relative flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{
              background: "hsl(var(--accent-green) / 0.12)",
              border: "1px solid hsl(var(--accent-green) / 0.3)",
            }}
          >
            <ShieldCheck className="h-4 w-4 text-[#4ade80]" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#ededed]">
              {t("footer.secureTitle")}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-[#6b7280]">
              <Lock className="h-3 w-3" />
              {t("footer.secureDesc")}
            </p>
          </div>
        </div>

        <div className="relative flex flex-wrap items-center justify-center gap-2 lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2">
          <VisaBadge />
          <MastercardBadge />
          <AmexBadge />
          <PayPalBadge />
          <ApplePayBadge />
        </div>

        <Pill
          className="relative"
          style={{ color: "#4ade80", borderColor: "hsl(var(--accent-green) / 0.3)" }}
        >
          <span className="live-dot" />
          {t("footer.pciCompliant")}
        </Pill>
      </AnimatedContainer>

      {/* Bottom bar */}
      <div
        className="relative mt-8 flex w-full flex-col items-center justify-between gap-4 border-t pt-6 md:flex-row"
        style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
      >
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {bottomLinks.map(({ key, href }) => (
            <Link
              key={key}
              href={loc(href)}
              className="text-xs text-[#6b7280] transition-colors hover:text-[#4ade80]"
            >
              {t(key)}
            </Link>
          ))}
        </div>
        <p className="text-center text-[11px] text-[#6b7280]">
          {t("footer.responsible")}
        </p>
      </div>
    </footer>
  );
}

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>["className"];
  children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default BetsPlugFooter;
