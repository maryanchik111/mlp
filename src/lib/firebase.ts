import { initializeApp } from 'firebase/app';
import { getDatabase, ref, query, orderByChild, limitToLast, onValue, DatabaseReference, update } from 'firebase/database';

// Firebase конфігурація (замініть своїми значеннями з Firebase Console)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'your-project.firebaseapp.com',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://your-project.firebaseio.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'your-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef123456',
};

// Ініціалізація Firebase
const app = initializeApp(firebaseConfig);

// Отримання посилання на Realtime Database
export const database = getDatabase(app);

// Типи для замовлень
export interface CartItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  image: string;
  category: string;
}

export interface Order {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  deliveryMethod: 'courier' | 'nova';
  paymentMethod: 'card';
  comments: string;
  items: CartItem[];
  totalPrice: number;
  deliveryPrice: number;
  finalPrice: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: number;
  updatedAt: number;
}

// Функція для отримання всіх замовлень
export const fetchAllOrders = (callback: (orders: Order[]) => void) => {
  const ordersRef = ref(database, 'orders');
  const ordersQuery = query(ordersRef, orderByChild('createdAt'), limitToLast(500));

  onValue(ordersQuery, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const orders: Order[] = Object.entries(data)
        .map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        }))
        .reverse(); // Новіші замовлення спочатку
      callback(orders);
    } else {
      callback([]);
    }
  });
};

// Функція для отримання замовлень за статусом
export const fetchOrdersByStatus = (status: string, callback: (orders: Order[]) => void) => {
  const ordersRef = ref(database, 'orders');

  onValue(ordersRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const orders: Order[] = Object.entries(data)
        .map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        }))
        .filter((order) => order.status === status)
        .reverse();
      callback(orders);
    } else {
      callback([]);
    }
  });
};

// Функція для оновлення статусу замовлення
export const updateOrderStatus = async (orderId: string, newStatus: 'pending' | 'processing' | 'completed' | 'cancelled') => {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    await update(orderRef, {
      status: newStatus,
      updatedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('Помилка при оновленні статусу замовлення:', error);
    return false;
  }
};

// Функція для отримання конфігурації платежу (QR, карта, посилання)
export const getPaymentConfig = () => {
  return {
    cardNumber: '4532123456789010', // Mock карта
    cardName: 'My Little Pony Shop',
    paymentLink: 'https://pay.example.com/invoice', // Mock посилання
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://pay.example.com/invoice',
  };
};
