'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { fetchUserOrders, type Order } from '@/lib/firebase';
import TelegramBinder from '@/app/components/client/telegram-binder';
import SupportButton from '@/app/components/client/support-button';

export default function AccountPage() {
  const { user, profile, loading, signIn, signOut, refreshProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setOrdersLoading(true);
      const list = await fetchUserOrders(user.uid);
      setOrders(list);
      setOrdersLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Завантаження...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 py-12 text-black">
        <div className="container mx-auto px-4 max-w-md text-center">
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="text-6xl mb-4">🦄</div>
            <h1 className="text-2xl font-bold mb-4 text-gray-900">Увійдіть в акаунт</h1>
            <p className="text-gray-600 mb-6 font-medium text-sm">Авторизуйтесь через Google щоб бачити історію покупок, рейтинг та бали.</p>
            <button
              onClick={() => signIn().then(() => refreshProfile())}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors"
            >
              🔐 Увійти через Google
            </button>
            <Link href="/catalog" className="block mt-6 text-purple-600 hover:text-purple-700 font-bold transition-colors">← До каталогу</Link>
          </div>
        </div>
      </main>
    );
  }

  if (profile?.isBlocked) {
    return (
      <main className="min-h-screen bg-red-50 py-12 text-black">
        <div className="container mx-auto px-4 max-w-md text-center mb-12">
          <div className="bg-white p-8 rounded-2xl shadow-2xl border-4 border-red-500">
            <div className="text-7xl mb-6">🔒</div>
            <h1 className="text-3xl font-black mb-4 text-red-600 uppercase tracking-widest">Акаунт заблоковано</h1>
            <div className="bg-red-50 p-4 rounded-xl mb-6">
              <p className="text-gray-700 font-bold mb-2">На жаль, ваш доступ до особистого кабінету призупинено.</p>
              <p className="text-sm text-gray-500 font-semibold italic">Зверніться в підтримку для з’ясування причин.</p>
            </div>
            <div className="space-y-3">
              <a
                href="https://t.me/mlp_cutie_family_bot"
                className="block w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all shadow-lg"
              >
                💌 Написати в підтримку
              </a>
              <button
                onClick={() => signOut()}
                className="w-full bg-white border-2 border-red-500 text-red-600 py-3 rounded-xl font-bold hover:bg-red-50 transition-all"
              >
                🚪 Вийти з акаунта
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const ratingBadges = [
    { level: 0, label: '🐎 Новий друг Еквестрії', color: 'bg-gray-200 text-gray-800' },
    { level: 1, label: '🌙 Друг місяця', color: 'bg-blue-100 text-blue-800' },
    { level: 2, label: '⭐ Істинний шанувальник', color: 'bg-purple-100 text-purple-800' },
    { level: 3, label: '💎 Колекціонер MLP', color: 'bg-pink-100 text-pink-800' },
    { level: 4, label: '👑 Королева Понів', color: 'bg-amber-100 text-amber-800' },
    { level: 5, label: '✨ Легенда Еквестрії', color: 'bg-green-100 text-green-800' },
  ];
  const badge = ratingBadges.find(b => b.level === profile?.rating) || ratingBadges[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'ready_for_pickup':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Очікує обробки';
      case 'processing':
        return 'В процесі';
      case 'shipped':
        return 'Відправлено';
      case 'ready_for_pickup':
        return 'Готово до забору';
      case 'completed':
        return 'Завершено';
      case 'cancelled':
        return 'Скасовано';
      default:
        return status;
    }
  };

  const getDeliveryLabel = (method: string) => {
    return 'Нова Пошта';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('uk-UA');
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-10">
        {/* Заголовок + юзер (мобільний стек) */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Мій кабінет</h1>
          <p className="text-sm sm:text-base text-gray-600 font-medium mb-6">Керуйте замовленнями та бонусами</p>

          {/* Карточка з інфо юзера */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              {user.photoURL && <img src={user.photoURL} alt="avatar" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-purple-300" />}
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{user.displayName}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button onClick={() => signOut()} className="px-4 py-2 rounded-xl bg-purple-600 text-white font-medium text-sm sm:text-base hover:bg-purple-700 transition-colors">Вийти</button>
              <SupportButton />
            </div>
          </div>
        </div>

        {/* Показники - мобільний скрол або сітка */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs sm:text-sm text-purple-600 font-medium mb-2">Рейтинг</p>
            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${badge.color}`}>{badge.label}</span>
            <p className="text-xs text-gray-500 mt-2">Рівень: {profile?.rating}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs sm:text-sm text-purple-600 font-medium mb-2">Бали</p>
            <p className="text-2xl sm:text-3xl font-bold text-purple-700">{profile?.points ?? 0}</p>
            <p className="text-xs text-gray-500 mt-2">1 = 100₴</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs sm:text-sm text-purple-600 font-medium mb-2">Знижка</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{profile?.discountPercent ?? 0}%</p>
            <p className="text-xs text-gray-500 mt-2">Автоматично</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs sm:text-sm text-purple-600 font-medium mb-2">Замовлень</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{profile?.totalOrders ?? 0}</p>
            <p className="text-xs text-gray-500 mt-2">{(profile?.totalSpent ?? 0)}₴</p>
          </div>
        </div>

        {/* Telegram Binder */}
        <section className="mb-12">
          <TelegramBinder
            uid={user.uid}
            telegramId={profile?.telegramId}
            telegramUsername={profile?.telegramUsername}
            onBoundSuccess={() => refreshProfile()}
            onUnboundSuccess={() => refreshProfile()}
          />
        </section>

        {/* Історія замовлень */}
        <section className="mb-20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">📦 Замовлення</h2>
            <button
              onClick={async () => {
                if (!user) return;
                setOrdersLoading(true);
                await refreshProfile();
                const list = await fetchUserOrders(user.uid);
                setOrders(list);
                setOrdersLoading(false);
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-sm sm:text-base hover:bg-purple-700 transition-colors"
            >
              Оновити
            </button>
          </div>
          {ordersLoading ? (
            <p className="text-purple-600 font-medium text-sm">Завантаження...</p>
          ) : orders.length === 0 ? (
            <p className="text-gray-600 text-sm">Замовлень ще немає</p>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">№ {order.id}</p>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('uk-UA')}</p>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      <p className="font-bold text-purple-700">{order.finalPrice}₴</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold w-fit sm:w-auto ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-xs">
                    {order.items.slice(0, 6).map(i => (
                      <div key={i.id} className="flex items-center gap-2 bg-gray-50 px-2 py-1.5 rounded border border-gray-200">
                        <span>{i.image}</span>
                        <span className="truncate text-gray-700">{i.name}</span>
                        <span className="text-gray-500 ml-auto">x{i.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="w-full sm:w-auto bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors font-medium text-sm"
                  >
                    📋 Деталі
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="text-center pb-16">
          <Link href="/catalog" className="inline-block bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold text-sm sm:text-base hover:bg-purple-700 transition-colors">← До каталогу</Link>
        </div>
      </div>

      {/* Модальне вікно з деталями замовлення */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-[9999]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
            {/* Заголовок модалю */}
            <div className="bg-purple-600 text-white p-4 sm:p-6 sticky top-0 z-10 rounded-t-2xl">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs opacity-90 font-medium">Замовлення №</p>
                  <p className="text-xl sm:text-2xl font-bold truncate">{selectedOrder.id}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-white text-xl font-bold hover:scale-110 transition-transform flex-shrink-0"
                  aria-label="Закрити"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Вміст модалю */}
            <div className="p-4 sm:p-6 space-y-6">
              {/* Статус */}
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-gray-700 font-semibold text-sm">Статус:</p>
                <span className={`px-3 py-1.5 rounded text-xs sm:text-sm font-bold ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>

              {/* Контактна інформація */}
              <section>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  👤 Контактна інформація
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Ім&apos;я</p>
                    <p className="font-semibold text-gray-900 text-sm">{selectedOrder.firstName}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Прізвище</p>
                    <p className="font-semibold text-gray-900 text-sm">{selectedOrder.lastName}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Email</p>
                    <p className="font-semibold text-gray-900 text-sm break-all">{selectedOrder.email}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Телефон</p>
                    <p className="font-semibold text-gray-900 text-sm">{selectedOrder.phone}</p>
                  </div>
                </div>
              </section>

              {/* Адреса доставки */}
              <section>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                  📍 Адреса доставки
                </h3>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2 text-sm">
                  <p className="text-gray-900">
                    <span className="font-semibold text-gray-600">Місто:</span> {selectedOrder.city}
                  </p>
                  <p className="text-gray-900 break-words">
                    <span className="font-semibold text-gray-600">Адреса:</span> {selectedOrder.address}
                  </p>
                  {selectedOrder.postalCode && (
                    <p className="text-gray-900">
                      <span className="font-semibold text-gray-600">Поштовий код:</span> {selectedOrder.postalCode}
                    </p>
                  )}
                </div>
              </section>

              {/* Способ доставки та оплати */}
              <section>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">
                  🚚 Доставка та оплата
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Спосіб доставки</p>
                    <p className="text-sm font-semibold text-gray-900">{getDeliveryLabel(selectedOrder.deliveryMethod)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Спосіб оплати</p>
                    <p className="text-sm font-semibold text-gray-900">Оплата онлайн</p>
                  </div>
                </div>
              </section>

              {/* Товари */}
              <section>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">
                  📦 Товари ({selectedOrder.items.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200 gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 break-words">{item.name}</p>
                        <p className="text-xs text-gray-600 mt-0.5">Категорія: {item.category}</p>
                        <p className="text-xs text-gray-600">Кількість: {item.quantity}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900">{item.price}₴ за од.</p>
                        <p className="text-xs sm:text-sm font-bold text-indigo-600">{parseInt(item.price) * item.quantity}₴</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Розрахунки */}
              <section>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">
                  💰 Розрахунки
                </h3>
                <div className="bg-white border border-gray-300 rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-900 font-semibold">
                    <span>Сума товарів:</span>
                    <span>{selectedOrder.totalPrice}₴</span>
                  </div>
                  {selectedOrder.discountAmount && selectedOrder.discountAmount > 0 ? (
                    <>
                      <div className="flex justify-between text-sm text-gray-900">
                        <span>Знижка ({selectedOrder.discountPercent}%):</span>
                        <span className="font-semibold text-green-600">−{selectedOrder.discountAmount}₴</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-900 font-semibold">
                        <span>Після знижки:</span>
                        <span>{selectedOrder.discountedSubtotal}₴</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Знижка (0%):</span>
                      <span>0₴</span>
                    </div>
                  )}
                  {selectedOrder.redeemedPoints && selectedOrder.redeemedPoints > 0 ? (
                    <div className="flex justify-between text-sm text-gray-900">
                      <span>Списано балів ({selectedOrder.redeemedPoints}):</span>
                      <span className="font-semibold text-yellow-600">−{selectedOrder.redeemedAmount}₴</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Списано балів (0):</span>
                      <span>0₴</span>
                    </div>
                  )}
                  {selectedOrder.deliveryPrice > 0 && (
                    <div className="flex justify-between text-sm text-gray-900">
                      <span>Доставка:</span>
                      <span className="font-semibold text-orange-600">+{selectedOrder.deliveryPrice}₴</span>
                    </div>
                  )}
                  {selectedOrder.deliveryPrice === 0 && (
                    <div className="flex justify-between text-sm text-gray-900">
                      <span>Доставка:</span>
                      <span className="font-semibold text-green-600">Безкоштовна ✓</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm sm:text-base font-bold text-white pt-2 border-t border-gray-400 bg-indigo-600 -mx-3 -mb-3 sm:-mx-4 sm:-mb-4 px-3 sm:px-4 py-2 sm:py-3 rounded-b-lg">
                    <span>До оплати:</span>
                    <span>{selectedOrder.finalPrice}₴</span>
                  </div>
                </div>
              </section>

              {/* Коментарі */}
              {selectedOrder.comments && (
                <section>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">
                    📝 Коментарі
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap break-words">{selectedOrder.comments}</p>
                </section>
              )}

              {/* Дати */}
              <section>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">
                  📅 Дати
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Створено</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Оновлено</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(selectedOrder.updatedAt)}</p>
                  </div>
                </div>
              </section>

              {/* Кнопка закрити */}
              <div className="pt-3 border-t border-gray-300">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 sm:py-2.5 rounded-lg transition-colors"
                >
                  Закрити
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
