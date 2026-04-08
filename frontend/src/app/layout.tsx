import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Lato } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/layout/providers";

// Lato — free, open-source humanist sans loaded via next/font/google
// for automatic self-hosting and zero layout shift.
const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
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
    <html lang="en" suppressHydrationWarning className={lato.variable}>
      <body className="min-h-screen font-sans font-normal antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
