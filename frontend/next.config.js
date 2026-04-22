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
      // Deleted 2026-04-18 via commit 7efbc3c — authed /live scoreboard
      // was removed. Locale-prefixed variants point straight at
      // /dashboard (no /xx prefix) now that the i18n middleware
      // 308-redirects every /xx/ prefix to canonical EN anyway. One-
      // hop chain instead of two.
      { source: "/live", destination: "/dashboard", permanent: true },
      { source: "/nl/live", destination: "/dashboard", permanent: true },
      { source: "/de/live", destination: "/dashboard", permanent: true },
      { source: "/fr/en-direct", destination: "/dashboard", permanent: true },
      { source: "/es/en-vivo", destination: "/dashboard", permanent: true },
      { source: "/it/live", destination: "/dashboard", permanent: true },
      { source: "/sw/moja-kwa-moja", destination: "/dashboard", permanent: true },
      { source: "/id/langsung", destination: "/dashboard", permanent: true },

      // Same story for /settings — redundant with /myaccount.
      { source: "/settings", destination: "/myaccount", permanent: true },
      { source: "/nl/instellingen", destination: "/myaccount", permanent: true },
      { source: "/de/einstellungen", destination: "/myaccount", permanent: true },
      { source: "/fr/parametres", destination: "/myaccount", permanent: true },
      { source: "/it/impostazioni", destination: "/myaccount", permanent: true },
      { source: "/sw/mipangilio", destination: "/myaccount", permanent: true },
      { source: "/id/pengaturan", destination: "/myaccount", permanent: true },
    ];
  },
};

module.exports = nextConfig;
