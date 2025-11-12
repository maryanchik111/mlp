'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { database, generateOrderNumber, decreaseProductQuantity, updateUserStatsAfterOrder } from '@/lib/firebase';
import { useAuth } from '@/app/providers';
import { ref, set } from 'firebase/database';

interface CartItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  image: string;
  category: string;
  maxQuantity?: number;
  discount?: number; // Знижка на товар у %
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  deliveryMethod: 'nova';
  paymentMethod: 'card';
  comments: string;
}

export default function CheckoutPage() {
  const { user, profile } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    deliveryMethod: 'nova',
    paymentMethod: 'card',
    comments: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  // Списання балів (1 бал = 1₴, можна змінити логіку пізніше)
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  // Завантаження кошика
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

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Очищаємо помилку для цього поля
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'Введіть ім\'я';
    if (!formData.lastName.trim()) newErrors.lastName = 'Введіть прізвище';
    if (!formData.email.trim()) newErrors.email = 'Введіть email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Невірний формат email';
    if (!formData.phone.trim()) newErrors.phone = 'Введіть номер телефону';
    if (!formData.address.trim()) newErrors.address = 'Введіть адресу';
    if (!formData.city.trim()) newErrors.city = 'Введіть місто';

  // Оплата лише онлайн карткою — якщо за якоїсь причини інше значення, валідуємо
  if (formData.paymentMethod !== 'card') newErrors.paymentMethod = 'Доступна лише оплата онлайн';
  // Доставка лише Нова Пошта
  if (formData.deliveryMethod !== 'nova') newErrors.deliveryMethod = 'Доступна лише доставка Нова Пошта';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Функція для збереження замовлення у Firebase
  const handleSubmitOrder = async () => {
    if (!validateForm()) return;

      // Перевіряємо чи не перевищує кількість товарів максимальну доступну
      const invalidItems = cartItems.filter(item => 
        item.maxQuantity !== undefined && item.quantity > item.maxQuantity
      );
    
      if (invalidItems.length > 0) {
        alert(`❌ Деякі товари перевищують доступну кількість на складі. Будь ласка, перевірте кошик.`);
        return;
      }

    setIsLoading(true);
    try {
      // Генеруємо людський номер замовлення
      const orderId = generateOrderNumber();
      const ordersRef = ref(database, `orders/${orderId}`);
      
      const newOrder = {
        id: orderId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        deliveryMethod: formData.deliveryMethod,
        paymentMethod: formData.paymentMethod,
        comments: formData.comments,
        items: cartItems,
        totalPrice, // сума товарів з урахуванням знижок на товари (до знижки користувача)
        discountPercent: userDiscountPercent,
        discountAmount, // знижка користувача (від рівня/рейтингу)
        discountedSubtotal, // сума після знижки користувача
        deliveryPrice,
        redeemedPoints: appliedRedeemedPoints,
        redeemedAmount: appliedRedeemedPoints,
        finalPrice, // фінальна сума до оплати
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        // Якщо користувач не авторизований — не записуємо undefined (Firebase не приймає undefined)
        // Використовуємо null або прибираємо поле. Тут ставимо null для явності.
        userId: user ? user.uid : null,
      };

      // Зберігаємо замовлення у Firebase
      await set(ordersRef, newOrder);

      // Зменшуємо кількість товарів у базі
      for (const item of cartItems) {
        await decreaseProductQuantity(item.id, item.quantity);
      }

      // Оновлюємо статистику користувача (бали, рейтинг) якщо авторизований
      if (user) {
        await updateUserStatsAfterOrder(user.uid, finalPrice, appliedRedeemedPoints);
      }

      // Очищаємо кошик
      localStorage.removeItem('mlp-cart');
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: [] }));

      // Перенаправляємо на сторінку оплати з параметрами замовлення
      const paymentParams = new URLSearchParams({
        orderId: orderId,
        totalAmount: String(finalPrice),
        customerName: `${formData.firstName} ${formData.lastName}`,
      });
      window.location.href = `/payment?${paymentParams.toString()}`;
    } catch (error) {
      console.error('Помилка при збереженні замовлення:', error);
      alert('❌ Помилка при оформленні замовлення. Спробуйте ще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  // Розрахунки
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  // Розрахунок знижки на кожен товар
  const totalPrice = cartItems.reduce((sum, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    const discount = item.discount ? Number(item.discount) : 0;
    const discounted = discount > 0 ? Math.round(price * (1 - discount / 100)) : price;
    return sum + discounted * item.quantity;
  }, 0);

  const deliveryPrice = 120;

  const userDiscountPercent = profile?.discountPercent ?? 0;
  const discountAmount = Math.round((totalPrice * userDiscountPercent) / 100);
  const discountedSubtotal = totalPrice - discountAmount;
  // Розрахунок списання балів
  const maxRedeemablePoints = profile ? Math.min(profile.points, discountedSubtotal) : 0;
  const appliedRedeemedPoints = usePoints ? Math.min(pointsToRedeem, maxRedeemablePoints) : 0;
  const finalPrice = Math.max(0, discountedSubtotal - appliedRedeemedPoints + deliveryPrice);

  if (!mounted) {
    return null;
  }

  // Якщо кошик порожній
  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">🦄</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Кошик порожній</h1>
            <p className="text-gray-600 mb-6">Поверніться до каталогу, щоб додати товари</p>
            <Link
              href="/catalog"
              className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              ← До каталогу
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Заголовок */}
        <div className="mb-8">
          <Link href="/catalog" className="text-purple-600 hover:text-purple-700 mb-4 inline-block">
            ← Повернутися до каталогу
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Оформлення замовлення</h1>
          <p className="text-gray-600 mt-2">Заповніть форму для оформлення покупки</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основна форма - 2 колони */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              {/* Контактна інформація */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  📋 Контактна інформація
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ім'я *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`text-purple-700 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Ваше ім'я"
                    />
                    {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Прізвище *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`text-purple-700 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Ваше прізвище"
                    />
                    {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`text-purple-700 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="example@mail.com"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`text-purple-700 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="+380 XX XXX XX XX"
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </section>

              {/* Адреса */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  🏠 Адреса доставки
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Адреса *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`text-purple-700 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Вулиця, будинок, квартира"
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Місто *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`text-purple-700 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                        errors.city ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Назва міста"
                    />
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Поштовий індекс</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="text-purple-700 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      placeholder="XX XXX"
                    />
                  </div>
                </div>
              </section>

              {/* Способ доставки */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  🚚 Спосіб доставки
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border border-gray-300 rounded-lg bg-gray-50">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="nova"
                      checked={true}
                      readOnly
                      className="w-4 h-4 text-purple-600"
                    />
                    <div className="ml-3 flex-1">
                      <p className="font-semibold text-gray-900">Нова Пошта — 120₴</p>
                      <p className="text-sm text-gray-600">Доставка у відділення або на адресу. Термін: 1-2 дні.</p>
                    </div>
                  </label>
                </div>
              </section>

              {/* Спосіб оплати */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  💳 Спосіб оплати
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div className="ml-3 flex-1">
                      <p className="font-semibold text-gray-900">Оплата онлайн</p>
                      <p className="text-sm text-gray-600">QR-code, оплата за посиланням, переказ на картку — оплата відбувається одразу при підтвердженні</p>
                    </div>
                  </label>
                </div>
              </section>

              {/* Коментарії */}
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  📝 Додаткові коментарії
                </h2>
                <textarea
                  name="comments"
                  value={formData.comments}
                  onChange={handleInputChange}
                  placeholder="Вкажіть особливі побажання або примітки..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 h-24 resize-none"
                />
              </section>
            </div>
          </div>

          {/* Бічна панель - Заказ */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4 space-y-6">
              <h2 className="text-xl font-bold text-gray-900">📦 Ваше замовлення</h2>

              {/* Список товарів */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cartItems.map(item => {
                  const originalPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
                  const discount = item.discount ? Number(item.discount) : 0;
                  const discountedPrice = discount > 0 ? Math.round(originalPrice * (1 - discount / 100)) : originalPrice;
                  
                  return (
                    <div key={item.id} className="flex justify-between items-start pb-3 border-b border-gray-200">
                      <div>
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Кількість: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        {discount > 0 ? (
                          <>
                            <p className="font-semibold text-purple-600">
                              {discountedPrice * item.quantity}₴
                            </p>
                            <p className="text-xs text-gray-400 line-through">
                              {originalPrice * item.quantity}₴
                            </p>
                          </>
                        ) : (
                          <p className="font-semibold text-purple-600">
                            {originalPrice * item.quantity}₴
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Розрахунки */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-gray-700">
                  <span>Сума товарів:</span>
                  <span className="font-semibold">{totalPrice}₴</span>
                </div>
                {userDiscountPercent > 0 && (
                  <>
                    <div className="flex justify-between items-center text-gray-700">
                      <span>Знижка ({userDiscountPercent}%)</span>
                      <span className="font-semibold text-green-600">−{discountAmount}₴</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-700">
                      <span>Після знижки:</span>
                      <span className="font-semibold">{discountedSubtotal}₴</span>
                    </div>
                  </>
                )}
                {profile && profile.points > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800 space-y-1">
                    <div className="flex justify-between items-center">
                      <span>Ваші бали:</span>
                      <span className="font-semibold">{profile.points}</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={usePoints}
                        onChange={(e) => {
                          setUsePoints(e.target.checked);
                          if (!e.target.checked) setPointsToRedeem(0);
                        }}
                      />
                      <span>Використати бали (1 бал = 1₴)</span>
                    </label>
                    {usePoints && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={maxRedeemablePoints}
                          value={pointsToRedeem}
                          onChange={(e) => setPointsToRedeem(Math.max(0, Math.min(parseInt(e.target.value) || 0, maxRedeemablePoints)))}
                          className="w-24 px-2 py-1 border border-yellow-300 rounded text-xs"
                        />
                        <span className="text-xs text-gray-600">Макс: {maxRedeemablePoints}</span>
                      </div>
                    )}
                    {appliedRedeemedPoints > 0 && (
                      <div className="flex justify-between items-center text-gray-700">
                        <span>Списано балів:</span>
                        <span className="font-semibold text-orange-600">−{appliedRedeemedPoints}₴</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-between items-center text-gray-700">
                  <span>Доставка:</span>
                  <span className="font-semibold text-orange-600">+120₴</span>
                </div>
              </div>

              {/* Сума */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Всього до оплати:</span>
                  <span className="text-2xl font-bold text-purple-600">{finalPrice}₴</span>
                </div>
                {userDiscountPercent > 0 && (
                  <p className="text-xs text-gray-500">Включає вашу знижку {userDiscountPercent}% (рейтинг: {profile?.rating})</p>
                )}
                {appliedRedeemedPoints > 0 && (
                  <p className="text-xs text-gray-500">Списано балів: {appliedRedeemedPoints}. Залишок після оформлення: {profile ? profile.points - appliedRedeemedPoints : 0}</p>
                )}
              </div>

              {/* Кнопки дій */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSubmitOrder}
                  disabled={isLoading}
                  className={`w-full font-bold py-3 rounded-lg transition-all ${
                    isLoading
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg hover:scale-105'
                  }`}
                >
                  {isLoading ? '⏳ Обробка...' : '✓ Оформити замовлення'}
                </button>
                <Link
                  href="/catalog"
                  className="block text-center bg-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ← Продовжити покупки
                </Link>
              </div>

              {/* Інформація */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <p>✓ Ваші дані захищені і не будуть передані третім особам</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
