import Link from "next/link";
import { 
  CameraIcon, 
  ArrowUturnLeftIcon, 
  ClipboardDocumentListIcon, 
  CheckCircleIcon, 
  ArrowPathIcon, 
  ArrowsRightLeftIcon, 
  ExclamationTriangleIcon, 
  GlobeAltIcon, 
  SparklesIcon, 
  BanknotesIcon, 
  CalendarIcon, 
  CubeIcon, 
  ClockIcon, 
  CreditCardIcon, 
  TruckIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  ChatBubbleLeftRightIcon, 
  HeartIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/solid";

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8 font-semibold">
          <ArrowLeftIcon className="w-4 h-4" /> Повернутися на головну
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border-4 border-purple-200">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <ArrowUturnLeftIcon className="w-16 h-16 text-purple-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-purple-700 mb-2">
              Повернення та обмін
            </h1>
            <p className="text-gray-600">Оновлено: 06 лютого 2026</p>
          </div>

          <div className="prose prose-purple max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3 flex items-center gap-2">
                <ClipboardDocumentListIcon className="w-7 h-7" /> Загальні умови
              </h2>
              <p>
                MLP Cutie Family дбає про задоволеність кожного клієнта. Якщо ви з будь-якої причини не задоволені покупкою,
                ви можете повернути або обміняти товар протягом 14 днів з моменту отримання.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3 flex items-center gap-2">
                <CheckCircleIcon className="w-7 h-7 text-green-600" /> Умови прийняття товару назад
              </h2>
              <p>Товар можна повернути, якщо він відповідає наступним вимогам:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Товар не використовувався та збережено товарний вигляд</li>
                <li>Збережена оригінальна упаковка та всі комплектуючі</li>
                <li>Збережені всі етикетки, стікери та захисні плівки</li>
                <li>Немає механічних пошкоджень</li>
                <li>Товар не має слідів використання</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3 flex items-center gap-2">
                <ArrowPathIcon className="w-7 h-7" /> Порядок повернення
              </h2>
              <div className="space-y-4">
                <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded">
                  <h3 className="font-bold text-purple-700 mb-2">Крок 1: Зв'язок з підтримкою</h3>
                  <p>Напишіть нам в <a href="https://t.me/mlp_cutie_family_bot" className="text-purple-600 hover:underline">телеграм-бот</a> або в Telegram <a href="https://t.me/mlpcutiefamily" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">@mlpcutiefamily</a></p>
                  <p className="text-sm mt-2">Вкажіть номер замовлення та причину повернення</p>
                </div>

                <div className="bg-pink-50 border-l-4 border-pink-400 p-4 rounded">
                  <h3 className="font-bold text-pink-700 mb-2">Крок 2: Підтвердження</h3>
                  <p>Наш менеджер зв'яжеться з вами протягом 24 годин та надасть інструкції</p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <h3 className="font-bold text-blue-700 mb-2">Крок 3: Відправка</h3>
                  <p>Відправте товар на вказану адресу Новою Поштою</p>
                  <p className="text-sm mt-2">Витрати на зворотну доставку компенсуються, якщо товар бракований або отриманий не той товар</p>
                </div>

                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                  <h3 className="font-bold text-green-700 mb-2">Крок 4: Перевірка та повернення коштів</h3>
                  <p>Після отримання та перевірки товару, кошти повертаються протягом 5-10 робочих днів</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3 flex items-center gap-2">
                <ArrowsRightLeftIcon className="w-7 h-7" /> Обмін товару
              </h2>
              <p>
                Якщо ви хочете обміняти товар на інший:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Зв'яжіться з нами та повідомте про бажання обміну</li>
                <li>Вкажіть, на який товар хочете обміняти</li>
                <li>Відправте товар нам</li>
                <li>Новий товар буде відправлений протягом 2-3 робочих днів після перевірки</li>
                <li>Якщо є різниця в ціні, здійснюється доплата або повернення різниці</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-7 h-7 text-yellow-600" /> Товари, що не підлягають поверненню
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Товари з порушеною упаковкою (якщо цього вимагають санітарні норми)</li>
                <li>Колекційні фігурки з відкритою упаковкою</li>
                <li>Товари на замовлення (custom або персоналізовані)</li>
                <li>Товари зі знижкою понад 50% (якщо не є браком)</li>
              </ul>
            </section>

            <section id="abroad">
              <h2 className="text-2xl font-bold text-pink-700 mb-3 flex items-center gap-2">
                <GlobeAltIcon className="w-7 h-7" /> Правила для передзамовлень із-за кордону
              </h2>
              <div className="bg-pink-50 border-l-4 border-pink-400 p-6 rounded-xl shadow-sm">
                <p className="mb-4 leading-relaxed text-gray-800">
                  Передзамовлення товарів, які доставляються з-за кордону, здійснюються спеціально під індивідуальне замовлення клієнта. У зв’язку з цим такі товари <strong>не підлягають обміну або поверненню</strong> після оформлення та підтвердження замовлення.
                </p>

                <p className="font-bold text-pink-800 mb-2">Виняток становлять випадки, коли товар:</p>
                <ul className="list-disc pl-6 space-y-1 mb-4 text-gray-700">
                  <li>має виробничий брак</li>
                  <li>пошкоджений під час транспортування</li>
                  <li>не відповідає опису або комплектації</li>
                </ul>

                <p className="mb-4 leading-relaxed text-gray-800">
                  У таких ситуаціях ми обов’язково розглядаємо кожен випадок індивідуально та зв’язуємось із постачальником для вирішення проблеми і пошуку найкращого рішення для клієнта.
                </p>

                <p className="font-bold text-pink-700 text-center mt-6 flex items-center justify-center gap-2">
                  Дякуємо за розуміння та довіру <SparklesIcon className="w-5 h-5" />
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3 flex items-center gap-2">
                <BanknotesIcon className="w-7 h-7" /> Повернення коштів
              </h2>
              <p>
                Кошти повертаються тим же способом, яким була здійснена оплата:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>На банківську картку (якщо оплата була карткою)</li>
                <li>Термін повернення: 5-10 робочих днів після підтвердження</li>
                <li>Повертається повна сума товару</li>
                <li>Витрати на доставку повертаються тільки у випадку браку</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3 flex items-center gap-2">
                <CalendarIcon className="w-7 h-7" /> Терміни
              </h2>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2"><CubeIcon className="w-4 h-4 text-purple-600" /> <strong>Термін повернення:</strong> 14 днів з моменту отримання</li>
                  <li className="flex items-center gap-2"><ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-600" /> <strong>Відповідь підтримки:</strong> до 24 годин</li>
                  <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-600" /> <strong>Перевірка товару:</strong> 1-3 робочих дні</li>
                  <li className="flex items-center gap-2"><CreditCardIcon className="w-4 h-4 text-pink-600" /> <strong>Повернення коштів:</strong> 5-10 робочих днів</li>
                  <li className="flex items-center gap-2"><TruckIcon className="w-4 h-4 text-orange-600" /> <strong>Відправка заміни:</strong> 2-3 робочих дні</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3 flex items-center gap-2">
                <PhoneIcon className="w-7 h-7" /> Контакти служби підтримки
              </h2>
              <div className="bg-white border-2 border-purple-300 rounded-lg p-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <EnvelopeIcon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <strong>Підтримка:</strong> <a href="https://t.me/mlp_cutie_family_bot" className="text-purple-600 hover:underline">чат-бот</a>
                      <p className="text-sm text-gray-600">Відповідаємо протягом 24 годин</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <strong>Telegram:</strong> <a href="https://t.me/mlpcutiefamily" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">@mlpcutiefamily</a>
                      <p className="text-sm text-gray-600">Швидкий зв'язок у месенджері</p>
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-lg border-2 border-purple-300 text-center mt-8">
              <p className="text-lg font-semibold text-purple-700 flex items-center justify-center gap-2">
                <HeartIcon className="w-6 h-6 text-pink-500" /> Ваша задоволеність - наш пріоритет!
              </p>
              <p className="text-gray-700 mt-2">
                Якщо у вас виникли питання, не соромтеся звертатися. Ми завжди раді допомогти!
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
