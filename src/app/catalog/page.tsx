'use client';

import { useState, useMemo, useEffect } from 'react';
import Basket from '../components/client/busket';

interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  image: string;
  description: string;
  inStock: boolean;
}

const allProducts: Product[] = [
  {
    id: 1,
    name: "Twilight Sparkle",
    category: "Основні персонажі",
    price: "299₴",
    image: "🦄",
    description: "Фігурка головної героїні Твайлайт Спаркл",
    inStock: true,
  },
  {
    id: 2,
    name: "Rainbow Dash",
    category: "Основні персонажі",
    price: "299₴",
    image: "🌈",
    description: "Цвітна фігурка Рейнбоу Деш",
    inStock: true,
  },
  {
    id: 3,
    name: "Pinkie Pie",
    category: "Основні персонажі",
    price: "299₴",
    image: "🎀",
    description: "Веселісінька фігурка Пінкі Пай",
    inStock: true,
  },
  {
    id: 4,
    name: "Applejack",
    category: "Основні персонажі",
    price: "299₴",
    image: "🍎",
    description: "Чарівна фігурка Еппльджек",
    inStock: true,
  },
  {
    id: 5,
    name: "Fluttershy",
    category: "Основні персонажі",
    price: "299₴",
    image: "🦋",
    description: "Ніжна фігурка Флаттершай",
    inStock: true,
  },
  {
    id: 6,
    name: "Rarity",
    category: "Основні персонажі",
    price: "299₴",
    image: "💎",
    description: "Елегантна фігурка Редрарітсі",
    inStock: true,
  },
  {
    id: 7,
    name: "Колекційний набір",
    category: "Набори",
    price: "1299₴",
    image: "🎁",
    description: "Набір з 6 основних персонажів",
    inStock: true,
  },
  {
    id: 8,
    name: "Радужна карета",
    category: "Аксесуари",
    price: "699₴",
    image: "🏰",
    description: "Красива карета для персонажів",
    inStock: false,
  },
  {
    id: 9,
    name: "Princess Luna",
    category: "Рідкісні видання",
    price: "499₴",
    image: "🌙",
    description: "Колекційна фігурка принцеси Луни",
    inStock: true,
  },
  {
    id: 10,
    name: "Princess Celestia",
    category: "Рідкісні видання",
    price: "499₴",
    image: "☀️",
    description: "Золота фігурка принцеси Селестії",
    inStock: true,
  },
  {
    id: 11,
    name: "Spike Mini",
    category: "Міні-фігурки",
    price: "99₴",
    image: "🐉",
    description: "Мала фігурка Спайка",
    inStock: true,
  },
  {
    id: 12,
    name: "Discord",
    category: "Рідкісні видання",
    price: "599₴",
    image: "🎭",
    description: "Незвичайна фігурка Дискорда",
    inStock: false,
  },
  {
    id: 13,
    name: "Chrysalis",
    category: "Рідкісні видання",
    price: "449₴",
    image: "👑",
    description: "Темна фігурка королеви Хризаліс",
    inStock: true,
  },
  {
    id: 14,
    name: "Apple Bloom Mini",
    category: "Міні-фігурки",
    price: "89₴",
    image: "🍎",
    description: "Мініатюрна фігурка Епл Блум",
    inStock: true,
  },
  {
    id: 15,
    name: "Sweetie Belle Mini",
    category: "Міні-фігурки",
    price: "89₴",
    image: "✨",
    description: "Мініатюрна фігурка Світі Белл",
    inStock: true,
  },
];

const categories = [
  { name: "Основні персонажі", count: 6 },
  { name: "Набори", count: 1 },
  { name: "Аксесуари", count: 1 },
  { name: "Рідкісні видання", count: 4 },
  { name: "Міні-фігурки", count: 3 },
];

const ITEMS_PER_PAGE = 6;

export default function CatalogPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('popular');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [addedItems, setAddedItems] = useState<{ [key: number]: boolean | string }>({});
  const [cartItems, setCartItems] = useState<number[]>([]);

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
        const price = parseInt(p.price);
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

    // Сортування
    switch (sortBy) {
      case 'price-asc':
        return filtered.sort((a, b) => 
          parseInt(a.price) - parseInt(b.price)
        );
      case 'price-desc':
        return filtered.sort((a, b) => 
          parseInt(b.price) - parseInt(a.price)
        );
      default:
        return filtered;
    }
  }, [sortBy, selectedCategory, priceRange]);

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
  return (
    <>
    <main className="min-h-screen bg-gray-50">
      {/* Хлібні крихти */}
      <nav className="bg-white border-b border-gray-200" aria-label="Breadcrumb">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <ol className="flex items-center gap-2 text-sm text-gray-600">
            <li><a href="/" className="hover:text-purple-600">Головна</a></li>
            <li>/</li>
            <li className="text-gray-900 font-semibold">Каталог</li>
          </ol>
        </div>
      </nav>

      {/* Заголовок сторінки з розширеним описом для SEO */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Каталог My Little Pony
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Купіть оригінальні іграшки та колекційні фігурки My Little Pony з доставкою по Україні. 
            Великий вибір персонажів, наборів та аксесуарів за найкращими цінами.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
              {allProducts.length}+ товарів
            </span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              Швидка доставка
            </span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
              100% оригіналу
            </span>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-7xl py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Бічна панель з фільтрами */}
          <aside className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Категорії</h2>
              <nav className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === null
                      ? "bg-purple-600 text-white"
                      : "text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                  }`}
                >
                  Всі категорії
                </button>
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => {
                      setSelectedCategory(category.name);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left flex items-center justify-between p-3 rounded-lg transition-colors ${
                      selectedCategory === category.name
                        ? "bg-purple-600 text-white"
                        : "text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                    }`}
                  >
                    <span className="font-medium">{category.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      selectedCategory === category.name
                        ? "bg-purple-700"
                        : "bg-gray-100"
                    }`}>
                      {category.count}
                    </span>
                  </button>
                ))}
              </nav>

              {/* Фільтри ціни */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Ціна</h3>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer group">
                    <input 
                      type="radio" 
                      name="price"
                      className="w-4 h-4 text-purple-600"
                      checked={priceRange === null}
                      onChange={() => {
                        setPriceRange(null);
                        setCurrentPage(1);
                      }}
                    />
                    <span className="ml-3 text-gray-700 group-hover:text-purple-600">Усі ціни</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input 
                      type="radio" 
                      name="price"
                      className="w-4 h-4 text-purple-600"
                      checked={priceRange?.[0] === 0 && priceRange?.[1] === 300}
                      onChange={() => {
                        setPriceRange([0, 300]);
                        setCurrentPage(1);
                      }}
                    />
                    <span className="ml-3 text-gray-700 group-hover:text-purple-600">До 300₴</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input 
                      type="radio" 
                      name="price"
                      className="w-4 h-4 text-purple-600"
                      checked={priceRange?.[0] === 300 && priceRange?.[1] === 700}
                      onChange={() => {
                        setPriceRange([300, 700]);
                        setCurrentPage(1);
                      }}
                    />
                    <span className="ml-3 text-gray-700 group-hover:text-purple-600">300₴ - 700₴</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input 
                      type="radio" 
                      name="price"
                      className="w-4 h-4 text-purple-600"
                      checked={priceRange?.[0] === 700 && priceRange?.[1] === 1500}
                      onChange={() => {
                        setPriceRange([700, 1500]);
                        setCurrentPage(1);
                      }}
                    />
                    <span className="ml-3 text-gray-700 group-hover:text-purple-600">700₴ - 1500₴</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input 
                      type="radio" 
                      name="price"
                      className="w-4 h-4 text-purple-600"
                      checked={priceRange?.[0] === 1500 && priceRange?.[1] === 10000}
                      onChange={() => {
                        setPriceRange([1500, 10000]);
                        setCurrentPage(1);
                      }}
                    />
                    <span className="ml-3 text-gray-700 group-hover:text-purple-600">Понад 1500₴</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* Основна сітка товарів */}
          <section className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                Показано <strong>{currentProducts.length}</strong> з <strong>{sortedProducts.length}</strong> товарів
              </p>
              <select 
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="popular">За популярністю</option>
                <option value="price-asc">За ціною (зростання)</option>
                <option value="price-desc">За ціною (спадання)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentProducts.map((product: Product) => (
                <article 
                  key={product.id} 
                  className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
                  itemScope
                  itemType="https://schema.org/Product"
                >
                  {/* Schema.org мітки для SEO */}
                  <meta itemProp="name" content={product.name} />
                  <meta itemProp="description" content={product.description} />
                  <meta itemProp="priceCurrency" content="UAH" />
                  <meta itemProp="price" content={product.price.replace("₴", "")} />
                  <meta itemProp="availability" content={product.inStock ? "InStock" : "OutOfStock"} />

                  {/* Зображення продукту */}
                  <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-6xl relative">
                    {product.image}
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <p className="text-white font-bold text-lg">Немає в наявності</p>
                      </div>
                    )}
                  </div>

                  {/* Інформація про продукт */}
                  <div className="p-4">
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">
                      {product.category}
                    </p>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-purple-600 cursor-pointer">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {product.description}
                    </p>

                    {/* Ціна та кнопка */}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-purple-600">
                        {product.price}
                      </span>
                      <button 
                        onClick={() => handleToggleCart(product)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                          addedItems[product.id] === 'removed'
                            ? "bg-red-500 text-white scale-105"
                            : addedItems[product.id] === true
                            ? "bg-green-500 text-white scale-105"
                            : cartItems.includes(product.id)
                            ? "bg-blue-600 text-white hover:bg-red-600"
                            : product.inStock
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : "bg-gray-300 text-gray-600 cursor-not-allowed"
                        }`}
                        disabled={!product.inStock}
                        title={cartItems.includes(product.id) ? "Видалити з кошика" : "Додати в кошик"}
                      >
                        {addedItems[product.id] === 'removed'
                          ? "✓ Видалено!"
                          : addedItems[product.id] === true 
                          ? "✓ Додано!" 
                          : cartItems.includes(product.id)
                          ? "✓ Видалити"
                          : product.inStock 
                          ? "В кошик" 
                          : "Закінчився"}
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
                className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                  currentPage === 1
                    ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                    : "border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-600 hover:text-purple-600"
                }`}
              >
                ← Назад
              </button>

              {/* Номери сторінок */}
              {getPageNumbers().map((page, index) => (
                <div key={index}>
                  {page === '...' ? (
                    <span className="px-2 py-2 text-gray-500">...</span>
                  ) : (
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? "bg-purple-600 text-white"
                          : "border border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-600 hover:text-purple-600"
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
                className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                  currentPage === totalPages
                    ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
                    : "border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-600 hover:text-purple-600"
                }`}
              >
                Далі →
              </button>
            </nav>

            {/* Інформація про пагінацію */}
            <div className="mt-6 text-center text-gray-600">
              <p>Сторінка <strong>{currentPage}</strong> з <strong>{totalPages}</strong></p>
            </div>
          </section>
        </div>
      </div>

      {/* FAQ секція для SEO */}
      <section className="bg-white border-t border-gray-200 py-12 mt-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Часті питання про My Little Pony іграшки
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: "Чи оригінальні всі товари?",
                a: "Так, ми продаємо тільки оригінальну продукцію від офіційних виробників.",
              },
              {
                q: "Скільки коштує доставка?",
                a: "Доставка безкоштовна при замовленні від 500₴. В інших випадках - 50₴.",
              },
              {
                q: "Який час доставки?",
                a: "Доставляємо по Україні за 1-3 робочі дні.",
              },
              {
                q: "Можна повернути товар?",
                a: "Так, протягом 14 днів без причини або при виявленні дефектів.",
              },
            ].map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2">{item.q}</h3>
                <p className="text-gray-600">{item.a}</p>
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
                  price: product.price.replace("₴", ""),
                  priceCurrency: "UAH",
                  availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                },
              })),
            },
          }),
        }}
      />
    </main>
    <Basket />
    </>
  );
}
