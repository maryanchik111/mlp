'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Basket from '../components/client/busket';
import AccountButton from '../components/client/account-button';

// Типи боксів (розміри)
const BOX_TYPES = [
  { 
    id: 'S', 
    name: 'S', 
    capacity: 5, 
    price: 299,
    description: 'Маленький бокс'
  },
  { 
    id: 'M', 
    name: 'M', 
    capacity: 8, 
    price: 499,
    description: 'Середній бокс'
  },
  { 
    id: 'L', 
    name: 'L', 
    capacity: 12, 
    price: 799,
    description: 'Великий бокс'
  },
];

// Статичні товари для конструктора
const CONSTRUCTOR_ITEMS = [
  { 
    id: 13, 
    name: 'Hippers My Little Pony', 
    category: 'Аксесуари', 
    price: 199, 
    images: ['/products/hippers-1.JPG', '/mlp/hippers-2.jpg', '/mlp/hippers-3.jpg'],
    image: '/products/hippers-1.JPG',
    description: 'Стильний декоративний аксесуар у вигляді персонажів MLP, який кріпиться до смартфона. Легко встановлюється, не пошкоджує поверхню телефона. Аксесуар комплектується спеціальним кліпсою та липким матеріалом для безпечного кріплення до смартфона будь-якої моделі. У серії доступно 6 варіантів (Twilight Sparkle, Rainbow Dash, Pinkie Pie, Applejack, Fluttershy, Rarity), в коробочці потрапляється випадкова модель. Ідеальний подарунок для фанатів My Little Pony!' 
  },
  { 
    id: 14, 
    name: 'Колекційні картки My Little Pony v1', 
    category: 'Картки', 
    price: 199, 
    images: ['/products/card-one.PNG'],
    image: '/products/card-one.PNG',
    description: 'Стильні картки з яскравими персонажами. У колекції є кілька різних варіантів, а в кожній упаковці - випадкові картки-сюрпризи. Запечатані, якісні та ідеальні для колекціонування або подарунка.' 
  },
  { 
    id: 15, 
    name: 'Колекційні картки My Little Pony v2', 
    category: 'Картки', 
    price: 199, 
    images: ['/products/cards-two-1.PNG', '/products/cards-two-2.PNG', '/products/cards-two-3.PNG'],
    image: '/products/cards-two-1.PNG',
    description: 'Стильні картки з яскравими персонажами. У колекції є кілька різних варіантів, а в кожній упаковці - випадкові картки-сюрпризи. Запечатані, якісні та ідеальні для колекціонування або подарунка.' 
  },
  { 
    id: 16, 
    name: 'Колекційні картки My Little Pony v3', 
    category: 'Картки', 
    price: 199, 
    images: ['/products/cards-three-1.PNG', '/products/cards-three-2.PNG', '/products/cards-three-3.PNG'],
    image: '/products/cards-three-1.PNG',
    description: 'Стильні картки з яскравими персонажами. У колекції є кілька різних варіантів, а в кожній упаковці - випадкові картки-сюрпризи. Запечатані, якісні та ідеальні для колекціонування або подарунка.' 
  },
  { 
    id: 17, 
    name: 'Колекційні картки My Little Pony v4', 
    category: 'Картки', 
    price: 199, 
    images: ['/products/cards-four-1.PNG', '/products/cards-four-2.PNG', '/products/cards-four-3.PNG'],
    image: '/products/cards-four-1.PNG',
    description: 'Стильні картки з яскравими персонажами. У колекції є кілька різних варіантів, а в кожній упаковці - випадкові картки-сюрпризи. Запечатані, якісні та ідеальні для колекціонування або подарунка.' 
  },
  { 
    id: 18, 
    name: 'Колекційні картки My Little Pony v5 (4 шт)', 
    category: 'Картки', 
    price: 399, 
    images: ['/products/cards-five-1.PNG', '/products/cards-five-2.PNG'],
    image: '/products/cards-five-1.PNG',
    description: 'Стильні картки з яскравими персонажами. У колекції є кілька різних варіантів, а в кожній упаковці - випадкові картки-сюрпризи. Запечатані, якісні та ідеальні для колекціонування або подарунка.' 
  },
  { 
    id: 19, 
    name: 'Колекційні картки My Little Pony v6 (1 шт)', 
    category: 'Картки', 
    price: 149, 
    images: ['/products/cards-oneitem.PNG'],
    image: '/products/cards-oneitem.PNG',
    description: 'Стильні картки з яскравими персонажами. У колекції є кілька різних варіантів, а в кожній упаковці - випадкові картки-сюрпризи. Запечатані, якісні та ідеальні для колекціонування або подарунка.' 
  },
  { 
    id: 20, 
    name: 'Колекційні картки My Little Pony v6 (2 шт)', 
    category: 'Картки', 
    price: 249, 
    images: ['/products/cards-twoitems.PNG'],
    image: '/products/cards-twoitems.PNG',
    description: 'Стильні картки з яскравими персонажами. У колекції є кілька різних варіантів, а в кожній упаковці - випадкові картки-сюрпризи. Запечатані, якісні та ідеальні для колекціонування або подарунка.' 
  },
  { 
    id: 21, 
    name: 'Крабики для волосся My Little Pony', 
    category: 'Аксесуари', 
    price: 199, 
    images: ['/products/crabs-1.PNG', '/products/crabs-2.PNG', '/products/crabs-3.PNG', '/products/crabs-4.PNG', '/products/crabs-5.PNG'],
    image: '/products/crabs-1.PNG',
    description: 'Яскраві та зручні аксесуари з улюбленими персонажами поні: Пінкі Пай, Флатершай, Рейнбоу Деш та Твайлайт. Надійно тримають волосся, не пошкоджують його та додають образу милого стилю.' 
  },
  { 
    id: 22, 
    name: 'Крабики для волосся My Little Pony v2', 
    category: 'Аксесуари', 
    price: 199, 
    images: ['/products/crabs-v2-1.PNG', '/products/crabs-v2-2.PNG', '/products/crabs-v2-3.PNG', '/products/crabs-v2-4.PNG', '/products/crabs-v2-5.PNG', '/products/crabs-v2-6.PNG'],
    image: '/products/crabs-v2-1.PNG',
    description: 'Яскраві та зручні аксесуари з улюбленими персонажами поні: Пінкі Пай, Флатершай, Рейнбоу Деш та Твайлайт. Надійно тримають волосся, не пошкоджують його та додають образу милого стилю.' 
  },
  { 
    id: 23, 
    name: 'Брелки My Little Pony', 
    category: 'Аксесуари', 
    price: 249, 
    images: ['/products/brelok-1.PNG', '/products/brelok-2.PNG', '/products/brelok-3.PNG', '/products/brelok-4.PNG'],
    image: '/products/brelok-1.PNG',
    description: 'Яскраві та милі аксесуари для ключів, сумок або рюкзаків. У серії доступно наразі 3 варіанти: Епл Джек, Флатершай або Пінкі Пай. Персонажа вказуйте при замовленні.' 
  },
  { 
    id: 24, 
    name: 'Фігурка Пінкі Пай «Party Time» (1 шт)', 
    category: 'Фігурки', 
    price: 249, 
    images: ['/products/pt-1.PNG', '/products/pt-2.PNG', '/products/pt-3.PNG', '/products/pt-4.PNG'],
    image: '/products/pt-1.PNG',
    description: 'Мила колекційна фігурка для фанатів. У серії 9 варіантів, в упаковці потрапляє випадкова (рандомна) модель. Коробки немає, фігурка йде без упаковки.' 
  },
  { 
    id: 25, 
    name: 'Фігурка Пінкі Пай «Party Time» (2 шт)', 
    category: 'Фігурки', 
    price: 399, 
    images: ['/products/pt-1.PNG', '/products/pt-2.PNG', '/products/pt-3.PNG', '/products/pt-4.PNG'],
    image: '/products/pt-1.PNG',
    description: 'Мила колекційна фігурка для фанатів. У серії 9 варіантів, в упаковці потрапляє випадкова (рандомна) модель. Коробки немає, фігурка йде без упаковки. Комплект: 2 фігурки.' 
  },
  { 
    id: 26, 
    name: 'Підвісний постер My Little Pony', 
    category: 'Декор', 
    price: 299, 
    images: ['/products/poster-1.PNG', '/products/poster-2.PNG', '/products/poster-3.PNG'],
    image: '/products/poster-1.PNG',
    description: 'Яскравий елемент декору кімнати для справжніх фанатів. Доступні 6 варіантів із головними героями. Обраний варіант вказувати при замовленні. Також, можливий формат сюрпризу - оберемо рандом постер.' 
  },
];

export default function BoxBuilderPage() {
  const [currentStep, setCurrentStep] = useState(1); // Крок 1: вибір боксу, Крок 2: додавання товарів
  const [selectedBoxType, setSelectedBoxType] = useState<typeof BOX_TYPES[0] | null>(null);
  const [selectedItems, setSelectedItems] = useState<typeof CONSTRUCTOR_ITEMS>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailModal, setDetailModal] = useState<typeof CONSTRUCTOR_ITEMS[0] | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  // Категорії
  const categories = useMemo(() => {
    const cats = new Set(CONSTRUCTOR_ITEMS.map(item => item.category));
    return Array.from(cats).sort();
  }, []);

  // Фільтровані товари
  const filteredItems = useMemo(() => {
    let filtered = [...CONSTRUCTOR_ITEMS];

    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [selectedCategory, searchQuery]);

  // Обчислення вартості
  const calculation = useMemo(() => {
    if (!selectedBoxType) return null;

    const boxPrice = selectedBoxType.price;
    const itemsPrice = selectedItems.reduce((sum, item) => sum + item.price, 0);
    const total = boxPrice + itemsPrice;

    return {
      boxPrice,
      itemsPrice,
      total
    };
  }, [selectedBoxType, selectedItems]);

  const handleToggleItem = (item: typeof CONSTRUCTOR_ITEMS[0]) => {
    if (!selectedBoxType) return;

    const isSelected = selectedItems.some(i => i.id === item.id);

    if (isSelected) {
      setSelectedItems(prev => prev.filter(i => i.id !== item.id));
    } else {
      if (selectedItems.length < selectedBoxType.capacity) {
        setSelectedItems(prev => [...prev, item]);
      }
    }
  };

  const handleAddToCart = () => {
    if (!selectedBoxType || selectedItems.length === 0) return;

    const boxItem = {
      id: `box-${Date.now()}`,
      name: `MLP Бокс розмір ${selectedBoxType.id} (${selectedItems.length} предметів)`,
      price: calculation!.total,
      quantity: 1,
      image: '🎁',
      category: 'Конструктор боксів',
      maxQuantity: 1,
      discount: 0,
      images: [],
      customBox: {
        type: selectedBoxType.id,
        items: selectedItems.map(i => ({ id: i.id, name: i.name }))
      }
    };

    const existingCart = localStorage.getItem('mlp-cart');
    const cart = existingCart ? JSON.parse(existingCart) : [];
    cart.push(boxItem);
    localStorage.setItem('mlp-cart', JSON.stringify(cart));
    
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));

    // Скидаємо вибір
    setCurrentStep(1);
    setSelectedBoxType(null);
    setSelectedItems([]);
    setSelectedCategory(null);
    setSearchQuery('');
  };

  const handleStartBuilding = (box: typeof BOX_TYPES[0]) => {
    setSelectedBoxType(box);
    setCurrentStep(2);
    setSelectedItems([]);
  };

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-white via-purple-50 to-pink-50">
        {/* Хлібні крихти */}
        <nav className="bg-white/80 backdrop-blur-sm border-b border-purple-100" aria-label="Breadcrumb">
          <div className="container mx-auto px-4 py-3 max-w-7xl">
            <ol className="flex items-center gap-2 text-sm text-gray-600">
              <li><a href="/" className="hover:text-purple-600 transition-colors">Головна</a></li>
              <li>/</li>
              <li className="text-gray-900 font-semibold">Конструктор боксів</li>
            </ol>
          </div>
        </nav>

        {/* Заголовок */}
        <section className="relative overflow-hidden py-20 px-4">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
          
          <div className="container mx-auto px-4 max-w-7xl text-center relative z-10">
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              🎁 Конструктор боксів
            </h1>
            <p className="text-xl text-gray-700 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Створіть свій унікальний подарунковий бокс My Little Pony та здивуйте улюблену людину!
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 max-w-7xl py-12">
          {/* Як створити власний бокс - інструкція */}
          {currentStep === 1 && (
            <section className="mb-20">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-3">Як це працює?</h2>
                <div className="h-1 w-24 bg-gradient-to-r from-purple-600 to-pink-500 mx-auto rounded-full"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Крок 1 */}
                <div className="group text-center transform transition-transform hover:scale-105 duration-300">
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-full font-bold text-2xl mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                      1
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Обери коробочку</h3>
                  <p className="text-sm text-gray-600">Вибери розмір, який найбільше підходить для твого подарунка</p>
                </div>

                {/* Крок 2 */}
                <div className="group text-center transform transition-transform hover:scale-105 duration-300">
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-full font-bold text-2xl mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                      2
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Обирай товари</h3>
                  <p className="text-sm text-gray-600">Вибери улюблені предмети з нашого каталогу</p>
                </div>

                {/* Крок 3 */}
                <div className="group text-center transform transition-transform hover:scale-105 duration-300">
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-full font-bold text-2xl mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                      3
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Переглянь підсумок</h3>
                  <p className="text-sm text-gray-600">Перевір обрані товари та загальну вартість</p>
                </div>

                {/* Крок 4 */}
                <div className="group text-center transform transition-transform hover:scale-105 duration-300">
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-full font-bold text-2xl mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                      4
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Оформи замовлення</h3>
                  <p className="text-sm text-gray-600">Додай бокс в кошик та оформи покупку</p>
                </div>

                {/* CTA */}
                <div className="flex flex-col items-center justify-center">
                  <div className="text-6xl mb-4 animate-bounce">🎁</div>
                  <p className="text-sm font-semibold text-purple-600">Почнемо!</p>
                </div>
              </div>
            </section>
          )}

          {/* Крок 1: Вибір боксу */}
          {currentStep === 1 && (
            <section className='pb-24'>
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-3">Виберіть розмір боксу</h2>
                <p className="text-gray-600 text-lg">Кожен розмір розраховано на різну кількість предметів</p>
                <div className="h-1 w-16 bg-gradient-to-r from-purple-600 to-pink-500 mx-auto rounded-full mt-4"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {BOX_TYPES.map((box, index) => (
                  <div
                    key={box.id}
                    className="group relative bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer"
                  >
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-transparent to-pink-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-8 text-center relative z-10">
                      <div className="text-6xl mb-4 transform group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500">🎁</div>
                      <h3 className="text-5xl font-bold text-white mb-2">{box.name}</h3>
                      <p className="text-purple-100 text-sm font-medium">Розмір {index === 0 ? 'S - Маленький' : index === 1 ? 'M - Середній' : 'L - Великий'}</p>
                    </div>
                    <div className="p-8 space-y-5 relative z-10">
                      <p className="text-gray-600 text-center font-medium">{box.description}</p>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-purple-200">
                        <p className="text-xs text-gray-600 mb-2 font-semibold uppercase tracking-wide">Місткість</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{box.capacity}</p>
                        <p className="text-xs text-gray-600 mt-1">предметів у боксі</p>
                      </div>
                      <div className="bg-gray-900 p-6 rounded-2xl">
                        <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Ціна коробки</p>
                        <p className="text-3xl font-bold text-white">{box.price} ₴</p>
                      </div>
                      <button
                        onClick={() => handleStartBuilding(box)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg group-hover:shadow-xl"
                      >
                        Почати збирати →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Крок 2: Додавання товарів */}
          {currentStep === 2 && selectedBoxType && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Сайдбар з категоріями */}
              <aside className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-md p-5 sticky top-4 border border-purple-100">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-lg">📂</span>
                    Категорії
                  </h3>
                  <nav className="space-y-1.5">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        selectedCategory === null
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-700 hover:bg-purple-50'
                      }`}
                    >
                      ✨ Усі категорії
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                          selectedCategory === cat
                            ? 'bg-purple-600 text-white font-medium'
                            : 'text-gray-700 hover:bg-purple-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* Основна частина */}
              <div className="lg:col-span-3">
                <div className="bg-white p-6 rounded-2xl shadow-md mb-6 border border-purple-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">Крок 2: Додайте товари</h2>
                      <p className="text-gray-600 text-sm">Розмір боксу: <span className="font-bold text-purple-600">{selectedBoxType.name}</span></p>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentStep(1);
                        setSelectedItems([]);
                      }}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium hover:bg-purple-50 px-3 py-2 rounded transition-colors"
                    >
                      ← Змінити
                    </button>
                  </div>

                  {/* Пошук */}
                  <input
                    type="text"
                    placeholder="🔍 Пошук..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white transition-all"
                  />

                  {/* Прогрес */}
                  <div className="mt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-700">Заповнено:</span>
                      <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">
                        {selectedItems.length}/{selectedBoxType.capacity}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(selectedItems.length / selectedBoxType.capacity) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Товари */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredItems.map(item => {
                    const isSelected = selectedItems.some(i => i.id === item.id);
                    const isFull = selectedItems.length >= selectedBoxType.capacity;
                    const canSelect = isSelected || !isFull;
                    const hasMultipleImages = Array.isArray(item.images) && item.images.length > 1;
                    const displayImage = hasMultipleImages ? item.images[0] : item.image;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setDetailModal(item);
                          setPhotoIndex(0);
                        }}
                        disabled={!canSelect && !isSelected}
                        className={`p-0 rounded-lg border-2 transition-all duration-200 text-left text-gray-900 cursor-pointer overflow-hidden flex flex-col ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50'
                            : canSelect
                            ? 'border-gray-200 bg-white hover:border-purple-400 hover:shadow-md'
                            : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="relative flex-grow overflow-hidden bg-gray-50">
                          {displayImage ? (
                            <img 
                              src={displayImage} 
                              alt={item.name}
                              className="w-full h-40 object-contain"
                            />
                          ) : (
                            <div className="w-full h-40 flex items-center justify-center text-4xl bg-gray-100">
                              🎁
                            </div>
                          )}
                          {isSelected && (
                            <span className="absolute top-2 right-2 w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                          )}
                          {hasMultipleImages && (
                            <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                              +{item.images.length}
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-gray-900 text-xs mb-1 line-clamp-2">
                            {item.name}
                          </h3>
                          <p className="text-xs text-purple-600 font-medium mb-1">{item.category}</p>
                          <p className="text-base font-bold text-purple-600">{item.price} ₴</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {filteredItems.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-4xl mb-3">🔍</p>
                    <p className="text-gray-600 text-base">Товари не знайдено</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Підсумок */}
        {currentStep === 2 && selectedBoxType && calculation && (
          <div className="mt-10 pb-20 bg-white rounded-2xl shadow-md p-6 md:p-8 border border-purple-100 mx-4 max-w-7xl mx-auto mb-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">📋</span>
              Підсумок замовлення
            </h3>
            
            {/* Інформація про доставку */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <span className="font-bold">ℹ️ Важливо:</span> Бокс готується приблизно <span className="font-bold">2-4 тижні</span> з дати замовлення.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Деталі */}
              <div className="lg:col-span-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Коробка</p>
                      <p className="font-semibold text-gray-900">Розмір {selectedBoxType.name}</p>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{calculation.boxPrice} ₴</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Товари в боксі</p>
                      <p className="font-semibold text-gray-900">{selectedItems.length} з {selectedBoxType.capacity}</p>
                    </div>
                    <span className="text-lg font-bold text-purple-600">{calculation.itemsPrice} ₴</span>
                  </div>
                </div>

                {/* Вибрані товари */}
                {selectedItems.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-900 font-bold mb-3">✨ Вибрані предмети ({selectedItems.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedItems.map(item => (
                        <span key={item.id} className="text-xs font-medium text-gray-900 bg-white px-3 py-1.5 rounded border border-gray-300">
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Разом та кнопки */}
              <div className="flex flex-col gap-3">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                  <p className="text-xs font-semibold opacity-90 mb-2 uppercase">Разом до сплати</p>
                  <p className="text-4xl font-bold mb-4">{calculation.total} ₴</p>
                  <button
                    onClick={handleAddToCart}
                    disabled={selectedItems.length === 0}
                    className={`w-full py-3 px-4 text-sm rounded-lg font-bold transition-all duration-200 ${
                      selectedItems.length > 0
                        ? 'bg-white text-purple-600 hover:bg-gray-100'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {selectedItems.length > 0 ? 'Додати в кошик 🛒' : 'Виберіть товари'}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setSelectedBoxType(null);
                    setSelectedItems([]);
                  }}
                  className="py-3 px-4 text-sm border border-purple-300 rounded-lg font-bold text-gray-900 hover:bg-purple-50 transition-all duration-200"
                >
                  ← Змінити розмір
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модаль з деталями товару */}
        {detailModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold line-clamp-1">{detailModal.name}</h2>
                <button
                  onClick={() => setDetailModal(null)}
                  className="text-white hover:bg-white/20 p-1 rounded transition-colors text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Гортання фото */}
                {Array.isArray(detailModal.images) && detailModal.images.length > 0 && (
                  <div className="space-y-3">
                    <img 
                      src={detailModal.images[photoIndex]} 
                      alt={detailModal.name}
                      className="w-full h-64 object-contain rounded-lg bg-gray-100"
                    />
                    {detailModal.images.length > 1 && (
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => setPhotoIndex(prev => (prev - 1 + detailModal.images!.length) % detailModal.images!.length)}
                          className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-all duration-200 font-medium"
                        >
                          ←
                        </button>
                        <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded">
                          {photoIndex + 1} / {detailModal.images.length}
                        </span>
                        <button
                          onClick={() => setPhotoIndex(prev => (prev + 1) % detailModal.images!.length)}
                          className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-all duration-200 font-medium"
                        >
                          →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Інформація */}
                <div className="space-y-4 border-t pt-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 font-bold uppercase mb-1">Категорія</p>
                      <p className="font-semibold text-gray-900 text-sm bg-gray-50 px-3 py-2 rounded">{detailModal.category}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600 font-bold uppercase mb-1">Ціна</p>
                      <p className="text-2xl font-bold text-purple-600">{detailModal.price} ₴</p>
                    </div>
                  </div>

                  {detailModal.description && (
                    <div>
                      <p className="text-xs text-gray-600 font-bold uppercase mb-2">Опис</p>
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded border border-gray-200">{detailModal.description}</p>
                    </div>
                  )}
                </div>

                {/* Кнопки дії */}
                <div className="space-y-2 pt-4 border-t">
                  {selectedItems.some(i => i.id === detailModal.id) ? (
                    <button
                      onClick={() => {
                        handleToggleItem(detailModal);
                        setDetailModal(null);
                      }}
                      className="w-full py-2.5 px-4 bg-red-600 text-white text-sm rounded-lg font-semibold hover:bg-red-700 transition-all duration-200"
                    >
                      Видалити з боксу
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (selectedItems.length < (selectedBoxType?.capacity || 0)) {
                          handleToggleItem(detailModal);
                          setDetailModal(null);
                        }
                      }}
                      disabled={selectedItems.length >= (selectedBoxType?.capacity || 0)}
                      className="w-full py-2.5 px-4 bg-purple-600 text-white text-sm rounded-lg font-semibold hover:bg-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Додати в бокс
                    </button>
                  )}
                  <button
                    onClick={() => setDetailModal(null)}
                    className="w-full py-2.5 px-4 border border-gray-300 text-gray-900 text-sm rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
                  >
                    Закрити
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Basket />
      <AccountButton />
    </>
  );
}
