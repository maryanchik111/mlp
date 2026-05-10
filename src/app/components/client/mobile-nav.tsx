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
  UserCircleIcon,
  TrophyIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon
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
  const [isExpanded, setIsExpanded] = useState(false);

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
    <div className="fixed bottom-4 right-4 flex justify-end z-50 pointer-events-none max-w-[calc(100vw-2rem)]">
      <motion.nav
        initial={false}
        animate={{ width: isExpanded ? 'calc(100vw - 2rem)' : '3.5rem' }}
        transition={{ type: "spring", damping: 26, stiffness: 260, bounce: 1.5 }}
        className="bg-white/40 backdrop-blur-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 flex items-center justify-end overflow-hidden pointer-events-auto h-14 rounded-full"
      >
        <div
          className={`flex items-center justify-evenly h-full pl-3 pr-0 sm:pr-1 shrink-0 gap-x-1 w-[calc(100vw-5.5rem)] transition-opacity duration-200 ${isExpanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        >
          {[
            { id: 'home', href: '/', icon: HomeIcon, label: 'Головна' },
            { id: 'catalog', href: '/catalog', icon: ShoppingBagIcon, label: 'Каталог' },
            { id: 'box', href: '/box-builder', icon: GiftIcon, label: 'Бокс' },
            { id: 'giveaways', href: '/giveaways', icon: SparklesIcon, label: 'Розіграші' },
            { id: 'forum', href: '/forum', icon: ChatBubbleLeftRightIcon, label: 'Форум' },
          ].map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setIsExpanded(false)}
              className="relative flex flex-col items-center justify-center h-full w-full"
            >
              <motion.div
                variants={navItemVariants}
                whileTap="tap"
                className={`z-10 transition-colors duration-300 ${isActive(item.href) ? 'text-purple-600' : 'text-gray-500'}`}
              >
                <item.icon className="w-6 h-6 sm:w-7 sm:h-7" />
              </motion.div>

              {isActive(item.href) && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-purple-100 rounded-full -z-0 m-1"
                  transition={{ type: "spring", bounce: 1.5, duration: 0.8 }}
                />
              )}
            </Link>
          ))}

          <Link
            href="/auctions"
            onClick={() => setIsExpanded(false)}
            className="relative flex flex-col items-center justify-center h-full w-full"
          >
            <motion.div
              variants={navItemVariants}
              whileTap="tap"
              className={`z-10 transition-colors duration-300 ${isActive('/auctions') ? 'text-purple-600' : 'text-gray-500'}`}
            >
              <TrophyIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            </motion.div>

            {isActive('/auctions') && (
              <motion.div
                layoutId="activeAuctionsTab"
                className="absolute inset-0 bg-purple-100 rounded-full -z-0 m-1"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </Link>

          <button onClick={() => { handleCartClick(); setIsExpanded(false); }} className="relative flex flex-col items-center justify-center h-full w-full">
            <motion.div whileTap={{ scale: 0.9 }} className="text-gray-500 z-10 relative">
              <ShoppingCartIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center border-2 border-white"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </button>

          {isAdmin && (
            <Link href="/admin" onClick={() => setIsExpanded(false)} className="relative flex flex-col items-center justify-center h-full w-full">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`z-10 relative ${isActive('/admin') ? 'text-purple-600' : 'text-gray-500'}`}
              >
                <WrenchScrewdriverIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                {pendingOrdersCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center border-2 border-white">
                    {pendingOrdersCount}
                  </span>
                )}
              </motion.div>
              {isActive('/admin') && (
                <motion.div layoutId="activeTab" className="absolute inset-0 bg-purple-100 rounded-full -z-0 m-1" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
              )}
            </Link>
          )}

          <Link href="/account" onClick={() => setIsExpanded(false)} className="relative flex flex-col items-center justify-center h-full w-full">
            <motion.div
              whileTap={{ scale: 0.9 }}
              className={`z-10 relative ${profile?.isBlocked ? 'text-red-600' : isActive('/account') ? 'text-purple-600' : 'text-gray-500'}`}
            >
              <UserCircleIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              {profile?.isBlocked ? (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center border-2 border-white shadow-lg">
                  🔒
                </span>
              ) : user && profile && profile.points > 0 && (
                <span className="absolute -top-2 -right-4 bg-yellow-400 text-purple-900 text-[10px] sm:text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[16px] sm:min-w-[20px] text-center border-2 border-white">
                  {profile.points}
                </span>
              )}
            </motion.div>
            {isActive('/account') && (
              <motion.div layoutId="activeTab" className="absolute inset-0 bg-purple-100 rounded-full -z-0 m-1" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
            )}
          </Link>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-14 h-14 shrink-0 flex items-center justify-center text-purple-600 hover:bg-white/50 transition-colors relative z-10 rounded-full"
        >
          {isExpanded ? <XMarkIcon className="w-7 h-7" /> : <Bars3Icon className="w-7 h-7" />}
          {!isExpanded && (cartCount > 0 || pendingOrdersCount > 0) && (
            <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>
      </motion.nav>
    </div>
  );
}