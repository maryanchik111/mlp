'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getPaymentConfig } from '@/lib/firebase';
import { Suspense } from 'react';

interface PaymentDetails {
  orderId: string;
  totalAmount: number;
  customerName: string;
}

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const paymentConfig = getPaymentConfig();

  useEffect(() => {
    setMounted(true);
    // Отримуємо дані з URL параметрів
    const orderId = searchParams.get('orderId');
    const totalAmount = searchParams.get('totalAmount');
    const customerName = searchParams.get('customerName');

    if (orderId && totalAmount && customerName) {
      setPaymentDetails({
        orderId,
        totalAmount: parseInt(totalAmount),
        customerName,
      });
    }
  }, [searchParams]);

  const handleCopyCardNumber = () => {
    navigator.clipboard.writeText(paymentConfig.cardNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!mounted || !paymentDetails) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">Завантаження даних оплати...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Заголовок */}
        <div className="mb-8">
          <Link href="/catalog" className="text-purple-600 hover:text-purple-700 mb-4 inline-block text-sm sm:text-base">
            ← Повернутися до каталогу
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">💳 Оплата замовлення</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Замовлення №{paymentDetails.orderId.substring(0, 8)}</p>
        </div>

        {/* Основний контент */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Ліва колона - способи оплати */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              {/* QR код */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  📱 Оплата через QR-код
                </h2>
                <div className="flex flex-col items-center p-8 bg-gray-50 rounded-lg">
                  <img
                    src={paymentConfig.qrCode}
                    alt="QR код для оплати"
                    className="w-48 h-48 sm:w-56 sm:h-56"
                  />
                  <p className="text-center text-gray-600 mt-4 text-sm sm:text-base">
                    Відскануйте QR-код камерою вашого смартфона
                  </p>
                </div>
              </section>

              {/* Номер карти */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  💳 Оплата карткою
                </h2>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg p-6 text-white">
                    <p className="text-sm opacity-90 mb-2">Номер картки</p>
                    <p className="text-2xl font-bold tracking-wider mb-4">{paymentConfig.cardNumber}</p>
                    <p className="text-sm">Видавець: {paymentConfig.cardName}</p>
                  </div>

                  <button
                    onClick={handleCopyCardNumber}
                    className={`w-full py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
                      copied
                        ? 'bg-green-600 text-white'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {copied ? '✅ Скопійовано!' : '📋 Скопіювати номер картки'}
                  </button>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <p className="font-semibold mb-2">ℹ️ Інструкція оплати:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Скопіюйте номер картки або відскануйте QR-код</li>
                      <li>Введіть номер в платіжну систему вашого банку</li>
                      <li>Підтвердіть оплату через SMS або мобільний додаток</li>
                      <li>Отримайте підтвердження переводу</li>
                    </ol>
                  </div>
                </div>
              </section>

              {/* Посилання на оплату */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  🔗 Посилання для оплати
                </h2>
                <a
                  href={paymentConfig.paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all text-center text-sm sm:text-base"
                >
                  🌐 Перейти на сторінку оплати
                </a>
                <p className="text-xs sm:text-sm text-gray-600 mt-3 text-center">
                  Натисніть кнопку, щоб перейти на безпечну сторінку оплати нашого партнера
                </p>
              </section>
            </div>
          </div>

          {/* Права колона - інформація про замовлення */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4 space-y-6">
              <h2 className="text-lg font-bold text-gray-900">📦 Деталі замовлення</h2>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Замовник</p>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">{paymentDetails.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Номер замовлення</p>
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm break-all">{paymentDetails.orderId}</p>
                </div>
              </div>

              {/* Сума */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-200">
                <p className="text-sm text-gray-600 mb-1">Сума до оплати</p>
                <p className="text-3xl font-bold text-purple-600">{paymentDetails.totalAmount}₴</p>
              </div>

              {/* Статуси оплати */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-800 mb-2">✅ Оплата безпечна</p>
                <p className="text-xs text-green-700">
                  Всі ваші дані передаються через захищений протокол SSL
                </p>
              </div>

              {/* Кнопки навігації */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <Link
                  href="/catalog"
                  className="block text-center bg-gray-200 text-gray-800 font-bold py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
                >
                  ← До каталогу
                </Link>
              </div>

              {/* Інформація про контакти */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <p className="font-semibold mb-1">❓ Потрібна допомога?</p>
                <p>Напишіть нам на email: support@mlpshop.ua</p>
              </div>
            </div>
          </div>
        </div>

        {/* Нижня інформація */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600 text-sm sm:text-base">
            Дякуємо за вашу покупку! 🦄 Після оплати ви отримаєте підтвердження на email
          </p>
        </div>
      </div>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">Завантаження...</p>
          </div>
        </div>
      </main>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}
