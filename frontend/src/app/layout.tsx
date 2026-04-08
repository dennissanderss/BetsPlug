import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/layout/providers";

// Space Mono — free, open-source monospace typeface loaded via
// next/font/google. Only ships weights 400 and 700.
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
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
    <html lang="en" suppressHydrationWarning className={spaceMono.variable}>
      <body className="min-h-screen font-sans font-normal antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
