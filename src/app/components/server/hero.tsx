import Link from "next/link";
import TopBuyers from "../client/top-buyers";
import RecentReviews from "../client/recent-reviews";
import { 
  GiftIcon, 
  SparklesIcon, 
  TruckIcon, 
  CreditCardIcon,
  StarIcon
} from "@heroicons/react/24/outline";

export default function Hero() {
  return (
    <section className="relative w-full py-20 md:py-32 overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
      >
        <source src="/mlp.mp4" type="video/mp4" />
      </video>
      {/* Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-purple-900/60 z-0"></div>

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Текстова частина */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white drop-shadow-lg">
                Світ My Little Pony
              </h1>
              <p className="text-xl md:text-2xl text-white drop-shadow-md">
                Офіційний магазин іграшок та колекційних фігурок
              </p>
            </div>

            <p className="text-lg text-white/90 leading-relaxed">
              Знайдіть улюблених персонажів з серіалу, рідкісні колекційні видання та ексклюзивні набори. 
              Щоденно оновлюємо асортимент новими надходженнями!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href='/catalog' className="w-full text-center px-8 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl">
                Перейти до каталогу
              </Link>
              <Link href='/box-builder' className="w-full flex items-center justify-center gap-2 px-8 py-3 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 transition-colors shadow-lg hover:shadow-xl">
                <GiftIcon className="w-5 h-5" /> Конструктор боксів
              </Link>
            </div>

            {/* Переваги */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-yellow-300" />
                <p className="text-sm text-white font-semibold">Оригінальні товари</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg flex items-center gap-2">
                <TruckIcon className="w-5 h-5 text-blue-300" />
                <p className="text-sm text-white font-semibold">Швидка доставка</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg flex items-center gap-2">
                <CreditCardIcon className="w-5 h-5 text-green-300" />
                <p className="text-sm text-white font-semibold">Гарантовані ціни</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg flex items-center gap-2">
                <GiftIcon className="w-5 h-5 text-pink-300" />
                <p className="text-sm text-white font-semibold">Акції щотижня</p>
              </div>
            </div>
          </div>

          {/* Зображення частина */}
          <div className="relative h-96 md:h-full flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-200/30 to-pink-200/30 rounded-3xl"></div>
            <div className="relative z-10 text-center">
              <div className="mb-4 flex justify-center">
                <StarIcon className="w-24 h-24 md:w-32 md:h-32 text-yellow-400 drop-shadow-glow" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                Радуга чекає!
              </p>
            </div>
          </div>
        </div>

        {/* Цифри успіху */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 mt-16 pt-12 border-t border-white/30">
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">1000+</p>
            <p className="text-white/90 mt-2">Товарів в каталозі</p>
          </div>
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">5000+</p>
            <p className="text-white/90 mt-2">Задоволених клієнтів</p>
          </div>
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">24/7</p>
            <p className="text-white/90 mt-2">Підтримка</p>
          </div>
        </div>

        {/* Топ покупці і відгуки */}
        <div className="mt-16 space-y-8">
          <TopBuyers />
          <RecentReviews />
        </div>
      </div>
    </section>
  );
}
