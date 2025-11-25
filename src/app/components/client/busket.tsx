'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';

interface CartItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  image: string;
  category: string;
  maxQuantity?: number; // Максимальна кількість на складі
  discount?: number; // Знижка на товар у %
}

export default function Basket() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Завантаження кошика з localStorage
  useEffect(() => {
    setMounted(true);
    const savedCart = localStorage.getItem('mlp-cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Помилка завантаження кошика:', error);
      }
    }

    // Слухаємо custom event від каталогу
    const handleCartUpdate = (event: any) => {
      if (event.detail) {
        setCartItems(event.detail);
      }
    };

    // Слухаємо custom event для відкриття кошика з mobile nav
    const handleOpenBasket = () => {
      setIsOpen(true);
    };

    // Слухаємо зміни в інших табах/вікнах
    const handleStorageChange = () => {
      const updatedCart = localStorage.getItem('mlp-cart');
      if (updatedCart) {
        try {
          setCartItems(JSON.parse(updatedCart));
        } catch (error) {
          console.error('Помилка оновлення кошика:', error);
        }
      }
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('open-basket', handleOpenBasket);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('open-basket', handleOpenBasket);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Збереження кошика в localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('mlp-cart', JSON.stringify(cartItems));
    }
  }, [cartItems, mounted]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => i.id === item.id);
      
      if (existingItem) {
          // Перевіряємо максимальну кількість
          const maxQty = existingItem.maxQuantity || Infinity;
          const newQuantity = Math.min(existingItem.quantity + 1, maxQty);
        return prevItems.map(i =>
          i.id === item.id
              ? { ...i, quantity: newQuantity }
            : i
        );
      }
      
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

      setCartItems(prevItems =>
        prevItems.map(item => {
          if (item.id === id) {
            // Перевіряємо максимальну кількість на складі
            const maxQty = item.maxQuantity || Infinity;
            const newQuantity = Math.min(quantity, maxQty);
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
      );
  };

  // Розрахунки
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    const discount = item.discount ? Number(item.discount) : 0;
    const discountedPrice = discount > 0 ? Math.round(price * (1 - discount / 100)) : price;
    return sum + discountedPrice * item.quantity;
  }, 0);

  const deliveryPrice = totalPrice >= 2000 ? 0 : 120;
  const finalPrice = totalPrice + deliveryPrice;
  const estimatedPoints = Math.floor(finalPrice / 100);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Модальне вікно кошика */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Кошик */}
          <div className="fixed right-0 top-0 h-screen w-full max-w-md bg-gradient-to-b from-white via-purple-50/30 to-pink-50/30 backdrop-blur-lg shadow-2xl z-[70] flex flex-col overflow-hidden border-l border-purple-200/30">
            {/* Заголовок */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white p-6 shadow-lg flex-shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full mix-blend-multiply filter blur-2xl"></div>
              </div>
              <div className="relative flex items-center justify-between">
                <h2 className="text-3xl font-bold flex items-center gap-2">🛒 Кошик</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-3xl hover:scale-125 transition-transform duration-200 font-bold"
                  aria-label="Закрити кошик"
                >
                  ✕
                </button>
              </div>
              {totalItems > 0 && (
                <p className="text-white/95 mt-3 font-semibold text-lg relative">
                  ✨ {totalItems} {totalItems === 1 ? 'товар' : 'товарів'}
                </p>
              )}
            </div>

            {/* Вміст кошика - прокручуваний */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <div className="text-7xl mb-6 animate-bounce-slow">🦄</div>
                  <p className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text mb-3">Кошик порожній</p>
                  <p className="text-sm text-center mb-8 text-gray-600 max-w-xs">
                    Додайте товари з каталогу, щоб почати покупки!
                  </p>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/catalog');
                    }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all font-bold hover:scale-105 active:scale-95"
                  >
                    🛍️ Перейти до каталогу
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map(item => (
                    <div
                      key={item.id}
                      className="bg-white/60 backdrop-blur-md border-2 border-purple-200/50 rounded-2xl p-4 hover:bg-white/80 hover:shadow-lg hover:border-purple-400/70 transition-all duration-200 hover:-translate-y-1 group"
                    >
                      {/* Заголовок товару */}
                      <div className="flex gap-4 mb-4">
                        {(item as any).images && (item as any).images.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={(item as any).images[0]} 
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-xl border-3 border-purple-300/50 flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-16 h-16 text-4xl flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                            {item.image || '📦'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 line-clamp-2 text-base group-hover:text-purple-600 transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-xs text-purple-600 uppercase tracking-widest font-bold mt-2 opacity-80">
                            {item.category}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 hover:scale-125 transition-all text-2xl flex-shrink-0 font-bold"
                          aria-label="Видалити з кошика"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Ціна та кількість */}
                      <div className="flex items-center justify-between gap-3 pt-4 border-t-2 border-purple-200/30">
                        <div className="flex-1">
                          {item.discount && item.discount > 0 ? (
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-400 line-through font-semibold">
                                {item.price}₴
                              </p>
                              <p className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                {Math.round((typeof item.price === 'string' ? parseFloat(item.price) : item.price) * (1 - item.discount / 100))}₴
                              </p>
                              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">−{item.discount}%</span>
                            </div>
                          ) : (
                            <p className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                              {item.price}₴
                            </p>
                          )}
                          {item.quantity > 1 && (
                            <p className="text-xs text-purple-600 font-bold mt-2">
                              💵 {(() => {
                                const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
                                const discount = item.discount ? Number(item.discount) : 0;
                                const discountedPrice = discount > 0 ? Math.round(price * (1 - discount / 100)) : price;
                                return discountedPrice * item.quantity;
                              })()}₴ разом
                            </p>
                          )}
                        </div>

                        {/* Контрол кількості */}
                        <div className="flex items-center gap-1 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-2 flex-shrink-0 border-2 border-purple-200/50">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="px-3 py-2 text-lg font-bold text-purple-700 hover:bg-white rounded-lg transition-all hover:scale-110 active:scale-95"
                            aria-label="Зменшити кількість"
                          >
                            −
                          </button>
                          <span className="px-3 py-2 font-bold text-purple-700 text-center text-lg">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                              disabled={item.maxQuantity !== undefined && item.quantity >= item.maxQuantity}
                              className={`px-3 py-2 text-lg font-bold rounded-lg transition-all ${
                                item.maxQuantity !== undefined && item.quantity >= item.maxQuantity
                                  ? 'text-gray-400 cursor-not-allowed opacity-50'
                                  : 'text-purple-700 hover:bg-white hover:scale-110 active:scale-95'
                              }`}
                            aria-label="Збільшити кількість"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                        {/* Повідомлення про максимальну кількість */}
                        {item.maxQuantity !== undefined && item.quantity >= item.maxQuantity && (
                          <p className="text-xs font-bold text-orange-600 mt-3 bg-orange-50 px-3 py-2 rounded-lg border-2 border-orange-200/50">
                            ⚠️ Максимум: {item.maxQuantity}
                          </p>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer з розрахунками - липкий внизу */}
            {cartItems.length > 0 && (
              <div className="bg-gradient-to-b from-white/80 to-purple-50/80 backdrop-blur-md border-t-2 border-purple-200/30 p-5 space-y-4 flex-shrink-0 shadow-2xl">
                {/* Деталі розрахунків */}
                <div className="space-y-3 pb-4 border-b-2 border-purple-200/30 text-sm">
                  <div className="flex justify-between items-center text-gray-700 font-semibold">
                    <span>💵 Сума товарів:</span>
                    <span className="text-lg text-gray-900">{totalPrice}₴</span>
                  </div>
                  {deliveryPrice > 0 ? (
                    <div className="flex justify-between items-center font-semibold text-orange-700">
                      <span>🚚 Доставка:</span>
                      <span className="text-lg">+{deliveryPrice}₴</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center font-semibold text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                      <span>🚚 Доставка:</span>
                      <span className="text-lg">Безкоштовна! ✓</span>
                    </div>
                  )}
                </div>

                {/* Остаток */}
                <div className="bg-gradient-to-r from-purple-100/50 to-pink-100/50 border-2 border-purple-300/50 rounded-xl p-4 flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-lg">Всього до оплати:</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {finalPrice}₴
                  </span>
                </div>

                {/* Інформація про доставку */}
                <div className="bg-gradient-to-r from-blue-50/70 to-cyan-50/70 backdrop-blur-sm border-2 border-blue-200/50 rounded-xl p-3 text-sm text-blue-900 font-semibold">
                  {deliveryPrice === 0 ? (
                    <p>✅ <strong>Безкоштовна доставка активна!</strong></p>
                  ) : (
                    <p>🎁 Ще <strong>{2000 - totalPrice}₴</strong> для безкоштовної доставки</p>
                  )}
                </div>

                {/* Інформація для авторизованих про бали */}
                {user && estimatedPoints > 0 && (
                  <div className="bg-gradient-to-r from-green-50/70 to-emerald-50/70 backdrop-blur-sm border-2 border-green-200/50 rounded-xl p-3 text-sm text-green-900 font-semibold">
                    <p>⭐ За це замовлення буде нараховано <strong>+{estimatedPoints}</strong> балів!</p>
                  </div>
                )}

                {/* Кнопки дій */}
                <div className="space-y-3 pt-2">
                    <button 
                      onClick={() => {
                        setIsOpen(false);
                        router.push('/checkout');
                      }}
                      className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white font-bold py-3 rounded-xl hover:shadow-2xl transition-all hover:shadow-purple-600/50 hover:-translate-y-1 active:scale-95 text-lg hover:scale-105"
                    >
                      💳 Оформити замовлення
                    </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-white/70 backdrop-blur-sm border-2 border-purple-300/50 text-purple-700 font-bold py-3 rounded-xl hover:bg-white/90 transition-all text-lg hover:scale-105 active:scale-95"
                  >
                    🛍️ Продовжити покупки
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Інтеграція у каталог - це буде в компоненті продукту */}
    </>
  );
}

// Експортуємо функцію для додавання товару в кошик
export const addProductToCart = (
  item: Omit<CartItem, 'quantity'>,
  basketRef?: React.RefObject<{ addToCart: (item: Omit<CartItem, 'quantity'>) => void }>
) => {
  // Це функція для використання в інших компонентах
};
