import React from "react";
import { Product, Order } from "@/lib/firebase";

interface AdminStatsProps {
  orders: Order[];
  products: Product[];
  usersCount?: number;
}

export const AdminStats: React.FC<AdminStatsProps> = ({ orders, products, usersCount = 0 }) => {
  // Фільтруємо тільки виконані замовлення для статистики
  const completedOrders = orders.filter(order => order.status === 'completed');
  
  // Підрахунок продажів по товарах
  const productSales: Record<number, number> = {};
  let totalSold = 0;
  let totalRevenue = 0; // фінальна сума (після всіх знижок)
  let totalUserDiscounts = 0; // знижки користувачів (від рівня)
  let totalPoints = 0; // списані бали
  let totalProductDiscounts = 0; // знижки на товари

  completedOrders.forEach(order => {
    if (!order.items) return;
    
    // Знижка користувача (від рівня/рейтингу)
    const orderUserDiscount = order.discountAmount || 0;
    totalUserDiscounts += orderUserDiscount;
    
    // Списані бали
    const orderPoints = order.redeemedAmount || 0;
    totalPoints += orderPoints;
    
    // Фінальна виручка (після всіх знижок)
    const orderRevenue = order.finalPrice || 0;
    totalRevenue += orderRevenue;
    
    // Підрахунок знижок на товари
    order.items.forEach(item => {
      const originalPrice = parseInt(item.price);
      const discount = item.discount ? Number(item.discount) : 0;
      if (discount > 0) {
        const discountAmount = Math.round(originalPrice * (discount / 100)) * item.quantity;
        totalProductDiscounts += discountAmount;
      }
      
      productSales[item.id] = (productSales[item.id] || 0) + item.quantity;
      totalSold += item.quantity;
    });
  });

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
      <h2 className="text-xl font-bold text-gray-900 mb-4">Статистика продажів</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <div className="bg-indigo-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Зареєстровані акаунти</p>
          <p className="text-2xl font-bold text-indigo-700">{usersCount}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Всього продано товарів</p>
          <p className="text-2xl font-bold text-purple-700">{totalSold}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Виручка (грн)</p>
          <p className="text-2xl font-bold text-green-700">{totalRevenue}₴</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Списано балів (грн)</p>
          <p className="text-2xl font-bold text-blue-700">{totalPoints}₴</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Знижки користувачів (грн)</p>
          <p className="text-2xl font-bold text-orange-700">{totalUserDiscounts}₴</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-pink-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Знижки на товари (грн)</p>
          <p className="text-2xl font-bold text-pink-700">{totalProductDiscounts}₴</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Загальні знижки та списання</p>
          <p className="text-2xl font-bold text-red-700">{totalProductDiscounts + totalUserDiscounts + totalPoints}₴</p>
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