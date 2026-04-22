/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    // Serve AVIF when the browser accepts it (smallest), falling back
    // to WebP (universal modern support), then the original format.
    // next/image auto-negotiates per request via the Accept header.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "media.api-sports.io" },
    ],
  },
  async headers() {
    return [
      {
        // Browsers only apply the XSLT transform reliably when the
        // stylesheet is served with an XML-y MIME type. Next.js's
        // default static-file MIME for .xsl can be application/octet-
        // stream depending on the platform, which silently breaks
        // the styled sitemap view. Pinning text/xsl avoids that.
        source: "/sitemap.xsl",
        headers: [
          { key: "Content-Type", value: "text/xsl; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Deleted 2026-04-18 via commit 7efbc3c. The authed /live
      // scoreboard page was removed but 8 locale variants had been
      // in routes.ts for 11+ days — Google had crawled them and
      // still holds them in its index. Without these 301s every
      // attempted crawl of the old URL returns a hard 404, which
      // degrades the crawl quality signal for the whole domain.
      // 301 → /dashboard (authed home; the Live Now widget there
      // still works, which matches user intent).
      { source: "/live", destination: "/dashboard", permanent: true },
      { source: "/nl/live", destination: "/nl/dashboard", permanent: true },
      { source: "/de/live", destination: "/de/dashboard", permanent: true },
      { source: "/fr/en-direct", destination: "/fr/tableau-de-bord", permanent: true },
      { source: "/es/en-vivo", destination: "/es/panel", permanent: true },
      { source: "/it/live", destination: "/it/pannello", permanent: true },
      { source: "/sw/moja-kwa-moja", destination: "/sw/dashibodi", permanent: true },
      { source: "/id/langsung", destination: "/id/dasbor", permanent: true },

      // Same story for /settings — removed 2026-04-18 via commit
      // 188c307, redundant with /myaccount. Only 7 locales had a
      // translated slug (es fell back to /settings via the shared EN
      // map), so we redirect 7 localized forms + the EN default.
      { source: "/settings", destination: "/myaccount", permanent: true },
      { source: "/nl/instellingen", destination: "/nl/mijn-account", permanent: true },
      { source: "/de/einstellungen", destination: "/de/mein-konto", permanent: true },
      { source: "/fr/parametres", destination: "/fr/mon-compte", permanent: true },
      { source: "/it/impostazioni", destination: "/it/il-mio-account", permanent: true },
      { source: "/sw/mipangilio", destination: "/sw/akaunti-yangu", permanent: true },
      { source: "/id/pengaturan", destination: "/id/akun-saya", permanent: true },
    ];
  },
};

module.exports = nextConfig;
