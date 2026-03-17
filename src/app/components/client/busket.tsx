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
  deliveryPrice?: string | number; // Ціна доставки
  deliveryDays?: string; // Термін доставки
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

  // Визначаємо ціну доставки як значення з першого товару (або 120 за замовчуванням)
  let deliveryPriceDisplay = cartItems.length > 0
    ? cartItems[0]?.deliveryPrice || '120'
    : '120';
  const finalPrice = totalPrice; // Only goods, delivery is paid separately
  const estimatedPoints = Math.floor(finalPrice / 100); // Points based on goods only

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
          <div className="fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col overflow-hidden border-l border-gray-300">
            {/* Заголовок */}
            <div className="bg-indigo-600 text-white p-4 shadow-md flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">🛒 Кошик</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-2xl hover:text-red-200 transition-colors font-bold"
                  aria-label="Закрити кошик"
                >
                  ✕
                </button>
              </div>
              {totalItems > 0 && (
                <p className="text-white/90 mt-2 font-semibold text-base">
                  {totalItems} {totalItems === 1 ? 'товар' : 'товарів'}
                </p>
              )}
            </div>

            {/* Вміст кошика - прокручуваний */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <div className="text-6xl mb-4">🦄</div>
                  <p className="text-lg font-bold text-gray-900 mb-2">Кошик порожній</p>
                  <p className="text-xs text-center mb-6 text-gray-600 max-w-xs">
                    Додайте товари з каталогу, щоб почати покупки!
                  </p>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/catalog');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors font-semibold text-sm"
                  >
                    🛍️ Перейти до каталогу
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map(item => (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-300 rounded-lg p-3 hover:shadow-md transition-shadow group"
                    >
                      {/* Заголовок товару */}
                      <div className="flex gap-3 mb-3">
                        {(item as any).images && (item as any).images.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={(item as any).images[0]}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-300 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 text-4xl flex items-center justify-center bg-gray-100 rounded-lg flex-shrink-0">
                            {item.image || '📦'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 line-clamp-2 text-base">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.category}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-700 text-lg flex-shrink-0 font-bold"
                          aria-label="Видалити з кошика"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Ціна та кількість */}
                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-200">
                        <div className="flex-1">
                          {item.discount && item.discount > 0 ? (
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-400 line-through font-semibold">
                                {item.price}₴
                              </p>
                              <p className="text-base font-bold text-indigo-600">
                                {Math.round((typeof item.price === 'string' ? parseFloat(item.price) : item.price) * (1 - item.discount / 100))}₴
                              </p>
                              <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">−{item.discount}%</span>
                            </div>
                          ) : (
                            <p className="text-base font-bold text-gray-900">
                              {item.price}₴
                            </p>
                          )}
                          {item.quantity > 1 && (
                            <p className="text-sm text-gray-600 font-semibold mt-1">
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
                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1.5 flex-shrink-0 border border-gray-300">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="px-2.5 py-1.5 text-base font-bold text-gray-700 hover:bg-white rounded transition-colors"
                            aria-label="Зменшити кількість"
                          >
                            −
                          </button>
                          <span className="px-2.5 py-1.5 font-bold text-gray-900 text-center text-base">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={item.maxQuantity !== undefined && item.quantity >= item.maxQuantity}
                            className={`px-2.5 py-1.5 text-base font-bold rounded transition-colors ${item.maxQuantity !== undefined && item.quantity >= item.maxQuantity
                                ? 'text-gray-400 cursor-not-allowed opacity-50'
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
                        <p className="text-xs font-bold text-orange-600 mt-2 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                          ⚠️ Макс: {item.maxQuantity}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer з розрахунками - липкий внизу */}
            {cartItems.length > 0 && (
              <div className="bg-white border-t border-gray-300 p-4 space-y-3 flex-shrink-0 shadow-lg">
                {/* Деталі розрахунків */}
                <div className="space-y-2 pb-3 border-b border-gray-300 text-base">
                  <div className="flex justify-between items-center text-gray-700 font-semibold">
                    <span>Сума товарів:</span>
                    <span className="text-lg text-gray-900">{totalPrice}₴</span>
                  </div>
                  <div className="flex justify-between items-center font-semibold text-gray-700">
                    <span>Доставка:</span>
                    <span className="text-lg font-semibold text-blue-600">{deliveryPriceDisplay} ₴</span>
                  </div>
                  <p className='text-sm text-black'>Ознайомтеся з <Link href="/delivery" className="text-purple-600 underline">умовами доставки</Link></p>
                </div>

                {/* Остаток */}
                <div className="bg-gray-100 rounded-lg p-3 flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-base">Оплата за товари:</span>
                  <span className="text-3xl font-bold text-indigo-600">
                    {finalPrice}₴
                  </span>
                </div>

                {/* Інформація про доставку */}
                {/* Повідомлення про безкоштовну доставку видалено */}

                {/* Інформація для авторизованих про бали */}
                {user && estimatedPoints > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-sm text-amber-900 font-semibold">
                    ⭐ +{estimatedPoints} балів за замовлення
                  </div>
                )}

                {/* Кнопки дій */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/checkout');
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors text-base"
                  >
                    💳 Оформити
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-900 font-bold py-3 rounded-lg transition-colors text-base"
                  >
                    🛍️ Покупки
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
