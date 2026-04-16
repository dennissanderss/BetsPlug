import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Exo_2 } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AppProviders } from "@/components/layout/providers";
import { LocaleProvider } from "@/i18n/locale-provider";
import { getServerLocale, getLocalizedAlternates } from "@/lib/seo-helpers";
import { PAGE_META } from "@/data/page-meta";

// Exo 2 — geometric sans with sport/tech feel, loaded via next/font/google
// for automatic self-hosting and zero layout shift.
// letter-spacing is tightened slightly to keep text compact like Lato.
const exo2 = Exo_2({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-brand",
  display: "swap",
});

const SITE_URL = "https://betsplug.com";

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
   BetsPlug social card at the Open Graph standard 1200×630 (1.91:1).
   Renders correctly on Facebook, LinkedIn, WhatsApp, iMessage,
   Discord, Slack, Twitter `summary_large_image`, and Google rich
   snippets without any platform cropping. Per-page metadata
   (articles, league hubs, learn pillars, …) can override this with
   a more specific image; pages that don't override fall back to
   this brand card. Lives in /public/og-image.png. */
const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "BetsPlug · AI-Driven football predictions",
} as const;

/* ── Locale-aware metadata ────────────────────────────────────
   Reads the NEXT_LOCALE cookie (set by the middleware before
   every request) and builds canonical + hreflang + translated
   title/description accordingly. */
export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const meta = PAGE_META["/"]?.[locale] ?? PAGE_META["/"].en;
  const alternates = getLocalizedAlternates("/");

  return {
    metadataBase: new URL(SITE_URL),
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
    icons: {
      // Browser tab + pinned-tab favicon: the standalone plug mark
      // (separate from the full logo, which stays the Apple touch icon).
      icon: [{ url: "/favicon.png", type: "image/png" }],
      shortcut: "/favicon.png",
      apple: "/favicon.png",
    },
    openGraph: {
      type: "website",
      siteName: "BetsPlug",
      url: alternates.canonical,
      title: meta.ogTitle ?? meta.title,
      description: meta.ogDescription ?? meta.description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      site: "@betsplug",
      creator: "@betsplug",
      title: meta.ogTitle ?? meta.title,
      description: meta.ogDescription ?? meta.description,
      images: [OG_IMAGE.url],
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Resolve via the shared helper so <html lang> matches the locale
  // that generateMetadata() used. Reads x-locale header first (set by
  // middleware on every rewrite) then falls back to the cookie.
  const locale = getServerLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={exo2.variable}
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
