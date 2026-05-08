import { ref, get, set, update, query, orderByChild, limitToLast, equalTo, onValue } from 'firebase/database';
import { database } from './config';
import { Order, CartItem } from './types';
import { generateOrderNumber } from './utils';

// Отримати замовлення за ID
export const fetchOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    const snapshot = await get(orderRef);
    return snapshot.exists() ? (snapshot.val() as Order) : null;
  } catch (error) {
    console.error('Помилка при отриманні замовлення:', error);
    return null;
  }
};

// Створити нове замовлення
export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  try {
    const orderId = await generateOrderNumber();
    const orderRef = ref(database, `orders/${orderId}`);
    const now = Date.now();

    const newOrder: Order = {
      ...orderData,
      id: orderId,
      createdAt: now,
      updatedAt: now,
    };

    await set(orderRef, newOrder);
    return orderId;
  } catch (error) {
    console.error('Помилка при створенні замовлення:', error);
    return null;
  }
};

// Отримати всі замовлення (для адміна)
export const fetchAllOrders = async (): Promise<Order[]> => {
  try {
    const ordersRef = ref(database, 'orders');
    const snapshot = await get(ordersRef);
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.values(data) as Order[];
  } catch (error) {
    console.error('Помилка при отриманні всіх замовлень:', error);
    return [];
  }
};

// Оновити статус замовлення
export const updateOrderStatus = async (orderId: string, status: Order['status'], trackingNumber?: string) => {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    const updates: any = { status, updatedAt: Date.now() };
    if (trackingNumber) updates.trackingNumber = trackingNumber;
    await update(orderRef, updates);
    return true;
  } catch (error) {
    console.error('Помилка при оновленні статусу замовлення:', error);
    return false;
  }
};

// Отримати замовлення користувача
export const fetchUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const ordersRef = ref(database, 'orders');
    const userOrdersQuery = query(ordersRef, orderByChild('userId'), equalTo(userId));
    const snapshot = await get(userOrdersQuery);
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.values(data) as Order[];
  } catch (error) {
    console.error('Помилка при отриманні замовлень користувача:', error);
    return [];
  }
};

// Отримати замовлення за статусом (realtime callback)
export const fetchOrdersByStatus = (status: Order['status'], callback: (orders: Order[]) => void) => {
  const ordersRef = query(ref(database, 'orders'), orderByChild('status'), equalTo(status));
  return onValue(ordersRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const orders = Object.values(data) as Order[];
      callback(orders);
    } else {
      callback([]);
    }
  });
};
export const fetchOrderStatus = async (orderId: string): Promise<Order['status'] | null> => {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    const snapshot = await get(orderRef);
    if (!snapshot.exists()) return null;
    return snapshot.val().status;
  } catch (error) {
    console.error('Помилка отримання статусу замовлення:', error);
    return null;
  }
};
