/**
 * League content loader — merges:
 *
 *   1. EN base    → src/content/leagues/{slug}/en.json
 *   2. Locale delta → src/content/leagues/{slug}/{locale}.json (optional)
 *   3. Locale labels → src/content/leagues/_labels/{locale}.json
 *
 * Deep-merge order: en base → labels → locale delta. Labels supply
 * the shared UI strings; the delta file only needs to carry the
 * fields that genuinely differ from EN per league (meta, hero h1/
 * subhead, context paragraphs, league-specific FAQ, final CTA).
 *
 * Returns `LeaguePageContent` ready to feed to components.
 */
import { defaultLocale, type Locale } from "@/lib/i18n";
import type { LeaguePageContent } from "@/content/leagues/types";
import type { LeagueSlug, LeagueConfig } from "@/config/leagues";

const enBase = import.meta.glob<{ default: Partial<LeaguePageContent> }>(
  "/src/content/leagues/*/en.json",
);

const localeDelta = import.meta.glob<{ default: Partial<LeaguePageContent> }>(
  "/src/content/leagues/*/!(en).json",
);

const labelsByLocale = import.meta.glob<{ default: Record<string, unknown> }>(
  "/src/content/leagues/_labels/*.json",
);

type DeepMergeable = Record<string, unknown>;

function isPlainObject(v: unknown): v is DeepMergeable {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function deepMerge(base: unknown, overlay: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(overlay)) return overlay ?? base;
  const out: DeepMergeable = { ...base };
  for (const [k, v] of Object.entries(overlay)) {
    if (v === undefined) continue;
    const existing = out[k];
    if (isPlainObject(v) && isPlainObject(existing)) {
      out[k] = deepMerge(existing, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Replace `{league}` token in any string within a value, recursively. */
function applyLeagueToken<T>(value: T, leagueName: string): T {
  if (typeof value === "string") {
    return value.replace(/\{league\}/g, leagueName) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => applyLeagueToken(v, leagueName)) as unknown as T;
  }
  if (isPlainObject(value)) {
    const out: DeepMergeable = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = applyLeagueToken(v, leagueName);
    }
    return out as unknown as T;
  }
  return value;
}

export async function loadLeagueContent(
  league: LeagueConfig,
  locale: Locale,
): Promise<LeaguePageContent> {
  const slug: LeagueSlug = league.slug;
  const enPath = `/src/content/leagues/${slug}/en.json`;
  const enLoader = enBase[enPath];
  if (!enLoader) {
    throw new Error(`[leagues] No EN base for ${slug} at ${enPath}`);
  }
  const en = (await enLoader()).default as LeaguePageContent;

  // Apply labels for the requested locale (skip on EN — already
  // baked into the EN base file).
  let merged: LeaguePageContent = en;

  if (locale !== defaultLocale) {
    const labelsPath = `/src/content/leagues/_labels/${locale}.json`;
    const labelsLoader = labelsByLocale[labelsPath];
    if (labelsLoader) {
      const labels = (await labelsLoader()).default;
      merged = deepMerge(merged, labels) as LeaguePageContent;
    }

    const deltaPath = `/src/content/leagues/${slug}/${locale}.json`;
    const deltaLoader = localeDelta[deltaPath];
    if (deltaLoader) {
      const delta = (await deltaLoader()).default;
      merged = deepMerge(merged, delta) as LeaguePageContent;
    }
  }

  // Replace `{league}` token in label strings (e.g. "Unlock {league} Predictions").
  return applyLeagueToken(merged, league.name);
}
