


import Link from "next/link";
import {
  SparklesIcon,
  RocketLaunchIcon,
  CreditCardIcon,
  GiftIcon,
  GiftTopIcon,
  CubeIcon,
  UsersIcon,
  StarIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  QuestionMarkCircleIcon,
  PaintBrushIcon,
  NewspaperIcon,
  HeartIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/solid';
import TopBuyers from "./components/client/top-buyers";
import RecentReviews from "@/app/components/client/recent-reviews";
import Basket from "./components/client/busket";
import { useMemo } from "react";

export default function Home() {
  // Список PNG-файлів у публічній папці
  const pngImages = useMemo(
    () => [
      "/png/IMG_20260210_181913_338.PNG",
    ],
    []
  );
  // Вибір випадкового зображення при кожному рендері
  const randomImage = useMemo(() => {
    return pngImages[Math.floor(Math.random() * pngImages.length)];
  }, [pngImages]);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero секція */}
      <section className="bg-purple-50 py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={randomImage} alt="MLP random" className="h-32 md:h-48 object-contain rounded-xl" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-purple-600 mb-4">
              mlpcutiefamily store
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              <strong>Єдиний спеціалізований магазин My Little Pony,</strong> де зібрані оригінальні фігурки, подарункові бокси та аксесуари для фанатів бренду. <SparklesIcon className="inline w-6 h-6 text-purple-400 ml-1" />
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/catalog"
                className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBagIcon className="w-6 h-6" /> Каталог товарів
              </Link>
              <Link
                href="/box-builder"
                className="px-8 py-3 bg-white border-2 border-purple-400 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
              >
                <GiftIcon className="w-6 h-6" /> Створити бокс
              </Link>
            </div>
          </div>

          {/* Переваги */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/50 border border-purple-200 rounded-lg p-4 text-center">
              <SparklesIcon className="w-10 h-10 mb-2 mx-auto text-purple-400" />
              <p className="text-sm font-medium text-gray-700">Оригінальні товари</p>
            </div>
            <div className="bg-white/50 border border-purple-200 rounded-lg p-4 text-center">
              <RocketLaunchIcon className="w-10 h-10 mb-2 mx-auto text-blue-400" />
              <p className="text-sm font-medium text-gray-700">Швидка доставка</p>
            </div>
            <div className="bg-white/50 border border-purple-200 rounded-lg p-4 text-center">
              <CreditCardIcon className="w-10 h-10 mb-2 mx-auto text-green-500" />
              <p className="text-sm font-medium text-gray-700">Безпечні платежі</p>
            </div>
            <div className="bg-white/50 border border-purple-200 rounded-lg p-4 text-center">
              <GiftTopIcon className="w-10 h-10 mb-2 mx-auto text-pink-400" />
              <p className="text-sm font-medium text-gray-700">Акції щотижня</p>
            </div>
          </div>
        </div>
      </section>

      {/* Статистика */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-purple-600">
            🌟 Чому нас обирають
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-purple-50 rounded-lg p-6 text-center">
              <CubeIcon className="w-10 h-10 mb-3 mx-auto text-purple-400" />
              <div className="text-3xl font-bold text-purple-600 mb-1">100+</div>
              <p className="text-gray-600">Товарів у колекції</p>
            </div>
            <div className="bg-pink-50 rounded-lg p-6 text-center">
              <UsersIcon className="w-10 h-10 mb-3 mx-auto text-pink-400" />
              <div className="text-3xl font-bold text-pink-600 mb-1">200+</div>
              <p className="text-gray-600">Щасливих клієнтів</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-6 text-center">
              <StarIcon className="w-10 h-10 mb-3 mx-auto text-blue-400" />
              <div className="text-3xl font-bold text-blue-600 mb-1">Відмінний</div>
              <p className="text-gray-600">Рейтинг магазину</p>
            </div>
          </div>
        </div>
      </section>

      {/* Топ покупці */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-purple-600 flex items-center justify-center gap-2"><TrophyIcon className="w-7 h-7 text-yellow-400" /> Топ покупці місяця</h2>
          <TopBuyers />
        </div>
      </section>

      {/* Форум */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8">
            <ChatBubbleLeftRightIcon className="w-12 h-12 mb-3 mx-auto text-purple-400" />
            <h2 className="text-2xl md:text-3xl font-bold text-purple-600 mb-3">
              Форум спільноти
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Обговорюйте улюблених поні, діліться колекціями та знаходьте друзів!
            </p>
            <Link
              href="/forum"
              className="inline-block px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              Перейти до форуму →
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <ClipboardDocumentListIcon className="w-8 h-8 mb-2 mx-auto text-purple-400" />
              <p className="text-sm font-medium text-gray-700">Обговорення</p>
            </div>
            <div className="bg-pink-50 rounded-lg p-4 text-center">
              <QuestionMarkCircleIcon className="w-8 h-8 mb-2 mx-auto text-pink-400" />
              <p className="text-sm font-medium text-gray-700">Допомога</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <PaintBrushIcon className="w-8 h-8 mb-2 mx-auto text-blue-400" />
              <p className="text-sm font-medium text-gray-700">Колекції</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <NewspaperIcon className="w-8 h-8 mb-2 mx-auto text-green-400" />
              <p className="text-sm font-medium text-gray-700">Новини</p>
            </div>
          </div>
        </div>
      </section>

      {/* Відгуки */}
      <section className="bg-purple-50 py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-purple-600 flex items-center justify-center gap-2"><HeartIcon className="w-7 h-7 text-pink-400" /> Відгуки клієнтів</h2>
          <RecentReviews />
        </div>
      </section>

      {/* Плаваюча кнопка кошика */}
      <div className="fixed bottom-6 right-6 z-30">
        <Basket />
      </div>

      {/* Футер */}
      <footer className="bg-gray-50 border-t-2 border-gray-200 py-8 md:py-10 pb-48">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Основна інформація */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            {/* Про магазин */}
            <div className="text-center md:text-left">
              <h3 className="text-base font-bold text-purple-600 mb-2 flex items-center gap-2">mlpcutiefamily store <SparklesIcon className="w-8 h-8 text-purple-400" /></h3>
              <p className="text-sm text-gray-600">
                <strong>Єдиний спеціалізований магазин My Little Pony,</strong> де зібрані оригінальні фігурки, подарункові бокси та аксесуари для фанатів бренду 🦄✨
              </p>
            </div>

            {/* Посилання */}
            <div className="text-center">
              <h3 className="text-base font-bold text-purple-600 mb-3">Корисні посилання</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/catalog" className="hover:text-purple-600 transition-colors">Каталог</Link></li>
                <li><Link href="/box-builder" className="hover:text-purple-600 transition-colors">Конструктор боксів</Link></li>
                <li><Link href="/forum" className="hover:text-purple-600 transition-colors">Форум</Link></li>
                <li><Link href="/account" className="hover:text-purple-600 transition-colors">Особистий кабінет</Link></li>
              </ul>
            </div>

            {/* Контакти */}
            <div className="text-center md:text-right">
              <h3 className="text-base font-bold text-purple-600 mb-3">Підтримка</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Telegram: <a href="https://t.me/mlpcutiefamily" target="_blank" rel="noopener noreferrer" className="text-purple-600 transition-colors">@mlpcutiefamily</a></li>
                <li>Чат-бот: <a href="https://t.me/mlp_cutie_family_bot" target="_blank" rel="noopener noreferrer" className="text-purple-600 transition-colors">перейти</a></li>
              </ul>
            </div>
          </div>

          {/* Нижня частина */}
          <div className="border-t border-gray-200 pt-4 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-500">
              <div className="text-center md:text-left">
                <p>© mlpcutiefamily</p>
                <p className="text-[10px] mt-1">Версія 0.7 • 17.03.2026</p>
              </div>

              <div className="flex flex-wrap justify-center md:justify-end gap-3">
                <Link href="/privacy" className="hover:text-purple-600">Конфіденційність</Link>
                <span>•</span>
                <Link href="/terms" className="hover:text-purple-600">Умови</Link>
                <span>•</span>
                <Link href="/refund" className="hover:text-purple-600">Повернення</Link>
                <span>•</span>
                <Link href="/delivery" className="hover:text-purple-600">Доставка</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
