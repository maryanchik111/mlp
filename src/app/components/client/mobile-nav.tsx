'use client';

import { useAuth } from '@/app/providers';
import { checkAdminAccess, fetchOrdersByStatus, type Order } from '@/lib/firebase';
import Link from 'next/link';
import {
  HomeIcon,
  ShoppingBagIcon,
  GiftIcon,
  ChatBubbleLeftRightIcon,
  ShoppingCartIcon,
  WrenchScrewdriverIcon,
  UserCircleIcon
} from '@heroicons/react/24/solid';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileNav() {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isAdmin') === 'true';
    }
    return false;
  });
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (user && user.email) {
      const adminStatus = checkAdminAccess(user);
      setIsAdmin(adminStatus);
      localStorage.setItem('isAdmin', String(adminStatus));
    } else {
      setIsAdmin(false);
      localStorage.removeItem('isAdmin');
    }
  }, [user, loading]);

  useEffect(() => {
    if (!isAdmin) {
      setPendingOrdersCount(0);
      return;
    }
    fetchOrdersByStatus('pending', (orders: Order[]) => {
      setPendingOrdersCount(orders.length);
    });
    const interval = setInterval(() => {
      fetchOrdersByStatus('pending', (orders: Order[]) => {
        setPendingOrdersCount(orders.length);
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

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

  if (!mounted) return null;

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  const navItemVariants = {
    tap: { scale: 0.9 },
    hover: { scale: 1.1 }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white-80 backdrop-blur-sm border-t border-gray-200/50 shadow-lg z-50 rounded-full mx-2 mb-4">
      <div className={`p-3 flex items-center justify-around h-16 max-w-screen-xl mx-auto ${isAdmin ? 'grid grid-cols-8' : 'grid grid-cols-7'} w-full`}>
        
        {[
          { id: 'home', href: '/', icon: HomeIcon, label: 'Головна' },
          { id: 'catalog', href: '/catalog', icon: ShoppingBagIcon, label: 'Каталог' },
          { id: 'box', href: '/box-builder', icon: GiftIcon, label: 'Бокс' },
          { id: 'forum', href: '/forum', icon: ChatBubbleLeftRightIcon, label: 'Форум' },
        ].map((item) => (
          <Link 
            key={item.id} 
            href={item.href} 
            className="relative flex flex-col items-center justify-center h-full w-full"
          >
            <motion.div
              variants={navItemVariants}
              whileTap="tap"
              className={`z-10 transition-colors duration-300 ${isActive(item.href) ? 'text-purple-600' : 'text-gray-500'}`}
            >
              <item.icon className="w-7 h-7" />
            </motion.div>
            
            {isActive(item.href) && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-purple-100 rounded-full -z-0"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </Link>
        ))}

        <Link 
          href="/auctions" 
          className="relative flex flex-col items-center justify-center h-full w-full"
        >
          <motion.div
            variants={navItemVariants}
            whileTap="tap"
            className={`z-10 transition-colors duration-300 text-2xl ${isActive('/auctions') ? 'text-purple-600' : 'text-gray-500'}`}
          >
            🔨
          </motion.div>
          
          {isActive('/auctions') && (
            <motion.div
              layoutId="activeAuctionsTab"
              className="absolute inset-0 bg-purple-100 rounded-full -z-0"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
        </Link>

        <button onClick={handleCartClick} className="relative flex flex-col items-center justify-center h-full w-full">
          <motion.div whileTap={{ scale: 0.9 }} className="text-gray-500 z-10">
            <ShoppingCartIcon className="w-7 h-7" />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  exit={{ scale: 0 }}
                  className="absolute top-0 right-1 translate-x-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </button>

        {isAdmin && (
          <Link href="/admin" className="relative flex flex-col items-center justify-center h-full w-full">
            <motion.div
              whileTap={{ scale: 0.9 }}
              className={`z-10 ${isActive('/admin') ? 'text-purple-600' : 'text-gray-500'}`}
            >
              <WrenchScrewdriverIcon className="w-7 h-7" />
              {pendingOrdersCount > 0 && (
                <span className="absolute top-0 right-1 translate-x-1 bg-orange-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                  {pendingOrdersCount}
                </span>
              )}
            </motion.div>
            {isActive('/admin') && (
              <motion.div layoutId="activeTab" className="absolute inset-0 bg-purple-100 rounded-full -z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
            )}
          </Link>
        )}

        <Link href="/account" className="relative flex flex-col items-center justify-center h-full w-full">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className={`z-10 ${isActive('/account') ? 'text-purple-600' : 'text-gray-500'}`}
          >
            <UserCircleIcon className="w-7 h-7" />
            {user && profile && profile.points > 0 && (
              <span className="absolute top-2 right-1/4 translate-x-2 bg-yellow-400 text-purple-900 text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {profile.points}
              </span>
            )}
          </motion.div>
          {isActive('/account') && (
            <motion.div layoutId="activeTab" className="absolute inset-0 bg-purple-100 rounded-full -z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
          )}
        </Link>
      </div>
    </nav>
  );
}