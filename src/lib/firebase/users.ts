import { ref, get, update } from 'firebase/database';
import { User } from 'firebase/auth';
import { database } from './config';
import { UserProfile } from './types';
import { uploadProductImage } from './storage';

/**
 * Отримати профіль користувача
 */
export const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? (snapshot.val() as UserProfile) : null;
  } catch (error) {
    console.error('Помилка отримання профілю:', error);
    return null;
  }
};

/**
 * Отримати кількість зареєстрованих користувачів
 */
export const fetchUsersCount = async (): Promise<number> => {
  try {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
      return Object.keys(snapshot.val()).length;
    }
    return 0;
  } catch (error) {
    console.error('Помилка отримання кількості користувачів:', error);
    return 0;
  }
};

/**
 * Отримати всіх користувачів (для адміна)
 */
export const fetchAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
      return Object.values(snapshot.val()) as UserProfile[];
    }
    return [];
  } catch (error) {
    console.error('Помилка отримання всіх користувачів:', error);
    return [];
  }
};

/**
 * Оновити профіль користувача адміном
 */
export const updateUserProfileAdmin = async (uid: string, updates: Partial<UserProfile>): Promise<boolean> => {
  try {
    const userRef = ref(database, `users/${uid}`);
    
    // Фільтруємо undefined значення
    const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    await update(userRef, {
      ...cleanUpdates,
      updatedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('Помилка оновлення профілю адміном:', error);
    return false;
  }
};
/**
 * Оновити статистику користувача після замовлення
 */
export const updateUserStatsAfterOrder = async (uid: string, amount: number, redeemedPoints: number = 0): Promise<boolean> => {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) return false;

    const profile = snapshot.val() as UserProfile;
    const totalOrders = (profile.totalOrders || 0) + 1;
    const totalSpent = (profile.totalSpent || 0) + amount;

    // Розрахунок нових балів (наприклад, 1 бал за кожні 100 грн)
    const pointsEarned = Math.floor(amount / 100);
    const newPoints = Math.max(0, (profile.points || 0) - redeemedPoints + pointsEarned);

    // Розрахунок рейтингу та знижки (спрощено)
    let rating = 0;
    let discountPercent = 0;

    if (totalOrders >= 50) { rating = 5; discountPercent = 10; }
    else if (totalOrders >= 20) { rating = 4; discountPercent = 7; }
    else if (totalOrders >= 10) { rating = 3; discountPercent = 5; }
    else if (totalOrders >= 5) { rating = 2; discountPercent = 2; }
    else if (totalOrders >= 1) { rating = 1; discountPercent = 0; }

    await update(userRef, {
      totalOrders,
      totalSpent,
      points: newPoints,
      rating,
      discountPercent,
      updatedAt: Date.now(),
    });

    return true;
  } catch (error) {
    console.error('Помилка оновлення статистики користувача:', error);
    return false;
  }
};

/**
 * Отримати топ покупців
 */
export const fetchTopBuyers = async (limit: number = 10): Promise<UserProfile[]> => {
  try {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) return [];

    const users = Object.values(snapshot.val()) as UserProfile[];
    return users
      .filter(u => u.totalSpent && u.totalSpent > 0)
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, limit);
  } catch (error) {
    console.error('Помилка отримання топ покупців:', error);
    return [];
  }
};

/**
 * Оновити ім'я користувача
 */
export const updateUserName = async (user: User | string, name: string): Promise<boolean> => {
  try {
    const uid = typeof user === 'string' ? user : user.uid;
    const userRef = ref(database, `users/${uid}`);
    await update(userRef, {
      displayName: name.trim(),
      updatedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('Помилка оновлення імені:', error);
    return false;
  }
};

/**
 * Оновити фото користувача
 */
export const updateUserPhoto = async (user: User | string, file: File): Promise<boolean> => {
  try {
    const uid = typeof user === 'string' ? user : user.uid;
    const photoURL = await uploadProductImage(file, `avatars/${uid}`);
    
    const userRef = ref(database, `users/${uid}`);
    await update(userRef, {
      photoURL,
      updatedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('Помилка оновлення фото:', error);
    return false;
  }
};
