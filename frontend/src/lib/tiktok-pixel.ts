// TikTok Pixel client-side event helper.
//
// The base pixel is loaded by Google Tag Manager (container GTM-N7K574H7)
// behind the CookieYes consent trigger, so `window.ttq` only exists for
// visitors who granted analytics consent. All track calls are no-ops when
// the global is missing — no extra consent gate needed here.

type TikTokTrackParams = {
  value?: number;
  currency?: string;
  content_id?: string;
  content_name?: string;
  content_type?: string;
  description?: string;
};

declare global {
  interface Window {
    ttq?: {
      track: (event: string, params?: TikTokTrackParams) => void;
      page: () => void;
    };
  }
}

export type TikTokEvent =
  | "ViewContent"
  | "InitiateCheckout"
  | "CompleteRegistration"
  | "Subscribe"
  | "StartTrial"
  | "CompletePayment";

export function trackTikTok(event: TikTokEvent, params?: TikTokTrackParams) {
  if (typeof window === "undefined") return;
  try {
    window.ttq?.track(event, params);
  } catch {
    // Pixel script not loaded (consent declined or blocker active) — ignore.
  }
}

type PlanId = "bronze" | "silver" | "gold" | "platinum";
type Billing = "monthly" | "yearly";

const PLAN_PRICE_EUR: Record<PlanId, { monthly: number; yearly: number }> = {
  bronze: { monthly: 0, yearly: 0 },
  silver: { monthly: 9.99, yearly: 95.88 },
  gold: { monthly: 14.99, yearly: 143.88 },
  platinum: { monthly: 199, yearly: 199 },
};

export function getPlanValueEur(
  plan: string,
  billing: string,
  isTrial: boolean
): number {
  if (isTrial) return 0;
  const p = (plan?.toLowerCase() ?? "gold") as PlanId;
  const b = (billing?.toLowerCase() ?? "monthly") as Billing;
  return PLAN_PRICE_EUR[p]?.[b] ?? 0;
}
