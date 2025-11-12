'use client';

import { useAuth } from '@/app/providers';
import Link from 'next/link';

export default function AccountButton() {
  const { user, profile } = useAuth();

  // Показуємо тільки для авторизованих користувачів
  if (!user) return null;

  return (
    <Link href="/account">
      <div className="fixed bottom-6 left-6 z-50 group">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-110">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👤</span>
            {profile && profile.points > 0 && (
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-purple-900 text-xs font-bold px-2 py-1 rounded-full shadow-md">
                {profile.points}
              </div>
            )}
          </div>
        </div>
        {/* Підказка при наведенні */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Мій кабінет
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </Link>
  );
}
