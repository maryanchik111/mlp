import { initializeApp } from 'firebase/app';
import { getDatabase, ref, query, orderByChild, limitToLast, onValue, DatabaseReference, update, get, push, set } from 'firebase/database';

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
  maxQuantity?: number;
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

// Тип для товару
export interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  image: string;
  description: string;
  inStock: boolean;
  quantity: number;
  images?: string[]; // масив URL або emoji для сторінки товару
}

// Функція для отримання всіх товарів з Firebase
export const fetchAllProducts = async (callback: (products: Product[]) => void) => {
  try {
    const productsRef = ref(database, 'products');
    
    onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Якщо це об'єкт з ключами, перетворіть його в масив
        if (typeof data === 'object' && !Array.isArray(data)) {
          const products: Product[] = Object.values(data) as Product[];
          callback(products);
        } else if (Array.isArray(data)) {
          // Якщо це вже масив, використайте як є
          callback(data);
        } else {
          callback([]);
        }
      } else {
        callback([]);
      }
    });
  } catch (error) {
    console.error('Помилка при завантаженні товарів:', error);
    callback([]);
  }
};

// Функція для отримання конфігурації платежу (QR, карта, посилання)
export const getPaymentConfig = () => {
  return {
    cardNumber: '4441 1111 4322 2457', // Mock карта
    cardName: 'Богдана Мусевич',
    paymentLink: 'https://pay.example.com/invoice', // Mock посилання
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://pay.example.com/invoice',
  };
};

// Функція для генерації людського номеру замовлення (наприклад: NW4343)
export const generateOrderNumber = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetter1 = letters[Math.floor(Math.random() * letters.length)];
  const randomLetter2 = letters[Math.floor(Math.random() * letters.length)];
  const randomNumbers = Math.floor(1000 + Math.random() * 9000); // 4-значне число від 1000 до 9999
  return `${randomLetter1}${randomLetter2}${randomNumbers}`;
};

// Функція для оновлення товару (ціна, назва, опис, кількість)
export const updateProduct = async (productId: number, updates: Partial<Product>) => {
  try {
    const productRef = ref(database, `products/${productId - 1}`); // Індекс масиву = id - 1
    await update(productRef, updates);
    return true;
  } catch (error) {
    console.error('Помилка при оновленні товару:', error);
    return false;
  }
};

// Функція для зменшення кількості товару після покупки
export const decreaseProductQuantity = async (productId: number, quantityToDecrease: number) => {
  try {
    const productRef = ref(database, `products/${productId - 1}`);
    const snapshot = await get(productRef);
    
    if (snapshot.exists()) {
      const product = snapshot.val() as Product;
      const newQuantity = Math.max(0, product.quantity - quantityToDecrease);
      
      await update(productRef, {
        quantity: newQuantity,
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Помилка при зменшенні кількості товару:', error);
    return false;
  }
};

// Отримати один товар за id
export const fetchProductById = async (id: number): Promise<Product | null> => {
  try {
    const productRef = ref(database, `products/${id - 1}`); // масивна структура
    const snapshot = await get(productRef);
    if (snapshot.exists()) {
      const product = snapshot.val() as Product;
      return product;
    }
    return null;
  } catch (error) {
    console.error('Помилка отримання товару:', error);
    return null;
  }
};

// Функція для отримання статусу замовлення за ID
export const fetchOrderStatus = async (orderId: string): Promise<string | null> => {
  try {
    const orderRef = ref(database, `orders/${orderId}/status`);
    const snapshot = await get(orderRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error('Помилка отримання статусу замовлення:', error);
    return null;
  }
};
