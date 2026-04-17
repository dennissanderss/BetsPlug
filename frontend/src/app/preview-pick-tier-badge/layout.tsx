import type { Metadata } from "next";

/**
 * Dev-only design surface for the PickTierBadge component.
 * Marked noindex + nofollow because it has no organic value and
 * shouldn't eat crawl budget. Safe to delete once the badge is
 * signed off and baked into its consumers.
 */
export const metadata: Metadata = {
  title: "Internal · PickTierBadge preview",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function PreviewPickTierBadgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
