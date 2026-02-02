

import Link from "next/link";
import TopBuyers from "./components/client/top-buyers";
import RecentReviews from "@/app/components/client/recent-reviews";
import Basket from "./components/client/busket";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero секція з дитячою атмосферою */}
      <section className="bg-gradient-to-b from-pink-100 to-purple-50 border-b-4 border-purple-400 py-16 md:py-24 relative overflow-hidden">
        {/* Декоративні емодзі у фоні */}
        <div className="absolute top-4 left-4 text-5xl opacity-40">⭐</div>
        <div className="absolute top-12 right-8 text-4xl opacity-40">🌈</div>
        <div className="absolute bottom-8 right-16 text-6xl opacity-30">💫</div>
        <div className="absolute bottom-4 left-12 text-5xl opacity-40">🎨</div>
        
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <div className="text-7xl md:text-9xl mb-4">🦄</div>
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 mb-4">
              My Little Pony Store
            </h1>
            <p className="text-lg md:text-xl text-purple-700 font-semibold mb-8 max-w-3xl mx-auto">
              Магічний світ іграшок для справжніх поклонниці MLP! 🌟
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/catalog" 
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full hover:shadow-lg hover:shadow-purple-400 transition-all transform hover:scale-105"
              >
                🛍️ Знайти скарб
              </Link>
              <Link 
                href="/box-builder" 
                className="px-8 py-3 bg-white border-4 border-purple-400 text-purple-600 font-bold rounded-full hover:bg-purple-50 transition-all hover:shadow-lg"
              >
                🎁 Конструктор боксів
              </Link>
            </div>
          </div>

          {/* Переваги з дитячим стилем */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-100 to-purple-50 border-4 border-purple-300 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform">
              <div className="text-5xl mb-3">✨</div>
              <p className="text-gray-900 font-bold text-base">Оригінальні<br />товари</p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 border-4 border-blue-300 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform">
              <div className="text-5xl mb-3">🚀</div>
              <p className="text-gray-900 font-bold text-base">Швидка<br />доставка</p>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-green-50 border-4 border-green-300 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform">
              <div className="text-5xl mb-3">💚</div>
              <p className="text-gray-900 font-bold text-base">Безпечні<br />платежі</p>
            </div>
            <div className="bg-gradient-to-br from-pink-100 to-pink-50 border-4 border-pink-300 rounded-2xl p-6 text-center transform hover:scale-105 transition-transform">
              <div className="text-5xl mb-3">🎉</div>
              <p className="text-gray-900 font-bold text-base">Акції<br />щотижня</p>
            </div>
          </div>
        </div>
      </section>

      {/* Статистика */}
      <section className="bg-gradient-to-b from-purple-50 to-pink-50 border-b-4 border-pink-400 py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12 text-purple-700">
            🌟 Чому нас обирають
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-100 to-white border-4 border-purple-300 rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105 transition-transform">
              <div className="text-5xl mb-4">📦</div>
              <div className="text-4xl font-black text-purple-600 mb-2">1000+</div>
              <p className="text-gray-800 font-bold">Товарів у колекції</p>
            </div>
            <div className="bg-gradient-to-br from-pink-100 to-white border-4 border-pink-300 rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105 transition-transform">
              <div className="text-5xl mb-4">👥</div>
              <div className="text-4xl font-black text-pink-600 mb-2">5000+</div>
              <p className="text-gray-800 font-bold">Щасливих клієнтів</p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-white border-4 border-blue-300 rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105 transition-transform">
              <div className="text-5xl mb-4">⭐</div>
              <div className="text-4xl font-black text-blue-600 mb-2">5.0</div>
              <p className="text-gray-800 font-bold">Рейтинг магазину</p>
            </div>
          </div>
        </div>
      </section>

      {/* Топ покупці */}
      <section className="py-16 bg-white border-b-4 border-purple-200">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12 text-purple-700">🏆 Топ покупці місяця</h2>
          <TopBuyers />
        </div>
      </section>

      {/* Відгуки */}
      <section className="bg-gradient-to-b from-pink-50 to-purple-50 border-t-4 border-pink-400 py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12 text-purple-700">💝 Що говорять наші клієнти</h2>
          <RecentReviews />
        </div>
      </section>

      {/* Плаваюча кнопка кошика */}
      <div className="fixed bottom-6 right-6 z-30">
        <Basket />
      </div>
    </main>
  );
}
