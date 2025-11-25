import Image from "next/image";
import type { Metadata } from "next";
import Hero from "./components/server/hero";
import Basket from "./components/client/busket";
import TopBuyers from "./components/client/top-buyers";
import AccountButton from "./components/client/account-button";
import RecentReviews from "@/app/components/client/recent-reviews";

export const metadata: Metadata = {
  title: "My Little Pony Store - Офіційні іграшки і колекції",
  description: "Купіть оригінальні іграшки My Little Pony: фігурки, аксесуари, колекційні картки та багато іншого. Доставка по Україні, низькі ціни.",
  keywords: ["My Little Pony", "MLP", "іграшки поні", "фігурки", "колекційні картки", "аксесуари"],
  openGraph: {
    title: "My Little Pony Store - Офіційні іграшки і колекції",
    description: "Купіть оригінальні іграшки My Little Pony з доставкою по Україні",
    type: "website",
    url: "/",
  },
  canonical: "https://mlp-store.com.ua",
};

export default function Home() {
  return (
    <>
      <Hero />
      <Basket />
      <AccountButton />
    </>
  );
}
