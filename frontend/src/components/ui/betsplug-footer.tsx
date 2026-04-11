"use client";

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
import { BET_TYPE_HUBS } from "@/data/bet-type-hubs";
import { LEARN_PILLARS } from "@/data/learn-pillars";
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
  const { t, locale } = useTranslations();
  const loc = useLocalizedHref();

  // Bet-type hubs and learn pillars currently ship EN + NL copy;
  // every other locale falls back to EN until handwritten
  // translations land. Slugs are always English.
  const hubLocale: "en" | "nl" = locale === "nl" ? "nl" : "en";

  const betTypeLinks = BET_TYPE_HUBS.map((hub) => ({
    text: hub.name[hubLocale],
    href: loc(`/bet-types/${hub.slug}`),
  }));
  const learnLinks = LEARN_PILLARS.map((pillar) => ({
    text: pillar.title[hubLocale],
    href: loc(`/learn/${pillar.slug}`),
  }));

  const productLinksT = [
    { text: t("nav.predictions"), href: loc("/match-predictions") },
    { text: t("nav.trackRecord"), href: "#track-record" },
    { text: t("nav.howItWorks"), href: "#how-it-works" },
    { text: t("nav.pricing"), href: "#pricing" },
    { text: t("footer.comparison"), href: "#comparison" },
  ];
  const companyLinksT = [
    { text: t("footer.aboutUs"), href: loc("/about") },
    { text: t("footer.ourModels"), href: loc("/about") + "#models" },
    { text: t("nav.articles"), href: loc("/articles") },
    { text: t("footer.contact"), href: loc("/contact") },
  ];
  const legalLinksT = [
    { text: t("footer.termsOfService"), href: "/terms" },
    { text: t("footer.privacyPolicy"), href: "/privacy" },
    { text: t("footer.cookiePolicy"), href: "/cookies" },
  ];

  return (
    <footer className="relative w-full overflow-hidden pt-16 pb-10">
      {/* ── Background ── */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#070a13] to-[#050811]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(74,222,128,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.6) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[15%] top-10 h-[420px] w-[420px] rounded-full bg-green-500/[0.07] blur-[140px]" />
        <div className="absolute right-[15%] bottom-0 h-[360px] w-[360px] rounded-full bg-emerald-500/[0.05] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* ═══════════════════════════════════════════════════════════
            PREMIUM TELEGRAM CTA — glass card (replaces newsletter)
            ═══════════════════════════════════════════════════════════ */}
        <div className="relative mb-20 overflow-hidden rounded-3xl border border-green-500/20 bg-gradient-to-br from-green-500/[0.08] via-white/[0.02] to-white/[0.01] p-8 backdrop-blur-xl md:p-12">
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full bg-green-500/[0.18] blur-[100px]" />
          <div className="pointer-events-none absolute -left-10 -bottom-20 h-[240px] w-[240px] rounded-full bg-emerald-500/[0.12] blur-[90px]" />

          <div className="relative grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
            <div>
              {/* Badge */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-green-400">
                <Sparkles className="h-3.5 w-3.5" />
                {t("footer.premiumBadge")}
              </div>

              <h3 className="text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl">
                {t("footer.premiumTitleA")}{" "}
                <span className="gradient-text">{t("footer.premiumTitleB")}</span>
                <br className="hidden sm:block" /> {t("footer.premiumTitleC")}
              </h3>

              <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-400">
                {t("footer.premiumSubtitle")}
              </p>

              {/* Perk bullets */}
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {[
                  t("footer.perk1"),
                  t("footer.perk2"),
                  t("footer.perk3"),
                  t("footer.perk4"),
                ].map((perk) => (
                  <li
                    key={perk}
                    className="flex items-center gap-2 text-sm text-slate-300"
                  >
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-400" />
                    {perk}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="https://t.me/betsplug"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gradient group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-lg shadow-green-500/20"
                >
                  <Send className="h-4 w-4" />
                  {t("footer.joinCta")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
                <span className="text-xs font-medium text-slate-500">
                  {t("footer.limited")}
                </span>
              </div>
            </div>

            {/* Right visual */}
            <div className="relative hidden md:flex md:justify-end">
              <div className="relative">
                <div className="absolute inset-0 rotate-6 rounded-3xl bg-green-500/15 blur-xl" />
                <div className="relative flex h-72 w-72 flex-col items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-[#0d1220] to-[#080b14] p-6 shadow-2xl">
                  {/* Phone-like mockup */}
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-[0_0_30px_rgba(74,222,128,0.5)]">
                    <Send className="h-7 w-7 text-[#04130a]" strokeWidth={2.5} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-green-400">
                    BetsPlug VIP
                  </p>
                  <p className="mt-1 text-xl font-extrabold text-white">
                    Premium Group
                  </p>

                  {/* Mock chat bubbles */}
                  <div className="mt-5 w-full space-y-2">
                    <div className="rounded-2xl rounded-bl-sm bg-white/[0.05] px-3 py-2 text-[11px] text-slate-300">
                      🔥 Value pick: Arsenal ML @ 2.10
                    </div>
                    <div className="ml-6 rounded-2xl rounded-br-sm bg-green-500/20 px-3 py-2 text-[11px] text-green-200">
                      Edge: +6.2% · Confidence 78%
                    </div>
                  </div>

                  {/* Live indicator */}
                  <div className="mt-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <span className="live-dot" />
                    {t("footer.onlineNow")}
                  </div>
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
              <img
                src="/logo.webp"
                alt="BetsPlug"
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
            <div className="mt-6 flex items-center gap-3">
              {socials.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.03] text-slate-400 backdrop-blur-sm transition-all hover:border-green-500/40 hover:bg-green-500/10 hover:text-green-400"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-widest text-white">
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
            <h4 className="mb-5 text-sm font-bold uppercase tracking-widest text-white">
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
            <h4 className="mb-5 text-sm font-bold uppercase tracking-widest text-white">
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
            RESOURCES — bet-type hubs + learn pillars (SEO link block)
            ═══════════════════════════════════════════════════════════ */}
        <div className="mt-14 grid gap-10 border-t border-white/[0.06] pt-10 sm:grid-cols-2">
          {/* Bet Types */}
          <div>
            <div className="mb-5 flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-widest text-white">
                {t("footer.betTypes")}
              </h4>
              <Link
                href={loc("/bet-types")}
                className="text-[11px] font-semibold uppercase tracking-wider text-green-400 transition-colors hover:text-green-300"
              >
                {t("footer.viewAll")} →
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {betTypeLinks.map(({ text, href }) => (
                <li key={href}>
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

          {/* Learn */}
          <div>
            <div className="mb-5 flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-widest text-white">
                {t("footer.learn")}
              </h4>
              <Link
                href={loc("/learn")}
                className="text-[11px] font-semibold uppercase tracking-wider text-green-400 transition-colors hover:text-green-300"
              >
                {t("footer.viewAll")} →
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {learnLinks.map(({ text, href }) => (
                <li key={href}>
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
        <div className="relative mt-16 flex flex-col items-center gap-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-6 backdrop-blur-sm md:flex-row md:justify-between">
          {/* Secure payments label */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/30">
              <ShieldCheck className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{t("footer.secureTitle")}</p>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <Lock className="h-3 w-3" />
                {t("footer.secureDesc")}
              </p>
            </div>
          </div>

          {/* Payment badges — absolutely centered on md+, inline stack on mobile */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
            <VisaBadge />
            <MastercardBadge />
            <AmexBadge />
            <PayPalBadge />
            <ApplePayBadge />
          </div>

          {/* Trust seal */}
          <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/[0.06] px-4 py-2">
            <span className="live-dot" />
            <span className="text-xs font-bold uppercase tracking-wider text-green-400">
              {t("footer.pciCompliant")}
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            BOTTOM BAR
            ═══════════════════════════════════════════════════════════ */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-6 md:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} BetsPlug. {t("footer.copyright")}
          </p>
          <div className="flex items-center gap-5">
            {bottomLinkKeys.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                className="text-xs text-slate-500 transition-colors hover:text-green-400"
              >
                {t(key)}
              </Link>
            ))}
            <div className="hidden items-center gap-1.5 rounded-full bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 md:flex">
              <MessageCircle className="h-3 w-3 text-green-400" />
              {t("footer.responsible")}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
