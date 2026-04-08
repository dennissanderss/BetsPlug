import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/layout/providers";

// Manrope — free, open-source geometric-humanist sans that closely
// resembles TT Lakes Neue. Loaded via next/font for zero layout shift.
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-brand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BetsPlug - AI-Powered Sports Analytics",
  description: "Premium AI-powered sports analytics. Data-driven predictions, live match tracking, and deep performance insights.",
  icons: {
    icon: [
      { url: "/logo.webp", type: "image/webp" },
    ],
    shortcut: "/logo.webp",
    apple: "/logo.webp",
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={manrope.variable}>
      <body className="min-h-screen font-sans font-normal antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
