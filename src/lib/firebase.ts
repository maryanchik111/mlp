// Telegram ID адміну для сповіщень
const ADMIN_TELEGRAM_ID = "7365171162";

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, query, orderByChild, limitToLast, onValue, update, get, set, equalTo } from 'firebase/database';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile
} from 'firebase/auth';
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
  id: string;
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
  isBlocked?: boolean;     // чи заблоковано акаунт
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

export interface ScreenshotReview {
  id: string;
  imageUrl: string;
  createdAt: number;
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

// --- Phone Authentication ---

/**
 * Ініціалізує RecaptchaVerifier для підтвердження номера телефону
 * @param containerId ID елемента, в якому буде рендеритись (може бути пустий для invisible)
 */
export const setupRecaptcha = (containerId: string) => {
  if (typeof window === 'undefined') return null;

  return new RecaptchaVerifier(auth, containerId, {
    'size': 'invisible',
    'callback': (response: any) => {
      // reCAPTCHA solved, allow signInWithPhoneNumber.
    }
  });
};

/**
 * Відправляє код підтвердження на номер телефону
 */
export const signInWithPhone = async (phoneNumber: string, appVerifier: any) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    return confirmationResult;
  } catch (error) {
    console.error('Помилка відправки SMS:', error);
    throw error;
  }
};


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

  const displayName = user.displayName || user.phoneNumber || 'Користувач';

  // Якщо в об'єкті Auth немає імені (для телефонів), оновимо його
  if (!user.displayName) {
    try {
      await updateProfile(user, { displayName });
    } catch (e) {
      console.error('Помилка оновлення Auth профілю:', e);
    }
  }

  if (!snapshot.exists()) {
    const base: UserProfile = {
      uid: user.uid,
      displayName: displayName,
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

/**
 * Оновлює ім'я користувача в Auth та RTDB
 */
export const updateUserName = async (user: User, newName: string) => {
  if (!user || !newName.trim()) return;

  // 1. Оновлюємо в Auth
  await updateProfile(user, { displayName: newName });

  // 2. Оновлюємо в RTDB
  const userRef = ref(database, `users/${user.uid}`);
  await update(userRef, {
    displayName: newName,
    updatedAt: Date.now()
  });
};

/**
 * Оновлює фото профілю (завантажує в Storage та оновлює профілі)
 */
export const updateUserPhoto = async (user: User, file: File) => {
  if (!user || !file) return;

  // 1. Завантажуємо в Storage
  const photoRef = storageRef(getStorage(), `avatars/${user.uid}`);
  await uploadBytes(photoRef, file);
  const photoURL = await getDownloadURL(photoRef);

  // 2. Оновлюємо в Auth
  await updateProfile(user, { photoURL });

  // 3. Оновлюємо в RTDB
  const userRef = ref(database, `users/${user.uid}`);
  await update(userRef, {
    photoURL,
    updatedAt: Date.now()
  });

  return photoURL;
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

// Отримати всіх користувачів (для адмінки)
export const fetchAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const snapshot = await get(ref(database, 'users'));
    if (!snapshot.exists()) return [];
    const data = snapshot.val() as Record<string, UserProfile>;
    return Object.values(data).sort((a, b) => b.createdAt - a.createdAt);
  } catch (e) {
    console.error('Помилка отримання всіх користувачів:', e);
    return [];
  }
};

// Оновити профіль користувача адміном
export const updateUserProfileAdmin = async (
  uid: string,
  updates: Partial<UserProfile>
): Promise<boolean> => {
  try {
    const userRef = ref(database, `users/${uid}`);
    await update(userRef, {
      ...updates,
      updatedAt: Date.now(),
    });
    return true;
  } catch (e) {
    console.error('Помилка оновлення профілю користувача адміном:', e);
    return false;
  }
};

export const fetchUserOrders = async (uid: string): Promise<Order[]> => {
  try {
    const ordersRef = ref(database, 'orders');
    // Оптимізований запит: фільтруємо на сервері за userId
    const userOrdersQuery = query(ordersRef, orderByChild('userId'), equalTo(uid));
    const snapshot = await get(userOrdersQuery);

    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.entries(data)
        .map(([key, value]: [string, any]) => ({ id: key, ...value }))
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
        // Must use absolute URL — relative URLs don't work in server-side fetch
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        await fetch(`${siteUrl}/api/orders/notify`, {
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
  id: string;
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
  isAbroad?: boolean;   // чи є товар «із закордону» (доданий через конструктор боксів)
  boxItemId?: string;   // ID пов'язаного BoxItem (якщо товар синхронізовано з box_items)
  createdAt: number;
  updatedAt: number;
}

/**
 * Перетворення українського тексту в англійський slug (lowercase, translit)
 */
export function slugify(text: string): string {
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ye', 'ж': 'zh',
    'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'H', 'Ґ': 'G', 'Д': 'D', 'Е': 'E', 'Є': 'Ye', 'Ж': 'Zh',
    'З': 'Z', 'И': 'Y', 'І': 'I', 'Ї': 'Yi', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
    'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts',
    'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ь': '', 'Ю': 'Yu', 'Я': 'Ya'
  };

  const translit = text.split('').map(char => map[char] || char).join('');

  return translit
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
  const cardNumber = process.env.NEXT_PUBLIC_PAYMENT_CARD_NUMBER || '—';
  const cardName = process.env.NEXT_PUBLIC_PAYMENT_CARD_NAME || '—';
  const paymentLink = process.env.NEXT_PUBLIC_PAYMENT_LINK || '#';
  return {
    cardNumber,
    cardName,
    paymentLink,
    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentLink)}`,
  };
};

// Функція для генерації людського номеру замовлення (наприклад: NW4343)
// Перевіряє чи немає колізій у базі даних
export const generateOrderNumber = async (): Promise<string> => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let isUnique = false;
  let orderNumber = '';

  while (!isUnique) {
    const randomLetter1 = letters[Math.floor(Math.random() * letters.length)];
    const randomLetter2 = letters[Math.floor(Math.random() * letters.length)];
    const randomNumbers = Math.floor(1000 + Math.random() * 9000);
    orderNumber = `${randomLetter1}${randomLetter2}${randomNumbers}`;

    // Перевірка на унікальність
    const orderRef = ref(database, `orders/${orderNumber}`);
    const snapshot = await get(orderRef);
    if (!snapshot.exists()) {
      isUnique = true;
    }
  }

  return orderNumber;
};

// Функція для оновлення товару (ціна, назва, опис, кількість)
export const updateProduct = async (productId: string, updates: Partial<Product>) => {
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
export const decreaseProductQuantity = async (productId: string, quantityToDecrease: number) => {
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
export const fetchProductById = async (id: string): Promise<Product | null> => {
  try {
    const productsRef = ref(database, 'products');
    const snapshot = await get(productsRef);
    if (!snapshot.exists()) return null;
    const data = snapshot.val();
    if (Array.isArray(data)) {
      const products = data as Product[];
      return products.find((p) => String(p.id) === String(id)) || null;
    }
    const obj: Record<string, Product> = data as any;
    const key = Object.keys(obj).find((k) => String(obj[k]?.id) === String(id));
    return key ? (obj[key] as Product) : null;
  } catch (error) {
    console.error('Помилка отримання товару:', error);
    return null;
  }
};

// Функція для додавання нового товару
export const addProduct = async (newProduct: Omit<Product, 'id' | 'inStock' | 'createdAt' | 'updatedAt'>): Promise<Product | null> => {
  try {
    const productsRef = ref(database, 'products');
    const snapshot = await get(productsRef);

    // Генеруємо id на основі імені (slug)
    const slugId = slugify(newProduct.name);
    const now = Date.now();

    const buildProduct = (id: string): Product => ({
      ...newProduct,
      id,
      inStock: (newProduct.quantity || 0) > 0,
      createdAt: now,
      updatedAt: now,
    });

    if (snapshot.exists()) {
      const data = snapshot.val();
      let list: Product[];
      if (Array.isArray(data)) {
        list = data as Product[];
      } else {
        list = Object.values(data as Record<string, Product>) as Product[];
      }

      // Перевіряємо чи не існує вже такого slugId
      let finalId = slugId;
      let counter = 1;
      while (list.some(p => p.id === finalId)) {
        finalId = `${slugId}-${counter}`;
        counter++;
      }

      const productToAdd = buildProduct(finalId);
      await set(productsRef, [...list, productToAdd]);
      return productToAdd;
    } else {
      const productToAdd = buildProduct(slugId);
      await set(productsRef, [productToAdd]);
      return productToAdd;
    }
  } catch (error) {
    console.error('Помилка при додаванні товару:', error);
    return null;
  }
};

// Функція для видалення товару
export const deleteProduct = async (productId: string): Promise<boolean> => {
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

// =====================
// СКРІНШОТИ ВІДГУКІВ
// =====================

export const fetchAllScreenshotReviews = async (): Promise<ScreenshotReview[]> => {
  try {
    const reviewsRef = ref(database, 'screenshot_reviews');
    const snapshot = await get(reviewsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const list: ScreenshotReview[] = Object.values(data);
      return list.sort((a, b) => b.createdAt - a.createdAt);
    }
    return [];
  } catch (error) {
    console.error('Помилка отримання скріншотів відгуків:', error);
    return [];
  }
};

export const addScreenshotReview = async (imageUrl: string): Promise<string | null> => {
  try {
    const id = Date.now().toString();
    const reviewRef = ref(database, `screenshot_reviews/${id}`);
    const review: ScreenshotReview = {
      id,
      imageUrl,
      createdAt: Date.now(),
    };
    await set(reviewRef, review);
    return id;
  } catch (error) {
    console.error('Помилка додавання скріншоту відгуку:', error);
    return null;
  }
};

export const deleteScreenshotReview = async (id: string): Promise<boolean> => {
  try {
    const reviewRef = ref(database, `screenshot_reviews/${id}`);
    await set(reviewRef, null);
    return true;
  } catch (error) {
    console.error('Помилка видалення скріншоту відгуку:', error);
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
        `Продукт: <b>${order.items.map((i: any) => i.name).join(", ")}</b>\n` +
        `Кількість: <b>${order.items.reduce((sum: any, i: any) => sum + i.quantity, 0)}</b>\n` +
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
  isAdmin?: boolean;
  authorRank?: number;
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
  isAdmin?: boolean;
  authorRank?: number;
  createdAt: number;
  updatedAt: number;
  reactions: { [userId: string]: string };
  isEdited: boolean;
  replyToId?: string;
  replyToName?: string;
}

// Створити нову тему
export async function createForumThread(
  userId: string,
  userName: string,
  userPhoto: string | null,
  title: string,
  content: string,
  category: string,
  isAdmin?: boolean,
  authorRank?: number
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

  if (isAdmin !== undefined) thread.isAdmin = isAdmin;
  if (authorRank !== undefined) thread.authorRank = authorRank;

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

// Підписатися на всі теми (realtime)
export function subscribeToForumThreads(callback: (threads: ForumThread[]) => void): () => void {
  const threadsRef = ref(database, 'forum/threads');

  const unsubscribe = onValue(threadsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

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

    callback(threads);
  });

  return unsubscribe;
}


// Отримати тему за ID
export async function getForumThread(threadId: string): Promise<ForumThread | null> {
  const threadRef = ref(database, `forum/threads/${threadId}`);
  const snapshot = await get(threadRef);

  if (!snapshot.exists()) return null;
  return snapshot.val() as ForumThread;
}

// Підписатися на тему за ID (realtime)
export function subscribeToForumThread(threadId: string, callback: (thread: ForumThread | null) => void): () => void {
  const threadRef = ref(database, `forum/threads/${threadId}`);

  const unsubscribe = onValue(threadRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback(snapshot.val() as ForumThread);
  });

  return unsubscribe;
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
  content: string,
  isAdmin?: boolean,
  authorRank?: number,
  replyToId?: string,
  replyToName?: string
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

  if (isAdmin !== undefined) comment.isAdmin = isAdmin;
  if (authorRank !== undefined) comment.authorRank = authorRank;
  if (replyToId !== undefined) comment.replyToId = replyToId;
  if (replyToName !== undefined) comment.replyToName = replyToName;

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

// Підписатися на коментарі теми (realtime)
export function subscribeToForumComments(threadId: string, callback: (comments: ForumComment[]) => void): () => void {
  const commentsRef = ref(database, `forum/comments/${threadId}`);

  const unsubscribe = onValue(commentsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const comments: ForumComment[] = [];
    snapshot.forEach((child) => {
      comments.push(child.val() as ForumComment);
    });

    // Сортуємо за часом створення (старіші першими)
    comments.sort((a, b) => a.createdAt - b.createdAt);

    callback(comments);
  });

  return unsubscribe;
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

// =====================
// БОКСИ (BOX TYPES & BOX ITEMS)
// =====================

/**
 * Тип боксу (S/M/L або будь-який інший розмір, що визначає адмін)
 */
export interface BoxType {
  id: string;           // унікальний ключ (timestamp-based)
  name: string;         // назва, наприклад "S", "M", "L" або "Маленький"
  description: string;  // опис боксу
  capacity: number;     // максимальна кількість товарів
  basePrice: number;    // базова ціна боксу (без вартості товарів)
  image: string;        // URL зображення (Firebase Storage)
  isActive: boolean;    // чи показувати клієнтам
  sortOrder: number;    // порядок відображення
  createdAt: number;
  updatedAt: number;
}

/**
 * Товар для конструктора боксів (окремо від каталогу)
 */
export interface BoxItem {
  id: string;           // унікальний ключ
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;        // головне фото (URL)
  images: string[];     // галерея фото
  isActive: boolean;    // чи показувати клієнтам
  catalogProductId?: string; // ID пов'язаного Product у каталозі (якщо доданий до каталогу)
  createdAt: number;
  updatedAt: number;
}

// ---------- BoxType CRUD ----------

/**
 * Слухати зміни типів боксів у реальному часі
 */
export function listenToBoxTypes(callback: (types: BoxType[]) => void): () => void {
  const boxTypesRef = ref(database, 'box_types');
  const unsubscribe = onValue(boxTypesRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const types: BoxType[] = Object.values(data) as BoxType[];
    types.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    callback(types);
  });
  return unsubscribe;
}

/**
 * Отримати всі типи боксів (одноразово)
 */
export async function fetchAllBoxTypes(): Promise<BoxType[]> {
  try {
    const snapshot = await get(ref(database, 'box_types'));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    const types: BoxType[] = Object.values(data) as BoxType[];
    return types.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  } catch (e) {
    console.error('Помилка отримання типів боксів:', e);
    return [];
  }
}

/**
 * Створити новий тип боксу
 */
export async function createBoxType(
  data: Omit<BoxType, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> {
  try {
    const id = Date.now().toString();
    const boxTypeRef = ref(database, `box_types/${id}`);
    const now = Date.now();
    await set(boxTypeRef, {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  } catch (e) {
    console.error('Помилка створення типу боксу:', e);
    return null;
  }
}

/**
 * Оновити тип боксу
 */
export async function updateBoxType(
  id: string,
  updates: Partial<Omit<BoxType, 'id' | 'createdAt'>>
): Promise<boolean> {
  try {
    const boxTypeRef = ref(database, `box_types/${id}`);
    await update(boxTypeRef, { ...updates, updatedAt: Date.now() });
    return true;
  } catch (e) {
    console.error('Помилка оновлення типу боксу:', e);
    return false;
  }
}

/**
 * Видалити тип боксу
 */
export async function deleteBoxType(id: string): Promise<boolean> {
  try {
    await set(ref(database, `box_types/${id}`), null);
    return true;
  } catch (e) {
    console.error('Помилка видалення типу боксу:', e);
    return false;
  }
}

// ---------- BoxItem CRUD ----------

/**
 * Учищає обʼєкт від undefined полів (Сховище Firebase відкидає undefined при set())
 */
function cleanForFirebase<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

/**
 * Слухати зміни товарів боксів у реальному часі
 */
export function listenToBoxItems(callback: (items: BoxItem[]) => void): () => void {
  const boxItemsRef = ref(database, 'box_items');
  const unsubscribe = onValue(boxItemsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const items: BoxItem[] = Object.values(data) as BoxItem[];
    items.sort((a, b) => b.createdAt - a.createdAt);
    callback(items);
  });
  return unsubscribe;
}

/**
 * Отримати всі товари для боксів (одноразово)
 */
export async function fetchAllBoxItems(): Promise<BoxItem[]> {
  try {
    const snapshot = await get(ref(database, 'box_items'));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    const items: BoxItem[] = Object.values(data) as BoxItem[];
    return items.sort((a, b) => b.createdAt - a.createdAt);
  } catch (e) {
    console.error('Помилка отримання товарів боксів:', e);
    return [];
  }
}

/**
 * Створити новий товар для боксів
 */
export async function createBoxItem(
  data: Omit<BoxItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> {
  try {
    const id = Date.now().toString();
    const boxItemRef = ref(database, `box_items/${id}`);
    const now = Date.now();
    await set(boxItemRef, cleanForFirebase({
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    }));
    return id;
  } catch (e) {
    console.error('Помилка створення товару для боксу:', e);
    return null;
  }
}

/**
 * Оновити товар для боксів
 */
export async function updateBoxItem(
  id: string,
  updates: Partial<Omit<BoxItem, 'id' | 'createdAt'>>
): Promise<boolean> {
  try {
    const boxItemRef = ref(database, `box_items/${id}`);
    await update(boxItemRef, cleanForFirebase({ ...updates, updatedAt: Date.now() }));
    return true;
  } catch (e) {
    console.error('Помилка оновлення товару боксу:', e);
    return false;
  }
}

/**
 * Видалити товар для боксів (та його фото зі Storage)
 */
export async function deleteBoxItem(id: string): Promise<boolean> {
  try {
    // Отримуємо товар перед видаленням щоб видалити фото
    const snapshot = await get(ref(database, `box_items/${id}`));
    if (snapshot.exists()) {
      const item = snapshot.val() as BoxItem;
      const allImages = [item.image, ...(item.images || [])].filter(Boolean);
      for (const url of allImages) {
        if (url && url.includes('firebasestorage.googleapis.com')) {
          try {
            const imgRef = storageRef(storage, url);
            await deleteObject(imgRef);
          } catch (err) {
            console.warn('Не вдалося видалити фото:', err);
          }
        }
      }
    }
    await set(ref(database, `box_items/${id}`), null);
    return true;
  } catch (e) {
    console.error('Помилка видалення товару боксу:', e);
    return false;
  }
}

// =====================
// СИНХРОНІЗАЦІЯ BoxItem → КАТАЛОГ (іграшки із закордону)
// =====================

/**
 * Синхронізує BoxItem з каталогом товарів.
 * Якщо catalogProductId відсутній — створює новий Product з isAbroad:true.
 * Якщо catalogProductId є — оновлює існуючий Product.
 * Повертає catalogProductId (id товару в каталозі) або null при помилці.
 */
export async function syncBoxItemToCatalog(
  boxItem: BoxItem
): Promise<string | null> {
  try {
    const now = Date.now();
    // Поля, які синхронізуються із BoxItem → Product
    // Збираємо всі фото: головне фото + галерея (без дублів)
    const allImages = [boxItem.image, ...(boxItem.images || [])]
      .filter((url): url is string => !!url && url.startsWith('http'));

    const productData = {
      name: boxItem.name,
      category: boxItem.category,
      price: String(boxItem.price),
      // Якщо є фото → emoji-заглушка (фото покажуться через images[])
      // Якщо фото немає → глобус
      image: allImages.length === 0 ? '🌍' : allImages[0],
      description: boxItem.description,
      images: allImages,
      isAbroad: true,
      boxItemId: boxItem.id,
      deliveryPrice: '200',
      deliveryDays: '14-21',
      discount: 0,
    };

    if (boxItem.catalogProductId) {
      // Оновлення існуючого товару в каталозі
      const ok = await updateProduct(boxItem.catalogProductId, {
        ...productData,
        updatedAt: now,
      });
      if (ok) return boxItem.catalogProductId;
      return null;
    } else {
      // Створення нового товару в каталозі
      const productsRef = ref(database, 'products');
      const snapshot = await get(productsRef);
      const slugBase = slugify(boxItem.name) || `abroad-${boxItem.id}`;
      const now2 = Date.now();

      const newProduct: Product = {
        id: '', // буде встановлено нижче
        ...productData,
        inStock: boxItem.isActive,
        quantity: 999, // Для «із закордону» — необмежена кількість
        createdAt: now2,
        updatedAt: now2,
      };

      if (snapshot.exists()) {
        const data = snapshot.val();
        let list: Product[];
        if (Array.isArray(data)) {
          list = data as Product[];
        } else {
          list = Object.values(data as Record<string, Product>) as Product[];
        }
        // Унікальний ID
        let finalId = slugBase;
        let counter = 1;
        while (list.some((p) => p.id === finalId)) {
          finalId = `${slugBase}-${counter}`;
          counter++;
        }
        newProduct.id = finalId;
        await set(productsRef, [...list, newProduct]);
        return finalId;
      } else {
        newProduct.id = slugBase;
        await set(productsRef, [newProduct]);
        return slugBase;
      }
    }
  } catch (e) {
    console.error('Помилка синхронізації BoxItem → каталог:', e);
    return null;
  }
}

/**
 * Видаляє пов'язаний товар із каталогу (коли знімається галочка «Додати до каталогу»).
 */
export async function removeBoxItemFromCatalog(
  catalogProductId: string
): Promise<boolean> {
  return deleteProduct(catalogProductId);
}