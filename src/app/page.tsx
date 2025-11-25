

import Link from "next/link";
import TopBuyers from "./components/client/top-buyers";
import RecentReviews from "@/app/components/client/recent-reviews";
import Basket from "./components/client/busket";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-pink-200 via-purple-100 to-blue-100 overflow-x-hidden">
      {/* Декоративні emoji та SVG */}
      <div className="pointer-events-none select-none absolute left-0 top-0 w-full h-full z-0">
        <div className="absolute left-10 top-10 text-7xl opacity-30 animate-bounce-slow">🦄</div>
        <div className="absolute right-10 top-24 text-6xl opacity-20 animate-spin-slow">🌈</div>
        <div className="absolute left-1/2 top-1/3 text-8xl opacity-10 animate-pulse">⭐</div>
        <div className="absolute right-1/4 bottom-10 text-7xl opacity-20 animate-float">☁️</div>
        <div className="absolute left-1/4 bottom-20 text-6xl opacity-20 animate-float-reverse">☁️</div>
      </div>

      {/* Hero секція */}
      <section className="relative z-10 pt-16 pb-12 md:pt-24 md:pb-20 flex flex-col items-center text-center">
        <div className="mb-6">
          <span className="inline-block text-7xl md:text-8xl drop-shadow-lg">🦄</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-purple-700 drop-shadow-lg mb-4">My Little Pony Store</h1>
        <p className="text-xl md:text-2xl text-pink-700 font-semibold mb-6 max-w-2xl mx-auto drop-shadow-md">
          Офіційний магазин іграшок, фігурок та подарунків для справжніх фанатів MLP!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link href="/catalog" className="px-8 py-3 rounded-full bg-white/90 text-purple-700 font-bold text-lg shadow-lg hover:bg-pink-100 transition-colors border-2 border-purple-200">
            Каталог товарів
          </Link>
          <Link href="/box-builder" className="px-8 py-3 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 text-white font-bold text-lg shadow-lg hover:from-pink-500 hover:to-purple-600 transition-colors border-2 border-pink-200">
            🎁 Конструктор боксів
          </Link>
        </div>
        <div className="flex flex-wrap gap-4 justify-center mt-4">
          <div className="bg-white/70 rounded-xl px-6 py-3 shadow-md flex items-center gap-2 text-purple-700 font-semibold text-base">
            ✨ Оригінальні товари
          </div>
          <div className="bg-white/70 rounded-xl px-6 py-3 shadow-md flex items-center gap-2 text-pink-700 font-semibold text-base">
            🚚 Швидка доставка
          </div>
          <div className="bg-white/70 rounded-xl px-6 py-3 shadow-md flex items-center gap-2 text-blue-700 font-semibold text-base">
            💳 Гарантовані ціни
          </div>
          <div className="bg-white/70 rounded-xl px-6 py-3 shadow-md flex items-center gap-2 text-amber-700 font-semibold text-base">
            🎁 Акції щотижня
          </div>
        </div>
      </section>

      {/* Статистика */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 mt-4 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="bg-white/80 rounded-2xl p-6 shadow-md">
            <div className="text-3xl md:text-4xl font-bold text-purple-700 mb-2">1000+</div>
            <div className="text-purple-700 font-semibold">Товарів в каталозі</div>
          </div>
          <div className="bg-white/80 rounded-2xl p-6 shadow-md">
            <div className="text-3xl md:text-4xl font-bold text-pink-700 mb-2">5000+</div>
            <div className="text-pink-700 font-semibold">Задоволених клієнтів</div>
          </div>
          <div className="bg-white/80 rounded-2xl p-6 shadow-md">
            <div className="text-3xl md:text-4xl font-bold text-blue-700 mb-2">24/7</div>
            <div className="text-blue-700 font-semibold">Підтримка</div>
          </div>
        </div>
      </section>

      {/* Топ покупці */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 mt-8">
        <TopBuyers />
      </section>

      {/* Відгуки */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 mt-8 pb-24">
        <RecentReviews />
      </section>

      {/* Плаваюча кнопка кошика */}
      <div className="fixed bottom-6 right-6 z-30">
        <Basket />
      </div>
    </main>
  );
}
