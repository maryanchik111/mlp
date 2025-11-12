import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import MobileNav from "./components/client/mobile-nav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "My Little Pony Store - Офіційні іграшки та колекційні фігурки",
  description: "Купіть оригінальні іграшки My Little Pony та колекційні фігурки. Великий вибір персонажів, доступні ціни та швидка доставка.",
  keywords: ["My Little Pony", "MLP", "іграшки", "фігурки", "колекція", "поні"],
  authors: [{ name: "MLP Store" }],
  openGraph: {
    title: "My Little Pony Store - Офіційні іграшки та колекційні фігурки",
    description: "Купіть оригінальні іграшки My Little Pony та колекційні фігурки з доставкою по Україні",
    type: "website",
    locale: "uk_UA",
  },
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
