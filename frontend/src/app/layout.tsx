import type { Metadata, Viewport } from "next";
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

/* ── Viewport ─────────────────────────────────────────────
   Explicit viewport so iOS Safari never auto-zooms on form
   focus. We intentionally allow user pinch-zoom (no
   maximumScale) for accessibility — the zoom-on-focus
   prevention is handled by the 16px font-size rule in
   globals.css. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/* ── Site-wide OpenGraph image ─────────────────────────────────
   Square BetsPlug logo on dark navy background. Per-page metadata
   (articles, league hubs, learn pillars, …) can still override
   this with a more specific image; pages that don't override fall
   back to this brand card. Lives in /public/og-image.png so it's
   served as a static asset under the canonical SITE_URL. */
const OG_IMAGE = {
  url: "/og-image.png",
  width: 2048,
  height: 2048,
  alt: "BetsPlug — AI-Powered Sports Analytics",
} as const;

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
  openGraph: {
    type: "website",
    siteName: "BetsPlug",
    url: SITE_URL,
    title: "BetsPlug - AI-Powered Sports Analytics",
    description:
      "Premium AI-powered sports analytics. Data-driven predictions, live match tracking, and deep performance insights.",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    site: "@betsplug",
    creator: "@betsplug",
    title: "BetsPlug - AI-Powered Sports Analytics",
    description:
      "Premium AI-powered sports analytics. Data-driven predictions, live match tracking, and deep performance insights.",
    images: [OG_IMAGE.url],
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
      <body className="min-h-screen font-sans font-normal antialiased">
        {/* Google Tag Manager — CookieYes CMP template (inside GTM) handles
            Google Consent Mode v2 defaults; do NOT add a custom gcm script. */}
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-N7K574H7');`}
        </Script>

        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-N7K574H7"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* GA4 is deployed as a tag inside GTM (with CookieYes consent
            trigger), so there's no hardcoded gtag here. */}

        <LocaleProvider locale={locale}>
          <AppProviders>{children}</AppProviders>
        </LocaleProvider>
      </body>
    </html>
  );
}
