import Link from "next/link";

export default function DeliveryPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8">
          ← Повернутися на головну
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border-4 border-purple-200">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🚚</div>
            <h1 className="text-3xl md:text-4xl font-black text-purple-700 mb-2">
              Доставка та оплата
            </h1>
            <p className="text-gray-600">Оновлено: 06 лютого 2026</p>
          </div>

          <div className="prose prose-purple max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">📦 Способи доставки</h2>
              
              <div className="space-y-4">

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-6 rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🏢</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-blue-700 mb-2">Нова Пошта (по всій Україні)</h3>
                      <ul className="space-y-2 text-sm">
                        <li>✅ <strong>Вартість:</strong> 80–120₴ (згідно тарифів перевізника, залежить від ваги та розміру посилки)</li>
                        <li>⏱️ <strong>Термін:</strong> 1-3 робочих дні</li>
                        <li>📍 Відправка у будь-яке відділення Нової Пошти по Україні</li>
                        <li>💳 Оплата — тільки онлайн (накладений платіж недоступний)</li>
                        <li className="text-xs text-gray-500">Вартість доставки розраховується згідно з тарифами Нової Пошти</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 p-6 rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">📮</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-yellow-700 mb-2">Укрпошта (по всій Україні)</h3>
                      <ul className="space-y-2 text-sm">
                        <li>✅ <strong>Вартість:</strong> 45–60₴ (згідно тарифів перевізника, залежить від ваги та регіону)</li>
                        <li>⏱️ <strong>Термін:</strong> 2-5 робочих днів</li>
                        <li>📍 Відправка у будь-яке відділення Укрпошти по Україні</li>
                        <li>💳 Оплата — тільки онлайн (накладений платіж недоступний)</li>
                        <li className="text-xs text-gray-500">Вартість доставки розраховується згідно з тарифами Укрпошти</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Кур'єрська доставка недоступна */}

                {/* Видалено кур'єрську доставку по Києву */}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">💳 Способи оплати</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white border-2 border-purple-300 rounded-lg p-6">
                  <div className="text-4xl mb-3">💳</div>
                  <h3 className="text-lg font-bold text-purple-700 mb-2">Оплата на картку</h3>
                  <ul className="space-y-2 text-sm">
                    <li>✓ Оплата на банківську картку (за реквізитами, посиланням або QR-кодом)</li>
                    <li>✓ Підтвердження після оплати</li>
                    <li>✓ Без комісії</li>
                  </ul>
                  <div className="mt-4 text-xs text-gray-600 bg-gray-50 p-3 rounded">
                    Оплата можлива лише на картку. Після оформлення замовлення ви отримаєте реквізити, посилання або QR-код для оплати. Накладений платіж та WayForPay недоступні.
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">📋 Етапи оформлення замовлення</h2>
              
              <div className="space-y-3">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <h4 className="font-bold text-purple-700">Оформлення замовлення</h4>
                    <p className="text-sm">Додайте товари в кошик та заповніть форму замовлення</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <h4 className="font-bold text-pink-700">Підтвердження</h4>
                    <p className="text-sm">Менеджер зв'яжеться з вами для підтвердження (за потреби)</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <h4 className="font-bold text-blue-700">Оплата</h4>
                    <p className="text-sm">Оплатіть замовлення на картку за реквізитами, посиланням або QR-кодом</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold flex-shrink-0">4</div>
                  <div>
                    <h4 className="font-bold text-green-700">Обробка та відправка</h4>
                    <p className="text-sm">Відправка здійснюється в день замовлення (або наступного робочого дня, якщо замовлення після 18:00)</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold flex-shrink-0">5</div>
                  <div>
                    <h4 className="font-bold text-purple-700">Отримання</h4>
                    <p className="text-sm">Отримайте товар у відділенні Нової Пошти або Укрпошти</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">⏰ Терміни доставки</h2>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200">
                <div>
                  <h4 className="font-bold text-purple-700 mb-2">🇺🇦 Доставка по всій Україні</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Термін доставки: 1-5 робочих днів (залежить від регіону та перевізника)</li>
                    <li>• Відправка здійснюється в день замовлення (або наступного робочого дня, якщо замовлення після 18:00)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">📍 Відстеження замовлення</h2>
              <p>
                Після відправки ви отримаєте:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>SMS з трек-номером ТТН</li>
                <li>Повідомлення в чат-боті з деталями доставки</li>
                <li>Можливість відстежити статус в особистому кабінеті</li>
                <li>Сповіщення про прибуття товару</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">❓ Часті питання</h2>
              
              <div className="space-y-4">
                <div className="bg-white border-l-4 border-purple-400 p-4 rounded">
                  <h4 className="font-bold mb-2">Чи можна змінити адресу доставки?</h4>
                  <p className="text-sm">Так, до моменту відправки можна змінити адресу. Зв'яжіться з нами якнайшвидше.</p>
                </div>

                <div className="bg-white border-l-4 border-pink-400 p-4 rounded">
                  <h4 className="font-bold mb-2">Що робити, якщо товар не прийшов вчасно?</h4>
                  <p className="text-sm">Напишіть нам в підтримку, ми з'ясуємо причину затримки та допоможемо вирішити проблему.</p>
                </div>

                <div className="bg-white border-l-4 border-blue-400 p-4 rounded">
                  <h4 className="font-bold mb-2">Чи можна забрати замовлення самостійно?</h4>
                  <p className="text-sm">На жаль, самовивіз з офісу наразі недоступний. Ми працюємо тільки через доставку.</p>
                </div>

                <div className="bg-white border-l-4 border-green-400 p-4 rounded">
                  <h4 className="font-bold mb-2">Скільки зберігається посилка на відділенні?</h4>
                  <p className="text-sm">Нова Пошта зберігає посилку 5 днів, далі — за тарифами перевізника (близько 15₴/день).</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">📞 Контакти служби доставки</h2>
              <div className="bg-white border-2 border-purple-300 rounded-lg p-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">📧</span>
                    <div>
                      <strong>Підтримка:</strong> <a href="https://t.me/mlp_cutie_family_bot" className="text-purple-600 hover:underline">чат-бот</a>
                      <p className="text-sm text-gray-600">Відповідаємо протягом 24 годин</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">💬</span>
                    <div>
                      <strong>Telegram:</strong> <a href="https://t.me/mlpcutiefamily" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">@mlpcutiefamily</a>
                      <p className="text-sm text-gray-600">Швидкий зв'язок у месенджері</p>
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-lg border-2 border-purple-300 text-center mt-8">
              <p className="text-lg font-semibold text-purple-700">
                🚀 Швидка доставка по всій Україні!
              </p>
              <p className="text-gray-700 mt-2">
                Ми дбаємо про те, щоб ваше замовлення прибуло швидко та безпечно
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
