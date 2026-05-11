'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getPaymentConfig, fetchOrderStatus, createReview, hasReviewForOrder } from '@/lib/firebase';
import { useAuth, useModal } from '@/app/providers';
import { Suspense } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  RocketLaunchIcon,
  SparklesIcon,
  StarIcon,
  ShoppingBagIcon,
  UserIcon,
  HomeIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  BoltIcon,
  ClipboardDocumentIcon,
  InformationCircleIcon,
  LinkIcon,
  GlobeAltIcon,
  CubeIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  CheckIcon,
} from '@heroicons/react/24/solid';

interface PaymentDetails {
  orderId: string;
  totalAmount: number;
  customerName: string;
}

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { showWarning } = useModal();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const paymentConfig = getPaymentConfig();
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSaved, setReviewSaved] = useState(false);
  const [hasReview, setHasReview] = useState(false);
  const earnedPoints = paymentDetails ? Math.floor((paymentDetails.totalAmount || 0) / 100) : 0;

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

  // Перевірка наявності відгуку (має бути перед будь-якими early returns)
  useEffect(() => {
    const check = async () => {
      if (!paymentConfirmed) return;
      if (!paymentDetails?.orderId) return;
      const exists = await hasReviewForOrder(paymentDetails.orderId);
      setHasReview(exists);
    };
    check();
  }, [paymentConfirmed, paymentDetails?.orderId]);

  const handleCopyCardNumber = () => {
    navigator.clipboard.writeText(paymentConfig.cardNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckPayment = async () => {
    if (!paymentDetails?.orderId) return;

    setIsChecking(true);

    // Polling функція - перевіряємо статус кожні 3 секунди
    const checkStatus = async () => {
      const status = await fetchOrderStatus(paymentDetails.orderId);

      if (status === 'processing' || status === 'completed') {
        setPaymentConfirmed(true);
        setIsChecking(false);
        return true;
      }
      return false;
    };

    // Перша перевірка одразу
    const confirmed = await checkStatus();
    if (confirmed) return;

    // Запускаємо polling кожні 3 секунди
    const intervalId = setInterval(async () => {
      const confirmed = await checkStatus();
      if (confirmed) {
        clearInterval(intervalId);
      }
    }, 3000);

    // Зупиняємо polling через 5 хвилин (100 спроб)
    setTimeout(() => {
      clearInterval(intervalId);
      if (isChecking) {
        setIsChecking(false);
        showWarning('Спробуйте ще раз або зв\'яжіться з підтримкою.');
      }
    }, 300000); // 5 хвилин
  };

  if (!mounted || !paymentDetails) {
    return (
      <main className="min-h-screen bg-white py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white border border-gray-300 rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">Завантаження даних оплати...</p>
          </div>
        </div>
      </main>
    );
  }

  const handleSubmitReview = async () => {
    if (!user || !paymentDetails) return;
    if (reviewSaved) return;
    const ok = await createReview(paymentDetails.orderId, {
      orderId: paymentDetails.orderId,
      userName: user.displayName || user.email || 'Гість',
      userPhoto: user.photoURL || undefined,
      rating: reviewRating,
      text: reviewText.trim()
    });
    if (ok) {
      setReviewSaved(true);
      setHasReview(true);
    } else {
      showWarning('Відгук вже існує або сталася помилка');
    }
  };

  // Якщо оплата підтверджена - показуємо сторінку подяки
  if (paymentConfirmed) {
    return (
      <main className="min-h-screen bg-white py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white border border-gray-300 rounded-lg shadow-md p-8 sm:p-12 text-center">
            {/* Іконка успіху */}
            <div className="mb-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <CheckCircleIcon className="w-14 h-14 text-green-500" />
              </div>
            </div>

            {/* Заголовок */}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Дякуємо за оплату!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Ваше замовлення <span className="font-semibold text-indigo-600">№{paymentDetails.orderId}</span> успішно оплачено
            </p>

            {/* Інформаційні блоки */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 hover:shadow-md transition-all">
                <div className="flex justify-center mb-2"><ClockIcon className="w-8 h-8 text-gray-500" /></div>
                <p className="text-sm text-gray-600 mb-1">Статус</p>
                <p className="font-bold text-gray-900">В обробці</p>
              </div>
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 hover:shadow-md transition-all">
                <div className="flex justify-center mb-2"><CurrencyDollarIcon className="w-8 h-8 text-green-500" /></div>
                <p className="text-sm text-gray-600 mb-1">Сума</p>
                <p className="font-bold text-gray-900">{paymentDetails.totalAmount}₴</p>
              </div>
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 hover:shadow-md transition-all">
                <div className="flex justify-center mb-2"><EnvelopeIcon className="w-8 h-8 text-blue-500" /></div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-bold text-gray-900">Надіслано</p>
              </div>
            </div>

            {/* Що далі */}
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2"><RocketLaunchIcon className="w-6 h-6 text-indigo-500" /> Що далі?</h2>
              <div className="text-left space-y-3 max-w-xl mx-auto">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center flex-shrink-0">1</span>
                  <p className="text-gray-700">
                    <strong>Підтвердження:</strong> Ми надіслали деталі замовлення на ваш email
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center flex-shrink-0">2</span>
                  <p className="text-gray-700">
                    <strong>Обробка:</strong> Ваше замовлення буде зібране протягом 1-2 робочих днів
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center flex-shrink-0">3</span>
                  <p className="text-gray-700">
                    <strong>Доставка:</strong> Відправимо товар обраним способом доставки
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center flex-shrink-0">4</span>
                  <p className="text-gray-700">
                    <strong>Отримання:</strong> Насолоджуйтесь вашою покупкою!
                  </p>
                </div>
              </div>
            </div>

            {/* Бонуси за оплату */}
            {earnedPoints > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 shadow-sm">
                <p className="text-amber-900 text-base sm:text-lg font-semibold text-center flex items-center justify-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-amber-500" /> Ви отримали <span className="text-amber-800 font-bold">+{earnedPoints}</span> балів {user ? 'у ваш акаунт' : ''} за це замовлення
                </p>
                {!user && (
                  <p className="text-amber-800 text-xs text-center mt-1">Увійдіть в акаунт, щоб зберігати та використовувати бали</p>
                )}
              </div>
            )}

            {/* Відгук після оплати */}
            {user && !hasReview && (
              <div className="bg-white border border-gray-300 rounded-lg p-6 mb-8 text-left shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2"><StarIcon className="w-6 h-6 text-yellow-400" /> Залишити відгук</h2>
                <p className="text-sm text-gray-600 mb-4">Поділіться враженнями про покупку. Ваш рейтинг допоможе іншим користувачам.</p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Рейтинг:</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`text-3xl transition-all ${star <= reviewRating ? 'text-yellow-400 scale-110' : 'text-gray-300 hover:text-yellow-300'} hover:scale-125`}
                        aria-label={`Оцінка ${star}`}
                      >★</button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Коментар (необов'язково):</label>
                  <textarea
                    rows={3}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Що вам сподобалось?"
                    className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-900 placeholder-gray-400"
                  />
                </div>
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewSaved}
                  className={`w-full py-2 rounded-lg font-bold transition-all ${reviewSaved ? 'bg-green-600 text-white shadow-sm' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >{reviewSaved ? <span className="flex items-center justify-center gap-2"><CheckIcon className="w-5 h-5" /> Відгук збережено</span> : <span className="flex items-center justify-center gap-2"><DocumentTextIcon className="w-5 h-5" /> Надіслати відгук</span>}</button>
              </div>
            )}
            {user && hasReview && (
              <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-8 text-left shadow-sm">
                <p className="text-green-900 text-sm font-semibold flex items-center gap-2"><CheckCircleIcon className="w-4 h-4" /> Ви вже залишили відгук для цього замовлення. Дякуємо!</p>
              </div>
            )}

            {/* Кнопки */}
            <div className="space-y-3">
              <Link
                href="/catalog"
                className="block w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-all"
              >
                🛍️ Продовжити покупки
              </Link>
              <Link
                href="/account"
                className="block w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-all"
              >
                👤 Перейти в акаунт
              </Link>
              <Link
                href="/"
                className="block w-full bg-gray-100 border border-gray-300 text-gray-900 font-bold py-3 rounded-lg hover:bg-gray-200 transition-all"
              >
                🏠 На головну
              </Link>
            </div>

            {/* Контактна інформація */}
            <div className="mt-8 pt-8 border-t border-gray-300">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Потрібна допомога?</strong>
              </p>
              <p className="text-sm text-gray-600">
                Перейти до: <a href="https://t.me/mlp_cutie_family_bot" className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline transition-colors underline">чат-боту</a>
              </p>
            </div>
          </div>

          {/* Додаткова інформація */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Замовлення №{paymentDetails.orderId} • {paymentDetails.customerName}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Сторінка оплати (до підтвердження)
  return (
    <main className="min-h-screen bg-white py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Заголовок */}
        <div className="mb-8">
          <Link href="/catalog" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 mb-4 text-sm sm:text-base font-semibold transition-colors">
            <ArrowLeftIcon className="w-4 h-4" /> Повернутися до каталогу
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center gap-3"><CreditCardIcon className="w-9 h-9 text-indigo-500" /> Оплата замовлення</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Замовлення №{paymentDetails.orderId}</p>
        </div>

        {/* Основний контент */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Ліва колона - способи оплати */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-300 rounded-lg shadow-md p-6 space-y-6">
              {/* Банка Monobank */}
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300 flex items-center gap-2">
                  <BuildingLibraryIcon className="w-5 h-5 text-indigo-500" /> Банка Monobank
                </h2>
                <div className="bg-gradient-to-br from-pink-50 to-purple-50 border border-purple-200 rounded-xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex-shrink-0 bg-white p-2 rounded-lg border border-purple-100 shadow-sm">
                      <img
                        src={paymentConfig.jarQrCode}
                        alt="QR код для банки Monobank"
                        className="w-32 h-32 sm:w-40 sm:h-40"
                      />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-gray-900 font-bold text-lg mb-2">Оплата на банку Monobank</p>
                      <p className="text-gray-600 text-sm">
                        Це найшвидший та найзручніший спосіб оплати через додаток Monobank або Apple/Google Pay.
                      </p>
                      <p className='text-red-500 text-sm mb-4'>Введіть суму та вкажіть ваш номер замовлення в полі "Коментар"!</p>
                        <a href={paymentConfig.monobankJar} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 w-full sm:w-auto px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-md">
                          <BoltIcon className="w-5 h-5" /> Оплатити в 1 клік
                        </a>
                    </div>
                  </div>
                </div>
              </section>

              {/* Номер картки */}
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300 flex items-center gap-2">
                  <CreditCardIcon className="w-5 h-5 text-indigo-500" /> Оплата карткою
                </h2>
                <div className="space-y-4">
                  <div className="bg-indigo-600 rounded-lg p-6 text-white shadow-md hover:shadow-lg transition-all">
                    <p className="text-sm opacity-90 mb-2">Номер картки</p>
                    <p className="text-2xl font-bold tracking-wider mb-4">{paymentConfig.cardNumber}</p>
                    <p className="text-sm">Видавець: {paymentConfig.cardName}</p>
                  </div>

                  <button
                    onClick={handleCopyCardNumber}
                    className={`w-full py-2 rounded-lg font-bold transition-all text-sm sm:text-base ${copied
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                  >
                    {copied ? <span className="flex items-center justify-center gap-2"><CheckIcon className="w-4 h-4" /> Скопійовано!</span> : <span className="flex items-center justify-center gap-2"><ClipboardDocumentIcon className="w-4 h-4" /> Скопіювати номер картки</span>}
                  </button>

                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 text-sm text-blue-900 shadow-sm">
                    <p className="font-semibold mb-2 flex items-center gap-2"><InformationCircleIcon className="w-4 h-4" /> Інструкція оплати:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Скопіюйте номер картки або відскануйте QR-код</li>
                      <li>Введіть номер в платіжну систему вашого банку</li>
                      <li>Підтвердіть оплату через SMS або мобільний додаток</li>
                      <li>Отримайте підтвердження переводу</li>
                    </ol>
                  </div>
                </div>
              </section>


              {/* Посилання для оплати */}
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300 flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-indigo-500" /> Посилання для оплати
                </h2>
                <a
                  href={paymentConfig.paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-all text-center text-sm sm:text-base">
                  <GlobeAltIcon className="w-5 h-5" /> Перейти на сторінку оплати
                </a>
                <p className="text-xs sm:text-sm text-gray-600 mt-3 text-center">
                  Натисніть кнопку, щоб перейти на безпечну сторінку оплати нашого партнера
                </p>
              </section>
            </div>
          </div>

          {/* Права колона - інформація про замовлення */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-300 rounded-lg shadow-md p-6 sticky top-4 space-y-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><CubeIcon className="w-5 h-5 text-indigo-500" /> Деталі замовлення</h2>

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
              <div className="flex flex-col justify-center items-center bg-indigo-50 p-4 rounded-lg border border-indigo-300 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Сума до оплати</p>
                <p className="text-3xl font-bold text-indigo-600">{paymentDetails.totalAmount}₴</p>
              </div>

              {/* Статуси оплати */}
              <div className="bg-green-50 border border-green-300 rounded-lg p-4 shadow-sm">
                <p className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2"><ShieldCheckIcon className="w-4 h-4" /> Оплата безпечна</p>
                <p className="text-xs text-green-800">
                  Всі ваші дані передаються через захищений протокол SSL
                </p>
              </div>

              {/* Кнопки навігації */}
              <div className="space-y-3 pt-4 border-t border-gray-300">
                {!paymentConfirmed ? (
                  <button
                    onClick={handleCheckPayment}
                    disabled={isChecking}
                    className={`block w-full text-center font-bold py-3 rounded-lg transition-all text-sm sm:text-base ${isChecking
                      ? 'bg-blue-400 text-white cursor-wait shadow-sm'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                  >
                    {isChecking ? (
                      <span className="flex items-center justify-center gap-2">
                        <ArrowPathIcon className="w-5 h-5 animate-spin" /> Перевірка оплати...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <MagnifyingGlassIcon className="w-5 h-5" /> Перевірити оплату
                      </span>
                    )}
                  </button>
                ) : (
                  <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-center shadow-sm">
                    <p className="text-green-900 font-bold text-lg flex items-center justify-center gap-2"><CheckCircleIcon className="w-6 h-6" /> Оплату підтверджено!</p>
                    <p className="text-green-800 text-sm mt-1">Ваше замовлення в обробці</p>
                  </div>
                )}
                <Link
                  href="/catalog"
                  className="block text-center bg-gray-100 border border-gray-300 text-gray-900 font-bold py-2 rounded-lg hover:bg-gray-200 transition-all text-sm sm:text-base"
                >
                  ← До каталогу
                </Link>
              </div>

              {/* Інформація про контакти */}
              <div className="bg-gradient-to-br from-blue-100/80 to-cyan-100/80 backdrop-blur-sm border-2 border-blue-200/50 rounded-2xl p-4 text-xs text-blue-800 shadow-md">
                <p className="font-semibold mb-1 flex items-center gap-2"><ChatBubbleLeftRightIcon className="w-4 h-4" /> Потрібна допомога?</p>
                <p>Зверніться до: <a href="https://t.me/mlp_cutie_family_bot" className="font-semibold text-blue-700 hover:text-blue-900 transition-colors underline">чат-боту</a></p>
              </div>
            </div>
          </div>
        </div>

        {/* Нижня інформація */}
        <div className="mt-8 bg-white border border-gray-300 rounded-lg shadow-md p-6 text-center mb-12">
          <p className="text-gray-600 text-sm sm:text-base">
            Дякуємо за вашу покупку! ✨ Після оплати ви отримаєте підтвердження на email або телеграм-бот (якщо у вас прив'язаний телеграм)
          </p>
        </div>
      </div>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white border border-gray-300 rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">Завантаження...</p>
          </div>
        </div>
      </main>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}
