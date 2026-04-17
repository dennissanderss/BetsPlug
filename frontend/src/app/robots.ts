import type { MetadataRoute } from "next";

/**
 * Dynamic robots.txt — served at /robots.txt
 * ────────────────────────────────────────────────────────────
 * Allows all crawlers on public pages. Blocks authenticated
 * app routes, the API surface and funnel pages that should not
 * be indexed. Points crawlers to the dynamic sitemap.
 */

const SITE_URL = "https://betsplug.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // API & admin
          "/api/",
          "/admin/",
          "/*/admin/",

          // Sanity Studio — CMS editing interface, no SEO value
          "/studio",
          "/studio/",
          "/*/studio",
          "/*/studio/",

          // Authenticated app shell
          "/dashboard/",
          "/*/dashboard/",

          // Account / subscription / favorites (authenticated)
          "/myaccount",
          "/*/mijn-account",
          "/*/mein-konto",
          "/*/mon-compte",
          "/*/mi-cuenta",
          "/*/il-mio-account",
          "/*/akaunti-yangu",
          "/*/akun-saya",
          "/subscription",
          "/*/abonnement", // nl/de/fr share this slug
          "/*/suscripcion",
          "/*/abbonamento",
          "/*/usajili",
          "/*/langganan",
          "/favorites",
          "/*/favorieten",
          "/*/favoriten",
          "/*/favoris",
          "/*/favoritos",
          "/*/preferiti",
          "/*/vipendwa",
          "/*/favorit",

          // Authenticated in-app routes that duplicate public canonicals.
          // `$` pins an exact match so siblings like `/about-us` remain
          // crawlable (disallow `/about` would otherwise swallow them).
          // "/about"   is the in-app product page; public canonical is "/about-us"
          "/about$",
          "/*/over-ons$",
          "/*/ueber-uns$",
          "/*/a-propos$",
          "/*/sobre-nosotros$",
          "/*/chi-siamo$",
          "/*/kuhusu$",
          "/*/tentang$",
          // "/predictions"  is the auth'd dashboard; public canonical is "/match-predictions"
          "/predictions/",
          "/*/voorspellingen/",
          "/*/prognosen/",
          "/*/predictions/", // fr reuses en slug
          "/*/predicciones/",
          "/*/pronostici/",
          "/*/utabiri/",
          "/*/prediksi/",
          // "/trackrecord"  is the auth'd dashboard; public canonical is "/track-record"
          "/trackrecord",
          "/*/prestaties",
          "/*/bilanz",
          "/*/historique",
          "/*/historial",
          "/*/storico",
          "/*/rekodi",
          "/*/riwayat",

          // Funnel / conversion pages (no organic search value)
          "/checkout",
          "/*/afrekenen",
          "/*/kasse",
          "/*/paiement",
          "/*/pago",
          "/*/malipo",
          "/*/pembayaran",
          "/login",
          "/welcome",

          // Private reports, live data & internal feeds
          "/reports/",
          "/weekly-report/",
          "/search",
          "/live/",
          "/results/",
          "/deals/",
          "/strategy/",
          "/matches/",
          "/teams/",
          "/bet-of-the-day/",
          "/jouw-route/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
