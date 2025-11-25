'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { fetchUserOrders, type Order } from '@/lib/firebase';

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
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-md text-center">
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="text-6xl mb-4">🦄</div>
            <h1 className="text-2xl font-bold mb-4 text-gray-900">Увійдіть в акаунт</h1>
            <p className="text-gray-600 mb-6">Авторизуйтесь через Google щоб бачити історію покупок, рейтинг та бали.</p>
            <button
              onClick={() => signIn().then(() => refreshProfile())}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              🔐 Увійти через Google
            </button>
            <Link href="/catalog" className="block mt-6 text-purple-600 hover:text-purple-700">← До каталогу</Link>
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
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">👤 Мій кабінет</h1>
            <p className="text-gray-600">Керуйте своїми замовленнями та бонусами</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {user.photoURL && <img src={user.photoURL} alt="avatar" className="w-12 h-12 rounded-full border" />}
              <div>
                <p className="font-semibold text-gray-900">{user.displayName}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <button onClick={() => signOut()} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300">Вийти</button>
          </div>
        </div>

        {/* Показники */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-500 mb-1">Рейтинг</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>{badge.label}</span>
            <p className="text-xs text-gray-400 mt-2">Рівень: {profile?.rating}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-500 mb-1">Бали</p>
            <p className="text-2xl font-bold text-purple-600">{profile?.points ?? 0}</p>
            <p className="text-xs text-gray-400 mt-2">1 бал = 100₴ покупок</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-500 mb-1">Знижка</p>
            <p className="text-2xl font-bold text-green-600">{profile?.discountPercent ?? 0}%</p>
            <p className="text-xs text-gray-400 mt-2">Надається автоматично</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-500 mb-1">Замовлень</p>
            <p className="text-2xl font-bold text-blue-600">{profile?.totalOrders ?? 0}</p>
            <p className="text-xs text-gray-400 mt-2">Загалом: {(profile?.totalSpent ?? 0)}₴</p>
          </div>
        </div>

        {/* Історія замовлень */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">📦 Історія замовлень</h2>
            <button
              onClick={async () => {
                if (!user) return;
                setOrdersLoading(true);
                await refreshProfile();
                const list = await fetchUserOrders(user.uid);
                setOrders(list);
                setOrdersLoading(false);
              }}
              className="text-sm px-3 py-2 rounded bg-purple-700 font-bold hover:bg-gray-300"
            >
              Оновити
            </button>
          </div>
          {ordersLoading ? (
            <p className="text-gray-600">Завантаження...</p>
          ) : orders.length === 0 ? (
            <p className="text-gray-600">Замовлень ще немає</p>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white p-5 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">№ {order.id}</p>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString('uk-UA')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600 text-lg">{order.finalPrice}₴</p>
                      <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                    {order.items.slice(0,6).map(i => (
                      <div key={i.id} className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded">
                        <span className="text-xl">{i.image}</span>
                        <span className="truncate">{i.name}</span>
                        <span className="text-xs text-gray-400 ml-auto">x{i.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                    >
                      📋 Деталі замовлення
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="text-center">
          <Link href="/catalog" className="inline-block text-purple-600 hover:text-purple-700 font-semibold">← До каталогу</Link>
        </div>
      </div>

      {/* Модальне вікно з деталями замовлення */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Заголовок модалю */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-4 sm:p-6 sticky top-0 z-10">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm opacity-90">Замовлення №</p>
                  <p className="text-xl sm:text-2xl font-bold truncate">{selectedOrder.id}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-white text-2xl font-bold hover:scale-110 transition-transform flex-shrink-0"
                  aria-label="Закрити"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Вміст модалю */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Статус */}
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-gray-600 text-sm sm:text-base">Статус:</p>
                <span className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>

              {/* Контактна інформація */}
              <section>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 pb-2 border-b border-gray-200">
                  👤 Контактна інформація
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Ім'я</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{selectedOrder.firstName}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Прізвище</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{selectedOrder.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base break-all">{selectedOrder.email}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Телефон</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{selectedOrder.phone}</p>
                  </div>
                </div>
              </section>

              {/* Адреса доставки */}
              <section>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 pb-2 border-b border-gray-200">
                  🏠 Адреса доставки
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-900 text-sm sm:text-base">
                    <span className="text-xs sm:text-sm text-gray-600">Місто:</span> <span className="font-semibold">{selectedOrder.city}</span>
                  </p>
                  <p className="text-gray-900 text-sm sm:text-base break-words">
                    <span className="text-xs sm:text-sm text-gray-600">Адреса:</span> <span className="font-semibold">{selectedOrder.address}</span>
                  </p>
                  {selectedOrder.postalCode && (
                    <p className="text-gray-900 text-sm sm:text-base">
                      <span className="text-xs sm:text-sm text-gray-600">Поштовий індекс:</span> <span className="font-semibold">{selectedOrder.postalCode}</span>
                    </p>
                  )}
                </div>
              </section>

              {/* Способ доставки та оплати */}
              <section>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 pb-2 border-b border-gray-200">
                  🚚 Доставка та оплата
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Спосіб доставки</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{getDeliveryLabel(selectedOrder.deliveryMethod)}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Спосіб оплати</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">Оплата онлайн</p>
                  </div>
                </div>
              </section>

              {/* Товари */}
              <section>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 pb-2 border-b border-gray-200">
                  📦 Товари ({selectedOrder.items.length})
                </h3>
                <div className="space-y-2 sm:space-y-3 max-h-48 overflow-y-auto">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start p-2 sm:p-3 bg-gray-50 rounded-lg gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base break-words">{item.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Категорія: {item.category}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Кількість: {item.quantity}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm">{item.price}₴ за од.</p>
                        <p className="text-xs sm:text-sm text-purple-600 font-bold">{parseInt(item.price) * item.quantity}₴</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Розрахунки */}
              <section>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 pb-2 border-b border-gray-200">
                  💰 Розрахунки
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-900 text-sm sm:text-base">
                    <span>Сума товарів:</span>
                    <span className="font-semibold">{selectedOrder.totalPrice}₴</span>
                  </div>
                  {selectedOrder.discountAmount && selectedOrder.discountAmount > 0 ? (
                    <>
                      <div className="flex justify-between text-gray-900 text-sm sm:text-base">
                        <span>Знижка ({selectedOrder.discountPercent}%):</span>
                        <span className="font-semibold text-green-600">−{selectedOrder.discountAmount}₴</span>
                      </div>
                      <div className="flex justify-between text-gray-900 text-sm sm:text-base">
                        <span>Після знижки:</span>
                        <span className="font-semibold">{selectedOrder.discountedSubtotal}₴</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-gray-900 text-sm sm:text-base">
                      <span>Знижка (0%):</span>
                      <span className="font-semibold text-gray-500">0₴</span>
                    </div>
                  )}
                  {selectedOrder.redeemedPoints && selectedOrder.redeemedPoints > 0 ? (
                    <div className="flex justify-between text-gray-900 text-sm sm:text-base">
                      <span>Списано балів ({selectedOrder.redeemedPoints}):</span>
                      <span className="font-semibold text-yellow-600">−{selectedOrder.redeemedAmount}₴</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-gray-900 text-sm sm:text-base">
                      <span>Списано балів (0):</span>
                      <span className="font-semibold text-gray-500">0₴</span>
                    </div>
                  )}
                  {selectedOrder.deliveryPrice > 0 && (
                    <div className="flex justify-between text-gray-900 text-sm sm:text-base">
                      <span>Доставка:</span>
                      <span className="font-semibold text-orange-600">+{selectedOrder.deliveryPrice}₴</span>
                    </div>
                  )}
                  {selectedOrder.deliveryPrice === 0 && (
                    <div className="flex justify-between text-gray-900 text-sm sm:text-base">
                      <span>Доставка:</span>
                      <span className="font-semibold text-green-600">Безкоштовна ✓</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base sm:text-lg font-bold text-purple-600 pt-2 sm:pt-3 border-t border-gray-200">
                    <span>До оплати:</span>
                    <span>{selectedOrder.finalPrice}₴</span>
                  </div>
                </div>
              </section>

              {/* Коментарі */}
              {selectedOrder.comments && (
                <section>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 pb-2 border-b border-gray-200">
                    📝 Коментарі
                  </h3>
                  <p className="text-gray-700 text-sm sm:text-base whitespace-pre-wrap break-words">{selectedOrder.comments}</p>
                </section>
              )}

              {/* Дати */}
              <section>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 pb-2 border-b border-gray-200">
                  📅 Дати
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Створено</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Оновлено</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{formatDate(selectedOrder.updatedAt)}</p>
                  </div>
                </div>
              </section>

              {/* Кнопка закрити */}
              <div className="pt-4 sm:pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full bg-gray-200 text-gray-800 font-bold py-2 sm:py-2.5 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
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
