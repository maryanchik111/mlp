import { initializeApp } from 'firebase/app';
import { getDatabase, ref, query, orderByChild, limitToLast, onValue, update, get, set } from 'firebase/database';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';

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
const googleProvider = new GoogleAuthProvider();

// =====================
// АДМІНІСТРАТОРИ
// =====================
// Додайте email адміністраторів сюди
const ADMIN_EMAILS = [
  // Замініть на реальні email адміністраторів
  'seniorpandawork@gmail.com',
  'maryanlikesyou@gmail.com',
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
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
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
  orderFinalPrice: number,
  redeemedPoints: number = 0
) => {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) return;
    const data = snapshot.val() as UserProfile;
    // Спочатку списуємо бали (не даємо піти в мінус)
    const newPointsBase = Math.max(0, (data.points || 0) - Math.max(0, redeemedPoints));
    // Додаємо бали за покупку
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
  discount?: number; // знижка на товар у %
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

// Функція для створення нового товару
export const createProduct = async (product: Omit<Product, 'id'>) => {
  try {
    const productsRef = ref(database, 'products');
    const snapshot = await get(productsRef);
    
    let newId = 1;
    if (snapshot.exists()) {
      const products = snapshot.val() as Product[];
      // Знаходимо максимальний ID
      newId = Math.max(...products.map(p => p.id || 0)) + 1;
    }
    
    const newProduct = {
      ...product,
      id: newId,
      createdAt: Date.now(),
    };
    
    // Додаємо в кінець масиву
    const newProductRef = ref(database, `products/${newId - 1}`);
    await set(newProductRef, newProduct);
    return true;
  } catch (error) {
    console.error('Помилка при створенні товару:', error);
    return false;
  }
};

// Функція для видалення товару
export const deleteProduct = async (productId: number) => {
  try {
    const productsRef = ref(database, 'products');
    const snapshot = await get(productsRef);
    
    if (!snapshot.exists()) return false;
    
    const products = snapshot.val() as Product[];
    // Видаляємо товар з масиву
    const updatedProducts = products.filter(p => p && p.id !== productId);
    
    // Перезаписуємо весь масив
    await set(productsRef, updatedProducts);
    return true;
  } catch (error) {
    console.error('Помилка при видаленні товару:', error);
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

<<<<<<< Updated upstream
=======
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

    if (Array.isArray(data)) {
      const products = data as Product[];
      const updated = products.filter((p) => p.id !== productId);
      if (updated.length === products.length) return false;
      await set(productsRef, updated);
      return true;
    }

    const obj: Record<string, Product> = data as any;
    const key = Object.keys(obj).find((k) => obj[k]?.id === productId);
    if (!key) return false;
    // Видаляємо ключ і переписуємо як масив для уніфікації
    delete obj[key];
    const list: Product[] = Object.values(obj);
    await set(productsRef, list);
    return true;
  } catch (error) {
    console.error('Помилка при видаленні товару:', error);
    return false;
  }
};

>>>>>>> Stashed changes
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
