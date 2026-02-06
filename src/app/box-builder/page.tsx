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
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-300/20 to-purple-300/20 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '6s' }}></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-300/20 to-indigo-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-200/10 to-purple-200/10 rounded-full blur-3xl animate-spin" style={{ animationDuration: '20s' }}></div>
        </div>

        {/* Enhanced Breadcrumbs */}
        <nav className="bg-white/90 backdrop-blur-lg border-b border-purple-200/50 shadow-sm" aria-label="Breadcrumb">
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <ol className="flex items-center gap-3 text-sm">
              <li>
                <a href="/" className="flex items-center gap-1 text-gray-600 hover:text-purple-700 transition-all duration-200 hover:scale-105">
                  <span>🏠</span>
                  Головна
                </a>
              </li>
              <li className="text-gray-400">→</li>
              <li className="text-purple-700 font-semibold flex items-center gap-1">
                <span>🎁</span>
                Конструктор боксів
              </li>
            </ol>
          </div>
        </nav>

        {/* Enhanced Header */}
        <section className="relative py-24 px-4">
          <div className="container mx-auto px-4 max-w-7xl text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600/10 to-pink-600/10 px-4 py-2 rounded-full border border-purple-200/50 mb-6 animate-in fade-in slide-in-from-top duration-700">
              <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-purple-700">Новинка</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 leading-tight">
              🎁 Конструктор Magic Box
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
              Створіть <span className="font-bold text-purple-600">унікальний подарунок</span> для своїх улюблених! 
              Оберіть розмір та наповніть бокс магічними речами My Little Pony ✨
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full border border-purple-200/50">
                <span>⚡</span>
                <span>Швидка доставка</span>
              </div>
              <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full border border-purple-200/50">
                <span>🎨</span>
                <span>Персоналізація</span>
              </div>
              <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full border border-purple-200/50">
                <span>💝</span>
                <span>Упаковка в подарунок</span>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 max-w-7xl py-16">
          {/* Enhanced How It Works Section */}
          {currentStep === 1 && (
            <section className="mb-24">
              <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  ✨ Як створити 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"> Magic Box</span>?
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
                  Всього чотири простих кроки відділяють вас від ідеального подарунка
                </p>
                <div className="h-1 w-32 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-500 mx-auto rounded-full"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {/* Крок 1 - Enhanced */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl transform group-hover:scale-105 transition-transform duration-500"></div>
                  <div className="relative bg-white/80 backdrop-blur-sm border border-purple-200/50 rounded-3xl p-8 text-center transform transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                    <div className="mb-8">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-full font-bold text-3xl mb-6 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-500 relative">
                        1
                        <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Обери розмір</h3>
                    <p className="text-gray-600 leading-relaxed">Вибери ідеальний розмір коробочки для твого подарунка - від компактного до великого</p>
                    <div className="mt-6 text-4xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">📦</div>
                  </div>
                </div>

                {/* Крок 2 - Enhanced */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-3xl transform group-hover:scale-105 transition-transform duration-500"></div>
                  <div className="relative bg-white/80 backdrop-blur-sm border border-purple-200/50 rounded-3xl p-8 text-center transform transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                    <div className="mb-8">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-700 text-white rounded-full font-bold text-3xl mb-6 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-500 relative">
                        2
                        <div className="absolute -inset-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Обирай товари</h3>
                    <p className="text-gray-600 leading-relaxed">Наповни бокс улюбленими предметами: фігурками, картками, аксесуарами та декором</p>
                    <div className="mt-6 text-4xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">🛍️</div>
                  </div>
                </div>

                {/* Крок 3 - Enhanced */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl transform group-hover:scale-105 transition-transform duration-500"></div>
                  <div className="relative bg-white/80 backdrop-blur-sm border border-purple-200/50 rounded-3xl p-8 text-center transform transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                    <div className="mb-8">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-full font-bold text-3xl mb-6 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-500 relative">
                        3
                        <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Перевір все</h3>
                    <p className="text-gray-600 leading-relaxed">Переглянь підсумок: обрані товари, загальну вартість та деталі замовлення</p>
                    <div className="mt-6 text-4xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">✅</div>
                  </div>
                </div>

                {/* Крок 4 - Enhanced */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl transform group-hover:scale-105 transition-transform duration-500"></div>
                  <div className="relative bg-white/80 backdrop-blur-sm border border-purple-200/50 rounded-3xl p-8 text-center transform transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                    <div className="mb-8">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full font-bold text-3xl mb-6 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-500 relative">
                        4
                        <div className="absolute -inset-2 bg-gradient-to-r from-green-500 to-pink-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Оформи замовлення</h3>
                    <p className="text-gray-600 leading-relaxed">Додай Magic Box до кошика та оформи покупку для швидкої доставки</p>
                    <div className="mt-6 text-4xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">🚀</div>
                  </div>
                </div>
              </div>

              {/* Enhanced CTA Section */}
              <div className="text-center">
                <div className="inline-flex flex-col items-center justify-center p-8 bg-gradient-to-br from-purple-600/10 to-pink-600/10 backdrop-blur-sm border border-purple-200/50 rounded-3xl max-w-md mx-auto transform hover:scale-105 transition-all duration-500">
                  <div className="text-8xl mb-4 animate-bounce">🎁</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Готові розпочати?</h3>
                  <p className="text-purple-600 font-semibold mb-4">Створимо магію разом!</p>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Enhanced Box Selection */}
          {currentStep === 1 && (
            <section className='pb-24'>
              <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Оберіть свій  
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"> Magic Box</span>
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-6">
                  Ефективність кращий підхід - кожен розмір розраховано на оптимальну кількість товарів
                </p>
                <div className="h-1 w-20 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-500 mx-auto rounded-full"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
                {BOX_TYPES.map((box, index) => (
                  <div
                    key={box.id}
                    className="group relative bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-4 cursor-pointer border border-purple-200/50"
                  >
                    {/* Enhanced background effects */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-700"
                         style={{
                           background: index === 0 ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' :
                                      index === 1 ? 'linear-gradient(135deg, #EC4899, #F59E0B)' :
                                      'linear-gradient(135deg, #F59E0B, #10B981)'
                         }}>
                    </div>
                    
                    {/* Popular badge for middle option */}
                    {index === 1 && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-2 rounded-full text-xs font-bold shadow-xl">
                          ⭐ ПОПУЛЯРНИЙ
                        </div>
                      </div>
                    )}
                    
                    {/* Header with enhanced gradients */}
                    <div className="relative z-10 p-10 text-center"
                         style={{
                           background: index === 0 ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' :
                                      index === 1 ? 'linear-gradient(135deg, #EC4899, #F59E0B)' :
                                      'linear-gradient(135deg, #F59E0B, #10B981)'
                         }}>
                      <div className="text-7xl mb-6 transform group-hover:scale-125 group-hover:rotate-12 transition-transform duration-700 filter drop-shadow-lg">
                        {index === 0 ? '📦' : index === 1 ? '🎁' : '🏆'}
                      </div>
                      <h3 className="text-6xl font-black text-white mb-3 filter drop-shadow-md">{box.name}</h3>
                      <p className="text-white/90 text-base font-semibold">
                        {index === 0 ? 'Компактний' : index === 1 ? 'Оптимальний' : 'Максимальний'}
                      </p>
                      <p className="text-white/70 text-sm mt-2">{box.description}</p>
                    </div>

                    {/* Enhanced content */}
                    <div className="p-8 space-y-6 relative z-10">
                      {/* Features list */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-gray-700">
                          <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</div>
                          <span>До {box.capacity} товарів</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-700">
                          <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</div>
                          <span>Красива упаковка</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-700">
                          <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</div>
                          <span>{index === 0 ? 'Швидка доставка' : index === 1 ? 'Безкоштовні стікери' : 'Ексклюзивний декор'}</span>
                        </div>
                      </div>

                      {/* Enhanced capacity display */}
                      <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-purple-200/50 overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-xl"></div>
                        <div className="relative">
                          <p className="text-xs text-gray-600 mb-2 font-bold uppercase tracking-wider">Місткість Magic Box</p>
                          <div className="flex items-center gap-3">
                            <p className="text-5xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{box.capacity}</p>
                            <div>
                              <p className="text-sm text-gray-700 font-semibold">предметів</p>
                              <p className="text-xs text-gray-500">в одному боксі</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced price */}
                      <div className="bg-gray-900 p-6 rounded-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-pink-900/20"></div>
                        <div className="relative">
                          <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wider">Ціна коробки</p>
                          <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-black text-white">{box.price}</p>
                            <p className="text-xl text-gray-300">₴</p>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">+ вартість товарів</p>
                        </div>
                      </div>

                      {/* Enhanced button */}
                      <button
                        onClick={() => handleStartBuilding(box)}
                        className="w-full relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-xl group-hover:shadow-2xl group"
                      >
                        <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                        <span className="relative flex items-center justify-center gap-2">
                          <span>Почати створення</span>
                          <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced info section */}
              <div className="mt-20 text-center">
                <div className="inline-flex items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-6 max-w-2xl mx-auto">
                  <div className="text-3xl">💡</div>
                  <div className="text-left">
                    <p className="font-bold text-amber-900 mb-1">Порада від експертів</p>
                    <p className="text-sm text-amber-800">
                      Розмір M найкраще підходить для подарунка дитині 6-12 років, включає все необхідне для гри та колекціонування
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Enhanced Step 2: Product Selection */}
          {currentStep === 2 && selectedBoxType && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
              {/* Enhanced Sidebar */}
              <aside className="lg:col-span-1">
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-6 sticky top-4 border border-purple-200/50">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">📁</span>
                    </div>
                    <span>Категорії товарів</span>
                  </h3>
                  
                  <nav className="space-y-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-3 ${
                        selectedCategory === null
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                      }`}
                    >
                      <span className="text-lg">✨</span>
                      <span>Усі категорії</span>
                      <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded-full">
                        {CONSTRUCTOR_ITEMS.length}
                      </span>
                    </button>
                    
                    {categories.map(cat => {
                      const itemCount = CONSTRUCTOR_ITEMS.filter(item => item.category === cat).length;
                      const emoji = cat === 'Фігурки' ? '🦄' : 
                                   cat === 'Картки' ? '🃏' : 
                                   cat === 'Аксесуари' ? '👑' : 
                                   cat === 'Декор' ? '🎨' : '🎁';
                      
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-300 flex items-center gap-3 ${
                            selectedCategory === cat
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg'
                              : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                          }`}
                        >
                          <span className="text-lg">{emoji}</span>
                          <span>{cat}</span>
                          <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded-full">
                            {itemCount}
                          </span>
                        </button>
                      );
                    })}
                  </nav>

                  {/* Enhanced progress in sidebar */}
                  <div className="mt-8 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200/50">
                    <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span>📦</span>
                      Ваш Magic Box
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Заповнено:</span>
                        <span className="font-bold text-purple-600">
                          {selectedItems.length}/{selectedBoxType.capacity}
                        </span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-700 relative"
                          style={{ width: `${(selectedItems.length / selectedBoxType.capacity) * 100}%` }}
                        >
                          <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                        </div>
                      </div>
                      {selectedItems.length === selectedBoxType.capacity && (
                        <p className="text-xs text-green-700 font-semibold flex items-center gap-1">
                          <span>✅</span>
                          Бокс заповнено!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </aside>

              {/* Enhanced Main Content */}
              <div className="lg:col-span-3">
                <div className="bg-white/80 backdrop-blur-lg p-6 rounded-3xl shadow-xl mb-8 border border-purple-200/50">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-3">
                        <span className="text-xl">🛍️</span>
                        Крок 2: Оберіть товари
                      </h2>
                      <div className="flex flex-col sm:flex-row gap-3 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          Розмір боксу: <span className="font-bold text-purple-600">{selectedBoxType.name}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                          Місткість: <span className="font-bold text-pink-600">{selectedBoxType.capacity} предметів</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentStep(1);
                        setSelectedItems([]);
                      }}
                      className="flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm font-semibold hover:bg-purple-50 px-4 py-2 rounded-xl transition-all duration-300 border border-purple-200 hover:border-purple-300"
                    >
                      <span>←</span>
                      <span>Змінити розмір</span>
                    </button>
                  </div>

                  {/* Enhanced Search */}
                  <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-lg">🔍</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Пошук магічних товарів..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 text-gray-900 bg-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 placeholder-gray-400"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filter info */}
                  <div className="flex items-center gap-4 mb-4">
                    <p className="text-sm text-gray-600">
                      Показано <span className="font-bold text-purple-600">{filteredItems.length}</span> товарів
                      {selectedCategory && <> в категорії "<span className="font-semibold">{selectedCategory}</span>"</>}
                    </p>
                    {(selectedCategory || searchQuery) && (
                      <button
                        onClick={() => {
                          setSelectedCategory(null);
                          setSearchQuery('');
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                      >
                        Скинути фільтри
                      </button>
                    )}
                  </div>
                </div>

                {/* Enhanced Product Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
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
                        className={`group p-0 rounded-2xl border-2 transition-all duration-300 text-left text-gray-900 cursor-pointer overflow-hidden flex flex-col transform hover:scale-105 ${
                          isSelected
                            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl'
                            : canSelect
                            ? 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-lg'
                            : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="relative flex-grow overflow-hidden bg-gray-50/50">
                          {displayImage ? (
                            <img 
                              src={displayImage} 
                              alt={item.name}
                              className="w-full h-36 object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-36 flex items-center justify-center text-4xl bg-gray-100 group-hover:scale-110 transition-transform duration-500">
                              🎁
                            </div>
                          )}
                          
                          {isSelected && (
                            <div className="absolute top-3 right-3 w-7 h-7 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg animate-bounce">
                              ✓
                            </div>
                          )}
                          
                          {hasMultipleImages && (
                            <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              📷 {item.images.length}
                            </div>
                          )}
                          
                          {!canSelect && !isSelected && (
                            <div className="absolute inset-0 bg-gray-900/20 flex items-center justify-center">
                              <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                Бокс заповнений
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 flex-1">
                              {item.name}
                            </h3>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                              {item.category}
                            </span>
                            <span className="text-base font-bold text-purple-600">{item.price} ₴</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Enhanced Empty State */}
                {filteredItems.length === 0 && (
                  <div className="text-center py-20">
                    <div className="text-8xl mb-6 opacity-50">🔍</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Товари не знайдено</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Спробуйте змінити пошуковий запит або оберіть іншу категорію
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCategory(null);
                        setSearchQuery('');
                      }}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                    >
                      Показати всі товари
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Summary Section */}
        {currentStep === 2 && selectedBoxType && calculation && (
          <div className="mt-16 pb-24">
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-10 border border-purple-200/50 mx-4 max-w-7xl mx-auto relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-200/20 to-purple-200/20 rounded-full blur-2xl"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl">📋</span>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">Підсумок вашого Magic Box</h3>
                    <p className="text-gray-600 mt-1">Перевірте деталі перед додаванням до кошика</p>
                  </div>
                </div>
                
                {/* Enhanced Delivery Info */}
                <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200/50 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/30 rounded-full blur-xl"></div>
                  <div className="relative flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm">⏱️</span>
                    </div>
                    <div>
                      <p className="font-bold text-blue-900 mb-2">Час виготовлення Magic Box</p>
                      <p className="text-blue-800 leading-relaxed">
                        Ваш унікальний бокс буде ретельно зібрано та запаковано протягом 
                        <span className="font-bold mx-1">2-4 тижнів</span> 
                        після оформлення замовлення. Кожен Magic Box створюється індивідуально! ✨
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Enhanced Details */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Box details */}
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200/50 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-purple-200/30 rounded-full blur-xl"></div>
                      <div className="relative flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
                          📦
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-semibold uppercase tracking-wide">Magic Box</p>
                          <p className="font-bold text-gray-900 text-lg">Розмір {selectedBoxType.name}</p>
                          <p className="text-sm text-gray-600">Місткість: {selectedBoxType.capacity} товарів</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{calculation.boxPrice} ₴</p>
                        <p className="text-sm text-gray-500">коробка</p>
                      </div>
                    </div>

                    {/* Items details */}
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl border-2 border-pink-200/50 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-pink-200/30 rounded-full blur-xl"></div>
                      <div className="relative flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
                          🎁
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-semibold uppercase tracking-wide">Магічні товари</p>
                          <p className="font-bold text-gray-900 text-lg">{selectedItems.length} з {selectedBoxType.capacity} обрано</p>
                          <p className="text-sm text-gray-600">
                            {selectedItems.length === selectedBoxType.capacity ? 'Бокс заповнено!' : `Ще ${selectedBoxType.capacity - selectedItems.length} до заповнення`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-pink-600">{calculation.itemsPrice} ₴</p>
                        <p className="text-sm text-gray-500">товари</p>
                      </div>
                    </div>

                    {/* Enhanced Selected Items */}
                    {selectedItems.length > 0 && (
                      <div className="p-6 bg-gray-50/80 rounded-2xl border border-gray-200/50">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✨</span>
                          </div>
                          <p className="font-bold text-gray-900">Обрані товари ({selectedItems.length})</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedItems.map((item, index) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.category} • {item.price} ₴</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Action Panel */}
                  <div className="flex flex-col gap-4">
                    {/* Total */}
                    <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                      
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-2xl">💎</span>
                          <p className="text-sm font-semibold opacity-90 uppercase tracking-wide">Всього до сплати</p>
                        </div>
                        
                        <div className="mb-6">
                          <p className="text-5xl font-black mb-2">{calculation.total}</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold">₴</span>
                            <span className="text-sm opacity-75">українських гривень</span>
                          </div>
                        </div>

                        <button
                          onClick={handleAddToCart}
                          disabled={selectedItems.length === 0}
                          className={`w-full py-4 px-6 rounded-2xl font-bold transition-all duration-300 text-lg relative overflow-hidden ${
                            selectedItems.length > 0
                              ? 'bg-white text-purple-600 hover:bg-gray-100 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            {selectedItems.length > 0 ? (
                              <>
                                <span>Додати Magic Box до кошика</span>
                                <span className="text-2xl">🛒</span>
                              </>
                            ) : (
                              <>
                                <span>Спочатку оберіть товари</span>
                                <span className="text-2xl">⚠️</span>
                              </>
                            )}
                          </span>
                          {selectedItems.length > 0 && (
                            <div className="absolute inset-0 bg-purple-600/10 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Secondary actions */}
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setCurrentStep(1);
                          setSelectedBoxType(null);
                          setSelectedItems([]);
                        }}
                        className="w-full py-3 px-6 text-sm border-2 border-purple-300 rounded-2xl font-semibold text-gray-900 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <span>←</span>
                        <span>Змінити розмір боксу</span>
                      </button>

                      {selectedItems.length > 0 && selectedItems.length < selectedBoxType.capacity && (
                        <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-amber-600">💡</span>
                            <p className="text-sm font-semibold text-amber-800">Підказка</p>
                          </div>
                          <p className="text-xs text-amber-700">
                            Ви можете додати ще {selectedBoxType.capacity - selectedItems.length} товар(ів). 
                            Заповнений бокс дає найкращий досвід!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Product Detail Modal */}
        {detailModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-500 border border-purple-200/50">
              {/* Enhanced Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white p-6 flex items-center justify-between z-10 rounded-t-3xl">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold line-clamp-2 mb-1">{detailModal.name}</h2>
                  <div className="flex items-center gap-4 text-sm opacity-90">
                    <span className="flex items-center gap-1">
                      <span>🏷️</span>
                      {detailModal.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <span>💰</span>
                      {detailModal.price} ₴
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setDetailModal(null)}
                  className="ml-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Enhanced Image Gallery */}
                {Array.isArray(detailModal.images) && detailModal.images.length > 0 && (
                  <div className="space-y-6">
                    <div className="relative bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl overflow-hidden border-2 border-purple-200/30">
                      <img 
                        src={detailModal.images[photoIndex]} 
                        alt={detailModal.name}
                        className="w-full h-80 object-contain p-4"
                      />
                      
                      {/* Image counter overlay */}
                      {detailModal.images.length > 1 && (
                        <div className="absolute top-4 right-4 bg-black/70 text-white text-sm px-3 py-2 rounded-full backdrop-blur-sm">
                          {photoIndex + 1} / {detailModal.images.length}
                        </div>
                      )}
                    </div>
                    
                    {/* Enhanced Navigation */}
                    {detailModal.images.length > 1 && (
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => setPhotoIndex(prev => (prev - 1 + detailModal.images!.length) % detailModal.images!.length)}
                          className="px-5 py-3 bg-purple-600 text-white text-base font-semibold rounded-xl hover:bg-purple-700 transition-all duration-300 shadow-lg hover:scale-105"
                        >
                          ← Попереднє
                        </button>
                        
                        {/* Dots indicator */}
                        <div className="flex gap-2">
                          {detailModal.images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setPhotoIndex(index)}
                              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                index === photoIndex 
                                  ? 'bg-purple-600 scale-125' 
                                  : 'bg-gray-300 hover:bg-purple-400'
                              }`}
                            />
                          ))}
                        </div>
                        
                        <button
                          onClick={() => setPhotoIndex(prev => (prev + 1) % detailModal.images!.length)}
                          className="px-5 py-3 bg-pink-600 text-white text-base font-semibold rounded-xl hover:bg-pink-700 transition-all duration-300 shadow-lg hover:scale-105"
                        >
                          Наступне →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Enhanced Product Info */}
                <div className="space-y-6 border-t-2 border-gray-100 pt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200/50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">🏷️</span>
                        </div>
                        <p className="font-bold text-gray-900 uppercase tracking-wide text-sm">Категорія</p>
                      </div>
                      <p className="text-xl font-bold text-purple-700">{detailModal.category}</p>
                    </div>

                    {/* Price */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200/50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">💰</span>
                        </div>
                        <p className="font-bold text-gray-900 uppercase tracking-wide text-sm">Ціна</p>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-green-700">{detailModal.price}</p>
                        <p className="text-xl text-green-600">₴</p>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Description */}
                  {detailModal.description && (
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200/50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">📝</span>
                        </div>
                        <p className="font-bold text-gray-900 uppercase tracking-wide text-sm">Детальний опис</p>
                      </div>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{detailModal.description}</p>
                    </div>
                  )}
                </div>

                {/* Enhanced Action Buttons */}
                <div className="space-y-4 pt-6 border-t-2 border-gray-100">
                  {selectedItems.some(i => i.id === detailModal.id) ? (
                    <button
                      onClick={() => {
                        handleToggleItem(detailModal);
                        setDetailModal(null);
                      }}
                      className="w-full py-4 px-6 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-2xl hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-3 text-lg"
                    >
                      <span className="text-2xl">🗑️</span>
                      <span>Видалити з Magic Box</span>
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
                      className={`w-full py-4 px-6 font-bold rounded-2xl transition-all duration-300 transform ${
                        selectedItems.length < (selectedBoxType?.capacity || 0)
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:scale-105 active:scale-95 shadow-lg'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      } flex items-center justify-center gap-3 text-lg`}
                    >
                      <span className="text-2xl">
                        {selectedItems.length >= (selectedBoxType?.capacity || 0) ? '⚠️' : '✨'}
                      </span>
                      <span>
                        {selectedItems.length >= (selectedBoxType?.capacity || 0) 
                          ? 'Magic Box заповнений' 
                          : 'Додати до Magic Box'
                        }
                      </span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setDetailModal(null)}
                    className="w-full py-4 px-6 border-2 border-gray-300 text-gray-900 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 flex items-center justify-center gap-3"
                  >
                    <span>←</span>
                    <span>Повернутися до вибору</span>
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
