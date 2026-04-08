import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/layout/providers";

// Poppins — free, open-source geometric sans loaded via next/font
// for automatic self-hosting and zero layout shift.
const poppins = Poppins({
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
    <html lang="en" suppressHydrationWarning className={poppins.variable}>
      <body className="min-h-screen font-sans font-normal antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
