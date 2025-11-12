import Image from "next/image";
import Hero from "./components/server/hero";
import Basket from "./components/client/busket";
import TopBuyers from "./components/client/top-buyers";

export default function Home() {
  return (
    <>
      <Hero />
      <Basket />
      <TopBuyers />
    </>
  );
}
