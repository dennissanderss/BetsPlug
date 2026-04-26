/**
 * Dismissal-state helpers for the dashboard Gold-upsell nudge banner.
 *
 * The banner sits below the BOTD preview and asks Free/Silver users
 * to upgrade to Gold. After a click on the × close button we want it
 * gone — but not forever: the user might still be undecided, and a
 * gentle reminder a few days later is fine. Permanent dismissal would
 * require a user-account flag round-trip; localStorage is enough for
 * the per-device courtesy cooldown.
 *
 * Cooldown is `COOLDOWN_DAYS` long (3 days by default). Adjust the
 * constant to change the silence window for every visitor without
 * touching the component.
 *
 * SSR safety: every helper short-circuits when `window` is undefined,
 * so importing the module from a server component or during static
 * prerender is safe. Components still need a mounted-flag pattern to
 * avoid hydration mismatches when reading the dismiss-state.
 */

const STORAGE_KEY = "upsell-banner:gold:dismissed-at";

/** How long to hide the banner after a dismissal click. Configurable
 *  here so QA can flip it to e.g. 10 seconds during manual smoke-tests
 *  and switch back to 3 days before merging. */
const COOLDOWN_DAYS = 3;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

/**
 * Returns true if the user dismissed the banner within the last
 * `COOLDOWN_DAYS` days. False on the server or when no dismissal has
 * been recorded yet.
 */
export function isUpsellDismissed(): boolean {
  if (typeof window === "undefined") return false;
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
  if (!stored) return false;
  const dismissedAt = new Date(stored).getTime();
  if (Number.isNaN(dismissedAt)) return false;
  return Date.now() - dismissedAt < COOLDOWN_MS;
}

/**
 * Records the current timestamp as the moment the banner was
 * dismissed. The banner stays hidden for `COOLDOWN_DAYS` afterwards.
 */
export function dismissUpsell(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  } catch {
    /* Quota exceeded or storage disabled; fail silently — the banner
       just won't persist its dismissal between page loads. */
  }
}

/**
 * Clears the stored dismissal so the banner shows up again on the
 * next render. Intended for QA / debug pages, not user-facing UI.
 */
export function resetUpsellDismissal(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
