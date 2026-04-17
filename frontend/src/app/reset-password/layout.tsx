import type { Metadata } from "next";

/**
 * Auth-flow page — marked noindex. Token-gated password reset page
 * has no organic search value.
 */
export const metadata: Metadata = {
  title: "Set a new password · BetsPlug",
  description:
    "Choose a new password for your BetsPlug account.",
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
