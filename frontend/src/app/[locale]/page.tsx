import { redirect } from "next/navigation";
import { locales } from "@/i18n/config";

/**
 * Homepage on app.betsplug.com — redirect-only.
 * ────────────────────────────────────────────────────────────
 * After the marketing/app split (2026-05-01) the public marketing
 * site lives in the separate Astro project at betsplug.com. The
 * Next.js project only serves the authenticated dashboard at
 * app.betsplug.com, so any visitor landing on `/` (or `/[locale]/`)
 * here is either a logged-in user wanting their dashboard, or
 * someone who clicked an old "Home" / logo link by accident.
 *
 * In both cases the right destination is /dashboard. The dashboard
 * route's auth-guard handles unauthed visitors by bouncing them to
 * /login. This keeps the Next.js project a pure auth+dashboard
 * surface — no marketing chrome competing for clicks, no SEO
 * confusion with the Astro homepage at betsplug.com.
 */

type Params = { locale: string };

export async function generateStaticParams(): Promise<Params[]> {
  return locales.map((locale) => ({ locale }));
}

export default function HomePage(): never {
  redirect("/dashboard");
}
