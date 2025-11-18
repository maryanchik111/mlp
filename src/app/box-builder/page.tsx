'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Basket from '../components/client/busket';
import AccountButton from '../components/client/account-button';
import { fetchAllProducts, type Product } from '@/lib/firebase';

// Типи боксів
const BOX_TYPES = [
  { 
    id: 'small', 
    name: 'Маленький бокс', 
    capacity: 3, 
    price: 50,
    description: '3 поні на ваш вибір',
    emoji: '📦'
  },
  { 
    id: 'medium', 
    name: 'Середній бокс', 
    capacity: 5, 
    price: 80,
    description: '5 поні + безкоштовні аксесуари',
    emoji: '🎁',
    discount: 10
  },
  { 
    id: 'large', 
    name: 'Великий бокс', 
    capacity: 8, 
    price: 120,
    description: '8 поні + набір наліпок',
    emoji: '🎀',
    discount: 15
  },
  { 
    id: 'premium', 
    name: 'Преміум бокс', 
    capacity: 12, 
    price: 180,
    description: '12 поні + ексклюзивні аксесуари',
    emoji: '✨',
    discount: 20
  },
];

export default function BoxBuilderPage() {
  const [selectedBoxType, setSelectedBoxType] = useState<typeof BOX_TYPES[0] | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Завантаження товарів з Firebase
  useEffect(() => {
    setLoading(true);
    fetchAllProducts((products) => {
      if (products && products.length > 0) {
        setAllProducts(products);
      }
      setLoading(false);
    });
  }, []);

  // Категорії для фільтрації
  const categories = useMemo(() => {
    const cats = new Set(allProducts.map(p => p.category).filter(Boolean));
    return Array.from(cats);
  }, [allProducts]);

  // Фільтрація товарів
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    if (filterCategory) {
      filtered = filtered.filter(p => p.category === filterCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [allProducts, filterCategory, searchQuery]);

  // Обчислення вартості
  const calculation = useMemo(() => {
    if (!selectedBoxType) return null;

    const boxPrice = selectedBoxType.price;
    const productsPrice = selectedProducts.reduce((sum, p) => {
      const price = typeof p.price === 'string' ? parseInt(p.price) : p.price;
      return sum + price;
    }, 0);

    const subtotal = boxPrice + productsPrice;
    const discount = selectedBoxType.discount || 0;
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal - discountAmount;

    return {
      boxPrice,
      productsPrice,
      subtotal,
      discount,
      discountAmount,
      total
    };
  }, [selectedBoxType, selectedProducts]);

  const handleToggleProduct = (product: Product) => {
    if (!selectedBoxType) return;

    const isSelected = selectedProducts.some(p => p.id === product.id);

    if (isSelected) {
      setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
    } else {
      if (selectedProducts.length < selectedBoxType.capacity) {
        setSelectedProducts(prev => [...prev, product]);
      }
    }
  };

  const handleAddToCart = () => {
    if (!selectedBoxType || selectedProducts.length === 0) return;

    const boxItem = {
      id: `box-${Date.now()}`,
      name: `${selectedBoxType.name} (${selectedProducts.length} поні)`,
      price: calculation!.total,
      quantity: 1,
      image: selectedProducts[0]?.image || '',
      category: 'Конструктор боксів',
      maxQuantity: 1,
      discount: 0,
      images: selectedProducts.map(p => p.image),
      customBox: {
        type: selectedBoxType.id,
        products: selectedProducts.map(p => ({ id: p.id, name: p.name, image: p.image }))
      }
    };

    const existingCart = localStorage.getItem('mlp-cart');
    const cart = existingCart ? JSON.parse(existingCart) : [];
    cart.push(boxItem);
    localStorage.setItem('mlp-cart', JSON.stringify(cart));
    
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));

    // Скидаємо вибір
    setSelectedBoxType(null);
    setSelectedProducts([]);
    setFilterCategory(null);
    setSearchQuery('');

    // Прокручуємо вгору
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🦄</div>
          <p className="text-gray-600 text-lg">Завантаження...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50">
        {/* Хлібні крихти */}
        <nav className="bg-white border-b border-gray-200" aria-label="Breadcrumb">
          <div className="container mx-auto px-4 py-3 max-w-7xl">
            <ol className="flex items-center gap-2 text-sm text-gray-600">
              <li><a href="/" className="hover:text-purple-600">Головна</a></li>
              <li>/</li>
              <li className="text-gray-900 font-semibold">Конструктор боксів</li>
            </ol>
          </div>
        </nav>

        {/* Заголовок */}
        <section className="bg-gradient-to-r from-purple-600 to-pink-500 py-12">
          <div className="container mx-auto px-4 max-w-7xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              🎁 Конструктор боксів
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Створіть свій унікальний набір My Little Pony! Виберіть розмір боксу та додайте улюблених персонажів.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 max-w-7xl py-12">
          {/* Крок 1: Вибір типу боксу */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Крок 1: Виберіть розмір боксу
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {BOX_TYPES.map(box => (
                <button
                  key={box.id}
                  onClick={() => {
                    setSelectedBoxType(box);
                    setSelectedProducts([]);
                  }}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    selectedBoxType?.id === box.id
                      ? 'border-purple-600 bg-purple-50 shadow-lg scale-105'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                  }`}
                >
                  <div className="text-5xl mb-3">{box.emoji}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{box.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{box.description}</p>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-purple-600">{box.price} ₴</p>
                    {box.discount && (
                      <p className="text-sm font-semibold text-green-600">
                        -{box.discount}% знижка на весь набір
                      </p>
                    )}
                    <p className="text-xs text-gray-500">Місткість: {box.capacity} поні</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Крок 2: Вибір товарів */}
          {selectedBoxType && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Крок 2: Виберіть поні ({selectedProducts.length}/{selectedBoxType.capacity})
                </h2>
                {selectedProducts.length > 0 && (
                  <button
                    onClick={() => setSelectedProducts([])}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Очистити вибір
                  </button>
                )}
              </div>

              {/* Фільтри */}
              <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="🔍 Пошук за назвою..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <select
                    value={filterCategory || ''}
                    onChange={(e) => setFilterCategory(e.target.value || null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Всі категорії</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Прогрес заповнення */}
              <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Заповнення боксу</span>
                  <span className="text-sm font-semibold text-purple-600">
                    {Math.round((selectedProducts.length / selectedBoxType.capacity) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-pink-500 h-3 rounded-full transition-all"
                    style={{ width: `${(selectedProducts.length / selectedBoxType.capacity) * 100}%` }}
                  />
                </div>
              </div>

              {/* Вибрані товари */}
              {selectedProducts.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Вибрані поні:</h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedProducts.map(product => (
                      <div
                        key={product.id}
                        className="flex items-center gap-2 bg-purple-100 px-3 py-2 rounded-lg"
                      >
                        {typeof product.image === 'string' && (product.image.startsWith('http') || product.image.startsWith('/')) ? (
                          <img src={product.image} alt={product.name} className="w-8 h-8 object-cover rounded" />
                        ) : (
                          <span className="text-2xl">{product.image || '🦄'}</span>
                        )}
                        <span className="text-sm font-medium text-gray-900">{product.name}</span>
                        <button
                          onClick={() => handleToggleProduct(product)}
                          className="text-red-600 hover:text-red-700 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Список доступних товарів */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map(product => {
                  const isSelected = selectedProducts.some(p => p.id === product.id);
                  const isFull = selectedProducts.length >= selectedBoxType.capacity;
                  const canSelect = isSelected || !isFull;

                  return (
                    <button
                      key={product.id}
                      onClick={() => handleToggleProduct(product)}
                      disabled={!canSelect}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50 shadow-lg'
                          : canSelect
                          ? 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                          : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}
                      {typeof product.image === 'string' && (product.image.startsWith('http') || product.image.startsWith('/')) ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      ) : (
                        <div className="w-full h-32 flex items-center justify-center mb-3 text-5xl">{product.image || '🦄'}</div>
                      )}
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">{product.category}</p>
                      <p className="text-lg font-bold text-purple-600">
                        {typeof product.price === 'string' ? product.price : product.price} ₴
                      </p>
                    </button>
                  );
                })}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-gray-600">Товари не знайдено</p>
                </div>
              )}
            </section>
          )}

          {/* Підсумок та оформлення */}
          {selectedBoxType && calculation && (
            <section className="sticky bottom-0 bg-white border-t-2 border-purple-200 p-6 rounded-t-2xl shadow-2xl z-60">
              <div className="container mx-auto max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Деталі */}
                  <div className="lg:col-span-2 space-y-3">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Підсумок замовлення</h3>
                    <div className="flex justify-between text-gray-700">
                      <span>Вартість боксу ({selectedBoxType.name})</span>
                      <span className="font-semibold">{calculation.boxPrice} ₴</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Вартість товарів ({selectedProducts.length} шт.)</span>
                      <span className="font-semibold">{calculation.productsPrice} ₴</span>
                    </div>
                    {calculation.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Знижка -{calculation.discount}%</span>
                        <span className="font-semibold">-{calculation.discountAmount.toFixed(0)} ₴</span>
                      </div>
                    )}
                    <div className="border-t pt-3 flex justify-between text-xl font-bold text-gray-900">
                      <span>Разом:</span>
                      <span className="text-purple-600">{calculation.total.toFixed(0)} ₴</span>
                    </div>
                  </div>

                  {/* Кнопка замовлення */}
                  <div className="flex items-center">
                    <button
                      onClick={handleAddToCart}
                      disabled={selectedProducts.length === 0}
                      className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                        selectedProducts.length > 0
                          ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-xl hover:scale-105'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {selectedProducts.length === 0
                        ? 'Виберіть поні'
                        : 'Додати бокс до кошика 🛒'
                      }
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <Basket />
      <AccountButton />
    </>
  );
}
