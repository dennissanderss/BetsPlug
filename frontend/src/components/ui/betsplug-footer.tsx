"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Send,
  Twitter,
  Instagram,
  Youtube,
  MessageCircle,
  Mail,
  MapPin,
  ShieldCheck,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useLocalizedHref, useTranslations } from "@/i18n/locale-provider";
import {
  VisaBadge,
  MastercardBadge,
  AmexBadge,
  PayPalBadge,
  ApplePayBadge,
} from "./payment-badges";

/* ─────────────────────────────────────────────────────────────────
   Footer data
   ───────────────────────────────────────────────────────────────── */

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
    href: "https://www.instagram.com/betsplug_com?igsh=dzE0ZWJ5ZWlmczIz&utm_source=qr",
  },
  { icon: Youtube, label: "YouTube", href: "https://youtube.com/@betsplug" },
  { icon: Send, label: "Telegram", href: "https://t.me/betsplug" },
];

/* ─────────────────────────────────────────────────────────────────
   Footer
   ───────────────────────────────────────────────────────────────── */

export function BetsPlugFooter() {
  const { t } = useTranslations();
  const loc = useLocalizedHref();

  const productLinksT = [
    { text: t("nav.predictions"), href: loc("/match-predictions") },
    { text: t("nav.trackRecord"), href: "#track-record" },
    { text: t("nav.howItWorks"), href: "#how-it-works" },
    { text: t("nav.pricing"), href: "#pricing" },
  ];
  const companyLinksT = [
    { text: t("footer.aboutUs"), href: loc("/about") },
    { text: t("footer.ourModels"), href: loc("/about") + "#models" },
    { text: t("nav.articles"), href: loc("/articles") },
    { text: t("footer.contact"), href: loc("/contact") },
    { text: t("b2b.badge"), href: loc("/b2b") },
  ];
  const legalLinksT = [
    { text: t("footer.termsOfService"), href: loc("/terms") },
    { text: t("footer.privacyPolicy"), href: loc("/privacy") },
    { text: t("footer.cookiePolicy"), href: loc("/cookies") },
    { text: t("footer.responsibleGambling"), href: loc("/responsible-gambling") },
  ];

  return (
    <footer className="relative w-full overflow-hidden bg-[#050505] pt-16 pb-10">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* ═══════════════════════════════════════════════════════════
            PREMIUM TELEGRAM CTA — hard-edge panel
            ═══════════════════════════════════════════════════════════ */}
        <div className="relative mb-20 overflow-hidden border border-[#4ade80]/30 bg-[#0a0a0a] p-8 md:p-12">
          {/* Corner brackets */}
          <span className="pointer-events-none absolute left-[-1px] top-[-1px] h-4 w-4 border-l-2 border-t-2 border-[#4ade80]" />
          <span className="pointer-events-none absolute right-[-1px] top-[-1px] h-4 w-4 border-r-2 border-t-2 border-[#4ade80]" />
          <span className="pointer-events-none absolute left-[-1px] bottom-[-1px] h-4 w-4 border-l-2 border-b-2 border-[#4ade80]" />
          <span className="pointer-events-none absolute right-[-1px] bottom-[-1px] h-4 w-4 border-r-2 border-b-2 border-[#4ade80]" />

          <div className="relative grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 border border-[#4ade80]/50 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#4ade80]">
                <Sparkles className="h-3 w-3" />
                {t("footer.premiumBadge")}
              </div>

              <h3 className="text-display text-3xl text-white md:text-4xl lg:text-5xl">
                {t("footer.premiumTitleA")}{" "}
                <span className="text-[#4ade80]">{t("footer.premiumTitleB")}</span>
                <br className="hidden sm:block" /> {t("footer.premiumTitleC")}
              </h3>

              <p className="mt-5 max-w-lg text-base leading-relaxed text-[#a3a3a3]">
                {t("footer.premiumSubtitle")}
              </p>

              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {[
                  t("footer.perk1"),
                  t("footer.perk2"),
                  t("footer.perk3"),
                  t("footer.perk4"),
                ].map((perk) => (
                  <li
                    key={perk}
                    className="flex items-center gap-2.5 text-sm text-[#ededed]"
                  >
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#4ade80]" strokeWidth={2.5} />
                    {perk}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="https://t.me/betsplug"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-lime inline-flex items-center gap-2"
                >
                  <Send className="h-3.5 w-3.5" />
                  {String(t("footer.joinCta")).toUpperCase()} →
                </a>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#707070]">
                  {t("footer.limited")}
                </span>
              </div>
            </div>

            {/* Right visual */}
            <div className="relative hidden md:flex md:justify-end">
              <div className="relative w-full max-w-[320px] border border-[#4ade80]/25 bg-[#050505] p-6">
                <span className="pointer-events-none absolute left-[-1px] top-[-1px] h-3 w-3 border-l-2 border-t-2 border-[#4ade80]" />
                <span className="pointer-events-none absolute right-[-1px] bottom-[-1px] h-3 w-3 border-r-2 border-b-2 border-[#4ade80]" />

                {/* Terminal header */}
                <div className="mb-4 flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-[#ef4444]" />
                    <span className="h-1.5 w-1.5 bg-[#fbbf24]" />
                    <span className="h-1.5 w-1.5 bg-[#4ade80]" />
                  </div>
                  <span className="mono-label-lime">VIP / TG</span>
                </div>

                <div className="mb-4 flex h-12 w-12 items-center justify-center bg-[#4ade80]">
                  <Send className="h-6 w-6 text-[#050505]" strokeWidth={2.5} />
                </div>
                <p className="mono-label-lime">BETSPLUG VIP</p>
                <p className="mt-1 text-display text-xl text-white">
                  PREMIUM GROUP
                </p>

                <div className="mt-5 space-y-1.5 text-[11px]">
                  <div className="border-l-2 border-[#ef4444] bg-white/[0.03] px-3 py-2 text-[#ededed]">
                    🔥 Value pick: Arsenal ML @ 2.10
                  </div>
                  <div className="ml-6 border-l-2 border-[#4ade80] bg-[#4ade80]/[0.08] px-3 py-2 text-[#86efac]">
                    Edge +6.2% · Confidence 78%
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#707070]">
                  <span className="live-dot" />
                  <span>1,200+ {String(t("footer.onlineNow")).toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            MAIN FOOTER GRID
            ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-8 sm:gap-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand column */}
          <div className="col-span-2 min-w-0 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/logo.webp"
                alt="BetsPlug logo"
                width={100}
                height={40}
                className="h-10 w-auto drop-shadow-[0_0_20px_rgba(74,222,128,0.4)]"
              />
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">
              {t("footer.brandTagline")}
            </p>

            {/* Contact */}
            <ul className="mt-6 space-y-2 text-sm">
              <li className="flex min-w-0 items-center gap-2 text-slate-400">
                <Mail className="h-4 w-4 shrink-0 text-green-400" />
                <a
                  href="mailto:support@betsplug.com"
                  className="min-w-0 truncate transition-colors hover:text-white"
                >
                  support@betsplug.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <MapPin className="h-4 w-4 text-green-400" />
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
                  className="flex h-9 w-9 items-center justify-center border border-white/10 bg-[#0a0a0a] text-[#a3a3a3] transition-all hover:border-[#4ade80]/50 hover:text-[#4ade80]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-5 mono-label-lime">
              {t("footer.product")}
            </h4>
            <ul className="space-y-3">
              {productLinksT.map(({ text, href }) => (
                <li key={text}>
                  <Link
                    href={href}
                    className="text-sm text-slate-400 transition-colors hover:text-green-400"
                  >
                    {text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-5 mono-label-lime">
              {t("footer.company")}
            </h4>
            <ul className="space-y-3">
              {companyLinksT.map(({ text, href }) => (
                <li key={text}>
                  <Link
                    href={href}
                    className="text-sm text-slate-400 transition-colors hover:text-green-400"
                  >
                    {text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-5 mono-label-lime">
              {t("footer.legal")}
            </h4>
            <ul className="space-y-3">
              {legalLinksT.map(({ text, href }) => (
                <li key={text}>
                  <Link
                    href={href}
                    className="text-sm text-slate-400 transition-colors hover:text-green-400"
                  >
                    {text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            PAYMENT / SECURITY STRIP
            ═══════════════════════════════════════════════════════════ */}
        <div className="relative mt-16 flex flex-col items-center gap-6 border border-white/[0.08] bg-[#0a0a0a] px-6 py-5 md:flex-row md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border border-[#4ade80]/40 bg-[#4ade80]/[0.08]">
              <ShieldCheck className="h-4 w-4 text-[#4ade80]" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{t("footer.secureTitle")}</p>
              <p className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-[#707070]">
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

          <div className="flex items-center gap-2 border border-[#4ade80]/30 px-3 py-1.5">
            <span className="live-dot" />
            <span className="mono-label-lime">
              {t("footer.pciCompliant")}
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            BOTTOM BAR
            ═══════════════════════════════════════════════════════════ */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/[0.08] pt-6 md:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} BetsPlug. {t("footer.copyright")}
          </p>
          <div className="flex items-center gap-5">
            {bottomLinkKeys.map(({ key, href }) => (
              <Link
                key={key}
                href={loc(href)}
                className="text-xs text-slate-500 transition-colors hover:text-green-400"
              >
                {t(key)}
              </Link>
            ))}
            <div className="hidden items-center gap-1.5 border border-white/[0.08] px-2.5 py-1 md:flex">
              <MessageCircle className="h-3 w-3 text-[#4ade80]" />
              <span className="mono-label">{t("footer.responsible")}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
