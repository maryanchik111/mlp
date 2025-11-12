'use client';

import { useAuth } from '@/app/providers';
import { checkAdminAccess, fetchOrdersByStatus, type Order } from '@/lib/firebase';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function MobileNav() {
  const { user, profile } = useAuth();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  // Перевірка прав адміна
  useEffect(() => {
    if (user) {
      setIsAdmin(checkAdminAccess(user));
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // Завантаження кількості нових замовлень для адміна
  useEffect(() => {
    if (!isAdmin) {
      setPendingOrdersCount(0);
      return;
    }

    // Завантажуємо pending замовлення
    fetchOrdersByStatus('pending', (orders: Order[]) => {
      setPendingOrdersCount(orders.length);
    });

    // Оновлюємо кожні 30 секунд
    const interval = setInterval(() => {
      fetchOrdersByStatus('pending', (orders: Order[]) => {
        setPendingOrdersCount(orders.length);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [isAdmin]);

  // Оновлення кількості товарів у кошику
  useEffect(() => {
    const updateCartCount = () => {
      const savedCart = localStorage.getItem('mlp-cart');
      if (savedCart) {
        try {
          const cart = JSON.parse(savedCart);
          const total = cart.reduce((sum: number, item: any) => sum + item.quantity, 0);
          setCartCount(total);
        } catch (error) {
          console.error('Помилка завантаження кошика:', error);
        }
      } else {
        setCartCount(0);
      }
    };

    updateCartCount();

    const handleCartUpdate = () => updateCartCount();
    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
    };
  }, []);

  const handleCartClick = () => {
    window.dispatchEvent(new CustomEvent('open-basket'));
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className={`flex items-center justify-around h-16 max-w-screen-xl mx-auto ${isAdmin ? 'grid grid-cols-5' : ''}`}>
        {/* Головна */}
        <Link href="/" className={`flex flex-col items-center justify-center ${isAdmin ? '' : 'flex-1'} h-full transition-colors ${pathname === '/' ? 'text-purple-600' : 'text-gray-600'}`}>
          <span className="text-2xl mb-1">🏠</span>
          <span className="text-xs font-medium">Головна</span>
        </Link>

        {/* Каталог */}
        <Link href="/catalog" className={`flex flex-col items-center justify-center ${isAdmin ? '' : 'flex-1'} h-full transition-colors ${pathname === '/catalog' || pathname?.startsWith('/catalog/') ? 'text-purple-600' : 'text-gray-600'}`}>
          <span className="text-2xl mb-1">🛍️</span>
          <span className="text-xs font-medium">Каталог</span>
        </Link>

        {/* Кошик */}
        <button 
          onClick={handleCartClick}
          className={`flex flex-col items-center justify-center ${isAdmin ? '' : 'flex-1'} h-full text-gray-600 relative`}
        >
          <span className="text-2xl mb-1">🛒</span>
          {cartCount > 0 && (
            <span className="absolute top-2 right-1/4 translate-x-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
          <span className="text-xs font-medium">Кошик</span>
        </button>

        {/* Адмін - тільки для адміністраторів */}
        {isAdmin && (
          <Link href="/admin" className={`flex flex-col items-center justify-center h-full transition-colors relative ${pathname === '/admin' ? 'text-purple-600' : 'text-gray-600'}`}>
            <span className="text-2xl mb-1">🔧</span>
            {pendingOrdersCount > 0 && (
              <span className="absolute top-2 right-1/4 translate-x-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pendingOrdersCount}
              </span>
            )}
            <span className="text-xs font-medium">Адмін</span>
          </Link>
        )}

        {/* Акаунт */}
        <Link href="/account" className={`flex flex-col items-center justify-center ${isAdmin ? '' : 'flex-1'} h-full transition-colors relative ${pathname === '/account' ? 'text-purple-600' : 'text-gray-600'}`}>
          <span className="text-2xl mb-1">👤</span>
          {user && profile && profile.points > 0 && (
            <span className="absolute top-2 right-1/4 translate-x-2 bg-yellow-400 text-purple-900 text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
              {profile.points}
            </span>
          )}
          <span className="text-xs font-medium">Акаунт</span>
        </Link>
      </div>
    </nav>
  );
}
