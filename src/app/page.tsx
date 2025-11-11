import Image from "next/image";
import Hero from "./components/server/hero";
import Basket from "./components/client/busket";

export default function Home() {
  return (
    <>
      <Hero />
      <Basket />
    </>
  );
}
