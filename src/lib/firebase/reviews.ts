import { ref, get, set, update, onValue } from 'firebase/database';
import { database } from './config';

export interface Review {
  id?: string;
  orderId: string;
  userName: string;
  displayName?: string;
  userPhoto?: string;
  rating: number;
  text: string;
  createdAt: number;
  adminReply?: string;
  adminReplyAt?: number;
}

export interface ScreenshotReview {
  id: string;
  imageUrl: string;
  createdAt: number;
  type?: 'image' | 'video';
  sortOrder?: number;
}

export function subscribeToRecentReviews(callback: (reviews: Review[]) => void): () => void {
  const reviewsRef = ref(database, 'reviews');
  return onValue(reviewsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const reviews: Review[] = Object.values(snapshot.val());
    reviews.sort((a, b) => b.createdAt - a.createdAt);
    callback(reviews.slice(0, 10));
  });
}

export const addReview = async (orderId: string, review: Omit<Review, 'createdAt'>): Promise<boolean> => {
  try {
    const reviewRef = ref(database, `reviews/${orderId}`);
    await set(reviewRef, { ...review, createdAt: Date.now() });
    return true;
  } catch (error) {
    console.error('Помилка додавання відгуку:', error);
    return false;
  }
};

export const deleteReview = async (orderId: string): Promise<boolean> => {
  try {
    await set(ref(database, `reviews/${orderId}`), null);
    return true;
  } catch (error) {
    console.error('Помилка видалення відгуку:', error);
    return false;
  }
};

export const fetchAllScreenshotReviews = async (): Promise<ScreenshotReview[]> => {
  try {
    const snapshot = await get(ref(database, 'screenshot_reviews'));
    if (!snapshot.exists()) return [];
    const reviews: ScreenshotReview[] = Object.values(snapshot.val());
    return reviews.sort((a, b) => {
      const orderA = a.sortOrder ?? a.createdAt;
      const orderB = b.sortOrder ?? b.createdAt;
      return orderB - orderA;
    });
  } catch (error) {
    console.error('Помилка отримання скріншотів відгуків:', error);
    return [];
  }
};

export const addScreenshotReview = async (imageUrl: string, type: 'image' | 'video' = 'image'): Promise<string | null> => {
  try {
    const id = Date.now().toString();
    const reviewRef = ref(database, `screenshot_reviews/${id}`);
    await set(reviewRef, { id, imageUrl, type, createdAt: Date.now(), sortOrder: Date.now() });
    return id;
  } catch (error) {
    console.error('Помилка додавання скріншоту відгуку:', error);
    return null;
  }
};

export const deleteScreenshotReview = async (id: string): Promise<boolean> => {
  try {
    await set(ref(database, `screenshot_reviews/${id}`), null);
    return true;
  } catch (error) {
    console.error('Помилка видалення скріншоту відгуку:', error);
    return false;
  }
};

export const updateScreenshotReviewOrders = async (updates: {id: string, sortOrder: number}[]): Promise<boolean> => {
  try {
    const promises = updates.map(updateData => 
      set(ref(database, `screenshot_reviews/${updateData.id}/sortOrder`), updateData.sortOrder)
    );
    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('Помилка оновлення порядку скріншотів:', error);
    return false;
  }
};

export const addAdminReply = async (orderId: string, replyText: string): Promise<boolean> => {
  try {
    if (!replyText.trim()) throw new Error('Текст відповіді не може бути порожнім');
    const reviewRef = ref(database, `reviews/${orderId}`);
    const snapshot = await get(reviewRef);
    if (!snapshot.exists()) throw new Error('Відгук не знайдено');
    await update(reviewRef, { adminReply: replyText.trim(), adminReplyAt: Date.now() });
    return true;
  } catch (error) {
    console.error('Помилка додавання відповіді адміна:', error);
    return false;
  }
};
export const fetchAllReviews = async (): Promise<Review[]> => {
  try {
    const snapshot = await get(ref(database, 'reviews'));
    if (!snapshot.exists()) return [];
    const reviews: Review[] = Object.values(snapshot.val());
    return reviews.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Помилка отримання відгуків:', error);
    return [];
  }
};

export const fetchRecentReviews = async (limit: number = 10): Promise<Review[]> => {
  try {
    const snapshot = await get(ref(database, 'reviews'));
    if (!snapshot.exists()) return [];
    const reviews: Review[] = Object.values(snapshot.val());
    reviews.sort((a, b) => b.createdAt - a.createdAt);
    return reviews.slice(0, limit);
  } catch (error) {
    console.error('Помилка отримання останніх відгуків:', error);
    return [];
  }
};

export const hasReviewForOrder = async (orderId: string): Promise<boolean> => {
  try {
    const reviewRef = ref(database, `reviews/${orderId}`);
    const snapshot = await get(reviewRef);
    return snapshot.exists();
  } catch (error) {
    console.error('Помилка перевірки наявності відгуку:', error);
    return false;
  }
};

export const createReview = addReview;
