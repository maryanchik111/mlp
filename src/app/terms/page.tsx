import Link from "next/link";
import {
  ScaleIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
} from '@heroicons/react/24/solid';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8">
          ← Повернутися на головну
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border-4 border-purple-200">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <ScaleIcon className="w-16 h-16 text-purple-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-purple-700 mb-2">
              Умови використання
            </h1>
            <p className="text-gray-600">Оновлено: 06 лютого 2026</p>
          </div>

          <div className="prose prose-purple max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">1. Прийняття умов</h2>
              <p>
                Використовуючи веб-сайт MLP Cutie Family, ви погоджуєтесь з цими умовами використання. 
                Якщо ви не згодні з будь-якою частиною цих умов, будь ласка, не користуйтесь нашим сайтом.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">2. Оформлення замовлення</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Всі ціни на сайті вказані в гривнях (₴)</li>
                <li>Мінімальна сума замовлення - без обмежень</li>
                <li>Замовлення обробляються протягом 1-2 робочих днів</li>
                <li>Ми залишаємо за собою право відмовити в обробці замовлення у виняткових випадках</li>
                <li>Підтвердження замовлення надсилається на вказану електронну пошту</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">3. Оплата</h2>
              <p>
                Оплата здійснюється онлайн через платіжну систему WayForPay. Ми приймаємо картки Visa та Mastercard. 
                Всі платежі захищені за допомогою 3D Secure.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Оплата повинна бути проведена до відправки замовлення</li>
                <li>У разі відміни замовлення до відправки, кошти повертаються протягом 5-10 робочих днів</li>
                <li>Чеки та фіскальні документи надаються на вимогу</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">4. Доставка</h2>
              <p>
                Доставка здійснюється службами Нова Пошта або кур'єром по Україні. Детальніше про умови доставки 
                ви можете дізнатися на <Link href="/delivery" className="text-purple-600 hover:underline">сторінці доставки</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">5. Якість товару</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Всі товари є оригінальними та сертифікованими</li>
                <li>Ми гарантуємо відповідність товару опису на сайті</li>
                <li>У разі отримання дефектного товару, зв'яжіться з нами протягом 14 днів</li>
                <li>Фото товарів на сайті можуть незначно відрізнятися від оригіналу</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">6. Повернення та обмін</h2>
              <p>
                Повернення товару можливе протягом 14 днів з моменту отримання. Детальні умови повернення описані на 
                <Link href="/refund" className="text-purple-600 hover:underline"> сторінці повернення</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">7. Програма лояльності</h2>
              <p>
                Авторизовані користувачі автоматично беруть участь у програмі лояльності:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>За кожну покупку нараховуються бали (1₴ = 1 бал)</li>
                <li>Бали можна використати для оплати до 50% суми замовлення</li>
                <li>Накопичувальна знижка залежить від суми покупок</li>
                <li>Бали не мають терміну дії</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">8. Інтелектуальна власність</h2>
              <p>
                Весь контент на сайті, включаючи зображення, тексти, логотипи та дизайн, захищений авторським правом. 
                Використання матеріалів без письмового дозволу заборонено.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">9. Обмеження відповідальності</h2>
              <p>
                MLP Cutie Family не несе відповідальності за:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Затримки доставки з вини служб доставки</li>
                <li>Технічні збої на стороні платіжної системи</li>
                <li>Неправильно вказані клієнтом дані для доставки</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">10. Зміни умов</h2>
              <p>
                Ми залишаємо за собою право змінювати ці умови в будь-який час. Нова версія набуває чинності з моменту 
                публікації на сайті. Використання сайту після внесення змін означає вашу згоду з новими умовами.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-purple-700 mb-3">11. Контакти</h2>
              <p>
                Якщо у вас виникли питання щодо умов використання:
              </p>
              <ul className="list-none space-y-2">
                <li className="flex items-center gap-2"><EnvelopeIcon className="w-4 h-4 text-purple-500 flex-shrink-0" /> Email: <a href="mailto:support@mlp.store" className="text-purple-600 hover:underline">support@mlp.store</a></li>
                <li className="flex items-center gap-2"><DevicePhoneMobileIcon className="w-4 h-4 text-purple-500 flex-shrink-0" /> Telegram: <a href="https://t.me/mlpcutiefamily" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">@mlpcutiefamily</a></li>
                <li className="flex items-center gap-2"><ClockIcon className="w-4 h-4 text-purple-500 flex-shrink-0" /> Робочі години: Пн-Нд, 9:00 - 21:00</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
