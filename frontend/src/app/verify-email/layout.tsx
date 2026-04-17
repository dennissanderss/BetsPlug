import type { Metadata } from "next";

/**
 * Auth-flow page — marked noindex. Email verification consumes a
 * one-time token and has no organic search value.
 */
export const metadata: Metadata = {
  title: "Verify your email · BetsPlug",
  description: "Confirm your email address to activate your BetsPlug account.",
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
