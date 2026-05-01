/**
 * BetsPlug i18n runtime helpers.
 *
 * - getContent()          → load src/content/pages/{name}/{locale}.json
 * - getLocalizedSlug()    → re-export from i18n/slug-mappings
 * - getAllLocaleVersions() → re-export from i18n/slug-mappings
 * - detectLocaleFromHeader() → middleware helper
 *
 * See docs/specs/16-i18n.md → "CONTENT TRANSLATION SYSTEM".
 */
import {
  defaultLocale,
  isLocale,
  locales,
  type Locale,
} from "@/i18n/locales";

export {
  getLocalizedSlug,
  getCanonicalSlug,
  getLocalizedPath,
  getAllLocaleVersions,
} from "@/i18n/slug-mappings";

export { defaultLocale, locales, isLocale };
export type { Locale };

/* ──────────────────────────────────────────────────────────────
   Content loading
   ────────────────────────────────────────────────────────────── */

// Vite's import.meta.glob lets the build statically discover every
// content file. We get a typed map of "/src/content/pages/.../en.json"
// → loader function. Eager: false keeps each locale a separate chunk.
const contentLoaders = import.meta.glob<{ default: unknown }>(
  "/src/content/pages/**/*.json",
);

/**
 * Load page content for `pageName` in `locale`. If the requested
 * locale is missing, falls back to the default locale and emits a
 * warning so missing translations are visible during builds.
 *
 * @param pageName  Folder name under src/content/pages/ (e.g. "homepage").
 * @param locale    Target locale.
 * @returns         The parsed JSON content for that page+locale.
 *
 * @example
 *   const content = await getContent("homepage", "nl");
 */
export async function getContent<T = unknown>(
  pageName: string,
  locale: Locale,
): Promise<T> {
  const candidatePath = `/src/content/pages/${pageName}/${locale}.json`;
  const fallbackPath  = `/src/content/pages/${pageName}/${defaultLocale}.json`;

  const candidate = contentLoaders[candidatePath];
  if (candidate) {
    const mod = await candidate();
    return mod.default as T;
  }

  const fallback = contentLoaders[fallbackPath];
  if (fallback) {
    if (locale !== defaultLocale) {
      console.warn(
        `[i18n] Missing content "${pageName}/${locale}". ` +
        `Falling back to ${defaultLocale}.`,
      );
    }
    const mod = await fallback();
    return mod.default as T;
  }

  throw new Error(
    `[i18n] No content file for "${pageName}" — looked for ` +
    `${candidatePath} and ${fallbackPath}.`,
  );
}

/* ──────────────────────────────────────────────────────────────
   Locale detection (used by middleware)
   ────────────────────────────────────────────────────────────── */

/**
 * Pick the best supported locale from an Accept-Language header.
 * Returns null when no header value matches a supported locale.
 */
export function detectLocaleFromHeader(
  acceptLanguage: string | null,
): Locale | null {
  if (!acceptLanguage) return null;

  // Parse "en-US,en;q=0.9,nl;q=0.8" into [{ code, q }] sorted by q desc.
  const parts = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      return { tag: tag.toLowerCase(), q };
    })
    .filter((p) => Number.isFinite(p.q))
    .sort((a, b) => b.q - a.q);

  for (const { tag } of parts) {
    const primary = tag.split("-")[0];
    if (isLocale(primary)) return primary;
  }
  return null;
}

/**
 * Resolve which locale a request should be served as, in priority
 * order: explicit URL prefix → cookie preference → Accept-Language
 * → default. Pure function, easy to unit-test.
 */
export function resolveLocale(input: {
  pathname: string;
  cookieValue?: string | null;
  acceptLanguage?: string | null;
}): { locale: Locale; source: "url" | "cookie" | "header" | "default" } {
  // 1. URL prefix
  const firstSegment = input.pathname.split("/").filter(Boolean)[0];
  if (firstSegment && isLocale(firstSegment)) {
    return { locale: firstSegment, source: "url" };
  }

  // 2. Cookie preference
  if (input.cookieValue && isLocale(input.cookieValue)) {
    return { locale: input.cookieValue, source: "cookie" };
  }

  // 3. Accept-Language header
  const headerLocale = detectLocaleFromHeader(input.acceptLanguage ?? null);
  if (headerLocale) return { locale: headerLocale, source: "header" };

  // 4. Default
  return { locale: defaultLocale, source: "default" };
}
