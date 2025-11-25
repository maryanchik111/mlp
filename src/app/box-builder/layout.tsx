import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Конструктор боксів - My Little Pony | Створи свій подарунок",
  description: "Створи свій унікальний подарунковий бокс My Little Pony! Обери розмір, вибери улюблені товари: фігурки, аксесуари, картки та декор.",
  keywords: ["конструктор боксів", "подарунковий бокс", "My Little Pony набір", "создай свой подарок"],
  openGraph: {
    title: "Конструктор боксів - My Little Pony",
    description: "Створи свій унікальний подарунковий бокс з товарами My Little Pony",
    type: "website",
    url: "/box-builder",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
