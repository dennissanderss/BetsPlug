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
  ArrowRight,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import { Pill } from "@/components/noct/pill";
import { HexBadge } from "@/components/noct/hex-badge";
import {
  VisaBadge,
  MastercardBadge,
  AmexBadge,
  PayPalBadge,
  ApplePayBadge,
} from "./payment-badges";

const socialLinks = [
  { icon: Twitter, label: "Twitter", href: "https://twitter.com/betsplug" },
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/betsplug_com" },
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
  const contactInfo = [
    { icon: Mail, text: "support@betsplug.com", href: "mailto:support@betsplug.com" },
    { icon: MapPin, text: "Netherlands", isAddress: true },
  ];

  return (
    <footer className="relative z-10 mt-8 w-full overflow-hidden pt-16 pb-8">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute top-0 left-1/2 z-0 h-full w-full -translate-x-1/2 select-none">
        <div
          className="absolute -top-32 left-1/4 h-72 w-72 rounded-full"
          style={{ background: "hsl(var(--accent-green) / 0.15)", filter: "blur(100px)" }}
        />
        <div
          className="absolute right-1/4 -bottom-24 h-80 w-80 rounded-full"
          style={{ background: "hsl(var(--accent-purple) / 0.12)", filter: "blur(100px)" }}
        />
      </div>

      {/* ═══ Telegram CTA banner ═══ */}
      <div className="relative z-10 mx-auto mb-12 max-w-6xl px-4 sm:px-6">
        <div
          className="card-neon card-neon-green halo-green relative overflow-hidden rounded-2xl p-6 sm:p-8"
        >
          {/* Inner glow accent */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-[260px] w-[260px] rounded-full"
            style={{ background: "hsl(var(--accent-green) / 0.25)", filter: "blur(80px)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 -bottom-16 h-[220px] w-[220px] rounded-full"
            style={{ background: "hsl(var(--accent-purple) / 0.2)", filter: "blur(80px)" }}
          />

          <div className="relative flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div className="flex items-start gap-4">
              <HexBadge variant="green" size="lg" className="hidden shrink-0 sm:flex">
                <Send className="h-6 w-6" />
              </HexBadge>
              <div>
                <Pill tone="active" className="mb-3">
                  <Sparkles className="h-3 w-3" />
                  Exclusive tips
                </Pill>
                <h3 className="text-heading text-xl text-[#ededed] sm:text-2xl">
                  Join our Telegram for{" "}
                  <span className="gradient-text-green">free daily picks</span>
                </h3>
                <p className="mt-2 max-w-md text-sm text-[#a3a9b8]">
                  Get real-time value alerts, edge picks and live chat with our AI analysts.
                  Be the first to know when a high-value match hits the board.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6b7280]">
                  <span className="flex items-center gap-1">
                    <span className="live-dot" />
                    1,200+ members online
                  </span>
                  <span>·</span>
                  <span>Free to join</span>
                  <span>·</span>
                  <span>Daily picks</span>
                </div>
              </div>
            </div>
            <a
              href="https://t.me/betsplug"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary shrink-0 gap-2"
            >
              <Send className="h-4 w-4" />
              Join Telegram
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* ═══ Main footer glass card ═══ */}
      <div
        className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-8 rounded-2xl px-6 py-10 md:flex-row md:items-start md:justify-between md:gap-12"
        style={{
          background: "hsl(var(--glass-2))",
          backdropFilter: "blur(24px) saturate(140%)",
          WebkitBackdropFilter: "blur(24px) saturate(140%)",
          border: "1px solid hsl(0 0% 100% / 0.08)",
        }}
      >
        {/* Brand column */}
        <div className="flex flex-col items-center md:items-start">
          <Link href={loc("/")} className="mb-4 flex items-center gap-2.5">
            <Image
              src="/logo.webp"
              alt="BetsPlug"
              width={120}
              height={48}
              className="h-10 w-auto"
            />
          </Link>
          <p className="mb-6 max-w-xs text-center text-sm leading-relaxed text-[#a3a9b8] md:text-left">
            {t("footer.brandTagline")}
          </p>

          {/* Contact info */}
          <ul className="mb-6 space-y-2.5 text-sm">
            {contactInfo.map(({ icon: Icon, text, href, isAddress }) => (
              <li key={text}>
                {href ? (
                  <a
                    href={href}
                    className="flex items-center justify-center gap-2 transition-colors hover:text-[#ededed] md:justify-start"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[#4ade80]" />
                    <span className="text-[#a3a9b8]">{text}</span>
                  </a>
                ) : (
                  <div className="flex items-center justify-center gap-2 md:justify-start">
                    <Icon className="h-4 w-4 shrink-0 text-[#4ade80]" />
                    {isAddress ? (
                      <address className="not-italic text-[#a3a9b8]">{text}</address>
                    ) : (
                      <span className="text-[#a3a9b8]">{text}</span>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Socials */}
          <div className="flex gap-3">
            {socialLinks.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#4ade80] transition-all hover:bg-[#4ade80]/10 hover:text-[#86efac]"
                style={{ border: "1px solid hsl(0 0% 100% / 0.08)" }}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        <nav className="flex w-full flex-col gap-8 text-center sm:flex-row sm:justify-end sm:text-left md:w-auto md:gap-12">
          <FooterCol title={t("footer.product")} links={productLinks} />
          <FooterCol title={t("footer.company")} links={companyLinks} />
          <FooterCol title={t("footer.legal")} links={legalLinks} />

          {/* Help / Support column */}
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#4ade80]">
              Support
            </div>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href={loc("/contact")}
                  className="text-[#a3a9b8] transition-colors hover:text-[#ededed]"
                >
                  {t("footer.contact")}
                </Link>
              </li>
              <li>
                <a
                  href="https://t.me/betsplug"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 text-[#a3a9b8] transition-colors hover:text-[#ededed]"
                >
                  <span>Live chat</span>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ade80] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4ade80]" />
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@betsplug.com"
                  className="text-[#a3a9b8] transition-colors hover:text-[#ededed]"
                >
                  Email support
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      {/* ═══ Payment + security strip ═══ */}
      <div className="relative z-10 mx-auto mt-6 flex max-w-6xl flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between sm:px-6">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-[#4ade80]" />
          <span className="text-xs text-[#6b7280]">
            {t("footer.secureTitle")}
          </span>
          <Lock className="h-3 w-3 text-[#6b7280]" />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <VisaBadge />
          <MastercardBadge />
          <AmexBadge />
          <PayPalBadge />
          <ApplePayBadge />
        </div>
        <Pill style={{ color: "#4ade80", borderColor: "hsl(var(--accent-green) / 0.3)" }}>
          <span className="live-dot" />
          {t("footer.pciCompliant")}
        </Pill>
      </div>

      {/* ═══ Bottom copyright ═══ */}
      <div className="relative z-10 mx-auto mt-8 max-w-6xl px-4 sm:px-6">
        <div
          className="flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-[#6b7280] sm:flex-row"
          style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
        >
          <span>© {new Date().getFullYear()} BetsPlug. {t("footer.copyright")}</span>
          <div className="flex items-center gap-4">
            <Link href={loc("/privacy")} className="transition-colors hover:text-[#4ade80]">
              {t("footer.bottomPrivacy")}
            </Link>
            <Link href={loc("/terms")} className="transition-colors hover:text-[#4ade80]">
              {t("footer.bottomTerms")}
            </Link>
            <Link href={loc("/cookies")} className="transition-colors hover:text-[#4ade80]">
              {t("footer.bottomCookies")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { text: string; href: string }[];
}) {
  return (
    <div>
      <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#4ade80]">
        {title}
      </div>
      <ul className="space-y-2.5 text-sm">
        {links.map(({ text, href }) => (
          <li key={text}>
            <Link
              href={href}
              className="text-[#a3a9b8] transition-colors hover:text-[#ededed]"
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
