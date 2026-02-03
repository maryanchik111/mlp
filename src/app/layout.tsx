import type { Metadata } from "next";
import { JsonLd, organizationSchema } from "../lib/schema";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import MobileNav from "./components/client/mobile-nav";
import PWAInstaller from "./components/client/pwa-installer";
import SupportButton from "./components/client/support-button";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "My Little Pony Store - Офіційні іграшки та колекційні фігурки",
  description: "Купіть оригінальні іграшки My Little Pony та колекційні фігурки. Великий вибір персонажів, доступні ціни та швидка доставка.",
  keywords: ["My Little Pony", "MLP", "іграшки", "фігурки", "колекція", "поні"],
  authors: [{ name: "MLP Store" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MLP Store",
  },
  openGraph: {
    title: "My Little Pony Store - Офіційні іграшки та колекційні фігурки",
    description: "Купіть оригінальні іграшки My Little Pony та колекційні фігурки з доставкою по Україні",
    type: "website",
    locale: "uk_UA",
    siteName: "MLP Store",
    url: "https://mlp-store.com.ua",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Little Pony Store",
    description: "Офіційні іграшки та колекційні фігурки My Little Pony",
  },
  robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: "#9333ea",
  alternates: {
    canonical: "https://mlp-store.com.ua",
    languages: {
      uk: "https://mlp-store.com.ua",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <link rel="icon" href="/icon-192.svg" type="image/svg+xml" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MLP Store" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#9333ea" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <PWAInstaller />
          <SupportButton />
          {children}
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
