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
  const [addedItems, setAddedItems] = useState<{ [key: number]: boolean | string }>({});
  const [cartItems, setCartItems] = useState<number[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Фільтрація та сортування товарів
  const sortedProducts = useMemo(() => {
    let filtered = [...allProducts];

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
        // За популярністю = нові товари спочатку (більший ID = новіший)
        return filtered.sort((a, b) => b.id - a.id);
    }
  }, [allProducts, sortBy, selectedCategory, priceRange]);

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
            <li><a href="/" className="hover:text-purple-600 transition-colors">Головна</a></li>
            <li className="text-gray-300">/</li>
            <li className="text-purple-700 font-semibold">Каталог</li>
          </ol>
        </div>
      </nav>

      {/* Заголовок сторінки */}
      <section className="py-12 md:py-16 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="text-5xl md:text-6xl">🦄</div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Каталог My Little Pony
            </h1>
          </div>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl leading-relaxed">
            Купіть оригінальні іграшки та колекційні фігурки My Little Pony з доставкою по Україні. 
            Великий вибір персонажів, наборів та аксесуарів за найкращими цінами.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-semibold">
              <span className="text-xl">✨</span> {allProducts.length}+ товарів
            </span>
            <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
              <span className="text-xl">🚀</span> Швидка доставка
            </span>
            <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
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
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    selectedCategory === null
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/50 scale-105"
                      : "text-gray-700 hover:bg-purple-50 hover:text-purple-600 hover:translate-x-1"
                  }`}
                >
                  Всі категорії
                </button>
                {derivedCategories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => {
                      setSelectedCategory(category.name);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                      selectedCategory === category.name
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/50"
                        : "text-gray-700 hover:bg-purple-50 hover:text-purple-600 hover:translate-x-1"
                    }`}
                  >
                    <span className="font-medium">{category.name}</span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      selectedCategory === category.name
                        ? "bg-white/30"
                        : "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700"
                    }`}>
                      {category.count}
                    </span>
                  </button>
                ))}
              </nav>

              {/* Фільтри ціни */}
              <div className="mt-8 pt-8 border-t border-purple-200/30">
                <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                  <span className="text-xl">💰</span> Ціна
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer group">
                    <input 
                      type="radio" 
                      name="price"
                      className="w-5 h-5 text-purple-600 accent-purple-600"
                      checked={priceRange === null}
                      onChange={() => {
                        setPriceRange(null);
                        setCurrentPage(1);
                      }}
                    />
                    <span className="ml-3 text-gray-700 group-hover:text-purple-600 font-medium transition-colors">Усі ціни</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input 
                      type="radio" 
                      name="price"
                      className="w-5 h-5 text-purple-600 accent-purple-600"
                      checked={priceRange?.[0] === 0 && priceRange?.[1] === 300}
                      onChange={() => {
                        setPriceRange([0, 300]);
                        setCurrentPage(1);
                      }}
                    />
                    <span className="ml-3 text-gray-700 group-hover:text-purple-600 font-medium transition-colors">До 300₴</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input 
                      type="radio" 
                      name="price"
                      className="w-5 h-5 text-purple-600 accent-purple-600"
                      checked={priceRange?.[0] === 300 && priceRange?.[1] === 700}
                      onChange={() => {
                        setPriceRange([300, 700]);
                        setCurrentPage(1);
                      }}
                    />
                    <span className="ml-3 text-gray-700 group-hover:text-purple-600 font-medium transition-colors">300₴ - 700₴</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input 
                      type="radio" 
                      name="price"
                      className="w-5 h-5 text-purple-600 accent-purple-600"
                      checked={priceRange?.[0] === 700 && priceRange?.[1] === 1500}
                      onChange={() => {
                        setPriceRange([700, 1500]);
                        setCurrentPage(1);
                      }}
                    />
                    <span className="ml-3 text-gray-700 group-hover:text-purple-600 font-medium transition-colors">700₴ - 1500₴</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input 
                      type="radio" 
                      name="price"
                      className="w-5 h-5 text-purple-600 accent-purple-600"
                      checked={priceRange?.[0] === 1500 && priceRange?.[1] === 10000}
                      onChange={() => {
                        setPriceRange([1500, 10000]);
                        setCurrentPage(1);
                      }}
                    />
                    <span className="ml-3 text-gray-700 group-hover:text-purple-600 font-medium transition-colors">Понад 1500₴</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* Основна сітка товарів */}
          <section className="lg:col-span-3">
            <div className="mb-8 flex items-center justify-between bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-gray-700 font-semibold">
                Показано <span className="text-purple-600 font-bold">{currentProducts.length}</span> з <span className="text-purple-600 font-bold">{sortedProducts.length}</span> товарів
              </p>
              <select 
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-semibold hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all cursor-pointer"
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
                      {product.images && product.images.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-7xl group-hover:scale-125 transition-transform duration-300">{product.image || '📦'}</div>
                      )}
                      {product.quantity === 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <p className="text-white font-bold text-lg text-center">❌ Немає в наявності</p>
                        </div>
                      )}
                      {product.discount && product.discount > 0 && (
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold px-3 py-2 rounded-full shadow-lg">
                          −{product.discount}%
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Інформація про продукт */}
                  <div className="p-5">
                    <p className="text-xs font-bold text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text uppercase tracking-widest mb-3">
                      {product.category}
                    </p>
                    <Link href={`/catalog/product/${product.id}`} className="block">
                      <h3 className="text-base font-bold text-gray-900 mb-2 hover:text-transparent hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:bg-clip-text transition-all line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Ціна та кнопка */}
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        {product.discount && product.discount > 0 ? (
                          <>
                            <span className="text-xs text-gray-400 line-through font-semibold">
                              {product.price}₴
                            </span>
                            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                              {Math.round((typeof product.price === 'string' ? parseFloat(product.price) : product.price) * (1 - product.discount / 100))}₴
                            </span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {product.price}₴
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => handleToggleCart(product)}
                        className={`w-full px-4 py-3 rounded-lg font-bold transition-all duration-200 ${
                          addedItems[product.id] === 'removed'
                            ? "bg-red-500 text-white scale-105 shadow-lg"
                            : addedItems[product.id] === true
                            ? "bg-green-500 text-white scale-105 shadow-lg"
                            : cartItems.includes(product.id)
                            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-red-600 hover:to-red-500 shadow-lg"
                            : product.quantity > 0
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
                            : "bg-gray-300 text-gray-600 cursor-not-allowed opacity-60"
                        }`}
                        disabled={product.quantity === 0}
                        title={cartItems.includes(product.id) ? "Видалити з кошика" : "Додати в кошик"}
                      >
                        {addedItems[product.id] === 'removed'
                          ? "✓ Видалено!"
                          : addedItems[product.id] === true 
                          ? "✓ Додано!" 
                          : cartItems.includes(product.id)
                          ? "🗑️ Видалити"
                          : product.quantity > 0 
                          ? "🛒 В кошик" 
                          : "❌ Закінчився"}
                      </button>
                    </div>
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
                className={`px-5 py-3 border-2 rounded-lg font-bold transition-all duration-200 ${
                  currentPage === 1
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
                      className={`px-4 py-3 rounded-lg font-bold transition-all duration-200 ${
                        currentPage === page
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/50"
                          : "border-2 border-purple-300 text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:border-purple-600"
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
                className={`px-5 py-3 border-2 rounded-lg font-bold transition-all duration-200 ${
                  currentPage === totalPages
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
                Сторінка <span className="text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text font-bold">{currentPage}</span> з <span className="text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text font-bold">{totalPages}</span>
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* FAQ секція для SEO */}
      <section className="relative overflow-hidden py-16 mt-12 pb-24 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border-t border-purple-200/30">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <span className="text-4xl">❓</span>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
                a: "Доставка безкоштовна при замовленні від 2000₴. В інших випадках - 50₴.",
                emoji: "🚚"
              },
              {
                q: "Який час доставки?",
                a: "Доставляємо по Україні за 1-3 робочі дні.",
                emoji: "⏱️"
              },
              {
                q: "Можна повернути товар?",
                a: "Так, протягом 14 днів без причини або при виявленні дефектів.",
                emoji: "↩️"
              },
            ].map((item, index) => (
              <div key={index} className="bg-white/70 backdrop-blur-md border-2 border-purple-200/30 rounded-2xl p-6 hover:shadow-lg hover:border-purple-400/50 transition-all duration-200 hover:-translate-y-1">
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
