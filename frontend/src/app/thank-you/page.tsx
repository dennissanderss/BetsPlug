import { fetchThankYouPage, getLocaleValue } from "@/lib/sanity-data";
import { getServerLocale } from "@/lib/seo-helpers";
import ThankYouPage from "./thank-you-content";
import type { SanityPlanFeature } from "./thank-you-content";

export const revalidate = 60;

export default async function ThankYouServerPage() {
  const locale = getServerLocale();
  const thankYouData = await fetchThankYouPage();

  // Pre-resolve Sanity plan features to locale-specific strings
  const sanityPlanFeatures: SanityPlanFeature[] | undefined =
    thankYouData?.planFeatures?.length
      ? thankYouData.planFeatures.map((plan: any) => ({
          planId: plan.planId ?? "",
          features: (plan.features ?? []).map((f: any) => ({
            title: getLocaleValue(f.title, locale),
            body: getLocaleValue(f.body, locale),
          })),
        }))
      : undefined;

  return <ThankYouPage sanityPlanFeatures={sanityPlanFeatures} />;
}
