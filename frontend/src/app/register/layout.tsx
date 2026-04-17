import type { Metadata } from "next";

/**
 * Auth-flow page — marked noindex so the signup form never shows up
 * as a SERP landing page (users should land on /pricing or /, not on
 * a bare form). `follow` stays true so outbound links still pass equity.
 */
export const metadata: Metadata = {
  title: "Create your BetsPlug account",
  description:
    "Sign up for BetsPlug — AI football predictions, verified track record, and pre-match locked picks.",
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
