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

  const deliveryPrice = totalPrice >= 2000 ? 0 : 50;
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
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Кошик */}
          <div className="fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
            {/* Заголовок */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-6 shadow-md flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">🛒 Кошик</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-2xl hover:opacity-80 transition-opacity"
                  aria-label="Закрити кошик"
                >
                  ✕
                </button>
              </div>
              {totalItems > 0 && (
                <p className="text-white/90 mt-2">
                  {totalItems} {totalItems === 1 ? 'товар' : 'товарів'}
                </p>
              )}
            </div>

            {/* Вміст кошика - прокручуваний */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <div className="text-5xl mb-4">🦄</div>
                  <p className="text-lg font-semibold mb-2">Кошик порожній</p>
                  <p className="text-sm text-center mb-6">
                    Додайте товари з каталогу, щоб почати покупки!
                  </p>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/catalog');
                    }}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Перейти до каталогу
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map(item => (
                    <div
                      key={item.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      {/* Заголовок товару */}
                      <div className="flex gap-3 mb-3">
                        <div className="text-3xl flex-shrink-0">{item.image}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 line-clamp-2 text-sm">
                            {item.name}
                          </h3>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">
                            {item.category}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 transition-colors text-lg flex-shrink-0"
                          aria-label="Видалити з кошика"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Ціна та кількість */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200">
                        <div className="flex-1">
                          {item.discount && item.discount > 0 ? (
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-gray-400 line-through">
                                {item.price}
                              </p>
                              <p className="text-lg font-bold text-purple-600">
                                {Math.round((typeof item.price === 'string' ? parseFloat(item.price) : item.price) * (1 - item.discount / 100))}₴
                              </p>
                            </div>
                          ) : (
                            <p className="text-lg font-bold text-purple-600">
                              {item.price}
                            </p>
                          )}
                          {item.quantity > 1 && (
                            <p className="text-xs text-gray-600 mt-1">
                              {(() => {
                                const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
                                const discount = item.discount ? Number(item.discount) : 0;
                                const discountedPrice = discount > 0 ? Math.round(price * (1 - discount / 100)) : price;
                                return discountedPrice * item.quantity;
                              })()}₴ разом
                            </p>
                          )}
                        </div>

                        {/* Контрол кількості */}
                        <div className="flex items-center gap-1 bg-gray-200 rounded-lg p-1 flex-shrink-0">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="px-2 py-1 text-sm font-bold text-gray-700 hover:bg-white rounded transition-colors"
                            aria-label="Зменшити кількість"
                          >
                            −
                          </button>
                          <span className="px-2 py-1 font-semibold min-w-8 text-purple-600 font-bold text-center text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                              disabled={item.maxQuantity !== undefined && item.quantity >= item.maxQuantity}
                              className={`px-2 py-1 text-sm font-bold rounded transition-colors ${
                                item.maxQuantity !== undefined && item.quantity >= item.maxQuantity
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-gray-700 hover:bg-white'
                              }`}
                            aria-label="Збільшити кількість"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                        {/* Повідомлення про максимальну кількість */}
                        {item.maxQuantity !== undefined && item.quantity >= item.maxQuantity && (
                          <p className="text-xs text-orange-600 mt-2">
                            Максимальна доступна кількість: {item.maxQuantity}
                          </p>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer з розрахунками - липкий внизу */}
            {cartItems.length > 0 && (
              <div className="bg-gray-50 border-t border-gray-200 p-4 space-y-3 flex-shrink-0">
                {/* Деталі розрахунків */}
                <div className="space-y-2 pb-3 border-b border-gray-200 text-sm">
                  <div className="flex justify-between items-center text-gray-700">
                    <span>Сума:</span>
                    <span className="font-semibold">{totalPrice}₴</span>
                  </div>
                  {deliveryPrice > 0 ? (
                    <div className="flex justify-between items-center text-gray-700">
                      <span>Доставка:</span>
                      <span className="font-semibold text-orange-600">+{deliveryPrice}₴</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-green-600">
                      <span>Доставка:</span>
                      <span className="font-semibold">Безкоштовна! ✓</span>
                    </div>
                  )}
                </div>

                {/* Остаток */}
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Всього:</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {finalPrice}₴
                  </span>
                </div>

                {/* Інформація про доставку */}
                <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-800">
                  {deliveryPrice === 0 ? (
                    <p>✓ <strong>Безкоштовна доставка!</strong></p>
                  ) : (
                    <p>Ще {2000 - totalPrice}₴ для безкоштовної доставки</p>
                  )}
                </div>

                {/* Інформація для авторизованих про бали */}
                {user && estimatedPoints > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded p-2 text-xs text-green-800">
                    <p>За це замовлення буде нараховано <strong>+{estimatedPoints}</strong> балів у ваш акаунт після підтвердження оплати.</p>
                  </div>
                )}

                {/* Кнопки дій */}
                <div className="space-y-2">
                    <button 
                      onClick={() => {
                        setIsOpen(false);
                        router.push('/checkout');
                      }}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-2 rounded-lg hover:shadow-lg transition-all text-sm hover:scale-105"
                    >
                      💳 Оформити
                    </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-gray-200 text-gray-800 font-bold py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    ← Продовжити
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
