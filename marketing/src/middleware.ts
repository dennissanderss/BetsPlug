/**
 * BetsPlug locale middleware.
 *
 * Reads the URL prefix and stashes the resolved locale on
 * `Astro.locals.locale` so pages can render in that locale without
 * re-detecting it. See docs/specs/16-i18n.md → "LOCALE DETECTION".
 *
 * Static-build vs runtime
 * ───────────────────────
 * The marketing site is static (`output: "static"`). At build time,
 * middleware runs while prerendering each route, but
 * `Astro.request.headers` is intentionally empty and a redirect from
 * middleware would skip emitting the page. So the **build path**
 * only resolves locale from the URL prefix and never redirects.
 *
 * Runtime accept-language redirects (and cookie writes on the
 * locale switch) happen client-side via the small inline script in
 * BaseLayout once the page has hydrated. Once we add the Vercel
 * adapter and run middleware on the edge, we'll fold the runtime
 * detection here.
 */
import { defineMiddleware } from "astro:middleware";
import {
  defaultLocale,
  isLocale,
  type Locale,
} from "@/lib/i18n";

export const LOCALE_COOKIE_NAME = "locale_pref";

declare global {
  namespace App {
    interface Locals {
      locale: Locale;
    }
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const firstSegment = url.pathname.split("/").filter(Boolean)[0];

  // Resolve from URL prefix only — static-build safe, no header
  // access, no redirects.
  const locale: Locale = isLocale(firstSegment) ? firstSegment : defaultLocale;
  context.locals.locale = locale;

  return next();
});
