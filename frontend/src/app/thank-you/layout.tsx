import type { Metadata } from "next";

/**
 * Post-checkout confirmation page — marked noindex. Conversion pages
 * should never appear in organic SERPs (they'd skew analytics and
 * ruin the funnel metric). `follow` stays true so the internal links
 * out to the dashboard still pass equity.
 */
export const metadata: Metadata = {
  title: "Welcome to BetsPlug",
  description: "Your BetsPlug subscription is active.",
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default function ThankYouLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
