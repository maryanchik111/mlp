import Link from "next/link";

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8">
          ← Повернутися на головну
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border-4 border-purple-200">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">↩️</div>
            <h1 className="text-3xl md:text-4xl font-black text-purple-700 mb-2">
              Повернення та обмін
            </h1>
            <p className="text-gray-600">Оновлено: 06 лютого 2026</p>
          </div>

          <div className="prose prose-purple max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">📋 Загальні умови</h2>
              <p>
                MLP Cutie Family дбає про задоволеність кожного клієнта. Якщо ви з будь-якої причини не задоволені покупкою, 
                ви можете повернути або обміняти товар протягом 14 днів з моменту отримання.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">✅ Умови прийняття товару назад</h2>
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
              <h2 className="text-2xl font-bold text-purple-700 mb-3">🔄 Порядок повернення</h2>
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
              <h2 className="text-2xl font-bold text-purple-700 mb-3">🔁 Обмін товару</h2>
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
              <h2 className="text-2xl font-bold text-purple-700 mb-3">⚠️ Товари, що не підлягають поверненню</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Товари з порушеною упаковкою (якщо цього вимагають санітарні норми)</li>
                <li>Колекційні фігурки з відкритою упаковкою</li>
                <li>Товари на замовлення (custom або персоналізовані)</li>
                <li>Товари зі знижкою понад 50% (якщо не є браком)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">🛡️ Гарантія якості</h2>
              <p>
                Якщо ви отримали бракований товар або товар не відповідає опису:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Зробіть фото товару та браку</li>
                <li>Зв'яжіться з нами протягом 48 годин з моменту отримання</li>
                <li>Ми організуємо безкоштовну заміну або повернення коштів</li>
                <li>Всі витрати на доставку компенсуються</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">💰 Повернення коштів</h2>
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
              <h2 className="text-2xl font-bold text-purple-700 mb-3">📅 Терміни</h2>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200">
                <ul className="space-y-2">
                  <li>📦 <strong>Термін повернення:</strong> 14 днів з моменту отримання</li>
                  <li>⏰ <strong>Відповідь підтримки:</strong> до 24 годин</li>
                  <li>✅ <strong>Перевірка товару:</strong> 1-3 робочих дні</li>
                  <li>💳 <strong>Повернення коштів:</strong> 5-10 робочих днів</li>
                  <li>🚚 <strong>Відправка заміни:</strong> 2-3 робочих дні</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">📞 Контакти служби підтримки</h2>
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
                💝 Ваша задоволеність - наш пріоритет!
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
