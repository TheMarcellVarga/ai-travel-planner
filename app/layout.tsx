import type { Metadata } from "next";
import { Bebas_Neue, Manrope } from "next/font/google";

import { AppFooter } from "@/components/app-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site";

import "./globals.css";

const displayFont = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400"
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: site.name,
  description: site.description,
  icons: {
    icon: "/wild-route-mark.svg",
    apple: "/wild-route-mark.svg",
  },
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        <div className="page-noise" aria-hidden="true" />
        <SiteHeader />
        {children}
        <AppFooter />
      </body>
    </html>
  );
}
