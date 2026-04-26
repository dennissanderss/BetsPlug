import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Exo_2 } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AppProviders } from "@/components/layout/providers";
import { LocaleProvider } from "@/i18n/locale-provider";
import { LocaleSanityCheck } from "@/components/dev/LocaleSanityCheck";
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
   this brand card. Served as JPG (175KB) instead of PNG (935KB) —
   every social scraper supports JPG and the file is ~5× smaller. */
const OG_IMAGE = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "BetsPlug · AI-Driven football predictions",
  type: "image/jpeg",
} as const;

/* ── Locale-aware metadata (EN-canonical, 2026-04-23) ─────────
   `<title>` and `<meta description>` follow the visitor's locale
   so translated pages show translated tab titles. Canonical stays
   EN-absolute regardless of locale — /nl/, /de/, … are rewritten
   to this page and tagged noindex by the middleware, so only the
   English URL is ever indexable. No hreflang is emitted. */
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
      // Browser tab favicon — served at the right size per viewport
      // density. Replaces the old single 1254×1254 / 333KB file that
      // browsers were downscaling on every page load.
      icon: [
        { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
        { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      ],
      shortcut: "/favicon-32.png",
      // iOS home-screen icon (180×180 is the current Apple spec).
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
    manifest: "/manifest.webmanifest",
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
  // Resolve via the shared helper so <html lang> matches the
  // visitor's active locale — important for screen readers on
  // translated pages. The URL is still rewritten to the canonical
  // EN path and tagged noindex, so only the English URL enters
  // Google's index.
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
          {/* Dev-only sanity check that flags pages whose body
              text reads as a different language than the URL
              locale. Renders nothing in production. */}
          <LocaleSanityCheck locale={locale} />
        </LocaleProvider>
      </body>
    </html>
  );
}
