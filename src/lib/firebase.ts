// Telegram ID адміну для сповіщень
const ADMIN_TELEGRAM_ID = "7365171162";

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, query, orderByChild, limitToLast, onValue, update, get, set } from 'firebase/database';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

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

// Ініціалізація Firebase + Сервіси
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// =====================
// АДМІНІСТРАТОРИ
// =====================
// Додайте email адміністраторів сюди
const ADMIN_EMAILS = [
  // Замініть на реальні email адміністраторів
  'maryanlikesyou@gmail.com',
  'musevi4ka@gmail.com',
];

export const isAdmin = (email: string | null): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

export const checkAdminAccess = (user: User | null): boolean => {
  return user ? isAdmin(user.email) : false;
};

// =====================
// МОДЕЛІ ТА ІНТЕРФЕЙСИ
// =====================

// Типи для замовлень
export interface CartItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  image: string;
  category: string;
  maxQuantity?: number;
  discount?: number; // Знижка на товар у %
  deliveryPrice?: string; // Ціна доставки для цього товару
  deliveryDays?: string; // Термін доставки для цього товару
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
  deliveryMethod: 'nova';
  paymentMethod: 'card';
  comments: string;
  items: CartItem[];
  totalPrice: number;
  // Знижки
  discountPercent?: number;
  discountAmount?: number;
  discountedSubtotal?: number;
  deliveryPrice: number; // always 120₴, only Nova Poshta
  // Списання балів
  redeemedPoints?: number;
  redeemedAmount?: number;
  finalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'ready_for_pickup' | 'completed' | 'cancelled';
  trackingNumber?: string; // ТТН для відправлених замовлень
  createdAt: number;
  updatedAt: number;
  userId?: string | null; // якщо замовлення створено авторизованим користувачем
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  points: number;          // накопичені бали (кешбек)
  totalSpent: number;      // загальна сума витрат
  totalOrders: number;     // кількість замовлень
  rating: number;          // рівень (1..5)
  discountPercent: number; // розмір знижки, що застосовується при оформленні
  telegramId?: string;     // Telegram ID користувача (якщо прив'язано)
  telegramUsername?: string; // Telegram username користувача (якщо прив'язано)
  createdAt: number;
  updatedAt: number;
}

// =====================
// ВІДГУКИ (REVIEWS)
// =====================
export interface Review {
  id: string;          // reviewId
  orderId: string;     // до якого замовлення
  userId: string;      // автор (має бути власник замовлення)
  displayName: string | null; // ім'я користувача
  rating: number;      // 1..5
  text: string;        // текст відгуку
  createdAt: number;   // час створення
  adminReply?: string; // відповідь адміна (якщо є)
  adminReplyAt?: number; // час відповіді адміна
}

// =====================
// АУКЦІОНИ
// =====================
export interface Bid {
  userId: string;
  userName: string;
  amount: number;
  createdAt: number;
}

export interface Auction {
  id: string;
  name: string;
  description?: string;
  image?: string;
  startPrice: number;
  currentPrice: number;
  minBidStep: number; // Мінімальний крок ставки (грн)
  timeoutMinutes: number; // Час неперебивання ставки (хв) після якого аукціон закривається
  openTime: number; // Час відкриття аукціону (timestamp)
  status: 'scheduled' | 'active' | 'ended'; // scheduled: очікує відкриття, active: йде, ended: завершений
  bids: Bid[]; // Історія ставок
  winnerUserId?: string; // ID переможця (якщо завершений)
  winnerUserName?: string; // Ім'я переможця
  lastBidTime?: number; // Час останньої ставки (для таймеру)
  createdAt: number;
  closedAt?: number; // Час закриття
}

// =====================
// АВТОРИЗАЦІЯ
// =====================
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await ensureUserProfile(user);
    return user;
  } catch (error) {
    console.error('Помилка авторизації через Google:', error);
    throw error;
  }
};

export const logout = () => signOut(auth);

export const subscribeAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      await ensureUserProfile(user);
    }
    callback(user);
  });
};

// =====================
// ПРОФІЛЬ КОРИСТУВАЧА
// =====================
const computeRatingAndDiscount = (totalOrders: number): { rating: number; discountPercent: number } => {
  if (totalOrders >= 50) return { rating: 5, discountPercent: 10 };
  if (totalOrders >= 20) return { rating: 4, discountPercent: 7 };
  if (totalOrders >= 10) return { rating: 3, discountPercent: 5 };
  if (totalOrders >= 5) return { rating: 2, discountPercent: 2 };
  if (totalOrders >= 1) return { rating: 1, discountPercent: 0 };
  return { rating: 0, discountPercent: 0 };
};

export const ensureUserProfile = async (user: User) => {
  if (!user) return;
  const userRef = ref(database, `users/${user.uid}`);
  const snapshot = await get(userRef);
  const now = Date.now();
  if (!snapshot.exists()) {
    const base: UserProfile = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      points: 0,
      totalSpent: 0,
      totalOrders: 0,
      rating: 0,
      discountPercent: 0,
      createdAt: now,
      updatedAt: now,
    };
    await set(userRef, base);
  }
};

export const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const snapshot = await get(ref(database, `users/${uid}`));
    if (snapshot.exists()) return snapshot.val() as UserProfile;
    return null;
  } catch (e) {
    console.error('Помилка отримання профілю:', e);
    return null;
  }
};

export const updateUserStatsAfterOrder = async (
  uid: string,
  orderFinalPrice: number, // Price for goods only (delivery is paid separately)
  redeemedPoints: number = 0
) => {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) return;
    const data = snapshot.val() as UserProfile;
    // Спочатку списуємо бали (не даємо піти в мінус)
    const newPointsBase = Math.max(0, (data.points || 0) - Math.max(0, redeemedPoints));
    // Додаємо бали за покупку (тільки за товари, не за доставку)
    const addedPoints = Math.floor(orderFinalPrice / 100); // 1 бал за кожні 100₴
    const totalSpent = data.totalSpent + orderFinalPrice;
    const totalOrders = data.totalOrders + 1;
    const { rating, discountPercent } = computeRatingAndDiscount(totalOrders);
    await update(userRef, {
      points: newPointsBase + addedPoints,
      totalSpent,
      totalOrders,
      rating,
      discountPercent,
      updatedAt: Date.now(),
    });
  } catch (e) {
    console.error('Помилка оновлення статистики користувача:', e);
  }
};

// Топ покупців (за totalSpent)
export const fetchTopBuyers = async (limitCount: number = 5): Promise<UserProfile[]> => {
  try {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) return [];
    const data = snapshot.val() as Record<string, UserProfile>;
    const list = Object.values(data)
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, limitCount);
    return list;
  } catch (e) {
    console.error('Помилка отримання топ покупців:', e);
    return [];
  }
};

// Кількість зареєстрованих акаунтів (users)
export const fetchUsersCount = async (): Promise<number> => {
  try {
    const snapshot = await get(ref(database, 'users'));
    if (!snapshot.exists()) return 0;
    const data = snapshot.val() as Record<string, UserProfile>;
    return Object.keys(data).length;
  } catch (e) {
    console.error('Помилка отримання кількості користувачів:', e);
    return 0;
  }
};

export const fetchUserOrders = async (uid: string): Promise<Order[]> => {
  try {
    const ordersRef = ref(database, 'orders');
    const snapshot = await get(ordersRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.entries(data)
        .map(([key, value]: [string, any]) => ({ id: key, ...value }))
        .filter((o: Order) => o.userId === uid)
        .sort((a: Order, b: Order) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return [];
  } catch (e) {
    console.error('Помилка отримання замовлень користувача:', e);
    return [];
  }
};

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
export const updateOrderStatus = async (
  orderId: string, 
  newStatus: 'pending' | 'processing' | 'shipped' | 'ready_for_pickup' | 'completed' | 'cancelled',
  trackingNumber?: string
) => {
  try {
    // Отримуємо замовлення
    const orderRef = ref(database, `orders/${orderId}`);
    const orderSnapshot = await get(orderRef);
    
    if (!orderSnapshot.exists()) {
      return false;
    }
    
    const order = orderSnapshot.val();
    
    // Підготовлюємо оновлення
    const updateData: any = {
      status: newStatus,
      updatedAt: Date.now(),
    };
    
    // Додаємо ТТН якщо він передано
    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }
    
    // Оновлюємо в базі даних
    await update(orderRef, updateData);
    
    // Відправляємо Telegram сповіщення через API endpoint
    if (order.userId && newStatus !== 'pending') {
      try {
        await fetch('/api/orders/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: order.userId,
            order: { ...order, id: orderId, trackingNumber },
            status: newStatus,
          }),
        });
      } catch (error) {
        // Помилка при відправці, але статус вже оновлено в БД
        console.error('Telegram notification error:', error);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    return false;
  }
};

// Тип для товару
export interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  costPrice?: string; // ціна закупки (для адміна, для статистики)
  image: string;
  description: string;
  inStock: boolean;
  quantity: number;
  images?: string[]; // масив URL або emoji для сторінки товару
  discount?: number; // знижка на товар у %
  deliveryPrice?: string; // ціна доставки (наприклад "120" для України, "150" для закордону)
  deliveryDays?: string; // термін доставки (наприклад "1-2" для України, "7-14" для закордону)
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
    const productsRef = ref(database, 'products');
    const snapshot = await get(productsRef);
    if (!snapshot.exists()) return false;

    const data = snapshot.val();

    // Якщо зберігається як масив
    if (Array.isArray(data)) {
      const products = data as Product[];
      const idx = products.findIndex((p) => p.id === productId);
      if (idx === -1) return false;
      const updated = { ...products[idx], ...updates } as Product;
      // Автооновлення inStock, якщо кількість змінюється
      if (typeof updates.quantity === 'number') {
        updated.inStock = (updates.quantity ?? updated.quantity) > 0;
      }
      products[idx] = updated;
      await set(productsRef, products);
      return true;
    }

    // Якщо зберігається як об'єкт
    const obj: Record<string, Product> = data as any;
    const key = Object.keys(obj).find((k) => obj[k]?.id === productId);
    if (!key) return false;
    const productRef = ref(database, `products/${key}`);
    // Якщо кількість змінюється, тримаємо inStock у синхроні
    if (typeof updates.quantity === 'number') {
      updates = { ...updates, inStock: (updates.quantity ?? obj[key].quantity) > 0 };
    }
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
    const productsRef = ref(database, 'products');
    const snapshot = await get(productsRef);
    if (!snapshot.exists()) return false;

    const data = snapshot.val();
    if (Array.isArray(data)) {
      const products = data as Product[];
      const idx = products.findIndex((p) => p.id === productId);
      if (idx === -1) return false;
      const product = products[idx];
      const newQuantity = Math.max(0, (product.quantity || 0) - quantityToDecrease);
      products[idx] = { ...product, quantity: newQuantity, inStock: newQuantity > 0 };
      await set(productsRef, products);
      return true;
    }

    const obj: Record<string, Product> = data as any;
    const key = Object.keys(obj).find((k) => obj[k]?.id === productId);
    if (!key) return false;
    const product = obj[key];
    const newQuantity = Math.max(0, (product.quantity || 0) - quantityToDecrease);
    const productRef = ref(database, `products/${key}`);
    await update(productRef, { quantity: newQuantity, inStock: newQuantity > 0 });
    return true;
  } catch (error) {
    console.error('Помилка при зменшенні кількості товару:', error);
    return false;
  }
};

// Отримати один товар за id
export const fetchProductById = async (id: number): Promise<Product | null> => {
  try {
    const productsRef = ref(database, 'products');
    const snapshot = await get(productsRef);
    if (!snapshot.exists()) return null;
    const data = snapshot.val();
    if (Array.isArray(data)) {
      const products = data as Product[];
      return products.find((p) => p.id === id) || null;
    }
    const obj: Record<string, Product> = data as any;
    const key = Object.keys(obj).find((k) => obj[k]?.id === id);
    return key ? (obj[key] as Product) : null;
  } catch (error) {
    console.error('Помилка отримання товару:', error);
    return null;
  }
};

// Функція для додавання нового товару
export const addProduct = async (newProduct: Omit<Product, 'id'>): Promise<boolean> => {
  try {
    const productsRef = ref(database, 'products');
    const snapshot = await get(productsRef);

    const buildProduct = (id: number): Product => ({
      ...newProduct,
      id,
      inStock: newProduct.quantity > 0,
    });

    if (snapshot.exists()) {
      const data = snapshot.val();
      let list: Product[];
      if (Array.isArray(data)) {
        list = data as Product[];
      } else {
        // конвертуємо об'єкт у масив для уніфікації структури
        list = Object.values(data as Record<string, Product>) as Product[];
      }
      const maxId = list.length > 0 ? Math.max(...list.map((p) => p.id)) : 0;
      const productToAdd = buildProduct(maxId + 1);
      await set(productsRef, [...list, productToAdd]);
      return true;
    } else {
      const productToAdd = buildProduct(1);
      await set(productsRef, [productToAdd]);
      return true;
    }
  } catch (error) {
    console.error('Помилка при додаванні товару:', error);
    return false;
  }
};

// Функція для видалення товару
export const deleteProduct = async (productId: number): Promise<boolean> => {
  try {
    const productsRef = ref(database, 'products');
    const snapshot = await get(productsRef);

    if (!snapshot.exists()) return false;
    const data = snapshot.val();
    
    let productToDelete: Product | null = null;

    if (Array.isArray(data)) {
      const products = data as Product[];
      productToDelete = products.find((p) => p.id === productId) || null;
      const updated = products.filter((p) => p.id !== productId);
      if (updated.length === products.length) return false;
      await set(productsRef, updated);
    } else {
      const obj: Record<string, Product> = data as any;
      const key = Object.keys(obj).find((k) => obj[k]?.id === productId);
      if (!key) return false;
      productToDelete = obj[key];
      // Видаляємо ключ і переписуємо як масив для уніфікації
      delete obj[key];
      const list: Product[] = Object.values(obj);
      await set(productsRef, list);
    }
    
    // Видаляємо фото з Storage, якщо є
    if (productToDelete && productToDelete.images && productToDelete.images.length > 0) {
      for (const imageUrl of productToDelete.images) {
        try {
          // Перевіряємо чи це Firebase Storage URL
          if (imageUrl.includes('firebasestorage.googleapis.com')) {
            const imageRef = storageRef(storage, imageUrl);
            await deleteObject(imageRef);
          }
        } catch (err) {
          console.warn('Не вдалося видалити фото:', err);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Помилка при видаленні товару:', error);
    return false;
  }
};

// =====================
// STORAGE FUNCTIONS (завантаження фото)
// =====================

/**
 * Завантажує фото в Firebase Storage і повертає URL
 * @param file - файл зображення
 * @param folder - папка для зберігання (за замовчуванням 'products')
 * @returns URL завантаженого зображення або null при помилці
 */
export const uploadImage = async (file: File, folder: string = 'products'): Promise<string | null> => {
  try {
    // Генеруємо унікальне ім'я файлу
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const fileName = `${folder}/${timestamp}_${randomString}.${extension}`;
    
    // Створюємо референс та завантажуємо файл
    const imageRef = storageRef(storage, fileName);
    const snapshot = await uploadBytes(imageRef, file);
    
    // Отримуємо публічний URL
    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch (error) {
    console.error('Помилка завантаження фото:', error);
    return null;
  }
};

/**
 * Видаляє фото з Firebase Storage за URL
 * @param imageUrl - URL зображення для видалення
 */
export const deleteImage = async (imageUrl: string): Promise<boolean> => {
  try {
    if (!imageUrl.includes('firebasestorage.googleapis.com')) {
      return false; // Не Firebase Storage URL
    }
    const imageRef = storageRef(storage, imageUrl);
    await deleteObject(imageRef);
    return true;
  } catch (error) {
    console.error('Помилка видалення фото:', error);
    return false;
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

// =====================
// REVIEWS FUNCTIONS
// =====================
// Перевірити чи існує відгук для замовлення (один відгук на замовлення)
export const hasReviewForOrder = async (orderId: string): Promise<boolean> => {
  try {
    const reviewRef = ref(database, `reviews/${orderId}`); // використовуємо orderId як ключ
    const snapshot = await get(reviewRef);
    return snapshot.exists();
  } catch (error) {
    console.error('Помилка перевірки відгуку:', error);
    return false;
  }
};

// Створити відгук (якщо ще не існує)
export const createReview = async (orderId: string, user: User, rating: number, text: string): Promise<boolean> => {
  try {
    // Валідація
    if (rating < 1 || rating > 5) throw new Error('Некоректний рейтинг');
    const exists = await hasReviewForOrder(orderId);
    if (exists) return false; // вже є відгук

    const reviewData: Review = {
      id: orderId, // один відгук на замовлення
      orderId,
      userId: user.uid,
      displayName: user.displayName || user.email || null,
      rating,
      text,
      createdAt: Date.now(),
    };
    const reviewRef = ref(database, `reviews/${orderId}`);
    await set(reviewRef, reviewData);
    return true;
  } catch (error) {
    console.error('Помилка створення відгуку:', error);
    return false;
  }
};

// Отримати останні відгуки (для головної сторінки)
export const fetchRecentReviews = async (limitCount: number = 5): Promise<Review[]> => {
  try {
    const reviewsRef = ref(database, 'reviews');
    const snapshot = await get(reviewsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const list: Review[] = Object.values(data);
      return list.sort((a, b) => b.createdAt - a.createdAt).slice(0, limitCount);
    }
    return [];
  } catch (error) {
    console.error('Помилка отримання відгуків:', error);
    return [];
  }
};

// Отримати відгук по orderId
export const fetchReviewByOrder = async (orderId: string): Promise<Review | null> => {
  try {
    const reviewRef = ref(database, `reviews/${orderId}`);
    const snapshot = await get(reviewRef);
    if (snapshot.exists()) {
      return snapshot.val() as Review;
    }
    return null;
  } catch (error) {
    console.error('Помилка отримання відгуку:', error);
    return null;
  }
};

// Отримати всі відгуки (для адмін-панелі)
export const fetchAllReviews = async (): Promise<Review[]> => {
  try {
    const reviewsRef = ref(database, 'reviews');
    const snapshot = await get(reviewsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const list: Review[] = Object.values(data);
      return list.sort((a, b) => b.createdAt - a.createdAt);
    }
    return [];
  } catch (error) {
    console.error('Помилка отримання всіх відгуків:', error);
    return [];
  }
};

// Видалити відгук (тільки для адмінів)
export const deleteReview = async (orderId: string): Promise<boolean> => {
  try {
    const reviewRef = ref(database, `reviews/${orderId}`);
    await set(reviewRef, null); // Видаляємо запис
    return true;
  } catch (error) {
    console.error('Помилка видалення відгуку:', error);
    return false;
  }
};

// Додати відповідь адміна на відгук
export const addAdminReply = async (orderId: string, replyText: string): Promise<boolean> => {
  try {
    if (!replyText.trim()) {
      throw new Error('Текст відповіді не може бути порожнім');
    }
    
    const reviewRef = ref(database, `reviews/${orderId}`);
    const snapshot = await get(reviewRef);
    
    if (!snapshot.exists()) {
      throw new Error('Відгук не знайдено');
    }
    
    await update(reviewRef, {
      adminReply: replyText.trim(),
      adminReplyAt: Date.now(),
    });
    
    return true;
  } catch (error) {
    console.error('Помилка додавання відповіді адміна:', error);
    return false;
  }
}

// =====================
// TELEGRAM BINDING
// =====================

/**
 * Зв'язати Telegram ID з обліком користувача
 */
export async function bindTelegramToUser(uid: string, telegramId: string, telegramUsername?: string): Promise<boolean> {
  try {
    console.log('bindTelegramToUser called with:', { uid, telegramId, telegramUsername });
    
    const userRef = ref(database, `users/${uid}`);
    
    // Оновлюємо поля у профілі користувача
    const updateData: any = {
      telegramId: telegramId.trim(),
      updatedAt: Date.now(),
    };
    
    // Додаємо username якщо він передано
    if (telegramUsername) {
      updateData.telegramUsername = telegramUsername.trim();
      console.log('Adding username to user profile:', telegramUsername);
    }
    
    await update(userRef, updateData);
    console.log('User profile updated successfully');
    
    // Також створюємо індекс для швидкого пошуку за telegramId
    const telegramIndexRef = ref(database, `telegram_users/${telegramId}`);
    await set(telegramIndexRef, {
      uid: uid,
      username: telegramUsername || null,
      bindedAt: Date.now(),
    });
    console.log('Telegram index created');
    
    return true;
  } catch (error) {
    console.error('Помилка прив\'язки Telegram:', error);
    return false;
  }
}

/**
 * Отримати користувача за Telegram ID
 */
export async function getUserByTelegramId(telegramId: string): Promise<{ uid: string; profile: UserProfile } | null> {
  try {
    const telegramIndexRef = ref(database, `telegram_users/${telegramId}`);
    const snapshot = await get(telegramIndexRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const { uid } = snapshot.val();
    
    // Отримуємо профіль користувача
    const userRef = ref(database, `users/${uid}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists()) {
      return null;
    }
    
    return {
      uid,
      profile: userSnapshot.val() as UserProfile,
    };
  } catch (error) {
    console.error('Помилка пошуку користувача за Telegram ID:', error);
    return null;
  }
}

/**
 * Розв'язати Telegram від акаунту
 */
export async function unbindTelegramFromUser(uid: string): Promise<boolean> {
  try {
    // Отримуємо telegramId перед видаленням
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      return false;
    }
    
    const profile = snapshot.val() as UserProfile;
    const telegramId = profile.telegramId;
    
    // Видаляємо telegramId з профілю
    await update(userRef, {
      telegramId: null,
      updatedAt: Date.now(),
    });
    
    // Видаляємо індекс
    if (telegramId) {
      const telegramIndexRef = ref(database, `telegram_users/${telegramId}`);
      await set(telegramIndexRef, null);
    }
    
    return true;
  } catch (error) {
    console.error('Помилка розв\'язання Telegram:', error);
    return false;
  }
}

/**
 * Отримати код для прив'язки Telegram (одноразовий код)
 */
export async function generateTelegramBindingCode(uid: string): Promise<string> {
  try {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const bindingCodeRef = ref(database, `telegram_binding_codes/${code}`);
    
    await set(bindingCodeRef, {
      uid: uid,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 хвилин
    });
    
    return code;
  } catch (error) {
    console.error('Помилка генерування коду для прив\'язки:', error);
    throw error;
  }
}

/**
 * Перевірити код для прив'язки та отримати uid
 */
export async function verifyTelegramBindingCode(code: string): Promise<string | null> {
  try {
    const bindingCodeRef = ref(database, `telegram_binding_codes/${code}`);
    const snapshot = await get(bindingCodeRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const data = snapshot.val();
    
    // Перевірити, чи код не закінчився
    if (data.expiresAt < Date.now()) {
      await set(bindingCodeRef, null); // Видалити протермінований код
      return null;
    }
    
    return data.uid;
  } catch (error) {
    console.error('Помилка перевірки коду для прив\'язки:', error);
    return null;
  }
}

/**
 * Видалити код для прив'язки після використання
 */
export async function deleteTelegramBindingCode(code: string): Promise<void> {
  try {
    const bindingCodeRef = ref(database, `telegram_binding_codes/${code}`);
    await set(bindingCodeRef, null);
  } catch (error) {
    console.error('Помилка видалення коду:', error);
  }
}

// =====================
// TELEGRAM NOTIFICATIONS
// =====================

/**
 * Відправити сповіщення про замовлення в Telegram
 */
export async function sendOrderNotificationToTelegram(
  uid: string,
  order: Order | any,
  status: 'created' | 'processing' | 'shipped' | 'ready_for_pickup' | 'completed' | 'cancelled'
): Promise<boolean> {
  try {
    // Отримуємо профіль користувача для Telegram ID
    const userRef = ref(database, `users/${uid}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists()) {
      return false;
    }
    
    const user = userSnapshot.val() as UserProfile;
    
    // Якщо користувач не прив'язав Telegram, нічого не робимо
    if (!user.telegramId) {
      return false;
    }

    // Повідомлення для користувача
    const messages: { [key: string]: string } = {
      created: `🎉 <b>Нове замовлення!</b>\n\n` +
        `📦 Замовлення №<code>${order.id}</code>\n` +
        `💰 Сума: <b>${order.finalPrice}₴</b>\n` +
        `🏪 Товарів: <b>${order.items.length}</b>\n` +
        `📍 Місто: <b>${order.city}</b>\n\n` +
        `⏳ Статус: <i>Очікує обробки</i>\n` +
        `ℹ️ Ми обробимо ваше замовлення найближчим часом!`,
      processing: `⚙️ <b>Замовлення в обробці!</b>\n\n` +
        `📦 Замовлення №<code>${order.id}</code>\n` +
        `💰 Сума: <b>${order.finalPrice}₴</b>\n\n` +
        `✅ Платіж підтверджено\n` +
        `🚚 Замовлення готується до відправлення`,
      shipped: `📮 <b>Замовлення відправлено!</b>\n\n` +
        `📦 Замовлення №<code>${order.id}</code>\n` +
        `💰 Сума: <b>${order.finalPrice}₴</b>\n\n` +
        `🚚 Ваше замовлення у дорозі!\n` +
        `📍 Трек-номер: <code>${order.trackingNumber || 'N/A'}</code>\n` +
        `🔗 Стежте за доставкою на сайті Нової Пошти`,
      ready_for_pickup: `✅ <b>Замовлення готове до забору!</b>\n\n` +
        `📦 Замовлення №<code>${order.id}</code>\n` +
        `💰 Сума: <b>${order.finalPrice}₴</b>\n\n` +
        `🎁 Ваше замовлення прибуло на відділення Нової Пошти!\n` +
        `📮 Адреса отримання вказана при оформленні замовлення\n` +
        `⏰ Зберігається 5 днів\n` +
        `🏃 Спішіть забрати! 💨`,
      completed: `✅ <b>Замовлення завершене!</b>\n\n` +
        `📦 Замовлення №<code>${order.id}</code>\n` +
        `💰 Сума: <b>${order.finalPrice}₴</b>\n\n` +
        `🎁 Дякуємо за покупку!\n` +
        `🦄 До нових зустрічей у нашому магазині!\n` +
        `💜 Залишайтеся чарівними!`,
      cancelled: `❌ <b>Замовлення скасоване</b>\n\n` +
        `📦 Замовлення №<code>${order.id}</code>\n` +
        `💰 Сума: <b>${order.finalPrice}₴</b>\n\n` +
        `😞 На жаль, замовлення було скасоване\n` +
        `💬 Зв'яжіться з нами якщо є питання`
    };

    const message = messages[status];

    // Повідомлення для адміну
    if (status === "created") {
      const adminMsg = `🛎️ <b>Нове замовлення №${order.id}</b>\n` +
        `Продукт: <b>${order.items.map((i:any) => i.name).join(", ")}</b>\n` +
        `Кількість: <b>${order.items.reduce((sum:any, i:any) => sum + i.quantity, 0)}</b>\n` +
        `Дата: <b>${order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}</b>\n` +
        `Статус: <b>${status}</b>\n` +
        `Сума: <b>${order.finalPrice}₴</b>\n` +
        `Місто: <b>${order.city}</b>\n` +
        `User: <code>${uid}</code>`;
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (botToken) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: ADMIN_TELEGRAM_ID,
            text: adminMsg,
            parse_mode: 'HTML',
          }),
        });
      }
    }

    // Відправляємо сповіщення
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return false;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: user.telegramId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return false;
  }
}

/**
 * Оновити статус замовлення і відправити сповіщення
 */
export async function updateOrderStatusWithNotification(
  orderId: string,
  newStatus: 'processing' | 'completed' | 'cancelled',
  userId?: string | null
): Promise<boolean> {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    
    // Оновлюємо статус
    await update(orderRef, {
      status: newStatus,
      updatedAt: Date.now(),
    });

    // Якщо є userId, отримуємо замовлення і відправляємо сповіщення
    if (userId) {
      const orderSnapshot = await get(orderRef);
      if (orderSnapshot.exists()) {
        const order = orderSnapshot.val() as Order;
        await sendOrderNotificationToTelegram(userId, order, newStatus);
      }
    }

    return true;
  } catch (error) {
    console.error('Помилка оновлення статусу замовлення:', error);
    return false;
  }
}

// =====================
// SUPPORT TICKETS
// =====================

export interface SupportMessage {
  text: string;
  timestamp: number;
  isAdmin: boolean;
}

export interface SupportTicket {
  id: string; // На основі telegramId
  telegramId: string;
  telegramUsername?: string;
  userId?: string; // якщо користувач авторизований
  messages: SupportMessage[]; // Всі повідомлення в одному тікеті
  status: 'open' | 'responded' | 'closed';
  createdAt: number;
  updatedAt: number;
}

/**
 * Створити або оновити тікет підтримки (всі повідомлення від користувача в одному тікеті)
 */
export async function createSupportTicket(
  telegramId: string,
  message: string,
  telegramUsername?: string,
  userId?: string
): Promise<string | null> {
  try {
    const ticketRef = ref(database, `support_tickets/${telegramId}`);
    const snapshot = await get(ticketRef);

    const now = Date.now();
    const newMessage: SupportMessage = {
      text: message,
      timestamp: now,
      isAdmin: false,
    };

    if (snapshot.exists()) {
      // Тікет вже існує - додаємо нове повідомлення
      const existingTicket = snapshot.val() as SupportTicket;
      const messages = existingTicket.messages || [];
      messages.push(newMessage);

      await update(ticketRef, {
        messages,
        status: 'open', // Скидаємо статус на "відкритий" при новому повідомленні
        updatedAt: now,
      });
    } else {
      // Новий тікет
      await set(ticketRef, {
        telegramId,
        telegramUsername: telegramUsername || null,
        userId: userId || null,
        messages: [newMessage],
        status: 'open',
        createdAt: now,
        updatedAt: now,
      });
    }

    return telegramId;
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return null;
  }
}

/**
 * Отримати всі тікети (для адмін панелі)
 */
export async function getAllSupportTickets(): Promise<SupportTicket[]> {
  try {
    const ticketsRef = ref(database, 'support_tickets');
    const snapshot = await get(ticketsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const tickets: SupportTicket[] = [];
    snapshot.forEach((childSnapshot) => {
      tickets.push({
        id: childSnapshot.key!,
        ...childSnapshot.val(),
      });
    });

    // Сортуємо за часом створення (новіші першими)
    return tickets.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return [];
  }
}

/**
 * Отримати конкретний тікет
 */
export async function getSupportTicket(telegramId: string): Promise<SupportTicket | null> {
  try {
    const ticketRef = ref(database, `support_tickets/${telegramId}`);
    const snapshot = await get(ticketRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: telegramId,
      ...snapshot.val(),
    };
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    return null;
  }
}

/**
 * Додати відповідь адміна в тікет
 */
export async function respondToTicket(
  telegramId: string,
  adminReply: string,
  status: 'responded' | 'closed' = 'responded'
): Promise<boolean> {
  try {
    const ticketRef = ref(database, `support_tickets/${telegramId}`);
    const snapshot = await get(ticketRef);

    if (!snapshot.exists()) {
      return false;
    }

    const ticket = snapshot.val() as SupportTicket;
    const messages = ticket.messages || [];
    
    // Додаємо сообщение тільки якщо є текст
    if (adminReply.trim()) {
      const adminMessage: SupportMessage = {
        text: adminReply,
        timestamp: Date.now(),
        isAdmin: true,
      };
      messages.push(adminMessage);
    }

    await update(ticketRef, {
      messages,
      status,
      updatedAt: Date.now(),
    });

    return true;
  } catch (error) {
    console.error('Error responding to ticket:', error);
    return false;
  }
}

/**
 * Закрити тікет
 */
export async function closeTicket(telegramId: string): Promise<boolean> {
  try {
    const ticketRef = ref(database, `support_tickets/${telegramId}`);

    await update(ticketRef, {
      status: 'closed',
      updatedAt: Date.now(),
    });

    return true;
  } catch (error) {
    console.error('Error closing ticket:', error);
    return false;
  }
}

/**
 * Слухати змін в реальному часі для всіх тікетів
 */
export function listenToSupportTickets(
  callback: (tickets: SupportTicket[]) => void
): () => void {
  const ticketsRef = ref(database, 'support_tickets');
  
  const unsubscribe = onValue(ticketsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const tickets: SupportTicket[] = [];
    snapshot.forEach((childSnapshot) => {
      tickets.push({
        id: childSnapshot.key!,
        ...childSnapshot.val(),
      });
    });

    // Сортуємо за часом оновлення (новіші першими)
    tickets.sort((a, b) => b.updatedAt - a.updatedAt);
    callback(tickets);
  });

  return unsubscribe;
}

// =====================
// ФОРУМ
// =====================

export interface ForumThread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto: string | null;
  category: string; // 'general' | 'help' | 'showcase' | 'news'
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  isLocked: boolean;
  commentsCount: number;
  viewsCount: number;
  reactions: { [userId: string]: string }; // 'like' | 'love' | 'laugh' | 'wow' | 'sad'
}

export interface ForumComment {
  id: string;
  threadId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto: string | null;
  createdAt: number;
  updatedAt: number;
  reactions: { [userId: string]: string };
  isEdited: boolean;
}

// Створити нову тему
export async function createForumThread(
  userId: string,
  userName: string,
  userPhoto: string | null,
  title: string,
  content: string,
  category: string
): Promise<string> {
  const threadId = Date.now().toString();
  const threadRef = ref(database, `forum/threads/${threadId}`);
  
  const thread: ForumThread = {
    id: threadId,
    title,
    content,
    authorId: userId,
    authorName: userName,
    authorPhoto: userPhoto,
    category,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPinned: false,
    isLocked: false,
    commentsCount: 0,
    viewsCount: 0,
    reactions: {},
  };

  await set(threadRef, thread);
  return threadId;
}

// Отримати всі теми
export async function getForumThreads(): Promise<ForumThread[]> {
  const threadsRef = ref(database, 'forum/threads');
  const snapshot = await get(threadsRef);
  
  if (!snapshot.exists()) return [];
  
  const threads: ForumThread[] = [];
  snapshot.forEach((child) => {
    threads.push(child.val() as ForumThread);
  });
  
  // Сортуємо: закріплені зверху, потім за датою оновлення
  threads.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.updatedAt - a.updatedAt;
  });
  
  return threads;
}

// Отримати тему за ID
export async function getForumThread(threadId: string): Promise<ForumThread | null> {
  const threadRef = ref(database, `forum/threads/${threadId}`);
  const snapshot = await get(threadRef);
  
  if (!snapshot.exists()) return null;
  return snapshot.val() as ForumThread;
}

// Збільшити лічильник переглядів
export async function incrementThreadViews(threadId: string): Promise<void> {
  const thread = await getForumThread(threadId);
  if (!thread) return;
  
  const threadRef = ref(database, `forum/threads/${threadId}`);
  await update(threadRef, {
    viewsCount: (thread.viewsCount || 0) + 1,
  });
}

// Додати коментар до теми
export async function addForumComment(
  threadId: string,
  userId: string,
  userName: string,
  userPhoto: string | null,
  content: string
): Promise<string> {
  const commentId = Date.now().toString();
  const commentRef = ref(database, `forum/comments/${threadId}/${commentId}`);
  
  const comment: ForumComment = {
    id: commentId,
    threadId,
    content,
    authorId: userId,
    authorName: userName,
    authorPhoto: userPhoto,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    reactions: {},
    isEdited: false,
  };

  await set(commentRef, comment);
  
  // Оновити лічильник коментарів та час оновлення теми
  const thread = await getForumThread(threadId);
  if (thread) {
    const threadRef = ref(database, `forum/threads/${threadId}`);
    await update(threadRef, {
      commentsCount: (thread.commentsCount || 0) + 1,
      updatedAt: Date.now(),
    });
  }
  
  return commentId;
}

// Отримати коментарі теми
export async function getForumComments(threadId: string): Promise<ForumComment[]> {
  const commentsRef = ref(database, `forum/comments/${threadId}`);
  const snapshot = await get(commentsRef);
  
  if (!snapshot.exists()) return [];
  
  const comments: ForumComment[] = [];
  snapshot.forEach((child) => {
    comments.push(child.val() as ForumComment);
  });
  
  // Сортуємо за часом створення (старіші першими)
  comments.sort((a, b) => a.createdAt - b.createdAt);
  
  return comments;
}

// Додати реакцію до теми
export async function addThreadReaction(
  threadId: string,
  userId: string,
  reaction: string
): Promise<void> {
  const thread = await getForumThread(threadId);
  if (!thread) return;
  
  const threadRef = ref(database, `forum/threads/${threadId}/reactions/${userId}`);
  await set(threadRef, reaction);
}

// Видалити реакцію з теми
export async function removeThreadReaction(
  threadId: string,
  userId: string
): Promise<void> {
  const threadRef = ref(database, `forum/threads/${threadId}/reactions/${userId}`);
  await set(threadRef, null);
}

// Додати реакцію до коментаря
export async function addCommentReaction(
  threadId: string,
  commentId: string,
  userId: string,
  reaction: string
): Promise<void> {
  const commentRef = ref(database, `forum/comments/${threadId}/${commentId}/reactions/${userId}`);
  await set(commentRef, reaction);
}

// Видалити реакцію з коментаря
export async function removeCommentReaction(
  threadId: string,
  commentId: string,
  userId: string
): Promise<void> {
  const commentRef = ref(database, `forum/comments/${threadId}/${commentId}/reactions/${userId}`);
  await set(commentRef, null);
}

// Редагувати тему (тільки автор або адмін)
export async function editForumThread(
  threadId: string,
  userId: string,
  title: string,
  content: string
): Promise<void> {
  const thread = await getForumThread(threadId);
  if (!thread) throw new Error('Thread not found');
  
  const user = auth.currentUser;
  if (thread.authorId !== userId && !checkAdminAccess(user)) {
    throw new Error('Access denied');
  }
  
  const threadRef = ref(database, `forum/threads/${threadId}`);
  await update(threadRef, {
    title,
    content,
    updatedAt: Date.now(),
  });
}

// Редагувати коментар (тільки автор або адмін)
export async function editForumComment(
  threadId: string,
  commentId: string,
  userId: string,
  content: string
): Promise<void> {
  const commentsRef = ref(database, `forum/comments/${threadId}/${commentId}`);
  const snapshot = await get(commentsRef);
  
  if (!snapshot.exists()) throw new Error('Comment not found');
  
  const comment = snapshot.val() as ForumComment;
  const user = auth.currentUser;
  
  if (comment.authorId !== userId && !checkAdminAccess(user)) {
    throw new Error('Access denied');
  }
  
  await update(commentsRef, {
    content,
    updatedAt: Date.now(),
    isEdited: true,
  });
}

// Видалити тему (тільки автор або адмін)
export async function deleteForumThread(threadId: string, userId: string): Promise<void> {
  const thread = await getForumThread(threadId);
  if (!thread) return;
  
  const user = auth.currentUser;
  if (thread.authorId !== userId && !checkAdminAccess(user)) {
    throw new Error('Access denied');
  }
  
  // Видалити тему та всі її коментарі
  const threadRef = ref(database, `forum/threads/${threadId}`);
  const commentsRef = ref(database, `forum/comments/${threadId}`);
  
  await set(threadRef, null);
  await set(commentsRef, null);
}

// Видалити коментар (тільки автор або адмін)
export async function deleteForumComment(
  threadId: string,
  commentId: string,
  userId: string
): Promise<void> {
  const commentRef = ref(database, `forum/comments/${threadId}/${commentId}`);
  const snapshot = await get(commentRef);
  
  if (!snapshot.exists()) return;
  
  const comment = snapshot.val() as ForumComment;
  const user = auth.currentUser;
  
  if (comment.authorId !== userId && !checkAdminAccess(user)) {
    throw new Error('Access denied');
  }
  
  await set(commentRef, null);
  
  // Оновити лічильник коментарів теми
  const thread = await getForumThread(threadId);
  if (thread) {
    const threadRef = ref(database, `forum/threads/${threadId}`);
    await update(threadRef, {
      commentsCount: Math.max(0, (thread.commentsCount || 0) - 1),
    });
  }
}

// Закріпити/відкріпити тему (тільки адмін)
export async function toggleThreadPin(threadId: string): Promise<void> {
  const user = auth.currentUser;
  if (!checkAdminAccess(user)) {
    throw new Error('Admin access required');
  }
  
  const thread = await getForumThread(threadId);
  if (!thread) return;
  
  const threadRef = ref(database, `forum/threads/${threadId}`);
  await update(threadRef, {
    isPinned: !thread.isPinned,
  });
}

// Заблокувати/розблокувати тему (тільки адмін)
export async function toggleThreadLock(threadId: string): Promise<void> {
  const user = auth.currentUser;
  if (!checkAdminAccess(user)) {
    throw new Error('Admin access required');
  }
  
  const thread = await getForumThread(threadId);
  if (!thread) return;
  
  const threadRef = ref(database, `forum/threads/${threadId}`);
  await update(threadRef, {
    isLocked: !thread.isLocked,
  });
}
// =====================
// АУКЦІОНИ
// =====================

// Створити новий аукціон (тільки адмін)
export async function createAuction(
  name: string,
  description: string,
  startPrice: number,
  minBidStep: number,
  timeoutMinutes: number,
  openTime: number,
  image?: string
): Promise<string> {
  const user = auth.currentUser;
  if (!checkAdminAccess(user)) {
    throw new Error('Admin access required');
  }

  const auctionsRef = ref(database, 'auctions');
  const newAuctionRef = ref(database, `auctions/${Date.now()}`);
  const auctionId = Date.now().toString();

  const auction: Auction = {
    id: auctionId,
    name,
    description,
    image,
    startPrice,
    currentPrice: startPrice,
    minBidStep,
    timeoutMinutes,
    openTime,
    status: 'scheduled',
    bids: [],
    createdAt: Date.now(),
  };

  await set(newAuctionRef, auction);
  return auctionId;
}

// Отримати все аукціони
export async function fetchAllAuctions(callback: (auctions: Auction[]) => void): Promise<void> {
  const auctionsRef = ref(database, 'auctions');
  onValue(auctionsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const auctions = Object.values(data).sort(
        (a: any, b: any) => b.createdAt - a.createdAt
      );
      callback(auctions as Auction[]);
    } else {
      callback([]);
    }
  });
}

// Отримати один аукціон
export async function fetchAuction(auctionId: string): Promise<Auction | null> {
  try {
    const snapshot = await get(ref(database, `auctions/${auctionId}`));
    if (snapshot.exists()) {
      return snapshot.val() as Auction;
    }
    return null;
  } catch (e) {
    console.error('Помилка отримання аукціону:', e);
    return null;
  }
}

// Зробити ставку на аукціон
export async function placeBid(
  auctionId: string,
  userId: string,
  userName: string,
  bidAmount: number
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated');
  }

  const auction = await fetchAuction(auctionId);
  if (!auction) {
    throw new Error('Auction not found');
  }

  if (auction.status !== 'active') {
    throw new Error('Auction is not active');
  }

  const minBidAmount = auction.currentPrice + auction.minBidStep;
  if (bidAmount < minBidAmount) {
    throw new Error(`Bid must be at least ${minBidAmount}`);
  }

  const bid: Bid = {
    userId,
    userName,
    amount: bidAmount,
    createdAt: Date.now(),
  };

  const auctionRef = ref(database, `auctions/${auctionId}`);
  await update(auctionRef, {
    currentPrice: bidAmount,
    bids: [...(auction.bids || []), bid],
    lastBidTime: Date.now(),
  });
}

// Закрити аукціон (вручну чи автоматично)
export async function closeAuction(auctionId: string): Promise<void> {
  const auction = await fetchAuction(auctionId);
  if (!auction) {
    throw new Error('Auction not found');
  }

  const auctionRef = ref(database, `auctions/${auctionId}`);
  const lastBid = auction.bids?.[auction.bids.length - 1];

  await update(auctionRef, {
    status: 'ended',
    closedAt: Date.now(),
    winnerUserId: lastBid?.userId || null,
    winnerUserName: lastBid?.userName || null,
  });
}

// Оновити аукціон (адмін) 
export async function updateAuction(
  auctionId: string,
  updates: Partial<Auction>
): Promise<void> {
  const user = auth.currentUser;
  if (!checkAdminAccess(user)) {
    throw new Error('Admin access required');
  }

  const auctionRef = ref(database, `auctions/${auctionId}`);
  await update(auctionRef, updates);
}

// Видалити аукціон (адмін)
export async function deleteAuction(auctionId: string): Promise<void> {
  const user = auth.currentUser;
  if (!checkAdminAccess(user)) {
    throw new Error('Admin access required');
  }

  const auctionRef = ref(database, `auctions/${auctionId}`);
  await set(auctionRef, null);
}