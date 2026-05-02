// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://betsplug.com",

  // Locales — see docs/specs/16-i18n.md.
  // Default locale (en) is served at "/", others at "/{code}/".
  // No fallback config — every localized route is rendered explicitly
  // by its dedicated locale page or the [locale]/[slug] dispatcher.
  // The fallback was previously creating 0-byte mirror files for
  // legacy NOCTURNE pages that haven't been migrated yet AND was
  // claiming /{locale}/track-record before our dispatcher could.
  i18n: {
    defaultLocale: "en",
    locales: ["en", "nl", "de", "fr", "es", "it"],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },

  // Safety-net redirects — paths that belong on the authed surface
  // (app.betsplug.com) but might still be hit on the marketing
  // domain because of stale Stripe Customer Portal redirects, old
  // emails, or browser cache. Each is 308'd to the equivalent path
  // on app.betsplug.com so a returning subscriber never sees a
  // Vercel 404 mid-flow.
  //
  // NOTE — `/predictions` and `/track-record` are NOT redirected:
  // both are marketing hubs in the new sitemap (see
  // docs/specs/01-site-architecture.md). Old behavior was to bounce
  // to app.betsplug.com; that's removed now so the new public
  // hubs can live at those paths.
  redirects: {
    "/subscription":     { status: 308, destination: "https://app.betsplug.com/subscription" },
    "/myaccount":        { status: 308, destination: "https://app.betsplug.com/myaccount" },
    "/dashboard":        { status: 308, destination: "https://app.betsplug.com/dashboard" },
    "/trackrecord":      { status: 308, destination: "https://app.betsplug.com/trackrecord" },
    "/bet-of-the-day":   { status: 308, destination: "https://app.betsplug.com/bet-of-the-day" },
    "/results":          { status: 308, destination: "https://app.betsplug.com/results" },
    "/login":            { status: 308, destination: "https://app.betsplug.com/login" },
    "/register":         { status: 308, destination: "https://app.betsplug.com/register" },
    "/checkout":         { status: 308, destination: "https://app.betsplug.com/checkout" },
    "/admin":            { status: 308, destination: "https://app.betsplug.com/admin" },
  },

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": new URL("./src", import.meta.url).pathname,
      },
    },
  },
});
