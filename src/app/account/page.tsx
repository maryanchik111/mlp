'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { fetchUserOrders, type Order } from '@/lib/firebase';

export default function AccountPage() {
  const { user, profile, loading, signIn, signOut, refreshProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

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
    { level: 0, label: 'Новачок', color: 'bg-gray-200 text-gray-800' },
    { level: 1, label: 'Початківець', color: 'bg-blue-100 text-blue-800' },
    { level: 2, label: 'Дослідник', color: 'bg-purple-100 text-purple-800' },
    { level: 3, label: 'Експерт', color: 'bg-pink-100 text-pink-800' },
    { level: 4, label: 'Майстер', color: 'bg-amber-100 text-amber-800' },
    { level: 5, label: 'Легенда', color: 'bg-green-100 text-green-800' },
  ];
  const badge = ratingBadges.find(b => b.level === profile?.rating) || ratingBadges[0];

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
            <button onClick={() => refreshProfile()} className="text-sm px-3 py-2 rounded bg-gray-200 hover:bg-gray-300">Оновити</button>
          </div>
          {ordersLoading ? (
            <p className="text-gray-600">Завантаження...</p>
          ) : orders.length === 0 ? (
            <p className="text-gray-600">Замовлень ще немає</p>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white p-5 rounded-lg shadow-sm border">
                  <div className="flex flex-wrap justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">№ {order.id}</p>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString('uk-UA')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600 text-lg">{order.finalPrice}₴</p>
                      <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : order.status === 'processing' ? 'bg-blue-100 text-blue-700' : order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{order.status}</span>
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
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="text-center">
          <Link href="/catalog" className="inline-block text-purple-600 hover:text-purple-700 font-semibold">← До каталогу</Link>
        </div>
      </div>
    </main>
  );
}
