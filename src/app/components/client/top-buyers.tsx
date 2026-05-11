"use client";

import { useEffect, useState } from 'react';
import { fetchTopBuyers, type UserProfile } from '@/lib/firebase';

interface TopBuyersProps {
  limit?: number;
}

export default function TopBuyers({ limit = 5 }: TopBuyersProps) {
  const [buyers, setBuyers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const list = await fetchTopBuyers(limit);
      setBuyers(list);
      setLoading(false);
    };
    load();
  }, [limit]);

  if (loading) {
    return (
      <div className="bg-white/85 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-12 border border-pink-200">
        <h2 className="text-2xl font-bold mb-4 text-purple-700 text-center flex items-center justify-center gap-2">icons Топ покупці</h2>
        <p className="text-gray-700 text-sm text-center">Завантаження...</p>
      </div>
    );
  }

  if (buyers.length === 0) {
    return (
      <div className="bg-white/85 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-12 border border-pink-200">
        <h2 className="text-2xl font-bold mb-4 text-purple-700 text-center flex items-center justify-center gap-2">icons Топ покупці</h2>
        <p className="text-gray-700 text-sm text-center">Поки що немає даних.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/85 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-12 border border-pink-200">
      <h2 className="text-2xl font-bold mb-6 text-purple-700 text-center flex items-center justify-center gap-2">icons Топ покупці</h2>
      <ol className="space-y-3">
        {buyers.map((u, idx) => {
          const ratingBadges = [
            { level: 0, label: 'icons Новий друг Еквестрії', color: 'bg-gray-200 text-gray-800' },
            { level: 1, label: 'icons Друг місяця', color: 'bg-blue-100 text-blue-800' },
            { level: 2, label: 'icons Істинний шанувальник', color: 'bg-purple-100 text-purple-800' },
            { level: 3, label: 'icons Колекціонер MLP', color: 'bg-pink-100 text-pink-800' },
            { level: 4, label: 'icons Королева Понів', color: 'bg-amber-100 text-amber-800' },
            { level: 5, label: 'icons Легенда Еквестрії', color: 'bg-green-100 text-green-800' },
          ];
          const badge = ratingBadges.find(b => b.level === u.rating) || ratingBadges[0];
          return (
            <li
              key={u.uid}
              className="flex items-center justify-between bg-white rounded-lg p-3 border border-pink-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="text-lg font-bold text-purple-600 w-6 text-center">{idx + 1}</div>
                {u.photoURL && (
                  <img
                    src={u.photoURL}
                    alt={u.displayName || 'avatar'}
                    className="w-10 h-10 rounded-full border"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{u.displayName || 'Користувач'}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>{badge.label}</span>
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">icons {u.totalOrders} покупок</span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
