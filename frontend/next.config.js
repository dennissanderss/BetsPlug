/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.sanity.io" },
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
};

module.exports = nextConfig;
