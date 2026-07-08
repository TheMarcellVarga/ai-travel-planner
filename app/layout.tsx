import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppFooter } from "@/components/app-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site";

import "./globals.css";

const displayFont = Geist({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800", "900"]
});

const bodyFont = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: site.name,
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: `${site.name} route planning preview`
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
    images: ["/logo.png"]
  },
  icons: {
    icon: "/wild-route-mark.svg",
    apple: "/wild-route-mark.svg"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <div className="page-noise" aria-hidden="true" />
        <SiteHeader />
        <div id="content">{children}</div>
        <AppFooter />
      </body>
    </html>
  );
}
