'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Basket from '../components/client/busket';
import AccountButton from '../components/client/account-button';
import { fetchAllProducts, type Product } from '@/lib/firebase';

const ITEMS_PER_PAGE = 6;

// Базові категорії каталогу (порядок відображення)
const BASE_CATEGORIES: string[] = [
  "Основні персонажі",
  "Набори",
  "Аксесуари",
  "Рідкісні видання",
  "Міні-фігурки",
  "Унікальна",
];

export default function CatalogPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('popular');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [addedItems, setAddedItems] = useState<{ [key: string]: boolean | string }>({});
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAbroadOnly, setShowAbroadOnly] = useState(false);

  // Категорії з підрахунком кількості товарів (динамічно з товарів)
  const derivedCategories = useMemo(() => {
    const counts: Record<string, number> = Object.fromEntries(
      BASE_CATEGORIES.map((c) => [c, 0])
    );
    for (const p of allProducts) {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    }
    return BASE_CATEGORIES.map((name) => ({ name, count: counts[name] || 0 }));
  }, [allProducts]);

  // Завантаження товарів з Firebase при завантаженні компонента
  useEffect(() => {
    setLoading(true);
    fetchAllProducts((products) => {
      if (products && products.length > 0) {
        setAllProducts(products);
      }
      setLoading(false);
    });
  }, []);

  // Завантаження кошика при завантаженні компонента
  useEffect(() => {
    const loadCart = () => {
      const savedCart = localStorage.getItem('mlp-cart');
      if (savedCart) {
        try {
          const cart = JSON.parse(savedCart);
          const itemIds = cart.map((item: any) => item.id);
          setCartItems(itemIds);
        } catch (error) {
          console.error('Помилка завантаження кошика:', error);
        }
      }
    };

    loadCart();

    // Слухаємо custom event оновлення кошика
    const handleCartUpdate = (event: any) => {
      if (event.detail) {
        const itemIds = event.detail.map((item: any) => item.id);
        setCartItems(itemIds);
      }
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  // Програвання пісні при завантаженні каталогу
  useEffect(() => {
    const audio = new Audio('/catalogsong.mp3');
    audio.play().catch((error) => {
      console.log('Автовідтворення пісні заблоковано браузером:', error);
    });
  }, []);

  // Фільтрація та сортування товарів
  const sortedProducts = useMemo(() => {
    let filtered = [...allProducts];

    // Фільтр «Із закордону»
    if (showAbroadOnly) {
      filtered = filtered.filter(p => (p as any).isAbroad === true);
    }

    // Фільтр по категоріям
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Фільтр по ціні
    if (priceRange) {
      filtered = filtered.filter(p => {
        const price = typeof p.price === 'string' ? parseInt(p.price) : p.price;
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

    // Сортування
    switch (sortBy) {
      case 'price-asc':
        return filtered.sort((a, b) => {
          const priceA = typeof a.price === 'string' ? parseInt(a.price) : a.price;
          const priceB = typeof b.price === 'string' ? parseInt(b.price) : b.price;
          return priceA - priceB;
        });
      case 'price-desc':
        return filtered.sort((a, b) => {
          const priceA = typeof a.price === 'string' ? parseInt(a.price) : a.price;
          const priceB = typeof b.price === 'string' ? parseInt(b.price) : b.price;
          return priceB - priceA;
        });
      case 'popular':
      default:
        // За популярністю = нові товари спочатку (за часом створення)
        return filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
  }, [allProducts, sortBy, selectedCategory, priceRange, showAbroadOnly]);

  // Пагінація
  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = sortedProducts.slice(startIndex, endIndex);

  // Генерація номерів сторінок для відображення
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);

    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const handleToggleCart = (product: Product) => {
    // Отримую поточний кошик
    const existingCart = localStorage.getItem('mlp-cart');
    const cart = existingCart ? JSON.parse(existingCart) : [];

    const existingItemIndex = cart.findIndex((item: any) => item.id === product.id);

    if (existingItemIndex !== -1) {
      // Товар вже в кошику - видаляємо його
      cart.splice(existingItemIndex, 1);
      setCartItems(prev => prev.filter(id => id !== product.id));

      // Показую анімацію видалення
      setAddedItems(prev => ({ ...prev, [product.id]: 'removed' }));
      setTimeout(() => {
        setAddedItems(prev => ({ ...prev, [product.id]: false }));
      }, 1000);
    } else {
      // Товару немає в кошику - додаємо його
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
        category: product.category,
        maxQuantity: product.quantity, // Додаємо максимальну кількість на складі
        discount: product.discount ?? 0,
        images: product.images || [], // Додаємо масив фото
        deliveryPrice: product.deliveryPrice, // Ціна доставки
        deliveryDays: product.deliveryDays, // Термін доставки
      });
      setCartItems(prev => [...prev, product.id]);

      // Показую анімацію додавання
      setAddedItems(prev => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setAddedItems(prev => ({ ...prev, [product.id]: false }));
      }, 1500);
    }

    localStorage.setItem('mlp-cart', JSON.stringify(cart));

    // Відправляю custom event щоб інші компоненти дізналися про зміну
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));
  };

  const handlePageChange = (page: number | string) => {
    if (typeof page === 'number') {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🦄</div>
          <p className="text-gray-600 text-lg">Завантаження товарів...</p>
        </div>
      </main>
    );
  }

  // Empty state
  if (!loading && allProducts.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🦄</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Товари не знайдено</h1>
          <p className="text-gray-600 mb-6">Наразі товари відсутні в базі даних</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-gray-50">
        {/* Хлібні крихти */}
        <nav className="bg-white border-b border-gray-200" aria-label="Breadcrumb">
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <ol className="flex items-center gap-2 text-sm text-gray-600">
              <li><a href="/" className="hover:text-indigo-600 transition-colors">Головна</a></li>
              <li className="text-gray-300">/</li>
              <li className="text-indigo-600 font-semibold">Каталог</li>
            </ol>
          </div>
        </nav>

        {/* Заголовок сторінки */}
        <section className="py-12 md:py-16 bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-5xl md:text-6xl">🦄</div>
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900">
                Каталог товарів mlpcutiefamily
              </h1>
            </div>
            <p className="text-sm md:text-lg text-gray-600 mb-6 max-w-2xl leading-relaxed">
              Купіть оригінальні іграшки та колекційні фігурки My Little Pony з доставкою по Україні.
              Великий вибір персонажів, наборів та аксесуарів за найкращими цінами.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full font-semibold">
                <span className="text-xl">✨</span> {allProducts.length}+ товарів
              </span>
              <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-semibold">
                <span className="text-xl">🚀</span> Швидка доставка
              </span>
              <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full font-semibold">
                <span className="text-xl">✅</span> 100% оригіналу
              </span>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 max-w-7xl py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Бічна панель з фільтрами */}
            <aside className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="text-2xl">🎨</span> Категорії
                </h2>
                <nav className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setShowAbroadOnly(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${selectedCategory === null && !showAbroadOnly
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100 hover:text-indigo-600 hover:translate-x-1"
                      }`}
                  >
                    Всі категорії
                  </button>
                  {derivedCategories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => {
                        setSelectedCategory(category.name);
                        setShowAbroadOnly(false);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${selectedCategory === category.name
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100 hover:text-indigo-600 hover:translate-x-1"
                        }`}
                    >
                      <span className="font-medium">{category.name}</span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${selectedCategory === category.name
                        ? "bg-white/30"
                        : "bg-gray-200 text-gray-700"
                        }`}>
                        {category.count}
                      </span>
                    </button>
                  ))}

                  {/* Кнопка «Іграшки із закордону» */}
                  <button
                    onClick={() => {
                      setShowAbroadOnly(prev => !prev);
                      setSelectedCategory(null);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left flex items-center justify-between p-3 rounded-lg transition-all duration-200 mt-2 ${showAbroadOnly
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:translate-x-1 border border-blue-200'
                      }`}
                  >
                    <span className="font-medium">🌍 Із закордону</span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${showAbroadOnly ? 'bg-white/30' : 'bg-blue-100 text-blue-700'
                      }`}>
                      {allProducts.filter(p => (p as any).isAbroad).length}
                    </span>
                  </button>
                </nav>

                {/* Фільтри ціни */}
                <div className="mt-8 pt-8 border-t border-gray-300">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-xl">💰</span> Ціна
                  </h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Від"
                        min="0"
                        value={priceRange?.[0] || ''}
                        onChange={(e) => {
                          const from = e.target.value ? parseInt(e.target.value) : 0;
                          const to = priceRange?.[1] || 10000;
                          setPriceRange([from, to]);
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-900"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="До"
                        min="0"
                        value={priceRange?.[1] || ''}
                        onChange={(e) => {
                          const from = priceRange?.[0] || 0;
                          const to = e.target.value ? parseInt(e.target.value) : 10000;
                          setPriceRange([from, to]);
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-gray-900"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setPriceRange(null);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-200 transition-colors text-sm"
                    >
                      Очистити фільтр
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            {/* Основна сітка товарів */}
            <section className="lg:col-span-3">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-gray-700 font-semibold text-sm sm:text-base">
                  Показано <span className="text-indigo-600 font-bold">{currentProducts.length}</span> з <span className="text-indigo-600 font-bold">{sortedProducts.length}</span> товарів
                </p>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-semibold hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all cursor-pointer text-sm sm:text-base"
                >
                  <option value="popular">✨ За популярністю</option>
                  <option value="price-asc">💰 За ціною (зростання)</option>
                  <option value="price-desc">💰 За ціною (спадання)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentProducts.map((product: Product) => (
                  <article
                    key={product.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group border border-gray-200"
                    itemScope
                    itemType="https://schema.org/Product"
                  >
                    {/* Schema.org мітки для SEO */}
                    <meta itemProp="name" content={product.name} />
                    <meta itemProp="description" content={product.description} />
                    <meta itemProp="priceCurrency" content="UAH" />
                    <meta itemProp="price" content={String(product.price)} />
                    <meta itemProp="availability" content={product.quantity > 0 ? "InStock" : "OutOfStock"} />

                    {/* Іконка продукту (галерея тільки на сторінці товару) */}
                    <Link href={`/catalog/product/${product.id}`} className="block">
                      <div className="w-full h-56 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                        {(Array.isArray(product.images) && product.images.length > 0) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : product.image && product.image.startsWith('http') ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-7xl group-hover:scale-125 transition-transform duration-300">{product.image || '📦'}</div>
                        )}
                        {(product.quantity || 0) === 0 ? (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <p className="text-white font-bold text-lg text-center">❌ Немає в наявності</p>
                          </div>
                        ) : null}
                        {(Number(product.discount) || 0) > 0 ? (
                          <div className="absolute top-4 right-4 bg-red-500 text-white font-bold px-3 py-2 rounded-full shadow-md">
                            −{product.discount}%
                          </div>
                        ) : null}
                        {(product as any).isAbroad ? (
                          <div className="absolute top-4 left-4 bg-blue-600 text-white font-bold px-2 py-1 rounded-full text-xs shadow-md flex items-center gap-1">
                            🌍 Із закордону
                          </div>
                        ) : null}
                      </div>
                    </Link>

                    {/* Інформація про продукт */}
                    <div className="p-5">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">
                        {product.category}
                      </p>
                      <Link href={`/catalog/product/${product.id}`} className="block">
                        <h3 className="text-base font-bold text-gray-900 mb-2 hover:text-indigo-600 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {product.description}
                      </p>

                      {/* Ціна та доставка */}
                      <div className="flex flex-col gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          {Number(product.discount) > 0 ? (
                            <>
                              <span className="text-xs text-gray-400 line-through font-semibold">
                                {product.price}₴
                              </span>
                              <span className="text-2xl font-bold text-indigo-600">
                                {Math.round((typeof product.price === 'string' ? parseFloat(product.price) : product.price) * (1 - Number(product.discount) / 100))}₴
                              </span>
                            </>
                          ) : (
                            <span className="text-2xl font-bold text-indigo-600">
                              {product.price}₴
                            </span>
                          )}
                        </div>

                        {/* Доставка */}
                        <div className="flex items-center gap-2 text-xs bg-blue-50 rounded-lg p-2 border border-blue-100">
                          <span className="text-sm">🚚</span>
                          <span className="text-gray-700">
                            <span className="font-semibold text-blue-600">{product.deliveryPrice || '120'} ₴</span>
                          </span>
                          <span className="text-gray-500">({product.deliveryDays || '1-2'} дн.)</span>
                        </div>
                      </div>

                      {/* Кнопка */}
                      <button
                        onClick={() => handleToggleCart(product)}
                        className={`w-full px-4 py-3 rounded-lg font-bold transition-all duration-200 ${addedItems[product.id] === 'removed'
                          ? "bg-red-500 text-white shadow-lg"
                          : addedItems[product.id] === true
                            ? "bg-green-500 text-white shadow-lg"
                            : cartItems.includes(product.id)
                              ? "bg-blue-600 text-white hover:bg-red-600 shadow-md"
                              : product.quantity > 0
                                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                                : "bg-gray-300 text-gray-600 cursor-not-allowed opacity-60"
                          }`}
                        disabled={product.quantity === 0}
                        title={cartItems.includes(product.id) ? "Видалити з кошика" : "Додати в кошик"}
                      >
                        {addedItems[product.id] === 'removed'
                          ? "Видалено!"
                          : addedItems[product.id] === true
                            ? "Додано!"
                            : cartItems.includes(product.id)
                              ? "Видалити"
                              : product.quantity > 0
                                ? "В кошик"
                                : "❌ Закінчився"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {/* Функціональна пагінація */}
              <nav className="mt-12 flex justify-center gap-2 items-center flex-wrap" aria-label="Пагінація">
                {/* Кнопка "Назад" */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-5 py-3 border-2 rounded-lg font-bold transition-all duration-200 ${currentPage === 1
                    ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50 opacity-50"
                    : "border-purple-600 text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:text-white hover:shadow-lg"
                    }`}
                >
                  ← Назад
                </button>

                {/* Номери сторінок */}
                {getPageNumbers().map((page, index) => (
                  <div key={index}>
                    {page === '...' ? (
                      <span className="px-2 py-2 text-gray-400 text-lg font-bold">•••</span>
                    ) : (
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-3 rounded-lg font-bold transition-all duration-200 ${currentPage === page
                          ? "bg-indigo-600 text-white shadow-md"
                          : "border border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
                          }`}
                      >
                        {page}
                      </button>
                    )}
                  </div>
                ))}

                {/* Кнопка "Далі" */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-5 py-3 border-2 rounded-lg font-bold transition-all duration-200 ${currentPage === totalPages
                    ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50 opacity-50"
                    : "border-purple-600 text-purple-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:text-white hover:shadow-lg"
                    }`}
                >
                  Далі →
                </button>
              </nav>

              {/* Інформація про пагінацію */}
              <div className="mt-8 text-center">
                <p className="text-gray-700 font-semibold">
                  Сторінка <span className="font-bold text-indigo-600">{currentPage}</span> з <span className="font-bold text-indigo-600">{totalPages}</span>
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* FAQ секція для SEO */}
        <section className="py-16 mt-12 pb-24 bg-white border-t border-gray-300">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="mb-12">
              <h2 className="text-4xl font-bold text-gray-900">
                Часті питання про My Little Pony іграшки
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  q: "Чи оригінальні всі товари?",
                  a: "Так, ми продаємо тільки оригінальну продукцію від офіційних виробників.",
                  emoji: "✅"
                },
                {
                  q: "Скільки коштує доставка?",
                  a: <>Доставка безкоштовна при замовленні від 5000₴. Зазвичай вартість доставки по Україні - 80-120₴. <Link href='/delivery' className='underline text-purple-600'>Детальніше про доставку</Link></>,
                  emoji: "🚚"
                },
                {
                  q: "Який час доставки?",
                  a: "Доставляємо по Україні за 1-3 робочі дні.",
                  emoji: "⏱️"
                },
                {
                  q: "Можна повернути товар?",
                  a: <>Так, товар повернути можна. Ознайомтесь з нашою <Link href='/refund' className='underline text-purple-600'>політикою повернення товарів</Link>.</>,
                  emoji: "↩️"
                },
              ].map((item, index) => (
                <div key={index} className="bg-white border border-gray-300 rounded-lg p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">{item.emoji}</span>
                    {item.q}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Структурована розмітка для SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "Каталог My Little Pony",
              description: "Великий каталог оригінальних іграшок та фігурок My Little Pony",
              url: "https://mlpstore.ua/catalog",
              mainEntity: {
                "@type": "ItemList",
                numberOfItems: sortedProducts.length,
                itemListElement: sortedProducts.map((product: Product, index: number) => ({
                  "@type": "Product",
                  position: index + 1,
                  name: product.name,
                  description: product.description,
                  offers: {
                    "@type": "Offer",
                    price: String(product.price),
                    priceCurrency: "UAH",
                    availability: product.quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStack",
                  },
                })),
              },
            }),
          }}
        />
      </main>
      <Basket />
      <AccountButton />
    </>
  );
}
