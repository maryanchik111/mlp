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
            <p className="text-lg text-white/90">
              Створіть свій унікальний подарунковий бокс My Little Pony!
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 max-w-7xl py-12">
          {/* Як створити власний бокс - інструкція */}
          {currentStep === 1 && (
            <section className="mb-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Як створити власний бокс?</h2>
                <p className="text-gray-600">Це просто! Слідуй кроками нижче</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Крок 1 */}
                <div className="text-center">
                  <div className="mb-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 text-white rounded-full font-bold text-lg mb-4">
                      1
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Обери коробочку</h3>
                  <p className="text-sm text-gray-600">Обери підходящу коробочку, в яку ми все запакуємо</p>
                </div>

                {/* Крок 2 */}
                <div className="text-center">
                  <div className="mb-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 text-white rounded-full font-bold text-lg mb-4">
                      2
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Додай улюблені товари</h3>
                  <p className="text-sm text-gray-600">Додай те, що тобі подобається! В нас ти знайдеш унікальні товари!</p>
                </div>

                {/* Крок 3 */}
                <div className="text-center">
                  <div className="mb-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 text-white rounded-full font-bold text-lg mb-4">
                      3
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Обери потрібні предмети</h3>
                  <p className="text-sm text-gray-600">Додай цікаві аксесуари, картки, фігурки чи декор!</p>
                </div>

                {/* Крок 4 */}
                <div className="text-center">
                  <div className="mb-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 text-white rounded-full font-bold text-lg mb-4">
                      4
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Оформи замовлення</h3>
                  <p className="text-sm text-gray-600">Перейди до кошика та перевірь кількість товарів. Якщо треба їх подвоїти - тисни "+".</p>
                </div>

                {/* CTA */}
                <div className="flex flex-col items-center justify-center">
                  <div className="text-4xl mb-4">🎁</div>
                  <p className="text-sm text-gray-600 mb-4">Почнемо збирати наш бокс!</p>
                </div>
              </div>
            </section>
          )}

          {/* Крок 1: Вибір боксу */}
          {currentStep === 1 && (
            <section>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Крок 1: Виберіть розмір боксу</h2>
                <p className="text-gray-600">Виберіть розмір, який вам подобається</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                {BOX_TYPES.map(box => (
                  <div
                    key={box.id}
                    className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-8 text-center">
                      <div className="text-6xl mb-4">🎁</div>
                      <h3 className="text-4xl font-bold text-white mb-2">{box.name}</h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <p className="text-gray-600 text-center">{box.description}</p>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Місткість</p>
                        <p className="text-2xl font-bold text-purple-600">{box.capacity} предметів</p>
                      </div>
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Ціна коробки</p>
                        <p className="text-2xl font-bold text-gray-900">{box.price} ₴</p>
                      </div>
                      <button
                        onClick={() => handleStartBuilding(box)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg transition-all"
                      >
                        Почати збирати
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
                <div className="bg-white p-6 rounded-lg shadow-sm sticky top-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Категорії</h3>
                  <nav className="space-y-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedCategory === null
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-700 hover:bg-purple-50'
                      }`}
                    >
                      Усі категорії
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
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
                <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Крок 2: Додайте товари</h2>
                      <p className="text-gray-600 mt-1">Розмір боксу: <span className="font-bold">{selectedBoxType.name}</span></p>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentStep(1);
                        setSelectedItems([]);
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      ← Змінити розмір
                    </button>
                  </div>

                  {/* Пошук */}
                  <input
                    type="text"
                    placeholder="🔍 Пошук..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                  />

                  {/* Прогрес */}
                  <div className="mt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Заповнено</span>
                      <span className="text-sm font-semibold text-purple-600">
                        {selectedItems.length}/{selectedBoxType.capacity}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-pink-500 h-2 rounded-full transition-all"
                        style={{ width: `${(selectedItems.length / selectedBoxType.capacity) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Товари */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                        className={`p-0 rounded-lg border-2 transition-all text-left text-gray-900 cursor-pointer overflow-hidden flex flex-col ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50'
                            : canSelect
                            ? 'border-gray-200 bg-white hover:border-purple-300'
                            : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="relative flex-grow overflow-hidden bg-gray-50">
                          {displayImage ? (
                            <img 
                              src={displayImage} 
                              alt={item.name}
                              className="w-full h-48 object-contain"
                            />
                          ) : (
                            <div className="w-full h-48 flex items-center justify-center text-5xl bg-gray-100">
                              🎁
                            </div>
                          )}
                          {isSelected && (
                            <span className="absolute top-2 right-2 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</span>
                          )}
                          {hasMultipleImages && (
                            <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {item.images.length} фото
                            </span>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                            {item.name}
                          </h3>
                          <p className="text-xs text-gray-500 mb-2">{item.category}</p>
                          {item.description && (
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                          )}
                          <p className="text-lg font-bold text-purple-600">{item.price} ₴</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {filteredItems.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-600 text-lg">Товари не знайдено</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Підсумок */}
        {currentStep === 2 && selectedBoxType && calculation && (
          <div className="mt-12 pb-24 bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Підсумок замовлення</h3>
            
            {/* Інформація про доставку */}
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">ℹ️ Важливо:</span> Бокс готується приблизно <span className="font-bold">2-4 тижні</span> з дати замовлення.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Деталі */}
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Коробка</p>
                      <p className="font-semibold text-gray-900">Розмір {selectedBoxType.name}</p>
                    </div>
                    <span className="text-xl font-bold text-gray-900">{calculation.boxPrice} ₴</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Товари в боксі</p>
                      <p className="font-semibold text-gray-900">{selectedItems.length} з {selectedBoxType.capacity} предметів</p>
                    </div>
                    <span className="text-xl font-bold text-purple-600">{calculation.itemsPrice} ₴</span>
                  </div>
                </div>

                {/* Вибрані товари */}
                {selectedItems.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900 font-semibold mb-3">Вибрані предмети:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedItems.map(item => (
                        <span key={item.id} className="text-sm text-gray-900 bg-white px-3 py-1 rounded-full border border-gray-200">
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Разом та кнопки */}
              <div className="flex flex-col gap-4">
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg p-6 text-white">
                  <p className="text-sm font-semibold opacity-90 mb-2">Разом до сплати</p>
                  <p className="text-4xl font-bold mb-4">{calculation.total} ₴</p>
                  <button
                    onClick={handleAddToCart}
                    disabled={selectedItems.length === 0}
                    className={`w-full py-3 px-4 rounded-lg font-bold transition-all ${
                      selectedItems.length > 0
                        ? 'bg-white text-purple-600 hover:bg-gray-100'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Додати в кошик 🛒
                  </button>
                </div>

                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setSelectedBoxType(null);
                    setSelectedItems([]);
                  }}
                  className="py-3 px-4 border-2 border-gray-300 rounded-lg font-bold text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  Змінити розмір
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модаль з деталями товару */}
        {detailModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">{detailModal.name}</h2>
                <button
                  onClick={() => setDetailModal(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Гортання фото */}
                {Array.isArray(detailModal.images) && detailModal.images.length > 0 && (
                  <div className="space-y-3">
                    <img 
                      src={detailModal.images[photoIndex]} 
                      alt={detailModal.name}
                      className="w-full h-80 object-contain rounded-lg"
                    />
                    {detailModal.images.length > 1 && (
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => setPhotoIndex(prev => (prev - 1 + detailModal.images!.length) % detailModal.images!.length)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                        >
                          ← Попередня
                        </button>
                        <span className="text-sm font-semibold text-gray-600">
                          {photoIndex + 1} / {detailModal.images.length}
                        </span>
                        <button
                          onClick={() => setPhotoIndex(prev => (prev + 1) % detailModal.images!.length)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                        >
                          Наступна →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Інформація */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Категорія</p>
                    <p className="font-semibold text-gray-900">{detailModal.category}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ціна</p>
                    <p className="text-3xl font-bold text-purple-600">{detailModal.price} ₴</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Опис</p>
                    <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{detailModal.description}</p>
                  </div>
                </div>

                {/* Кнопки дії */}
                <div className="space-y-2 pt-4 border-t">
                  {selectedItems.some(i => i.id === detailModal.id) ? (
                    <button
                      onClick={() => {
                        handleToggleItem(detailModal);
                        setDetailModal(null);
                      }}
                      className="w-full py-3 px-4 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition"
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
                      className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Додати в бокс
                    </button>
                  )}
                  <button
                    onClick={() => setDetailModal(null)}
                    className="w-full py-3 px-4 border-2 border-gray-300 text-gray-900 rounded-lg font-bold hover:bg-gray-50 transition"
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
