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
                      <h3 className="text-xl font-bold text-blue-700 mb-2">Нова Пошта - відділення</h3>
                      <ul className="space-y-2 text-sm">
                        <li>✅ <strong>Вартість:</strong> 120₴ (безкоштовно при замовленні від 1500₴)</li>
                        <li>⏱️ <strong>Термін:</strong> 1-3 робочих дні по Україні</li>
                        <li>📍 Самовивіз з будь-якого відділення Нової Пошти</li>
                        <li>💳 Можливість оплати при отриманні (накладений платіж +40₴)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 p-6 rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🏠</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-green-700 mb-2">Нова Пошта - кур'єр</h3>
                      <ul className="space-y-2 text-sm">
                        <li>✅ <strong>Вартість:</strong> 150₴ (безкоштовно при замовленні від 2000₴)</li>
                        <li>⏱️ <strong>Термін:</strong> 1-3 робочих дні</li>
                        <li>🏘️ Доставка за вказаною адресою</li>
                        <li>💳 Можливість оплати при отриманні (накладений платіж +40₴)</li>
                        <li>📞 Кур'єр передзвонить за годину до доставки</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-500 p-6 rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🚗</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-purple-700 mb-2">Кур'єрська доставка (Київ)</h3>
                      <ul className="space-y-2 text-sm">
                        <li>✅ <strong>Вартість:</strong> 100₴ (безкоштовно при замовленні від 1000₴)</li>
                        <li>⏱️ <strong>Термін:</strong> 1-2 робочих дні</li>
                        <li>🗺️ Доставка по Києву та Київській області</li>
                        <li>💳 Оплата готівкою або карткою кур'єру</li>
                        <li>📞 Узгодження зручного часу доставки</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">💳 Способи оплати</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white border-2 border-purple-300 rounded-lg p-6">
                  <div className="text-4xl mb-3">💻</div>
                  <h3 className="text-lg font-bold text-purple-700 mb-2">Онлайн оплата</h3>
                  <ul className="space-y-2 text-sm">
                    <li>✓ Картки Visa / Mastercard</li>
                    <li>✓ Захищена система WayForPay</li>
                    <li>✓ 3D Secure</li>
                    <li>✓ Миттєве підтвердження</li>
                    <li>✓ Без комісії</li>
                  </ul>
                  <div className="mt-4 text-xs text-gray-600 bg-gray-50 p-3 rounded">
                    Рекомендований спосіб - швидко, безпечно та зручно!
                  </div>
                </div>

                <div className="bg-white border-2 border-blue-300 rounded-lg p-6">
                  <div className="text-4xl mb-3">📦</div>
                  <h3 className="text-lg font-bold text-blue-700 mb-2">При отриманні</h3>
                  <ul className="space-y-2 text-sm">
                    <li>✓ Готівка або картка</li>
                    <li>✓ Накладений платіж (+40₴)</li>
                    <li>✓ Оплата кур'єру / на пошті</li>
                    <li>✓ Можливість перевірити товар</li>
                  </ul>
                  <div className="mt-4 text-xs text-gray-600 bg-gray-50 p-3 rounded">
                    Доступно для всіх способів доставки
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
                    <p className="text-sm">Оплатіть замовлення онлайн або оберіть оплату при отриманні</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold flex-shrink-0">4</div>
                  <div>
                    <h4 className="font-bold text-green-700">Обробка та відправка</h4>
                    <p className="text-sm">Замовлення обробляється протягом 1-2 робочих днів</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold flex-shrink-0">5</div>
                  <div>
                    <h4 className="font-bold text-purple-700">Отримання</h4>
                    <p className="text-sm">Отримайте товар у відділенні або від кур'єра</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">⏰ Терміни доставки</h2>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold text-purple-700 mb-2">🇺🇦 Доставка по Україні</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Київ, Харків, Одеса, Дніпро: 1-2 дні</li>
                      <li>• Обласні центри: 2-3 дні</li>
                      <li>• Інші міста: 2-4 дні</li>
                      <li>• Віддалені населені пункти: 3-5 днів</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-pink-700 mb-2">📦 Обробка замовлень</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Замовлення до 15:00 - відправка того ж дня</li>
                      <li>• Замовлення після 15:00 - наступного дня</li>
                      <li>• Вихідні та святкові - наступний робочий день</li>
                    </ul>
                  </div>
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
                <li>Лист на email з деталями доставки</li>
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
                  <p className="text-sm">Нова Пошта зберігає - 5 днів безкоштовно, далі за тарифами перевізника (близько 15₴/день).</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">📞 Контакти служби доставки</h2>
              <div className="bg-white border-2 border-purple-300 rounded-lg p-6">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <span className="text-2xl">📧</span>
                    <div>
                      <strong>Email:</strong> <a href="mailto:delivery@mlp.store" className="text-purple-600 hover:underline">delivery@mlp.store</a>
                    </div>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-2xl">💬</span>
                    <div>
                      <strong>Telegram:</strong> <a href="https://t.me/mlpcutiefamily" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">@mlpcutiefamily</a>
                    </div>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-2xl">📱</span>
                    <div>
                      <strong>Пн-Нд:</strong> 9:00 - 21:00
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
