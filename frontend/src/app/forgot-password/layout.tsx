import type { Metadata } from "next";

/**
 * Auth-flow page — marked noindex. Password recovery forms have no
 * organic search value and shouldn't appear in SERPs.
 */
export const metadata: Metadata = {
  title: "Reset your BetsPlug password",
  description:
    "Recover access to your BetsPlug account. Enter your email to receive a password reset link.",
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
