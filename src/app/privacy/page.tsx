import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8">
          ← Повернутися на головну
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border-4 border-purple-200">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-purple-700 mb-2">
              Політика конфіденційності
            </h1>
            <p className="text-gray-600">Оновлено: 06 лютого 2026</p>
          </div>

          <div className="prose prose-purple max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">1. Збір інформації</h2>
              <p>
                MLP Cutie Family збирає та обробляє персональні дані для забезпечення якісного обслуговування наших клієнтів.
                Ми збираємо інформацію, яку ви надаєте під час реєстрації, оформлення замовлення або зв'язку з підтримкою.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ім'я та прізвище</li>
                <li>Адреса електронної пошти</li>
                <li>Номер телефону</li>
                <li>Адреса доставки</li>
                <li>Дані про замовлення та покупки</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">2. Використання інформації</h2>
              <p>Зібрані дані використовуються для:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Обробки та виконання замовлень</li>
                <li>Зв'язку з клієнтами щодо їх замовлень</li>
                <li>Поліпшення якості обслуговування</li>
                <li>Надсилання інформації про нові товари та акції (за згодою)</li>
                <li>Програми лояльності та накопичувальних знижок</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">3. Захист даних</h2>
              <p>
                Ми використовуємо сучасні методи захисту інформації, включаючи шифрування SSL/TLS для всіх транзакцій.
                Платіжні дані обробляються через захищену платіжну систему WayForPay і не зберігаються на наших серверах.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">4. Розкриття інформації третім особам</h2>
              <p>
                Ми не продаємо та не передаємо ваші персональні дані третім особам без вашої згоди, за винятком випадків,
                необхідних для виконання замовлення (служби доставки) або вимог законодавства.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">5. Cookies</h2>
              <p>
                Наш сайт використовує cookies для покращення користувацького досвіду, зберігання налаштувань та аналітики.
                Ви можете керувати налаштуваннями cookies у вашому браузері.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">6. Ваші права</h2>
              <p>Ви маєте право:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Отримати доступ до своїх персональних даних</li>
                <li>Виправити неточні дані</li>
                <li>Видалити свій акаунт та дані</li>
                <li>Відмовитися від розсилок</li>
                <li>Подати скаргу до наглядового органу</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">7. Контакти</h2>
              <p>
                Якщо у вас є питання щодо політики конфіденційності, зв'яжіться з нами:
              </p>
              <ul className="list-none space-y-2">
                <li>Telegram: <a href="https://t.me/mlpcutiefamily" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline">@mlpcutiefamily</a></li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
