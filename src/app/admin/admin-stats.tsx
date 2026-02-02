import React, { useState } from "react";
import { Product, Order } from "@/lib/firebase";

interface AdminStatsProps {
  orders: Order[];
  products: Product[];
  usersCount?: number;
}

type DateRange = 'all' | 'month' | 'week' | 'day' | 'custom';

export const AdminStats: React.FC<AdminStatsProps> = ({ orders, products, usersCount = 0 }) => {
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  
  // Функція для отримання дати фільтра
  const getFilteredOrders = (range: DateRange): Order[] => {
    const now = Date.now();
    const completedOrders = orders.filter(order => order.status === 'completed');
    
    switch (range) {
      case 'day':
        return completedOrders.filter(order => now - order.createdAt < 24 * 60 * 60 * 1000);
      case 'week':
        return completedOrders.filter(order => now - order.createdAt < 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return completedOrders.filter(order => now - order.createdAt < 30 * 24 * 60 * 60 * 1000);
      case 'custom':
        if (!customStartDate || !customEndDate) return completedOrders;
        const startTime = new Date(customStartDate).getTime();
        const endTime = new Date(customEndDate).getTime() + 24 * 60 * 60 * 1000; // включаємо весь день
        return completedOrders.filter(order => order.createdAt >= startTime && order.createdAt <= endTime);
      case 'all':
      default:
        return completedOrders;
    }
  };
  
  // Фільтруємо тільки виконані замовлення для статистики
  const filteredOrders = getFilteredOrders(dateRange);
  
  // Підрахунок продажів по товарах
  const productSales: Record<number, number> = {};
  let totalSold = 0;
  let totalRevenue = 0; // фінальна виручка (товари + доставка)
  let totalGoodsRevenue = 0; // виручка від товарів (без доставки)
  let totalDeliveryRevenue = 0; // виручка від доставки
  let totalUserDiscounts = 0; // знижки користувачів (від рівня)
  let totalPoints = 0; // списані бали
  let totalProductDiscounts = 0; // знижки на товари
  let totalCostPrice = 0; // загальні витрати на закупки товарів

  filteredOrders.forEach(order => {
    if (!order.items) return;
    
    // Знижка користувача (від рівня/рейтингу)
    const orderUserDiscount = order.discountAmount || 0;
    totalUserDiscounts += orderUserDiscount;
    
    // Списані бали
    const orderPoints = order.redeemedAmount || 0;
    totalPoints += orderPoints;
    
    // Всього надходження (finalPrice включає і товари і доставку)
    const orderFinalPrice = order.finalPrice || 0;
    totalRevenue += orderFinalPrice;
    
    // Підрахунок знижок на товари, витрат та доставки
    order.items.forEach(item => {
      const originalPrice = parseInt(item.price);
      const discount = item.discount ? Number(item.discount) : 0;
      if (discount > 0) {
        const discountAmount = Math.round(originalPrice * (discount / 100)) * item.quantity;
        totalProductDiscounts += discountAmount;
      }
      
      // Додаємо витрати на закупки (якщо у товарі вказана costPrice)
      const product = products.find(p => p.id === item.id);
      if (product && product.costPrice) {
        const costPrice = parseInt(product.costPrice);
        totalCostPrice += costPrice * item.quantity;
      }
      
      // Додаємо виручку від доставки (за кожен товар)
      const itemDeliveryPrice = item.deliveryPrice 
        ? (typeof item.deliveryPrice === 'string' ? parseInt(item.deliveryPrice) : item.deliveryPrice)
        : 120; // Fallback на 120 для старих замовлень
      totalDeliveryRevenue += itemDeliveryPrice;
      
      productSales[item.id] = (productSales[item.id] || 0) + item.quantity;
      totalSold += item.quantity;
    });
  });

  // Виручка від товарів = все надходження - доставка
  totalGoodsRevenue = totalRevenue - totalDeliveryRevenue;

  // Розрахунок прибутку = Виручка від товарів - Витрати на закупки
  // (Доставка не входить у прибуток, оскільки витрати на доставку = виручка від доставки)
  const totalProfit = totalGoodsRevenue - totalCostPrice;

  // Топ-5 товарів
  const topProducts = [...products]
    .filter(p => productSales[p.id])
    .sort((a, b) => (productSales[b.id] || 0) - (productSales[a.id] || 0))
    .slice(0, 5);

  // Найменше купують (bottom-5)
  const bottomProducts = [...products]
    .filter(p => productSales[p.id])
    .sort((a, b) => (productSales[a.id] || 0) - (productSales[b.id] || 0))
    .slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex flex-col gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-900">Статистика продажів</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setDateRange('day')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateRange === 'day'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            День
          </button>
          <button
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateRange === 'week'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Тиждень
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateRange === 'month'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Місяць
          </button>
          <button
            onClick={() => setDateRange('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateRange === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            За весь час
          </button>
          <button
            onClick={() => setDateRange('custom')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateRange === 'custom'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Період
          </button>
        </div>
        
        {/* Інпути для власного діапазону дат */}
        {dateRange === 'custom' && (
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Від</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">До</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
            </div>
            <button
              onClick={() => {
                setCustomStartDate('');
                setCustomEndDate('');
                setDateRange('all');
              }}
              className="px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              Скасувати
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
        <div className="bg-indigo-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Зареєстровані акаунти</p>
          <p className="text-2xl font-bold text-indigo-700">{usersCount}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Всього продано товарів</p>
          <p className="text-2xl font-bold text-purple-700">{totalSold}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Всього надходження (грн)</p>
          <p className="text-2xl font-bold text-slate-700">{totalRevenue}₴</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Оплата за товари (грн)</p>
          <p className="text-2xl font-bold text-green-700">{totalGoodsRevenue}₴</p>
        </div>
        <div className="bg-cyan-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Оплата за доставку (грн)</p>
          <p className="text-2xl font-bold text-cyan-700">{totalDeliveryRevenue}₴</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Списано балів (грн)</p>
          <p className="text-2xl font-bold text-blue-700">{totalPoints}₴</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-pink-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Витрати на закупки (грн)</p>
          <p className="text-2xl font-bold text-pink-700">{totalCostPrice}₴</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Знижки користувачів (грн)</p>
          <p className="text-2xl font-bold text-orange-700">{totalUserDiscounts}₴</p>
        </div>
        <div className={`p-4 rounded-lg ${totalProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className="text-sm text-gray-500 mb-1">Чистий прибуток (грн)</p>
          <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{totalProfit}₴</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Топ-5 товарів</h3>
          <ul className="space-y-2">
            {topProducts.map(p => (
              <li key={p.id} className="flex justify-between items-center">
                <span className="text-purple-600">{p.name}</span>
                <span className="font-bold text-green-700">{productSales[p.id]}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Найменше купують</h3>
          <ul className="space-y-2">
            {bottomProducts.map(p => (
              <li key={p.id} className="flex justify-between items-center">
                <span className="text-purple-600">{p.name}</span>
                <span className="font-bold text-pink-700">{productSales[p.id]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Продано по кожному товару</h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {products.map(p => (
            <li key={p.id} className="flex justify-between items-center bg-gray-50 rounded px-3 py-2">
              <span className="text-purple-600">{p.name}</span>
              <span className="font-bold text-purple-700">{productSales[p.id] || 0}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};