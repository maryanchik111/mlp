import type { Metadata } from 'next';
import { JsonLd, organizationSchema } from '../../lib/schema';

export const metadata: Metadata = {
  title: "Каталог - My Little Pony Store | Іграшки і колекції",
  description: "Переглядайте весь каталог My Little Pony: фігурки, аксесуари, картки та коллекції. Великий вибір персонажів за доступними цінами.",
  keywords: ["каталог MLP", "іграшки поні", "фігурки поні", "колекційні картки", "аксесуари MLP"],
  openGraph: {
    title: "Каталог - My Little Pony Store",
    description: "Весь каталог My Little Pony товарів",
    type: "website",
    url: "/catalog",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
