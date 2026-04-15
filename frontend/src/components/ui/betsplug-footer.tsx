"use client";

import Image from "next/image";
import Link from "next/link";
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
import {
  VisaBadge,
  MastercardBadge,
  AmexBadge,
  PayPalBadge,
  ApplePayBadge,
} from "./payment-badges";

/**
 * BetsPlugFooter — NOCTURNE public footer.
 *
 * Glass-panel background layer with subtle divider, 4-column link
 * grid, payment + security strip, bottom copyright.
 */

const bottomLinkKeys = [
  { key: "footer.bottomPrivacy", href: "/privacy" },
  { key: "footer.bottomTerms", href: "/terms" },
  { key: "footer.bottomCookies", href: "/cookies" },
] as const;

const socials = [
  { icon: Twitter, label: "Twitter", href: "https://twitter.com/betsplug" },
  {
    icon: Instagram,
    label: "Instagram",
    href: "https://www.instagram.com/betsplug_com",
  },
  { icon: Youtube, label: "YouTube", href: "https://youtube.com/@betsplug" },
  { icon: Send, label: "Telegram", href: "https://t.me/betsplug" },
];

export function BetsPlugFooter() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  const productLinks = [
    { text: t("nav.predictions"), href: loc("/match-predictions") },
    { text: t("nav.trackRecord"), href: loc("/track-record") },
    { text: t("nav.howItWorks"), href: loc("/how-it-works") },
    { text: t("nav.pricing"), href: loc("/pricing") },
  ];
  const companyLinks = [
    { text: t("footer.aboutUs"), href: loc("/about-us") },
    { text: t("footer.ourModels"), href: loc("/about-us") + "#models" },
    { text: t("nav.articles"), href: loc("/articles") },
    { text: t("footer.contact"), href: loc("/contact") },
    { text: t("b2b.badge"), href: loc("/b2b") },
  ];
  const legalLinks = [
    { text: t("footer.termsOfService"), href: loc("/terms") },
    { text: t("footer.privacyPolicy"), href: loc("/privacy") },
    { text: t("footer.cookiePolicy"), href: loc("/cookies") },
    { text: t("footer.responsibleGambling"), href: loc("/responsible-gambling") },
  ];

  return (
    <footer
      className="relative w-full pt-16 pb-8"
      style={{
        borderTop: "1px solid hsl(0 0% 100% / 0.06)",
        background: "linear-gradient(180deg, hsl(230 20% 6% / 0.7) 0%, hsl(234 25% 4%) 100%)",
      }}
    >
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* ─── Main grid ─── */}
        <div className="grid grid-cols-2 gap-8 sm:gap-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand column */}
          <div className="col-span-2 min-w-0 lg:col-span-2">
            <Link href={loc("/")} className="inline-flex items-center">
              <Image
                src="/logo.webp"
                alt="BetsPlug"
                width={120}
                height={48}
                className="h-10 w-auto"
              />
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#a3a9b8]">
              {t("footer.brandTagline")}
            </p>

            <ul className="mt-6 space-y-2 text-sm">
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

            {/* Socials */}
            <div className="mt-6 flex items-center gap-2">
              {socials.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[#a3a9b8] transition-all hover:border-[#4ade80]/50 hover:bg-[#4ade80]/10 hover:text-[#4ade80]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title={t("footer.product")} links={productLinks} />
          <FooterColumn title={t("footer.company")} links={companyLinks} />
          <FooterColumn title={t("footer.legal")} links={legalLinks} />
        </div>

        {/* ─── Payment + trust strip ─── */}
        <div
          className="relative mt-14 flex flex-col items-center gap-5 rounded-2xl border px-5 py-5 md:flex-row md:justify-between"
          style={{
            background: "hsl(230 16% 10% / 0.55)",
            borderColor: "hsl(0 0% 100% / 0.08)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="flex items-center gap-3">
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

          <div className="flex flex-wrap items-center justify-center gap-2 md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
            <VisaBadge />
            <MastercardBadge />
            <AmexBadge />
            <PayPalBadge />
            <ApplePayBadge />
          </div>

          <span className="pill" style={{ color: "#4ade80", borderColor: "hsl(var(--accent-green) / 0.3)" }}>
            <span className="live-dot" />
            {t("footer.pciCompliant")}
          </span>
        </div>

        {/* ─── Bottom bar ─── */}
        <div
          className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 md:flex-row"
          style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
        >
          <p className="text-xs text-[#6b7280]">
            © {new Date().getFullYear()} BetsPlug. {t("footer.copyright")}
          </p>
          <div className="flex items-center gap-5">
            {bottomLinkKeys.map(({ key, href }) => (
              <Link
                key={key}
                href={loc(href)}
                className="text-xs text-[#6b7280] transition-colors hover:text-[#4ade80]"
              >
                {t(key)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { text: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="mb-5 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
        {title}
      </h4>
      <ul className="space-y-3">
        {links.map(({ text, href }) => (
          <li key={text}>
            <Link
              href={href}
              className="text-sm text-[#a3a9b8] transition-colors hover:text-[#4ade80]"
            >
              {text}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BetsPlugFooter;
