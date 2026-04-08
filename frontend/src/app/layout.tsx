import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Lato } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";
import "./globals.css";
import { AppProviders } from "@/components/layout/providers";
import { LocaleProvider } from "@/i18n/locale-provider";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  locales,
  localeMeta,
} from "@/i18n/config";

// Lato — free, open-source humanist sans loaded via next/font/google
// for automatic self-hosting and zero layout shift.
const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-brand",
  display: "swap",
});

const SITE_URL = "https://betsplug.com";

/* ── hreflang alternates for SEO ──────────────────────────────
   Emits <link rel="alternate" hreflang="nl" href="…/nl" /> etc.
   plus x-default pointing to the canonical English URL.       */
const languageAlternates: Record<string, string> = locales.reduce(
  (acc, l) => {
    const tag = localeMeta[l].hreflang;
    acc[tag] = l === defaultLocale ? SITE_URL : `${SITE_URL}/${l}`;
    return acc;
  },
  { "x-default": SITE_URL } as Record<string, string>
);

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "BetsPlug - AI-Powered Sports Analytics",
  description:
    "Premium AI-powered sports analytics. Data-driven predictions, live match tracking, and deep performance insights.",
  alternates: {
    canonical: "/",
    languages: languageAlternates,
  },
  icons: {
    icon: [{ url: "/logo.webp", type: "image/webp" }],
    shortcut: "/logo.webp",
    apple: "/logo.webp",
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Middleware has already set the cookie to a valid locale.
  const cookieStore = cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(raw) ? raw : defaultLocale;

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={lato.variable}
    >
      <head>
        {/* Google Tag Manager */}
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-N7K574H7');`}
        </Script>
      </head>
      <body className="min-h-screen font-sans font-normal antialiased">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-N7K574H7"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* Google Analytics 4 (gtag) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-8G6DRPYZ0E"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-8G6DRPYZ0E');
          `}
        </Script>

        <LocaleProvider locale={locale}>
          <AppProviders>{children}</AppProviders>
        </LocaleProvider>
      </body>
    </html>
  );
}
