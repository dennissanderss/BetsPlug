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
    // ─ Site-wide security headers ─────────────────────────────
    // Conservative defaults that don't break the site:
    //   • HSTS with 2-year max-age + preload eligibility (HTTPS-only,
    //     prevents protocol-downgrade attacks that intercept first
    //     visits before they get the redirect to https).
    //   • X-Content-Type-Options: nosniff — prevent MIME-confusion
    //     attacks (e.g. a .json response sniffed as <script>).
    //   • Referrer-Policy: strict-origin-when-cross-origin — strip
    //     URL paths from cross-origin Referer headers (privacy +
    //     prevents leaking auth tokens via Referer).
    //   • X-Frame-Options: SAMEORIGIN — same as the embed-protection
    //     supported by every modern browser.
    //   • Permissions-Policy: explicitly deny browser APIs we don't
    //     need (camera, microphone, geolocation, FLoC interest cohort).
    //
    // Deliberately NOT set:
    //   • Content-Security-Policy — would need a per-deploy nonce or
    //     hash for inline GTM/Stripe scripts; deserves its own PR.
    //     Track via Report-Only first.
    //   • X-XSS-Protection — deprecated, ignored by modern browsers.
    const securityHeaders = [
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      },
    ];

    return [
      {
        // Apply security headers to every route except the static
        // asset pipeline (which Vercel already optimizes).
        source: "/:path*",
        headers: securityHeaders,
      },
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

      // Blog removed 2026-04-27 — every /articles* URL plus its 6
      // localized slug variants 301 → /learn so any inbound link or
      // search-engine entry preserves intent (educational guides on
      // football analytics) instead of a dead 404. Catch-all `:slug*`
      // covers /articles/foo, /articles/foo/bar, etc.
      { source: "/articles", destination: "/learn", permanent: true },
      { source: "/articles/:slug*", destination: "/learn", permanent: true },
      { source: "/nl/artikelen", destination: "/nl/leren", permanent: true },
      { source: "/nl/artikelen/:slug*", destination: "/nl/leren", permanent: true },
      { source: "/de/artikel", destination: "/de/lernen", permanent: true },
      { source: "/de/artikel/:slug*", destination: "/de/lernen", permanent: true },
      { source: "/fr/articles", destination: "/fr/apprendre", permanent: true },
      { source: "/fr/articles/:slug*", destination: "/fr/apprendre", permanent: true },
      { source: "/es/articulos", destination: "/es/aprender", permanent: true },
      { source: "/es/articulos/:slug*", destination: "/es/aprender", permanent: true },
      { source: "/it/articoli", destination: "/it/impara", permanent: true },
      { source: "/it/articoli/:slug*", destination: "/it/impara", permanent: true },
      { source: "/sw/makala", destination: "/sw/jifunze", permanent: true },
      { source: "/sw/makala/:slug*", destination: "/sw/jifunze", permanent: true },
      { source: "/id/artikel", destination: "/id/belajar", permanent: true },
      { source: "/id/artikel/:slug*", destination: "/id/belajar", permanent: true },
      // Parked locales (pt/tr/pl/ro/ru/el/da/sv) used the EN slug
      // /articles, so the catch-all above already covers them.
    ];
  },
};

module.exports = nextConfig;
