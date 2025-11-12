import Image from "next/image";
import Hero from "./components/server/hero";
import Basket from "./components/client/busket";
import TopBuyers from "./components/client/top-buyers";
import AccountButton from "./components/client/account-button";
import RecentReviews from "@/app/components/client/recent-reviews";

export default function Home() {
  return (
    <>
      <Hero />
      <Basket />
      <AccountButton />
    </>
  );
}
